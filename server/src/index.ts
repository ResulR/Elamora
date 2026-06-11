import crypto from "node:crypto";
import fs from "node:fs/promises";
import path from "node:path";
import express, { type Request, type Response } from "express";
import helmet from "helmet";
import cors from "cors";
import cookieParser from "cookie-parser";
import rateLimit from "express-rate-limit";
import multer from "multer";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { z } from "zod";
import { config } from "./config.js";
import { checkDatabase, pool } from "./db.js";
import { sendAdminNewOrderEmail, sendOrderPaidEmail, sendOrderStatusNotificationEmail } from "./email.js";
import { logAdminAction } from "./admin-audit.js";
import { logger, logError } from "./logger.js";
import { requireAdmin, type AdminRequest } from "./middleware/require-admin.js";

const app = express();

const productUploadDir = path.resolve(process.cwd(), "server/public/uploads/products");
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 5 * 1024 * 1024,
  },
  fileFilter: (_req, file, callback) => {
    if (!["image/jpeg", "image/png", "image/webp"].includes(file.mimetype)) {
      callback(new Error("Only JPEG, PNG and WebP images are allowed"));
      return;
    }

    callback(null, true);
  },
});

app.set("trust proxy", 1);

app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'", "https://js.stripe.com"],
        frameSrc: ["'self'", "https://js.stripe.com", "https://hooks.stripe.com"],
        connectSrc: ["'self'", "https://api.stripe.com"],
        imgSrc: ["'self'", "data:", "https:"],
      },
    },
  })
);
app.use(
  cors({
    origin(origin, callback) {
      if (!origin || origin === config.corsOrigin) {
        return callback(null, true);
      }

      return callback(null, false);
    },
    credentials: true,
  })
);
app.use(express.json({ limit: "100kb" }));
app.use(cookieParser());
app.use("/api/uploads", express.static(path.resolve(process.cwd(), "server/public/uploads")));

const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 10,
  standardHeaders: true,
  legacyHeaders: false,
});

const publicOrderLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 20,
  standardHeaders: true,
  legacyHeaders: false,
});

const ADMIN_SESSION_MAX_AGE_SECONDS = 8 * 60 * 60;
const ADMIN_COOKIE_MAX_AGE_MS = ADMIN_SESSION_MAX_AGE_SECONDS * 1000;

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

const orderStatusSchema = z.enum([
  "pending_bank_transfer",
  "confirmed",
  "preparing",
  "ready_for_pickup",
  "shipped",
  "completed",
  "cancelled",
  "refunded",
]);

const createOrderSchema = z.object({
  customer: z.object({
    firstName: z.string().trim().min(1).max(120),
    lastName: z.string().trim().max(120).optional().default(""),
    email: z.string().trim().email().max(255),
    phone: z.string().trim().max(80).optional().default(""),
    address: z.string().trim().max(500).optional().default(""),
    addressLine1: z.string().trim().max(255).optional().default(""),
    addressLine2: z.string().trim().max(255).optional().default(""),
    postalCode: z.string().trim().max(20).optional().default(""),
    city: z.string().trim().max(120).optional().default(""),
    country: z.string().trim().min(2).max(2).optional().default("BE").transform((value) => value.toUpperCase()),
    deliveryDate: z.string().trim().max(20).optional().default(""),
    deliveryTimeSlot: z.string().trim().max(80).optional().default(""),
    deliveryInstructions: z.string().trim().max(1000).optional().default(""),
    recipientPhone: z.string().trim().max(80).optional().default(""),
    deliveryMethod: z.enum(["pickup", "delivery"]).optional().default("pickup"),
  }),
  customName: z.string().trim().max(120).optional().default(""),
  customMessage: z.string().trim().max(1000).optional().default(""),
  termsAccepted: z.literal(true),
  items: z
    .array(
      z.object({
        productId: z.string().uuid(),
        quantity: z.number().int().min(1).max(99).default(1),
        colorId: z.string().uuid().nullable().optional().default(null),
      })
    )
    .min(1)
    .max(50),
});

const updateOrderStatusSchema = z.object({
  status: orderStatusSchema,
  trackingNumber: z.string().trim().max(120).optional(),
  trackingCarrier: z.string().trim().max(120).optional(),
});

const updateOrderPaymentStatusSchema = z.object({
  paymentStatus: z.enum(["pending", "paid", "cancelled", "refunded"]),
});

const productPayloadSchema = z.object({
  categoryCode: z.enum(["bucket", "flower", "balloon", "plush"]),
  name: z.string().trim().min(1).max(160),
  description: z.string().trim().max(1000).optional().default(""),
  priceCents: z.number().int().min(0).max(999999),
  imageUrl: z.string().trim().max(500).optional().default(""),
  sortOrder: z.number().int().min(0).max(9999).optional().default(0),
  isActive: z.boolean().optional().default(true),
});

const updateProductPayloadSchema = productPayloadSchema.partial().extend({
  categoryCode: z.enum(["bucket", "flower", "balloon", "plush"]).optional(),
});

const updateProductActiveSchema = z.object({
  isActive: z.boolean(),
});


function createConfirmationToken() {
  return crypto.randomBytes(32).toString("hex");
}

function hashConfirmationToken(token: string) {
  return crypto.createHash("sha256").update(token).digest("hex");
}

app.get("/api/bank-transfer-info", async (_req: Request, res: Response) => {
  return res.json({
    ok: true,
    bankTransfer: config.bankTransfer,
  });
});


app.get("/api/health", async (_req: Request, res: Response) => {
  try {
    const dbOk = await checkDatabase();

    return res.json({
      ok: true,
      db: dbOk ? "ok" : "error",
      timestamp: new Date().toISOString(),
    });
  } catch {
    return res.status(500).json({
      ok: false,
      db: "error",
      timestamp: new Date().toISOString(),
    });
  }
});


app.get("/api/catalog", async (_req: Request, res: Response) => {
  try {
    const [categoriesResult, productsResult, colorsResult] = await Promise.all([
      pool.query(
        `
          SELECT id, code, name, sort_order, is_active
          FROM product_categories
          WHERE is_active = true
          ORDER BY sort_order ASC, name ASC
        `
      ),
      pool.query(
        `
          SELECT
            p.id,
            c.code AS category_code,
            c.name AS category_name,
            p.name,
            p.description,
            p.price_cents,
            p.image_url,
            p.sort_order,
            p.is_active
          FROM products p
          JOIN product_categories c ON c.id = p.category_id
          WHERE p.is_active = true
            AND c.is_active = true
          ORDER BY c.sort_order ASC, p.sort_order ASC, p.name ASC
        `
      ),
      pool.query(
        `
          SELECT id, name, hex_code, sort_order, is_active
          FROM product_colors
          WHERE is_active = true
          ORDER BY sort_order ASC, name ASC
        `
      ),
    ]);

    return res.json({
      ok: true,
      categories: categoriesResult.rows.map(mapProductCategoryRow),
      products: productsResult.rows.map(mapProductRow),
      colors: colorsResult.rows.map(mapProductColorRow),
    });
  } catch (error) {
    logError(error, "request_failed");

    return res.status(500).json({
      ok: false,
      error: "Could not load catalog",
    });
  }
});


