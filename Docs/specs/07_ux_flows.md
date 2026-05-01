# Spectra Pool — Flujos de Usuario (UX Flows)

**Fecha de análisis:** 2026-05-01  
**Versión:** 1.0

---

## Flujo 1 — TÉCNICO: Día de trabajo completo

```
LOGIN
  │
  ▼
MI RUTA DEL DÍA
  ├── Lista de ubicaciones (orden de ruta)
  ├── Progreso: 2/7 completadas
  ├── Distancia y ETA por parada
  └── Estado de sync ("All synced ✓")
  │
  ▼ [Tap en ubicación]
DETALLE DE UBICACIÓN
  ├── Dirección + botón "Navigate" → Google Maps
  ├── Historial últimas 5 lecturas (comparación rápida)
  └── Work orders pendientes
  │
  ▼ [Check-in]
VISITA EN PROGRESO
  │
  ├── [TAB 1] CHECKLIST
  │     ├── Empty Baskets ✓
  │     ├── Skim Surface ✓
  │     ├── Vacuum
  │     ├── Filter Cleaned
  │     └── Brush Pool
  │
  ├── [TAB 2] MAINTENANCE OPS
  │     ├── BW (Backwash)
  │     ├── CBP (Clean Basket Pump)
  │     ├── CFPC, CLCL, CLAC, CLTI...
  │     └── [área: POOL / SPA / TANK]
  │
  ├── [TAB 3] READINGS
  │     ├── POOL
  │     │     ├── TEST: pH, ORP, SET, NST, CL, TCL, AL, SB, Hardness, Phos, Salt, TEM, STA
  │     │     └── HEATER: pH, ORP, SET, NST, CL, STA, TEM
  │     ├── SPA
  │     │     ├── TEST: [mismos campos]
  │     │     └── HEATER: [mismos campos]
  │     ├── TANK: CL, STA, TEM
  │     └── LSI Calculator [auto-calculado] ◄── NUEVO
  │           └── Indicador: Corrosive / Balanced / Scale-forming
  │
  ├── [TAB 4] CHEMICALS
  │     ├── Liquid Chlorine: [qty] [unit]
  │     ├── Chlorine Tabs: [type] [qty]
  │     ├── Shock: [qty] [unit]
  │     ├── pH UP/DOWN: [qty] [unit]
  │     ├── Alkalinity UP/DOWN: [qty] [unit]
  │     ├── Cyanuric Acid: [qty] [unit]
  │     ├── Phosphates Reducer: [qty] [unit]
  │     └── Chlorine Reducer: [qty] [unit]
  │
  ├── [TAB 5] PHOTOS & NOTES
  │     ├── Agregar fotos (cámara o galería)
  │     ├── Notas internas (no visibles para cliente)
  │     └── Items Needed (materiales requeridos)
  │
  └── [CHECK-OUT]
        ├── Hora de salida automática
        ├── Duración calculada
        └── Email automático al manager del GYM ◄── NUEVO
              └── Resumen: lecturas + tareas + fotos
```

---

## Flujo 2 — ADMIN: Configuración inicial del sistema

```
LOGIN (Admin)
  │
  ▼
DASHBOARD ADMIN
  ├── Alertas activas (piscinas fuera de rango)
  ├── Progreso de hoy (X/Y visitas completadas)
  ├── Consumo de químicos esta semana
  └── Costos por cliente (top 5)
  │
  ▼ [Configurar nuevo cliente]
NUEVO CLIENTE
  ├── Nombre empresa, contacto, email, teléfono
  └── Dirección de facturación
  │
  ▼ [Agregar ubicación]
NUEVA UBICACIÓN
  ├── Nombre (EOS Sarasota), dirección, ciudad, estado, zip
  ├── Contacto en ubicación + email (para reportes)
  ├── Días de servicio: [lun] [mar] [mié] [jue] [vie] [sáb] [dom]
  └── Coordenadas (auto desde dirección o manual)
  │
  ▼ [Configurar áreas]
ÁREAS DE LA UBICACIÓN
  ├── POOL: galones, tipo de filtro, sistema, ¿tiene calentador?
  │     └── Parámetros objetivo: pH min/max/target, ORP, CL, AL, etc.
  ├── SPA: [mismos campos]
  └── TANK: activo sí/no
  │
  ▼ [Crear ruta]
NUEVA RUTA
  ├── Nombre (Tampa North)
  ├── Técnico asignado
  ├── Días: [lun] [mié] [vie]
  └── Agregar paradas en orden (drag & drop)
        ├── 1. EOS Sarasota
        ├── 2. EOS Riverview
        └── ...
```

