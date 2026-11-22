document.addEventListener("DOMContentLoaded", () => {


    const buscarMedico =
        document.getElementById("buscarMedico");

    const filtroEstado =
        document.getElementById("filtroEstadoMedico");

    const filas =
        document.querySelectorAll(".medico-fila");

    const sinResultados =
        document.getElementById("sinResultadosMedicos");


    function filtrarMedicos() {

        const texto = buscarMedico.value;

        const estadoSeleccionado =
            filtroEstado.value
                .toLowerCase()
                .trim();

        let encontrados = 0;


        filas.forEach((fila) => {

            const estado =
                fila.dataset.estado
                    .toLowerCase();


            const coincideTexto = Busqueda.coincide(texto, fila.dataset.nombre, fila.dataset.correo, fila.dataset.documento);


            const coincideEstado =
                !estadoSeleccionado ||
                estado === estadoSeleccionado;


            if (
                coincideTexto &&
                coincideEstado
            ) {

                fila.classList.remove("hidden");

                encontrados++;

            } else {

                fila.classList.add("hidden");
            }

        });


        if (encontrados === 0) {

            sinResultados.classList.remove("hidden");

        } else {

            sinResultados.classList.add("hidden");
        }

    }


    buscarMedico.addEventListener(
        "input",
        filtrarMedicos
    );

    filtroEstado.addEventListener(
        "change",
        filtrarMedicos
    );


    const modalVerMedico =
        document.getElementById("modalVerMedico");

    const btnCerrarVerMedico =
        document.getElementById("btnCerrarVerMedico");

    const btnCerrarVerMedicoFooter =
        document.getElementById("btnCerrarVerMedicoFooter");

    const botonesVerMedico =
        document.querySelectorAll(".btnVerMedico");

    function cerrarModalVerMedico() {

        modalVerMedico.classList.add("hidden");

        modalVerMedico.classList.remove("flex");
    }


    async function verMedico(id) {
        try {
            const respuesta = await fetch(`/admin/medicos/${id}`);
            const data = await respuesta.json();

            if (!respuesta.ok || !data.ok) {
                throw new Error(
                    data.mensaje || "No se pudo obtener el médico."
                );
            }

            const medico = data.medico;
            const usuario = medico.Usuario;
            const especialidad = medico.Especialidad;
            const horarios = medico.Horarios || [];


            document.getElementById("ver_medico_nombre").textContent =
                `${usuario.nombres} ${usuario.apellidos}`;

            document.getElementById("ver_medico_nombre_completo").textContent =
                `${usuario.nombres} ${usuario.apellidos}`;

            document.getElementById("ver_medico_documento").textContent =
                `${usuario.tipo_documento} ${usuario.numero_documento}`;

            document.getElementById("ver_medico_correo").textContent =
                usuario.correo || "No registrado";

            document.getElementById("ver_medico_telefono").textContent =
                usuario.telefono || "No registrado";

            document.getElementById("ver_medico_especialidad").textContent =
                especialidad?.nombre || "Sin especialidad";

            document.getElementById("ver_medico_cedula").textContent =
                medico.cedula_profesional || "No registrada";

            document.getElementById("ver_medico_experiencia").textContent =
                medico.anios_experiencia != null
                    ? `${medico.anios_experiencia} años`
                    : "No registrada";

            document.getElementById("ver_medico_estado").textContent =
                usuario.estado ? "Activo" : "Inactivo";

            document.getElementById("ver_medico_fecha_registro").textContent =
                usuario.fecha_registro
                    ? new Date(usuario.fecha_registro).toLocaleDateString("es-CO")
                    : "No registrada";


            const contenedorHorarios = document.getElementById(
                "ver_medico_horarios"
            );

            contenedorHorarios.innerHTML = "";

            if (horarios.length === 0) {
                contenedorHorarios.innerHTML = `
                <div class="text-center py-8 text-slate-500">
                    <i class="fa-solid fa-calendar-xmark text-3xl mb-3"></i>
                    <p>Este médico no tiene horarios registrados.</p>
                </div>
            `;
            } else {


                const periodos = {};

                horarios.forEach((horario) => {

                    const fechaInicio = horario.fecha_inicio;
                    const fechaFin = horario.fecha_fin;

                    const clave = `${fechaInicio}_${fechaFin}`;

                    if (!periodos[clave]) {
                        periodos[clave] = {
                            fechaInicio,
                            fechaFin,
                            horarios: []
                        };
                    }

                    periodos[clave].horarios.push(horario);
                });


                const ordenDias = {
                    Lunes: 1,
                    Martes: 2,
                    Miercoles: 3,
                    Jueves: 4,
                    Viernes: 5,
                    Sabado: 6,
                    Domingo: 7
                };


                const formatearFecha = (fecha) => {

                    if (!fecha) {
                        return "Fecha no definida";
                    }

                    const partes = fecha.split("-");

                    if (partes.length !== 3) {
                        return fecha;
                    }

                    const [anio, mes, dia] = partes;

                    return `${dia}/${mes}/${anio}`;
                };


                Object.values(periodos).forEach((periodo) => {

                    periodo.horarios.sort((a, b) => {
                        return (
                            (ordenDias[a.dia_semana] || 99) -
                            (ordenDias[b.dia_semana] || 99)
                        );
                    });

                    const periodoHTML = document.createElement("div");

                    periodoHTML.className =
                        "border border-slate-200 rounded-2xl p-5 bg-white shadow-sm";

                    periodoHTML.innerHTML = `
                    <div class="flex items-center gap-3 mb-5">

                        <div class="w-11 h-11 rounded-xl bg-blue-100 flex items-center justify-center">
                            <i class="fa-solid fa-calendar-days text-blue-600 text-lg"></i>
                        </div>

                        <div>
                            <p class="text-sm text-slate-500">
                                Vigencia del horario
                            </p>

                            <p class="font-semibold text-slate-800">
                                ${formatearFecha(periodo.fechaInicio)}
                                hasta
                                ${formatearFecha(periodo.fechaFin)}
                            </p>
                        </div>

                    </div>

                    <div class="space-y-3">

                        ${periodo.horarios.map((horario) => {

                        const horaInicio =
                            horario.hora_inicio
                                ? horario.hora_inicio.substring(0, 5)
                                : "--:--";

                        const horaFin =
                            horario.hora_fin
                                ? horario.hora_fin.substring(0, 5)
                                : "--:--";

                        return `
                                <div class="flex items-center justify-between gap-4 p-4 rounded-xl border border-slate-200 bg-slate-50">

                                    <div class="flex items-center gap-3">

                                        <div class="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center">
                                            <i class="fa-solid fa-clock text-blue-600"></i>
                                        </div>

                                        <div>

                                            <p class="font-semibold text-slate-800">
                                                ${horario.dia_semana}
                                            </p>

                                            <p class="text-sm text-slate-500">
                                                ${horaInicio} - ${horaFin}
                                            </p>

                                        </div>

                                    </div>

                                </div>
                            `;
                    }).join("")}

                    </div>
                `;

                    contenedorHorarios.appendChild(periodoHTML);
                });
            }


            modalVerMedico.classList.remove("hidden");
            modalVerMedico.classList.add("flex");

        } catch (error) {

            console.error("Error al obtener médico:", error);

            alert(error.message);
        }
    }


    botonesVerMedico.forEach((boton) => {

        boton.addEventListener("click", () => {

            const id =
                boton.dataset.id;

            verMedico(id);

        });

    });


    btnCerrarVerMedico.addEventListener(
        "click",
        cerrarModalVerMedico
    );

    btnCerrarVerMedicoFooter.addEventListener(
        "click",
        cerrarModalVerMedico
    );


    modalVerMedico.addEventListener(
        "click",
        (event) => {

            if (
                event.target ===
                modalVerMedico
            ) {

                cerrarModalVerMedico();

            }

        }
    );

}); 