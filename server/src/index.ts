import express, { type Request, type Response } from "express";
import helmet from "helmet";
import cors from "cors";
import cookieParser from "cookie-parser";
import rateLimit from "express-rate-limit";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { z } from "zod";
import { config } from "./config.js";
import { checkDatabase, pool } from "./db.js";
import { requireAdmin, type AdminRequest } from "./middleware/require-admin.js";

const app = express();

app.set("trust proxy", 1);

app.use(helmet());
app.use(
  cors({
    origin: config.corsOrigin,
    credentials: true,
  })
);
app.use(express.json({ limit: "100kb" }));
app.use(cookieParser());

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

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

const orderStatusSchema = z.enum([
  "pending",
  "confirmed",
  "preparing",
  "completed",
  "cancelled",
]);

const createOrderSchema = z.object({
  customer: z.object({
    firstName: z.string().trim().min(1).max(120),
    lastName: z.string().trim().max(120).optional().default(""),
    email: z.string().trim().email().max(255),
    phone: z.string().trim().max(80).optional().default(""),
    address: z.string().trim().max(500).optional().default(""),
    deliveryMethod: z.enum(["pickup", "delivery"]).optional().default("pickup"),
  }),
  customName: z.string().trim().max(120).optional().default(""),
  customMessage: z.string().trim().max(1000).optional().default(""),
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
    console.error(error);

    return res.status(500).json({
      ok: false,
      error: "Could not load catalog",
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

    const totalCents = validatedItems.reduce(
      (sum, item) => sum + item.unitPriceCents * item.quantity,
      0
    );

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
          custom_name,
          custom_message,
          total_cents
        )
        VALUES ($1, 'pending', $2, $3, $4, $5, $6, $7, $8, $9, $10)
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
        payload.customName,
        payload.customMessage,
        totalCents,
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

    return res.status(201).json({
      ok: true,
      order: mapOrderRow(order),
    });
  } catch (error) {
    await client.query("ROLLBACK");
    console.error(error);

    return res.status(500).json({
      ok: false,
      error: "Could not create order",
    });
  } finally {
    client.release();
  }
});


app.get("/api/orders/:reference", async (req: Request, res: Response) => {
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
    { expiresIn: "7d" }
  );

  res.cookie("elamora_admin_token", token, {
    httpOnly: true,
    secure: config.cookieSecure,
    sameSite: "lax",
    path: "/",
    maxAge: 7 * 24 * 60 * 60 * 1000,
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
    sameSite: "lax",
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
    console.error(error);

    return res.status(500).json({
      ok: false,
      error: "Could not load admin catalog",
    });
  }
});


app.get("/api/admin/orders", requireAdmin, async (_req: AdminRequest, res: Response) => {
  const result = await pool.query(
    `
      SELECT *
      FROM orders
      ORDER BY created_at DESC
      LIMIT 200
    `
  );

  return res.json({
    ok: true,
    orders: result.rows.map(mapOrderRow),
  });
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
  "/api/admin/orders/:reference/status",
  requireAdmin,
  async (req: AdminRequest, res: Response) => {
    const parsed = updateOrderStatusSchema.safeParse(req.body);

    if (!parsed.success) {
      return res.status(400).json({ ok: false, error: "Invalid status" });
    }

    const result = await pool.query(
      `
        UPDATE orders
        SET status = $1, updated_at = now()
        WHERE reference = $2
        RETURNING *
      `,
      [parsed.data.status, req.params.reference]
    );

    const order = result.rows[0];

    if (!order) {
      return res.status(404).json({ ok: false, error: "Order not found" });
    }

    return res.json({
      ok: true,
      order: mapOrderRow(order),
    });
  }
);

app.use((_req: Request, res: Response) => {
  return res.status(404).json({ ok: false, error: "Not found" });
});

app.listen(config.port, "127.0.0.1", () => {
  console.log(`Elamora API listening on 127.0.0.1:${config.port}`);
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
      deliveryMethod: row.delivery_method ?? "pickup",
    },
    customName: row.custom_name ?? "",
    customMessage: row.custom_message ?? "",
    totalCents: row.total_cents,
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

