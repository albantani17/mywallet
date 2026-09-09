# mywallet

Personal finance tracker for Android — wallets, transactions, debts and budgets, stored entirely on device. No account, no server: the app opens with a guest profile and everything lives in a local SQLite database.

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

Five tables (`src/db/schema/`):

- **users** — capped at exactly one row by a `CHECK (id = 1)` constraint. Carries `authProvider` (`guest`/`google`), a nullable `email`, and the language preference, so upgrading a guest to a real account is a column update rather than a migration.
- **wallets** — cash / bank / e-wallet / investment, with an opening balance. Archived rather than deleted once used.
- **categories** — income or expense, two levels via a self-reference.
- **transactions** — income, expense or transfer. `amount` is always positive; direction comes from `type`. CHECK constraints reject a negative amount, a self-transfer, and a malformed transfer.
- **debts** — payable or receivable, repayments tracked through `transactions.debtId`.

Money is stored as **whole rupiah integers** — no fractional units. A wallet's balance is derived in SQL from its opening balance plus its transactions, never stored.

Every foreign key into `wallets` is `ON DELETE no action`, so a wallet that has been used cannot be row-deleted. `walletService.removeWallet` deletes an unused wallet outright and archives a used one.

## Conventions worth knowing

These are non-obvious and each one caused a silent bug:

- **Correlated subqueries in a `SELECT` list must use literal identifiers.** Drizzle strips table qualifiers from interpolated columns there, so `${transactions.walletId} = ${wallets.id}` becomes `"wallet_id" = "id"` — which resolves entirely inside `transactions` and stops correlating. See `balanceExpression` in `src/db/repositories/wallet.repository.ts`.
- **`useLiveQuery` needs a query builder, not a promise.** Repositories export `*Queries` builder objects alongside their async methods for this reason.
- **The React Compiler is enabled** (`app.json` → `experiments.reactCompiler`). A component with no props, no state and only a module-level read gets its output memoized permanently. Read the locale from `useActiveLocale()`, never `currentLocale()`.
- **`KeyboardAvoidingView` does nothing inside a `Modal` on Android** — a Modal is its own window, so `adjustResize` never reaches it. `src/components/ui/bottom-sheet.tsx` lifts itself from `Keyboard` events instead.
- **Uniwind flex containers default to `row`**, unlike React Native. Always set `flex-col` or `flex-row` explicitly.
- **Gate screens render in place**, they do not `<Redirect>`. Redirecting unmounts the component holding the live query, so nothing is left watching for the data that would let you back.
- **Metro resolves the `@/*` alias but not `@/assets/*`.** Reference files under `assets/` with a relative path; `tsc` will not catch this, only a bundle will.

## Status

Working: onboarding, the tab shell, the wallet dashboard carousel with spending insights, the wallets screen with search, category filter and create/edit/delete, recording and filtering transactions, and the debts module (schedules, instalments, payments and allocations).

Not built yet: budgets — the tab was given to debts instead, and there is no `budgets` table; a transaction detail screen; and Google sign-in (the button is present but disabled; the seam is `authService.signInWithGoogle`).
