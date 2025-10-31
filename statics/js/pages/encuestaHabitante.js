// /Frontend/statics/js/pages/encuestaHabitante.js
// Módulo: Encuesta Completa de Habitantes - VERSIÓN FINAL CON GRUPO FAMILIAR DINÁMICO
// Exporta: export const EncuestaHabitanteManager = { init }

import { ApiClient } from "../modules/api.js"

/* =========================
   Helpers
========================= */
const $ = (sel, ctx = document) => ctx.querySelector(sel)
const $$ = (sel, ctx = document) => Array.from(ctx.querySelectorAll(sel))
const getQS = (k) => new URLSearchParams(location.search).get(k)
const numOrNull = (v) => {
  if (v === "" || v === null || v === undefined) return null
  const n = Number(v)
  return Number.isFinite(n) ? n : null
}
const strOrNull = (v) => {
  const s = (v ?? "").toString().trim()
  return s === "" ? null : s
}
const bool01 = (cond) => (cond ? 1 : 0)
const toast = (icon, title) =>
  window.Swal?.fire({ toast: true, position: "top-end", icon, title, timer: 2200, showConfirmButton: false })

/* =========================
   Wizard (4 pasos)
========================= */
const wizard = {
  current: 1,
  max: 3,
  steps: () => $$(".wizard-step"),
  update() {
    this.steps().forEach(s => (s.style.display = s.dataset.step === String(this.current) ? "block" : "none"))
    const bar = $("#wizardProgress")
    const label = $("#wizardStepLabel")
    if (bar) bar.style.width = `${(this.current / this.max) * 100}%`
    if (label) {
      const labels = ["Identificación","Contacto y Ubicación","Salud"]
      label.textContent = `Paso ${this.current} de ${this.max}: ${labels[this.current - 1] || ""}`
    }
  }
}

/* =========================
   Cargar opciones desde /api/opciones/
========================= */
async function cargarOpciones() {
  try {
    const data = await ApiClient.request("/api/opciones/", "GET")

    const mapSel = {
      "IdTipoDocumento": data?.tiposDocumento,
      "IdSexo": data?.sexos,
      "IdEstadoCivil": data?.estadosCiviles,
      "IdReligion": data?.religiones,
      "IdTipoPoblacion": data?.poblaciones,
      "IdSector": data?.sectores,
    }
    
    for (const [selectId, opciones] of Object.entries(mapSel)) {
      const sel = document.getElementById(selectId)
      if (!sel) continue
      while (sel.options.length > 1) sel.remove(1)
      ;(opciones || []).forEach(opt => {
        const o = document.createElement("option")
        o.value = opt.id ?? opt.Id ?? opt.ID ?? ""
        o.textContent = opt.Descripcion || opt.Nombre || opt.descripcion || opt.nombre || String(o.value)
        sel.appendChild(o)
      })
    }

    // Sacramentos (checkboxes)
    const sacWrap = $("#SacramentosWrap")
    const sacramentos = data?.sacramentos || []
    if (sacWrap) {
      sacWrap.innerHTML = ""
      ;(sacramentos || []).forEach(s => {
        const id = s.id ?? s.Id ?? s.IdSacramento
        const label = s.Descripcion || s.Nombre || s.descripcion || s.nombre || `Sacramento #${id}`
        const col = document.createElement("div")
        col.className = "col-sm-6 col-md-4"
        col.innerHTML = `
          <div class="form-check">
            <input class="form-check-input" type="checkbox" value="${id}" id="sac_${id}" data-sacramento>
            <label class="form-check-label" for="sac_${id}">${label}</label>
          </div>`
        sacWrap.appendChild(col)
      })
    }
  } catch (e) {
    console.error("Error cargando opciones:", e)
  }
}

