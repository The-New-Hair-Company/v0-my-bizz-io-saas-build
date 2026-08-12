-- Explicit Data API exposure. Grants decide which roles can reach an object;
-- RLS policies still decide which rows those roles may access.
grant usage on schema public to anon, authenticated, service_role;

-- Supabase projects may have permissive default privileges configured already.
-- Clear them on existing objects before granting the application roles below.
revoke all privileges on all tables in schema public from public, anon, authenticated;
revoke all privileges on all sequences in schema public from public, anon, authenticated;
revoke execute on all functions in schema public from public, anon, authenticated;

grant select, insert, update, delete on table
  public.organizations,
  public.members,
  public.chats,
  public.messages,
  public.documents,
  public.filings,
  public.tasks,
  public.extracted_facts
to authenticated;

grant select, update, delete on table public.notifications to authenticated;
grant select on table public.audit_logs to authenticated;

grant select, insert, update, delete on table
  public.newsletter_subscribers,
  public.newsletter_lists,
  public.newsletter_list_memberships,
  public.newsletter_campaigns,
  public.newsletter_campaign_versions,
  public.newsletter_suppression_list
to authenticated;

grant select on table
  public.newsletter_send_jobs,
  public.newsletter_email_events,
  public.newsletter_consent_events
to authenticated;

grant select on table
  public.newsletter_campaigns,
  public.newsletter_campaign_versions,
  public.plan_limits
to anon;

grant select, insert, update, delete on table
  public.document_chunks,
  public.ai_threads
to authenticated;

grant select, insert on table
  public.ai_messages,
  public.ai_citations
to authenticated;

grant select on table
  public.ai_usage_daily,
  public.plan_limits
to authenticated;

grant all privileges on table
  public.organizations,
  public.members,
  public.chats,
  public.messages,
  public.documents,
  public.filings,
  public.tasks,
  public.extracted_facts,
  public.notifications,
  public.audit_logs,
  public.newsletter_subscribers,
  public.newsletter_lists,
  public.newsletter_list_memberships,
  public.newsletter_consent_events,
  public.newsletter_campaigns,
  public.newsletter_campaign_versions,
  public.newsletter_send_jobs,
  public.newsletter_email_events,
  public.newsletter_suppression_list,
  public.newsletter_unsubscribe_tokens,
  public.document_chunks,
  public.ai_threads,
  public.ai_messages,
  public.ai_citations,
  public.ai_usage_daily,
  public.plan_limits
to service_role;

grant execute on function public.match_chunks(extensions.vector, uuid, int, float)
  to authenticated;
grant execute on function public.increment_ai_usage(uuid, date, integer, integer, numeric, integer)
  to authenticated, service_role;

-- New objects remain private until a later migration grants them explicitly.
alter default privileges for role postgres in schema public
  revoke select, insert, update, delete on tables from anon, authenticated, service_role;
alter default privileges for role postgres in schema public
  revoke execute on functions from anon, authenticated, service_role, public;
alter default privileges for role postgres in schema public
  revoke usage, select on sequences from anon, authenticated, service_role;

revoke execute on function public.set_updated_at() from public, anon, authenticated, service_role;
