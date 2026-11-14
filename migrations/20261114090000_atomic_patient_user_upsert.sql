-- Draft only: apply after review and approval. This migration has NOT been applied.
-- The function serializes requests per normalized phone and makes the patient/user
-- insert/update one PostgreSQL transaction. It does not create a Supabase Auth user.
create or replace function public.upsert_patient_user_by_mobile(p_mobile text)
returns public.users
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_mobile text := right(regexp_replace(coalesce(p_mobile, ''), '\D', '', 'g'), 10);
  v_user public.users%rowtype;
  v_patient_id uuid;
begin
  if length(v_mobile) <> 10 then
    raise exception using errcode = '22023', message = 'Invalid mobile number';
  end if;

  perform pg_advisory_xact_lock(hashtextextended(v_mobile, 0));

  select * into v_user
  from public.users
  where phone = v_mobile or mobile = v_mobile
  order by created_at asc
  limit 1
  for update;

  if found and v_user.patient_id is not null then
    return v_user;
  end if;

  if found then
    v_patient_id := null;
  end if;

  if v_patient_id is null then
    select id into v_patient_id
    from public.patients
    where mobile = v_mobile
    order by created_at asc
    limit 1
    for update;
  end if;

  if v_patient_id is null then
    begin
      insert into public.patients (name, full_name, mobile, email)
      values ('Patient', null, v_mobile, null)
      returning id into v_patient_id;
    exception
      when others then
        raise exception using errcode = 'P0001', message = 'PATIENT_CREATION_FAILED';
    end;
  end if;

  if v_user.id is not null then
    update public.users
    set patient_id = v_patient_id,
        phone = v_mobile,
        updated_at = now()
    where id = v_user.id
    returning * into v_user;
  else
    begin
      insert into public.users (phone, role, patient_id, is_active)
      values (v_mobile, 'patient', v_patient_id, true)
      returning * into v_user;
    exception
      when unique_violation then raise;
      when others then
        raise exception using errcode = 'P0001', message = 'USER_CREATION_FAILED';
    end;
  end if;

  return v_user;
end;
$$;

revoke all on function public.upsert_patient_user_by_mobile(text) from public;
revoke all on function public.upsert_patient_user_by_mobile(text) from anon;
revoke all on function public.upsert_patient_user_by_mobile(text) from authenticated;
grant execute on function public.upsert_patient_user_by_mobile(text) to service_role;
