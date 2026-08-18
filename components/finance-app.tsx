'use client'

import { useMemo, useState, useTransition, useEffect } from 'react'
import {
  ArrowLeft, ArrowRight, Bell, CalendarDays, Camera, Check, ChevronRight, CircleDollarSign,
  Download, Eye, EyeOff, FileText, Flag, Home, Lightbulb, LockKeyhole, LogOut, Menu, Moon,
  MoreHorizontal, Pencil, PieChart, Plus, Receipt, Search, Settings2, Shield, Sparkles, Sun,
  Target, Trash2, TrendingDown, TrendingUp, User, Wallet, X,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { getIcon } from '@/lib/icons'
import { createTransaction, deleteTransaction, createBudget, deleteBudget, createGoal, deleteGoal, createContribution, createRecurringTransaction, deleteRecurringTransaction, toggleRecurringActive } from '@/lib/api'
import { getPeriodRange, filterTransactionsByRange, calculateMetrics, getCategoryBreakdown, generateInsights, getChartPath, Period } from '@/lib/report-utils'

type Screen = 'home' | 'movements' | 'budgets' | 'profile' | 'goals' | 'reports' | 'summary' | 'recurring' | 'calendar' | 'payments'
type Entry = 'app'

const money = (value: number) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(Math.abs(value))

function Logo() {
  return <div className="flex items-center gap-2 font-semibold tracking-tight"><span className="grid size-9 place-items-center rounded-xl bg-primary text-primary-foreground"><Wallet /></span><span className="text-xl">Cifra</span></div>
}

function Header({ title, subtitle, back, onBack, action }: { title: string; subtitle?: string; back?: boolean; onBack?: () => void; action?: React.ReactNode }) {
  return <header className="page-header"><div className="flex items-center gap-3">{back && <Button variant="ghost" size="icon" onClick={onBack} aria-label="Volver"><ArrowLeft /></Button>}<div><h1>{title}</h1>{subtitle && <p>{subtitle}</p>}</div></div>{action}</header>
}

function BalanceChart({ transactions, period }: { transactions: any[], period: Period }) {
  const range = getPeriodRange(period, 0)
  const path = getChartPath(transactions || [], period, range)
  
  return <div className="chart-wrap"><div className="chart-label"><span>Actividad</span><b>{period}</b></div><svg viewBox="0 0 340 110" role="img"><defs><linearGradient id="fill" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="var(--primary)" stopOpacity=".25"/><stop offset="1" stopColor="var(--primary)" stopOpacity="0"/></linearGradient></defs><path className="chart-area" d={`${path} L340 110 L0 110Z`}/><path className="chart-line" d={path}/></svg><div className="chart-axis">{range.labels.map((l, i) => <span key={i}>{l}</span>)}</div></div>
}

function TransactionRow({ item, onClick }: { item: any; onClick?: () => void }) {
  const Icon = getIcon(item.category?.icon || 'circle-dollar-sign')
  const isIncome = item.type === 'income'
  const amount = Number(item.amount)
  
  const date = new Date(item.transaction_date)
  const time = date.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})
  const categoryName = item.category?.name || 'Desconocido'
  
  return <button className="transaction-row" onClick={onClick}><span className={`transaction-icon ${isIncome ? 'income' : ''}`}><Icon /></span><span className="transaction-copy"><b>{item.description}</b><small>{categoryName} · {time}</small></span><span className={isIncome ? 'amount income-text' : 'amount'}>{isIncome ? '+' : '−'}{money(amount)}</span></button>
}

function getDayGroup(dateString: string) {
  const date = new Date(dateString)
  const today = new Date()
  const yesterday = new Date(today)
  yesterday.setDate(yesterday.getDate() - 1)
  
  if (date.toDateString() === today.toDateString()) return 'HOY'
  if (date.toDateString() === yesterday.toDateString()) return 'AYER'
  
  return date.toLocaleDateString('es-ES', { day: 'numeric', month: 'short' }).toUpperCase()
}

