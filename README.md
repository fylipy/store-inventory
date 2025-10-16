# Store Inventory

A Next.js App Router starter for building a store inventory analytics experience. The project ships with TypeScript, Tailwind CSS, React Query, Prisma, Zod, and additional data tooling so you can focus on product work immediately.

## Getting started

1. **Install dependencies**

   ```bash
   npm install
   ```

2. **Copy the example environment file and configure Postgres access**

   ```bash
   cp .env.example .env.local
   ```

   Update the `DATABASE_URL` with your Postgres credentials. The string should follow the format:

   ```text
   postgresql://USER:PASSWORD@HOST:PORT/DATABASE
   ```

3. **Generate the Prisma client (after the `.env.local` file is configured)**

   ```bash
   npx prisma generate
   ```

4. **Run the development server**

   ```bash
   npm run dev
   ```

   Open <http://localhost:3000> in your browser to see the app.

## Available scripts

- `npm run dev` – Start the development server.
- `npm run build` – Create an optimized production build.
- `npm run start` – Run the production build locally.
- `npm run lint` – Lint the project with ESLint and Next.js rules.

## Tech stack

- [Next.js](https://nextjs.org/) App Router with TypeScript
- [Tailwind CSS](https://tailwindcss.com/) for styling with the `tailwindcss-animate` plugin enabled
- [@tanstack/react-query](https://tanstack.com/query/latest) for data fetching and caching
- [Prisma](https://www.prisma.io/) ORM with PostgreSQL connectivity via `DATABASE_URL`
- [Zod](https://zod.dev/) for schema validation
- [Recharts](https://recharts.org/), [date-fns](https://date-fns.org/), and [Papa Parse](https://www.papaparse.com/) for analytics tooling
- [clsx](https://github.com/lukeed/clsx) utility and [react-hot-toast](https://react-hot-toast.com/) notifications

## Project structure

```
app/            # App Router entry points and providers
public/         # Static assets
```

Feel free to extend the structure with `components/` and `lib/` directories as your domain grows.
