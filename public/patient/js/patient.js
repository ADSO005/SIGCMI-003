document.addEventListener('DOMContentLoaded', () => {

    const btnNuevaCita = document.getElementById('btnNuevaCita');
    const btnCancelarCita = document.getElementById('btnCancelarCita');
    const formNuevaCita = document.getElementById('formNuevaCita');

    // Verificamos que los elementos existan
    console.log('Botón Nueva Cita:', btnNuevaCita);
    console.log('Formulario:', formNuevaCita);

    // Abrir formulario
    btnNuevaCita.addEventListener('click', () => {

        formNuevaCita.style.display = 'block';

        btnNuevaCita.classList.add('activo');

    });


    // Cerrar formulario
    btnCancelarCita.addEventListener('click', () => {

        formNuevaCita.style.display = 'none';

        btnNuevaCita.classList.remove('activo');

    });

});