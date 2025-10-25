// pages/habitantes.js
import { DataTable } from "../modules/data-table.js";
import { ApiClient } from "../modules/api.js";
import { BASE_URL } from "../modules/config.js";


export class HabitantesManager {
    static _opciones = null;

    static async init() {
        try {
            console.log('Inicializando gestor de habitantes...');
            
            // Cargar opciones primero para filtros y selects del modal
            await this.loadOpciones();
            
            // Configuración de la tabla adaptada al JSON real del backend
            const tableConfig = {
                tableId: 'dataTable',
                fetchData: async () => {
                    const response = await ApiClient.getHabitantes();
                    return response;
                },
                pageSize: 10,
                enableSelection: true,
                enablePagination: true,
                enableFilters: true,
                
                // Columnas mapeadas exactamente al JSON del backend
                columns: [
                    {
                        key: 'IdHabitante',
                        label: 'ID',
                        format: (value) => `<span class="badge bg-secondary">#${value}</span>`
                    },
                    {
                        key: 'TipoDocumento',
                        label: 'Tipo Doc',
                        format: (value) => value || '<span class="text-muted">-</span>'
                    },
                    {
                        key: 'NumeroDocumento',
                        label: 'Núm Doc',
                        format: (value) => value || '<span class="text-muted">Sin doc</span>'
                    },
                    {
                        key: 'Nombre',
                        label: 'Nombres',
                        format: (value) => `<strong>${value}</strong>`
                    },
                    {
                        key: 'Apellido',
                        label: 'Apellidos',
                        format: (value) => `<strong>${value}</strong>`
                    },
                    {
                        key: 'FechaNacimiento',
                        label: 'Fecha Nacimiento',
                        format: (value) => this.formatFecha(value)
                    },
                    {
                        key: 'FechaRegistro',
                        label: 'Fecha Ingreso',
                        format: (value) => this.formatFecha(value)
                    },
                    {
                        key: 'Hijos',
                        label: 'Hijos',
                        format: (value) => (value ?? 0)
                    },
                    {
                        key: 'Sexo',
                        label: 'Sexo',
                        format: (value) => value || '<span class="text-muted">No especificado</span>'
                    },
                    {
                        key: 'IdGrupoFamiliar',
                        label: 'Familia',
                        format: (value) => value ? `Familia ${value}` : '<span class="text-muted">Sin familia</span>'
                    },
                    {
                        key: 'Sector',
                        label: 'Sector',
                        format: (value) => value || '<span class="text-muted">Sin sector</span>'
                    },
                    {
                        key: 'EstadoCivil',
                        label: 'Estado Civil',
                        format: (value) => value || '<span class="text-muted">-</span>'
                    },
                    {
                        key: 'TipoPoblacion',
                        label: 'Población',
                        format: (value) => value || '<span class="text-muted">-</span>'
                    },
                    {
                        key: 'Religion',
                        label: 'Religión',
                        format: (value) => value || '<span class="text-muted">-</span>'
                    },
                   {
    key: 'TipoSacramento',
    label: 'Sacramentos',
    format: (value) => {
        if (!value || value === 'Ninguno') {
            return '<span class="text-muted">Ninguno</span>';
        }
        
        const sacramentos = value.split(', ');
        let html = `<div class="sacramentos-lista">`;
        
        // Dividir en grupos de 2
        for (let i = 0; i < sacramentos.length; i += 2) {
            const linea = sacramentos.slice(i, i + 2);
            html += `<div class="d-flex gap-1 mb-1">`;
            
            // Primer sacramento de la línea
            html += `<span class="badge bg-primary flex-fill text-center">${linea[0].trim()}</span>`;
            
            // Segundo sacramento (si existe) o espacio vacío
            if (linea.length > 1) {
                html += `<span class="badge bg-primary flex-fill text-center">${linea[1].trim()}</span>`;
            } else {
                html += `<span class="badge flex-fill" style="visibility: hidden;">-</span>`;
            }
            
            html += `</div>`;
        }
        
        html += `</div>`;
        return html;
    }
},
                    {
                        key: 'Direccion',
                        label: 'Dirección',
                        format: (value) => value || '<span class="text-muted">Sin dirección</span>'
                    },
                    {
                        key: 'Telefono',
                        label: 'Celular',
                        format: (value) => value || '<span class="text-muted">Sin teléfono</span>'
                    },
                    {
                        key: 'CorreoElectronico',
                        label: 'Email',
                        format: (value) => value || '<span class="text-muted">Sin email</span>'
                    },
                    {
                        key: 'DiscapacidadParaAsistir',
                        label: 'Discapacidad',
                        format: (value) => value ? value : 'No'
                    }
                ],
                
                // Acciones por fila (ver, editar, desactivar)
                rowActions: [
                    {
                        id: 'view',
                        label: 'Ver',
                        icon: 'fas fa-eye',
                        class: 'btn-outline-info',
                        showLabel: false,
                        handler: (row) => this.verHabitante(row)
                    },
                    {
                        id: 'edit',
                        label: 'Editar',
                        icon: 'fas fa-edit',
                        class: 'btn-outline-warning',
                        showLabel: false,
                        handler: (row) => this.editarHabitante(row)
                    },
                    {
                        id: 'delete',
                        label: 'Eliminar',
                        icon: 'fas fa-trash',
                        class: 'btn-outline-danger',
                        showLabel: false,
                        handler: (row) => this.eliminarHabitante(row)
                    }
                ],
                
                // Acciones múltiples
                bulkActions: [
                    {
                        id: 'print',
                        label: 'Imprimir seleccionados',
                        handler: (rows) => this.imprimirSeleccionados(rows)
                    },
                    {
                        id: 'export',
                        label: 'Exportar seleccionados',
                        handler: (rows) => this.exportarSeleccionados(rows)
                    },
                    {
                        id: 'delete',
                        label: 'Eliminar seleccionados',
                        handler: (rows) => this.eliminarSeleccionados(rows)
                    }
                ],
                
                // Estado vacío
                emptyState: {
                    title: 'No hay habitantes registrados',
                    message: 'Utilice el botón "Nuevo Habitante" para agregar registros.'
                }
            };

            // Inicializar la tabla
            window.habitantesDataTable = new DataTable(tableConfig);

            // Configurar eventos adicionales (incluye submit del formulario del modal)
            this.setupAdditionalEvents();

        } catch (error) {
            console.error('Error inicializando gestor de habitantes:', error);
            this.showError('Error al cargar los datos de habitantes');
        }
    }

