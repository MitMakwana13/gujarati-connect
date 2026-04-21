CREATE OR REPLACE FUNCTION update_post_search_vector()
RETURNS TRIGGER AS $$
BEGIN
    NEW.search_vector := to_tsvector('english', 
        COALESCE(NEW.body, '') || ' ' || 
        COALESCE(NEW.link_url, '')
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_posts_search ON posts;
CREATE TRIGGER trg_posts_search
    BEFORE INSERT OR UPDATE OF body, link_url ON posts
    FOR EACH ROW EXECUTE FUNCTION update_post_search_vector();

-- Retroactively update existing posts
UPDATE posts SET search_vector = to_tsvector('english', 
    COALESCE(body, '') || ' ' || 
    COALESCE(link_url, '')
);
