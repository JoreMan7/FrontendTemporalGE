// =====================
// Módulo: CURSOS
// Ruta backend (según cursos.py): /api/cursos/
// =====================
import { ApiClient } from '../modules/api.js';

const $  = (s) => document.querySelector(s);
const $$ = (s) => document.querySelectorAll(s);

const UIX = {
  async confirm({ title = "¿Confirmar?", text = "", icon = "question" } = {}) {
    if (window.Swal?.fire) {
      const r = await Swal.fire({ title, text, icon, showCancelButton: true, confirmButtonText: "Sí", cancelButtonText: "Cancelar" });
      return r.isConfirmed;
    }
    return confirm(text || title);
  },
  toast(msg, type = "success") {
    if (window.Swal?.fire)
      return Swal.fire({ toast: true, icon: type, title: msg, timer: 2200, position: "top-end", showConfirmButton: false });
    alert(msg);
  },
  error(msg) {
    if (window.Swal?.fire) return Swal.fire("Error", msg, "error");
    alert(`Error: ${msg}`);
  }
};

const state = {
  raw: [],          // cursos del backend (solo activos según API)
  enriched: [],     // cursos con #pasos y #asignaciones
  filtered: [],
  pageSize: 10,
  currentPage: 1,
  filters: { nombre: "", estado: "" },
  cacheDetalles: new Map(),
  loading: false,
  currentCursoId: null // Para manejar el curso actual en detalle
};

// =====================
// Carga inicial
// =====================
async function cargarCursos() {
  try {
    state.loading = true;
    renderLoading();
    
    const res = await ApiClient.request('/api/cursos/');
    const cursos = res?.data?.cursos || res?.cursos || res || [];
    state.raw = Array.isArray(cursos) ? cursos : [];
    
    // Enriquecer con conteos
    const dets = await Promise.all(
      state.raw.map(async (c) => {
        const det = await obtenerDetalleCurso(c.IdTipoCurso, { useCache: true }).catch(() => null);
        const pasos = det?.curso?.pasos?.length ?? 0;
        const asign = det?.curso?.asignaciones?.filter(a => a.Activo === 1)?.length ?? 0;
        return {
          id: c.IdTipoCurso,
          nombre: c.Descripcion,
          pasos,
          asignaciones: asign,
          activo: 1
        };
      })
    );
    
    state.enriched = dets;
    state.filtered = [...state.enriched];
    state.currentPage = 1;
    renderTable();
    renderPagination();
  } catch (e) {
    console.error(e);
    UIX.error("No se pudieron cargar los cursos.");
  } finally {
    state.loading = false;
  }
}

// =====================
// Renderers
// =====================
function renderLoading() {
  const tb = $("#tableBody");
  if (!tb) return;
  tb.innerHTML = `
    <tr>
      <td colspan="6" class="text-center py-5">
        <div class="spinner-border text-primary" role="status"></div>
        <p class="mt-2 text-muted">Cargando cursos…</p>
      </td>
    </tr>`;
}

function renderTable() {
  const tb = $("#tableBody");
  if (!tb) return;

  const rows = paginate(state.filtered, state.pageSize, state.currentPage);
  if (!rows.length) {
    tb.innerHTML = `<tr><td colspan="6" class="text-center text-muted py-4">Sin registros.</td></tr>`;
    updatePaginationInfo(0, 0, 0);
    return;
  }

  tb.innerHTML = rows.map(r => `
    <tr data-id="${r.id}">
      <td class="text-center"><input type="checkbox" class="row-check"></td>
      <td><strong>${esc(r.nombre)}</strong></td>
      <td class="text-center">${r.pasos}</td>
      <td class="text-center">${r.asignaciones}</td>
      <td class="text-center">${r.activo === 1 ? '<span class="badge bg-success">Activo</span>' : '<span class="badge bg-secondary">Inactivo</span>'}</td>
      <td class="d-flex flex-wrap gap-1">
        <button class="btn btn-sm btn-outline-info" data-action="view"><i class="fas fa-eye"></i></button>
        <button class="btn btn-sm btn-outline-warning" data-action="edit"><i class="fas fa-pen"></i></button>
        <button class="btn btn-sm btn-outline-success" data-action="assign"><i class="fas fa-link"></i></button>
        <button class="btn btn-sm btn-outline-danger" data-action="deactivate"><i class="fas fa-ban"></i></button>
      </td>
    </tr>
  `).join("");

  // Bind row actions
  tb.addEventListener("click", (e) => {
    const btn = e.target.closest('button[data-action]');
    if (!btn) return;
    
    const id = Number(btn.closest("tr").dataset.id);
    const action = btn.dataset.action;
    
    switch(action) {
      case "view": verDetalle(id); break;
      case "edit": editarCurso(id); break;
      case "assign": asignarCurso(id); break;
      case "deactivate": desactivarCurso(id); break;
    }
  });

  const start = (state.currentPage - 1) * state.pageSize + 1;
  const end   = start + rows.length - 1;
  updatePaginationInfo(state.filtered.length, start, end);
}

