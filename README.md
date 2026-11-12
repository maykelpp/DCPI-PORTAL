# DCPI Portal

Sitio web estático de DCPI, construido únicamente con **HTML, CSS y JavaScript**. Preparado para GitHub Pages.

## Contenido
- Publicaciones y novedades.
- Información e identidad de DCPI.
- Centro de descargas con búsqueda y filtros.
- Diseño adaptable a móviles y escritorio.

## Editar contenido
Abre `script.js`:
- `novedades`: agrega publicaciones y anuncios.
- `proyectos`: agrega aplicaciones y herramientas.
- En cada proyecto, reemplaza `url: "#"` por el enlace directo de descarga cuando el archivo esté publicado.

## Publicar en GitHub Pages
En el repositorio, entra en **Settings → Pages**. En **Build and deployment**, selecciona **Deploy from a branch**, elige `main` y la carpeta `/(root)`, y guarda.

La web no necesita servidor ni base de datos. Para publicar cambios, edita los archivos y guarda un commit en `main`.

## Estructura
- `index.html`: estructura y secciones.
- `style.css`: diseño visual y responsive.
- `script.js`: contenido y funciones interactivas.
- `assets/favicon.svg`: icono del portal.

© DCPI