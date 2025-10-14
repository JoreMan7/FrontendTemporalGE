// Módulo para manejar la UI relacionada con el usuario
import { AuthManager } from './auth.js';

export class UserUIManager {
    // Cargar datos del usuario en la interfaz
    static loadUserData() {
        const user = AuthManager.getUser();
        if (user) {
            // Actualizar nombre de usuario en todos los elementos
            document.querySelectorAll(".UserName").forEach(el => {
                el.textContent = `${user.nombre} ${user.apellido}` || "Usuario";
            });
            
            // Actualizar avatar si está disponible
            if (user.avatar_url) {
                document.querySelectorAll(".UserAvatar, .profile-header img, .profile-btn img").forEach(img => {
                    img.src = user.avatar_url;
                });
            }
            
            // Actualizar rol si está disponible
            if (user.role) {
                document.querySelectorAll(".profile-header small").forEach(el => {
                    el.textContent = user.role;
                });
            }
        }
    }

    // Configurar botones de ayuda
    static setupHelpButtons() {
        document.querySelectorAll(".help").forEach(btn => {
            btn.addEventListener("click", this.showHelp);
        });
    }

    // Configurar botones de cerrar sesión
    static setupLogoutButtons() {
        document.querySelectorAll(".logout").forEach(btn => {
            btn.addEventListener("click", () => {
                AuthManager.logout();
            });
        });
    }

    // Mostrar ayuda
    static showHelp() {
        // Verificar si SweetAlert está disponible
        if (typeof Swal !== 'undefined') {
            Swal.fire({
                title: 'Sistema de Ayuda',
                html: `
                    <div style="text-align: left;">
                        <p><strong>Bienvenido al Sistema de Gestión Eclesial</strong></p>
                        <p>Para asistencia técnica, contacte al administrador del sistema:</p>
                        <ul>
                            <li>📧 Email: soporte@iglesia.com</li>
                            <li>📞 Teléfono: +57 1 234 5678</li>
                        </ul>
                        <p>Horario de atención: Lunes a Viernes, 8:00 AM - 6:00 PM</p>
                    </div>
                `,
                icon: 'info',
                confirmButtonText: 'Entendido',
                confirmButtonColor: '#2c3e50'
            });
        } else {
            // Fallback a alerta nativa si SweetAlert no está disponible
            alert("Sistema de Ayuda\n\nPara más información, contacte al administrador.");
        }
    }

    // Configurar menú de perfil
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

    // Inicializar todas las funcionalidades de usuario
    static init() {
        this.loadUserData();
        this.setupHelpButtons();
        this.setupLogoutButtons();
        this.setupProfileMenu();
    }
}