function updatePaginationInfo(total, start, end) {
  const info = $("#paginationInfo");
  if (!info) return;
  if (total === 0) info.textContent = "Sin resultados";
  else info.textContent = `Mostrando ${start}-${end} de ${total}`;
}

function renderPagination() {
  const total = state.filtered.length;
  const pages = Math.max(1, Math.ceil(total / state.pageSize));
  const cont = $("#paginationButtons");
  cont.innerHTML = "";
  for (let p = 1; p <= pages; p++) {
    const b = document.createElement("button");
    b.className = `btn btn-sm ${p === state.currentPage ? "btn-primary" : "btn-outline-primary"}`;
    b.textContent = p;
    b.addEventListener("click", () => { state.currentPage = p; renderTable(); renderPagination(); });
    cont.appendChild(b);
  }
}

// =====================
// Búsqueda y filtros
// =====================
function aplicarFiltros() {
  const texto = (state.filters.nombre || "").toLowerCase().trim();
  const est   = state.filters.estado;
  let arr = [...state.enriched];

  if (texto) {
    arr = arr.filter(x => x.nombre.toLowerCase().includes(texto));
  }

  if (est === "1") {
    arr = arr.filter(x => x.activo === 1);
  }

  state.filtered = arr;
  state.currentPage = 1;
  renderTable();
  renderPagination();
}

// =====================
// CRUD Cursos
// =====================
function nuevoCurso() {
  resetCursoForm();
  $("#cursoModalTitle").innerHTML = `<i class="fas fa-book me-2"></i>Nuevo Curso`;
  new bootstrap.Modal("#cursoModal").show();
}

async function editarCurso(id) {
  try {
    const det = await obtenerDetalleCurso(id, { force: true });
    const curso = det?.curso;
    if (!curso) throw new Error("No se pudo cargar el curso");

    resetCursoForm();
    $("#cursoId").value = curso.IdTipoCurso;
    $("#cursoNombre").value = curso.Descripcion ?? "";
    $("#cursoModalTitle").innerHTML = `<i class="fas fa-pen me-2"></i>Editar Curso`;
    new bootstrap.Modal("#cursoModal").show();
  } catch (e) {
    console.error(e);
    UIX.error("No se pudo cargar el curso para edición.");
  }
}

async function guardarCurso(e) {
  e.preventDefault();
  const form = $("#cursoForm");
  form.classList.add("was-validated");
  if (!form.checkValidity()) return;

  const id   = $("#cursoId").value.trim();
  const desc = $("#cursoNombre").value.trim();
  const payload = { descripcion: desc };

  try {
    let r;
    if (id) {
      r = await ApiClient.request(`/api/cursos/${id}`, { method: "PUT", body: JSON.stringify(payload) });
    } else {
      r = await ApiClient.request(`/api/cursos/`, { method: "POST", body: JSON.stringify(payload) });
    }
    if (r?.success === false) throw new Error(r?.message || "No se pudo guardar");

    bootstrap.Modal.getInstance($("#cursoModal"))?.hide();
    UIX.toast("Guardado correctamente");
    await cargarCursos();
  } catch (err) {
    console.error(err);
    UIX.error(err.message || "Error al guardar el curso");
  }
}

