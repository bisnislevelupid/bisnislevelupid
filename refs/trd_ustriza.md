# Technical Requirements Document — ScaleUpBisnis.com
> *dan seluruh platform dalam ekosistem ini*

**Versi:** 1.0  
**Status:** Active Reference — wajib dibaca sebelum menulis satu baris kode pun  
**Berlaku untuk:** Semua aplikasi web dalam ekosistem ScaleUpBisnis  
**Author:** M. Irvan Adrian Ramdani

---

## Daftar Isi

1. [Architecture Principles](#1-architecture-principles)
2. [Tech Stack](#2-tech-stack)
3. [Project Structure](#3-project-structure)
4. [Database Layer — Neon PostgreSQL Raw Query](#4-database-layer)
5. [API Layer — Next.js Route Handlers](#5-api-layer)
6. [Frontend Architecture — Next.js SSR + shadcn/ui](#6-frontend-architecture)
7. [Authentication](#7-authentication)
8. [File & Image Storage — Vercel Blob](#8-file--image-storage)
9. [Caching — Upstash Redis](#9-caching--upstash-redis)
10. [Payment Integration — Xendit & Midtrans](#10-payment-integration)
11. [Email — Resend](#11-email--resend)
12. [Dependencies Reference](#12-dependencies-reference)
13. [Migration & Seeding — Drizzle (Migrate Only)](#13-migration--seeding)
14. [Performance & Traffic Guidelines](#14-performance--traffic-guidelines)
15. [Security Standards](#15-security-standards)
16. [Deployment — Vercel](#16-deployment--vercel)
17. [Code Conventions](#17-code-conventions)
18. [What Is Strictly Forbidden](#18-what-is-strictly-forbidden)

---

## 1. Architecture Principles

### 1.1 Filosofi Inti

Semua aplikasi dalam ekosistem ini dibangun di atas prinsip berikut. Tidak ada pengecualian.

| Prinsip | Penjelasan |
|---|---|
| **SSR over SPA** | Semua halaman adalah Server-Side Rendered (Next.js App Router). HTML, JSX, dan mockup hanya sebagai referensi desain — bukan implementasi. |
| **Server-First** | Logika bisnis, query, dan transformasi data terjadi di server. Komponen klien hanya untuk interaktivitas UI murni. |
| **Raw SQL** | Tidak ada ORM. Semua query ditulis dalam SQL mentah menggunakan `postgres` driver langsung ke Neon. |
| **Model-as-Route** | Setiap entitas memiliki route handler sendiri: `app/api/{model}/route.ts`. Komponen frontend tidak pernah menyentuh raw SQL. |
| **Drizzle = Migration only** | Drizzle hanya digunakan untuk `drizzle-kit push/migrate` dan seeding. Sama sekali tidak digunakan sebagai query builder atau ORM. |
| **Reusable by design** | Komponen, hooks, dan utilitas dirancang generik dan dapat digunakan kembali. Tidak ada duplikasi logika. |
| **High-traffic ready** | Setiap endpoint dirancang dengan Redis cache, rate limiting, dan connection pooling sejak awal. |

### 1.2 Data Flow Wajib

```
Browser Request
    │
    ▼
Next.js Server Component (RSC)    ← SSR, data fetch di sini
    │
    ├── fetch("/api/{model}")       ← Untuk mutasi / form
    │       │
    │       ▼
    │   app/api/{model}/route.ts   ← Validasi, auth check, bisnis logik
    │       │
    │       ▼
    │   lib/db/{model}.ts          ← Raw SQL queries ONLY di sini
    │       │
    │       ▼
    │   Neon PostgreSQL             ← Via @neondatabase/serverless
    │
    └── Direct DB call (server-only)   ← Untuk Server Components
            │
            ▼
        lib/db/{model}.ts          ← SAMA. Semua query di sini.
```

**Aturan absolut:** Tidak ada `import { sql } from 'lib/db'` atau query apapun di dalam file komponen React.

---

## 2. Tech Stack

### 2.1 Stack Lengkap

| Kategori | Teknologi | Versi | Catatan |
|---|---|---|---|
| **Framework** | Next.js | 15.x (App Router) | SSR/SSG, Server Actions |
| **Language** | TypeScript | 5.x | Strict mode wajib |
| **UI Library** | shadcn/ui | Latest | CLI-based, tidak di-commit as library |
| **CSS** | Tailwind CSS | 3.x | Utility-first |
| **Database** | Neon PostgreSQL | Serverless | `@neondatabase/serverless` |
| **DB Migration** | Drizzle Kit | Latest | `drizzle-kit` CLI only |
| **Cache** | Upstash Redis | Latest | `@upstash/redis` |
| **Storage** | Vercel Blob | Latest | `@vercel/blob` |
| **Auth** | NextAuth.js | v5 (beta) | App Router compatible |
| **Payment 1** | Xendit | v6 | VA, QRIS, E-Wallet |
| **Payment 2** | Midtrans | v1 | Snap, Direct Charge |
| **Email** | Resend | Latest | `resend` + React Email |
| **Deployment** | Vercel | - | Pro plan |
| **PDF** | `@react-pdf/renderer` | Latest | Server-side generation |
| **Excel** | `xlsx` (SheetJS) | Latest | Read/write xlsx |
| **Rich Text** | `@tiptap/react` | Latest | Editor + extensions |
| **Drag & Drop** | `dnd-kit` | Latest | Sortable, draggable |
| **Charts** | `recharts` | Latest | Composable charts |
| **Validation** | `zod` | Latest | Schema validation |
| **HTTP Client** | Native `fetch` | - | No axios |
| **Date** | `date-fns` | Latest | No moment.js |
| **ID Generation** | `nanoid` | Latest | URL-safe unique IDs |

### 2.2 Tidak Boleh Ditambahkan

- ❌ `axios` — gunakan native `fetch`
- ❌ `moment.js` atau `dayjs` — gunakan `date-fns`
- ❌ `prisma` — gunakan raw SQL via `@neondatabase/serverless`
- ❌ `mongoose` — tidak ada MongoDB
- ❌ `redux` / `zustand` / `jotai` — gunakan server state + `useState` lokal
- ❌ `react-query` / `swr` — data fetch di Server Components
- ❌ `lodash` — gunakan native JS/TS
- ❌ Semua library CSS-in-JS (styled-components, emotion)

---

## 3. Project Structure

### 3.1 Struktur Direktori Wajib

```
{app-name}/
├── app/
│   ├── (auth)/
│   │   ├── login/
│   │   │   └── page.tsx
│   │   └── register/
│   │       └── page.tsx
│   ├── (dashboard)/
│   │   ├── layout.tsx              ← Layout per role/grup
│   │   └── {feature}/
│   │       ├── page.tsx            ← Server Component (SSR)
│   │       ├── loading.tsx         ← Suspense loading UI
│   │       ├── error.tsx           ← Error boundary
│   │       └── _components/        ← Komponen privat halaman ini
│   │           ├── {feature}-table.tsx
│   │           └── {feature}-form.tsx
│   ├── api/
│   │   ├── {model}/
│   │   │   └── route.ts            ← GET, POST handler
│   │   ├── {model}/
│   │   │   └── [id]/
│   │   │       └── route.ts        ← GET, PATCH, DELETE by ID
│   │   └── webhooks/
│   │       ├── xendit/
│   │       │   └── route.ts
│   │       └── midtrans/
│   │           └── route.ts
│   ├── globals.css
│   └── layout.tsx                  ← Root layout
│
├── components/
│   ├── ui/                         ← shadcn/ui components (generated)
│   ├── shared/                     ← Reusable across pages
│   │   ├── data-table.tsx          ← Generic table with sort/filter/pagination
│   │   ├── page-header.tsx
│   │   ├── stat-card.tsx
│   │   ├── file-upload.tsx
│   │   ├── rich-text-editor.tsx    ← Tiptap wrapper
│   │   ├── pdf-download-button.tsx
│   │   ├── chart-wrapper.tsx       ← Recharts wrapper
│   │   └── sortable-list.tsx       ← dnd-kit wrapper
│   └── layouts/
│       ├── sidebar.tsx
│       ├── topbar.tsx
│       └── mobile-nav.tsx
│
├── lib/
│   ├── db/
│   │   ├── index.ts                ← Neon client singleton
│   │   ├── {model}.ts              ← Raw SQL queries per model
│   │   │   ← CONTOH: customers.ts, orders.ts, tests.ts
│   │   └── types.ts                ← DB row types (manual, bukan generated)
│   ├── auth/
│   │   └── index.ts                ← NextAuth config
│   ├── cache/
│   │   └── index.ts                ← Upstash Redis helpers
│   ├── storage/
│   │   └── index.ts                ← Vercel Blob helpers
│   ├── email/
│   │   ├── index.ts                ← Resend client
│   │   └── templates/              ← React Email templates
│   ├── payment/
│   │   ├── xendit.ts               ← Xendit helpers
│   │   └── midtrans.ts             ← Midtrans helpers
│   ├── pdf/
│   │   └── templates/              ← @react-pdf templates
│   ├── excel/
│   │   └── index.ts                ← xlsx helpers
│   ├── validations/
│   │   └── {model}.ts              ← Zod schemas per model
│   └── utils.ts                    ← Shared utilities (cn, formatRupiah, dll.)
│
├── hooks/
│   └── use-{feature}.ts            ← Custom hooks (client-side only)
│
├── types/
│   └── index.ts                    ← Global TypeScript types
│
├── drizzle/
│   ├── schema/                     ← Schema definitions (untuk migrate only)
│   │   └── {model}.ts
│   ├── migrations/                 ← Generated migration files
│   └── seed.ts                     ← Idempotent seed script
│
├── public/
│   └── ...
│
├── .env.local                      ← Env variables (tidak di-commit)
├── .env.example                    ← Template env
├── drizzle.config.ts
├── next.config.ts
├── tailwind.config.ts
├── components.json                 ← shadcn/ui config
└── tsconfig.json
```

### 3.2 Naming Conventions

| Type | Pattern | Contoh |
|---|---|---|
| File komponen | `kebab-case.tsx` | `data-table.tsx` |
| File utilitas | `kebab-case.ts` | `format-currency.ts` |
| File route | `route.ts` | `app/api/orders/route.ts` |
| Komponen React | `PascalCase` | `DataTable`, `OrderForm` |
| Hook custom | `use-kebab-case.ts` | `use-pagination.ts` |
| Folder privat | `_folder` | `_components/` |
| Konstanta | `UPPER_SNAKE_CASE` | `MAX_FILE_SIZE` |
| Tipe/Interface | `PascalCase` | `OrderRow`, `CustomerInsert` |

---

## 4. Database Layer

### 4.1 Neon Client Setup

```typescript
// lib/db/index.ts
import { neon } from '@neondatabase/serverless';

const connectionString = process.env.DATABASE_URL!;

// Singleton — satu instance per edge function invocation
export const sql = neon(connectionString);
```

### 4.2 Pola Raw Query — Wajib Diikuti

Setiap model memiliki file `lib/db/{model}.ts` sendiri. File ini hanya berisi fungsi-fungsi query dan type definitons. Tidak ada logika bisnis, validasi, atau HTTP response di sini.

```typescript
// lib/db/customers.ts
import { sql } from './index';

// ── Types ──────────────────────────────────────────────────
export type CustomerRow = {
  id: bigint;
  name: string;
  email: string;
  phone: string | null;
  business_name: string | null;
  status: string;
  created_at: Date;
};

export type CustomerInsert = Omit<CustomerRow, 'id' | 'created_at'>;
export type CustomerUpdate = Partial<CustomerInsert>;

// ── Queries ─────────────────────────────────────────────────

export async function getCustomerById(id: bigint): Promise<CustomerRow | null> {
  const rows = await sql`
    SELECT id, name, email, phone, business_name, status, created_at
    FROM customers
    WHERE id = ${id}
      AND deleted_at IS NULL
    LIMIT 1
  `;
  return (rows[0] as CustomerRow) ?? null;
}

export async function getCustomerByEmail(email: string): Promise<CustomerRow | null> {
  const rows = await sql`
    SELECT id, name, email, phone, business_name, status, created_at
    FROM customers
    WHERE email = ${email}
      AND deleted_at IS NULL
    LIMIT 1
  `;
  return (rows[0] as CustomerRow) ?? null;
}

export async function listCustomers(opts: {
  limit?: number;
  offset?: number;
  search?: string;
  status?: string;
}): Promise<{ rows: CustomerRow[]; total: number }> {
  const limit  = opts.limit  ?? 25;
  const offset = opts.offset ?? 0;
  const search = opts.search ? `%${opts.search}%` : null;
  const status = opts.status ?? null;

  const [rows, countRows] = await Promise.all([
    sql`
      SELECT id, name, email, phone, business_name, status, created_at
      FROM customers
      WHERE deleted_at IS NULL
        AND (${search}::text IS NULL OR (name ILIKE ${search} OR email ILIKE ${search}))
        AND (${status}::text IS NULL OR status = ${status})
      ORDER BY created_at DESC
      LIMIT ${limit} OFFSET ${offset}
    `,
    sql`
      SELECT COUNT(*) AS total
      FROM customers
      WHERE deleted_at IS NULL
        AND (${search}::text IS NULL OR (name ILIKE ${search} OR email ILIKE ${search}))
        AND (${status}::text IS NULL OR status = ${status})
    `,
  ]);

  return {
    rows:  rows as CustomerRow[],
    total: Number((countRows[0] as { total: string }).total),
  };
}

export async function insertCustomer(data: CustomerInsert): Promise<CustomerRow> {
  const rows = await sql`
    INSERT INTO customers (name, email, phone, business_name, status)
    VALUES (${data.name}, ${data.email}, ${data.phone}, ${data.business_name}, ${data.status})
    RETURNING *
  `;
  return rows[0] as CustomerRow;
}

export async function updateCustomer(
  id: bigint,
  data: CustomerUpdate
): Promise<CustomerRow | null> {
  // Hanya update kolom yang dikirim (partial update)
  const rows = await sql`
    UPDATE customers
    SET
      name          = COALESCE(${data.name ?? null}, name),
      phone         = COALESCE(${data.phone ?? null}, phone),
      business_name = COALESCE(${data.business_name ?? null}, business_name),
      status        = COALESCE(${data.status ?? null}, status),
      updated_at    = CURRENT_TIMESTAMP
    WHERE id = ${id} AND deleted_at IS NULL
    RETURNING *
  `;
  return (rows[0] as CustomerRow) ?? null;
}

export async function softDeleteCustomer(id: bigint): Promise<boolean> {
  const rows = await sql`
    UPDATE customers
    SET deleted_at = CURRENT_TIMESTAMP
    WHERE id = ${id} AND deleted_at IS NULL
    RETURNING id
  `;
  return rows.length > 0;
}
```

### 4.3 Aturan Raw Query

```
✅ Boleh                                    ❌ Tidak Boleh
──────────────────────────────────────     ──────────────────────────────────────────
sql`SELECT * FROM ...`                     drizzle.select().from(...)
Template literal tagging (neon driver)     String concatenation untuk query
Parameterized queries via ${variable}      `'SELECT * FROM t WHERE id = ' + id`
COALESCE untuk partial update              Query di dalam React component
Promise.all untuk parallel queries         Import sql di file .tsx/.jsx
RETURNING * untuk insert/update result     drizzle.query.xxx.findMany()
Transaksi via sql.transaction()            Any ORM method
```

### 4.4 Transaksi

```typescript
// lib/db/orders.ts — contoh transaksi
export async function createOrderWithItems(
  order: OrderInsert,
  items: OrderItemInsert[]
): Promise<OrderRow> {
  // Neon serverless mendukung transaksi interaktif
  const result = await sql.transaction(async (tx) => {
    const [orderRow] = await tx`
      INSERT INTO orders (customer_id, total_amount, status)
      VALUES (${order.customer_id}, ${order.total_amount}, 'PENDING')
      RETURNING *
    `;

    for (const item of items) {
      await tx`
        INSERT INTO order_items (order_id, product_id, quantity, unit_price)
        VALUES (${orderRow.id}, ${item.product_id}, ${item.quantity}, ${item.unit_price})
      `;
    }

    return orderRow as OrderRow;
  });

  return result;
}
```

### 4.5 Konvensi SQL

- Semua nama tabel dan kolom: `snake_case`
- Selalu sertakan `WHERE deleted_at IS NULL` untuk soft-delete entities
- Selalu `ORDER BY` untuk query list (tidak bergantung urutan default)
- Selalu sertakan pagination (`LIMIT`, `OFFSET`) untuk query list
- Gunakan `RETURNING *` atau kolom spesifik setelah INSERT/UPDATE
- Selalu cast tipe eksplisit jika ada ambiguitas: `${value}::text`, `${id}::bigint`

---

## 5. API Layer

### 5.1 Route Handler Pattern

Setiap route handler mengikuti struktur ini secara konsisten:

```typescript
// app/api/customers/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { redis } from '@/lib/cache';
import { listCustomers, insertCustomer } from '@/lib/db/customers';
import { customerInsertSchema } from '@/lib/validations/customer';
import { z } from 'zod';

// ── GET /api/customers ──────────────────────────────────────
export async function GET(req: NextRequest) {
  try {
    // 1. Auth check
    const session = await auth();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // 2. Parse query params
    const { searchParams } = req.nextUrl;
    const page   = Math.max(1, Number(searchParams.get('page')  ?? '1'));
    const limit  = Math.min(100, Number(searchParams.get('limit') ?? '25'));
    const search = searchParams.get('search') ?? undefined;
    const status = searchParams.get('status') ?? undefined;
    const offset = (page - 1) * limit;

    // 3. Cache check (optional, untuk list yang jarang berubah)
    const cacheKey = `customers:list:${page}:${limit}:${search}:${status}`;
    const cached = await redis.get(cacheKey);
    if (cached) {
      return NextResponse.json(cached, {
        headers: { 'X-Cache': 'HIT' },
      });
    }

    // 4. Query
    const { rows, total } = await listCustomers({ limit, offset, search, status });

    // 5. Shape response
    const response = {
      data: rows,
      meta: {
        total,
        page,
        limit,
        total_pages: Math.ceil(total / limit),
      },
    };

    // 6. Cache result (60 detik)
    await redis.setex(cacheKey, 60, JSON.stringify(response));

    return NextResponse.json(response);
  } catch (err) {
    console.error('[GET /api/customers]', err);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

// ── POST /api/customers ─────────────────────────────────────
export async function POST(req: NextRequest) {
  try {
    // 1. Auth
    const session = await auth();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // 2. Parse & validate body
    const body = await req.json();
    const parsed = customerInsertSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Validation failed', details: parsed.error.flatten() },
        { status: 422 }
      );
    }

    // 3. Business logic
    const customer = await insertCustomer(parsed.data);

    // 4. Invalidate cache
    await redis.del('customers:list:*');

    // 5. Return
    return NextResponse.json({ data: customer }, { status: 201 });
  } catch (err: any) {
    if (err?.code === '23505') {
      // PostgreSQL unique violation
      return NextResponse.json({ error: 'Email already exists' }, { status: 409 });
    }
    console.error('[POST /api/customers]', err);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
```

```typescript
// app/api/customers/[id]/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { getCustomerById, updateCustomer, softDeleteCustomer } from '@/lib/db/customers';
import { customerUpdateSchema } from '@/lib/validations/customer';

type Params = { params: Promise<{ id: string }> };

export async function GET(_req: NextRequest, { params }: Params) {
  try {
    const session = await auth();
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { id } = await params;
    const customer = await getCustomerById(BigInt(id));
    if (!customer) return NextResponse.json({ error: 'Not found' }, { status: 404 });

    return NextResponse.json({ data: customer });
  } catch (err) {
    console.error('[GET /api/customers/[id]]', err);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest, { params }: Params) {
  try {
    const session = await auth();
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { id } = await params;
    const body = await req.json();
    const parsed = customerUpdateSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Validation failed', details: parsed.error.flatten() },
        { status: 422 }
      );
    }

    const updated = await updateCustomer(BigInt(id), parsed.data);
    if (!updated) return NextResponse.json({ error: 'Not found' }, { status: 404 });

    return NextResponse.json({ data: updated });
  } catch (err) {
    console.error('[PATCH /api/customers/[id]]', err);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function DELETE(_req: NextRequest, { params }: Params) {
  try {
    const session = await auth();
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { id } = await params;
    const deleted = await softDeleteCustomer(BigInt(id));
    if (!deleted) return NextResponse.json({ error: 'Not found' }, { status: 404 });

    return NextResponse.json({ message: 'Deleted' });
  } catch (err) {
    console.error('[DELETE /api/customers/[id]]', err);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
```

### 5.2 Response Shape Standar

```typescript
// Sukses — list
{ data: T[], meta: { total, page, limit, total_pages } }

// Sukses — single
{ data: T }

// Sukses — aksi (create/delete/update sederhana)
{ message: string, data?: T }

// Error
{ error: string, details?: ZodFlattenedError }
```

### 5.3 HTTP Status Codes

| Kode | Kapan |
|---|---|
| `200` | GET berhasil |
| `201` | POST berhasil (resource created) |
| `204` | DELETE berhasil (no body) |
| `400` | Bad request (format salah, params invalid) |
| `401` | Tidak ada session / token expired |
| `403` | Ada session tapi tidak punya akses |
| `404` | Resource tidak ditemukan |
| `409` | Conflict (duplicate email, dll.) |
| `422` | Validation error (Zod) |
| `429` | Rate limit exceeded |
| `500` | Internal server error |

### 5.4 Rate Limiting via Upstash

```typescript
// lib/cache/rate-limit.ts
import { redis } from './index';

export async function rateLimit(
  identifier: string,
  limit: number = 60,
  windowSeconds: number = 60
): Promise<{ success: boolean; remaining: number }> {
  const key = `rl:${identifier}`;
  const current = await redis.incr(key);

  if (current === 1) {
    await redis.expire(key, windowSeconds);
  }

  const remaining = Math.max(0, limit - current);
  return { success: current <= limit, remaining };
}

// Penggunaan di route handler:
// const { success } = await rateLimit(`checkout:${ip}`, 10, 60);
// if (!success) return NextResponse.json({ error: 'Too many requests' }, { status: 429 });
```

---

## 6. Frontend Architecture

### 6.1 Server vs Client Components

```typescript
// ✅ Server Component (default) — tidak ada 'use client'
// app/(dashboard)/customers/page.tsx
import { getCustomerById } from '@/lib/db/customers'; // boleh!
import { CustomerTable } from './_components/customer-table';

export default async function CustomersPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string; search?: string }>;
}) {
  const { page = '1', search } = await searchParams;
  const { rows, total } = await listCustomers({
    limit: 25,
    offset: (Number(page) - 1) * 25,
    search,
  });

  return (
    <div>
      <CustomerTable data={rows} total={total} />
    </div>
  );
}
```

```typescript
// ✅ Client Component — hanya untuk interaktivitas
// app/(dashboard)/customers/_components/customer-form.tsx
'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
// Tidak ada query DB di sini. Mutasi via fetch('/api/customers').
```

### 6.2 shadcn/ui — Aturan Penggunaan

```bash
# Selalu tambah komponen via CLI, jangan copy-paste manual
npx shadcn@latest add button
npx shadcn@latest add input
npx shadcn@latest add table
npx shadcn@latest add dialog
npx shadcn@latest add form
npx shadcn@latest add select
# dst.
```

```typescript
// components/shared/data-table.tsx — Generic reusable table
'use client';

import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';

// Gunakan generic typing agar tabel dapat digunakan untuk model apapun
interface DataTableProps<T> {
  data: T[];
  columns: ColumnDef<T>[];
  total: number;
  page: number;
  limit: number;
  onPageChange: (page: number) => void;
  onSearch?: (search: string) => void;
  isLoading?: boolean;
}

export function DataTable<T>({ data, columns, total, page, limit, onPageChange, onSearch, isLoading }: DataTableProps<T>) {
  // implementasi...
}
```

### 6.3 Form Handling

```typescript
// Gunakan shadcn/ui Form + Zod + react-hook-form
'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  Form, FormControl, FormField, FormItem, FormLabel, FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

const schema = z.object({
  name:  z.string().min(2, 'Minimal 2 karakter'),
  email: z.string().email('Email tidak valid'),
});

type FormValues = z.infer<typeof schema>;

export function CustomerForm({ onSuccess }: { onSuccess: () => void }) {
  const form = useForm<FormValues>({ resolver: zodResolver(schema) });
  const [loading, setLoading] = useState(false);

  const onSubmit = async (values: FormValues) => {
    setLoading(true);
    try {
      const res = await fetch('/api/customers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(values),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error ?? 'Gagal menyimpan');
      }

      toast.success('Customer berhasil ditambahkan');
      form.reset();
      onSuccess();
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField control={form.control} name="name" render={({ field }) => (
          <FormItem>
            <FormLabel>Nama</FormLabel>
            <FormControl><Input {...field} /></FormControl>
            <FormMessage />
          </FormItem>
        )} />
        <Button type="submit" disabled={loading}>
          {loading ? 'Menyimpan...' : 'Simpan'}
        </Button>
      </form>
    </Form>
  );
}
```

### 6.4 Recharts — Chart Wrapper

```typescript
// components/shared/bar-chart.tsx
'use client';

import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, Legend,
} from 'recharts';

interface BarChartProps {
  data: Array<Record<string, string | number>>;
  xKey: string;
  bars: Array<{ dataKey: string; label: string; color: string }>;
  height?: number;
}

export function AppBarChart({ data, xKey, bars, height = 300 }: BarChartProps) {
  return (
    <ResponsiveContainer width="100%" height={height}>
      <BarChart data={data} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
        <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
        <XAxis dataKey={xKey} tick={{ fontSize: 12 }} />
        <YAxis tick={{ fontSize: 12 }} />
        <Tooltip />
        <Legend />
        {bars.map(b => (
          <Bar key={b.dataKey} dataKey={b.dataKey} name={b.label} fill={b.color} radius={[4, 4, 0, 0]} />
        ))}
      </BarChart>
    </ResponsiveContainer>
  );
}
```

### 6.5 Tiptap Rich Text Editor

```typescript
// components/shared/rich-text-editor.tsx
'use client';

import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Link from '@tiptap/extension-link';
import Image from '@tiptap/extension-image';
import Placeholder from '@tiptap/extension-placeholder';

interface RichTextEditorProps {
  content?: string;
  onChange?: (html: string) => void;
  placeholder?: string;
  editable?: boolean;
}

export function RichTextEditor({
  content = '',
  onChange,
  placeholder = 'Tulis sesuatu...',
  editable = true,
}: RichTextEditorProps) {
  const editor = useEditor({
    extensions: [
      StarterKit,
      Link.configure({ openOnClick: false }),
      Image,
      Placeholder.configure({ placeholder }),
    ],
    content,
    editable,
    onUpdate({ editor }) {
      onChange?.(editor.getHTML());
    },
  });

  return (
    <div className="border border-input rounded-md">
      {/* Toolbar di sini */}
      <EditorContent editor={editor} className="prose prose-sm max-w-none p-3 min-h-[120px] focus:outline-none" />
    </div>
  );
}
```

### 6.6 dnd-kit Sortable

```typescript
// components/shared/sortable-list.tsx
'use client';

import { useState } from 'react';
import {
  DndContext, closestCenter, KeyboardSensor, PointerSensor,
  useSensor, useSensors, DragEndEvent,
} from '@dnd-kit/core';
import {
  SortableContext, sortableKeyboardCoordinates,
  verticalListSortingStrategy, useSortable, arrayMove,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

interface SortableListProps<T extends { id: string | number }> {
  items: T[];
  onReorder: (items: T[]) => void;
  renderItem: (item: T, isDragging: boolean) => React.ReactNode;
}

export function SortableList<T extends { id: string | number }>({
  items: initialItems, onReorder, renderItem,
}: SortableListProps<T>) {
  const [items, setItems] = useState(initialItems);
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (active.id !== over?.id) {
      const oldIndex = items.findIndex(i => String(i.id) === String(active.id));
      const newIndex = items.findIndex(i => String(i.id) === String(over?.id));
      const newOrder = arrayMove(items, oldIndex, newIndex);
      setItems(newOrder);
      onReorder(newOrder);
    }
  };

  return (
    <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
      <SortableContext items={items.map(i => String(i.id))} strategy={verticalListSortingStrategy}>
        {items.map(item => (
          <SortableItem key={item.id} id={String(item.id)}>
            {(isDragging) => renderItem(item, isDragging)}
          </SortableItem>
        ))}
      </SortableContext>
    </DndContext>
  );
}
```

---

## 7. Authentication

### 7.1 NextAuth v5 Setup

```typescript
// lib/auth/index.ts
import NextAuth from 'next-auth';
import Credentials from 'next-auth/providers/credentials';
import { getCustomerByEmail } from '@/lib/db/customers';
import bcrypt from 'bcryptjs';
import { z } from 'zod';

export const { handlers, auth, signIn, signOut } = NextAuth({
  providers: [
    Credentials({
      async authorize(credentials) {
        const parsed = z.object({
          email:    z.string().email(),
          password: z.string().min(6),
        }).safeParse(credentials);

        if (!parsed.success) return null;

        const user = await getCustomerByEmail(parsed.data.email);
        if (!user || !user.password_hash) return null;

        const valid = await bcrypt.compare(parsed.data.password, user.password_hash);
        if (!valid) return null;

        return { id: String(user.id), name: user.name, email: user.email };
      },
    }),
  ],
  callbacks: {
    jwt({ token, user }) {
      if (user) token.id = user.id;
      return token;
    },
    session({ session, token }) {
      session.user.id = token.id as string;
      return session;
    },
  },
  pages: {
    signIn: '/login',
    error:  '/login',
  },
});
```

### 7.2 Middleware Protection

```typescript
// middleware.ts
import { auth } from '@/lib/auth';
import { NextResponse } from 'next/server';

export default auth((req) => {
  const isLoggedIn = !!req.auth;
  const { pathname } = req.nextUrl;

  const publicPaths = ['/', '/login', '/register', '/api/webhooks'];
  const isPublic = publicPaths.some(p => pathname.startsWith(p));

  if (!isLoggedIn && !isPublic) {
    return NextResponse.redirect(new URL('/login', req.url));
  }

  return NextResponse.next();
});

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};
```

---

## 8. File & Image Storage

### 8.1 Vercel Blob Setup

```typescript
// lib/storage/index.ts
import { put, del, list, head } from '@vercel/blob';

export const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
export const ALLOWED_DOC_TYPES   = ['application/pdf', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'];
export const MAX_FILE_SIZE        = 10 * 1024 * 1024; // 10 MB

export async function uploadFile(
  file: File,
  folder: string,
  options?: { access?: 'public' | 'private' }
): Promise<{ url: string; pathname: string }> {
  if (file.size > MAX_FILE_SIZE) {
    throw new Error('File terlalu besar. Maksimal 10 MB.');
  }

  const ext      = file.name.split('.').pop();
  const filename = `${folder}/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;

  const blob = await put(filename, file, {
    access:      options?.access ?? 'public',
    addRandomSuffix: false,
  });

  return { url: blob.url, pathname: blob.pathname };
}

export async function deleteFile(url: string): Promise<void> {
  await del(url);
}
```

### 8.2 Upload Route Handler

```typescript
// app/api/uploads/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { uploadFile, ALLOWED_IMAGE_TYPES, ALLOWED_DOC_TYPES } from '@/lib/storage';

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const formData = await req.formData();
    const file = formData.get('file') as File | null;
    const folder = (formData.get('folder') as string) ?? 'general';

    if (!file) return NextResponse.json({ error: 'No file provided' }, { status: 400 });

    const allowed = [...ALLOWED_IMAGE_TYPES, ...ALLOWED_DOC_TYPES];
    if (!allowed.includes(file.type)) {
      return NextResponse.json({ error: 'Tipe file tidak diizinkan' }, { status: 415 });
    }

    const { url, pathname } = await uploadFile(file, folder);

    return NextResponse.json({ data: { url, pathname } }, { status: 201 });
  } catch (err: any) {
    console.error('[POST /api/uploads]', err);
    return NextResponse.json({ error: err.message ?? 'Upload gagal' }, { status: 500 });
  }
}
```

---

## 9. Caching — Upstash Redis

### 9.1 Client Setup

```typescript
// lib/cache/index.ts
import { Redis } from '@upstash/redis';

export const redis = new Redis({
  url:   process.env.UPSTASH_REDIS_REST_URL!,
  token: process.env.UPSTASH_REDIS_REST_TOKEN!,
});

// Helper: get or fetch (cache-aside pattern)
export async function getOrFetch<T>(
  key: string,
  fetcher: () => Promise<T>,
  ttlSeconds: number = 60
): Promise<T> {
  const cached = await redis.get<T>(key);
  if (cached !== null) return cached;

  const fresh = await fetcher();
  await redis.setex(key, ttlSeconds, JSON.stringify(fresh));
  return fresh;
}

// Helper: invalidate pattern (semua key yang match prefix)
export async function invalidatePrefix(prefix: string): Promise<void> {
  const keys = await redis.keys(`${prefix}*`);
  if (keys.length > 0) {
    await redis.del(...keys);
  }
}
```

### 9.2 Cache Key Conventions

```
{resource}:list:{filters_hash}         ← list dengan filter
{resource}:detail:{id}                 ← single resource
{resource}:stats:{period}              ← aggregasi/dashboard
session:{user_id}:{token_hash}         ← session cache
rl:{endpoint}:{identifier}             ← rate limiting
```

### 9.3 TTL Guidelines

| Data | TTL |
|---|---|
| Dashboard stats | 300 detik (5 menit) |
| List dengan filter | 60 detik |
| Detail resource | 120 detik |
| Static content (phases, questions) | 3600 detik (1 jam) |
| Payment status | Tidak di-cache |
| Session | Sesuai session duration |

---

## 10. Payment Integration

### 10.1 Xendit

```typescript
// lib/payment/xendit.ts
const XENDIT_SECRET_KEY = process.env.XENDIT_SECRET_KEY!;
const XENDIT_API_URL    = 'https://api.xendit.co';

const xenditHeaders = {
  'Content-Type': 'application/json',
  'Authorization': `Basic ${Buffer.from(XENDIT_SECRET_KEY + ':').toString('base64')}`,
};

// ── Virtual Account ─────────────────────────────────────────
export async function createVirtualAccount(params: {
  external_id:  string;
  bank_code:    string; // 'BCA' | 'BSI' | 'MANDIRI' | 'BNI' | 'BRI' dll.
  name:         string;
  expected_amount: number;
  expiration_date: string; // ISO 8601
}): Promise<{ id: string; account_number: string }> {
  const res = await fetch(`${XENDIT_API_URL}/callback_virtual_accounts`, {
    method: 'POST',
    headers: xenditHeaders,
    body: JSON.stringify(params),
  });

  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.message ?? 'Xendit VA creation failed');
  }

  return res.json();
}

// ── QRIS ────────────────────────────────────────────────────
export async function createQRCode(params: {
  external_id:     string;
  type:            'DYNAMIC';
  callback_url:    string;
  amount:          number;
  currency:        'IDR';
  expires_at:      string;
}): Promise<{ id: string; qr_string: string }> {
  const res = await fetch(`${XENDIT_API_URL}/qr_codes`, {
    method: 'POST',
    headers: xenditHeaders,
    body: JSON.stringify(params),
  });

  if (!res.ok) throw new Error('Xendit QR creation failed');
  return res.json();
}

// ── E-Wallet ─────────────────────────────────────────────────
export async function createEWalletCharge(params: {
  reference_id: string;
  currency:     'IDR';
  amount:       number;
  checkout_method: 'ONE_TIME_PAYMENT';
  channel_code:    string; // 'GOPAY' | 'SHOPEEPAY' | 'DANA' | 'OVO'
  channel_properties: { success_redirect_url: string; failure_redirect_url: string };
}): Promise<{ id: string; checkout_url: string }> {
  const res = await fetch(`${XENDIT_API_URL}/ewallets/charges`, {
    method: 'POST',
    headers: { ...xenditHeaders, 'api-version': '2022-07-31' },
    body: JSON.stringify(params),
  });

  if (!res.ok) throw new Error('Xendit e-wallet charge failed');
  return res.json();
}

// ── Webhook Verification ─────────────────────────────────────
export function verifyXenditWebhook(
  callbackToken: string,
  expectedToken: string = process.env.XENDIT_WEBHOOK_TOKEN!
): boolean {
  return callbackToken === expectedToken;
}
```

### 10.2 Midtrans

```typescript
// lib/payment/midtrans.ts
const MIDTRANS_SERVER_KEY = process.env.MIDTRANS_SERVER_KEY!;
const MIDTRANS_IS_PROD    = process.env.NODE_ENV === 'production';
const MIDTRANS_API_URL    = MIDTRANS_IS_PROD
  ? 'https://app.midtrans.com/snap/v1'
  : 'https://app.sandbox.midtrans.com/snap/v1';

export async function createSnapTransaction(params: {
  order_id:     string;
  gross_amount: number;
  customer: {
    first_name: string;
    email:      string;
    phone:      string;
  };
  item_details: Array<{ id: string; price: number; quantity: number; name: string }>;
}): Promise<{ token: string; redirect_url: string }> {
  const res = await fetch(`${MIDTRANS_API_URL}/transactions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Accept':       'application/json',
      'Authorization': `Basic ${Buffer.from(MIDTRANS_SERVER_KEY + ':').toString('base64')}`,
    },
    body: JSON.stringify({
      transaction_details: {
        order_id:     params.order_id,
        gross_amount: params.gross_amount,
      },
      customer_details: {
        first_name: params.customer.first_name,
        email:      params.customer.email,
        phone:      params.customer.phone,
      },
      item_details: params.item_details,
    }),
  });

  if (!res.ok) throw new Error('Midtrans Snap creation failed');
  return res.json();
}

// ── Notification Verification ────────────────────────────────
import crypto from 'crypto';
export function verifyMidtransSignature(
  orderId: string,
  statusCode: string,
  grossAmount: string,
  signatureKey: string
): boolean {
  const input    = orderId + statusCode + grossAmount + MIDTRANS_SERVER_KEY;
  const expected = crypto.createHash('sha512').update(input).digest('hex');
  return expected === signatureKey;
}
```

### 10.3 Webhook Handlers

```typescript
// app/api/webhooks/xendit/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { verifyXenditWebhook } from '@/lib/payment/xendit';
import { updateOrderStatus } from '@/lib/db/orders';
import { redis } from '@/lib/cache';

export async function POST(req: NextRequest) {
  try {
    const callbackToken = req.headers.get('x-callback-token') ?? '';
    if (!verifyXenditWebhook(callbackToken)) {
      return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });
    }

    const payload = await req.json();
    const { external_id, status, payment_method } = payload;

    if (status === 'PAID' || status === 'SETTLED') {
      await updateOrderStatus(external_id, 'PAID', payment_method);
      // Invalidate related cache
      await redis.del(`orders:${external_id}`);
      // Trigger downstream (email, test session activation, etc.)
    }

    return NextResponse.json({ received: true });
  } catch (err) {
    console.error('[Xendit Webhook]', err);
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}
```

---

## 11. Email — Resend

### 11.1 Client Setup

```typescript
// lib/email/index.ts
import { Resend } from 'resend';

export const resend = new Resend(process.env.RESEND_API_KEY!);

export const FROM_EMAIL = process.env.FROM_EMAIL ?? 'noreply@scaleupbisnis.com';

export async function sendEmail(params: {
  to:      string | string[];
  subject: string;
  react:   React.ReactElement;
}): Promise<void> {
  const { error } = await resend.emails.send({
    from:    FROM_EMAIL,
    to:      params.to,
    subject: params.subject,
    react:   params.react,
  });

  if (error) {
    console.error('[Resend]', error);
    throw new Error(`Email gagal terkirim: ${error.message}`);
  }
}
```

### 11.2 Email Template Pattern

```typescript
// lib/email/templates/payment-success.tsx
import { Html, Head, Body, Container, Text, Button, Hr } from '@react-email/components';

interface PaymentSuccessEmailProps {
  customerName: string;
  invoiceCode:  string;
  amount:       number;
  productName:  string;
  dashboardUrl: string;
}

export function PaymentSuccessEmail({
  customerName, invoiceCode, amount, productName, dashboardUrl,
}: PaymentSuccessEmailProps) {
  return (
    <Html>
      <Head />
      <Body style={{ fontFamily: 'sans-serif', backgroundColor: '#f8fafc' }}>
        <Container style={{ maxWidth: '560px', margin: '0 auto', padding: '24px' }}>
          <Text style={{ fontSize: '24px', fontWeight: 'bold', color: '#0d1f3c' }}>
            Pembayaran Berhasil! ✅
          </Text>
          <Text>Halo {customerName},</Text>
          <Text>
            Pembayaran sebesar <strong>Rp {amount.toLocaleString('id-ID')}</strong>
            {' '}untuk <strong>{productName}</strong> telah kami terima.
          </Text>
          <Text style={{ color: '#64748b' }}>Invoice: {invoiceCode}</Text>
          <Hr />
          <Button
            href={dashboardUrl}
            style={{ background: '#2563eb', color: '#fff', padding: '12px 24px', borderRadius: '8px' }}
          >
            Mulai Audit Sekarang →
          </Button>
        </Container>
      </Body>
    </Html>
  );
}
```

---

## 12. Dependencies Reference

### 12.1 package.json Dependencies

```json
{
  "dependencies": {
    "next":                         "15.x",
    "react":                        "^19",
    "react-dom":                    "^19",
    "typescript":                   "^5",

    "@neondatabase/serverless":     "latest",
    "@upstash/redis":               "latest",
    "@vercel/blob":                 "latest",

    "next-auth":                    "5.0.0-beta.x",
    "bcryptjs":                     "latest",

    "resend":                       "latest",
    "@react-email/components":      "latest",

    "xendit-node":                  "6.x",

    "zod":                          "latest",
    "react-hook-form":              "latest",
    "@hookform/resolvers":          "latest",

    "@react-pdf/renderer":          "latest",
    "xlsx":                         "latest",

    "@tiptap/react":                "latest",
    "@tiptap/starter-kit":          "latest",
    "@tiptap/extension-link":       "latest",
    "@tiptap/extension-image":      "latest",
    "@tiptap/extension-placeholder":"latest",

    "@dnd-kit/core":                "latest",
    "@dnd-kit/sortable":            "latest",
    "@dnd-kit/utilities":           "latest",

    "recharts":                     "latest",

    "sonner":                       "latest",
    "date-fns":                     "latest",
    "nanoid":                       "latest",
    "clsx":                         "latest",
    "tailwind-merge":               "latest",
    "class-variance-authority":     "latest",
    "lucide-react":                 "latest"
  },
  "devDependencies": {
    "drizzle-orm":                  "latest",
    "drizzle-kit":                  "latest",
    "@types/node":                  "latest",
    "@types/react":                 "latest",
    "@types/bcryptjs":              "latest",
    "tailwindcss":                  "^3",
    "postcss":                      "latest",
    "autoprefixer":                 "latest"
  }
}
```

### 12.2 Penggunaan Masing-Masing Library

| Library | Digunakan di | Tujuan |
|---|---|---|
| `@react-pdf/renderer` | `lib/pdf/templates/` + API route | Generate PDF server-side |
| `xlsx` | `lib/excel/` + API route | Import/export Excel |
| `@tiptap/*` | `components/shared/rich-text-editor.tsx` | WYSIWYG editor untuk konten panjang |
| `dnd-kit` | `components/shared/sortable-list.tsx` | Drag & drop urutan pertanyaan, menu |
| `recharts` | `components/shared/chart-*.tsx` | Dashboard analytics |
| `date-fns` | `lib/utils.ts` | Format tanggal Indonesia |
| `nanoid` | `lib/db/orders.ts` | Generate invoice code |
| `sonner` | Root layout | Toast notifications |

---

## 13. Migration & Seeding

### 13.1 Drizzle Digunakan Hanya untuk Schema & Migrate

Drizzle schema adalah **sumber kebenaran** untuk struktur database. Drizzle **hanya** digunakan untuk generate dan run migration. **Tidak ada** `db.select()`, `db.insert()`, atau method drizzle apapun di luar file migration dan seed.

```typescript
// drizzle/schema/customers.ts — HANYA untuk generate migration
import { pgTable, bigserial, varchar, timestamp, text } from 'drizzle-orm/pg-core';

export const customers = pgTable('customers', {
  id:            bigserial('id', { mode: 'bigint' }).primaryKey(),
  name:          varchar('name', { length: 150 }).notNull(),
  email:         varchar('email', { length: 150 }).notNull().unique(),
  phone:         varchar('phone', { length: 30 }),
  password_hash: varchar('password_hash', { length: 255 }),
  business_name: varchar('business_name', { length: 200 }),
  status:        varchar('status', { length: 20 }).notNull().default('ACTIVE'),
  created_at:    timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updated_at:    timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  deleted_at:    timestamp('deleted_at', { withTimezone: true }),
});
```

```typescript
// drizzle.config.ts
import { defineConfig } from 'drizzle-kit';

export default defineConfig({
  schema:    './drizzle/schema/*.ts',
  out:       './drizzle/migrations',
  dialect:   'postgresql',
  dbCredentials: {
    url: process.env.DATABASE_URL!,
  },
  verbose: true,
  strict:  true,
});
```

```bash
# Commands yang boleh digunakan
npx drizzle-kit generate   # Generate migration file
npx drizzle-kit migrate    # Run migration ke Neon
npx drizzle-kit studio     # GUI untuk inspect schema (development only)

# TIDAK boleh:
# npx drizzle-kit push   ← Tidak boleh langsung push ke production
```

### 13.2 Idempotent Seed Script

```typescript
// drizzle/seed.ts — Idempotent (aman dijalankan berkali-kali)
import { neon } from '@neondatabase/serverless';
import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const sql = neon(process.env.DATABASE_URL!);

async function seed() {
  console.log('🌱 Seeding...');

  // Gunakan ON CONFLICT DO NOTHING atau ON CONFLICT DO UPDATE
  // agar seed aman dijalankan berkali-kali

  await sql`
    INSERT INTO phases (phase_number, code, name_short, name_label, crisis_title, sort_order)
    VALUES
      (1, 'SURVIVAL',        'Survival',        'Cari Makan',  'Krisis Kepemimpinan', 1),
      (2, 'CASH_GROWTH',     'Cash Growth',     'Cari Duit',   'Krisis Otonomi',      2),
      (3, 'SYSTEMIZE',       'Systemize',       'Bangun Sistem','Krisis Kontrol',      3),
      (4, 'TALENT_BUILDING', 'Talent Building', 'Cari Talent', 'Krisis Birokrasi',    4),
      (5, 'EXPANSION',       'Expansion',       'Ekspansi',    'Krisis Identitas',    5)
    ON CONFLICT (phase_number) DO NOTHING
  `;

  await sql`
    INSERT INTO payment_methods (code, name, type, provider, is_active, sort_order)
    VALUES
      ('QRIS',    'QRIS Dynamic',           'QR_CODE',        'Xendit',  true, 1),
      ('BSI',     'BSI Virtual Account',    'VIRTUAL_ACCOUNT', 'Xendit', true, 2),
      ('BCA',     'BCA Virtual Account',    'VIRTUAL_ACCOUNT', 'Xendit', true, 3),
      ('MANDIRI', 'Mandiri Virtual Account','VIRTUAL_ACCOUNT', 'Xendit', true, 4),
      ('GOPAY',   'GoPay',                  'E_WALLET',       'Xendit',  true, 5),
      ('SHOPEEPAY','ShopeePay',             'E_WALLET',       'Xendit',  true, 6)
    ON CONFLICT (code) DO NOTHING
  `;

  console.log('✅ Seed complete');
}

seed().catch(console.error);
```

```json
// package.json scripts
{
  "scripts": {
    "db:generate": "drizzle-kit generate",
    "db:migrate":  "drizzle-kit migrate",
    "db:seed":     "tsx drizzle/seed.ts",
    "db:studio":   "drizzle-kit studio"
  }
}
```

---

## 14. Performance & Traffic Guidelines

### 14.1 Next.js Caching Strategy

```typescript
// Server Component — cache dengan revalidation
export default async function Page() {
  // Static data — cache 1 jam, revalidate di background
  const phases = await fetch('/api/phases', {
    next: { revalidate: 3600 }
  }).then(r => r.json());

  // Dynamic data — no cache
  const orders = await fetch('/api/orders', {
    cache: 'no-store'
  }).then(r => r.json());
}

// Route Handler — set cache headers
return NextResponse.json(data, {
  headers: {
    'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=300',
  },
});
```

### 14.2 Database Connection Pooling

```typescript
// lib/db/index.ts — Neon serverless handle pooling otomatis
// Untuk high-concurrency, gunakan pool options:
import { neon, neonConfig } from '@neondatabase/serverless';

// Aktifkan WebSocket pooling untuk Edge Runtime
neonConfig.webSocketConstructor = WebSocket;
neonConfig.poolQueryViaFetch    = true; // lebih efisien untuk serverless

export const sql = neon(process.env.DATABASE_URL!);
```

### 14.3 Image Optimization

```typescript
// Selalu gunakan next/image
import Image from 'next/image';

// ✅ Benar
<Image src={url} width={400} height={300} alt="desc" />

// ❌ Salah
<img src={url} alt="desc" />
```

### 14.4 Bundle Size

- Gunakan dynamic import untuk komponen besar (editor, PDF viewer, chart)
- Gunakan `React.lazy()` / `next/dynamic` untuk code splitting

```typescript
// Contoh dynamic import untuk Tiptap (berat)
const RichTextEditor = dynamic(
  () => import('@/components/shared/rich-text-editor').then(m => m.RichTextEditor),
  { ssr: false, loading: () => <Skeleton className="h-32" /> }
);
```

---

## 15. Security Standards

### 15.1 Environment Variables

```bash
# .env.local — TIDAK PERNAH di-commit ke git
DATABASE_URL=postgresql://...
UPSTASH_REDIS_REST_URL=https://...
UPSTASH_REDIS_REST_TOKEN=...
BLOB_READ_WRITE_TOKEN=vercel_blob_rw_...

# Auth
AUTH_SECRET=...        # min 32 karakter, random
AUTH_URL=https://...

# Xendit
XENDIT_SECRET_KEY=xnd_production_...
XENDIT_WEBHOOK_TOKEN=...

# Midtrans
MIDTRANS_SERVER_KEY=...
MIDTRANS_CLIENT_KEY=...

# Resend
RESEND_API_KEY=re_...
FROM_EMAIL=noreply@scaleupbisnis.com

# Public vars (aman di client)
NEXT_PUBLIC_APP_URL=https://scaleupbisnis.com
NEXT_PUBLIC_MIDTRANS_CLIENT_KEY=...
```

### 15.2 Input Sanitization

- Semua input dari user harus divalidasi dengan Zod sebelum diproses
- SQL injection tidak mungkin karena menggunakan template literal tagging (parameterized)
- XSS: Tiptap output harus di-sanitize sebelum disimpan jika dirender sebagai HTML

```typescript
// lib/utils.ts
import DOMPurify from 'isomorphic-dompurify';

export function sanitizeHtml(html: string): string {
  return DOMPurify.sanitize(html, {
    ALLOWED_TAGS: ['p','b','i','u','a','ul','ol','li','h2','h3','br','strong','em'],
    ALLOWED_ATTR: ['href','target','rel'],
  });
}
```

### 15.3 CORS & Headers

```typescript
// next.config.ts
const config: NextConfig = {
  async headers() {
    return [
      {
        source: '/api/:path*',
        headers: [
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'X-Frame-Options',        value: 'DENY' },
          { key: 'X-XSS-Protection',       value: '1; mode=block' },
        ],
      },
    ];
  },
};
```

---

## 16. Deployment — Vercel

### 16.1 vercel.json

```json
{
  "framework": "nextjs",
  "buildCommand": "next build",
  "devCommand":   "next dev",
  "installCommand": "npm install",
  "regions": ["sin1"],
  "env": {
    "NODE_ENV": "production"
  }
}
```

### 16.2 Environment Variables di Vercel Dashboard

Semua environment variables wajib diset di **Vercel Dashboard → Settings → Environment Variables** untuk masing-masing environment (Production, Preview, Development).

Jangan pernah hard-code secrets di kode atau commit `.env.local`.

### 16.3 Deployment Checklist

Sebelum merge ke `main` (yang auto-deploy ke production):

- [ ] Semua TypeScript errors bersih (`npx tsc --noEmit`)
- [ ] Build lokal sukses (`npm run build`)
- [ ] Migration sudah di-run di Neon production
- [ ] Environment variables sudah diset di Vercel
- [ ] Rate limiting sudah aktif untuk endpoint payment dan auth
- [ ] Webhook URLs sudah diupdate di Xendit/Midtrans dashboard
- [ ] Email templates sudah ditest dengan Resend test mode

---

## 17. Code Conventions

### 17.1 TypeScript

```typescript
// ✅ Gunakan type untuk object shapes
type OrderStatus = 'PENDING' | 'PAID' | 'EXPIRED' | 'FAILED';

// ✅ Gunakan interface untuk extensible contracts
interface PaginatedResponse<T> {
  data:  T[];
  meta: { total: number; page: number; limit: number; total_pages: number };
}

// ✅ Strict null checks — explicit null handling
function getUser(id: bigint): Promise<UserRow | null>  // bukan Promise<UserRow | undefined>

// ❌ Jangan gunakan 'any'
const data: any = await response.json(); // SALAH

// ✅ Gunakan unknown dan narrow
const data: unknown = await response.json();
if (isUserRow(data)) { /* ... */ }
```

### 17.2 Async/Await

```typescript
// ✅ Selalu gunakan async/await, bukan .then().catch() chain
const user = await getCustomerById(BigInt(id));

// ✅ Parallel requests dengan Promise.all
const [customer, orders] = await Promise.all([
  getCustomerById(id),
  listOrdersByCustomer(id),
]);

// ❌ Jangan sequential await yang bisa diparalel
const customer = await getCustomerById(id);    // tunggu
const orders   = await listOrdersByCustomer(id); // baru ini
```

### 17.3 Error Handling

```typescript
// Di route handlers — selalu try/catch dengan structured logging
try {
  // ...
} catch (err) {
  console.error('[PATCH /api/orders/[id]]', { id, err });
  return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
}
```

---

## 18. What Is Strictly Forbidden

Daftar ini bukan saran — ini **larangan keras**. Jika ditemukan dalam code review, wajib direvisi sebelum merge.

```
❌  SPA pattern (createRoot, BrowserRouter, client-side-only pages)
❌  Drizzle sebagai ORM/query builder (drizzle.select(), drizzle.insert(), dll.)
❌  Raw SQL query di file .tsx/.jsx/.ts yang merupakan komponen atau hook
❌  String concatenation untuk SQL: `'SELECT * WHERE id = ' + id`
❌  import { sql } dari lib/db/index.ts di luar lib/db/*.ts
❌  axios, moment.js, lodash, redux, zustand, react-query, prisma
❌  Hard-coded secrets atau API keys di kode
❌  <img> tag (gunakan next/image)
❌  console.log di production code tanpa kondisi NODE_ENV check
❌  Fetch ke API eksternal langsung dari komponen (fetch di Server Actions atau API routes)
❌  Direct database access dari middleware.ts (terlalu sering dipanggil)
❌  Mutation di Server Components (gunakan Server Actions atau API routes)
❌  Commit file .env.local ke git
❌  drizzle-kit push ke production (gunakan migrate)
```

---

*Dokumen ini adalah living document. Setiap keputusan arsitektur baru yang menjadi konvensi wajib ditambahkan di sini.*

*Update terakhir: Oktober 2026*