    // =============================== CRUD con MODAL ===============================

    // Abre modal en modo "nuevo" (usa el formulario y estilos de tu HTML)
    static nuevoHabitante() {
        this.resetHabitanteForm();
        const title = document.getElementById('habitanteModalTitle');
        if (title) title.innerHTML = `<i class="fas fa-user-plus me-2"></i>Nuevo Habitante`;

        // asegurar selects cargados
        if (this._opciones) this.populateModalOptions(this._opciones);

        const modal = new bootstrap.Modal('#habitanteModal');
        modal.show();
    }

    // Abre modal en modo "editar" y carga datos desde la API
    static async editarHabitante(habitante) {
        try {
            // pedir detalle por ID para tener valores de llaves foráneas
            const res = await ApiClient.request(`/api/habitantes/${habitante.IdHabitante}`);
            if (!res || res.success === false || !res.habitante) throw new Error(res?.message || 'No se pudo cargar el habitante');

            const h = res.habitante;

            // ✅ CORRECCIÓN: Asegurar que las opciones estén cargadas ANTES de rellenar el formulario
            if (!this._opciones) {
                await this.loadOpciones();
            }
            
            // ✅ CORRECCIÓN: Poblar los selects del modal antes de establecer los valores
            this.populateModalOptions(this._opciones);
            
            // setear campos
            const set = (id, v) => { const el = document.getElementById(id); if (el) el.value = (v ?? ''); };
            this.resetHabitanteForm();

            set('habitanteId', h.IdHabitante);
            set('habNombre', h.Nombre);
            set('habApellido', h.Apellido);
            set('habTipoDoc', h.IdTipoDocumento);
            set('habNumDoc', h.NumeroDocumento);
            if (h.FechaNacimiento) {
                  const fecha = new Date(h.FechaNacimiento);
                  set('habFechaNac', !isNaN(fecha) ? fecha.toISOString().split('T')[0] : '');
                } else {
                  set('habFechaNac', '');
                }   
            set('habSexo', h.IdSexo);
            set('habEstadoCivil', h.IdEstadoCivil);
            set('habReligion', h.IdReligion);
            set('habPoblacion', h.IdTipoPoblacion);
            set('habSacramento', h.IdTipoSacramento);
            set('habSector', h.IdSector);
            set('habDireccion', h.Direccion);
            set('habTelefono', h.Telefono);
            set('habCorreo', h.CorreoElectronico);
            set('habDiscapacidad', h.DiscapacidadParaAsistir);
            const imped = document.getElementById('habTieneImpedimento');
            if (imped) imped.checked = !!h.TieneImpedimentoSalud;
            set('habMotivoImpedimento', h.MotivoImpedimentoSalud);
            set('habHijos', (h.Hijos ?? 0));
            set('habGrupoFamiliar', h.IdGrupoFamiliar ?? '');

            const title = document.getElementById('habitanteModalTitle');
            if (title) title.innerHTML = `<i class="fas fa-user-pen me-2"></i>Editar Habitante`;

            new bootstrap.Modal('#habitanteModal').show();
        } catch (e) {
            console.error(e);
            this.showError('No se pudo cargar el habitante para edición');
        }
    }

