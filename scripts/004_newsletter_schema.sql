-- ==========================================
-- ONLINE2DAY NEWSLETTER SYSTEM SCHEMA
-- Migration: 004_newsletter_schema
-- ==========================================

-- -----------------------------------------------
-- SUBSCRIBERS
-- -----------------------------------------------
CREATE TABLE IF NOT EXISTS public.newsletter_subscribers (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    email TEXT NOT NULL UNIQUE,
    first_name TEXT,
    last_name TEXT,
    company TEXT,
    status TEXT NOT NULL DEFAULT 'active', -- active | unsubscribed | bounced | complained
    source TEXT,                            -- website | import | manual | api
    last_engaged_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc', now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc', now()) NOT NULL
);

-- -----------------------------------------------
-- LISTS & MEMBERSHIPS
-- -----------------------------------------------
CREATE TABLE IF NOT EXISTS public.newsletter_lists (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc', now()) NOT NULL
);

CREATE TABLE IF NOT EXISTS public.newsletter_list_memberships (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    subscriber_id UUID NOT NULL REFERENCES public.newsletter_subscribers(id) ON DELETE CASCADE,
    list_id UUID NOT NULL REFERENCES public.newsletter_lists(id) ON DELETE CASCADE,
    status TEXT NOT NULL DEFAULT 'active', -- active | removed
    joined_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc', now()) NOT NULL,
    UNIQUE(subscriber_id, list_id)
);

-- -----------------------------------------------
-- CONSENT (immutable audit trail)
-- -----------------------------------------------
CREATE TABLE IF NOT EXISTS public.newsletter_consent_events (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    subscriber_id UUID NOT NULL REFERENCES public.newsletter_subscribers(id) ON DELETE CASCADE,
    consent_type TEXT NOT NULL,            -- opt-in | soft-opt-in | unsubscribe | import
    source_url TEXT,
    ip_hash TEXT,
    user_agent TEXT,
    form_version TEXT,
    occurred_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc', now()) NOT NULL
);

-- -----------------------------------------------
-- CAMPAIGNS
-- -----------------------------------------------
CREATE TABLE IF NOT EXISTS public.newsletter_campaigns (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    slug TEXT UNIQUE,                       -- for public web version URL
    title TEXT NOT NULL,
    subject TEXT NOT NULL,
    preview_text TEXT,
    from_name TEXT NOT NULL DEFAULT 'Online2Day',
    from_email TEXT NOT NULL DEFAULT 'news@online2day.co.uk',
    reply_to TEXT,
    list_id UUID REFERENCES public.newsletter_lists(id) ON DELETE SET NULL,
    status TEXT NOT NULL DEFAULT 'draft',   -- draft | scheduled | sending | sent | cancelled
    scheduled_at TIMESTAMP WITH TIME ZONE,
    sent_at TIMESTAMP WITH TIME ZONE,
    created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc', now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc', now()) NOT NULL
);

CREATE TABLE IF NOT EXISTS public.newsletter_campaign_versions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    campaign_id UUID NOT NULL REFERENCES public.newsletter_campaigns(id) ON DELETE CASCADE,
    html TEXT,                             -- compiled email-safe HTML
    text_fallback TEXT,                    -- plain-text fallback
    design_json JSONB,                     -- TipTap JSON for the editor
    hero_image_url TEXT,                   -- CDN URL for hero image
    created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc', now()) NOT NULL
);

-- -----------------------------------------------
-- SEND JOBS (one row per recipient per campaign)
-- -----------------------------------------------
CREATE TABLE IF NOT EXISTS public.newsletter_send_jobs (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    campaign_id UUID NOT NULL REFERENCES public.newsletter_campaigns(id) ON DELETE CASCADE,
    subscriber_id UUID NOT NULL REFERENCES public.newsletter_subscribers(id) ON DELETE CASCADE,
    provider_message_id TEXT,
    status TEXT NOT NULL DEFAULT 'queued',  -- queued | sending | sent | failed | bounced | unsubscribed
    attempts INT NOT NULL DEFAULT 0,
    last_error TEXT,
    scheduled_for TIMESTAMP WITH TIME ZONE,
    sent_at TIMESTAMP WITH TIME ZONE,
    UNIQUE(campaign_id, subscriber_id)
);

-- -----------------------------------------------
-- EMAIL EVENTS (bounces, opens, clicks, etc.)
-- -----------------------------------------------
CREATE TABLE IF NOT EXISTS public.newsletter_email_events (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    campaign_id UUID REFERENCES public.newsletter_campaigns(id) ON DELETE CASCADE,
    subscriber_id UUID REFERENCES public.newsletter_subscribers(id) ON DELETE CASCADE,
    event_type TEXT NOT NULL, -- delivered | opened | clicked | bounced | complained | unsubscribed | failed
    metadata JSONB,           -- link clicked, bounce type, etc.
    occurred_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc', now()) NOT NULL
);

