# Spectra Pool — Investigación de Mercado y Competidores

**Fecha de análisis:** 2026-05-01  
**Versión:** 1.0

## Resumen del mercado

Software para gestión de servicio de piscinas es un mercado en crecimiento en USA. Los líderes son Skimmer y Pool Brain. El mercado está segmentado entre residencial (pequeñas empresas) y comercial (cadenas, hoteles, GYMs).

---

## Competidores principales

### Tier 1 — Líderes del mercado

#### Skimmer (getskimmer.com)
- **Precio:** $1-2/piscina/mes
- **Usuarios:** 35,000+
- **Target:** Pequeñas y medianas empresas de piscinas
- **Features clave:** Optimización de ruta (ahorra 200 millas/mes), LSI + dosing calculator (integración Orenda), facturación automática, reportes con fotos, sincronización LaMotte Spin Touch (Bluetooth)
- **App móvil:** iOS + Android
- **Debilidades:** Problemas de estabilidad en Android, fotos obligatorias ralentizan técnicos, aumento de precios en 2024 causó fricción con usuarios
- **Marketing:** "Crece 3-4x más rápido", eficiencia de ruta

#### Pool Brain (poolbrain.com)
- **Precio:** Custom / enterprise
- **Target:** Medianas y grandes empresas
- **Features clave:** Automatización de workflows por tipo de equipo, integración nativa Orenda Calculator, tracking multi-body (precio/costo/equipo por área), emails automáticos post-servicio, recolección automática de feedback, diseño offline-first
- **App móvil:** iOS + Android
- **Debilidades:** Alto consumo de batería, complejidad puede intimidar empresas pequeñas
- **Integraciones:** Orenda Calculator nativo, dosificación automática (calcio, sal, ácido sulfúrico)

#### ServiceTitan (servicetitan.com)
- **Precio:** $200-600+/técnico/mes + setup $1,000-5,000
- **Target:** Multi-trade (no específico de piscinas)
- **Features clave:** CRM completo, scheduling, online booking, procesamiento de pagos, inventario, marketing ROI tracking, pricebook "good-better-best"
- **Gap crítico:** Sin features de química de piscinas (sin dosing, sin LSI, sin water chemistry) — es orientado a calendario, no a rutas
- **Integraciones:** QuickBooks, Sage Intacct, Google Local Services

#### Jobber (getjobber.com)
- **Precio:** Basic $49/mes, Essentials $129/mes
- **Target:** Pequeñas y medianas empresas de servicios en general
- **Features clave:** Scheduling, generación de rutas, SMS a clientes, facturación móvil, cobro con tarjeta (4x más rápido), acceso a historial de trabajo
- **Gap:** No específico de piscinas (sin química, sin water testing)
- **Integraciones:** QuickBooks Online (2-way sync), Stripe

### Tier 2 — Software especializado en piscinas

#### PoolNest (thepoolnest.com)
- **Precio:** $50/mes flat + $0.75/piscina después de 50
- **Lanzamiento:** 2023
- **Features clave:** Optimización de ruta GPS, modo offline, checklists, sync con Google Calendar, facturación automática
- **Integraciones:** Google Calendar, Google Maps, QuickBooks
- **Marketing:** El más agresivo en precio, "game-changer para eliminar planillas"

#### Pool Office Manager (poolofficemanager.com)
- **Target:** Negocios estacionales y de reparación
- **Features clave:** GPS tracking, dosificación química, scheduling, facturación, fotos adjuntas a reportes, emails automáticos de servicio

#### PoolCarePro (poolcarepro.com)
- **Escala:** 75,000+ piscinas gestionadas
- **Features clave:** Tracking de química en nube (funciona en 4G sin WiFi), auto-billing, inventario, route planning, control de acceso por roles
- **Integraciones:** Authorize.Net (pagos)
- **Marketing:** "Probado para funcionar en campo sin WiFi"

#### RB Control Systems (rbretailandservicesolutions.com)
- **Target:** Operaciones de retail + servicio (grandes)
- **Features clave:** Integración retail-servicio, inventario con auto-reorden, gestión de equipos con perfiles, integración con software de pruebas de agua, usuarios ilimitados de scheduling
- **Soporte:** 24/7 live support
- **Deployment:** Cloud + on-premise (Windows)

#### Service Fusion (servicefusion.com)
- **Precio:** Desde $200/mes
- **Features clave:** Scheduling, dispatching, CRM, FusionPay, sync automático con QuickBooks, automatización de estimados, scheduling drag-and-drop
- **Fortaleza:** Onboarding personalizado, muy buena reputación de soporte

