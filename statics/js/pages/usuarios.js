// =====================
// Módulo: USUARIOS
// Backend: /api/usuarios/
// Endpoints confirmados en repo: 
//   GET    /api/usuarios/                   (listar)
//   GET    /api/usuarios/<id>/              (detalle)
//   GET    /api/usuarios/roles              (listar roles)
//   GET    /api/usuarios/verificar_habitante?id_tipo_documento=CC&numero_documento=123
//   POST   /api/usuarios/                   (crear: {id_tipo_documento, numero_documento, id_tipo_usuario, password})
//   PUT    /api/usuarios/<id>/rol           (cambiar rol: {id_tipo_usuario})
//   PATCH  /api/usuarios/<id>/password      (cambiar contraseña: {password})
//   PATCH  /api/usuarios/<id>/desactivar    (inactivar)
//   PATCH  /api/usuarios/<id>/activar       (reactivar)
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
  }
};

const state = {
  raw: [],
  filtered: [],
  roles: [],
  pageSize: 10,
  currentPage: 1,
  filters: { nombre: "", documento: "", rol: "", estado: "" },
  loading: false,
};

// =====================
// Carga inicial
// =====================
async function cargarRoles() {
  try {
    const res = await ApiClient.request('/api/usuarios/roles');
    state.roles = res?.data?.roles || res?.roles || [];
    // Llenar selects de rol
    fillRolesSelect($('#fRol'), true);
    fillRolesSelect($('#IdRol'), false);
    fillRolesSelect($('#RolNuevo'), false);
  } catch (e) {
    console.error(e);
    UIX.toast("No se pudieron cargar roles", "error");
  }
}
function fillRolesSelect(select, includeTodos = false) {
  if (!select) return;
  const opts = [];
  if (includeTodos) opts.push(`<option value="">Todos</option>`);
  for (const r of state.roles) {
    const id = r.IdTipoUsuario ?? r.id ?? r.Id ?? "";
    const nom = r.Perfil ?? r.nombre ?? r.descripcion ?? "Rol";
    opts.push(`<option value="${id}">${esc(nom)}</option>`);
  }
  select.innerHTML = opts.join("");
}

async function cargarUsuarios() {
  try {
    state.loading = true;
    renderLoading();
    const res = await ApiClient.request('/api/usuarios/');
    const usuarios = res?.data?.usuarios || res?.usuarios || res || [];
    state.raw = Array.isArray(usuarios) ? usuarios : [];
    aplicarFiltros();
  } catch (e) {
    console.error(e);
    UIX.toast("Error al cargar usuarios", "error");
  } finally {
    state.loading = false;
    renderTable();
    renderPagination();
  }
}

// =====================
// Render
// =====================
function renderLoading() {
  const tb = $("#tableBody");
  if (!tb) return;
  if (state.loading) {
    tb.innerHTML = `<tr><td colspan="7" class="text-center py-5">
      <div class="spinner-border text-primary" role="status"></div>
      <p class="mt-2 text-muted">Cargando…</p>
    </td></tr>`;
  }
}

