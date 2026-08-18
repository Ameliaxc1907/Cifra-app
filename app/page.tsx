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
    return <div className="flex flex-col h-screen items-center justify-center bg-background gap-4 animate-fade-in"><div className="w-20 h-20 rounded-3xl bg-primary text-primary-foreground flex items-center justify-center animate-pulse shadow-2xl"><svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 12V7H5a2 2 0 0 1 0-4h14v4"/><path d="M3 5v14a2 2 0 0 0 2 2h16v-5"/><path d="M18 12a2 2 0 0 0 0 4h4v-4Z"/></svg></div><p className="text-muted-foreground text-sm font-medium tracking-widest animate-pulse">CARGANDO...</p></div>
  }

  return <FinanceApp {...data} />
}