/* =========================
   Búsqueda Dinámica de Grupo Familiar
========================= */
function inicializarBuscadorGrupoFamiliar() {
    const inputBusqueda = $("#BuscarGrupoFamiliar");
    const resultadosContainer = $("#resultadosGrupoFamiliar");
    const inputHidden = $("#IdGrupoFamiliar");
    const infoContainer = $("#infoGrupoSeleccionado");
    const textoInfo = $("#textoGrupoSeleccionado");
    const btnLimpiar = $("#btnLimpiarBusqueda");

    let busquedaTimeout = null;

    // Evento de búsqueda
    inputBusqueda.addEventListener('input', function(e) {
        const query = e.target.value.trim();
        
        if (busquedaTimeout) {
            clearTimeout(busquedaTimeout);
        }
        
        busquedaTimeout = setTimeout(() => {
            if (query.length === 0) {
                resultadosContainer.style.display = 'none';
                return;
            }
            buscarGruposFamiliar(query);
        }, 300);
    });

    // Evento focus
    inputBusqueda.addEventListener('focus', function() {
        if (inputBusqueda.value.trim().length > 0) {
            buscarGruposFamiliar(inputBusqueda.value.trim());
        }
    });

    // Evento blur (ocultar resultados después de un delay)
    inputBusqueda.addEventListener('blur', function() {
        setTimeout(() => {
            resultadosContainer.style.display = 'none';
        }, 200);
    });

    // Botón limpiar
    btnLimpiar.addEventListener('click', function() {
        inputBusqueda.value = '';
        inputHidden.value = '';
        infoContainer.style.display = 'none';
        resultadosContainer.style.display = 'none';
    });

    async function buscarGruposFamiliar(query) {
    try {
        const data = await ApiClient.request(`/api/grupofamiliar/buscar_dinamico?q=${encodeURIComponent(query)}`, "GET");
        
        resultadosContainer.innerHTML = '';
        
        if (data.success && data.grupos.length > 0) {
            // Mostrar grupos existentes
            data.grupos.forEach(grupo => {
                const item = document.createElement('button');
                item.className = 'dropdown-item';
                item.type = 'button';
                item.innerHTML = `
                    <div>
                        <strong>${grupo.NombreGrupo}</strong>
                        ${grupo.JefeFamilia ? `<br><small class="text-muted">Familiar Asociado: ${grupo.JefeFamilia}</small>` : ''}
                    </div>
                `;
                item.addEventListener('click', () => seleccionarGrupo(grupo));
                resultadosContainer.appendChild(item);
            });
        }
        
        // Opción para crear nuevo grupo
        const crearItem = document.createElement('button');
        crearItem.className = 'dropdown-item text-primary';
        crearItem.type = 'button';
        crearItem.innerHTML = `<i class="bi bi-plus-circle me-2"></i>Crear nuevo grupo: "${query}"`;
        crearItem.addEventListener('click', () => mostrarModalCrearGrupo(query));
        resultadosContainer.appendChild(crearItem);
        
        resultadosContainer.style.display = 'block';
        
    } catch (error) {
        console.error('Error buscando grupos familiares:', error);
    }
}

    function seleccionarGrupo(grupo) {
    inputBusqueda.value = grupo.NombreGrupo;
    inputHidden.value = grupo.IdGrupoFamiliar;
    
    // Mostrar SOLO el familiar asociado
    let infoText = '';
    if (grupo.JefeFamilia) {
        infoText = `Familiar Asociado: ${grupo.JefeFamilia}`;
    } else {
        infoText = 'Familiar Asociado: Por asignar';
    }
    
    textoInfo.textContent = infoText;
    infoContainer.style.display = 'block';
    
    resultadosContainer.style.display = 'none';
    
    console.log('Grupo familiar seleccionado:', grupo);
}

    async function mostrarModalCrearGrupo(nombreSugerido = '') {
    try {
        const modalHTML = `
            <div class="modal fade" id="modalCrearGrupo" tabindex="-1">
                <div class="modal-dialog">
                    <div class="modal-content">
                        <div class="modal-header">
                            <h5 class="modal-title">Crear Nuevo Grupo Familiar</h5>
                            <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
                        </div>
                        <div class="modal-body">
                            <div class="mb-3">
                                <label class="form-label">Nombre del Grupo <span class="text-danger">*</span></label>
                                <input type="text" class="form-control" id="nombreGrupoNuevo" value="${nombreSugerido}" required>
                            </div>
                            <div class="alert alert-info">
                                <i class="bi bi-info-circle me-2"></i>
                                <small>El encuestado será asignado como familiar asociado.</small>
                            </div>
                        </div>
                        <div class="modal-footer">
                            <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Cancelar</button>
                            <button type="button" class="btn btn-primary" id="btnConfirmarCrearGrupo">Crear Grupo</button>
                        </div>
                    </div>
                </div>
            </div>
        `;
        
        document.body.insertAdjacentHTML('beforeend', modalHTML);
        const modalElement = document.getElementById('modalCrearGrupo');
        const modal = new bootstrap.Modal(modalElement);
        
        document.getElementById('btnConfirmarCrearGrupo').addEventListener('click', async () => {
            await crearGrupoFamiliar();
        });
        
        modal.show();
        
        // Limpiar modal cuando se cierre
        modalElement.addEventListener('hidden.bs.modal', function() {
            this.remove();
        });
        
    } catch (error) {
        console.error('Error mostrando modal:', error);
        alert('Error al cargar el formulario de creación');
    }
}

async function crearGrupoFamiliar() {
    const nombre = document.getElementById('nombreGrupoNuevo').value.trim();

    if (!nombre) {
        alert('El nombre del grupo es obligatorio');
        return;
    }

    try {
        const data = await ApiClient.request('/api/grupofamiliar/crear_simple', {
            method: 'POST',
            body: JSON.stringify({
                nombre: nombre
            })
        });

        if (data.success) {
            // Cerrar modal
            bootstrap.Modal.getInstance(document.getElementById('modalCrearGrupo')).hide();
            
            // Seleccionar el grupo recién creado
            const grupoCreado = {
                IdGrupoFamiliar: data.id,
                NombreGrupo: nombre,
                JefeFamilia: 'Por asignar' // Se asignará cuando se guarde el habitante
            };
            
            seleccionarGrupo(grupoCreado);
            
            toast('success', 'Grupo familiar creado exitosamente');
        } else {
            alert('Error al crear grupo: ' + data.message);
        }
    } catch (error) {
        console.error('Error creando grupo:', error);
        alert('Error al crear grupo familiar');
    }
}
}

