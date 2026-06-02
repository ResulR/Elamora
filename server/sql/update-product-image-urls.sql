-- =============================================================================
-- Elamora — Mise à jour image_url des produits actifs
-- Généré le 2026-06-02
--
-- À exécuter sur le serveur PostgreSQL de production APRÈS validation visuelle
-- du frontend. Ne pas exécuter en local sauf si la DB locale est synchronisée.
--
-- Vérification avant exécution :
--   SELECT id, name, image_url FROM products WHERE image_url = '' OR image_url IS NULL;
--
-- =============================================================================

-- ── Buckets ──────────────────────────────────────────────────────────────────

UPDATE products
SET image_url = '/products/buckets/classic-bucket.png'
WHERE id = 'da7161c7-3c92-4550-a977-de761e44becb';

UPDATE products
SET image_url = '/products/buckets/premium-bucket.png'
WHERE id = 'ebdd05c4-2f36-4d0f-8a01-0eabd98eff12';

-- ── Flowers ──────────────────────────────────────────────────────────────────

UPDATE products
SET image_url = '/products/flowers/rose.png'
WHERE id = '2e7014f4-efc4-4af7-a589-7569a72bdff4';

UPDATE products
SET image_url = '/products/flowers/peony.png'
WHERE id = '80821cac-2fab-4771-a0cb-653fb4c5701f';

UPDATE products
SET image_url = '/products/flowers/tulip.png'
WHERE id = 'a964a37b-eba1-4e77-936f-d1a27c777e0c';

-- ── Balloons ─────────────────────────────────────────────────────────────────

UPDATE products
SET image_url = '/products/balloons/heart.png'
WHERE id = '9a8f401d-6f38-4604-9d71-3f9d330b92b8';

UPDATE products
SET image_url = '/products/balloons/star.png'
WHERE id = 'a47b24e5-2fae-4be7-bc6a-0aed87bb338a';

-- =============================================================================
-- Requête de vérification post-exécution
-- =============================================================================

SELECT
  p.id,
  p.name,
  c.code  AS category,
  p.image_url
FROM products p
JOIN product_categories c ON c.id = p.category_id
ORDER BY c.sort_order, p.sort_order, p.name;