function renderTable() {
  const tb = $("#tableBody");
  if (!tb) return;
  const rows = paginate(state.filtered, state.pageSize, state.currentPage);
  if (!rows.length) {
    tb.innerHTML = `<tr><td colspan="7" class="text-center text-muted py-4">Sin usuarios.</td></tr>`;
    $("#paginationInfo").textContent = "0 resultados";
    $("#paginationButtons").innerHTML = "";
    return;
  }

  tb.innerHTML = rows.map(u => {
    const id = u.IdUsuario ?? u.id ?? "";
    const nombre = `${u.Nombre ?? ""} ${u.Apellido ?? ""}`.trim() || "-";
    const doc = `${u.TipoDocumento ?? ""} ${u.NumeroDocumento ?? ""}`.trim() || "-";
    const rol = u.Rol ?? u.Perfil ?? "-";
    const activo = Number(u.Activo ?? 0) === 1;

    return `<tr data-id="${id}">
      <td class="text-center"><input type="checkbox" class="row-check"></td>
      <td><span class="badge bg-secondary">#${id}</span></td>
      <td>${esc(nombre)}</td>
      <td>${esc(doc)}</td>
      <td>${esc(rol)}</td>
      <td>${activo ? '<span class="badge bg-success">Activo</span>' : '<span class="badge bg-secondary">Inactivo</span>'}</td>
      <td class="d-flex flex-wrap gap-1">
        <button class="btn btn-sm btn-outline-info" data-action="view"><i class="fas fa-eye"></i></button>
        <button class="btn btn-sm btn-outline-primary" data-action="role"><i class="fas fa-user-shield"></i></button>
        <button class="btn btn-sm btn-outline-warning" data-action="pwd"><i class="fas fa-key"></i></button>
        ${activo
          ? `<button class="btn btn-sm btn-outline-danger" data-action="deactivate"><i class="fas fa-ban"></i></button>`
          : `<button class="btn btn-sm btn-outline-success" data-action="activate"><i class="fas fa-rotate-left"></i></button>`
        }
      </td>
    </tr>`;
  }).join("");

  // bind
  tb.querySelectorAll("button[data-action]").forEach(btn => {
    const id = Number(btn.closest("tr").dataset.id);
    const a = btn.dataset.action;
    if (a === "view") btn.addEventListener("click", () => verDetalle(id));
    if (a === "role") btn.addEventListener("click", () => abrirModalRol(id));
    if (a === "pwd")  btn.addEventListener("click", () => abrirModalPassword(id));
    if (a === "deactivate") btn.addEventListener("click", () => desactivarUsuario(id));
    if (a === "activate")   btn.addEventListener("click", () => activarUsuario(id));
  });

  const total = state.filtered.length;
  const from = (state.currentPage - 1) * state.pageSize + 1;
  const to = Math.min(state.currentPage * state.pageSize, total);
  $("#paginationInfo").textContent = `${from}–${to} de ${total}`;
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
// Filtros / búsqueda
// =====================
function aplicarFiltros() {
  const nombre = state.filters.nombre.trim().toLowerCase();
  const doc = state.filters.documento.trim().toLowerCase();
  const rol = state.filters.rol;
  const estado = state.filters.estado;
  const q = ($("#globalSearch")?.value || "").trim().toLowerCase();

  state.filtered = state.raw.filter(u => {
    const uNombre = `${u.Nombre ?? ""} ${u.Apellido ?? ""}`.toLowerCase();
    const uDoc = `${u.TipoDocumento ?? ""} ${u.NumeroDocumento ?? ""}`.toLowerCase();
    const uRolId = String(u.IdTipoUsuario ?? "");
    const uRolNom = String(u.Rol ?? u.Perfil ?? "").toLowerCase();
    const uActivo = String(u.Activo ?? "") === "1";

    const okNombre = !nombre || uNombre.includes(nombre);
    const okDoc = !doc || uDoc.includes(doc);
    const okRol = !rol || uRolId === String(rol);
    const okEstado = estado === "" || (estado === "1" ? uActivo : !uActivo);
    const okGlobal = !q || (uNombre.includes(q) || uDoc.includes(q) || uRolNom.includes(q) || String(u.IdUsuario ?? "").includes(q));

    return okNombre && okDoc && okRol && okEstado && okGlobal;
  });

  state.currentPage = 1;
  renderTable();
  renderPagination();
}

// =====================
// CRUD especializado
// =====================
function abrirModalNuevo() {
  $("#usuarioForm").reset();
  $("#IdHabitanteSeleccionado").value = "";
  $("#HabitanteInfo").hidden = true;
  $("#usuarioModal .modal-title").innerHTML = `<i class="fas fa-user-plus me-2"></i>Nuevo Usuario`;
  new bootstrap.Modal($("#usuarioModal")).show();
}

async function buscarHabitante() {
  const tipo = $("#TipoDocumento").value.trim();
  const numero = $("#NumeroDocumento").value.trim();
 
  console.log(tipoTexto)
  if (!tipo || !numero) {
    UIX.toast("Indique tipo y número de documento", "warning");
    return;
  }

  try {
    const url = `/api/usuarios/verificar_habitante?tipo_documento=${encodeURIComponent(tipo)}&numero_documento=${encodeURIComponent(numero)}`;
    const res = await ApiClient.request(url);

    if (res?.success) {
      const h = res.habitante || res.data?.habitante || {};
      $("#IdHabitanteSeleccionado").value = h.id ?? "";
      $("#HabitanteInfoText").textContent =
        `Habitante: ${h.nombre ?? ""} ${h.apellido ?? ""} (${h.id_tipo_documento ?? tipo} ${h.numero_documento ?? numero})`;
      $("#HabitanteInfo").hidden = false;
      UIX.toast("Habitante válido para crear usuario");
    } else {
      $("#IdHabitanteSeleccionado").value = "";
      $("#HabitanteInfo").hidden = true;
      UIX.toast(res?.message || "No se pudo verificar", "error");
    }
  } catch (e) {
    console.error(e);
    let msg = e.message || "Error al verificar habitante";

    // Intentar leer JSON del backend
    try {
      const parsed = JSON.parse(msg);
      if (parsed?.message) msg = parsed.message;

      // Caso especial: habitante no existe
      if (msg.includes("No se encontró habitante")) {
  if (window.Swal?.fire) {
    const select = document.getElementById("TipoDocumento");
    const tipoTexto = select.options[select.selectedIndex].text;   // 👈 AQUÍ
    const r = await Swal.fire({
      icon: "warning",
      title: "Habitante no encontrado",
      text: `No existe un habitante con ${tipoTexto} ${numero}. ¿Deseas ir a la Encuesta para crearlo?`,
      showCancelButton: true,
      confirmButtonText: "Ir a Encuesta",
      cancelButtonText: "Seguir aquí"
    });

          if (r.isConfirmed) {
            const qs = new URLSearchParams({ td: tipo, doc: numero });
            window.location.href = `../Oficina/Encuestas.html?${qs.toString()}`;
          }
        } else {
          const go = confirm(`${msg}\n\n¿Ir a la Encuesta para crear el habitante?`);
          if (go) window.location.href = "../Oficina/Encuestas.html";
        }
        return;
      }
    } catch (_) {
      // no era JSON
    }

    $("#IdHabitanteSeleccionado").value = "";
    $("#HabitanteInfo").hidden = true;
    UIX.toast(msg, "error");
  }
}



async function crearUsuario(e) {
  e.preventDefault();
  const form = e.currentTarget;
  if (!form.checkValidity()) {
    form.classList.add("was-validated");
    return;
  }
  const tipo = $("#TipoDocumento").value.trim();
  const numero = $("#NumeroDocumento").value.trim();
  const idRol = $("#IdRol").value;
  const pwd = $("#PasswordInicial").value;

  if (!tipo || !numero) return UIX.toast("Primero verifique el Habitante", "warning");

  try {
    const payload = {
      tipo_documento: tipo,
      numero_documento: numero,
      id_tipo_usuario: Number(idRol),
      password: pwd
    };
    const res = await ApiClient.request('/api/usuarios/', {
      method: "POST",
      body: JSON.stringify(payload)
    });
    if (res?.success === false) throw new Error(res.message || "No se pudo crear el usuario");
    UIX.toast("Usuario creado");
    bootstrap.Modal.getInstance($("#usuarioModal"))?.hide();
    //document.querySelectorAll(".modal-backdrop").forEach(b => b.remove());
    await cargarUsuarios();
    } catch (e) {
    console.error(e);
    let msg = e.message || "Error al crear usuario";

    // Intentar leer JSON devuelto por el backend
    try {
      const parsed = JSON.parse(msg);
      if (parsed?.message) msg = parsed.message;
    } catch (_) {
      // no era JSON
    }

    // Si el problema es que NO existe el habitante → ofrecer crear desde Encuesta
    if (msg.includes("No se encontró habitante")) {
  const select = document.getElementById("TipoDocumento");
  const tipoTexto = select.options[select.selectedIndex].text;   // 🔹 nombre
  const numero = document.getElementById("NumeroDocumento").value.trim();

  if (window.Swal?.fire) {
    const r = await Swal.fire({
      icon: "warning",
      title: "Habitante no encontrado",
      text: `No existe un habitante con ${tipoTexto} ${numero}. ¿Deseas ir a la Encuesta para crearlo?`,
      showCancelButton: true,
      confirmButtonText: "Ir a Encuesta",
      cancelButtonText: "Seguir editando"
    });

    if (r.isConfirmed) {
      const qs = new URLSearchParams({ td: select.value, doc: numero });
      window.location.href = `../Oficina/Encuestas.html?${qs.toString()}`;
    }
  }
  return;
}


    // Otros errores (contraseña, rol, etc.)
    UIX.toast(msg, "error");
  }
}




async function abrirModalRol(idUsuario) {
  $("#rolForm").reset();
  $("#RolUsuarioId").value = idUsuario;
  fillRolesSelect($('#RolNuevo'), false);
  new bootstrap.Modal($("#rolModal")).show();
}

async function guardarRol(e) {
  e.preventDefault();
  const id = $("#RolUsuarioId").value;
  const rolNuevo = $("#RolNuevo").value;
  if (!id || !rolNuevo) return;
  try {
    const res = await ApiClient.request(`/api/usuarios/${id}/rol`, {
      method: "PUT",
      body: JSON.stringify({ id_tipo_usuario: Number(rolNuevo) })
    });
    if (res?.success === false) throw new Error(res.message || "No se pudo actualizar el rol");
    UIX.toast("Rol actualizado");
    bootstrap.Modal.getInstance($("#rolModal"))?.hide();
    //document.querySelectorAll(".modal-backdrop").forEach(b => b.remove());
    await cargarUsuarios();
  } catch (e) {
    console.error(e);
    UIX.toast(e.message || "Error al actualizar rol", "error");
  }
}

function abrirModalPassword(idUsuario) {
  $("#passwordForm").reset();
  $("#PasswordUsuarioId").value = idUsuario;
  new bootstrap.Modal($("#passwordModal")).show();
}

async function guardarPassword(e) {
  e.preventDefault();
  const id = $("#PasswordUsuarioId").value;
  const pwd = $("#PasswordNueva").value;
  if (!id || !pwd) return;
  try {
    const res = await ApiClient.request(`/api/usuarios/${id}/password`, {
      method: "PATCH",
      body: JSON.stringify({ password: pwd })
    });
    if (res?.success === false) throw new Error(res.message || "No se pudo cambiar la contraseña");
    UIX.toast("Contraseña actualizada");
    bootstrap.Modal.getInstance($("#passwordModal"))?.hide();
  } catch (e) {
    console.error(e);
    UIX.toast(e.message || "Error al cambiar la contraseña", "error");
  }
}

async function desactivarUsuario(id) {
  const ok = await UIX.confirm({ title: "¿Inactivar usuario seleccionado?", icon: "warning" });
  if (!ok) return;
  try {
    const res = await ApiClient.request(`/api/usuarios/${id}/desactivar`, { method: "PATCH" });
    if (res?.success === false) throw new Error(res.message || "No se pudo inactivar");
    UIX.toast("Usuario inactivado");
    await cargarUsuarios();
  } catch (e) {
    console.error(e);
    UIX.toast(e.message || "Error al inactivar", "error");
  }
}

async function activarUsuario(id) {
  const ok = await UIX.confirm({ title: "¿Reactivar usuario seleccionado?", icon: "question" });
  if (!ok) return;
  try {
    const res = await ApiClient.request(`/api/usuarios/${id}/activar`, { method: "PATCH" });
    if (res?.success === false) throw new Error(res.message || "No se pudo reactivar");
    UIX.toast("Usuario reactivado");
    await cargarUsuarios();
  } catch (e) {
    console.error(e);
    UIX.toast(e.message || "Error al reactivar", "error");
  }
}

async function verDetalle(id) {
  try {
    // 🔁 sin slash final
    const res = await ApiClient.request(`/api/usuarios/${id}`);
    const u = res?.data || res || {};
    $("#detId").textContent = u.IdUsuario ?? id;
    $("#detNombre").textContent = `${u.Nombre ?? ""} ${u.Apellido ?? ""}`.trim() || "-";
    $("#detDocumento").textContent = `${u.TipoDocumento ?? ""} ${u.NumeroDocumento ?? ""}`.trim() || "-";
    $("#detRol").textContent = u.Rol ?? u.Perfil ?? "-";
    $("#detEstado").innerHTML = (Number(u.Activo ?? 0) === 1) ? "Activo" : "Inactivo";
    $("#detFecha").textContent = u.FechaRegistro ?? "-";
    new bootstrap.Modal($("#detalleModal")).show();
  } catch (e) {
    console.error(e);
    UIX.toast("No se pudo obtener el detalle", "error");
  }
}


// =====================
// Exportar / imprimir
// =====================
function exportCSV() {
  const headers = ["ID", "Nombre", "Documento", "Rol", "Estado"];
  const rows = state.filtered.map(u => [
    u.IdUsuario ?? u.id ?? "",
    csv(`${u.Nombre ?? ""} ${u.Apellido ?? ""}`.trim()),
    csv(`${u.TipoDocumento ?? ""} ${u.NumeroDocumento ?? ""}`.trim()),
    csv(u.Rol ?? u.Perfil ?? ""),
    (Number(u.Activo ?? 0) === 1) ? "Activo" : "Inactivo"
  ]);
  const csvData = [headers, ...rows].map(r => r.join(",")).join("\n");
  const blob = new Blob([csvData], { type: "text/csv" });
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = "usuarios.csv";
  a.click();
}

function imprimir() {
  window.print();
}

// =====================
// Utilidades
// =====================
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
function csv(v) {
  if (v == null) return "";
  const s = String(v);
  return s.includes(",") ? `"${s.replaceAll('"', '""')}"` : s;
}

// =====================
// Eventos e init()
// =====================
function bindEvents() {
  $("#btnNuevoUsuario")?.addEventListener("click", abrirModalNuevo);
  $("#btnExportar")?.addEventListener("click", exportCSV);
  $("#btnImprimir")?.addEventListener("click", imprimir);

  // Crear usuario
  $("#btnBuscarHabitante")?.addEventListener("click", buscarHabitante);
  $("#usuarioForm")?.addEventListener("submit", crearUsuario);

  // Guardar rol
  $("#rolForm")?.addEventListener("submit", guardarRol);

  // Guardar password
  $("#passwordForm")?.addEventListener("submit", guardarPassword);

  // Filtros
  $("#btnApplyFilters")?.addEventListener("click", () => {
    state.filters.nombre = $("#fNombre").value || "";
    state.filters.documento = $("#fDocumento").value || "";
    state.filters.rol = $("#fRol").value || "";
    state.filters.estado = (document.querySelector('input[name="fEstado"]:checked')?.value ?? "");
    aplicarFiltros();
    bootstrap.Modal.getInstance($("#filtersModal"))?.hide();
  });
  $("#btnClearFilters")?.addEventListener("click", () => {
    $("#fNombre").value = "";
    $("#fDocumento").value = "";
    $("#fRol").value = "";
    document.querySelector('input[name="fEstado"][value=""]')?.click();
  });

  $("#globalSearch")?.addEventListener("input", aplicarFiltros);
  $("#pageSizeSelect")?.addEventListener("change", (e) => {
    state.pageSize = Number(e.target.value) || 10;
    state.currentPage = 1;
    renderTable();
    renderPagination();
  });

  // Select-all de tabla (sin acciones masivas por ahora)
  $("#selectAll")?.addEventListener("change", (e) => {
    const on = e.target.checked;
    $$("#tableBody .row-check").forEach(ch => ch.checked = on);
  });
}

export const UsuariosManager = {
  async init() {
    try {
      bindEvents();
      await cargarRoles();
      await cargarUsuarios();
    } catch (e) {
      console.error(e);
      UIX.toast("Error inicializando Usuarios", "error");
    }
  }
};
