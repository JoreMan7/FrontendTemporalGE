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
    document.querySelector('.btn-logout')?.addEventListener('click', () => {
        window.location.href = './index.html';
    });

    document.querySelector('.btn-help')?.addEventListener('click', () => {
        alert('Sistema de Ayuda\n\nPara más información, contacte al administrador.');
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

    /* === Sidebar Responsive para móvil === */
    const sidebar = document.getElementById("sidebar");
    const hamburger = document.getElementById("hamburger");
    const sidebarToggle = document.getElementById("sidebarToggle");
    const dropdownMenu = document.getElementById("dropdownMenu");
    const userInfo = document.querySelector(".UserInfo");

    if (sidebar && hamburger) {
        const overlay = document.createElement("div");
        overlay.className = "Overlay";
        document.body.appendChild(overlay);

        hamburger.addEventListener("click", () => {
            sidebar.classList.toggle("mobile-visible");
            overlay.classList.toggle("show");
        });

        sidebarToggle?.addEventListener("click", () => {
            sidebar.classList.remove("mobile-visible");
            overlay.classList.remove("show");
        });

        overlay.addEventListener("click", () => {
            sidebar.classList.remove("mobile-visible");
            overlay.classList.remove("show");
        });

        if (userInfo && dropdownMenu) {
            userInfo.addEventListener("click", (event) => {
                event.stopPropagation();
                dropdownMenu.classList.toggle("show");
            });

            document.addEventListener("click", (event) => {
                if (!event.target.closest(".UserInfo")) {
                    dropdownMenu.classList.remove("show");
                }
            });
        }

        window.addEventListener("resize", () => {
            if (!isMobile()) {
                sidebar.classList.remove("mobile-visible");
                overlay.classList.remove("show");
            }
        });
    }
});