const shippingQuoteSchema = z.object({
  postalCode: z.string().trim().min(2).max(20),
  country: z.string().trim().min(2).max(2).transform((value) => value.toUpperCase()),
});

app.get("/api/shipping/quote", publicOrderLimiter, async (req: Request, res: Response) => {
  const parsed = shippingQuoteSchema.safeParse(req.query);

  if (!parsed.success) {
    return res.status(400).json({
      ok: false,
      error: "Invalid shipping quote parameters",
      details: parsed.error.flatten().fieldErrors,
    });
  }

  const { postalCode, country } = parsed.data;

  try {
    const result = await pool.query(
      `
        SELECT
          name,
          price_cents,
          lead_time_days
        FROM delivery_zones
        WHERE is_active = true
          AND country_code = $1
          AND $2 ~ postal_pattern
        ORDER BY price_cents ASC, lead_time_days ASC, name ASC
        LIMIT 1
      `,
      [country, postalCode]
    );

    const zone = result.rows[0];

    if (!zone) {
      return res.json({
        ok: true,
        available: false,
        shipping_cents: 0,
        lead_time_days: null,
        zone_name: null,
      });
    }

    return res.json({
      ok: true,
      available: true,
      shipping_cents: zone.price_cents,
      lead_time_days: zone.lead_time_days,
      zone_name: zone.name,
    });
  } catch (error) {
    logError(error, "request_failed");

    return res.status(500).json({
      ok: false,
      error: "Could not calculate shipping quote",
    });
  }
});



const shippingAvailabilitySchema = z.object({
  date: z.string().trim().regex(/^\d{4}-\d{2}-\d{2}$/),
  country: z.string().trim().min(2).max(2).optional().default("BE").transform((value) => value.toUpperCase()),
});

app.get("/api/shipping/availability", publicOrderLimiter, async (req: Request, res: Response) => {
  const parsed = shippingAvailabilitySchema.safeParse(req.query);

  if (!parsed.success) {
    return res.status(400).json({
      ok: false,
      error: "Invalid shipping availability parameters",
      details: parsed.error.flatten().fieldErrors,
    });
  }

  const { date, country } = parsed.data;

  try {
    const availability = await getDeliveryAvailability(date, country);

    return res.json({
      ok: true,
      available: availability.available,
      reason: availability.reason,
      slots: availability.slots,
    });
  } catch (error) {
    logError(error, "request_failed");

    return res.status(500).json({
      ok: false,
      error: "Could not check shipping availability",
    });
  }
});


app.post("/api/orders", publicOrderLimiter, async (req: Request, res: Response) => {
  const parsed = createOrderSchema.safeParse(req.body);

  if (!parsed.success) {
    return res.status(400).json({
      ok: false,
      error: "Invalid order payload",
      details: parsed.error.flatten().fieldErrors,
    });
  }

  const payload = parsed.data;

  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    const reference = await createOrderReference(client);
    const validatedItems = [];

    for (const item of payload.items) {
      let productId = item.productId;
      let productName = "";
      let unitPriceCents = 0;
      let colorId = item.colorId;
      let colorName = null;
      let colorHex = null;

      const productResult = await client.query(
        `
          SELECT id, name, price_cents
          FROM products
          WHERE id = $1
            AND is_active = true
          LIMIT 1
        `,
        [productId]
      );

      const product = productResult.rows[0];

      if (!product) {
        await client.query("ROLLBACK");
        return res.status(400).json({
          ok: false,
          error: "Invalid product",
        });
      }

      productId = product.id;
      productName = product.name;
      unitPriceCents = product.price_cents;

      if (colorId) {
        const colorResult = await client.query(
          `
            SELECT id, name, hex_code
            FROM product_colors
            WHERE id = $1
              AND is_active = true
            LIMIT 1
          `,
          [colorId]
        );

        const color = colorResult.rows[0];

        if (!color) {
          await client.query("ROLLBACK");
          return res.status(400).json({
            ok: false,
            error: "Invalid color",
          });
        }

        colorId = color.id;
        colorName = color.name;
        colorHex = color.hex_code;
      }

      validatedItems.push({
        productId,
        productName,
        unitPriceCents,
        quantity: item.quantity,
        colorId,
        colorName,
        colorHex,
      });
    }

    const subtotalCents = validatedItems.reduce(
      (sum, item) => sum + item.unitPriceCents * item.quantity,
      0
    );

    let shippingCents = 0;

    if (payload.customer.deliveryMethod === "delivery") {
      const postalCode = payload.customer.postalCode;
      const country = payload.customer.country;

      if (!postalCode || !country) {
        await client.query("ROLLBACK");
        return res.status(400).json({
          ok: false,
          error: "missing_shipping_address",
        });
      }

      const shippingResult = await client.query(
        `
          SELECT
            name,
            price_cents,
            lead_time_days
          FROM delivery_zones
          WHERE is_active = true
            AND country_code = $1
            AND $2 ~ postal_pattern
          ORDER BY price_cents ASC, lead_time_days ASC, name ASC
          LIMIT 1
        `,
        [country, postalCode]
      );

      const shippingZone = shippingResult.rows[0];

      if (!shippingZone) {
        await client.query("ROLLBACK");
        return res.status(400).json({
          ok: false,
          error: "zone_unavailable",
        });
      }

      shippingCents = shippingZone.price_cents;

      if (payload.customer.deliveryDate) {
        const availability = await getDeliveryAvailability(
          payload.customer.deliveryDate,
          country,
          client
        );

        if (!availability.available) {
          await client.query("ROLLBACK");
          return res.status(400).json({
            ok: false,
            error: "delivery_date_unavailable",
          });
        }

        if (payload.customer.deliveryTimeSlot) {
          const slotExists = availability.slots.some(
            (slot) => slot.value === payload.customer.deliveryTimeSlot
          );

          if (!slotExists) {
            await client.query("ROLLBACK");
            return res.status(400).json({
              ok: false,
              error: "delivery_slot_unavailable",
            });
          }
        }
      }
    }

    const taxCents = 0;
    const totalCents = subtotalCents + shippingCents + taxCents;
    const confirmationToken = createConfirmationToken();
    const confirmationTokenHash = hashConfirmationToken(confirmationToken);

    const orderResult = await client.query(
      `
        INSERT INTO orders (
          reference,
          status,
          customer_first_name,
          customer_last_name,
          customer_email,
          customer_phone,
          delivery_method,
          delivery_address,
          address_line1,
          address_line2,
          postal_code,
          city,
          country_code,
          delivery_date,
          delivery_time_slot,
          delivery_instructions,
          recipient_phone,
          custom_name,
          custom_message,
          subtotal_cents,
          shipping_cents,
          tax_cents,
          total_cents,
          confirmation_token_hash,
          cgv_accepted_at
        )
        VALUES ($1, 'pending_bank_transfer', $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, NULLIF($13, '')::date, $14, $15, $16, $17, $18, $19, $20, $21, $22, $23, now())
        RETURNING *
      `,
      [
        reference,
        payload.customer.firstName,
        payload.customer.lastName,
        payload.customer.email,
        payload.customer.phone,
        payload.customer.deliveryMethod,
        payload.customer.address,
        payload.customer.addressLine1 || payload.customer.address,
        payload.customer.addressLine2,
        payload.customer.postalCode,
        payload.customer.city,
        payload.customer.country,
        payload.customer.deliveryDate,
        payload.customer.deliveryTimeSlot,
        payload.customer.deliveryInstructions,
        payload.customer.recipientPhone || payload.customer.phone,
        payload.customName,
        payload.customMessage,
        subtotalCents,
        shippingCents,
        taxCents,
        totalCents,
        confirmationTokenHash,
      ]
    );

    const order = orderResult.rows[0];

    for (const item of validatedItems) {
      await client.query(
        `
          INSERT INTO order_items (
            order_id,
            product_id,
            product_name_snapshot,
            unit_price_cents,
            quantity,
            color_id,
            color_name_snapshot,
            color_hex_snapshot
          )
          VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
        `,
        [
          order.id,
          item.productId,
          item.productName,
          item.unitPriceCents,
          item.quantity,
          item.colorId,
          item.colorName,
          item.colorHex,
        ]
      );
    }

    await client.query("COMMIT");

    void sendAdminNewOrderEmailForOrder(order.id);

    return res.status(201).json({
      ok: true,
      order: {
        ...mapOrderRow(order),
        confirmationToken,
      },
    });
  } catch (error) {
    await client.query("ROLLBACK");
    logError(error, "request_failed");

    return res.status(500).json({
      ok: false,
      error: "Could not create order",
    });
  } finally {
    client.release();
  }
});


