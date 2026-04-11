-- Add pdf_url column to monthly_plannings table
ALTER TABLE monthly_plannings 
ADD COLUMN IF NOT EXISTS pdf_url TEXT DEFAULT NULL;

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_monthly_plannings_pdf_url 
ON monthly_plannings(pdf_url) 
WHERE pdf_url IS NOT NULL;
