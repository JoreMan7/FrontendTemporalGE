// ========================
// Select All functionality
// ========================
function toggleSelectAll() {
  const selectAll = document.getElementById("SelectAll")
  const checkboxes = document.querySelectorAll(".row-checkbox")
  checkboxes.forEach((checkbox) => { checkbox.checked = selectAll.checked })
  updateBulkActions()
}

// ========================
// Función para mostrar fechas en formato dd-MMM-aaaa
// ========================
function formatFecha(fechaStr) {
  if (!fechaStr) return "-"
  
  let safeStr = fechaStr
  if (/^\d{4}-\d{2}-\d{2}$/.test(fechaStr)) {
    safeStr = fechaStr + "T00:00:00"
  }

  const fecha = new Date(safeStr)
  if (isNaN(fecha)) return "-"

  const dia = String(fecha.getDate()).padStart(2, "0")
  const meses = ["Ene","Feb","Mar","Abr","May","Jun","Jul","Ago","Sep","Oct","Nov","Dic"]
  const mes = meses[fecha.getMonth()]
  const anio = fecha.getFullYear()

  return `${dia}/${mes}/${anio}`
}

function setPeriodoTexto(label) {
  const el = document.getElementById("periodoTexto")
  if (el) el.textContent = label
}

// ========================
// Bulk actions
// ========================
function updateBulkActions() {
  const checkeds = document.querySelectorAll(".row-checkbox:checked")
  const bulkActions = document.getElementById("bulkActions")
  const selectedCount = document.getElementById("selectedCount")
  if (checkeds.length > 0) {
    bulkActions.classList.add("active")
    selectedCount.textContent = `${checkeds.length} seleccionados`
  } else {
    bulkActions.classList.remove("active")
  }
  const all = document.querySelectorAll(".row-checkbox")
  const selectAll = document.getElementById("SelectAll")
  selectAll.checked = (checkeds.length === all.length && all.length > 0)
}

// ========================
// Columnas visibles
// ========================
function toggleColumn(columnClass) {
  const columns = document.querySelectorAll(`.col-${columnClass}`)
  const checkbox = document.getElementById(`col-${columnClass}`)
  columns.forEach((column) => { column.style.display = checkbox.checked ? "" : "none" })
}

function selectAllColumns(selectAll) {
  document.querySelectorAll('input[id^="col-"]').forEach((checkbox) => {
    checkbox.checked = selectAll
    const columnClass = checkbox.id.replace("col-", "")
    const columns = document.querySelectorAll(`.col-${columnClass}`)
    columns.forEach((column) => { column.style.display = selectAll ? "" : "none" })
  })
}

function applyColumnVisibility() {
  document.querySelectorAll('input[id^="col-"]').forEach((checkbox) => {
    const columnClass = checkbox.id.replace("col-", "")
    const columns = document.querySelectorAll(`.col-${columnClass}`)
    columns.forEach((column) => { column.style.display = checkbox.checked ? "" : "none" })
  })
}

// ========================
// Modal Filtros
// ========================
function toggleFilters() { document.getElementById("filtersModal").style.display = "block" }
function closeFiltersModal() { document.getElementById("filtersModal").style.display = "none" }

// ========================
// Accordion
// ========================
function toggleAccordion(section) {
  const header = document.querySelector(`#${section}-content`).previousElementSibling
  const content = document.getElementById(`${section}-content`)
  const icon = header.querySelector(".accordion-icon")
  header.classList.toggle("active")
  content.classList.toggle("active")
  icon.style.transform = header.classList.contains("active") ? "rotate(180deg)" : "rotate(0deg)"
}

// ========================
// Token y variables globales
// ========================
import { AuthManager } from "./AuthManager.js";

// Validar sesión antes de seguir
if (!AuthManager.isAuthenticated()) {
  AuthManager.redirectToLogin();
}

// Función centralizada para peticiones con token
async function fetchWithAuth(url, options = {}) {
  const token = AuthManager.getToken();
  if (!token) {
    AuthManager.redirectToLogin();
    return;
  }

  const res = await fetch(url, {
    ...options,
    headers: {
      ...(options.headers || {}),
      Authorization: `Bearer ${token}`
    }
  });

  if (res.status === 401) {
    AuthManager.redirectToLogin();
  }

  return res;
}