app.get("/api/orders/confirmation/:reference", async (req: Request, res: Response) => {
  const token = String(req.query.token ?? "").trim();

  if (!token) {
    return res.status(400).json({ ok: false, error: "Missing confirmation token" });
  }

  const orderResult = await pool.query(
    `
      SELECT *
      FROM orders
      WHERE reference = $1
        AND confirmation_token_hash = $2
      LIMIT 1
    `,
    [req.params.reference, hashConfirmationToken(token)]
  );

  const order = orderResult.rows[0];

  if (!order) {
    return res.status(404).json({ ok: false, error: "Order not found" });
  }

  const itemsResult = await pool.query(
    `
      SELECT *
      FROM order_items
      WHERE order_id = $1
      ORDER BY created_at ASC
    `,
    [order.id]
  );

  return res.json({
    ok: true,
    order: {
      id: order.id,
      reference: order.reference,
      status: order.status,
      customName: order.custom_name ?? "",
      customMessage: order.custom_message ?? "",
      subtotalCents: order.subtotal_cents ?? order.total_cents,
      shippingCents: order.shipping_cents ?? 0,
      taxCents: order.tax_cents ?? 0,
      totalCents: order.total_cents,
      paymentStatus: order.payment_status ?? "pending",
      paymentProvider: order.payment_provider ?? "bank_transfer",
      paymentReference: order.payment_reference ?? order.reference,
      paidAt: order.paid_at ?? null,
      createdAt: order.created_at,
      updatedAt: order.updated_at,
      customer: {
        firstName: order.customer_first_name,
        lastName: order.customer_last_name ?? "",
        deliveryMethod: order.delivery_method ?? "pickup",
        deliveryDate: order.delivery_date ?? "",
        deliveryTimeSlot: order.delivery_time_slot ?? "",
        city: order.city ?? "",
        country: order.country_code ?? "",
      },
      items: itemsResult.rows.map(mapOrderItemRow),
    },
  });
});

app.get("/api/orders/:reference", async (_req: Request, res: Response) => {
  return res.status(410).json({
    ok: false,
    error: "This public order endpoint has been replaced by the secure confirmation endpoint.",
  });
});
app.post("/api/admin/login", loginLimiter, async (req: Request, res: Response) => {
  const parsed = loginSchema.safeParse(req.body);

  if (!parsed.success) {
    return res.status(400).json({ ok: false, error: "Invalid credentials" });
  }

  const email = parsed.data.email.trim().toLowerCase();

  const result = await pool.query(
    "SELECT id, email, password_hash, role FROM admins WHERE lower(email) = lower($1) LIMIT 1",
    [email]
  );

  const admin = result.rows[0];

  if (!admin) {
    return res.status(401).json({ ok: false, error: "Invalid credentials" });
  }

  const passwordOk = await bcrypt.compare(parsed.data.password, admin.password_hash);

  if (!passwordOk) {
    return res.status(401).json({ ok: false, error: "Invalid credentials" });
  }

  const token = jwt.sign(
    {
      sub: admin.id,
      email: admin.email,
      role: admin.role,
    },
    config.jwtSecret,
    { expiresIn: ADMIN_SESSION_MAX_AGE_SECONDS }
  );

  res.cookie("elamora_admin_token", token, {
    httpOnly: true,
    secure: config.cookieSecure,
    sameSite: "strict",
    path: "/",
    maxAge: ADMIN_COOKIE_MAX_AGE_MS,
  });

  return res.json({
    ok: true,
    admin: {
      id: admin.id,
      email: admin.email,
      role: admin.role,
    },
  });
});

app.get("/api/admin/me", requireAdmin, async (req: AdminRequest, res: Response) => {
  return res.json({
    ok: true,
    admin: req.admin,
  });
});

app.post("/api/admin/logout", (_req: Request, res: Response) => {
  res.clearCookie("elamora_admin_token", {
    httpOnly: true,
    secure: config.cookieSecure,
    sameSite: "strict",
    path: "/",
  });

  return res.json({ ok: true });
});


app.get("/api/admin/catalog", requireAdmin, async (_req: AdminRequest, res: Response) => {
  try {
    const [categoriesResult, productsResult, colorsResult] = await Promise.all([
      pool.query(
        `
          SELECT id, code, name, sort_order, is_active
          FROM product_categories
          ORDER BY sort_order ASC, name ASC
        `
      ),
      pool.query(
        `
          SELECT
            p.id,
            c.code AS category_code,
            c.name AS category_name,
            p.name,
            p.description,
            p.price_cents,
            p.image_url,
            p.sort_order,
            p.is_active
          FROM products p
          JOIN product_categories c ON c.id = p.category_id
          ORDER BY c.sort_order ASC, p.sort_order ASC, p.name ASC
        `
      ),
      pool.query(
        `
          SELECT id, name, hex_code, sort_order, is_active
          FROM product_colors
          ORDER BY sort_order ASC, name ASC
        `
      ),
    ]);

    return res.json({
      ok: true,
      categories: categoriesResult.rows.map(mapProductCategoryRow),
      products: productsResult.rows.map(mapProductRow),
      colors: colorsResult.rows.map(mapProductColorRow),
    });
  } catch (error) {
    logError(error, "request_failed");

    return res.status(500).json({
      ok: false,
      error: "Could not load admin catalog",
    });
  }
});


