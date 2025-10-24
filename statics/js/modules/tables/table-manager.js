import { AuthManager } from "../auth.js"
import { ApiClient } from "../api.js"
import { TablePagination } from "./table-pagination.js"
import { TableFilters } from "./table-filters.js"
import { formatFecha, applyColumnVisibility } from "./tables-helper.js"

export class TableManager {
  constructor() {
    this.habitantesData = []
    this.opcionesData = {}
    this.filteredData = []
    this.pagination = new TablePagination(this)
    this.filters = new TableFilters(this)
  }

  // ========================
  // Inicialización
  // ========================
  async init() {
    // Validar sesión
    if (!AuthManager.isAuthenticated()) {
      AuthManager.redirectToLogin()
      return
    }

    try {
      await this.loadInitialData()
      this.pagination.setupEvents()
      this.filters.setupDefaultPeriod()
      this.filters.applyFilters()
      this.setupModalEvents()
      this.setupPeriodoTextClick()
    } catch (err) {
      console.error("[ERROR] Al iniciar:", err)
      alert("Error al cargar los datos.")
    }
  }

  // ========================
  // Cargar datos
  // ========================
  async loadInitialData() {
    await this.loadOpciones()
    await this.loadHabitantes()
  }

  async loadOpciones() {
    const response = await ApiClient.request("/api/opciones/")
    if (response.success === false) {
      throw new Error("Error al cargar opciones")
    }
    this.opcionesData = response
    this.populateFilterOptions()
  }

  async loadHabitantes() {
    const data = await ApiClient.getHabitantes()

    if (data.success && data.habitantes) {
      this.habitantesData = data.habitantes
      this.filteredData = [...this.habitantesData]
      this.updateTableWithPagination()
    } else {
      throw new Error("Formato inválido de respuesta")
    }
  }

  // ========================
  // Actualizar tabla
  // ========================
  updateTableWithPagination() {
    this.populateTable(this.filteredData)
    this.pagination.updateButtons()
    applyColumnVisibility()
  }

  populateTable(dataToShow = this.filteredData) {
    const tbody = document.getElementById("tablaHabitantesBody")
    if (!tbody) return

    tbody.innerHTML = ""

    const paginatedData = this.pagination.getPaginatedData(dataToShow)

    paginatedData.forEach((h) => {
      const row = document.createElement("tr")
      row.innerHTML = `
                <td><input type="checkbox" class="row-checkbox" onchange="updateBulkActions()"></td>
                <td class="col-id">${h.IdHabitante}</td>
                <td class="col-tipo-doc">${h.TipoDocumento || "-"}</td>
                <td class="col-num-doc">${h.NumeroDocumento}</td>
                <td class="col-nombres">${h.Nombre}</td>
                <td class="col-apellidos">${h.Apellido}</td>
                <td class="col-fecha-nacimiento">${formatFecha(h.FechaNacimiento)}</td>
                <td class="col-hijos">${h.Hijos || 0}</td>
                <td class="col-sexo">${h.Sexo || "-"}</td>
                <td class="col-familia">${h.IdGrupoFamiliar ? `Familia ${h.IdGrupoFamiliar}` : "Sin familia"}</td>
                <td class="col-sector">${h.Sector || "Sin sector"}</td>
                <td class="col-estado-civil">${h.EstadoCivil || "-"}</td>
                <td class="col-poblacion">${h.TipoPoblacion || "-"}</td>
                <td class="col-religion">${h.Religion || "-"}</td>
                <td class="col-sacramentos">${h.TipoSacramento || "Ninguno"}</td>
                <td class="col-direccion">${h.Direccion || "-"}</td>
                <td class="col-celular">${h.Telefono || "-"}</td>
                <td class="col-email">${h.CorreoElectronico || "-"}</td>
                <td class="col-discapacidad">${h.DiscapacidadParaAsistir || "-"}</td>
                <td>
                    <div class="action-buttons">
                        <button class="btn btn-edit btn-sm">Editar</button>
                        <button class="btn btn-delete btn-sm">Eliminar</button>
                        <button class="btn btn-print btn-sm">Imprimir</button>
                    </div>
                </td>`
      tbody.appendChild(row)
    })

    this.pagination.updateInfo(dataToShow.length)
  }

  // ========================
  // Opciones de filtros dinámicas
  // ========================
  populateFilterOptions() {
    this.populateCheckboxOptions("tiposDocumento", "tiposDocumentoContainer", "tipoDoc", "tipo")
    this.populateCheckboxOptions("sexos", "sexosContainer", "sexo", "sexo")
    this.populateCheckboxOptions("sectores", "sectoresContainer", "sector", "sector")
    this.populateCheckboxOptions("estadosCiviles", "estadosCivilesContainer", "estadoCivil", "estado")
    this.populateCheckboxOptions("poblaciones", "poblacionesContainer", "poblacion", "poblacion")
    this.populateCheckboxOptions("religiones", "religionesContainer", "religion", "religion")
  }

  populateCheckboxOptions(dataKey, containerId, inputName, idPrefix) {
    if (!this.opcionesData[dataKey]) return

    const container = document.getElementById(containerId)
    if (!container) return

    container.innerHTML = ""
    this.opcionesData[dataKey].forEach((item) => {
      const div = document.createElement("div")
      div.className = "checkbox-item"
      const label = item.Descripcion || item.Nombre
      div.innerHTML = `
                <input type="checkbox" id="${idPrefix}-${item.id}" name="${inputName}" value="${label}">
                <label for="${idPrefix}-${item.id}">${label}</label>`
      container.appendChild(div)
    })
  }

  // ========================
  // Eventos de modales
  // ========================
  setupModalEvents() {
    window.onclick = (event) => {
      const modal = document.getElementById("filtersModal")
      const periodoModal = document.getElementById("periodoModal")
      if (event.target === modal) modal.style.display = "none"
      if (event.target === periodoModal) periodoModal.style.display = "none"
    }
  }

  setupPeriodoTextClick() {
    const periodoTexto = document.getElementById("periodoTexto")
    if (periodoTexto) {
      periodoTexto.style.cursor = "pointer"
      periodoTexto.addEventListener("click", () => this.filters.openPeriodoModal())
    }
  }
}

// Inicializar cuando el DOM esté listo
document.addEventListener("DOMContentLoaded", async () => {
  const tableManager = new TableManager()
  await tableManager.init()

  // Exponer globalmente para uso en HTML
  window.tableManager = tableManager
})
