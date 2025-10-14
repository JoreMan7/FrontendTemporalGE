import { showToast } from './utilities.js';

export class FormManager {
    static initLoginForm() {
        const loginForm = document.getElementById('LoginForm');
        if (!loginForm) return;

        const errorMessage = document.getElementById('ErrorMessage');
        const togglePassword = document.getElementById('TogglePassword');
        const passwordInput = document.getElementById('Password');

        // Toggle para mostrar/ocultar contraseña
        togglePassword?.addEventListener('click', function () {
            const type = passwordInput.getAttribute('type') === 'password' ? 'text' : 'password';
            passwordInput.setAttribute('type', type);
            this.classList.toggle('show');
        });

        return loginForm;
    }

    static initCitasForm() {
        const btnAgendar = document.getElementById("btnAgendar");
        if (!btnAgendar) return;

        btnAgendar.addEventListener("click", function (event) {
            event.preventDefault();
            const form = document.getElementById("formulario");

            if (!form.checkValidity()) {
                form.reportValidity();
                return;
            }

            const solicitante = document.getElementById("solicitante").value.trim();
            const sacerdote = document.getElementById("sacerdote").value.trim();
            const celular = document.getElementById("celular").value.trim();
            const fecha = new Date(document.getElementById("fecha").value).toLocaleDateString('es-ES');
            const motivo = document.getElementById("motivo").value.trim();
            const hora = document.getElementById("hora").value.trim();

            if (!solicitante || !sacerdote || !celular || !fecha || !motivo || !hora) {
                Swal.fire({
                    title: 'Campos incompletos',
                    text: 'Por favor, complete todos los campos obligatorios.',
                    icon: 'error',
                    confirmButtonText: 'Entendido'
                });
                return;
            }

            if (!/^[0-9]{9,15}$/.test(celular)) {
                Swal.fire({
                    title: 'Celular inválido',
                    text: 'Por favor ingrese un número de celular válido.',
                    icon: 'error',
                    confirmButtonText: 'Entendido'
                });
                return;
            }

            Swal.fire({
                title: 'Confirmar Cita',
                html: `
                    <div class="swal2-content" style="text-align: left;">
                        <p><strong>Solicitante:</strong> ${solicitante}</p>
                        <p><strong>Sacerdote:</strong> ${sacerdote}</p>
                        <p><strong>Celular:</strong> ${celular}</p>
                        <p><strong>Fecha:</strong> ${fecha}</p>
                        <p><strong>Motivo:</strong> ${motivo}</p>
                        <p><strong>Hora:</strong> ${hora}</p>
                    </div>
                `,
                icon: 'question',
                showCancelButton: true,
                confirmButtonText: 'Confirmar Cita',
                cancelButtonText: 'Editar Datos',
                reverseButtons: true,
                allowOutsideClick: false,
            }).then((result) => {
                if (result.isConfirmed) {
                    const citaNumero = 'CIT-' + new Date().getFullYear() + '-' + Math.floor(Math.random() * 1000).toString().padStart(4, '0');
                    Swal.fire({
                        title: '¡Cita Agendada!',
                        html: `
                            <div class="swal2-content" style="text-align: center;">
                                <p>Su cita ha sido registrada con éxito</p>
                                <p><strong>Número de cita:</strong> ${citaNumero}</p>
                                <div style="text-align: left; margin-top: 1rem;">
                                    <p><strong>Detalles:</strong></p>
                                    <p>- Fecha: ${fecha}</p>
                                    <p>- Hora: ${hora}</p>
                                    <p>- Sacerdote: ${sacerdote}</p>
                                </div>
                            </div>
                        `,
                        icon: 'success',
                        confirmButtonText: 'Aceptar',
                        willClose: () => form.reset()
                    });
                }
            });
        });
    }
}