app.post("/api/admin/products", requireAdmin, async (req: AdminRequest, res: Response) => {
  const parsed = productPayloadSchema.safeParse(req.body);

  if (!parsed.success) {
    return res.status(400).json({
      ok: false,
      error: parsed.error.issues[0]?.message ?? "Invalid product payload",
    });
  }

  const categoryResult = await pool.query(
    `
      SELECT id
      FROM product_categories
      WHERE code = $1
      LIMIT 1
    `,
    [parsed.data.categoryCode]
  );

  const category = categoryResult.rows[0];

  if (!category) {
    return res.status(400).json({ ok: false, error: "Unknown category" });
  }

  const result = await pool.query(
    `
      INSERT INTO products (
        category_id,
        name,
        description,
        price_cents,
        image_url,
        sort_order,
        is_active
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7)
      RETURNING *
    `,
    [
      category.id,
      parsed.data.name,
      parsed.data.description,
      parsed.data.priceCents,
      parsed.data.imageUrl,
      parsed.data.sortOrder,
      parsed.data.isActive,
    ]
  );

  const productResult = await pool.query(
    `
      SELECT
        p.id,
        c.code AS category_code,
        c.name AS category_name,
        p.name,
        p.description,
        p.price_cents,
        p.image_url,
        p.sort_order,
        p.is_active
      FROM products p
      JOIN product_categories c ON c.id = p.category_id
      WHERE p.id = $1
      LIMIT 1
    `,
    [result.rows[0].id]
  );

  const product = mapProductRow(productResult.rows[0]);

  await logAdminAction(req, {
    action: "product.create",
    targetType: "product",
    targetId: product.id,
    payload: {
      product,
    },
  });

  return res.status(201).json({
    ok: true,
    product,
  });
});

app.patch("/api/admin/products/:id", requireAdmin, async (req: AdminRequest, res: Response) => {
  const parsed = updateProductPayloadSchema.safeParse(req.body);

  if (!parsed.success) {
    return res.status(400).json({
      ok: false,
      error: parsed.error.issues[0]?.message ?? "Invalid product payload",
    });
  }

  let categoryId: string | null = null;

  if (parsed.data.categoryCode) {
    const categoryResult = await pool.query(
      `
        SELECT id
        FROM product_categories
        WHERE code = $1
        LIMIT 1
      `,
      [parsed.data.categoryCode]
    );

    const category = categoryResult.rows[0];

    if (!category) {
      return res.status(400).json({ ok: false, error: "Unknown category" });
    }

    categoryId = category.id;
  }

  const result = await pool.query(
    `
      UPDATE products
      SET category_id = COALESCE($2, category_id),
          name = COALESCE($3, name),
          description = COALESCE($4, description),
          price_cents = COALESCE($5, price_cents),
          image_url = COALESCE($6, image_url),
          sort_order = COALESCE($7, sort_order),
          is_active = COALESCE($8, is_active),
          updated_at = now()
      WHERE id = $1
      RETURNING id
    `,
    [
      req.params.id,
      categoryId,
      parsed.data.name ?? null,
      parsed.data.description ?? null,
      parsed.data.priceCents ?? null,
      parsed.data.imageUrl ?? null,
      parsed.data.sortOrder ?? null,
      parsed.data.isActive ?? null,
    ]
  );

  if (!result.rows[0]) {
    return res.status(404).json({ ok: false, error: "Product not found" });
  }

  const productResult = await pool.query(
    `
      SELECT
        p.id,
        c.code AS category_code,
        c.name AS category_name,
        p.name,
        p.description,
        p.price_cents,
        p.image_url,
        p.sort_order,
        p.is_active
      FROM products p
      JOIN product_categories c ON c.id = p.category_id
      WHERE p.id = $1
      LIMIT 1
    `,
    [req.params.id]
  );

  const product = mapProductRow(productResult.rows[0]);

  await logAdminAction(req, {
    action: "product.update",
    targetType: "product",
    targetId: product.id,
    payload: {
      changes: parsed.data,
      product,
    },
  });

  return res.json({
    ok: true,
    product,
  });
});

app.patch(
  "/api/admin/products/:id/active",
  requireAdmin,
  async (req: AdminRequest, res: Response) => {
    const parsed = updateProductActiveSchema.safeParse(req.body);

    if (!parsed.success) {
      return res.status(400).json({ ok: false, error: "Invalid active payload" });
    }

    const result = await pool.query(
      `
        UPDATE products
        SET is_active = $2,
            updated_at = now()
        WHERE id = $1
        RETURNING id
      `,
      [req.params.id, parsed.data.isActive]
    );

    if (!result.rows[0]) {
      return res.status(404).json({ ok: false, error: "Product not found" });
    }

    await logAdminAction(req, {
      action: "product.set_active",
      targetType: "product",
      targetId: String(req.params.id),
      payload: {
        isActive: parsed.data.isActive,
      },
    });

    return res.json({ ok: true });
  }
);

app.post(
  "/api/admin/products/:id/image",
  requireAdmin,
  upload.single("image"),
  async (req: AdminRequest, res: Response) => {
    if (!req.file) {
      return res.status(400).json({ ok: false, error: "Image file is required" });
    }

    const productResult = await pool.query(
      `
        SELECT id
        FROM products
        WHERE id = $1
        LIMIT 1
      `,
      [req.params.id]
    );

    if (!productResult.rows[0]) {
      return res.status(404).json({ ok: false, error: "Product not found" });
    }

    await fs.mkdir(productUploadDir, { recursive: true });

    const extensionByMime: Record<string, string> = {
      "image/jpeg": "jpg",
      "image/png": "png",
      "image/webp": "webp",
    };

    const extension = extensionByMime[req.file.mimetype];

    if (!extension) {
      return res.status(400).json({ ok: false, error: "Unsupported image type" });
    }

    const filename = `${req.params.id}-${Date.now()}-${crypto.randomBytes(6).toString("hex")}.${extension}`;
    const filepath = path.join(productUploadDir, filename);

    await fs.writeFile(filepath, req.file.buffer);

    const imageUrl = `/api/uploads/products/${filename}`;

    const updatedResult = await pool.query(
      `
        UPDATE products
        SET image_url = $2,
            updated_at = now()
        WHERE id = $1
        RETURNING id
      `,
      [req.params.id, imageUrl]
    );

    if (!updatedResult.rows[0]) {
      return res.status(404).json({ ok: false, error: "Product not found" });
    }

    await logAdminAction(req, {
      action: "product.upload_image",
      targetType: "product",
      targetId: String(req.params.id),
      payload: {
        imageUrl,
        originalFilename: req.file.originalname,
        mimeType: req.file.mimetype,
        sizeBytes: req.file.size,
      },
    });

    return res.json({
      ok: true,
      imageUrl,
    });
  }
);