---

## Flujo 3 — CLIENT USER: Ver estado de sus piscinas

```
LOGIN (EOS Fitness Manager)
  │
  ▼
DASHBOARD (solo sus ubicaciones)
  ├── Cards por ubicación con estado actual:
  │     ├── EOS Sarasota — pH: 7.4 ✓ | ORP: 710 ✓ | CL: 3.2 ✓
  │     ├── EOS Midtown — pH: 7.8 ⚠️ | ORP: 620 ⚠️ | CL: 5.0 ✓
  │     └── EOS Hudson — pH: 7.3 ✓ | ORP: 690 ✓ | CL: 2.8 ✓
  ├── Alertas activas (si las hay)
  └── Última visita + próxima visita
  │
  ▼ [Tap en ubicación]
DETALLE DE UBICACIÓN
  ├── [TAB: Dashboard]
  │     ├── Lecturas del último servicio (POOL + SPA)
  │     ├── Indicadores de rango (verde/amarillo/rojo)
  │     └── Próxima visita programada
  │
  ├── [TAB: History]
  │     ├── Lista de visitas (fecha, técnico, duración)
  │     └── Tap en visita → ver detalle completo
  │
  ├── [TAB: Trends]
  │     ├── Selector: 30 / 60 / 90 días
  │     ├── Gráfica pH en el tiempo
  │     ├── Gráfica ORP en el tiempo
  │     └── Gráfica Free Chlorine en el tiempo
  │
  └── [TAB: Reports]
        ├── Reporte mensual PDF
        ├── Historial de lecturas CSV
        └── Reporte Health Department PDF ◄── NUEVO
```

---

## Validación visual de lecturas (código de colores)

| Color | Significado | Acción |
|-------|------------|--------|
| 🟢 Verde | Dentro del rango ideal | Ninguna |
| 🟡 Amarillo | Fuera del rango ideal pero aceptable | Monitorear |
| 🔴 Rojo | Fuera del rango aceptable | Acción inmediata requerida |
| ⚫ Gris | Sin lectura registrada | Registrar |

### Rangos de referencia por parámetro

| Parámetro | Crítico bajo | Ideal | Crítico alto |
|-----------|-------------|-------|--------------|
| pH | < 7.0 | 7.2 – 7.6 | > 8.0 |
| ORP | < 600 mV | 650 – 750 mV | > 800 mV |
| Free Chlorine | < 1 ppm | 2 – 4 ppm | > 10 ppm |
| Total Alkalinity | < 60 ppm | 80 – 120 ppm | > 180 ppm |
| Cyanuric Acid | < 20 ppm | 30 – 50 ppm | > 80 ppm |
| Total Hardness | < 150 ppm | 200 – 400 ppm | > 500 ppm |
| Phosphates | — | < 0.5 ppm | > 1.0 ppm |
| Temperature (Pool) | < 75°F | 78 – 82°F | > 86°F |
| Temperature (Spa) | < 98°F | 100 – 104°F | > 106°F |

---

## LSI Calculator (Langelier Saturation Index)

**Fórmula:** LSI = pH + TF + CF + AF − 12.1

| Variable | Descripción |
|---------|-------------|
| pH | pH medido |
| TF | Factor de temperatura (tabla de conversión) |
| CF | Factor de calcio/dureza |
| AF | Factor de alcalinidad |

**Interpretación:**
- LSI < -0.3 → Agua CORROSIVA (daña superficies y equipos)
- -0.3 a +0.3 → Agua BALANCEADA ✓
- LSI > +0.3 → Agua INCRUSTANTE (forma escamas en equipos)

---

## Auto-email post-visita al cliente

**Trigger:** Al completar check-out de una visita

**Destinatario:** Email del contacto de la ubicación

**Contenido del email:**
- Fecha y hora de la visita
- Técnico (nombre)
- Duración del servicio
- Lecturas clave: pH, ORP, Free Chlorine (con indicadores de rango)
- Tareas completadas (checklist)
- Químicos aplicados
- Fotos adjuntas (las marcadas como "evidencia")
- Notas para el cliente (si el técnico las agregó)
- Link al portal del cliente para ver el reporte completo

**NO incluye:** Notas internas, costos, inventario
