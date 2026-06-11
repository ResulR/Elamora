import { Resend } from "resend";
import { config } from "./config.js";

export type SendEmailInput = {
  to: string;
  subject: string;
  html: string;
  text?: string;
};

let resendClient: Resend | null = null;

function getResendClient() {
  if (!config.email.configured) {
    throw new Error("email_not_configured");
  }

  if (!resendClient) {
    resendClient = new Resend(config.email.resendApiKey);
  }

  return resendClient;
}

export async function sendEmail(input: SendEmailInput) {
  const resend = getResendClient();

  const result = await resend.emails.send({
    from: config.email.from,
    to: input.to,
    subject: input.subject,
    html: input.html,
    text: input.text,
    replyTo: config.email.replyTo,
  });

  if (result.error) {
    throw new Error(result.error.message);
  }

  return {
    provider: "resend",
    providerMessageId: result.data?.id ?? null,
  };
}


function escapeHtml(value: unknown) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function formatMoney(cents: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "EUR",
  }).format((Number(cents) || 0) / 100);
}

export type OrderPaidEmailItem = {
  productName: string;
  quantity: number;
  unitPriceCents: number;
  colorName?: string;
};

export type OrderPaidEmailInput = {
  to: string;
  order: {
    reference: string;
    totalCents: number;
    subtotalCents?: number;
    shippingCents?: number;
    customName?: string;
    customMessage?: string;
    customer: {
      firstName: string;
      lastName?: string;
      address?: string;
      addressLine1?: string;
      addressLine2?: string;
      postalCode?: string;
      city?: string;
      country?: string;
      deliveryDate?: string;
      deliveryTimeSlot?: string;
      deliveryMethod?: string;
    };
  };
  items: OrderPaidEmailItem[];
};

export function buildOrderPaidEmail(input: OrderPaidEmailInput) {
  const order = input.order;
  const customerName = [order.customer.firstName, order.customer.lastName]
    .filter(Boolean)
    .join(" ")
    .trim();

  const deliveryAddress = [
    order.customer.address || order.customer.addressLine1,
    order.customer.addressLine2,
    [order.customer.postalCode, order.customer.city].filter(Boolean).join(" "),
    order.customer.country,
  ]
    .filter(Boolean)
    .join("<br>");

  const itemsHtml = input.items
    .map((item) => {
      const color = item.colorName ? ` <span style="color:#777;">(${escapeHtml(item.colorName)})</span>` : "";
      return `
        <tr>
          <td style="padding:10px 0;border-bottom:1px solid #eee;">
            ${escapeHtml(item.productName)}${color}
          </td>
          <td style="padding:10px 0;border-bottom:1px solid #eee;text-align:center;">
            ${escapeHtml(item.quantity)}
          </td>
          <td style="padding:10px 0;border-bottom:1px solid #eee;text-align:right;">
            ${formatMoney(item.unitPriceCents * item.quantity)}
          </td>
        </tr>
      `;
    })
    .join("");

  const deliveryMethod = order.customer.deliveryMethod === "delivery" ? "Delivery" : "Pickup";
  const deliveryDate = order.customer.deliveryDate ? escapeHtml(order.customer.deliveryDate) : "To be confirmed";
  const deliveryTimeSlot = order.customer.deliveryTimeSlot ? escapeHtml(order.customer.deliveryTimeSlot) : "To be confirmed";

  const html = `
    <!doctype html>
    <html>
      <body style="margin:0;padding:0;background:#f8f3f6;font-family:Arial,Helvetica,sans-serif;color:#2b1f27;">
        <div style="max-width:640px;margin:0 auto;padding:32px 16px;">
          <div style="background:#ffffff;border-radius:20px;padding:28px;border:1px solid #eadde5;">
            <h1 style="margin:0 0 12px;font-size:26px;line-height:1.2;color:#7f4f73;">
              Your Elamora order is confirmed
            </h1>

            <p style="margin:0 0 18px;font-size:16px;line-height:1.6;">
              Hi ${escapeHtml(customerName || order.customer.firstName)},<br>
              Thank you. We have received your bank transfer and your order is now confirmed.
            </p>

            <div style="background:#f8f3f6;border-radius:14px;padding:16px;margin:20px 0;">
              <p style="margin:0;font-size:14px;color:#7f4f73;">Order reference</p>
              <p style="margin:4px 0 0;font-size:22px;font-weight:700;">${escapeHtml(order.reference)}</p>
            </div>

            <h2 style="font-size:18px;margin:24px 0 8px;">Order summary</h2>
            <table style="width:100%;border-collapse:collapse;font-size:14px;">
              <thead>
                <tr>
                  <th style="padding:8px 0;border-bottom:1px solid #ddd;text-align:left;">Item</th>
                  <th style="padding:8px 0;border-bottom:1px solid #ddd;text-align:center;">Qty</th>
                  <th style="padding:8px 0;border-bottom:1px solid #ddd;text-align:right;">Total</th>
                </tr>
              </thead>
              <tbody>
                ${itemsHtml}
              </tbody>
            </table>

            <table style="width:100%;border-collapse:collapse;margin-top:16px;font-size:15px;">
              <tr>
                <td style="padding:4px 0;">Subtotal</td>
                <td style="padding:4px 0;text-align:right;">${formatMoney(order.subtotalCents ?? order.totalCents)}</td>
              </tr>
              <tr>
                <td style="padding:4px 0;">Shipping</td>
                <td style="padding:4px 0;text-align:right;">${formatMoney(order.shippingCents ?? 0)}</td>
              </tr>
              <tr>
                <td style="padding:10px 0 0;font-weight:700;font-size:18px;">Total paid</td>
                <td style="padding:10px 0 0;text-align:right;font-weight:700;font-size:18px;">${formatMoney(order.totalCents)}</td>
              </tr>
            </table>

            <h2 style="font-size:18px;margin:28px 0 8px;">${deliveryMethod} details</h2>
            <p style="margin:0;font-size:15px;line-height:1.6;">
              Date: ${deliveryDate}<br>
              Time slot: ${deliveryTimeSlot}
              ${deliveryAddress ? `<br><br>${deliveryAddress}` : ""}
            </p>

            ${
              order.customName || order.customMessage
                ? `
                  <h2 style="font-size:18px;margin:28px 0 8px;">Personalization</h2>
                  <p style="margin:0;font-size:15px;line-height:1.6;">
                    ${order.customName ? `Name: ${escapeHtml(order.customName)}<br>` : ""}
                    ${order.customMessage ? `Message: ${escapeHtml(order.customMessage)}` : ""}
                  </p>
                `
                : ""
            }

            <p style="margin:28px 0 0;font-size:14px;line-height:1.6;color:#6f626a;">
              We will now prepare your personalized gift. If you have any question, simply reply to this email.
            </p>
          </div>
        </div>
      </body>
    </html>
  `;

  const text = [
    "Your Elamora order is confirmed",
    "",
    `Hi ${customerName || order.customer.firstName},`,
    "Thank you. We have received your bank transfer and your order is now confirmed.",
    "",
    `Order reference: ${order.reference}`,
    `Total paid: ${formatMoney(order.totalCents)}`,
    `${deliveryMethod}: ${deliveryDate} - ${deliveryTimeSlot}`,
    "",
    "Order summary:",
    ...input.items.map((item) => `- ${item.productName}${item.colorName ? ` (${item.colorName})` : ""} x${item.quantity}: ${formatMoney(item.unitPriceCents * item.quantity)}`),
    "",
    "We will now prepare your personalized gift. If you have any question, simply reply to this email.",
  ].join("\n");

  return {
    subject: `Your Elamora order ${order.reference} is confirmed`,
    html,
    text,
  };
}

