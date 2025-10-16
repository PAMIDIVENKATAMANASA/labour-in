import { setAuthTokens, clearAuth } from "@/lib/auth"

const detectDefaultApiBase = () => {
  // If a Vite/Next dev server is serving the frontend on 8080, default to Django at 8000.
  // Otherwise, fallback to same-origin "/api/" which works when reverse-proxied.
  try {
    const isLocalDev8080 = typeof window !== "undefined" && window.location.port === "8080"
    return isLocalDev8080 ? "http://localhost:8000/api/" : "/api/"
  } catch {
    return "/api/"
  }
}

export const API_BASE = (() => {
  const raw = (import.meta as ImportMeta)?.env?.VITE_API_BASE ?? detectDefaultApiBase()
  return raw.endsWith("/") ? raw : `${raw}/`
})()

type ApiOptions = Omit<RequestInit, "headers"> & {
  headers?: Record<string, string>
}

function isTokenInvalidResponse(data: unknown, status: number) {
  if (!data) return false
  if (status === 401 || status === 403) {
    // DRF SimpleJWT common shapes
    if (typeof data === "string" && data.toLowerCase().includes("token")) return true
    if (typeof data === "object" && data !== null && "detail" in data && typeof data.detail === "string" && data.detail.toLowerCase().includes("token")) return true
    if (typeof data === "object" && data !== null && "code" in data && (data as { code: string }).code === "token_not_valid") return true
    if (
      typeof data === "object" &&
      data !== null &&
      "messages" in data &&
      Array.isArray((data as { messages: unknown }).messages)
    ) return true
  }
  return false
}

async function refreshAccessToken(): Promise<boolean> {
  try {
    const refresh = typeof window !== "undefined" ? localStorage.getItem("refresh") : null
    if (!refresh) return false
    const res = await fetch(`${API_BASE}auth/refresh/`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ refresh }),
    })
    const isJson = (res.headers.get("content-type") || "").includes("application/json")
    const data = isJson ? await res.json() : null
    if (!res.ok) return false

    const newAccess = data?.access
    const newRefresh = data?.refresh // present if ROTATE_REFRESH_TOKENS = True
    if (!newAccess) return false
    setAuthTokens(newAccess, newRefresh || refresh)
    return true
  } catch {
    return false
  }
}

export async function apiFetch<T = unknown>(path: string, opts: ApiOptions = {}): Promise<T> {
  const url = `${API_BASE}${path.startsWith("/") ? path.slice(1) : path}`
  const method = (opts.method || "GET").toUpperCase()

  const makeHeaders = (withAuth: boolean) => {
    const h: Record<string, string> = {
      "Content-Type": "application/json",
      ...(opts.headers || {}),
    }
    if (withAuth) {
      const access = typeof window !== "undefined" ? localStorage.getItem("access") : null
      if (access) h["Authorization"] = `Bearer ${access}`
    }
    return h
  }

  const doRequest = async (withAuth: boolean) => {
    const res = await fetch(url, { ...opts, headers: makeHeaders(withAuth) })
    const text = await res.text()
    const isJson = (res.headers.get("content-type") || "").includes("application/json")
    const data = isJson ? (text ? JSON.parse(text) : null) : text
    return { res, data, isJson }
  }

  try {
    // 1) initial request (with auth if token exists)
    const initialWithAuth = !!(typeof window !== "undefined" && localStorage.getItem("access"))
    const { res, data, isJson } = await doRequest(initialWithAuth)

    if (res.ok) {
      return (isJson ? data : (data as unknown)) as T
    }

    // 2) if token invalid/expired, try to refresh and retry once
    if (isTokenInvalidResponse(data, res.status) && initialWithAuth) {
      const refreshed = await refreshAccessToken()
      if (refreshed) {
        const retry = await doRequest(true)
        if (retry.res.ok) {
          return (retry.isJson ? retry.data : (retry.data as unknown)) as T
        }
        // bubble any non-auth error after successful refresh
        const message =
          retry.isJson && retry.data && typeof retry.data === "object"
            ? JSON.stringify(retry.data)
            : `HTTP ${retry.res.status} ${retry.res.statusText}`
        throw new Error(message)
      } else {
        // 3) refresh failed: for GET, try one more time without auth (public endpoints)
        if (method === "GET") {
          const retryNoAuth = await doRequest(false)
          if (retryNoAuth.res.ok) {
            return (retryNoAuth.isJson ? retryNoAuth.data : (retryNoAuth.data as unknown)) as T
          }
        }
        // clear tokens to avoid sending bad Authorization repeatedly
        clearAuth()
        const friendly = "Your session has expired. Please log in again."
        throw new Error((isJson && data && typeof data === "object" ? JSON.stringify(data) : friendly) as string)
      }
    }

    // 4) other errors: surface message
    const message =
      isJson && data && typeof data === "object" ? JSON.stringify(data) : `HTTP ${res.status} ${res.statusText}`
    throw new Error(message)
  } catch (err: unknown) {
    if (err instanceof Error) {
      console.log("[v0] apiFetch error:", err.message)
    } else {
      console.log("[v0] apiFetch error:", err)
    }
    throw err
  }
}
