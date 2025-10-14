// Módulo de autenticación - Versión extendida y robusta
export class AuthManager {
    static TOKEN_KEY = 'auth_token';
    static USER_DATA_KEY = 'user_data';
    static REDIRECTING = false;

    // Verificar si el usuario está autenticado
    static isAuthenticated() {
        return !!localStorage.getItem(this.TOKEN_KEY);
    }

    // Guardar token
    static setToken(token) {
        localStorage.setItem(this.TOKEN_KEY, token);
    }

    static getToken() {
        return localStorage.getItem(this.TOKEN_KEY);
    }

    // Guardar y obtener datos de usuario
    static setUser(user) {
        localStorage.setItem(this.USER_DATA_KEY, JSON.stringify(user));
    }

    static getUser() {
        const userData = localStorage.getItem(this.USER_DATA_KEY);
        return userData ? JSON.parse(userData) : null;
    }

    // Redirigir al login
    static redirectToLogin() {
        if (this.REDIRECTING) return;
        this.REDIRECTING = true;
        this.logout();
    }

    // Cerrar sesión
    static logout() {
        localStorage.removeItem(this.TOKEN_KEY);
        localStorage.removeItem(this.USER_DATA_KEY);
        window.location.href = '/Frontend/index.html';
    }

    // Iniciar sesión

    static async login(credentials) {
    try {
        const response = await fetch("http://127.0.0.1:5000/api/auth/login", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                document_type: credentials.documentType,
                document_number: credentials.documentNumber,
                password: credentials.password
            }),
        });

        // Intentar parsear la respuesta como JSON
        let data;
        try {
            data = await response.json();
        } catch (jsonError) {
            console.error('Error parsing JSON:', jsonError);
            return {
                success: false,
                message: 'Error en la respuesta del servidor'
            };
        }

        // Si el login es exitoso
        if (response.ok && data.success && data.access_token) {
            this.setToken(data.access_token);

            if (data.user) {
                this.setUser(data.user);
            }

            return { success: true, user: data.user };
        }

        // Si el login falla (incluye status 400, 401, etc.)
        return {
            success: false,
            message: data.message || 'Credenciales incorrectas'
        };

    } catch (error) {
        console.error('Login error:', error);
        return {
            success: false,
            message: 'Error de conexión con el servidor'
        };
    }
    }

    // Verificar si es página de login
    static isLoginPage() {
        const currentPage = window.location.pathname.split('/').pop();
        return currentPage === 'index.html' || currentPage === '';
    }

    // Control de acceso
    static shouldHaveAccess() {
        if (this.isLoginPage()) {
            if (this.isAuthenticated()) {
                window.location.href = './NavInicio.html';
                return false;
            }
            return true;
        } else {
            return this.isAuthenticated();
        }
    }
}

/* statics/js/auth.js
document.addEventListener("DOMContentLoaded", () => {
  const loginForm = document.getElementById("LoginForm");
  const errorMessage = document.getElementById("ErrorMessage");
  const successMessage = document.getElementById("SuccessMessage");

  if (!loginForm) return;

  loginForm.addEventListener("submit", async (e) => {
    e.preventDefault(); // 👈 evita que el navegador recargue la página

    const documentType = document.getElementById("DocumentType").value;
    const documentNumber = document.getElementById("DocumentNumber").value;
    const password = document.getElementById("Password").value;

    errorMessage.textContent = "";
    successMessage.textContent = "";

    if (!documentType || !documentNumber || !password) {
      errorMessage.textContent = "Todos los campos son obligatorios.";
      return;
    }

    try {
      const response = await fetch("http://127.0.0.1:5000/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          document_type: documentType,   // 👈 ojo: usa los nombres del backend
          document_number: documentNumber,
          password: password
        }),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        // guardar token en localStorage
        localStorage.setItem("token", data.access_token);

        successMessage.textContent = "Login exitoso. Redirigiendo...";
        setTimeout(() => {
          window.location.href = "./NavInicio.html"; // 👈 página a la que quieres ir
        }, 1200);
      } else {
        errorMessage.textContent = data.message || "Credenciales incorrectas.";
      }
    } catch (err) {
      errorMessage.textContent = "Error de conexión con el servidor.";
      console.error(err);
    }
  });

  // Mostrar/Ocultar contraseña
  const togglePassword = document.getElementById("TogglePassword");
  const passwordInput = document.getElementById("Password");
  if (togglePassword && passwordInput) {
    togglePassword.addEventListener("click", () => {
      const type = passwordInput.type === "password" ? "text" : "password";
      passwordInput.type = type;
      togglePassword.innerHTML =
        type === "password"
          ? '<i class="bi bi-eye"></i>'
          : '<i class="bi bi-eye-slash"></i>';
    });
  }
});*/