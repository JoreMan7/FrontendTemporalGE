// =====================
// Módulo: TAREAS
// - Catálogo de tipos de tarea (tipotarea)
// - Administración de asignaciones (asignaciontarea)
// =====================
import { ApiClient } from '../modules/api.js';

const $ = (s) => document.querySelector(s);
const $$ = (s) => document.querySelectorAll(s);

const UIX = {
  async confirm({ title = "¿Confirmar?", text = "", icon = "question" } = {}) {
    const r = await Swal.fire({
      title,
      text,
      icon,
      showCancelButton: true,
      confirmButtonText: "Sí",
      cancelButtonText: "Cancelar"
    });
    return r.isConfirmed;
  },
  toast(msg, type = "success") {
    return Swal.fire({
      toast: true,
      icon: type,
      title: msg,
      timer: 2200,
      position: "top-end",
      showConfirmButton: false
    });
  }
};


const state = {
  // catálogo tipos de tarea
  tipos: [],
  tiposPageSize: 10,
  tiposCurrentPage: 1,

  // asignaciones
  asignacionesRaw: [],
  asignacionesFiltered: [],
  pageSize: 10,
  currentPage: 1,
  search: "",
  filters: {
    grupo: "",
    tipoId: "",
    estado: "",
    fechaDesde: "",
    fechaHasta: ""
  },

  // combos
  grupos: []
};


// =====================
// Carga de datos
// =====================
async function cargarCatalogos() {
  try {
    const [tiposRes, gruposRes] = await Promise.all([
      ApiClient.request('/api/tareas/tipos/'),
      ApiClient.request('/api/grupos/')
    ]);

    state.tipos = tiposRes?.data?.tipos_tarea ?? tiposRes?.tipos_tarea ?? [];
    state.grupos = gruposRes?.data?.grupos ?? gruposRes?.grupos ?? [];

    renderTablaTipos();
    llenarCombosAsignaciones();
  } catch (error) {
    console.error('[Tareas] Error cargando catálogos:', error);
    UIX.toast('Error al cargar tipos de tarea o grupos', 'error');
  }
}

async function cargarAsignaciones() {
  try {
    const res = await ApiClient.request('/api/tareas/asignaciones/');
    state.asignacionesRaw = res?.data?.asignaciones ?? res?.asignaciones ?? [];
    aplicarFiltrosYBusqueda();
  } catch (error) {
    console.error('[Tareas] Error cargando asignaciones:', error);
    state.asignacionesRaw = [];
    aplicarFiltrosYBusqueda();
    UIX.toast('Error al cargar tareas asignadas', 'error');
  }
}

// =====================
// Catálogo TIPOS (tipotarea)
// =====================
function renderTablaTipos() {
  const tbody = $('#tipoTableBody');
  if (!tbody) return;

  if (!state.tipos.length) {
    tbody.innerHTML = `
      <tr>
        <td colspan="5" class="text-center text-muted py-3">
          No hay tipos de tarea registrados.
        </td>
      </tr>`;
    const info = $('#tipoPaginationInfo');
    const btns = $('#tipoPaginationButtons');
    if (info) info.textContent = 'Sin registros.';
    if (btns) btns.innerHTML = '';
    return;
  }

  const rows = paginate(state.tipos, state.tiposPageSize, state.tiposCurrentPage);

  tbody.innerHTML = rows.map(t => `
    <tr data-id="${t.IdTipoTarea}">
      <td>${t.IdTipoTarea}</td>
      <td>${esc(t.Nombre || '')}</td>
      <td>${esc(truncate(t.Descripcion || '', 60))}</td>
      <td>
        ${t.Activo ? '<span class="badge bg-success">Activo</span>'
                   : '<span class="badge bg-secondary">Inactivo</span>'}
      </td>
      <td>
        <div class="btn-group btn-group-sm" role="group">
          <button class="btn btn-outline-primary" data-action="edit-tipo" title="Editar">
            <i class="fas fa-pen"></i>
          </button>
          <button class="btn btn-outline-danger" data-action="toggle-tipo" title="Activar / Desactivar">
            <i class="fas fa-power-off"></i>
          </button>
        </div>
      </td>
    </tr>
  `).join('');

  tbody.querySelectorAll('button[data-action]').forEach(btn => {
    const tr = btn.closest('tr');
    const id = Number(tr?.dataset.id);
    const action = btn.dataset.action;
    if (!id) return;

    if (action === 'edit-tipo') btn.addEventListener('click', () => abrirModalTipoEdicion(id));
    if (action === 'toggle-tipo') btn.addEventListener('click', () => toggleTipoTarea(id));
  });

  renderTipoPagination();
}


