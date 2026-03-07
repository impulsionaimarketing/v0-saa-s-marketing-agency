-- Create dashboard_views table
CREATE TABLE IF NOT EXISTS dashboard_views (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  company_id uuid,
  user_id uuid,
  context varchar(50) NOT NULL,
  name varchar(255) NOT NULL,
  visible_metrics jsonb NOT NULL,
  is_default boolean DEFAULT false,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Create indexes for faster queries
CREATE INDEX IF NOT EXISTS idx_dashboard_views_context ON dashboard_views(context);
CREATE INDEX IF NOT EXISTS idx_dashboard_views_company_id ON dashboard_views(company_id);
CREATE INDEX IF NOT EXISTS idx_dashboard_views_user_id ON dashboard_views(user_id);
CREATE INDEX IF NOT EXISTS idx_dashboard_views_is_default ON dashboard_views(is_default);

-- Add comment to table
COMMENT ON TABLE dashboard_views IS 'Stores personalized dashboard view configurations per context and user';
