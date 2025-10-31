// app.js - CORREGIDO
import { setSpanishLongDate, setupBackButton, setDynamicPageTitle } from "./modules/utilities.js"
import { AuthManager } from "./modules/auth.js"
import { UIManager } from "./modules/ui.js"
import { LoginManager } from "./pages/login.js"
import { DashboardManager } from "./pages/dashboard.js"
import { HabitantesManager } from "./pages/habitantes.js"
import { GruposAyudantesManager } from "./pages/gruposAyudantes.js"
import { CursosManager } from './pages/cursos.js';
import { UsuariosManager } from './pages/usuarios.js';
import { EncuestaHabitanteManager } from "./pages/encuestaHabitante.js";


class App {
  constructor() {
    this.init()
  }

  init() {
    document.addEventListener("DOMContentLoaded", () => {
      console.log("App inicializando...")
      console.log("Página actual:", window.location.pathname)
      console.log("Usuario autenticado:", AuthManager.isAuthenticated())
      setDynamicPageTitle()




      if (!AuthManager.shouldHaveAccess()) {
        console.log("Redirección bloqueada por shouldHaveAccess")
        return
      }

      this.setupBasicFeatures()
      UIManager.initCommonUI()

      if (!AuthManager.isLoginPage() && AuthManager.isAuthenticated()) {
        UIManager.init()
      }

      this.initPageSpecificModules()
      this.setupModalHandling()
    })
  }

  setupBasicFeatures() {
    if (document.getElementById("CurrentDate")) {
      setSpanishLongDate("CurrentDate")
    }
    setupBackButton("#btnVolver")
    setupBackButton("#IconBack")

    document.querySelector(".logout")?.addEventListener("click", (e) => {
      e.preventDefault()
      AuthManager.logout()
    })
  }

  initPageSpecificModules() {
    const currentPage = window.location.pathname.split("/").pop()
    const fullPath = window.location.pathname

    console.log("Inicializando módulos para:", currentPage)
    console.log("Ruta completa:", fullPath)

    // Página de login
    if (document.getElementById("LoginForm") || AuthManager.isLoginPage()) {
      console.log("Inicializando login...")
      LoginManager.init()
      return
    }

    // Página de dashboard/inicio
    if (
      document.querySelector(".DashboardScrollContainer") ||
      currentPage === "NavInicio.html" ||
      currentPage === "index.html" ||
      currentPage === "" ||
      fullPath.includes("NavInicio")
    ) {
      console.log("Inicializando dashboard...")
      DashboardManager.init()
    }

    // Página de Grupos de Ayudantes
    if (
      currentPage === "gruposAyudantes.html" ||
      currentPage === "GruposAyudantes.html" ||
      fullPath.includes("gruposAyudantes") ||
      fullPath.includes("GruposAyudantes") ||
      document.querySelector('[data-module="gruposAyudantes"]') ||
      document.querySelector("title")?.textContent?.includes("Grupos de Ayudantes")
    ) {
      console.log("Inicializando módulo de Grupos de Ayudantes...")
      GruposAyudantesManager.init()
      return
    }

    // Página de Habitantes
    if (
      currentPage === "Habitantes.html" ||
      currentPage === "habitantes.html" ||
      fullPath.includes("Habitantes") ||
      fullPath.includes("habitantes") ||
      document.querySelector("title")?.textContent?.includes("Habitantes")
    ) {
      console.log("Inicializando módulo de habitantes...")
      HabitantesManager.init()
      return
    }

    // Página de Cursos 
if (
  currentPage === "cursos.html" ||
  currentPage === "Cursos.html" ||
  fullPath.includes("cursos") ||
  fullPath.includes("Cursos") ||
  document.querySelector('[data-module="cursos"]') ||
  document.querySelector("title")?.textContent?.includes("Cursos")
) {
  console.log("Inicializando módulo de Cursos...")
  CursosManager.init()
  return
}
// Página de Usuarios
if (
  currentPage === "usuarios.html" ||
  currentPage === "Usuarios.html" ||
  fullPath.includes("usuarios") ||
  document.querySelector('[data-module="usuarios"]') ||
  document.querySelector("title")?.textContent?.includes("Usuarios")
) {
  console.log("Inicializando módulo de Usuarios…")
  UsuariosManager.init()
  return
}


// Página de Encuesta de Habitante
if (
  currentPage === "encuestaHabitante.html" ||
  currentPage === "EncuestaHabitante.html" ||
  fullPath.includes("encuestaHabitante") ||
  fullPath.includes("EncuestaHabitante") ||
  document.querySelector('[data-module="encuestaHabitante"]') ||
  document.querySelector("title")?.textContent?.includes("Encuesta de Habitante") ||
  document.querySelector("title")?.textContent?.includes("Encuesta del Habitante")
) {
  console.log("Inicializando módulo de Encuesta de Habitante…")
  EncuestaHabitanteManager.init()
  return
}




    // Página de oficina
    if (currentPage === "NavOficina.html" || document.getElementById("TablaHabitantes")) {
      console.log("Inicializando oficina...")
    }

    // Detección de fallback por contenido de tabla
    if (document.getElementById("dataTable") && !window.dataTableInitialized) {
      console.warn("Se detectó dataTable pero no se pudo identificar la página específica")
      const tableHeaders = document.querySelectorAll("#dataTable th")
      const headerText = Array.from(tableHeaders)
        .map((th) => th.textContent)
        .join(" ")

      if (headerText.includes("Grupo") && headerText.includes("Líder") && headerText.includes("Miembros")) {
        console.log("Detectado como página de Grupos de Ayudantes por contenido")
        GruposAyudantesManager.init()
      } else if (
        headerText.includes("Habitante") ||
        headerText.includes("Documento") ||
        headerText.includes("Fecha Nacimiento")
      ) {
        console.log("Detectado como página de Habitantes por contenido")
        HabitantesManager.init()
      }

      window.dataTableInitialized = true
    }
  }

