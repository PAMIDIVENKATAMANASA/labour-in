"use client"

import { Link } from "react-router-dom"
import { Button } from "@/components/ui/button"
import { Briefcase } from "lucide-react"
import { useEffect, useState } from "react"
import { useNavigate } from "react-router-dom"
import { clearAuth, getCurrentUser, getDashboardPath } from "@/lib/auth"

const Navbar = () => {
  const [user, setUser] = useState(getCurrentUser())
  const navigate = useNavigate()

  useEffect(() => {
    const onAuth = () => setUser(getCurrentUser())
    window.addEventListener("auth-changed", onAuth)
    return () => window.removeEventListener("auth-changed", onAuth)
  }, [])

  const handleLogout = () => {
    clearAuth()
    navigate("/", { replace: true })
  }

  const dashboardLink = getDashboardPath(user?.user_type)

  return (
    <nav className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 sticky top-0 z-50">
      <div className="container mx-auto px-4">
        <div className="flex h-16 items-center justify-between">
          <Link to="/" className="flex items-center gap-2 transition-base hover:opacity-80">
            <Briefcase className="h-6 w-6 text-primary" />
            <span className="text-xl font-bold text-foreground">Skilled Labor</span>
          </Link>

          <div className="hidden md:flex items-center gap-6">
            <Link
              to="/find-work"
              className="text-sm font-medium text-foreground/80 hover:text-foreground transition-base"
            >
              Find Work
            </Link>
            <Link
              to="/hire-talent"
              className="text-sm font-medium text-foreground/80 hover:text-foreground transition-base"
            >
              Hire Talent
            </Link>
            <Link to="/about" className="text-sm font-medium text-foreground/80 hover:text-foreground transition-base">
              About Us
            </Link>
          </div>

          <div className="flex items-center gap-3">
            {user ? (
              <>
                <Button variant="ghost" asChild>
                  <Link to={dashboardLink}>{user.username || "Account"}</Link>
                </Button>
                <Button variant="outline" onClick={handleLogout}>
                  Logout
                </Button>
              </>
            ) : (
              <>
                <Button variant="ghost" asChild>
                  <Link to="/login">Login</Link>
                </Button>
                <Button variant="hero" asChild>
                  <Link to="/signup">Sign Up</Link>
                </Button>
              </>
            )}
          </div>
        </div>
      </div>
    </nav>
  )
}

export default Navbar
