import { showToast } from './utilities.js';

export class ProfileManager {
    constructor() {
        this.userData = {
            nombre: "Juan",
            apellido: "Pérez",
            sexo: "Masculino",
            documento: "123456789",
            fechaNacimiento: "1975-09-22"
        };
        this.currentField = null;
    }

    init() {
        this.loadUserData();
        this.setupEventListeners();
        console.log("Módulo de perfil inicializado");
    }

    loadUserData() {
        document.getElementById('nombreField').innerHTML = `${this.userData.nombre} ${this.userData.apellido} <i class="fas fa-chevron-right edit-arrow"></i>`;
        document.getElementById('sexoField').innerHTML = `${this.userData.sexo} <i class="fas fa-chevron-right edit-arrow"></i>`;
        document.getElementById('docField').textContent = this.userData.documento;
        
        // Formatear fecha para mostrar (de YYYY-MM-DD a DD/MM/YYYY)
        const fechaParts = this.userData.fechaNacimiento.split('-');
        const fechaFormateada = `${fechaParts[2]}/${fechaParts[1]}/${fechaParts[0]}`;
        document.getElementById('fechaField').innerHTML = `${fechaFormateada} <i class="fas fa-chevron-right edit-arrow"></i>`;
    }

    setupEventListeners() {
        // Listeners para abrir modales de edición
        document.getElementById('nombreField').addEventListener('click', () => this.openFieldModal('nombre'));
        document.getElementById('sexoField').addEventListener('click', () => this.openFieldModal('sexo'));
        document.getElementById('fechaField').addEventListener('click', () => this.openFieldModal('fecha'));
        
        // Listener para guardar cambios
        document.getElementById('saveFieldBtn').addEventListener('click', () => this.saveField());
        
        // Listener para cerrar modal
        document.getElementById('closeModalBtn').addEventListener('click', () => this.closeModal());
    }

    openFieldModal(field) {
        this.currentField = field;
        const modal = document.getElementById('editModal');
        const title = document.getElementById('modalTitle');
        
        // Ocultar todos los campos primero
        document.getElementById('nombreFields').style.display = 'none';
        document.getElementById('sexoFieldGroup').style.display = 'none';
        document.getElementById('fechaFieldGroup').style.display = 'none';
        
        // Limpiar mensajes de error
        document.querySelectorAll('.error-message').forEach(el => {
            el.style.display = 'none';
        });
        
        // Configurar según el campo
        switch(field) {
            case 'nombre':
                title.textContent = 'Editar Nombre';
                document.getElementById('nombreFields').style.display = 'block';
                document.getElementById('nombreValue').value = this.userData.nombre;
                document.getElementById('apellidoValue').value = this.userData.apellido;
                break;
                
            case 'sexo':
                title.textContent = 'Editar Sexo';
                document.getElementById('sexoFieldGroup').style.display = 'block';
                document.getElementById('fieldSelect').value = this.userData.sexo;
                break;
                
            case 'fecha':
                title.textContent = 'Editar Fecha de Nacimiento';
                document.getElementById('fechaFieldGroup').style.display = 'block';
                document.getElementById('fieldDate').value = this.userData.fechaNacimiento;
                break;
        }
        
        modal.classList.add('show');
    }

    closeModal() {
        document.getElementById('editModal').classList.remove('show');
        this.currentField = null;
    }

    validateField(value, field) {
        switch(field) {
            case 'nombre':
                if (!value.trim()) {
                    return "El nombre no puede estar vacío";
                }
                if (value.trim().length < 2) {
                    return "El nombre debe tener al menos 2 caracteres";
                }
                break;
                
            case 'apellido':
                if (!value.trim()) {
                    return "El apellido no puede estar vacío";
                }
                if (value.trim().length < 2) {
                    return "El apellido debe tener al menos 2 caracteres";
                }
                break;
                
            case 'fecha':
                const birthDate = new Date(value);
                const today = new Date();
                const age = today.getFullYear() - birthDate.getFullYear();
                
                if (isNaN(birthDate.getTime())) {
                    return "Fecha inválida";
                }
                if (age < 13) {
                    return "Debes tener al menos 13 años";
                }
                if (age > 120) {
                    return "Por favor ingresa una fecha de nacimiento válida";
                }
                break;
        }
        
        return null; // Sin errores
    }

    saveField() {
        let isValid = true;
        
        // Validar según el campo actual
        switch(this.currentField) {
            case 'nombre':
                const nombreValue = document.getElementById('nombreValue').value;
                const apellidoValue = document.getElementById('apellidoValue').value;
                
                // Validar nombre
                const nombreError = this.validateField(nombreValue, 'nombre');
                if (nombreError) {
                    document.getElementById('nombreError').textContent = nombreError;
                    document.getElementById('nombreError').style.display = 'block';
                    isValid = false;
                }
                
                // Validar apellido
                const apellidoError = this.validateField(apellidoValue, 'apellido');
                if (apellidoError) {
                    document.getElementById('apellidoError').textContent = apellidoError;
                    document.getElementById('apellidoError').style.display = 'block';
                    isValid = false;
                }
                
                if (isValid) {
                    this.userData.nombre = nombreValue;
                    this.userData.apellido = apellidoValue;
                }
                break;
                
            case 'sexo':
                this.userData.sexo = document.getElementById('fieldSelect').value;
                break;
                
            case 'fecha':
                const fechaValue = document.getElementById('fieldDate').value;
                const fechaError = this.validateField(fechaValue, 'fecha');
                if (fechaError) {
                    document.getElementById('fieldErrorFecha').textContent = fechaError;
                    document.getElementById('fieldErrorFecha').style.display = 'block';
                    isValid = false;
                } else {
                    this.userData.fechaNacimiento = fechaValue;
                }
                break;
        }
        
        if (!isValid) return;
        
        // Actualizar UI
        this.loadUserData();
        
        // Cerrar modal y mostrar confirmación
        this.closeModal();
        showToast('Cambios guardados correctamente', 'success');
        
        // En una aplicación real, aquí enviarías los datos al servidor
        console.log('Datos actualizados:', this.userData);
    }
}