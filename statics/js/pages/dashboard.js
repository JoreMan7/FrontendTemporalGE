// =====================
// Módulo: DASHBOARD
// =====================
import { ApiClient } from '../modules/api.js';

const $ = (s) => document.querySelector(s);
const $$ = (s) => document.querySelectorAll(s);

const UIX = {
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
    }
};

const state = {
    citas: [],
    currentPage: 0,
    itemsPerPage: 3,
    calendarioFechas: []
};

// =====================
// Cargar Citas para Dashboard
// =====================
async function cargarCitasDashboard() {
    try {
        const data = await ApiClient.request('/api/citas/dashboard/');
        state.citas = data?.citas || [];
        renderCitas();
        renderPaginationDots();
    } catch (error) {
        console.error("Error cargando citas para dashboard:", error);
        $("#citasContainer").innerHTML = `
            <div class="text-center text-muted py-4">
                <i class="fas fa-calendar-times fa-2x mb-3"></i>
                <p>No se pudieron cargar las citas</p>
            </div>
        `;
    }
}

// =====================
// Renderizar Citas
// =====================
function renderCitas() {
    const container = $("#citasContainer");
    
    if (!state.citas.length) {
        container.innerHTML = `
            <div class="text-center text-muted py-4">
                <i class="fas fa-calendar-check fa-2x mb-3"></i>
                <p>No hay citas programadas</p>
                <small>Las próximas citas aparecerán aquí</small>
            </div>
        `;
        return;
    }

    const start = state.currentPage * state.itemsPerPage;
    const end = start + state.itemsPerPage;
    const citasPagina = state.citas.slice(start, end);

    container.innerHTML = citasPagina.map(cita => {
        const fecha = formatFecha(cita.Fecha);
        const hora = cita.Hora || '--:--';
        const padre = cita.PadreNombre || 'Sin asignar';
        const tipo = cita.TipoDescripcion || 'Sin tipo';
        const estado = cita.EstadoDescripcion || 'Pendiente';
        const solicitante = truncarTexto(cita.NombreSolicitante || 'Solicitante', 20);
        const descripcion = truncarTexto(cita.Descripcion || 'Sin descripción', 30);
        
        return `
            <div class="commitment-item d-flex mb-4" style="min-height: 120px; cursor: pointer;" 
                 data-cita-id="${cita.IdAsignacionCita}">
                <div class="commitment-avatar me-3">
                    <i class="bi bi-calendar-event avatar-circle ${getEstadoClass(estado)}"></i>
                </div>
                <div class="commitment-details flex-grow-1">
                    <h5 class="commitment-date mb-2">${fecha}</h5>
                    <p class="commitment-time mb-1">
                        <i class="fas fa-clock me-1"></i><strong>${hora}</strong> - ${tipo}
                    </p>
                    <p class="commitment-location mb-1">
                        <i class="fas fa-user-tie me-1"></i>${padre}
                    </p>
                    <p class="commitment-reminder mb-1">
                        <span class="badge ${getEstadoBadgeClass(estado)}">${estado}</span>
                        - ${solicitante}
                    </p>
                    <p class="commitment-desc small text-muted mb-0">
                        ${descripcion}
                    </p>
                </div>
            </div>
        `;
    }).join('');

    // Agregar eventos de click a las citas
    agregarEventosCitas();
}

// =====================
// Paginación
// =====================
function renderPaginationDots() {
    const totalPages = Math.ceil(state.citas.length / state.itemsPerPage);
    const dotsContainer = $("#paginationDots");
    
    if (totalPages <= 1) {
        dotsContainer.innerHTML = '';
        return;
    }
    
    dotsContainer.innerHTML = Array.from({length: totalPages}, (_, i) => 
        `<span class="dot ${i === state.currentPage ? 'active' : ''}" data-page="${i}"></span>`
    ).join('');
    
    // Agregar eventos a los dots
    $$("#paginationDots .dot").forEach(dot => {
        dot.addEventListener('click', () => {
            state.currentPage = parseInt(dot.dataset.page);
            renderCitas();
            renderPaginationDots();
        });
    });
}