/* =========================
   Validaciones por paso
========================= */
function validarPaso(step) {
    const fs = document.querySelector(`.wizard-step[data-step="${step}"]`)
    if (!fs) return true
    
    // Validación especial para paso 1 (grupo familiar)
    if (step === 1) {
        const idGrupoFamiliar = $("#IdGrupoFamiliar").value;
        if (!idGrupoFamiliar) {
            window.Swal?.fire({
                icon: "warning",
                title: "Grupo familiar requerido",
                text: "Debe seleccionar o crear un grupo familiar para continuar."
            });
            return false;
        }
    }
    
    const controls = $$("input, select, textarea", fs)
    let ok = true
    controls.forEach(el => {
        if (el.id === "MotivoImpedimentoSalud") el.required = $("#TieneImpedimentoSalud").value === "1"
        if (el.id === "DiscapacidadOtra") el.required = $("#DiscapacidadParaAsistir").value === "Otra"
        if (!el.checkValidity()) { 
            el.classList.add("is-invalid"); 
            ok = false 
        } else { 
            el.classList.remove("is-invalid") 
        }
    })
    if (!ok) {
        window.Swal?.fire({ 
            icon: "warning", 
            title: "Faltan datos", 
            text: "Complete los campos requeridos marcados en rojo." 
        })
    }
    return ok
}

/* =========================
   Obtener sacramentos seleccionados
========================= */
function obtenerSacramentosSeleccionados() {
    const sacramentos = []
    $$('[data-sacramento]:checked').forEach(checkbox => {
        sacramentos.push(parseInt(checkbox.value))
    })
    return sacramentos
}

