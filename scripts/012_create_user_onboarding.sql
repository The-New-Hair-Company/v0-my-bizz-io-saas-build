-- Create trigger to automatically create organization and member record on user signup

create or replace function private.handle_new_user_onboarding()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  new_org_id uuid;
begin
  -- Create a default organization for the new user
  insert into public.organizations (name)
  values (
    coalesce(
      new.raw_user_meta_data->>'company_name',
      'My Company'
    )
  )
  returning id into new_org_id;

  -- Add user as owner of the new organization
  insert into public.members (organization_id, user_id, role)
  values (new_org_id, new.id, 'owner');

  return new;
end;
$$;

revoke execute on function private.handle_new_user_onboarding() from public, anon, authenticated, service_role;

drop trigger if exists on_user_signup_onboarding on auth.users;

create trigger on_user_signup_onboarding
  after insert on auth.users
  for each row
  execute function private.handle_new_user_onboarding();
