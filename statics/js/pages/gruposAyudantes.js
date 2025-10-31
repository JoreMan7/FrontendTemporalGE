// gruposAyudantes.js
// Página: Grupos de Ayudantes. Manejador principal llamado por app.js
import { ApiClient } from '../modules/api.js';

/* ==== HTTP & UI helpers ==== */
const UIX = {
  async confirm({ title = "¿Confirmar?", text = "", icon = "question" } = {}) {
    if (window.Swal?.fire) {
      const r = await Swal.fire({ title, text, icon, showCancelButton: true, confirmButtonText: "Sí", cancelButtonText: "Cancelar" });
      return r.isConfirmed;
    }
    return confirm(text || title);
  },
  toast(msg, type = "success") {
    if (window.Swal?.fire) return Swal.fire({ toast: true, icon: type, title: msg, timer: 2200, position: "top-end", showConfirmButton: false });
    alert(msg);
  },
  error(msg) {
    if (window.Swal?.fire) return Swal.fire("Error", msg, "error");
    alert(`Error: ${msg}`);
  }
};

/* ==== Estado ==== */
const state = {
  raw: [],
  filtered: [],
  pageSize: 10,
  currentPage: 1,
  filters: { nombre: "", lider: "", estado: "" }, 
  currentGrupoId: null
};

/* ==== Utils DOM ==== */
const $ = (s) => document.querySelector(s);
const $$ = (s) => document.querySelectorAll(s);

/* ==== Filtros, búsqueda y paginación ==== */
function applyFilters() {
  const q = ($("#globalSearch")?.value || "").trim().toLowerCase();
  const { nombre, lider, estado } = state.filters;

  state.filtered = state.raw.filter(g => {
    const gNombre = (g.Nombre || g.Grupo || "").toLowerCase();
    const gLider = `${g.NombreLider || ""} ${g.ApellidoLider || ""} ${g.DocumentoLider || ""}`.toLowerCase();
    const okNombre = !nombre || gNombre.includes(nombre.toLowerCase());
    const okLider  = !lider || gLider.includes(lider.toLowerCase());
    const okEstado = estado === "" || String(g.Activo) === String(estado);
    const okGlobal = !q || (
      String(g.IdGrupoAyudantes || "").includes(q) ||
      gNombre.includes(q) ||
      gLider.includes(q) ||
      String(g.DocumentoLider || "").includes(q)
    );
    return okNombre && okLider && okEstado && okGlobal;
  });

  state.currentPage = 1;
  renderTable();
  renderPagination();
}

function paginate(arr, size, page) {
  const i = (page - 1) * size;
  return arr.slice(i, i + size);
}