async function desactivarCurso(id) {
  const ok = await UIX.confirm({ title: "¿Desactivar curso?", icon: "warning" });
  if (!ok) return;
  try {
    const r = await ApiClient.request(`/api/cursos/${id}/desactivar`, { method: "PATCH" });
    if (!r || r.success === false) throw new Error(r?.message || "No se pudo desactivar");
    UIX.toast("Curso desactivado");
    await cargarCursos();
  } catch (e) {
    console.error(e);
    UIX.error(e.message || "No se pudo desactivar");
  }
}

// =====================
// Asignación de Cursos a Grupos
// =====================
async function asignarCurso(id) {
  try {
    const det = await obtenerDetalleCurso(id);
    const curso = det?.curso;
    if (!curso) throw new Error("No se pudo cargar el curso");

    $("#cursoIdAsignar").value = curso.IdTipoCurso;
    $("#cursoNombreAsignar").value = curso.Descripcion;

    await cargarGruposDisponibles(id);
    new bootstrap.Modal("#asignarCursoModal").show();
  } catch (e) {
    console.error(e);
    UIX.error("No se pudo cargar la información para asignar el curso");
  }
}

async function cargarGruposDisponibles(idCurso) {
  try {
    const res = await ApiClient.request('/api/grupos/');
    const grupos = res?.grupos || res?.data?.grupos || [];
    
    const select = $("#grupoSelect");
    select.innerHTML = '<option value="">Seleccione un grupo...</option>';
    
    if (!grupos.length) {
      select.innerHTML += '<option value="" disabled>No hay grupos disponibles</option>';
      return;
    }

    // Filtrar grupos que no tengan ya este curso asignado activamente
    const gruposDisponibles = await Promise.all(
      grupos.map(async (grupo) => {
        const tieneCurso = await verificarCursoAsignado(grupo.IdGrupoAyudantes, idCurso);
        return { ...grupo, yaAsignado: tieneCurso };
      })
    );

    // Agregar opciones al select
    gruposDisponibles.forEach(grupo => {
      const option = document.createElement('option');
      option.value = grupo.IdGrupoAyudantes;
      option.textContent = `${grupo.Grupo} (Líder: ${grupo.NombreLider} ${grupo.ApellidoLider})`;
      
      if (grupo.yaAsignado) {
        option.textContent += ' - YA ASIGNADO';
        option.disabled = true;
      }
      
      select.appendChild(option);
    });

  } catch (e) {
    console.error(e);
    UIX.error("Error al cargar los grupos");
  }
}

async function verificarCursoAsignado(idGrupo, idCurso) {
  try {
    const res = await ApiClient.request(`/api/cursos/asignaciones/grupo/${idGrupo}`);
    const asignaciones = res?.data?.asignaciones || [];
    
    return asignaciones.some(asig => 
      asig.id_tipo_curso === idCurso && asig.Activo === 1
    );
  } catch (e) {
    console.error("Error verificando asignación:", e);
    return false;
  }
}

async function guardarAsignacion(e) {
  e.preventDefault(); // Esto es crucial
  
  const form = $("#asignarCursoForm");
  form.classList.add("was-validated");
  
  // Verificar si el modal sigue abierto (no se cerró con la X)
  const modal = document.getElementById('asignarCursoModal');
  if (!modal || !modal.classList.contains('show')) {
    console.log('Modal cerrado, cancelando envío');
    return;
  }
  
  if (!form.checkValidity()) return;

  const idCurso = $("#cursoIdAsignar").value;
  const idGrupo = $("#grupoSelect").value;

  if (!idCurso || !idGrupo) {
    UIX.error("Datos incompletos");
    return;
  }

  try {
    const payload = { id_tipo_curso: parseInt(idCurso) };
    const r = await ApiClient.request(`/api/cursos/asignaciones/grupo/${idGrupo}`, {
      method: "POST",
      body: JSON.stringify(payload)
    });

    if (r?.success === false) throw new Error(r?.message || "No se pudo asignar el curso");

    // Cerrar el modal solo si fue exitoso
    bootstrap.Modal.getInstance(modal)?.hide();
    UIX.toast("Curso asignado al grupo exitosamente");
    await cargarCursos();
  } catch (err) {
    console.error(err);
    UIX.error(err.message || "Error al asignar el curso al grupo");
  }
}

