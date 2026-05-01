# Spectra Pool — Roles y Niveles de Acceso

**Fecha de análisis:** 2026-05-01  
**Versión:** 1.0

## Arquitectura de roles

```
┌─────────────────────────────────────────────────────┐
│                   SPECTRA POOL                      │
├──────────────┬──────────────────┬───────────────────┤
│    ADMIN     │   TECHNICIAN     │   CLIENT USER     │
│              │  (Pool Service)  │  (EOS Fitness)    │
├──────────────┼──────────────────┼───────────────────┤
│ Gestión total│ App de campo     │ Portal de reportes│
│ de sistema   │ mobile-first     │ solo lectura      │
└──────────────┴──────────────────┴───────────────────┘
```

---

## ROL 1 — ADMIN (Dueño / Supervisor)

Acceso completo a toda la plataforma.

### Gestión de Usuarios
- Crear / editar / desactivar técnicos
- Crear / editar usuarios cliente (asignar a sus ubicaciones)
- Asignar roles y permisos
- Reset de contraseñas

### Gestión de Clientes y Propiedades
- Crear clientes (empresa: EOS Fitness, etc.)
- Crear ubicaciones por cliente (EOS Sarasota, EOS Midtown, etc.)
- Por cada ubicación: dirección, contacto, notas, fotos del lugar
- Asignar días de visita por ubicación

### Gestión de Piscinas por Ubicación
- Configurar áreas: Pool, SPA, Tank (cuáles aplican por ubicación)
- Galones, sistema de filtración, equipos instalados
- Parámetros objetivo configurables (target pH, target ORP, etc.)
- Historial completo de lecturas

### Gestión de Rutas
- Crear rutas y asignar técnico
- Agregar/quitar ubicaciones de una ruta
- Definir orden de visita y días de servicio
- Ver mapa de ruta con Google Maps

### Dashboard Administrativo
- Visitas completadas hoy / esta semana
- Piscinas con lecturas fuera de rango (alertas)
- Técnicos en campo (progreso en tiempo real)
- Consumo semanal de químicos
- Costos por cliente / por ubicación / por período
- Benchmarking entre ubicaciones del mismo cliente

### Inventario de Químicos
- Catálogo de productos con costo unitario
- Registro de compras / entradas
- Consumo automático por visita
- Stock actual con alertas de stock bajo
- Costo real por piscina / por mes

### Facturación
- Generar facturas por cliente (mensual o por período)
- Líneas de factura: visitas + químicos usados
- Descarga en PDF
- Registro de pagos
- Historial por cliente
- Integración futura: QuickBooks

### Reportes y Exportación
- Reporte de lecturas históricas por piscina
- Reporte de consumo de químicos
- Reporte de operaciones de mantenimiento
- Reportes de compliance para Health Department (2 años retención)
- Exportación CSV / PDF
- Gráficas de tendencia (pH, ORP, Cloro en el tiempo)

---

## ROL 2 — TECHNICIAN (Piscinero / Pool Service Worker)

App diseñada mobile-first para uso en campo.

### Vista principal: Mi Ruta del Día
- Lista de ubicaciones asignadas ordenadas por ruta
- Progreso: 0/7 completadas
- Distancia y tiempo estimado entre paradas
- Botón "Navegar" → Google Maps

### Flujo de visita completo
1. **Check-in** — hora de llegada (automática o manual) + geolocalización opcional
2. **Checklist de tareas diarias** — swipe/tap para completar
3. **Operaciones de mantenimiento** — BW, CBP, CFPC, CLCL, CLAC, CLTI, RLCL, RLAC, RTF, VAC
4. **Lecturas de agua** — Pool TEST/HEATER + SPA TEST/HEATER + TANK (ver doc 03)
5. **Dosificaciones / Químicos aplicados** (ver doc 03)
6. **LSI Calculator** — cálculo automático del índice de saturación
7. **Fotos** — equipo, lecturas, problemas encontrados
8. **Notas internas** — no visibles para el cliente
9. **Items Needed** — materiales o repuestos requeridos
10. **Check-out** — hora de salida + duración calculada

### Funcionalidades adicionales
- Ver historial de las últimas 5 lecturas por piscina
- Ver work orders pendientes por ubicación
- Modo offline con sincronización posterior
- Estado de sincronización visible ("All synced" / "Pending sync")
- Alertas visuales de lecturas fuera de rango (rojo/amarillo/verde)

---

## ROL 3 — CLIENT USER (EOS Fitness Manager)

Portal de solo lectura. Solo ve SUS ubicaciones.

### Dashboard del Cliente
- Resumen de todas sus ubicaciones
- Estado actual de cada piscina (lecturas del último servicio)
- Alertas activas (parámetros fuera de rango)
- Próxima visita programada

### Por cada Ubicación
- Historial de visitas con fecha, técnico y duración
- Últimas lecturas con indicador de rango (verde/amarillo/rojo)
- Gráficas de tendencia: pH, ORP, Cloro (últimos 30/60/90 días)
- Registro de químicos aplicados por fecha
- Fotos del servicio

### Reportes Descargables
- Reporte mensual de servicio (PDF)
- Historial de lecturas (CSV)
- Registro de mantenimiento realizado
- Reportes para inspección del Health Department

### Benchmarking multi-ubicación (para managers de cadena)
- Comparación de consumo entre sus ubicaciones
- Ranking de piscinas por desempeño
- Alertas consolidadas para manager corporativo

### NO tiene acceso a
- Costos / precios / inventario
- Otros clientes
- Notas internas del técnico
- Configuración del sistema
