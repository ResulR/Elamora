-- =============================================================================
-- Elamora — Ajout de la catégorie "plush" et des 3 produits peluches
-- Fichier : server/sql/add-plush-products.sql
-- Généré le : 2026-06-02
-- =============================================================================
--
-- IDEMPOTENT : peut être relancé plusieurs fois sans créer de doublons.
-- Utilise WHERE NOT EXISTS pour chaque INSERT.
--
-- PRÉ-REQUIS :
--   Vérifier que gen_random_uuid() est disponible :
--     SELECT gen_random_uuid();
--   Si erreur → activer l'extension :
--     CREATE EXTENSION IF NOT EXISTS pgcrypto;
--   Puis utiliser gen_random_uuid() (disponible via pgcrypto ou pg >= 13 natif)
--
-- COMMANDE D'EXÉCUTION (sur le VPS) :
--   sudo -u postgres psql -d elamora_db -f /chemin/vers/add-plush-products.sql
--
-- COMMANDE DE VÉRIFICATION POST-EXÉCUTION :
--   sudo -u postgres psql -d elamora_db -c "
--     SELECT p.id, p.name, p.price_cents, p.is_active, c.code AS category
--     FROM products p
--     JOIN product_categories c ON c.id = p.category_id
--     WHERE c.code = 'plush'
--     ORDER BY p.sort_order;
--   "
-- =============================================================================

BEGIN;

-- ── 1. Catégorie plush (idempotent) ──────────────────────────────────────────
INSERT INTO product_categories (id, code, name, sort_order, is_active)
SELECT
  gen_random_uuid(),
  'plush',
  'Plush Toys',
  4,      -- après balloon qui est à sort_order 3
  true
WHERE NOT EXISTS (
  SELECT 1 FROM product_categories WHERE code = 'plush'
);

-- ── 2. Teddy Bear (idempotent) ───────────────────────────────────────────────
INSERT INTO products (id, category_id, name, description, price_cents, image_url, sort_order, is_active)
SELECT
  gen_random_uuid(),
  c.id,
  'Teddy Bear',
  '',
  800,    -- €8.00
  '',
  1,
  true
FROM product_categories c
WHERE c.code = 'plush'
  AND NOT EXISTS (
    SELECT 1
    FROM products p
    WHERE p.category_id = c.id
      AND p.name = 'Teddy Bear'
  );

-- ── 3. Bunny Plush (idempotent) ──────────────────────────────────────────────
INSERT INTO products (id, category_id, name, description, price_cents, image_url, sort_order, is_active)
SELECT
  gen_random_uuid(),
  c.id,
  'Bunny Plush',
  '',
  900,    -- €9.00
  '',
  2,
  true
FROM product_categories c
WHERE c.code = 'plush'
  AND NOT EXISTS (
    SELECT 1
    FROM products p
    WHERE p.category_id = c.id
      AND p.name = 'Bunny Plush'
  );

-- ── 4. Elephant Plush (idempotent) ───────────────────────────────────────────
INSERT INTO products (id, category_id, name, description, price_cents, image_url, sort_order, is_active)
SELECT
  gen_random_uuid(),
  c.id,
  'Elephant Plush',
  '',
  1000,   -- €10.00
  '',
  3,
  true
FROM product_categories c
WHERE c.code = 'plush'
  AND NOT EXISTS (
    SELECT 1
    FROM products p
    WHERE p.category_id = c.id
      AND p.name = 'Elephant Plush'
  );

-- ── 5. Vérification finale (dans la transaction) ──────────────────────────────
SELECT
  p.id,
  p.name,
  p.price_cents,
  p.sort_order,
  p.is_active,
  c.code  AS category_code,
  c.name  AS category_name
FROM products p
JOIN product_categories c ON c.id = p.category_id
WHERE c.code = 'plush'
ORDER BY p.sort_order;

COMMIT;
