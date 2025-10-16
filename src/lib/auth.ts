export type AuthUser = {
    username?: string
    user_type?: "LABORER" | "EMPLOYER" | "COORDINATOR" | "ADMIN" | string
    first_name?: string
    last_name?: string
  }
  
  export function parseJwt<T extends Record<string, unknown>>(token: string | null): T | null {
    try {
      if (!token) return null
      const base64Url = token.split(".")[1]
      const base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/")
      const jsonPayload = decodeURIComponent(
        atob(base64)
          .split("")
          .map((c) => "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2))
          .join(""),
      )
      return JSON.parse(jsonPayload) as T
    } catch {
      return null
    }
  }
  
  export function setAuthTokens(access: string, refresh: string) {
    localStorage.setItem("access", access)
    localStorage.setItem("refresh", refresh)
    const claims = parseJwt<AuthUser>(access) || {}
    localStorage.setItem("auth_user", JSON.stringify(claims))
    window.dispatchEvent(new CustomEvent("auth-changed"))
  }
  
  export function clearAuth() {
    localStorage.removeItem("access")
    localStorage.removeItem("refresh")
    localStorage.removeItem("auth_user")
    window.dispatchEvent(new CustomEvent("auth-changed"))
  }
  
  export function getCurrentUser(): AuthUser | null {
    try {
      const raw = localStorage.getItem("auth_user")
      if (raw) return JSON.parse(raw) as AuthUser
      const claims = parseJwt<AuthUser>(localStorage.getItem("access"))
      if (claims) return claims
    } catch {
      // Intentionally ignored
    }
    return null
  }
  
  export function getDashboardPath(userType?: string) {
    switch (userType) {
      case "EMPLOYER":
        return "/dashboard/employer"
      case "COORDINATOR":
        return "/dashboard/coordinator"
      case "ADMIN":
        return "/dashboard/admin"
      case "LABORER":
      default:
        return "/dashboard/laborer"
    }
  }
  