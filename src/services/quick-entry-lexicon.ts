/**
 * Every word quick entry knows, and nothing else.
 *
 * Data only, no logic: this is the file that will churn as real sentences turn
 * up, and keeping it separate means a new keyword never risks the grammar. Its
 * test enforces the invariants that make the tables safe to extend — all
 * lowercase, no duplicates, and no phrase claimed by two categories of the
 * same type, which would make the winner depend on object key order.
 */

/** Magnitude suffixes. `m` is accepted as "juta" but always flagged: it is
 * genuinely ambiguous with "miliar", and a wrong-by-1000× amount is the worst
 * mistake this feature can make. */
export const AMOUNT_SUFFIXES: { suffix: string; scale: number; isGuessed: boolean }[] = [
  { suffix: "ribu", scale: 1_000, isGuessed: false },
  { suffix: "rb", scale: 1_000, isGuessed: false },
  { suffix: "k", scale: 1_000, isGuessed: false },
  { suffix: "juta", scale: 1_000_000, isGuessed: false },
  { suffix: "jt", scale: 1_000_000, isGuessed: false },
  { suffix: "m", scale: 1_000_000, isGuessed: true },
  { suffix: "milyar", scale: 1_000_000_000, isGuessed: false },
  { suffix: "miliar", scale: 1_000_000_000, isGuessed: false },
];

/**
 * Jakarta money slang. Literally these are 5, 10, 50, 500 and 100 — the
 * ×1000 reading is contextual, exactly the ambiguity that got `m` flagged, so
 * these are flagged too rather than trusted.
 */
export const SLANG_AMOUNTS: Record<string, number> = {
  seceng: 1_000,
  goceng: 5_000,
  ceban: 10_000,
  goban: 20_000,
  gocap: 50_000,
  cepek: 100_000,
  gopek: 500,
};

/**
 * Words that turn the number before them into a count.
 *
 * Without these, "2 porsi 25rb" reads as two candidate amounts and the wrong
 * one can win.
 */
export const UNIT_NOUNS = [
  "porsi", "gelas", "cup", "pcs", "pc", "buah", "biji", "bungkus", "botol",
  "liter", "ltr", "kg", "gram", "gr", "km", "meter", "orang", "bulan",
  "minggu", "hari", "kali", "tiket", "lembar", "potong", "ekor", "batang",
  "pack", "box", "dus", "kotak", "piring", "mangkok", "sachet", "galon",
];

/** Multiplier connectives: "2 x 20rb", "20rb x 2", "3 kali 5rb". */
export const MULTIPLIER_WORDS = ["x", "@", "kali"];

/** A fee rides alongside the amount and must never be mistaken for it. */
export const FEE_WORDS = ["biaya", "admin", "adm", "fee", "administrasi"];

export const WEEKDAYS: Record<string, number> = {
  minggu: 0, ahad: 0,
  senin: 1, sen: 1,
  selasa: 2, sel: 2,
  rabu: 3, rab: 3,
  kamis: 4, kam: 4,
  jumat: 5, jumaat: 5, jum: 5,
  sabtu: 6, sab: 6,
};

export const MONTHS: Record<string, number> = {
  januari: 0, jan: 0,
  februari: 1, pebruari: 1, feb: 1,
  maret: 2, mar: 2,
  april: 3, apr: 3,
  mei: 4,
  juni: 5, jun: 5,
  juli: 6, jul: 6,
  agustus: 7, agu: 7, ags: 7,
  september: 8, sep: 8, sept: 8,
  oktober: 9, okt: 9,
  november: 10, nov: 10,
  desember: 11, des: 11,
};

/** Whole-day offsets, matched as phrases so the longest wins. */
export const DAY_OFFSET_PHRASES: Record<string, number> = {
  "hari ini": 0,
  sekarang: 0,
  barusan: 0,
  tadi: 0,
  kemarin: -1,
  kmrn: -1,
  "kemarin lusa": -2,
  "minggu lalu": -7,
  "seminggu lalu": -7,
  "minggu kemarin": -7,
};

/**
 * Offsets counted in months, not days.
 *
 * "bulan lalu" means the same day of the previous month, clamped to its
 * length — subtracting 30 days would land on the 8th when the user meant the
 * 7th, and that is the kind of quiet error nobody re-reads.
 */
export const MONTH_OFFSET_PHRASES: Record<string, number> = {
  "bulan lalu": -1,
  "sebulan lalu": -1,
  "bulan kemarin": -1,
};

