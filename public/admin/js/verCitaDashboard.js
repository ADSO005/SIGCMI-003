// Botón "ver cita" del dashboard: abre el modal de detalle (components/modals/verCita.pug)
// con los datos de GET /admin/citas/:id.
document.addEventListener("DOMContentLoaded", () => {

    const modal = document.getElementById("modalVerCita");

    if (!modal) return;

    const poner = (id, valor) => {
        document.getElementById(id).textContent = valor;
    };

    const cerrar = () => {
        modal.classList.add("hidden");
        modal.classList.remove("flex");
    };

    document.getElementById("btnCerrarVerCita")?.addEventListener("click", cerrar);

    modal.addEventListener("click", (evento) => {
        if (evento.target === modal) cerrar();
    });

    document.addEventListener("keydown", (evento) => {
        if (evento.key === "Escape") cerrar();
    });

    document.querySelectorAll(".btnVerCita").forEach((boton) => {

        boton.addEventListener("click", async () => {

            try {

                const respuesta = await fetch(`/admin/citas/${boton.dataset.id}`);
                const data = await respuesta.json().catch(() => ({}));

                if (!respuesta.ok) {
                    throw new Error(data.mensaje || "No se pudo obtener la cita.");
                }

                const cita = data.cita;
                const paciente = cita.Paciente?.Usuario;
                const medico = cita.Medico?.Usuario;
                const especialidad = cita.Medico?.Especialidad;

                poner("detalleCitaId", `Cita #${cita.id_cita}`);
                poner("detallePaciente", paciente ? `${paciente.nombres} ${paciente.apellidos}` : "Sin información");
                poner("detalleDocumento", `CC: ${paciente?.numero_documento || "Sin documento"}`);
                poner("detalleCorreoPaciente", paciente?.correo || "Sin correo");
                poner("detalleTelefonoPaciente", paciente?.telefono || "Sin teléfono");

                poner("detalleMedico", medico ? `${medico.nombres} ${medico.apellidos}` : "Sin información");
                poner("detalleEspecialidad", especialidad ? `Especialidad: ${especialidad.nombre}` : "Sin especialidad");
                poner("detalleCorreoMedico", medico?.correo || "Sin correo");
                poner("detalleTelefonoMedico", medico?.telefono || "Sin teléfono");

                poner("detalleFecha", `Fecha: ${cita.fecha}`);
                poner("detalleHora", `Hora: ${String(cita.hora).substring(0, 5)}`);
                poner("detalleEstado", cita.Estado ? cita.Estado.nombre : "Sin estado");
                poner("detalleMotivo", cita.motivo_consulta || "Sin información");

                modal.classList.remove("hidden");
                modal.classList.add("flex");

            } catch (error) {
                console.error("Error al obtener detalle de cita:", error);
                alert(error.message);
            }
        });
    });
});