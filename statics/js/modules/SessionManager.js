import { AuthManager } from "./auth.js"

export class SessionManager {
  static inactivityTimeout = 5 * 60 * 1000 // 5 minutos
  static warningTime = 20 * 1000 // 20 segundos
  static logoutTimer = null
  static warningTimer = null
  static warningShown = false
  static bc = new BroadcastChannel("session")

  static init() {
    this.resetTimers()
    const reset = () => this.resetTimers()
    
    ["mousemove","keydown","click","scroll","wheel","touchstart"].forEach(e =>
      document.addEventListener(e, reset, { passive: true })
    )
    
    document.addEventListener("visibilitychange", () => {
      if (!document.hidden) this.resetTimers()
    })
    
    this.bc.onmessage = ev => {
      if (ev.data === "logout") AuthManager.redirectToLogin()
      if (ev.data === "reset") this.resetTimers()
    }
  }

  static resetTimers() {
    clearTimeout(this.logoutTimer)
    clearTimeout(this.warningTimer)
    this.warningShown = false
    
    this.warningTimer = setTimeout(() => this.showWarning(), this.inactivityTimeout - this.warningTime)
    this.logoutTimer = setTimeout(() => this.forceLogout(), this.inactivityTimeout)
    this.bc.postMessage("reset")
  }

  static networkActivityPing() { this.resetTimers() }

  static forceLogout() {
    this.removeWarning()
    this.bc.postMessage("logout")
    AuthManager.redirectToLogin()
  }

  static removeWarning() {
    document.getElementById("session-warning")?.remove()
  }

  static showWarning() {
    if (this.warningShown) return
    this.warningShown = true
    
    const modal = document.createElement("div")
    modal.id = "session-warning"
    modal.innerHTML = `
      <div style="position:fixed;inset:0;background:rgba(0,0,0,0.7);display:flex;align-items:center;justify-content:center;z-index:9999;font-family:Arial,sans-serif">
        <div style="background:white;padding:2rem;border-radius:12px;max-width:400px;width:90%;box-shadow:0 10px 30px rgba(0,0,0,0.3);text-align:center">
          <div style="font-size:3rem;margin-bottom:1rem">⏰</div>
          <h3 style="margin:0 0 1rem 0;color:#333;">¿Continuar en la plataforma?</h3>
          <p style="margin:0 0 2rem 0;color:#666;line-height:1.5">Tu sesión está por expirar por inactividad.</p>
          <div style="display:flex;gap:1rem;justify-content:center">
            <button id="keepSession" style="padding:0.75rem 1.5rem;background:#28a745;color:white;border:none;border-radius:6px;cursor:pointer;font-size:1rem">✅ Continuar</button>
            <button id="logoutSession" style="padding:0.75rem 1.5rem;background:#dc3545;color:white;border:none;border-radius:6px;cursor:pointer;font-size:1rem">❌ Cerrar sesión</button>
          </div>
          <p style="margin:1rem 0 0 0;font-size:0.875rem;color:#999">Se cerrará automáticamente en 20 segundos</p>
        </div>
      </div>`
    
    document.body.appendChild(modal)
    
    document.getElementById("keepSession").onclick = () => {
      this.removeWarning()
      this.resetTimers()
    }
    
    document.getElementById("logoutSession").onclick = () => this.forceLogout()
    
    setTimeout(() => {
      if (this.warningShown) this.forceLogout()
    }, this.warningTime)
  }
}