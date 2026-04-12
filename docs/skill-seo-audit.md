# SEO Audit Skill — Gerard Fanals Web

## Objetivo
Realizar una auditoría SEO completa del sitio gerardfanals.online analizando todos los archivos del proyecto.

## Instrucciones

### 1. Análisis de archivos
Lee todos los archivos HTML del proyecto en `/Users/gerard/Documents/GitHub/trabajos-antigravity-2026/gerard-fanals-web/`:
- `index.html` (Homepage)
- `blog.html` (Blog / Noticias)
- `articulo.html` (Plantilla de artículo individual)
- `admin.html` (Dashboard - no SEO público)
- Cualquier otro HTML que exista

### 2. Checklist SEO a verificar

Para cada página pública (NO admin.html):

#### Meta Tags
- [ ] `<title>` presente y único (máx 60 chars)
- [ ] `<meta name="description">` presente (150-160 chars)
- [ ] `<meta name="viewport">` presente
- [ ] `<link rel="canonical">` presente
- [ ] Open Graph tags (og:title, og:description, og:image, og:url, og:type)
- [ ] Twitter Card tags

#### Estructura de Encabezados
- [ ] Solo 1 `<h1>` por página
- [ ] Jerarquía correcta (h1 → h2 → h3, sin saltos)
- [ ] Contenido descriptivo en los encabezados

#### Rendimiento
- [ ] Imágenes con `alt` descriptivo
- [ ] Imágenes con `loading="lazy"` (excepto above the fold)
- [ ] CSS/JS minificado o optimizado
- [ ] Fuentes con `display=swap`

#### SEO Técnico
- [ ] `robots.txt` existe
- [ ] `sitemap.xml` existe
- [ ] Enlaces internos entre páginas
- [ ] No hay enlaces rotos (href="#" o vacíos)
- [ ] Semantic HTML (header, nav, main, footer, section, article)
- [ ] `lang="es"` en `<html>`

#### Contenido
- [ ] Texto suficiente en cada página
- [ ] Palabras clave naturales
- [ ] Datos estructurados (JSON-LD schema)

### 3. Formato de salida
Genera un artifact con:
1. **Puntuación** por categoría (0-100)
2. **Problemas encontrados** con prioridad (🔴 Alta / 🟡 Media / 🟢 Baja)
3. **Para cada problema**: archivo, línea, código actual, código corregido
4. **Pregunta al usuario** qué fixes quiere aplicar

### 4. Aplicar fixes
- Aplica los fixes directamente editando los archivos
- Haz git commit y push
- No uses Supabase ni procesos intermedios
