// pages/habitantes.js
import { DataTable } from "../modules/data-table.js";
import { ApiClient } from "../modules/api.js";

export class HabitantesManager {
    static async init() {
        try {
            console.log('Inicializando gestor de habitantes...');
            
            // Cargar opciones primero para los filtros
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
                        format: (value) => value || '0'
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
                        format: (value) => value || '<span class="text-muted">Ninguno</span>'
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
                
                // Acciones por fila (SIEMPRE VISIBLES)
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

            // Configurar eventos adicionales
            this.setupAdditionalEvents();

        } catch (error) {
            console.error('Error inicializando gestor de habitantes:', error);
            this.showError('Error al cargar los datos de habitantes');
        }
    }

    // Cargar opciones para filtros desde API
    static async loadOpciones() {
        try {
            const response = await fetch('http://localhost:5000/api/opciones/', {
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
                }
            });
            
            if (response.ok) {
                const opciones = await response.json();
                this.populateFilterOptions(opciones);
            }
        } catch (error) {
            console.error('Error cargando opciones:', error);
        }
    }

    // Poblar opciones de filtros dinámicamente
    static populateFilterOptions(opciones) {
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
                    <input class="form-check-input sexo-filter" type="checkbox" value="${sexo.Nombre}" id="sexo-${sexo.id}">
                    <label class="form-check-label" for="sexo-${sexo.id}">${sexo.Nombre}</label>
                </div>
            `).join('');
        }

        // Estado civil
        const estadoCivilContainer = document.getElementById('estadoCivilFilterContainer');
        if (estadoCivilContainer && opciones.estadosCiviles) {
            estadoCivilContainer.innerHTML = opciones.estadosCiviles.map(estado => `
                <div class="form-check">
                    <input class="form-check-input estado-civil-filter" type="checkbox" value="${estado.Nombre}" id="ec-${estado.id}">
                    <label class="form-check-label" for="ec-${estado.id}">${estado.Nombre}</label>
                </div>
            `).join('');
        }

        // Población
        const poblacionContainer = document.getElementById('poblacionFilterContainer');
        if (poblacionContainer && opciones.poblaciones) {
            poblacionContainer.innerHTML = opciones.poblaciones.map(poblacion => `
                <div class="form-check">
                    <input class="form-check-input poblacion-filter" type="checkbox" value="${poblacion.Nombre}" id="pob-${poblacion.id}">
                    <label class="form-check-label" for="pob-${poblacion.id}">${poblacion.Nombre}</label>
                </div>
            `).join('');
        }

        // Religión
        const religionContainer = document.getElementById('religionFilterContainer');
        if (religionContainer && opciones.religiones) {
            religionContainer.innerHTML = opciones.religiones.map(religion => `
                <div class="form-check">
                    <input class="form-check-input religion-filter" type="checkbox" value="${religion.Nombre}" id="rel-${religion.id}">
                    <label class="form-check-label" for="rel-${religion.id}">${religion.Nombre}</label>
                </div>
            `).join('');
        }

        // Sacramentos
        const sacramentoSelect = document.getElementById('sacramentoFilter');
        if (sacramentoSelect && opciones.sacramentos) {
            sacramentoSelect.innerHTML = opciones.sacramentos.map(sacramento => `
                <option value="${sacramento.Descripcion}">${sacramento.Descripcion}</option>
            `).join('');
        }
    }

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
                if (e.target.value === 'personalizado') {
                    rangoPersonalizado.style.display = 'block';
                } else {
                    rangoPersonalizado.style.display = 'none';
                }
            });
        });

        // Botón para restablecer columnas por defecto
        document.getElementById('btnResetColumns')?.addEventListener('click', () => {
            this.resetColumnVisibilityToDefault();
        });
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
            // Manejar formato del backend: "Wed, 26 Aug 1959 00:00:00 GMT"
            let fecha = new Date(fechaStr);
            
            if (isNaN(fecha.getTime())) {
                // Intentar otro formato si falla
                fecha = new Date(fechaStr.replace('GMT', '').trim());
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

    // Métodos de acción (mantener igual)
    static verHabitante(habitante) {
        if (typeof Swal !== 'undefined') {
            Swal.fire({
                title: `Habitante: ${habitante.Nombre} ${habitante.Apellido}`,
                html: `
                    <div class="text-start">
                        <p><strong>Documento:</strong> ${habitante.TipoDocumento} ${habitante.NumeroDocumento}</p>
                        <p><strong>Fecha Nacimiento:</strong> ${this.formatFecha(habitante.FechaNacimiento)}</p>
                        <p><strong>Fecha Ingreso:</strong> ${this.formatFecha(habitante.FechaRegistro)}</p>
                        <p><strong>Sexo:</strong> ${habitante.Sexo}</p>
                        <p><strong>Estado Civil:</strong> ${habitante.EstadoCivil}</p>
                        <p><strong>Religión:</strong> ${habitante.Religion}</p>
                        <p><strong>Dirección:</strong> ${habitante.Direccion || 'No registrada'}</p>
                        <p><strong>Teléfono:</strong> ${habitante.Telefono || 'No registrado'}</p>
                        <p><strong>Email:</strong> ${habitante.CorreoElectronico || 'No registrado'}</p>
                    </div>
                `,
                icon: 'info',
                confirmButtonText: 'Cerrar'
            });
        } else {
            alert(`Habitante: ${habitante.Nombre} ${habitante.Apellido}\nDocumento: ${habitante.TipoDocumento} ${habitante.NumeroDocumento}`);
        }
    }

    static editarHabitante(habitante) {
        if (typeof Swal !== 'undefined') {
            Swal.fire({
                title: 'Editar Habitante',
                text: `Editando: ${habitante.Nombre} ${habitante.Apellido}`,
                icon: 'warning',
                showCancelButton: true,
                confirmButtonText: 'Continuar',
                cancelButtonText: 'Cancelar'
            });
        } else {
            if (confirm(`¿Editar a ${habitante.Nombre} ${habitante.Apellido}?`)) {
                console.log('Editando habitante:', habitante);
            }
        }
    }

    static eliminarHabitante(habitante) {
        if (typeof Swal !== 'undefined') {
            Swal.fire({
                title: '¿Está seguro?',
                text: `Va a eliminar a ${habitante.Nombre} ${habitante.Apellido}`,
                icon: 'warning',
                showCancelButton: true,
                confirmButtonColor: '#d33',
                cancelButtonColor: '#3085d6',
                confirmButtonText: 'Sí, eliminar',
                cancelButtonText: 'Cancelar'
            }).then((result) => {
                if (result.isConfirmed) {
                    Swal.fire('Eliminado!', 'El habitante ha sido eliminado.', 'success');
                }
            });
        } else {
            if (confirm(`¿Eliminar a ${habitante.Nombre} ${habitante.Apellido}?`)) {
                alert('Habitante eliminado');
            }
        }
    }

    static nuevoHabitante() {
        if (typeof Swal !== 'undefined') {
            Swal.fire({
                title: 'Nuevo Habitante',
                text: 'Funcionalidad en desarrollo...',
                icon: 'info',
                confirmButtonText: 'Entendido'
            });
        } else {
            alert('Nuevo Habitante - Funcionalidad en desarrollo');
        }
    }

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
});

/* Módulo para la gestión de habitantes - Versión completa
import { ApiClient } from '../modules/api.js';

export class HabitantesManager {
    static currentPage = 1;
    static pageSize = 10;
    static allData = [];
    static filteredData = [];
    static currentFilters = {};

    static init() {
        console.log('Inicializando gestor de habitantes...');
        this.setupEventListeners();
        this.loadHabitantes();
    }

    static setupEventListeners() {
        // Botón para abrir modal de filtros
        document.getElementById('OpenFilterModal')?.addEventListener('click', () => {
            this.openFiltersModal();
        });

        // Select all checkbox
        document.getElementById('SelectAll')?.addEventListener('change', (e) => {
            this.toggleSelectAll(e.target.checked);
        });

        // Paginación
        document.getElementById('pageSizeSelect')?.addEventListener('change', (e) => {
            this.pageSize = parseInt(e.target.value);
            this.currentPage = 1;
            this.renderTable();
        });

        // Botones de paginación
        document.getElementById('prevPage')?.addEventListener('click', () => this.prevPage());
        document.getElementById('nextPage')?.addEventListener('click', () => this.nextPage());
    }

    static async loadHabitantes() {
        try {
            console.log('Cargando habitantes desde API...');
            const response = await ApiClient.getHabitantes();
            
            if (response.success) {
                console.log('Habitantes cargados:', response.habitantes.length);
                this.allData = response.habitantes;
                this.filteredData = [...this.allData];
                this.renderTable();
            } else {
                console.error('Error loading habitantes:', response.message);
                this.showError(response.message || 'Error al cargar los datos de habitantes');
            }
        } catch (error) {
            console.error('Error loading habitantes:', error);
            this.showError('Error de conexión al cargar habitantes');
        }
    }

    static renderTable() {
        const tbody = document.querySelector('#TablaHabitantes tbody');
        if (!tbody) {
            console.error('No se encontró el tbody de la tabla');
            return;
        }

        const startIndex = (this.currentPage - 1) * this.pageSize;
        const endIndex = startIndex + this.pageSize;
        const pageData = this.filteredData.slice(startIndex, endIndex);

        tbody.innerHTML = pageData.map(item => `
            <tr data-id="${item.IdHabitante || item.id || ''}">
                <td><input type="checkbox" class="row-checkbox" data-id="${item.IdHabitante || item.id || ''}" onchange="HabitantesManager.updateBulkActions()"></td>
                <td class="col-id">${item.IdHabitante || item.id || ''}</td>
                <td class="col-tipo-doc">${this.getTipoDocumento(item.IdTipoDocumento || item.tipo_documento)}</td>
                <td class="col-num-doc">${item.NumeroDocumento || item.numero_documento || item.documento || ''}</td>
                <td class="col-nombres">${item.Nombre || item.nombre || ''}</td>
                <td class="col-apellidos">${item.Apellido || item.apellido || ''}</td>
                <td class="col-fecha-nacimiento">${this.formatDate(item.FechaNacimiento || item.fecha_nacimiento)}</td>
                <td class="col-hijos">${item.Hijos || item.hijos || item.numero_hijos || 0}</td>
                <td class="col-sexo">${item.Sexo || item.sexo || ''}</td>
                <td class="col-familia">${this.getNombreFamilia(item.IdGrupoFamiliar || item.familia_id)}</td>
                <td class="col-sector">${this.getSector(item.IdSector || item.sector_id)}</td>
                <td class="col-estado-civil">${this.getEstadoCivil(item.IdEstadoCivil || item.estado_civil_id)}</td>
                <td class="col-poblacion">${this.getTipoPoblacion(item.IdTipoPoblacion || item.tipo_poblacion_id)}</td>
                <td class="col-religion">${item.TipoReligion || item.religion || item.religion_tipo || 'Católico'}</td>
                <td class="col-sacramentos">${this.getSacramentos(item.sacramentos)}</td>
                <td class="col-direccion">${item.Direccion || item.direccion || ''}</td>
                <td class="col-celular">${item.Telefono || item.telefono || item.celular || ''}</td>
                <td class="col-email">${item.CorreoElectronico || item.email || item.correo || ''}</td>
                <td class="col-discapacidad">${item.DiscapacidadParaAsistir || item.discapacidad || 'Ninguna'}</td>
                <td>
                    <div class="action-buttons">
                        <button class="btn btn-edit btn-sm">Editar</button>
                        <button class="btn btn-delete btn-sm">Eliminar</button>
                        <button class="btn btn-print btn-sm">Imprimir</button>
                    </div>
                </td>
            </tr>
        `).join('');

        this.updatePaginationInfo();
        this.updateBulkActions();
    }

    // Helper methods para datos
    static getTipoDocumento(idTipoDoc) {
        const tiposDocumento = {
            1: 'CC', // Cédula de Ciudadanía
            2: 'TI', // Tarjeta de Identidad
            3: 'CE', // Cédula de Extranjería
            4: 'PA', // Pasaporte
            5: 'RC'  // Registro Civil
        };
        return tiposDocumento[idTipoDoc] || 'CC';
    }

    static getNombreFamilia(idGrupoFamiliar) {
        return idGrupoFamiliar ? `Familia ${idGrupoFamiliar}` : 'Sin familia';
    }

    static getSector(idSector) {
        const sectores = {
            1: 'Norte',
            2: 'Sur', 
            3: 'Este',
            4: 'Oeste',
            5: 'Centro'
        };
        return sectores[idSector] || `Sector ${idSector}`;
    }

    static getEstadoCivil(idEstadoCivil) {
        const estados = {
            1: 'Soltero',
            2: 'Casado',
            3: 'Divorciado', 
            4: 'Viudo',
            5: 'Unión Libre'
        };
        return estados[idEstadoCivil] || 'Soltero';
    }

    static getTipoPoblacion(idTipoPoblacion) {
        const tipos = {
            1: 'Infantil',
            2: 'Juvenil',
            3: 'Adulto',
            4: 'Adulto Mayor',
            5: 'Familiar'
        };
        return tipos[idTipoPoblacion] || 'Adulto';
    }

    static getSacramentos(sacramentos) {
        if (!sacramentos || !Array.isArray(sacramentos)) return 'Ninguno';
        
        const nombresSacramentos = sacramentos.map(s => {
            if (typeof s === 'string') return s;
            return s.Descripcion || s.sacramento || s.nombre || 'Sacramento';
        });
        
        return nombresSacramentos.join(', ') || 'Ninguno';
    }

    static formatDate(dateString) {
        if (!dateString) return '';
        try {
            const date = new Date(dateString);
            return date.toLocaleDateString('es-ES');
        } catch (error) {
            return dateString;
        }
    }

    static updatePaginationInfo() {
        const total = this.filteredData.length;
        const start = ((this.currentPage - 1) * this.pageSize) + 1;
        const end = Math.min(start + this.pageSize - 1, total);

        document.getElementById('startRecord').textContent = start;
        document.getElementById('endRecord').textContent = end;
        document.getElementById('totalRecords').textContent = total;
        document.getElementById('currentPage').textContent = this.currentPage;

        // Habilitar/deshabilitar botones de paginación
        document.getElementById('prevPage').disabled = this.currentPage === 1;
        document.getElementById('nextPage').disabled = this.currentPage >= Math.ceil(total / this.pageSize);
    }

    static toggleSelectAll(checked) {
        const checkboxes = document.querySelectorAll('.row-checkbox');
        checkboxes.forEach(checkbox => {
            checkbox.checked = checked;
        });
        this.updateBulkActions();
    }

    static updateBulkActions() {
        const checkboxes = document.querySelectorAll('.row-checkbox:checked');
        const bulkActions = document.getElementById('bulkActions');
        const selectedCount = document.getElementById('selectedCount');
        
        if (checkboxes.length > 0) {
            bulkActions.classList.add('active');
            selectedCount.textContent = `${checkboxes.length} seleccionados`;
        } else {
            bulkActions.classList.remove('active');
        }
        
        // Update select all checkbox state
        const allCheckboxes = document.querySelectorAll('.row-checkbox');
        const selectAll = document.getElementById('SelectAll');
        selectAll.checked = checkboxes.length === allCheckboxes.length;
    }

    static openFiltersModal() {
        const modal = document.getElementById('filtersModal');
        modal.style.display = 'block';
    }

    static closeFiltersModal() {
        const modal = document.getElementById('filtersModal');
        modal.style.display = 'none';
    }

    static applyFilters() {
        this.currentFilters = this.getCurrentFilters();
        this.filterTable();
        this.closeFiltersModal();
    }

    static getCurrentFilters() {
        const filters = {};
        
        // Filtros de texto
        filters.numDoc = document.getElementById('numDocFilter').value.toLowerCase();
        filters.nombres = document.getElementById('nombresFilter').value.toLowerCase();
        filters.apellidos = document.getElementById('apellidosFilter').value.toLowerCase();
        filters.email = document.getElementById('emailFilter').value.toLowerCase();
        filters.celular = document.getElementById('celularFilter').value.toLowerCase();
        filters.direccion = document.getElementById('direccionFilter').value.toLowerCase();
        
        // Filtros de selección múltiple
        filters.tiposDoc = this.getSelectedValues('tipoDoc');
        filters.sectores = this.getSelectedValues('sector');
        filters.estadosCiviles = this.getSelectedValues('estadoCivil');
        filters.religiones = this.getSelectedValues('religion');
        filters.sexos = this.getSelectedValues('sexo');
        filters.poblaciones = this.getSelectedValues('poblacion');
        
        return filters;
    }

    static getSelectedValues(name) {
        return Array.from(document.querySelectorAll(`input[name="${name}"]:checked`))
                   .map(cb => cb.value);
    }

    static filterTable() {
        const rows = document.querySelectorAll('#TablaHabitantes tbody tr');
        const filters = this.currentFilters;
        
        rows.forEach(row => {
            const cells = row.querySelectorAll('td');
            let showRow = true;
            
            // Filtros de texto
            if (filters.numDoc && !cells[3].textContent.toLowerCase().includes(filters.numDoc)) 
                showRow = false;
            if (filters.nombres && !cells[4].textContent.toLowerCase().includes(filters.nombres)) 
                showRow = false;
            if (filters.apellidos && !cells[5].textContent.toLowerCase().includes(filters.apellidos)) 
                showRow = false;
            if (filters.email && !cells[17].textContent.toLowerCase().includes(filters.email)) 
                showRow = false;
            if (filters.celular && !cells[16].textContent.toLowerCase().includes(filters.celular)) 
                showRow = false;
            if (filters.direccion && !cells[15].textContent.toLowerCase().includes(filters.direccion)) 
                showRow = false;
            
            // Filtros de selección múltiple
            if (filters.tiposDoc.length > 0 && !filters.tiposDoc.includes(cells[2].textContent.trim())) 
                showRow = false;
            if (filters.sectores.length > 0 && !filters.sectores.some(sector => cells[10].textContent.includes(sector))) 
                showRow = false;
            if (filters.estadosCiviles.length > 0 && !filters.estadosCiviles.some(estado => cells[11].textContent.includes(estado))) 
                showRow = false;
            if (filters.religiones.length > 0 && !filters.religiones.some(religion => cells[13].textContent.includes(religion))) 
                showRow = false;
            if (filters.sexos.length > 0 && !filters.sexos.some(sexo => cells[8].textContent.includes(sexo))) 
                showRow = false;
            if (filters.poblaciones.length > 0 && !filters.poblaciones.some(poblacion => cells[12].textContent.includes(poblacion))) 
                showRow = false;
            
            row.style.display = showRow ? '' : 'none';
        });
        
        this.currentPage = 1;
        this.updatePaginationInfo();
    }

    static clearAllFilters() {
        // Limpiar campos de texto
        document.getElementById('numDocFilter').value = '';
        document.getElementById('nombresFilter').value = '';
        document.getElementById('apellidosFilter').value = '';
        document.getElementById('emailFilter').value = '';
        document.getElementById('celularFilter').value = '';
        document.getElementById('direccionFilter').value = '';
        
        // Desmarcar checkboxes de filtros
        const filterCheckboxes = document.querySelectorAll('#filtersModal input[type="checkbox"]:not([id^="col-"])');
        filterCheckboxes.forEach(cb => cb.checked = false);
        
        // Resetear filtros
        this.currentFilters = {};
        
        // Mostrar todas las filas
        const rows = document.querySelectorAll('#TablaHabitantes tbody tr');
        rows.forEach(row => row.style.display = '');
        
        this.updatePaginationInfo();
    }

    static nextPage() {
        const totalPages = Math.ceil(this.filteredData.length / this.pageSize);
        if (this.currentPage < totalPages) {
            this.currentPage++;
            this.renderTable();
        }
    }

    static prevPage() {
        if (this.currentPage > 1) {
            this.currentPage--;
            this.renderTable();
        }
    }

    static showError(message) {
        console.error(message);
        alert(message);
    }
}

// Hacer funciones globales disponibles para HTML
window.HabitantesManager = HabitantesManager;
window.toggleColumn = (columnClass) => {
    const columns = document.querySelectorAll(`.col-${columnClass}`);
    const checkbox = document.getElementById(`col-${columnClass}`);
    
    columns.forEach(column => {
        column.style.display = checkbox.checked ? '' : 'none';
    });
};

window.toggleAccordion = (section) => {
    const header = document.querySelector(`#${section}-content`).previousElementSibling;
    const content = document.getElementById(`${section}-content`);
    const icon = header.querySelector('.accordion-icon');
    
    header.classList.toggle('active');
    content.classList.toggle('active');
    
    if (header.classList.contains('active')) {
        icon.style.transform = 'rotate(180deg)';
    } else {
        icon.style.transform = 'rotate(0deg)';
    }
};
*/
/*/ Inicializar cuando el DOM esté listo
document.addEventListener('DOMContentLoaded', () => {
    HabitantesManager.init();
});*/