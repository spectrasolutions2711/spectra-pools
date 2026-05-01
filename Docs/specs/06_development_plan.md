# Spectra Pool — Plan de Desarrollo

**Fecha:** 2026-05-01  
**Versión:** 1.0  
**Tiempo estimado total:** ~16 semanas

---

## Stack tecnológico

| Capa | Tecnología | Versión |
|------|-----------|---------|
| Build | Vite | 5.x |
| Framework | React + TypeScript | 18.x / 5.x |
| UI Components | shadcn/ui + Tailwind CSS | latest |
| Icons | lucide-react | latest |
| Backend | Supabase (PostgreSQL + Auth + Storage) | latest |
| Data fetching | TanStack React Query | v5 |
| Formularios | React Hook Form + Zod | v7 / v3 |
| Routing | React Router DOM | v6 |
| Gráficas | Recharts | latest |
| Deploy | Hostinger (FTP via GitHub Actions) | — |
| Repositorio | GitHub | — |
| PWA | Vite PWA plugin | — |

**Referencia técnica:** `C:\Users\roafr\Documents\solace-retreats-hub` (misma arquitectura)

---

## Fase 1 — Fundación (Semanas 1-2)

### Objetivos
Proyecto funcionando, autenticación con 3 roles, deploy automático a Hostinger.

### Tareas
- [ ] Crear repositorio GitHub `spectra-pool`
- [ ] Scaffold proyecto con Vite + React + TypeScript
- [ ] Configurar Tailwind CSS + shadcn/ui
- [ ] Crear proyecto en Supabase
- [ ] Implementar schema base de datos completo (todas las tablas)
- [ ] Configurar RLS policies por rol (Admin / Technician / Client)
- [ ] Auth: login, registro, recuperación de contraseña
- [ ] Middleware de rutas protegidas por rol
- [ ] Layout Admin (sidebar + header + content)
- [ ] Layout Técnico (mobile-first, bottom navigation)
- [ ] Layout Cliente (clean, read-only)
- [ ] GitHub Actions workflow → build → deploy FTP Hostinger
- [ ] Variables de entorno: VITE_SUPABASE_URL, VITE_SUPABASE_PUBLISHABLE_KEY
- [ ] Secrets GitHub: FTP_SERVER, FTP_USERNAME, FTP_PASSWORD

### Entregable
App deployada en Hostinger con login funcional y 3 roles diferenciados.

---

## Fase 2 — Módulo Admin: Gestión de datos (Semanas 3-5)

### Objetivos
Admin puede gestionar toda la estructura de datos del negocio.

### Tareas
- [ ] CRUD Clientes (empresas)
- [ ] CRUD Ubicaciones por cliente (con mapa/coordenadas)
- [ ] CRUD Áreas por ubicación (Pool / SPA / Tank)
- [ ] Configuración de parámetros objetivo por área (target pH, ORP, etc.)
- [ ] CRUD Técnicos (con asignación de usuario Auth)
- [ ] CRUD Usuarios Cliente (con asignación a cliente)
- [ ] CRUD Rutas (asignación técnico + días de servicio)
- [ ] CRUD Paradas de ruta (ubicaciones en orden)
- [ ] Vista de mapa de ruta (Google Maps embed)
- [ ] Dashboard Admin: visitas del día, alertas activas, técnicos en campo
- [ ] Catálogo de productos/químicos (con precio)
- [ ] Gestión de inventario (entradas + stock actual)

### Entregable
Admin puede crear clientes, ubicaciones, piscinas, técnicos y rutas.

---

## Fase 3 — App del Técnico en Campo (Semanas 6-8)

### Objetivos
Técnico puede completar una visita completa desde el celular, incluyendo todas las lecturas de la planilla.

### Tareas
- [ ] Vista "Mi Ruta del Día" con lista de ubicaciones
- [ ] Progreso de ruta (0/7 completadas)
- [ ] Botón "Navigate" → Google Maps con dirección
- [ ] Check-in con hora automática
- [ ] Checklist de tareas diarias (Empty Baskets, Skim, Vacuum, Filter, Brush)
- [ ] Formulario de operaciones de mantenimiento (BW, CBP, CFPC, CLCL, CLAC, CLTI, RLCL, RLAC, RTF, VAC)
- [ ] Formulario POOL TEST: pH, ORP, ORP Setpoint, NST, Free CL, Total CL, AL, SB, Total Hardness, Phosphates, Salt, TEM, STA
- [ ] Formulario POOL HEATER: pH, ORP, SET, NST, CL, STA, TEM
- [ ] Formulario SPA TEST: mismos campos que POOL TEST
- [ ] Formulario SPA HEATER: mismos campos que POOL HEATER
- [ ] Formulario TANK: CL, STA, TEM
- [ ] Validación visual de rangos en tiempo real (verde/amarillo/rojo)
- [ ] LSI Calculator automático (calcula con pH, Alcalinidad, Dureza, TEM, CYA)
- [ ] Formulario de dosificaciones (producto + cantidad + unidad → descuenta inventario)
- [ ] Subida de fotos (Supabase Storage)
- [ ] Campo de notas internas
- [ ] Items Needed (lista de materiales requeridos)
- [ ] Check-out con hora y duración calculada
- [ ] Historial rápido: últimas 5 lecturas de la piscina actual
- [ ] Auto-email de resumen al manager del GYM al completar visita
- [ ] Modo offline básico (localStorage) + sincronización al recuperar señal
- [ ] Indicador de estado de sincronización ("All synced" / "Pending: 2 visits")

