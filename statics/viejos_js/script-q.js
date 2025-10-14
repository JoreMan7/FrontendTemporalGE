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
        // Aquí puedes agregar funcionalidad de datepicker si aplica

        document.getElementById('SelectAll')?.addEventListener('change', function () {
            document.querySelectorAll('tbody input[type="checkbox"]').forEach(checkbox => {
                checkbox.checked = this.checked;
            });
        });
    }

    document.querySelector('.profile-btn').addEventListener('click', (e) => {
        e.stopPropagation();
        document.querySelector('.profile-menu').classList.toggle('show');
    });

    document.addEventListener('click', () => {
        document.querySelector('.profile-menu').classList.remove('show');
    });

    // Navegación por pestañas
    const tabButtons = document.querySelectorAll('.tab-btn');
    const tabContents = document.querySelectorAll('.tab-content');

    // Cargar inicialmente el contenido de la pestaña activa
    const firstButton = document.querySelector(".tab-btn.active");
    if (firstButton) {
        loadTabContent(firstButton.dataset.target, firstButton.dataset.url);
    }

    // Listener para cambiar de pestaña
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

    // Función que carga el contenido externo
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

    // Botón AGENDAR
    const btnAgendar = document.getElementById("btnAgendar");
    if (btnAgendar) {
        btnAgendar.addEventListener("click", function (event) {
            event.preventDefault();

            const form = document.getElementById("formulario");

            // Validación básica del formulario
            if (!form.checkValidity()) {
                form.reportValidity();
                return;
            }

            // Obtener valores de los campos
            const solicitante = document.getElementById("solicitante").value.trim();
            const sacerdote = document.getElementById("sacerdote").value.trim();
            const celular = document.getElementById("celular").value.trim();
            const fecha = new Date(document.getElementById("fecha").value).toLocaleDateString('es-ES');
            const motivo = document.getElementById("motivo").value.trim();
            const hora = document.getElementById("hora").value.trim();

            // Validación manual adicional
            if (!solicitante || !sacerdote || !celular || !fecha || !motivo || !hora) {
                Swal.fire({
                    title: 'Campos incompletos',
                    text: 'Por favor, complete todos los campos obligatorios.',
                    icon: 'error',
                    confirmButtonText: 'Entendido'
                });
                return;
            }

            // Validación de celular (ejemplo básico)
            if (!/^[0-9]{9,15}$/.test(celular)) {
                Swal.fire({
                    title: 'Celular inválido',
                    text: 'Por favor ingrese un número de celular válido.',
                    icon: 'error',
                    confirmButtonText: 'Entendido'
                });
                return;
            }

            // Mostrar modal de confirmación
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
                focusConfirm: false,
                backdrop: true,
                allowOutsideClick: false,
                customClass: {
                    confirmButton: 'swal2-confirm-btn',
                    cancelButton: 'swal2-cancel-btn'
                }
            }).then((result) => {
                if (result.isConfirmed) {
                    // Generar número de cita
                    const citaNumero = 'CIT-' + new Date().getFullYear() + '-' + Math.floor(Math.random() * 1000).toString().padStart(4, '0');

                    // Mostrar confirmación exitosa
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
                        willClose: () => {
                            // Resetear formulario al cerrar
                            form.reset();
                        }
                    });
                }
            });
        });
    }

    //Fin del DOM
});

