// app.js - CORREGIDO
import { setSpanishLongDate, setupBackButton, setDynamicPageTitle } from "./modules/utilities.js"
import { AuthManager } from "./modules/auth.js"
import { UIManager } from "./modules/ui.js"
import { LoginManager } from "./pages/login.js"
import { DashboardManager } from "./pages/dashboard.js"
import { HabitantesManager } from "./pages/habitantes.js"
import { GruposAyudantesManager } from "./pages/gruposAyudantes.js"
import { CursosManager } from './pages/cursos.js';
import { ProfileManager } from "./modules/profile.js"
import { UsuariosManager } from './pages/usuarios.js';
import { EncuestaHabitanteManager } from "./pages/encuestaHabitante.js";
import { TareasManager } from "./pages/tareas.js"
import { SessionManager } from "./modules/SessionManager.js"


class App {
  

  constructor() {
    this.init()
  }

  
  async init() {
  document.addEventListener("DOMContentLoaded", async () => {
    console.log("App inicializando...")
    console.log("Página actual:", window.location.pathname)
    
    // 1. Establecer título dinámico de la página
    setDynamicPageTitle()
    
    // 2. DEBUG: Verificar estado de autenticación
    console.log("🔐 Estado autenticación:", {
      isLoginPage: AuthManager.isLoginPage(),
      isAuthenticated: AuthManager.isAuthenticated(),
      hasToken: !!AuthManager.getToken()
    })
    
    // 3. Verificar acceso y autenticación
    try {
      const access = await Promise.race([
        AuthManager.shouldHaveAccess(),
        new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Timeout')), 5000)
        )
      ])
      
      if (!access) {
        console.log("Redirección por shouldHaveAccess")
        return
      }
    } catch (error) {
      console.warn("Auth verification timeout or error, continuing:", error)
      // En caso de error, verificar localmente
      if (!AuthManager.isAuthenticated() && !AuthManager.isLoginPage()) {
        AuthManager.redirectToLogin()
        return
      }
    }

    // 4. Configurar características básicas
    this.setupBasicFeatures()
    
    // 5. Inicializar UI común
    UIManager.init()
    console.log("Usuario en localStorage:", AuthManager.getUser());


    // 6. Inicializar módulos específicos de la página
    this.initPageSpecificModules()
    
    // 7. Configurar manejo de modales
    this.setupModalHandling()

    // 8. FINAL: Inicializar SessionManager solo si está autenticado y no es página de login
    if (!AuthManager.isLoginPage() && AuthManager.isAuthenticated()) {
      console.log("✅ Usuario autenticado, inicializando SessionManager...")
      
      try {
        console.log("📁 Importando SessionManager...")
        const { SessionManager } = await import("./modules/SessionManager.js")
        console.log("✅ SessionManager importado correctamente")
        
        // Inicializar SessionManager
        SessionManager.init()
        console.log("✅ SessionManager inicializado - Control de inactividad ACTIVADO")
        
      } catch (error) {
        console.error("❌ Error crítico al inicializar SessionManager:", error)
      }
    } else {
      console.log("ℹ️ SessionManager no requerido:", {
        isLoginPage: AuthManager.isLoginPage(),
        isAuthenticated: AuthManager.isAuthenticated()
      })
    }
    
    console.log("🎯 App completamente inicializada")
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

    // Página de Tareas
    if (
      currentPage === "tareas.html" ||
      currentPage === "Tareas.html" ||
      fullPath.includes("tareas") ||
      fullPath.includes("Tareas") ||
      document.querySelector('[data-module="tareas"]') ||
      document.querySelector("title")?.textContent?.includes("Tareas")
    ) {
      console.log("Inicializando módulo de Tareas...");
      TareasManager.init();
      return;
    }

    // Página de Perfil
  
    // Página de Perfil
    if (
  currentPage === "perfil.html" ||
  currentPage === "Perfil.html" ||
  fullPath.includes("/Ajustes/Perfil") ||
  document.querySelector('[data-module="perfil"]') ||
  document.querySelector("title")?.textContent?.includes("Perfil -")
) {
  console.log("Inicializando módulo de Perfil…")
  ProfileManager.init()   // <— sin await
  return
}


    if (
  currentPage === "citas.html" ||
  currentPage === "Citas.html" ||
  fullPath.includes("/Citas.html") ||
  fullPath.toLowerCase().includes("/citas.html") ||
  document.querySelector('[data-module="citas"]') ||
  document.querySelector("title")?.textContent?.toUpperCase().includes("CITAS")
) {
  console.log("Inicializando módulo de Citas...");
  import('./pages/citas.js')
    .then((mod) => {
      if (!mod?.CitasManager?.init) {
        console.error("CitasManager.init no encontrado. Revisa el export en pages/citas.js");
        return;
      }
      mod.CitasManager.init();
    })
    .catch((err) => console.error("Error al importar CitasManager:", err));
  return;
}

  if (
    document.querySelector(".DashboardScrollContainer") ||
    currentPage === "NavInicio.html" || 
    currentPage === "index.html" || 
    currentPage === "" || 
    fullPath.includes("NavInicio")
) {
    console.log("Inicializando dashboard...");
    import('./pages/dashboard.js')
        .then((mod) => {
            if (mod?.DashboardManager?.init) {
                mod.DashboardManager.init();
            }
        })
        .catch((err) => console.error("Error al importar DashboardManager:", err));
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

