document.addEventListener('DOMContentLoaded', () => {
    const limites = obtenerLimitesCalendarioCitas()
    const aFecha = valor => {
        const [anio, mes, dia] = valor.split('-').map(Number)
        return new Date(anio, mes - 1, dia)
    }
    const fechaISO = fecha => `${fecha.getFullYear()}-${String(fecha.getMonth() + 1).padStart(2, '0')}-${String(fecha.getDate()).padStart(2, '0')}`
    const meses = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre']
    const hoy = aFecha(limites.min)
    const ultimoMes = new Date(limites.max.slice(0, 4), Number(limites.max.slice(5, 7)) - 1, 1)
    const campos = [
        { fechaId: 'fechaCita', medicoId: 'medicoCita', especialidadId: 'especialidadCita', horaId: 'horaCita' },
        { fechaId: 'fechaReprogramar', medicoId: 'medicoReprogramar', especialidadId: 'especialidadReprogramar', horaId: 'horaReprogramar', citaId: 'idCitaReprogramar' }
    ]

    campos.forEach(({ fechaId, medicoId, especialidadId, horaId, citaId }) => {
        const fecha = document.getElementById(fechaId)
        const medico = document.getElementById(medicoId)
        const especialidad = document.getElementById(especialidadId)
        const hora = document.getElementById(horaId)
        if (!fecha || !medico || !hora) return

        const calendario = document.createElement('section')
        calendario.className = 'rounded-lg border border-slate-200 bg-white p-3 shadow-xl'
        calendario.setAttribute('role', 'dialog')
        calendario.setAttribute('aria-label', 'Días disponibles del médico')
        calendario.style.position = 'fixed'
        calendario.style.zIndex = '1100'
        calendario.style.width = 'min(280px, calc(100vw - 16px))'
        calendario.style.maxHeight = 'min(360px, calc(100dvh - 16px))'
        calendario.style.overflowY = 'auto'
        calendario.style.display = 'none'
        document.body.appendChild(calendario)

        const botonFecha = document.createElement('button')
        botonFecha.type = 'button'
        botonFecha.className = `${fecha.className} flex items-center justify-between gap-3 text-left`
        botonFecha.setAttribute('aria-haspopup', 'dialog')
        botonFecha.setAttribute('aria-expanded', 'false')
        botonFecha.setAttribute('aria-label', 'Seleccionar fecha de la cita')
        botonFecha.setAttribute('aria-controls', `calendario-${fechaId}`)
        botonFecha.innerHTML = '<span class="patient-date-label">Seleccionar fecha</span><span class="patient-date-chevron" aria-hidden="true"><svg viewBox="0 0 20 20" fill="none"><path d="m5 7.5 5 5 5-5" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></svg></span>'
        calendario.id = `calendario-${fechaId}`
        fecha.insertAdjacentElement('afterend', botonFecha)
        fecha.classList.add('hidden')
        fecha.removeAttribute('required')

        const posicionar = () => {
            const rect = botonFecha.getBoundingClientRect()
            const ancho = Math.min(Math.max(rect.width, 240), window.innerWidth - 16)
            Object.assign(calendario.style, {
                top: `${rect.bottom + 4}px`,
                left: `${Math.max(8, Math.min(rect.left, window.innerWidth - ancho - 8))}px`,
                width: `${ancho}px`
            })
        }
        const cerrarCalendario = () => {
            calendario.style.display = 'none'
            botonFecha.setAttribute('aria-expanded', 'false')
        }
        botonFecha.addEventListener('click', () => {
            if (calendario.style.display !== 'none') {
                cerrarCalendario()
                return
            }
            posicionar()
            calendario.style.display = 'block'
            botonFecha.setAttribute('aria-expanded', 'true')
            dibujar()
        })
        document.addEventListener('pointerdown', evento => {
            if (!calendario.contains(evento.target) && !botonFecha.contains(evento.target)) cerrarCalendario()
        })
        document.addEventListener('keydown', evento => {
            if (evento.key === 'Escape' && calendario.style.display !== 'none') {
                cerrarCalendario()
                botonFecha.focus()
            }
        })
        window.addEventListener('resize', posicionar)
        window.addEventListener('scroll', posicionar, true)

        const actualizarEtiqueta = () => {
            const etiqueta = botonFecha.querySelector('.patient-date-label')
            etiqueta.textContent = fecha.value
                ? aFecha(fecha.value).toLocaleDateString('es-CO', { day: '2-digit', month: 'long', year: 'numeric' })
                : 'Seleccionar fecha'
        }
        fecha.addEventListener('change', actualizarEtiqueta)
        let mesActual = new Date(hoy.getFullYear(), hoy.getMonth(), 1)
        let contador = 0

        const dibujar = async () => {
            const token = ++contador
            if (!medico.value) {
                calendario.innerHTML = '<p class="text-xs text-slate-500">Selecciona un médico para consultar sus días disponibles.</p>'
                return
            }
            calendario.innerHTML = '<p class="text-xs text-slate-500">Consultando agenda del médico...</p>'
            try {
                const params = new URLSearchParams({
                    medicoId: medico.value,
                    anio: mesActual.getFullYear(),
                    mes: mesActual.getMonth() + 1
                })
                const idCita = citaId ? document.getElementById(citaId)?.value : ''
                if (idCita) params.set('citaId', idCita)
                const respuesta = await fetch(`/paciente/citas/dias-disponibles?${params}`)
                const resultado = await respuesta.json()
                if (token !== contador) return
                if (!respuesta.ok || !resultado.ok) throw new Error(resultado.mensaje || 'No se pudo consultar la agenda.')

                const diaInicio = new Date(mesActual.getFullYear(), mesActual.getMonth(), 1).getDay()
                const totalDias = new Date(mesActual.getFullYear(), mesActual.getMonth() + 1, 0).getDate()
                calendario.innerHTML = `<div class="mb-1.5 flex items-center justify-between"><button type="button" data-mes="-1" aria-label="Mes anterior" class="rounded-md px-2 py-0.5 text-xs text-slate-500 hover:bg-slate-100">&lsaquo;</button><strong class="text-xs font-medium text-slate-600">${meses[mesActual.getMonth()]} ${mesActual.getFullYear()}</strong><button type="button" data-mes="1" aria-label="Mes siguiente" class="rounded-md px-2 py-0.5 text-xs text-slate-500 hover:bg-slate-100">&rsaquo;</button></div><div class="grid grid-cols-7 gap-0.5 text-center"><span class="py-0.5 text-[10px] font-medium text-slate-400">D</span><span class="py-0.5 text-[10px] font-medium text-slate-400">L</span><span class="py-0.5 text-[10px] font-medium text-slate-400">M</span><span class="py-0.5 text-[10px] font-medium text-slate-400">M</span><span class="py-0.5 text-[10px] font-medium text-slate-400">J</span><span class="py-0.5 text-[10px] font-medium text-slate-400">V</span><span class="py-0.5 text-[10px] font-medium text-slate-400">S</span></div><div class="mt-0.5 grid grid-cols-7 gap-0.5 text-center"></div><p class="mt-1 text-[10px] text-slate-400">Los días grises no tienen horas disponibles.</p>`
                const grilla = calendario.children[2]
                for (let i = 0; i < diaInicio; i++) grilla.append(document.createElement('span'))
                const disponibles = new Set(resultado.dias)
                for (let numero = 1; numero <= totalDias; numero++) {
                    const valor = fechaISO(new Date(mesActual.getFullYear(), mesActual.getMonth(), numero))
                    const habilitado = valor >= limites.min && valor <= limites.max && disponibles.has(valor)
                    const boton = document.createElement('button')
                    boton.type = 'button'
                    boton.textContent = numero
                    boton.disabled = !habilitado
                    boton.className = habilitado
                        ? 'mx-auto h-7 w-7 rounded-md text-xs text-slate-600 hover:bg-indigo-50 focus:ring-2 focus:ring-indigo-300'
                        : 'mx-auto h-7 w-7 cursor-not-allowed rounded-md bg-slate-100/70 text-xs text-slate-300'
                    if (fecha.value === valor) boton.classList.add('bg-indigo-100', 'font-semibold', 'text-indigo-700')
                    if (habilitado) boton.addEventListener('click', () => {
                        fecha.value = valor
                        fecha.dispatchEvent(new Event('change', { bubbles: true }))
                        actualizarEtiqueta()
                        cerrarCalendario()
                        dibujar()
                    })
                    grilla.append(boton)
                }
                calendario.querySelectorAll('[data-mes]').forEach(boton => {
                    boton.disabled = Number(boton.dataset.mes) < 0 && mesActual <= new Date(hoy.getFullYear(), hoy.getMonth(), 1)
                    if (Number(boton.dataset.mes) > 0 && mesActual >= ultimoMes) boton.disabled = true
                    boton.addEventListener('click', () => {
                        mesActual.setMonth(mesActual.getMonth() + Number(boton.dataset.mes))
                        dibujar()
                    })
                })
                if (!resultado.dias.some(dia => dia >= limites.min && dia <= limites.max)) {
                    calendario.querySelector('p').textContent = 'Este médico no tiene días con horas disponibles en el período permitido.'
                }
            } catch (error) {
                if (token === contador) calendario.innerHTML = `<p class="text-xs text-red-600">${error.message}</p>`
            }
        }

        const actualizarMedico = () => {
            fecha.value = ''
            hora.replaceChildren(new Option('Seleccionar hora', ''))
            hora.disabled = true
            dibujar()
        }
        medico.addEventListener('change', actualizarMedico, true)
        especialidad?.addEventListener('change', actualizarMedico)
        dibujar()
    })
})
