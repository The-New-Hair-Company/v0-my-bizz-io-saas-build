-- Create trigger to automatically create organization and member record on user signup

create or replace function public.handle_new_user_onboarding()
returns trigger
language plpgsql
security definer
set search_path = public
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

drop trigger if exists on_user_signup_onboarding on auth.users;

create trigger on_user_signup_onboarding
  after insert on auth.users
  for each row
  execute function public.handle_new_user_onboarding();