function renderTipoPagination() {
  const total = state.tipos.length;
  const pages = Math.max(1, Math.ceil(total / state.tiposPageSize));
  const info = $('#tipoPaginationInfo');
  const cont = $('#tipoPaginationButtons');
  const select = $('#tipoPageSizeSelect');

  if (!info || !cont || !select) return;

  if (total === 0) {
    info.textContent = 'Sin registros.';
    cont.innerHTML = '';
    return;
  }

  const actual = state.tiposCurrentPage;
  const start = (actual - 1) * state.tiposPageSize + 1;
  const end = Math.min(actual * state.tiposPageSize, total);

  info.textContent = `Mostrando ${start}-${end} de ${total} tipo(s) de tarea`;
  select.value = String(state.tiposPageSize);

  cont.innerHTML = '';
  for (let p = 1; p <= pages; p++) {
    const btn = document.createElement('button');
    btn.className = `btn btn-sm ${p === actual ? 'btn-primary' : 'btn-outline-primary'}`;
    btn.textContent = p;
    btn.addEventListener('click', () => {
      state.tiposCurrentPage = p;
      renderTablaTipos();
    });
    cont.appendChild(btn);
  }
}


function abrirModalTipoNuevo() {
  const form = $('#tipoForm');
  form?.reset();
  form?.classList.remove('was-validated');
  $('#tipoId').value = '';
  $('#tipoNombre').value = '';
  $('#tipoDescripcion').value = '';

  $('#tipoModalTitle').innerHTML = `<i class="fas fa-list-check me-2"></i>Nuevo Tipo de Tarea`;
  new bootstrap.Modal($('#tipoModal')).show();
}

function abrirModalTipoEdicion(id) {
  const tipo = state.tipos.find(t => Number(t.IdTipoTarea) === Number(id));
  if (!tipo) {
    UIX.toast('Tipo de tarea no encontrado en memoria', 'error');
    return;
  }
  const form = $('#tipoForm');
  form?.classList.remove('was-validated');
  $('#tipoId').value = tipo.IdTipoTarea;
  $('#tipoNombre').value = tipo.Nombre || '';
  $('#tipoDescripcion').value = tipo.Descripcion || '';

  $('#tipoModalTitle').innerHTML = `<i class="fas fa-list-check me-2"></i>Editar Tipo de Tarea`;
  new bootstrap.Modal($('#tipoModal')).show();
}


async function guardarTipo(e) {
  e.preventDefault();
  const form = $('#tipoForm');
  form.classList.add('was-validated');
  if (!form.checkValidity()) {
    UIX.toast('Completa los campos obligatorios', 'error');
    return;
  }

  const id = $('#tipoId').value || null;
  const nombre = $('#tipoNombre').value.trim();
  const descripcion = $('#tipoDescripcion').value.trim() || null;

  const payload = { nombre, descripcion };

  try {
    if (id) {
      await ApiClient.request(`/api/tareas/tipos/${id}/`, {
        method: 'PUT',
        body: JSON.stringify(payload)
      });
      UIX.toast('Tipo de tarea actualizado');
    } else {
      await ApiClient.request('/api/tareas/tipos/', {
        method: 'POST',
        body: JSON.stringify(payload)
      });
      UIX.toast('Tipo de tarea creado');
    }

    bootstrap.Modal.getInstance($('#tipoModal'))?.hide();
    document.querySelectorAll('.modal-backdrop').forEach(el => el.remove());

    await cargarCatalogos();
  } catch (error) {
    console.error('[Tareas] Error al guardar tipo de tarea:', error);
    UIX.toast('Error al guardar tipo de tarea', 'error');
  }
}