    // Guardar (crear / actualizar) según exista o no habitanteId
    static async guardarHabitante() {
        const form = document.getElementById('habitanteForm');
        if (!form) return;

        // Validación nativa + Bootstrap
        form.classList.add('was-validated');
        if (!form.checkValidity()) return;

        const id = (document.getElementById('habitanteId')?.value || '').trim();

        // Construir payload con TODOS los campos de la BD / backend
        const payload = {
            // campos básicos
            nombre:  document.getElementById('habNombre')?.value.trim() || null,
            apellido:document.getElementById('habApellido')?.value.trim() || null,

            // llaves foráneas y datos
            id_tipo_documento: +(document.getElementById('habTipoDoc')?.value || 0) || null,
            numero_documento:  document.getElementById('habNumDoc')?.value.trim() || null,
            fecha_nacimiento:  document.getElementById('habFechaNac')?.value || null,
            hijos: +(document.getElementById('habHijos')?.value || 0),

            id_sexo: +(document.getElementById('habSexo')?.value || 0) || null,
            id_estado_civil: +(document.getElementById('habEstadoCivil')?.value || 0) || null,
            id_religion: +(document.getElementById('habReligion')?.value || 0) || null,
            id_tipo_poblacion: +(document.getElementById('habPoblacion')?.value || 0) || null,
            id_tipo_sacramento: +(document.getElementById('habSacramento')?.value || 0) || null,
            id_sector: +(document.getElementById('habSector')?.value || 0) || null,

            direccion: document.getElementById('habDireccion')?.value.trim() || null,
            telefono:  document.getElementById('habTelefono')?.value.trim() || null,
            correo_electronico: document.getElementById('habCorreo')?.value.trim() || null,

            discapacidad_para_asistir: document.getElementById('habDiscapacidad')?.value.trim() || 'Ninguna',
            tiene_impedimento_salud: !!document.getElementById('habTieneImpedimento')?.checked,
            motivo_impedimento_salud: document.getElementById('habMotivoImpedimento')?.value.trim() || null,

            id_grupo_familiar: +(document.getElementById('habGrupoFamiliar')?.value || 0) || null
        };

        try {
            let res;
            if (id) {
                // Actualizar (PUT) — requiere rol Administrador en backend
                res = await ApiClient.request(`/api/habitantes/${id}`, {
                    method: 'PUT',
                    body: JSON.stringify(payload)
                });
            } else {
                // Crear (POST)
                res = await ApiClient.request('/api/habitantes/', {
                    method: 'POST',
                    body: JSON.stringify(payload)
                });
            }

            if (!res || res.success === false) throw new Error(res?.message || 'No se pudo guardar');

            // Cerrar modal y refrescar tabla
            bootstrap.Modal.getInstance(document.getElementById('habitanteModal'))?.hide();
            await window.habitantesDataTable?.refresh?.();

            if (typeof Swal !== 'undefined') {
                Swal.fire('Éxito', res.message || 'Operación realizada correctamente', 'success');
            }
        } catch (err) {
            console.error(err);
            this.showError(err.message || 'Error al guardar el habitante');
        }
    }