// =====================
// Calendario Funcional
// =====================
async function cargarFechasConCitas() {
    try {
        const hoy = new Date();
        const data = await ApiClient.request(`/api/citas/dashboard/calendario/?mes=${hoy.getMonth() + 1}&año=${hoy.getFullYear()}`);
        state.calendarioFechas = data?.fechas || [];
        resaltarFechasCalendario();
        agregarEventosCalendario();
    } catch (error) {
        console.error("Error cargando fechas del calendario:", error);
    }
}

function resaltarFechasCalendario() {
    $$('.calendar-day').forEach(day => {
        const dia = parseInt(day.textContent);
        if (dia) {
            const hoy = new Date();
            const fecha = new Date(hoy.getFullYear(), hoy.getMonth(), dia);
            const fechaStr = fecha.toISOString().split('T')[0];
            
            if (state.calendarioFechas.includes(fechaStr)) {
                day.classList.add('highlighted');
                day.style.cursor = 'pointer';
                
                // Contador de citas
                const citasDelDia = state.citas.filter(c => c.Fecha === fechaStr).length;
                if (citasDelDia > 0) {
                    day.innerHTML = `${dia}<small class="cita-count">${citasDelDia}</small>`;
                }
            }
        }
    });
}

function agregarEventosCalendario() {
    $$('.calendar-day.highlighted').forEach(day => {
        day.addEventListener('click', async (e) => {
            const dia = parseInt(day.textContent);
            const hoy = new Date();
            const fechaSeleccionada = new Date(hoy.getFullYear(), hoy.getMonth(), dia);
            const fechaStr = fechaSeleccionada.toISOString().split('T')[0];
            
            await mostrarCitasPorFecha(fechaStr);
        });
    });
}

async function mostrarCitasPorFecha(fecha) {
    try {
        const citasDelDia = state.citas.filter(c => c.Fecha === fecha);
        
        if (citasDelDia.length === 0) {
            UIX.toast(`No hay citas para el ${formatFecha(fecha)}`, 'info');
            return;
        }
        
        const modalHtml = `
            <div class="modal fade" id="citasFechaModal" tabindex="-1">
                <div class="modal-dialog">
                    <div class="modal-content">
                        <div class="modal-header">
                            <h5 class="modal-title">
                                <i class="fas fa-calendar-day me-2"></i>
                                Citas del ${formatFecha(fecha)}
                            </h5>
                            <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
                        </div>
                        <div class="modal-body">
                            ${citasDelDia.map(cita => `
                                <div class="card mb-2">
                                    <div class="card-body py-2">
                                        <div class="d-flex justify-content-between align-items-start">
                                            <div>
                                                <h6 class="mb-1">${cita.Hora} - ${cita.TipoDescripcion}</h6>
                                                <p class="mb-1 small">
                                                    <strong>Padre:</strong> ${cita.PadreNombre || 'Sin asignar'}<br>
                                                    <strong>Solicitante:</strong> ${cita.NombreSolicitante || 'No especificado'}
                                                </p>
                                                <span class="badge ${getEstadoBadgeClass(cita.EstadoDescripcion)}">
                                                    ${cita.EstadoDescripcion}
                                                </span>
                                            </div>
                                            <button class="btn btn-sm btn-outline-primary ver-cita-detalle" 
                                                    data-cita-id="${cita.IdAsignacionCita}">
                                                <i class="fas fa-eye"></i>
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            `).join('')}
                        </div>
                    </div>
                </div>
            </div>
        `;
        
        if ($('#citasFechaModal')) $('#citasFechaModal').remove();
        document.body.insertAdjacentHTML('beforeend', modalHtml);
        
        const modal = new bootstrap.Modal($('#citasFechaModal'));
        modal.show();
        
        $$('.ver-cita-detalle').forEach(btn => {
            btn.addEventListener('click', () => {
                const citaId = btn.dataset.citaId;
                modal.hide();
                mostrarDetalleCitaCompleto(citaId);
            });
        });
        
    } catch (error) {
        console.error('Error mostrando citas por fecha:', error);
        UIX.toast('Error al cargar las citas del día', 'error');
    }
}