export async function sendOrderPaidEmail(input: OrderPaidEmailInput) {
  const email = buildOrderPaidEmail(input);

  return sendEmail({
    to: input.to,
    subject: email.subject,
    html: email.html,
    text: email.text,
  });
}


export type AdminNewOrderEmailInput = {
  to: string;
  adminOrderUrl: string;
  order: {
    reference: string;
    status: string;
    totalCents: number;
    subtotalCents?: number;
    shippingCents?: number;
    paymentStatus?: string;
    customer: {
      firstName: string;
      lastName?: string;
      email?: string;
      phone?: string;
      deliveryMethod?: string;
      deliveryDate?: string;
      deliveryTimeSlot?: string;
      address?: string;
      addressLine1?: string;
      addressLine2?: string;
      postalCode?: string;
      city?: string;
      country?: string;
    };
    customName?: string;
    customMessage?: string;
    createdAt?: string;
  };
  items: OrderPaidEmailItem[];
};

export function buildAdminNewOrderEmail(input: AdminNewOrderEmailInput) {
  const order = input.order;
  const customerName = [order.customer.firstName, order.customer.lastName]
    .filter(Boolean)
    .join(" ")
    .trim();

  const deliveryAddress = [
    order.customer.address || order.customer.addressLine1,
    order.customer.addressLine2,
    [order.customer.postalCode, order.customer.city].filter(Boolean).join(" "),
    order.customer.country,
  ]
    .filter(Boolean)
    .join(", ");

  const itemsText = input.items
    .map((item) => {
      const color = item.colorName ? ` (${item.colorName})` : "";
      return `- ${item.productName}${color} x${item.quantity}: ${formatMoney(item.unitPriceCents * item.quantity)}`;
    })
    .join("\n");

  const text = [
    `New Elamora order: ${order.reference}`,
    "",
    `Admin link: ${input.adminOrderUrl}`,
    "",
    "Customer:",
    `${customerName || order.customer.firstName}`,
    `${order.customer.email || "-"}`,
    `${order.customer.phone || "-"}`,
    "",
    "Order:",
    `Reference: ${order.reference}`,
    `Status: ${order.status}`,
    `Payment status: ${order.paymentStatus || "pending"}`,
    `Total: ${formatMoney(order.totalCents)}`,
    `Shipping: ${formatMoney(order.shippingCents ?? 0)}`,
    "",
    "Delivery:",
    `Method: ${order.customer.deliveryMethod || "pickup"}`,
    `Date: ${order.customer.deliveryDate || "-"}`,
    `Time slot: ${order.customer.deliveryTimeSlot || "-"}`,
    `Address: ${deliveryAddress || "-"}`,
    "",
    "Items:",
    itemsText || "-",
    "",
    "Personalization:",
    `Name: ${order.customName || "-"}`,
    `Message: ${order.customMessage || "-"}`,
  ].join("\n");

  const itemsHtml = input.items
    .map((item) => {
      const color = item.colorName ? ` (${escapeHtml(item.colorName)})` : "";
      return `<li>${escapeHtml(item.productName)}${color} x${escapeHtml(item.quantity)} — ${formatMoney(item.unitPriceCents * item.quantity)}</li>`;
    })
    .join("");

  const html = `
    <!doctype html>
    <html>
      <body style="font-family:Arial,Helvetica,sans-serif;color:#1f1f1f;line-height:1.5;">
        <h1>New Elamora order</h1>
        <p><strong>Reference:</strong> ${escapeHtml(order.reference)}</p>
        <p><strong>Total:</strong> ${formatMoney(order.totalCents)}</p>
        <p><strong>Status:</strong> ${escapeHtml(order.status)}</p>
        <p><strong>Payment status:</strong> ${escapeHtml(order.paymentStatus || "pending")}</p>

        <p>
          <a href="${escapeHtml(input.adminOrderUrl)}" style="display:inline-block;padding:10px 16px;background:#7f4f73;color:#ffffff;text-decoration:none;border-radius:999px;">
            Open order in admin
          </a>
        </p>

        <h2>Customer</h2>
        <p>
          ${escapeHtml(customerName || order.customer.firstName)}<br>
          ${escapeHtml(order.customer.email || "-")}<br>
          ${escapeHtml(order.customer.phone || "-")}
        </p>

        <h2>Delivery</h2>
        <p>
          Method: ${escapeHtml(order.customer.deliveryMethod || "pickup")}<br>
          Date: ${escapeHtml(order.customer.deliveryDate || "-")}<br>
          Time slot: ${escapeHtml(order.customer.deliveryTimeSlot || "-")}<br>
          Address: ${escapeHtml(deliveryAddress || "-")}
        </p>

        <h2>Items</h2>
        <ul>${itemsHtml || "<li>-</li>"}</ul>

        <h2>Personalization</h2>
        <p>
          Name: ${escapeHtml(order.customName || "-")}<br>
          Message: ${escapeHtml(order.customMessage || "-")}
        </p>
      </body>
    </html>
  `;

  return {
    subject: `New Elamora order ${order.reference}`,
    html,
    text,
  };
}

