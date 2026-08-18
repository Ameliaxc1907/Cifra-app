export type Period = 'Semana' | 'Mes' | 'Año'

export function getPeriodRange(period: Period, offset: number = 0): { start: Date, end: Date, labels: string[] } {
  const now = new Date()
  
  if (period === 'Año') {
    const year = now.getFullYear() + offset
    const start = new Date(year, 0, 1)
    const end = new Date(year, 11, 31, 23, 59, 59)
    const labels = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic']
    return { start, end, labels }
  }
  
  if (period === 'Mes') {
    const month = now.getMonth() + offset
    const year = now.getFullYear()
    const start = new Date(year, month, 1)
    const end = new Date(year, month + 1, 0, 23, 59, 59)
    
    const days = end.getDate()
    const labels = []
    for (let i = 1; i <= days; i += Math.floor(days / 4)) {
      labels.push(`${i} ${start.toLocaleString('es-ES', { month: 'short' })}`)
    }
    labels.push('Hoy') // Or end of month
    
    return { start, end, labels: labels.slice(0, 4) }
  }
  
  // Semana
  const day = now.getDay() || 7
  const monday = new Date(now)
  monday.setDate(now.getDate() - day + 1 + (offset * 7))
  monday.setHours(0, 0, 0, 0)
  
  const sunday = new Date(monday)
  sunday.setDate(monday.getDate() + 6)
  sunday.setHours(23, 59, 59, 999)
  
  return { start: monday, end: sunday, labels: ['L', 'M', 'X', 'J', 'V', 'S', 'D'] }
}

export function filterTransactionsByRange(transactions: any[], start: Date, end: Date) {
  return transactions.filter(t => {
    const d = new Date(t.transaction_date)
    return d >= start && d <= end
  })
}

export function calculateMetrics(transactions: any[]) {
  let income = 0
  let expense = 0
  for (const t of transactions) {
    if (t.type === 'income') income += Number(t.amount)
    if (t.type === 'expense') expense += Number(t.amount)
  }
  const balance = income - expense
  const savingsPercent = income > 0 ? (balance / income) * 100 : 0
  
  return { income, expense, balance, savingsPercent: Math.max(0, savingsPercent) }
}

export function getCategoryBreakdown(transactions: any[]) {
  const expenses = transactions.filter(t => t.type === 'expense')
  const total = expenses.reduce((acc, t) => acc + Number(t.amount), 0)
  if (total === 0) return []
  
  const byCat: Record<string, { amount: number, icon: string, name: string }> = {}
  for (const t of expenses) {
    const name = t.category?.name || 'Otros'
    const icon = t.category?.icon || 'circle-dollar-sign'
    if (!byCat[name]) byCat[name] = { amount: 0, icon, name }
    byCat[name].amount += Number(t.amount)
  }
  
  return Object.values(byCat)
    .sort((a, b) => b.amount - a.amount)
    .map(c => ({
      ...c,
      percent: Math.round((c.amount / total) * 100)
    }))
}

export function generateInsights(
  currentMetrics: any, 
  previousMetrics: any, 
  breakdown: any[],
  budgets: any[]
) {
  const insights: string[] = []
  
  if (previousMetrics.expense > 0) {
    const diff = currentMetrics.expense - previousMetrics.expense
    const diffPercent = Math.round((Math.abs(diff) / previousMetrics.expense) * 100)
    if (diff > 0) {
      insights.push(`Gastaste ${diffPercent}% más que el periodo anterior.`)
    } else if (diff < 0) {
      insights.push(`Gastaste ${diffPercent}% menos que el periodo anterior.`)
    }
  } else if (currentMetrics.expense > 0) {
    insights.push(`Tus gastos aumentaron en comparación al mes pasado, donde no registraste nada.`)
  }

  if (breakdown.length > 0) {
    insights.push(`${breakdown[0].name} fue tu categoría con mayor gasto (${breakdown[0].percent}%).`)
  }

  if (previousMetrics.balance > 0) {
    if (currentMetrics.balance > previousMetrics.balance) {
      insights.push(`Tu ahorro aumentó respecto al periodo anterior.`)
    } else if (currentMetrics.balance < previousMetrics.balance && currentMetrics.balance > 0) {
      insights.push(`Ahorraste menos que antes, pero mantienes un balance positivo.`)
    }
  }

  let exceeded = 0
  let fulfilled = 0
  for (const b of budgets) {
    if (Number(b.used_amount) > Number(b.amount_limit)) {
      exceeded++
      if (exceeded === 1) insights.push(`Superaste tu presupuesto de ${b.category_name}.`)
    } else {
      fulfilled++
    }
  }

  if (insights.length === 0) {
    insights.push('Registra más movimientos para generar análisis.')
  }
  
  return {
    insights,
    budgetsStatus: { fulfilled, exceeded }
  }
}

export function getChartPath(transactions: any[], period: Period, range: { start: Date, end: Date }) {
  const width = 340
  const height = 94
  const points: number[] = []
  
  const expenses = transactions.filter(t => t.type === 'expense')
  
  if (period === 'Año') {
    const monthly = new Array(12).fill(0)
    for (const t of expenses) {
      const m = new Date(t.transaction_date).getMonth()
      monthly[m] += Number(t.amount)
    }
    points.push(...monthly)
  } else if (period === 'Mes') {
    const daysInMonth = range.end.getDate()
    const daily = new Array(daysInMonth).fill(0)
    for (const t of expenses) {
      const d = new Date(t.transaction_date).getDate() - 1
      daily[d] += Number(t.amount)
    }
    points.push(...daily)
  } else {
    const daily = new Array(7).fill(0)
    for (const t of expenses) {
      const d = new Date(t.transaction_date).getDay()
      const idx = d === 0 ? 6 : d - 1 // L=0, D=6
      daily[idx] += Number(t.amount)
    }
    points.push(...daily)
  }

  const max = Math.max(...points, 1) // prevent div/0
  const mapped = points.map((val, idx) => {
    const x = points.length > 1 ? (idx / (points.length - 1)) * width : width/2
    const y = height - ((val / max) * height)
    return { x, y }
  })

  // Smooth SVG path generator
  if (mapped.length === 0) return `M0 ${height} L${width} ${height}`
  if (mapped.length === 1) return `M0 ${mapped[0].y} L${width} ${mapped[0].y}`

  let path = `M ${mapped[0].x} ${mapped[0].y}`
  for (let i = 1; i < mapped.length; i++) {
    const prev = mapped[i - 1]
    const curr = mapped[i]
    // Smooth cubic bezier
    const cx = (prev.x + curr.x) / 2
    path += ` C ${cx} ${prev.y}, ${cx} ${curr.y}, ${curr.x} ${curr.y}`
  }
  
  return path
}