    // Desactivar (soft delete)
    static async eliminarHabitante(habitante) {
        // Confirmación
        let confirm;
        if (typeof Swal !== 'undefined') {
            confirm = await Swal.fire({
                title: '¿Desactivar habitante?',
                text: `${habitante.Nombre} ${habitante.Apellido} (ID ${habitante.IdHabitante})`,
                icon: 'warning',
                showCancelButton: true,
                confirmButtonText: 'Sí, desactivar',
                cancelButtonText: 'Cancelar'
            });
            if (!confirm.isConfirmed) return;
        } else {
            if (!window.confirm('¿Desactivar este habitante?')) return;
        }

        try {
            const r = await ApiClient.request(`/api/habitantes/${habitante.IdHabitante}/desactivar`, { method: 'PATCH' });
            if (!r || r.success === false) throw new Error(r?.message || 'No se pudo desactivar');

            await window.habitantesDataTable?.refresh?.();
            if (typeof Swal !== 'undefined') Swal.fire('Listo', 'Habitante desactivado correctamente', 'success');
        } catch (e) {
            console.error(e);
            this.showError(e.message || 'No se pudo desactivar el habitante');
        }
    }

    // Limpia el formulario del modal
    static resetHabitanteForm() {
        const form = document.getElementById('habitanteForm');
        if (form) {
            form.reset();
            form.classList.remove('was-validated');
        }
        const set = (id, v = '') => { const el = document.getElementById(id); if (el) el.value = v; };
        set('habitanteId', '');
        const imped = document.getElementById('habTieneImpedimento');
        if (imped) imped.checked = false;
    }

    // =============================== Opciones (filtros + modal) ===============================

    // Cargar opciones para filtros desde API (y guardar para el modal)
    static async loadOpciones() {
        try {
            const response = await fetch(`${BASE_URL}/api/opciones/`, {
    headers: {
        'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
    }
});
            
            if (response.ok) {
                const opciones = await response.json();
                this._opciones = opciones;
                this.populateFilterOptions(opciones);
                this.populateModalOptions(opciones); // <-- para selects del modal
            }
        } catch (error) {
            console.error('Error cargando opciones:', error);
        }
    }

