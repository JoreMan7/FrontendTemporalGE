// agenda.js
document.addEventListener('DOMContentLoaded', () => {
    const btnAgendar = document.getElementById("btnAgendar");
    if (!btnAgendar) return;

    btnAgendar.addEventListener("click", (e) => {
        e.preventDefault();
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
            Swal.fire('Campos incompletos', 'Complete todos los campos', 'error');
            return;
        }

        Swal.fire({
            title: 'Confirmar Cita',
            html: `<p><strong>Solicitante:</strong> ${solicitante}</p>
                   <p><strong>Sacerdote:</strong> ${sacerdote}</p>
                   <p><strong>Fecha:</strong> ${fecha}</p>
                   <p><strong>Hora:</strong> ${hora}</p>`,
            icon: 'question',
            showCancelButton: true,
            confirmButtonText: 'Confirmar'
        }).then(res => {
            if (res.isConfirmed) {
                Swal.fire('¡Cita agendada!', 'Su cita fue registrada', 'success');
                form.reset();
            }
        });
    });
});
