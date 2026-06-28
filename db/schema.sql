-- ============================================================
-- Research & Science Fair AI Coach — Database Schema
-- Built for Supabase (Postgres + built-in auth)
-- ============================================================

-- Supabase gives us auth.users automatically when someone signs up.
-- We extend it with our own "profiles" table that holds app-specific data.
-- (Best practice: never put app data directly in auth.users — keep a separate table.)

create table profiles (
  id uuid references auth.users(id) primary key,
  full_name text,
  role text not null default 'student' check (role in ('student', 'parent', 'coach')),
  grade_level int,                -- e.g. 9, 10, 11, 12 (null if not yet known)
  created_at timestamptz default now()
);

-- A "project" is one student's science fair / research project.
-- A student could in theory restart or have multiple over time (different years),
-- so this is its own table rather than cramming into profiles.

create table projects (
  id uuid primary key default gen_random_uuid(),
  student_id uuid references profiles(id) not null,

  -- which "track" this project belongs to — lets us expand later
  -- (college_consulting, etc.) without restructuring this table
  track text not null default 'research_sciencefair',

  -- the stage machine state — this drives which system prompt is active
  stage text not null default 'interest_capture'
    check (stage in (
      'interest_capture',
      'constraint_check',
      'idea_narrowing',
      'methodology',
      'iteration',
      'writeup',
      'complete'
    )),

  -- structured facts we've learned about this project so far.
  -- jsonb = flexible schema-less storage for things that vary project to project
  -- (interests, equipment access, deadline, chosen idea, hypothesis, etc.)
  context jsonb not null default '{}'::jsonb,

  -- has this project unlocked the paid stages (methodology onward)?
  is_paid boolean not null default false,

  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Every message in every conversation, so a student can leave and resume later.
-- This is what makes "saved progress" real.

create table messages (
  id uuid primary key default gen_random_uuid(),
  project_id uuid references projects(id) not null,
  role text not null check (role in ('user', 'assistant')),
  content text not null,
  stage_at_time text not null,   -- which stage this message happened in (for history/debugging)
  created_at timestamptz default now()
);

-- Tracking API usage/cost per project — critical for knowing if you're
-- actually profitable per user, not just per subscription tier.

create table api_usage (
  id uuid primary key default gen_random_uuid(),
  project_id uuid references projects(id) not null,
  input_tokens int not null,
  output_tokens int not null,
  estimated_cost_usd numeric(10,5) not null,
  created_at timestamptz default now()
);

-- Indexes for the queries we'll actually run a lot
create index idx_projects_student on projects(student_id);
create index idx_messages_project on messages(project_id);
create index idx_usage_project on api_usage(project_id);

-- Row Level Security: Supabase's way of enforcing "you can only see your own data"
-- at the database level, not just in app code (defense in depth — critical for real apps)

alter table profiles enable row level security;
alter table projects enable row level security;
alter table messages enable row level security;
alter table api_usage enable row level security;

create policy "Users can view their own profile"
  on profiles for select using (auth.uid() = id);

create policy "Users can create their own profile"
  on profiles for insert with check (auth.uid() = id);

create policy "Users can view their own projects"
  on projects for select using (auth.uid() = student_id);

create policy "Users can insert their own projects"
  on projects for insert with check (auth.uid() = student_id);

create policy "Users can update their own projects"
  on projects for update using (auth.uid() = student_id);

create policy "Users can view messages on their own projects"
  on messages for select using (
    project_id in (select id from projects where student_id = auth.uid())
  );

create policy "Users can insert messages on their own projects"
  on messages for insert with check (
    project_id in (select id from projects where student_id = auth.uid())
  );

create policy "Users can view usage on their own projects"
  on api_usage for select using (
    project_id in (select id from projects where student_id = auth.uid())
  );

create policy "Users can insert usage on their own projects"
  on api_usage for insert with check (
    project_id in (select id from projects where student_id = auth.uid())
  );
