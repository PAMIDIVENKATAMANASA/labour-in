import type React from "react"
import { useState } from "react"
import { useNavigate, useLocation } from "react-router-dom"
import { useMutation } from "@tanstack/react-query"
import { toast } from "sonner"
import { setAuthTokens, getDashboardPath } from "@/lib/auth" // Removed parseJwt, not needed
import { apiFetch } from "@/lib/api"

import Navbar from "@/components/Navbar"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"

// Define the user type that comes from the API
type AuthUser = {
  id: number
  username: string
  user_type: string
  is_active: boolean
}

// Define the full API response type
type LoginResponse = {
  access: string
  refresh: string
  user: AuthUser
}

const Login = () => {
  const [username, setUsername] = useState("")
  const [password, setPassword] = useState("")
  const navigate = useNavigate()
  const location = useLocation()

  const loginMutation = useMutation({
    // --- THIS IS THE FIX ---
    // Update the type to match the full API response
    mutationFn: async () => {
      return await apiFetch<LoginResponse>("auth/login/", {
        method: "POST",
        body: JSON.stringify({ username, password }),
      })
    },
    // --- END FIX ---

    onSuccess: (data) => {
      // ✅ Store tokens and the user object
      // Now data.user is correctly typed and NOT undefined
      setAuthTokens(data.access, data.refresh)

      // ✅ Decode token and redirect
      // We can use the user object directly, it's more reliable
      const to =
        new URLSearchParams(location.search).get("next") ||
        getDashboardPath(data.user.user_type) // Use the user object

      toast.success("Login successful!")
      navigate(to, { replace: true })
    },
    onError: (error: unknown) => {
      const errMsg =
        error instanceof Error ? error.message : "Login failed, please try again"
      toast.error("Login failed", { description: errMsg })
    },
  })

  // ✅ Submit Handler
  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    loginMutation.mutate()
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
              <Input
                placeholder="Username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
              />
              <Input
                placeholder="Password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />

              {loginMutation.isError && (
                <p className="text-sm text-red-500">
                  {(loginMutation.error as Error)?.message || "Login failed. Try again."}
                </p>
              )}

              <Button
                type="submit"
                className="w-full"
                disabled={loginMutation.isPending}
              >
                {loginMutation.isPending ? "Signing in…" : "Sign In"}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

export default Login