    // Poblar opciones de filtros dinámicamente (dejé tu lógica tal cual; solo saneé nombres)
    static populateFilterOptions(opciones) {
        console.log('Opciones recibidas:', opciones); 
        // Tipo de documento
        const tipoDocSelect = document.getElementById('tipoDocFilter');
        if (tipoDocSelect && opciones.tiposDocumento) {
            // Limpiar opciones existentes excepto la primera
            while (tipoDocSelect.options.length > 1) {
                tipoDocSelect.remove(1);
            }
            
            opciones.tiposDocumento.forEach(tipo => {
                const option = document.createElement('option');
                option.value = tipo.Descripcion;
                option.textContent = tipo.Descripcion;
                tipoDocSelect.appendChild(option);
            });
        }

        // Sexo
        const sexoContainer = document.getElementById('sexoFilterContainer');
        if (sexoContainer && opciones.sexos) {
            sexoContainer.innerHTML = opciones.sexos.map(sexo => `
                <div class="form-check">
                    <input class="form-check-input sexo-filter" type="checkbox" value="${sexo.Nombre}" id="sexo-${sexo.IdSexo}">
                    <label class="form-check-label" for="sexo-${sexo.IdSexo}">${sexo.Nombre}</label>
                </div>
            `).join('');
        }

        // Estado civil
        const estadoCivilContainer = document.getElementById('estadoCivilFilterContainer');
        if (estadoCivilContainer && opciones.estadosCiviles) {
            estadoCivilContainer.innerHTML = opciones.estadosCiviles.map(estado => `
                <div class="form-check">
                    <input class="form-check-input estado-civil-filter" type="checkbox" value="${estado.Nombre}" id="ec-${estado.IdEstadoCivil}">
                    <label class="form-check-label" for="ec-${estado.IdEstadoCivil}">${estado.Nombre}</label>
                </div>
            `).join('');
        }

        // Población
        const poblacionContainer = document.getElementById('poblacionFilterContainer');
        if (poblacionContainer && opciones.poblaciones) {
            poblacionContainer.innerHTML = opciones.poblaciones.map(poblacion => `
                <div class="form-check">
                    <input class="form-check-input poblacion-filter" type="checkbox" value="${poblacion.Nombre}" id="pob-${poblacion.IdTipoPoblacion}">
                    <label class="form-check-label" for="pob-${poblacion.IdTipoPoblacion}">${poblacion.Nombre}</label>
                </div>
            `).join('');
        }

        // Religión
        const religionContainer = document.getElementById('religionFilterContainer');
        if (religionContainer && opciones.religiones) {
            religionContainer.innerHTML = opciones.religiones.map(religion => `
                <div class="form-check">
                    <input class="form-check-input religion-filter" type="checkbox" value="${religion.Nombre}" id="rel-${religion.IdReligion}">
                    <label class="form-check-label" for="rel-${religion.IdReligion}">${religion.Nombre}</label>
                </div>
            `).join('');
        }

        // Sacramentos
        const sacramentoSelect = document.getElementById('sacramentoFilter');
        if (sacramentoSelect && opciones.sacramentos) {
            sacramentoSelect.innerHTML = `<option value="">Todos</option>` + opciones.sacramentos.map(sacramento => `
                <option value="${sacramento.Descripcion}">${sacramento.Descripcion}</option>
            `).join('');
        }
    }

    // Poblar selects del modal (usa los ids del modal que ya tienes en Habitantes.html)
    static populateModalOptions(opciones) {
        const setOptions = (id, arr, valueKey, textKey) => {
            const el = document.getElementById(id);
            if (!el || !Array.isArray(arr)) return;
            const current = el.value; // conserva selección si existe
            el.innerHTML = `<option value="">-- Seleccione --</option>` +
                arr.map(o => `<option value="${o[valueKey]}">${o[textKey]}</option>`).join('');
            if (current) el.value = current;
        };

        setOptions('habTipoDoc', opciones.tiposDocumento, 'IdTipoDocumento', 'Descripcion');
        setOptions('habSexo', opciones.sexos, 'IdSexo', 'Nombre');
        setOptions('habEstadoCivil', opciones.estadosCiviles, 'IdEstadoCivil', 'Nombre');
        setOptions('habReligion', opciones.religiones, 'IdReligion', 'Nombre');
        setOptions('habPoblacion', opciones.poblaciones, 'Idpoblaciones', 'Nombre');
        setOptions('habSacramento', opciones.sacramentos, 'Idsacramentos', 'Descripcion');
        setOptions('habSector', opciones.sectores, 'IdSector', 'Descripcion');
    }

