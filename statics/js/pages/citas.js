// =====================
// Módulo: CITAS
// =====================
import { ApiClient } from '../modules/api.js';

const $ = (s) => document.querySelector(s);
const $$ = (s) => document.querySelectorAll(s);

const UIX = {
  async confirm({ title = "¿Confirmar?", text = "", icon = "question" } = {}) {
    if (window.Swal?.fire) {
      const r = await Swal.fire({ 
        title, 
        text, 
        icon, 
        showCancelButton: true, 
        confirmButtonText: "Sí", 
        cancelButtonText: "Cancelar" 
      });
      return r.isConfirmed;
    }
    return confirm(text || title);
  },
  
  toast(msg, type = "success") {
    if (window.Swal?.fire) {
      return Swal.fire({ 
        toast: true, 
        icon: type, 
        title: msg, 
        timer: 2200, 
        position: "top-end", 
        showConfirmButton: false 
      });
    }
    alert(msg);
  },
  
  error(msg) {
    if (window.Swal?.fire) {
      return Swal.fire("Error", msg, "error");
    }
    alert(`Error: ${msg}`);
  }
};

const state = {
  raw: [],
  filtered: [],
  pageSize: 10,
  currentPage: 1,
  options: { 
    estados: [], 
    tipos: [], 
    tiposDocumento: [],
    padres: [] 
  },
  filters: { estado: "", tipo: "", desde: "", hasta: "", buscar: "" }
};

// =====================
// Cargar datos y opciones
// =====================
async function cargarOpciones() {
  try {
    // Cargar opciones de citas
    const dataCitas = await ApiClient.request('/api/citas/opciones/');
    state.options.estados = dataCitas?.estadosCita || [];
    state.options.tipos = dataCitas?.tiposCita || [];
    state.options.tiposDocumento = dataCitas?.tiposDocumento || [];
    
    // Cargar lista de padres
    const dataPadres = await ApiClient.request('/api/padres/');
    state.options.padres = dataPadres?.padres || dataPadres || [];
    
    console.log("Opciones cargadas:", {
      estados: state.options.estados.length,
      tipos: state.options.tipos.length,
      tiposDocumento: state.options.tiposDocumento.length,
      padres: state.options.padres.length
    });
    
    // Llenar selects de filtros
    fillSelect($('#fEstado'), state.options.estados, 'IdEstadoCita', 'Descripcion', true);
    fillSelect($('#fTipo'), state.options.tipos, 'IdTipoCita', 'Descripcion', true);
    
    // Llenar selects de formulario
    fillSelect($('#citaTipo'), state.options.tipos, 'IdTipoCita', 'Descripcion');
    fillSelect($('#citaEstado'), state.options.estados, 'IdEstadoCita', 'Descripcion');
    fillSelect($('#citaTipoDocumento'), state.options.tiposDocumento, 'IdTipoDocumento', 'Descripcion');
    
    // Llenar select de padres con formato mejorado
    fillPadresSelect($('#padreSelect'), state.options.padres);
    
  } catch (error) {
    console.error("Error cargando opciones:", error);
    UIX.toast("No se pudieron cargar las opciones", "error");
  }
}

async function cargarCitas() {
  try {
    const data = await ApiClient.request('/api/citas/');
    state.raw = data?.citas || data || [];
    state.filtered = [...state.raw];
    console.log("Citas cargadas:", state.raw.length);
    renderTable();
    renderPagination();
  } catch (error) {
    console.error("Error cargando citas:", error);
    UIX.toast("Error al cargar las citas", "error");
  }
}

