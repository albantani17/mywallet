# Prompt: Fitur Buku Hutang/Piutang

> Salin seluruh isi dokumen ini ke AI coding agent (Claude Code, Cursor, dll).
> Sesuaikan bagian **Konteks Aplikasi** dengan stack dan nama tabel yang kamu pakai.

---

## Konteks Aplikasi

Aku punya aplikasi keuangan pribadi yang sudah berjalan. Yang **sudah ada**:

- Tabel `accounts` — sumber dana (cash, rekening bank, e-wallet). Punya `id`, `name`, `type`, `balance`.
- Tabel `transactions` — pencatatan pemasukan/pengeluaran, terhubung ke `accounts`.
- Sistem autentikasi dengan `users`.

> **Isi sendiri:** stack (framework, bahasa, ORM), jenis database, nama kolom PK dan FK
> yang sebenarnya kamu pakai, dan apakah aplikasi multi-user atau single-user.

Yang mau kubangun sekarang adalah **modul hutang/piutang** yang menempel di atas struktur itu.
Jangan mengubah skema `accounts`. Modul ini hanya boleh menambah tabel baru dan merujuk
`accounts.id` sebagai foreign key.

---

## Tujuan Fitur

Mencatat semua hutang (aku yang berhutang) dan piutang (orang berhutang padaku) dalam satu
modul, dengan jadwal jatuh tempo yang bisa menangani:

1. **Paylater** — jatuh tempo sudah ditentukan di awal, dihitung dari tanggal transaksi.
2. **Pinjaman berbunga** — cicilan bulanan, dihitung dari tanggal dana cair.
3. **Utang personal** — ke teman/keluarga, tanpa tanggal pasti, tanpa bunga.
4. **Kasus tidak biasa** — restrukturisasi, jadwal tidak rata, tanggal yang diatur manual.

---

## Prinsip Desain yang Wajib Diikuti

Ini bagian terpenting. Tolong jangan menyimpang dari empat prinsip ini.

### 1. Kategori pinjaman bukan penegak aturan, hanya preset

Jangan bikin logika `if (jenis === 'paylater') { ... } else if (jenis === 'pinjaman') { ... }`.
Itu akan pecah begitu ada produk finansial baru.

Sebagai gantinya, semua jadwal direduksi jadi **empat tipe generik**:

| `schedule_type` | Arti | Contoh |
|---|---|---|
| `open` | Tanpa jatuh tempo | Utang ke teman, bayar kapan bisa |
| `single` | Satu tanggal saja | Paylater 30 hari, "bayar akhir bulan" |
| `recurring` | Anchor + interval + jumlah periode | Cicilan 12x, paylater 3x/6x |
| `custom` | Daftar tanggal & nominal manual | Restrukturisasi, jadwal tidak rata |

Nama produk (Shopee Paylater, KTA Bank X) disimpan sebagai **preset** yang hanya mengisi
nilai default saat form dibuka. Semua field tetap bisa di-override user.

### 2. Jadwal dimaterialisasi jadi baris konkret

Setelah user submit, generator **langsung membuat baris-baris `installments` di database**.
Jangan menghitung jatuh tempo on-the-fly dari rumus setiap kali layar dibuka.

Alasannya: cicilan bisa direstrukturisasi, kena denda, atau dibayar sebagian. Kalau selalu
regenerate dari formula, semua penyesuaian itu hilang. Rumus dipakai **sekali** untuk
menghasilkan baris; setelah itu baris berdiri sendiri.

### 3. Pembayaran terpisah dari cicilan (many-to-many)

Jangan pakai `installment.is_paid = true`. Pakai tiga entitas:

- `installments` — kewajiban ("harus bayar 500rb tanggal 10 Agustus")
- `payments` — kejadian nyata ("transfer 1jt dari BCA tanggal 9 Agustus")
- `payment_allocations` — jembatan ("500rb ke cicilan Juli, 500rb ke cicilan Agustus")

Satu payment bisa menutup beberapa cicilan, dan satu cicilan bisa ditutup beberapa payment.
Status lunas adalah **hasil hitungan**, bukan flag.

### 4. Nominal cicilan dibekukan, bukan dihitung ulang

Bunga tetap dihitung — tapi **sekali saja**, saat generate. Hasilnya disimpan per baris,
dipecah jadi `principal_amount`, `interest_amount`, `fee_amount`, `total_amount`.