function HomeScreen({ navigate, openAdd, openDetail, profile, metrics, transactions }: any) {
  const [show, setShow] = useState(true)
  const firstName = profile?.full_name ? profile.full_name.split(' ')[0] : 'Usuario'
  const initials = profile?.full_name ? profile.full_name.substring(0, 2).toUpperCase() : 'US'
  
  const currentMonth = getPeriodRange('Mes', 0)
  const thisMonthT = filterTransactionsByRange(transactions || [], currentMonth.start, currentMonth.end)
  const breakdown = getCategoryBreakdown(thisMonthT)
  
  return <><header className="home-header"><div><p>Buenos días, {firstName}</p><h1>Tu panorama financiero</h1></div><div className="flex items-center gap-2"><Button variant="ghost" size="icon" aria-label="Notificaciones"><Bell /></Button><button className="avatar" onClick={() => navigate('profile')}>{initials}</button></div></header><section className="balance-card"><div className="balance-top"><div><span>Balance del mes</span><strong>{show ? money(metrics.balance || 0) : '••••••'}</strong></div><button onClick={() => setShow(!show)} aria-label="Mostrar u ocultar saldo">{show ? <EyeOff/> : <Eye/>}</button></div><div className="balance-metrics"><div><TrendingUp/><span>Ingresos</span><b>{money(metrics.income || 0)}</b></div><div><TrendingDown/><span>Gastos</span><b>{money(metrics.expense || 0)}</b></div><div><Sparkles/><span>Ahorro</span><b>{money(metrics.balance || 0)}</b></div></div></section><div className="quick-actions"><button onClick={openAdd}><Plus/><span>Registrar</span></button><button onClick={() => navigate('budgets')}><PieChart/><span>Presupuesto</span></button><button onClick={() => navigate('goals')}><Target/><span>Metas</span></button><button onClick={() => navigate('reports')}><FileText/><span>Reportes</span></button></div><BalanceChart transactions={transactions} period="Mes"/><section className="insight"><span><Lightbulb /></span><div><p>ANÁLISIS DE CIFRA</p><b>{breakdown[0]?.name ? `${breakdown[0].name} es tu mayor gasto` : 'No hay gastos recientes'}</b><small>Revisa tus reportes para más detalles.</small></div><ChevronRight onClick={() => navigate('reports')} className="cursor-pointer"/></section><section className="section-block"><div className="section-title"><div><p>Categorías</p><h2>Resumen de gastos</h2></div><button onClick={() => navigate('reports')}>Ver reporte</button></div><div className="category-grid">
  {breakdown.slice(0,4).map((c) => { 
    const Icon = getIcon(c.icon); 
    return <div className="category-card" key={c.name}><span><Icon /></span><div><small>{c.name}</small><b>${c.amount}</b></div><em>{c.percent}%</em></div>
  })}
  {breakdown.length === 0 && <p className="text-sm text-muted-foreground col-span-2 py-4">No hay gastos este mes.</p>}
  </div></section><section className="section-block"><div className="section-title"><h2>Movimientos recientes</h2><button onClick={() => navigate('movements')}>Ver todos</button></div>
  {transactions?.length > 0 ? (
    <div className="list-card">{transactions.slice(0,4).map((t: any) => <TransactionRow key={t.id} item={t} onClick={() => openDetail({ type: 'movement', data: t })} />)}</div>
  ) : (
    <div className="p-8 text-center text-muted-foreground border rounded-xl bg-card">
      <Receipt className="mx-auto mb-2 opacity-50" size={32} />
      <p className="text-sm">No tienes movimientos recientes.</p>
      <Button variant="link" onClick={openAdd} className="mt-2 h-auto p-0">Registrar el primero</Button>
    </div>
  )}
  </section></>
}

function MovementsScreen({ openDetail, transactions }: any) {
  const [filter, setFilter] = useState('Todos'); const [query, setQuery] = useState('')
  const list = useMemo(() => {
    return (transactions || []).filter((t: any) => {
      const matchFilter = filter === 'Todos' || (filter === 'Gastos' ? t.type === 'expense' : t.type === 'income')
      const matchQuery = t.description.toLowerCase().includes(query.toLowerCase()) || t.category?.name.toLowerCase().includes(query.toLowerCase())
      return matchFilter && matchQuery
    })
  }, [transactions, filter, query])
  
  const totalBalance = list.reduce((acc: number, t: any) => acc + (t.type === 'income' ? Number(t.amount) : -Number(t.amount)), 0)
  
  const grouped: Record<string, any[]> = {}
  list.forEach((t: any) => {
    const day = getDayGroup(t.transaction_date)
    if (!grouped[day]) grouped[day] = []
    grouped[day].push(t)
  })
  
  return <><Header title="Movimientos" subtitle="Historial completo" action={<Button variant="outline" size="icon" aria-label="Filtros"><Settings2/></Button>}/><div className="search"><Search/><input value={query} onChange={e => setQuery(e.target.value)} placeholder="Buscar movimientos" /></div><div className="segmented">{['Todos','Gastos','Ingresos'].map(v => <button className={filter === v ? 'active' : ''} onClick={() => setFilter(v)} key={v}>{v}</button>)}</div><div className="movement-summary"><span><small>Balance del periodo</small><b className={totalBalance >= 0 ? 'income-text' : ''}>{totalBalance >= 0 ? '+' : '−'}{money(totalBalance)}</b></span><i/><span><small>{list.length} movimientos</small></span></div>
  
  {Object.keys(grouped).length > 0 ? Object.keys(grouped).map(day => (
    <section className="day-group" key={day}><p>{day}</p><div className="list-card">{grouped[day].map((t: any)=><TransactionRow item={t} key={t.id} onClick={()=>openDetail({ type: 'movement', data: t })}/>)}</div></section>
  )) : (
    <div className="p-8 text-center text-muted-foreground border rounded-xl bg-card mt-4">
      <p className="text-sm">No se encontraron movimientos.</p>
    </div>
  )}
  </>
}

function BudgetsScreen({ onCreate, budgets, openDetail }: any) {
  const totalLimit = budgets?.reduce((acc: number, b: any) => acc + Number(b.amount_limit), 0) || 0
  const totalUsed = budgets?.reduce((acc: number, b: any) => acc + Number(b.used_amount), 0) || 0
  const remaining = Math.max(totalLimit - totalUsed, 0)
  const totalPercent = totalLimit > 0 ? (totalUsed / totalLimit) * 100 : 0
  
  return <><Header title="Presupuestos" subtitle="Mes actual" action={<Button size="icon" onClick={onCreate} aria-label="Crear presupuesto"><Plus/></Button>}/><section className="budget-overview"><small>Presupuesto total</small><div><strong>{money(totalUsed)}</strong><span>de {money(totalLimit)}</span></div><div className="progress"><i style={{width:`${Math.min(totalPercent,100)}%`}}/></div><p>Te quedan <b>{money(remaining)}</b> para este mes</p></section><div className="status-key"><span><i className="ok"/>Normal</span><span><i className="near"/>Cerca</span><span><i className="over"/>Superado</span></div><div className="budget-list">
  {budgets?.length > 0 ? budgets.map((b: any) => {
    const Icon = getIcon(b.category_icon || 'pie-chart')
    const p = Number(b.used_percentage)
    return <article key={b.id} onClick={() => openDetail({ type: 'budget', data: b })} className="cursor-pointer"><div className="budget-row"><span className="transaction-icon"><Icon/></span><div><b>{b.category_name}</b><small>{money(b.used_amount)} de {money(b.amount_limit)}</small></div><em className={p>100?'over-text':p>85?'near-text':''}>{p}%</em></div><div className={`progress ${p>100?'over':p>85?'near':''}`}><i style={{width:`${Math.min(p,100)}%`}}/></div></article>
  }) : (
    <div className="p-8 text-center text-muted-foreground border rounded-xl bg-card">
      <PieChart className="mx-auto mb-2 opacity-50" size={32} />
      <p className="text-sm">No has creado presupuestos.</p>
    </div>
  )}
  </div></>
}

