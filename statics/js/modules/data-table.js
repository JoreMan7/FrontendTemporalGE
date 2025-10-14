// modules/data-table.js

export class DataTable {
  constructor(config) {
    this.config = {
      tableId: "dataTable",
      container: null,
      apiUrl: "",
      fetchData: null,
      columns: [],
      filters: [],
      pageSize: 10,
      enableSelection: true,
      enablePagination: true,
      enableFilters: true,
      ...config,
    }

    this.data = []
    this.filteredData = []
    this.currentPage = 1
    this.pageSize = this.config.pageSize
    this.selectedRows = new Set()
    this.currentFilters = {}
    this.columnVisibility = {}
    this.periodoTexto = "Últimos 30 días"
    this.fechaDesde = null
    this.fechaHasta = null

    this.init()
  }

  async init() {
    await this.loadData()
    this.initializeColumnVisibility()
    this.setDefaultColumnVisibility()
    this.renderTable()
    this.setupEventListeners()
    this.setupPeriodoEvents()
    this.setupNumericValidation()
  }

  setupNumericValidation() {
    // Validación en tiempo real para inputs numéricos
    document.addEventListener("input", (e) => {
      if (e.target.classList.contains("numeric-input")) {
        // Remover cualquier caracter que no sea número
        e.target.value = e.target.value.replace(/[^0-9]/g, "")
      }
    })

    // Prevenir pegado de texto no numérico
    document.addEventListener("paste", (e) => {
      if (e.target.classList.contains("numeric-input")) {
        e.preventDefault()
        const pastedText = (e.clipboardData || window.clipboardData).getData("text")
        const numbersOnly = pastedText.replace(/[^0-9]/g, "")
        if (document.execCommand) {
          document.execCommand("insertText", false, numbersOnly)
        } else {
          // Fallback para navegadores modernos
          e.target.value = e.target.value + numbersOnly
        }
      }
    })
  }

  async loadData() {
    try {
      let responseData

      if (this.config.fetchData) {
        responseData = await this.config.fetchData()
      } else {
        throw new Error("No se especificó método para cargar datos")
      }

      this.data = this.transformData(responseData)
      this.filteredData = [...this.data]
    } catch (error) {
      console.error("Error cargando datos:", error)
      this.showError("Error al cargar los datos")
    }
  }

  transformData(rawData) {
    if (!Array.isArray(rawData)) {
      if (rawData.data && Array.isArray(rawData.data)) {
        return rawData.data
      } else if (rawData.habitantes && Array.isArray(rawData.habitantes)) {
        return rawData.habitantes
      } else if (rawData.resultados && Array.isArray(rawData.resultados)) {
        return rawData.resultados
      }
      return []
    }
    return rawData
  }

  initializeColumnVisibility() {
    // Inicializar todas las columnas como no visibles primero
    this.config.columns.forEach((col) => {
      this.columnVisibility[col.key] = false
    })
    // Acciones siempre visibles
    this.columnVisibility["acciones"] = true
  }

  setDefaultColumnVisibility() {
    const defaultColumns = [
      "TipoDocumento",
      "NumeroDocumento",
      "Nombre",
      "Apellido",
      "IdGrupoFamiliar",
      "Sector",
      "EstadoCivil",
      "Religion",
      "TipoSacramento",
      "Telefono",
      "FechaRegistro", // <-- Agregada fecha de ingreso
    ]

    // Resetear todas las columnas primero
    Object.keys(this.columnVisibility).forEach((key) => {
      if (key !== "acciones") {
        this.columnVisibility[key] = false
      }
    })

    // Activar columnas por defecto
    defaultColumns.forEach((col) => {
      this.columnVisibility[col] = true
    })

    // Asegurar que acciones siempre estén visibles
    this.columnVisibility["acciones"] = true

    // Actualizar checkboxes en el modal
    this.updateColumnCheckboxes()
  }

  updateColumnCheckboxes() {
    Object.keys(this.columnVisibility).forEach((colKey) => {
      const cssClass = this.getColumnCssClass(colKey)
      const checkbox = document.querySelector(`.col-visibility[data-col="${cssClass}"]`)
      if (checkbox) {
        checkbox.checked = this.columnVisibility[colKey]
      }
    })
  }

  renderTable() {
    this.renderTableHead()
    this.renderTableBody()
    this.updatePagination()
    this.updateBulkActions()
  }

