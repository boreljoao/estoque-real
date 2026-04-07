-- Migration: Full-text search for products
-- Run manually: psql $DATABASE_URL -f prisma/migrations/add_full_text_search.sql

-- 1. Add tsvector column (auto-updated via GENERATED ALWAYS AS)
ALTER TABLE products
  ADD COLUMN IF NOT EXISTS search_vector tsvector
    GENERATED ALWAYS AS (
      to_tsvector(
        'portuguese',
        coalesce(name, '') || ' ' ||
        coalesce(sku, '')  || ' ' ||
        coalesce(barcode, '')
      )
    ) STORED;

-- 2. GIN index for fast full-text lookup
CREATE INDEX IF NOT EXISTS products_search_idx ON products USING GIN(search_vector);

-- 3. Helper function (used by the search API via $queryRaw)
CREATE OR REPLACE FUNCTION search_products(
  p_org_id uuid,
  p_query  text,
  p_limit  int DEFAULT 20
)
RETURNS TABLE (id uuid) AS $$
  SELECT p.id
  FROM products p
  WHERE p.org_id       = p_org_id
    AND p.is_archived  = false
    AND p.is_active    = true
    AND p.search_vector @@ plainto_tsquery('portuguese', p_query)
  ORDER BY ts_rank(p.search_vector, plainto_tsquery('portuguese', p_query)) DESC
  LIMIT p_limit;
$$ LANGUAGE sql STABLE;
