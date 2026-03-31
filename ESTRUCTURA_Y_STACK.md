# Estructura y Stack del Proyecto

## 1. Visión general

Este repositorio sigue una arquitectura distribuida, sencilla pero muy clara, orientada a una plataforma de **e-learning**. No está planteado como una aplicación monolítica, sino como un conjunto de piezas separadas que colaboran entre sí:

- Un **frontend Angular** para la interfaz de usuario.
- Un **BFF (Backend for Frontend)** que actúa como puerta de entrada para el frontend.
- Un **microservicio de cursos** que encapsula la lógica y el acceso a datos del dominio `courses`.
- Una **base de datos MariaDB** con datos iniciales.
- Un `docker-compose.yml` que orquesta todos los servicios.

La idea central del proyecto es respetar el patrón **BFF**:

- El frontend **no llama directamente** al microservicio de cursos.
- El frontend habla solo con el **BFF**.
- El BFF delega en el **course-service**.
- El course-service accede a **MariaDB**.

Esto permite desacoplar la interfaz del dominio backend y deja preparada una base más mantenible para crecer en el futuro.

---

## 2. Stack tecnológico

## Frontend

- **Angular 19**
- **TypeScript 5.6**
- **RxJS 7.8**
- **Angular Router**
- **HttpClient**
- **Standalone Components**
- **Signals de Angular**
- **Nginx** para servir la SPA en contenedor Docker

### Qué significa esto en la práctica

El frontend no está montado con módulos clásicos de Angular (`NgModule`) como enfoque principal, sino con una estructura moderna basada en **componentes standalone**. Esto simplifica la organización, reduce boilerplate y encaja con el estilo actual de Angular.

También se usan:

- `provideRouter(...)` para la configuración de rutas.
- `provideHttpClient()` para llamadas HTTP.
- `signal(...)` y `computed(...)` en varias pantallas para estado reactivo local.
- `Observable` y operadores de RxJS dentro del servicio de cursos.

En otras palabras, el frontend combina dos estilos reactivos:

- **Observables** para la comunicación HTTP.
- **Signals** para la gestión de estado en componentes.

Es una mezcla razonable y actual para una app Angular moderna.

## Backend

- **Java 17**
- **Spring Boot 3.5.0**
- **Spring Web**
- **Spring Data JPA** en el microservicio de cursos
- **MariaDB Java Client**
- **Maven** como sistema de build

### Reparto de responsabilidades backend

- `course-service` usa **Spring Boot + JPA** para mapear la tabla `courses` a una entidad Java y exponer endpoints REST.
- `bff-elearning` usa **Spring Boot Web** y actúa como proxy/adaptador hacia el microservicio de cursos.

El BFF, en el estado actual del proyecto, no tiene todavía una capa de servicio propia ni DTOs específicos: el controlador usa `RestTemplate` y reenvía la respuesta del microservicio. Es una implementación simple, válida para una prueba técnica y suficiente para demostrar el patrón.

## Base de datos

- **MariaDB 10.11**
- Script de inicialización SQL en `mariadb/init.sql`

La base de datos se arranca en Docker y crea directamente la tabla `courses` con datos de ejemplo.

## Infraestructura local

- **Docker Compose**
- **Contenedores separados por servicio**
- **Red bridge compartida**: `elearning-network`

Esto permite levantar todo el ecosistema con una sola orden y probar la integración completa entre frontend, BFF, microservicio y base de datos.

---

## 3. Estructura del repositorio

La raíz del proyecto está organizada como un pequeño monorepo técnico:

```text
vselearning-pruebatec-sergio/
├── angular-app/
├── bff-elearning/
├── course-service/
├── mariadb/
├── docker-compose.yml
├── README.md
└── .gitignore
```

## Qué contiene cada carpeta

### `angular-app/`

Aquí vive toda la aplicación frontend en Angular.

Archivos y carpetas importantes:

- `package.json`: dependencias y scripts de Angular.
- `angular.json`: configuración de build y serve.
- `Dockerfile`: build del frontend y despliegue en Nginx.
- `nginx.conf`: configuración del servidor web y proxy hacia el BFF.
- `src/main.ts`: punto de entrada de Angular.
- `src/app/app.config.ts`: proveedores globales.
- `src/app/app.routes.ts`: enrutado principal.
- `src/app/services/course.service.ts`: servicio HTTP para cursos.
- `src/app/components/...`: componentes visuales y layouts.

### `bff-elearning/`

Contiene el **Backend for Frontend**, que expone una API orientada a la UI.

Archivos importantes:

