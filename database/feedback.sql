create table if not exists public.feedback (
  id uuid primary key default gen_random_uuid(),
  visitor_id uuid not null,
  kind text not null check (kind in ('page', 'overall')),
  page_url text not null check (length(page_url) <= 2048),
  helpful boolean,
  rating smallint check (rating between 1 and 5),
  comment text not null default '' check (length(comment) <= 2000),
  created_at timestamptz not null default now(),
  check ((kind = 'page' and helpful is not null and rating is null) or
         (kind = 'overall' and rating is not null and helpful is null)),
  unique (visitor_id, kind, page_url)
);
-- Overall feedback is limited to one rating per browser across the website.
create unique index if not exists feedback_overall_visitor on public.feedback(visitor_id) where kind = 'overall';
alter table public.feedback enable row level security;
revoke all on public.feedback from anon, authenticated;
grant select, insert on public.feedback to service_role;
create or replace function public.feedback_totals() returns json
language sql stable security invoker set search_path = public as $$
  select json_build_object('total', count(*), 'yes', count(*) filter (where helpful = true),
    'no', count(*) filter (where helpful = false), 'ratings', count(rating),
    'average', round(avg(rating), 2)) from public.feedback;
$$;
revoke all on function public.feedback_totals() from public, anon, authenticated;
grant execute on function public.feedback_totals() to service_role;
