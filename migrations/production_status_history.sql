-- Create production_status_history table
CREATE TABLE IF NOT EXISTS production_status_history (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    production_id UUID NOT NULL REFERENCES productions(id) ON DELETE CASCADE,
    old_status TEXT NOT NULL,
    new_status TEXT NOT NULL,
    changed_by TEXT NOT NULL,
    changed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_production_status_history_production_id 
    ON production_status_history(production_id);

-- Create index for chronological ordering
CREATE INDEX IF NOT EXISTS idx_production_status_history_changed_at 
    ON production_status_history(changed_at DESC);

-- Add comments
COMMENT ON TABLE production_status_history IS 'Tracks all status changes for productions';
COMMENT ON COLUMN production_status_history.production_id IS 'Foreign key to production';
COMMENT ON COLUMN production_status_history.old_status IS 'Previous status before change';
COMMENT ON COLUMN production_status_history.new_status IS 'New status after change';
COMMENT ON COLUMN production_status_history.changed_by IS 'User who made the change';
COMMENT ON COLUMN production_status_history.changed_at IS 'Timestamp when status was changed';