function GoalsScreen({ back, onCreate, goals, openDetail }: any) { 
  const totalSaved = goals?.reduce((acc: number, g: any) => acc + Number(g.current_amount), 0) || 0
  const firstGoal = goals?.[0]
  
  return <><Header title="Metas de ahorro" subtitle={`${money(totalSaved)} ahorrados en total`} back onBack={back} action={<Button size="icon" onClick={onCreate}><Plus/></Button>}/>
  {firstGoal && (
    <section className="hero-goal cursor-pointer" onClick={() => openDetail({ type: 'goal', data: firstGoal })}><Flag/><small>PRÓXIMA META</small><h2>{firstGoal.name}</h2><div><strong>{money(firstGoal.current_amount)}</strong><span> de {money(firstGoal.target_amount)}</span></div><div className="progress"><i style={{width:`${Math.min(firstGoal.progress_percentage, 100)}%`}}/></div><p>Faltan {money(firstGoal.target_amount - firstGoal.current_amount)} para alcanzarla.</p></section>
  )}
  <div className="goal-list">
  {goals?.length > (firstGoal ? 1 : 0) ? goals.slice(firstGoal ? 1 : 0).map((g: any)=>{
    const p = Number(g.progress_percentage)
    return <article key={g.id} onClick={() => openDetail({ type: 'goal', data: g })} className="cursor-pointer"><div className="goal-ring" style={{'--p':`${Math.min(p,100)*3.6}deg`} as React.CSSProperties}><span>{p}%</span></div><div><b>{g.name}</b><small>{money(g.current_amount)} de {money(g.target_amount)}</small><em>{g.target_date ? new Date(g.target_date).toLocaleDateString() : 'Sin fecha límite'}</em></div><ChevronRight/></article>
  }) : !firstGoal ? (
    <div className="p-8 text-center text-muted-foreground border rounded-xl bg-card">
      <Target className="mx-auto mb-2 opacity-50" size={32} />
      <p className="text-sm">No has creado metas de ahorro.</p>
    </div>
  ) : null}
  </div></> 
}

function ReportsScreen({ back, navigate, transactions }: any) { 
  const [period,setPeriod]=useState<Period>('Mes'); 
  
  const currentRange = getPeriodRange(period, 0)
  const prevRange = getPeriodRange(period, -1)
  
  const currentT = filterTransactionsByRange(transactions || [], currentRange.start, currentRange.end)
  const prevT = filterTransactionsByRange(transactions || [], prevRange.start, prevRange.end)
  
  const currentM = calculateMetrics(currentT)
  const prevM = calculateMetrics(prevT)
  
  const breakdown = getCategoryBreakdown(currentT)
  const insights = generateInsights(currentM, prevM, breakdown, [])
  
  const incDiff = prevM.income > 0 ? ((currentM.income - prevM.income) / prevM.income) * 100 : 0
  const expDiff = prevM.expense > 0 ? ((currentM.expense - prevM.expense) / prevM.expense) * 100 : 0
  
  return <><Header title="Reportes" subtitle="Tu dinero, en perspectiva" back onBack={back} action={<Button variant="outline" size="icon" onClick={() => window.print()}><Download/></Button>}/><div className="segmented">{['Semana','Mes','Año'].map(v=><button key={v} className={period===v?'active':''} onClick={()=>setPeriod(v as Period)}>{v}</button>)}</div><div className="report-metrics"><article><small>Ingresos</small><b className="income-text">{money(currentM.income)}</b><span>{incDiff > 0 ? '+' : ''}{Math.round(incDiff)}%</span></article><article><small>Gastos</small><b>{money(currentM.expense)}</b><span>{expDiff > 0 ? '+' : ''}{Math.round(expDiff)}%</span></article><article><small>Ahorro</small><b>{money(currentM.balance)}</b><span>{Math.round(currentM.savingsPercent)}%</span></article></div><BalanceChart transactions={currentT} period={period}/><section className="section-block"><div className="section-title"><h2>Gastos por categoría</h2><span>{money(currentM.expense)}</span></div><div className="donut-row"><div className="donut"><span>100%<small>gastos</small></span></div>
  <div>
    {breakdown.slice(0,4).map(c=><p key={c.name}><i/>{c.name}<b>{c.percent}%</b></p>)}
    {breakdown.length === 0 && <span className="text-sm text-muted-foreground">No hay gastos en este periodo.</span>}
  </div>
  </div></section><section className="insight"><span><Sparkles/></span><div><p>COMPARATIVA</p><b>{insights.insights[0] || 'Todo en orden'}</b><small>{insights.insights[1] || ''}</small></div></section><Button variant="outline" className="h-11 w-full rounded-xl" onClick={()=>navigate('summary')}>Ver resumen mensual<ArrowRight data-icon="inline-end"/></Button></> 
}

