# IHC-GRUPO — Plataforma de Pruebas de Usabilidad

> **Materia:** Interacción Humano Computador (IHC) · Universidad Técnica de Ambato · 5to semestre  
> **Docente:** José Caiza  
> **Equipo:** Grupo IHC

Aplicación web para planificar, ejecutar y analizar pruebas de usabilidad. Cubre todo el ciclo: definición del plan → guión de moderación → registro de observaciones → hallazgos → reportes.

---

## Índice

- [Stack tecnológico](#stack-tecnológico)
- [Estructura del proyecto](#estructura-del-proyecto)
- [Instalación y ejecución](#instalación-y-ejecución)
- [Vistas y funcionalidades](#vistas-y-funcionalidades)
- [Componentes reutilizables](#componentes-reutilizables)
- [Proceso de Prototipado — Rúbrica HCI](#proceso-de-prototipado--rúbrica-hci)

---

## Stack tecnológico

| Tecnología | Versión | Rol |
|---|---|---|
| React | 18.3 | UI library |
| TypeScript | 5.6 | Tipado estático |
| Vite | 7.0 | Bundler / Dev server |
| Tailwind CSS | 4.2 | Estilos utilitarios |
| Supabase | 2.99 | Backend as a Service (auth + base de datos) |
| React Router DOM | 7.14 | Navegación SPA |
| Lucide React | 0.577 | Iconografía |

---

## Estructura del proyecto

```
src/
├── components/
│   ├── AutoGrowTextarea.tsx    # Textarea que crece con el contenido
│   ├── FieldWarning.tsx        # Mensajes de error inline + CharCounter + fieldClass
│   ├── FlowProgress.tsx        # Indicador de progreso entre pasos
│   ├── Header.tsx              # Cabecera global
│   ├── SeveritySuggestion.tsx  # Sugerencia de severidad automática
│   ├── SuggestionsInput.tsx    # Input con autocompletado
│   ├── TabNavigation.tsx       # Navegación por pestañas
│   └── validation.ts           # validateDate(), MAX_CHARS, clamp()
│
├── controllers/
│   ├── useAuth.ts              # Sesión con Supabase Auth
│   └── useUsabilityApp.ts      # Lógica central: CRUD de plan, tareas, observaciones, hallazgos
│
├── lib/
│   └── supabaseClient.ts       # Cliente Supabase configurado
│
├── models/
│   └── types.ts                # Interfaces: TestPlan, TestTask, Observation, Finding…
│
├── utils/
│   └── observationsAnalysis.ts # Análisis estadístico de observaciones
│
├── views/
│   ├── LoginView.tsx
│   ├── RegisterView.tsx
│   ├── GlobalDashboard.tsx     # Lista de planes del usuario
│   ├── PlanView.tsx            # Formulario del plan ← Persona 1
│   ├── ScriptView.tsx          # Guión de moderación ← Persona 1
│   ├── ObservationsView.tsx    # Registro de sesión en vivo
│   ├── FindingsView.tsx        # Consolidación de hallazgos
│   ├── ReportsView.tsx         # Reporte ejecutivo
│   ├── DashboardView.tsx       # Métricas por plan
│   └── SettingsView.tsx        # Perfil y configuración
│
├── App.tsx                     # Rutas, lazy loading, guards de autenticación
└── main.tsx
```

---

## Instalación y ejecución

**Prerrequisitos:** Node.js 18+, npm 9+, cuenta en [Supabase](https://supabase.com)

```bash
# 1. Clonar el repositorio
git clone https://github.com/tu-usuario/IHC-GRUPO.git
cd IHC-GRUPO

# 2. Instalar dependencias
npm install

# 3. Configurar variables de entorno
cp .env.example .env
# Editar .env:
# VITE_SUPABASE_URL=https://xxxx.supabase.co
# VITE_SUPABASE_ANON_KEY=eyJ...

# 4. Levantar servidor de desarrollo
npm run dev
# → http://localhost:5173
```

**Scripts disponibles:**

```bash
npm run dev       # Servidor con HMR
npm run build     # Build de producción
npm run preview   # Vista previa del build
npm run lint      # ESLint
```

---

## Vistas y funcionalidades

### `PlanView` — Plan de prueba

Formulario en 4 secciones para definir el plan antes de ejecutar la sesión:

1. **Contexto general** — producto, objetivo, perfil de usuario
2. **Tareas del test** — hasta 10 tareas con escenario, resultado esperado, métrica y criterio de éxito
3. **Roles y logística** — método, duración, fecha, lugar/canal, moderador, observador, herramientas
4. **Notas del moderador** — campo libre para instrucciones adicionales

Comportamientos clave: autoguardado en `onBlur`, validación inline sin submit, doble confirmación al borrar, responsive con `useWindowWidth()`, contador `N/10 tareas`, atributos ARIA en todos los campos obligatorios.

---

### `ScriptView` — Guión de moderación

Pantalla para redactar el guión que el moderador leerá durante la sesión:

1. **Contexto de la sesión** — método, duración y lugar del Plan (solo lectura)
2. **Inicio de la sesión** — lista fija de instrucciones de apertura
3. **Tareas a leer** — tabla editable conectada al Plan via `TaskComboBox`
4. **Cierre** — preguntas pre-cargadas con campo de respuesta editable

Comportamientos clave: `TaskComboBox` con búsqueda parcial en tiempo real, estado vacío con CTA "Ir a definir Producto", `FieldWarning` al salir del combo vacío, feedback de guardado con `aria-live="polite"`.

---

### Otras vistas

| Vista | Descripción |
|---|---|
| `ObservationsView` | Registro de observaciones por participante y tarea durante la sesión |
| `FindingsView` | Hallazgos con severidad, prioridad y estado de resolución |
| `ReportsView` | Reporte ejecutivo con métricas y exportación |
| `DashboardView` | Métricas aggregadas: tasa de éxito, tiempo promedio, errores |
| `GlobalDashboard` | Lista de todos los planes del usuario con acceso rápido |

---

## Componentes reutilizables

### `FieldWarning` + `CharCounter` + `fieldClass`

```tsx
import { FieldWarning, CharCounter, fieldClass } from '../components/FieldWarning';

// Borde condicional según estado de validación
<input className={fieldClass(warn.objetivo, "w-full p-3 border rounded-lg", 'error')} />

// Mensaje de error inline
<FieldWarning show={warn.objetivo} message="El objetivo es obligatorio." variant="error" />

// Contador de caracteres
<CharCounter value={localPlan.objective} />
```

### `AutoGrowTextarea`

Textarea que ajusta su altura al contenido. Acepta los mismos props que `<textarea>` nativo.

```tsx
<AutoGrowTextarea
  value={localPlan.moderator_notes}
  onChange={(e) => handleChange({ moderator_notes: e.target.value })}
  onBlur={(e) => handleAutoSave({ moderator_notes: e.target.value })}
  rows={3}
/>
```

### `validateDate()`

```ts
import { validateDate } from '../components/validation';

const result = validateDate('2025-05-01');
// → { valid: boolean, message?: string }
```

Regla: la fecha no puede estar en el pasado ni a más de 2 semanas en el futuro.

---

## Proceso de Prototipado — Rúbrica HCI

> **Responsable:** Persona 1 · **Tema:** Sketching + Wireframes · **Puntaje:** 1 pt  
> **Rama:** `feature/hci-prototipos-persona1` · **Pantallas:** `PlanView` y `ScriptView`

### Progresión Lo-Fi → Hi-Fi

| Fase | Artefacto | Descripción |
|------|-----------|-------------|
| **Lo-Fi** | Sketching en papel | Bocetos durante la sesión de diseño grupal. Se definieron jerarquía de secciones, flujo Plan → Guión y campos obligatorios de cada vista. |
| **Mid-Fi** | Wireframe de cajas | Diagrama de bloques: cabeceras de sección, áreas de formulario, tabla de tareas, barra de acciones. |
| **Hi-Fi** | Implementación React | La app en ejecución **es** el wireframe Hi-Fi funcional. Cada decisión de layout, color, tipografía e interacción refleja lo acordado en las fases anteriores. |

> Los sketches en papel se usaron como artefactos de sesión interna. La evidencia del proceso es la implementación Hi-Fi documentada a continuación, verificable ejecutando `npm run dev`.

---

### Decisiones de diseño — `PlanView`

**Jerarquía visual con cabeceras `navy-light`**  
Las 4 secciones usan un color corporativo consistente en sus cabeceras. Esto sigue el patrón F de lectura ocular: el usuario escanea verticalmente y las cabeceras señalizan dónde empieza cada bloque temático, sin necesidad de leer cada campo.

**Feedback sin submit**  
Ningún campo espera un botón "Guardar" para validar. `FieldWarning` aparece inline debajo del campo afectado. Los campos críticos (`product`, `objective`, `moderator`) activan validación desde el primer cambio en `handleChange`, no solo al hacer `onBlur`. Esto cumple el principio de Nielsen de feedback inmediato.

**Accesibilidad WCAG 2.1 AA**  
Todos los inputs obligatorios tienen `aria-required="true"` y `aria-invalid={warn.campo || undefined}`. El uso de `|| undefined` evita emitir `aria-invalid="false"` en estado válido, que algunos lectores de pantalla interpretan de forma inconsistente. Aplica a los criterios 1.3.1, 3.3.1 y 4.1.2 de WCAG.

**Límite de tareas con contador dinámico**  
El `<h3>` de la sección 2 muestra `N/10 tareas` en blanco semi-transparente. Al llegar a 10 cambia a `text-red-300` con el mensaje `— límite alcanzado`. Ambos botones "Añadir Tarea" (móvil y desktop) se deshabilitan automáticamente con `disabled={tasks.length >= 10}`, eliminando la posibilidad de superar el límite sin feedback claro.

**Responsive sin media queries ad-hoc**  
`useWindowWidth()` devuelve el ancho de ventana en tiempo real. Por encima de 1024 px se renderiza `TaskRow` (tabla); por debajo, `TaskCard` (tarjetas). La decisión es de JavaScript, no de CSS, lo que permite compartir la lógica de negocio entre ambas representaciones.

**Prevención de borrado accidental**  
El botón eliminar no ejecuta la acción directamente. Muestra dos botones: ✓ (confirmar) y ✗ (cancelar). Solo tras confirmar se llama a `onDeleteTask`. Previene el error más común en formularios con listas editables (principio de Nielsen: prevención de errores).

---

### Decisiones de diseño — `ScriptView`

**`TaskComboBox` — conexión entre vistas**  
Filtra en tiempo real las tareas definidas en `PlanView` usando búsqueda parcial sobre `scenario`. El moderador puede seleccionar del plan o escribir texto libre. Refuerza el modelo mental: el guión es una extensión del plan, no una pantalla independiente. La selección desde el plan garantiza consistencia entre la planificación y la ejecución.

**Estado vacío accionable**  
Si `testPlan.product` está vacío, `ScriptView` no muestra un formulario roto: muestra una pantalla de estado vacío con ícono, mensaje explicativo y el CTA "Ir a definir Producto" que navega directamente a `PlanView`. Elimina callejones sin salida (principio de Nielsen: visibilidad del estado del sistema).

**Validación completa del `TaskComboBox`**  
`touch('script_task_text')` se activa en `onChange` (mientras escribe) y en `onBlur` (al salir del campo). Si el campo queda vacío al salir, `FieldWarning` muestra `"El texto de la tarea es obligatorio para el guion."` Antes de este ajuste, `touched` nunca se activaba si el usuario entraba y salía sin escribir nada, dejando el error silencioso.

**Feedback de guardado accesible**  
El header incluye un nodo `aria-live="polite"` que anuncia el estado del guardado. En pantalla alterna entre "Guardando..." (spinner animado) y "Cambios guardados" (check verde). Los lectores de pantalla anuncian el cambio sin interrumpir el foco del usuario.

**Preguntas de cierre pre-cargadas**  
`closing_questions` se inicializa con preguntas estándar de usabilidad (satisfacción general, dificultades, expectativas vs. realidad). El moderador llega a la sesión con un guión funcional por defecto, reduciendo la carga cognitiva de preparación. Las respuestas son editables y se persisten en Supabase.

---

### Cómo verificar en el navegador

```bash
npm install && npm run dev
# → http://localhost:5173
```

| Pantalla | Ruta | Verificar |
|---|---|---|
| `PlanView` | `/plan/:id/plan` | Contador de tareas, `aria-invalid`, doble confirmación al borrar, responsive |
| `ScriptView` | `/plan/:id/script` | `TaskComboBox`, estado vacío, `FieldWarning` al salir del campo vacío |

Todos los comportamientos son verificables directamente en el navegador sin configuración adicional más allá de las variables de entorno de Supabase.