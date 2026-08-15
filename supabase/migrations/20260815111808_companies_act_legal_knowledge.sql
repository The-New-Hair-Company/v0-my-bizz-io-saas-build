begin;

alter table public.knowledge_entries
  add column if not exists source_authority text,
  add column if not exists jurisdiction text,
  add column if not exists reviewed_on date;

-- Rebuild the generated vector explicitly so all expressions remain immutable.
-- Plain-English intent expansion is handled in the application before this
-- database search, while curated keywords remain useful review metadata.
drop index if exists public.knowledge_entries_search_idx;
alter table public.knowledge_entries drop column if exists search_vector;
alter table public.knowledge_entries
  add column search_vector tsvector generated always as (
    setweight(to_tsvector('english', coalesce(title, '')), 'A') ||
    setweight(to_tsvector('english', coalesce(content, '')), 'B')
  ) stored;
create index knowledge_entries_search_idx
  on public.knowledge_entries using gin (search_vector);

drop function if exists public.search_grounded_knowledge(text, uuid, integer);
drop function if exists public.search_grounded_knowledge(text, uuid, integer, text[]);

create function public.search_grounded_knowledge(
  query_text text,
  p_organization_id uuid default null,
  match_count integer default 6,
  p_categories text[] default null
)
returns table (
  source_kind text,
  source_id uuid,
  document_id uuid,
  title text,
  content text,
  score real,
  source_url text,
  category text
)
language sql
stable
security invoker
set search_path = ''
as $$
  with query as (
    select websearch_to_tsquery('english', nullif(trim(query_text), '')) as value
  ), candidates as (
    select
      'document'::text as source_kind,
      dc.id as source_id,
      dc.document_id,
      d.title,
      dc.content,
      ts_rank_cd(dc.search_vector, query.value)::real as score,
      null::text as source_url,
      'document'::text as category
    from public.document_chunks dc
    join public.documents d on d.id = dc.document_id
    cross join query
    where p_organization_id is not null
      and dc.organization_id = p_organization_id
      and query.value is not null
      and dc.search_vector @@ query.value

    union all

    select
      'knowledge'::text,
      ke.id,
      null::uuid,
      ke.title,
      ke.content,
      ts_rank_cd(ke.search_vector, query.value)::real,
      ke.source_url,
      ke.category
    from public.knowledge_entries ke
    cross join query
    where ke.active
      and query.value is not null
      and ke.search_vector @@ query.value
      and (p_categories is null or ke.category = any(p_categories))
      and (
        (ke.visibility = 'public' and ke.organization_id is null)
        or (p_organization_id is not null and ke.organization_id = p_organization_id)
      )
  )
  select * from candidates
  order by score desc, title asc
  limit greatest(1, least(match_count, 10));
$$;

revoke all on function public.search_grounded_knowledge(text, uuid, integer, text[]) from public;
grant execute on function public.search_grounded_knowledge(text, uuid, integer, text[]) to anon, authenticated;

insert into public.knowledge_entries
  (knowledge_key, organization_id, visibility, category, title, content, keywords, source_url, source_authority, jurisdiction, reviewed_on)