### Entregable
Técnico puede completar el flujo completo de una visita desde el celular sin necesidad de planilla física.

---

## Fase 4 — Inventario y Costos (Semanas 9-10)

### Objetivos
Control de costos real por piscina/cliente.

### Tareas
- [ ] Catálogo de productos con precio de costo
- [ ] Registro de compras / entradas al inventario
- [ ] Consumo automático al registrar dosificación en visita
- [ ] Alertas de stock bajo (notificación al Admin)
- [ ] Dashboard de consumo: por piscina / por ubicación / por período
- [ ] Costo real por piscina/mes (basado en químicos consumidos + tiempo de servicio)
- [ ] Margen por cliente (costo real vs precio facturado)

### Entregable
Admin ve cuánto cuesta mantener cada piscina y cuál es el margen por cliente.

---

## Fase 5 — Portal del Cliente (Semanas 11-12)

### Objetivos
Manager del GYM puede ver el estado de sus piscinas y generar reportes.

### Tareas
- [ ] Dashboard cliente: resumen de todas sus ubicaciones
- [ ] Estado actual por ubicación (lecturas del último servicio con colores)
- [ ] Alertas activas (parámetros fuera de rango)
- [ ] Historial de visitas por ubicación (fecha, técnico, duración)
- [ ] Detalle de visita: lecturas, tareas, dosificaciones, fotos
- [ ] Gráficas de tendencia por parámetro: pH, ORP, Cloro (30/60/90 días) — Recharts
- [ ] Benchmarking entre ubicaciones (si el cliente tiene varias)
- [ ] Reporte mensual de servicio descargable (PDF)
- [ ] Historial de lecturas exportable (CSV)
- [ ] Reporte de compliance para Health Department (2 años de registros)

### Entregable
Manager de EOS Fitness puede acceder, ver todos sus GYMs y descargar reportes de inspección.

---

## Fase 6 — Facturación, Reportes Admin y Features Avanzados (Semanas 13-14)

### Objetivos
Admin puede facturar clientes y tiene visibilidad completa del negocio.

### Tareas
- [ ] Generación de facturas por cliente y período
- [ ] Líneas de factura: visitas + químicos usados + otros
- [ ] Vista previa y descarga en PDF
- [ ] Registro de pagos recibidos
- [ ] Historial de facturas por cliente
- [ ] Work Orders: crear, asignar, seguimiento de estados
- [ ] Dashboard Admin completo con métricas de rentabilidad
- [ ] Alertas predictivas: tendencia de lecturas hacia fuera de rango
- [ ] Recolección de feedback post-visita (email automático al cliente con rating)
- [ ] Reportes exportables Admin (CSV/PDF): consumo, visitas, facturación

### Entregable
Sistema completo de facturación y reportes administrativos.

---

## Fase 7 — PWA, Pulido y Producción (Semana 15-16)

### Objetivos
App installable en celular, pruebas completas, deploy a producción.

### Tareas
- [ ] Configurar Vite PWA plugin (service worker, manifest)
- [ ] Ícono de app para iOS y Android
- [ ] Pruebas completas en dispositivos móviles reales
- [ ] Optimización de performance (lazy loading, imágenes)
- [ ] Pruebas del flujo completo con usuario real (Nestor Roa)
- [ ] Corrección de bugs encontrados en pruebas
- [ ] Configurar dominio en Hostinger
- [ ] Deploy final a producción
- [ ] Documentación de uso básica para técnicos y managers

### Entregable
Spectra Pool en producción, installable en celular, listo para uso real con EOS Fitness.

---

## Configuración de deploy (GitHub Actions)

```yaml
# .github/workflows/deploy.yml
# Trigger: push a rama main
# Steps:
#   1. Checkout código
#   2. Setup Node 20
#   3. npm install
#   4. npm run build (genera dist/)
#   5. Deploy dist/ → Hostinger public_html/ via FTP

# Secrets requeridos en GitHub:
#   VITE_SUPABASE_URL
#   VITE_SUPABASE_PUBLISHABLE_KEY
#   FTP_SERVER
#   FTP_USERNAME
#   FTP_PASSWORD
```

---

## Prioridades de desarrollo

### Must-have (MVP)
1. Auth con 3 roles
2. Gestión de clientes, ubicaciones y piscinas
3. Rutas y asignación de técnicos
4. Flujo completo de visita del técnico (checklist + lecturas + dosificaciones)
5. Dashboard básico Admin
6. Portal básico Cliente (solo lectura)

### Should-have
7. Inventario y costos
8. Facturación básica
9. Gráficas de tendencia
10. Auto-email post-visita
11. LSI Calculator
12. Modo offline

### Nice-to-have (fases futuras)
13. Alertas predictivas (ML/AI)
14. Integración QuickBooks
15. Recolección de feedback
16. Integración con sensores IoT
17. Benchmarking avanzado entre empresas del sector
