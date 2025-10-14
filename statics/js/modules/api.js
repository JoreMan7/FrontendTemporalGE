// Módulo de API - Versión simplificada
import { AuthManager } from './auth.js';

export class ApiClient {
    static BASE_URL = 'https://nombre-app.onrender.com';

    static async request(endpoint, options = {}) {
        const url = `${this.BASE_URL}${endpoint}`;
        const token = AuthManager.getToken();
        
        const config = {
            headers: {
                'Content-Type': 'application/json',
                'Authorization': token ? `Bearer ${token}` : '',
            },
            ...options
        };

        try {
            console.log(`Request to: ${url}`);
            const response = await fetch(url, config);
            
            if (response.status === 401) {
                console.log('Token inválido - Redirigiendo al login');
                AuthManager.redirectToLogin();
                return { success: false, error: 'Unauthorized', status: 401 };
            }
            
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            
            const data = await response.json();
            return data;
            
        } catch (error) {
            console.error('API request failed:', error);
            return { 
                success: false, 
                error: error.message 
            };
        }
    }

    // Obtener habitantes
    static async getHabitantes() {
        return await this.request('/api/habitantes/');
    }

    // Verificar token
    static async verifyToken() {
        return await this.request('/api/auth/verify');
    }

    // Obtener perfil de usuario
    static async getUserProfile() {
        return await this.request('/api/user/profile');
    }
}
/* api.js
import { getToken, logout } from "../../session.js";

export async function apiFetch(url, options = {}) {
  const token = getToken();

  const headers = {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...options.headers,
  };

  const response = await fetch(url, { ...options, headers });

  // Si el token es inválido → cerrar sesión
  if (response.status === 401) {
    logout();
  }

  return response.json();
}*/