  renderTableHead() {
    const thead = document.querySelector(`#${this.config.tableId} thead tr`)
    if (!thead) return

    let html = ""

    if (this.config.enableSelection) {
      html += `<th width="50" class="text-center">
                <input type="checkbox" id="selectAll" class="form-check-input" title="Seleccionar todos los registros">
            </th>`
    }

    this.config.columns.forEach((col) => {
      const isVisible = this.columnVisibility[col.key]
      const displayStyle = isVisible ? "" : "display: none;"
      const cssClass = this.getColumnCssClass(col.key)
      html += `<th class="${cssClass}" style="${displayStyle}">
                <div class="d-flex align-items-center justify-content-between">
                    <span>${col.label}</span>
                </div>
            </th>`
    })

    // Acciones siempre visibles
    html += `<th width="150" class="col-acciones">Acciones</th>`

    thead.innerHTML = html
  }

  renderTableBody() {
    const tbody = document.querySelector(`#${this.config.tableId} tbody`)
    if (!tbody) return

    if (this.filteredData.length === 0) {
      tbody.innerHTML = this.renderEmptyState()
      return
    }

    const start = (this.currentPage - 1) * this.pageSize
    const end = start + this.pageSize
    const pageData = this.filteredData.slice(start, end)

    tbody.innerHTML = pageData.map((row, index) => this.renderTableRow(row, start + index)).join("")
  }

  renderTableRow(rowData, index) {
    const isSelected = this.selectedRows.has(rowData.IdHabitante?.toString() || index.toString())

    let html = "<tr>"

    // Checkbox por fila
    if (this.config.enableSelection) {
      html += `<td class="text-center">
                <input type="checkbox" class="form-check-input row-checkbox" 
                       ${isSelected ? "checked" : ""}
                       onchange="window.habitantesDataTable.toggleRowSelection('${rowData.IdHabitante || index}')">
            </td>`
    }

    // Celdas de datos
    this.config.columns.forEach((col) => {
      const isVisible = this.columnVisibility[col.key]
      const value = this.getNestedValue(rowData, col.key)
      const formattedValue = col.format ? col.format(value, rowData) : value
      const displayStyle = isVisible ? "" : "display: none;"
      const cssClass = this.getColumnCssClass(col.key)
      html += `<td class="${cssClass}" style="${displayStyle}">${formattedValue || "-"}</td>`
    })

    // Acciones siempre visibles
    html += `<td class="col-acciones">
            <div class="d-flex gap-1">${this.renderRowActions(rowData)}</div>
        </td>`

    html += "</tr>"
    return html
  }

  getColumnCssClass(key) {
    const classMap = {
      IdHabitante: "id",
      TipoDocumento: "tipo-doc",
      NumeroDocumento: "num-doc",
      Nombre: "nombres",
      Apellido: "apellidos",
      FechaNacimiento: "fecha-nacimiento",
      FechaRegistro: "fecha-ingreso", // <-- Mapeo correcto para fecha de ingreso
      Hijos: "hijos",
      Sexo: "sexo",
      IdGrupoFamiliar: "familia",
      Sector: "sector",
      EstadoCivil: "estado-civil",
      TipoPoblacion: "poblacion",
      Religion: "religion",
      TipoSacramento: "sacramentos",
      Direccion: "direccion",
      Telefono: "celular",
      CorreoElectronico: "email",
      DiscapacidadParaAsistir: "discapacidad",
      acciones: "acciones",
    }
    return `col-${classMap[key] || key.toLowerCase()}`
  }

  renderRowActions(rowData) {
    return this.config.rowActions
      .map(
        (action) => `
            <button class="btn btn-sm ${action.class || "btn-outline-primary"}" 
                    onclick="window.habitantesDataTable.handleAction('${action.id}', ${JSON.stringify(rowData).replace(/'/g, "\\'")})}"
                    title="${action.title || action.label}">
                <i class="${action.icon || "fas fa-cog"}"></i>
                ${action.showLabel ? action.label : ""}
            </button>
        `,
      )
      .join("")
  }

  renderEmptyState() {
    const visibleColumnsCount = Object.values(this.columnVisibility).filter((v) => v).length
    const totalColumns = visibleColumnsCount + (this.config.enableSelection ? 1 : 0) + 1 // +1 para acciones

    return `
            <tr>
                <td colspan="${totalColumns}" class="text-center py-5">
                    <div class="empty-state">
                        <i class="fas fa-inbox fa-3x text-muted mb-3"></i>
                        <h5 class="text-muted">${this.config.emptyState?.title || "No hay datos disponibles"}</h5>
                        <p class="text-muted">${this.config.emptyState?.message || "No se encontraron registros que coincidan con los criterios."}</p>
                    </div>
                </td>
            </tr>
        `
  }