- `pom.xml`: dependencias Maven.
- `Dockerfile`: build y ejecución del jar.
- `src/main/resources/application.yml`: configuración del puerto y URL del microservicio.
- `src/main/java/com/elearning/bff/controller/BffController.java`: controlador REST del BFF.

### `course-service/`

Es el microservicio de dominio responsable de los cursos.

Archivos importantes:

- `pom.xml`: dependencias con Spring Web, Spring Data JPA y MariaDB.
- `Dockerfile`: empaquetado y ejecución.
- `src/main/resources/application.yml`: datasource, JPA y puerto.
- `src/main/java/com/elearning/courses/model/Course.java`: entidad JPA.
- `src/main/java/com/elearning/courses/repository/CourseRepository.java`: repositorio.
- `src/main/java/com/elearning/courses/controller/CourseController.java`: endpoints REST.

### `mariadb/`

- `init.sql`: crea la tabla `courses` y carga registros iniciales.

---

## 4. Arquitectura funcional

## Patrón principal: BFF

El patrón **Backend for Frontend** se usa para separar las necesidades del frontend de la implementación interna del backend.

### Flujo real del proyecto

1. El usuario interactúa con Angular.
2. Angular llama a `/api/bff/courses`.
3. Nginx recibe la petición y la proxifica al contenedor `bff-elearning`.
4. El BFF llama internamente al `course-service`.
5. El `course-service` consulta MariaDB.
6. La respuesta vuelve por el mismo camino hasta el navegador.

### Ventajas de este enfoque en este repo

- El frontend no depende del puerto ni de la forma interna del microservicio.
- Se puede adaptar la respuesta del backend pensando en la UI.
- Se centraliza el acceso desde cliente a backend.
- Se deja preparada una capa intermedia útil para seguridad, agregación de datos, transformaciones o composición futura.

---

## 5. Stack y diseño del frontend

## Enrutado

El archivo `src/app/app.routes.ts` organiza la aplicación en tres áreas:

- `/` -> landing principal
- `/backoffice` -> zona administrativa
- `/aula-virtual` -> zona del alumno

Además, cada área usa `loadComponent(...)`, lo que implica **lazy loading de componentes standalone**. Eso mejora la organización y permite cargar cada sección bajo demanda.

## Configuración global

En `app.config.ts` se registran tres piezas clave:

- `provideZoneChangeDetection(...)`
- `provideHttpClient()`
- `provideRouter(routes)`

Esto indica una configuración Angular moderna, sin necesidad de un módulo raíz tradicional.

## Servicio de datos

El archivo `src/app/services/course.service.ts` es la capa de acceso HTTP del frontend.

Responsabilidades principales:

- Llamar al BFF en `'/api/bff/courses'`.
- Mapear datos que puedan venir en `camelCase` o `snake_case`.
- Exponer un contrato `Course` claro al resto de componentes.
- Proveer datos mock si la API no está disponible.
- Ejecutar el `PATCH` para cambiar el estado de `like`.

### Detalle importante

El servicio hace una normalización útil:

- `last_modified` o `lastModified`
- `last_modified_user` o `lastModifiedUser`
- `difficulty_level` o `difficultyLevel`
- `is_liked` o `isLiked`

Eso hace al frontend más tolerante frente a diferencias de serialización entre capas.

## Estilo de componentes

El frontend tiene dos enfoques visuales:

- Una pantalla simple de catálogo (`course-list.component`).
- Una UI más elaborada de `BackOffice` y `Aula Virtual`.

Esto sugiere que el proyecto ha evolucionado y ahora mismo conviven:

- una base más mínima orientada a la prueba original;
- y una maqueta/UI más rica para representar escenarios reales de producto.

## Uso de Signals

En componentes como:

- `bo-layout.component.ts`
- `bo-courses.component.ts`
- `av-layout.component.ts`
- `av-dashboard.component.ts`

se usa `signal(...)` para gestionar:

- visibilidad de sidebar,
- apertura de dropdowns,
- estado de carga,
- listado de cursos,
- ordenación y visibilidad de columnas.

Esto evita estado mutable disperso y da una reactividad muy directa dentro del componente.

---

## 6. Pantallas del frontend

## Landing

La landing funciona como punto de entrada y selector de aplicación:

- acceso a **BackOffice**
- acceso a **Aula Virtual**

No es solo una portada: también refleja una separación conceptual entre perfiles o contextos de uso.

## BackOffice

La zona `/backoffice` representa una interfaz administrativa.

Elementos principales:

- sidebar lateral con navegación
- cabecera superior
- tabla de cursos
- acciones por fila
- selector de columnas
- ordenación básica
- botón de like por curso