let habitantesData = []
let opcionesData = {}
let currentPage = 1
let itemsPerPage = 10
let filteredData = []

// ========================
// DOMContentLoaded
// ========================
document.addEventListener("DOMContentLoaded", async () => {
  try {
    await loadInitialData()
    setupPaginationEvents()

    // Período por defecto: últimos 30 días
    setPeriodoTexto("Últimos 30 días")
    const hoy = new Date()
    const hace30 = new Date(); hace30.setDate(hoy.getDate() - 30)
    document.getElementById("fechaHasta").value = hoy.toISOString().split("T")[0]
    document.getElementById("fechaDesde").value = hace30.toISOString().split("T")[0]

    applyFilters()

    window.onclick = (event) => {
      const modal = document.getElementById("filtersModal")
      const periodoModal = document.getElementById("periodoModal")
      if (event.target === modal) modal.style.display = "none"
      if (event.target === periodoModal) periodoModal.style.display = "none"
    }

    const periodoTexto = document.getElementById("periodoTexto")
    if (periodoTexto) {
      periodoTexto.style.cursor = "pointer"
      periodoTexto.addEventListener("click", openPeriodoModal)
    }
  } catch (err) {
    console.error("[ERROR] Al iniciar:", err)
    alert("Error al cargar los datos.")
  }
})

// ========================
// Cargar datos
// ========================
async function loadInitialData() {
  console.log("[v0] Cargando datos iniciales...")
  await loadOpciones()
  await loadHabitantes()
  console.log("[v0] Datos cargados exitosamente")
}

async function loadOpciones() {
  const response = await fetchWithAuth("http://localhost:5000/api/opciones/");
  if (!response.ok) throw new Error(`HTTP error! ${response.status}`)
  opcionesData = await response.json()
  populateFilterOptions()
}

async function loadHabitantes() {
  const response = await fetchWithAuth("http://localhost:5000/api/habitantes/");
  if (!response.ok) throw new Error(`HTTP error! ${response.status}`)
  const data = await response.json()

  if (data.success && data.habitantes) {
    habitantesData = data.habitantes
    filteredData = [...habitantesData]
    updateTableWithPagination()
  } else {
    throw new Error("Formato inválido de respuesta")
  }
}

// ========================
// Paginación
// ========================
function setupPaginationEvents() {
  const pageSizeSelector = document.querySelector(".page-size-selector select")
  if (pageSizeSelector) {
    pageSizeSelector.addEventListener("change", (e) => {
      itemsPerPage = parseInt(e.target.value)
      currentPage = 1
      updateTableWithPagination()
    })
  }
  updatePaginationButtons()
}

function updateTableWithPagination() {
  populateTable(filteredData)
  updatePaginationButtons()
  applyColumnVisibility()
}

function updatePaginationInfo(totalItems) {
  const startIndex = (currentPage - 1) * itemsPerPage + 1
  const endIndex = Math.min(currentPage * itemsPerPage, totalItems)
  const el = document.querySelector(".pagination-info")
  if (el) el.textContent = `Mostrando ${startIndex} - ${endIndex} de ${totalItems} registros`
}

function updatePaginationButtons() {
  const totalPages = Math.ceil(filteredData.length / itemsPerPage)
  const container = document.querySelector(".pagination-buttons")
  if (!container) return

  container.innerHTML = ""

  const prev = document.createElement("button")
  prev.className = "page-btn"
  prev.textContent = "Anterior"
  prev.disabled = currentPage === 1
  prev.onclick = () => { if (currentPage > 1) { currentPage--; updateTableWithPagination() } }
  container.appendChild(prev)

  const startPage = Math.max(1, currentPage - 2)
  const endPage = Math.min(totalPages, currentPage + 2)
  for (let i = startPage; i <= endPage; i++) {
    const btn = document.createElement("button")
    btn.className = `page-btn ${i === currentPage ? "active" : ""}`
    btn.textContent = i
    btn.onclick = () => { currentPage = i; updateTableWithPagination() }
    container.appendChild(btn)
  }

  const next = document.createElement("button")
  next.className = "page-btn"
  next.textContent = "Siguiente"
  next.disabled = currentPage === totalPages
  next.onclick = () => { if (currentPage < totalPages) { currentPage++; updateTableWithPagination() } }
  container.appendChild(next)
}

