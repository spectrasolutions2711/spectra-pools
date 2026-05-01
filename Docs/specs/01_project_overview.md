# Spectra Pool — Project Overview

**Fecha de análisis:** 2026-05-01  
**Versión:** 1.0

## Descripción del proyecto

Aplicación web para gestionar servicios de mantenimiento de piscinas comerciales en Estados Unidos. Enfocada en GYMs y fitness centers que operan 24 horas con piscinas y spas de uso intensivo (5-6 visitas por semana).

## Nombre del proyecto
**Spectra Pool**

## Problema que resuelve
- Hoy el servicio se registra en planillas físicas o digitales simples (Excel/papel)
- No hay visibilidad en tiempo real de lecturas de agua por ubicación
- No hay control de costos de químicos por piscina
- No hay portal para que el cliente (GYM) vea el estado de sus piscinas
- No hay reportes automáticos para inspecciones del Health Department

## Mercado objetivo
- Empresas de servicio de piscinas comerciales en USA
- Clientes finales: cadenas de GYMs, hoteles, HOAs, centros recreativos
- Foco inicial: GYMs 24h (EOS Fitness como cliente de referencia)

## Cliente de referencia actual
- **EOS Fitness** — 7 ubicaciones en Tampa Bay, Florida
- Técnico de referencia: Nestor Roa
- Ruta diaria: 7 piscinas, ~5 horas de viaje

## Stack tecnológico
- **Frontend:** React 18 + TypeScript + Vite 5
- **UI:** Tailwind CSS + shadcn/ui + lucide-react
- **Backend:** Supabase (PostgreSQL + Auth + Storage)
- **Data fetching:** TanStack React Query v5
- **Formularios:** React Hook Form + Zod
- **Routing:** React Router DOM v6
- **Gráficas:** Recharts
- **Deploy:** Hostinger (FTP via GitHub Actions)
- **Repositorio:** GitHub

## Proyecto de referencia técnica
`C:\Users\roafr\Documents\solace-retreats-hub` — misma arquitectura, mismo stack
