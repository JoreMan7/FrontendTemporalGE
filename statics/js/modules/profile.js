import { ApiClient } from "./api.js"
import { showNotification } from "./utilities.js"

export class ProfileManager {
  static async loadProfile() {
    const result = await ApiClient.getUserProfile()

    if (result.success && result.data) {
      this.displayProfile(result.data)
    } else {
      showNotification("Error al cargar el perfil", "error")
    }
  }

  static displayProfile(userData) {
    const profileElements = {
      "profile-name": userData.nombre || "Usuario",
      "profile-email": userData.email || "",
      "profile-role": userData.rol || "Usuario",
      "profile-phone": userData.telefono || "",
      "profile-address": userData.direccion || "",
    }

    Object.keys(profileElements).forEach((elementId) => {
      const element = document.getElementById(elementId)
      if (element) {
        element.textContent = profileElements[elementId]
      }
    })

    // Actualizar avatar si existe
    const avatar = document.getElementById("profile-avatar")
    if (avatar && userData.avatar) {
      avatar.src = userData.avatar
    }
  }

  static async updateProfile(profileData) {
    const result = await ApiClient.request("/api/user/profile", {
      method: "PUT",
      body: JSON.stringify(profileData),
    })

    if (result.success) {
      showNotification("Perfil actualizado correctamente", "success")
      this.loadProfile()
    } else {
      showNotification(result.error || "Error al actualizar el perfil", "error")
    }
  }

  static setupProfileForm() {
    const form = document.getElementById("profile-form")
    if (!form) return

    form.addEventListener("submit", async (e) => {
      e.preventDefault()

      const formData = new FormData(form)
      const data = Object.fromEntries(formData.entries())

      await this.updateProfile(data)
    })
  }
}
