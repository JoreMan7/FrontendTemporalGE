import { BASE_URL } from "./config.js"

export class AuthManager {
  static TOKEN_KEY = "auth_token"
  static USER_DATA_KEY = "user_data"
  static REDIRECTING = false

  // -------------------------
  // Helpers de token / usuario
  // -------------------------
  static getToken() { return localStorage.getItem(this.TOKEN_KEY) || "" }
  static setToken(t) { localStorage.setItem(this.TOKEN_KEY, t) }

  static setUser(u) { localStorage.setItem(this.USER_DATA_KEY, JSON.stringify(u || {})) }
  static getUser() {
    const raw = localStorage.getItem(this.USER_DATA_KEY)
    try { return raw ? JSON.parse(raw) : null } catch { return null }
  }

  static getRefreshToken() { return localStorage.getItem("refresh_token") || "" }
  static setRefreshToken(t) { if (t) localStorage.setItem("refresh_token", t) }

  // -------------------------
  // Login / Logout / Redirección
  // -------------------------
  static redirectToLogin() {
    localStorage.removeItem(this.TOKEN_KEY)
    localStorage.removeItem("refresh_token")
    localStorage.removeItem(this.USER_DATA_KEY)
    if (!this.REDIRECTING) {
      this.REDIRECTING = true
      // Usa tu ruta actual al login:
      window.location.href = "/Frontend/index.html"
    }
  }

  static async login(credentials) {
  try {
    const resp = await fetch(`${BASE_URL}/api/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        document_type: credentials.documentType,
        document_number: credentials.documentNumber,
        password: credentials.password
      })
    })
    
    const data = await resp.json().catch(() => ({}))

    // Usuario bloqueado
    if (resp.status === 423) {
      return { 
        success: false, 
        locked: true, 
        message: data.message || 'Usuario bloqueado temporalmente',
        locked_until: data.locked_until,
        attempts: data.attempts
      }
    }

    // Error de credenciales con información de intentos
    if (resp.status === 401 || !data.success) {
      return { 
        success: false, 
        message: data.message || "Credenciales incorrectas",
        attempts: data.attempts,
        attempts_remaining: data.attempts_remaining
      }
    }

    // OK → guardar tokens y user
    if (data.success && data.access_token) {
      this.setToken(data.access_token)
      if (data.refresh_token) this.setRefreshToken(data.refresh_token)
      if (data.user) this.setUser(data.user)

      return { success: true, user: data.user }
    }

    return { success: false, message: data.message || "Error desconocido" }
    
  } catch (e) {
    console.error("Login error:", e)
    return { success: false, message: "Error de conexión con el servidor" }
  }
}

  static logout() { this.redirectToLogin() }

  // -------------------------
  // Detección de página de login
  // -------------------------
  static isLoginPage() {
    const current = window.location.pathname.split("/").pop().toLowerCase()
    return current === "index.html" || current === ""
  }

  // -------------------------
  // Validación de sesión (exp + /verify)
  // -------------------------
  static isTokenExpired(token) {
    try {
      const payload = JSON.parse(atob(token.split(".")[1]))
      const exp = payload?.exp || 0
      const now = Math.floor(Date.now() / 1000)
      // margen de 10s por skew de reloj
      return now >= (exp - 60)
    } catch {
      return false
    }
  }

  static isAuthenticated() {
    const t = this.getToken()
    return !!t && !this.isTokenExpired(t)
  }

  static async verifySession() {
  const t = this.getToken()
  
  // Si no hay token, redirigir inmediatamente
  if (!t) {
    console.log("[verifySession] No token found")
    this.redirectToLogin()
    return false
  }

  // Verificar si el token está expirado
  if (this.isTokenExpired(t)) {
    console.log("[verifySession] Token expired")
    this.redirectToLogin()
    return false
  }

  try {
    console.log("[verifySession] Verifying token with backend...")
    const response = await fetch(`${BASE_URL}/api/auth/verify`, {
      method: "GET",
      headers: { 
        "Authorization": `Bearer ${t}`,
        "Content-Type": "application/json"
      }
    })

    if (response.ok) {
      console.log("[verifySession] Token verified successfully")
      return true
    }

    // Si el backend responde con error, verificar si es 401
    if (response.status === 401) {
      console.log("[verifySession] Backend returned 401")
      const text = await response.text().catch(() => "")
      console.warn("[verifySession] 401 details:", text)
      
      // Intentar refresh del token antes de redirigir
      const refreshed = await ApiClient.tryRefreshToken()
      if (refreshed) {
        console.log("[verifySession] Token refreshed successfully")
        return true
      }
    }

    console.log("[verifySession] Verification failed, status:", response.status)
  } catch (e) {
    console.error("[verifySession] Network error:", e)
    // En caso de error de red, permitir continuar con el token local
    // pero marcar para verificación en la próxima solicitud
    console.warn("[verifySession] Network error, using local token validation")
    return this.isAuthenticated() // Verificación local como fallback
  }

  this.redirectToLogin()
  return false
}


  // -------------------------
  // Control de acceso en páginas
  // -------------------------
  static async shouldHaveAccess() {
    const onLogin = this.isLoginPage()

    if (onLogin) {
      if (this.isAuthenticated()) {
        const ok = await this.verifySession()
        if (ok) {
          window.location.href = "./NavInicio.html"
          return false
        }
      }
      return true
    }

    const ok = await this.verifySession()
    if (!ok) {
      this.redirectToLogin()
      return false
    }
    return true
  }
}