export async function sendAdminNewOrderEmail(input: AdminNewOrderEmailInput) {
  const email = buildAdminNewOrderEmail(input);

  return sendEmail({
    to: input.to,
    subject: email.subject,
    html: email.html,
    text: email.text,
  });
}


export type OrderStatusNotificationEmailInput = {
  to: string;
  status: "ready_for_pickup" | "shipped";
  order: {
    reference: string;
    totalCents: number;
    customer: {
      firstName: string;
      lastName?: string;
      deliveryMethod?: string;
      deliveryDate?: string;
      deliveryTimeSlot?: string;
      address?: string;
      addressLine1?: string;
      addressLine2?: string;
      postalCode?: string;
      city?: string;
      country?: string;
    };
  };
  trackingUrl?: string;
  trackingNumber?: string;
};

export function buildOrderStatusNotificationEmail(input: OrderStatusNotificationEmailInput) {
  const order = input.order;
  const customerName = [order.customer.firstName, order.customer.lastName]
    .filter(Boolean)
    .join(" ")
    .trim();

  const isReadyForPickup = input.status === "ready_for_pickup";

  const title = isReadyForPickup
    ? "Your Elamora order is ready for pickup"
    : "Your Elamora order has been shipped";

  const intro = isReadyForPickup
    ? "Good news. Your personalized gift is ready for pickup."
    : "Good news. Your personalized gift has been shipped.";

  const nextStep = isReadyForPickup
    ? "You can now pick up your order. Please bring your order reference with you."
    : "Your order is on its way. We will contact you if any delivery detail needs confirmation.";

  const deliveryAddress = [
    order.customer.address || order.customer.addressLine1,
    order.customer.addressLine2,
    [order.customer.postalCode, order.customer.city].filter(Boolean).join(" "),
    order.customer.country,
  ]
    .filter(Boolean)
    .join("<br>");

  const trackingHtml = !isReadyForPickup && (input.trackingUrl || input.trackingNumber)
    ? `
      <h2 style="font-size:18px;margin:28px 0 8px;">Tracking</h2>
      <p style="margin:0;font-size:15px;line-height:1.6;">
        ${input.trackingNumber ? `Tracking number: ${escapeHtml(input.trackingNumber)}<br>` : ""}
        ${input.trackingUrl ? `<a href="${escapeHtml(input.trackingUrl)}">Track your order</a>` : ""}
      </p>
    `
    : "";

  const trackingText = !isReadyForPickup && (input.trackingUrl || input.trackingNumber)
    ? [
        "",
        "Tracking:",
        input.trackingNumber ? `Tracking number: ${input.trackingNumber}` : "",
        input.trackingUrl ? `Tracking link: ${input.trackingUrl}` : "",
      ].filter(Boolean)
    : [];

  const html = `
    <!doctype html>
    <html>
      <body style="margin:0;padding:0;background:#f8f3f6;font-family:Arial,Helvetica,sans-serif;color:#2b1f27;">
        <div style="max-width:640px;margin:0 auto;padding:32px 16px;">
          <div style="background:#ffffff;border-radius:20px;padding:28px;border:1px solid #eadde5;">
            <h1 style="margin:0 0 12px;font-size:26px;line-height:1.2;color:#7f4f73;">
              ${escapeHtml(title)}
            </h1>

            <p style="margin:0 0 18px;font-size:16px;line-height:1.6;">
              Hi ${escapeHtml(customerName || order.customer.firstName)},<br>
              ${escapeHtml(intro)}
            </p>

            <div style="background:#f8f3f6;border-radius:14px;padding:16px;margin:20px 0;">
              <p style="margin:0;font-size:14px;color:#7f4f73;">Order reference</p>
              <p style="margin:4px 0 0;font-size:22px;font-weight:700;">${escapeHtml(order.reference)}</p>
            </div>

            <p style="margin:0;font-size:15px;line-height:1.6;">
              ${escapeHtml(nextStep)}
            </p>

            ${
              isReadyForPickup
                ? `
                  <h2 style="font-size:18px;margin:28px 0 8px;">Pickup details</h2>
                  <p style="margin:0;font-size:15px;line-height:1.6;">
                    Date: ${escapeHtml(order.customer.deliveryDate || "To be confirmed")}<br>
                    Time slot: ${escapeHtml(order.customer.deliveryTimeSlot || "To be confirmed")}
                    ${deliveryAddress ? `<br><br>${deliveryAddress}` : ""}
                  </p>
                `
                : `
                  <h2 style="font-size:18px;margin:28px 0 8px;">Delivery details</h2>
                  <p style="margin:0;font-size:15px;line-height:1.6;">
                    ${deliveryAddress ? escapeHtml(deliveryAddress).replaceAll("&lt;br&gt;", "<br>") : "Delivery address to be confirmed"}
                  </p>
                `
            }

            ${trackingHtml}

            <p style="margin:28px 0 0;font-size:14px;line-height:1.6;color:#6f626a;">
              If you have any question, simply reply to this email.
            </p>
          </div>
        </div>
      </body>
    </html>
  `;

  const text = [
    title,
    "",
    `Hi ${customerName || order.customer.firstName},`,
    intro,
    "",
    `Order reference: ${order.reference}`,
    "",
    nextStep,
    "",
    isReadyForPickup ? "Pickup details:" : "Delivery details:",
    isReadyForPickup
      ? `Date: ${order.customer.deliveryDate || "To be confirmed"}`
      : `Address: ${deliveryAddress.replaceAll("<br>", ", ") || "Delivery address to be confirmed"}`,
    isReadyForPickup ? `Time slot: ${order.customer.deliveryTimeSlot || "To be confirmed"}` : "",
    ...trackingText,
    "",
    "If you have any question, simply reply to this email.",
  ].filter((line) => line !== "").join("\n");

  return {
    subject: isReadyForPickup
      ? `Your Elamora order ${order.reference} is ready for pickup`
      : `Your Elamora order ${order.reference} has been shipped`,
    html,
    text,
  };
}

export async function sendOrderStatusNotificationEmail(input: OrderStatusNotificationEmailInput) {
  const email = buildOrderStatusNotificationEmail(input);

  return sendEmail({
    to: input.to,
    subject: email.subject,
    html: email.html,
    text: email.text,
  });
}
