'use client'

import React from "react"

import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import Image from 'next/image'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { setAuthCookie } from '@/lib/auth/cookies'
import { AgentChat } from '@/components/ai-agent/agent-chat'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [showForgotPassword, setShowForgotPassword] = useState(false)
  const [forgotEmail, setForgotEmail] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [forgotError, setForgotError] = useState<string | null>(null)
  const [forgotSuccess, setForgotSuccess] = useState(false)
  const [isForgotLoading, setIsForgotLoading] = useState(false)
  const router = useRouter()

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    const supabase = createClient()
    setIsLoading(true)
    setError(null)

    try {
      // Usar RPC function de autenticação contra a tabela users
      const { data, error: rpcError } = await supabase.rpc('authenticate_user', {
        p_email: email,
        p_password: password,
      })

      if (rpcError) {
        throw new Error('Email ou senha incorretos')
      }

      if (!data || data.length === 0 || !data[0].authenticated) {
        throw new Error('Email ou senha incorretos')
      }

      const user = data[0]

      // Dados do usuário autenticado
      const userData = {
        id: user.id,
        email: user.email || '',
        name: user.name || '',
        role: user.role || 'Colaborador',
        area: user.area || '',
        modules_access: user.modules_access || [],
      }

      // Armazenar informações do usuário no localStorage
      localStorage.setItem('user', JSON.stringify(userData))

      // Armazenar em cookie para autenticação server-side
      await setAuthCookie(userData)

      // Redirecionar para dashboard
      router.push('/')
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Erro ao fazer login'
      setError(message)
      console.error('[v0] Login error:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault()
    setForgotError(null)
    setForgotSuccess(false)
    setIsForgotLoading(true)

    if (newPassword !== confirmPassword) {
      setForgotError('As senhas não correspondem')
      setIsForgotLoading(false)
      return
    }

    if (newPassword.length < 6) {
      setForgotError('A senha deve ter pelo menos 6 caracteres')
      setIsForgotLoading(false)
      return
    }

    try {
      const supabase = createClient()
      const { data, error: rpcError } = await supabase.rpc('reset_user_password', {
        p_email: forgotEmail,
        p_new_password: newPassword,
      })

      if (rpcError) {
        throw new Error('Erro ao resetar senha')
      }

      if (data?.success) {
        setForgotSuccess(true)
        setForgotEmail('')
        setNewPassword('')
        setConfirmPassword('')
        
        // Fechar modal após 2 segundos
        setTimeout(() => {
          setShowForgotPassword(false)
          setForgotSuccess(false)
        }, 2000)
      } else {
        throw new Error(data?.message || 'Email não encontrado')
      }
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Erro ao resetar senha'
      setForgotError(message)
      console.error('[v0] Forgot password error:', error)
    } finally {
      setIsForgotLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4 sm:p-6 md:p-8">
      <AgentChat />
      <Card className="w-full max-w-sm bg-card border-border">
        <CardHeader className="space-y-4 text-center">
          <div className="flex justify-center">
            <Image 
              src="https://impulsionaimarketing.com.br/wp-content/uploads/2026/02/Impulsionai-4-1.png"
              alt="Impulsionaí Marketing"
              width={180}
              height={60}
              className="object-contain"
            />
          </div>
          <CardTitle className="text-2xl">Bem-vindo</CardTitle>
          <CardDescription>
            Acesse sua conta para continuar
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {error && (
            <div className="rounded-lg bg-destructive/10 p-3 text-sm text-destructive">
              {error}
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email" className="text-sm">
                Email
              </Label>
              <Input
                id="email"
                type="email"
                placeholder="seu@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={isLoading}
                className="bg-secondary border-border text-sm"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password" className="text-sm">
                Senha
              </Label>
              <Input
                id="password"
                type="password"
                placeholder="Sua senha"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={isLoading}
                className="bg-secondary border-border text-sm"
                required
              />
            </div>

            <Button
              type="submit"
              className="w-full"
              disabled={isLoading}
            >
              {isLoading ? 'Entrando...' : 'Entrar'}
            </Button>
          </form>

          <div className="flex justify-center">
            <Dialog open={showForgotPassword} onOpenChange={setShowForgotPassword}>
              <DialogTrigger asChild>
                <button className="text-sm text-primary hover:underline bg-transparent">
                  Esqueceu sua senha?
                </button>
              </DialogTrigger>
              <DialogContent className="bg-card border-border">
                <DialogHeader>
                  <DialogTitle>Recuperar Senha</DialogTitle>
                  <DialogDescription>
                    Digite seu email e uma nova senha para recuperar o acesso
                  </DialogDescription>
                </DialogHeader>

                {forgotSuccess ? (
                  <div className="rounded-lg bg-green-500/10 p-4 text-sm text-green-600 text-center">
                    Senha resetada com sucesso! Você pode fazer login com a nova senha.
                  </div>
                ) : (
                  <form onSubmit={handleForgotPassword} className="space-y-4">
                    {forgotError && (
                      <div className="rounded-lg bg-destructive/10 p-3 text-sm text-destructive">
                        {forgotError}
                      </div>
                    )}

                    <div className="space-y-2">
                      <Label htmlFor="forgot-email" className="text-sm">
                        Email
                      </Label>
                      <Input
                        id="forgot-email"
                        type="email"
                        placeholder="seu@email.com"
                        value={forgotEmail}
                        onChange={(e) => setForgotEmail(e.target.value)}
                        disabled={isForgotLoading}
                        className="bg-secondary border-border text-sm"
                        required
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="new-password" className="text-sm">
                        Nova Senha
                      </Label>
                      <Input
                        id="new-password"
                        type="password"
                        placeholder="Nova senha"
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        disabled={isForgotLoading}
                        className="bg-secondary border-border text-sm"
                        required
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="confirm-password" className="text-sm">
                        Confirmar Senha
                      </Label>
                      <Input
                        id="confirm-password"
                        type="password"
                        placeholder="Confirme a nova senha"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        disabled={isForgotLoading}
                        className="bg-secondary border-border text-sm"
                        required
                      />
                    </div>

                    <Button
                      type="submit"
                      className="w-full"
                      disabled={isForgotLoading}
                    >
                      {isForgotLoading ? 'Resetando...' : 'Resetar Senha'}
                    </Button>
                  </form>
                )}
              </DialogContent>
            </Dialog>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
