-- =========================================================================================
-- SCRIPT DE SEGURIDAD: CIERRE DE BRECHAS RLS EN MÓDULO DE SALUD
-- Por favor, ejecuta este script completo en el SQL Editor de tu panel de Supabase.
-- =========================================================================================

-- En las primeras fases (Módulo 5), se crearon políticas muy permisivas para facilitar el desarrollo.
-- Al pasar a la arquitectura SaaS multi-tenant (Módulo 7), se añadieron políticas de aislamiento, 
-- pero PostgreSQL combina las políticas. Por ende, la política "Anyone can read" seguía viva
-- permitiendo que usuarios en nuevas cuentas leyeran inventario de su cuenta anterior si compartían sesión.

-- 1. Eliminar políticas antiguas y permisivas del inventario farmacéutico
DROP POLICY IF EXISTS "Anyone can read pharmaceuticals" ON public.pharmaceutical_inventory;
DROP POLICY IF EXISTS "Authenticated users can insert pharmaceuticals" ON public.pharmaceutical_inventory;
DROP POLICY IF EXISTS "Authenticated users can update pharmaceuticals" ON public.pharmaceutical_inventory;
DROP POLICY IF EXISTS "Authenticated users can delete pharmaceuticals" ON public.pharmaceutical_inventory;

-- 2. Eliminar políticas antiguas y permisivas de los registros de salud
DROP POLICY IF EXISTS "Anyone can read health_records" ON public.health_records;
DROP POLICY IF EXISTS "Authenticated users can insert health_records" ON public.health_records;
DROP POLICY IF EXISTS "Authenticated users can update health_records" ON public.health_records;
DROP POLICY IF EXISTS "Authenticated users can delete health_records" ON public.health_records;

-- 3. Eliminar políticas antiguas (Phase 2) permisivas para tareas y otros
DROP POLICY IF EXISTS "Tasks viewable by farm members" ON public.tasks;
DROP POLICY IF EXISTS "Tasks insertable by farm members" ON public.tasks;
DROP POLICY IF EXISTS "Locations viewable by farm members" ON public.locations;
DROP POLICY IF EXISTS "Locations insertable by farm members" ON public.locations;
DROP POLICY IF EXISTS "Invoices viewable by farm members" ON public.invoices;
DROP POLICY IF EXISTS "Invoices insertable by farm members" ON public.invoices;
DROP POLICY IF EXISTS "Breeding viewable by farm members" ON public.breeding_records;
DROP POLICY IF EXISTS "Breeding insertable by farm members" ON public.breeding_records;
DROP POLICY IF EXISTS "Nutrition viewable by farm members" ON public.nutrition_plans;
DROP POLICY IF EXISTS "Nutrition insertable by farm members" ON public.nutrition_plans;

-- Las políticas de "Tenant select policy" y "Tenant all policy" creadas en el archivo 007
-- ahora actuarán solas, garantizando un aislamiento del 100% infranqueable a nivel de base de datos.
