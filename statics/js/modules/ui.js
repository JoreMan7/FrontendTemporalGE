import { AuthManager } from "./auth.js"
//import Swal from "sweetalert2" // Declare SweetAlert2 import

export class UIManager {
  // ========================
  // Inicialización general
  // ========================
  static init() {
    this.initCommonUI()
    this.loadUserData()
  }

  static initCommonUI() {
    this.setupNavigation()
    this.setupProfileMenu()
    this.setupLogoutButtons()
    this.setupHelpButtons()
    this.setupPasswordToggle()
  }

  // ========================
  // Navegación
  // ========================
  static setupNavigation() {
    console.log("setupNavigation ejecutado")

    // Tarjetas clickeables (dashboard)
    document.querySelectorAll(".DashboardCard:not(.Disabled)").forEach((card) => {
      card.style.cursor = "pointer"
      card.addEventListener("click", () => {
        const url = card.getAttribute("data-url")
        if (url) window.location.href = url
      })
    })

    // Navegación por pestañas
    const tabButtons = document.querySelectorAll(".tab-btn")
    const tabContents = document.querySelectorAll(".tab-content")

    if (tabButtons.length > 0) {
      const firstButton = document.querySelector(".tab-btn.active")
      if (firstButton) {
        this.loadTabContent(firstButton.dataset.target, firstButton.dataset.url)
      }

      tabButtons.forEach((btn) => {
        btn.addEventListener("click", () => {
          tabButtons.forEach((b) => b.classList.remove("active"))
          btn.classList.add("active")

          tabContents.forEach((c) => c.classList.remove("active"))
          const targetId = btn.dataset.target
          const targetContent = document.getElementById(targetId)
          if (targetContent) {
            targetContent.classList.add("active")
            this.loadTabContent(targetId, btn.dataset.url)
          }
        })
      })
    }
  }

  static loadTabContent(id, url) {
    const container = document.getElementById(id)
    if (container && url) {
      container.innerHTML = "Cargando..."
      fetch(url)
        .then((response) => response.text())
        .then((html) => (container.innerHTML = html))
        .catch(() => (container.innerHTML = "<p>Error al cargar contenido.</p>"))
    }
  }

  // ========================
  // Menú de perfil
  // ========================
  static setupProfileMenu() {
    const profileBtn = document.querySelector(".profile-btn")
    if (profileBtn) {
      profileBtn.addEventListener("click", (e) => {
        e.stopPropagation()
        document.querySelector(".profile-menu")?.classList.toggle("show")
      })

      document.addEventListener("click", () => {
        document.querySelector(".profile-menu")?.classList.remove("show")
      })
    }
  }

  // ========================
  // Botones de logout
  // ========================
  static setupLogoutButtons() {
    document.querySelectorAll(".logout")?.forEach((btn) => {
      btn.addEventListener("click", () => {
        AuthManager.logout()
      })
    })
  }

  // ========================
  // Botones de ayuda
  // ========================
  static setupHelpButtons() {
    document.querySelectorAll(".help")?.forEach((btn) => {
      btn.addEventListener("click", this.showHelp)
    })
  }

  static showHelp() {
    // Verificar si SweetAlert está disponible
    if (typeof Swal !== "undefined") {
      Swal.fire({
        title: "Sistema de Ayuda",
        html: `
                    <div style="text-align: left;">
                        <p><strong>Bienvenido al Sistema de Gestión Eclesial</strong></p>
                        <p>Para asistencia técnica, contacte al administrador del sistema:</p>
                        <ul>
                            <li>📧 Email: soporte@iglesia.com</li>
                            <li>📞 Teléfono: +57 1 234 5678</li>
                        </ul>
                        <p>Horario de atención: Lunes a Viernes, 8:00 AM - 6:00 PM</p>
                    </div>
                `,
        icon: "info",
        confirmButtonText: "Entendido",
        confirmButtonColor: "#2c3e50",
      })
    } else {
      alert("Sistema de Ayuda\n\nPara más información, contacte al administrador.")
    }
  }

  // ========================
  // Toggle de contraseña
  // ========================
  static setupPasswordToggle() {
    const togglePassword = document.getElementById("TogglePassword")
    const passwordInput = document.getElementById("Password")

    if (togglePassword && passwordInput) {
      togglePassword.addEventListener("click", () => {
        const type = passwordInput.type === "password" ? "text" : "password"
        passwordInput.type = type
        togglePassword.innerHTML = type === "password" ? '<i class="bi bi-eye"></i>' : '<i class="bi bi-eye-slash"></i>'
      })
    }
  }

  // ========================
  // Datos de usuario
  // ========================
  static loadUserData() {
    const user = AuthManager.getUser()
    if (user) {
      // Actualizar nombre de usuario en todos los elementos
      document.querySelectorAll(".UserName").forEach((el) => {
        el.textContent = `${user.nombre} ${user.apellido}` || "Usuario"
      })

      // Actualizar avatar si está disponible
      if (user.avatar_url) {
        document.querySelectorAll(".UserAvatar, .profile-header img, .profile-btn img").forEach((img) => {
          img.src = user.avatar_url
        })
      }

      // Actualizar rol si está disponible
      if (user.role) {
        document.querySelectorAll(".profile-header small").forEach((el) => {
          el.textContent = user.role
        })
      }
    }
  }
}
