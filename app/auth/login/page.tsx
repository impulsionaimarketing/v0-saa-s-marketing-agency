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
import Image from 'next/image'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { setAuthCookie } from '@/lib/auth/cookies'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    const supabase = createClient()
    setIsLoading(true)
    setError(null)

    try {
      // Validar credenciais usando a função RPC
      const { data: result, error: loginError } = await supabase.rpc(
        'validate_login',
        {
          p_email: email,
          p_password: password,
        }
      )

      if (loginError) {
        throw new Error(loginError.message)
      }

      // A resposta é um JSON simples
      if (!result || result.error) {
        throw new Error('Email ou senha inválidos')
      }

      const userData = {
        id: result.id,
        name: result.name,
        email: result.email,
        role: result.role,
        area: result.area,
        status: result.status,
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

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4 sm:p-6 md:p-8">
      <Card className="w-full max-w-sm bg-card border-border">
        <CardHeader className="space-y-2 text-center">
          <div className="mb-6 flex justify-center">
            <Image
              src="https://impulsionaimarketing.com.br/wp-content/uploads/2026/02/Impulsionai-4.png"
              alt="Impulsionaí Marketing"
              width={280}
              height={80}
              className="h-14 w-auto object-contain"
              priority
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
        </CardContent>
      </Card>
    </div>
  )
}