---

## Features estándar del mercado (todos los tienen)

Spectra Pool DEBE tener todos estos para ser competitivo:

1. App móvil iOS + Android (o PWA)
2. Optimización de ruta con Google Maps
3. Facturación automática
4. Historial de servicio por cliente/piscina
5. Fotos como evidencia del servicio
6. Tracking de química del agua
7. Gestión de clientes (CRM básico)
8. Modo offline con sincronización
9. Scheduling y dispatch
10. Work orders

---

## Features diferenciadores identificados

### Para agregar en Spectra Pool

| Feature | Quién lo tiene | Valor para Spectra Pool |
|---------|---------------|------------------------|
| **LSI Calculator (Langelier Saturation Index)** | Skimmer, Pool Brain | Estándar de la industria — sin esto no somos competitivos con técnicos experimentados |
| **Módulo de Compliance / Health Dept.** | NADIE lo tiene bien | DIFERENCIADOR — GYMs están obligados por ley a mantener registros 2 años |
| **Auto-email post-servicio al cliente** | Pool Brain, Skimmer | Construye confianza, reduce llamadas de seguimiento |
| **Dashboard multi-ubicación + benchmarking** | Pool Brain básico | DIFERENCIADOR para cadenas como EOS Fitness |
| **Alertas predictivas de química** | Nadie bien | DIFERENCIADOR moderno |
| **Integración QuickBooks** | Jobber, PoolNest | Estándar de facto en USA para contabilidad |
| **Recolección de feedback post-visita** | Pool Brain | Detecta problemas con técnicos, mejora reputación |

---

## Modelo de precios del mercado

| Tier | Software | Costo mensual |
|------|----------|--------------|
| Bajo | PoolNest | $50/mes flat |
| Medio-bajo | Jobber | $49-129/mes |
| Medio | Skimmer | $1-2/piscina/mes |
| Alto | Service Fusion | $200+/mes |
| Enterprise | Pool Brain, ServiceTitan | $200-600+/técnico + setup |

**Costos ocultos comunes:** Setup ($500-2,000), migración de datos ($1,000+), capacitación, fees de procesamiento de pagos (2.9% + $0.30), integraciones de terceros.

---

## Cómo vende la competencia — mensajes de marketing

- **Eficiencia operativa:** "Ahorra 200 millas/mes", "Completa más rutas en menos tiempo"
- **Velocidad de cobro:** "Cobra 4x más rápido", "Facturación automática"
- **Confianza del cliente:** "Prueba fotográfica de cada servicio", "Reportes profesionales"
- **Eliminación de papel:** "Elimina las planillas", "Digitaliza tu operación"
- **Confiabilidad en campo:** "Funciona sin WiFi ni señal", "Datos siempre disponibles"
- **Crecimiento:** "Escala tu negocio sin contratar más personal administrativo"

---

## Diferenciadores recomendados para Spectra Pool

### 1. Compliance Module (DIFERENCIADOR PRINCIPAL)
Los GYMs comerciales en USA están sujetos a:
- Model Aquatic Health Code (CDC)
- Registros diarios obligatorios con retención de 2 años
- Inspecciones del Health Department
- Permisos operativos por ubicación

**Propuesta de valor:** "El único software que genera reportes listos para inspección del Health Department — protege tu licencia operativa."

### 2. Dashboard para Cadenas con Benchmarking
Para managers de cadenas como EOS Fitness:
- Comparación de consumo de químicos entre ubicaciones
- Ranking de piscinas por desempeño
- "EOS Sarasota usa 20% más cloro que el promedio — investigar bomba dosificadora"

**Propuesta de valor:** "Visibilidad total de todas tus piscinas desde un solo dashboard."

### 3. Diseño Field-First sin fricción
Principal queja de técnicos sobre apps actuales: demasiadas fotos obligatorias (20+ min/piscina), alto consumo de batería, lentitud en 4G.

**Propuesta de valor:** "Diseñado por y para técnicos en campo — registra una visita completa en menos de 5 minutos."

---

## Gaps del mercado no resueltos (oportunidades futuras)

1. Integración con sensores IoT para monitoreo continuo de ORP/pH/cloro
2. Integración con distribuidores de químicos (Pool Corp, etc.) para pedidos automáticos
3. ML/AI para detección de patrones: "Esta deriva de pH sugiere problemas en la bomba"
4. Integración con sistemas de control automatizado (Pentair IntelliCenter)
5. Benchmarking entre empresas del sector (datos anónimos agregados)
