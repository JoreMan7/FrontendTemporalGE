// ========================
// Formato de fecha
// ========================
export function formatFecha(fechaStr) {
  if (!fechaStr) return "-";
  let safeStr = fechaStr;
  if (/^\d{4}-\d{2}-\d{2}$/.test(fechaStr)) {
    safeStr = fechaStr + "T00:00:00";
  }
  const fecha = new Date(safeStr);
  if (isNaN(fecha)) return "-";

  const dia = String(fecha.getDate()).padStart(2, "0");
  const meses = ["Ene","Feb","Mar","Abr","May","Jun","Jul","Ago","Sep","Oct","Nov","Dic"];
  const mes = meses[fecha.getMonth()];
  const anio = fecha.getFullYear();
  return `${dia}/${mes}/${anio}`;
}

// ========================
// Selección de filas
// ========================
export function toggleSelectAll() {
  const selectAll = document.getElementById("SelectAll");
  const checkboxes = document.querySelectorAll(".row-checkbox");
  checkboxes.forEach((checkbox) => {
    checkbox.checked = selectAll.checked;
  });
  updateBulkActions();
}

export function updateBulkActions() {
  const checkboxes = document.querySelectorAll(".row-checkbox:checked");
  const bulkActions = document.getElementById("bulkActions");
  const selectedCount = document.getElementById("selectedCount");
  if (!bulkActions || !selectedCount) return;

  if (checkboxes.length > 0) {
    bulkActions.classList.remove("hidden");
    selectedCount.textContent = `${checkboxes.length} seleccionados`;
  } else {
    bulkActions.classList.add("hidden");
    selectedCount.textContent = "0 seleccionados";
  }
}

// ========================
// Columnas visibles
// ========================
export function toggleColumn(columnClass) {
  const columns = document.querySelectorAll(`.col-${columnClass}`);
  const checkbox = document.getElementById(`col-${columnClass}`);
  columns.forEach((col) => {
    col.style.display = checkbox.checked ? "" : "none";
  });
}

export function applyColumnVisibility() {
  document.querySelectorAll('input[id^="col-"]').forEach((checkbox) => {
    const columnClass = checkbox.id.replace("col-", "");
    const columns = document.querySelectorAll(`.col-${columnClass}`);
    columns.forEach((col) => {
      col.style.display = checkbox.checked ? "" : "none";
    });
  });
}

// ========================
// Accordion
// ========================
export function toggleAccordion(section) {
  const header = document.querySelector(`#${section}-content`).previousElementSibling;
  const content = document.getElementById(`${section}-content`);
  const icon = header.querySelector(".accordion-icon");
  header.classList.toggle("active");
  content.classList.toggle("active");
  icon.style.transform = header.classList.contains("active") ? "rotate(180deg)" : "rotate(0deg)";
}

// ========================
// Filtros
// ========================
export function applyFilters(habitantes, currentFilters) {
  return habitantes.filter(h => {
    let show = true;

    // Textos
    if (currentFilters.numDoc && !h.NumeroDocumento?.toLowerCase().includes(currentFilters.numDoc)) show = false;
    if (currentFilters.nombres && !h.Nombre?.toLowerCase().includes(currentFilters.nombres)) show = false;
    if (currentFilters.apellidos && !h.Apellido?.toLowerCase().includes(currentFilters.apellidos)) show = false;
    if (currentFilters.email && !h.CorreoElectronico?.toLowerCase().includes(currentFilters.email)) show = false;
    if (currentFilters.celular && !h.Telefono?.toLowerCase().includes(currentFilters.celular)) show = false;
    if (currentFilters.direccion && !h.Direccion?.toLowerCase().includes(currentFilters.direccion)) show = false;

    // Select
    if (currentFilters.tipoDoc && h.TipoDocumento !== currentFilters.tipoDoc) show = false;

    // Checkboxes
    if (currentFilters.estadoCivil?.length && !currentFilters.estadoCivil.includes(h.EstadoCivil)) show = false;
    if (currentFilters.sexo?.length && !currentFilters.sexo.includes(h.Sexo)) show = false;
    if (currentFilters.poblacion?.length && !currentFilters.poblacion.includes(h.TipoPoblacion)) show = false;
    if (currentFilters.religion?.length && !currentFilters.religion.includes(h.TipoReligion)) show = false;
    if (currentFilters.discapacidad?.length && !currentFilters.discapacidad.includes(h.Discapacidad)) show = false;

    // Sacramentos (multi-select)
    if (currentFilters.sacramentos?.length) {
      const sac = h.Sacramentos || [];
      if (!currentFilters.sacramentos.every(s => sac.includes(s))) show = false;
    }

    return show;
  });
}



export function clearAllFilters() {
  document.querySelectorAll('#filtersModal input[type="checkbox"]:not([id^="col-"])')
    .forEach(cb => cb.checked = false);

  ["numDocFilter","nombresFilter","apellidosFilter","emailFilter","celularFilter","direccionFilter"]
    .forEach(id => {
      const el = document.getElementById(id);
      if (el) el.value = "";
    });
}

// ========================
// Período de fechas
// ========================
export function openPeriodoModal() {
  document.getElementById("periodoModal").style.display = "block";
}

export function closePeriodoModal() {
  document.getElementById("periodoModal").style.display = "none";
}

export function aplicarPeriodo() {
  const periodo = document.querySelector('input[name="periodo"]:checked');
  if (!periodo) { alert("Seleccione un período"); return; }
  const hoy = new Date();
  let desde, hasta, label = "";

  switch (periodo.value) {
    case "30dias":
      hasta = hoy; desde = new Date(); desde.setDate(hoy.getDate() - 30); label = "Últimos 30 días"; break;
    case "mes":
      hasta = hoy; desde = new Date(hoy.getFullYear(), hoy.getMonth(), 1); label = "Último mes"; break;
    case "trimestre":
      hasta = hoy; desde = new Date(); desde.setMonth(hoy.getMonth() - 3); label = "Último trimestre"; break;
    // puedes añadir semestre, año, personalizado...
  }

  document.getElementById("fechaDesde").value = desde.toISOString().split("T")[0];
  document.getElementById("fechaHasta").value = hasta.toISOString().split("T")[0];
  document.getElementById("periodoTexto").textContent = label;

  closePeriodoModal();
}
