DROP SCHEMA IF EXISTS public CASCADE;
CREATE SCHEMA public;
GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT ALL ON SCHEMA public TO anon, authenticated;

DELETE FROM storage.buckets WHERE id = 'swiggy-screenshots';

CREATE TABLE swiggy_orders (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_name VARCHAR(100) NOT NULL,
    mobile_number VARCHAR(10) NOT NULL,
    upi_id VARCHAR(100) NOT NULL,
    screenshot_url TEXT,
    status VARCHAR(20) DEFAULT 'submitted' CHECK (status IN ('submitted', 'approved', 'rejected')),
    has_redirected BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE swiggy_orders ADD CONSTRAINT unique_upi_id UNIQUE (upi_id);
ALTER TABLE swiggy_orders ADD CONSTRAINT unique_mobile_number UNIQUE (mobile_number);

CREATE INDEX idx_swiggy_orders_status ON swiggy_orders(status);
CREATE INDEX idx_swiggy_orders_created_at ON swiggy_orders(created_at);
CREATE INDEX idx_swiggy_orders_mobile ON swiggy_orders(mobile_number);
CREATE INDEX idx_swiggy_orders_upi ON swiggy_orders(upi_id);
CREATE INDEX idx_swiggy_orders_has_redirected ON swiggy_orders(has_redirected);

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_swiggy_orders_updated_at 
    BEFORE UPDATE ON swiggy_orders 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

INSERT INTO storage.buckets (id, name, public) 
VALUES ('swiggy-screenshots', 'swiggy-screenshots', true)
ON CONFLICT (id) DO UPDATE SET 
    name = EXCLUDED.name,
    public = EXCLUDED.public;

DROP POLICY IF EXISTS "Allow public upload to swiggy-screenshots" ON storage.objects;
CREATE POLICY "Allow public upload to swiggy-screenshots" ON storage.objects
    FOR INSERT WITH CHECK (bucket_id = 'swiggy-screenshots');

DROP POLICY IF EXISTS "Allow public read from swiggy-screenshots" ON storage.objects;
CREATE POLICY "Allow public read from swiggy-screenshots" ON storage.objects
    FOR SELECT USING (bucket_id = 'swiggy-screenshots');

DROP POLICY IF EXISTS "Allow public update in swiggy-screenshots" ON storage.objects;
CREATE POLICY "Allow public update in swiggy-screenshots" ON storage.objects
    FOR UPDATE USING (bucket_id = 'swiggy-screenshots');

DROP POLICY IF EXISTS "Allow public delete from swiggy-screenshots" ON storage.objects;
CREATE POLICY "Allow public delete from swiggy-screenshots" ON storage.objects
    FOR DELETE USING (bucket_id = 'swiggy-screenshots');

ALTER TABLE swiggy_orders ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow public insert swiggy_orders" ON swiggy_orders;
CREATE POLICY "Allow public insert swiggy_orders" ON swiggy_orders
    FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Allow public select swiggy_orders" ON swiggy_orders;
CREATE POLICY "Allow public select swiggy_orders" ON swiggy_orders
    FOR SELECT USING (true);

DROP POLICY IF EXISTS "Allow public update swiggy_orders" ON swiggy_orders;
CREATE POLICY "Allow public update swiggy_orders" ON swiggy_orders
    FOR UPDATE USING (true);

CREATE OR REPLACE VIEW swiggy_orders_admin_view AS
SELECT 
    id,
    user_name,
    mobile_number,
    upi_id,
    screenshot_url,
    status,
    has_redirected,
    CASE 
        WHEN screenshot_url IS NOT NULL AND status = 'submitted' THEN 'pending_approval'
        WHEN screenshot_url IS NOT NULL AND status = 'approved' THEN 'approved'
        WHEN screenshot_url IS NOT NULL AND status = 'rejected' THEN 'rejected'
        WHEN has_redirected = TRUE AND screenshot_url IS NULL THEN 'redirected'
        ELSE 'details_entered'
    END as progress_stage,
    created_at,
    updated_at
FROM swiggy_orders
ORDER BY created_at DESC;

CREATE OR REPLACE FUNCTION get_swiggy_campaign_stats()
RETURNS TABLE (
    total_orders BIGINT,
    pending_approval BIGINT,
    approved BIGINT,
    rejected BIGINT,
    redirected_only BIGINT,
    details_only BIGINT
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        COUNT(*) as total_orders,
        COUNT(*) FILTER (WHERE screenshot_url IS NOT NULL AND status = 'submitted') as pending_approval,
        COUNT(*) FILTER (WHERE status = 'approved') as approved,
        COUNT(*) FILTER (WHERE status = 'rejected') as rejected,
        COUNT(*) FILTER (WHERE has_redirected = TRUE AND screenshot_url IS NULL) as redirected_only,
        COUNT(*) FILTER (WHERE has_redirected = FALSE AND screenshot_url IS NULL) as details_only
    FROM swiggy_orders;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION update_order_status(
    order_id UUID,
    new_status VARCHAR(20)
)
RETURNS BOOLEAN AS $$
BEGIN
    UPDATE swiggy_orders 
    SET status = new_status, updated_at = NOW()
    WHERE id = order_id;
    
    RETURN FOUND;
END;
$$ LANGUAGE plpgsql;

GRANT ALL ON swiggy_orders TO anon, authenticated;
GRANT ALL ON swiggy_orders_admin_view TO anon, authenticated;
GRANT EXECUTE ON FUNCTION get_swiggy_campaign_stats() TO anon, authenticated;
GRANT EXECUTE ON FUNCTION update_order_status(UUID, VARCHAR) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION update_updated_at_column() TO anon, authenticated;
