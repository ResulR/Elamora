import fs from "node:fs";
import path from "node:path";

function loadEnvFileIfPresent(filePath: string) {
  if (!fs.existsSync(filePath)) {
    return;
  }

  const content = fs.readFileSync(filePath, "utf8");

  for (const rawLine of content.split(/\r?\n/)) {
    const line = rawLine.trim();

    if (!line || line.startsWith("#")) {
      continue;
    }

    const separatorIndex = line.indexOf("=");

    if (separatorIndex <= 0) {
      continue;
    }

    const key = line.slice(0, separatorIndex).trim();
    let value = line.slice(separatorIndex + 1).trim();

    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }

    if (!process.env[key]) {
      process.env[key] = value;
    }
  }
}

loadEnvFileIfPresent(path.resolve(process.cwd(), ".env"));
loadEnvFileIfPresent(path.resolve(process.cwd(), "server/.env"));

const [{ config }, { pool }, { sendAdminPendingPaymentReminderEmail }, { logger }] = await Promise.all([
  import("../config.js"),
  import("../db.js"),
  import("../email.js"),
  import("../logger.js"),
]);

type PendingOrderRow = {
  id: string;
  reference: string;
  total_cents: number;
  payment_status: string;
  customer_first_name: string;
  customer_last_name: string | null;
  customer_email: string;
  customer_phone: string | null;
  created_at: Date | string;
};

function mapOrder(row: PendingOrderRow) {
  return {
    reference: row.reference,
    totalCents: Number(row.total_cents ?? 0),
    paymentStatus: row.payment_status || "pending",
    customer: {
      firstName: row.customer_first_name || "",
      lastName: row.customer_last_name || "",
      email: row.customer_email || "",
      phone: row.customer_phone || "",
    },
    createdAt: row.created_at ? String(row.created_at) : undefined,
  };
}

async function main() {
  const adminEmail = config.email.adminNotificationEmail;

  if (!adminEmail) {
    logger.warn({
      event: "pending_payment_admin_reminder_skipped",
      error: "admin_notification_email_not_configured",
    });
    console.log(JSON.stringify({ ok: true, checked: 0, sent: 0, skipped: 0, failed: 0 }));
    return;
  }

  const ordersResult = await pool.query<PendingOrderRow>(
    `
      SELECT
        id,
        reference,
        total_cents,
        payment_status,
        customer_first_name,
        customer_last_name,
        customer_email,
        customer_phone,
        created_at
      FROM orders
      WHERE status = 'pending_bank_transfer'
        AND payment_status = 'pending'
        AND created_at >= $1::timestamptz
        AND created_at <= now() - interval '24 hours'
      ORDER BY created_at ASC
      LIMIT 50
    `,
    [config.pendingPaymentRemindersStartAt]
  );

  let sent = 0;
  let skipped = 0;
  let failed = 0;

  for (const order of ordersResult.rows) {
    const notificationType = "admin_pending_payment_reminder";

    const notificationResult = await pool.query(
      `
        INSERT INTO order_notifications (
          order_id,
          notification_type,
          recipient_email,
          status,
          provider,
          provider_message_id,
          error_message,
          sent_at
        )
        VALUES ($1, $2, $3, 'pending', 'resend', NULL, NULL, NULL)
        ON CONFLICT (order_id, notification_type)
        DO UPDATE SET
          recipient_email = EXCLUDED.recipient_email,
          status = 'pending',
          provider = 'resend',
          provider_message_id = NULL,
          error_message = NULL,
          sent_at = NULL
        WHERE order_notifications.status = 'failed'
        RETURNING id
      `,
      [order.id, notificationType, adminEmail]
    );

    const notification = notificationResult.rows[0];

    if (!notification) {
      skipped += 1;
      continue;
    }

    try {
      const adminOrderUrl = `${config.publicAppUrl}/admin/orders/${encodeURIComponent(order.reference)}`;

      const result = await sendAdminPendingPaymentReminderEmail({
        to: adminEmail,
        adminOrderUrl,
        order: mapOrder(order),
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

      sent += 1;
    } catch (error) {
      const message = error instanceof Error ? error.message : "unknown_email_error";

      logger.error({
        event: "pending_payment_admin_reminder_failed",
        orderId: order.id,
        reference: order.reference,
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

      failed += 1;
    }
  }

  logger.info({
    event: "pending_payment_admin_reminder_done",
    checked: ordersResult.rowCount ?? ordersResult.rows.length,
    sent,
    skipped,
    failed,
  });

  console.log(JSON.stringify({
    ok: failed === 0,
    checked: ordersResult.rowCount ?? ordersResult.rows.length,
    sent,
    skipped,
    failed,
  }));
}

main()
  .catch((error) => {
    const message = error instanceof Error ? error.message : "unknown_error";
    logger.error({
      event: "pending_payment_admin_reminder_crashed",
      error: message,
    });
    console.error(JSON.stringify({ ok: false, error: message }));
    process.exitCode = 1;
  })
  .finally(async () => {
    await pool.end();
  });
