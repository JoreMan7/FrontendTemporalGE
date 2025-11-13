// Frontend/statics/js/pages/perfil.js
import { ApiClient } from "../modules/api.js";
import { AuthManager } from "../modules/auth.js";
import { showNotification } from "../modules/utilities.js";

export const ProfileManager = {
  _user: null,
  _snapshot: null,
  _dirty: false,

  async init() {
    try {
      console.log("[Perfil] init...");
      await this.loadOptions();
      await this.loadProfile();
      this.wireEvents();
      console.log("[Perfil] listo");
    } catch (e) {
      console.error("[Perfil] init error:", e);
      showNotification("Error inicializando el perfil", "error");
    }
  },

  // ===== Opciones =====
  async loadOptions() {
  try {
    console.log("[Perfil] Cargando opciones desde /api/opciones/ ...");
    
    const response = await ApiClient.request("/api/opciones/");
    console.log("[Perfil] Respuesta completa de opciones:", response);
    
    // Verifica qué opciones llegan
    console.log("[Perfil] Tipos documento:", response?.tiposDocumento);
    console.log("[Perfil] Sexos:", response?.sexos);
    console.log("[Perfil] Grupos familiar:", response?.gruposfamiliar);
    
    const fill = (id, items, idKey = "id", textKey = "Nombre") => {
      const el = document.getElementById(id);
      if (!el) {
        console.warn(`[Perfil] Elemento no encontrado: ${id}`);
        return;
      }
      
      if (!Array.isArray(items)) {
        console.warn(`[Perfil] Items no es array para ${id}:`, items);
        el.innerHTML = '<option value="">-- No disponible --</option>';
        return;
      }

      el.innerHTML =
        `<option value="">-- Seleccione --</option>` +
        items.map(
          (o) => `<option value="${o[idKey]}">${o[textKey] || o.Descripcion || o.Nombre}</option>`
        ).join("");
    };

    // Solo llena las opciones que realmente vienen del endpoint
    fill("TipoDocumentoSelect", response?.tiposDocumento, "id", "Descripcion");
    fill("SexoSelect", response?.sexos, "id", "Nombre");
    fill("EstadoCivilSelect", response?.estadosCiviles, "id", "Nombre");
    fill("ReligionSelect", response?.religiones, "id", "Nombre");
    fill("TipoPoblacionSelect", response?.poblaciones, "id", "Nombre");
    fill("SectorSelect", response?.sectores, "id", "Descripcion");
    
    // Para grupos familiares, usa tu endpoint específico
    this.loadGruposFamiliar();
    
  } catch (error) {
    console.error("[Perfil] Error cargando opciones:", error);
  }
},

async loadGruposFamiliar() {
  try {
    console.log("[Perfil] Cargando grupos familiares desde /api/grupofamiliar/ ...");
    const response = await ApiClient.request("/api/grupofamiliar/");
    console.log("[Perfil] Grupos familiar respuesta:", response);
    
    const el = document.getElementById("GrupoFamiliarSelect");
    if (!el) return;
    
    if (response?.success && Array.isArray(response.grupos)) {
      el.innerHTML = 
        '<option value="">-- Seleccione --</option>' +
        response.grupos.map(g => 
          `<option value="${g.IdGrupoFamiliar}">${g.NombreGrupo || 'Sin nombre'}</option>`
        ).join("");
    } else {
      el.innerHTML = '<option value="">-- No disponible --</option>';
    }
  } catch (error) {
    console.error("[Perfil] Error cargando grupos familiar:", error);
  }
},  

  // ===== Perfil =====
  async loadProfile() {
    console.log("[Perfil] cargando perfil...");
    let data;
    try {
      // PRIMERO intenta el que ya usa tu proyecto
      const r1 = await ApiClient.request("/api/auth/profile"); // <- ruta usada en tu app
      data = r1?.user || r1?.data || r1;
    } catch (e) {
      console.warn("[Perfil] /api/auth/profile falló, probando /api/auth/profile", e);
      const r2 = await ApiClient.request("/api/auth/profile"); // fallback
      data = r2?.user || r2?.data || r2;
    }
    if (!data) throw new Error("Sin datos de perfil");
    this._user = data;

    // Header (usa UserName que ya te da tu API)
    const headerName =
      this._user.UserName ||
      `${this._user.Nombre || ""} ${this._user.Apellido || ""}`.trim();
    document.querySelectorAll(".UserName").forEach((el) => (el.textContent = headerName || "Usuario"));
    if (this._user.AvatarUrl) {
      document.querySelectorAll(".UserAvatar").forEach((img) => (img.src = this._user.AvatarUrl));
    }

    // Cuenta (solo lectura)
    const af = document.getElementById("account-form");
    if (af) {
      this.setVal(af, "RolNombre", this._user.rol || this._user.RolNombre || "Usuario");
      const fr = this._user.FechaRegistroUsuario || this._user.FechaRegistro || "";
      this.setVal(af, "FechaRegistroUsuario", this.asInputDateTime(fr));
    }

    // Datos personales (habitante)
    const pf = document.getElementById("profile-form");
    if (pf) {
      this.setVal(pf, "Nombre", this._user.Nombre);
      this.setVal(pf, "Apellido", this._user.Apellido);
      this.setSel(pf, "IdTipoDocumento", this._user.IdTipoDocumento);
      this.setVal(pf, "NumeroDocumento", this._user.NumeroDocumento);
      this.setVal(pf, "FechaNacimiento", (this._user.FechaNacimiento || "").slice(0, 10));

      this.setSel(pf, "IdSexo", this._user.IdSexo);
      this.setSel(pf, "IdEstadoCivil", this._user.IdEstadoCivil);
      this.setSel(pf, "IdReligion", this._user.IdReligion);
      this.setSel(pf, "IdTipoPoblacion", this._user.IdTipoPoblacion);

      this.setVal(pf, "Direccion", this._user.Direccion);
      this.setVal(pf, "Telefono", this._user.Telefono);
      this.setVal(pf, "CorreoElectronico", this._user.CorreoElectronico);

      this.setSel(pf, "IdGrupoFamiliar", this._user.IdGrupoFamiliar);
      this.setSel(pf, "IdSector", this._user.IdSector);

      this.setVal(pf, "Hijos", this._user.Hijos ?? 0);
      const sw = document.getElementById("SwitchImpedimento");
      if (sw) sw.checked = !!this._user.TieneImpedimentoSalud;
      this.setVal(pf, "MotivoImpedimentoSalud", this._user.MotivoImpedimentoSalud || "");
      this.toggleMotivo(!!this._user.TieneImpedimentoSalud);

      // snapshot para Cancelar
      this._snapshot = this.getFormData(pf);
      this._dirty = false;
    }

    // Actualiza caché global (como hace tu app)
    const merged = { ...(AuthManager.getUser() || {}), ...this._user };
    AuthManager.setUser(merged);
  },

  // ===== Helpers DOM =====
  setVal(form, name, value) {
    const el = form?.querySelector(`[name="${name}"]`);
    if (el != null) el.value = value ?? "";
  },
  setSel(form, name, value) {
    const el = form?.querySelector(`[name="${name}"]`);
    if (el && value != null) el.value = String(value);
  },
  getFormData(form) {
    const fd = new FormData(form);
    return Object.fromEntries(fd.entries());
  },
  asInputDateTime(v) {
    if (!v) return "";
    const d = new Date(v);
    if (isNaN(d)) return "";
    const pad = (n) => String(n).padStart(2, "0");
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(
      d.getHours()
    )}:${pad(d.getMinutes())}`;
  },

  // ===== Eventos =====
  wireEvents() {
    const pf = document.getElementById("profile-form");
    if (pf) {
      pf.addEventListener("input", () => {
        this._dirty = true;
      });
      const sw = document.getElementById("SwitchImpedimento");
      if (sw) sw.addEventListener("change", () => this.toggleMotivo(sw.checked));
    }
    const btnSave = document.getElementById("btnSaveProfile");
    if (btnSave) btnSave.addEventListener("click", () => this.saveProfile());
    const btnCancel = document.getElementById("btnCancelProfile");
    if (btnCancel) btnCancel.addEventListener("click", () => this.cancelChanges());

    window.addEventListener("beforeunload", (e) => {
      if (this._dirty) {
        e.preventDefault();
        e.returnValue = "";
      }
    });
    document.querySelectorAll(".NavMenu .NavItem, .logout, a[href]").forEach((a) => {
      a.addEventListener("click", (ev) => {
        if (!this._dirty) return;
        const href = a.getAttribute("href");
        if (!href || href.startsWith("#")) return;
        ev.preventDefault();
        Swal.fire({
          icon: "warning",
          title: "Cambios sin guardar",
          text: "¿Salir y descartar los cambios?",
          showCancelButton: true,
          confirmButtonText: "Salir",
          cancelButtonText: "Cancelar",
        }).then((r) => {
          if (r.isConfirmed) window.location.href = href;
        });
      });
    });
  },

  toggleMotivo(on) {
    const input = document.querySelector('[name="MotivoImpedimentoSalud"]');
    if (input) {
      input.disabled = !on;
      if (!on) input.value = "";
    }
  },

  cancelChanges() {
    const form = document.getElementById("profile-form");
    if (!form || !this._snapshot) return;
    Object.keys(this._snapshot).forEach((k) => {
      const el = form.querySelector(`[name="${k}"]`);
      if (el) el.value = this._snapshot[k];
    });
    const sw = document.getElementById("SwitchImpedimento");
    if (sw) this.toggleMotivo(sw.checked);
    this._dirty = false;
    showNotification("Cambios descartados", "success");
  },

  async saveProfile() {
    try {
      if (!this._user?.IdHabitante) throw new Error("Falta IdHabitante en el perfil");
      const form = document.getElementById("profile-form");
      const data = this.getFormData(form);
      data.Hijos = Number(data.Hijos || 0);
      data.TieneImpedimentoSalud = document.getElementById("SwitchImpedimento")?.checked ? 1 : 0;
      if (!data.TieneImpedimentoSalud) data.MotivoImpedimentoSalud = "Ninguno";

      const url = `/api/habitantes/${this._user.IdHabitante}`;
      const resp = await ApiClient.request(url, {
        method: "PUT",
        body: JSON.stringify(data),
      });
      if (!resp?.success) throw new Error(resp?.message || "No se pudo guardar");

      await this.loadProfile();
      this._dirty = false;
      showNotification("Datos del habitante actualizados", "success");
    } catch (e) {
      console.error("[Perfil] save error:", e);
      showNotification(e.message || "Error al guardar", "error");
    }
  },
};
