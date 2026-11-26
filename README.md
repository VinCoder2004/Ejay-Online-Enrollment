# CHMSU Online Enrollment (HTML + CSS + JS + Supabase)

No build step. Serve the folder with any static server (`npx serve .`, VS Code Live Server, Netlify, Vercel).
Opening index.html via file:// will not work because it uses ES modules.

## Setup
1. Create a Supabase project.
2. SQL Editor: paste and run `supabase/schema.sql`.
3. Authentication > Providers: enable **Anonymous sign-ins** (used by the freshman flow).
4. Put your Project URL and anon key in `js/config.js`.
5. Add a student: Authentication > Users > Add user (email + password), then insert a matching row in `profiles`
   (id = that user's UUID, student_no, full_name, email, campus, program, year_level).

## Updating an existing project
If you ran an older schema.sql, also run `supabase/migration-002.sql` once (adds the `type` column).

## Notes
- Progress saves after every step, so users can leave and resume.
- Uploads go to the private `requirements` bucket under the user's own folder.
- All tables use Row Level Security: users only see their own data.
- Registrar/OSA/clinic/cashier verification is not automated yet. Staff change `documents.status` and
  `enrollments.status` in the Supabase table editor until a staff portal exists.
