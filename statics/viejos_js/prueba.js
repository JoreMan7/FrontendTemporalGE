// ====== Funciones para Habitantes ========
function cargarHabitantes() {
    fetch('http://127.0.0.1:5000/api/habitantes') // Asegúrate de que este endpoint exista en tu backend
        .then(response => {
            if (!response.ok) {
                throw new Error('Error en la respuesta del servidor: ' + response.status);
            }
            return response.json();
        })
        .then(data => {
            const tbody = document.querySelector('#TablaHabitantes tbody');
            if (!tbody) {
                console.error('No se encontró el tbody de la tabla');
                return;
            }
            
            tbody.innerHTML = '';
            
            data.forEach(hab => {
                const tr = document.createElement('tr');
                tr.innerHTML = `
                    <td><input type="checkbox" class="row-checkbox"></td>
                    <td>${hab.IdHabitante || ''}</td>
                    <td>${obtenerTipoDocumento(hab.IdTipoDocumento) || ''}</td>
                    <td>${hab.NumeroDocumento || ''}</td>
                    <td>${hab.Nombre || ''}</td>
                    <td>${hab.Apellido || ''}</td>
                    <td>${formatearFecha(hab.FechaNacimiento) || ''}</td>
                    <td>${hab.Hijos !== null ? hab.Hijos : '0'}</td>
                    <td>${hab.Sexo || ''}</td>
                    <td>${obtenerNombreFamilia(hab.IdGrupoFamiliar) || ''}</td>
                    <td>${obtenerSector(hab.IdSector) || ''}</td>
                    <td>${obtenerEstadoCivil(hab.IdEstadoCivil) || ''}</td>
                    <td>${obtenerTipoPoblacion(hab.IdTipoPoblacion) || ''}</td>
                    <td>${hab.TipoReligion || ''}</td>
                    <td>${obtenerSacramentos(hab.IdTipoSacramento) || ''}</td>
                    <td>${hab.Direccion || ''}</td>
                    <td>${hab.Telefono || ''}</td>
                    <td>${hab.CorreoElectronico || ''}</td>
                    <td>${hab.DiscapacidadParaAsistir || 'Ninguna'}</td>
                    <td>
                        <button class="btn btn-sm btn-primary" onclick="verDetalleHabitante(${hab.IdHabitante})">
                            <i class="fas fa-eye"></i> Ver
                        </button>
                    </td>
                `;
                tbody.appendChild(tr);
            });
            
            // Inicializar funcionalidades de la tabla
            inicializarTabla();
        })
        .catch(err => {
            console.error('Error al cargar habitantes:', err);
            alert('Error al cargar los datos: ' + err.message);
        });
}

// Funciones auxiliares para obtener datos relacionados
function obtenerTipoDocumento(idTipoDoc) {
    const tiposDocumento = {
        1: 'Cédula de Ciudadanía',
        2: 'Tarjeta de Identidad',
        3: 'Cédula de Extranjería',
        4: 'Pasaporte',
        5: 'Registro Civil'
    };
    return tiposDocumento[idTipoDoc] || 'Desconocido';
}

function obtenerEstadoCivil(idEstadoCivil) {
    const estadosCiviles = {
        5: 'Soltero',
        6: 'Casado'
        // Agrega más estados según tu base de datos
    };
    return estadosCiviles[idEstadoCivil] || 'No especificado';
}

function formatearFecha(fecha) {
    if (!fecha) return '';
    const date = new Date(fecha);
    return date.toLocaleDateString('es-ES');
}

// Estas funciones necesitarían implementarse según tu base de datos
function obtenerNombreFamilia(idGrupoFamiliar) {
    // Deberías hacer una llamada a tu API para obtener el nombre del grupo familiar
    return idGrupoFamiliar ? `Familia ${idGrupoFamiliar}` : 'Sin familia';
}

function obtenerSector(idSector) {
    const sectores = {
        1: 'Norte',
        2: 'Sur',
        3: 'Este',
        4: 'Oeste',
        5: 'Centro'
    };
    return sectores[idSector] || 'No especificado';
}

function obtenerTipoPoblacion(idTipoPoblacion) {
    const tiposPoblacion = {
        1: 'Infantil',
        2: 'Juvenil',
        3: 'Adultos',
        4: 'Adultos Mayores',
        5: 'Familias'
    };
    return tiposPoblacion[idTipoPoblacion] || 'No especificado';
}

function obtenerSacramentos(idSacramento) {
    const sacramentos = {
        1: 'Bautismo',
        2: 'Comunión',
        3: 'Confirmación',
        4: 'Matrimonio',
        5: 'Unción de los Enfermos'
    };
    return sacramentos[idSacramento] || 'Sin sacramentos';
}

function inicializarTabla() {
    // Seleccionar todos los checkboxes
    const selectAll = document.getElementById('SelectAll');
    const rowCheckboxes = document.querySelectorAll('.row-checkbox');
    
    if (selectAll) {
        selectAll.addEventListener('change', function() {
            rowCheckboxes.forEach(checkbox => {
                checkbox.checked = this.checked;
            });
        });
    }
}

function verDetalleHabitante(idHabitante) {
    // Aquí puedes redirigir a una página de detalle o mostrar un modal
    console.log('Ver detalle del habitante:', idHabitante);
    alert('Ver detalle del habitante con ID: ' + idHabitante);
    // window.location.href = `detalle_habitante.html?id=${idHabitante}`;
}

// ====== Inicialización automática ======
document.addEventListener('DOMContentLoaded', () => {
    // Verificar si estamos en la página de habitantes
    if (document.getElementById('TablaHabitantes')) {
        cargarHabitantes();
    }
    
    // Configurar fecha actual
    const currentDateElement = document.getElementById('CurrentDate');
    if (currentDateElement) {
        const now = new Date();
        currentDateElement.textContent = now.toLocaleDateString('es-ES', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
    }
});