// =====================
// Renderizar tabla
// =====================
function renderTable() {
  const tb = $("#tableBody");
  if (!tb) return;
  
  const rows = paginate(state.filtered, state.pageSize, state.currentPage);
  
  if (!rows.length) {
    tb.innerHTML = `
      <tr>
        <td colspan="10" class="text-center text-muted py-4">
          No se encontraron citas con los filtros aplicados
        </td>
      </tr>
    `;
    updatePaginationInfo();
    return;
  }
  
  tb.innerHTML = rows.map(cita => {
    const id = cita.IdAsignacionCita;
    const fecha = esc(cita.Fecha) || "-";
    const hora = (cita.Hora || "").toString().slice(0, 5);
    const padre = esc(cita.PadreNombre || "-");
    const tipo = esc(cita.TipoDescripcion || "-");
    const solicitante = esc(cita.NombreSolicitante || "-");
    const celular = esc(cita.Celular || "-");
    const tipoDoc = esc(cita.TipoDocumentoSolicitante || "-");
    const numDoc = esc(cita.NumeroDocumentoSolicitante || "-");
    const estado = buildEstadoBadge(cita);
    
    return `
      <tr data-id="${id}">
        <td class="text-center">
          <input type="checkbox" class="form-check-input row-check">
        </td>
        <td>${fecha}</td>
        <td>${hora}</td>
        <td>${padre}</td>
        <td>${tipo}</td>
        <td>
          <div class="fw-medium">${solicitante}</div>
          <small class="text-muted">${tipoDoc}: ${numDoc}</small>
        </td>
        <td>${celular}</td>
        <td>${estado}</td>
        <td class="d-flex flex-wrap gap-1 align-items-center justify-content-center">
          <button class="btn btn-sm btn-outline-primary" data-action="edit" title="Editar">
            <i class="fas fa-pen"></i>
          </button>
          <button class="btn btn-sm btn-outline-info" data-action="view" title="Ver detalle">
            <i class="fas fa-eye"></i>
          </button>
          <button class="btn btn-sm btn-outline-danger" data-action="delete" title="Desactivar">
            <i class="fas fa-ban"></i>
          </button>
        </td>
      </tr>
    `;
  }).join("");
  
  // Bind eventos de botones
  tb.addEventListener("click", (e) => {
    const btn = e.target.closest('button[data-action]');
    if (!btn) return;
    
    const id = Number(btn.closest("tr")?.dataset.id);
    const action = btn.dataset.action;
    
    switch(action) {
      case "edit": editarCita(id); break;
      case "view": verDetalle(id); break;
      case "delete": desactivarCita(id); break;
    }
  });
  
  // Select all checkbox
  $("#selectAll")?.addEventListener("change", e => {
    $$("#tableBody .row-check").forEach(c => (c.checked = e.target.checked));
  });
  
  updatePaginationInfo();
}

function buildEstadoBadge(cita) {
  const estado = (cita.EstadoDescripcion || "").toLowerCase();
  
  if (estado.includes("pend")) return `<span class="badge bg-warning text-dark">Pendiente</span>`;
  if (estado.includes("conf")) return `<span class="badge bg-success">Confirmada</span>`;
  if (estado.includes("cancel")) return `<span class="badge bg-secondary">Cancelada</span>`;
  if (estado.includes("complet")) return `<span class="badge bg-info">Completada</span>`;
  
  return `<span class="badge bg-light text-dark">${esc(cita.EstadoDescripcion || "—")}</span>`;
}

// =====================
// Paginación
// =====================
function paginate(arr, size, page) {
  const start = (page - 1) * size;
  return arr.slice(start, start + size);
}

