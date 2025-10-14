// Funciones utilitarias
export function setupBackButton(selector) {
    const backButton = document.querySelector(selector);
    backButton?.addEventListener('click', () => window.history.back());
}

export function setCurrentDate(elementId, options = { 
    weekday: 'long', 
    year: 'numeric', 
    month: 'long', 
    day: 'numeric' 
}) {
    const element = document.getElementById(elementId);
    if (element) {
        element.textContent = new Date().toLocaleDateString('es-ES', options);
    }
}

// Función específica para el formato que necesitas
export function setSpanishLongDate(elementId) {
    const element = document.getElementById(elementId);
    if (element) {
        const now = new Date();
        const options = {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        };
        element.textContent = now.toLocaleDateString('es-ES', options);
    }
}

export function isMobile() {
    return window.innerWidth <= 768;
}

export function showToast(message, type = 'default') {
    // Crear o reutilizar elemento toast si es necesario
    let toast = document.getElementById('toast');
    if (!toast) {
        toast = document.createElement('div');
        toast.id = 'toast';
        toast.className = 'toast';
        document.body.appendChild(toast);
    }
    
    toast.textContent = message;
    toast.className = 'toast show';
    
    if (type === 'success') {
        toast.classList.add('success');
    } else if (type === 'error') {
        toast.classList.add('error');
    }
    
    setTimeout(() => {
        toast.className = 'toast';
    }, 3000);
}

/*export function setupBackButton(selector) {
    const backButton = document.querySelector(selector);
    backButton?.addEventListener('click', () => window.history.back());
}

export function setCurrentDate(elementId, options = { day: 'numeric', month: 'short', year: 'numeric' }) {
    const element = document.getElementById(elementId);
    if (element) {
        element.textContent = new Date().toLocaleDateString('es-ES', options);
    }
}

export function isMobile() {
    return window.innerWidth <= 768;
}*/