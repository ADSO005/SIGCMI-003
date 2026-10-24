# Análisis de integración: MedicalConexion y develop

Fecha: 2026-10-23. Documento de propuesta; ninguna resolución aplicada.

## Alcance y referencias

- Feature local y remota: `221a6e7711f768d6374c57996891ff85918a8e07`.
- `origin/develop`: `2e83ccac727d6ba9c128f6571d1534330d65fe4b`.
- Base común: `9a3fff28e5e7e8f4f725d2bf232530e22234a9aa`.
- Se compararon cambios desde la base común y la simulación de `git merge-tree` de tres argumentos. No se realizó merge, rebase ni modificación del índice o de develop. La lista corresponde a estos hashes; si cambia el remoto debe repetirse el análisis.
- El espacio local preexistente del import en `routes/medico/medicoRoutes.js` se conserva. Los archivos de tests siguen fuera de commits.

| Archivo en conflicto | Aporte de feature | Aporte de develop | Propuesta para revisión |
|---|---|---|---|
| config/db.js | Conexión a sigcmi | Configuración mediante entorno | Entorno de develop con destino explícito sigcmi |
| package.json | Compilación médico/paciente y servidor único | CSS auth/admin y organización de dependencias | Scripts por módulo y un único servidor |
| public/medico/css/input.css | Escaneo explícito correcto de vistas | Limpieza de importación antigua | Tailwind con escaneo correcto, sin CSS antiguo |
| server.js | Ajustes de mensajes de arranque | Router WhatsApp y eliminación de configuración Pug duplicada | Conservar routers de ambos y configurar Pug una sola vez |
| views/login/auth/login.pug | Azul #465DE5 | Correcciones de enlaces y recurso WhatsApp | Paleta feature y rutas develop |
| views/login/auth/register.pug | Registro compacto en Tailwind | Mensajes del controlador y retiro de script roto | Diseño feature y mensajes compatibles con develop |

## 1. config/db.js

**Qué cambia en cada rama.** Feature selecciona `sigcmi` en su configuración existente. Develop utiliza `DB_NAME`, `DB_USER`, `DB_PASS`, `DB_HOST` y `DB_PORT`, con valores de respaldo; además contempla el puerto. No se reproducen credenciales en este documento.

**Por qué no elegir una versión completa.** Elegir feature descartaría la configuración por entorno. Elegir develop sin comprobar el entorno podría conectar a una base distinta de la acordada. Que Sequelize autentique correctamente no demuestra que la base sea la correcta.

**Propuesta.** Conservar la configuración por entorno y puerto de develop, confirmar que el entorno autorizado resuelve `DB_NAME=sigcmi` y comprobar `SELECT DATABASE()` antes de habilitar escrituras. Mantener las pruebas aisladas apuntando explícitamente a `sigcmi_medical_test_20261023`; nunca utilizar esta última como destino normal del portal. No modificar `.env` como parte de esta revisión ni copiar contraseñas a commits.

**Decisión pendiente.** Acordar los valores de respaldo y cómo se suministran las variables en cada entorno. Revisar por separado la retirada de credenciales versionadas.

**Comprobación posterior.** Arranque y lectura con la configuración acordada, sin escrituras en la principal. CRUD únicamente en la aislada y con verificación física de base.

## 2. package.json

**Feature.** Corrige la salida concatenada inválida del script original. Introduce `css:general` para `public/css/app.css`, `css:paciente` para `public/patient/css/output.css`, `css:medico` y `dev:medico`. Quita el segundo `node server.js` de `dev`.

**Develop.** Cambia el nombre del paquete y `main` a `server.js`; dirige `css` a `public/auth/css/output.css`, añade `css:admin` y ejecuta servidor/auth/admin desde `dev`. Lleva las herramientas Tailwind/nodemon a devDependencies, retira la dependencia antigua `tailwind`, añade `sequelize-cli` y elimina `uuid`.

**Propuesta.** Conservar la identidad/main de develop y organizar scripts explícitos `css:auth`, `css:admin`, `css:paciente` y `css:medico`. Un `css` general puede ejecutar esos compiladores; `dev` debe ejecutar un servidor y el conjunto CSS una sola vez. Conservar `dev:medico` como acceso específico. No mantener además `css:admin` en `dev` si ya está dentro del conjunto general: duplicaría el watcher.

