import { ApiClient } from "./api.js"
import { showNotification } from "./utilities.js"

export class FormManager {
  static async handleFormSubmit(formId, endpoint, successCallback) {
    const form = document.getElementById(formId)
    if (!form) return

    form.addEventListener("submit", async (e) => {
      e.preventDefault()

      const formData = new FormData(form)
      const data = Object.fromEntries(formData.entries())

      const result = await ApiClient.request(endpoint, {
        method: "POST",
        body: JSON.stringify(data),
      })

      if (result.success) {
        showNotification("Operación exitosa", "success")
        if (successCallback) successCallback(result)
        form.reset()
      } else {
        showNotification(result.error || "Error en la operación", "error")
      }
    })
  }

  static populateForm(formId, data) {
    const form = document.getElementById(formId)
    if (!form) return

    Object.keys(data).forEach((key) => {
      const input = form.querySelector(`[name="${key}"]`)
      if (input) {
        input.value = data[key] || ""
      }
    })
  }

  static clearForm(formId) {
    const form = document.getElementById(formId)
    if (form) form.reset()
  }

  static validateForm(formId, rules) {
    const form = document.getElementById(formId)
    if (!form) return false

    let isValid = true
    const errors = []

    Object.keys(rules).forEach((fieldName) => {
      const input = form.querySelector(`[name="${fieldName}"]`)
      const rule = rules[fieldName]

      if (rule.required && !input.value.trim()) {
        isValid = false
        errors.push(`${rule.label || fieldName} es requerido`)
      }

      if (rule.minLength && input.value.length < rule.minLength) {
        isValid = false
        errors.push(`${rule.label || fieldName} debe tener al menos ${rule.minLength} caracteres`)
      }

      if (rule.pattern && !rule.pattern.test(input.value)) {
        isValid = false
        errors.push(rule.message || `${rule.label || fieldName} no es válido`)
      }
    })

    if (!isValid) {
      showNotification(errors.join("\n"), "error")
    }

    return isValid
  }
}