Alasannya: (a) user punya jadwal resmi dari lender, kalau hitunganmu meleset seribu rupiah
user akan percaya lender-nya; (b) cicilan terakhir hampir selalu beda karena pembulatan;
(c) bunga floating bisa berubah di tengah jalan, dan cicilan yang sudah lewat harus tetap
tercatat sesuai yang dulu dibayar.

---

## Skema Database

Dialek: PostgreSQL. Catatan penyesuaian ada di bawah tabel.

```sql
-- =========================================================
-- 1. COUNTERPARTIES — pihak lawan (lembaga atau orang)
-- =========================================================
CREATE TABLE counterparties (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id         UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    name            VARCHAR(150) NOT NULL,
    kind            VARCHAR(20)  NOT NULL,   -- 'person' | 'institution'
    preset_key      VARCHAR(60),             -- 'shopee_paylater', 'kredivo', NULL utk personal
    contact         VARCHAR(150),            -- no. HP / email, opsional
    note            TEXT,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT now(),

    CONSTRAINT chk_cp_kind CHECK (kind IN ('person','institution'))
);

CREATE INDEX idx_cp_user ON counterparties(user_id);


-- =========================================================
-- 2. DEBTS — header hutang/piutang
-- =========================================================
CREATE TABLE debts (
    id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id          UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    counterparty_id  UUID NOT NULL REFERENCES counterparties(id) ON DELETE RESTRICT,
    account_id       UUID REFERENCES accounts(id) ON DELETE SET NULL,
        -- rekening tujuan pencairan (payable) atau asal dana (receivable). Boleh NULL.

    direction        VARCHAR(12) NOT NULL,   -- 'payable' (aku ngutang) | 'receivable' (aku dihutangi)
    title            VARCHAR(150) NOT NULL,  -- "Cicilan laptop", "Pinjaman ke Budi"

    principal        NUMERIC(18,2) NOT NULL, -- pokok pinjaman
    interest_rate    NUMERIC(7,4)  NOT NULL DEFAULT 0,  -- % per periode, 0 utk personal
    interest_method  VARCHAR(20)   NOT NULL DEFAULT 'none',
        -- 'none' | 'flat' | 'effective' | 'manual'
    origin_date      DATE NOT NULL,          -- tgl transaksi / tgl dana cair

    currency         CHAR(3) NOT NULL DEFAULT 'IDR',
    status           VARCHAR(20) NOT NULL DEFAULT 'active',
        -- 'active' | 'settled' | 'written_off' | 'cancelled'
    closed_at        TIMESTAMPTZ,
    note             TEXT,
    created_at       TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at       TIMESTAMPTZ NOT NULL DEFAULT now(),

    CONSTRAINT chk_debt_direction CHECK (direction IN ('payable','receivable')),
    CONSTRAINT chk_debt_status    CHECK (status IN ('active','settled','written_off','cancelled')),
    CONSTRAINT chk_debt_principal CHECK (principal > 0)
);

CREATE INDEX idx_debt_user_status ON debts(user_id, status);
CREATE INDEX idx_debt_counterparty ON debts(counterparty_id);


-- =========================================================
-- 3. DEBT_SCHEDULES — aturan pembentuk jadwal (1:1 dengan debts)
-- =========================================================
CREATE TABLE debt_schedules (
    id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    debt_id          UUID NOT NULL UNIQUE REFERENCES debts(id) ON DELETE CASCADE,

    schedule_type    VARCHAR(12) NOT NULL,   -- 'open' | 'single' | 'recurring' | 'custom'
    anchor_date      DATE,                   -- titik mulai hitung; NULL utk 'open'
    due_day          SMALLINT,               -- NIAT ASLI, mis. 31. Bukan hasil clamp.
    interval_unit    VARCHAR(10),            -- 'day' | 'week' | 'month'
    interval_count   SMALLINT,               -- mis. 1 = tiap 1 bulan
    period_count     SMALLINT,               -- jumlah cicilan; NULL utk 'open'
    grace_days       SMALLINT NOT NULL DEFAULT 0,  -- toleransi telat sebelum ditandai overdue
    reminder_days    SMALLINT NOT NULL DEFAULT 3,  -- H- berapa mulai diingatkan

    created_at       TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at       TIMESTAMPTZ NOT NULL DEFAULT now(),

    CONSTRAINT chk_sched_type CHECK (schedule_type IN ('open','single','recurring','custom')),
    CONSTRAINT chk_sched_due_day CHECK (due_day IS NULL OR due_day BETWEEN 1 AND 31),
    CONSTRAINT chk_sched_interval CHECK (interval_unit IS NULL OR interval_unit IN ('day','week','month')),
    -- 'recurring' wajib punya anchor, interval, dan jumlah periode
    CONSTRAINT chk_sched_recurring CHECK (
        schedule_type <> 'recurring' OR
        (anchor_date IS NOT NULL AND interval_unit IS NOT NULL
         AND interval_count >= 1 AND period_count >= 1)
    ),
    -- 'single' wajib punya satu tanggal acuan
    CONSTRAINT chk_sched_single CHECK (
        schedule_type <> 'single' OR anchor_date IS NOT NULL
    )
);


-- =========================================================
-- 4. INSTALLMENTS — baris cicilan konkret (hasil generate)
-- =========================================================
CREATE TABLE installments (
    id                 UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    debt_id            UUID NOT NULL REFERENCES debts(id) ON DELETE CASCADE,

    sequence           SMALLINT NOT NULL,    -- 1, 2, 3, ...
    due_date           DATE,                 -- NULL utk schedule_type 'open'
    original_due_date  DATE,                 -- hasil generate awal, tidak pernah diubah

    principal_amount   NUMERIC(18,2) NOT NULL DEFAULT 0,
    interest_amount    NUMERIC(18,2) NOT NULL DEFAULT 0,
    fee_amount         NUMERIC(18,2) NOT NULL DEFAULT 0,
    penalty_amount     NUMERIC(18,2) NOT NULL DEFAULT 0,
    total_amount       NUMERIC(18,2) NOT NULL,   -- yang jadi patokan tagihan

    paid_amount        NUMERIC(18,2) NOT NULL DEFAULT 0,  -- CACHE dari payment_allocations
    is_modified        BOOLEAN NOT NULL DEFAULT false,    -- true = generator dilarang menimpa
    note               TEXT,

    created_at         TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at         TIMESTAMPTZ NOT NULL DEFAULT now(),

    CONSTRAINT uq_inst_seq UNIQUE (debt_id, sequence),
    CONSTRAINT chk_inst_total CHECK (total_amount >= 0),
    CONSTRAINT chk_inst_paid  CHECK (paid_amount >= 0)
);

CREATE INDEX idx_inst_debt ON installments(debt_id, sequence);
CREATE INDEX idx_inst_due  ON installments(due_date)
    WHERE due_date IS NOT NULL;


-- =========================================================
-- 5. PAYMENTS — transaksi pembayaran nyata
-- =========================================================
CREATE TABLE payments (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    debt_id         UUID NOT NULL REFERENCES debts(id) ON DELETE CASCADE,
    account_id      UUID REFERENCES accounts(id) ON DELETE SET NULL,
    transaction_id  UUID REFERENCES transactions(id) ON DELETE SET NULL,
        -- link ke tabel transaksi yang sudah ada, supaya arus kas tidak dobel catat

    paid_at         TIMESTAMPTZ NOT NULL,
    amount          NUMERIC(18,2) NOT NULL,
    method          VARCHAR(30),            -- 'transfer' | 'cash' | 'autodebit' | dll
    reference       VARCHAR(100),           -- no. referensi transfer
    note            TEXT,

    created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),

    CONSTRAINT chk_pay_amount CHECK (amount > 0)
);

CREATE INDEX idx_pay_debt ON payments(debt_id, paid_at DESC);


-- =========================================================
-- 6. PAYMENT_ALLOCATIONS — jembatan payment <-> installment
-- =========================================================
CREATE TABLE payment_allocations (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    payment_id      UUID NOT NULL REFERENCES payments(id) ON DELETE CASCADE,
    installment_id  UUID NOT NULL REFERENCES installments(id) ON DELETE CASCADE,
    amount          NUMERIC(18,2) NOT NULL,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),

    CONSTRAINT uq_alloc UNIQUE (payment_id, installment_id),
    CONSTRAINT chk_alloc_amount CHECK (amount > 0)
);

CREATE INDEX idx_alloc_inst ON payment_allocations(installment_id);
CREATE INDEX idx_alloc_pay  ON payment_allocations(payment_id);
```

