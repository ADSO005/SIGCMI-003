// Traducciones del contenido y los controles de la página pública.
const traducciones = {
    'Navegación principal': 'Main navigation',
    'Funcionalidades': 'Features',
    'Para quién es': 'Who it is for',
    'Cómo funciona': 'How it works',
    'Iniciar sesión': 'Sign in',
    'Registro pacientes': 'Patient registration',
    'Gestión de salud más sencilla': 'Simpler health management',
    'Tu salud,': 'Your health,',
    'mejor conectada.': 'better connected.',
    'Un espacio para organizar citas y acompañar la atención médica, conectando a pacientes y profesionales de salud.': 'A place to organize appointments and support medical care, connecting patients and healthcare professionals.',
    'Registrarme como paciente': 'Register as a patient',
    'Conocer SIGCMI': 'Discover SIGCMI',
    'La información que necesitas, en un solo lugar.': 'The information you need, all in one place.',
    'Ilustración de una agenda de citas': 'Illustration of an appointment calendar',
    'Mi espacio de salud': 'My health space',
    'Tu agenda, organizada': 'Your schedule, organized',
    'Todo comienza aquí': 'It all starts here',
    'Consulta y sigue tus citas fácilmente': 'View and keep track of your appointments easily',
    'Tu próxima cita': 'Your next appointment',
    'Revisa los detalles en tu portal': 'Check the details in your portal',
    'Tu agenda': 'Your schedule',
    'Historial': 'History',
    'Consulta tu información': 'View your information',
    'Perfil': 'Profile',
    'Mantén tus datos al día': 'Keep your details up to date',
    'Una atención más conectada': 'More connected care',
    'Todo en un mismo lugar': 'Everything in one place',
    'Herramientas que acompañan cada atención': 'Tools that support every visit',
    'Desde la organización de citas hasta el seguimiento de la atención, SIGCMI reúne lo esencial para el día a día.': 'From appointment scheduling to care follow-up, SIGCMI brings everyday essentials together.',
    'Citas organizadas': 'Organized appointments',
    'Consulta el estado y los detalles de las citas en un espacio claro y fácil de usar.': 'Check appointment status and details in a clear, easy-to-use space.',
    'Seguimiento de la atención': 'Care follow-up',
    'Accede a información de diagnósticos y prescripciones según tu perfil dentro de la plataforma.': 'Access diagnosis and prescription information according to your role on the platform.',
    'Agendas y horarios': 'Schedules and availability',
    'Facilita la organización de horarios y la gestión de la agenda para el equipo de salud.': 'Make scheduling and calendar management easier for the healthcare team.',
    'Un equipo conectado': 'A connected team',
    'Una plataforma, diferentes necesidades': 'One platform, different needs',
    'Cada persona cuenta con un espacio pensado para sus tareas y su participación en el proceso de atención.': 'Everyone has a space designed for their tasks and their role in the care process.',
    'Para pacientes': 'For patients',
    'Consulta tus citas, tu historial de diagnósticos y administra tu perfil.': 'View your appointments and diagnosis history and manage your profile.',
    'Para profesionales de salud': 'For healthcare professionals',
    'Organiza tu agenda y registra información relacionada con la atención de tus pacientes. El administrador crea las cuentas de los médicos.': "Organize your schedule and record information about your patients' care. The administrator creates doctors' accounts.",
    'Comienza fácilmente': 'Get started easily',
    'Tu espacio de salud en tres pasos': 'Your health space in three steps',
    'Accede a las herramientas disponibles para tu perfil y mantén tu información organizada.': 'Access the tools available for your role and keep your information organized.',
    'Crea tu cuenta de paciente': 'Create your patient account',
    'Si eres paciente, regístrate y sigue los pasos de confirmación para comenzar. Si eres médico, solicita tu cuenta al administrador.': 'If you are a patient, register and follow the confirmation steps to get started. If you are a doctor, request an account from the administrator.',
    'Ingresa a tu portal': 'Enter your portal',
    'Inicia sesión para acceder al espacio correspondiente a tu perfil.': 'Sign in to access the space for your role.',
    'Mantente al día': 'Stay up to date',
    'Consulta tu información y utiliza las herramientas disponibles para ti.': 'View your information and use the tools available to you.',
    'La atención comienza con una mejor organización.': 'Better care starts with better organization.',
    'Ingresa a SIGCMI y descubre tu espacio.': 'Sign in to SIGCMI and discover your space.',
    'Volver al inicio': 'Back to top',
    'Sistema de gestión de citas médicas.': 'Medical appointment management system.',
    'Enlaces del pie de página': 'Footer links',
    'Abrir opciones de accesibilidad': 'Open accessibility options',
    'Opciones de accesibilidad': 'Accessibility options',
    'Accesibilidad': 'Accessibility',
    'Aumentar texto': 'Increase text size',
    'Aumentar contraste': 'Increase contrast',
    'Subrayar enlaces': 'Underline links',
    'Reducir movimiento': 'Reduce motion',
    'Restablecer ajustes': 'Reset settings',
    'SIGCMI, inicio': 'SIGCMI, home',
    'SIGCMI | Tu salud, mejor conectada': 'SIGCMI | Your health, better connected',
    'SIGCMI conecta pacientes y profesionales de salud en un solo lugar.': 'SIGCMI connects patients and healthcare professionals in one place.',
    'Español': 'Spanish',
    'Idioma / Language': 'Language / Idioma',
    'Abrir menú de navegación': 'Open navigation menu',
    'Menú de accesibilidad': 'Accessibility menu',
    'Cerrar opciones de accesibilidad': 'Close accessibility options',
    'Resaltar enlaces': 'Highlight links',
    'Espaciado de texto': 'Text spacing',
    'Fuente legible': 'Readable font',
    'Cursor grande': 'Large cursor',
    'Altura de la línea': 'Line height',
    'Reducir saturación': 'Reduce saturation',
    'Inicio': 'Home'
}