values
  (
    'uk-ca2006-overview', null, 'public', 'uk_company_law',
    'Companies Act 2006: practical scope',
    'The Companies Act 2006 is the main statutory framework for UK companies. It covers formation, a company’s constitution and capacity, directors and their general duties, member decisions, share capital, accounts and audit, distributions, company records, filings and dissolution. A practical answer should identify the relevant company type, jurisdiction, articles, facts and later amendments rather than treating one section in isolation.',
    array['companies act','company law','uk company','limited company','statute','legal duties','governance'],
    'https://www.legislation.gov.uk/ukpga/2006/46/contents', 'UK legislation', 'United Kingdom', '2026-08-15'
  ),
  (
    'uk-ca2006-formation-sections-7-16', null, 'public', 'uk_company_law',
    'Forming and registering a company — sections 7 to 16',
    'A company is formed by one or more persons subscribing a memorandum and complying with the registration requirements. The application includes the proposed company name, registered office jurisdiction, liability and company type, proposed officers, statement of capital or guarantee where applicable, and a statement of compliance. Registration creates the company as a body corporate. Founders should settle ownership, control, articles, registered office and officer details before filing.',
    array['incorporation','formation','register company','memorandum','articles','directors','shareholders','statement of capital'],
    'https://www.legislation.gov.uk/ukpga/2006/46/part/2', 'UK legislation', 'United Kingdom', '2026-08-15'
  ),
  (
    'uk-ca2006-registered-office-sections-86-88', null, 'public', 'uk_company_compliance',
    'Registered office duties — sections 86 to 88',
    'A company must maintain a registered office to which official communications can be sent and must notify the registrar of changes. The address is part of the public company record. Current filing practice also requires companies to maintain a registered email address, so users should check current Companies House requirements as well as the Act.',
    array['registered office','company address','official address','service address','registered email','companies house'],
    'https://www.legislation.gov.uk/ukpga/2006/46/part/6', 'UK legislation', 'United Kingdom', '2026-08-15'
  ),
  (
    'uk-ca2006-director-powers-section-171', null, 'public', 'uk_company_law',
    'Director duty to act within powers — section 171',
    'A director must act in accordance with the company’s constitution and use powers only for the purposes for which they were conferred. In practice, the director should check the articles and relevant member decisions, identify the purpose of the power being used, and record the basis for an important decision.',
    array['director duty','act within powers','proper purpose','constitution','articles','section 171'],
    'https://www.legislation.gov.uk/ukpga/2006/46/section/171', 'UK legislation', 'United Kingdom', '2026-08-15'
  ),
  (
    'uk-ca2006-director-success-section-172', null, 'public', 'uk_company_law',
    'Director duty to promote the company’s success — section 172',
    'A director must act in the way they consider, in good faith, would be most likely to promote the success of the company for members as a whole. The decision process should have regard to long-term consequences, employees, business relationships, community and environmental impact, reputation for high standards and fairness between members. The duty is subject to rules requiring attention to creditor interests in relevant financial distress circumstances.',
    array['director duty','promote success','employees','suppliers','customers','reputation','members','creditors','section 172'],
    'https://www.legislation.gov.uk/ukpga/2006/46/section/172', 'UK legislation', 'United Kingdom', '2026-08-15'
  ),
  (
    'uk-ca2006-director-judgment-care-sections-173-174', null, 'public', 'uk_company_law',
    'Independent judgment and reasonable care — sections 173 and 174',
    'Directors must exercise independent judgment and reasonable care, skill and diligence. The care standard combines the knowledge and experience reasonably expected from a person performing the director’s functions with the greater knowledge and experience the particular director actually has. Delegation does not remove the need for an informed and properly supervised decision process.',
    array['independent judgment','care skill diligence','reasonable director','delegation','board decision','section 173','section 174'],
    'https://www.legislation.gov.uk/ukpga/2006/46/section/174', 'UK legislation', 'United Kingdom', '2026-08-15'
  ),
  (
    'uk-ca2006-conflicts-sections-175-177', null, 'public', 'uk_company_law',
    'Conflicts, benefits and declarations — sections 175 to 177',
    'A director should avoid situations in which they have, or may have, an interest that conflicts with the company’s interests, including misuse of company property, information or opportunities. Benefits from third parties can engage a separate duty. A direct or indirect interest in a proposed company transaction or arrangement should be declared to the other directors before the company enters into it. The articles and statutory rules determine how a conflict may be authorised and whether the interested director can count in the decision.',
    array['conflict of interest','declare interest','related party','company opportunity','third party benefit','authorisation','section 175','section 176','section 177'],
    'https://www.legislation.gov.uk/ukpga/2006/46/section/175', 'UK legislation', 'United Kingdom', '2026-08-15'
  ),
  (
    'uk-ca2006-breach-section-178', null, 'public', 'uk_company_law',
    'Consequences of breaching directors’ general duties — section 178',
    'The general duties are owed to the company. Depending on the duty and facts, civil consequences can include compensation for loss, restoration of company property, an account of profit made by the director, or unwinding a transaction. Disputes, threatened claims, insolvency and possible personal exposure require prompt fact-specific advice from a solicitor.',
    array['breach director duty','damages','compensation','account of profits','rescission','personal liability','section 178'],
    'https://www.legislation.gov.uk/ukpga/2006/46/section/178', 'UK legislation', 'United Kingdom', '2026-08-15'
  ),
  (
    'uk-ca2006-member-resolutions-sections-281-300', null, 'public', 'uk_company_law',
    'Company decisions and written resolutions — sections 281 to 300',
    'Member decisions may require an ordinary or special resolution depending on the Act, articles and subject matter. Private companies can generally use the statutory written-resolution procedure, subject to exceptions and the required majority. The company should retain the resolution, evidence of agreement, date it passed and any related filings. Board decisions remain governed by the articles and are distinct from member resolutions.',
    array['resolution','written resolution','ordinary resolution','special resolution','shareholder vote','member decision','minutes'],
    'https://www.legislation.gov.uk/ukpga/2006/46/part/13', 'UK legislation', 'United Kingdom', '2026-08-15'
  ),
  (
    'uk-ca2006-accounting-records-sections-386-389', null, 'public', 'uk_company_compliance',
    'Accounting records — sections 386 to 389',
    'Every company must keep accounting records sufficient to show and explain its transactions and disclose its financial position with reasonable accuracy. Records include money received and spent and assets and liabilities, with additional stock and goods records where relevant. Directors remain responsible for adequate records even where bookkeeping is delegated.',
    array['accounting records','bookkeeping','transactions','assets liabilities','stock records','director responsibility','section 386'],
    'https://www.legislation.gov.uk/ukpga/2006/46/section/386', 'UK legislation', 'United Kingdom', '2026-08-15'
  ),
  (
    'uk-ca2006-file-accounts-sections-441-442', null, 'public', 'uk_company_compliance',
    'Filing annual accounts — sections 441 and 442',
    'Companies must deliver accounts and reports to the registrar, subject to the requirements and exemptions applying to their company type. Filing periods and the content to be delivered vary, so the live Companies House record and current guidance should be checked. Delegating preparation or filing does not remove the directors’ responsibility.',
    array['annual accounts','file accounts','registrar','companies house','filing deadline','dormant accounts','section 441','section 442'],
    'https://www.gov.uk/government/publications/life-of-a-company-annual-requirements/life-of-a-company-part-1-accounts', 'Companies House', 'United Kingdom', '2026-08-15'
  ),
  (
    'uk-ca2006-share-allotment-sections-549-551', null, 'public', 'uk_company_law',
    'Authority to allot shares — sections 549 to 551',
    'Directors need the authority required by the Act and the company’s constitution before allotting shares, subject to statutory exceptions. The authority, allotment terms, class rights, consideration and resulting ownership should be checked and documented before the register of members and required filings are updated.',
    array['allot shares','issue shares','director authority','equity','share capital','cap table','section 549','section 551'],
    'https://www.legislation.gov.uk/ukpga/2006/46/section/549', 'UK legislation', 'United Kingdom', '2026-08-15'
  ),
  (
    'uk-ca2006-preemption-section-561', null, 'public', 'uk_company_law',
    'Existing shareholders’ pre-emption rights — section 561',
    'Where the statutory pre-emption regime applies, equity securities proposed to be allotted for cash should first be offered to existing ordinary shareholders in proportion to their existing holdings, unless the rights are validly excluded or disapplied. The articles, shareholder agreement, class rights and exact type of allotment must also be checked.',
    array['pre-emption','preemption','existing shareholders','offer shares','dilution','allotment for cash','section 561'],
    'https://www.legislation.gov.uk/ukpga/2006/46/section/561', 'UK legislation', 'United Kingdom', '2026-08-15'
  ),
  (
    'uk-ca2006-distributions-sections-830-836', null, 'public', 'uk_company_law',
    'Dividends and distributable profits — sections 830 to 836',
    'A company may make a distribution only out of profits available for the purpose. The distribution must be justified by relevant accounts and comply with the company’s articles and share rights. Cash in the bank is not, by itself, proof of distributable profits. Directors should obtain current accounting evidence and record the decision before paying a dividend.',
    array['dividend','distribution','distributable profits','available profits','relevant accounts','pay shareholders','section 830','section 836'],
    'https://www.legislation.gov.uk/ukpga/2006/46/section/830', 'UK legislation', 'United Kingdom', '2026-08-15'
  ),
  (
    'uk-companies-house-confirmation-statement', null, 'public', 'uk_company_compliance',
    'Confirmation statement and current Companies House record',
    'A company must check the information held by Companies House and file a confirmation statement at least once in each 12-month review period, normally within 14 days after that period ends. The check covers details such as the registered office, officers, statement of capital, shareholders, SIC code and people with significant control. Other changes may need separate event-driven filings rather than waiting for the confirmation statement. Current identity-verification and filing requirements should be checked before submission.',
    array['confirmation statement','CS01','annual return','review period','companies house','PSC','SIC code','identity verification'],
    'https://www.gov.uk/running-a-limited-company/confirmation-statement', 'Companies House', 'United Kingdom', '2026-08-15'
  ),
  (
    'uk-companies-house-director-responsibilities', null, 'public', 'uk_company_compliance',
    'Current Companies House responsibilities for directors',
    'Directors are responsible for running the company and ensuring required information is filed on time. This includes annual accounts and confirmation statements and reporting relevant changes to officers, registered office, share allotments, charges and people with significant control. A professional can carry out the work, but responsibility remains with the directors. Users should verify live deadlines and current filing procedures on GOV.UK and the company’s Companies House record.',
    array['director responsibilities','companies house','annual accounts','confirmation statement','PSC','registered office','share allotment','filing'],
    'https://www.gov.uk/guidance/being-a-company-director', 'Companies House', 'United Kingdom', '2026-08-15'
  )
on conflict (knowledge_key) do update set
  category = excluded.category,
  title = excluded.title,
  content = excluded.content,
  keywords = excluded.keywords,
  source_url = excluded.source_url,
  source_authority = excluded.source_authority,
  jurisdiction = excluded.jurisdiction,
  reviewed_on = excluded.reviewed_on,
  active = true,
  updated_at = now();

commit;
