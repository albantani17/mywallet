/**
 * Indonesian is the source of truth for the shape of the translations —
 * en.ts is typed as `Translation`, so a key missing from either language is a
 * compile error rather than a runtime fallback.
 */
export type Translation = {
  onboarding: {
    title: string;
    subtitle: string;
    continueGoogle: string;
    comingSoon: string;
    guest: string;
    guestNote: string;
    nameModal: {
      title: string;
      description: string;
      placeholder: string;
      submit: string;
      cancel: string;
      required: string;
      tooLong: string;
      failed: string;
    };
  };
  tabs: {
    home: string;
    wallets: string;
    transactions: string;
    budget: string;
    more: string;
  };
  dashboard: {
    greeting: string;
    yourWallets: string;
    seeAll: string;
    actions: {
      addTransaction: string;
      debts: string;
    };
  };
  wallets: {
    title: string;
    add: string;
    balance: string;
    emptyTitle: string;
    emptyDescription: string;
    searchPlaceholder: string;
    filterAll: string;
    totalBalance: string;
    toggleBalance: string;
    noResultsTitle: string;
    noResultsDescription: string;
    archived: string;
    types: {
      cash: string;
      bank: string;
      ewallet: string;
      investment: string;
    };
    categories: {
      add: string;
      sheetTitle: string;
      nameLabel: string;
      namePlaceholder: string;
      iconLabel: string;
      colorLabel: string;
      save: string;
      nameRequired: string;
      nameTooLong: string;
      failed: string;
    };
    actions: {
      menuLabel: string;
      edit: string;
      delete: string;
      cancel: string;
    };
    edit: {
      title: string;
      lockedNote: string;
      save: string;
      failed: string;
    };
    delete: {
      title: string;
      message: string;
      confirm: string;
      usedTitle: string;
      usedMessage: string;
      continue: string;
      typeNamePrompt: string;
      typeNamePlaceholder: string;
      archiveConfirm: string;
      failed: string;
    };
  };
  createWallet: {
    title: string;
    sheetTitle: string;
    description: string;
    nameLabel: string;
    namePlaceholder: string;
    typeLabel: string;
    initialBalanceLabel: string;
    initialBalancePlaceholder: string;
    initialBalanceHint: string;
    submit: string;
    nameRequired: string;
    nameTooLong: string;
    balanceTooLarge: string;
    failed: string;
  };
  transactions: {
    title: string;
    add: string;
    emptyTitle: string;
    emptyDescription: string;
    /** Labels for the built-in categories; see transaction-category.ts. */
    categories: {
      foodDrink: string;
      transport: string;
      shopping: string;
      groceries: string;
      health: string;
      entertainment: string;
      education: string;
      salary: string;
      bonus: string;
      investment: string;
      gift: string;
      electricity: string;
      water: string;
      internet: string;
      phone: string;
      rent: string;
      insurance: string;
      installment: string;
      subscription: string;
      other: string;
    };
  };
  newTransaction: {
    title: string;
    close: string;
    types: {
      expense: string;
      income: string;
      transfer: string;
      bill: string;
    };
    amountLabel: string;
    amountPlaceholder: string;
    walletLabel: string;
    fromWalletLabel: string;
    toWalletLabel: string;
    noWallets: string;
    noOtherWallets: string;
    feeLabel: string;
    feePlaceholder: string;
    categoryLabel: string;
    dateLabel: string;
    dateConfirm: string;
    dueDateLabel: string;
    dueDatePlaceholder: string;
    noteLabel: string;
    notePlaceholder: string;
    submit: string;
    amountRequired: string;
    amountTooLarge: string;
    walletRequired: string;
    toWalletRequired: string;
    sameWallet: string;
    categoryRequired: string;
    noteTooLong: string;
    failed: string;
    categorySheet: {
      add: string;
      title: string;
      nameLabel: string;
      namePlaceholder: string;
      iconLabel: string;
      colorLabel: string;
      save: string;
      nameRequired: string;
      nameTooLong: string;
      failed: string;
    };
  };
  budget: {
    title: string;
    comingSoonTitle: string;
    comingSoonDescription: string;
  };
  more: {
    title: string;
    language: string;
    theme: string;
    themes: {
      light: string;
      dark: string;
      system: string;
    };
    account: string;
    guestAccount: string;
  };
  common: {
    migrationFailed: string;
  };
};