function SummaryScreen({ back, transactions, budgets }: any) { 
  const currentRange = getPeriodRange('Mes', 0)
  const prevRange = getPeriodRange('Mes', -1)
  
  const currentT = filterTransactionsByRange(transactions || [], currentRange.start, currentRange.end)
  const prevT = filterTransactionsByRange(transactions || [], prevRange.start, prevRange.end)
  
  const currentM = calculateMetrics(currentT)
  const prevM = calculateMetrics(prevT)
  const breakdown = getCategoryBreakdown(currentT)
  const insights = generateInsights(currentM, prevM, breakdown, budgets || [])
  
  const expDiff = prevM.expense > 0 ? ((currentM.expense - prevM.expense) / prevM.expense) * 100 : 0
  
  return <><Header title="Resumen del mes" subtitle="Tu mes en 60 segundos" back onBack={back}/><section className="summary-hero"><Sparkles/><p>Este mes ahorraste</p><strong>{Math.round(currentM.savingsPercent)}%</strong><span>{money(currentM.balance)} de {money(currentM.income)}</span></section><div className="report-metrics"><article><small>Ingresos</small><b className="income-text">{money(currentM.income)}</b></article><article><small>Gastos</small><b>{money(currentM.expense)}</b></article><article><small>vs. ant.</small><b>{expDiff > 0 ? '+' : ''}{Math.round(expDiff)}%</b></article></div><section className="section-block"><div className="section-title"><h2>Lo más importante</h2></div><div className="observation-list">
    {insights.insights.map((msg, i)=><p key={i}><span>0{i+1}</span>{msg}</p>)}
  </div></section><section className="section-block"><div className="section-title"><h2>Presupuestos</h2><span>{insights.budgetsStatus.fulfilled} de {budgets?.length || 0} cumplidos</span></div><div className="summary-status">
  {budgets?.map((b: any) => {
    const isOver = Number(b.used_amount) > Number(b.amount_limit)
    return <p key={b.id} className={isOver ? 'warn' : ''}>{isOver ? <X/> : <Check/>} {b.category_name} {isOver ? 'excedido' : 'dentro del límite'}</p>
  })}
  {budgets?.length === 0 && <p className="text-muted-foreground text-sm">No creaste presupuestos este mes.</p>}
  </div></section></> 
}

function RecurringScreen({ back, onCreate, recurring, openDetail }: any) { 
  const active = recurring?.filter((r:any) => r.is_active) || []
  const total = active.reduce((acc: number, r: any) => acc + (r.type==='expense'?Number(r.amount):-Number(r.amount)), 0)
  const nextPayment = active.filter((r:any) => r.type==='expense').sort((a:any, b:any) => new Date(a.next_execution_date).getTime() - new Date(b.next_execution_date).getTime())[0]

  return <><Header title="Pagos recurrentes" subtitle={`${money(total)} al mes aprox.`} back onBack={back} action={<Button size="icon" onClick={onCreate}><Plus/></Button>}/>
  {nextPayment && <section className="next-payment"><CalendarDays/><div><small>PRÓXIMO PAGO · {new Date(nextPayment.next_execution_date).toLocaleDateString('es-ES', { day: 'numeric', month: 'short' }).toUpperCase()}</small><b>{nextPayment.name}</b><span>{money(nextPayment.amount)}</span></div></section>}
  <div className="recurring-list">
  {recurring?.length > 0 ? recurring.map((r: any) => (
    <article key={r.id} onClick={() => openDetail({ type: 'recurring', data: r })} className="cursor-pointer" style={{ opacity: r.is_active ? 1 : 0.5 }}>
      <div className="date-tile"><b>{new Date(r.next_execution_date).getDate()}</b><small>{new Date(r.next_execution_date).toLocaleString('es-ES', { month: 'short' })}</small></div>
      <div><b>{r.name}</b><small>{r.category?.name} · {r.frequency}</small></div>
      <strong className={r.type==='income'?'income-text':''}>{r.type==='income'?'+':'−'}{money(r.amount)}</strong>
    </article>
  )) : (
    <div className="p-8 text-center text-muted-foreground border rounded-xl bg-card mt-4"><CalendarDays className="mx-auto mb-2 opacity-50" size={32}/><p className="text-sm">No tienes pagos recurrentes.</p></div>
  )}
  </div></> 
}

function CalendarScreen({ back, transactions }: any) { const [day,setDay]=useState(17); return <><Header title="Calendario" subtitle="Agosto 2026" back onBack={back}/><div className="calendar-card"><div className="week">{['L','M','M','J','V','S','D'].map((d,i)=><span key={i}>{d}</span>)}</div><div className="days">{Array.from({length:35},(_,i)=>i<5?'':i-4).map((d,i)=><button key={i} disabled={!d} className={day===d?'selected':''} onClick={()=>d&&setDay(Number(d))}><span>{d}</span>{[3,8,12,17,21,24,28].includes(Number(d))&&<i className={Number(d)%2?'expense':'income'}/>}</button>)}</div></div><section className="day-group"><p>{day} DE AGOSTO</p><div className="list-card">{transactions?.slice(0,3).map((t:any)=><TransactionRow key={t.id} item={t}/>)}</div><div className="day-total"><span>Total gastado</span><b>$25.55</b></div></section></> }

