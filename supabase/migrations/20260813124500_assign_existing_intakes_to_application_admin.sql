begin;

create or replace function private.assign_application_admin_accounts()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.members (organization_id, user_id, role)
  select organization.id, new.clerk_user_id, 'owner'
  from public.organizations as organization
  where organization.source in ('website-intake', 'manual')
  on conflict (organization_id, user_id) do update set
    role = 'owner',
    updated_at = now();

  return new;
end;
$$;

revoke all on function private.assign_application_admin_accounts() from public, anon, authenticated;

drop trigger if exists application_admin_assign_existing_accounts on public.application_administrators;
create trigger application_admin_assign_existing_accounts
  after insert on public.application_administrators
  for each row execute function private.assign_application_admin_accounts();

commit;