/* =========================
   Construir payload CORREGIDO - CON VALIDACIÓN DE GRUPO FAMILIAR
========================= */
function construirPayload() {
    // VERIFICAR GRUPO FAMILIAR ANTES DE CONSTRUIR PAYLOAD
    const idGrupoFamiliar = $("#IdGrupoFamiliar").value;
    if (!idGrupoFamiliar) {
        throw new Error("Debe seleccionar o crear un grupo familiar");
    }

    // Manejar discapacidad
    let discapacidad = $("#DiscapacidadParaAsistir").value
    if (discapacidad === "Otra") {
        discapacidad = $("#DiscapacidadOtra").value || "Otra"
    }

    // Sacramentos seleccionados
    const sacramentosSeleccionados = obtenerSacramentosSeleccionados()

    // PAYLOAD EXACTO según lo que espera el backend en habitantes.py
    const payload = {
        // Campos OBLIGATORIOS según el backend
        Nombre: $("#Nombre").value.trim(),
        Apellido: $("#Apellido").value.trim(),
        IdTipoDocumento: parseInt($("#IdTipoDocumento").value),
        NumeroDocumento: $("#NumeroDocumento").value.trim(),
        FechaNacimiento: $("#FechaNacimiento").value,
        IdSexo: parseInt($("#IdSexo").value),
        IdEstadoCivil: parseInt($("#IdEstadoCivil").value),
        IdReligion: parseInt($("#IdReligion").value),
        IdTipoPoblacion: parseInt($("#IdTipoPoblacion").value),
        IdSector: parseInt($("#IdSector").value),
        Direccion: $("#Direccion").value.trim(),
        Telefono: $("#Telefono").value.trim(),
        CorreoElectronico: $("#CorreoElectronico").value.trim(),
        IdGrupoFamiliar: parseInt(idGrupoFamiliar),

        // Campos con valores por defecto (ahora ocultos al usuario)
        Hijos: parseInt($("#Hijos").value) || 0,
        DiscapacidadParaAsistir: discapacidad || "Ninguna",
        TieneImpedimentoSalud: $("#TieneImpedimentoSalud").value === "1" ? 1 : 0,
        MotivoImpedimentoSalud: $("#MotivoImpedimentoSalud").value.trim() || "Ninguno",
        Activo: 1, // Siempre activo por defecto
        FechaRegistro: new Date().toISOString().split('T')[0], // Fecha actual

        // Sacramentos - debe ser un array de IDs
        Sacramentos: sacramentosSeleccionados
    }

    console.log("🎯 PAYLOAD PARA BACKEND:", JSON.stringify(payload, null, 2))
    
    return payload
}

/* =========================
   Guardar habitante - CON VALIDACIÓN MEJORADA
========================= */
async function guardarHabitante(e) {
    e.preventDefault()

    console.log("🚀 === INICIANDO ENVÍO AL BACKEND ===")

    // Validar todos los pasos antes de enviar
    let pasoInvalido = false
    for (let s = 1; s <= wizard.max; s++) {
        if (!validarPaso(s)) { 
            wizard.current = s
            wizard.update()
            pasoInvalido = true
            break
        }
    }
    
    if (pasoInvalido) {
        console.log("❌ Validación falló, no se procede")
        return
    }

    try {
        const payload = construirPayload()

        console.log("✅ Todos los campos están completos y válidos")
        console.log("📤 Enviando datos al servidor...")

        const resp = await ApiClient.request('/api/habitantes/', {
            method: 'POST',
            body: JSON.stringify(payload)
        })

        console.log("✅ Respuesta completa del servidor:", resp)

        if (resp && resp.success) {
            toast("success", resp.message || "Habitante guardado exitosamente")
            
            
             const nombreCompleto = `${$("#Nombre").value} ${$("#Apellido").value}`
            if (resp.IdHabitante) {
                setTimeout(() => {
                    window.Swal?.fire({
                        icon: "success",
                        title: "¡Éxito!",
                        html: `Habitante creado exitosamente<br><strong>${nombreCompleto}</strong>`,
                        confirmButtonText: "Aceptar"
                    })
                }, 500)
            }
            
            // Limpiar formulario después de guardar
            setTimeout(() => {
                $("#formEncuestaHabitante").reset()
                wizard.current = 1
                wizard.update()
                $("#DiscapacidadOtraWrap").style.display = "none"
                $("#infoGrupoSeleccionado").style.display = "none"
                toast("info", "Formulario listo para nuevo registro")
            }, 2000)
            
        } else {
            // Mostrar error específico del servidor
            const mensajeError = resp?.message || "Error desconocido del servidor"
            throw new Error(mensajeError)
        }

    } catch (err) {
        console.error("❌ Error completo al guardar:", err)
        
        let mensajeError = "Error al guardar el habitante"
        
        if (err.message.includes("Duplicate entry")) {
            mensajeError = "Ya existe un habitante con este número de documento o correo electrónico"
        } else if (err.message.includes("500")) {
            mensajeError = "Error interno del servidor. Verifique que todos los datos sean válidos."
        } else if (err.message.includes("Faltan campos obligatorios")) {
            mensajeError = err.message
        } else if (err.message.includes("grupo familiar")) {
            mensajeError = err.message
            // Mover al paso 1 donde está el grupo familiar
            wizard.current = 1;
            wizard.update();
        }

        window.Swal?.fire({ 
            icon: "error", 
            title: "Error al guardar", 
            html: `<div class="text-start">
                <p><strong>${mensajeError}</strong></p>
                <p class="text-muted small mt-2">Verifique la consola para más detalles.</p>
            </div>`,
            confirmButtonText: "Entendido"
        })
    }
}

