# Spectra Pool — Schema de Base de Datos (Supabase / PostgreSQL)

**Fecha de análisis:** 2026-05-01  
**Versión:** 1.0

## Diagrama de relaciones (simplificado)

```
auth.users
    ├── technicians
    └── client_users

clients
    └── client_locations
            └── pool_areas (POOL / SPA / TANK)
                    └── pool_target_params

routes
    ├── technicians (FK)
    └── route_stops → client_locations

service_visits
    ├── client_locations (FK)
    ├── technicians (FK)
    ├── checklist_items
    ├── maintenance_ops
    ├── water_readings → pool_areas (FK)
    ├── chemical_dosages → products (FK)
    ├── visit_photos (Supabase Storage)
    ├── visit_notes
    └── items_needed

products
    └── inventory (stock actual)

work_orders
    ├── client_locations (FK)
    └── technicians (FK)

invoices
    ├── clients (FK)
    └── invoice_items
```

---

## Tablas detalladas

### clients
| Campo | Tipo | Descripción |
|-------|------|-------------|
| id | uuid PK | |
| name | text | Nombre de la empresa (EOS Fitness) |
| contact_name | text | Nombre del contacto principal |
| contact_email | text | Email del contacto |
| contact_phone | text | Teléfono |
| billing_address | text | Dirección de facturación |
| notes | text | Notas internas |
| active | boolean | Cliente activo/inactivo |
| created_at | timestamptz | |

### client_locations
| Campo | Tipo | Descripción |
|-------|------|-------------|
| id | uuid PK | |
| client_id | uuid FK → clients | |
| name | text | Nombre de la ubicación (EOS Sarasota) |
| address | text | Dirección completa |
| city | text | Ciudad |
| state | text | Estado (FL) |
| zip | text | Código postal |
| contact_name | text | Contacto en esa ubicación |
| contact_email | text | Email para reportes de servicio |
| contact_phone | text | Teléfono |
| latitude | decimal | Para mapa |
| longitude | decimal | Para mapa |
| service_days | text[] | ['mon','wed','fri','sat','sun'] |
| notes | text | Notas internas |
| active | boolean | |
| created_at | timestamptz | |

### pool_areas
| Campo | Tipo | Descripción |
|-------|------|-------------|
| id | uuid PK | |
| location_id | uuid FK → client_locations | |
| area_type | enum | 'POOL' / 'SPA' / 'TANK' |
| name | text | Nombre descriptivo (ej: "Main Pool") |
| gallons | integer | Capacidad en galones |
| filter_type | text | Tipo de filtro |
| system_type | text | Chlorine / Saltwater / UV+Chlorine |
| has_heater | boolean | Tiene calentador |
| notes | text | |
| active | boolean | |
| created_at | timestamptz | |

### pool_target_params
| Campo | Tipo | Descripción |
|-------|------|-------------|
| id | uuid PK | |
| area_id | uuid FK → pool_areas | |
| param_name | text | 'pH' / 'ORP' / 'free_chlorine' / etc. |
| min_value | decimal | Valor mínimo aceptable |
| max_value | decimal | Valor máximo aceptable |
| target_value | decimal | Valor objetivo ideal |
| unit | text | 'ppm' / 'mV' / '°F' |

### technicians
| Campo | Tipo | Descripción |
|-------|------|-------------|
| id | uuid PK | |
| user_id | uuid FK → auth.users | |
| first_name | text | |
| last_name | text | |
| phone | text | |
| license_number | text | Número de licencia (si aplica) |
| active | boolean | |
| created_at | timestamptz | |

### client_users
| Campo | Tipo | Descripción |
|-------|------|-------------|
| id | uuid PK | |
| user_id | uuid FK → auth.users | |
| client_id | uuid FK → clients | |
| first_name | text | |
| last_name | text | |
| role | text | 'manager' / 'viewer' |
| active | boolean | |
| created_at | timestamptz | |

### routes
| Campo | Tipo | Descripción |
|-------|------|-------------|
| id | uuid PK | |
| technician_id | uuid FK → technicians | |
| name | text | Nombre de la ruta (ej: "Tampa North") |
| day_of_week | text[] | ['mon','tue','wed','thu','fri'] |
| active | boolean | |
| created_at | timestamptz | |

### route_stops
| Campo | Tipo | Descripción |
|-------|------|-------------|
| id | uuid PK | |
| route_id | uuid FK → routes | |
| location_id | uuid FK → client_locations | |
| stop_order | integer | Orden en la ruta (1, 2, 3...) |
| estimated_service_minutes | integer | Tiempo estimado de servicio |

### service_visits
| Campo | Tipo | Descripción |
|-------|------|-------------|
| id | uuid PK | |
| location_id | uuid FK → client_locations | |
| technician_id | uuid FK → technicians | |
| visit_date | date | Fecha de la visita |
| checkin_time | timestamptz | Hora de llegada |
| checkout_time | timestamptz | Hora de salida |
| duration_minutes | integer | Duración calculada |
| status | enum | 'pending' / 'in_progress' / 'completed' / 'skipped' |
| service_email_sent | boolean | Email enviado al cliente |
| synced | boolean | Para modo offline |
| created_at | timestamptz | |

### checklist_items
| Campo | Tipo | Descripción |
|-------|------|-------------|
| id | uuid PK | |
| visit_id | uuid FK → service_visits | |
| task | text | 'empty_baskets' / 'skim_surface' / 'vacuum' / 'filter_cleaned' / 'brush_pool' |
| completed | boolean | |
| completed_at | timestamptz | |

