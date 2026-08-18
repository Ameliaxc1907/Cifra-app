-- Migration to add recurring transactions processor RPC

CREATE OR REPLACE FUNCTION process_recurring_transactions()
RETURNS void
LANGUAGE plpgsql
AS $$
DECLARE
    r RECORD;
    new_next_date DATE;
    current_exec DATE;
BEGIN
    FOR r IN 
        SELECT * FROM recurring_transactions 
        WHERE is_active = true 
          AND next_execution_date <= CURRENT_DATE
    LOOP
        current_exec := r.next_execution_date;
        
        WHILE current_exec <= CURRENT_DATE AND (r.end_date IS NULL OR current_exec <= r.end_date) LOOP
            -- Insert transaction
            INSERT INTO transactions (
                user_id, category_id, payment_method_id, type, amount, description, transaction_date, recurring_transaction_id
            ) VALUES (
                r.user_id, r.category_id, r.payment_method_id, r.type, r.amount, r.name, current_exec, r.id
            );
            
            -- Calculate next date
            IF r.frequency = 'weekly' THEN
                current_exec := current_exec + INTERVAL '1 week';
            ELSIF r.frequency = 'monthly' THEN
                current_exec := current_exec + INTERVAL '1 month';
            ELSIF r.frequency = 'yearly' THEN
                current_exec := current_exec + INTERVAL '1 year';
            ELSE
                current_exec := current_exec + INTERVAL '1 month';
            END IF;
        END LOOP;
        
        -- Update the recurring record
        IF r.end_date IS NOT NULL AND current_exec > r.end_date THEN
            UPDATE recurring_transactions 
            SET next_execution_date = current_exec, is_active = false 
            WHERE id = r.id;
        ELSE
            UPDATE recurring_transactions 
            SET next_execution_date = current_exec 
            WHERE id = r.id;
        END IF;

    END LOOP;
END;
$$;