Antes de retirar `css:general` o `public/css/app.css`, revisar todas las referencias resultantes de ambas ramas. No confundirlo con el antiguo archivo médico del mismo nombre. Confirmar usos de `uuid` en el árbol integrado antes de aceptar su retirada. Mantener paquetes de ejecución en dependencies y herramientas en devDependencies, teniendo en cuenta que un despliegue que compila CSS necesita instalar las herramientas durante su fase de construcción.

**Lockfile.** Aunque no figure entre los seis conflictos textuales, comprobar `package-lock.json` y regenerarlo con npm después de acordar package.json. No elegir versiones completas de lockfile a ciegas.

**Comprobación posterior.** Validar JSON, instalación reproducible, compilación individual auth/admin/paciente/médico sin watch, y comprobar que `dev` inicia un solo proceso de servidor sin colisión de puerto.

## 3. public/medico/css/input.css

**Base común.** Importaba Tailwind, `register.css` y declaraba `@source "../../views"`, que no apunta a las vistas desde este directorio.

**Feature.** Elimina la dependencia antigua y conserva el escaneo explícito corregido `@source "../../../views"`.

**Develop.** Elimina tanto la importación antigua como la declaración de source y conserva Tailwind.

**Propuesta.** Mantener `@import "tailwindcss"` y el source explícito correcto de feature. No reintroducir `register.css` ni otros estilos personalizados eliminados. Regenerar output.css después de resolver las vistas; nunca resolver el CSS generado editándolo manualmente.

**Dependencia cruzada.** Develop cambia `views/login/layouts/layout.pug` para cargar `/auth/css/output.css` y crea `public/auth/css/input.css` con Tailwind. Esta modificación puede integrarse sin conflicto textual, pero obliga a compilar auth y verificar que su escaneo incluya las clases del login resuelto. La compilación médica no sustituye la compilación auth.

**Comprobación posterior.** Compilar los dos destinos y comprobar utilidades arbitrarias, estados, responsive y recursos en las vistas que realmente cargan cada salida.

## 4. server.js

**Feature.** Sus diferencias con la base común afectan a mensajes de consola; conserva la configuración Pug duplicada respecto de app.js.

**Develop.** Importa y monta `whatsappRoutes` en `/whatsapp` y retira la configuración de vistas repetida del servidor. También cambia formato de mensajes/indentación.

**Propuesta.** Conservar el montaje WhatsApp y la configuración de vistas centralizada en app.js. Mantener `/auth`, `/admin`, `/medico` y `/paciente`. El router médico debe seguir apuntando a la versión que contiene GET y PUT `/horarios` con auth y role(2). Mantener asociaciones antes de utilizar modelos y el flujo de conexión previo al inicio del servidor.

No interpretar este conflicto cosmético como autorización para reemplazar el servidor completo y perder rutas. Verificar que el router WhatsApp y sus dependencias del árbol develop estén presentes.

**Comprobación posterior.** Sintaxis, arranque aislado autorizado, vistas Pug, recurso JS y existencia de rutas de cada módulo. Comprobar GET/PUT médico y permisos; no enviar mensajes WhatsApp como prueba sin autorización.

## 5. views/login/auth/login.pug

**Feature.** Unifica encabezado, botón y elementos azules relacionados en `#465DE5`, manteniendo geometría y autenticación.

**Develop.** Corrige el enlace de creación de cuenta de `/registro` a `/auth/register` y la imagen WhatsApp de `/img/WhatsApp.svg.png` a `/auth/img/WhatsApp.svg.png`.

**Propuesta.** Conservar las clases y colores de feature con ambas rutas corregidas de develop. No modificar names, tipos, mensajes ni POST del formulario. Conservar el layout que carga el CSS auth y compilar ese destino.

**Comprobación posterior.** Compilación Pug, carga HTTP de CSS/imagen, enlace de registro y comparación visual de dimensiones y color. Las pruebas reales de autenticación requieren cuentas autorizadas; no crear usuarios en sigcmi para probar el merge.

## 6. views/login/auth/register.pug

**Feature.** Reemplaza estilos personalizados por Tailwind inline, restaura el aspecto aprobado y limita la tarjeta compacta a aproximadamente 720 px. Conserva degradado, sombra, onda, dos columnas, iconos y atributos del formulario. Incluye errores y datos de campos; usa `success` para el aviso de éxito. Corrige el enlace a `/auth/login`.

**Develop.** Mantiene la estructura anterior con clases personalizadas, añade avisos globales `error`/`mensaje` con IDs `mensajeError`/`mensajeExito`, añade retirada de esos avisos tras 9 segundos, corrige el enlace al login y elimina la inclusión `/js/register.js`.

