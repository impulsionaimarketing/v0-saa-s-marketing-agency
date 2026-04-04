-- Update the generate_monthly_payments function to only include active clients
-- This ensures that clients with status 'Pausado' or 'Cancelado' are excluded

-- First, drop the existing function to allow changing the return type
DROP FUNCTION IF EXISTS generate_monthly_payments(INTEGER, INTEGER);

CREATE OR REPLACE FUNCTION generate_monthly_payments(p_month INTEGER, p_year INTEGER)
RETURNS TABLE(success BOOLEAN, message TEXT, created_count INTEGER) AS $$
DECLARE
    v_client RECORD;
    v_due_date DATE;
    v_created_count INTEGER := 0;
    v_exists BOOLEAN;
BEGIN
    -- Create the due date for the month (using payment_day from client or default to 10)
    FOR v_client IN 
        SELECT id, name, monthly_fee, COALESCE(payment_day, 10) as payment_day
        FROM clients 
        WHERE status = 'Ativo' 
          AND monthly_fee IS NOT NULL 
          AND monthly_fee > 0
    LOOP
        -- Calculate due date
        v_due_date := make_date(p_year, p_month, LEAST(v_client.payment_day, 
            EXTRACT(DAY FROM (make_date(p_year, p_month, 1) + INTERVAL '1 month - 1 day'))::INTEGER));
        
        -- Check if payment already exists for this client and month
        SELECT EXISTS(
            SELECT 1 FROM payments 
            WHERE client_id = v_client.id 
              AND EXTRACT(MONTH FROM due_date) = p_month
              AND EXTRACT(YEAR FROM due_date) = p_year
        ) INTO v_exists;
        
        -- Only create if not exists
        IF NOT v_exists THEN
            INSERT INTO payments (client_id, due_date, amount, is_paid)
            VALUES (v_client.id, v_due_date, v_client.monthly_fee, FALSE);
            v_created_count := v_created_count + 1;
        END IF;
    END LOOP;
    
    IF v_created_count > 0 THEN
        RETURN QUERY SELECT TRUE, format('%s pagamentos criados para %s/%s', v_created_count, p_month, p_year), v_created_count;
    ELSE
        RETURN QUERY SELECT TRUE, format('Nenhum pagamento novo para criar em %s/%s', p_month, p_year), 0;
    END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