/**
 * Times of day, local hours.
 *
 * Only ever matched behind "tadi". On their own these words belong to phrases
 * like "makan siang" and "makan malam", and letting the date scanner eat them
 * would cost the category that names the meal.
 */
export const TIME_OF_DAY: Record<string, number> = {
  pagi: 8,
  siang: 12,
  sore: 16,
  petang: 18,
  malam: 20,
};

export type TypeKeyword = {
  phrase: string;
  kind: "income" | "transfer" | "bill";
  /**
   * Which way a transfer runs. `toCash` is a withdrawal, `fromCash` a deposit;
   * both are transfers and they are exact opposites, so a flat "transfer" tag
   * would book half of them backwards.
   */
  direction?: "toCash" | "fromCash";
};

export const TYPE_KEYWORDS: TypeKeyword[] = [
  { phrase: "gaji", kind: "income" },
  { phrase: "gajian", kind: "income" },
  { phrase: "bonus", kind: "income" },
  { phrase: "thr", kind: "income" },
  { phrase: "cashback", kind: "income" },
  { phrase: "refund", kind: "income" },
  { phrase: "komisi", kind: "income" },
  { phrase: "honor", kind: "income" },
  { phrase: "dividen", kind: "income" },
  { phrase: "terima", kind: "income" },
  { phrase: "dapat", kind: "income" },
  { phrase: "dapet", kind: "income" },
  { phrase: "masuk", kind: "income" },
  { phrase: "jual", kind: "income" },
  { phrase: "pinjam ke", kind: "income" },

  { phrase: "transfer", kind: "transfer" },
  { phrase: "tf", kind: "transfer" },
  { phrase: "topup", kind: "transfer" },
  { phrase: "top up", kind: "transfer" },
  { phrase: "isi saldo", kind: "transfer" },
  { phrase: "isi", kind: "transfer" },
  { phrase: "pindah", kind: "transfer" },
  { phrase: "tarik tunai", kind: "transfer", direction: "toCash" },
  { phrase: "tarik", kind: "transfer", direction: "toCash" },
  { phrase: "setor tunai", kind: "transfer", direction: "fromCash" },
  { phrase: "setor", kind: "transfer", direction: "fromCash" },

  { phrase: "tagihan", kind: "bill" },
  { phrase: "jatuh tempo", kind: "bill" },
];

/**
 * Phrases that contain an income word but are not income.
 *
 * "dapat diskon" is a cheaper purchase, "masuk tol" is a toll gate, "terima
 * paket" is a delivery. Each one would otherwise book money as arriving when
 * it was leaving — the single most misleading mistake the type detector can
 * make, since the sign of the transaction flips.
 *
 * They only veto the type keyword; the words stay available to the category
 * matcher, which is how "masuk tol" still lands under transport.
 */
export const TYPE_BLOCKERS = [
  "dapat diskon",
  "dapet diskon",
  "dapat potongan",
  "masuk tol",
  "masuk parkir",
  "masuk bioskop",
  "terima paket",
  "terima kasih",
  "terima tamu",
  "jual beli",
];

/**
 * Category vocabulary, keyed by the built-in slugs seeded in
 * transaction-category.ts. Longest phrase wins, which is why "belanja bulanan"
 * and "mesin kopi" are listed alongside the single words they contain.
 */