function renderPagination() {
  const total = state.filtered.length;
  const pages = Math.max(1, Math.ceil(total / state.pageSize));
  const cont = $("#paginationButtons");
  cont.innerHTML = "";
  
  // Botón anterior
  if (state.currentPage > 1) {
    const prevBtn = document.createElement("button");
    prevBtn.className = "btn btn-sm btn-outline-primary";
    prevBtn.innerHTML = '<i class="fas fa-chevron-left"></i>';
    prevBtn.addEventListener("click", () => {
      state.currentPage--;
      renderTable();
      renderPagination();
    });
    cont.appendChild(prevBtn);
  }
  
  // Botones de páginas
  for (let p = 1; p <= pages; p++) {
    const btn = document.createElement("button");
    btn.className = `btn btn-sm ${p === state.currentPage ? "btn-primary" : "btn-outline-primary"}`;
    btn.textContent = p;
    btn.addEventListener("click", () => {
      state.currentPage = p;
      renderTable();
      renderPagination();
    });
    cont.appendChild(btn);
  }
  
  // Botón siguiente
  if (state.currentPage < pages) {
    const nextBtn = document.createElement("button");
    nextBtn.className = "btn btn-sm btn-outline-primary";
    nextBtn.innerHTML = '<i class="fas fa-chevron-right"></i>';
    nextBtn.addEventListener("click", () => {
      state.currentPage++;
      renderTable();
      renderPagination();
    });
    cont.appendChild(nextBtn);
  }
}

function updatePaginationInfo() {
  const total = state.filtered.length;
  const start = (state.currentPage - 1) * state.pageSize + 1;
  const end = Math.min(state.currentPage * state.pageSize, total);
  $("#paginationInfo").textContent = `${start}-${end} de ${total} citas`;
}

// =====================
// Filtros y búsqueda
// =====================
function applyFilters() {
  const { estado, tipo, desde, hasta, buscar } = state.filters;
  const searchTerm = (buscar || "").toLowerCase().trim();
  
  state.filtered = state.raw.filter(cita => {
    // Filtro por estado
    if (estado && String(cita.IdEstadoCita) !== String(estado)) return false;
    
    // Filtro por tipo
    if (tipo && String(cita.IdTipoCita) !== String(tipo)) return false;
    
    // Filtro por fecha desde
    if (desde && cita.Fecha < desde) return false;
    
    // Filtro por fecha hasta
    if (hasta && cita.Fecha > hasta) return false;
    
    // Búsqueda global
    if (searchTerm) {
      const searchable = [
        cita.NombreSolicitante || "",
        cita.Celular || "",
        cita.PadreNombre || "",
        cita.Descripcion || "",
        cita.NumeroDocumentoSolicitante || ""
      ].join(" ").toLowerCase();
      
      if (!searchable.includes(searchTerm)) return false;
    }
    
    return true;
  });
  
  state.currentPage = 1;
  renderTable();
  renderPagination();
}

function bindFilterUI() {
  // Aplicar filtros
  $("#btnApplyFilters")?.addEventListener("click", () => {
    state.filters.estado = $("#fEstado").value;
    state.filters.tipo = $("#fTipo").value;
    state.filters.desde = $("#fDesde").value;
    state.filters.hasta = $("#fHasta").value;
    state.filters.buscar = $("#fBuscar").value.trim();
    
    applyFilters();
    bootstrap.Modal.getInstance($("#filtersModal"))?.hide();
  });
  
  // Limpiar filtros
  $("#btnClearFilters")?.addEventListener("click", () => {
    $("#fEstado").value = "";
    $("#fTipo").value = "";
    $("#fDesde").value = "";
    $("#fHasta").value = "";
    $("#fBuscar").value = "";
    
    state.filters = { estado: "", tipo: "", desde: "", hasta: "", buscar: "" };
    applyFilters();
    bootstrap.Modal.getInstance($("#filtersModal"))?.hide();
  });
  
  // Búsqueda global
  $("#globalSearch")?.addEventListener("input", (e) => {
    state.filters.buscar = e.target.value.trim();
    applyFilters();
  });
  
  // Cambio de tamaño de página
  $("#pageSizeSelect")?.addEventListener("change", (e) => {
    state.pageSize = Number(e.target.value);
    state.currentPage = 1;
    renderTable();
    renderPagination();
  });
}

