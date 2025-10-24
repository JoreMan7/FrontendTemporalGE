export function formatFecha(fechaStr) {
  if (!fechaStr) return "-"
  let safeStr = fechaStr
  if (/^\d{4}-\d{2}-\d{2}$/.test(fechaStr)) {
    safeStr = fechaStr + "T00:00:00"
  }
  const fecha = new Date(safeStr)
  if (isNaN(fecha)) return "-"

  const dia = String(fecha.getDate()).padStart(2, "0")
  const meses = ["Ene", "Feb", "Mar", "Abr", "May", "Jun", "Jul", "Ago", "Sep", "Oct", "Nov", "Dic"]
  const mes = meses[fecha.getMonth()]
  const anio = fecha.getFullYear()
  return `${dia}/${mes}/${anio}`
}

export function toggleSelectAll() {
  const selectAll = document.getElementById("SelectAll")
  const checkboxes = document.querySelectorAll(".row-checkbox")
  checkboxes.forEach((checkbox) => {
    checkbox.checked = selectAll.checked
  })
  updateBulkActions()
}

export function updateBulkActions() {
  const checkboxes = document.querySelectorAll(".row-checkbox:checked")
  const bulkActions = document.getElementById("bulkActions")
  const selectedCount = document.getElementById("selectedCount")
  if (!bulkActions || !selectedCount) return

  if (checkboxes.length > 0) {
    bulkActions.classList.add("active")
    selectedCount.textContent = `${checkboxes.length} seleccionados`
  } else {
    bulkActions.classList.remove("active")
    selectedCount.textContent = "0 seleccionados"
  }

  const all = document.querySelectorAll(".row-checkbox")
  const selectAll = document.getElementById("SelectAll")
  if (selectAll) {
    selectAll.checked = checkboxes.length === all.length && all.length > 0
  }
}

export function toggleColumn(columnClass) {
  const columns = document.querySelectorAll(`.col-${columnClass}`)
  const checkbox = document.getElementById(`col-${columnClass}`)
  columns.forEach((col) => {
    col.style.display = checkbox.checked ? "" : "none"
  })
}

export function selectAllColumns(selectAll) {
  document.querySelectorAll('input[id^="col-"]').forEach((checkbox) => {
    checkbox.checked = selectAll
    const columnClass = checkbox.id.replace("col-", "")
    const columns = document.querySelectorAll(`.col-${columnClass}`)
    columns.forEach((column) => {
      column.style.display = selectAll ? "" : "none"
    })
  })
}

export function applyColumnVisibility() {
  document.querySelectorAll('input[id^="col-"]').forEach((checkbox) => {
    const columnClass = checkbox.id.replace("col-", "")
    const columns = document.querySelectorAll(`.col-${columnClass}`)
    columns.forEach((col) => {
      col.style.display = checkbox.checked ? "" : "none"
    })
  })
}

export function toggleAccordion(section) {
  const header = document.querySelector(`#${section}-content`)?.previousElementSibling
  const content = document.getElementById(`${section}-content`)
  const icon = header?.querySelector(".accordion-icon")

  if (!header || !content || !icon) return

  header.classList.toggle("active")
  content.classList.toggle("active")
  icon.style.transform = header.classList.contains("active") ? "rotate(180deg)" : "rotate(0deg)"
}