export const CATEGORY_KEYWORDS: Record<string, string[]> = {
  "food-drink": [
    "makan", "makan siang", "makan malam", "makan pagi", "sarapan", "kopi",
    "ngopi", "kafe", "cafe", "warteg", "warung", "resto", "restoran", "cemilan",
    "snack", "minum", "teh", "boba", "gofood", "grabfood", "shopeefood",
    "jajan", "bakso", "mie ayam", "nasi goreng", "nasi padang", "katering",
    "food", "lunch", "dinner", "breakfast", "coffee",
  ],
  transport: [
    "bensin", "pertalite", "pertamax", "solar", "ojek", "ojol", "gojek",
    "grab", "grabbike", "grabcar", "taksi", "taxi", "parkir", "tol", "busway",
    "transjakarta", "krl", "kereta", "mrt", "lrt", "angkot", "bus", "tiket bus",
    "pesawat", "tiket pesawat", "servis motor", "servis mobil", "tambal ban",
    "e-toll", "etoll", "transport", "fuel", "gas",
  ],
  shopping: [
    "beli baju", "baju", "celana", "sepatu", "sandal", "tas", "jaket",
    "kado", "hadiah", "elektronik", "gadget", "hp", "laptop", "mesin kopi",
    "perabot", "furniture", "shopee", "tokopedia", "lazada", "belanja online",
    "skincare", "kosmetik", "aksesoris", "shopping",
  ],
  groceries: [
    "belanja bulanan", "belanja dapur", "sembako", "beras", "minyak goreng",
    "telur", "sayur", "buah", "daging", "susu", "gula", "kopi bubuk",
    "supermarket", "indomaret", "alfamart", "pasar", "obat nyamuk", "sabun",
    "deterjen", "tisu", "shampoo", "pasta gigi", "groceries",
  ],
  health: [
    "obat", "dokter", "klinik", "rumah sakit", "apotek", "apotik", "vitamin",
    "vaksin", "periksa", "lab", "dentist", "dokter gigi", "terapi", "bpjs",
    "health", "medicine",
  ],
  entertainment: [
    "bioskop", "nonton", "film", "konser", "game", "games", "steam", "netflix",
    "spotify", "youtube premium", "karaoke", "liburan", "wisata", "rekreasi",
    "hobi", "buku novel", "entertainment", "movie",
  ],
  education: [
    "sekolah", "kuliah", "spp", "les", "kursus", "buku", "alat tulis",
    "seminar", "pelatihan", "sertifikasi", "ujian", "skripsi", "education",
    "course", "tuition",
  ],
  "debt-repayment": [
    "bayar utang", "bayar hutang", "bayar cicilan", "lunasi", "angsuran",
    "bayar pinjaman",
  ],
  "money-lent": [
    "pinjamin", "pinjemin", "minjemin", "minjamin", "meminjamkan",
    "kasih pinjam", "utangin", "talangin",
  ],

  salary: ["gaji", "gajian", "salary", "payroll", "upah"],
  bonus: ["bonus", "thr", "tunjangan", "insentif", "komisi"],
  "investment-income": [
    "dividen", "bunga", "profit", "cuan", "reksadana", "saham", "deposito",
    "capital gain",
  ],
  gift: ["hadiah uang", "angpao", "angpau", "sumbangan", "hibah"],
  "loan-received": ["pinjam ke", "terima pinjaman", "dapat pinjaman"],
  "loan-collected": ["piutang kembali", "dibayar balik", "utang dibayar"],

  electricity: ["listrik", "token listrik", "pln", "electricity"],
  water: ["air", "pdam", "water", "tagihan air"],
  internet: ["internet", "wifi", "indihome", "biznet", "first media"],
  phone: ["pulsa", "paket data", "kuota", "telepon", "telkomsel", "xl", "indosat"],
  rent: ["sewa", "kos", "kontrakan", "kontrak rumah", "rent"],
  insurance: ["asuransi", "premi", "insurance"],
  installment: ["cicilan", "kredit", "leasing", "paylater"],
  subscription: [
    "langganan", "subscription", "berlangganan", "iuran",
  ],
};

/**
 * Wallet names that are also ordinary words.
 *
 * "Dana" is both an e-wallet and the everyday word for funds; "Jago" is a bank
 * and also "good at". A wallet whose entire name is one of these only counts
 * when a cue word points at it, or when it ends the sentence — otherwise
 * "dana darurat 500rb" books itself to the wrong wallet.
 */
export const WALLET_COMMON_WORDS = [
  "dana", "tunai", "cash", "bank", "jago", "blu", "neo", "one", "line",
  "flip", "sea", "star", "digi", "hijra", "aladin",
];

/** Words that point at a wallet, licensing a common-word name. */
export const WALLET_CUE_WORDS = [
  "dari", "ke", "di", "pakai", "pake", "via", "lewat", "dengan", "dgn",
  "saldo", "topup", "isi", "tarik", "setor", "transfer", "tf", "pindah",
  "bayar", "from", "to",
];

/** Leading verbs and particles a learned alias should never start with. */
export const STOPWORDS = [
  "beli", "bayar", "buat", "untuk", "di", "ke", "dari", "dan", "atau", "yang",
  "sama", "dengan", "dgn", "pakai", "pake", "via", "lewat", "ini", "itu",
  "aja", "saja", "sih", "dong", "nya", "sana", "sini", "situ", "juga",
  "lagi", "the", "for", "with", "at", "on",
  "a", "an", "and", "or", "to", "from", "buy", "pay",
];