// =====================
// Modal Detalle Completo Cita
// =====================
async function mostrarDetalleCitaCompleto(citaId) {
    try {
        const data = await ApiClient.request(`/api/citas/${citaId}/`);
        const cita = data?.cita || data;
        
        if (!cita) {
            UIX.toast('Cita no encontrada', 'error');
            return;
        }
        
        const modalHtml = `
            <div class="modal fade" id="detalleCitaModal" tabindex="-1">
                <div class="modal-dialog modal-lg">
                    <div class="modal-content">
                        <div class="modal-header">
                            <h5 class="modal-title">
                                <i class="fas fa-calendar-check me-2"></i>
                                Detalle Completo de Cita
                            </h5>
                            <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
                        </div>
                        <div class="modal-body">
                            <div class="row">
                                <div class="col-md-6">
                                    <h6 class="text-muted">Información Principal</h6>
                                    <dl class="row">
                                        <dt class="col-sm-4">Fecha:</dt>
                                        <dd class="col-sm-8">${formatFecha(cita.Fecha)}</dd>
                                        
                                        <dt class="col-sm-4">Hora:</dt>
                                        <dd class="col-sm-8">${cita.Hora || 'No especificada'}</dd>
                                        

                                        <dt class="col-sm-4">Estado:</dt>
                                        <dd class="col-sm-8">
                                            <span class="badge ${getEstadoBadgeClass(cita.EstadoDescripcion)}">
                                                ${cita.EstadoDescripcion || 'Pendiente'}
                                            </span>
                                        </dd>
                                    </dl>
                                </div>
                                <div class="col-md-6">
                                    <h6 class="text-muted">Asignaciones</h6>
                                    <dl class="row">
                                        <dt class="col-sm-4">Padre:</dt>
                                        <dd class="col-sm-8">${cita.PadreNombre || 'No asignado'}</dd>
                                        
                                                                                <dt class="col-sm-4">Tipo:</dt>
                                        <dd class="col-sm-8">${cita.TipoDescripcion || 'No especificado'}</dd>
                                        
                                    </dl>
                                </div>
                            </div>
                            
                            <hr>
                            
                            <div class="row">
                                <div class="col-12">
                                    <h6 class="text-muted">Información del Solicitante</h6>
                                    <dl class="row">
                                        <dt class="col-sm-3">Nombre:</dt>
                                        <dd class="col-sm-9">${cita.NombreSolicitante || 'No especificado'}</dd>
                                        
                                        <dt class="col-sm-3">Documento:</dt>
                                        <dd class="col-sm-9">
                                            ${cita.TipoDocumentoSolicitante || 'Tipo N/A'}: 
                                            ${cita.NumeroDocumentoSolicitante || 'N/A'}
                                        </dd>
                                        
                                        <dt class="col-sm-3">Celular:</dt>
                                        <dd class="col-sm-9">${cita.Celular || 'No especificado'}</dd>
                                    </dl>
                                </div>
                            </div>
                            
                            <div class="row mt-3">
                                <div class="col-12">
                                    <h6 class="text-muted">Descripción</h6>
                                    <div class="card">
                                        <div class="card-body">
                                            ${cita.Descripcion || '<em class="text-muted">Sin descripción adicional</em>'}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div class="modal-footer">
                            <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">
                                <i class="fas fa-times me-1"></i>Cerrar
                            </button>
                            <button type="button" class="btn btn-primary" onclick="window.location.href='./Oficina/citas.html'">
                                <i class="fas fa-external-link-alt me-1"></i>Ir a Módulo de Citas
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        `;
        
        if ($('#detalleCitaModal')) $('#detalleCitaModal').remove();
        document.body.insertAdjacentHTML('beforeend', modalHtml);
        
        const modal = new bootstrap.Modal($('#detalleCitaModal'));
        modal.show();
        
    } catch (error) {
        console.error('Error cargando detalle de cita:', error);
        UIX.toast('Error al cargar los detalles de la cita', 'error');
    }
}

// =====================
// Eventos
// =====================
function agregarEventosCitas() {
    $$('.commitment-item[data-cita-id]').forEach(item => {
        item.addEventListener('click', () => {
            const citaId = item.dataset.citaId;
            mostrarDetalleCitaCompleto(citaId);
        });
    });
}