function ProfileScreen({ navigate, dark, toggleDark, profile }: { navigate:(s:Screen)=>void; dark:boolean; toggleDark:()=>void; profile?: any }) { 
  const items=[['Metas de ahorro',Target,'goals'],['Reportes y análisis',PieChart,'reports'],['Resumen mensual',FileText,'summary'],['Pagos recurrentes',CalendarDays,'recurring'],['Calendario financiero',CalendarDays,'calendar'],['Métodos de pago',Wallet,'payments']] as const; 
  const initials = profile?.full_name ? profile.full_name.substring(0, 2).toUpperCase() : 'US'; 
  const memberSince = new Date(profile?.created_at || Date.now()).toLocaleDateString('es-ES', { month: 'long', year: 'numeric' }); 
  
  const handleLogout = async () => {
    const { createClient } = await import('@/lib/supabase/client')
    const supabase = createClient()
    await supabase.auth.signOut()
    window.location.href = '/login'
  }

  return <><Header title="Perfil" action={<Button variant="ghost" size="icon"><MoreHorizontal/></Button>}/><section className="profile-card"><div className="profile-avatar">{initials}<button><Camera/></button></div><h2>{profile?.full_name || 'Usuario'}</h2><p>{profile?.email || 'correo@ejemplo.com'}</p><span>Miembro desde {memberSince}</span></section><p className="settings-label">FINANZAS</p><div className="settings-list">{items.map(([label,Icon,path])=><button key={label as string} onClick={()=>navigate(path as Screen)}><span><Icon/></span><b>{label as string}</b><ChevronRight/></button>)}</div><p className="settings-label">PREFERENCIAS</p><div className="settings-list"><button onClick={toggleDark}><span>{dark?<Sun/>:<Moon/>}</span><b>{dark?'Modo claro':'Modo oscuro'}</b><i className={`switch ${dark?'on':''}`} /></button><button><span><Bell/></span><b>Notificaciones</b><ChevronRight/></button><button><span><Shield/></span><b>Seguridad</b><ChevronRight/></button><button onClick={handleLogout} className="logout w-full text-left"><span><LogOut/></span><b>Cerrar sesión</b></button></div></> }

function PaymentsScreen({ back, paymentMethods }: any) { 
  return <><Header title="Métodos de pago" subtitle="Administra cómo pagas" back onBack={back} action={<Button size="icon"><Plus/></Button>}/>
  {paymentMethods?.length > 0 ? (
    <div className="settings-list mt-4">
      {paymentMethods.map((pm: any) => (
        <button key={pm.id}><span><Wallet/></span><b>{pm.name}</b><ChevronRight/></button>
      ))}
    </div>
  ) : (
    <div className="p-8 text-center text-muted-foreground border rounded-xl bg-card mt-4">
      <CircleDollarSign className="mx-auto mb-2 opacity-50" size={32} />
      <p className="text-sm">No tienes métodos de pago guardados.</p>
    </div>
  )}
  </> 
}