/* ==== Tabla principal ==== */
function renderTable() {
  const tb = $("#tableBody");
  if (!tb) return;

  const rows = paginate(state.filtered, state.pageSize, state.currentPage);
  if (!rows.length) {
    tb.innerHTML = `<tr><td colspan="7" class="text-center text-muted py-4">Sin datos.</td></tr>`;
    $("#paginationInfo").textContent = "0 de 0";
    $("#paginationButtons").innerHTML = "";
    return;
  }

  tb.innerHTML = rows.map(g => {
    const id = g.IdGrupoAyudantes;
    const nombre = g.Nombre || g.Grupo || "-";
    const lider = `${g.NombreLider || ""} ${g.ApellidoLider || ""}`.trim() || "-";
    const doc = g.DocumentoLider || "-";
    const tel = g.TelefonoLider || "-";
    const miembros = g.CantidadMiembros ?? "-";
    const activo = String(g.Activo) === "1";

    return `
      <tr data-id="${id}">
        <td class="text-center"><input type="checkbox" class="form-check-input row-check"></td>
        <td>${esc(nombre)}</td>
        <td>${esc(lider)}</td>
        <td>${esc(doc)}</td>
        <td>${esc(tel)}</td>
        <td>${miembros}</td>
        <td class="d-flex flex-wrap gap-1 align-items-center justify-content-center">
          <button class="btn btn-sm btn-outline-primary" data-action="edit" title="Editar"><i class="fas fa-pen"></i></button>
          <button class="btn btn-sm btn-outline-info" data-action="view" title="Ver"><i class="fas fa-eye"></i></button>
          <button class="btn btn-sm btn-outline-success" data-action="cursos" title="Gestionar Cursos"><i class="bi bi-mortarboard"></i></button>
          <button class="btn btn-sm btn-outline-danger" data-action="delete" title="Desactivar"><i class="fas fa-ban"></i></button>
        </td>
      </tr>
    `;
  }).join("");

  // Bind eventos de los botones
  tb.addEventListener("click", (e) => {
    const btn = e.target.closest('button[data-action]');
    if (!btn) return;
    
    const id = Number(btn.closest("tr")?.dataset.id);
    const action = btn.dataset.action;
    
    switch(action) {
      case "edit": editarGrupo(id); break;
      case "view": verMiembros(id); break;
      case "cursos": asignarCurso(id); break;
      case "delete": desactivarGrupo(id); break;
    }
  });

  $("#selectAll")?.addEventListener("change", e => {
    $$("#tableBody .row-check").forEach(c => (c.checked = e.target.checked));
  });

  const total = state.filtered.length;
  const ini = (state.currentPage - 1) * state.pageSize + 1;
  const fin = Math.min(state.currentPage * state.pageSize, total);
  $("#paginationInfo").textContent = `${ini}-${fin} de ${total}`;
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

/* ==== Cargas iniciales ==== */
async function cargarGrupos() {
  const data = await ApiClient.request("/api/grupos/");
  state.raw = (data.grupos || data || []);
  state.filtered = state.raw.filter(g => String(g.Activo) === "1");
  renderTable();
  renderPagination();
}

/* ==== CRUD Grupos ==== */
function abrirModalGrupo(titulo) {
  $("#grupoLiderId").value = "";
  $("#grupoBuscarLider").value = "";
  $("#liderResultadosInline").innerHTML = "";
  $("#liderPreview").classList.add("d-none");
  $("#grupoModalTitle").innerHTML = `<i class="fas fa-users-gear me-2"></i>${titulo}`;
  $("#grupoForm").reset();
  $("#grupoId").value = "";
  $("#liderPreview").classList.add("d-none");
  new bootstrap.Modal($("#grupoModal")).show();
}

function validarForm() {
  const f = $("#grupoForm");
  f.classList.add("was-validated");
  return f.checkValidity();
}

async function crearGrupo() { abrirModalGrupo("Nuevo Grupo"); }

async function editarGrupo(id) {
  try {
    const data = await ApiClient.request(`/api/grupos/${id}`);
    const g = data.grupo || data;

    $("#grupoId").value = g.IdGrupoAyudantes ?? g.id ?? "";
    $("#grupoNombre").value = g.Nombre ?? g.nombre ?? "";

    const liderId = g.IdHabitanteLider ?? g.lider?.id ?? null;
    $("#grupoLiderId").value = liderId || "";

    if (liderId) {
      setLiderPreview({
        IdHabitante: liderId,
        Nombre: g.NombreLider ?? g.lider?.nombre ?? "",
        Apellido: g.ApellidoLider ?? g.lider?.apellido ?? "",
        NumeroDocumento: g.DocumentoLider ?? g.lider?.documento ?? "",
        Telefono: g.TelefonoLider ?? g.lider?.telefono ?? ""
      });
    } else {
      $("#liderPreview").classList.add("d-none");
    }

    $("#grupoModalTitle").innerHTML = `<i class="fas fa-pen me-2"></i>Editar Grupo`;
    new bootstrap.Modal($("#grupoModal")).show();

  } catch (error) {
    console.error("Error al cargar datos del grupo:", error);
    UIX.toast("No se pudieron cargar los datos del grupo", "error");
  }
}

async function guardarGrupoSubmit(e) {
  e.preventDefault();
  if (!validarForm()) return;
  const payload = {
    nombre: $("#grupoNombre").value.trim(),
    id_habitante_lider: Number($("#grupoLiderId").value)
  };
  const id = $("#grupoId").value;
  try {
    if (id) {
      const r = await ApiClient.request(`/api/grupos/${id}`, {
        method: "PUT",
        body: JSON.stringify(payload)
      });
      if (r.success !== false) UIX.toast("Grupo actualizado");
    } else {
      const r = await ApiClient.request("/api/grupos/", {
        method: "POST",
        body: JSON.stringify(payload)
      });
      if (r.success !== false) UIX.toast("Grupo creado");
    }
    bootstrap.Modal.getInstance($("#grupoModal")).hide();
    await cargarGrupos();
  } catch {
    UIX.toast("Error al guardar el grupo", "error");
  }
}

async function desactivarGrupo(id) {
  const ok = await UIX.confirm({ 
    title: "¿Desactivar este grupo?", 
    text: "Podrás reactivarlo luego.", 
    icon: "warning" 
  });
  if (!ok) return;

  try {
    const r = await ApiClient.request(`/api/grupos/${id}/desactivar/`, {
      method: "PATCH"
    });
    
    if (r && r.success === true) {
      UIX.toast("Grupo desactivado");
      await cargarGrupos();
    } else {
      const errorMsg = r?.message || r?.error || "No se pudo desactivar";
      UIX.toast(errorMsg, "error");
    }
  } catch (error) { 
    console.error("Error en desactivarGrupo:", error);
    UIX.toast("Error al desactivar", "error"); 
  }
}

/* ==== Gestión de Cursos ==== */
async function asignarCurso(id) {
  try {
    // Obtener información del grupo
    const grupoData = await ApiClient.request(`/api/grupos/${id}`);
    const grupo = grupoData.grupo || grupoData;
    
    if (!grupo) {
      UIX.toast("No se pudo cargar la información del grupo", "error");
      return;
    }

    // Llenar datos del modal
    $("#grupoIdAsignar").value = id;
    $("#grupoNombreAsignar").value = grupo.Nombre || grupo.nombre || "";

    // Cargar cursos disponibles
    await cargarCursosDisponibles(id);

    // Mostrar modal
    new bootstrap.Modal($("#asignarCursoModal")).show();
  } catch (e) {
    console.error(e);
    UIX.toast("No se pudo cargar la información para asignar el curso", "error");
  }
}

async function cargarCursosDisponibles(idGrupo) {
  try {
    // Obtener todos los cursos activos
    const res = await ApiClient.request('/api/cursos/');
    const cursos = res?.data?.cursos || res?.cursos || [];
    
    const select = $("#cursoSelect");
    select.innerHTML = '<option value="">Seleccione un curso...</option>';
    
    if (!cursos.length) {
      select.innerHTML += '<option value="" disabled>No hay cursos disponibles</option>';
      return;
    }

    // Obtener cursos ya asignados al grupo
    const cursosAsignadosRes = await ApiClient.request(`/api/grupos/${idGrupo}/cursos`);
    const cursosAsignados = cursosAsignadosRes?.cursos || [];
    
    // Filtrar cursos que no estén ya asignados activamente
    const cursosDisponibles = cursos.filter(curso => {
      const yaAsignado = cursosAsignados.some(asig => 
        asig.id_tipo_curso === curso.IdTipoCurso
      );
      return !yaAsignado;
    });

    // Agregar opciones al select
    cursosDisponibles.forEach(curso => {
      const option = document.createElement('option');
      option.value = curso.IdTipoCurso;
      option.textContent = curso.Descripcion || curso.nombre || `Curso #${curso.IdTipoCurso}`;
      select.appendChild(option);
    });

    if (cursosDisponibles.length === 0) {
      select.innerHTML = '<option value="" disabled>No hay cursos disponibles para asignar</option>';
    }

  } catch (e) {
    console.error(e);
    UIX.toast("Error al cargar los cursos", "error");
  }
}

async function guardarAsignacionCurso(e) {
  e.preventDefault();
  const form = $("#asignarCursoForm");
  form.classList.add("was-validated");
  
  if (!form.checkValidity()) return;

  const idGrupo = $("#grupoIdAsignar").value;
  const idCurso = $("#cursoSelect").value;

  if (!idGrupo || !idCurso) {
    UIX.error("Datos incompletos");
    return;
  }

  try {
    const payload = { id_tipo_curso: parseInt(idCurso) };
    const r = await ApiClient.request(`/api/grupos/${idGrupo}/cursos`, {
      method: "POST",
      body: JSON.stringify(payload)
    });

    if (r?.success === false) throw new Error(r?.message || "No se pudo asignar el curso");

    bootstrap.Modal.getInstance($("#asignarCursoModal"))?.hide();
    UIX.toast("Curso asignado al grupo exitosamente");
    
    // Si estamos viendo el detalle del grupo, actualizarlo
    if (state.currentGrupoId === parseInt(idGrupo)) {
      await verMiembros(state.currentGrupoId);
    }
    
  } catch (err) {
    console.error(err);
    UIX.error(err.message || "Error al asignar el curso al grupo");
  }
}

/* ==== Funciones para avanzar y desasignar cursos ==== */
async function avanzarCurso(idGrupo, idAsignacion) {
  try {
    const confirmacion = await UIX.confirm({
      title: "Avanzar curso",
      text: "¿Estás seguro de avanzar al siguiente paso del curso?",
      icon: "question"
    });
    
    if (!confirmacion) return;

    const r = await ApiClient.request(`/api/grupos/${idGrupo}/cursos/${idAsignacion}/avanzar`, {
      method: "POST"
    });

    if (r?.success) {
      UIX.toast(r.message || "Curso avanzado correctamente");
      await verMiembros(idGrupo);
    } else {
      UIX.toast(r?.message || "No se pudo avanzar el curso", "error");
    }
  } catch (error) {
    console.error("Error avanzando curso:", error);
    UIX.toast("Error al avanzar el curso", "error");
  }
}

async function desasignarCurso(idGrupo, idAsignacion) {
  const ok = await UIX.confirm({
    title: "Desasignar curso",
    text: "¿Estás seguro de quitar este curso del grupo? Se perderá todo el progreso.",
    icon: "warning"
  });
  if (!ok) return;

  try {
    // PATCH para desactivar la asignación
    const r = await ApiClient.request(
      `/api/cursos/asignaciones/grupo/${idGrupo}/curso/${idAsignacion}/desactivar`, 
      { method: "PATCH" }
    );
    
    if (r?.success) {
      UIX.toast("Curso desasignado correctamente");
      await verMiembros(idGrupo);
    } else {
      UIX.toast(r?.message || "No se pudo desasignar el curso", "error");
    }
  } catch (error) {
    console.error("Error desasignando curso:", error);
    UIX.toast("Error al desasignar el curso", "error");
  }
}

/* ==== Detalle del Grupo (Miembros y Cursos) ==== */
async function verMiembros(id) {
  try {
    state.currentGrupoId = id;
    
    // Trae miembros y cursos en paralelo
    const [mData, cData] = await Promise.all([
      ApiClient.request(`/api/grupos/${id}/miembros`).catch(() => ({ miembros: [] })),
      ApiClient.request(`/api/grupos/${id}/cursos`).catch(() => ({ cursos: [] })),
    ]);

    // ===== INFO BÁSICA =====
    const grupoInfo = await ApiClient.request(`/api/grupos/${id}`);
    const grupo = grupoInfo.grupo || grupoInfo;
    $("#detalleInfo").innerHTML = `
      <div class="row">
        <div class="col-md-6">
          <div class="mb-2"><strong>Grupo:</strong> ${esc(grupo.Nombre || grupo.nombre || "")}</div>
          <div class="mb-2"><strong>Líder:</strong> ${esc(grupo.lider?.nombre || grupo.NombreLider || "")} ${esc(grupo.lider?.apellido || grupo.ApellidoLider || "")}</div>
        </div>
        <div class="col-md-6">
          <div class="mb-2"><strong>Documento Líder:</strong> ${esc(grupo.lider?.documento || grupo.DocumentoLider || "-")}</div>
          <div class="mb-2"><strong>Teléfono:</strong> ${esc(grupo.lider?.telefono || grupo.TelefonoLider || "-")}</div>
        </div>
      </div>
    `;

    // ===== MIEMBROS =====
    const miembros = mData.miembros || [];
    $("#detalleMiembrosBody").innerHTML = miembros.length
      ? miembros.map(m => `
          <tr>
            <td>${m.id_habitante ?? ""}</td>
            <td>${esc(`${m.Nombre || ""} ${m.Apellido || ""}`.trim())}</td>
            <td>${esc(m.NumeroDocumento || "-")}</td>
            <td>${esc(m.Telefono || "-")}</td>
            <td>${esc(m.CorreoElectronico || "-")}</td>
            <td>
              <button class="btn btn-sm btn-outline-danger" data-remove="${m.id_habitante}">
                <i class="fas fa-times"></i>
              </button>
            </td>
          </tr>
        `).join("")
      : `<tr><td colspan="6" class="text-center text-muted">Sin miembros.</td></tr>`;

    // ===== CURSOS =====
    const cursos = cData.cursos || [];
    $("#detalleCursosBody").innerHTML = cursos.length
      ? cursos.map(c => {
          const nombre = c.Curso || c.nombre || c.Nombre || "-";
          const inicio = c.fecha_asignacion || c.inicio || c.FechaInicio || null;
          const total  = Number(c.total_pasos ?? c.PasosTotales ?? 0);
          const done   = Number(c.pasos_completados ?? c.PasosCompletados ?? 0);
          const porcentaje = total > 0 ? Math.round((done / total) * 100) : 0;
          const estado = (total > 0)
            ? (done >= total ? '<span class="badge bg-success">Completado</span>' : '<span class="badge bg-warning">En progreso</span>')
            : '<span class="badge bg-secondary">Sin pasos</span>';

          return `
            <tr>
              <td>
                <div><strong>${esc(nombre)}</strong></div>
                <small class="text-muted">ID: ${c.id_grupo_ayudantes_curso}</small>
              </td>
              <td>${esc(formatDate?.(inicio) ?? (inicio ?? "-"))}</td>
              <td>
                <div class="d-flex align-items-center gap-2">
                  <div class="progress flex-grow-1" style="height: 20px;">
                    <div class="progress-bar ${porcentaje === 100 ? 'bg-success' : 'bg-primary'}" 
                         style="width: ${porcentaje}%">
                      ${done}/${total}
                    </div>
                  </div>
                  <small class="text-muted">${porcentaje}%</small>
                </div>
              </td>
              <td>${estado}</td>
              <td>
                <div class="d-flex gap-1">
                  ${done < total ? `
                    <button class="btn btn-sm btn-outline-success" data-avanzar="${c.id_grupo_ayudantes_curso}" title="Avanzar paso">
                      <i class="fas fa-arrow-up"></i>
                    </button>
                  ` : ''}
                  <button class="btn btn-sm btn-outline-danger" data-desasignar="${c.id_grupo_ayudantes_curso}" title="Desasignar curso">
                    <i class="fas fa-trash"></i>
                  </button>
                </div>
              </td>
            </tr>
          `;
        }).join("")
      : `<tr><td colspan="5" class="text-center text-muted">No hay cursos asignados</td></tr>`;

    // ===== MODAL =====
    new bootstrap.Modal($("#grupoDetalleModal")).show();

    // Botón para agregar miembro
    $("#btnAgregarMiembro")?.addEventListener("click", () => agregarMiembro(id));

    // Botón para asignar curso
    $("#btnAsignarCurso")?.addEventListener("click", () => {
      bootstrap.Modal.getInstance($("#grupoDetalleModal")).hide();
      setTimeout(() => asignarCurso(id), 300);
    });

    // Bind eventos después de un pequeño delay para asegurar que el DOM esté listo
    setTimeout(() => {
      // Botones para eliminar miembros
      $$("#detalleMiembrosBody button[data-remove]").forEach(btn => {
        btn.addEventListener("click", (e) => {
          const idHabitante = btn.dataset.remove;
          eliminarMiembro(id, idHabitante);
        });
      });

      // Botones para avanzar cursos
      $$("button[data-avanzar]").forEach(btn => {
        btn.addEventListener("click", () => avanzarCurso(id, btn.dataset.avanzar));
      });

      // Botones para desasignar cursos
      $$("button[data-desasignar]").forEach(btn => {
        btn.addEventListener("click", () => desasignarCurso(id, btn.dataset.desasignar));
      });
    }, 100);

  } catch (e) {
    console.error(e);
    UIX.toast("No se pudieron cargar los miembros/cursos", "error");
  }
}

// === Gestión de miembros ===
async function agregarMiembro(grupoId) {
  // Crear modal para agregar miembros con el estilo definido
  const modalHtml = `
    <div class="modal fade" id="agregarMiembroModal" tabindex="-1" data-bs-backdrop="static">
      <div class="modal-dialog modal-lg">
        <div class="modal-content">
          <div class="modal-header">
            <h5 class="modal-title"><i class="fas fa-user-plus me-2"></i>Agregar Miembros al Grupo</h5>
            <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
          </div>
          <div class="modal-body">
            <div class="form-group mb-4">
              <label class="form-label">Buscar habitantes (nombre, apellido o documento)</label>
              <div class="input-group">
                <input type="text" id="buscarMiembroInput" class="form-control" placeholder="Ej: María / 1012345678">
                <button class="btn btn-outline-secondary" type="button" id="btnBuscarMiembro">
                  <i class="fas fa-search"></i>
                </button>
              </div>
            </div>
            
            <!-- Resultados de búsqueda -->
            <div class="mb-4">
              <h6 class="text-sm font-semibold text-muted mb-2">Resultados de búsqueda</h6>
              <div id="miembroResultados" style="max-height: 300px; overflow-y: auto;">
                <div class="text-muted text-center py-4">
                  <i class="fas fa-search fa-lg mb-2"></i>
                  <p>Escriba para buscar habitantes...</p>
                </div>
              </div>
            </div>
            
            <!-- Miembros seleccionados -->
            <div class="selected-members-section border-top pt-3">
              <h6 class="font-semibold text-muted mb-3">Miembros seleccionados</h6>
              <div id="miembrosSeleccionados" class="d-flex flex-wrap gap-2">
                <div class="text-muted">No hay miembros seleccionados</div>
              </div>
            </div>
          </div>
          <div class="modal-footer">
            <button type="button" class="btn btn-outline-secondary" data-bs-dismiss="modal">
              <i class="fas fa-times me-2"></i>Cancelar
            </button>
            <button type="button" class="btn btn-primary" id="btnConfirmarAgregarMiembros">
              <i class="fas fa-save me-2"></i>Agregar Miembros
            </button>
          </div>
        </div>
      </div>
    </div>
  `;

  // Agregar modal al DOM si no existe
  if (!$("#agregarMiembroModal")) {
    document.body.insertAdjacentHTML('beforeend', modalHtml);
  }

  const modalElement = $("#agregarMiembroModal");
  const modal = new bootstrap.Modal(modalElement);
  
  // Estado local para miembros seleccionados
  const miembrosSeleccionados = new Map();
  
  // Función para buscar habitantes
  async function buscarHabitantes() {
    const query = $("#buscarMiembroInput").value.trim();
    const cont = $("#miembroResultados");
    
    if (!query) {
      cont.innerHTML = `
        <div class="text-muted text-center py-4">
          <i class="fas fa-search fa-lg mb-2"></i>
          <p>Escriba para buscar habitantes...</p>
        </div>
      `;
      return;
    }
    
    try {
      cont.innerHTML = `
        <div class="text-center py-4">
          <div class="spinner-border spinner-border-sm text-primary" role="status"></div>
          <span class="ms-2 text-muted">Buscando habitantes...</span>
        </div>
      `;
      
      const data = await ApiClient.request(`/api/habitantes/buscar_grupo?q=${encodeURIComponent(query)}`);
      const resultados = data.habitantes || data.resultados || [];
      
      if (!resultados.length) {
        cont.innerHTML = `
          <div class="text-muted text-center py-4">
            <i class="fas fa-search fa-lg mb-2"></i>
            <p>No se encontraron habitantes</p>
            <small class="text-xs">Intente con otros términos de búsqueda</small>
          </div>
        `;
        return;
      }
      
      cont.innerHTML = `
        <div class="table-responsive">
          <table class="table table-sm table-hover mb-0">
            <thead class="table-light">
              <tr>
                <th width="50" class="text-center">Seleccionar</th>
                <th>ID</th>
                <th>Nombre</th>
                <th>Documento</th>
                <th>Teléfono</th>
                <th>Sector</th>
              </tr>
            </thead>
            <tbody>
              ${resultados.map(h => {
                const yaSeleccionado = miembrosSeleccionados.has(h.IdHabitante);
                const nombreCompleto = `${h.Nombre || ""} ${h.Apellido || ""}`.trim();
                return `
                  <tr class="${yaSeleccionado ? 'table-success' : ''}">
                    <td class="text-center">
                      <input 
                        type="checkbox" 
                        class="form-check-input miembro-check" 
                        data-id="${h.IdHabitante}"
                        ${yaSeleccionado ? 'checked' : ''}
                        ${yaSeleccionado ? 'disabled' : ''}
                      >
                    </td>
                    <td class="text-xs">${h.IdHabitante}</td>
                    <td>
                      <div class="fw-medium">${esc(nombreCompleto)}</div>
                      ${h.CorreoElectronico ? `<small class="text-muted">${esc(h.CorreoElectronico)}</small>` : ''}
                    </td>
                    <td class="text-xs">${esc(h.NumeroDocumento || "-")}</td>
                    <td class="text-xs">${esc(h.Telefono || "-")}</td>
                    <td class="text-xs">${esc(h.Sector || "-")}</td>
                  </tr>
                `;
              }).join("")}
            </tbody>
          </table>
        </div>
        <div class="text-xs text-muted mt-2 px-1">
          Mostrando ${resultados.length} resultado(s)
        </div>
      `;
      
      // Agregar eventos a los checkboxes
      $$("#miembroResultados .miembro-check").forEach(checkbox => {
        checkbox.addEventListener("change", (e) => {
          const id = Number(e.target.dataset.id);
          const habitante = resultados.find(h => h.IdHabitante === id);
          
          if (e.target.checked) {
            miembrosSeleccionados.set(id, habitante);
          } else {
            miembrosSeleccionados.delete(id);
          }
          
          actualizarMiembrosSeleccionados();
          // Volver a renderizar resultados para actualizar estados
          buscarHabitantes();
        });
      });
      
    } catch (error) {
      console.error("Error buscando habitantes:", error);
      cont.innerHTML = `
        <div class="alert alert-danger text-center py-3">
          <i class="fas fa-exclamation-triangle me-2"></i>
          Error al buscar habitantes
        </div>
      `;
    }
  }
  
  // Función para actualizar la vista de miembros seleccionados
  function actualizarMiembrosSeleccionados() {
    const cont = $("#miembrosSeleccionados");
    
    if (miembrosSeleccionados.size === 0) {
      cont.innerHTML = '<div class="text-muted text-center w-100 py-2">No hay miembros seleccionados</div>';
      return;
    }
    
    cont.innerHTML = Array.from(miembrosSeleccionados.values()).map(h => {
      const nombreCompleto = `${h.Nombre || ""} ${h.Apellido || ""}`.trim();
      return `
        <div class="StatusBadge success d-flex align-items-center gap-2 p-2">
          <i class="fas fa-user-check text-xs"></i>
          <span class="fw-medium">${esc(nombreCompleto)}</span>
          <button type="button" class="btn-close btn-close-white btn-sm" 
                  data-id="${h.IdHabitante}" 
                  style="font-size: 0.7rem;">
          </button>
        </div>
      `;
    }).join("");
    
    // Agregar eventos para quitar miembros
    $$("#miembrosSeleccionados .btn-close").forEach(btn => {
      btn.addEventListener("click", (e) => {
        const badge = e.target.closest('.StatusBadge');
        const id = Number(badge.querySelector('.btn-close').dataset.id);
        miembrosSeleccionados.delete(id);
        actualizarMiembrosSeleccionados();
        buscarHabitantes(); // Actualizar la lista de búsqueda
      });
    });
  }
  
  // Función para agregar miembros al grupo
  async function confirmarAgregarMiembros() {
    if (miembrosSeleccionados.size === 0) {
      UIX.toast("Selecciona al menos un miembro", "warning");
      return;
    }
    
    const confirmacion = await UIX.confirm({
      title: "Agregar miembros",
      text: `¿Estás seguro de agregar ${miembrosSeleccionados.size} miembro(s) al grupo?`,
      icon: "question"
    });
    
    if (!confirmacion) return;
    
    try {
      const miembrosArray = Array.from(miembrosSeleccionados.values());
      let agregados = 0;
      let errores = 0;
      const erroresDetalle = [];
      
      // Agregar miembros uno por uno
      for (const miembro of miembrosArray) {
        try {
          const res = await ApiClient.request(`/api/grupos/${grupoId}/miembros`, {
            method: "POST",
            body: JSON.stringify({ id_habitante: miembro.IdHabitante })
          });
          
          if (res.success) {
            agregados++;
          } else {
            errores++;
            erroresDetalle.push(`${miembro.Nombre} ${miembro.Apellido}: ${res.message || 'Error desconocido'}`);
          }
        } catch (error) {
          errores++;
          erroresDetalle.push(`${miembro.Nombre} ${miembro.Apellido}: Error de conexión`);
          console.error(`Error agregando miembro ${miembro.IdHabitante}:`, error);
        }
      }
      
      // Mostrar resultado
      if (errores === 0) {
        UIX.toast(`✅ ${agregados} miembro(s) agregado(s) correctamente`);
      } else if (agregados > 0) {
        UIX.toast(`⚠️ ${agregados} agregado(s), ${errores} error(es)`, "warning");
        if (erroresDetalle.length > 0) {
          console.warn("Errores detallados:", erroresDetalle);
        }
      } else {
        UIX.toast("❌ No se pudieron agregar los miembros", "error");
      }
      
      // Cerrar modal y actualizar vista
      modal.hide();
      setTimeout(async () => {
        await verMiembros(grupoId);
      }, 500);
      
    } catch (error) {
      console.error("Error agregando miembros:", error);
      UIX.toast("❌ Error al agregar miembros", "error");
    }
  }
  
  // Configurar eventos del modal
  function setupModalEvents() {
    $("#btnBuscarMiembro")?.addEventListener("click", buscarHabitantes);
    $("#buscarMiembroInput")?.addEventListener("input", buscarHabitantes);
    $("#btnConfirmarAgregarMiembros")?.addEventListener("click", confirmarAgregarMiembros);
    
    // Buscar al abrir el modal
    modalElement.addEventListener('shown.bs.modal', () => {
      $("#buscarMiembroInput").focus();
      // Limpiar búsqueda anterior
      $("#buscarMiembroInput").value = "";
      $("#miembroResultados").innerHTML = `
        <div class="text-muted text-center py-4">
          <i class="fas fa-search fa-lg mb-2"></i>
          <p>Escriba para buscar habitantes...</p>
        </div>
      `;
    });
    
    // Limpiar al cerrar
    modalElement.addEventListener('hidden.bs.modal', () => {
      miembrosSeleccionados.clear();
      $("#buscarMiembroInput").value = "";
      $("#miembroResultados").innerHTML = `
        <div class="text-muted text-center py-4">
          <i class="fas fa-search fa-lg mb-2"></i>
          <p>Escriba para buscar habitantes...</p>
        </div>
      `;
      // Remover el modal del DOM para evitar acumulación
      setTimeout(() => {
        if ($("#agregarMiembroModal")) {
          $("#agregarMiembroModal").remove();
        }
      }, 300);
    });

    // Permitir búsqueda con Enter
    $("#buscarMiembroInput")?.addEventListener("keypress", (e) => {
      if (e.key === "Enter") {
        e.preventDefault();
        buscarHabitantes();
      }
    });
  }
  
  // Inicializar
  setupModalEvents();
  modal.show();
  actualizarMiembrosSeleccionados();
}

async function eliminarMiembro(grupoId, idHabitante) {
  const ok = await UIX.confirm({
    title: "Eliminar miembro",
    text: "¿Estás seguro de quitar este habitante del grupo?",
    icon: "warning"
  });
  if (!ok) return;

  try {
    const res = await ApiClient.request(
      `/api/grupos/${grupoId}/miembros/${idHabitante}/desactivar`,
      { method: "PATCH" }
    );

    if (res.success) {
      UIX.toast("✅ Miembro eliminado correctamente");
      await verMiembros(grupoId);
    } else {
      UIX.toast(res.message || "❌ No se pudo eliminar el miembro", "error");
    }
  } catch (error) {
    console.error(error);
    UIX.toast("❌ Error al eliminar miembro", "error");
  }
}

/* ==== Búsqueda/validación de líder ==== */
function setLiderPreview(h) {
  const box = $("#liderPreview");
  if (!h || !h.IdHabitante) { box.classList.add("d-none"); box.innerHTML = ""; return; }
  box.classList.remove("d-none");
  box.innerHTML = `
    <div class="d-flex align-items-center gap-3">
      <i class="fas fa-user-circle fa-2x text-secondary"></i>
      <div>
        <div><strong>${esc(h.Nombre || "-")} ${esc(h.Apellido || "")}</strong></div>
        <div class="small text-muted">${esc(h.NumeroDocumento || "-")} — ${esc(h.Telefono || "-")}</div>
      </div>
    </div>`;
}

async function buscarLiderInline() {
  const q = $("#grupoBuscarLider").value.trim();
  const cont = $("#liderResultadosInline");
  if (!q) {
    cont.innerHTML = `<div class="text-muted small">Escriba para buscar...</div>`;
    return;
  }
  try {
    const data = await ApiClient.request(`/api/grupos/buscar_lider?q=${encodeURIComponent(q)}`);
    const res = data.resultados || data.habitantes || [];
    if (!res.length) {
      cont.innerHTML = `<div class="text-muted small">Sin resultados.</div>`;
      return;
    }
    cont.innerHTML = `
      <table class="table table-sm table-hover mb-0">
        <thead><tr><th>ID</th><th>Nombre</th><th>Documento</th><th>Teléfono</th><th></th></tr></thead>
        <tbody>
          ${res.map(h => `
            <tr>
              <td>${h.IdHabitante}</td>
              <td>${esc(h.Nombre || "")} ${esc(h.Apellido || "")}</td>
              <td>${esc(h.NumeroDocumento || "-")}</td>
              <td>${esc(h.Telefono || "-")}</td>
              <td><button class="btn btn-sm btn-primary" data-pick="${h.IdHabitante}"><i class="fas fa-check"></i></button></td>
            </tr>`).join("")}
        </tbody>
      </table>
    `;
    $$("#liderResultadosInline [data-pick]").forEach(b => {
      b.addEventListener("click", (e) => {
        const id = Number(e.currentTarget.dataset.pick);
        const elegido = res.find(h => h.IdHabitante === id);
        $("#grupoLiderId").value = id;
        setLiderPreview(elegido);
        cont.innerHTML = "";
      });
    });
  } catch {
    cont.innerHTML = `<div class="text-danger small">Error al buscar líder.</div>`;
  }
}

/* ==== Exportar / imprimir ==== */
function exportCSV() {
  const headers = ["ID","Nombre del Grupo","Líder","Documento del Líder","Teléfono","Miembros","Estado"];
  const rows = state.filtered.map(g => [
    g.IdGrupoAyudantes,
    csv(g.Nombre || g.Grupo),
    csv(`${g.NombreLider || ""} ${g.ApellidoLider || ""}`.trim()),
    csv(g.DocumentoLider),
    csv(g.TelefonoLider),
    g.CantidadMiembros ?? "",
    String(g.Activo) === "1" ? "Activo" : "Inactivo"
  ]);
  const csvStr = [headers.join(","), ...rows.map(r => r.join(","))].join("\n");
  const blob = new Blob([csvStr], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url; a.download = "grupos-ayudantes.csv"; a.click();
  URL.revokeObjectURL(url);
}

function imprimir() {
  const html = $("#dataTable").outerHTML;
  const w = window.open("", "_blank");
  w.document.write(`<html><head><title>Grupos de Ayudantes</title><link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/bootstrap@5.2.2/dist/css/bootstrap.min.css"></head><body class="p-3">${html}</body></html>`);
  w.document.close(); w.focus(); w.print(); w.close();
}

/* ==== Eventos e init ==== */
function bindFilters() {
  $("#btnApplyFilters")?.addEventListener("click", () => {
    state.filters.nombre = $("#fNombre").value.trim();
    state.filters.lider  = $("#fLider").value.trim();
    state.filters.estado = document.querySelector('input[name="fEstado"]:checked')?.value ?? "";
    bootstrap.Modal.getInstance($("#filtersModal")).hide();
    applyFilters();
  });
  $("#btnClearFilters")?.addEventListener("click", () => {
    $("#fNombre").value = ""; $("#fLider").value = "";
    state.filters = { nombre: "", lider: "", estado: "" };
    applyFilters();
    bootstrap.Modal.getInstance($("#filtersModal")).hide();
  });
  $("#globalSearch")?.addEventListener("input", applyFilters);
  $("#pageSizeSelect")?.addEventListener("change", (e) => { state.pageSize = Number(e.target.value); state.currentPage = 1; renderTable(); renderPagination(); });
}

function bindEvents() {
  $("#btnNuevoGrupo")?.addEventListener("click", crearGrupo);
  $("#grupoForm")?.addEventListener("submit", guardarGrupoSubmit);
  $("#asignarCursoForm")?.addEventListener("submit", guardarAsignacionCurso);
  $("#btnExportar")?.addEventListener("click", exportCSV);
  $("#btnImprimir")?.addEventListener("click", imprimir);
  
  // Búsqueda de líder
  $("#btnBuscarLider")?.addEventListener("click", buscarLiderInline);
  $("#grupoBuscarLider")?.addEventListener("input", buscarLiderInline);
}

export async function init() {
  try {
    await cargarGrupos();
    bindFilters();
    bindEvents();
  } catch (e) {
    console.error(e);
    UIX.toast("Error inicializando módulo", "error");
  }
}

/* ==== Helpers ==== */
function esc(s = "") {
  return String(s).replaceAll("&","&amp;").replaceAll("<","&lt;").replaceAll(">","&gt;").replaceAll('"',"&quot;").replaceAll("'","&#039;");
}

function csv(v) {
  const s = (v ?? "").toString().replaceAll('"','""');
  return `"${s}"`;
}

function formatDate(dateStr) {
  if (!dateStr) return "-";
  try {
    return new Date(dateStr).toLocaleDateString('es-ES');
  } catch {
    return dateStr;
  }
}

export const GruposAyudantesManager = { init };