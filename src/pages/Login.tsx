"use client"

import type React from "react"
import { useNavigate, useLocation } from "react-router-dom"
import { setAuthTokens, getDashboardPath, parseJwt } from "@/lib/auth"
import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import Navbar from "@/components/Navbar"
import { apiFetch } from "@/lib/api"

const rawApiBase = import.meta.env.VITE_API_BASE ?? "/api/"
const API_BASE = rawApiBase.endsWith("/") ? rawApiBase : `${rawApiBase}/`

const Login = () => {
  const [username, setUsername] = useState("")
  const [password, setPassword] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const navigate = useNavigate()
  const location = useLocation() // added

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)
    try {
      const data = await apiFetch<{ access: string; refresh: string }>("auth/login/", {
        method: "POST",
        body: JSON.stringify({ username, password }),
      })
      setAuthTokens(data.access, data.refresh)
      const claims = parseJwt<{ user_type?: string }>(data.access) || {}
      const to = new URLSearchParams(location.search).get("next") || getDashboardPath(claims.user_type)
      navigate(to, { replace: true })
    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(err.message)
      } else {
        setError("Login failed")
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="container mx-auto px-4 py-8 max-w-md">
        <Card className="shadow-card">
          <CardHeader>
            <CardTitle>Login</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={onSubmit} className="space-y-4">
              <Input placeholder="Username" value={username} onChange={(e) => setUsername(e.target.value)} />
              <Input
                placeholder="Password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
              {error && <p className="text-sm text-red-500">{error}</p>}
              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? "Signing in…" : "Sign In"}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

export default Login
