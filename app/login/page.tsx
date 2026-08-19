'use client'

import { useState } from 'react'
import { Wallet, XCircle, ArrowRight, Eye, EyeOff, Mail, Lock, User as UserIcon, CheckCircle2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'

function Logo() {
  return (
    <div className="flex items-center gap-2 font-semibold tracking-tight">
      <span className="grid size-10 place-items-center rounded-xl bg-primary text-primary-foreground shadow-lg shadow-primary/30">
        <Wallet size={20} />
      </span>
      <span className="text-2xl tracking-[-0.04em]">Cifra</span>
    </div>
  )
}

export default function LoginPage() {
  const router = useRouter()
  const supabase = createClient()
  const [register, setRegister] = useState(false)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [fullName, setFullName] = useState('')
  const [loading, setLoading] = useState(false)
  const [errorMsg, setErrorMsg] = useState('')
  const [successMsg, setSuccessMsg] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)

  const handleAction = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setErrorMsg('')
    setSuccessMsg('')
    
    if (register) {
      if (password !== confirmPassword) {
        setErrorMsg('Las contraseñas no coinciden. Verifícalo por favor.')
        setLoading(false)
        return
      }

      const { data: authData, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: { full_name: fullName },
        },
      })
      if (error) {
        if (error.message.includes('User already registered')) {
          setErrorMsg('Este correo ya está registrado en nuestro sistema.')
        } else {
          setErrorMsg('Error al crear la cuenta. Revisa tus datos e intenta de nuevo.')
        }
        setLoading(false)
      } else if (!authData.session) {
        setSuccessMsg('¡Cuenta creada exitosamente! Revisa tu bandeja de entrada y confirma tu email. (Si sale "localhost no encontrado" en tu celular, ciérralo y vuelve a Cifra).')
        setRegister(false)
        setLoading(false)
      } else {
        router.push('/')
      }
    } else {
      const { error } = await supabase.auth.signInWithPassword({ email, password })
      if (error) {
        setErrorMsg('El correo o la contraseña son incorrectos. Intenta de nuevo.')
        setLoading(false)
      } else {
        router.push('/')
      }
    }
  }

  const toggleMode = () => {
    setRegister(!register)
    setErrorMsg('')
    setSuccessMsg('')
    setPassword('')
    setConfirmPassword('')
  }

  return (
    <main className="min-h-screen bg-background flex items-center justify-center p-4 md:p-8 relative overflow-hidden">
      
      {/* Dynamic Animated Orbs */}
      <div className="absolute top-[0%] left-[10%] w-[30rem] h-[30rem] bg-primary/20 rounded-full blur-[100px] pointer-events-none mix-blend-multiply dark:mix-blend-screen animate-pulse duration-1000" />
      <div className="absolute bottom-[0%] right-[10%] w-[30rem] h-[30rem] bg-income/20 rounded-full blur-[100px] pointer-events-none mix-blend-multiply dark:mix-blend-screen animate-pulse duration-1000 delay-500" />

      <div className="w-full max-w-[420px] bg-card/90 backdrop-blur-2xl border border-border/50 rounded-[2.5rem] p-8 md:p-10 shadow-2xl shadow-primary/5 relative z-10 animate-in zoom-in-95 fade-in duration-500">
        
        <div className="flex flex-col items-center mb-10 animate-in slide-in-from-top-4 fade-in duration-700">
          <Logo />
          <h1 className="text-2xl font-bold tracking-tight text-foreground mt-6 mb-2">
            {register ? 'Crea tu cuenta' : 'Bienvenido de vuelta'}
          </h1>
          <p className="text-muted-foreground text-sm text-center">
            {register
              ? 'Únete a Cifra y toma el control de tus finanzas personales.'
              : 'Ingresa tus credenciales para acceder a tu panorama financiero.'}
          </p>
        </div>

        <form onSubmit={handleAction} className="space-y-4" noValidate={false}>
          {successMsg && (
            <div className="bg-income/10 border border-income/20 text-income text-sm p-4 rounded-2xl mb-6 flex items-start gap-3 animate-in slide-in-from-top-2 fade-in">
              <span className="shrink-0 mt-0.5"><CheckCircle2 size={18}/></span>
              <p className="leading-tight">{successMsg}</p>
            </div>
          )}

          {errorMsg && (
            <div className="bg-destructive/10 border border-destructive/20 text-destructive text-sm p-4 rounded-2xl mb-6 flex items-start gap-3 animate-in slide-in-from-top-2 fade-in">
              <span className="shrink-0 mt-0.5"><XCircle size={18}/></span>
              <p className="leading-tight">{errorMsg}</p>
            </div>
          )}

          <div className={`space-y-4 transition-all duration-500 ${register ? 'animate-in slide-in-from-left-4 fade-in' : ''}`}>
            {register && (
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-muted-foreground group-focus-within:text-primary transition-colors">
                  <UserIcon size={18} />
                </div>
                <input
                  id="fullName"
                  name="fullName"
                  type="text"
                  required
                  minLength={3}
                  placeholder="Nombre completo"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  disabled={loading}
                  className="w-full h-14 bg-secondary/30 border border-border/50 rounded-2xl pl-11 pr-4 text-sm text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all hover:bg-secondary/50"
                />
              </div>
            )}
            
            <div className="relative group">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-muted-foreground group-focus-within:text-primary transition-colors">
                <Mail size={18} />
              </div>
              <input
                id="email"
                name="email"
                type="email"
                required
                placeholder="Correo electrónico"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={loading}
                className="w-full h-14 bg-secondary/30 border border-border/50 rounded-2xl pl-11 pr-4 text-sm text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all hover:bg-secondary/50"
              />
            </div>

            <div className="relative group">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-muted-foreground group-focus-within:text-primary transition-colors">
                <Lock size={18} />
              </div>
              <input
                id="password"
                name="password"
                type={showPassword ? "text" : "password"}
                required
                minLength={6}
                placeholder="Contraseña"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={loading}
                className="w-full h-14 bg-secondary/30 border border-border/50 rounded-2xl pl-11 pr-12 text-sm text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all hover:bg-secondary/50"
              />
              <button 
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute inset-y-0 right-0 pr-4 flex items-center text-muted-foreground hover:text-foreground transition-colors"
                tabIndex={-1}
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>

            {register && (
              <div className="relative group animate-in fade-in duration-500">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-muted-foreground group-focus-within:text-primary transition-colors">
                  <Lock size={18} />
                </div>
                <input
                  id="confirmPassword"
                  name="confirmPassword"
                  type={showConfirmPassword ? "text" : "password"}
                  required
                  minLength={6}
                  placeholder="Confirmar contraseña"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  disabled={loading}
                  className="w-full h-14 bg-secondary/30 border border-border/50 rounded-2xl pl-11 pr-12 text-sm text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all hover:bg-secondary/50"
                />
                <button 
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute inset-y-0 right-0 pr-4 flex items-center text-muted-foreground hover:text-foreground transition-colors"
                  tabIndex={-1}
                >
                  {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            )}
          </div>

          {!register && (
            <div className="flex justify-end pt-1">
              <button type="button" tabIndex={-1} className="text-xs font-semibold text-primary hover:text-primary/80 transition-colors">
                ¿Olvidaste tu contraseña?
              </button>
            </div>
          )}

          <Button type="submit" className="w-full mt-8 h-14 rounded-2xl text-base font-bold shadow-xl shadow-primary/25 transition-all hover:shadow-primary/40 hover:-translate-y-0.5" disabled={loading}>
            {loading ? 'Cargando...' : register ? 'Crear cuenta ahora' : 'Iniciar sesión'}
            {!loading && <ArrowRight className="ml-2 opacity-70" size={18} />}
          </Button>

        </form>

        <div className="mt-8 text-center">
          <p className="text-sm text-muted-foreground">
            {register ? '¿Ya tienes una cuenta?' : '¿Aún no tienes cuenta?'}
            <button 
              type="button" 
              className="ml-2 font-bold text-primary hover:text-primary/80 transition-colors"
              onClick={toggleMode} 
              disabled={loading}
            >
              {register ? 'Inicia sesión aquí' : 'Regístrate gratis'}
            </button>
          </p>
        </div>
      </div>
    </main>
  )
}