Aquí la pantalla más importante es `bo-courses.component.ts`, que funciona como una vista de gestión/listado.

## Aula Virtual

La zona `/aula-virtual` está orientada al alumno.

Incluye:

- dashboard con métricas
- grid de cursos
- tarjetas más visuales
- botón de like
- navegación específica del entorno formativo

Esta separación entre backoffice y aula virtual está muy bien alineada con el dominio de e-learning, porque diferencia claramente:

- la gestión interna,
- del consumo final del contenido.

---

## 7. Backend: BFF

## Papel del BFF

El BFF expone la API consumida por Angular en:

- `GET /api/bff/courses`
- `PATCH /api/bff/courses/{id}/like`

Su implementación actual está en `BffController.java`.

## Cómo está construido

El controlador:

- lee la URL del microservicio desde configuración;
- crea un `RestTemplate`;
- reenvía peticiones al `course-service`;
- devuelve la misma respuesta al frontend.

## Configuración

En local:

```yml
services:
  course-service:
    url: http://localhost:8080/api/courses
```

En Docker Compose esa URL se sobrescribe mediante variable de entorno:

```text
SERVICES_COURSE_SERVICE_URL=http://course-service:8080/api/courses
```

Esto está bien planteado porque separa:

- configuración local para desarrollo manual,
- configuración interna para despliegue en contenedores.

## Observación de arquitectura

El BFF actual es intencionalmente ligero. No tiene:

- capa `service`,
- DTOs propios,
- manejo de errores avanzado,
- clientes tipados.

Pero sí cumple lo esencial de la prueba:

- el frontend solo habla con el BFF;
- el BFF es el intermediario oficial hacia el microservicio.

---

## 8. Backend: Course Service

## Papel del microservicio

`course-service` concentra el dominio de cursos. Es el servicio que realmente:

- consulta la tabla `courses`,
- expone la colección de cursos,
- persiste el cambio del campo `is_liked`.

## Capas presentes

Aunque es un microservicio pequeño, sí se aprecian las capas base:

- **Controller**: `CourseController`
- **Repository**: `CourseRepository`
- **Model/Entity**: `Course`

No existe una capa `service` intermedia; el controlador usa directamente el repositorio. Para una prueba técnica o un alcance pequeño es una simplificación aceptable.

## Entidad `Course`

La entidad mapea la tabla `courses` y contiene:

- `id`
- `title`
- `description`
- `category`
- `status`
- `lastModified`
- `lastModifiedUser`
- `difficultyLevel`
- `isLiked`

Aquí ya se ve claramente que el proyecto incorpora las dos funcionalidades de la prueba:

- **nivel de dificultad**
- **me gusta**

## Endpoints del microservicio

### `GET /api/courses`

Devuelve todos los cursos mediante `repository.findAll()`.

### `PATCH /api/courses/{id}/like`

Busca un curso por id, invierte el valor booleano de `isLiked`, guarda la entidad y devuelve el objeto actualizado.

Es una implementación simple, directa y fácil de seguir.

---

## 9. Persistencia y modelo de datos

La base de datos se inicializa con `mariadb/init.sql`.

La tabla principal es:

```sql
CREATE TABLE courses (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    category VARCHAR(100) DEFAULT 'Ingreso',
    status VARCHAR(50) DEFAULT 'Activo',
    difficulty_level VARCHAR(50) DEFAULT 'Principiante',
    is_liked BOOLEAN DEFAULT FALSE,
    last_modified DATETIME DEFAULT CURRENT_TIMESTAMP,
    last_modified_user VARCHAR(100) DEFAULT 'admin'
);
```

## Qué refleja este diseño

El modelo está orientado a un caso de uso funcional, no todavía a una solución empresarial compleja.

### Campos funcionales

- `title`, `description`: contenido principal
- `category`, `status`: clasificación y estado operativo
- `difficulty_level`: metadato funcional de negocio
- `is_liked`: estado de interacción del usuario simplificado a nivel general

### Campos de auditoría ligera

- `last_modified`
- `last_modified_user`

Esto deja ver que la UI del backoffice quiere mostrar información administrativa, no solo catálogo público.

---

## 10. Comunicación entre servicios

## Desde el navegador hasta la base de datos

El recorrido completo es este:

```text
Navegador
  -> Angular
  -> /api/bff/courses
  -> Nginx
  -> bff-elearning:8081
  -> course-service:8080
  -> MariaDB:3306
```

## Papel de Nginx

`angular-app/nginx.conf` hace dos cosas clave:

### 1. Servir la SPA

