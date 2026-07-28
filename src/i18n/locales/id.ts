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
    emptyTitle: string;
    emptyDescription: string;
  };
  budget: {
    title: string;
    comingSoonTitle: string;
    comingSoonDescription: string;
  };
  more: {
    title: string;
    language: string;
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
    emptyTitle: "Belum ada transaksi",
    emptyDescription: "Transaksi yang kamu catat akan tampil di sini.",
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
    account: "Akun",
    guestAccount: "Akun tamu",
  },
  common: {
    migrationFailed: "Migrasi database gagal",
  },
};
