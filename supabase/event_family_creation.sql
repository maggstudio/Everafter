begin;
create or replace function public.wedly_create_event_with_family(p_type text,p_first text,p_second text,p_date date,p_city text,p_child_name text,p_godparents text,p_elders text,p_accepted boolean,p_bride_parents text,p_groom_parents text,p_pairs text[],p_wedding_elders text) returns uuid
language plpgsql security definer set search_path='' as $family$
declare event_id uuid; pairs text[]; family jsonb;
begin
 if auth.uid() is null then raise exception 'Authentication required'; end if;
 if cardinality(p_pairs)>5 or exists(select 1 from unnest(p_pairs) x where length(x)>160) or length(coalesce(p_bride_parents,''))>240 or length(coalesce(p_groom_parents,''))>240 or length(coalesce(p_wedding_elders,''))>240 then raise exception 'Invalid family details'; end if;
 select coalesce(array_agg(btrim(x) order by ord),'{}'::text[]) into pairs from unnest(p_pairs) with ordinality t(x,ord) where btrim(x)<>'';
 event_id:=public.wedly_create_event_accepted(p_type,p_first,p_second,p_date,p_city,p_child_name,p_godparents,p_elders,p_accepted);
 if p_type='wedding' then
 family:=jsonb_build_object('brideParents',btrim(coalesce(p_bride_parents,'')),'groomParents',btrim(coalesce(p_groom_parents,'')),'weddingGodparents',array_to_string(pairs,'; '),'invitationDesign',jsonb_build_object('theme','classic','headline','Te invităm să sărbătorim împreună!','message','Cu mult drag, te așteptăm să fii alături de noi într-o zi specială.','location','','time','','configured',false,'godparentPairs',to_jsonb(pairs),'weddingElders',btrim(coalesce(p_wedding_elders,'')),'showGodparents',cardinality(pairs)>0,'showParents',btrim(coalesce(p_bride_parents,''))<>'' and btrim(coalesce(p_groom_parents,''))<>'','showWeddingElders',btrim(coalesce(p_wedding_elders,''))<>''));
 update public.wedding_modules set content=content::jsonb||family where wedding_id=event_id and module='wedding';
 if not found then raise exception 'Wedding module missing'; end if;
 end if;
 return event_id;
end;
$family$;
revoke all on function public.wedly_create_event_with_family(text,text,text,date,text,text,text,text,boolean,text,text,text[],text) from public,anon,authenticated;
grant execute on function public.wedly_create_event_with_family(text,text,text,date,text,text,text,text,boolean,text,text,text[],text) to authenticated;
notify pgrst,'reload schema';
commit;