// =====================
// Gestión de asignaciones existentes
// =====================
async function verTodasAsignaciones(idCurso) {
  try {
    const det = await obtenerDetalleCurso(idCurso, { force: true });
    const asignaciones = det?.curso?.asignaciones || [];
    
    let html = `
      <div class="table-responsive">
        <table class="table table-sm table-striped">
          <thead class="table-dark">
            <tr>
              <th>ID Grupo</th>
              <th>Fecha Asignación</th>
              <th>Progreso</th>
              <th>Estado</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
    `;
    
    if (!asignaciones.length) {
      html += `<tr><td colspan="5" class="text-center text-muted py-3">No hay asignaciones para este curso</td></tr>`;
    } else {
      asignaciones.forEach(asig => {
        const progreso = `${asig.pasos_completados || 0}/${asig.total_pasos || 0}`;
        html += `
          <tr>
            <td><strong>Grupo #${asig.id_grupo_ayudantes}</strong></td>
            <td>${formatFechaHora(asig.fecha_asignacion)}</td>
            <td>
              <div class="progress" style="height: 20px;">
                <div class="progress-bar ${asig.pasos_completados === asig.total_pasos ? 'bg-success' : 'bg-primary'}" 
                     style="width: ${(asig.pasos_completados / asig.total_pasos) * 100 || 0}%">
                  ${progreso}
                </div>
              </div>
            </td>
            <td>${asig.Activo === 1 ? 
              '<span class="badge bg-success">Activa</span>' : 
              '<span class="badge bg-secondary">Inactiva</span>'}</td>
            <td>
              ${asig.Activo === 1 ? 
                `<button class="btn btn-sm btn-outline-danger" onclick="CursosManager.desactivarAsignacion(${asig.id_grupo_ayudantes}, ${idCurso})">
                  <i class="fas fa-ban"></i> Desactivar
                 </button>` :
                `<button class="btn btn-sm btn-outline-success" onclick="CursosManager.activarAsignacion(${asig.id_grupo_ayudantes}, ${idCurso})">
                  <i class="fas fa-check"></i> Activar
                 </button>`
              }
            </td>
          </tr>
        `;
      });
    }
    
    html += `</tbody></table></div>`;
    
    await Swal.fire({
      title: `Asignaciones del Curso`,
      html: html,
      width: '900px',
      showCloseButton: true,
      showConfirmButton: false
    });
  } catch (e) {
    console.error(e);
    UIX.error("Error al cargar las asignaciones");
  }
}

async function desactivarAsignacion(idGrupo, idCurso) {
  const ok = await UIX.confirm({ 
    title: "¿Desactivar asignación?", 
    text: "El grupo ya no podrá avanzar en este curso." 
  });
  if (!ok) return;
  
  try {
    const r = await ApiClient.request(
      `/api/cursos/asignaciones/grupo/${idGrupo}/curso/${idCurso}/desactivar`, 
      { method: "PATCH" }
    );
    if (r?.success) {
      UIX.toast("Asignación desactivada");
      // Cerrar modal actual y recargar
      Swal.close();
      if (state.currentCursoId) {
        await verDetalle(state.currentCursoId);
      }
      await cargarCursos();
    }
  } catch (e) {
    UIX.error("Error al desactivar la asignación");
  }
}

async function activarAsignacion(idGrupo, idCurso) {
  try {
    const r = await ApiClient.request(
      `/api/cursos/asignaciones/grupo/${idGrupo}/curso/${idCurso}/activar`, 
      { method: "PATCH" }
    );
    if (r?.success) {
      UIX.toast("Asignación activada");
      Swal.close();
      if (state.currentCursoId) {
        await verDetalle(state.currentCursoId);
      }
      await cargarCursos();
    }
  } catch (e) {
    UIX.error("Error al activar la asignación");
  }
}