// =====================
// CRUD Operations
// =====================
function nuevaCita() {
  resetForm();
  $("#citaModalTitle").innerHTML = `<i class="fas fa-calendar-plus me-2"></i>Nueva Cita`;
  $("#estadoContainer").style.display = "none"; // Ocultar estado en creación
  new bootstrap.Modal($("#citaModal")).show();
}

async function editarCita(id) {
  try {
    const data = await ApiClient.request(`/api/citas/${id}/`);
    const cita = data?.cita || data;
    
    if (!cita) {
      UIX.toast("Cita no encontrada", "error");
      return;
    }
    
    fillForm(cita);
    $("#citaModalTitle").innerHTML = `<i class="fas fa-pen me-2"></i>Editar Cita`;
    $("#estadoContainer").style.display = "block"; // Mostrar estado en edición
    new bootstrap.Modal($("#citaModal")).show();
    
  } catch (error) {
    console.error("Error cargando cita:", error);
    UIX.toast("No se pudo cargar la cita", "error");
  }
}

async function guardarCita(e) {
  e.preventDefault();
  
  // Validar formulario
  const form = $("#citaForm");
  form.classList.add("was-validated");
  
  if (!form.checkValidity()) {
    return;
  }
  
  const payload = {
    Fecha: $("#citaFecha").value,
    Hora: $("#citaHora").value,
    IdTipoCita: Number($("#citaTipo").value),
    IdPadre: Number($("#padreSelect").value),
    IdTipoDocumentoSolicitante: Number($("#citaTipoDocumento").value),
    NumeroDocumentoSolicitante: $("#citaNumeroDocumento").value.trim(),
    NombreSolicitante: $("#citaSolicitante").value.trim(),
    Celular: $("#citaCelular").value.trim(),
    Descripcion: $("#citaDescripcion").value.trim()
  };
  
  // Solo incluir estado si estamos editando
  const id = $("#citaId").value;
  if (id) {
    payload.IdEstadoCita = Number($("#citaEstado").value);
  }
  
  const method = id ? "PUT" : "POST";
  const endpoint = id ? `/api/citas/${id}/` : `/api/citas/`;
  
  try {
    const result = await ApiClient.request(endpoint, {
      method,
      body: JSON.stringify(payload)
    });
    
    if (result?.success === false) {
      throw new Error(result.message || "Error al guardar");
    }
    
    UIX.toast(id ? "Cita actualizada correctamente" : "Cita creada correctamente");
    
    // Cerrar modal y limpiar
    bootstrap.Modal.getInstance($("#citaModal"))?.hide();
    setTimeout(() => {
      document.querySelectorAll('.modal-backdrop').forEach(el => el.remove());
    }, 300);
    
    // Recargar datos
    await cargarCitas();
    
  } catch (error) {
    console.error("Error guardando cita:", error);
    UIX.toast(error.message || "Error al guardar la cita", "error");
  }
}

async function desactivarCita(id) {
  const confirmacion = await UIX.confirm({
    title: "¿Desactivar cita?",
    text: "Esta acción desactivará la cita. Podrás reactivarla luego si es necesario.",
    icon: "warning"
  });
  
  if (!confirmacion) return;
  
  try {
    const result = await ApiClient.request(`/api/citas/${id}/desactivar/`, {
      method: "PATCH"
    });
    
    if (result?.success) {
      UIX.toast("Cita desactivada correctamente");
      await cargarCitas();
    } else {
      throw new Error(result?.message || "No se pudo desactivar");
    }
    
  } catch (error) {
    console.error("Error desactivando cita:", error);
    UIX.toast(error.message || "Error al desactivar la cita", "error");
  }
}