// Menú de navegación para dispositivos móviles.
document.addEventListener('DOMContentLoaded', () => {
    const boton = document.querySelector('.nav-toggle')
    const navegacion = document.getElementById('homepage-nav')
    const cerrarMenu = () => {
        boton.setAttribute('aria-expanded', 'false')
        navegacion.classList.remove('is-open')
    }
    boton.addEventListener('click', () => {
        const abierto = boton.getAttribute('aria-expanded') !== 'true'
        boton.setAttribute('aria-expanded', String(abierto))
        navegacion.classList.toggle('is-open', abierto)
    })
    navegacion.addEventListener('click', (evento) => {
        if (evento.target.closest('a')) cerrarMenu()
    })
    document.addEventListener('keydown', (evento) => {
        if (evento.key === 'Escape' && boton.getAttribute('aria-expanded') === 'true') {
            cerrarMenu()
            boton.focus()
        }
    })
    window.addEventListener('resize', () => {
        if (window.innerWidth > 850) cerrarMenu()
    })
})

// Muestra el botón de volver al inicio únicamente cuando hay desplazamiento.
document.addEventListener('DOMContentLoaded', () => {
    const botonInicio = document.querySelector('.back-to-top')
    const actualizarBotonInicio = () => {
        botonInicio.hidden = window.scrollY <= 0
    }
    window.addEventListener('scroll', actualizarBotonInicio, { passive: true })
    actualizarBotonInicio()
})

