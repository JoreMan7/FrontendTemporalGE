/* ========== FUNCIONES UTILITARIAS ========== */
function setupBackButton(selector) {
    const backButton = document.querySelector(selector);
    backButton?.addEventListener('click', () => window.history.back());
}

function setCurrentDate(elementId, options = { day: 'numeric', month: 'short', year: 'numeric' }) {
    const element = document.getElementById(elementId);
    if (element) {
        element.textContent = new Date().toLocaleDateString('es-ES', options);
    }
}

function isMobile() {
    return window.innerWidth <= 768;
}

/* ========== INICIALIZACIÓN ========== */
document.addEventListener('DOMContentLoaded', () => {
    /* === Fecha actual === */
    setCurrentDate('CurrentDate', { weekday: "long", year: "numeric", month: "long", day: "numeric" });

    /* === Botones de retroceso === */
    setupBackButton('#btnVolver');
    setupBackButton('#IconBack');

    /* === Formulario de Login === */
    const loginForm = document.getElementById('LoginForm');
    if (loginForm) {
        const errorMessage = document.getElementById('ErrorMessage');
        const togglePassword = document.getElementById('TogglePassword');
        const passwordInput = document.getElementById('Password');

        loginForm.addEventListener('submit', async (e) => {
            e.preventDefault();

            const documentType = document.getElementById('DocumentType').value;
            const documentNumber = document.getElementById('DocumentNumber').value;
            const password = passwordInput.value;

            if (!documentType || !documentNumber || !password) {
                errorMessage.textContent = 'Por favor, complete todos los campos.';
                errorMessage.style.display = 'block';
                return;
            }

            try {
                const response = await simulateApiCall(documentType, documentNumber, password);
                if (response.success) {
                    window.location.href = './NavInicio.html';
                } else {
                    errorMessage.textContent = response.message;
                    errorMessage.style.display = 'block';
                }
            } catch {
                errorMessage.textContent = 'Error en el servidor. Por favor, intente más tarde.';
                errorMessage.style.display = 'block';
            }
        });

        togglePassword?.addEventListener('click', function () {
            const type = passwordInput.getAttribute('type') === 'password' ? 'text' : 'password';
            passwordInput.setAttribute('type', type);
            this.classList.toggle('show');
        });

        async function simulateApiCall(documentType, documentNumber, password) {
            await new Promise(resolve => setTimeout(resolve, 1000));
            const validCredentials = {
                cc: { number: '12345678', password: 'iglesia2024' },
                ce: { number: '87654321', password: 'extranjero2024' },
                pa: { number: 'AB123456', password: 'pasaporte2024' },
                pep: { number: 'PEP78901', password: 'permiso2024' }
            };
            const user = validCredentials[documentType];
            return user?.number === documentNumber && user?.password === password
                ? { success: true }
                : { success: false, message: 'Credenciales incorrectas' };
        }
    }

    /* === Tarjetas clickeables (dashboard) === */
    document.querySelectorAll(".DashboardCard:not(.Disabled)").forEach(card => {
        card.style.cursor = "pointer";
        card.addEventListener("click", () => {
            const url = card.getAttribute("data-url");
            if (url) window.location.href = url;
        });
    });

    /* === Botones Ayuda y Cerrar sesión === */
    document.querySelectorAll('.logout')?.forEach(btn => {
        btn.addEventListener('click', () => {
            window.location.href = './index.html';
        });
    });

    document.querySelectorAll('.help')?.forEach(btn => {
        btn.addEventListener('click', () => {
            alert('Sistema de Ayuda\n\nPara más información, contacte al administrador.');
        });
    });

    /* === Filtros y tablas (si existen) === */
    const filterButton = document.getElementById('FilterButton');
    const filterMenu = document.getElementById('FilterMenu');

    if (filterButton && filterMenu) {
        filterButton.addEventListener('click', e => {
            e.stopPropagation();
            filterMenu.classList.toggle('show');
        });

        document.addEventListener('click', () => filterMenu.classList.remove('show'));
        filterMenu.addEventListener('click', e => e.stopPropagation());

        const startDateInput = document.getElementById('StartDate');
        const endDateInput = document.getElementById('EndDate');

        document.getElementById('SelectAll')?.addEventListener('change', function () {
            document.querySelectorAll('tbody input[type="checkbox"]').forEach(checkbox => {
                checkbox.checked = this.checked;
            });
        });
    }

    /* === Menú perfil === */
    const profileBtn = document.querySelector('.profile-btn');
    if (profileBtn) {
        profileBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            document.querySelector('.profile-menu').classList.toggle('show');
        });

        document.addEventListener('click', () => {
            document.querySelector('.profile-menu').classList.remove('show');
        });
    }

    /* === Navegación por pestañas === */
    const tabButtons = document.querySelectorAll('.tab-btn');
    const tabContents = document.querySelectorAll('.tab-content');

    const firstButton = document.querySelector(".tab-btn.active");
    if (firstButton) {
        loadTabContent(firstButton.dataset.target, firstButton.dataset.url);
    }

    tabButtons.forEach(btn => {
        btn.addEventListener("click", () => {
            tabButtons.forEach(b => b.classList.remove("active"));
            btn.classList.add("active");

            tabContents.forEach(c => c.classList.remove("active"));
            const targetId = btn.dataset.target;
            const targetContent = document.getElementById(targetId);
            if (targetContent) {
                targetContent.classList.add("active");
                loadTabContent(targetId, btn.dataset.url);
            }
        });
    });

    function loadTabContent(id, url) {
        const container = document.getElementById(id);
        if (container) {
            container.innerHTML = "Cargando...";
            fetch(url)
                .then(response => response.text())
                .then(html => container.innerHTML = html)
                .catch(() => container.innerHTML = "<p>Error al cargar contenido.</p>");
        }
    }

    /* === Botón AGENDAR === */
    const btnAgendar = document.getElementById("btnAgendar");
    if (btnAgendar) {
        btnAgendar.addEventListener("click", function (event) {
            event.preventDefault();
            const form = document.getElementById("formulario");

            if (!form.checkValidity()) {
                form.reportValidity();
                return;
            }

            const solicitante = document.getElementById("solicitante").value.trim();
            const sacerdote = document.getElementById("sacerdote").value.trim();
            const celular = document.getElementById("celular").value.trim();
            const fecha = new Date(document.getElementById("fecha").value).toLocaleDateString('es-ES');
            const motivo = document.getElementById("motivo").value.trim();
            const hora = document.getElementById("hora").value.trim();

            if (!solicitante || !sacerdote || !celular || !fecha || !motivo || !hora) {
                Swal.fire({
                    title: 'Campos incompletos',
                    text: 'Por favor, complete todos los campos obligatorios.',
                    icon: 'error',
                    confirmButtonText: 'Entendido'
                });
                return;
            }

            if (!/^[0-9]{9,15}$/.test(celular)) {
                Swal.fire({
                    title: 'Celular inválido',
                    text: 'Por favor ingrese un número de celular válido.',
                    icon: 'error',
                    confirmButtonText: 'Entendido'
                });
                return;
            }

            Swal.fire({
                title: 'Confirmar Cita',
                html: `
                    <div class="swal2-content" style="text-align: left;">
                        <p><strong>Solicitante:</strong> ${solicitante}</p>
                        <p><strong>Sacerdote:</strong> ${sacerdote}</p>
                        <p><strong>Celular:</strong> ${celular}</p>
                        <p><strong>Fecha:</strong> ${fecha}</p>
                        <p><strong>Motivo:</strong> ${motivo}</p>
                        <p><strong>Hora:</strong> ${hora}</p>
                    </div>
                `,
                icon: 'question',
                showCancelButton: true,
                confirmButtonText: 'Confirmar Cita',
                cancelButtonText: 'Editar Datos',
                reverseButtons: true,
                allowOutsideClick: false,
            }).then((result) => {
                if (result.isConfirmed) {
                    const citaNumero = 'CIT-' + new Date().getFullYear() + '-' + Math.floor(Math.random() * 1000).toString().padStart(4, '0');
                    Swal.fire({
                        title: '¡Cita Agendada!',
                        html: `
                            <div class="swal2-content" style="text-align: center;">
                                <p>Su cita ha sido registrada con éxito</p>
                                <p><strong>Número de cita:</strong> ${citaNumero}</p>
                                <div style="text-align: left; margin-top: 1rem;">
                                    <p><strong>Detalles:</strong></p>
                                    <p>- Fecha: ${fecha}</p>
                                    <p>- Hora: ${hora}</p>
                                    <p>- Sacerdote: ${sacerdote}</p>
                                </div>
                            </div>
                        `,
                        icon: 'success',
                        confirmButtonText: 'Aceptar',
                        willClose: () => form.reset()
                    });
                }
            });
        });
    }

    /* === MODALES USUARIOS === */
    /* === MODAL PERFIL (editar campos) === */

    // Abrir modal de Crear Usuario
    window.openCreateModal = function () {
        document.getElementById('createUserModal').classList.add('show');
    };

    // Abrir modal de Editar Usuario
    window.openEditModal = function (userId) {
        document.getElementById('editUserModal').classList.add('show');
    };

    // Abrir modal de Eliminar Usuario
    window.openDeleteModal = function (userId, userName) {
        document.getElementById('deleteUserDocument').textContent = userId;
        document.getElementById('deleteUserName').textContent = userName;
        document.getElementById('deleteUserModal').classList.add('show');
    };

    // Abrir modal de Estado de Usuario
    window.openStatusModal = function (userId, userName, currentStatus) {
        document.getElementById('statusUserDocument').textContent = userId;
        document.getElementById('statusUserName').textContent = userName;
        document.getElementById('currentStatus').textContent = currentStatus;

        const statusSelect = document.getElementById('newStatusSelect');
        statusSelect.value = currentStatus.toLowerCase() === 'activo' ? 'inactivo' : 'activo';

        const statusMessage = document.getElementById('statusMessage');
        if (statusSelect.value === 'inactivo') {
            statusMessage.textContent = 'Al desactivar este usuario, no podrá acceder al sistema hasta que sea reactivado.';
            document.getElementById('statusModalTitle').textContent = 'Desactivar Usuario';
        } else {
            statusMessage.textContent = 'Al activar este usuario, podrá acceder al sistema con sus credenciales.';
            document.getElementById('statusModalTitle').textContent = 'Activar Usuario';
        }

        document.getElementById('statusUserModal').classList.add('show');
    };

    // Cerrar modal por ID
    window.closeModal = function (modalId) {
        document.getElementById(modalId).classList.remove('show');
    };

    // Crear Usuario
    window.createUser = function () {
        alert('Usuario creado exitosamente');
        closeModal('createUserModal');
    };

    // Actualizar Usuario
    window.updateUser = function () {
        alert('Usuario actualizado exitosamente');
        closeModal('editUserModal');
    };

    // Eliminar Usuario
    window.deleteUser = function () {
        alert('Usuario eliminado exitosamente');
        closeModal('deleteUserModal');
    };

    // Cambiar Estado de Usuario
    window.changeUserStatus = function () {
        alert('Estado de usuario cambiado exitosamente');
        closeModal('statusUserModal');
    };

    /* === EVENTOS DIRECTOS === */

    // Botón "Crear Usuario"
    const btnCreateUser = document.getElementById("btnCreateUser");
    if (btnCreateUser) {
        btnCreateUser.addEventListener("click", function () {
            openCreateModal();
        });
    }

    // Botón cerrar (X) del modal Crear Usuario
    const closeCreateUser = document.getElementById("closeCreateUser");
    if (closeCreateUser) {
        closeCreateUser.addEventListener("click", function () {
            closeModal("createUserModal");
        });
    }

    /* === CERRAR MODAL AL HACER CLICK FUERA === */
    window.addEventListener("click", function (event) {
        const modals = document.querySelectorAll(".modal");
        modals.forEach(modal => {
            if (event.target === modal) {
                modal.classList.remove("show");
            }
        });
    });



});
document.querySelectorAll('.tab').forEach(tab => {
    tab.addEventListener('click', () => {
        document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
        document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));

        tab.classList.add('active');
        document.getElementById(tab.dataset.tab).classList.add('active');
    });
});

        const ProfileModule = (() => {
            // Datos del usuario (en una aplicación real, estos vendrían de una API)
            let userData = {
                nombre: "Juan",
                apellido: "Pérez",
                sexo: "Masculino",
                documento: "123456789",
                fechaNacimiento: "1975-09-22"
            };
            
            // Campo actualmente siendo editado
            let currentField = null;
            
            // Inicializar el módulo
            function init() {
                loadUserData();
                console.log("Módulo de perfil inicializado");
            }
            
            // Cargar datos del usuario en la interfaz
            function loadUserData() {
                document.getElementById('nombreField').innerHTML = `${userData.nombre} ${userData.apellido} <i class="fas fa-chevron-right edit-arrow"></i>`;
                document.getElementById('sexoField').innerHTML = `${userData.sexo} <i class="fas fa-chevron-right edit-arrow"></i>`;
                document.getElementById('docField').textContent = userData.documento;
                
                // Formatear fecha para mostrar (de YYYY-MM-DD a DD/MM/YYYY)
                const fechaParts = userData.fechaNacimiento.split('-');
                const fechaFormateada = `${fechaParts[2]}/${fechaParts[1]}/${fechaParts[0]}`;
                document.getElementById('fechaField').innerHTML = `${fechaFormateada} <i class="fas fa-chevron-right edit-arrow"></i>`;
            }
            
            // Abrir modal para editar campo
            function openFieldModal(field) {
                currentField = field;
                const modal = document.getElementById('editModal');
                const title = document.getElementById('modalTitle');
                
                // Ocultar todos los campos primero
                document.getElementById('nombreFields').style.display = 'none';
                document.getElementById('sexoFieldGroup').style.display = 'none';
                document.getElementById('fechaFieldGroup').style.display = 'none';
                
                // Limpiar mensajes de error
                document.querySelectorAll('.error-message').forEach(el => {
                    el.style.display = 'none';
                });
                
                // Configurar según el campo
                switch(field) {
                    case 'nombre':
                        title.textContent = 'Editar Nombre';
                        document.getElementById('nombreFields').style.display = 'block';
                        document.getElementById('nombreValue').value = userData.nombre;
                        document.getElementById('apellidoValue').value = userData.apellido;
                        break;
                        
                    case 'sexo':
                        title.textContent = 'Editar Sexo';
                        document.getElementById('sexoFieldGroup').style.display = 'block';
                        document.getElementById('fieldSelect').value = userData.sexo;
                        break;
                        
                    case 'fecha':
                        title.textContent = 'Editar Fecha de Nacimiento';
                        document.getElementById('fechaFieldGroup').style.display = 'block';
                        document.getElementById('fieldDate').value = userData.fechaNacimiento;
                        break;
                }
                
                modal.classList.add('show');
            }
            
            // Cerrar modal
            function closeModal() {
                document.getElementById('editModal').classList.remove('show');
                currentField = null;
            }
            
            // Validar campo según su tipo
            function validateField(value, field) {
                switch(field) {
                    case 'nombre':
                        if (!value.trim()) {
                            return "El nombre no puede estar vacío";
                        }
                        if (value.trim().length < 2) {
                            return "El nombre debe tener al menos 2 caracteres";
                        }
                        break;
                        
                    case 'apellido':
                        if (!value.trim()) {
                            return "El apellido no puede estar vacío";
                        }
                        if (value.trim().length < 2) {
                            return "El apellido debe tener al menos 2 caracteres";
                        }
                        break;
                        
                    case 'fecha':
                        const birthDate = new Date(value);
                        const today = new Date();
                        const age = today.getFullYear() - birthDate.getFullYear();
                        
                        if (isNaN(birthDate.getTime())) {
                            return "Fecha inválida";
                        }
                        if (age < 13) {
                            return "Debes tener al menos 13 años";
                        }
                        if (age > 120) {
                            return "Por favor ingresa una fecha de nacimiento válida";
                        }
                        break;
                }
                
                return null; // Sin errores
            }
            
            // Guardar campo editado
            function saveField() {
                let isValid = true;
                
                // Validar según el campo actual
                switch(currentField) {
                    case 'nombre':
                        const nombreValue = document.getElementById('nombreValue').value;
                        const apellidoValue = document.getElementById('apellidoValue').value;
                        
                        // Validar nombre
                        const nombreError = validateField(nombreValue, 'nombre');
                        if (nombreError) {
                            document.getElementById('nombreError').textContent = nombreError;
                            document.getElementById('nombreError').style.display = 'block';
                            isValid = false;
                        }
                        
                        // Validar apellido
                        const apellidoError = validateField(apellidoValue, 'apellido');
                        if (apellidoError) {
                            document.getElementById('apellidoError').textContent = apellidoError;
                            document.getElementById('apellidoError').style.display = 'block';
                            isValid = false;
                        }
                        
                        if (isValid) {
                            userData.nombre = nombreValue;
                            userData.apellido = apellidoValue;
                        }
                        break;
                        
                    case 'sexo':
                        userData.sexo = document.getElementById('fieldSelect').value;
                        break;
                        
                    case 'fecha':
                        const fechaValue = document.getElementById('fieldDate').value;
                        const fechaError = validateField(fechaValue, 'fecha');
                        if (fechaError) {
                            document.getElementById('fieldErrorFecha').textContent = fechaError;
                            document.getElementById('fieldErrorFecha').style.display = 'block';
                            isValid = false;
                        } else {
                            userData.fechaNacimiento = fechaValue;
                        }
                        break;
                }
                
                if (!isValid) return;
                
                // Actualizar UI
                loadUserData();
                
                // Cerrar modal y mostrar confirmación
                closeModal();
                showToast('Cambios guardados correctamente', 'success');
                
                // En una aplicación real, aquí enviarías los datos al servidor
                console.log('Datos actualizados:', userData);
            }
            
            // Mostrar notificación toast
            function showToast(message, type = 'default') {
                const toast = document.getElementById('toast');
                toast.textContent = message;
                toast.className = 'toast show';
                
                if (type === 'success') {
                    toast.classList.add('success');
                } else if (type === 'error') {
                    toast.classList.add('error');
                }
                
                setTimeout(() => {
                    toast.className = 'toast';
                }, 3000);
            }
            
            // Exponer funciones públicas
            return {
                init,
                openFieldModal,
                closeModal,
                saveField
            };
        })();

        // Inicializar el módulo cuando el DOM esté listo
        document.addEventListener('DOMContentLoaded', ProfileModule.init);


