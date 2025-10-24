// gruposAyudantes.js
// Página: Grupos de Ayudantes. Manejador principal llamado por app.js
import { ApiClient } from '../modules/api.js';

/* ==== HTTP & UI helpers (reutiliza si existen; fallback si no) ==== */
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
  }
};

/* ==== Estado ==== */
const state = {
  raw: [],
  filtered: [],
  pageSize: 10,
  currentPage: 1,
  filters: { nombre: "", lider: "", estado: "" }, // Eliminado sector
  habitantesCache: []
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
          <button class="btn btn-sm btn-outline-danger" data-action="delete" title="Desactivar"><i class="fas fa-ban"></i></button>
          <button class="btn btn-sm btn-outline-secondary" data-action="members" title="Miembros"><i class="fas fa-people-group"></i></button>
        </td>
      </tr>
    `;
  }).join("");

  tb.querySelectorAll("button[data-action]").forEach(btn => {
    const id = Number(btn.closest("tr")?.dataset.id);
    const a = btn.dataset.action;
    if (a === "edit") btn.addEventListener("click", () => editarGrupo(id));
    if (a === "view") btn.addEventListener("click", () => verGrupo(id));
    if (a === "delete") btn.addEventListener("click", () => desactivarGrupo(id));
    if (a === "members") btn.addEventListener("click", () => verMiembros(id));
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

/* ==== CRUD ==== */
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
    // 🔹 Obtener datos actuales del grupo desde el backend
    const data = await ApiClient.request(`/api/grupos/${id}`);
    const g = data.grupo || data;

    // 🔹 Rellenar los campos del formulario antes de abrir el modal
    $("#grupoId").value = g.IdGrupoAyudantes ?? g.id ?? "";
    $("#grupoNombre").value = g.Nombre ?? g.nombre ?? "";

    const liderId = g.IdHabitanteLider ?? g.lider?.id ?? null;
    $("#grupoLiderId").value = liderId || "";

    // 🔹 Mostrar vista previa del líder si existe
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

    // 🔹 Mostrar el modal con los valores cargados
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
    
    console.log("Respuesta del servidor:", r); // 🔹 DEBUG
    
    // 🔹 CORRECCIÓN: Verificar explícitamente el éxito
    if (r && r.success === true) {
      UIX.toast("Grupo desactivado");
      await cargarGrupos(); // 🔹 Esto debería actualizar la vista
    } else {
      // 🔹 Mostrar el mensaje real del servidor
      const errorMsg = r?.message || r?.error || "No se pudo desactivar";
      UIX.toast(errorMsg, "error");
    }
  } catch (error) { 
    console.error("Error en desactivarGrupo:", error);
    UIX.toast("Error al desactivar", "error"); 
  }
}

/* ==== Detalle: Ver grupo (info, miembros, cursos) ==== */
async function verGrupo(id) {
  try {
    const [gData, mData, cData] = await Promise.all([
      ApiClient.request(`/api/grupos/${id}`).catch(() => ({})),
      ApiClient.request(`/api/grupos/${id}/miembros`).catch(() => ({ miembros: [] })),
      ApiClient.request(`/api/grupos/${id}/cursos`).catch(() => ({ cursos: null }))
    ]);

    const g = gData.grupo || gData || {};
    const miembros = mData.miembros || [];
    const cursos = cData.cursos;

    // Info general
    const badge = String(g.activo ?? g.Activo ?? 1) === "1"
      ? `<span class="badge bg-success">Activo</span>`
      : `<span class="badge bg-secondary">Inactivo</span>`;
    const infoHtml = `
      <div class="row g-2">
        <div class="col-md-3"><strong>ID:</strong> ${esc(g.id ?? g.IdGrupoAyudantes ?? "-")}</div>
        <div class="col-md-4"><strong>Nombre:</strong> ${esc(g.nombre ?? g.Nombre ?? "-")} ${badge}</div>
        <div class="col-md-12"><strong>Líder:</strong> ${esc(`${g.lider?.nombre ?? ""} ${g.lider?.apellido ?? ""}`.trim() || "-")} (${esc(g.lider?.documento ?? "-")}) — ${esc(g.lider?.telefono ?? "-")}</div>
      </div>`;
    $("#detalleInfo").innerHTML = infoHtml;

    // Miembros (manteniendo sector para miembros individuales)
    $("#detalleMiembrosBody").innerHTML = miembros.length
      ? miembros.map(m => `
          <tr>
            <td>${m.id_habitante ?? m.IdHabitante ?? ""}</td>
            <td>${esc(`${m.Nombre || ""} ${m.Apellido || ""}`.trim())}</td>
            <td>${esc(m.NumeroDocumento || "-")}</td>
            <td>${esc(m.Telefono || "-")}</td>
            <td>${esc(m.CorreoElectronico || "-")}</td>
            <td>${esc(m.Sector || "-")}</td>
          </tr>
        `).join("")
      : `<tr><td colspan="6" class="text-center text-muted">Sin miembros.</td></tr>`;

    // Cursos (resumen)
    if (Array.isArray(cursos)) {
      $("#detalleCursosBody").innerHTML = cursos.length
        ? cursos.map(c => `
            <tr>
              <td>${esc(c.nombre || c.Nombre || "-")}</td>
              <td>${esc(formatDate(c.inicio || c.FechaInicio))}</td>
              <td>${esc(String(c.niveles ?? c.Pasos ?? c.pasos ?? "-"))}</td>
              <td>${esc(c.estado || c.Estado || "-")}</td>
            </tr>
          `).join("")
        : `<tr><td colspan="4" class="text-center text-muted">Sin cursos asociados.</td></tr>`;
    } else {
      $("#detalleCursosBody").innerHTML = `<tr><td colspan="4" class="text-center text-muted">No disponible en backend.</td></tr>`;
    }

    new bootstrap.Modal($("#grupoDetalleModal")).show();
  } catch {
    UIX.toast("No se pudo cargar el detalle", "error");
  }
}

async function verMiembros(id) {
  try {
    const data = await ApiClient.request(`/api/grupos/${id}/miembros`);
    $("#detalleInfo").innerHTML = `<div class="mb-2"><strong>Grupo:</strong> #${id}</div>`;
    $("#detalleMiembrosBody").innerHTML = (data.miembros || []).map(m => `
  <tr>
    <td>${m.id_habitante ?? ""}</td>
    <td>${esc(`${m.Nombre || ""} ${m.Apellido || ""}`.trim())}</td>
    <td>${esc(m.NumeroDocumento || "-")}</td>
    <td>${esc(m.Telefono || "-")}</td>
    <td>${esc(m.CorreoElectronico || "-")}</td>
    <td>${esc(m.Sector || "-")}</td>
    <td><button class="btn btn-sm btn-outline-danger" data-remove="${m.id_habitante}"><i class="fas fa-times"></i></button></td>
  </tr>
`).join("") || `<tr><td colspan="7" class="text-center text-muted">Sin miembros.</td></tr>`;

    $("#detalleCursosBody").innerHTML = `<tr><td colspan="4" class="text-center text-muted">No disponible en esta vista.</td></tr>`;
    new bootstrap.Modal($("#grupoDetalleModal")).show();
    
    // Botón para agregar miembro
    $("#btnAgregarMiembro")?.addEventListener("click", () => agregarMiembro(id));

    // Botones para eliminar miembros
    $$("button[data-remove]").forEach(btn => {
      btn.addEventListener("click", () => eliminarMiembro(id, btn.dataset.remove));
    });

  } catch {
    UIX.toast("No se pudieron cargar los miembros", "error");
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
    const res = await ApiClient.request(`/api/grupos/${grupoId}/miembros/${idHabitante}`, {
      method: "DELETE"
    });

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

$("#btnBuscarLider")?.addEventListener("click", buscarLiderInline);
$("#grupoBuscarLider")?.addEventListener("input", buscarLiderInline);

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
  $("#btnExportar")?.addEventListener("click", exportCSV);
  $("#btnImprimir")?.addEventListener("click", imprimir);
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