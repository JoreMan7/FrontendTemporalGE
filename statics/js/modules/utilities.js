export function setupBackButton(selector) {
  const backButton = document.querySelector(selector)
  backButton?.addEventListener("click", () => window.history.back())
}

export function setCurrentDate(
  elementId,
  options = {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  },
) {
  const element = document.getElementById(elementId)
  if (element) {
    element.textContent = new Date().toLocaleDateString("es-ES", options)
  }
}

export function setSpanishLongDate(elementId) {
  const element = document.getElementById(elementId)
  if (element) {
    const now = new Date()
    const options = {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    }
    element.textContent = now.toLocaleDateString("es-ES", options)
  }
}

export function isMobile() {
  return window.innerWidth <= 768
}

export function showToast(message, type = "default") {
  let toast = document.getElementById("toast")
  if (!toast) {
    toast = document.createElement("div")
    toast.id = "toast"
    toast.className = "toast"
    document.body.appendChild(toast)
  }

  toast.textContent = message
  toast.className = "toast show"

  if (type === "success") {
    toast.classList.add("success")
  } else if (type === "error") {
    toast.classList.add("error")
  }

  setTimeout(() => {
    toast.className = "toast"
  }, 3000)
}

export function showNotification(message, type = "default") {
  return showToast(message, type)
}

export function setDynamicPageTitle() {
  const titleElement = document.getElementById("pageTitle")
  if (!titleElement) return

  // Esperar a que el DOM esté completamente cargado
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      setDynamicPageTitle()
    })
    return
  }

  let titulo = document.title || "Sistema Eclesial" // Valor por defecto

  if (titulo.includes(" - ")) {
    titulo = titulo.split(" - ")[0]
  }

  // Remover acentos y convertir a mayúsculas
  titulo = titulo
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toUpperCase()

  titleElement.textContent = titulo
}
