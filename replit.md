# [Project name]

_Replace the heading above with the project's name, and this line with one sentence describing what this app does for users._

## Run & Operate

- `pnpm --filter @workspace/api-server run dev` — run the API server (port 5000)
- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run build` — typecheck + build all packages
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks and Zod schemas from the OpenAPI spec
- `pnpm --filter @workspace/db run push` — push DB schema changes (dev only)
- Required env: `DATABASE_URL` — Postgres connection string

## Stack

- pnpm workspaces, Node.js 24, TypeScript 5.9
- API: Express 5
- DB: PostgreSQL + Drizzle ORM
- Validation: Zod (`zod/v4`), `drizzle-zod`
- API codegen: Orval (from OpenAPI spec)
- Build: esbuild (CJS bundle)

## Where things live

_Populate as you build — short repo map plus pointers to the source-of-truth file for DB schema, API contracts, theme files, etc._

## Architecture decisions

- AI membantu pada aktivitas yang mendapat manfaat nyata (misalnya meninjau kelengkapan dokumen atau menyusun draf tindak lanjut), bukan ditambahkan ke setiap layar demi label "AI". Hasil AI berupa saran yang menyebutkan sumber dan dapat ditinjau manusia; AI tidak menetapkan kepatuhan, kelayakan, atau keputusan keselamatan secara otomatis.
- OpenClaw/MultiClaw dan Hermes Agent adalah pendekatan agentic yang dapat dievaluasi untuk tugas terbatas. Jangan memasang beberapa runtime atau memberi akses tulis lintas organisasi sebelum ada kasus penggunaan, batas izin, audit, dan persetujuan manusia yang jelas.
- Koneksi dengan gustafta.my.id hanya bila alur produk saling melengkapi. Tentukan terlebih dahulu pemilik data, izin pengguna, kontrak API, dan arah sinkronisasi; jangan menganggap situs publik sebagai izin atau API integrasi.

## Product

_Describe the high-level user-facing capabilities of this app once they exist._

## User preferences

_Populate as you build — explicit user instructions worth remembering across sessions._

## Gotchas

_Populate as you build — sharp edges, "always run X before Y" rules._

## Pointers

- See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details