// =====================
// Detalle del Curso (pasos + asignaciones)
// =====================
async function verDetalle(id) {
  try {
    state.currentCursoId = id;
    const det = await obtenerDetalleCurso(id, { force: true });
    const curso = det?.curso;
    if (!curso) throw new Error("No se pudo cargar el detalle");

    // Encabezado
    $("#detalleHeader").innerHTML = `
      <div class="d-flex justify-content-between align-items-center flex-wrap gap-2">
        <div>
          <h5 class="mb-1">${esc(curso.Descripcion)}</h5>
          <span class="badge ${curso.Activo === 1 ? "bg-success" : "bg-secondary"}">
            ${curso.Activo === 1 ? "Activo" : "Inactivo"}
          </span>
        </div>
        <div>
          <small class="text-muted me-3">ID: ${curso.IdTipoCurso}</small>
          <button class="btn btn-sm btn-outline-primary" id="btnAsignarDesdeDetalle">
            <i class="fas fa-plus me-1"></i>Asignar a Grupo
          </button>
        </div>
      </div>
    `;

    // Bind botón de asignar desde detalle
    $("#btnAsignarDesdeDetalle")?.addEventListener("click", () => {
      bootstrap.Modal.getInstance($("#cursoDetalleModal"))?.hide();
      asignarCurso(id);
    });

    // Bind botón ver todas asignaciones
    $("#btnVerTodasAsignaciones")?.addEventListener("click", () => {
      verTodasAsignaciones(id);
    });

    // Cargar pasos y asignaciones
    await cargarPasosEnDetalle(curso);
    await cargarAsignacionesEnDetalle(curso);

    new bootstrap.Modal("#cursoDetalleModal").show();
  } catch (e) {
    console.error(e);
    UIX.error("No se pudo cargar el detalle del curso.");
  }
}

async function cargarPasosEnDetalle(curso) {
  const pasosBody = $("#detallePasosBody");
  const pasos = curso.pasos || [];
  
  if (!pasos.length) {
    pasosBody.innerHTML = `<tr><td colspan="3" class="text-center text-muted py-3">Aún no hay pasos definidos.</td></tr>`;
  } else {
    pasosBody.innerHTML = pasos.map(p => `
      <tr data-id-paso="${p.id_paso}">
        <td width="60"><strong>#${p.numero_paso}</strong></td>
        <td>${esc(p.descripcion)}</td>
        <td class="text-end">
          <button class="btn btn-sm btn-outline-warning me-1" data-action="edit-step">
            <i class="fas fa-pen"></i>
          </button>
          <button class="btn btn-sm btn-outline-danger" data-action="del-step">
            <i class="fas fa-trash"></i>
          </button>
        </td>
      </tr>
    `).join("");
    
    // Bind botones de pasos
    pasosBody.addEventListener("click", (e) => {
      const btn = e.target.closest('button[data-action]');
      if (!btn) return;
      
      const idPaso = Number(btn.closest("tr").dataset.idPaso);
      const action = btn.dataset.action;
      
      switch(action) {
        case "edit-step": editarPaso(curso.IdTipoCurso, idPaso); break;
        case "del-step": eliminarPaso(curso.IdTipoCurso, idPaso); break;
      }
    });
  }

  // Bind botón nuevo paso
  $("#btnNuevoPaso")?.addEventListener("click", () => crearPaso(curso.IdTipoCurso));
}

async function cargarAsignacionesEnDetalle(curso) {
  const asigBody = $("#detalleAsignacionesBody");
  const asignaciones = curso.asignaciones || [];
  
  if (!asignaciones.length) {
    asigBody.innerHTML = `<tr><td colspan="5" class="text-center text-muted py-3">No hay asignaciones a grupos.</td></tr>`;
  } else {
    asigBody.innerHTML = asignaciones.map(a => {
      const progreso = `${a.pasos_completados || 0}/${a.total_pasos || 0}`;
      const porcentaje = a.total_pasos ? Math.round((a.pasos_completados / a.total_pasos) * 100) : 0;
      
      return `
        <tr>
          <td><strong>Grupo #${a.id_grupo_ayudantes}</strong></td>
          <td>${formatFechaHora(a.fecha_asignacion)}</td>
          <td>
            <small>${progreso}</small>
            <div class="progress" style="height: 6px;">
              <div class="progress-bar ${porcentaje === 100 ? 'bg-success' : 'bg-info'}" 
                   style="width: ${porcentaje}%"></div>
            </div>
          </td>
          <td>${a.Activo === 1 ? 
            '<span class="badge bg-success">Activa</span>' : 
            '<span class="badge bg-secondary">Inactiva</span>'}</td>
          <td>
            <button class="btn btn-sm btn-outline-${a.Activo === 1 ? 'danger' : 'success'}" 
                    onclick="CursosManager.${a.Activo === 1 ? 'desactivar' : 'activar'}Asignacion(${a.id_grupo_ayudantes}, ${curso.IdTipoCurso})">
              <i class="fas fa-${a.Activo === 1 ? 'ban' : 'check'}"></i>
            </button>
          </td>
        </tr>
      `;
    }).join("");
  }
}