  setupModalHandling() {
  if (AuthManager.isLoginPage()) return

  // SOLUCIÓN COMPLETA PARA EL PROBLEMA DEL BACKDROP
  if (!window.__modalBackdropFixInstalled) {
    window.__modalBackdropFixInstalled = true

    // Limpiar backdrops existentes al iniciar
    this.cleanModalBackdrops()

    // Manejar cuando se muestra un modal
    document.addEventListener('show.bs.modal', (e) => {
      const modal = e.target
      modal.style.zIndex = '1060'
      
      // Configurar el opener para el focus (tu código existente)
      const opener = e.relatedTarget instanceof HTMLElement ? e.relatedTarget : document.activeElement
      if (opener instanceof HTMLElement) {
        if (!opener.id) opener.dataset.tmpFocus = '1'
        modal.dataset.opener = opener.id || ''
      }
    })

    // Manejar cuando se está ocultando un modal
    document.addEventListener('hide.bs.modal', (e) => {
      const modal = e.target
      // Quitar foco de elementos dentro del modal
      if (modal.contains(document.activeElement)) {
        document.activeElement.blur?.()
      }
    })

    // Manejar cuando se ocultó completamente un modal
    document.addEventListener('hidden.bs.modal', (e) => {
      const modal = e.target
      
      // Pequeño delay para asegurar que Bootstrap terminó las animaciones
      setTimeout(() => {
        // Verificar si hay modales abiertos
        const openModals = document.querySelectorAll('.modal.show')
        
        if (openModals.length === 0) {
          // No hay modales abiertos, limpiar todo
          this.cleanModalBackdrops()
        } else {
          // Hay modales abiertos, solo limpiar backdrops extra
          this.cleanExtraBackdrops()
        }

        // Manejar el focus (tu código existente)
        this.handleModalFocus(modal)
      }, 20)
    })

    // También limpiar con la tecla ESC
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        setTimeout(() => {
          const openModals = document.querySelectorAll('.modal.show')
          if (openModals.length === 0) {
            this.cleanModalBackdrops()
          }
        }, 50)
      }
    })

    // Limpiar en navegación
    window.addEventListener('beforeunload', () => this.cleanModalBackdrops())
  }
}

// Agrega estos métodos dentro de la clase App:

cleanModalBackdrops() {
  // Remover todos los backdrops
  const backdrops = document.querySelectorAll('.modal-backdrop')
  backdrops.forEach(backdrop => {
    backdrop.remove()
  })
  
  // Resetear completamente el body
  document.body.classList.remove('modal-open')
  document.body.style.overflow = ''
  document.body.style.paddingRight = ''
  
  console.log('🧹 Backdrops limpiados')
}

cleanExtraBackdrops() {
  const backdrops = document.querySelectorAll('.modal-backdrop')
  // Si hay más de un backdrop, remover los extras
  if (backdrops.length > 1) {
    for (let i = 1; i < backdrops.length; i++) {
      backdrops[i].remove()
    }
  }
}

handleModalFocus(modal) {
  let opener = null
  const openerId = modal.dataset.opener || ''
  
  if (openerId) opener = document.getElementById(openerId)
  if (!opener) opener = document.querySelector('[data-tmp-focus="1"]')

  delete modal.dataset.opener

  if (opener instanceof HTMLElement) {
    opener.focus()
    opener.removeAttribute('data-tmp-focus')
  } else {
    // Fallback seguro
    const safe = document.querySelector('.TopBar .btn, .NavItem, [tabindex]:not([tabindex="-1"])')
    if (safe) {
      safe.focus()
    }
  }
}
}

// Inicializar la aplicación
new App()