// Controles de accesibilidad y traducción del contenido del homepage.
document.addEventListener('DOMContentLoaded', () => {
    const botonAccesibilidad = document.querySelector('.accessibility-toggle')
    const panel = document.getElementById('accessibility-panel')
    const controlTexto = document.getElementById('larger-text')
    const controlContraste = document.getElementById('high-contrast')
    const botonEnlaces = document.getElementById('underline-links')
    const selectorIdioma = document.getElementById('language')
    // Conserva los textos y atributos originales para poder volver al español.
    const textosTraducibles = []
    const recorridoTextos = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT)
    while (recorridoTextos.nextNode()) {
        const node = recorridoTextos.currentNode
        if (node.parentElement.closest('script, style')) continue
        const original = node.nodeValue.trim()
        if (traducciones[original]) textosTraducibles.push({ node, original, text: node.nodeValue })
    }
    const atributosTraducibles = []
    document.querySelectorAll('[aria-label], [title], meta[name="description"]').forEach((element) => {
        ['aria-label', 'title', 'content'].forEach((attribute) => {
            const value = element.getAttribute(attribute)
            if (traducciones[value]) atributosTraducibles.push({ element, attribute, value })
        })
    })
    const tituloOriginal = document.title
    const cambiarIdioma = (idioma) => {
        const enIngles = idioma === 'en'
        document.documentElement.lang = idioma
        document.title = enIngles ? traducciones[tituloOriginal] : tituloOriginal
        textosTraducibles.forEach((item) => {
            item.node.nodeValue = enIngles ? item.text.replace(item.original, traducciones[item.original]) : item.text
        })
        atributosTraducibles.forEach((item) => {
            item.element.setAttribute(item.attribute, enIngles ? traducciones[item.value] : item.value)
        })
    }
    selectorIdioma.addEventListener('change', () => { cambiarIdioma(selectorIdioma.value) })
    const establecerOpcion = (boton, nombreClase, activado) => {
        document.body.classList.toggle(nombreClase, activado)
        boton.setAttribute('aria-pressed', String(activado))
    }
    botonAccesibilidad.addEventListener('click', () => {
        panel.hidden = !panel.hidden
        botonAccesibilidad.setAttribute('aria-expanded', String(!panel.hidden))
    })
    document.getElementById('close-accessibility').addEventListener('click', () => {
        panel.hidden = true
        botonAccesibilidad.setAttribute('aria-expanded', 'false')
        botonAccesibilidad.focus()
    })
    // Cada botón activa o desactiva la clase de CSS asociada.
    const opcionesAdicionales = {
        'text-spacing': 'text-spacing', 'readable-font': 'readable-font',
        'large-cursor': 'large-cursor', 'line-height': 'line-height', 'saturation': 'low-saturation'
    }
    Object.keys(opcionesAdicionales).forEach((id) => {
        const boton = document.getElementById(id)
        boton.addEventListener('click', () => {
            establecerOpcion(boton, opcionesAdicionales[id], boton.getAttribute('aria-pressed') !== 'true')
        })
    })
    // Sincroniza las barras con los estilos y los valores accesibles.
    const actualizarNiveles = () => {
        document.body.style.setProperty('--accessibility-scale', String(Number(controlTexto.value) / 100))
        document.body.style.setProperty('--accessibility-contrast', String(Number(controlContraste.value) / 100))
        document.body.style.setProperty('--contrast-ink-strength', (Number(controlContraste.value) - 100) + '%')
        document.body.classList.toggle('larger-text', Number(controlTexto.value) > 100)
        document.body.classList.toggle('high-contrast', Number(controlContraste.value) > 100)
        document.getElementById('text-value').textContent = controlTexto.value + '%'
        document.getElementById('contrast-value').textContent = controlContraste.value + '%'
        controlTexto.setAttribute('aria-valuetext', controlTexto.value + '%')
        controlContraste.setAttribute('aria-valuetext', controlContraste.value + '%')
    }
    controlTexto.addEventListener('input', actualizarNiveles)
    controlContraste.addEventListener('input', actualizarNiveles)
    actualizarNiveles()
    botonEnlaces.addEventListener('click', () => { establecerOpcion(botonEnlaces, 'underline-links', botonEnlaces.getAttribute('aria-pressed') !== 'true') })
    document.getElementById('reset-accessibility').addEventListener('click', () => {
        controlTexto.value = '100'
        controlContraste.value = '100'
        actualizarNiveles()
        establecerOpcion(botonEnlaces, 'underline-links', false)
        Object.keys(opcionesAdicionales).forEach((id) => { establecerOpcion(document.getElementById(id), opcionesAdicionales[id], false) })
        selectorIdioma.value = 'es'
        cambiarIdioma('es')
    })
    document.addEventListener('keydown', (evento) => {
        if (evento.ctrlKey && !evento.altKey && !evento.metaKey && evento.key.toLowerCase() === 'u') {
            evento.preventDefault()
            botonAccesibilidad.click()
        }
        if (evento.key === 'Escape' && !panel.hidden) {
            panel.hidden = true
            botonAccesibilidad.setAttribute('aria-expanded', 'false')
            botonAccesibilidad.focus()
        }
    })
})
