# Spectra Pool — Análisis de Planillas y Formularios de Campo

**Fecha de análisis:** 2026-05-01  
**Fuente:** Planillas físicas (JPEG) + PDFs de servicio mensual (Feb/Mar/Abr 2026)  
**Versión:** 1.0

## Ubicaciones de servicio actual (EOS Fitness — Tampa Bay, FL)

| # | Nombre | Dirección |
|---|--------|-----------|
| 1 | EOS Fitness Sarasota | 4940 S Tamiami Trail |
| 2 | EOS Fitness Riverview (Gornto) | 5891 S Gorno Lake Rd |
| 3 | EOS Fitness Land O Lakes (Argo) | 2194 Argosy Dr |
| 4 | EOS Fitness Lutz (Harpers Run) | 17634 Harpers Run |
| 5 | EOS Fitness Hudson | 8924 SR 52 |
| 6 | EOS Fitness Ehrlich | 5320 Ehrlich Rd |
| 7 | EOS Fitness Midtown (Dale Mabry) | 2525 N Dale Mabry Hwy, Tampa, FL 33607 |

## Frecuencia de visitas
- GYMs operan 24 horas — piscina y spa con uso intensivo continuo
- Visitas: **5-6 veces por semana** por ubicación
- Ruta diaria típica: 7 ubicaciones, ~4h 53min de viaje total

## Infraestructura por ubicación (3 áreas)

Cada GYM tiene 3 áreas que deben registrarse por separado:

| Área | Descripción |
|------|-------------|
| **POOL** | Piscina principal — subsecciones: TEST + HEATER |
| **SPA** | Hot tub / Jacuzzi — subsecciones: TEST + HEATER |
| **TANK** | Tanque de almacenamiento de químicos |

---

## Lecturas de agua — POOL TEST y SPA TEST

| Campo | Código | Descripción | Unidad | Rango Ideal |
|-------|--------|-------------|--------|-------------|
| pH | PH | Nivel de acidez/basicidad | — | 7.2 – 7.6 |
| ORP | ORP | Oxidation-Reduction Potential | mV | 650 – 750 |
| ORP Setpoint | SET | Valor objetivo del controlador ORP | mV | — |
| Not Set | NST | Indicador de setpoint no configurado | — | — |
| Free Chlorine | CL | Cloro libre disponible | ppm | 2 – 4 |
| Total Chlorine | — | Cloro total (libre + combinado) | ppm | 2 – 4 |
| Alkalinity | AL | Alcalinidad total | ppm | 80 – 120 |
| Stabilizer / CYA | SB | Ácido cianúrico (estabilizador) | ppm | 30 – 50 |
| Total Hardness | — | Dureza total del agua | ppm | 200 – 400 |
| Phosphates | — | Fosfatos | ppm | < 0.5 |
| Salt | — | Sal (para sistemas salinos) | ppm | 2000 – 3000 |
| Temperature | TEM | Temperatura del agua | °F | 78 – 82 |
| Status | STA | Estado general del sistema | — | — |

## Lecturas de agua — POOL HEATER y SPA HEATER

| Campo | Código | Descripción | Unidad |
|-------|--------|-------------|--------|
| pH | PH | Nivel de pH en el calentador | — |
| ORP | ORP | ORP en circuito del calentador | mV |
| ORP Setpoint | SET | Valor objetivo del ORP | mV |
| Not Set | NST | Indicador de setpoint | — |
| Chlorine | CL | Cloro en circuito del calentador | ppm |
| Status | STA | Estado del calentador | — |
| Temperature | TEM | Temperatura del calentador | °F |

## Lecturas de agua — TANK (Tanque)

| Campo | Código | Descripción | Unidad |
|-------|--------|-------------|--------|
| Chlorine | CL | Concentración de cloro en tanque | ppm |
| Status | STA | Estado del tanque | — |
| Temperature | TEM | Temperatura del tanque | °F |

---

## Operaciones de mantenimiento (planilla)

| Código | Nombre completo | Descripción |
|--------|----------------|-------------|
| BW | Backwash | Retrolavado del filtro |
| CBP | Clean Basket Pump | Limpiar canasta de la bomba |
| CFPC | Clean Filter PC | Limpiar filtro principal |
| CLCL | Clean Line CL | Limpiar línea de cloro |
| CLAC | Clean Line AC | Limpiar línea de ácido |
| CLTI | Clean Tiles | Limpiar azulejos/bordes |
| RLCL | Replace Line CL | Reemplazar línea de cloro |
| RLAC | Replace Line AC | Reemplazar línea de ácido |
| RTF | Replace Tub Filter | Reemplazar filtro del spa |
| VAC | Vacuum | Aspirar el fondo |

---

## Checklist de tareas diarias (app de referencia)

- Empty Baskets — Vaciar canastas de skimmer
- Skim Surface — Pasar la red por la superficie
- Vacuum — Aspirar fondo
- Filter Cleaned — Limpiar filtro
- Brush Pool — Cepillar paredes y fondo

---

## Químicos / Dosificaciones registradas

| Producto | Tipo de ajuste |
|----------|---------------|
| Liquid Chlorine | Aumentar cloro |
| Chlorine Tabs (Tipo 1 / 2 / 3) | Mantener cloro |
| Shock | Tratamiento de choque (oxidante) |
| pH UP | Aumentar pH (bicarbonato de sodio) |
| pH DOWN | Bajar pH (bisulfato de sodio) |
| Alkalinity UP | Aumentar alcalinidad |
| Alkalinity DOWN | Bajar alcalinidad |
| Cyanuric Acid | Agregar estabilizador |
| Phosphates Reducer | Reducir fosfatos |
| Chlorine Reducer | Reducir cloro (si está alto) |

Cada dosificación debe registrar: **producto + cantidad + unidad (oz / lbs / gal)**

---

## Lecturas ejemplo observadas (EOS Midtown — Feb 2026)

| Fecha | Free Chlorine | pH | Alkalinity | Total Hardness |
|-------|--------------|-----|------------|----------------|
| 2/4 | 5 ppm | 7.6 | — | — |
| 2/6 | 5 ppm | 7.5 | — | — |
| 2/7 | 5 ppm | 7.5 | — | — |
| 2/9 | 5 ppm | 7.5 | 80 ppm | 300 ppm |

---

## Datos de la app de referencia (screenshots analizados)

- La app muestra ruta en Google Maps con pins por ubicación
- Route Dashboard con calendario semanal y progreso (0/7 pools)
- Lista de ruta con orden, distancias y ETA estimado por parada
- Pool Info tab: dirección, contacto, tiempos de servicio, fotos de equipo
- Pool tab: lecturas recientes, checklist, dosificaciones, notas, email cliente
- Work Orders por piscina
- Items Needed por piscina
- Recurring Work
- Sincronización en tiempo real ("All changes are synced!")
- Notas internas (cliente no las ve)
- Email automático de servicio al cliente (requiere email registrado)