export const id: Translation = {
  onboarding: {
    title: "Selamat datang,\nsemua asetmu di satu tempat.",
    subtitle:
      "Dompet, pemasukan, pengeluaran, hutang & piutang — terhitung otomatis.",
    continueGoogle: "Lanjut dengan Google",
    comingSoon: "Segera hadir",
    guest: "Masuk sebagai Tamu",
    guestNote: "Data tamu tersimpan di perangkat ini saja.",
    nameModal: {
      title: "Siapa nama kamu?",
      description: "Nama ini dipakai untuk menyapa kamu di aplikasi.",
      placeholder: "Masukkan nama kamu",
      submit: "Lanjut",
      cancel: "Batal",
      required: "Nama wajib diisi",
      tooLong: "Nama terlalu panjang",
      failed: "Gagal membuat akun. Coba lagi.",
    },
  },
  tabs: {
    home: "Beranda",
    wallets: "Dompet",
    transactions: "Transaksi",
    budget: "Budget",
    more: "Lainnya",
  },
  dashboard: {
    greeting: "Halo, {{name}}",
    yourWallets: "Dompetmu",
    seeAll: "Lihat semua",
    actions: {
      addTransaction: "Tambah Transaksi",
      debts: "Hutang",
    },
  },
  wallets: {
    title: "Dompet",
    add: "Tambah dompet",
    balance: "Saldo",
    emptyTitle: "Belum ada dompet",
    emptyDescription: "Buat dompet pertamamu untuk mulai mencatat.",
    searchPlaceholder: "Cari dompet",
    filterAll: "Semua",
    totalBalance: "Total Saldo",
    toggleBalance: "Tampilkan atau sembunyikan saldo",
    noResultsTitle: "Dompet tidak ditemukan",
    noResultsDescription: "Coba kata kunci lain atau ganti kategorinya.",
    archived: "Diarsipkan",
    types: {
      cash: "Tunai",
      bank: "Bank",
      ewallet: "E-Wallet",
      investment: "Investasi",
    },
    categories: {
      add: "Tambah kategori",
      sheetTitle: "Kategori baru",
      nameLabel: "Nama kategori",
      namePlaceholder: "Contoh: Crypto",
      iconLabel: "Ikon",
      colorLabel: "Warna",
      save: "Simpan kategori",
      nameRequired: "Nama kategori wajib diisi",
      nameTooLong: "Nama kategori terlalu panjang",
      failed: "Gagal membuat kategori. Coba lagi.",
    },
    actions: {
      menuLabel: "Aksi dompet",
      edit: "Edit",
      delete: "Hapus",
      cancel: "Batal",
    },
    edit: {
      title: "Edit dompet",
      lockedNote:
        "Dompet ini sudah punya {{count}} transaksi, jadi hanya nama yang bisa diubah.",
      save: "Simpan",
      failed: "Gagal menyimpan perubahan. Coba lagi.",
    },
    delete: {
      title: "Hapus {{name}}?",
      message: "Dompet ini belum punya transaksi dan akan dihapus permanen.",
      confirm: "Hapus",
      usedTitle: "Sembunyikan {{name}}?",
      // Honest about what actually happens: the row is archived, not erased.
      usedMessage:
        "Dompet ini punya {{count}} transaksi. Dompet akan disembunyikan dari daftar, tapi semua transaksinya tetap tersimpan agar saldo dompet lain tidak berubah.",
      continue: "Lanjut",
      typeNamePrompt: "Ketik \"{{name}}\" untuk konfirmasi.",
      typeNamePlaceholder: "Nama dompet",
      archiveConfirm: "Sembunyikan dompet",
      failed: "Gagal menghapus dompet. Coba lagi.",
    },
  },
  createWallet: {
    title: "Buat dompet pertamamu",
    // The gate screen says "your first wallet"; the sheet can open any time.
    sheetTitle: "Dompet baru",
    description: "Dompet adalah tempat uangmu berada — tunai, bank, atau e-wallet.",
    nameLabel: "Nama dompet",
    namePlaceholder: "Contoh: Dompet Tunai",
    typeLabel: "Jenis",
    initialBalanceLabel: "Saldo awal",
    initialBalancePlaceholder: "0",
    initialBalanceHint: "Saldo yang ada di dompet ini sekarang.",
    submit: "Buat dompet",
    nameRequired: "Nama dompet wajib diisi",
    nameTooLong: "Nama dompet terlalu panjang",
    balanceTooLarge: "Saldo awal terlalu besar",
    failed: "Gagal membuat dompet. Coba lagi.",
  },
  transactions: {
    title: "Transaksi",
    add: "Tambah Transaksi",
    emptyTitle: "Belum ada transaksi",
    emptyDescription: "Transaksi yang kamu catat akan tampil di sini.",
    categories: {
      foodDrink: "Makanan & Minuman",
      transport: "Transportasi",
      shopping: "Belanja",
      groceries: "Kebutuhan Harian",
      health: "Kesehatan",
      entertainment: "Hiburan",
      education: "Pendidikan",
      salary: "Gaji",
      bonus: "Bonus",
      investment: "Investasi",
      gift: "Hadiah",
      electricity: "Listrik",
      water: "Air",
      internet: "Internet",
      phone: "Pulsa & Telepon",
      rent: "Sewa",
      insurance: "Asuransi",
      installment: "Cicilan",
      subscription: "Langganan",
      other: "Lainnya",
    },
  },
  newTransaction: {
    title: "Tambah Transaksi",
    close: "Tutup",
    types: {
      expense: "Pengeluaran",
      income: "Pemasukan",
      transfer: "Transfer",
      bill: "Tagihan",
    },
    amountLabel: "Nominal",
    amountPlaceholder: "0",
    walletLabel: "Dompet",
    fromWalletLabel: "Dari dompet",
    toWalletLabel: "Ke dompet",
    noWallets: "Belum ada dompet.",
    noOtherWallets: "Butuh minimal dua dompet untuk transfer.",
    feeLabel: "Biaya admin (opsional)",
    feePlaceholder: "0",
    categoryLabel: "Kategori",
    dateLabel: "Tanggal transaksi",
    dateConfirm: "Pilih",
    dueDateLabel: "Jatuh tempo (opsional)",
    dueDatePlaceholder: "Belum ditentukan",
    noteLabel: "Catatan (opsional)",
    notePlaceholder: "Misalnya: makan siang bareng tim",
    submit: "Simpan",
    amountRequired: "Nominal harus lebih dari nol",
    amountTooLarge: "Nominal terlalu besar",
    walletRequired: "Pilih dompet dulu",
    toWalletRequired: "Pilih dompet tujuan",
    sameWallet: "Dompet tujuan harus berbeda",
    categoryRequired: "Pilih kategori dulu",
    noteTooLong: "Catatan terlalu panjang",
    failed: "Transaksi gagal disimpan. Coba lagi.",
    categorySheet: {
      add: "Kategori baru",
      title: "Kategori baru",
      nameLabel: "Nama kategori",
      namePlaceholder: "Misalnya: Kopi",
      iconLabel: "Ikon",
      colorLabel: "Warna",
      save: "Simpan kategori",
      nameRequired: "Nama kategori wajib diisi",
      nameTooLong: "Nama kategori terlalu panjang",
      failed: "Kategori gagal dibuat. Coba lagi.",
    },
  },
  budget: {
    title: "Budget",
    comingSoonTitle: "Budget segera hadir",
    comingSoonDescription:
      "Atur batas pengeluaran per kategori dan pantau sisanya tiap bulan.",
  },
  more: {
    title: "Lainnya",
    language: "Bahasa",
    theme: "Tema",
    themes: {
      light: "Terang",
      dark: "Gelap",
      system: "Ikuti sistem",
    },
    account: "Akun",
    guestAccount: "Akun tamu",
  },
  common: {
    migrationFailed: "Migrasi database gagal",
  },
};