/* =========================
   Eventos
========================= */
function bindEventos() {
    // Navegación del wizard
    $("#btnPrev")?.addEventListener("click", () => { 
        if (wizard.current > 1) { 
            wizard.current--
            wizard.update() 
            // Mostrar el botón siguiente si volvemos atrás
            $("#btnNext").style.display = "block"
        } 
    })
    
    $("#btnNext")?.addEventListener("click", () => { 
        if (wizard.current < wizard.max && validarPaso(wizard.current)) { 
            wizard.current++
            wizard.update() 
            
            // Si llegamos al último paso, ocultar el botón siguiente
            if (wizard.current === wizard.max) {
                $("#btnNext").style.display = "none"
            }
        } 
    })

    // Mostrar/ocultar campos condicionales
    $("#TieneImpedimentoSalud")?.addEventListener("change", function() {
        const requerido = this.value === "1"
        $("#MotivoImpedimentoSalud").required = requerido
        if (!requerido) {
            $("#MotivoImpedimentoSalud").value = ""
        }
    })
    
    $("#DiscapacidadParaAsistir")?.addEventListener("change", function() {
        const mostrarOtra = this.value === "Otra"
        $("#DiscapacidadOtraWrap").style.display = mostrarOtra ? "block" : "none"
        $("#DiscapacidadOtra").required = mostrarOtra
        if (!mostrarOtra) {
            $("#DiscapacidadOtra").value = ""
        }
    })

    // Submit del formulario
    $("#formEncuestaHabitante")?.addEventListener("submit", guardarHabitante)

    // Botón volver - MEJORADO
    $("#btnVolver")?.addEventListener("click", () => {
        window.Swal?.fire({
            icon: 'warning',
            title: '¿Salir del formulario?',
            text: 'Los datos no guardados se perderán.',
            showCancelButton: true,
            confirmButtonText: 'Sí, salir',
            cancelButtonText: 'Cancelar'
        }).then((result) => {
            if (result.isConfirmed) {
                window.location.href = '../NavOficina.html';
            }
        });
    });

    // Botón limpiar
    $("button[type='reset']")?.addEventListener("click", () => {
        window.Swal?.fire({
            icon: 'warning',
            title: '¿Limpiar formulario?',
            text: 'Se perderán todos los datos ingresados.',
            showCancelButton: true,
            confirmButtonText: 'Sí, limpiar',
            cancelButtonText: 'Cancelar'
        }).then((result) => {
            if (result.isConfirmed) {
                setTimeout(() => {
                    $("#DiscapacidadOtraWrap").style.display = "none"
                    $("#infoGrupoSeleccionado").style.display = "none"
                    wizard.current = 1
                    wizard.update()
                    // Asegurar que el botón siguiente esté visible después de limpiar
                    $("#btnNext").style.display = "block"
                    toast("info", "Formulario limpiado")
                }, 100)
            }
        });
    });

    // Validación en tiempo real para campos numéricos
    $("#Hijos")?.addEventListener("input", function() {
        if (this.value < 0) this.value = 0
    })
}

