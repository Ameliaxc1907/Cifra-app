'use client'

import { useEffect, useState, useCallback } from 'react'
import { FinanceApp } from '@/components/finance-app'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'

function usePullToRefresh(onRefresh: () => void) {
  useEffect(() => {
    let startY = 0
    let isPulling = false

    const handleTouchStart = (e: TouchEvent) => {
      if (window.scrollY === 0) {
        startY = e.touches[0].clientY
        isPulling = true
      }
    }

    const handleTouchMove = (e: TouchEvent) => {
      if (!isPulling) return
      const y = e.touches[0].clientY
      if (y - startY > 150) {
        isPulling = false
        onRefresh()
      }
    }

    const handleTouchEnd = () => {
      isPulling = false
    }

    document.addEventListener('touchstart', handleTouchStart, { passive: true })
    document.addEventListener('touchmove', handleTouchMove, { passive: true })
    document.addEventListener('touchend', handleTouchEnd, { passive: true })

    return () => {
      document.removeEventListener('touchstart', handleTouchStart)
      document.removeEventListener('touchmove', handleTouchMove)
      document.removeEventListener('touchend', handleTouchEnd)
    }
  }, [onRefresh])
}

export default function Page() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [data, setData] = useState<any>(null)

  const [showWelcome, setShowWelcome] = useState(false)
  const [firstLoadDone, setFirstLoadDone] = useState(false)

  const loadData = useCallback(async (isRefresh = false) => {
    if (!isRefresh) setLoading(true)
    else setRefreshing(true)

    try {
      const supabase = createClient()
      
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        router.push('/login')
        return
      }

      await supabase.rpc('process_recurring_transactions')

      let [
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

      if (!paymentMethods || paymentMethods.length === 0) {
        const defaults = [
          { user_id: user.id, name: 'Efectivo', type: 'cash' },
          { user_id: user.id, name: 'Tarjeta de Crédito', type: 'credit_card' },
          { user_id: user.id, name: 'Tarjeta de Débito', type: 'debit_card' },
          { user_id: user.id, name: 'Transferencia', type: 'bank_transfer' }
        ];
        const { data: newPMs } = await supabase.from('payment_methods').insert(defaults).select('*');
        if (newPMs) paymentMethods = newPMs;
      }

      const now = new Date()
      const currentMonth = now.getMonth()
      const currentYear = now.getFullYear()

      const { data: budgets } = await supabase
        .from('view_monthly_budgets')
        .select('*')
        .eq('user_id', user.id)
        .eq('month', currentMonth + 1)
        .eq('year', currentYear)

      let income = 0
      let expense = 0
      let totalBalance = 0

      if (transactions) {
        for (const t of transactions) {
          if (t.type === 'income') totalBalance += Number(t.amount)
          if (t.type === 'expense') totalBalance -= Number(t.amount)

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
        metrics: { income, expense, balance: totalBalance } // Real global balance
      })

      if (!isRefresh && !firstLoadDone) {
        setShowWelcome(true)
        setFirstLoadDone(true)
        setTimeout(() => setShowWelcome(false), 2500)
      }

    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }, [router, firstLoadDone])

  useEffect(() => {
    loadData()
  }, [loadData])

  usePullToRefresh(() => {
    if (!refreshing && !loading) {
      loadData(true)
    }
  })

  if (loading && !data) {
    return <div className="flex flex-col h-screen items-center justify-center bg-background gap-4 animate-fade-in"><div className="w-20 h-20 rounded-3xl bg-primary text-primary-foreground flex items-center justify-center animate-pulse shadow-2xl"><svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 12V7H5a2 2 0 0 1 0-4h14v4"/><path d="M3 5v14a2 2 0 0 0 2 2h16v-5"/><path d="M18 12a2 2 0 0 0 0 4h4v-4Z"/></svg></div><p className="text-muted-foreground text-sm font-medium tracking-widest animate-pulse">CARGANDO...</p></div>
  }

  return (
    <>
      {showWelcome && data?.profile && (
        <div className="fixed inset-0 z-[200] flex flex-col items-center justify-center bg-background/95 backdrop-blur-md animate-in fade-in duration-500 animate-out fade-out fill-mode-forwards" style={{ animationDelay: '2s' }}>
          <div className="w-24 h-24 bg-primary text-primary-foreground rounded-full flex items-center justify-center text-4xl font-bold shadow-2xl shadow-primary/40 animate-in zoom-in-50 fade-in duration-700 mb-6">
            {data.profile.full_name?.charAt(0).toUpperCase() || 'U'}
          </div>
          <h1 className="text-3xl font-bold tracking-tight animate-in slide-in-from-bottom-4 fade-in duration-700 delay-150">
            ¡Hola, {data.profile.full_name?.split(' ')[0] || 'Usuario'}!
          </h1>
          <p className="text-muted-foreground mt-2 animate-in slide-in-from-bottom-4 fade-in duration-700 delay-300">
            Es bueno verte de vuelta.
          </p>
        </div>
      )}

      {refreshing && (
        <div className="fixed top-12 left-1/2 -translate-x-1/2 z-[100] bg-background w-11 h-11 flex items-center justify-center rounded-full shadow-[0_4px_16px_rgba(0,0,0,0.15)] animate-in slide-in-from-top-8 zoom-in fade-in duration-300">
          <svg className="w-6 h-6 animate-spin text-primary" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
        </div>
      )}
      <FinanceApp {...data} onRefresh={() => loadData(true)} />
    </>
  )
}
