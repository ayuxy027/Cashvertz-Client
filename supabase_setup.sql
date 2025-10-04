-- Supabase SQL Setup for Swiggy Campaign
-- Run these queries in the Supabase SQL Editor

-- DROP ALL EXISTING TABLES AND OBJECTS FIRST
-- This ensures a clean setup

-- Drop everything in correct order to avoid dependency issues
-- Use CASCADE to drop dependent objects automatically
DROP SCHEMA IF EXISTS public CASCADE;
CREATE SCHEMA public;
GRANT USAGE ON SCHEMA public TO anon, authenticated;

-- Drop storage bucket (if exists)
-- Note: This will be handled in Supabase Dashboard > Storage

-- 1. Create swiggy_orders table for the new campaign
CREATE TABLE IF NOT EXISTS swiggy_orders (
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

-- 2. Add unique constraint on UPI ID to prevent duplicates
ALTER TABLE swiggy_orders ADD CONSTRAINT unique_upi_id UNIQUE (upi_id);

-- 3. Add unique constraint on mobile number to prevent multiple orders per user
ALTER TABLE swiggy_orders ADD CONSTRAINT unique_mobile_number UNIQUE (mobile_number);

-- 4. Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_swiggy_orders_status ON swiggy_orders(status);
CREATE INDEX IF NOT EXISTS idx_swiggy_orders_created_at ON swiggy_orders(created_at);
CREATE INDEX IF NOT EXISTS idx_swiggy_orders_mobile ON swiggy_orders(mobile_number);

-- 5. Create a view for admin dashboard with progress tracking
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

-- 6. Create function to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- 7. Create trigger to automatically update updated_at
CREATE TRIGGER update_swiggy_orders_updated_at 
    BEFORE UPDATE ON swiggy_orders 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- 8. Create storage bucket for screenshots (run this in Supabase Dashboard > Storage)
-- INSERT INTO storage.buckets (id, name, public) VALUES ('swiggy-screenshots', 'swiggy-screenshots', true);

-- 9. Set up Row Level Security (RLS) policies
ALTER TABLE swiggy_orders ENABLE ROW LEVEL SECURITY;

-- Allow public to insert orders (for form submissions)
CREATE POLICY "Allow public to insert swiggy orders" ON swiggy_orders
    FOR INSERT WITH CHECK (true);

-- Allow public to select their own orders (for status checking)
CREATE POLICY "Allow users to view their own orders" ON swiggy_orders
    FOR SELECT USING (true);

-- Allow admin to view all orders (you'll need to set up admin role)
CREATE POLICY "Allow admin to view all swiggy orders" ON swiggy_orders
    FOR ALL USING (true);

-- 10. Create statistics function for admin dashboard
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

-- 11. Create function to approve/reject orders
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

-- 12. Sample data for testing (optional - remove in production)
INSERT INTO swiggy_orders (user_name, mobile_number, upi_id, has_redirected, screenshot_url, status) VALUES
('John Doe', '9876543210', 'john@paytm', TRUE, 'https://example.com/screenshot1.jpg', 'submitted'),
('Jane Smith', '9876543211', 'jane@phonepe', TRUE, NULL, 'submitted'),
('Bob Johnson', '9876543212', 'bob@googlepay', TRUE, 'https://example.com/screenshot2.jpg', 'approved'),
('Alice Brown', '9876543213', 'alice@paytm', FALSE, NULL, 'submitted');

-- 13. Grant necessary permissions
GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT ALL ON swiggy_orders TO anon, authenticated;
GRANT ALL ON swiggy_orders_admin_view TO anon, authenticated;
GRANT EXECUTE ON FUNCTION get_swiggy_campaign_stats() TO anon, authenticated;
GRANT EXECUTE ON FUNCTION update_order_status(UUID, VARCHAR) TO anon, authenticated;

-- 14. Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_swiggy_orders_upi ON swiggy_orders(upi_id);
CREATE INDEX IF NOT EXISTS idx_swiggy_orders_has_redirected ON swiggy_orders(has_redirected);

-- 15. Create a function to get user progress
CREATE OR REPLACE FUNCTION get_user_progress(user_mobile VARCHAR(10))
RETURNS TABLE (
    order_id UUID,
    user_name VARCHAR(100),
    mobile_number VARCHAR(10),
    upi_id VARCHAR(100),
    has_redirected BOOLEAN,
    has_screenshot BOOLEAN,
    status VARCHAR(20),
    progress_stage TEXT,
    created_at TIMESTAMP WITH TIME ZONE,
    updated_at TIMESTAMP WITH TIME ZONE
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        id,
        user_name,
        mobile_number,
        upi_id,
        has_redirected,
        (screenshot_url IS NOT NULL) as has_screenshot,
        status,
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
    WHERE mobile_number = user_mobile
    ORDER BY created_at DESC;
END;
$$ LANGUAGE plpgsql;

-- Grant permission for the new function
GRANT EXECUTE ON FUNCTION get_user_progress(VARCHAR) TO anon, authenticated;