  setupEventListeners() {
    document.getElementById("selectAll")?.addEventListener("change", (e) => {
      this.toggleSelectAll(e.target.checked)
    })

    // Paginación
    document.getElementById("pageSizeSelect")?.addEventListener("change", (e) => {
      this.setPageSize(Number.parseInt(e.target.value))
    })

    // Acciones múltiples
    document.getElementById("btnPrintSelected")?.addEventListener("click", () => {
      this.handleBulkAction("print")
    })

    document.getElementById("btnExportSelected")?.addEventListener("click", () => {
      this.handleBulkAction("export")
    })

    document.getElementById("btnDeleteSelected")?.addEventListener("click", () => {
      this.handleBulkAction("delete")
    })

    // Filtros
    document.getElementById("btnApplyFilters")?.addEventListener("click", () => {
      this.applyFilters()
      this.closeModal("filtersModal")
    })

    document.getElementById("btnClearFilters")?.addEventListener("click", () => {
      this.clearFiltersOnly()
    })

    // Columnas visibles
    document.getElementById("btnSelectAllColumns")?.addEventListener("click", () => {
      this.toggleAllColumns(true)
    })

    document.getElementById("btnDeselectAllColumns")?.addEventListener("click", () => {
      this.toggleAllColumns(false)
    })

    document.querySelectorAll(".col-visibility").forEach((checkbox) => {
      checkbox.addEventListener("change", (e) => {
        const colKey = e.target.getAttribute("data-col")
        this.toggleColumnVisibility(colKey, e.target.checked)
      })
    })

    document.getElementById("btnResetColumns")?.addEventListener("click", () => {
      this.resetColumnVisibilityToDefault()
    })
  }

  resetColumnVisibilityToDefault() {
    // Establecer configuración por defecto sin importar estado actual
    this.setDefaultColumnVisibility()
    this.renderTable()

    // Mostrar confirmación
    this.showTemporaryMessage("Columnas restablecidas a configuración por defecto", "success")
  }

  showTemporaryMessage(message, type = "info") {
    if (typeof Swal !== "undefined") {
      Swal.fire({
        title: message,
        icon: type,
        timer: 2000,
        showConfirmButton: false,
        toast: true,
        position: "top-end",
      })
    } else {
      console.log(message)
    }
  }

  setupPeriodoEvents() {
    document.querySelectorAll('input[name="periodo"]').forEach((radio) => {
      radio.addEventListener("change", (e) => {
        if (e.target.value === "personalizado") {
          document.getElementById("rangoPersonalizado").style.display = "block"
        } else {
          document.getElementById("rangoPersonalizado").style.display = "none"
        }
      })
    })

    document.getElementById("btnPeriodoApply")?.addEventListener("click", () => {
      this.applyPeriodFilter()
    })
  }

  closeModal(modalId) {
    const modalElement = document.getElementById(modalId)
    if (modalElement) {
      const modal = bootstrap.Modal.getInstance(modalElement)
      if (modal) {
        modal.hide()
      }
    }
  }

  toggleColumnVisibility(colKey, isVisible) {
    // Mapear clase CSS a key de columna
    const keyMap = {
      "tipo-doc": "TipoDocumento",
      "num-doc": "NumeroDocumento",
      nombres: "Nombre",
      apellidos: "Apellido",
      "fecha-nacimiento": "FechaNacimiento",
      "fecha-ingreso": "FechaRegistro", // <-- Mapeo correcto
      hijos: "Hijos",
      sexo: "Sexo",
      familia: "IdGrupoFamiliar",
      sector: "Sector",
      "estado-civil": "EstadoCivil",
      poblacion: "TipoPoblacion",
      religion: "Religion",
      sacramentos: "TipoSacramento",
      direccion: "Direccion",
      celular: "Telefono",
      email: "CorreoElectronico",
      discapacidad: "DiscapacidadParaAsistir",
      id: "IdHabitante",
      acciones: "acciones",
    }

    const columnKey = keyMap[colKey] || colKey
    this.columnVisibility[columnKey] = isVisible

    const headerColumns = document.querySelectorAll(`th.col-${colKey}`)
    const dataColumns = document.querySelectorAll(`td.col-${colKey}`)

    const displayValue = isVisible ? "" : "none"

    headerColumns.forEach((col) => (col.style.display = displayValue))
    dataColumns.forEach((col) => (col.style.display = displayValue))

    if (this.filteredData.length === 0) {
      this.renderTableBody()
    }
  }

