"use client"

import type React from "react"
import { useNavigate } from "react-router-dom"
import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import Navbar from "@/components/Navbar"
import { apiFetch } from "@/lib/api"

const rawApiBase = import.meta.env.VITE_API_BASE ?? "/api/"
const API_BASE = rawApiBase.endsWith("/") ? rawApiBase : `${rawApiBase}/`

const Signup = () => {
  const [username, setUsername] = useState("")
  const [email, setEmail] = useState("")
  const [firstName, setFirstName] = useState("")
  const [lastName, setLastName] = useState("")
  const [phoneNumber, setPhoneNumber] = useState("")
  const [address, setAddress] = useState("")
  const [userType, setUserType] = useState("LABORER")
  const [password, setPassword] = useState("")
  const [passwordConfirm, setPasswordConfirm] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  const navigate = useNavigate()

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)
    setSuccess(null)
    try {
      if (password.length < 8) {
        throw new Error("Password must be at least 8 characters")
      }
      if (password !== passwordConfirm) {
        throw new Error("Passwords do not match")
      }

      await apiFetch("auth/register/", {
        method: "POST",
        body: JSON.stringify({
          username,
          email,
          first_name: firstName,
          last_name: lastName,
          phone_number: phoneNumber,
          address,
          user_type: userType,
          password,
          password_confirm: passwordConfirm,
        }),
      })

      setSuccess("Account created. Redirecting to login…")
      // small delay so the user sees feedback
      setTimeout(() => navigate("/login", { replace: true }), 600)
    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(err.message)
      } else {
        setError("Signup failed")
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
            <CardTitle>Sign Up</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={onSubmit} className="space-y-4">
              <Input placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} />
              <Input placeholder="Username" value={username} onChange={(e) => setUsername(e.target.value)} />
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <Input placeholder="First name" value={firstName} onChange={(e) => setFirstName(e.target.value)} />
                <Input placeholder="Last name" value={lastName} onChange={(e) => setLastName(e.target.value)} />
              </div>
              <Input placeholder="Phone number" value={phoneNumber} onChange={(e) => setPhoneNumber(e.target.value)} />
              <Input placeholder="Address" value={address} onChange={(e) => setAddress(e.target.value)} />
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <select
                  value={userType}
                  onChange={(e) => setUserType(e.target.value)}
                  className="h-10 rounded-md border bg-background px-3 text-sm"
                >
                  <option value="LABORER">Laborer</option>
                  <option value="EMPLOYER">Employer</option>
                  <option value="COORDINATOR">Coordinator</option>
                </select>
              </div>
              <Input
                placeholder="Password (min 8 chars)"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
              <Input
                placeholder="Confirm password"
                type="password"
                value={passwordConfirm}
                onChange={(e) => setPasswordConfirm(e.target.value)}
              />
              {error && <p className="text-sm text-red-500">{error}</p>}
              {success && <p className="text-sm text-green-600">{success}</p>}
              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? "Creating…" : "Create Account"}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

export default Signup
