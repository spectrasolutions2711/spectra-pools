# Spectra Pool — Índice de Documentos de Referencia

**Proyecto:** Spectra Pool  
**Fecha de creación:** 2026-05-01  
**Estado:** En planificación — próximo inicio de desarrollo

---

## Documentos disponibles

| # | Archivo | Descripción |
|---|---------|-------------|
| 01 | [01_project_overview.md](01_project_overview.md) | Descripción general del proyecto, stack tecnológico, cliente de referencia |
| 02 | [02_roles_and_access.md](02_roles_and_access.md) | Los 3 roles (Admin, Técnico, Cliente) con detalle completo de accesos y funcionalidades |
| 03 | [03_field_forms_analysis.md](03_field_forms_analysis.md) | Análisis de planillas físicas — todos los campos, códigos, químicos, ubicaciones EOS Fitness |
| 04 | [04_market_research.md](04_market_research.md) | Investigación de competidores (Skimmer, Pool Brain, etc.), precios, features estándar y diferenciadores |
| 05 | [05_database_schema.md](05_database_schema.md) | Schema completo de base de datos (Supabase/PostgreSQL), todas las tablas con campos y relaciones |
| 06 | [06_development_plan.md](06_development_plan.md) | Plan de desarrollo por fases (7 fases, ~16 semanas), tareas detalladas, prioridades |
| 07 | [07_ux_flows.md](07_ux_flows.md) | Flujos de usuario completos (técnico, admin, cliente), validación de lecturas, LSI Calculator |

---

## Material de referencia (carpetas)

| Carpeta | Contenido |
|---------|-----------|
| `../field-forms/` | Planillas físicas (JPEG) + PDFs de servicio mensual Feb/Mar/Abr 2026 |
| `../reference-app/` | Capturas de pantalla de la app de referencia actual (9 imágenes) |

---

## Decisiones clave tomadas

1. **Nombre:** Spectra Pool
2. **Stack:** React 18 + Vite + TypeScript + Supabase + Tailwind + shadcn/ui (igual a solace-retreats-hub)
3. **Deploy:** Hostinger via GitHub Actions (FTP)
4. **3 roles:** Admin / Technician / Client User
5. **3 áreas por GYM:** POOL (TEST + HEATER) / SPA (TEST + HEATER) / TANK
6. **Diferenciadores vs competencia:** LSI Calculator + Compliance Module + Multi-location Dashboard
7. **Cliente de referencia inicial:** EOS Fitness (7 GYMs en Tampa Bay, FL)

---

## Próximo paso
Iniciar **Fase 1**: scaffold del proyecto, configuración de Supabase y GitHub Actions.