function bindEvents() {
    $("#prevCitas")?.addEventListener('click', () => {
        if (state.currentPage > 0) {
            state.currentPage--;
            renderCitas();
            renderPaginationDots();
        }
    });
    
    $("#nextCitas")?.addEventListener('click', () => {
        const totalPages = Math.ceil(state.citas.length / state.itemsPerPage);
        if (state.currentPage < totalPages - 1) {
            state.currentPage++;
            renderCitas();
            renderPaginationDots();
        }
    });
    
    // Fecha actual
    const hoy = new Date().toLocaleDateString('es-ES', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    });
    $("#CurrentDate").textContent = hoy;
}

// =====================
// Utilidades
// =====================
function truncarTexto(texto, maxLength) {
    if (!texto) return 'Sin información';
    if (texto.length <= maxLength) return texto;
    return texto.substring(0, maxLength) + '...';
}

function formatFecha(fechaStr) {
    if (!fechaStr) return 'Fecha no definida';
    
    // Si ya está en español, devolver tal cual
    if (typeof fechaStr === 'string' && 
        /(lunes|martes|miércoles|jueves|viernes|sábado|domingo)/i.test(fechaStr)) {
        return fechaStr;
    }
    
    try {
        let fecha;

        // Detectar y parsear distintos formatos
        if (fechaStr.includes('GMT') || fechaStr.includes('T')) {
            // Formato RFC 1123 o ISO 8601
            fecha = new Date(fechaStr);
        } else if (fechaStr.includes('-')) {
            // Formato SQL o ISO corto
            const [año, mes, dia] = fechaStr.split('-').map(Number);
            fecha = new Date(año, mes - 1, dia);
        } else if (fechaStr.includes('/')) {
            // Formato DD/MM/YYYY
            const [dia, mes, año] = fechaStr.split('/').map(Number);
            fecha = new Date(año, mes - 1, dia);
        } else {
            return fechaStr; // Desconocido
        }

        if (isNaN(fecha.getTime())) return fechaStr;

        // Formatear en español
        const opciones = { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' };
        const fechaFormateada = fecha.toLocaleDateString('es-ES', opciones);

        // Capitalizar primera letra
        return fechaFormateada.charAt(0).toUpperCase() + fechaFormateada.slice(1);

    } catch (error) {
        console.error('Error formateando fecha:', fechaStr, error);
        return fechaStr;
    }
}



function getEstadoClass(estado) {
    const estadoLower = estado.toLowerCase();
    if (estadoLower.includes('conf')) return 'text-success';
    if (estadoLower.includes('pend')) return 'text-warning';
    if (estadoLower.includes('cancel')) return 'text-secondary';
    return 'text-primary';
}

function getEstadoBadgeClass(estado) {
    const estadoLower = estado.toLowerCase();
    if (estadoLower.includes('conf')) return 'bg-success';
    if (estadoLower.includes('pend')) return 'bg-warning';
    if (estadoLower.includes('cancel')) return 'bg-secondary';
    return 'bg-primary';
}

// =====================
// Versículo del día
// =====================
async function loadDailyVerse() {
    const verseElement = document.getElementById('resultado');
    if (!verseElement) return;

    try {
        const clockElement = document.getElementById('live-clock');
        if (clockElement) clockElement.remove();

        const response = await fetch('https://bible-api.com/?random=verse');
        const data = await response.json();
        
        verseElement.innerHTML = `
            <strong>Versículo del día:</strong><br>
            "${data.text}"<br>
            <em>${data.reference}</em>
        `;
    } catch (error) {
        verseElement.innerHTML = `
            <strong>Versículo del día:</strong><br>
            "Porque de tal manera amó Dios al mundo, que ha dado a su Hijo unigénito, para que todo aquel que en él cree, no se pierda, mas tenga vida eterna."<br>
            <em>Juan 3:16</em>
        `;
    }
}

// =====================
// Inicialización
// =====================
export const DashboardManager = {
    async init() {
        console.log("Inicializando Dashboard...");
        bindEvents();
        await cargarCitasDashboard();
        await cargarFechasConCitas();
        await loadDailyVerse();
    }
};