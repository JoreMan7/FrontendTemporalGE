// usuario.js
import { getUser } from "./session.js";

export async function login(documentType, documentNumber, password) {
  try {
    const response = await fetch("http://127.0.0.1:5000/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        document_type: documentType,
        document_number: documentNumber,
        password: password,
      }),
    });

    const data = await response.json();

    if (!response.ok || !data.success) {
      throw new Error(data.message || "Error en login");
    }

    // ✅ Guardar token y usuario en localStorage
    localStorage.setItem("access_token", data.access_token);
    localStorage.setItem("user", JSON.stringify(data.user));

    // Redirigir al inicio
    window.location.href = "./NavInicio.html";
  } catch (err) {
    console.error("Error en login:", err);
    throw err;
  }
}

// ✅ Mostrar datos en perfil
export function showProfile() {
  const user = getUser();
  if (!user) return;

  const nameElement = document.querySelector(".UserName");
  if (nameElement) nameElement.textContent = user.nombre || "Usuario";
}
