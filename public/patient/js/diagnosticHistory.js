document.addEventListener("DOMContentLoaded", () => {
    const diagnosticCards = document.querySelectorAll(".diagnostic-card");
    const detailContainer = document.getElementById("detalle-diagnostico");

    if (!diagnosticCards.length || !detailContainer) return;

    const mostrarEstadoVacio = () => {
        diagnosticCards.forEach(c => c.classList.remove("border-indigo-500", "bg-indigo-50/30", "shadow-md"));
        detailContainer.className = "bg-white p-6 rounded-xl shadow-sm border border-slate-200 min-h-[500px] sticky top-6 flex flex-col justify-center items-center text-center";
        detailContainer.innerHTML = `
            <div class="text-slate-400">
                <svg class="w-16 h-16 mx-auto mb-3 text-slate-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012-2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01"></path>
                </svg>
                <p class="text-base font-medium text-slate-600">Selecciona un diagnóstico</p>
                <p class="text-sm text-slate-400">Haz clic en cualquier tarjeta de la izquierda para desplegar el formulario con los detalles completos.</p>
            </div>
        `;
    };

    diagnosticCards.forEach(card => {
        card.addEventListener("click", () => {
            diagnosticCards.forEach(c => c.classList.remove("border-indigo-500", "bg-indigo-50/30", "shadow-md"));
            card.classList.add("border-indigo-500", "bg-indigo-50/30", "shadow-md");

            const diag = {
                id: card.getAttribute("data-id"),
                fecha: card.getAttribute("data-fecha"),
                diagnostico: card.getAttribute("data-diagnostico"),
                medico: card.getAttribute("data-medico"),
                sintomas: card.getAttribute("data-sintomas"),
                temperatura: card.getAttribute("data-temperatura"),
                presion: card.getAttribute("data-presion"),
                frecuencia: card.getAttribute("data-frecuencia"),
                peso: card.getAttribute("data-peso"),
                tratamiento: card.getAttribute("data-tratamiento"),
                prescripcion: card.getAttribute("data-prescripcion"),
                observaciones: card.getAttribute("data-observaciones")
            };

            detailContainer.className = "bg-white p-6 rounded-xl shadow-sm border border-slate-200 sticky top-6 text-left";
            detailContainer.innerHTML = `
                <div class="space-y-5 text-slate-700">
                    <!-- Cabecera idéntica a la izquierda + flecha sutil de retroceso/cierre -->
                    <div class="flex items-start gap-3.5 pb-2">
                        <button id="btn-cerrar-detalle" class="text-slate-300 hover:text-indigo-600 shrink-0 flex items-center transition-colors cursor-pointer mt-3" title="Volver">
                            <svg class="w-4 h-4" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5"></path>
                            </svg>
                        </button>

                        <div class="w-11 h-11 rounded-full bg-slate-100 text-slate-500 shrink-0 flex items-center justify-center mt-0.5">
                            <svg class="w-5 h-5" fill="none" stroke="currentColor" stroke-width="1.8" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 0 0-3.375-3.375h-1.5A1.125 1.125 0 0 1 13.5 7.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 0 0-9-9Z"></path>
                                <path stroke-linecap="round" stroke-linejoin="round" d="M9 12h6m-6 3h6"></path>
                            </svg>
                        </div>

                        <div class="flex-1 min-w-0">
                            <h3 class="font-bold text-slate-800 text-base leading-tight truncate">${diag.diagnostico || 'Diagnóstico sin título'}</h3>
                            <p class="text-xs text-slate-500 font-medium mt-1">${diag.fecha || 'Sin fecha'}</p>
                            <p class="text-xs text-slate-600 font-medium mt-0.5">${diag.medico}</p>
                            <p class="text-xs text-slate-500 mt-1 truncate">
                                <span class="font-semibold text-slate-700">Sintomas:</span> ${diag.sintomas || 'No registrados'}
                            </p>
                        </div>
                    </div>

                    <!-- Signos Vitales (Título perfectamente centrado) -->
                    <div>
                        <h3 class="text-center text-sm font-semibold text-slate-700 mb-3">Signos Vitales</h3>
                        <div class="grid grid-cols-2 gap-4 bg-slate-50 p-4 rounded-xl border border-slate-100">
                            <div>
                                <label class="text-xs text-slate-500 block mb-1">Temperatura</label>
                                <div class="w-full bg-white border border-slate-200 rounded-lg p-2.5 text-sm font-semibold text-slate-800">
                                    ${diag.temperatura ? diag.temperatura + ' °C' : '--'}
                                </div>
                            </div>
                            <div>
                                <label class="text-xs text-slate-500 block mb-1">Presión Arterial</label>
                                <div class="w-full bg-white border border-slate-200 rounded-lg p-2.5 text-sm font-semibold text-slate-800">
                                    ${diag.presion || '--'}
                                </div>
                            </div>
                            <div>
                                <label class="text-xs text-slate-500 block mb-1">Frecuencia Cardíaca</label>
                                <div class="w-full bg-white border border-slate-200 rounded-lg p-2.5 text-sm font-semibold text-slate-800">
                                    ${diag.frecuencia ? diag.frecuencia + ' lpm' : '--'}
                                </div>
                            </div>
                            <div>
                                <label class="text-xs text-slate-500 block mb-1">Peso</label>
                                <div class="w-full bg-white border border-slate-200 rounded-lg p-2.5 text-sm font-semibold text-slate-800">
                                    ${diag.peso ? diag.peso + ' kg' : '--'}
                                </div>
                            </div>
                        </div>
                    </div>

                    <!-- Diagnóstico Completo -->
                    <div>
                        <label class="block text-xs font-bold uppercase text-slate-400 tracking-wider mb-1">Diagnóstico Completo</label>
                        <textarea class="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-sm text-slate-700 focus:outline-none resize-none" rows="2" readonly>${diag.diagnostico || 'No registrado'}</textarea>
                    </div>

                    <!-- Tratamiento -->
                    <div>
                        <label class="block text-xs font-bold uppercase text-slate-400 tracking-wider mb-1">Tratamiento</label>
                        <textarea class="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-sm text-slate-700 focus:outline-none resize-none" rows="2" readonly>${diag.tratamiento || 'Ninguno'}</textarea>
                    </div>

                    <!-- Prescripción Médica -->
                    <div>
                        <label class="block text-xs font-bold uppercase text-slate-400 tracking-wider mb-1">Prescripción Médica</label>
                        <textarea class="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-sm text-slate-700 focus:outline-none resize-none" rows="2" readonly>${diag.prescripcion || 'No registrada'}</textarea>
                    </div>

                    <!-- Notas Adicionales -->
                    <div>
                        <label class="block text-xs font-bold uppercase text-slate-400 tracking-wider mb-1">Notas Adicionales</label>
                        <textarea class="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-sm text-slate-700 focus:outline-none resize-none" rows="2" readonly>${diag.observaciones || 'Sin notas adicionales'}</textarea>
                    </div>
                </div>
            `;

            const btnCerrar = document.getElementById("btn-cerrar-detalle");
            if (btnCerrar) {
                btnCerrar.addEventListener("click", (e) => {
                    e.stopPropagation();
                    mostrarEstadoVacio();
                });
            }
        });
    });
});