### Catatan penyesuaian dialek

- **MySQL** — ganti `UUID` jadi `CHAR(36)` atau `BINARY(16)`, `TIMESTAMPTZ` jadi `DATETIME`,
  `NUMERIC` jadi `DECIMAL`, hapus `DEFAULT gen_random_uuid()` dan generate UUID di aplikasi.
  Partial index (`WHERE due_date IS NOT NULL`) tidak didukung — pakai index biasa.
- **SQLite** — `UUID` jadi `TEXT`, `NUMERIC(18,2)` jadi `INTEGER` (simpan dalam satuan
  terkecil, mis. rupiah tanpa desimal, untuk menghindari galat floating point).
  `CHECK` didukung, `ON DELETE` butuh `PRAGMA foreign_keys = ON`.
- **Aplikasi single-user** — hapus semua kolom `user_id` dan index terkait.

---

## Aturan Bisnis

### A. Generator jadwal

Dipanggil sekali saat debt dibuat, dan saat user mengubah `debt_schedules`.

```
generate(debt, schedule) -> Installment[]
```

Perilaku per tipe:

- **`open`** → buat **1 baris** dengan `due_date = NULL`, `total_amount = principal`.
  Ini utang tanpa tenggat; user bisa nyicil kapan saja lewat payment.
- **`single`** → buat 1 baris, `due_date = anchor_date`, `total_amount = principal + bunga + fee`.
- **`recurring`** → buat `period_count` baris. Tanggal ke-n dihitung dari `anchor_date`.
- **`custom`** → jangan generate apa pun. User yang mengisi baris satu per satu.

