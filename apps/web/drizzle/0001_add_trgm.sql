-- Enable pg_trgm extension for fuzzy text search
-- Neon supports pg_trgm natively
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- Create GIN trigram index on merchants.name for fast similarity search
CREATE INDEX IF NOT EXISTS idx_merchants_name_trgm ON merchants USING GIN (name gin_trgm_ops);

-- Create GIN trigram index on merchants.aliases array elements
-- Uses array_to_string to flatten the array for trigram indexing
CREATE INDEX IF NOT EXISTS idx_merchants_aliases_trgm ON merchants USING GIN (array_to_string(aliases, ' ') gin_trgm_ops);