// Script para mostrar
document.getElementById('TogglePassword').addEventListener('click', function() {
    const passwordInput = document.getElementById('Password');
    const type = passwordInput.getAttribute('type') === 'password' ? 'text' : 'password';
    passwordInput.setAttribute('type', type);
    
    // Cambiar el icono
    const icon = this.querySelector('i');
    if (type === 'text') {
        icon.classList.remove('bi-eye');
        icon.classList.add('bi-eye-slash');
    } else {
        icon.classList.remove('bi-eye-slash');
        icon.classList.add('bi-eye');
    }
});

// Manejo del formulario de login
document.getElementById('LoginForm').addEventListener('submit', async function(e) {
    e.preventDefault();
    
    const documentType = document.getElementById('DocumentType').value;
    const documentNumber = document.getElementById('DocumentNumber').value;
    const password = document.getElementById('Password').value;
    const errorMessage = document.getElementById('ErrorMessage');
    const successMessage = document.getElementById('SuccessMessage');
    
    // Limpiar mensajes anteriores
    errorMessage.textContent = '';
    successMessage.textContent = '';
    
    // Validaciones básicas
    if (!documentType) {
        errorMessage.textContent = 'Por favor, seleccione un tipo de documento.';
        return;
    }
    
    if (!documentNumber) {
        errorMessage.textContent = 'Por favor, ingrese su número de documento.';
        return;
    }
    
    if (!password) {
        errorMessage.textContent = 'Por favor, ingrese su contraseña.';
        return;
    }
    
    try {
        // Enviar datos al servidor
        const response = await fetch('/login', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                DocumentType: documentType,
                DocumentNumber: documentNumber,
                Password: password
            })
        });
        
        const data = await response.json();
        
        if (data.success) {
            successMessage.textContent = data.message;
            // Redirigir después de un breve delay
            setTimeout(() => {
                window.location.href = data.redirect;
            }, 1000);
        } else {
            errorMessage.textContent = data.message;
        }
    } catch (error) {
        errorMessage.textContent = 'Error de conexión con el servidor';
        console.error('Error:', error);
    }
});