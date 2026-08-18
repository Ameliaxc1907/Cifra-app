'use client'

import { useState } from 'react'
import { Wallet, XCircle, ArrowRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'

function Logo() {
  return (
    <div className="flex items-center gap-2 font-semibold tracking-tight">
      <span className="grid size-9 place-items-center rounded-xl bg-primary text-primary-foreground">
        <Wallet />
      </span>
      <span className="text-xl">Cifra</span>
    </div>
  )
}

export default function LoginPage() {
  const router = useRouter()
  const supabase = createClient()
  const [register, setRegister] = useState(false)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [fullName, setFullName] = useState('')
  const [loading, setLoading] = useState(false)
  const [errorMsg, setErrorMsg] = useState('')
  const [successMsg, setSuccessMsg] = useState('')

  const handleAction = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setErrorMsg('')
    setSuccessMsg('')
    
    if (register) {
      const { data: authData, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: fullName,
          },
        },
      })
      if (error) {
        if (error.message.includes('User already registered')) {
          setErrorMsg('Este correo ya está registrado.')
        } else {
          setErrorMsg('Error al crear la cuenta. Intenta de nuevo.')
        }
        setLoading(false)
      } else if (!authData.session) {
        setSuccessMsg('¡Cuenta creada! Por favor, revisa tu bandeja de entrada y confirma tu correo electrónico para poder iniciar sesión.')
        setRegister(false)
        setLoading(false)
      } else {
        router.push('/')
      }
    } else {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password
      })
      if (error) {
        setErrorMsg('Credenciales inválidas. Por favor intenta de nuevo.')
        setLoading(false)
      } else {
        router.push('/')
      }
    }
  }

  return (
    <main className="auth-shell">
      <div className="auth-panel">
        <Logo />
        <div className="auth-heading">
          <p className="eyebrow">TU DINERO, MÁS CLARO</p>
          <h1>{register ? 'Crea tu cuenta' : 'Bienvenido de nuevo'}</h1>
          <p>
            {register
              ? 'Empieza a organizar tus finanzas hoy.'
              : 'Ingresa para continuar con tu progreso.'}
          </p>
        </div>

        <form onSubmit={handleAction} className="auth-form" noValidate={false}>
          {successMsg && (
            <div className="bg-green-500/15 text-green-600 text-sm p-4 rounded-md mb-4 font-medium">
              {successMsg}
            </div>
          )}

          {errorMsg && (
            <div className="bg-destructive/15 text-destructive text-sm p-3 rounded-md mb-4 flex items-center gap-2">
              <span className="shrink-0"><XCircle size={16}/></span>
              {errorMsg}
            </div>
          )}

          {register && (
            <div className="form-group">
              <label htmlFor="fullName">Nombre completo</label>
              <input
                id="fullName"
                name="fullName"
                type="text"
                required
                minLength={3}
                placeholder="Ej. Juan Pérez"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                disabled={loading}
              />
            </div>
          )}
          
          <div className="form-group">
            <label htmlFor="email">Correo electrónico</label>
            <input
              id="email"
              name="email"
              type="email"
              required
              placeholder="correo@ejemplo.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={loading}
            />
          </div>

          <div className="form-group">
            <div className="flex justify-between">
              <label htmlFor="password">Contraseña</label>
              {!register && (
                <button type="button" tabIndex={-1} className="text-xs font-medium text-muted-foreground hover:text-foreground">
                  ¿Olvidaste tu contraseña?
                </button>
              )}
            </div>
            <input
              id="password"
              name="password"
              type="password"
              required
              minLength={6}
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={loading}
            />
          </div>

          <Button type="submit" className="w-full mt-2 h-12 rounded-xl text-base" disabled={loading}>
            {loading ? 'Cargando...' : register ? 'Crear cuenta' : 'Iniciar sesión'}
            {!loading && <ArrowRight className="ml-2 opacity-70" size={18} />}
          </Button>

        </form>

        <p className="auth-switch">
          {register ? '¿Ya tienes una cuenta?' : '¿No tienes una cuenta?'}
          <button type="button" onClick={() => { setRegister(!register); setErrorMsg(''); setSuccessMsg(''); }} disabled={loading}>
            {register ? 'Inicia sesión' : 'Regístrate gratis'}
          </button>
        </p>
      </div>

      <div className="auth-art">
        <div className="art-card art-card-back">
          <div className="art-header">
            <span>•••• 4589</span>
            <span>VISA</span>
          </div>
          <div className="art-chip" />
        </div>
        
        <div className="art-card">
          <div className="art-header">
            <span>•••• 1234</span>
            <span>MASTERCARD</span>
          </div>
          <div className="art-chip" />
          <div className="art-balance">
            <p>Saldo disponible</p>
            <strong>$ 12,450.00</strong>
          </div>
        </div>
      </div>
    </main>
  )
}
