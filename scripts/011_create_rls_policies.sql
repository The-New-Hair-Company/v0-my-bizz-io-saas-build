-- RLS Policies for all tables

-- Helper function to check if user is member of organization
create or replace function public.is_organization_member(org_id uuid)
returns boolean
language sql
security definer
stable
as $$
  select exists (
    select 1 from public.members
    where organization_id = org_id
    and user_id = auth.uid()
  );
$$;

-- Helper function to check if user is admin or owner of organization
create or replace function public.is_organization_admin(org_id uuid)
returns boolean
language sql
security definer
stable
as $$
  select exists (
    select 1 from public.members
    where organization_id = org_id
    and user_id = auth.uid()
    and role in ('admin', 'owner')
  );
$$;

-- ORGANIZATIONS policies
create policy "Users can view organizations they are members of"
  on public.organizations for select
  using (public.is_organization_member(id));

create policy "Users can update organizations where they are admins"
  on public.organizations for update
  using (public.is_organization_admin(id));

create policy "Authenticated users can create organizations"
  on public.organizations for insert
  with check (auth.uid() is not null);

create policy "Organization owners can delete organizations"
  on public.organizations for delete
  using (
    exists (
      select 1 from public.members
      where organization_id = id
      and user_id = auth.uid()
      and role = 'owner'
    )
  );

-- MEMBERS policies
create policy "Users can view members of their organizations"
  on public.members for select
  using (public.is_organization_member(organization_id));

create policy "Admins can add members to their organizations"
  on public.members for insert
  with check (public.is_organization_admin(organization_id));

create policy "Admins can update members in their organizations"
  on public.members for update
  using (public.is_organization_admin(organization_id));

create policy "Admins can remove members from their organizations"
  on public.members for delete
  using (public.is_organization_admin(organization_id));

-- CHATS policies
create policy "Users can view chats in their organizations"
  on public.chats for select
  using (public.is_organization_member(organization_id));

create policy "Members can create chats in their organizations"
  on public.chats for insert
  with check (
    public.is_organization_member(organization_id) and
    auth.uid() = created_by
  );

create policy "Users can update their own chats"
  on public.chats for update
  using (auth.uid() = created_by);

create policy "Users can delete their own chats"
  on public.chats for delete
  using (auth.uid() = created_by);

-- MESSAGES policies
create policy "Users can view messages in chats they have access to"
  on public.messages for select
  using (
    exists (
      select 1 from public.chats
      where chats.id = messages.chat_id
      and public.is_organization_member(chats.organization_id)
    )
  );

create policy "Users can create messages in chats they have access to"
  on public.messages for insert
  with check (
    exists (
      select 1 from public.chats
      where chats.id = messages.chat_id
      and public.is_organization_member(chats.organization_id)
    )
  );

-- DOCUMENTS policies
create policy "Users can view documents in their organizations"
  on public.documents for select
  using (public.is_organization_member(organization_id));

create policy "Members can create documents in their organizations"
  on public.documents for insert
  with check (
    public.is_organization_member(organization_id) and
    auth.uid() = uploaded_by
  );

create policy "Users can update documents they uploaded"
  on public.documents for update
  using (auth.uid() = uploaded_by);

create policy "Users can delete documents they uploaded or admins can"
  on public.documents for delete
  using (
    auth.uid() = uploaded_by or
    public.is_organization_admin(organization_id)
  );

-- FILINGS policies
create policy "Users can view filings in their organizations"
  on public.filings for select
  using (public.is_organization_member(organization_id));

create policy "Members can create filings in their organizations"
  on public.filings for insert
  with check (
    public.is_organization_member(organization_id) and
    auth.uid() = created_by
  );

create policy "Members can update filings in their organizations"
  on public.filings for update
  using (public.is_organization_member(organization_id));

create policy "Admins can delete filings in their organizations"
  on public.filings for delete
  using (public.is_organization_admin(organization_id));

-- TASKS policies
create policy "Users can view tasks in their organizations"
  on public.tasks for select
  using (public.is_organization_member(organization_id));

create policy "Members can create tasks in their organizations"
  on public.tasks for insert
  with check (
    public.is_organization_member(organization_id) and
    auth.uid() = created_by
  );

create policy "Members can update tasks in their organizations"
  on public.tasks for update
  using (public.is_organization_member(organization_id));

create policy "Users can delete tasks they created or admins can"
  on public.tasks for delete
  using (
    auth.uid() = created_by or
    public.is_organization_admin(organization_id)
  );

-- EXTRACTED_FACTS policies
create policy "Users can view extracted facts in their organizations"
  on public.extracted_facts for select
  using (public.is_organization_member(organization_id));

create policy "System can create extracted facts"
  on public.extracted_facts for insert
  with check (public.is_organization_member(organization_id));

create policy "Members can update extracted facts in their organizations"
  on public.extracted_facts for update
  using (public.is_organization_member(organization_id));

-- NOTIFICATIONS policies
create policy "Users can view their own notifications"
  on public.notifications for select
  using (auth.uid() = user_id);

create policy "System can create notifications"
  on public.notifications for insert
  with check (true);

create policy "Users can update their own notifications"
  on public.notifications for update
  using (auth.uid() = user_id);

create policy "Users can delete their own notifications"
  on public.notifications for delete
  using (auth.uid() = user_id);

-- AUDIT_LOGS policies
create policy "Admins can view audit logs for their organizations"
  on public.audit_logs for select
  using (public.is_organization_admin(organization_id));

create policy "System can create audit logs"
  on public.audit_logs for insert
  with check (true);
