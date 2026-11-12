# DCPI Universal Downloader API — BETA v1

API Flask + yt-dlp para el DCPI Portal. Analiza enlaces compatibles con yt-dlp y permite descargar contenido que tengas derecho a guardar. No intenta eludir DRM, controles de acceso ni restricciones de pago.

## Rutas
- `GET /api/health`: estado del servicio.
- `POST /api/info`: analiza una URL. JSON: `{"url":"https://..."}`.
- `POST /api/download`: descarga. JSON: `{"url":"https://...","format":"best"}`. Formatos: `best`, `mp4`, `mp3`.

## Desplegar en Render
1. Entra en https://render.com/ y conecta la cuenta de GitHub.
2. Crea un servicio nuevo usando **Blueprint** y selecciona `maykelpp/DCPI-PORTAL`.
3. Render detectará `api/render.yaml`. Revisa el servicio y confirma el despliegue.
4. Copia el dominio HTTPS que Render asigne al servicio.
5. En `script.js`, reemplaza el valor de `API_BASE` por ese dominio y guarda el cambio.

El servicio está configurado en el plan Starter porque las descargas largas necesitan evitar la suspensión de instancias gratuitas. El coste depende del plan vigente de Render; revisa el precio antes de confirmar.

## Límites y seguridad
- Solo HTTP/HTTPS y destinos públicos.
- Sin listas de reproducción.
- Máximo 1 GiB por archivo.
- Límites por IP y máximo dos descargas simultáneas por proceso.
- CORS limitado al dominio de GitHub Pages.
- No se deben descargar obras protegidas sin autorización.
- Es una beta: el soporte depende de los extractores disponibles en yt-dlp y puede cambiar cuando las plataformas actualicen sus sitios.

No publiques cookies, contraseñas ni tokens de plataformas en el portal.
