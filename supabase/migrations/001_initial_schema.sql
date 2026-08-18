-- 0. UPDATED_AT TRIGGER FUNCTION
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 1. PROFILES
CREATE TABLE profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    full_name TEXT,
    avatar_url TEXT,
    currency TEXT NOT NULL DEFAULT 'USD',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE TRIGGER set_profiles_updated_at
BEFORE UPDATE ON profiles
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- 2. CATEGORIES
CREATE TABLE categories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    icon TEXT NOT NULL,
    color TEXT,
    type TEXT NOT NULL CHECK (type IN ('expense', 'income')),
    is_default BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    -- Constraint: Default categories must not have a user, custom must have one.
    CHECK ((is_default = TRUE AND user_id IS NULL) OR (is_default = FALSE AND user_id IS NOT NULL))
);
-- Prevent duplicates for user categories
CREATE UNIQUE INDEX idx_categories_unique_user ON categories(user_id, name, type) WHERE user_id IS NOT NULL;
-- Prevent duplicates for default categories
CREATE UNIQUE INDEX idx_categories_unique_default ON categories(name, type) WHERE user_id IS NULL;

-- 3. PAYMENT METHODS
CREATE TABLE payment_methods (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    type TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(user_id, name)
);

-- 4. RECURRING TRANSACTIONS
CREATE TABLE recurring_transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    category_id UUID NOT NULL REFERENCES categories(id) ON DELETE RESTRICT,
    payment_method_id UUID REFERENCES payment_methods(id) ON DELETE SET NULL,
    type TEXT NOT NULL CHECK (type IN ('expense', 'income')),
    name TEXT NOT NULL,
    amount NUMERIC(12,2) NOT NULL CHECK (amount > 0),
    frequency TEXT NOT NULL CHECK (frequency IN ('weekly', 'monthly', 'yearly')),
    start_date DATE NOT NULL,
    next_execution_date DATE NOT NULL,
    end_date DATE,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CHECK (next_execution_date >= start_date),
    CHECK (end_date IS NULL OR end_date >= start_date)
);
CREATE TRIGGER set_recurring_updated_at
BEFORE UPDATE ON recurring_transactions
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- 5. TRANSACTIONS
CREATE TABLE transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    category_id UUID NOT NULL REFERENCES categories(id) ON DELETE RESTRICT,
    payment_method_id UUID REFERENCES payment_methods(id) ON DELETE SET NULL,
    type TEXT NOT NULL CHECK (type IN ('expense', 'income')),
    amount NUMERIC(12,2) NOT NULL CHECK (amount > 0),
    description TEXT NOT NULL,
    notes TEXT,
    transaction_date TIMESTAMPTZ NOT NULL,
    receipt_url TEXT,
    recurring_transaction_id UUID REFERENCES recurring_transactions(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE TRIGGER set_transactions_updated_at
BEFORE UPDATE ON transactions
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- 6. BUDGETS
CREATE TABLE budgets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    category_id UUID NOT NULL REFERENCES categories(id) ON DELETE CASCADE,
    amount_limit NUMERIC(12,2) NOT NULL CHECK (amount_limit > 0),
    month INTEGER NOT NULL CHECK (month BETWEEN 1 AND 12),
    year INTEGER NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(user_id, category_id, month, year)
);
CREATE TRIGGER set_budgets_updated_at
BEFORE UPDATE ON budgets
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- 7. SAVINGS GOALS
CREATE TABLE savings_goals (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    target_amount NUMERIC(12,2) NOT NULL CHECK (target_amount > 0),
    initial_amount NUMERIC(12,2) NOT NULL DEFAULT 0 CHECK (initial_amount >= 0),
    target_date DATE,
    status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'completed', 'cancelled')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE TRIGGER set_savings_goals_updated_at
