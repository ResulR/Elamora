import bcrypt from "bcryptjs";
import { pool } from "../db.js";

async function main() {
  const email = process.env.ADMIN_EMAIL?.trim().toLowerCase();
  const password = process.env.ADMIN_PASSWORD;

  if (!email || !password) {
    console.error("ADMIN_EMAIL and ADMIN_PASSWORD are required.");
    process.exit(1);
  }

  if (password.length < 12) {
    console.error("ADMIN_PASSWORD must be at least 12 characters.");
    process.exit(1);
  }

  const passwordHash = await bcrypt.hash(password, 12);

  await pool.query(
    `
      INSERT INTO admins (email, password_hash, role)
      VALUES ($1, $2, 'admin')
      ON CONFLICT (email)
      DO UPDATE SET
        password_hash = EXCLUDED.password_hash,
        role = 'admin',
        updated_at = now()
    `,
    [email, passwordHash]
  );

  console.log(`Admin account ready: ${email}`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await pool.end();
  });