### maintenance_ops
| Campo | Tipo | Descripción |
|-------|------|-------------|
| id | uuid PK | |
| visit_id | uuid FK → service_visits | |
| operation | text | 'BW' / 'CBP' / 'CFPC' / 'CLCL' / 'CLAC' / 'CLTI' / 'RLCL' / 'RLAC' / 'RTF' / 'VAC' |
| area_type | enum | 'POOL' / 'SPA' / 'TANK' |
| notes | text | |

### water_readings
| Campo | Tipo | Descripción |
|-------|------|-------------|
| id | uuid PK | |
| visit_id | uuid FK → service_visits | |
| area_id | uuid FK → pool_areas | |
| reading_section | enum | 'TEST' / 'HEATER' |
| ph | decimal | |
| orp | decimal | mV |
| orp_setpoint | decimal | SET — valor objetivo del controlador |
| not_set | boolean | NST |
| free_chlorine | decimal | ppm |
| total_chlorine | decimal | ppm |
| alkalinity | decimal | ppm |
| stabilizer_cya | decimal | ppm |
| total_hardness | decimal | ppm |
| phosphates | decimal | ppm |
| salt | decimal | ppm |
| temperature | decimal | °F |
| status | text | Estado del sistema |
| lsi_value | decimal | Langelier Saturation Index calculado |
| recorded_at | timestamptz | |
| notes | text | |

### products
| Campo | Tipo | Descripción |
|-------|------|-------------|
| id | uuid PK | |
| name | text | Nombre del producto |
| category | text | 'chlorine' / 'pH' / 'alkalinity' / 'specialty' |
| unit | text | 'oz' / 'lbs' / 'gal' |
| cost_per_unit | decimal | Costo unitario en USD |
| active | boolean | |

### inventory
| Campo | Tipo | Descripción |
|-------|------|-------------|
| id | uuid PK | |
| product_id | uuid FK → products | |
| quantity_on_hand | decimal | Stock actual |
| low_stock_threshold | decimal | Alerta cuando baja de este nivel |
| last_updated | timestamptz | |

### chemical_dosages
| Campo | Tipo | Descripción |
|-------|------|-------------|
| id | uuid PK | |
| visit_id | uuid FK → service_visits | |
| area_id | uuid FK → pool_areas | |
| product_id | uuid FK → products | |
| quantity | decimal | Cantidad aplicada |
| unit | text | 'oz' / 'lbs' / 'gal' |
| cost | decimal | Costo calculado automáticamente |
| applied_at | timestamptz | |

### visit_photos
| Campo | Tipo | Descripción |
|-------|------|-------------|
| id | uuid PK | |
| visit_id | uuid FK → service_visits | |
| storage_path | text | Path en Supabase Storage |
| photo_type | text | 'equipment' / 'reading' / 'issue' / 'evidence' |
| caption | text | |
| taken_at | timestamptz | |

### visit_notes
| Campo | Tipo | Descripción |
|-------|------|-------------|
| id | uuid PK | |
| visit_id | uuid FK → service_visits | |
| note | text | Nota interna (no visible para cliente) |
| created_at | timestamptz | |

### items_needed
| Campo | Tipo | Descripción |
|-------|------|-------------|
| id | uuid PK | |
| visit_id | uuid FK → service_visits | |
| location_id | uuid FK → client_locations | |
| description | text | Descripción del item/repuesto necesario |
| resolved | boolean | |
| resolved_at | timestamptz | |

### work_orders
| Campo | Tipo | Descripción |
|-------|------|-------------|
| id | uuid PK | |
| location_id | uuid FK → client_locations | |
| technician_id | uuid FK → technicians | nullable |
| title | text | |
| description | text | |
| priority | enum | 'low' / 'medium' / 'high' / 'urgent' |
| status | enum | 'pending' / 'in_progress' / 'completed' |
| due_date | date | |
| completed_at | timestamptz | |
| created_at | timestamptz | |

### invoices
| Campo | Tipo | Descripción |
|-------|------|-------------|
| id | uuid PK | |
| client_id | uuid FK → clients | |
| invoice_number | text | Número de factura (SPEC-2026-001) |
| period_start | date | Inicio del período facturado |
| period_end | date | Fin del período facturado |
| subtotal | decimal | |
| tax | decimal | |
| total | decimal | |
| status | enum | 'draft' / 'sent' / 'paid' / 'overdue' |
| due_date | date | |
| paid_at | timestamptz | |
| notes | text | |
| created_at | timestamptz | |

### invoice_items
| Campo | Tipo | Descripción |
|-------|------|-------------|
| id | uuid PK | |
| invoice_id | uuid FK → invoices | |
| description | text | |
| quantity | decimal | |
| unit_price | decimal | |
| total | decimal | |
| item_type | text | 'service' / 'chemical' / 'repair' / 'other' |

---

## Row Level Security (RLS) — Políticas principales

| Tabla | Admin | Technician | Client User |
|-------|-------|------------|-------------|
| clients | CRUD | Read (propio) | Read (propio) |
| client_locations | CRUD | Read (asignadas) | Read (propias) |
| service_visits | CRUD | CRUD (propias) | Read (propias) |
| water_readings | CRUD | CRUD (propias) | Read (propias) |
| chemical_dosages | CRUD | CRUD (propias) | Read (propias) |
| visit_notes | CRUD | CRUD (propias) | NO ACCESS |
| products | CRUD | Read | NO ACCESS |
| inventory | CRUD | Read | NO ACCESS |
| invoices | CRUD | NO ACCESS | Read (propias) |
| work_orders | CRUD | CRUD (asignadas) | Read (propias) |