async function toggleTipoTarea(id) {
  const tipo = state.tipos.find(t => Number(t.IdTipoTarea) === Number(id));
  if (!tipo) return;

  const activar = !tipo.Activo;

  const ok = await UIX.confirm({
    title: activar ? '¿Activar tipo de tarea?' : '¿Desactivar tipo de tarea?',
    text: activar
      ? 'El tipo de tarea volverá a estar disponible para nuevas asignaciones.'
      : 'Si desactivas este tipo de tarea, TODAS las asignaciones activas de este tipo en TODOS los grupos serán desactivadas.\n\n¿Seguro que deseas continuar?',
    icon: 'warning'
  });
  if (!ok) return;

  try {
    const endpoint = activar
      ? `/api/tareas/tipos/${id}/activar/`
      : `/api/tareas/tipos/${id}/desactivar/`;

    await ApiClient.request(endpoint, { method: 'PATCH' });
    UIX.toast(activar ? 'Tipo de tarea activado' : 'Tipo de tarea desactivado');
    await cargarCatalogos();
    await cargarAsignaciones(); // refresca asignaciones impactadas
  } catch (error) {
    console.error('[Tareas] Error toggling tipo tarea:', error);
    UIX.toast('Error al cambiar estado del tipo de tarea', 'error');
  }
}


// =====================
// Combos para asignaciones
// =====================
function llenarCombosAsignaciones() {
  const selTipo = $('#asigTipo');
  const filtroTipo = $('#fTipoTarea');
  const selGrupo = $('#asigGrupo');

  if (selTipo) {
    selTipo.innerHTML = `<option value="">Seleccione tipo...</option>` +
      state.tipos
        .filter(t => t.Activo === 1 || t.Activo === true)
        .map(t => `<option value="${t.IdTipoTarea}">${esc(t.Nombre || t.Descripcion || '')}</option>`)
        .join('');
  }

  if (filtroTipo) {
    filtroTipo.innerHTML = `<option value="">Todos</option>` +
      state.tipos
        .map(t => `<option value="${t.IdTipoTarea}">${esc(t.Nombre || t.Descripcion || '')}</option>`)
        .join('');
  }

  if (selGrupo) {
    selGrupo.innerHTML = `<option value="">Seleccione grupo...</option>` +
      state.grupos.map(g => `
        <option value="${g.IdGrupoAyudantes}">
          ${esc(g.Nombre || g.Grupo || '')}
        </option>
      `).join('');
  }
}


// =====================
// Asignaciones: filtros, búsqueda y tabla
// =====================
function aplicarFiltrosYBusqueda() {
  const q = (state.search || '').toLowerCase();
  const { grupo, tipoId, estado, fechaDesde, fechaHasta } = state.filters;

  let data = [...state.asignacionesRaw];

  data = data.filter(a => {
    const nombreGrupo = (a.Grupo || 'Sin grupo').toLowerCase();
    const tipo = (a.TipoTarea || '').toLowerCase();
    const fecha = a.FechaAsignacion || null;

    const okGrupo = !grupo || nombreGrupo.includes(grupo.toLowerCase());
    const okTipo = !tipoId || String(a.IdTipoTarea) === String(tipoId);
    const okEstado = !estado || String(a.EstadoTarea) === String(estado);

    let okFecha = true;
    if (fechaDesde) okFecha = okFecha && fecha && fecha >= fechaDesde;
    if (fechaHasta) okFecha = okFecha && fecha && fecha <= fechaHasta;

    const okGlobal = !q || (
      String(a.IdAsignacionTarea || '').includes(q) ||
      nombreGrupo.includes(q) ||
      tipo.includes(q) ||
      (fecha && fecha.includes(q))
    );

    return okGrupo && okTipo && okEstado && okFecha && okGlobal;
  });

  state.asignacionesFiltered = data;
  state.currentPage = 1;
  renderTablaAsignaciones();
  renderPaginacion();
}

function paginate(arr, size, page) {
  const start = (page - 1) * size;
  return arr.slice(start, start + size);
}

