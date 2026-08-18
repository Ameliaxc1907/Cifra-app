import { createClient } from './supabase/client'

// Transactions
export async function createTransaction(data: any) {
  const supabase = createClient()
  const { data: userData, error: authError } = await supabase.auth.getUser()
  if (authError || !userData?.user) return { error: 'No autorizado' }

  const { error } = await supabase.from('transactions').insert({
    ...data,
    user_id: userData.user.id
  })
  if (error) return { error: 'Error al registrar el movimiento' }
  return { success: true }
}

export async function deleteTransaction(id: string) {
  const supabase = createClient()
  const { data: userData } = await supabase.auth.getUser()
  if (!userData?.user) return { error: 'No autorizado' }

  const { error } = await supabase.from('transactions').delete().eq('id', id).eq('user_id', userData.user.id)
  if (error) return { error: 'Error al eliminar el movimiento' }
  return { success: true }
}

// Budgets
export async function createBudget(data: any) {
  const supabase = createClient()
  const { data: userData } = await supabase.auth.getUser()
  if (!userData?.user) return { error: 'No autorizado' }

  const { error } = await supabase.from('budgets').insert({
    ...data,
    user_id: userData.user.id
  })
  if (error) {
    if (error.code === '23505') return { error: 'Ya existe un presupuesto para esta categoría este mes' }
    return { error: 'Error al crear el presupuesto' }
  }
  return { success: true }
}

export async function deleteBudget(id: string) {
  const supabase = createClient()
  const { data: userData } = await supabase.auth.getUser()
  if (!userData?.user) return { error: 'No autorizado' }

  const { error } = await supabase.from('budgets').delete().eq('id', id).eq('user_id', userData.user.id)
  if (error) return { error: 'Error al eliminar el presupuesto' }
  return { success: true }
}

// Goals
export async function createGoal(data: any) {
  const supabase = createClient()
  const { data: userData } = await supabase.auth.getUser()
  if (!userData?.user) return { error: 'No autorizado' }

  const { error } = await supabase.from('savings_goals').insert({
    ...data,
    user_id: userData.user.id
  })
  if (error) return { error: 'Error al crear la meta' }
  return { success: true }
}

export async function deleteGoal(id: string) {
  const supabase = createClient()
  const { data: userData } = await supabase.auth.getUser()
  if (!userData?.user) return { error: 'No autorizado' }

  const { error } = await supabase.from('savings_goals').delete().eq('id', id).eq('user_id', userData.user.id)
  if (error) return { error: 'Error al eliminar la meta' }
  return { success: true }
}

export async function createContribution(data: any) {
  const supabase = createClient()
  const { data: userData } = await supabase.auth.getUser()
  if (!userData?.user) return { error: 'No autorizado' }

  const { error } = await supabase.from('savings_goal_contributions').insert({
    ...data,
    user_id: userData.user.id
  })
  if (error) return { error: 'Error al registrar el aporte' }
  return { success: true }
}

// Recurring
export async function createRecurringTransaction(data: any) {
  const supabase = createClient()
  const { data: userData } = await supabase.auth.getUser()
  if (!userData?.user) return { error: 'No autorizado' }

  const { error } = await supabase.from('recurring_transactions').insert({
    ...data,
    user_id: userData.user.id,
    next_execution_date: data.start_date,
    is_active: true
  })
  if (error) return { error: 'Error al crear el pago recurrente' }
  return { success: true }
}

export async function deleteRecurringTransaction(id: string) {
  const supabase = createClient()
  const { data: userData } = await supabase.auth.getUser()
  if (!userData?.user) return { error: 'No autorizado' }

  const { error } = await supabase.from('recurring_transactions').delete().eq('id', id).eq('user_id', userData.user.id)
  if (error) return { error: 'Error al eliminar el registro' }
  return { success: true }
}

export async function toggleRecurringActive(id: string, isActive: boolean) {
  const supabase = createClient()
  const { data: userData } = await supabase.auth.getUser()
  if (!userData?.user) return { error: 'No autorizado' }

  const { error } = await supabase.from('recurring_transactions').update({ is_active: isActive }).eq('id', id).eq('user_id', userData.user.id)
  if (error) return { error: 'Error al actualizar el estado' }
  return { success: true }
}
