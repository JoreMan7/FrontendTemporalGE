// Módulo específico para la página de login
import { AuthManager } from '../modules/auth.js';

export class LoginManager {
    static init() {
        const loginForm = document.getElementById('LoginForm');
        if (!loginForm) return;

        this.setupPasswordToggle();
        this.setupFormSubmit(loginForm);
    }

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

    static setupFormSubmit(loginForm) {
        loginForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            
            const documentType = document.getElementById('DocumentType').value;
            const documentNumber = document.getElementById('DocumentNumber').value;
            const password = document.getElementById('Password').value;
            const errorMessage = document.getElementById('ErrorMessage');
            
            errorMessage.textContent = '';
            errorMessage.style.display = 'none';
            
            if (!documentType || !documentNumber || !password) {
                this.showError('Por favor, complete todos los campos.');
                return;
            }
            
            try {
                console.log('Intentando login...');
                const result = await AuthManager.login({
                    documentType,
                    documentNumber,
                    password
                });
                
                if (result.success) {
                    console.log('Login exitoso, redirigiendo...');
                    // User ya se guardó en AuthManager.setUser()
                    window.location.href = './NavInicio.html';
                } else {
                    this.showError(result.message);
                }
            } catch (error) {
                console.error('Login error:', error);
                this.showError('Error de conexión con el servidor.');
            }
        });
    }

    static showError(message) {
        const errorElement = document.getElementById('ErrorMessage');
        if (errorElement) {
            errorElement.textContent = message;
            errorElement.style.display = 'block';
        }
    }
}

// Inicializar login cuando cargue la página
document.addEventListener('DOMContentLoaded', () => {
    LoginManager.init();
});