    // =============================== Eventos extra ===============================

    // Configurar eventos adicionales
    static setupAdditionalEvents() {
        // Botón nuevo habitante
        document.getElementById('btnNuevo')?.addEventListener('click', () => {
            this.nuevoHabitante();
        });

        // Botón exportar
        document.getElementById('btnExportar')?.addEventListener('click', () => {
            this.exportarTodo();
        });

        // Eventos de radio buttons del período
        document.querySelectorAll('input[name="periodo"]').forEach(radio => {
            radio.addEventListener('change', (e) => {
                const rangoPersonalizado = document.getElementById('rangoPersonalizado');
                if (rangoPersonalizado) {
                    rangoPersonalizado.style.display = (e.target.value === 'personalizado') ? 'block' : 'none';
                }
            });
        });

        // Botón para restablecer columnas por defecto
        document.getElementById('btnResetColumns')?.addEventListener('click', () => {
            this.resetColumnVisibilityToDefault();
        });

        // ✅ Submit del formulario del modal (crear/editar)
        const form = document.getElementById('habitanteForm');
        if (form && !form.dataset.bound) {
            form.addEventListener('submit', (e) => {
                e.preventDefault();
                this.guardarHabitante();
            });
            form.dataset.bound = '1';
        }
    }

    // Restablecer columnas visibles por defecto
    static resetColumnVisibilityToDefault() {
        const defaultColumns = [
            'tipo-doc', 'num-doc', 'nombres', 'apellidos', 'familia', 
            'sector', 'estado-civil', 'religion', 'sacramentos', 'celular'
        ];
        
        // Desmarcar todas primero
        document.querySelectorAll('.col-visibility').forEach(checkbox => {
            checkbox.checked = false;
        });
        
        // Marcar solo las columnas por defecto
        defaultColumns.forEach(col => {
            const checkbox = document.querySelector(`.col-visibility[data-col="${col}"]`);
            if (checkbox) {
                checkbox.checked = true;
                // Disparar evento change para aplicar los cambios
                checkbox.dispatchEvent(new Event('change'));
            }
        });
        
        // Asegurar que acciones siempre estén visibles
        const accionesCheckbox = document.querySelector('.col-visibility[data-col="acciones"]');
        if (accionesCheckbox) {
            accionesCheckbox.checked = true;
            accionesCheckbox.dispatchEvent(new Event('change'));
        }
    }

    // Formatear fecha del formato del backend
    static formatFecha(fechaStr) {
        if (!fechaStr) return '-';
        
        try {
            // Manejar formato del backend
            let fecha = new Date(fechaStr);
            
            if (isNaN(fecha.getTime())) {
                // Intentar otro formato si falla
                fecha = new Date(String(fechaStr).replace('GMT', '').trim());
            }
            
            if (isNaN(fecha.getTime())) return '-';
            
            return fecha.toLocaleDateString('es-ES', {
                year: 'numeric',
                month: 'short',
                day: 'numeric'
            });
        } catch (error) {
            return '-';
        }
    }

    // =============================== Otras acciones UI (tus originales) ===============================