function renderPaginacion() {
  const total = state.asignacionesFiltered.length;
  const pages = Math.max(1, Math.ceil(total / state.pageSize));
  const cont = $('#paginationButtons');
  const info = $('#paginationInfo');

  if (!cont || !info) return;

  cont.innerHTML = '';

  if (total === 0) {
    info.textContent = 'Sin registros';
    return;
  }

  const actual = state.currentPage;
  const start = (actual - 1) * state.pageSize + 1;
  const end = Math.min(actual * state.pageSize, total);

  info.textContent = `Mostrando ${start}-${end} de ${total} registro(s)`;

  for (let p = 1; p <= pages; p++) {
    const btn = document.createElement('button');
    btn.className = `btn btn-sm ${p === actual ? 'btn-primary' : 'btn-outline-primary'}`;
    btn.textContent = p;
    btn.addEventListener('click', () => {
      state.currentPage = p;
      renderTablaAsignaciones();
      renderPaginacion();
    });
    cont.appendChild(btn);
  }
}

function renderTablaAsignaciones() {
  const tb = $('#asigTableBody');
  if (!tb) return;

  if (!state.asignacionesFiltered.length) {
    tb.innerHTML = `
      <tr>
        <td colspan="6" class="text-center text-muted py-4">
          No hay tareas asignadas para mostrar.
        </td>
      </tr>`;
    return;
  }

  const rows = paginate(state.asignacionesFiltered, state.pageSize, state.currentPage);

  tb.innerHTML = rows.map(a => {
    const id = a.IdAsignacionTarea;
    const grupo = a.Grupo || 'Sin grupo';
    const tipo = a.TipoTarea || '-';
    const fecha = formatDate(a.FechaAsignacion);
    const estado = renderEstadoBadge(a.EstadoTarea);

    return `
      <tr data-id="${id}">
        <td class="text-center">
          <input type="checkbox" class="form-check-input row-check">
        </td>
        <td>${esc(grupo)}</td>
        <td>${esc(tipo)}</td>
        <td>${esc(fecha)}</td>
        <td>${estado}</td>
        <td>
          <div class="btn-group btn-group-sm" role="group">
            <button class="btn btn-outline-info" data-action="view" title="Ver detalle">
              <i class="fas fa-eye"></i>
            </button>
            <button class="btn btn-outline-primary" data-action="edit" title="Editar asignación">
              <i class="fas fa-pen"></i>
            </button>
            <button class="btn btn-outline-danger" data-action="delete" title="Desactivar asignación">
              <i class="fas fa-ban"></i>
            </button>
          </div>
        </td>
      </tr>
    `;
  }).join('');

  tb.querySelectorAll('button[data-action]').forEach(btn => {
    const tr = btn.closest('tr');
    const id = Number(tr?.dataset.id);
    const action = btn.dataset.action;
    if (!id) return;

    if (action === 'view') btn.addEventListener('click', () => verDetalleAsignacion(id));
    if (action === 'edit') btn.addEventListener('click', () => editarAsignacion(id));
    if (action === 'delete') btn.addEventListener('click', () => desactivarAsignacion(id));
  });
}

// =====================
// Asignaciones: CRUD
// =====================
function abrirModalAsignacionNueva() {
  const form = $('#asigForm');
  form?.reset();
  form?.classList.remove('was-validated');
  $('#asigId').value = '';
  $('#asigEstado').value = 'Pendiente';

  llenarCombosAsignaciones();
  $('#asigModalTitle').innerHTML = `<i class="fas fa-clipboard-list me-2"></i>Nueva Asignación de Tarea`;
  new bootstrap.Modal($('#asigModal')).show();
}

async function editarAsignacion(id) {
  try {
    const res = await ApiClient.request(`/api/tareas/asignaciones/${id}/`);
    const a = res?.data?.asignacion ?? res?.data ?? res ?? null;

    if (!a) {
      UIX.toast('No se pudo cargar la asignación', 'error');
      return;
    }
    const form = $('#asigForm');
    form?.classList.remove('was-validated');
    $('#asigId').value = a.IdAsignacionTarea;
    $('#asigFecha').value = toInputDate(a.FechaAsignacion);
    $('#asigEstado').value = a.EstadoTarea || 'Pendiente';

    llenarCombosAsignaciones();
    $('#asigGrupo').value = a.IdGrupoVoluntario || '';
    $('#asigTipo').value = a.IdTipoTarea || '';

    $('#asigModalTitle').innerHTML = `<i class="fas fa-clipboard-list me-2"></i>Editar Asignación`;
    new bootstrap.Modal($('#asigModal')).show();
  } catch (error) {
    console.error('[Tareas] Error cargando asignación:', error);
    UIX.toast('Error al cargar asignación', 'error');
  }
}

