begin;
-- Seed only newly created events, inside the existing authorized creation transaction.
create or replace function public.wedly_create_event_accepted(p_type text,p_first text,p_second text,p_date date,p_city text,p_child_name text,p_godparents text,p_elders text,p_accepted boolean) returns uuid
language plpgsql security definer set search_path='' as $create$
declare event_id uuid; templates jsonb;
begin
 if p_accepted is distinct from true then raise exception 'Organizer declaration required'; end if;
 event_id:=public.create_my_event_with_elders(p_type,p_first,p_second,p_date,p_city,p_child_name,p_godparents,p_elders);
 perform public.wedly_accept_organizer(event_id);
 templates:=case when p_type='baptism' then '[["Organizare","Stabilirea bugetului"],["Organizare","Estimarea numărului de invitați"],["Ceremonii","Rezervarea bisericii"],["Ceremonii","Confirmarea nașilor"],["Ceremonii","Verificarea actelor și cerințelor bisericii"],["Locație și meniu","Rezervarea restaurantului"],["Ținute și pregătiri","Pregătirea ținutei copilului"],["Ținute și pregătiri","Pregătirea trusoului de botez"],["Invitați","Pregătirea listei de invitați"],["Invitați","Trimiterea invitațiilor"],["Invitați","Centralizarea confirmărilor"],["Locație și meniu","Stabilirea meniului"],["Invitați","Organizarea meselor"],["Organizare","Confirmarea programului final cu furnizorii"]]'::jsonb else '[["Organizare","Stabilirea bugetului"],["Organizare","Estimarea numărului de invitați"],["Locație și meniu","Rezervarea restaurantului"],["Ceremonii","Programarea cununiei civile"],["Ceremonii","Pregătirea actelor pentru cununia civilă"],["Ceremonii","Rezervarea bisericii"],["Ținute și pregătiri","Alegerea rochiei de mireasă"],["Ținute și pregătiri","Alegerea costumului de mire"],["Ținute și pregătiri","Alegerea verighetelor"],["Ținute și pregătiri","Programarea la coafor"],["Ținute și pregătiri","Programarea la machiaj"],["Invitați","Pregătirea listei de invitați"],["Invitați","Trimiterea invitațiilor"],["Invitați","Centralizarea confirmărilor"],["Locație și meniu","Stabilirea meniului"],["Invitați","Organizarea meselor"],["Organizare","Confirmarea programului final cu furnizorii"]]'::jsonb end;
 update public.wedding_modules set content=(select jsonb_agg(jsonb_build_object('id',gen_random_uuid()::text,'title',item->>1,'category',item->>0,'done',false,'priority','normal') order by ord) from jsonb_array_elements(templates) with ordinality as t(item,ord)) where wedding_id=event_id and module='tasks' and content::jsonb='[]'::jsonb;
 return event_id;
end;
$create$;
revoke all on function public.wedly_create_event_accepted(text,text,text,date,text,text,text,text,boolean) from public,anon,authenticated;
grant execute on function public.wedly_create_event_accepted(text,text,text,date,text,text,text,text,boolean) to authenticated;
notify pgrst,'reload schema';
commit;
