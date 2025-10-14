// app.js - CORREGIDO
import { setSpanishLongDate, setupBackButton } from './modules/utilities.js';
import { AuthManager } from './modules/auth.js';
import { UserUIManager } from './modules/user-ui.js';
import { LoginManager } from './pages/login.js';
import { DashboardManager } from './pages/dashboard.js';
import { HabitantesManager } from './pages/habitantes.js';
import { GruposAyudantesManager } from './pages/gruposAyudantes.js';
import { UIManager } from './modules/ui.js';

class App {
    constructor() {
        this.init();
    }

    init() {
        document.addEventListener('DOMContentLoaded', () => {
            console.log('App inicializando...');
            console.log('Página actual:', window.location.pathname);
            console.log('Usuario autenticado:', AuthManager.isAuthenticated());
            
            if (!AuthManager.shouldHaveAccess()) {
                console.log('Redirección bloqueada por shouldHaveAccess');
                return; 
            }
            
            this.setupBasicFeatures();
            UIManager.initCommonUI();
            
            if (!AuthManager.isLoginPage() && AuthManager.isAuthenticated()) {
                UserUIManager.init();
            }
            
            this.initPageSpecificModules();
            this.setupModalHandling();
        });
    }

    setupBasicFeatures() {
        if (document.getElementById('CurrentDate')) {
            setSpanishLongDate('CurrentDate');
        }
        setupBackButton('#btnVolver');
        setupBackButton('#IconBack');

        document.querySelector('.logout')?.addEventListener('click', (e) => {
            e.preventDefault();
            AuthManager.logout();
        });
    }

    initPageSpecificModules() {
        const currentPage = window.location.pathname.split('/').pop();
        const fullPath = window.location.pathname;
        
        console.log('Inicializando módulos para:', currentPage);
        console.log('Ruta completa:', fullPath);

        // Página de login
        if (document.getElementById('LoginForm') || AuthManager.isLoginPage()) {
            console.log('Inicializando login...');
            LoginManager.init();
            return;
        }

        // Página de dashboard/inicio
        if (
            document.querySelector('.DashboardScrollContainer') || 
            currentPage === 'NavInicio.html' ||
            currentPage === 'index.html' ||
            currentPage === '' ||
            fullPath.includes('NavInicio')
        ) {
            console.log('Inicializando dashboard...');
            DashboardManager.init();
        }

        // ✅ DETECCIÓN MEJORADA: Página de Grupos de Ayudantes
        // Verificar múltiples criterios para asegurar la detección correcta
        if (
            (currentPage === 'gruposAyudantes.html' || 
             currentPage === 'GruposAyudantes.html' ||
             fullPath.includes('gruposAyudantes') ||
             fullPath.includes('GruposAyudantes') ||
             document.querySelector('[data-module="gruposAyudantes"]') ||
             document.querySelector('title')?.textContent?.includes('Grupos de Ayudantes'))
        ) {
            console.log('✅ Inicializando módulo de Grupos de Ayudantes...');
            GruposAyudantesManager.init();
            return; // IMPORTANTE: Salir para evitar conflictos
        }

        // ✅ DETECCIÓN MEJORADA: Página de Habitantes
        // Solo inicializar habitantes si estamos específicamente en esa página
        if (
            (currentPage === 'Habitantes.html' || 
             currentPage === 'habitantes.html' ||
             fullPath.includes('Habitantes') ||
             fullPath.includes('habitantes') ||
             document.querySelector('title')?.textContent?.includes('Habitantes'))
        ) {
            console.log('✅ Inicializando módulo de habitantes...');
            HabitantesManager.init();
            return;
        }

        // Página de oficina (si tienes lógica específica)
        if (currentPage === 'NavOficina.html' || document.getElementById('TablaHabitantes')) {
            console.log('Inicializando oficina...');
        }

        // ✅ DETECCIÓN DE FALLBACK: Si hay dataTable pero no se identificó la página
        if (document.getElementById('dataTable') && !window.dataTableInitialized) {
            console.warn('⚠️  Se detectó dataTable pero no se pudo identificar la página específica');
            // Podemos intentar detectar por el contenido de la tabla
            const tableHeaders = document.querySelectorAll('#dataTable th');
            const headerText = Array.from(tableHeaders).map(th => th.textContent).join(' ');
            
            if (headerText.includes('Grupo') && headerText.includes('Líder') && headerText.includes('Miembros')) {
                console.log('✅ Detectado como página de Grupos de Ayudantes por contenido');
                GruposAyudantesManager.init();
            } else if (headerText.includes('Habitante') || headerText.includes('Documento') || headerText.includes('Fecha Nacimiento')) {
                console.log('✅ Detectado como página de Habitantes por contenido');
                HabitantesManager.init();
            }
            
            window.dataTableInitialized = true;
        }
    }

    setupModalHandling() {
        if (AuthManager.isLoginPage()) return;

        const modals = ['filtersModal', 'periodoModal'];
        
        modals.forEach(modalId => {
            const modal = document.getElementById(modalId);
            if (modal) {
                modal.addEventListener('hidden.bs.modal', function () {
                    document.querySelectorAll('.modal-backdrop').forEach(b => b.remove());
                    document.body.style.overflow = 'auto';
                    document.body.style.paddingRight = '0';
                });
                modal.addEventListener('show.bs.modal', function () {
                    modal.style.zIndex = '1060';
                });
            }
        });

        document.addEventListener('show.bs.modal', function () {
            if (!AuthManager.isLoginPage()) document.body.style.overflow = 'hidden';
        });
        document.addEventListener('hidden.bs.modal', function () {
            if (!AuthManager.isLoginPage()) document.body.style.overflow = 'auto';
        });
    }
}

// Inicializar la aplicación
new App();