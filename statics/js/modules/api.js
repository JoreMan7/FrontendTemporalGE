import { AuthManager } from "./auth.js"
import { BASE_URL } from "./config.js"
import { SessionManager } from "./SessionManager.js"

export class ApiClient {
  static BASE_URL = BASE_URL

  static async request(endpoint, options = {}) {
  const url = `${this.BASE_URL}${endpoint}`
  
  // Verificar token localmente primero
  const token = AuthManager.getToken()
  if (!token || AuthManager.isTokenExpired(token)) {
    console.warn("[ApiClient] Token missing or expired locally")
    
    // Intentar refresh antes de proceder
    const refreshed = await this.tryRefreshToken()
    if (!refreshed) {
      AuthManager.redirectToLogin()
      throw new Error("Authentication required")
    }
  }

  const headers = {
    "Content-Type": "application/json",
    ...(options.headers || {}),
    ...(token ? { Authorization: `Bearer ${token}` } : {})
  }

  let response = await fetch(url, { ...options, headers })

  // Si el access token venció → intenta refresh UNA vez
  if (response.status === 401) {
    console.log("[ApiClient] 401 received, attempting token refresh...")
    const refreshed = await this.tryRefreshToken()
    if (refreshed) {
      const newToken = AuthManager.getToken()
      const retryHeaders = { ...headers, Authorization: `Bearer ${newToken}` }
      response = await fetch(url, { ...options, headers: retryHeaders })
    } else {
      console.log("[ApiClient] Token refresh failed, redirecting to login")
      AuthManager.redirectToLogin()
      throw new Error("Unauthorized")
    }
  }

  if (!response.ok) {
    const text = await response.text()
    throw new Error(text || `HTTP ${response.status}`)
  }

  // Actividad de red válida → resetea inactividad
  SessionManager?.networkActivityPing?.()

  return response.headers.get("content-type")?.includes("application/json")
    ? response.json()
    : response.text()
}

  static async tryRefreshToken() {
    const refreshToken = localStorage.getItem("refresh_token")
    if (!refreshToken) return false

    const r = await fetch(`${BASE_URL}/api/auth/refresh`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${refreshToken}`
      }
    })

    if (!r.ok) return false
    const d = await r.json().catch(() => ({}))
    if (!d.access_token) return false

    AuthManager.setToken(d.access_token)
    return true
  }

  // helpers que ya usas
  static async getHabitantes() { return await this.request("/api/habitantes/") }
  static async verifyToken() { return await this.request("/api/auth/verify") }
  // Perfil
static async getUserProfile() { 
  return await this.request("/api/auth/profile") 
}

static async updateUserProfile(payload) {
  return await this.request("/api/auth/profile", {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload)
  })
}

// (opcional) subir avatar en multipart/form-data
static async uploadAvatar(formData) {
  return await this.request("/api/auth/profile/avatar", {
    method: "POST",
    body: formData
  })
}

}