    // Ver (manteniendo tu estilo)
    static verHabitante(habitante) {
        if (typeof Swal !== 'undefined') {
            Swal.fire({
                title: `Habitante: ${habitante.Nombre} ${habitante.Apellido}`,
                html: `
                    <div class="text-start">
                        <p><strong>Documento:</strong> ${habitante.TipoDocumento || ''} ${habitante.NumeroDocumento || ''}</p>
                        <p><strong>Fecha Nacimiento:</strong> ${this.formatFecha(habitante.FechaNacimiento)}</p>
                        <p><strong>Fecha Ingreso:</strong> ${this.formatFecha(habitante.FechaRegistro)}</p>
                        <p><strong>Sexo:</strong> ${habitante.Sexo || '-'}</p>
                        <p><strong>Estado Civil:</strong> ${habitante.EstadoCivil || '-'}</p>
                        <p><strong>Religión:</strong> ${habitante.Religion || '-'}</p>
                        <p><strong>Dirección:</strong> ${habitante.Direccion || 'No registrada'}</p>
                        <p><strong>Teléfono:</strong> ${habitante.Telefono || 'No registrado'}</p>
                        <p><strong>Email:</strong> ${habitante.CorreoElectronico || 'No registrado'}</p>
                    </div>
                `,
                icon: 'info',
                confirmButtonText: 'Cerrar'
            });
        } else {
            alert(`Habitante: ${habitante.Nombre} ${habitante.Apellido}\nDocumento: ${habitante.TipoDocumento || ''} ${habitante.NumeroDocumento || ''}`);
        }
    }

    // Impresión / export / eliminar seleccionados (placeholders como tenías)
    static imprimirSeleccionados(habitantes) {
        if (typeof Swal !== 'undefined') {
            Swal.fire({
                title: 'Imprimir Seleccionados',
                html: `Se imprimirán <strong>${habitantes.length}</strong> habitantes`,
                icon: 'info',
                showCancelButton: true,
                confirmButtonText: 'Imprimir',
                cancelButtonText: 'Cancelar'
            });
        } else {
            alert(`Imprimir ${habitantes.length} habitantes seleccionados`);
        }
    }

    static exportarSeleccionados(habitantes) {
        if (typeof Swal !== 'undefined') {
            Swal.fire({
                title: 'Exportar Seleccionados',
                html: `Se exportarán <strong>${habitantes.length}</strong> habitantes`,
                icon: 'info',
                showCancelButton: true,
                confirmButtonText: 'Exportar',
                cancelButtonText: 'Cancelar'
            });
        } else {
            alert(`Exportar ${habitantes.length} habitantes seleccionados`);
        }
    }

    static exportarTodo() {
        if (typeof Swal !== 'undefined') {
            Swal.fire({
                title: 'Exportar Todos',
                text: 'Exportando todos los habitantes...',
                icon: 'info',
                confirmButtonText: 'Continuar'
            });
        } else {
            alert('Exportando todos los habitantes...');
        }
    }

    static eliminarSeleccionados(habitantes) {
        if (typeof Swal !== 'undefined') {
            Swal.fire({
                title: '¿Está seguro?',
                html: `Va a eliminar <strong>${habitantes.length}</strong> habitantes seleccionados`,
                icon: 'warning',
                showCancelButton: true,
                confirmButtonColor: '#d33',
                cancelButtonColor: '#3085d6',
                confirmButtonText: 'Sí, eliminar',
                cancelButtonText: 'Cancelar'
            }).then((result) => {
                if (result.isConfirmed) {
                    Swal.fire('Eliminados!', 'Los habitantes han sido eliminados.', 'success');
                }
            });
        } else {
            if (confirm(`¿Eliminar ${habitantes.length} habitantes seleccionados?`)) {
                alert('Habitantes eliminados');
            }
        }
    }

    static showError(message) {
        if (typeof Swal !== 'undefined') {
            Swal.fire({
                title: 'Error',
                text: message,
                icon: 'error',
                confirmButtonText: 'Aceptar'
            });
        } else {
            alert('Error: ' + message);
        }
    }
}

// Inicializar cuando el DOM esté listo
document.addEventListener('DOMContentLoaded', () => {
    const currentPage = window.location.pathname.toLowerCase();
    if (currentPage.includes('habitantes.html')) {
        HabitantesManager.init();
    }

  const modalEl = document.getElementById('habitanteModal');
  if (modalEl) {
    modalEl.addEventListener('hide.bs.modal', () => {
      // Quita el foco antes de ocultar el modal
      if (document.activeElement) document.activeElement.blur();
    });
  }
});
