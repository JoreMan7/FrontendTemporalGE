/* ========== FUNCIONES COMPARTIDAS ========== */
function setupBackButton(selector) {
    const backButton = document.querySelector(selector);
    if (backButton) {
        backButton.addEventListener('click', () => window.history.back());
    }
}

function setCurrentDate(elementId) {
    const element = document.getElementById(elementId);
    if (element) {
        const options = { day: 'numeric', month: 'short', year: 'numeric' };
        element.textContent = new Date().toLocaleDateString('es-ES', options);
    }
}

/* ========== INICIALIZACIÓN PRINCIPAL ========== */
document.addEventListener('DOMContentLoaded', function() {
    // Configuración común
    setCurrentDate('CurrentDate');
    setupBackButton('#btnVolver');
    setupBackButton('#IconBack');

    /* ===== LOGIN ===== */
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
                    window.location.href = 'NavInicio.html';
                } else {
                    errorMessage.textContent = response.message;
                    errorMessage.style.display = 'block';
                }
            } catch (error) {
                errorMessage.textContent = 'Error en el servidor. Por favor, intente más tarde.';
                errorMessage.style.display = 'block';
            }
        });

        if (togglePassword && passwordInput) {
            togglePassword.addEventListener('click', function() {
                const type = passwordInput.getAttribute('type') === 'password' ? 'text' : 'password';
                passwordInput.setAttribute('type', type);
                this.classList.toggle('show');
            });
        }

        async function simulateApiCall(documentType, documentNumber, password) {
            await new Promise(resolve => setTimeout(resolve, 1000));
            const validCredentials = {
                cc: { number: '12345678', password: 'iglesia2024' },
                ce: { number: '87654321', password: 'extranjero2024' },
                pa: { number: 'AB123456', password: 'pasaporte2024' },
                pep: { number: 'PEP78901', password: 'permiso2024' }
            };

            const userCredentials = validCredentials[documentType];
            return userCredentials?.number === documentNumber && userCredentials?.password === password
                ? { success: true }
                : { success: false, message: 'Credenciales incorrectas' };
        }
    }

    /* ===== DASHBOARD ===== */
    // Tarjetas clickeables
    document.querySelectorAll(".DashboardCard:not(.Disabled)").forEach(card => {
        card.style.cursor = "pointer";
        card.addEventListener("click", function() {
            const url = this.getAttribute("data-url");
            if (url) window.location.href = url;
        });
    });

    // Botones de ayuda y logout
    document.querySelector('.BtnLogout')?.addEventListener('click', () => {
        window.location.href = 'index.html';
    });

    document.querySelector('.BtnHelp')?.addEventListener('click', () => {
        alert('Sistema de Ayuda\n\nPara más información, contacte al administrador.');
    });

    /* ===== FILTROS Y TABLAS (SECUNDARIO) ===== */
    // Solo se ejecuta si existe el contenedor de filtros
    if (document.getElementById('FilterButton')) {
        // [Todo el código de filtros y datepicker del secundario]
        // Filter dropdown toggle
        const filterButton = document.getElementById('FilterButton');
        const filterMenu = document.getElementById('FilterMenu');

        filterButton.addEventListener('click', function(e) {
            e.stopPropagation();
            filterMenu.classList.toggle('show');
        });

        document.addEventListener('click', function() {
            filterMenu.classList.remove('show');
        });

        filterMenu.addEventListener('click', function(e) {
            e.stopPropagation();
        });

        // Date picker functionality
        const startDateInput = document.getElementById('StartDate');
        const endDateInput = document.getElementById('EndDate');
        
        if (startDateInput && endDateInput) {
            // [Resto del código del datepicker...]
        }

        // Select all checkbox
        document.getElementById('SelectAll')?.addEventListener('change', function() {
            document.querySelectorAll('tbody input[type="checkbox"]').forEach(checkbox => {
                checkbox.checked = this.checked;
            });
        });
    }
});