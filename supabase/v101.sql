-- WEDLY v1.0.1. Rulează o singură dată DUPĂ v08.sql. Nu șterge date.
-- Furnizorii sunt stocați în wedding_modules; permisiunea vendors este aceeași cu expenses.
DO $$ BEGIN
 ALTER TABLE public.wedding_modules DROP CONSTRAINT IF EXISTS wedding_modules_module_check;
 ALTER TABLE public.wedding_modules ADD CONSTRAINT wedding_modules_module_check CHECK (module IN ('wedding','tasks','expenses','guests','calendar','packages','vendors'));
END $$;
-- Înlocuim politicile DOAR pentru modulul nou; celelalte module își păstrează regulile.
DROP POLICY IF EXISTS modules_read ON public.wedding_modules;
CREATE POLICY modules_read ON public.wedding_modules FOR SELECT TO authenticated
 USING (public.wedding_can(wedding_id, CASE WHEN module='vendors' THEN 'expenses' ELSE module END,'read'));
DROP POLICY IF EXISTS modules_insert ON public.wedding_modules;
CREATE POLICY modules_insert ON public.wedding_modules FOR INSERT TO authenticated
 WITH CHECK (public.wedding_can(wedding_id, CASE WHEN module='vendors' THEN 'expenses' ELSE module END,'write'));
DROP POLICY IF EXISTS modules_update ON public.wedding_modules;
CREATE POLICY modules_update ON public.wedding_modules FOR UPDATE TO authenticated
 USING (public.wedding_can(wedding_id, CASE WHEN module='vendors' THEN 'expenses' ELSE module END,'write'))
 WITH CHECK (public.wedding_can(wedding_id, CASE WHEN module='vendors' THEN 'expenses' ELSE module END,'write'));