async function guardarAsignacion(e) {
  e.preventDefault();
  const form = $('#asigForm');
  form.classList.add('was-validated');
  if (!form.checkValidity()) {
    UIX.toast('Completa los campos obligatorios', 'error');
    return;
  }

  const id = $('#asigId').value || null;
  const idGrupo = Number($('#asigGrupo').value);
  const idTipo = Number($('#asigTipo').value);
  const fecha = $('#asigFecha').value;
  const estado = $('#asigEstado').value;

  const payload = {
    id_grupo_voluntario: idGrupo,
    id_tipo_tarea: idTipo,
    fecha_asignacion: fecha,
    estado_tarea: estado
  };

  try {
    if (id) {
      await ApiClient.request(`/api/tareas/asignaciones/${id}/`, {
        method: 'PUT',
        body: JSON.stringify(payload)
      });
      UIX.toast('Asignación actualizada');
    } else {
      await ApiClient.request('/api/tareas/asignaciones/', {
        method: 'POST',
        body: JSON.stringify(payload)
      });
      UIX.toast('Asignación creada');
    }

    bootstrap.Modal.getInstance($('#asigModal'))?.hide();
    document.querySelectorAll('.modal-backdrop').forEach(el => el.remove());
    await cargarAsignaciones();
  } catch (error) {
    console.error('[Tareas] Error al guardar asignación:', error);
    UIX.toast('Error al guardar asignación', 'error');
  }
}

async function desactivarAsignacion(id) {
  const ok = await UIX.confirm({
    title: '¿Desactivar asignación?',
    text: 'La asignación no se eliminará, solo quedará inactiva.',
    icon: 'warning'
  });
  if (!ok) return;

  try {
    await ApiClient.request(`/api/tareas/asignaciones/${id}/desactivar/`, {
      method: 'PATCH'
    });
    UIX.toast('Asignación desactivada');
    await cargarAsignaciones();
  } catch (error) {
    console.error('[Tareas] Error al desactivar asignación:', error);
    UIX.toast('Error al desactivar asignación', 'error');
  }
}

async function verDetalleAsignacion(id) {
  try {
    const res = await ApiClient.request(`/api/tareas/asignaciones/${id}/`);
    const a = res?.data ?? res ?? null;
    if (!a) {
      UIX.toast('No se pudo cargar el detalle', 'error');
      return;
    }

    $('#detalleGrupo').textContent = a.Grupo || 'Sin grupo';
    $('#detalleTipoTarea').textContent = a.TipoTarea || '-';
    $('#detalleFecha').textContent = formatDate(a.FechaAsignacion);
    $('#detalleEstado').innerHTML = renderEstadoBadge(a.EstadoTarea);

    new bootstrap.Modal($('#asigDetalleModal')).show();
  } catch (error) {
    console.error('[Tareas] Error detalle asignación:', error);
    UIX.toast('Error al cargar detalle de la asignación', 'error');
  }
}

