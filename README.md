# mywallet

Personal finance tracker for Android — wallets, transactions and debts, stored entirely on device. No account, no server: the app opens with a guest profile and everything lives in a local SQLite database.

Bilingual (Indonesian / English) with an in-app language switch.

## Download

[![Download APK](https://img.shields.io/github/v/release/albantani17/mywallet?label=Download%20APK&logo=android&logoColor=white&color=3DDC84&sort=semver)](https://github.com/albantani17/mywallet/releases/latest/download/app-release.apk)

The badge shows the latest version and links straight to the signed `app-release.apk`. All builds are on the [releases page](https://github.com/albantani17/mywallet/releases/latest); each `v*` tag builds and attaches its APK automatically (`.github/workflows/android-release-apk.yml`).

## Stack

| | |
|---|---|
| Runtime | Expo SDK 57, React Native 0.86, React 19.2 |
| Routing | expo-router (file-based, `src/app`) |
| Database | expo-sqlite + drizzle-orm, migrations via drizzle-kit |
| Validation | zod 4 + drizzle-zod |
| Styling | **Uniwind** (Tailwind v4 for React Native) |
| i18n | i18next + react-i18next, ID/EN |
| Animation | react-native-reanimated 4, lottie-react-native |

## Getting started

```bash
npm install
npx expo run:android     # builds and installs a dev build
```

**A development build is required — this does not run in Expo Go.** `lottie-react-native` and `expo-sqlite` are native modules that Expo Go does not bundle.

Use `npx expo start --clear` when starting the dev server after changing styles. Uniwind generates its CSS at build time, so new `className` values are missing until the Metro cache is cleared.

### Scripts

| Script | Purpose |
|---|---|
| `npm start` | Metro dev server |
| `npm run android` / `ios` / `web` | Start on a platform |
| `npm run db:generate` | Regenerate SQL migrations from the schema |
| `npm run lint` | `expo lint` |
| `npm test` | `node --test` over `src/**/__tests__/*.test.ts` |

Tests run under bare `node --test` — no Jest. Node strips the TypeScript itself, so only **pure** modules are testable (the schedule generator, payment allocator, debt-status rules, custom-installment builder, the quick-entry parser…); anything that imports `@/db` values cannot load under Node. A tested module may import *types* from `@/*`, but every runtime import it makes must be relative **and** carry the `.ts` extension.

Migrations are applied automatically at launch — `src/app/_layout.tsx` gates the app on drizzle's `useMigrations` and shows a spinner until they finish.

## Project structure

```
src/
  app/                    expo-router routes
    (tabs)/               home, wallets, transactions, debts, more
  components/
    ui/                   generic primitives (button, sheet, dropdown, …)
    features/<feature>/   UI for one feature
  hooks/
    features/<feature>/   hooks for one feature
    use-*.ts              shared hooks
  services/               business logic; orchestrates repositories
  db/
    schema/               drizzle tables + relations
    repositories/         all database access
    validators/           drizzle-zod schemas per table
  i18n/locales/           id.ts declares the type, en.ts mirrors it
  utils/
```

The layering matters: **only repositories touch `db`**. Services orchestrate repositories and hold the rules; hooks adapt services for React; components render. A screen never issues a query directly.

Code, filenames and identifiers are English. Only user-facing copy is translated, and it lives in `src/i18n/locales`.

## Data model

13 tables (`src/db/schema/`), SQLite via expo-sqlite + drizzle-orm. Migrations live in `drizzle/` and are applied at launch.

**Account & reference data**

- **users** — exactly one row, enforced by a `CHECK (id = 1)` constraint (a second insert fails rather than creating a shadow user). Holds `authProvider` (`guest`/`google`), nullable `email`/`avatarUrl`, and the `locale` + `theme` preferences — so upgrading a guest to a real account is a column update, not a migration.
- **wallet_categories** — the kinds of wallet (`cash` / `bank` / `ewallet` / `investment` ship built in; users add more). `wallets.type` stores a `slug` from here as **plain text, not a foreign key**, so existing rows need no backfill and the table stays purely additive. Built-in rows keep their label in i18n.
- **categories** — `income` / `expense` / `bill` classification for transactions, two levels via a self-referencing `parentId`. `slug` is the stable identity of a built-in row; the launch seeder inserts with `onConflictDoNothing`.
- **debt_presets** — a financial product to start a debt from (Shopee Paylater, a bank KTA, a loan from a friend). It only fills the form in; nothing branches on it. Shaped like `wallet_categories` (unique `slug`, `isBuiltIn`, `sortOrder`) so the same idempotent seeding applies.
- **counterparties** — the other side of a debt, a `person` or an `institution`. `kind` is what the debt form branches on (an institution gets presets, interest and a hard due date; a person gets none of that).

**Money**

- **wallets** — cash / bank / e-wallet / investment, with an opening balance (`initialBalance`) in whole rupiah. Archived rather than deleted once used. The current balance is **derived in SQL** from the opening balance plus the wallet's transactions, never stored.
- **transactions** — every movement of money: `income`, `expense`, `transfer` or `bill`. `amount` is always positive and in whole rupiah; direction comes from `type`, never the sign. A `transfer` moves `amount` from `walletId` to `toWalletId` and additionally costs `fee` on the source; a `bill` is an `expense` that also carries a `dueDate`. CHECK constraints enforce a positive amount, a non-negative fee, no self-transfer, and the transfer shape (a transfer names a destination and no category; anything else names no destination). `debtId` tags a cash flow to a debt.

**Debts** — payable or receivable. Nothing here is ever decremented; every outstanding figure is summed live from the rows below, so a restructure or a penalty can't be lost to a stale total.

- **debts** — the header: what the debt is and what it started as (`principal`, `interestRateBps` in basis points, `interestMethod`, `originDate`, `status`).
- **debt_schedules** — one row per debt: the *rule* that produced its installments (`open` / `single` / `recurring` / `custom`, interval, period count, due day, grace/reminder days, rounding). Read once by the generator and never recomputed. `dueDay` stores the day the user meant (e.g. 31), not the clamped result.
- **installments** — the concrete obligations the generator materialises from the schedule. Interest is **frozen** into `interestAmount` at generation time. `totalAmount` is the single column every derived expression reads; `isModified` protects a user-edited row from the generator. No `paid_amount` column — it's summed from allocations.
- **payments** — a repayment that actually happened (`amount`, wallet, `method`, `paidAt`). `transactionId` links the cash-flow row it produced (null when the money moved outside the app), which is what stops a repayment being counted twice.
- **payment_allocations** — the bridge: which installments a payment covers and how much to each. Summing these is the **only** definition of how much an installment has been paid. Overpayment gets no row — it stays visible as `payment.amount − SUM(allocations)`.

**Learned input**

- **quick_entry_aliases** — words the user has taught the natural-language entry parser (`phrase` → a wallet or category), written only after the user confirms a correction. `phrase` is unique across both kinds; `targetId` is deliberately not a foreign key, so a row whose target was deleted simply resolves to nothing and is skipped.

Money is **whole rupiah integers** everywhere — no fractional units, and no float goes near the maths. Interest rates are basis points (1%/month = `100`).

Every foreign key into `wallets` is `ON DELETE no action`, so a used wallet cannot be row-deleted — `walletService.removeWallet` deletes an unused wallet outright and archives a used one. The debt sub-tables (`debt_schedules`, `installments`, `payments`, `payment_allocations`) cascade from `debts`.

## Conventions worth knowing

These are non-obvious and each one caused a silent bug:

- **Never call drizzle's `useLiveQuery` directly — use `useLiveData(query, tables, deps)`** (`src/hooks/use-live-data.ts`) and list *every* table the query reads (FROM + joins + subqueries). `useLiveQuery` subscribes to the FROM table only, so a wallet balance summed from `transactions`, or a debt's outstanding summed from `payment_allocations`, stayed stale until a manual refresh. It's backed by one app-wide change listener with 50 ms coalescing (`src/db/change-bus.ts`).
- **Live queries take a query *builder*, not a promise.** Repositories export `*Queries` builder objects alongside their `async` methods for exactly this — pass the builder to `useLiveData`.
- **Correlated subqueries in a `SELECT` list must use literal identifiers.** Drizzle strips table qualifiers from interpolated columns there, so `${transactions.walletId} = ${wallets.id}` becomes `"wallet_id" = "id"` — which resolves entirely inside `transactions` and stops correlating. See `balanceExpression` in `src/db/repositories/wallet.repository.ts`.
- **drizzle-zod validators use `.extend()`, not the `refine` callback.** `createInsertSchema(table, refineCallback)` mis-infers `text` columns as `Buffer` under drizzle-zod + zod 4, so `.trim()` / `.min()` / `.regex()` fail to type-check. Follow `src/db/validators/user.validator.ts`; import `z` from `zod/v4`.
- **The React Compiler is enabled** (`app.json` → `experiments.reactCompiler`). A component with no props, no state and only a module-level read gets its output memoized permanently. Read the locale from `useActiveLocale()`, never `currentLocale()`.
- **Don't import a native module from anything reachable via `src/app/_layout.tsx`.** Packages that call `TurboModuleRegistry.getEnforcing` at module scope throw at *import* time when the dev build lags the JS — and the throw kills the whole app, not just the feature. `src/services/google-auth-service.ts` is the pattern: a guarded lazy `require()` and an explicit "unavailable" state the UI can render.
- **`KeyboardAvoidingView` does nothing inside a `Modal` on Android** — a Modal is its own window, so `adjustResize` never reaches it. `src/components/ui/bottom-sheet.tsx` lifts itself from `Keyboard` events instead.
- **Uniwind flex containers default to `row`**, unlike React Native. Always set `flex-col` or `flex-row` explicitly.
- **Gate screens render in place**, they do not `<Redirect>`. Redirecting unmounts the component holding the live query, so nothing is left watching for the data that would let you back. `src/app/(tabs)/_layout.tsx` (no wallets → create-wallet) is the worked example.
- **Metro resolves the `@/*` alias but not `@/assets/*`.** Reference files under `assets/` with a relative path; `tsc` will not catch this, only a bundle will.

## Status

**Working**

- **Onboarding** — welcome animation, guest profile via a name dialog. (The Google sign-in button is present but disabled.)
- **Tab shell** — Home / Wallets / Transactions / Debts / More, with light/dark theming and an in-app ID↔EN switch, both persisted to `users`.
- **First-run seeding** of the built-in wallet categories, transaction categories and debt presets — idempotent, re-run on every launch and after a restore.
- **Home** — wallet carousel with derived balances; spending insights (month summary, income/expense bar, cash-flow chart, category breakdown); a one-tap "Catat lagi" strip that repeats a frequent transaction, now behind a confirmation sheet.
- **Recording a transaction** three ways — the full form (`/transaction/new`), a natural-language quick entry that parses amount / date / wallet / category from a sentence and learns corrections as aliases (`/transaction/quick`), and the repeat strip. A category is optional.
- **Transactions** — list grouped by day with infinite scroll, search, and filter by wallet and time range.
- **Wallets** — list with search and category filter; create / edit / archive-or-delete; wallet categories are user-extensible.
- **Debts** — payable and receivable, institution or person, optional presets; schedule types open / single / recurring / custom with a generator; installments; payments with multi-installment allocation; auto-settle when fully paid; the pay form shows what's due.
- **Backup** — back up and restore the whole SQLite database through the user's Google Drive.
- Pull-to-refresh on the dashboard, wallets and transactions.

**Not built yet**

- **Budgets** — the tab was given to Debts instead; there is no `budgets` table.
- A **transaction detail** screen.
- **Google sign-in** — the button is disabled; the seam is `authService.signInWithGoogle`, and `google-auth-service.ts` already degrades gracefully when the native module is absent from the build.
- **Reminders / notifications** — `debt_schedules` stores `reminderDays`, but nothing schedules a notification from it yet.
