# React TypeScript Supabase Starter Pack

A modern, production-ready starter template for building web applications with React, TypeScript, and Supabase.

## What's Included

**Core**
- React 19 with TypeScript
- Vite for fast development
- Tailwind CSS 4 for styling
- shadcn/ui components (Button, Card, Input, Label)
- Dark mode support

**Backend & Auth**
- Supabase for database and authentication
- Protected routes ready to use
- Sign in/Sign out functionality
- Google OAuth ready (just add your credentials)

**Data Management**
- React Query for data fetching and caching
- React Hook Form for forms
- Type-safe database queries

**Code Quality**
- ESLint for catching errors
- Prettier for consistent formatting
- Husky runs checks before every commit
- EditorConfig for consistent editor settings
- Dependabot keeps dependencies updated

---

## Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/) version 20 or higher
- [Docker](https://www.docker.com/products/docker-desktop/) (for local Supabase)

### Step 1: Clone and Install

```bash
# Clone this repository
git clone <your-repo-url> my-app
cd my-app

# Install dependencies
npm install
```

### Step 2: Set Up Supabase Locally

Supabase runs locally using Docker. Make sure Docker is running, then:

```bash
# Install Supabase CLI (if not already installed)
npm install supabase --save-dev

# Start Supabase services
npx supabase start
```

This will start:
- **Database** (PostgreSQL) on port 54342
- **API** on port 54341
- **Studio** (web dashboard) on port 54343

Open [http://localhost:54343](http://localhost:54343) to access Supabase Studio.

### Step 3: Configure Environment Variables

Copy the example environment file:

```bash
cp .env.example .env.local
```

After running `npx supabase start`, you'll see output with your local credentials. Copy the `anon key` and update `.env.local`:

```
VITE_SUPABASE_URL=http://127.0.0.1:54321
VITE_SUPABASE_ANON_KEY=<your-anon-key-here>
```

### Step 4: Generate Database Types (Optional)

If you've created tables in Supabase, generate TypeScript types:

```bash
npm run gen:types
```

### Step 5: Start Development

```bash
npm run dev
```

Open [http://localhost:5173](http://localhost:5173) to see your app.

---

## Available Commands

| Command | What It Does |
|---------|--------------|
| `npm run dev` | Start development server |
| `npm run build` | Build for production |
| `npm run preview` | Preview production build |
| `npm run lint` | Check code for errors |
| `npm run lint:fix` | Fix auto-fixable errors |
| `npm run format` | Format all files with Prettier |
| `npm run format:check` | Check if files are formatted |
| `npm run gen:types` | Generate database types from local Supabase |
| `npm run gen:types:remote` | Generate database types from remote Supabase |

---

## Project Structure

```
src/
├── components/          # Reusable UI components
│   ├── ui/              # shadcn/ui components
│   ├── Navbar.tsx       # Navigation bar
│   ├── ThemeProvider.tsx
│   └── ThemeToggle.tsx  # Dark/light mode toggle
├── context/
│   └── AuthContext.tsx  # Authentication state
├── hooks/
│   ├── useAuth.tsx      # Access auth state
│   └── useSignOut.tsx   # Sign out functionality
├── lib/
│   ├── supabase.ts      # Supabase client
│   ├── queryClient.ts   # React Query setup
│   └── utils.ts         # Utility functions
├── pages/
│   ├── HomePage.tsx     # Protected dashboard
│   └── LoginPage.tsx    # Login/signup page
├── types/
│   └── database.types.ts # Generated Supabase types
├── App.tsx              # Routes and app structure
├── main.tsx             # Entry point
└── ProtectedRoute.tsx   # Auth guard for routes
```

---

## Adding shadcn/ui Components

This template uses [shadcn/ui](https://ui.shadcn.com/) for UI components. To add more:

```bash
npx shadcn@latest add dialog
npx shadcn@latest add dropdown-menu
npx shadcn@latest add table
```

Browse all components at [ui.shadcn.com/docs/components](https://ui.shadcn.com/docs/components).

---

## Setting Up Google OAuth (Optional)

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create OAuth 2.0 credentials
3. Add your credentials to `supabase/config.toml`:

```toml
[auth.external.google]
enabled = true
client_id = "env(GOOGLE_CLIENT_ID)"
client_secret = "env(GOOGLE_CLIENT_SECRET)"
```

4. Add to your `.env.local`:

```
GOOGLE_CLIENT_ID=your-client-id
GOOGLE_CLIENT_SECRET=your-client-secret
```

5. Restart Supabase: `npx supabase stop && npx supabase start`

---

## Deploying to Production

### Database

1. Create a project at [supabase.com](https://supabase.com)
2. Run your migrations or recreate your tables
3. Update `.env.local` with your production URL and anon key

### Frontend

Build and deploy to any static hosting:

```bash
npm run build
```

The `dist/` folder can be deployed to Vercel, Netlify, Cloudflare Pages, or any static host.

---

## Optional Enhancements

These features are not included by default but can be added if your team prefers them.

### File-Based Routing

**What it does:** Automatically creates routes based on your file structure. Instead of defining routes manually, files in `src/pages/` become routes automatically.

**Why you might want it:**
- Less boilerplate when you have many pages
- Convention used by Next.js and Nuxt

**Why it's not included:**
- Adds "magic" that can confuse new team members
- Requires restructuring how protected routes work
- Explicit routing is clearer for most teams

**To add it:**

```bash
npm install vite-plugin-pages
```

Then update `vite.config.ts` to include the plugin and restructure your pages folder.

---

### Auto-Imports

**What it does:** Automatically imports React hooks and common functions. You can use `useState` without writing `import { useState } from 'react'`.

**Why you might want it:**
- Less typing
- Cleaner-looking files

**Why it's not included:**
- Makes code harder to understand ("where does this come from?")
- Confuses developers new to the codebase
- IDEs already auto-complete imports for you

**To add it:**

```bash
npm install unplugin-auto-import
```

Then configure it in `vite.config.ts` with the presets you want (react, react-router, etc.).

---

### SVG as React Components

**What it does:** Import SVG files as React components instead of using image tags. Lets you style SVGs with CSS and pass props to them.

**Why you might want it:**
- Better control over SVG styling
- Can change colors and sizes with props
- Cleaner than inline SVG code

**Why it's not included:**
- Lucide React already provides 1000+ icons
- Only needed if you have custom SVG assets (logos, illustrations)

**To add it:**

```bash
npm install vite-plugin-svgr
```

Then add to `vite.config.ts`:

```typescript
import svgr from "vite-plugin-svgr";

export default defineConfig({
  plugins: [react(), tailwindcss(), svgr()],
});
```

Usage:
```typescript
import Logo from "./logo.svg?react";

<Logo className="h-8 w-8 text-blue-500" />
```

---

## Troubleshooting

**Supabase won't start**
- Make sure Docker is running
- Try `npx supabase stop` then `npx supabase start`

**Types not generating**
- Make sure Supabase is running locally
- Check that you have tables created in your database

**Pre-commit hook failing**
- Run `npm run lint:fix` to auto-fix issues
- Run `npm run format` to format files

---

## License

MIT