function normalizeAdminOrderFilters(query: Request["query"]) {
  const where: string[] = [];
  const values: unknown[] = [];

  const addValue = (value: unknown) => {
    values.push(value);
    return `$${values.length}`;
  };

  const status = typeof query.status === "string" ? query.status.trim() : "";
  const paymentStatus = typeof query.paymentStatus === "string" ? query.paymentStatus.trim() : "";
  const deliveryMethod = typeof query.deliveryMethod === "string" ? query.deliveryMethod.trim() : "";
  const q = typeof query.q === "string" ? query.q.trim() : "";
  const dateFrom = typeof query.dateFrom === "string" ? query.dateFrom.trim() : "";
  const dateTo = typeof query.dateTo === "string" ? query.dateTo.trim() : "";

  const allowedStatuses = new Set([
    "pending_bank_transfer",
    "confirmed",
    "preparing",
    "ready_for_pickup",
    "shipped",
    "completed",
    "cancelled",
    "refunded",
  ]);
  const allowedPaymentStatuses = new Set(["pending", "paid", "cancelled", "refunded"]);
  const allowedDeliveryMethods = new Set(["pickup", "delivery"]);

  if (status && status !== "all") {
    if (!allowedStatuses.has(status)) {
      return { ok: false as const, error: "Invalid status filter" };
    }

    where.push(`status = ${addValue(status)}`);
  }

  if (paymentStatus && paymentStatus !== "all") {
    if (!allowedPaymentStatuses.has(paymentStatus)) {
      return { ok: false as const, error: "Invalid payment status filter" };
    }

    where.push(`payment_status = ${addValue(paymentStatus)}`);
  }

  if (deliveryMethod && deliveryMethod !== "all") {
    if (!allowedDeliveryMethods.has(deliveryMethod)) {
      return { ok: false as const, error: "Invalid delivery method filter" };
    }

    where.push(`delivery_method = ${addValue(deliveryMethod)}`);
  }

  if (q) {
    const search = `%${q}%`;
    const refParam = addValue(search);
    const emailParam = addValue(search);
    where.push(`(reference ILIKE ${refParam} OR customer_email ILIKE ${emailParam})`);
  }

  if (dateFrom) {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(dateFrom)) {
      return { ok: false as const, error: "Invalid start date filter" };
    }

    where.push(`created_at >= ${addValue(dateFrom)}`);
  }

  if (dateTo) {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(dateTo)) {
      return { ok: false as const, error: "Invalid end date filter" };
    }

    where.push(`created_at < (${addValue(dateTo)}::date + interval '1 day')`);
  }

  return {
    ok: true as const,
    values,
    whereSql: where.length > 0 ? `WHERE ${where.join(" AND ")}` : "",
  };
}

function formatCsvAmount(cents: number | null | undefined) {
  return ((Number(cents ?? 0)) / 100).toFixed(2);
}

function formatCsvDate(value: Date | string | null | undefined) {
  if (!value) return "";
  return new Date(value).toISOString();
}

function escapeCsvValue(value: unknown, separator: "," | ";") {
  const text = String(value ?? "");
  const escaped = text.replaceAll('"', '""');

  if (
    escaped.includes('"') ||
    escaped.includes("\n") ||
    escaped.includes("\r") ||
    escaped.includes(separator)
  ) {
    return `"${escaped}"`;
  }

  return escaped;
}

function buildOrdersCsv(rows: any[], options: { excel: boolean }) {
  const separator = options.excel ? ";" : ",";

  const headers = [
    "reference",
    "created_at",
    "customer_name",
    "customer_email",
    "status",
    "payment_status",
    "payment_provider",
    "payment_reference",
    "delivery_method",
    "subtotal",
    "shipping",
    "tax",
    "total",
    "currency",
    "paid_at",
    "tracking_carrier",
    "tracking_number",
  ];

  const lines = rows.map((row) => {
    const customerName = [row.customer_first_name, row.customer_last_name]
      .filter(Boolean)
      .join(" ")
      .trim();

    const values = [
      row.reference,
      formatCsvDate(row.created_at),
      customerName,
      row.customer_email,
      row.status,
      row.payment_status,
      row.payment_provider,
      row.payment_reference || row.reference,
      row.delivery_method,
      formatCsvAmount(row.subtotal_cents),
      formatCsvAmount(row.shipping_cents),
      formatCsvAmount(row.tax_cents),
      formatCsvAmount(row.total_cents),
      "EUR",
      formatCsvDate(row.paid_at),
      row.tracking_carrier,
      row.tracking_number,
    ];

    return values.map((value) => escapeCsvValue(value, separator)).join(separator);
  });

  const body = [
    ...(options.excel ? ["sep=;"] : []),
    headers.map((value) => escapeCsvValue(value, separator)).join(separator),
    ...lines,
  ].join("\r\n");

  return options.excel ? `\ufeff${body}\r\n` : `${body}\r\n`;
}

function buildOrdersExportFilename(format: string) {
  const date = new Date().toISOString().slice(0, 10);
  return format === "excel"
    ? `elamora-orders-excel-${date}.csv`
    : `elamora-orders-${date}.csv`;
}