Usa `try_files $uri $uri/ /index.html;` para que el enrutado de Angular funcione al refrescar rutas internas.

### 2. Proxy de API

Redirige `/api/` hacia:

```text
http://bff-elearning:8081/api/
```

Esto evita problemas de CORS y permite que el frontend use rutas relativas como `'/api/bff/courses'`.

Es una decisión muy buena para entorno Docker porque:

- simplifica la configuración del frontend;
- evita hardcodear hosts del backend en el navegador;
- concentra la entrada HTTP pública en el contenedor web.

---

## 11. Docker y despliegue local

El archivo `docker-compose.yml` define cuatro servicios:

- `mariadb`
- `course-service`
- `bff-elearning`
- `angular-app`

## Dependencias entre contenedores

- `course-service` espera a `mariadb` mediante healthcheck.
- `bff-elearning` depende de `course-service`.
- `angular-app` depende de `bff-elearning`.

Esto construye una secuencia lógica de arranque.

## Builds

### Frontend

El `Dockerfile` de Angular usa multistage build:

1. compila la app con Node 22 Alpine;
2. publica el resultado en Nginx Alpine.

### Backends

Los dos servicios Java también usan multistage build:

1. compilan con Maven + Temurin 17;
2. ejecutan el `.jar` en una imagen JRE más ligera.

Este patrón está bien porque reduce el tamaño final de imagen y separa compilación de ejecución.

---

## 12. Decisiones técnicas que refleja el proyecto

Aunque el proyecto es compacto, deja ver varias decisiones de arquitectura bastante claras:

## 1. Separación por responsabilidades

Cada pieza hace una cosa concreta:

- Angular presenta información.
- BFF adapta y expone API al frontend.
- Course Service gestiona el dominio de cursos.
- MariaDB persiste datos.

## 2. Frontend desacoplado del microservicio

El frontend no conoce el microservicio real. Eso protege a la UI ante cambios internos del backend.

## 3. Base preparada para escalar

Hoy solo existe `course-service`, pero la estructura permitiría añadir sin romper el patrón:

- `user-service`
- `exam-service`
- `material-service`

y hacer que el BFF agregue datos entre varios orígenes.

## 4. Angular moderno

El uso de:

- standalone components,
- lazy loading por componente,
- signals,
- providers funcionales

indica una base actualizada respecto a Angular moderno, no un setup legado.

## 5. Backend simple y comprensible

En ambos servicios Java la implementación evita complejidad innecesaria:

- controladores cortos,
- repositorio estándar JPA,
- configuración mínima,
- endpoints fáciles de seguir.

Para una prueba técnica esto suele ser mejor que sobre-ingenierizar.

---

## 13. Limitaciones o simplificaciones actuales

También es importante entender qué **no** tiene todavía el proyecto, porque eso forma parte de su estructura real:

- No hay autenticación ni autorización.
- No hay DTOs tipados en el BFF.
- No hay capa de servicio en los backends.
- No hay paginación real en cursos.
- No hay manejo de errores centralizado.
- No hay migraciones versionadas tipo Flyway o Liquibase.
- No hay tests funcionales relevantes más allá del esqueleto de Spring Boot.
- El `like` está simplificado a nivel global del curso, no por usuario.

Nada de esto invalida el diseño. Más bien deja claro que el repo está pensado como una base de prueba técnica, no como producto terminado.

---

## 14. Resumen ejecutivo

Este proyecto sigue un stack **full stack moderno y bastante coherente** para una prueba técnica:

- **Frontend**: Angular 19 + TypeScript + RxJS + standalone components + signals.
- **BFF**: Spring Boot 3.5 + Spring Web.
- **Microservicio de dominio**: Spring Boot 3.5 + Spring Data JPA + MariaDB.
- **Base de datos**: MariaDB 10.11 con script SQL inicial.
- **Infraestructura local**: Docker Compose + Nginx + contenedores separados.

Desde el punto de vista estructural, el repositorio está organizado alrededor de una idea muy clara:

**una app frontend desacoplada del backend real mediante un BFF, con un microservicio especializado y una base de datos propia**.

Es una base pequeña, pero bien enfocada para demostrar:

- separación de capas,
- arquitectura orientada a servicios,
- consumo frontend limpio,
- y un flujo end-to-end completo desde la UI hasta la persistencia.

---

## 15. Estructura resumida en una frase

Si hubiera que definir la estructura de este proyecto en una sola frase, sería esta:

> Monorepo de e-learning con frontend Angular moderno, BFF en Spring Boot, microservicio de cursos con JPA sobre MariaDB y despliegue local orquestado con Docker Compose.