BEFORE UPDATE ON savings_goals
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- 8. SAVINGS GOAL CONTRIBUTIONS
CREATE TABLE savings_goal_contributions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    goal_id UUID NOT NULL REFERENCES savings_goals(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    amount NUMERIC(12,2) NOT NULL CHECK (amount > 0),
    contribution_date TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ========================================================
-- RLS (ROW LEVEL SECURITY)
-- ========================================================
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE payment_methods ENABLE ROW LEVEL SECURITY;
ALTER TABLE recurring_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE budgets ENABLE ROW LEVEL SECURITY;
ALTER TABLE savings_goals ENABLE ROW LEVEL SECURITY;
ALTER TABLE savings_goal_contributions ENABLE ROW LEVEL SECURITY;

-- profiles
CREATE POLICY "Users can view own profile" ON profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update own profile" ON profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Users can insert own profile" ON profiles FOR INSERT WITH CHECK (auth.uid() = id);
CREATE POLICY "Users can delete own profile" ON profiles FOR DELETE USING (auth.uid() = id);

-- categories
CREATE POLICY "Users can view own and system categories" ON categories FOR SELECT USING (auth.uid() = user_id OR is_default = TRUE);
CREATE POLICY "Users can insert own categories" ON categories FOR INSERT WITH CHECK (auth.uid() = user_id AND is_default = FALSE);
CREATE POLICY "Users can update own categories" ON categories FOR UPDATE USING (auth.uid() = user_id AND is_default = FALSE);
CREATE POLICY "Users can delete own categories" ON categories FOR DELETE USING (auth.uid() = user_id AND is_default = FALSE);

-- payment_methods
CREATE POLICY "Users can view own payment_methods" ON payment_methods FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own payment_methods" ON payment_methods FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own payment_methods" ON payment_methods FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own payment_methods" ON payment_methods FOR DELETE USING (auth.uid() = user_id);

-- recurring_transactions
CREATE POLICY "Users can view own recurring_transactions" ON recurring_transactions FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own recurring_transactions" ON recurring_transactions FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own recurring_transactions" ON recurring_transactions FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own recurring_transactions" ON recurring_transactions FOR DELETE USING (auth.uid() = user_id);

-- transactions
CREATE POLICY "Users can view own transactions" ON transactions FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own transactions" ON transactions FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own transactions" ON transactions FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own transactions" ON transactions FOR DELETE USING (auth.uid() = user_id);

-- budgets
CREATE POLICY "Users can view own budgets" ON budgets FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own budgets" ON budgets FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own budgets" ON budgets FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own budgets" ON budgets FOR DELETE USING (auth.uid() = user_id);

-- savings_goals
CREATE POLICY "Users can view own savings_goals" ON savings_goals FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own savings_goals" ON savings_goals FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own savings_goals" ON savings_goals FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own savings_goals" ON savings_goals FOR DELETE USING (auth.uid() = user_id);

-- savings_goal_contributions
CREATE POLICY "Users can view own savings_goal_contributions" ON savings_goal_contributions FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own savings_goal_contributions" ON savings_goal_contributions FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own savings_goal_contributions" ON savings_goal_contributions FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own savings_goal_contributions" ON savings_goal_contributions FOR DELETE USING (auth.uid() = user_id);

-- ========================================================
-- VIEWS
-- ========================================================

-- View for Budgets with Used Amount
CREATE OR REPLACE VIEW view_monthly_budgets WITH (security_invoker = true) AS
SELECT 
    b.id,
    b.user_id,
    b.category_id,
    c.name AS category_name,
    c.icon AS category_icon,
    c.color AS category_color,
    b.amount_limit,
    b.month,
    b.year,
    COALESCE(SUM(t.amount), 0) AS used_amount,
    CASE 
        WHEN b.amount_limit > 0 THEN 
            ROUND((COALESCE(SUM(t.amount), 0) / b.amount_limit) * 100, 2)
        ELSE 0 
    END AS used_percentage
FROM 
    budgets b
JOIN 
    categories c ON b.category_id = c.id
LEFT JOIN 
    transactions t ON b.category_id = t.category_id 
                   AND b.user_id = t.user_id 
                   AND EXTRACT(MONTH FROM t.transaction_date) = b.month
                   AND EXTRACT(YEAR FROM t.transaction_date) = b.year
                   AND t.type = 'expense'
GROUP BY 
    b.id, b.user_id, b.category_id, c.name, c.icon, c.color, b.amount_limit, b.month, b.year;

-- View for Savings Goals with Progress
CREATE OR REPLACE VIEW view_savings_goals_progress WITH (security_invoker = true) AS
SELECT 
    g.id,
    g.user_id,
    g.name,
    g.target_amount,
    g.initial_amount,
    g.target_date,
    g.status,
    COALESCE(SUM(c.amount), 0) AS contributed_amount,
    (g.initial_amount + COALESCE(SUM(c.amount), 0)) AS current_amount,
    CASE 
        WHEN g.target_amount > 0 THEN 
            ROUND(((g.initial_amount + COALESCE(SUM(c.amount), 0)) / g.target_amount) * 100, 2)
        ELSE 0 
    END AS progress_percentage
FROM 
    savings_goals g
LEFT JOIN 
    savings_goal_contributions c ON g.id = c.goal_id
GROUP BY 
    g.id, g.user_id, g.name, g.target_amount, g.initial_amount, g.target_date, g.status;

-- ========================================================
-- INDEXES FOR PERFORMANCE
-- ========================================================
CREATE INDEX idx_transactions_user_id ON transactions(user_id);
CREATE INDEX idx_transactions_category_id ON transactions(category_id);
CREATE INDEX idx_transactions_date ON transactions(transaction_date);
CREATE INDEX idx_transactions_type ON transactions(type);

CREATE INDEX idx_budgets_user_id ON budgets(user_id);
CREATE INDEX idx_budgets_user_month_year ON budgets(user_id, month, year);

CREATE INDEX idx_savings_goals_user_id ON savings_goals(user_id);
CREATE INDEX idx_savings_goal_contributions_goal_id ON savings_goal_contributions(goal_id);

CREATE INDEX idx_recurring_user_id ON recurring_transactions(user_id);
CREATE INDEX idx_recurring_next_date ON recurring_transactions(next_execution_date);

CREATE INDEX idx_categories_user_id ON categories(user_id);
CREATE INDEX idx_payment_methods_user_id ON payment_methods(user_id);