app.get("/api/admin/orders", requireAdmin, async (req: AdminRequest, res: Response) => {
  const where: string[] = [];
  const values: unknown[] = [];

  const addValue = (value: unknown) => {
    values.push(value);
    return `$${values.length}`;
  };

  const status = typeof req.query.status === "string" ? req.query.status.trim() : "";
  const paymentStatus = typeof req.query.paymentStatus === "string" ? req.query.paymentStatus.trim() : "";
  const deliveryMethod = typeof req.query.deliveryMethod === "string" ? req.query.deliveryMethod.trim() : "";
  const q = typeof req.query.q === "string" ? req.query.q.trim() : "";
  const dateFrom = typeof req.query.dateFrom === "string" ? req.query.dateFrom.trim() : "";
  const dateTo = typeof req.query.dateTo === "string" ? req.query.dateTo.trim() : "";

  const allowedStatuses = new Set([
    "pending_bank_transfer",
    "confirmed",
    "preparing",
    "ready_for_pickup",
    "shipped",
    "completed",
    "cancelled",
    "refunded",
  ]);
  const allowedPaymentStatuses = new Set(["pending", "paid", "cancelled", "refunded"]);
  const allowedDeliveryMethods = new Set(["pickup", "delivery"]);

  if (status && status !== "all") {
    if (!allowedStatuses.has(status)) {
      return res.status(400).json({ ok: false, error: "Invalid status filter" });
    }

    where.push(`status = ${addValue(status)}`);
  }

  if (paymentStatus && paymentStatus !== "all") {
    if (!allowedPaymentStatuses.has(paymentStatus)) {
      return res.status(400).json({ ok: false, error: "Invalid payment status filter" });
    }

    where.push(`payment_status = ${addValue(paymentStatus)}`);
  }

  if (deliveryMethod && deliveryMethod !== "all") {
    if (!allowedDeliveryMethods.has(deliveryMethod)) {
      return res.status(400).json({ ok: false, error: "Invalid delivery method filter" });
    }

    where.push(`delivery_method = ${addValue(deliveryMethod)}`);
  }

  if (q) {
    const search = `%${q}%`;
    const refParam = addValue(search);
    const emailParam = addValue(search);
    where.push(`(reference ILIKE ${refParam} OR customer_email ILIKE ${emailParam})`);
  }

  if (dateFrom) {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(dateFrom)) {
      return res.status(400).json({ ok: false, error: "Invalid start date filter" });
    }

    where.push(`created_at >= ${addValue(dateFrom)}`);
  }

  if (dateTo) {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(dateTo)) {
      return res.status(400).json({ ok: false, error: "Invalid end date filter" });
    }

    where.push(`created_at < (${addValue(dateTo)}::date + interval '1 day')`);
  }

  const requestedPage = Number.parseInt(String(req.query.page ?? "1"), 10);
  const requestedPageSize = Number.parseInt(String(req.query.pageSize ?? "20"), 10);

  const page = Number.isFinite(requestedPage) && requestedPage > 0 ? requestedPage : 1;
  const pageSize = Number.isFinite(requestedPageSize)
    ? Math.min(Math.max(requestedPageSize, 10), 100)
    : 20;
  const offset = (page - 1) * pageSize;

  const whereSql = where.length > 0 ? `WHERE ${where.join(" AND ")}` : "";

  const countResult = await pool.query(
    `
      SELECT COUNT(*)::int AS total
      FROM orders
      ${whereSql}
    `,
    values
  );

  const total = Number(countResult.rows[0]?.total ?? 0);

  const result = await pool.query(
    `
      SELECT *
      FROM orders
      ${whereSql}
      ORDER BY created_at DESC
      LIMIT ${addValue(pageSize)}
      OFFSET ${addValue(offset)}
    `,
    values
  );

  return res.json({
    ok: true,
    orders: result.rows.map(mapOrderRow),
    pagination: {
      page,
      pageSize,
      total,
      totalPages: Math.max(1, Math.ceil(total / pageSize)),
    },
  });
});


app.get("/api/admin/orders/export.csv", requireAdmin, async (req: AdminRequest, res: Response) => {
  const filters = normalizeAdminOrderFilters(req.query);

  if (!filters.ok) {
    return res.status(400).json({ ok: false, error: filters.error });
  }

  const result = await pool.query(
    `
      SELECT *
      FROM orders
      ${filters.whereSql}
      ORDER BY created_at DESC
    `,
    filters.values
  );

  const format = typeof req.query.format === "string" ? req.query.format.trim() : "";
  const excel = format === "excel";
  const csv = buildOrdersCsv(result.rows, { excel });
  const filename = buildOrdersExportFilename(format);

  res.setHeader("Content-Type", "text/csv; charset=utf-8");
  res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);
  res.setHeader("Cache-Control", "no-store");

  return res.send(csv);
});


app.get("/api/admin/orders/:reference", requireAdmin, async (req: AdminRequest, res: Response) => {
  const orderResult = await pool.query(
    `
      SELECT *
      FROM orders
      WHERE reference = $1
      LIMIT 1
    `,
    [req.params.reference]
  );

  const order = orderResult.rows[0];

  if (!order) {
    return res.status(404).json({ ok: false, error: "Order not found" });
  }

  const itemsResult = await pool.query(
    `
      SELECT *
      FROM order_items
      WHERE order_id = $1
      ORDER BY created_at ASC
    `,
    [order.id]
  );

  return res.json({
    ok: true,
    order: {
      ...mapOrderRow(order),
      items: itemsResult.rows.map(mapOrderItemRow),
    },
  });
});

app.patch(
  "/api/admin/orders/:reference/payment-status",
  requireAdmin,
  async (req: AdminRequest, res: Response) => {
    const parsed = updateOrderPaymentStatusSchema.safeParse(req.body);

    if (!parsed.success) {
      return res.status(400).json({
        ok: false,
        error: parsed.error.issues[0]?.message ?? "Invalid payment status",
      });
    }

    const existingResult = await pool.query(
      `
        SELECT status, payment_status
        FROM orders
        WHERE reference = $1
        LIMIT 1
      `,
      [req.params.reference]
    );

    const existingOrder = existingResult.rows[0];

    if (!existingOrder) {
      return res.status(404).json({ ok: false, error: "Order not found" });
    }

    if (
      ["shipped", "completed"].includes(existingOrder.status) &&
      parsed.data.paymentStatus !== "paid"
    ) {
      return res.status(400).json({
        ok: false,
        error: "A shipped or completed order cannot be changed back to unpaid",
      });
    }

    const result = await pool.query(
      `
        UPDATE orders
        SET payment_status = $1,
            payment_reference = CASE
              WHEN $1 = 'paid' THEN COALESCE(payment_reference, reference)
              ELSE payment_reference
            END,
            paid_at = CASE
              WHEN $1 = 'paid' THEN COALESCE(paid_at, now())
              ELSE NULL
            END,
            status = CASE
              WHEN $1 = 'paid' AND status = 'pending_bank_transfer' THEN 'confirmed'
              WHEN $1 = 'pending' THEN 'pending_bank_transfer'
              WHEN $1 = 'cancelled' THEN 'cancelled'
              WHEN $1 = 'refunded' THEN 'refunded'
              ELSE status
            END,
            updated_at = now()
        WHERE reference = $2
        RETURNING *
      `,
      [parsed.data.paymentStatus, req.params.reference]
    );

    const order = mapOrderRow(result.rows[0]);

    await logAdminAction(req, {
      action: "order.payment_status.update",
      targetType: "order",
      targetId: order.reference,
      payload: {
        previousStatus: existingOrder.status,
        previousPaymentStatus: existingOrder.payment_status,
        nextPaymentStatus: parsed.data.paymentStatus,
        orderStatus: order.status,
        paymentStatus: order.paymentStatus,
      },
    });

    return res.json({
      ok: true,
      order,
    });
  }
);

