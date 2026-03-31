# Tutorias Booking

[![License: GPL v2 or later](https://img.shields.io/badge/License-GPL%20v2%20or%20later-blue.svg)](LICENSE)

Plugin de WordPress para gestionar reservas de tutorias o simulacros de entrevista, con sincronizacion directa con Google Calendar, generacion de enlaces de Google Meet, control de disponibilidad por tutor, validacion de alumnos por DNI/correo y herramientas de administracion para operar todo el flujo desde WordPress.

El proyecto esta orientado a un escenario real de operacion academica: un alumno autorizado entra en el formulario, verifica sus datos, elige modalidad, selecciona una franja disponible y el sistema crea automaticamente la cita en el calendario del tutor correspondiente. Desde el panel de administracion se gestionan tutores, alumnos, disponibilidades, citas, importaciones y exportaciones.

## Indice

- [Vision general](#vision-general)
- [Que hace el plugin](#que-hace-el-plugin)
- [Stack completo](#stack-completo)
- [Arquitectura del plugin](#arquitectura-del-plugin)
- [Flujos funcionales](#flujos-funcionales)
- [Panel de administracion](#panel-de-administracion)
- [Frontend y shortcodes](#frontend-y-shortcodes)
- [Integracion con Google](#integracion-con-google)
- [Reglas de negocio y reservas](#reglas-de-negocio-y-reservas)
- [Base de datos](#base-de-datos)
- [Configuracion y variables de entorno](#configuracion-y-variables-de-entorno)
- [Instalacion](#instalacion)
- [Uso paso a paso](#uso-paso-a-paso)
- [Importacion y exportacion de datos](#importacion-y-exportacion-de-datos)
- [Endpoints AJAX y comportamiento dinamico](#endpoints-ajax-y-comportamiento-dinamico)
- [Estructura del proyecto](#estructura-del-proyecto)
- [Notas tecnicas y operativas](#notas-tecnicas-y-operativas)
- [Limitaciones actuales](#limitaciones-actuales)
- [Licencia](#licencia)

## Vision general

`Tutorias Booking` convierte WordPress en una capa operativa para coordinar entrevistas, tutorias o simulacros entre alumnos y tutores. El plugin:

- registra tutores y alumnos autorizados;
- almacena permisos por modalidad (`online` y `presencial`);
- conecta cada tutor con su cuenta de Google;
- publica disponibilidad real en Google Calendar;
- filtra huecos libres a partir de eventos `DISPONIBLE`;
- crea reservas definitivas en Google Calendar;
- genera Google Meet automaticamente para citas online;
- envia invitaciones y correos de confirmacion;
- permite consultar, editar, eliminar y exportar citas desde administracion.

No es simplemente un formulario de contacto: es un flujo completo de booking con sincronizacion de agenda, persistencia en WordPress y control administrativo.

## Que hace el plugin

Estas son las capacidades reales que implementa el codigo actual:

- Alta manual de tutores desde el admin.
- Importacion masiva de tutores desde archivos `.xlsx`.
- Conexion OAuth de cada tutor con Google Calendar.
- Verificacion del estado de conexion del tutor usando el token real almacenado.
- Renovacion automatica del access token usando `refresh_token` cuando Google lo permite.
- Gestion de disponibilidad por tutor mediante creacion de eventos `DISPONIBLE`, `DISPONIBLE ONLINE` y `DISPONIBLE PRESENCIAL`.
- Edicion de disponibilidad ya publicada.
- Proteccion frente a conflictos al editar disponibilidad cuando ya existen citas dentro de ese rango.
- Alta manual de alumnos autorizados a reservar.
- Importacion masiva de alumnos desde Excel.
- Control de permisos por modalidad para cada alumno.
- Verificacion frontend por `DNI + email`.
- Opcion de proteccion con Google reCAPTCHA en el paso de verificacion.
- Formulario de reserva por pasos para el alumno.
- Modo normal de reserva ligado a una fecha de examen/entrevista.
- Modo flexible "Aun no tengo fecha", configurable desde administracion.
- Busqueda rapida de despacho por fecha y hora deseadas.
- Consulta dinamica de franjas disponibles por tutor y modalidad.
- Segmentacion automatica de disponibilidad en bloques de 45 minutos.
- Validacion de antelacion minima antes de reservar.
- Comprobacion de solapes antes de crear la cita definitiva.
- Creacion automatica del evento final en Google Calendar.
- Creacion de enlace de Google Meet en reservas online con asistentes.
- Envio de invitaciones a los asistentes desde Google Calendar.
- Envio adicional de correos por `wp_mail()` al alumno y al tutor.
- Visualizacion de citas desde el panel admin con filtros.
- Exportacion de citas a `.xlsx`.
- Edicion de fecha, hora y tutor de una cita ya creada.
- Eliminacion de citas desde admin.
- Rehabilitacion del permiso del alumno cuando una cita se elimina.

## Stack completo

### Backend

- **WordPress plugin API**
  - Hooks como `add_action`, `add_shortcode`, `register_activation_hook`, `admin_menu`, `wp_ajax_*`.
- **PHP 7.4+ como requisito del plugin**
  - El encabezado del plugin exige PHP 7.4 o superior.
- **Composer**
  - Se usa para cargar dependencias externas desde `vendor/autoload.php`.
- **MySQL / MariaDB a traves de `$wpdb`**
  - El plugin crea y usa tablas propias.

### Dependencias PHP declaradas en `composer.json`

- `google/apiclient` `2.14`
  - Gestion del cliente OAuth.
  - Acceso a Google Calendar API.
  - Obtencion de datos de usuario de Google.
  - Creacion y actualizacion de eventos.
- `phpoffice/phpspreadsheet` `1.30`
  - Exportacion de citas a formato Excel `.xlsx`.

### APIs y servicios externos

- **Google Calendar API**
  - Lectura de disponibilidad.
  - Lectura de citas ocupadas.
  - Creacion, actualizacion y eliminacion de eventos.
- **Google OAuth 2.0**
  - Conexion del tutor con su cuenta Google.
- **Google Meet / conferenceData**
  - Generacion automatica del enlace de videollamada en citas online.
- **Google reCAPTCHA** opcional
  - Validacion anti-bot en la verificacion de DNI/email.

### Frontend

- **JavaScript vanilla + jQuery**
  - Interacciones del formulario.
  - Calendario visual.
  - Carga AJAX de disponibilidad.
  - Busqueda rapida de tutores por horario.
- **CSS propio**
  - Estilos de frontend y admin incluidos en `assets/css`.
- **WordPress AJAX**
  - Toda la logica dinamica del frontend y parte del admin se apoya en `admin-ajax.php`.

### Archivos principales del stack

- `tutorias-booking.php`
  - Bootstrap del plugin, constantes, `.env`, autoload y arranque.
- `includes/Core/*`
  - Activacion, upgrades y carga de modulos.
- `includes/Admin/*`
  - Menu, controlador admin y handlers AJAX del panel.
- `includes/Frontend/*`
  - Shortcodes y handlers AJAX del proceso de reserva.
- `includes/Google/*`
  - Cliente OAuth y servicio de calendario.
- `templates/*`
  - Vistas del frontend y del panel de administracion.
- `assets/js/*` y `assets/css/*`
  - Comportamiento de interfaz y estilos.

## Arquitectura del plugin

La arquitectura esta organizada por capas funcionales:

### 1. Bootstrap

El archivo [`tutorias-booking.php`](./tutorias-booking.php) hace lo siguiente:

- define constantes de ruta y URL del plugin;
- define `TB_MAX_MONTHS` y `TB_DEBUG`;
- carga variables de entorno desde `.env` si existe;
- lee claves de reCAPTCHA desde variables de entorno;
- exige `vendor/autoload.php`;
- registra el hook de activacion;
- ejecuta posibles rutinas de upgrade;
- inicializa todos los modulos via `Loader::init()`.

### 2. Activacion y esquema de datos

`includes/Core/Activator.php`:

- crea las tablas `tutores`, `tutores_tokens` y `alumnos_reserva`;
- aplica una migracion para sustituir el antiguo campo `tiene_cita` por `online` y `presencial`.

### 3. Capa Google

`includes/Google/GoogleClient.php`:

- carga `credentials.json`;
- construye el `Google_Client`;
- maneja el flujo OAuth;
- guarda y renueva tokens;
- valida si el acceso del tutor sigue siendo usable;
- calcula textos de expiracion para mostrarlos en admin.

`includes/Google/CalendarService.php`:

- centraliza lectura y escritura de eventos;
- separa eventos de disponibilidad de eventos de reserva real;
- crea eventos con o sin Meet segun modalidad y asistentes;
- actualiza y elimina eventos;
- busca eventos por DNI;
- elimina disponibilidades por fecha o rango.

### 4. Capa Admin

`includes/Admin/AdminController.php` coordina:

- la pagina principal del panel;
- la persistencia de formularios admin;
- la importacion de Excel;
- la creacion manual de tutores y alumnos;
- la eliminacion masiva;
- la asignacion de disponibilidad;
- la activacion del modo flexible "Aun no tengo fecha".

`includes/Admin/AjaxHandlers.php` resuelve:

- consulta de disponibilidad diaria;
- listado filtrado de citas;
- exportacion de citas a Excel;
- edicion de citas;
- eliminacion de citas.

### 5. Capa Frontend

`includes/Frontend/Shortcodes.php`:

- registra y renderiza los shortcodes;
- carga CSS y JS;
- filtra los tutores conectados para mostrarlos al alumno;
- inserta el formulario de conexion de Google para tutores.

`includes/Frontend/AjaxHandlers.php`:

- valida DNI y email;
- consulta huecos disponibles;
- localiza tutor para un horario concreto;
- crea la reserva final;
- consume permisos de modalidad del alumno.

## Panel de administracion

El menu principal se registra como **Tutorias** y abre una pantalla con tres grandes bloques:

### Gestion de despachos

Permite:

- crear tutores manualmente con nombre y email;
- importar tutores desde Excel;
- ver el estado de conexion con Google;
- iniciar la conexion OAuth de un tutor;
- entrar en la pantalla de asignacion de disponibilidad;
- eliminar un tutor individual;
- eliminar todos los tutores;
- eliminar tambien sus tokens cuando se borra un tutor.

Cada tutor usa su email como `calendar_id` por defecto.

### Gestion de alumnos

Permite:

- dar de alta alumnos manualmente;
- asignar permisos independientes para `online` y `presencial`;
- importar alumnos desde Excel;
- buscar por DNI o nombre;
- paginar resultados;
- modificar permisos manualmente;
- eliminar alumnos individuales;
- vaciar toda la tabla de alumnos.

### Gestion de citas

Permite:

- filtrar citas por tutor;
- filtrar por alumno, DNI o email;
- filtrar por modalidad;
- filtrar por rango de fechas;
- listar citas creadas por el plugin;
- exportarlas a `.xlsx`;
- editar una cita moviendola de fecha/hora y, si hace falta, de tutor;
- eliminar una cita;
- restaurar el permiso del alumno al borrar una cita.

### Configuracion superior del panel

En la cabecera hay un ajuste funcional importante:

- **Modo "Aun no tengo fecha"**
  - si se activa, el frontend ofrece un camino flexible para alumnos sin fecha real de entrevista;
  - usa una fecha automatica de referencia a 2 meses vista;
  - reduce la antelacion minima a 6 horas;
  - mantiene como tope de reserva hasta 1 dia antes de la fecha de referencia.

## Frontend y shortcodes

El plugin expone dos shortcodes principales.

### 1. `[formulario_dni]`

Shortcode principal para alumnos.

Ejemplo:

```text
[formulario_dni]
```

Con ancho personalizado:

```text
[formulario_dni width="450px"]
[formulario_dni width="60%"]
```

#### Flujo visual del shortcode

Paso 1. Verificacion de datos

- solicita DNI;
- solicita email;
- puede mostrar reCAPTCHA si esta configurado;
- valida que el alumno exista y tenga permisos disponibles.

Paso 2. Fecha de entrevista

- solicita fecha de referencia;
- si el modo flexible esta activo, permite usar el boton "Aun no tengo fecha".

Paso 3. Reserva

- muestra selector de despacho;
- muestra selector de modalidad segun permisos;
- carga calendario de disponibilidad;
- ofrece busqueda rapida por fecha y hora;
- muestra la franja elegida;
- confirma la reserva y devuelve detalle final.

### 2. `[tutor_connect]`

Shortcode para que el tutor conecte su cuenta Google desde frontend.

Ejemplo:

```text
[tutor_connect]
```

Con ancho personalizado:

```text
[tutor_connect width="420px"]
```

Su funcion es simple:

- muestra una explicacion;
- lanza el flujo OAuth contra Google;
- devuelve mensaje de exito o error si el usuario no esta registrado como tutor.

## Integracion con Google

La integracion con Google es una de las piezas centrales del plugin.

### Credenciales

El plugin espera encontrar:

```text
keys/credentials.json
```

Debe ser un `credentials.json` de tipo web generado en Google Cloud.

### Scopes solicitados

Segun el codigo actual, el cliente solicita:

- `Google_Service_Calendar::CALENDAR_EVENTS`
- `Google_Service_Calendar::CALENDAR_READONLY`
- `https://www.googleapis.com/auth/meetings`
- `Google_Service_Oauth2::USERINFO_EMAIL`

### Que hace con Google Calendar

- lee eventos de disponibilidad;
- lee eventos ocupados;
- detecta solapes;
- crea eventos finales de reserva;
- actualiza eventos;
- elimina eventos;
- busca eventos por DNI;
- adjunta asistentes;
- envia actualizaciones a los participantes con `sendUpdates => all`.

### Como representa la disponibilidad

La disponibilidad se modela con eventos en Google Calendar cuyo resumen es:

- `DISPONIBLE`
- `DISPONIBLE ONLINE`
- `DISPONIBLE PRESENCIAL`

El plugin interpreta esos bloques como ventanas editables de las que extrae slots de 45 minutos.

### Como representa una cita real

Una cita gestionada por el plugin se detecta cuando:

- el resumen empieza por `Tutoria de Examen`;
- el resumen o la descripcion contienen el DNI;
- la descripcion o el resumen contienen la modalidad.

Esto permite distinguir reservas reales de simples huecos de disponibilidad.

### Google Meet

Cuando la modalidad es `online` y hay asistentes:

- el plugin anade `conferenceData`;
- Google genera el enlace Meet;
- ese enlace se devuelve al frontend;
- se incluye tambien en los correos posteriores.

En eventos de disponibilidad no se genera Meet.

## Reglas de negocio y reservas

Estas reglas salen directamente de la implementacion actual:

### Permisos por modalidad

Cada alumno tiene dos flags:

- `online`
- `presencial`

Si una modalidad vale `1`, puede reservar esa modalidad.
Cuando reserva correctamente, el plugin pone ese campo a `0`.
Si un admin elimina la cita, el permiso correspondiente vuelve a `1`.

### Ventana de reserva normal

Para el flujo con fecha de entrevista:

- inicio del rango: 10 dias antes de la fecha;
- fin del rango: 1 dia antes de la fecha;
- si el inicio cae en el pasado, se ajusta al dia actual;
- antelacion minima para reservar: 16 horas.

### Ventana de reserva flexible

Si se activa el modo "Aun no tengo fecha":

- la fecha de referencia automatica se fija a 2 meses vista;
- el rango empieza en el dia actual;
- el rango termina 1 dia antes de la fecha de referencia;
- la antelacion minima baja a 6 horas.

### Duracion de las reservas

Los bloques reservables son de **45 minutos**.

### Zonas horarias

El plugin trabaja explicitamente con:

- `Europe/Madrid` para interaccion humana y reglas del negocio;
- `UTC` para insertar y actualizar eventos en Google Calendar.

Esto reduce errores de conversion y ademas incluye logica especial para dias con cambio horario.

### Control de solapes

Antes de crear o mover una reserva:

- se consultan los eventos ocupados del tutor;
- se comparan sus intervalos con la franja solicitada;
- si hay cruce, la reserva o modificacion se rechaza.

### Validacion de alumno

El alumno solo puede avanzar si:

- el `DNI` existe;
- el `email` coincide con el registrado;
- aun conserva al menos un permiso de modalidad disponible.

### Validacion anti-duplicados

Durante la verificacion, el plugin revisa si ya existe una cita en Google Calendar para ese DNI y modalidad. Si la encuentra:

- invalida el permiso correspondiente;
- actualiza la base de datos para evitar una segunda reserva.

## Base de datos

El plugin crea tres tablas propias al activarse.

### 1. `{$wpdb->prefix}tutores`

Campos:

- `id`
- `nombre`
- `email`
- `calendar_id`

Uso:

- catalogo de tutores;
- el email se usa tambien como identificador de calendario por defecto.

### 2. `{$wpdb->prefix}tutores_tokens`

Campos:

- `tutor_id`
- `access_token`
- `refresh_token`
- `expiry`

Uso:

- almacenamiento del acceso OAuth por tutor;
- renovacion de sesiones Google.

### 3. `{$wpdb->prefix}alumnos_reserva`

Campos:

- `id`
- `dni`
- `email`
- `nombre`
- `apellido`
- `online`
- `presencial`

Uso:

- listado de alumnos autorizados;
- control de modalidades disponibles;
- cruce de verificacion frontend.

### Upgrade de esquema

El plugin incluye una rutina `maybe_upgrade()` que:

- detecta instalaciones antiguas;
- crea los campos `online` y `presencial` si no existen;
- migra datos desde `tiene_cita` hacia `presencial`;
- elimina la columna antigua.

## Configuracion y variables de entorno

El plugin soporta carga de variables desde un archivo:

```text
.env
```

Si existe, el bootstrap lo lee y lo expone mediante `getenv()`, `$_ENV` y `$_SERVER`.

### Variables soportadas por el codigo actual

- `TB_RECAPTCHA_SITE_KEY`
  - activa reCAPTCHA en el frontend.
- `TB_RECAPTCHA_SECRET_KEY`
  - valida el token reCAPTCHA en backend.
- `TB_RECAPTCHA_LANGUAGE`
  - anade el parametro `hl` al script de Google reCAPTCHA.
- `TB_RECAPTCHA_THEME`
  - define el `data-theme` del widget.

### Constantes relevantes

- `TB_PLUGIN_FILE`
- `TB_PLUGIN_URL`
- `TB_PLUGIN_DIR`
- `TB_MAX_MONTHS`
  - limita a 6 meses la ventana del calendario de disponibilidad en admin.
- `TB_DEBUG`
  - activa logs con `error_log()` en ciertos puntos del frontend AJAX.

### Opciones de WordPress usadas

- `tutorias_booking_db_version`
  - version de esquema aplicada.
- `tb_enable_no_exam_date_mode`
  - activa el flujo flexible de reserva.

## Instalacion

### Requisitos

- WordPress 6.0 o superior.
- PHP 7.4 o superior.
- Composer.
- Extension `zip` de PHP.
- Entorno capaz de ejecutar las dependencias de `google/apiclient` y `phpoffice/phpspreadsheet`.
- Proyecto de Google Cloud con Calendar API habilitada.
- Credenciales OAuth tipo web.

### Pasos

1. Copia el plugin a `wp-content/plugins/tutorias-booking`.
2. Ejecuta:

```bash
composer install
```

3. Coloca el archivo de credenciales en:

```text
keys/credentials.json
```

4. Si quieres reCAPTCHA, configura las variables en `.env` o en `wp-config.php`.
5. Activa el plugin desde WordPress.
6. Comprueba que se han creado las tablas propias.
7. Accede al menu **Tutorias** del panel.

## Uso paso a paso

### Flujo recomendado de puesta en marcha

1. Instalar dependencias y activar el plugin.
2. Importar o crear los tutores.
3. Conectar cada tutor con Google Calendar.
4. Asignar disponibilidad a cada tutor.
5. Importar o crear los alumnos autorizados.
6. Insertar `[formulario_dni]` en la pagina publica.
7. Opcionalmente insertar `[tutor_connect]` si los tutores van a conectar su cuenta desde frontend.
8. Supervisar reservas y citas desde el panel admin.

### Como trabaja un tutor

Un tutor puede:

- conectar su cuenta de Google;
- recibir disponibilidad publicada por el administrador;
- recibir invitaciones de las reservas;
- recibir correo de aviso cuando un alumno confirma.

### Como trabaja un alumno

Un alumno:

- verifica su identidad;
- selecciona fecha o modo flexible;
- elige modalidad;
- consulta los huecos reales;
- reserva una franja;
- recibe confirmacion y, si es online, enlace Meet.

## Importacion de tutores

El importador espera un `.xlsx` con cabecera en la primera fila y estas columnas:

1. `Nombre`
2. `Email`

Cada fila valida inserta:

- `nombre`
- `email`
- `calendar_id = email`

## Importacion de alumnos

El importador espera un `.xlsx` con cabecera en la primera fila y estas columnas:

1. `DNI`
2. `Nombre`
3. `Apellido`
4. `Email`
5. `Online`
6. `Presencial`

Las columnas `Online` y `Presencial` se interpretan como activas cuando el valor es `si`.

El importador:

- ignora filas incompletas;
- ignora DNIs ya existentes;
- crea el alumno con sus permisos de modalidad.

## Exportacion de citas

El panel de citas puede exportar a `tb-citas.xlsx` con estas columnas:

- Usuario
- DNI
- Email
- Tutor
- Inicio
- Fin
- Modalidad
- Enlace

## Endpoints AJAX y comportamiento dinamico

### Frontend

Endpoints registrados:

- `tb_verify_dni`
- `tb_get_available_slots`
- `tb_find_tutors_for_datetime`
- `tb_process_booking`

Que resuelven:

- validacion de alumno;
- lectura de disponibilidad filtrada;
- busqueda de tutores por horario puntual;
- confirmacion final de reserva.

### Admin

Endpoints registrados:

- `tb_get_day_availability`
- `tb_list_events`
- `tb_update_event`
- `tb_delete_event`
- `tb_export_events`

Que resuelven:

- consulta de disponibilidad diaria;
- listados del panel de citas;
- cambios de horario o tutor;
- borrado de citas;
- descarga del Excel.

### Seguridad

El plugin utiliza:

- `wp_verify_nonce()` y `check_ajax_referer()`;
- `check_admin_referer()` en formularios admin;
- `current_user_can('manage_options')` en acciones administrativas;
- sanitizacion con funciones de WordPress;
- validaciones de formato antes de tocar Google Calendar.

## Estructura del proyecto

```text
tutorias-booking/
├── assets/
│   ├── css/
│   │   ├── admin.css
│   │   └── frontend.css
│   └── js/
│       ├── admin.js
│       ├── admin-edit.js
│       ├── admin-file-input.js
│       ├── admin-notices.js
│       ├── admin-tabs.js
│       ├── calendar-utils.js
│       ├── events.js
│       ├── frontend.js
│       └── tb-widget-aislado.js
├── includes/
│   ├── Admin/
│   │   ├── AdminController.php
│   │   ├── AdminMenu.php
│   │   ├── AdminPage.php
│   │   ├── AjaxHandlers.php
│   │   ├── AlumnosListTable.php
│   │   └── TutorsListTable.php
│   ├── Core/
│   │   ├── Activator.php
│   │   └── Loader.php
│   ├── Frontend/
│   │   ├── AjaxHandlers.php
│   │   └── Shortcodes.php
│   └── Google/
│       ├── CalendarService.php
│       └── GoogleClient.php
├── keys/
│   └── credentials.json
├── templates/
│   ├── admin/
│   │   └── admin-page.php
│   └── frontend/
│       ├── booking-form.php
│       └── tutor-connect-form.php
├── vendor/
├── .env
├── composer.json
├── composer.lock
├── LICENSE
├── README.md
└── tutorias-booking.php
```

### Sobre algunos archivos secundarios

- `includes/Admin/AlumnosListTable.php` y `includes/Admin/TutorsListTable.php` existen en el repositorio, pero el flujo principal actual del panel se apoya en `AdminController.php` y `templates/admin/admin-page.php`.
- `assets/js/tb-widget-aislado.js` define un web component simple (`tb-widget-aislado`) con Shadow DOM. A dia de hoy no forma parte del flujo principal de reservas.
- Existe una estructura duplicada dentro de `templates/` con copias de archivos del plugin. El bootstrap activo usa los archivos raiz del plugin, no esas copias, por lo que la documentacion funcional de este README describe la implementacion activa del directorio principal.

## Notas tecnicas y operativas

- El plugin exige `vendor/autoload.php`; si falta, muestra un aviso en admin y se detiene.
- El archivo `credentials.json` es obligatorio para cualquier integracion con Google.
- La disponibilidad se gestiona en el propio calendario del tutor, no en una tabla interna.
- Las reservas reales se almacenan implicitamente en Google Calendar y los permisos del alumno se reflejan en WordPress.
- El plugin usa `sendUpdates => all`, por lo que Google puede enviar invitaciones o actualizaciones a los asistentes.
- Las fechas visibles y la logica de negocio estan pensadas para `Europe/Madrid`.
- Hay tratamiento especifico para cambios de hora por DST al crear disponibilidad.
- La exportacion a Excel requiere que la extension `zip` de PHP este habilitada.

## Limitaciones actuales

- La zona horaria esta codificada para `Europe/Madrid`; no hay ajuste desde la interfaz.
- El plugin esta muy orientado a un flujo concreto de entrevistas/simulacros y textos de negocio en espanol.
- La deteccion de citas del plugin depende del formato del resumen y la descripcion del evento.
- La importacion de Excel usa una lectura manual simple de `sheet1.xml`, por lo que espera formatos bastante concretos.
- No existe, en el codigo actual, una pantalla separada de ajustes avanzados; gran parte de la configuracion vive en constantes, variables de entorno y una unica opcion del panel.

## Licencia

Proyecto distribuido bajo licencia **GPL-2.0-or-later**. Consulta [`LICENSE`](LICENSE) para mas informacion.
