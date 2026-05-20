# Documentación de Diseño - Araya Ltda.

## 1. Sistema de Diseño

### 1.1 Paleta de Colores

#### Modo Claro
```css
--aq-bg: 244 247 244           /* Fondo principal - verde muy claro */
--aq-surface: 255 255 255      /* Superficies - blanco puro */
--aq-surface-2: 240 244 240   /* Superficies secundarias */
--aq-border: 209 219 209      /* Bordes - verde grisáceo */

--aq-text: 22 31 22           /* Texto principal - verde oscuro */
--aq-muted: 95 108 95         /* Texto secundario - gris verdoso */

--aq-primary: 74 124 89        /* Primary - verde medio */
--aq-primary-hover: 56 102 70  /* Primary hover - verde más oscuro */
--aq-primary-soft: 220 235 223 /* Primary suave - verde muy claro */

--aq-accent: 201 132 45        /* Acento - dorado/anaranjado */
```

#### Modo Oscuro
```css
--aq-bg: 12 16 20              /* Fondo principal - casi negro azulado */
--aq-surface: 22 28 34        /* Superficies - azul oscuro */
--aq-surface-2: 30 38 44      /* Superficies secundarias */
--aq-border: 60 70 80         /* Bordes - gris azulado */

--aq-text: 230 235 240         /* Texto principal - blanco suave */
--aq-muted: 140 150 160       /* Texto secundario - gris claro */

--aq-primary: 74 140 90        /* Primary - verde brillante */
--aq-primary-hover: 100 160 110/* Primary hover */
--aq-primary-soft: 40 65 48   /* Primary suave */

--aq-accent: 255 200 100       /* Acento - dorado brillante */
```

### 1.2 Tipografía

- **Familia principal**: `Nunito Sans`, `Roboto`, system-ui, sans-serif
- **Tamaños**:
  - H1: 2xl (1.5rem)
  - H2: xl (1.25rem)
  - Body: base (1rem)
  - Small: sm (0.875rem)
  - XS: text-xs (0.75rem)

### 1.3 Espaciado

- Padding base: 4 (1rem)
- Gap base: 2 (0.5rem)
- Border radius: lg (0.5rem), xl (0.75rem)

### 1.4 Sombras

- `shadow-lg` para tarjetas principales
- Bordes sutiles en lugar de sombras pesadas

---

## 2. Estructura de Layout

### 2.1 Header
- **Posición**: sticky top-0
- **Contenido**:
  - Botón toggle sidebar (móvil)
  - Logo (desktop-logo.png)
  - Buscador (solo lg+)
  - Botón toggle tema
  - Dropdown usuario
- **Estilo**: bg-aq-surface con border-bottom

### 2.2 Top Menu (Navbar Horizontal)
- **Posición**: sticky top-14
- **Visibilidad**: solo desktop (hidden lg:block)
- **Contenido**: Menú horizontal con dropdowns para:
  - Maestros
  - Inventario
  - Producción
  - Ventas
  - Informes
  - Utilitarios

### 2.3 Sidebar
- **Posición**: fixed left-0
- **Ancho**: w-72
- **Visibilidad**: Mobile (oculto en desktop, toggle con botón)
- **Contenido**: Menú vertical con iconos Boxicons

### 2.4 Main Content
- **Posición**: relative con padding
- **Padding responsive**: p-4 lg:p-6

### 2.5 Footer
- **Posición**: fixed bottom-0
- **Contenido**: Fecha actual, nombre app, versión

---

## 3. Componentes

### 3.1 Tarjetas de Página
```html
<div class="bg-aq-surface border border-aq-border rounded-xl shadow-lg">
```
- Fondo blanco
- Borde sutil verde grisáceo
- Border radius xl
- Sombra légère

### 3.2 Botones

#### Botones de acción (iconos)
```html
<button class="w-10 h-10 flex items-center justify-center rounded-lg bg-aq-primary text-white">
```
- Cuadrados 40x40
- Iconos Boxicons
- Estados: default, hover (opacity-85), hidden

#### Botones primarios
```html
<button class="px-4 py-2 rounded-lg bg-aq-primary text-white hover:opacity-85">
```

#### Botones secundarios
```html
<button class="px-4 py-2 rounded-lg border border-aq-border text-aq-text hover:bg-aq-surface-2">
```

### 3.3 Formularios

#### Inputs
```html
<input class="px-3 py-2 rounded-lg border border-aq-border bg-aq-bg text-aq-text text-sm">
```
- Fondo con tinte verde
- Border radius lg
- Focus: border-aq-primary + box-shadow

