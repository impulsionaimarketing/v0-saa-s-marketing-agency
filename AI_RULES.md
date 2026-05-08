# AI_RULES.md — Impulsionaí Marketing Dashboard

This file describes the tech stack and coding rules for AI assistants working on this codebase.

---

## Tech Stack

- **Framework:** [Next.js 16](https://nextjs.org/) (App Router) with React 19 and TypeScript 5. All pages live under `app/` using the file-system router. Server Components are used by default; Client Components are opted in with `"use client"`.
- **Language:** TypeScript throughout. Build errors are currently suppressed via `ignoreBuildErrors: true` in `next.config.mjs`, but all new code must be properly typed.
- **Styling:** [Tailwind CSS v4](https://tailwindcss.com/) with CSS variables for theming. Global styles are in `app/globals.css`. Use Tailwind utility classes for all layout, spacing, color, and typography — no inline styles or CSS modules.
- **UI Components:** [shadcn/ui](https://ui.shadcn.com/) (New York style, neutral base color). All pre-built components live in `components/ui/`. Do **not** edit files in `components/ui/` — create new wrapper components instead.
- **Icons:** [lucide-react](https://lucide.dev/) exclusively. Do not install or use any other icon library.
- **Database:** [PostgreSQL](https://www.postgresql.org/) accessed via the `pg` package (`lib/db.ts`). Raw SQL queries are used — there is no ORM. [Supabase](https://supabase.com/) (`@supabase/supabase-js` + `@supabase/ssr`) is also integrated for auth and storage utilities.
- **Authentication:** Custom cookie-based auth (`lib/auth/cookies.ts`) enforced by `middleware.ts`. The `AuthProvider` context (`lib/contexts/auth-context.tsx`) exposes the current user. Use the `useAuth` hook (`lib/hooks/use-auth.ts`) to access auth state in Client Components.
- **Forms:** [React Hook Form](https://react-hook-form.com/) (`react-hook-form`) with [Zod](https://zod.dev/) schemas for validation via `@hookform/resolvers/zod`. Always pair `<Form>` from `components/ui/form.tsx` with a Zod schema.
- **Charts:** [Recharts](https://recharts.org/) via the `components/ui/chart.tsx` wrapper. Do not use any other charting library.
- **Notifications / Toasts:** [Sonner](https://sonner.emilkowal.ski/) (`sonner`) for toast notifications. Import `toast` from `sonner` directly. Do not use the legacy `useToast` hook for new code.
- **File Storage:** [@vercel/blob](https://vercel.com/docs/storage/vercel-blob) for video and file uploads (see `app/api/upload-video/route.ts`).
- **Analytics:** [@vercel/analytics](https://vercel.com/analytics) — already included in `app/layout.tsx`. Do not add any other analytics scripts.

---

## Rules

### Project Structure
- Pages go in `app/<route>/page.tsx`. Each route may have a `loading.tsx` for Suspense skeletons.
- API routes go in `app/api/<resource>/route.ts`.
- Reusable UI components go in `components/<domain>/`. Generic primitives go in `components/ui/`.
- Data-fetching helpers (Server Component functions) go in `lib/data/`.
- Custom hooks go in `lib/hooks/`.
- Types and interfaces go in `lib/types/` or co-located with the feature they belong to.

### Components
- Prefer **Server Components** for data fetching. Only add `"use client"` when you need interactivity, browser APIs, or React hooks.
- Always use shadcn/ui primitives (`Button`, `Card`, `Dialog`, `Table`, etc.) before building custom alternatives.
- Never edit files inside `components/ui/` — wrap or extend them in a new component file.
- Use `cn()` from `lib/utils.ts` (which wraps `clsx` + `tailwind-merge`) for conditional class names.

### Styling
- Use Tailwind CSS utility classes for all styling. No inline `style` props, no CSS modules, no styled-components.
- Respect the existing CSS variable theme (`--background`, `--foreground`, `--primary`, `--muted`, etc.) defined in `app/globals.css`.
- Use `dark:` variants for dark mode support where applicable.

### Data & Database
- All database access goes through `lib/db.ts` (the `pg` pool). Write raw parameterized SQL — never concatenate user input into queries.
- Data-fetching functions for Server Components live in `lib/data/`. They should be `async` functions that query the DB and return typed results.
- Use Supabase client (`lib/supabase/client.ts` for client-side, `lib/supabase/server.ts` for server-side) only for auth session management and storage — not for general data queries.

### Forms & Validation
- All forms must use `react-hook-form` + Zod. Define a Zod schema first, infer the TypeScript type from it, then pass it to `useForm` via `zodResolver`.
- Use the `<Form>`, `<FormField>`, `<FormItem>`, `<FormLabel>`, `<FormControl>`, and `<FormMessage>` components from `components/ui/form.tsx`.

### API Routes
- API routes are Next.js Route Handlers (`app/api/.../route.ts`). Export named functions (`GET`, `POST`, `PUT`, `DELETE`, `PATCH`).
- Always validate and sanitize request bodies before using them in SQL queries.
- Return `NextResponse.json(...)` with appropriate HTTP status codes.

### Authentication & Authorization
- Use the `ProtectedRoute` component (`components/auth/protected-route.tsx`) to guard pages that require login.
- Use `useAuth()` to read the current user in Client Components.
- Use `usePermissions()` and `useModuleAccess()` hooks for role-based access control.
- Never expose sensitive data (passwords, tokens) to the client.

### Icons
- Use **lucide-react** only. Import icons by name: `import { IconName } from "lucide-react"`.

### Notifications
- Use `toast` from **sonner** for all user-facing notifications. Do not use `useToast` from `components/ui/use-toast.ts` in new code.

### Dates
- Use **date-fns** for all date formatting and manipulation. Do not use `moment.js` or `dayjs`.

### Charts
- Use **Recharts** via the `components/ui/chart.tsx` wrapper. Do not introduce other charting libraries.

### Language
- The application UI is in **Brazilian Portuguese** (`pt-BR`). All user-facing strings, labels, and messages must be written in Portuguese.
- Code identifiers (variables, functions, types) may be in English or Portuguese — follow the convention already established in the file being edited.
