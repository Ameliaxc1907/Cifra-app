-- ========================================================
-- SEED DATA - DEFAULT CATEGORIES
-- ========================================================
-- These categories are accessible by all users because is_default = TRUE and user_id IS NULL.
-- Users cannot modify or delete them due to RLS policies.

INSERT INTO categories (name, icon, color, type, is_default) VALUES
-- EXPENSES
('Alimentación', 'utensils', '#F59E0B', 'expense', TRUE),
('Transporte', 'bus', '#3B82F6', 'expense', TRUE),
('Vivienda', 'home', '#10B981', 'expense', TRUE),
('Servicios', 'smartphone', '#6366F1', 'expense', TRUE),
('Estudios', 'graduation-cap', '#8B5CF6', 'expense', TRUE),
('Entretenimiento', 'film', '#EC4899', 'expense', TRUE),
('Compras', 'shopping-bag', '#F43F5E', 'expense', TRUE),
('Salud', 'heart', '#EF4444', 'expense', TRUE),
('Suscripciones', 'credit-card', '#14B8A6', 'expense', TRUE),
('Otros', 'more-horizontal', '#6B7280', 'expense', TRUE),

-- INCOMES
('Sueldo', 'banknote', '#10B981', 'income', TRUE),
('Trabajo extra', 'briefcase', '#3B82F6', 'income', TRUE),
('Venta', 'tag', '#F59E0B', 'income', TRUE),
('Transferencia', 'arrow-right-left', '#8B5CF6', 'income', TRUE),
('Regalo', 'gift', '#EC4899', 'income', TRUE),
('Otros', 'more-horizontal', '#6B7280', 'income', TRUE);