-- -----------------------------------------------
-- GLOBAL SUPPRESSION LIST
-- -----------------------------------------------
CREATE TABLE IF NOT EXISTS public.newsletter_suppression_list (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    email TEXT NOT NULL UNIQUE,
    reason TEXT NOT NULL, -- bounce | complaint | unsubscribe | manual
    source TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc', now()) NOT NULL
);

-- -----------------------------------------------
-- UNSUBSCRIBE TOKENS (one-click unsubscribe)
-- -----------------------------------------------
CREATE TABLE IF NOT EXISTS public.newsletter_unsubscribe_tokens (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    subscriber_id UUID NOT NULL REFERENCES public.newsletter_subscribers(id) ON DELETE CASCADE,
    campaign_id UUID REFERENCES public.newsletter_campaigns(id) ON DELETE SET NULL,
    token_hash TEXT NOT NULL UNIQUE,        -- SHA-256 of the raw token
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    used_at TIMESTAMP WITH TIME ZONE
);

-- -----------------------------------------------
-- INDEXES
-- -----------------------------------------------
CREATE INDEX IF NOT EXISTS idx_nl_subscribers_email ON public.newsletter_subscribers(email);
CREATE INDEX IF NOT EXISTS idx_nl_subscribers_status ON public.newsletter_subscribers(status);
CREATE INDEX IF NOT EXISTS idx_nl_send_jobs_campaign ON public.newsletter_send_jobs(campaign_id, status);
CREATE INDEX IF NOT EXISTS idx_nl_send_jobs_queued ON public.newsletter_send_jobs(status, scheduled_for) WHERE status = 'queued';
CREATE INDEX IF NOT EXISTS idx_nl_events_campaign ON public.newsletter_email_events(campaign_id, event_type);
CREATE INDEX IF NOT EXISTS idx_nl_suppression_email ON public.newsletter_suppression_list(email);
CREATE INDEX IF NOT EXISTS idx_nl_tokens_hash ON public.newsletter_unsubscribe_tokens(token_hash);

-- -----------------------------------------------
-- ROW-LEVEL SECURITY
-- -----------------------------------------------
ALTER TABLE public.newsletter_subscribers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.newsletter_lists ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.newsletter_list_memberships ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.newsletter_campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.newsletter_campaign_versions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.newsletter_send_jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.newsletter_email_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.newsletter_suppression_list ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.newsletter_unsubscribe_tokens ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.newsletter_consent_events ENABLE ROW LEVEL SECURITY;

-- Admin-only policies (service role bypasses RLS for workers/webhooks)
CREATE POLICY "Admin can manage newsletter_subscribers"
  ON public.newsletter_subscribers FOR ALL USING (public.is_admin());

CREATE POLICY "Admin can manage newsletter_lists"
  ON public.newsletter_lists FOR ALL USING (public.is_admin());

CREATE POLICY "Admin can manage newsletter_list_memberships"
  ON public.newsletter_list_memberships FOR ALL USING (public.is_admin());

CREATE POLICY "Admin can manage newsletter_campaigns"
  ON public.newsletter_campaigns FOR ALL USING (public.is_admin());

CREATE POLICY "Admin can manage newsletter_campaign_versions"
  ON public.newsletter_campaign_versions FOR ALL USING (public.is_admin());

CREATE POLICY "Admin can view send_jobs"
  ON public.newsletter_send_jobs FOR SELECT USING (public.is_admin());

CREATE POLICY "Admin can view email_events"
  ON public.newsletter_email_events FOR SELECT USING (public.is_admin());

CREATE POLICY "Admin can manage suppression_list"
  ON public.newsletter_suppression_list FOR ALL USING (public.is_admin());

CREATE POLICY "Admin can view consent_events"
  ON public.newsletter_consent_events FOR SELECT USING (public.is_admin());

-- -----------------------------------------------
-- SEED DEFAULT LIST
-- -----------------------------------------------
INSERT INTO public.newsletter_lists (name, description)
VALUES ('Main Newsletter', 'Default subscriber list for Online2Day newsletter campaigns')
ON CONFLICT DO NOTHING;

-- -----------------------------------------------
-- UPDATED_AT TRIGGER
-- -----------------------------------------------
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN NEW.updated_at = timezone('utc', now()); RETURN NEW; END;
$$;

CREATE TRIGGER nl_subscribers_updated_at BEFORE UPDATE ON public.newsletter_subscribers
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TRIGGER nl_campaigns_updated_at BEFORE UPDATE ON public.newsletter_campaigns
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
