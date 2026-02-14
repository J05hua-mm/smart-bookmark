# smart-bookmark App

A full-stack bookmark manager built using next.js (App router) and Supabase(Auth,Database,Realtime), Tailwind CSS.
Users can authenticate with Google, add personal bookmarks and delete them.

## Live-Demo

https://smart-bookmark-beta.vercel.app/

## Tech stack 

- Next.js (App Router)
- Typescript
- Supabase (Auth, PostgreSQL, RealTime)
- Tailwind CSS
- Vercel (Deployment)

## Features

- Google OAuth Authentication through Supabase
- Secure Session handling
- Add bookmarks (title + url)
- Delete bookmarks
- Real-Time updates across multiple tabs
- Multi-user data isolation using Row Level Security (RLS)
- Deployed to production

## Security Model

This application uses Supabase Row Level Security(RLS) to ensure:

- Users can only view their own bookmarks
- Users can only insert bookmarks with their own `user_id`
- Users can only delete bookmarks they own

Policies implemented:

- SELECT: `auth.uid() = user_id`
- INSERT (WITH CHECK): `auth.uid() = user_id`
- DELETE: `auth.uid() = user_id`

Even though the anon public key is exposed to the frontend, RLS enforces ownership at the database level.

## Real time updates

The app subscribes to PostgreSQL changes using Supabase Realtime:

- Listens to INSERT and DELETE events
- Filters changes by `user_id`
- Automatically refreshes bookmark list on update

## Architecture Overview

1. User logs in via Google OAUth.
2. Supabase establishes session (JWT storeed CLient-side)
3. Session is retrieved on page load.
4. Bookmarks are fetched from PostgreSQL.
5. RLS ensures only the current user's data is accessible.
6. Realtime subscription keeps UI synced across tabs.

## Run Locally

- clone the repository:

git clone https://github.com/J05hua-mm/smart-bookmark.git

cd smart-bookmark

- Install dependencies

npm install

- create environment file

create `.env.local` file with these variables

NEXT_PUBLIC_SUPABASE_URL=your_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key

- Run development server

npm run dev