// ========================
// Tabla
// ========================
function populateTable(dataToShow = filteredData) {
  const tbody = document.getElementById("tablaHabitantesBody")
  tbody.innerHTML = ""

  const startIndex = (currentPage - 1) * itemsPerPage
  const endIndex = startIndex + itemsPerPage
  const paginatedData = dataToShow.slice(startIndex, endIndex)

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

  updatePaginationInfo(dataToShow.length)
}

// ========================
// Filtros
// ========================
function toLocalDateString(date) {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, "0")
  const d = String(date.getDate()).padStart(2, "0")
  return `${y}-${m}-${d}`
}

function applyFilters() {
  const numDoc = document.getElementById("numDocFilter")?.value.toLowerCase() || ""
  const nombres = document.getElementById("nombresFilter")?.value.toLowerCase() || ""
  const apellidos = document.getElementById("apellidosFilter")?.value.toLowerCase() || ""
  const email = document.getElementById("emailFilter")?.value.toLowerCase() || ""
  const celular = document.getElementById("celularFilter")?.value.toLowerCase() || ""
  const direccion = document.getElementById("direccionFilter")?.value.toLowerCase() || ""

  const fechaDesde = document.getElementById("fechaDesde").value
  const fechaHasta = document.getElementById("fechaHasta").value

  const tiposDoc = Array.from(document.querySelectorAll('input[name="tipoDoc"]:checked')).map(cb => cb.value)
  const sectores = Array.from(document.querySelectorAll('input[name="sector"]:checked')).map(cb => cb.value)
  const estadosCiviles = Array.from(document.querySelectorAll('input[name="estadoCivil"]:checked')).map(cb => cb.value)
  const religiones = Array.from(document.querySelectorAll('input[name="religion"]:checked')).map(cb => cb.value)
  const sexos = Array.from(document.querySelectorAll('input[name="sexo"]:checked')).map(cb => cb.value)
  const poblaciones = Array.from(document.querySelectorAll('input[name="poblacion"]:checked')).map(cb => cb.value)

  filteredData = habitantesData.filter(h => {
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
      const fechaHabStr = toLocalDateString(fechaHab)
      if (fechaDesde && fechaHabStr < fechaDesde) show = false
      if (fechaHasta && fechaHabStr > fechaHasta) show = false
    }

    return show
  })

  currentPage = 1
  updateTableWithPagination()
  closeFiltersModal()
}

// ========================
// Limpiar filtros
// ========================
function clearAllFilters() {
  const filterCheckboxes = document.querySelectorAll('#filtersModal input[type="checkbox"]:not([id^="col-"])')
  filterCheckboxes.forEach((cb) => (cb.checked = false))

  document.getElementById("numDocFilter").value = ""
  document.getElementById("nombresFilter").value = ""
  document.getElementById("apellidosFilter").value = ""
  document.getElementById("emailFilter").value = ""
  document.getElementById("celularFilter").value = ""
  document.getElementById("direccionFilter").value = ""

  filteredData = [...habitantesData]
  currentPage = 1
  updateTableWithPagination()

  closeFiltersModal()
  console.log("[v0] Filtros limpiados y modal cerrado")
}

// ========================
// Modal de período
// ========================
function openPeriodoModal() { document.getElementById("periodoModal").style.display = "block" }
function closePeriodoModal() { document.getElementById("periodoModal").style.display = "none" }

document.addEventListener("change", (e) => {
  if (e.target.name === "periodo") {
    const rango = document.getElementById("rangoPersonalizado")
    rango.style.display = (e.target.value === "personalizado") ? "block" : "none"
  }
})

