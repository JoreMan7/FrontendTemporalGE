import { formatFecha } from "./tables-helper.js"

export class TableFilters {
  constructor(tableManager) {
    this.tableManager = tableManager
  }

  // ========================
  // Período por defecto
  // ========================
  setupDefaultPeriod() {
    this.setPeriodoTexto("Últimos 30 días")
    const hoy = new Date()
    const hace30 = new Date()
    hace30.setDate(hoy.getDate() - 30)

    const fechaHastaEl = document.getElementById("fechaHasta")
    const fechaDesdeEl = document.getElementById("fechaDesde")

    if (fechaHastaEl) fechaHastaEl.value = hoy.toISOString().split("T")[0]
    if (fechaDesdeEl) fechaDesdeEl.value = hace30.toISOString().split("T")[0]
  }

  setPeriodoTexto(label) {
    const el = document.getElementById("periodoTexto")
    if (el) el.textContent = label
  }

  // ========================
  // Aplicar filtros
  // ========================
  applyFilters() {
    const numDoc = document.getElementById("numDocFilter")?.value.toLowerCase() || ""
    const nombres = document.getElementById("nombresFilter")?.value.toLowerCase() || ""
    const apellidos = document.getElementById("apellidosFilter")?.value.toLowerCase() || ""
    const email = document.getElementById("emailFilter")?.value.toLowerCase() || ""
    const celular = document.getElementById("celularFilter")?.value.toLowerCase() || ""
    const direccion = document.getElementById("direccionFilter")?.value.toLowerCase() || ""

    const fechaDesde = document.getElementById("fechaDesde")?.value
    const fechaHasta = document.getElementById("fechaHasta")?.value

    const tiposDoc = Array.from(document.querySelectorAll('input[name="tipoDoc"]:checked')).map((cb) => cb.value)
    const sectores = Array.from(document.querySelectorAll('input[name="sector"]:checked')).map((cb) => cb.value)
    const estadosCiviles = Array.from(document.querySelectorAll('input[name="estadoCivil"]:checked')).map(
      (cb) => cb.value,
    )
    const religiones = Array.from(document.querySelectorAll('input[name="religion"]:checked')).map((cb) => cb.value)
    const sexos = Array.from(document.querySelectorAll('input[name="sexo"]:checked')).map((cb) => cb.value)
    const poblaciones = Array.from(document.querySelectorAll('input[name="poblacion"]:checked')).map((cb) => cb.value)

    this.tableManager.filteredData = this.tableManager.habitantesData.filter((h) => {
      let show = true

      if (numDoc && !h.NumeroDocumento?.toLowerCase().includes(numDoc)) show = false
      if (nombres && !h.Nombre?.toLowerCase().includes(nombres)) show = false
      if (apellidos && !h.Apellido?.toLowerCase().includes(apellidos)) show = false
      if (email && !h.CorreoElectronico?.toLowerCase().includes(email)) show = false
      if (celular && !h.Telefono?.toLowerCase().includes(celular)) show = false
      if (direccion && !h.Direccion?.toLowerCase().includes(direccion)) show = false

      if (tiposDoc.length > 0 && !tiposDoc.includes(h.TipoDocumento)) show = false
      if (sectores.length > 0 && !sectores.includes(h.Sector)) show = false
      if (estadosCiviles.length > 0 && !estadosCiviles.includes(h.EstadoCivil)) show = false
      if (religiones.length > 0 && !religiones.includes(h.Religion)) show = false
      if (sexos.length > 0 && !sexos.includes(h.Sexo)) show = false
      if (poblaciones.length > 0 && !poblaciones.includes(h.TipoPoblacion)) show = false

      if (fechaDesde || fechaHasta) {
        const fechaHab = new Date(h.FechaRegistro)
        const fechaHabStr = this.toLocalDateString(fechaHab)
        if (fechaDesde && fechaHabStr < fechaDesde) show = false
        if (fechaHasta && fechaHabStr > fechaHasta) show = false
      }

      return show
    })

    this.tableManager.pagination.reset()
    this.tableManager.updateTableWithPagination()
    this.closeFiltersModal()
  }

  // ========================
  // Limpiar filtros
  // ========================
  clearAllFilters() {
    const filterCheckboxes = document.querySelectorAll('#filtersModal input[type="checkbox"]:not([id^="col-"])')
    filterCheckboxes.forEach((cb) => (cb.checked = false))
    ;["numDocFilter", "nombresFilter", "apellidosFilter", "emailFilter", "celularFilter", "direccionFilter"].forEach(
      (id) => {
        const el = document.getElementById(id)
        if (el) el.value = ""
      },
    )

    this.tableManager.filteredData = [...this.tableManager.habitantesData]
    this.tableManager.pagination.reset()
    this.tableManager.updateTableWithPagination()
    this.closeFiltersModal()
  }

  // ========================
  // Modales
  // ========================
  toggleFilters() {
    const modal = document.getElementById("filtersModal")
    if (modal) modal.style.display = "block"
  }

  closeFiltersModal() {
    const modal = document.getElementById("filtersModal")
    if (modal) modal.style.display = "none"
  }

  openPeriodoModal() {
    const modal = document.getElementById("periodoModal")
    if (modal) modal.style.display = "block"
  }

  closePeriodoModal() {
    const modal = document.getElementById("periodoModal")
    if (modal) modal.style.display = "none"
  }

  // ========================
  // Aplicar período
  // ========================
  aplicarPeriodo() {
    const periodo = document.querySelector('input[name="periodo"]:checked')
    if (!periodo) {
      alert("Seleccione un período")
      return
    }

    const hoy = new Date()
    let desde,
      hasta,
      label = ""

    switch (periodo.value) {
      case "30dias":
        hasta = hoy
        desde = new Date()
        desde.setDate(hoy.getDate() - 30)
        label = "Últimos 30 días"
        break
      case "mes":
        hasta = hoy
        desde = new Date(hoy.getFullYear(), hoy.getMonth(), 1)
        label = "Último mes"
        break
      case "trimestre":
        hasta = hoy
        desde = new Date()
        desde.setMonth(hoy.getMonth() - 3)
        label = "Último trimestre"
        break
      case "semestre":
        hasta = hoy
        desde = new Date()
        desde.setMonth(hoy.getMonth() - 6)
        label = "Último semestre"
        break
      case "anio":
        hasta = hoy
        desde = new Date()
        desde.setFullYear(hoy.getFullYear() - 1)
        label = "Último año"
        break
      case "personalizado":
        const desdeStr = document.getElementById("fechaDesdePersonalizado")?.value
        const hastaStr = document.getElementById("fechaHastaPersonalizado")?.value
        if (desdeStr) document.getElementById("fechaDesde").value = desdeStr
        if (hastaStr) document.getElementById("fechaHasta").value = hastaStr
        label = `Del ${formatFecha(desdeStr)} al ${formatFecha(hastaStr)}`
        break
    }

    this.setPeriodoTexto(label)

    if (desde && hasta) {
      document.getElementById("fechaDesde").value = this.toLocalDateString(desde)
      document.getElementById("fechaHasta").value = this.toLocalDateString(hasta)
    }

    this.closePeriodoModal()
    this.applyFilters()
  }

  // ========================
  // Utilidades
  // ========================
  toLocalDateString(date) {
    const y = date.getFullYear()
    const m = String(date.getMonth() + 1).padStart(2, "0")
    const d = String(date.getDate()).padStart(2, "0")
    return `${y}-${m}-${d}`
  }
}