app.patch(
  "/api/admin/orders/:reference/status",
  requireAdmin,
  async (req: AdminRequest, res: Response) => {
    const parsed = updateOrderStatusSchema.safeParse(req.body);

    if (!parsed.success) {
      return res.status(400).json({ ok: false, error: "Invalid status" });
    }

    const currentResult = await pool.query(
      `
        SELECT id, status
        FROM orders
        WHERE reference = $1
        LIMIT 1
      `,
      [req.params.reference]
    );

    if (!currentResult.rows[0]) {
      return res.status(404).json({ ok: false, error: "Order not found" });
    }

    const result = await pool.query(
      `
        UPDATE orders
        SET
          status = $1,
          payment_status = CASE
            WHEN $1 = 'confirmed' THEN 'paid'
            WHEN $1 = 'cancelled' THEN 'cancelled'
            WHEN $1 = 'refunded' THEN 'refunded'
            ELSE payment_status
          END,
          paid_at = CASE
            WHEN $1 = 'confirmed' AND paid_at IS NULL THEN now()
            ELSE paid_at
          END,
          tracking_number = CASE
            WHEN $1 = 'shipped' THEN NULLIF($3, '')
            ELSE tracking_number
          END,
          tracking_carrier = CASE
            WHEN $1 = 'shipped' THEN NULLIF($4, '')
            ELSE tracking_carrier
          END,
          updated_at = now()
        WHERE reference = $2
        RETURNING *
      `,
      [
      parsed.data.status,
      req.params.reference,
      parsed.data.trackingNumber ?? "",
      parsed.data.trackingCarrier ?? "",
    ]
    );

    const order = result.rows[0];

    const previousStatus = currentResult.rows[0].status;

    if (parsed.data.status === "confirmed" && previousStatus !== "confirmed") {
      void sendPaymentConfirmedEmailForOrder(order.id);
    }

    if (
      (parsed.data.status === "ready_for_pickup" || parsed.data.status === "shipped") &&
      previousStatus !== parsed.data.status
    ) {
      void sendOrderStatusNotificationEmailForOrder(order.id, parsed.data.status);
    }

    await logAdminAction(req, {
      action: "order.status.update",
      targetType: "order",
      targetId: order.reference,
      payload: {
        previousStatus,
        nextStatus: parsed.data.status,
        trackingCarrier: parsed.data.trackingCarrier ?? "",
        trackingNumber: parsed.data.trackingNumber ?? "",
      },
    });

    return res.json({
      ok: true,
      order: mapOrderRow(order),
    });
  }
);



