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
                    <!-- Encabezado con Botón de Cierre con dimensiones fijas (w-10 h-10) -->
                    <div class="border-b pb-4 flex items-start justify-between gap-4">
                        <div class="flex items-start gap-3 flex-1 min-w-0">
                            <button id="btn-cerrar-detalle" class="w-10 h-10 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors shrink-0 flex items-center justify-center shadow-sm cursor-pointer" title="Cerrar detalles">
                                <svg class="w-5 h-5" fill="none" stroke="currentColor" stroke-width="3" viewBox="0 0 24 24">
                                    <path stroke-linecap="round" stroke-linejoin="round" d="M15 19l-7-7 7-7"></path>
                                </svg>
                            </button>
                            <div class="min-w-0">
                                <span class="inline-block text-xs font-semibold px-2.5 py-1 bg-indigo-50 text-indigo-600 rounded-full mb-1">${diag.fecha || 'Sin fecha'}</span>
                                <h2 class="text-xl font-bold text-slate-800 leading-tight">${diag.diagnostico}</h2>
                                <p class="text-xs text-slate-500 mt-1">Atendido por: <span class="font-medium text-slate-700">${diag.medico}</span></p>
                            </div>
                        </div>
                        <span class="text-xs text-slate-400 font-medium shrink-0 pt-1">ID: #${diag.id || 'N/A'}</span>
                    </div>

                    <!-- Signos Vitales -->
                    <div>
                        <h3 class="text-xs font-bold uppercase text-slate-400 tracking-wider mb-3">Signos Vitales</h3>
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