**Aturan clamp tanggal (WAJIB):**

Selalu hitung dari niat asli (`due_day`), **jangan** dari tanggal cicilan sebelumnya.

```
Benar:  Jan 31 → Feb 28 → Mar 31 → Apr 30 → Mei 31   ✓
Salah:  Jan 31 → Feb 28 → Mar 28 → Apr 28 → Mei 28   ✗ (drift permanen)
```

Implementasi: untuk cicilan ke-n, ambil `bulan = anchor + (n × interval)`, lalu
`tanggal = min(due_day, hari_terakhir_bulan_itu)`.

Jangan menggeser jatuh tempo karena hari libur atau akhir pekan. Mayoritas lender
tetap memakai tanggalnya.

**Aturan pembulatan:**

Cicilan 1 sampai n-1 dibulatkan ke satuan terdekat (default: 1.000 rupiah, buat
configurable). Seluruh sisa selisih dilempar ke **cicilan terakhir**, supaya
`SUM(total_amount)` persis sama dengan total kewajiban. Jangan ada selisih receh.

**Aturan proteksi saat regenerate:**

Baris dengan `is_modified = true` **atau** yang sudah punya alokasi pembayaran
**tidak boleh disentuh** generator. Regenerate hanya boleh mengganti baris yang masih
"perawan".

Kalau user mengubah jadwal induk, tampilkan pilihan ala Google Calendar:

> Ubah **cicilan ini saja** / **ini dan seterusnya** / **semua cicilan**

### B. Alokasi pembayaran

Saat user input pembayaran, default-nya **otomatis**, dengan urutan:

1. Cicilan yang paling lama tertunggak dulu (`due_date` menaik, lalu `sequence` menaik).
2. Dalam satu cicilan, tutup sisa `total_amount − paid_amount`.
3. Kalau uang masih sisa, lanjut ke cicilan berikutnya.
4. Kalau semua cicilan sudah lunas dan masih sisa, buat baris alokasi bertanda
   `overpayment` atau tolak dengan pesan jelas. Jangan diam-diam menghilangkan uangnya.

Alokasi manual disediakan, tapi sembunyikan di mode lanjutan.

**Invariant yang wajib dijaga (validasi di service layer, dalam satu transaksi DB):**

```
SUM(payment_allocations.amount WHERE payment_id = X) <= payments.amount   -- untuk setiap X
SUM(payment_allocations.amount WHERE installment_id = Y) <= installments.total_amount
```

Kalau yang pertama bocor, total hutang akan melenceng pelan-pelan tanpa ketahuan.

### C. Status turunan (jangan disimpan sebagai kolom enum)

Status cicilan dihitung, bukan di-set:

| Kondisi | Status |
|---|---|
| `paid_amount = 0` dan `due_date` masih di depan | `upcoming` |
| `paid_amount = 0` dan `due_date` sudah lewat + `grace_days` | `overdue` |
| `0 < paid_amount < total_amount` | `partial` |
| `paid_amount >= total_amount` | `paid` |
| `due_date IS NULL` | `open` |

Status `debts` ikut: kalau semua installment `paid`, set `debts.status = 'settled'`
dan isi `closed_at`.

### D. Integrasi dengan modul yang sudah ada

- Setiap `payment` **boleh** membuat baris di `transactions` (kategori "Pembayaran Hutang")
  dan mengurangi saldo `accounts`. Simpan `transaction_id` di `payments` supaya tidak
  dobel catat. Buat ini opsional lewat flag di form.