async function sendAdminNewOrderEmailForOrder(orderId: string) {
  const notificationType = "admin_new_order";
  const adminEmail = config.email.adminNotificationEmail;

  if (!adminEmail) {
    logger.warn({
      event: "admin_new_order_email_skipped",
      orderId,
      error: "admin_notification_email_not_configured",
    });
    return;
  }

  const notificationResult = await pool.query(
    `
      INSERT INTO order_notifications (order_id, notification_type, recipient_email, status, provider)
      SELECT id, $2, $3, 'pending', 'resend'
      FROM orders
      WHERE id = $1
      ON CONFLICT (order_id, notification_type) DO NOTHING
      RETURNING id
    `,
    [orderId, notificationType, adminEmail]
  );

  const notification = notificationResult.rows[0];

  if (!notification) {
    return;
  }

  try {
    const orderResult = await pool.query(
      `
        SELECT *
        FROM orders
        WHERE id = $1
        LIMIT 1
      `,
      [orderId]
    );

    const order = orderResult.rows[0];

    if (!order) {
      throw new Error("order_not_found_for_admin_new_order_email");
    }

    const itemsResult = await pool.query(
      `
        SELECT *
        FROM order_items
        WHERE order_id = $1
        ORDER BY created_at ASC
      `,
      [order.id]
    );

    const mappedOrder = mapOrderRow(order);
    const publicBaseUrl = config.corsOrigin.replace(/\/$/, "");
    const adminOrderUrl = `${publicBaseUrl}/admin/orders/${encodeURIComponent(order.reference)}`;

    const result = await sendAdminNewOrderEmail({
      to: adminEmail,
      adminOrderUrl,
      order: mappedOrder,
      items: itemsResult.rows.map(mapOrderItemRow),
    });

    await pool.query(
      `
        UPDATE order_notifications
        SET status = 'sent',
            provider_message_id = $2,
            error_message = NULL,
            sent_at = now()
        WHERE id = $1
      `,
      [notification.id, result.providerMessageId]
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : "unknown_email_error";

    logger.error({
      event: "admin_new_order_email_failed",
      orderId,
      notificationId: notification.id,
      error: message,
    });

    await pool.query(
      `
        UPDATE order_notifications
        SET status = 'failed',
            error_message = $2
        WHERE id = $1
      `,
      [notification.id, message.slice(0, 1000)]
    );
  }
}


async function sendOrderStatusNotificationEmailForOrder(
  orderId: string,
  status: "ready_for_pickup" | "shipped"
) {
  const notificationType = status === "ready_for_pickup"
    ? "order_ready_for_pickup"
    : "order_shipped";

  const notificationResult = await pool.query(
    `
      INSERT INTO order_notifications (order_id, notification_type, recipient_email, status, provider)
      SELECT id, $2, customer_email, 'pending', 'resend'
      FROM orders
      WHERE id = $1
      ON CONFLICT (order_id, notification_type) DO NOTHING
      RETURNING id
    `,
    [orderId, notificationType]
  );

  const notification = notificationResult.rows[0];

  if (!notification) {
    return;
  }

  try {
    const orderResult = await pool.query(
      `
        SELECT *
        FROM orders
        WHERE id = $1
        LIMIT 1
      `,
      [orderId]
    );

    const order = orderResult.rows[0];

    if (!order) {
      throw new Error("order_not_found_for_status_notification_email");
    }

    const result = await sendOrderStatusNotificationEmail({
      to: order.customer_email,
      status,
      order: mapOrderRow(order),
      trackingNumber: order.tracking_number ?? undefined,
      trackingCarrier: order.tracking_carrier ?? undefined,
    });

    await pool.query(
      `
        UPDATE order_notifications
        SET status = 'sent',
            provider_message_id = $2,
            error_message = NULL,
            sent_at = now()
        WHERE id = $1
      `,
      [notification.id, result.providerMessageId]
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : "unknown_email_error";

    logger.error({
      event: "order_status_notification_email_failed",
      orderId,
      notificationId: notification.id,
      notificationType,
      error: message,
    });

    await pool.query(
      `
        UPDATE order_notifications
        SET status = 'failed',
            error_message = $2
        WHERE id = $1
      `,
      [notification.id, message.slice(0, 1000)]
    );
  }
}

async function sendPaymentConfirmedEmailForOrder(orderId: string) {
  const notificationType = "payment_confirmed";

  const notificationResult = await pool.query(
    `
      INSERT INTO order_notifications (order_id, notification_type, recipient_email, status, provider)
      SELECT id, $2, customer_email, 'pending', 'resend'
      FROM orders
      WHERE id = $1
      ON CONFLICT (order_id, notification_type) DO NOTHING
      RETURNING id
    `,
    [orderId, notificationType]
  );

  const notification = notificationResult.rows[0];

  if (!notification) {
    return;
  }

  try {
    const orderResult = await pool.query(
      `
        SELECT *
        FROM orders
        WHERE id = $1
        LIMIT 1
      `,
      [orderId]
    );

    const order = orderResult.rows[0];

    if (!order) {
      throw new Error("order_not_found_for_payment_confirmed_email");
    }

    const itemsResult = await pool.query(
      `
        SELECT *
        FROM order_items
        WHERE order_id = $1
        ORDER BY created_at ASC
      `,
      [order.id]
    );

    const result = await sendOrderPaidEmail({
      to: order.customer_email,
      order: mapOrderRow(order),
      items: itemsResult.rows.map(mapOrderItemRow),
    });

    await pool.query(
      `
        UPDATE order_notifications
        SET status = 'sent',
            provider_message_id = $2,
            error_message = NULL,
            sent_at = now()
        WHERE id = $1
      `,
      [notification.id, result.providerMessageId]
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : "unknown_email_error";

    logger.error({
      event: "payment_confirmed_email_failed",
      orderId,
      notificationId: notification.id,
      error: message,
    });

    await pool.query(
      `
        UPDATE order_notifications
        SET status = 'failed',
            error_message = $2
        WHERE id = $1
      `,
      [notification.id, message.slice(0, 1000)]
    );
  }
}

app.use((_req: Request, res: Response) => {
  return res.status(404).json({ ok: false, error: "Not found" });
});

app.listen(config.port, "127.0.0.1", () => {
  logger.info({ port: config.port }, "elamora_api_listening");
});


function mapProductCategoryRow(row: any) {
  return {
    id: row.id,
    code: row.code,
    name: row.name,
    sortOrder: row.sort_order,
    isActive: row.is_active,
  };
}

function mapProductRow(row: any) {
  return {
    id: row.id,
    category: row.category_code,
    categoryName: row.category_name,
    name: row.name,
    description: row.description ?? "",
    priceCents: row.price_cents,
    imageUrl: row.image_url ?? "",
    sortOrder: row.sort_order,
    isActive: row.is_active,
  };
}

function mapProductColorRow(row: any) {
  return {
    id: row.id,
    name: row.name,
    hexCode: row.hex_code,
    sortOrder: row.sort_order,
    isActive: row.is_active,
  };
}

async function createOrderReference(client: { query: typeof pool.query }): Promise<string> {
  const result = await client.query("SELECT COUNT(*)::int AS count FROM orders");
  const nextNumber = Number(result.rows[0]?.count ?? 0) + 1;
  return `ELA-${String(nextNumber).padStart(6, "0")}`;
}


async function getDeliveryAvailability(
  dateValue: string,
  countryCode: string,
  db: { query: typeof pool.query } = pool
): Promise<{
  available: boolean;
  reason: string | null;
  slots: Array<{
    id: string;
    name: string;
    value: string;
    startTime: string;
    endTime: string;
  }>;
}> {
  const date = new Date(`${dateValue}T12:00:00Z`);

  if (Number.isNaN(date.getTime())) {
    return { available: false, reason: "invalid_date", slots: [] };
  }

  const today = new Date();
  today.setUTCHours(0, 0, 0, 0);

  const requested = new Date(`${dateValue}T00:00:00Z`);

  if (requested < today) {
    return { available: false, reason: "past_date", slots: [] };
  }

  const blackoutResult = await db.query(
    `
      SELECT reason
      FROM delivery_blackout_dates
      WHERE is_active = true
        AND blackout_date = $1::date
        AND (country_code IS NULL OR country_code = $2)
      ORDER BY country_code NULLS LAST
      LIMIT 1
    `,
    [dateValue, countryCode]
  );

  const blackout = blackoutResult.rows[0];

  if (blackout) {
    return {
      available: false,
      reason: blackout.reason || "blackout_date",
      slots: [],
    };
  }

  const dayOfWeek = requested.getUTCDay();

  const slotsResult = await db.query(
    `
      SELECT
        id,
        name,
        start_time,
        end_time
      FROM delivery_time_slots
      WHERE is_active = true
        AND day_of_week = $1
        AND (country_code IS NULL OR country_code = $2)
      ORDER BY country_code NULLS LAST, sort_order ASC, start_time ASC
    `,
    [dayOfWeek, countryCode]
  );

  const slots = slotsResult.rows.map((row: any) => ({
    id: row.id,
    name: row.name,
    value: row.name,
    startTime: String(row.start_time).slice(0, 5),
    endTime: String(row.end_time).slice(0, 5),
  }));

  return {
    available: slots.length > 0,
    reason: slots.length > 0 ? null : "no_delivery_slots",
    slots,
  };
}


function mapOrderRow(row: any) {
  return {
    id: row.id,
    reference: row.reference,
    status: row.status,
    customer: {
      firstName: row.customer_first_name,
      lastName: row.customer_last_name ?? "",
      email: row.customer_email,
      phone: row.customer_phone ?? "",
      address: row.delivery_address ?? "",
      addressLine1: row.address_line1 ?? "",
      addressLine2: row.address_line2 ?? "",
      postalCode: row.postal_code ?? "",
      city: row.city ?? "",
      country: row.country_code ?? "",
      deliveryDate: row.delivery_date ?? "",
      deliveryTimeSlot: row.delivery_time_slot ?? "",
      deliveryInstructions: row.delivery_instructions ?? "",
      recipientPhone: row.recipient_phone ?? "",
      deliveryMethod: row.delivery_method ?? "pickup",
    },
    customName: row.custom_name ?? "",
    customMessage: row.custom_message ?? "",
    subtotalCents: row.subtotal_cents ?? row.total_cents,
    shippingCents: row.shipping_cents ?? 0,
    taxCents: row.tax_cents ?? 0,
    totalCents: row.total_cents,
    paymentStatus: row.payment_status ?? "pending",
    paymentProvider: row.payment_provider ?? "bank_transfer",
    paymentReference: row.payment_reference ?? row.reference,
    paidAt: row.paid_at ?? null,
    trackingNumber: row.tracking_number ?? "",
    trackingCarrier: row.tracking_carrier ?? "",
    internalNotes: row.internal_notes ?? "",
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function mapOrderItemRow(row: any) {
  return {
    id: row.id,
    productId: row.product_id,
    productName: row.product_name_snapshot,
    unitPriceCents: row.unit_price_cents,
    quantity: row.quantity,
    colorId: row.color_id,
    colorName: row.color_name_snapshot ?? "",
    colorHex: row.color_hex_snapshot ?? "",
    createdAt: row.created_at,
  };
}

