CREATE TABLE IF NOT EXISTS "mood_boards" (
  "id" serial PRIMARY KEY NOT NULL,
  "couple_id" integer NOT NULL,
  "title" text DEFAULT 'Inspiration' NOT NULL,
  "description" text DEFAULT '' NOT NULL,
  "position" integer DEFAULT 0 NOT NULL,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS "mood_board_images" (
  "id" serial PRIMARY KEY NOT NULL,
  "board_id" integer NOT NULL,
  "couple_id" integer NOT NULL,
  "url" text NOT NULL,
  "caption" text DEFAULT '' NOT NULL,
  "position" integer DEFAULT 0 NOT NULL,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS "mood_board_collaborators" (
  "id" serial PRIMARY KEY NOT NULL,
  "couple_id" integer NOT NULL,
  "email" text NOT NULL,
  "name" text DEFAULT '' NOT NULL,
  "role" text DEFAULT 'viewer' NOT NULL,
  "token" text NOT NULL,
  "invited_at" timestamp with time zone DEFAULT now() NOT NULL
);

CREATE UNIQUE INDEX IF NOT EXISTS "mood_board_collaborators_token_idx" ON "mood_board_collaborators" ("token");

CREATE TABLE IF NOT EXISTS "rsvp_questions" (
  "id" serial PRIMARY KEY NOT NULL,
  "wedding_website_id" integer NOT NULL,
  "label" text NOT NULL,
  "type" text DEFAULT 'text' NOT NULL,
  "options" jsonb DEFAULT '[]'::jsonb NOT NULL,
  "required" boolean DEFAULT false NOT NULL,
  "position" integer DEFAULT 0 NOT NULL,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS "rsvp_responses" (
  "id" serial PRIMARY KEY NOT NULL,
  "rsvp_id" integer NOT NULL,
  "question_id" integer NOT NULL,
  "answer" text DEFAULT '' NOT NULL
);

CREATE TABLE IF NOT EXISTS "cagnottes" (
  "id" serial PRIMARY KEY NOT NULL,
  "couple_id" integer NOT NULL,
  "wedding_website_id" integer,
  "title" text NOT NULL,
  "description" text DEFAULT '' NOT NULL,
  "photo" text,
  "iban" text,
  "external_url" text,
  "position" integer DEFAULT 0 NOT NULL,
  "active" boolean DEFAULT true NOT NULL,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL
);