- Pencairan pinjaman (`payable`) idealnya juga jadi transaksi pemasukan ke `account_id`
  tujuan. Tawarkan checkbox saat membuat debt, jangan paksa.

---

## Endpoint API

```
GET    /debts                     ?direction=&status=&counterparty_id=
POST   /debts                     buat debt + schedule + generate installments (1 transaksi DB)
GET    /debts/:id                 detail + daftar installment + ringkasan
PATCH  /debts/:id                 ubah header
DELETE /debts/:id                 tolak kalau sudah ada payment; sarankan 'cancelled'

PATCH  /debts/:id/schedule        ubah aturan, param: scope = this|forward|all
POST   /debts/:id/regenerate      regenerate manual, hormati is_modified

GET    /debts/:id/installments
PATCH  /installments/:id          ubah tanggal/nominal → set is_modified = true

POST   /debts/:id/payments        body: amount, paid_at, account_id, allocations[] (opsional)
DELETE /payments/:id              hapus payment + alokasinya, recalc paid_amount

GET    /debts/summary             total hutang, total piutang, jatuh tempo 30 hari ke depan
GET    /debts/calendar            ?from=&to= — semua installment dalam rentang tanggal
GET    /counterparties            CRUD standar
GET    /debt-presets              daftar preset produk finansial
```

---

## Kebutuhan UI

1. **Dashboard** — total hutang, total piutang, dan daftar yang jatuh tempo dalam 30 hari.
2. **Form tambah hutang** — bercabang di awal: *Lembaga* atau *Perorangan*.
   - Lembaga → tampilkan pilihan preset, field bunga, jumlah cicilan.
   - Perorangan → sembunyikan bunga sepenuhnya, tawarkan "atur pengingat" alih-alih
     jatuh tempo. **Jangan tandai merah** utang ke teman hanya karena lewat tanggal.
3. **Preview jadwal sebelum submit** — tampilkan tabel cicilan hasil generate, biar user
   bisa membandingkan dengan jadwal resmi dari lender dan mengoreksi kalau meleset.
4. **Detail hutang** — progress bar, daftar cicilan dengan status warna, riwayat pembayaran.
5. **Form bayar** — cukup nominal + tanggal + rekening. Tampilkan preview alokasi otomatis
   ("Rp 1.000.000 → menutup cicilan #3 dan #4") sebelum konfirmasi.
6. **Mode alokasi manual** — collapsible, default tertutup.

---

## Kasus Uji yang Harus Lulus

Tolong tulis test untuk skenario berikut:

1. Cicilan 12x, anchor 31 Januari → cicilan Februari jatuh di 28/29, cicilan Maret
   **kembali ke 31**, tidak drift.
2. Cicilan 12x, pokok 10.000.000, bunga flat 1%/bulan → `SUM(total_amount)` persis
   11.200.000, tanpa selisih receh, cicilan ke-12 menyerap sisa pembulatan.
3. Satu payment 1.000.000 menutup dua cicilan @500.000 → dua baris alokasi, kedua
   cicilan berstatus `paid`.
4. Satu cicilan 500.000 dibayar 200.000 lalu 300.000 → status berubah `partial` → `paid`.
5. Payment dihapus → `paid_amount` cicilan terkait terhitung ulang dengan benar.
6. User mengubah `due_date` cicilan #5 → `is_modified` jadi true; regenerate berikutnya
   tidak menimpanya, sedangkan cicilan #6 dan seterusnya ikut berubah.
7. Utang tipe `open` tanpa `due_date` → tidak pernah muncul sebagai `overdue`.
8. Alokasi melebihi `payments.amount` → ditolak, tidak ada baris tersimpan (rollback).
9. Debt yang sudah punya payment → `DELETE` ditolak dengan pesan yang jelas.
10. Semua cicilan lunas → `debts.status` otomatis jadi `settled` dan `closed_at` terisi.

---

## Deliverable

1. File migrasi database.
2. Model/entity beserta relasinya.
3. Service layer: `ScheduleGenerator`, `PaymentAllocator`, `DebtStatusCalculator` — pisahkan
   dari controller supaya bisa diuji sendiri.
4. Controller dan route sesuai daftar endpoint di atas.
5. Seeder preset produk finansial umum di Indonesia (paylater dan cicilan bank).
6. Unit test untuk 10 skenario di atas.

Kerjakan bertahap: migrasi dan model dulu, aku review, baru lanjut ke service layer.