  toggleAllColumns(show) {
    document.querySelectorAll(".col-visibility").forEach((checkbox) => {
      // No afectar columna de acciones
      if (checkbox.getAttribute("data-col") !== "acciones") {
        checkbox.checked = show
        const colKey = checkbox.getAttribute("data-col")
        this.toggleColumnVisibility(colKey, show)
      }
    })

    this.renderTableHead()
    this.renderTableBody()
  }

  applyFilters() {
    const filters = this.gatherFilters()
    this.currentFilters = filters

    // Aplicar filtros de texto y categorías
    let filteredData = this.data.filter((item) => {
      // Filtros de texto
      if (filters.numDoc && !this.matchesTextFilter(item.NumeroDocumento, filters.numDoc)) return false
      if (filters.nombres && !this.matchesTextFilter(item.Nombre, filters.nombres)) return false
      if (filters.apellidos && !this.matchesTextFilter(item.Apellido, filters.apellidos)) return false
      if (filters.email && !this.matchesTextFilter(item.CorreoElectronico, filters.email)) return false
      if (filters.telefono && !this.matchesTextFilter(item.Telefono, filters.telefono)) return false
      if (filters.direccion && !this.matchesTextFilter(item.Direccion, filters.direccion)) return false

      // Filtros de selección
      if (filters.tipoDoc && item.TipoDocumento !== filters.tipoDoc) return false

      // Filtros de checkbox
      if (filters.sexo && filters.sexo.length > 0 && !filters.sexo.includes(item.Sexo)) return false
      if (filters.estadoCivil && filters.estadoCivil.length > 0 && !filters.estadoCivil.includes(item.EstadoCivil))
        return false
      if (filters.poblacion && filters.poblacion.length > 0 && !filters.poblacion.includes(item.TipoPoblacion))
        return false
      if (filters.religion && filters.religion.length > 0 && !filters.religion.includes(item.Religion)) return false

      if (filters.discapacidad && filters.discapacidad.length > 0) {
        const tieneDiscapacidad = item.DiscapacidadParaAsistir ? "Sí" : "No"
        if (!filters.discapacidad.includes(tieneDiscapacidad)) return false
      }

      // Filtros de sacramentos
      if (filters.sacramentos && filters.sacramentos.length > 0) {
        if (!filters.sacramentos.some((sacramento) => item.TipoSacramento && item.TipoSacramento.includes(sacramento)))
          return false
      }

      return true
    })

    if (this.fechaDesde || this.fechaHasta) {
      filteredData = filteredData.filter((item) => {
        const fechaItem = new Date(item.FechaRegistro || item.fecha_registro)
        if (isNaN(fechaItem.getTime())) return false

        const cumpleDesde = !this.fechaDesde || fechaItem >= this.fechaDesde
        const cumpleHasta = !this.fechaHasta || fechaItem <= this.fechaHasta

        return cumpleDesde && cumpleHasta
      })
    }

    this.filteredData = filteredData
    this.currentPage = 1
    this.renderTable()
  }

  matchesTextFilter(value, filter) {
    if (!value || !filter) return false
    return value.toString().toLowerCase().includes(filter.toLowerCase())
  }

  gatherFilters() {
    const filters = {}

    // Filtros de texto
    const textFilters = ["numDoc", "nombres", "apellidos", "email", "telefono", "direccion"]
    textFilters.forEach((filter) => {
      const element = document.getElementById(`${filter}Filter`)
      if (element && element.value.trim()) {
        filters[filter] = element.value.trim()
      }
    })

    // Filtros de select
    const selectElement = document.getElementById("tipoDocFilter")
    if (selectElement && selectElement.value) {
      filters.tipoDoc = selectElement.value
    }

    // Filtros de checkbox
    const checkboxGroups = {
      sexo: "sexo-filter",
      estadoCivil: "estado-civil-filter",
      poblacion: "poblacion-filter",
      religion: "religion-filter",
      discapacidad: "discapacidad-filter",
    }

    for (const [key, className] of Object.entries(checkboxGroups)) {
      const checked = Array.from(document.querySelectorAll(`.${className}:checked`)).map((cb) => cb.value)
      if (checked.length > 0) {
        filters[key] = checked
      }
    }

    // Filtros de select múltiple
    const sacramentosSelect = document.getElementById("sacramentoFilter")
    if (sacramentosSelect) {
      const selectedSacramentos = Array.from(sacramentosSelect.selectedOptions).map((option) => option.value)
      if (selectedSacramentos.length > 0) {
        filters.sacramentos = selectedSacramentos
      }
    }

    return filters
  }