function aplicarPeriodo() {
  const periodo = document.querySelector('input[name="periodo"]:checked')
  if (!periodo) { alert("Seleccione un período"); return }

  const hoy = new Date()
  let desde, hasta, label = ""

  switch (periodo.value) {
    case "30dias":
      hasta = hoy
      desde = new Date(); desde.setDate(hoy.getDate() - 30)
      label = "Últimos 30 días"; break
    case "mes":
      hasta = hoy
      desde = new Date(hoy.getFullYear(), hoy.getMonth(), 1)
      label = "Último mes"; break
    case "trimestre":
      hasta = hoy
      desde = new Date(); desde.setMonth(hoy.getMonth() - 3)
      label = "Último trimestre"; break
    case "semestre":
      hasta = hoy
      desde = new Date(); desde.setMonth(hoy.getMonth() - 6)
      label = "Último semestre"; break
    case "anio":
      hasta = hoy
      desde = new Date(); desde.setFullYear(hoy.getFullYear() - 1)
      label = "Último año"; break
    case "personalizado":
      const desdeStr = document.getElementById("fechaDesdePersonalizado").value
      const hastaStr = document.getElementById("fechaHastaPersonalizado").value
      document.getElementById("fechaDesde").value = desdeStr
      document.getElementById("fechaHasta").value = hastaStr
      label = `Del ${formatFecha(desdeStr)} al ${formatFecha(hastaStr)}`
      break
  }

  setPeriodoTexto(label)

  if (desde && hasta) {
    document.getElementById("fechaDesde").value = toLocalDateString(desde)
    document.getElementById("fechaHasta").value = toLocalDateString(hasta)
  }

  closePeriodoModal()
  applyFilters()
}

// ========================
// Opciones de filtros dinámicas
// ========================
function populateFilterOptions() {
  if (opcionesData.tiposDocumento) {
    const container = document.getElementById("tiposDocumentoContainer")
    container.innerHTML = ""
    opcionesData.tiposDocumento.forEach((tipo) => {
      const div = document.createElement("div")
      div.className = "checkbox-item"
      div.innerHTML = `
        <input type="checkbox" id="tipo-${tipo.id}" name="tipoDoc" value="${tipo.Descripcion || tipo.Nombre}">
        <label for="tipo-${tipo.id}">${tipo.Descripcion || tipo.Nombre}</label>`
      container.appendChild(div)
    })
  }

  if (opcionesData.sexos) {
    const container = document.getElementById("sexosContainer")
    container.innerHTML = ""
    opcionesData.sexos.forEach((sexo) => {
      const div = document.createElement("div")
      div.className = "checkbox-item"
      div.innerHTML = `
        <input type="checkbox" id="sexo-${sexo.id}" name="sexo" value="${sexo.Nombre}">
        <label for="sexo-${sexo.id}">${sexo.Nombre}</label>`
      container.appendChild(div)
    })
  }

  if (opcionesData.sectores) {
    const container = document.getElementById("sectoresContainer")
    container.innerHTML = ""
    opcionesData.sectores.forEach((sector) => {
      const div = document.createElement("div")
      div.className = "checkbox-item"
      div.innerHTML = `
        <input type="checkbox" id="sector-${sector.id}" name="sector" value="${sector.Descripcion || sector.Nombre}">
        <label for="sector-${sector.id}">${sector.Descripcion || sector.Nombre}</label>`
      container.appendChild(div)
    })
  }

  if (opcionesData.estadosCiviles) {
    const container = document.getElementById("estadosCivilesContainer")
    container.innerHTML = ""
    opcionesData.estadosCiviles.forEach((estado) => {
      const div = document.createElement("div")
      div.className = "checkbox-item"
      div.innerHTML = `
        <input type="checkbox" id="estado-${estado.id}" name="estadoCivil" value="${estado.Nombre}">
        <label for="estado-${estado.id}">${estado.Nombre}</label>`
      container.appendChild(div)
    })
  }

  if (opcionesData.poblaciones) {
    const container = document.getElementById("poblacionesContainer")
    container.innerHTML = ""
    opcionesData.poblaciones.forEach((poblacion) => {
      const div = document.createElement("div")
      div.className = "checkbox-item"
      div.innerHTML = `
        <input type="checkbox" id="poblacion-${poblacion.id}" name="poblacion" value="${poblacion.Descripcion || poblacion.Nombre}">
        <label for="poblacion-${poblacion.id}">${poblacion.Descripcion || poblacion.Nombre}</label>`
      container.appendChild(div)
    })
  }

  if (opcionesData.religiones) {
    const container = document.getElementById("religionesContainer")
    container.innerHTML = ""
    opcionesData.religiones.forEach((religion) => {
      const div = document.createElement("div")
      div.className = "checkbox-item"
      div.innerHTML = `
        <input type="checkbox" id="religion-${religion.id}" name="religion" value="${religion.Nombre}">
        <label for="religion-${religion.id}">${religion.Nombre}</label>`
      container.appendChild(div)
    })
  }
}