async function obtenerDetalleCurso(id, { force = false, useCache = false } = {}) {
  if (useCache && state.cacheDetalles.has(id) && !force) {
    return state.cacheDetalles.get(id);
  }
  const res = await ApiClient.request(`/api/cursos/${id}`);
  const data = res?.data || res;
  if (data?.curso) {
    state.cacheDetalles.set(id, data);
  }
  return data;
}

// =====================
// Gestión de pasos (curso_pasos)
// =====================
async function crearPaso(idCurso) {
  try {
    const { value: formValues } = await Swal.fire({
      title: 'Nuevo paso',
      html:
        '<input id="swal-num" class="swal2-input" type="number" min="1" placeholder="Número de paso">' +
        '<input id="swal-desc" class="swal2-input" type="text" placeholder="Descripción">',
      focusConfirm: false,
      preConfirm: () => {
        const numero_paso = Number(document.getElementById('swal-num').value);
        const descripcion  = (document.getElementById('swal-desc').value || "").trim();
        if (!numero_paso || !descripcion) {
          Swal.showValidationMessage('Complete número y descripción');
          return;
        }
        return { numero_paso, descripcion };
      },
      showCancelButton: true,
      confirmButtonText: 'Guardar',
      cancelButtonText: 'Cancelar'
    });
    if (!formValues) return;

    const r = await ApiClient.request(`/api/cursos/${idCurso}/pasos`, {
      method: "POST",
      body: JSON.stringify(formValues)
    });
    if (r?.success === false) throw new Error(r?.message || "No se pudo crear el paso");
    UIX.toast("Paso creado");
    await verDetalle(idCurso);
    await cargarCursos();
  } catch (e) {
    console.error(e);
    UIX.error(e.message || "Error al crear paso");
  }
}

async function editarPaso(idCurso, idPaso) {
  try {
    const det = await obtenerDetalleCurso(idCurso);
    const paso = (det?.curso?.pasos || []).find(p => p.id_paso === idPaso);
    if (!paso) return;

    const { value: formValues } = await Swal.fire({
      title: 'Editar paso',
      html:
        `<input id="swal-num" class="swal2-input" type="number" min="1" value="${paso.numero_paso}" placeholder="Número de paso">` +
        `<input id="swal-desc" class="swal2-input" type="text" value="${escAttr(paso.descripcion)}" placeholder="Descripción">`,
      focusConfirm: false,
      preConfirm: () => {
        const numero_paso = Number(document.getElementById('swal-num').value);
        const descripcion  = (document.getElementById('swal-desc').value || "").trim();
        if (!numero_paso || !descripcion) {
          Swal.showValidationMessage('Complete número y descripción');
          return;
        }
        return { numero_paso, descripcion };
      },
      showCancelButton: true,
      confirmButtonText: 'Guardar',
      cancelButtonText: 'Cancelar'
    });
    if (!formValues) return;

    const r = await ApiClient.request(`/api/cursos/${idCurso}/pasos/${idPaso}`, {
      method: "PUT",
      body: JSON.stringify(formValues)
    });
    if (r?.success === false) throw new Error(r?.message || "No se pudo actualizar el paso");
    UIX.toast("Paso actualizado");
    await verDetalle(idCurso);
    await cargarCursos();
  } catch (e) {
    console.error(e);
    UIX.error(e.message || "Error al actualizar paso");
  }
}

async function eliminarPaso(idCurso, idPaso) {
  const ok = await UIX.confirm({ title: "¿Eliminar paso?", icon: "warning" });
  if (!ok) return;
  try {
    const r = await ApiClient.request(`/api/cursos/${idCurso}/pasos/${idPaso}`, { method: "DELETE" });
    if (r?.success === false) throw new Error(r?.message || "No se pudo eliminar el paso");
    UIX.toast("Paso eliminado");
    await verDetalle(idCurso);
    await cargarCursos();
  } catch (e) {
    console.error(e);
    UIX.error(e.message || "Error al eliminar paso");
  }
}