  clearFiltersOnly() {
    // Limpiar todos los inputs de filtro (NO fechas ni columnas)
    document.querySelectorAll('#filtersModal input[type="text"]:not(.col-visibility)').forEach((input) => {
      input.value = ""
    })

    document.querySelectorAll("#filtersModal select:not(#sacramentoFilter)").forEach((select) => {
      select.value = ""
    })

    document.querySelectorAll('#filtersModal input[type="checkbox"]:not(.col-visibility)').forEach((checkbox) => {
      checkbox.checked = false
    })

    // Resetear select múltiple de sacramentos
    const sacramentosSelect = document.getElementById("sacramentoFilter")
    if (sacramentosSelect) {
      Array.from(sacramentosSelect.options).forEach((option) => {
        option.selected = false
      })
    }

    // Las fechas se mantienen tal como están

    this.currentFilters = {}
    // Aplicar filtros (mantendrá las fechas)
    this.applyFilters()
  }

  applyPeriodFilter() {
    const periodo = document.querySelector('input[name="periodo"]:checked')?.value
    let textoPeriodo = ""

    const hoy = new Date()
    switch (periodo) {
      case "30dias":
        this.fechaDesde = new Date(hoy)
        this.fechaDesde.setDate(hoy.getDate() - 30)
        this.fechaHasta = hoy
        textoPeriodo = "Últimos 30 días"
        break
      case "mes":
        this.fechaDesde = new Date(hoy.getFullYear(), hoy.getMonth(), 1)
        this.fechaHasta = hoy
        textoPeriodo = "Último mes"
        break
      case "trimestre":
        this.fechaDesde = new Date(hoy)
        this.fechaDesde.setMonth(hoy.getMonth() - 3)
        this.fechaHasta = hoy
        textoPeriodo = "Último trimestre"
        break
      case "semestre":
        this.fechaDesde = new Date(hoy)
        this.fechaDesde.setMonth(hoy.getMonth() - 6)
        this.fechaHasta = hoy
        textoPeriodo = "Último semestre"
        break
      case "anio":
        this.fechaDesde = new Date(hoy)
        this.fechaDesde.setFullYear(hoy.getFullYear() - 1)
        this.fechaHasta = hoy
        textoPeriodo = "Último año"
        break
      case "personalizado":
        this.fechaDesde = new Date(document.getElementById("fechaDesdePersonalizado").value)
        this.fechaHasta = new Date(document.getElementById("fechaHastaPersonalizado").value)
        if (isNaN(this.fechaDesde.getTime()) || isNaN(this.fechaHasta.getTime())) {
          this.showError("Seleccione fechas válidas para el rango personalizado")
          return
        }
        textoPeriodo = `Del ${this.fechaDesde.toLocaleDateString("es-ES")} al ${this.fechaHasta.toLocaleDateString("es-ES")}`
        break
    }

    // Actualizar texto del período
    this.periodoTexto = textoPeriodo
    document.getElementById("periodoTexto").textContent = textoPeriodo

    // Aplicar filtros existentes + nuevo filtro de fecha
    this.applyFilters()

    // Cerrar modal
    this.closeModal("periodoModal")
  }

  toggleSelectAll(checked) {
    const checkboxes = document.querySelectorAll(".row-checkbox")
    const currentPageData = this.getCurrentPageData()

    checkboxes.forEach((checkbox, index) => {
      checkbox.checked = checked
      if (index < currentPageData.length) {
        const rowId = currentPageData[index].IdHabitante?.toString() || index.toString()
        if (checked) {
          this.selectedRows.add(rowId)
        } else {
          this.selectedRows.delete(rowId)
        }
      }
    })

    this.updateBulkActions()
  }

  getCurrentPageData() {
    const start = (this.currentPage - 1) * this.pageSize
    const end = start + this.pageSize
    return this.filteredData.slice(start, end)
  }

