-- Run once if you already ran schema.sql earlier
alter table enrollments add column if not exists type text default 'freshman' check (type in ('freshman','transferee','continuing'));