// =====================
// Utilidades
// =====================
function resetCursoForm() {
  const form = $("#cursoForm");
  if (form) {
    form.reset();
    form.classList.remove('was-validated');
  }
  $("#cursoId").value = "";
}

function paginate(arr, size, page) {
  const i = (page - 1) * size;
  return arr.slice(i, i + size);
}

function esc(s = "") {
  return String(s)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function escAttr(s = "") {
  return String(s).replaceAll('"', '&quot;');
}

function csvCell(v) {
  if (v == null) return "";
  const s = String(v);
  return s.includes(",") ? `"${s.replaceAll('"', '""')}"` : s;
}

function formatFechaHora(str) {
  if (!str) return "-";
  const d = new Date(str);
  if (isNaN(d)) return "-";
  return d.toLocaleString('es-ES', { year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' });
}

// =====================
// Eventos
// =====================
function bindEvents() {
  // Botones de barra
  $("#btnNuevoCurso")?.addEventListener("click", nuevoCurso);
  $("#btnExportar")?.addEventListener("click", exportCSV);
  $("#btnImprimir")?.addEventListener("click", () => window.print());
  $("#btnVolver")?.addEventListener("click", () => history.back());

  // Select-all
  $("#selectAll")?.addEventListener("change", (e) => {
    $$("#tableBody .row-check").forEach(ch => ch.checked = e.target.checked);
  });

  // Filtros modal
  $("#btnApplyFilters")?.addEventListener("click", () => {
    state.filters.nombre = $("#fNombre")?.value || "";
    const est = document.querySelector('input[name="fEstado"]:checked')?.value || "";
    state.filters.estado = est;
    aplicarFiltros();
    bootstrap.Modal.getInstance($("#filtersModal"))?.hide();
  });
  $("#btnClearFilters")?.addEventListener("click", () => {
    $("#fNombre").value = "";
    document.querySelector('input[name="fEstado"][value=""]')?.click();
  });

  // Global search
  $("#globalSearch")?.addEventListener("input", (e) => {
    state.filters.nombre = e.target.value || "";
    aplicarFiltros();
  });

  // Page size
  $("#pageSizeSelect")?.addEventListener("change", (e) => {
    state.pageSize = Number(e.target.value) || 10;
    state.currentPage = 1;
    renderTable();
    renderPagination();
  });

  // Formularios
  $("#cursoForm")?.addEventListener("submit", guardarCurso);
  $("#asignarCursoForm")?.addEventListener("submit", guardarAsignacion);

   const asignarModal = document.getElementById('asignarCursoModal');
  if (asignarModal) {
    asignarModal.addEventListener('hidden.bs.modal', function() {
      // Resetear el formulario
      $("#asignarCursoForm")?.reset();
      $("#asignarCursoForm")?.classList.remove('was-validated');
      
      // Limpiar selección
      const grupoSelect = $("#grupoSelect");
      if (grupoSelect) {
        grupoSelect.innerHTML = '<option value="">Seleccione un grupo...</option>';
      }
    });
  }

}

function exportCSV() {
  const headers = ["ID", "Curso", "#Pasos", "Asignaciones", "Estado"];
  const rows = state.filtered.map(r => [
    r.id,
    csvCell(r.nombre),
    r.pasos,
    r.asignaciones,
    r.activo === 1 ? "Activo" : "Inactivo"
  ]);
  const csvData = [headers, ...rows].map(r => r.join(",")).join("\n");
  const blob = new Blob([csvData], { type: "text/csv;charset=utf-8" });
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = "cursos.csv";
  a.click();
  URL.revokeObjectURL(a.href);
}

// =====================
// Init
// =====================
export const CursosManager = {
  async init() {
    bindEvents();
    await cargarCursos();
    
    // Hacer funciones disponibles globalmente para los eventos onclick
    window.CursosManager = {
      desactivarAsignacion,
      activarAsignacion
    };
  }
};