// Módulo de interfaz de usuario
import { AuthManager } from './auth.js';

export class UIManager {
    static initCommonUI() {
        this.setupNavigation();
        this.setupProfileMenu();
        this.setupLogoutButtons();
        this.setupHelpButtons();
    }

    static setupNavigation() {

        console.log("setupNavigation ejecutado");

        // Tarjetas clickeables (dashboard)
        document.querySelectorAll(".DashboardCard:not(.Disabled)").forEach(card => {
            card.style.cursor = "pointer";
            card.addEventListener("click", () => {
                const url = card.getAttribute("data-url");
                if (url) window.location.href = url;
            });
        });

        // Navegación por pestañas 
        const tabButtons = document.querySelectorAll('.tab-btn');
        const tabContents = document.querySelectorAll('.tab-content');

        if (tabButtons.length > 0) {
            const firstButton = document.querySelector(".tab-btn.active");
            if (firstButton) {
                this.loadTabContent(firstButton.dataset.target, firstButton.dataset.url);
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
                        this.loadTabContent(targetId, btn.dataset.url);
                    }
                });
            });
        }
    }

    static setupProfileMenu() {
        const profileBtn = document.querySelector('.profile-btn');
        if (profileBtn) {
            profileBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                document.querySelector('.profile-menu')?.classList.toggle('show');
            });

            document.addEventListener('click', () => {
                document.querySelector('.profile-menu')?.classList.remove('show');
            });
        }
    }

    static setupLogoutButtons() {
        document.querySelectorAll('.logout')?.forEach(btn => {
            btn.addEventListener('click', () => {
                AuthManager.logout();
            });
        });
    }

    static setupHelpButtons() {
        document.querySelectorAll('.help')?.forEach(btn => {
            btn.addEventListener('click', () => {
                alert('Sistema de Ayuda\n\nPara más información, contacte al administrador.');
            });
        });
    }

    static loadTabContent(id, url) {
        const container = document.getElementById(id);
        if (container && url) {
            container.innerHTML = "Cargando...";
            fetch(url)
                .then(response => response.text())
                .then(html => container.innerHTML = html)
                .catch(() => container.innerHTML = "<p>Error al cargar contenido.</p>");
        }
    }

    // Toggle para mostrar/ocultar contraseña
    static setupPasswordToggle() {
        const togglePassword = document.getElementById('TogglePassword');
        const passwordInput = document.getElementById('Password');
        
        if (togglePassword && passwordInput) {
            togglePassword.addEventListener('click', () => {
                const type = passwordInput.type === 'password' ? 'text' : 'password';
                passwordInput.type = type;
                togglePassword.innerHTML =
                    type === 'password'
                        ? '<i class="bi bi-eye"></i>'
                        : '<i class="bi bi-eye-slash"></i>';
            });
        }
    }
}