async function verDetalle(id) {
  try {
    const data = await ApiClient.request(`/api/citas/${id}/`);
    const cita = data?.cita || data;
    
    if (!cita) {
      UIX.toast("Cita no encontrada", "error");
      return;
    }
    
    const html = `
      <dt class="col-sm-4">Fecha</dt>
      <dd class="col-sm-8">${esc(cita.Fecha || "-")}</dd>
      
      <dt class="col-sm-4">Hora</dt>
      <dd class="col-sm-8">${(cita.Hora || "").toString().slice(0, 5) || "-"}</dd>
      
      <dt class="col-sm-4">Padre</dt>
      <dd class="col-sm-8">${esc(cita.PadreNombre || "-")}</dd>
      
      <dt class="col-sm-4">Tipo de Cita</dt>
      <dd class="col-sm-8">${esc(cita.TipoDescripcion || "-")}</dd>
      
      <dt class="col-sm-4">Estado</dt>
      <dd class="col-sm-8">${buildEstadoBadge(cita)}</dd>
      
      <dt class="col-sm-4">Solicitante</dt>
      <dd class="col-sm-8">${esc(cita.NombreSolicitante || "-")}</dd>
      
      <dt class="col-sm-4">Tipo Documento</dt>
      <dd class="col-sm-8">${esc(cita.TipoDocumentoSolicitante || "-")}</dd>
      
      <dt class="col-sm-4">Número Documento</dt>
      <dd class="col-sm-8">${esc(cita.NumeroDocumentoSolicitante || "-")}</dd>
      
      <dt class="col-sm-4">Celular</dt>
      <dd class="col-sm-8">${esc(cita.Celular || "-")}</dd>
      
      <dt class="col-sm-4">Descripción</dt>
      <dd class="col-sm-8">${esc(cita.Descripcion || "-")}</dd>
      
      <dt class="col-sm-4">Fecha Registro</dt>
      <dd class="col-sm-8">${esc(cita.FechaRegistro || "-")}</dd>
    `;
    
    $("#detalleBody").innerHTML = html;
    new bootstrap.Modal($("#detalleModal")).show();
    
  } catch (error) {
    console.error("Error cargando detalle:", error);
    UIX.toast("No se pudo cargar el detalle", "error");
  }
}

// =====================
// Form Management
// =====================
function resetForm() {
  $("#citaForm").reset();
  $("#citaForm").classList.remove("was-validated");
  $("#citaId").value = "";
  $("#estadoContainer").style.display = "none";
  
  // Establecer fecha mínima como hoy
  const hoy = new Date().toISOString().split('T')[0];
  $("#citaFecha").min = hoy;
  $("#citaFecha").value = hoy;
  
  // Establecer hora por defecto (próxima hora en punto)
  const ahora = new Date();
  const siguienteHora = new Date(ahora.getTime() + 60 * 60 * 1000);
  const horaFormateada = siguienteHora.toTimeString().slice(0, 5);
  $("#citaHora").value = horaFormateada;
}

function fillForm(cita) {
  resetForm();
  
  $("#citaId").value = cita.IdAsignacionCita || "";
  $("#citaFecha").value = cita.Fecha || "";
  $("#citaHora").value = (cita.Hora || "").toString().slice(0, 5);
  $("#citaTipo").value = cita.IdTipoCita || "";
  $("#padreSelect").value = cita.IdPadre || "";
  $("#citaTipoDocumento").value = cita.IdTipoDocumentoSolicitante || "";
  $("#citaNumeroDocumento").value = cita.NumeroDocumentoSolicitante || "";
  $("#citaSolicitante").value = cita.NombreSolicitante || "";
  $("#citaCelular").value = cita.Celular || "";
  $("#citaDescripcion").value = cita.Descripcion || "";
  $("#citaEstado").value = cita.IdEstadoCita || "";
}

// =====================
// Utilidades
// =====================
function fillSelect(select, data, valueField, textField, includeAll = false) {
  if (!select) return;
  
  select.innerHTML = "";
  
  if (includeAll) {
    select.appendChild(new Option("Todos", ""));
  } else {
    select.appendChild(new Option("Seleccionar...", ""));
  }
  
  (data || []).forEach(item => {
    const option = new Option(item[textField], item[valueField]);
    select.appendChild(option);
  });
}

