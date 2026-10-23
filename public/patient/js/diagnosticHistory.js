document.addEventListener("DOMContentLoaded", () => {
    const diagnosticCards = document.querySelectorAll(".diagnostic-card");
    const detailContainer = document.getElementById("detalle-diagnostico");

    if (!diagnosticCards.length) return;

    diagnosticCards.forEach(card => {
        card.addEventListener("click", () => {
            // 1. Marcar la tarjeta seleccionada visualmente
            diagnosticCards.forEach(c => c.classList.remove("border-indigo-500", "bg-indigo-50/30"));
            card.classList.add("border-indigo-500", "bg-indigo-50/30");

            // 2. Extraer la información desde los atributos data-* de la tarjeta
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

            // 3. Inyectar el formulario de detalles estructurado en el panel derecho
            detailContainer.className = "bg-white p-6 rounded-xl.shadow-sm.border.border-slate-200 sticky top-6 text-left";
            detailContainer.innerHTML = `
                <div class="space-y-5 text-slate-700">
                    <!-- Encabezado del detalle -->
                    <div class="border-b pb-3 flex justify-between items-start">
                        <div>
                            <span class="text-xs font-semibold px-2 py-1 bg-indigo-50 text-indigo-600 rounded-full">${diag.fecha || 'Sin fecha'}</span>
                            <h2 class="text-xl font-bold text-slate-800 mt-2">${diag.diagnostico}</h2>
                            <p class="text-xs text-slate-500 mt-1">Atendido por: <span class="font-medium text-slate-700">Dr(a). ${diag.medico}</span></p>
                        </div>
                        <span class="text-xs text-slate-400">ID: #${diag.id || 'N/A'}</span>
                    </div>

                    <!-- Signos Vitales (Temperatura y Presión arriba, Frecuencia y Peso abajo) -->
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
                        <textarea class="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-sm text-slate-700 focus:outline-none" rows="2" readonly>${diag.diagnostico || 'No registrado'}</textarea>
                    </div>

                    <!-- Tratamiento -->
                    <div>
                        <label class="block text-xs font-bold uppercase text-slate-400 tracking-wider mb-1">Tratamiento</label>
                        <textarea class="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-sm text-slate-700 focus:outline-none" rows="2" readonly>${diag.tratamiento || 'Ninguno'}</textarea>
                    </div>

                    <!-- Prescripción Médica -->
                    <div>
                        <label class="block text-xs font-bold uppercase text-slate-400 tracking-wider mb-1">Prescripción Médica</label>
                        <textarea class="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-sm text-slate-700 focus:outline-none" rows="2" readonly>${diag.prescripcion || 'No registrada'}</textarea>
                    </div>

                    <!-- Notas Adicionales -->
                    <div>
                        <label class="block text-xs font-bold uppercase text-slate-400 tracking-wider mb-1">Notas Adicionales</label>
                        <textarea class="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-sm text-slate-700 focus:outline-none" rows="2" readonly>${diag.observaciones || 'Sin notas adicionales'}</textarea>
                    </div>
                </div>
            `;
        });
    });
});