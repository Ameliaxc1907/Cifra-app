'use client'

import { useEffect, useState } from 'react'
import { FinanceApp } from '@/components/finance-app'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'

export default function Page() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [data, setData] = useState<any>(null)

  useEffect(() => {
    async function loadData() {
      const supabase = createClient()
      
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        router.push('/login')
        return
      }

      // Process recurring transactions Just-in-Time
      await supabase.rpc('process_recurring_transactions')

      const [
        { data: profile },
        { data: categories },
        { data: paymentMethods },
        { data: transactions },
        { data: goals },
        { data: contributions },
        { data: recurring }
      ] = await Promise.all([
        supabase.from('profiles').select('*').eq('id', user.id).single(),
        supabase.from('categories').select('*').order('created_at', { ascending: false }),
        supabase.from('payment_methods').select('*').eq('user_id', user.id).order('created_at', { ascending: false }),
        supabase.from('transactions').select(`*, category:categories (name, icon, color), payment_method:payment_methods (name)`).eq('user_id', user.id).order('transaction_date', { ascending: false }),
        supabase.from('view_savings_goals_progress').select('*').eq('user_id', user.id).order('target_date', { ascending: true }),
        supabase.from('savings_goal_contributions').select('*').eq('user_id', user.id).order('contribution_date', { ascending: false }),
        supabase.from('recurring_transactions').select(`*, category:categories (name, icon, color), payment_method:payment_methods (name)`).eq('user_id', user.id).order('next_execution_date', { ascending: true })
      ])

      // Budgets calculation (current month)
      const now = new Date()
      const currentMonth = now.getMonth()
      const currentYear = now.getFullYear()

      const { data: budgets } = await supabase
        .from('view_monthly_budgets')
        .select('*')
        .eq('user_id', user.id)
        .eq('month', currentMonth + 1)
        .eq('year', currentYear)

      // Metrics calculation
      let income = 0
      let expense = 0
      if (transactions) {
        for (const t of transactions) {
          const d = new Date(t.transaction_date)
          if (d.getMonth() === currentMonth && d.getFullYear() === currentYear) {
            if (t.type === 'income') income += Number(t.amount)
            if (t.type === 'expense') expense += Number(t.amount)
          }
        }
      }

      setData({
        profile: { ...profile, email: user.email },
        categories: categories || [],
        paymentMethods: paymentMethods || [],
        transactions: transactions || [],
        budgets: budgets || [],
        goals: goals || [],
        contributions: contributions || [],
        recurring: recurring || [],
        metrics: { income, expense, balance: income - expense }
      })
      
      setLoading(false)
    }

    loadData()
  }, [router])

  if (loading) {
    return <div className="flex h-screen items-center justify-center"><div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div></div>
  }

  return <FinanceApp {...data} />
}
