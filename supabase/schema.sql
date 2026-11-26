-- CHMSU Enrollment: run once in Supabase Dashboard > SQL Editor
create table if not exists profiles (
  id uuid primary key references auth.users on delete cascade,
  student_no text unique, full_name text not null, email text,
  campus text, program text, year_level text, standing text default 'Good',
  balance numeric default 0
);
create table if not exists enrollments (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users on delete cascade,
  reference text unique not null, term text not null,
  campus text, program text, college text, info jsonb default '{}', type text default 'freshman' check (type in ('freshman','transferee','continuing')),
  scholarship boolean default false, step int default 0,
  status text default 'draft' check (status in ('draft','submitted','approved','rejected')),
  total numeric default 0, created_at timestamptz default now()
);
create table if not exists documents (
  id uuid primary key default gen_random_uuid(),
  enrollment_id uuid not null references enrollments on delete cascade,
  user_id uuid not null default auth.uid(),
  kind text not null, label text not null, file_path text not null,
  status text default 'pending' check (status in ('pending','verified','rejected')),
  unique (enrollment_id, kind)
);
alter table profiles enable row level security;
alter table enrollments enable row level security;
alter table documents enable row level security;

create policy "own profile" on profiles for select using (id = auth.uid());
create policy "own enrollments" on enrollments for all using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy "own documents" on documents for all using (user_id = auth.uid()) with check (user_id = auth.uid());

-- Lets students log in with Student ID (returns only the email, nothing else)
create or replace function email_for_student_id(sid text) returns text
language sql security definer set search_path = public as
$$ select email from profiles where student_no = sid limit 1 $$;
grant execute on function email_for_student_id(text) to anon, authenticated;

-- Private bucket for requirement uploads (files live under <user id>/...)
insert into storage.buckets (id, name, public) values ('requirements','requirements',false) on conflict do nothing;
create policy "own files read" on storage.objects for select using (bucket_id='requirements' and (storage.foldername(name))[1]=auth.uid()::text);
create policy "own files write" on storage.objects for insert with check (bucket_id='requirements' and (storage.foldername(name))[1]=auth.uid()::text);
create policy "own files update" on storage.objects for update using (bucket_id='requirements' and (storage.foldername(name))[1]=auth.uid()::text);
