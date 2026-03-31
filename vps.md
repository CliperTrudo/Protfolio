Documentación del despliegue realizado en la VPS
1. Contexto de partida

Se partió de una VPS de IONOS con Ubuntu recién iniciada, sin configuración previa del proyecto ni del servicio web. El objetivo fue publicar en esa máquina la web alojada en el repositorio:

https://github.com/CliperTrudo/Protfolio.git

El despliegue terminó con la aplicación sirviéndose correctamente en:

https://portfolio.clipertrucado.com
2. Identificación del tipo de proyecto

Se revisó el repositorio para identificar su stack y su modo de despliegue.

Se confirmó que el proyecto estaba construido con:

Astro 5
Tailwind CSS

Se determinó que el proyecto generaba una salida estática y que, por tanto, podía desplegarse como sitio estático servido por Nginx, sin necesidad de mantener un proceso Node.js en producción para servir la web.

3. Preparación inicial del servidor

Se trabajó directamente sobre la VPS por terminal con permisos de root.

Se comprobó el entorno del servidor y se utilizó la ruta de despliegue:

/var/www/protfolio

El proyecto quedó ubicado en esa carpeta.

4. Instalación de dependencias del proyecto

Dentro del directorio del proyecto se ejecutó la instalación de dependencias con:

npm install
4.1. Primer intento fallido

En el primer intento, npm install terminó con:

Killed

El proceso fue terminado por falta de memoria disponible en la VPS. Como consecuencia:

no se instalaron correctamente las dependencias
astro no quedó disponible en node_modules/.bin
la compilación falló
no se generó la carpeta dist
4.2. Reintento correcto

Posteriormente, npm install se ejecutó correctamente y completó la instalación de los paquetes del proyecto.

La salida confirmó que las dependencias quedaron instaladas y que el binario de Astro ya existía en:

node_modules/.bin/astro
5. Corrección de la configuración de Astro

Después de instalar dependencias, se ejecutó:

npm run build

En un primer intento de build, Astro devolvió este error:

[config] Astro found issue(s) with your configuration:
! site: Invalid url

El problema estaba en la propiedad site del archivo astro.config.mjs, que contenía una URL no válida.

Se corrigió ese valor para dejar una URL válida y, tras ello, la compilación volvió a ejecutarse.

6. Compilación del proyecto

Una vez corregido el archivo de configuración, se lanzó de nuevo:

npm run build

La compilación terminó correctamente.

La salida confirmó:

sincronización del contenido
validación sin errores ni warnings
modo de build estático
generación del directorio:
/var/www/protfolio/dist/

También se generó:

robots.txt
rutas estáticas
recursos de cliente procesados por Vite
7. Preparación de la carpeta pública servida por Nginx

Una vez generado el build, se preparó una carpeta específica para servir el contenido estático desde Nginx:

/var/www/protfolio/dist-public

Se ejecutaron estos pasos:

creación de la carpeta dist-public
borrado de posibles contenidos previos
copia del contenido de dist/ a dist-public/
cambio de propietario al usuario del servidor web

La carpeta publicada quedó así:

/var/www/protfolio/dist-public

y fue la ruta configurada como root de Nginx.

8. Comprobación del estado de Nginx

Se verificó la instalación de Nginx con:

nginx -v

La versión presente en el sistema fue:

nginx/1.24.0 (Ubuntu)

Posteriormente se consultó el estado del servicio con:

sudo systemctl status nginx

En ese momento el servicio aparecía como fallido.

9. Validación de la configuración de Nginx

Se ejecutó:

sudo nginx -t

La prueba de sintaxis devolvió:

sintaxis correcta
configuración válida

Esto confirmó que el problema no estaba en la sintaxis de los archivos de configuración, sino en la ejecución del servicio.

10. Diagnóstico del fallo de arranque de Nginx

Se intentó reiniciar el servicio:

sudo systemctl restart nginx

El servicio falló al arrancar.

Para diagnosticar el motivo se consultó el log del servicio con:

sudo journalctl -xeu nginx.service --no-pager | tail -n 30

El log devolvió este error:

bind() to [::]:80 failed (98: Address already in use)
bind() to 0.0.0.0:80 failed (98: Address already in use)
still could not bind()

Esto confirmó que el puerto 80 ya estaba siendo utilizado por otro servicio.

11. Identificación del servicio que ocupaba el puerto 80

Se ejecutó:

sudo ss -tulpn | grep ':80 '

La salida mostró que el proceso que estaba escuchando en el puerto 80 era apache2.

12. Parada de Apache

Para liberar el puerto 80 se detuvo Apache con:

sudo systemctl stop apache2

Después de parar Apache, se reinició Nginx:

sudo systemctl restart nginx

Luego se comprobó su estado con:

sudo systemctl status nginx --no-pager

El servicio quedó en estado:

active (running)
13. Verificación del contenido servido por Nginx

Se comprobó la respuesta HTTP local con:

curl -I http://127.0.0.1

La respuesta fue HTTP/1.1 200 OK, lo que confirmó que Nginx estaba respondiendo.

Después se consultó el contenido HTML servido:

curl -s http://127.0.0.1 | grep -i "<title>"

La salida mostró:

<title>Apache2 Ubuntu Default Page: It works</title>

Esto indicaba que Nginx seguía sirviendo el sitio por defecto del sistema, cuyo root apuntaba a la página predeterminada.

14. Revisión de los sitios habilitados en Nginx

Se listó el contenido de:

ls -l /etc/nginx/sites-enabled/

La salida mostró que el único sitio habilitado era:

default -> /etc/nginx/sites-available/default

No existía todavía el archivo de configuración específico del proyecto.

15. Eliminación del sitio por defecto

Se eliminó el enlace simbólico del sitio por defecto:

sudo rm /etc/nginx/sites-enabled/default
16. Creación del sitio Nginx del proyecto

Se creó el archivo:

/etc/nginx/sites-available/protfolio

Con una configuración inicial para servir el proyecto desde:

/var/www/protfolio/dist-public

La configuración inicial fue:

escucha en puerto 80
server_name _
root /var/www/protfolio/dist-public
index index.html
try_files $uri $uri/ /index.html
17. Activación del sitio del proyecto

Una vez creado el archivo de configuración, se habilitó creando el enlace simbólico en:

/etc/nginx/sites-enabled/protfolio

Después se recargó Nginx:

sudo systemctl reload nginx
18. Verificación de que Nginx servía el proyecto

Se volvió a consultar el HTML servido en local con:

curl -s http://127.0.0.1 | grep -i "<title>"

Esta vez la salida ya mostró el HTML del proyecto Astro, incluyendo el título:

Porfolio de Sergio - Desarrollador y Programador Web

Con esto quedó confirmada la publicación correcta del build estático del proyecto en HTTP.

19. Configuración DNS del subdominio

Se trabajó con el subdominio:

portfolio.clipertrucado.com

En la configuración DNS de IONOS se confirmó que existían registros A apuntando a la IP pública de la VPS para:

portfolio
www.portfolio

La IP configurada para portfolio apuntaba al servidor desplegado.

20. Solicitud inicial de certificado HTTPS con Certbot

Con el sitio funcionando por HTTP, se procedió a intentar emitir un certificado usando Certbot.

20.1. Instalación de Certbot

Se instaló Certbot mediante Snap con:

sudo snap install --classic certbot

Después se creó el enlace simbólico del binario:

sudo ln -s /snap/bin/certbot /usr/bin/certbot
20.2. Intento de emisión con Let’s Encrypt

Se ejecutó:

sudo certbot --nginx -d portfolio.clipertrucado.com

Durante el proceso se introdujo:

correo electrónico de registro
aceptación de términos
consentimiento de contacto con la EFF

La solicitud falló con el error:

Type: caa
Detail: While processing CAA for portfolio.clipertrucado.com: CAA record for clipertrucado.com prevents issuance
21. Revisión del registro CAA del dominio

Para diagnosticar el fallo se consultó el CAA del dominio raíz con:

dig clipertrucado.com CAA +short

La salida mostró:

128 issue "sectigo.com"

Esto significaba que el dominio solo permitía emisión de certificados por parte de sectigo.com, bloqueando Let’s Encrypt.

22. Cambio de estrategia: uso del certificado Sectigo ya disponible

En lugar de seguir con Let’s Encrypt, se aprovechó el certificado SSL wildcard de Sectigo que ya existía en IONOS para el dominio:

*.clipertrucado.com

En el panel de IONOS se cambió el uso del certificado a:

Usar con mi servidor

Eso permitió descargar los ficheros necesarios para la instalación manual.

23. Archivos de certificado obtenidos

Se trabajó con estos archivos:

clave privada:

_.clipertrucado.com_private_key.key

certificado principal:

clipertrucado.com_ssl_certificate.cer

certificado intermedio en ZIP:

_.clipertrucado.com_ssl_certificate_INTERMEDIATE.zip
24. Subida de archivos SSL a la VPS

Se creó en el servidor la carpeta:

/root/ssl

Mediante WinSCP se subieron a esa ruta los tres archivos descargados desde IONOS.

La carpeta quedó con el siguiente contenido base:

_.clipertrucado.com_private_key.key
_.clipertrucado.com_ssl_certificate_INTERMEDIATE.zip
clipertrucado.com_ssl_certificate.cer
25. Extracción del certificado intermedio

Dentro de /root/ssl se descomprimió el ZIP:

cd /root/ssl && unzip _.clipertrucado.com_ssl_certificate_INTERMEDIATE.zip

La extracción generó:

intermediate1.cer
intermediate2.cer
26. Construcción del archivo full chain

Con los ficheros ya disponibles, se generó la cadena completa concatenando:

certificado principal
primer intermedio
segundo intermedio

El archivo resultante fue:

/root/ssl/fullchain.pem

Ese fichero quedó preparado para ser usado por Nginx como ssl_certificate.

27. Actualización de la configuración Nginx para el subdominio real

Se revisó el contenido de:

/etc/nginx/sites-available/protfolio

En ese momento el server_name era genérico (_).

Se reescribió la configuración para que el sitio respondiera explícitamente a:

portfolio.clipertrucado.com

Primero se dejó el bloque HTTP con:

escucha en 80
server_name portfolio.clipertrucado.com
root /var/www/protfolio/dist-public
28. Activación de HTTPS en Nginx

Posteriormente se sustituyó el archivo de configuración del sitio por una configuración con dos bloques server.

28.1. Bloque HTTP

El bloque HTTP quedó configurado para:

escuchar en puerto 80
responder a portfolio.clipertrucado.com
redirigir permanentemente a HTTPS

La redirección configurada fue:

return 301 https://$host$request_uri;
28.2. Bloque HTTPS

El bloque HTTPS quedó configurado para:

escuchar en 443 con SSL
usar HTTP/2
responder a portfolio.clipertrucado.com

servir el proyecto desde:

/var/www/protfolio/dist-public

cargar el certificado desde:

/root/ssl/fullchain.pem

cargar la clave privada desde:

/root/ssl/_.clipertrucado.com_private_key.key
29. Validación de la nueva configuración HTTPS

Después de reescribir el archivo de configuración, se validó la sintaxis con:

sudo nginx -t

La salida confirmó:

sintaxis correcta
configuración exitosa
30. Recarga de Nginx con HTTPS habilitado

Una vez validada la configuración, se recargó el servicio:

sudo systemctl reload nginx

Esto aplicó la nueva configuración con SSL sin necesidad de reiniciar el proceso completo.

31. Estado final del despliegue

Al finalizar todo el proceso, el sistema quedó con esta estructura funcional:

Aplicación
proyecto Astro compilado en modo estático
Carpeta servida
/var/www/protfolio/dist-public
Servidor web
Nginx activo y sirviendo la aplicación
Puerto HTTP
80, redirigiendo al sitio HTTPS
Puerto HTTPS
443, con certificado SSL cargado manualmente
Dominio operativo
portfolio.clipertrucado.com
Certificado utilizado
certificado wildcard de Sectigo instalado manualmente
Servicio conflictivo resuelto
Apache detenido para liberar el puerto 80
32. Resumen cronológico de acciones ejecutadas
Se identificó el proyecto como Astro estático.
Se trabajó en /var/www/protfolio.
Se ejecutó npm install.
El primer intento falló por memoria.
Se repitió la instalación hasta completarla correctamente.
Se lanzó npm run build.
Se detectó error en site de astro.config.mjs.
Se corrigió la URL de site.
Se volvió a ejecutar npm run build.
Se generó la carpeta dist.
Se copió el build a dist-public.
Se comprobó que Nginx estaba instalado.
Se detectó que Nginx no arrancaba.
Se validó la sintaxis con nginx -t.
Se consultó el log y se detectó conflicto en el puerto 80.
Se identificó a Apache como proceso ocupando el puerto.
Se detuvo Apache.
Se arrancó Nginx correctamente.
Se comprobó que inicialmente servía la página por defecto.
Se eliminó el sitio default.
Se creó el sitio protfolio en Nginx.
Se activó el nuevo sitio.
Se recargó Nginx.
Se verificó que la web del portfolio ya salía por HTTP.
Se instaló Certbot.
Se intentó emitir certificado de Let’s Encrypt.
La emisión falló por la política CAA del dominio.
Se consultó el CAA del dominio y se confirmó que solo permitía Sectigo.
Se decidió usar el certificado wildcard Sectigo existente.
Se cambió el uso del certificado en IONOS a “Usar con mi servidor”.
Se descargaron clave privada, certificado principal e intermedios.
Se subieron los archivos a /root/ssl.
Se descomprimieron los intermedios.
Se construyó fullchain.pem.
Se actualizó Nginx para usar portfolio.clipertrucado.com.
Se añadió redirección HTTP→HTTPS.
Se configuró el bloque SSL en 443.
Se validó la configuración con nginx -t.
Se recargó Nginx.
El sitio quedó operativo por HTTPS.

Si quieres, te lo convierto en formato README técnico o en documento Markdown listo para guardar en el proyecto.