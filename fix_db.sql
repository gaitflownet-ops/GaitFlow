-- =========================================================================================
-- SCRIPT DE REPARACIÓN DE ARQUITECTURA: MULTI-TENANT (FINCAS Y ORGANIZACIONES)
-- Por favor, ejecuta este script completo en el SQL Editor de tu panel de Supabase.
-- =========================================================================================

-- 1. Actualizamos el trigger que se dispara cuando un usuario nuevo se registra
-- para que cree automáticamente TANTO la Organización como la Finca (Farm) con un ID real.
CREATE OR REPLACE FUNCTION public.handle_new_profile()
RETURNS TRIGGER AS $$
DECLARE
  new_org_id UUID;
  new_farm_id UUID;
  stable_or_name TEXT;
  farm_slug TEXT;
BEGIN
  -- Definir el nombre basado en los datos del registro
  stable_or_name := COALESCE(NEW.stable_name, NEW.name || ' Stable');
  -- Generar un slug único para la finca
  farm_slug := lower(regexp_replace(stable_or_name, '[^a-zA-Z0-9]+', '-', 'g')) || '-' || substr(md5(random()::text), 1, 6);

  -- 1. Crear Organización (El tenant de seguridad principal)
  INSERT INTO public.organizations (name, subscription_plan)
  VALUES (stable_or_name, 'Starter')
  RETURNING id INTO new_org_id;

  -- 2. Crear Finca/Farm (El espacio físico requerido por módulos legacy)
  INSERT INTO public.farms (slug, name, owner_id, organization_id)
  VALUES (farm_slug, stable_or_name, NEW.id, new_org_id)
  RETURNING id INTO new_farm_id;

  -- 3. Ligar el Perfil del usuario a la organización
  UPDATE public.profiles
  SET organization_id = new_org_id
  WHERE id = NEW.id;

  -- 4. Otorgar Rol de 'Owner' en user_roles
  INSERT INTO public.user_roles (user_id, organization_id, role, permissions)
  VALUES (NEW.id, new_org_id, 'Owner', '["*"]'::jsonb)
  ON CONFLICT (user_id, organization_id) DO NOTHING;

  -- 5. Otorgar Rol de 'Owner' en organization_members
  INSERT INTO public.organization_members (organization_id, user_id, role)
  VALUES (new_org_id, NEW.id, 'Owner')
  ON CONFLICT (organization_id, user_id) DO NOTHING;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. Reparación retroactiva: Crear Fincas (Farms) para los usuarios/organizaciones que no tengan una.
DO $$
DECLARE
  org RECORD;
  farm_slug TEXT;
  owner_uuid UUID;
BEGIN
  FOR org IN SELECT * FROM public.organizations LOOP
    -- Revisar si esta organización ya tiene una finca
    IF NOT EXISTS (SELECT 1 FROM public.farms WHERE organization_id = org.id) THEN
      
      -- Generar slug
      farm_slug := lower(regexp_replace(org.name, '[^a-zA-Z0-9]+', '-', 'g')) || '-' || substr(md5(random()::text), 1, 6);
      
      -- Encontrar al Owner de esta organización
      SELECT user_id INTO owner_uuid 
      FROM public.organization_members 
      WHERE organization_id = org.id AND role = 'Owner' 
      LIMIT 1;

      -- Crear la finca
      INSERT INTO public.farms (slug, name, owner_id, organization_id)
      VALUES (farm_slug, org.name, owner_uuid, org.id);
      
    END IF;
  END LOOP;
END $$;

-- 3. Flexibilizar la base de datos para que los módulos acepten nulos en farm_id 
-- ya que organization_id es el verdadero identificador de seguridad.
ALTER TABLE IF EXISTS public.tasks ALTER COLUMN farm_id DROP NOT NULL;
ALTER TABLE IF EXISTS public.locations ALTER COLUMN farm_id DROP NOT NULL;
ALTER TABLE IF EXISTS public.invoices ALTER COLUMN farm_id DROP NOT NULL;
ALTER TABLE IF EXISTS public.genetic_inventory ALTER COLUMN farm_id DROP NOT NULL;