/* =========================
   Carga de edición (opcional)
========================= */
async function cargarHabitante(id) {
    if (!id) return
    try {
        const d = await ApiClient.request(`/api/habitantes/${id}`, "GET")
        const h = d?.habitante
        if (!h) {
            toast("error", "Habitante no encontrado")
            return
        }

        const setVal = (id, v) => { 
            const el = document.getElementById(id)
            if (el != null && v != null) el.value = v 
        }
        const setChecked = (id, v) => { 
            const el = document.getElementById(id)
            if (el) el.checked = !!v 
        }

        // Campos básicos
        setVal("Nombre", h.Nombre)
        setVal("Apellido", h.Apellido)
        setVal("IdTipoDocumento", h.IdTipoDocumento)
        setVal("NumeroDocumento", h.NumeroDocumento)
        setVal("FechaNacimiento", (h.FechaNacimiento || "").substring(0,10))
        setVal("Hijos", h.Hijos ?? 0)
        setVal("IdSexo", h.IdSexo)
        setVal("IdEstadoCivil", h.IdEstadoCivil)
        setVal("IdReligion", h.IdReligion)
        setVal("IdTipoPoblacion", h.IdTipoPoblacion)
        setVal("IdSector", h.IdSector)
        
        // Contacto
        setVal("Direccion", h.Direccion)
        setVal("Telefono", h.Telefono)
        setVal("CorreoElectronico", h.CorreoElectronico)
        
        // Grupo familiar - CARGAR EN EL BUSCADOR
        // En la función cargarHabitante, busca esta parte y actualízala:
// En la función cargarHabitante, actualiza esta parte:
if (h.IdGrupoFamiliar) {
    // Obtener información completa del grupo
    const grupoData = await ApiClient.request(`/api/grupofamiliar/${h.IdGrupoFamiliar}`, "GET")
    if (grupoData.success) {
        const grupo = grupoData.grupo
        setVal("IdGrupoFamiliar", grupo.IdGrupoFamiliar)
        setVal("BuscarGrupoFamiliar", grupo.NombreGrupo)
        
        let infoText = '';
        if (grupo.JefeFamilia) {
            infoText = `Familiar Asociado: ${grupo.JefeFamilia}`;
        } else {
            infoText = 'Familiar Asociado: Por asignar';
        }
        
        $("#textoGrupoSeleccionado").textContent = infoText;
        $("#infoGrupoSeleccionado").style.display = 'block'
    }
}

        
        // Salud
        setVal("TieneImpedimentoSalud", h.TieneImpedimentoSalud ? "1" : "0")
        setVal("MotivoImpedimentoSalud", h.MotivoImpedimentoSalud || "Ninguno")
        setVal("DiscapacidadParaAsistir", h.DiscapacidadParaAsistir || "Ninguna")
        
        // Estado
        setChecked("Activo", h.Activo !== 0)
        setVal("FechaRegistro", h.FechaRegistro ? new Date(h.FechaRegistro).toLocaleString() : "")

        // Manejar discapacidad "Otra"
        if (h.DiscapacidadParaAsistir && h.DiscapacidadParaAsistir !== "Ninguna" && 
            !["Visual", "Auditiva", "Motriz"].includes(h.DiscapacidadParaAsistir)) {
            setVal("DiscapacidadParaAsistir", "Otra")
            setVal("DiscapacidadOtra", h.DiscapacidadParaAsistir)
            $("#DiscapacidadOtraWrap").style.display = "block"
        }

        console.log("Habitante cargado para edición:", h)
    } catch (e) {
        console.error("Error cargando habitante:", e)
        toast("error", "No se pudo cargar el habitante para edición")
    }
}

/* =========================
   Inicialización
========================= */
async function init() {
    console.log("🚀 Inicializando encuesta de habitante...")
    
    // 1. Inicializar wizard
    wizard.update()
    
    // 2. Cargar opciones de selects
    await cargarOpciones()
    
    // 3. Inicializar sistema de grupo familiar
    inicializarBuscadorGrupoFamiliar()
    
    // 4. Configurar eventos
    bindEventos()

    // 5. Verificar si es edición o nuevo
    const id = getQS("id")
    if (id) {
        console.log("Modo edición, ID:", id)
        await cargarHabitante(id)
        $("#pageTitle").textContent = "Editar Habitante"
        // En modo edición, ocultar botón siguiente desde el inicio
        $("#btnNext").style.display = "none"
    } else {
        console.log("Modo nuevo habitante")
        $("#pageTitle").textContent = "Nueva Encuesta de Habitante"
        // En modo nuevo, asegurar que el botón siguiente esté visible
        $("#btnNext").style.display = "block"
    }
    
    console.log("✅ [encuestaHabitante] inicialización completada")
}

export const EncuestaHabitanteManager = { init }