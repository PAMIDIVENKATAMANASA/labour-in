import { setAuthTokens, clearAuth } from "@/lib/auth"

console.log("[API] api.ts loaded")
const detectDefaultApiBase = () => {
  // If a Vite/Next dev server is serving the frontend on 8080, default to Django at 8000.
  // Otherwise, fallback to same-origin "/api/" which works when reverse-proxied.
  try {
    const isLocalDev8080 = typeof window !== "undefined" && window.location.port === "8080"
    const apiBase = isLocalDev8080 ? "http://10.96.138.120:8000/api/" : "/api/"
    console.log(`[API] Detected API Base: ${apiBase}`)
    return isLocalDev8080 ? "http://10.96.138.120:8000/api/" : "/api/"

  } catch {
    return "/api/"
  }
}

export type UserData = {
  id: number;
  username: string;
  email: string;
  user_type: string;
  is_active: boolean;
  date_joined: string;
};
export const deleteUser = (userId: number) => {
  return apiFetch<void>(`users/profile/${userId}/`, {
    method: 'DELETE',
  });
};

export const editUser = (userId: number, data: Partial<UserData>) => {
  return apiFetch<UserData>(`users/profile/${userId}/`, {
    method: 'PATCH', // Use PATCH for partial updates like an edit form
    body: JSON.stringify(data),
  });
};


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
  console.log("[API] Attempting to refresh access token...")
  try {
    const refresh = typeof window !== "undefined" ? localStorage.getItem("refresh") : null
    if (!refresh) {
      console.error("[API] refreshAccessToken: No refresh token found in localStorage.")
      return false
    }
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
    if (!newAccess){
      console.error("[API] refreshAccessToken: Success, but no 'access' token in response.", data)
       return false
    }
    console.log("[API] refreshAccessToken: SUCCESS. Saving new tokens.")
    setAuthTokens(newAccess, newRefresh || refresh)
    return true
  } catch(err) {
    console.error("[API] refreshAccessToken: CRITICAL FETCH ERROR.", err)
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
    console.log(`[API] apiFetch: Initial request for ${path} (withAuth: ${initialWithAuth})`)
    const { res, data, isJson } = await doRequest(initialWithAuth)

    if (res.ok) {
      console.log(`[API] apiFetch: Initial request for ${path} SUCCEEDED.`)
      return (isJson ? data : (data as unknown)) as T
    }
    console.log(`[API] apiFetch: Initial request for ${path} FAILED with status ${res.status}. Data:`, data)
    // 2) if token invalid/expired, try to refresh and retry once
    if (isTokenInvalidResponse(data, res.status) && initialWithAuth) {
      console.log(`[API] apiFetch: Token invalid for ${path}. Calling refreshAccessToken...`)
      const refreshed = await refreshAccessToken()
      if (refreshed) {
        console.log(`[API] apiFetch: Token refresh SUCCEEDED. Retrying ${path} with new token.`)
        const retry = await doRequest(true)
        if (retry.res.ok) {
          console.log(`[API] apiFetch: Retry for ${path} SUCCEEDED.`)
          return (retry.isJson ? retry.data : (retry.data as unknown)) as T
        }
        
        console.error(`[API] apiFetch: Retry for ${path} FAILED after successful refresh. Status: ${retry.res.status}. Data:`, retry.data)
        throw new Error(JSON.stringify(retry.data) || `HTTP ${retry.res.status}`)
        
      } else {
        console.error(`[API] apiFetch: Token refresh FAILED for ${path}.`)
        
        // 3) refresh failed: for GET, try one more time without auth (public endpoints)
        if (method === "GET") {
          console.log(`[API] apiFetch: Retrying ${path} WITHOUT auth (as anonymous).`)
          const retryNoAuth = await doRequest(false)
          if (retryNoAuth.res.ok) {
            console.log(`[API] apiFetch: Anonymous retry for ${path} SUCCEEDED.`)
            return (retryNoAuth.isJson ? retryNoAuth.data : (retryNoAuth.data as unknown)) as T
          }
          console.log(`[API] apiFetch: Anonymous retry for ${path} FAILED. Status: ${retryNoAuth.res.status}`)
        }
        
        console.log("[API] apiFetch: Clearing auth tokens due to refresh failure.")
        clearAuth()
        const friendly = "Your session has expired. Please log in again."
        throw new Error((isJson && data && typeof data === "object" ? JSON.stringify(data) : friendly) as string)
      }
    }

    // 4) other errors: surface message
    console.error(`[API] apiFetch: Non-auth error for ${path}. Status: ${res.status}. Data:`, data)
    throw new Error(JSON.stringify(data) || `HTTP ${res.status} ${res.statusText}`)
  } catch (err: unknown) {
    if (err instanceof Error) {
      console.error(`[API] apiFetch: FINAL CATCH for ${path}. Error: ${err.message}`)
    }
    throw err
  }
}