CREATE INDEX IF NOT EXISTS content_trgm_idx 
ON "posts" 
USING gin ("content" gin_trgm_ops);