#### Selects
```html
<select class="w-full px-3 py-2 rounded-lg border border-aq-border bg-aq-bg text-aq-text">
```

### 3.4 Tabs
```html
<nav class="flex -mb-px overflow-x-auto min-w-max">
  <button class="tab-btn active">...</button>
  <button class="tab-btn">...</button>
</nav>
```
- Estilo: texto con ícono
- Estado active: border-bottom primary + color primary

### 3.5 Tablas

#### Encabezado
```html
<tr class="bg-aq-surface-2 text-aq-text text-xs">
```

#### Cuerpo
```html
<tr class="hover:bg-aq-surface-2 text-xs">
```
- Scroll horizontal con overflow-x-auto
- Min-width para evitar compresión

### 3.6 Modales

#### Estructura base
```html
<div class="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
  <div class="bg-aq-surface rounded-lg p-4 sm:p-6 w-full max-w-2xl border border-aq-border max-h-[90vh] flex flex-col">
```

- Overlay: black/50 (50% opacity)
- Container: bg-aq-surface con border
- Padding responsive: p-4 sm:p-6
- Max-height: 90vh con flexbox
- Flex column para contenido(scrollable)

### 3.7 Grid de Formularios

#### Patrón responsivo
```html
<div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
```

---

## 4. Responsive Design

### Breakpoints
- **sm**: 640px - Móvil landscape
- **md**: 768px - Tablet
- **lg**: 1024px - Desktop
- **xl**: 1280px - Desktop grande

### Estrategias Responsive

#### Grid
- Mobile: 1 columna
- Tablet: 2 columnas
- Desktop: 4+ columnas

#### Visibilidad
- Sidebar: oculto en mobile, toggle con botón
- Top menu: oculto en mobile/tablet
- Buscador header: solo lg+

#### Componentes
- Inputs: width automático con min-width
- Tablas: overflow-x-auto con min-width
- Modales: max-width adaptativo (max-w-lg → max-w-2xl)

---

## 5. Iconografía

- **Biblioteca**: Boxicons (boxicons.min.css)
- **Tamaños típicos**: text-xl (1.25rem), text-lg (1.125rem), text-sm (0.875rem), text-xs (0.75rem)

### Iconos comunes
- `bx bx-plus` - Nuevo/Agregar
- `bx bx-save` - Guardar
- `bx bx-edit` - Editar
- `bx bx-trash` - Eliminar
- `bx bx-search` - Buscar
- `bx bx-x` - Cerrar
- `bx bx-exit` - Salir
- `bx bx-file` - Documento
- `bx bx-list-ul` - Lista
- `bx bx-chevron-down` - Dropdown

---

## 6. Javascript - Interacciones

### 1. Tabs
- Cambiar visibilidad de contenidos con class `hidden`
- Estado active en botón

### 2. Modales
- Toggle class `hidden`
- Flexbox para centrar
- Click outside para cerrar (implementación manual)

### 3. Dropdowns
- Toggle class `hidden` en menús
- Posicionamiento absolute

### 4. Formularios
- Validación inline con Toastify para errores
- Reset de formularios

### 5. Tablas
- Filtrado con JS (keyup event)
- Renderizado dinámico de filas

---

## 7. Estados de Interfaz

### Nuevo registro
- Modo edición activo
- Número automático (último + 1)
- Botón guardar visible
- Botones nuevo/editar/eliminar ocultos

### Ver registro existente
- Modo solo lectura
- Botones editar/eliminar visibles
- Detalles en tabs

### Editar registro
- Campos editables
- Botón guardar visible

---

## 8. Colores por Contexto

| Contexto | Color |
|----------|-------|
| Primary | `rgb(var(--aq-primary))` |
| Success | - |
| Danger/Eliminar | red-500 |
| Warning | amber-500 |
| Info | - |

---

## 9. Notas de Implementación

### Tailwind
- Usar `@apply` solo cuando sea necesario
- Prefijos de color: `bg-aq-*`, `text-aq-*`, `border-aq-*`
- Prefijos de tema dark: `html.dark .class`

### CSS Personalizado
- Theme CSS en `theme/static_src/src/theme.css`
- Custom properties para colores
- Animaciones CSS (fadeIn, spin)

### Assets
- Imágenes en `theme/static/assets/images/brand-logos/`
- Iconos: Boxicons CDN
- Fuentes: Google Fonts (Nunito Sans)

---

## 10. Historia de Diseño

### Inspiración
- Aplicación empresarial clásica
- UI limpia y funcional
- Énfasis en usability sobre aesthetics

### Evolución
- Sistema de color basado en verde (Araya)
- Dark mode reciente
- Responsive mobile-first aplicado gradualmente