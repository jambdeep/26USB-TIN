# El desafío de los siete puentes de Königsberg

Sitio web educativo e interactivo para introducir la teoría de grafos a estudiantes de Matemáticas Aplicadas a la Computación.

## ¿Qué contiene?

1. Historia de Königsberg y Euler (1736).
2. Simulador de siete puentes: elige un territorio y cruza puentes sin repetirlos, con vistas de mapa y grafo.
3. Explorador de grados de vértices y reglas de Euler.
4. Laboratorio para activar/desactivar puentes y comprobar conectividad y cantidad de vértices impares.
5. Tres aplicaciones interactivas: rutas de costo mínimo, redes sociales y grafos de conocimiento; además de ejemplos de telecomunicaciones, proyectos y circuitos.
6. Tres preguntas de autoevaluación con retroalimentación explicativa.
7. Glosario buscable de 24 conceptos.

## Ejecutar localmente

Abre `index.html` en cualquier navegador moderno. No hay dependencias, CDNs ni servicios externos.

## Publicar gratis con GitHub Pages

1. Accede a [github.com](https://github.com) e inicia sesión.
2. Crea un repositorio público llamado, por ejemplo, `laboratorio-grafos`.
3. Carga los archivos `index.html`, `styles.css` y `script.js` **en la raíz** del repositorio (no dentro de la carpeta de este ZIP).
4. En el repositorio, entra en **Settings → Pages**.
5. En **Build and deployment → Source** elige **Deploy from a branch**.
6. Selecciona **main** y **/(root)** y pulsa **Save**.
7. GitHub publicará la web en una dirección similar a `https://TU-USUARIO.github.io/laboratorio-grafos/` (sustituye TU-USUARIO por el real). Consulta **Settings → Pages → Visit site** para ver la URL definitiva.

Página oficial: https://docs.github.com/en/pages/getting-started-with-github-pages/configuring-a-publishing-source-for-your-github-pages-site

## Precisiones didácticas

- Los siete puentes están modelados como un **multigrafo** con grados 3, 5, 3 y 3. Las aristas paralelas se distinguen individualmente.
- El simulador de rutas modernas utiliza **costos inventados** para el ejemplo; no son datos geográficos reales.
- El módulo de grafos de conocimiento ilustra relaciones y consultas, no incorpora un modelo generativo real.
- La condición euleriana se evalúa sobre los vértices con aristas: un grafo sin aristas tiene tratamiento especial en el laboratorio.
- El mapa decorativo no pretende reproducir exactamente la topografía histórica.
- Terminología de sendero, camino y trayectoria según las convenciones indicadas en el glosario; algunos libros utilizan denominaciones alternativas.

## Personalizar

- Cambia el título y los textos en `index.html`.
- Modifica colores y tipografía en `styles.css` (variables al inicio).
- Edita escenarios, glosario y preguntas en `script.js`.

No se recopilan datos personales ni se utilizan cookies o servicios de terceros.


## Actualización v3

- Experiencia móvil: menú compacto, diagramas SVG escalables, controles táctiles amplios y contenido apilado.
- Descubrimiento de Euler: exploración de grados y casos interactivos 0, 2 y 4.
- Laboratorio: desafíos guiados, predicción, comprobación y demostración de un recorrido existente.
- Aplicaciones: rutas manuales comparadas con Dijkstra, enlaces críticos en redes sociales y construcción de relaciones dirigidas en IA.
- Los archivos son estáticos y compatibles con GitHub Pages y Live Server.

## Publicar

Sube `index.html`, `styles.css` y `script.js` a la raíz de un repositorio público. En Settings → Pages, selecciona `Deploy from a branch`, `main` y `/(root)`.