// =====================
// Exportar / imprimir (asignaciones)
// =====================
function exportCSV() {
  const headers = ['ID', 'Grupo', 'Tarea', 'Fecha', 'Estado'];
  const rows = state.asignacionesFiltered.map(a => [
    a.IdAsignacionTarea,
    a.Grupo || 'Sin grupo',
    a.TipoTarea || '',
    a.FechaAsignacion || '',
    a.EstadoTarea || ''
  ]);

  const csvText = [headers, ...rows]
    .map(r => r.map(csvEscape).join(','))
    .join('\n');

  const blob = new Blob([csvText], { type: 'text/csv;charset=utf-8;' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = 'tareas_asignadas.csv';
  a.click();
  URL.revokeObjectURL(a.href);
}

function imprimir() {
  window.print();
}

// =====================
// Utilidades
// =====================

function truncate(text = '', max = 60) {
  const s = String(text || '');
  return s.length > max ? s.slice(0, max - 1) + '…' : s;
}

function toInputDate(value) {
  if (!value) return '';
  // Si viene con tiempo: 2025-11-05T00:00:00
  if (value.includes('T')) {
    return value.split('T')[0];
  }
  // Si ya viene como YYYY-MM-DD lo dejamos tal cual
  if (/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return value;
  }
  // Intento extra: parsear con Date
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return '';
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
}



function esc(s = '') {
  return String(s)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');
}

function csvEscape(v) {
  const s = (v ?? '').toString().replaceAll('"', '""');
  return `"${s}"`;
}

function formatDate(dateStr) {
  if (!dateStr) return '-';
  try {
    const d = new Date(dateStr);
    if (Number.isNaN(d.getTime())) return dateStr;
    return d.toLocaleDateString('es-ES');
  } catch {
    return dateStr;
  }
}

function renderEstadoBadge(estado) {
  const map = {
    'Pendiente': 'warning',
    'En progreso': 'info',
    'Cumplida': 'success',
    'Cancelada': 'secondary'
  };
  const cls = map[estado] || 'secondary';
  return `<span class="badge bg-${cls}">${esc(estado || '-')}</span>`;
}

// =====================
// Eventos e init
// =====================
function bindEvents() {
  // Tipos
  $('#btnNuevoTipo')?.addEventListener('click', abrirModalTipoNuevo);
  $('#tipoForm')?.addEventListener('submit', guardarTipo);

   // 🔹 PageSize de TIPOS
  $('#tipoPageSizeSelect')?.addEventListener('change', (e) => {
    state.tiposPageSize = Number(e.target.value) || 10;
    state.tiposCurrentPage = 1;
    renderTablaTipos();
  });

  // Asignaciones
  $('#btnNuevaAsignacion')?.addEventListener('click', abrirModalAsignacionNueva);
  $('#asigForm')?.addEventListener('submit', guardarAsignacion);

  $('#btnExportar')?.addEventListener('click', exportCSV);
  $('#btnImprimir')?.addEventListener('click', imprimir);

  // Filtros
  $('#btnApplyFilters')?.addEventListener('click', () => {
    state.filters.grupo = $('#fGrupo')?.value?.trim() || '';
    state.filters.tipoId = $('#fTipoTarea')?.value || '';
    state.filters.estado = document.querySelector('input[name="fEstado"]:checked')?.value || '';
    state.filters.fechaDesde = $('#fFechaDesde')?.value || '';
    state.filters.fechaHasta = $('#fFechaHasta')?.value || '';
    aplicarFiltrosYBusqueda();
    bootstrap.Modal.getInstance($('#filtersModal'))?.hide();
  });

  $('#btnClearFilters')?.addEventListener('click', () => {
    $('#fGrupo').value = '';
    $('#fTipoTarea').value = '';
    const all = $('#fEstadoTodos');
    if (all) all.checked = true;
    $('#fFechaDesde').value = '';
    $('#fFechaHasta').value = '';
    state.filters = { grupo: '', tipoId: '', estado: '', fechaDesde: '', fechaHasta: '' };
    aplicarFiltrosYBusqueda();
  });

  // Búsqueda global
  $('#globalSearch')?.addEventListener('input', (e) => {
    state.search = e.target.value || '';
    aplicarFiltrosYBusqueda();
  });

  // PageSize
  $('#pageSizeSelect')?.addEventListener('change', (e) => {
    const size = Number(e.target.value) || 10;
    state.pageSize = size;
    state.currentPage = 1;
    renderTablaAsignaciones();
    renderPaginacion();
  });

  // Select All asignaciones
  $('#selectAll')?.addEventListener('change', (e) => {
    const checked = e.target.checked;
    $$('#asigTableBody .row-check').forEach(chk => (chk.checked = checked));
  });
}

export const TareasManager = {
  async init() {
    console.log('[Tareas] Inicializando módulo de Tareas (tipos + asignaciones)…');
    await cargarCatalogos();
    await cargarAsignaciones();
    bindEvents();
  }
};