**Riesgo funcional.** El controlador de registro utiliza `mensaje` para el éxito. Conservar únicamente el bloque `success` de feature puede ocultar esa confirmación. Conservar toda la vista develop perdería el diseño Tailwind compacto y podría reintroducir una dependencia del CSS antiguo.

**Propuesta.** Tomar la estructura Tailwind de feature e integrar una sola presentación de `error` y `mensaje`, sin duplicar avisos ni perder errores por campo o valores de formData. Mantener todos los campos y POST `/auth/register`, sin selector de roles. Confirmar si existe algún flujo que aún envía `success` antes de retirar su compatibilidad.

El script retirado no debe reintroducirse automáticamente: su URL anterior no corresponde al recurso médico y el archivo antiguo contiene una selección problemática de confirmación de contraseña. Si el equipo requiere validación cliente adicional, acordar un arreglo separado de ruta/selector; no cambiar validaciones de autenticación como efecto secundario de resolver el conflicto.

**Decisiones pendientes.** Acordar si los avisos globales deben desaparecer tras nueve segundos; no aplicar ese temporizador a errores por campo. Mantener Font Awesome y WhatsApp con las rutas efectivamente disponibles. Revisar qué CSS carga esta vista independiente, además del layout del login.

**Comprobación posterior.** Pug con mensajes ausentes/error/éxito y errores de campos, valores conservados, escritorio/móvil, iconos, recursos y enlaces. No registrar pacientes reales para validar la integración.

## Orden propuesto y puntos de aprobación

1. Aprobar configuración por entorno y destino, estrategia de scripts y tratamiento de mensajes del registro.
2. Con autorización posterior, crear una rama de integración sin modificar develop directamente; conservar primero los cambios locales pendientes.
3. Resolver los seis archivos semánticamente, revisando también cambios integrados automáticamente: layout auth, recursos, lockfile, routers y modelos/asociaciones.
4. Regenerar CSS de cada módulo y ejecutar sintaxis/Pug; no editar salidas generadas a mano.
5. Repetir pruebas aisladas de horarios: identidad, CRUD, revisión GET/PUT, aprobados/rechazados, citas futuras, rollback, concurrencia y cancelación. Repetir Chrome sobre el árbol integrado.
6. Revisar regresiones de Agenda, Mis Pacientes, transiciones de citas, login, registro, administración y paciente. Las pruebas de esta entrega certifican el árbol feature indicado, no una combinación aún no creada.
7. Revisar el diff y preparar archivos explícitos para el commit autorizado. No incluir tests/, .env, programas temporales, credenciales ni datos de prueba.

No existe todavía una resolución aplicada ni un árbol combinado probado. La comprobación visual de feature está documentada en [el informe técnico](medical-schedule-handoff.md); no elimina la necesidad de validar el resultado de la integración futura.

## Actualización: reorganización de las vistas médicas

Se aplicó, con autorización, el movimiento local de seis vistas desde `views/dashboardMedical/` a `views/viewsMedico/`. El dashboard queda directamente en `views/viewsMedico/dashboardMedical.pug`; conserva includes y layouts en sus subcarpetas. El controlador médico ahora renderiza `viewsMedico/dashboardMedical` y el dashboard extiende `layout/main`. No se modificaron los seis archivos en conflicto indicados en este documento.

La simulación de los commits HEAD/origin/develop sigue mostrando los mismos seis conflictos. **Límite de esa comprobación:** los movimientos no están en un commit ni en el índice; merge-tree sobre HEAD no incluye esos cambios locales. No se afirma haber probado un merge del árbol reorganizado.

Dependencia semántica para la integración: `origin/develop:routes/medico/medicoRoutes.js` todavía renderiza directamente `dashboardMedical/viewsMedico/dashboardMedical`, una ruta sin vista en develop. Al integrar debe conservarse la ruta hacia el controlador funcional de feature, con su render actualizado, sus datos dinámicos y los endpoints GET/PUT de horarios, pacientes y estado de citas. Reintroducir el manejador simplificado de develop rompería el dashboard reorganizado aunque Git no señalase un conflicto textual.

El source de Tailwind ya abarca todas las vistas y no requiere modificación por el movimiento. Los recursos `/medico/...` y las rutas HTTP permanecen iguales. Repetir la simulación y la revisión semántica después del commit autorizado y antes de integrar; no se ejecutó merge, rebase, commit ni push.