function fillPadresSelect(select, padres) {
  if (!select) return;
  
  select.innerHTML = "";
  select.appendChild(new Option("Seleccionar padre...", ""));
  
  (padres || []).forEach(padre => {
    const nombreCompleto = `${padre.Nombre || ''} ${padre.Apellido || ''}`.trim();
    const documento = padre.NumeroDocumento ? ` - ${padre.NumeroDocumento}` : '';
    const texto = `${nombreCompleto}${documento}`;
    
    const option = new Option(texto, padre.IdPadre);
    select.appendChild(option);
  });
}

function esc(s = "") {
  return String(s)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function exportCSV() {
  const headers = ["ID", "Fecha", "Hora", "Padre", "Tipo", "Solicitante", "Tipo Doc", "Número Doc", "Celular", "Estado", "Descripción"];
  const rows = state.filtered.map(cita => [
    cita.IdAsignacionCita,
    csv(cita.Fecha),
    (cita.Hora || "").toString().slice(0, 5),
    csv(cita.PadreNombre),
    csv(cita.TipoDescripcion),
    csv(cita.NombreSolicitante),
    csv(cita.TipoDocumentoSolicitante),
    csv(cita.NumeroDocumentoSolicitante),
    csv(cita.Celular),
    csv(cita.EstadoDescripcion),
    csv(cita.Descripcion)
  ]);
  
  const csvData = [headers, ...rows].map(row => row.join(",")).join("\n");
  const blob = new Blob(["\uFEFF" + csvData], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `citas_${new Date().toISOString().slice(0, 10)}.csv`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

function csv(v) {
  if (v == null) return "";
  const s = String(v);
  return s.includes(",") || s.includes('"') || s.includes("\n") 
    ? `"${s.replaceAll('"', '""')}"` 
    : s;
}

function imprimir() {
  const ventana = window.open('', '_blank');
  const estilo = `
    <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.2.2/dist/css/bootstrap.min.css" rel="stylesheet">
    <style>
      body { padding: 20px; }
      .table { font-size: 12px; }
      .badge { font-size: 11px; }
    </style>
  `;
  
  const contenido = `
    <h4 class="mb-3">Reporte de Citas</h4>
    ${$("#dataTable").outerHTML}
    <div class="mt-3 text-muted">
      Generado el ${new Date().toLocaleDateString('es-ES')}
    </div>
  `;
  
  ventana.document.write(`
    <html>
      <head>${estilo}</head>
      <body>${contenido}</body>
    </html>
  `);
  
  ventana.document.close();
  ventana.focus();
  ventana.print();
}

// =====================
// Eventos e init()
// =====================
function bindEvents() {
  // Navegación
  $("#btnVolver")?.addEventListener("click", () => {
    window.location.href = "../NavOficina.html";
  });
  
  // CRUD
  $("#btnNuevaCita")?.addEventListener("click", nuevaCita);
  $("#citaForm")?.addEventListener("submit", guardarCita);
  
  // Exportación
  $("#btnExportar")?.addEventListener("click", exportCSV);
  $("#btnImprimir")?.addEventListener("click", imprimir);
  
  // Filtros
  bindFilterUI();
  
  // Fecha actual
  actualizarFechaActual();
}

function actualizarFechaActual() {
  const hoy = new Date().toLocaleDateString('es-ES', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
  $("#CurrentDate").textContent = hoy.charAt(0).toUpperCase() + hoy.slice(1);
}

export const CitasManager = {
  async init() {
    console.log("🚀 Inicializando módulo de Citas...");
    try {
      bindEvents();
      await cargarOpciones();
      await cargarCitas();
      console.log("✅ Módulo de Citas inicializado correctamente");
    } catch (error) {
      console.error("❌ Error inicializando módulo de Citas:", error);
      UIX.toast("Error al inicializar el módulo de citas", "error");
    }
  }
};