function DetailSheet({ item, close }: { item:any; close:()=>void }) { 
  const Icon = getIcon(item.category?.icon || 'circle-dollar-sign')
  const isIncome = item.type === 'income'
  const [isPending, startTransition] = useTransition()

  const handleDelete = () => {
    if (confirm('¿Estás seguro de que deseas eliminar este movimiento?')) {
      startTransition(async () => {
        await deleteTransaction(item.id)
        close()
      })
    }
  }

  return <div className="overlay" onClick={close}><section className="sheet" onClick={e=>e.stopPropagation()}><div className="sheet-handle"/><button className="sheet-close" onClick={close}><X/></button><span className={`detail-icon ${isIncome?'income':''}`}><Icon/></span><small>{isIncome?'INGRESO':'GASTO'}</small><h2>{isIncome?'+':'−'}{money(item.amount)}</h2><p>{item.description}</p><div className="detail-grid"><span><small>Categoría</small><b>{item.category?.name || '-'}</b></span><span><small>Fecha</small><b>{new Date(item.transaction_date).toLocaleDateString()}</b></span><span><small>Método</small><b>{item.payment_method?.name || '-'}</b></span><span><small>Hora</small><b>{new Date(item.transaction_date).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</b></span></div><div className="sheet-actions"><Button variant="outline" className="h-11 flex-1" disabled><Pencil data-icon="inline-start"/>Editar</Button><Button variant="destructive" className="h-11 flex-1" onClick={handleDelete} disabled={isPending}>{isPending ? 'Eliminando...' : <><Trash2 data-icon="inline-start"/>Eliminar</>}</Button></div></section></div> 
}

function BudgetDetailSheet({ item, close }: any) { 
  const Icon = getIcon(item.category_icon || 'pie-chart')
  const [isPending, startTransition] = useTransition()
  
  const handleDelete = () => {
    if (confirm('¿Estás seguro de que deseas eliminar este presupuesto?')) {
      startTransition(async () => {
        await deleteBudget(item.id)
        close()
      })
    }
  }
  
  const p = Number(item.used_percentage)

  return <div className="overlay" onClick={close}><section className="sheet" onClick={e=>e.stopPropagation()}><div className="sheet-handle"/><button className="sheet-close" onClick={close}><X/></button><span className="detail-icon"><Icon/></span><small>PRESUPUESTO</small><h2>{item.category_name}</h2><p>{money(item.used_amount)} de {money(item.amount_limit)} utilizados</p><div className={`progress mt-4 ${p>100?'over':p>85?'near':''}`}><i style={{width:`${Math.min(p,100)}%`}}/></div>
  <div className="sheet-actions mt-8"><Button variant="outline" className="h-11 flex-1" disabled><Pencil data-icon="inline-start"/>Editar</Button><Button variant="destructive" className="h-11 flex-1" onClick={handleDelete} disabled={isPending}>{isPending ? 'Eliminando...' : <><Trash2 data-icon="inline-start"/>Eliminar</>}</Button></div></section></div> 
}

function GoalDetailSheet({ item, close, contributions }: any) {
  const [isPending, startTransition] = useTransition()
  const [amount, setAmount] = useState('')
  const [errorMsg, setErrorMsg] = useState('')
  
  const goalContributions = contributions?.filter((c: any) => c.goal_id === item.id) || []
  
  const handleDelete = () => {
    if (confirm('¿Estás seguro de que deseas eliminar esta meta? Perderás el registro de los aportes.')) {
      startTransition(async () => {
        await deleteGoal(item.id)
        close()
      })
    }
  }
  
  const handleContribute = (e: React.FormEvent) => {
    e.preventDefault()
    setErrorMsg('')
    const value = Number(amount)
    if (value <= 0) return setErrorMsg('Monto inválido')
    
    startTransition(async () => {
      const res = await createContribution({ goal_id: item.id, amount: value })
      if (res.error) setErrorMsg(res.error)
      else setAmount('')
    })
  }

  const p = Number(item.progress_percentage)
  
  return <div className="overlay" onClick={close}><section className="sheet" onClick={e=>e.stopPropagation()}><div className="sheet-handle"/><button className="sheet-close" onClick={close}><X/></button><span className="detail-icon"><Target/></span><small>META DE AHORRO</small><h2>{item.name}</h2><p>{money(item.current_amount)} de {money(item.target_amount)} ahorrados</p><div className="progress mt-4"><i style={{width:`${Math.min(p,100)}%`}}/></div>
  
  <div className="mt-8">
    <p className="text-sm font-semibold mb-2">Nuevo Aporte</p>
    <form onSubmit={handleContribute} className="flex gap-2">
      <input type="number" step="0.01" min="0.01" required value={amount} onChange={e=>setAmount(e.target.value)} placeholder="$ 0.00" className="flex-1 h-11 px-3 border rounded-xl" />
      <Button type="submit" className="h-11" disabled={isPending}>{isPending ? '...' : 'Aportar'}</Button>
    </form>
    {errorMsg && <p className="text-sm text-destructive mt-1">{errorMsg}</p>}
  </div>
  
  {goalContributions.length > 0 && <div className="mt-6"><p className="text-sm font-semibold mb-2">Historial de aportes</p><div className="max-h-40 overflow-y-auto border rounded-xl p-3 bg-card">{goalContributions.map((c: any) => <div key={c.id} className="flex justify-between py-2 border-b last:border-0 text-sm"><span>{new Date(c.contribution_date).toLocaleDateString()}</span><b className="income-text">+{money(c.amount)}</b></div>)}</div></div>}
  
  <div className="sheet-actions mt-6"><Button variant="outline" className="h-11 flex-1" disabled><Pencil data-icon="inline-start"/>Editar</Button><Button variant="destructive" className="h-11 flex-1" onClick={handleDelete} disabled={isPending}>{isPending ? 'Eliminando...' : <><Trash2 data-icon="inline-start"/>Eliminar</>}</Button></div></section></div> 
}

function RecurringDetailSheet({ item, close }: any) {
  const [isPending, startTransition] = useTransition()
  
  const handleDelete = () => {
    if (confirm('¿Eliminar esta recurrencia permanentemente?')) {
      startTransition(async () => {
        await deleteRecurringTransaction(item.id)
        close()
      })
    }
  }

  const handleToggle = () => {
    startTransition(async () => {
      await toggleRecurringActive(item.id, !item.is_active)
      close()
    })
  }

  return <div className="overlay" onClick={close}><section className="sheet" onClick={e=>e.stopPropagation()}><div className="sheet-handle"/><button className="sheet-close" onClick={close}><X/></button><span className="detail-icon"><CalendarDays/></span><small>{item.is_active ? 'RECURRENCIA ACTIVA' : 'RECURRENCIA PAUSADA'}</small><h2>{item.name}</h2><p className="mt-2 text-xl font-bold">{money(item.amount)}</p>
  <div className="detail-grid mt-6"><span><small>Categoría</small><b>{item.category?.name || '-'}</b></span><span><small>Próx. Fecha</small><b>{new Date(item.next_execution_date).toLocaleDateString()}</b></span><span><small>Frecuencia</small><b>{item.frequency}</b></span></div>
  <div className="sheet-actions mt-8">
    <Button variant="outline" className="h-11 flex-1" onClick={handleToggle} disabled={isPending}>{isPending ? '...' : item.is_active ? 'Pausar' : 'Reactivar'}</Button>
    <Button variant="destructive" className="h-11 flex-1" onClick={handleDelete} disabled={isPending}>{isPending ? 'Eliminando...' : <><Trash2 data-icon="inline-start"/>Eliminar</>}</Button>
  </div></section></div> 
}

function FormSheet({ kind, close, done, categories, paymentMethods }: any) { 
  const [type,setType]=useState('expense'); 
  const titles={movement:'Nuevo movimiento',budget:'Crear presupuesto',goal:'Nueva meta',recurring:'Nuevo pago recurrente'}; 
  const [isPending, startTransition] = useTransition()
  const [errorMsg, setErrorMsg] = useState('')
  
  const handleSubmit = (formData: FormData) => {
    setErrorMsg('')

    if (kind === 'movement') {
      const payload = {
        amount: Number(formData.get('amount')),
        description: formData.get('description') as string,
        category_id: formData.get('category_id') as string,
        transaction_date: formData.get('transaction_date') as string,
        type: type,
        payment_method_id: formData.get('payment_method_id') as string,
      }
      startTransition(async () => {
        const result = await createTransaction(payload)
        if (result.error) setErrorMsg(result.error)
        else done()
      })
      return
    }

    if (kind === 'budget') {
      const payload = {
        category_id: formData.get('category_id') as string,
        amount_limit: Number(formData.get('amount')),
        month: new Date().getMonth() + 1,
        year: new Date().getFullYear()
      }
      startTransition(async () => {
        const result = await createBudget(payload)
        if (result.error) setErrorMsg(result.error)
        else done()
      })
      return
    }

    if (kind === 'goal') {
      const payload = {
        name: formData.get('name') as string,
        target_amount: Number(formData.get('amount')),
        target_date: formData.get('target_date') as string || undefined
      }
      startTransition(async () => {
        const result = await createGoal(payload)
        if (result.error) setErrorMsg(result.error)
        else done()
      })
      return
    }

    if (kind === 'recurring') {
      const payload = {
        category_id: formData.get('category_id') as string,
        payment_method_id: formData.get('payment_method_id') as string || undefined,
        type: type,
        name: formData.get('name') as string,
        amount: Number(formData.get('amount')),
        frequency: formData.get('frequency') as string,
        start_date: formData.get('start_date') as string,
        end_date: formData.get('end_date') as string || undefined
      }
      startTransition(async () => {
        const result = await createRecurringTransaction(payload)
        if (result.error) setErrorMsg(result.error)
        else done()
      })
      return
    }

    done() // Fallback
  }

  const filteredCategories = categories?.filter((c: any) => c.type === type) || []

  return <div className="overlay"><section className="sheet form-sheet"><div className="sheet-handle"/><div className="form-title"><div><small>NUEVO</small><h2>{titles[kind as keyof typeof titles]}</h2></div><button onClick={close}><X/></button></div>
  <form action={handleSubmit}>
  {(kind==='movement'||kind==='recurring')&&<><div className="segmented"><button type="button" className={type==='expense'?'active':''} onClick={()=>setType('expense')}>Gasto</button><button type="button" className={type==='income'?'active':''} onClick={()=>setType('income')}>Ingreso</button></div><label className="amount-input"><span>$</span><input name="amount" autoFocus inputMode="decimal" placeholder="0.00" required step="0.01" min="0.01" type="number" /></label></>}
  
  <div className="form-fields">
  {kind==='goal'&&<label>Nombre de la meta<input name="name" required placeholder="Ej. Viaje a Japón"/></label>}
  {kind==='recurring'&&<label>Nombre de la recurrencia<input name="name" required placeholder="Ej. Spotify"/></label>}
  {kind==='movement'&&<label>Descripción<input name="description" placeholder="¿En qué fue?" required/></label>}
  
  <label>{kind==='budget'?'Límite mensual':kind==='goal'?'Cantidad objetivo':kind!=='movement'&&kind!=='recurring'?'Cantidad':''}{kind!=='movement'&&kind!=='recurring'&&<input name="amount" required step="0.01" min="0.01" type="number" inputMode="decimal" placeholder="$ 0.00"/>}</label>
  
  <label>{kind==='movement'||kind==='budget'||kind==='recurring'?'Categoría':'Fecha límite (opcional)'}
    {kind==='movement'||kind==='recurring' ? (
      <select name="category_id" required>
        <option value="">Seleccionar</option>
        {filteredCategories.map((c: any) => <option key={c.id} value={c.id}>{c.name}</option>)}
      </select>
    ) : kind === 'budget' ? (
      <select name="category_id" required>
        <option value="">Seleccionar categoría</option>
        {categories?.filter((c: any) => c.type === 'expense').map((c: any) => <option key={c.id} value={c.id}>{c.name}</option>)}
      </select>
    ) : (
      <input type="date" name="target_date" />
    )}
  </label>
  
  {kind==='recurring'&&<><label>Frecuencia<select name="frequency" required><option value="monthly">Mensual</option><option value="weekly">Semanal</option><option value="yearly">Anual</option></select></label></>}
  
  {kind==='movement'&&<><label>Fecha<input name="transaction_date" type="date" defaultValue={new Date().toISOString().split('T')[0]} required/></label></>}
  {kind==='recurring'&&<><label>Fecha de inicio<input name="start_date" type="date" defaultValue={new Date().toISOString().split('T')[0]} required/></label><label>Fecha de fin (opcional)<input name="end_date" type="date" /></label></>}

  {(kind==='movement'||kind==='recurring')&&<label>Método de pago<select name="payment_method_id"><option value="">Ninguno</option>{paymentMethods?.map((pm: any)=><option key={pm.id} value={pm.id}>{pm.name}</option>)}</select></label>}
  {kind==='movement'&&<button type="button" className="receipt-add"><Camera/>Agregar recibo <small>Próximamente</small></button>}
  
  </div>
  
  {errorMsg && <p className="text-sm font-medium text-destructive mt-2">{errorMsg}</p>}
  <Button type="submit" className="h-12 w-full rounded-xl mt-4" disabled={isPending}>{isPending ? 'Guardando...' : `Guardar ${kind==='movement'?'movimiento':kind==='budget'?'presupuesto':kind==='goal'?'meta':'pago'}`}{!isPending && <Check data-icon="inline-end"/>}</Button>
  </form>
  </section></div> 
}

function BottomNav({ active, navigate, openAdd }: { active:Screen; navigate:(s:Screen)=>void; openAdd:()=>void }) { const nav=[['home','Inicio',Home],['movements','Movimientos',Receipt],['add','',Plus],['budgets','Presupuestos',PieChart],['profile','Perfil',User]] as const; return <nav className="bottom-nav">{nav.map(([id,label,Icon])=>id==='add'?<button key={id} className="add-button" onClick={openAdd} aria-label="Registrar movimiento"><Icon/></button>:<button key={id} className={active===id?'active':''} onClick={()=>navigate(id)}><Icon/><span>{label}</span></button>)}</nav> }

export function FinanceApp({ profile, categories, paymentMethods, transactions, budgets, goals, contributions, recurring, metrics }: any) {
  const [screen,setScreen]=useState<Screen>('home'); const [previous,setPrevious]=useState<Screen>('home'); const [form,setForm]=useState<null|'movement'|'budget'|'goal'|'recurring'>(null); const [detail,setDetail]=useState<any>(null); const [toastMsg,setToastMsg]=useState(''); const [dark,setDark]=useState(false)
  const [notifications, setNotifications] = useState<string[]>([])

  useEffect(() => {
    // Generate one-time session notifications
    if (sessionStorage.getItem('notifs_shown')) return;
    const alerts: string[] = []
    
    // Budgets
    budgets?.forEach((b: any) => {
      const p = Number(b.used_percentage)
      if (p >= 100) alerts.push(`¡Alerta! Has superado tu presupuesto de ${b.category_name}.`)
      else if (p >= 85) alerts.push(`Cuidado, estás cerca del límite de ${b.category_name}.`)
    })
    
    // Upcoming recurring
    const today = new Date(); today.setHours(0,0,0,0);
    const in3Days = new Date(today); in3Days.setDate(today.getDate() + 3);
    recurring?.forEach((r: any) => {
      if (!r.is_active) return;
      const nextDate = new Date(r.next_execution_date)
      if (nextDate >= today && nextDate <= in3Days) {
        alerts.push(`Tu pago recurrente "${r.name}" vence en los próximos días.`)
      }
    })
    
    // Goals completed
    goals?.forEach((g: any) => {
      if (Number(g.progress_percentage) >= 100 && g.status !== 'completed') {
        alerts.push(`¡Felicidades! Has completado tu meta: ${g.name}.`)
      }
    })

    if (alerts.length > 0) {
      setNotifications(alerts.slice(0, 3)) // Max 3 to not spam
      sessionStorage.setItem('notifs_shown', 'true')
    }
  }, [budgets, recurring, goals])

  const navigate=(next:Screen)=>{setPrevious(screen);setScreen(next);window.scrollTo({top:0,behavior:'smooth'})}; const back=()=>navigate(previous); const save=()=>{setForm(null);setToastMsg('Guardado correctamente');setTimeout(()=>setToastMsg(''),3000)}; const toggleDark=()=>{setDark(!dark);document.documentElement.classList.toggle('dark')}
  
  return <main className="app-stage"><div className="app-shell"><div className="app-content">
    
    {notifications.length > 0 && (
      <div className="fixed top-4 left-0 right-0 z-50 flex flex-col gap-2 items-center pointer-events-none px-4">
        {notifications.map((msg, i) => (
          <div key={i} className="bg-card border shadow-lg px-4 py-3 rounded-xl flex items-center justify-between gap-3 pointer-events-auto max-w-sm w-full animate-in slide-in-from-top-4">
            <span className="text-sm font-medium">{msg}</span>
            <button onClick={() => setNotifications(n => n.filter((_, idx) => idx !== i))}><X size={16}/></button>
          </div>
        ))}
      </div>
    )}

    {screen==='home'&&<HomeScreen navigate={navigate} openAdd={()=>setForm('movement')} openDetail={setDetail} profile={profile} metrics={metrics} transactions={transactions}/>} 
    {screen==='movements'&&<MovementsScreen openDetail={setDetail} transactions={transactions}/>} 
    {screen==='budgets'&&<BudgetsScreen onCreate={()=>setForm('budget')} budgets={budgets} openDetail={setDetail}/>} 
    {screen==='profile'&&<ProfileScreen navigate={navigate} dark={dark} toggleDark={toggleDark} profile={profile}/>} 
    {screen==='goals'&&<GoalsScreen back={back} onCreate={()=>setForm('goal')} goals={goals} openDetail={setDetail}/>} 
    {screen==='reports'&&<ReportsScreen back={back} navigate={navigate} transactions={transactions}/>} 
    {screen==='summary'&&<SummaryScreen back={back} transactions={transactions} budgets={budgets}/>} 
    {screen==='recurring'&&<RecurringScreen back={back} onCreate={()=>setForm('recurring')} recurring={recurring} openDetail={setDetail}/>} 
    {screen==='calendar'&&<CalendarScreen back={back} transactions={transactions}/>} 
    {screen==='payments'&&<PaymentsScreen back={back} paymentMethods={paymentMethods}/>}
    </div><BottomNav active={screen} navigate={navigate} openAdd={()=>setForm('movement')}/></div>
    {detail?.type === 'movement' && <DetailSheet item={detail.data} close={()=>setDetail(null)}/>} 
    {detail?.type === 'budget' && <BudgetDetailSheet item={detail.data} close={()=>setDetail(null)}/>} 
    {detail?.type === 'goal' && <GoalDetailSheet item={detail.data} close={()=>setDetail(null)} contributions={contributions}/>} 
    {detail?.type === 'recurring' && <RecurringDetailSheet item={detail.data} close={()=>setDetail(null)} />}
    {form&&<FormSheet kind={form} close={()=>setForm(null)} done={save} categories={categories} paymentMethods={paymentMethods}/>} 
    {toastMsg&&<div className="toast"><Check/>{toastMsg}</div>}
  </main>
}
