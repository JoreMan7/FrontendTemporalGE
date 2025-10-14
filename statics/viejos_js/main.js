// main.js
import { checkSession, getUser, logout } from "./auth.js";

document.addEventListener("DOMContentLoaded", () => {
    // 1. Verificar sesión
    checkSession();

    // 2. Mostrar datos de usuario en la interfaz
    const user = getUser();
    if (user) {
        document.querySelectorAll(".UserName").forEach(el => {
            el.textContent = `${user.nombre} ${user.apellido}` || "Usuario";
        });
    }

    // 3. Botón de cerrar sesión
    document.querySelectorAll(".logout").forEach(btn => {
        btn.addEventListener("click", () => {
            logout();
        });
    });

    // 4. Botón de ayuda
    document.querySelectorAll(".help").forEach(btn => {
        btn.addEventListener("click", () => {
            alert("Sistema de Ayuda\n\nPara más información, contacte al administrador.");
        });
    });
});