  toggleRowSelection(rowId) {
    if (this.selectedRows.has(rowId)) {
      this.selectedRows.delete(rowId)
    } else {
      this.selectedRows.add(rowId)
    }
    this.updateBulkActions()
  }

  updateBulkActions() {
    const bulkActions = document.getElementById("bulkActions")
    const selectedCount = document.getElementById("selectedCount")

    if (this.selectedRows.size > 0) {
      bulkActions?.classList.remove("d-none")
      bulkActions?.classList.add("d-flex")
      selectedCount.textContent = this.selectedRows.size
    } else {
      bulkActions?.classList.add("d-none")
      bulkActions?.classList.remove("d-flex")
    }

    const allCheckboxes = document.querySelectorAll(".row-checkbox")
    const selectAll = document.getElementById("selectAll")
    if (selectAll && allCheckboxes.length > 0) {
      const checkedCount = Array.from(allCheckboxes).filter((cb) => cb.checked).length
      const totalCount = allCheckboxes.length

      selectAll.checked = checkedCount === totalCount && totalCount > 0
      selectAll.indeterminate = checkedCount > 0 && checkedCount < totalCount
    }
  }

  updatePagination() {
    this.updatePaginationInfo()
    this.renderPaginationButtons()
  }

  updatePaginationInfo() {
    const total = this.filteredData.length
    const start = total === 0 ? 0 : (this.currentPage - 1) * this.pageSize + 1
    const end = Math.min(start + this.pageSize - 1, total)

    const infoElement = document.getElementById("paginationInfo")
    if (infoElement) {
      infoElement.textContent = `Mostrando ${start}-${end} de ${total} registros`
    }
  }

  renderPaginationButtons() {
    const container = document.getElementById("paginationButtons")
    if (!container || !this.config.enablePagination) return

    const totalPages = Math.ceil(this.filteredData.length / this.pageSize)

    let buttons = `
            <button class="btn btn-sm btn-outline-primary" ${this.currentPage === 1 ? "disabled" : ""} 
                    onclick="window.habitantesDataTable.previousPage()">
                <i class="fas fa-chevron-left"></i>
            </button>
        `

    const startPage = Math.max(1, this.currentPage - 2)
    const endPage = Math.min(totalPages, this.currentPage + 2)

    for (let i = startPage; i <= endPage; i++) {
      buttons += `
                <button class="btn btn-sm ${i === this.currentPage ? "btn-primary" : "btn-outline-primary"}" 
                        onclick="window.habitantesDataTable.goToPage(${i})">
                    ${i}
                </button>
            `
    }

    buttons += `
            <button class="btn btn-sm btn-outline-primary" ${this.currentPage === totalPages ? "disabled" : ""} 
                    onclick="window.habitantesDataTable.nextPage()">
                <i class="fas fa-chevron-right"></i>
            </button>
        `

    container.innerHTML = buttons
  }

  setPageSize(size) {
    this.pageSize = size
    this.currentPage = 1
    this.renderTable()
  }

  goToPage(page) {
    const totalPages = Math.ceil(this.filteredData.length / this.pageSize)
    if (page >= 1 && page <= totalPages) {
      this.currentPage = page
      this.renderTable()
    }
  }

  nextPage() {
    this.goToPage(this.currentPage + 1)
  }

  previousPage() {
    this.goToPage(this.currentPage - 1)
  }

  getNestedValue(obj, path) {
    return path.split(".").reduce((current, key) => current?.[key], obj)
  }

  handleAction(actionId, rowData) {
    const action = this.config.rowActions?.find((a) => a.id === actionId)
    if (action && action.handler) {
      action.handler(rowData)
    }
  }

  handleBulkAction(actionId) {
    const selectedData = this.data.filter((item) => this.selectedRows.has(item.IdHabitante?.toString() || ""))

    const action = this.config.bulkActions?.find((a) => a.id === actionId)
    if (action && action.handler) {
      action.handler(selectedData)
    }
  }

  showError(message) {
    console.error("DataTable Error:", message)
    if (typeof Swal !== "undefined") {
      Swal.fire("Error", message, "error")
    } else {
      alert("Error: " + message)
    }
  }

  async refresh() {
    await this.loadData()
    this.applyFilters()
  }

  updateData(newData) {
    this.data = this.transformData(newData)
    this.filteredData = [...this.data]
    this.renderTable()
  }
}

window.habitantesDataTable = null
