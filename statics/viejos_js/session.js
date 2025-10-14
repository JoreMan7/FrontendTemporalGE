// session.js

// ✅ Obtener token
export function getToken() {
  return localStorage.getItem("access_token");
}

// ✅ Obtener usuario (devuelve objeto)
export function getUser() {
  const user = localStorage.getItem("user");
  return user ? JSON.parse(user) : null;
}

// ✅ Validar si hay sesión activa
export function isLoggedIn() {
  return !!getToken();
}

// ✅ Cerrar sesión
export function logout() {
  localStorage.removeItem("access_token");
  localStorage.removeItem("user");
  window.location.href = "./index.html"; // Redirigir al login
}
