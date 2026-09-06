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
    debts: string;
    more: string;
  };
  dashboard: {
    greeting: string;
    yourWallets: string;
    seeAll: string;
    actions: {
      addTransaction: string;
    };
    quickRepeat: {
      title: string;
      hint: string;
      saved: string;
      failed: string;
      undoFailed: string;
    };
  };
  insights: {
    title: string;
    monthTitle: string;
    asOf: string;
    vsMonth: string;
    noComparison: string;
    dailyAverage: string;
    projected: string;
    breakdownTitle: string;
    otherCategories: string;
    uncategorised: string;
    noSpending: string;
    largest: string;
    cashFlowTitle: string;
    income: string;
    expense: string;
    net: string;
    debtCashFlow: string;
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
    today: string;
    yesterday: string;
    uncategorized: string;
    emptyTitle: string;
    emptyDescription: string;
    /** Nested so `today` here cannot collide with the day header above. */
    filters: {
      searchPlaceholder: string;
      wallet: string;
      allWallets: string;
      clearCategory: string;
      time: string;
      allTime: string;
      today: string;
      last7: string;
      last30: string;
      thisMonth: string;
      custom: string;
      from: string;
      to: string;
      anyDate: string;
      noResultsTitle: string;
      noResultsDescription: string;
    };
    /** Labels for the built-in categories; see transaction-category.ts. */
    categories: {
      foodDrink: string;
      transport: string;
      shopping: string;
      groceries: string;
      health: string;
      entertainment: string;
      education: string;
      debtRepayment: string;
      moneyLent: string;
      loanReceived: string;
      loanCollected: string;
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
    typeLabel: string;
    categoryLabel: string;
    categoryOptionalLabel: string;
    categoryPlaceholder: string;
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
    noteTooLong: string;
    failed: string;
    categorySheet: {
      add: string;
      title: string;
      selectTitle: string;
      searchPlaceholder: string;
      noResults: string;
      back: string;
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
  debts: {
    title: string;
    tabs: {
      receivable: string;
      payable: string;
    };
    addReceivable: string;
    addPayable: string;
    totalOutstanding: string;
    debtCount: string;
    overdueCount: string;
    outstanding: string;
    total: string;
    paidOf: string;
    recordPayment: string;
    statusOngoing: string;
    statusPartial: string;
    statusSettled: string;
    statusCancelled: string;
    statusWrittenOff: string;
    dueOn: string;
    overdue: string;
    pastDue: string;
    settled: string;
    /** Per-installment chips, keyed by the tone `installmentTone` resolves to. */
    installmentStatus: {
      paid: string;
      partial: string;
      overdue: string;
      late: string;
      upcoming: string;
      open: string;
    };
    actions: {
      menuLabel: string;
      edit: string;
      cancel: string;
      writeOff: string;
      delete: string;
      deletePayment: string;
    };
    emptyReceivableTitle: string;
    emptyReceivableDescription: string;
    emptyPayableTitle: string;
    emptyPayableDescription: string;
    /**
     * Labels for the built-in presets, keyed by slug. Only the seeded rows are
     * translated; a preset the user made keeps the name they typed.
     */
    presets: {
      paylater: string;
      "credit-card": string;
      "bank-loan": string;
      "asset-financing": string;
      "personal-loan": string;
      "personal-lending": string;
    };
  };
  newDebt: {
    title: string;
    close: string;
    submit: string;
    failed: string;

    directionLabel: string;
    presetLabel: string;
    presetPlaceholder: string;
    presetSheetTitle: string;
    presetNone: string;
    counterpartyLabel: string;
    counterpartyPlaceholder: string;
    counterpartyKindPerson: string;
    counterpartyKindInstitution: string;
    counterpartyRecent: string;
    titleLabel: string;
    titlePlaceholder: string;
    principalLabel: string;
    principalPlaceholder: string;
    originDateLabel: string;
    walletLabel: string;
    walletHint: string;
    noWallets: string;
    recordCashFlowLabel: string;
    recordCashFlowHint: string;
    noteLabel: string;
    notePlaceholder: string;

    planLabel: string;
    installmentAmountLabel: string;
    installmentAmountPlaceholder: string;
    installmentAmountHint: string;
    singleAmountLabel: string;
    singleAmountHint: string;
    customEnter: string;
    customExit: string;
    interestRateAdvancedHint: string;
    previewRateEquivalent: string;
    installmentAmountRequired: string;
    installmentAmountTooSmall: string;
    scheduleTypeOpen: string;
    scheduleTypeSingle: string;
    scheduleTypeRecurring: string;
    scheduleTypeCustom: string;
    scheduleTypeOpenHint: string;
    dueDateLabel: string;
    firstDueLabel: string;
    intervalUnitLabel: string;
    intervalDay: string;
    intervalWeek: string;
    intervalMonth: string;
    intervalCountLabel: string;
    periodCountLabel: string;
    dueDayLabel: string;
    dueDayPlaceholder: string;
    dueDayHint: string;
    advancedShow: string;
    advancedHide: string;
    interestRateLabel: string;
    interestMethodLabel: string;
    interestMethodNone: string;
    interestMethodFlat: string;
    interestMethodEffective: string;
    interestMethodManual: string;
    graceDaysLabel: string;
    reminderDaysLabel: string;
    roundingUnitLabel: string;

    customRowsLabel: string;
    customRowDate: string;
    customRowAmount: string;
    customAddRow: string;
    customRemoveRow: string;
    customTotal: string;
    customDifference: string;

    previewTitle: string;
    previewTotal: string;
    previewInterest: string;
    previewMore: string;
    previewNoDate: string;
    previewEmpty: string;

    principalRequired: string;
    principalTooLarge: string;
    counterpartyRequired: string;
    counterpartyTooLong: string;
    titleRequired: string;
    titleTooLong: string;
    noteTooLong: string;
    anchorDateRequired: string;
    intervalCountInvalid: string;
    periodCountInvalid: string;
    dueDayInvalid: string;
    interestRateInvalid: string;
    customRowsRequired: string;
    customRowDateRequired: string;
    customRowAmountRequired: string;
  };
  debtDetail: {
    title: string;
    back: string;
    notFound: string;
    billed: string;
    paid: string;
    outstanding: string;
    progress: string;
    nextDue: string;
    noDueDate: string;
    overdueInstallments: string;
    installmentsTitle: string;
    installmentsEmpty: string;
    paymentsTitle: string;
    installmentOf: string;
    installmentModified: string;
    paymentUnallocated: string;
    paymentMethod: {
      transfer: string;
      cash: string;
      autodebit: string;
      other: string;
      unspecified: string;
    };
    recordPayment: string;
    confirm: {
      cancelTitle: string;
      cancelMessage: string;
      cancelConfirm: string;
      writeOffTitle: string;
      writeOffMessage: string;
      writeOffConfirm: string;
      deleteTitle: string;
      deleteMessage: string;
      deleteConfirm: string;
      deleteBlocked: string;
      deletePaymentTitle: string;
      deletePaymentMessage: string;
      deletePaymentConfirm: string;
      cancelAction: string;
      failed: string;
    };
    editInstallment: {
      title: string;
      dateLabel: string;
      amountLabel: string;
      noteLabel: string;
      notePlaceholder: string;
      save: string;
      amountRequired: string;
      belowPaid: string;
      noteTooLong: string;
      failed: string;
    };
  };
  newPayment: {
    title: string;
    close: string;
    notFound: string;
    outstandingPayable: string;
    outstandingReceivable: string;
    amountLabel: string;
    amountPlaceholder: string;
    amountRequired: string;
    amountTooLarge: string;
    dueTitle: string;
    dueInstallment: string;
    dueOn: string;
    dueNoDate: string;
    dueArrears: string;
    dueProgress: string;
    duePerPeriod: string;
    pickDueNow: string;
    pickOneInstallment: string;
    pickSettle: string;
    dateLabel: string;
    walletLabelPayable: string;
    walletLabelReceivable: string;
    walletHint: string;
    noWallets: string;
    methodLabel: string;
    methodUnspecified: string;
    cashFlowLabel: string;
    cashFlowHint: string;
    noteLabel: string;
    notePlaceholder: string;
    noteTooLong: string;
    allocationTitle: string;
    covers: string;
    coversNone: string;
    allocated: string;
    unallocated: string;
    manualToggle: string;
    manualHint: string;
    manualReset: string;
    manualRemaining: string;
    errorNonPositive: string;
    errorExceedsPayment: string;
    errorUnknownInstallment: string;
    errorOverpaid: string;
    errorDuplicate: string;
    errorNoAllocation: string;
    willSettle: string;
    willRemain: string;
    submit: string;
    failed: string;
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
  backup: {
    title: string;
    subtitle: string;
    open: string;
    drive: {
      section: string;
      description: string;
      unavailable: string;
      missingModule: string;
      signIn: string;
      signOut: string;
      signedInAs: string;
      backUpNow: string;
      lastBackup: string;
      backupsTitle: string;
      empty: string;
      emptyHint: string;
      restore: string;
      refresh: string;
    };
    file: {
      section: string;
      description: string;
      export: string;
      import: string;
    };
    confirm: {
      title: string;
      message: string;
      summary: string;
      typePrompt: string;
      keyword: string;
      cancel: string;
      submit: string;
    };
    done: {
      uploaded: string;
      exported: string;
      restored: string;
      snapshot: string;
    };
    errors: {
      signIn: string;
      backup: string;
      restore: string;
      list: string;
      unknownFormat: string;
      futureFormat: string;
      futureSchema: string;
      corrupt: string;
      unauthorized: string;
    };
  };
  common: {
    migrationFailed: string;
    undo: string;
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
    debts: "Hutang",
    more: "Lainnya",
  },
  dashboard: {
    greeting: "Halo, {{name}}",
    yourWallets: "Dompetmu",
    seeAll: "Lihat semua",
    actions: {
      addTransaction: "Tambah Transaksi",
    },
    quickRepeat: {
      title: "Catat lagi",
      hint: "Tekan lama untuk mengubah dulu",
      saved: "{{name}} tercatat",
      failed: "Gagal mencatat. Coba lagi.",
      undoFailed: "Gagal membatalkan. Hapus manual dari daftar transaksi.",
    },
  },
  insights: {
    title: "Insight",
    monthTitle: "Bulan ini",
    asOf: "s/d {{date}}",
    vsMonth: "vs {{month}}",
    noComparison: "Belum ada pembanding",
    dailyAverage: "{{amount}}/hari",
    projected: "proyeksi {{amount}}",
    breakdownTitle: "Ke mana perginya",
    otherCategories: "Lainnya",
    uncategorised: "Tanpa kategori",
    noSpending: "Belum ada pengeluaran bulan ini.",
    largest: "Terbesar",
    cashFlowTitle: "Arus kas 6 bulan",
    income: "Masuk",
    expense: "Keluar",
    net: "Net {{amount}}",
    debtCashFlow: "Arus kas hutang {{amount}}",
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
    today: "Hari ini",
    yesterday: "Kemarin",
    uncategorized: "Tanpa kategori",
    emptyTitle: "Belum ada transaksi",
    emptyDescription: "Transaksi yang kamu catat akan tampil di sini.",
    filters: {
      searchPlaceholder: "Cari catatan atau dompet",
      wallet: "Dompet",
      allWallets: "Semua dompet",
      clearCategory: "Hapus filter kategori",
      time: "Waktu",
      allTime: "Semua waktu",
      today: "Hari ini",
      last7: "7 hari terakhir",
      last30: "30 hari terakhir",
      thisMonth: "Bulan ini",
      custom: "Pilih tanggal",
      from: "Dari",
      to: "Sampai",
      anyDate: "Kapan saja",
      noResultsTitle: "Transaksi tidak ditemukan",
      noResultsDescription: "Coba kata kunci lain atau ubah filternya.",
    },
    categories: {
      foodDrink: "Makanan & Minuman",
      transport: "Transportasi",
      shopping: "Belanja",
      groceries: "Kebutuhan Harian",
      health: "Kesehatan",
      entertainment: "Hiburan",
      education: "Pendidikan",
      debtRepayment: "Bayar Utang",
      moneyLent: "Uang Dipinjamkan",
      loanReceived: "Pinjaman Diterima",
      loanCollected: "Piutang Diterima",
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
    typeLabel: "Jenis transaksi",
    categoryLabel: "Kategori",
    categoryOptionalLabel: "Kategori (opsional)",
    categoryPlaceholder: "Pilih kategori",
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
    noteTooLong: "Catatan terlalu panjang",
    failed: "Transaksi gagal disimpan. Coba lagi.",
    categorySheet: {
      add: "Kategori baru",
      title: "Kategori baru",
      selectTitle: "Pilih kategori",
      searchPlaceholder: "Cari kategori",
      noResults: "Kategori tidak ditemukan.",
      back: "Kembali ke daftar",
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
  debts: {
    title: "Hutang & Piutang",
    tabs: {
      receivable: "Piutang",
      payable: "Hutang",
    },
    addReceivable: "Catat piutang",
    addPayable: "Catat hutang",
    totalOutstanding: "Total sisa",
    debtCount: "{{count}} catatan",
    overdueCount: "{{count}} lewat tempo",
    outstanding: "Sisa",
    total: "Total",
    paidOf: "Dibayar {{paid}} dari {{principal}}",
    recordPayment: "Catat pembayaran",
    statusOngoing: "Belum dibayar",
    statusPartial: "Dibayar sebagian",
    statusSettled: "Lunas",
    statusCancelled: "Dibatalkan",
    statusWrittenOff: "Dihapus buku",
    dueOn: "Jatuh tempo {{date}}",
    overdue: "Lewat jatuh tempo",
    pastDue: "Sudah lewat tanggalnya",
    settled: "Lunas",
    installmentStatus: {
      paid: "Lunas",
      partial: "Sebagian",
      overdue: "Telat",
      late: "Lewat tanggal",
      upcoming: "Akan datang",
      open: "Tanpa tempo",
    },
    actions: {
      menuLabel: "Aksi lain",
      edit: "Ubah cicilan",
      cancel: "Batalkan hutang",
      writeOff: "Hapus buku",
      delete: "Hapus hutang",
      deletePayment: "Hapus pembayaran",
    },
    emptyReceivableTitle: "Belum ada piutang",
    emptyReceivableDescription:
      "Catat uang yang kamu pinjamkan supaya tidak lupa siapa yang belum bayar.",
    emptyPayableTitle: "Belum ada hutang",
    emptyPayableDescription:
      "Catat cicilan dan pinjamanmu supaya jatuh temponya tidak pernah terlewat.",
    presets: {
      paylater: "Paylater / cicilan",
      "credit-card": "Kartu kredit",
      "bank-loan": "Pinjaman bank (KTA)",
      "asset-financing": "Kendaraan / properti",
      "personal-loan": "Pinjam dari orang",
      "personal-lending": "Pinjamkan ke orang",
    },
  },
  newDebt: {
    title: "Catat hutang",
    close: "Tutup",
    submit: "Simpan",
    failed: "Catatan gagal disimpan. Coba lagi.",

    directionLabel: "Jenis catatan",
    presetLabel: "Produk",
    presetPlaceholder: "Pilih produk (opsional)",
    presetSheetTitle: "Pilih produk",
    presetNone: "Tanpa produk",
    counterpartyLabel: "Pihak lawan",
    counterpartyPlaceholder: "Misalnya: Budi atau Bank ABC",
    counterpartyKindPerson: "Perorangan",
    counterpartyKindInstitution: "Lembaga",
    counterpartyRecent: "Pernah dipakai",
    titleLabel: "Judul",
    titlePlaceholder: "Misalnya: Cicilan laptop",
    principalLabel: "Nominal pokok",
    principalPlaceholder: "0",
    originDateLabel: "Tanggal transaksi",
    walletLabel: "Dompet (opsional)",
    walletHint: "Dipakai kalau uangnya benar-benar masuk atau keluar dompet.",
    noWallets: "Belum ada dompet",
    recordCashFlowLabel: "Catat sekalian ke arus kas",
    recordCashFlowHint:
      "Saldo dompet ikut berubah sebesar nominal pokok. Matikan kalau uangnya sudah tercatat.",
    noteLabel: "Catatan",
    notePlaceholder: "Untuk apa hutang ini?",

    planLabel: "Bayarnya bagaimana?",
    installmentAmountLabel: "Cicilan per bulan",
    installmentAmountPlaceholder: "0",
    installmentAmountHint:
      "Salin saja angka yang ditampilkan pemberi pinjaman. Bunganya kami hitung dari situ.",
    singleAmountLabel: "Nominal yang dibayar (opsional)",
    singleAmountHint: "Kosongkan kalau nominalnya sama dengan pokok.",
    customEnter: "Isi jadwal dari pemberi pinjaman",
    customExit: "Kembali ke jadwal biasa",
    interestRateAdvancedHint:
      "Isi hanya kalau utangnya memang dinyatakan dalam persen. Mengisi ini akan mengosongkan nominal cicilan di atas.",
    previewRateEquivalent: "≈ {{rate}}%/periode",
    installmentAmountRequired: "Nominal cicilan harus lebih dari nol",
    installmentAmountTooSmall: "Total cicilan ini belum menutup pokoknya",

    scheduleTypeOpen: "Tanpa jatuh tempo",
    scheduleTypeSingle: "Sekali bayar",
    scheduleTypeRecurring: "Cicilan",
    scheduleTypeCustom: "Atur manual",
    scheduleTypeOpenHint: "Dibayar kapan saja, tanpa tenggat. Tidak pernah ditandai telat.",
    dueDateLabel: "Jatuh tempo",
    firstDueLabel: "Cicilan pertama",
    intervalUnitLabel: "Satuan periode",
    intervalDay: "Hari",
    intervalWeek: "Minggu",
    intervalMonth: "Bulan",
    intervalCountLabel: "Setiap berapa periode",
    periodCountLabel: "Jumlah cicilan",
    dueDayLabel: "Tanggal jatuh tempo tiap bulan",
    dueDayPlaceholder: "Ikut tanggal cicilan pertama",
    dueDayHint:
      "Isi 31 dan tanggal 31 tetap dipakai: Februari menyesuaikan, Maret kembali ke 31.",
    advancedShow: "Pengaturan lanjutan",
    advancedHide: "Sembunyikan pengaturan lanjutan",
    interestRateLabel: "Bunga per periode (%)",
    interestMethodLabel: "Metode bunga",
    interestMethodNone: "Tanpa bunga",
    interestMethodFlat: "Flat (dari pokok awal)",
    interestMethodEffective: "Efektif (dari sisa pokok)",
    interestMethodManual: "Manual",
    graceDaysLabel: "Toleransi telat (hari)",
    reminderDaysLabel: "Ingatkan H- (hari)",
    roundingUnitLabel: "Pembulatan cicilan",

    customRowsLabel: "Daftar cicilan",
    customRowDate: "Tanggal",
    customRowAmount: "Nominal",
    customAddRow: "Tambah baris",
    customRemoveRow: "Hapus baris",
    customTotal: "Total {{amount}}",
    customDifference: "Selisih {{amount}} dari pokok",

    previewTitle: "Rincian cicilan",
    previewTotal: "Total tagihan",
    previewInterest: "Total bunga",
    previewMore: "+{{count}} cicilan lagi",
    previewNoDate: "Tanpa tanggal",
    previewEmpty: "Belum ada cicilan yang bisa ditampilkan.",

    principalRequired: "Nominal pokok wajib diisi",
    principalTooLarge: "Nominal terlalu besar",
    counterpartyRequired: "Pihak lawan wajib diisi",
    counterpartyTooLong: "Nama pihak lawan terlalu panjang",
    titleRequired: "Judul wajib diisi",
    titleTooLong: "Judul terlalu panjang",
    noteTooLong: "Catatan terlalu panjang",
    anchorDateRequired: "Tanggal wajib diisi",
    intervalCountInvalid: "Isi antara 1 sampai 99",
    periodCountInvalid: "Isi antara 1 sampai 600",
    dueDayInvalid: "Isi antara 1 sampai 31",
    interestRateInvalid: "Bunga tidak wajar",
    customRowsRequired: "Tambahkan minimal satu cicilan",
    customRowDateRequired: "Tanggal wajib diisi",
    customRowAmountRequired: "Nominal wajib diisi",
  },
  debtDetail: {
    title: "Rincian",
    back: "Kembali",
    notFound: "Catatan ini sudah tidak ada.",
    billed: "Total tagihan",
    paid: "Sudah dibayar",
    outstanding: "Sisa",
    progress: "{{paid}} dari {{billed}}",
    nextDue: "Jatuh tempo berikutnya {{date}}",
    noDueDate: "Tanpa jatuh tempo",
    overdueInstallments: "{{count}} cicilan lewat tempo",
    installmentsTitle: "Cicilan",
    installmentsEmpty: "Belum ada cicilan untuk catatan ini.",
    paymentsTitle: "Riwayat pembayaran",
    installmentOf: "Dibayar {{paid}} dari {{total}}",
    installmentModified: "Diubah dari {{date}}",
    paymentUnallocated: "{{amount}} belum dialokasikan",
    paymentMethod: {
      transfer: "Transfer",
      cash: "Tunai",
      autodebit: "Autodebit",
      other: "Lainnya",
      unspecified: "Tanpa metode",
    },
    recordPayment: "Catat pembayaran",
    confirm: {
      cancelTitle: "Batalkan catatan ini?",
      cancelMessage:
        "Statusnya jadi dibatalkan. Cicilan dan pembayarannya tetap tersimpan, dan kamu bisa mengaktifkannya lagi nanti.",
      cancelConfirm: "Batalkan",
      writeOffTitle: "Hapus buku catatan ini?",
      writeOffMessage:
        "Dipakai kalau uangnya dianggap tidak akan kembali. Riwayatnya tetap utuh, hanya tidak lagi dihitung sebagai sisa.",
      writeOffConfirm: "Hapus buku",
      deleteTitle: "Hapus {{title}}?",
      deleteMessage:
        "Catatan ini beserta jadwal dan cicilannya dihapus permanen. Belum ada pembayaran yang tercatat, jadi tidak ada riwayat yang hilang.",
      deleteConfirm: "Hapus",
      deleteBlocked:
        "Sudah ada pembayaran di catatan ini. Batalkan saja supaya riwayatnya tetap tersimpan.",
      deletePaymentTitle: "Hapus pembayaran ini?",
      deletePaymentMessage:
        "Alokasinya ikut terhapus dan transaksi arus kas yang menyertainya juga. Catatan yang tadinya lunas akan aktif kembali.",
      deletePaymentConfirm: "Hapus pembayaran",
      cancelAction: "Batal",
      failed: "Gagal diproses. Coba lagi.",
    },
    editInstallment: {
      title: "Ubah cicilan #{{sequence}}",
      dateLabel: "Jatuh tempo",
      amountLabel: "Total tagihan",
      noteLabel: "Catatan",
      notePlaceholder: "Misalnya: kena denda telat",
      save: "Simpan perubahan",
      amountRequired: "Nominal wajib diisi",
      belowPaid: "Tidak boleh di bawah {{amount}} yang sudah dibayar",
      noteTooLong: "Catatan terlalu panjang",
      failed: "Perubahan gagal disimpan. Coba lagi.",
    },
  },
  newPayment: {
    title: "Catat pembayaran",
    close: "Tutup",
    notFound: "Catatan ini sudah tidak ada.",
    outstandingPayable: "Sisa hutangmu",
    outstandingReceivable: "Sisa piutang dari {{name}}",
    amountLabel: "Nominal dibayar",
    amountPlaceholder: "0",
    amountRequired: "Nominal wajib diisi",
    amountTooLarge: "Nominal terlalu besar",
    dueTitle: "Tagihan sekarang",
    dueInstallment: "Cicilan #{{sequence}}",
    dueOn: "Jatuh tempo {{date}}",
    dueNoDate: "Tanpa tanggal jatuh tempo",
    dueArrears: "Tunggakan {{count}} cicilan · {{amount}}",
    dueProgress: "{{paid}} dari {{count}} cicilan lunas",
    duePerPeriod: "Cicilan per periode {{amount}}",
    pickDueNow: "Jatuh tempo {{amount}}",
    pickOneInstallment: "1 cicilan {{amount}}",
    pickSettle: "Lunasi {{amount}}",
    dateLabel: "Tanggal bayar",
    walletLabelPayable: "Uang keluar dari (opsional)",
    walletLabelReceivable: "Uang masuk ke (opsional)",
    walletHint: "Kosongkan kalau uangnya tidak lewat dompet yang tercatat.",
    noWallets: "Belum ada dompet",
    methodLabel: "Metode",
    methodUnspecified: "Tidak disebut",
    cashFlowLabel: "Catat sekalian ke arus kas",
    cashFlowHint: "Saldo dompet ikut berubah sebesar nominal di atas.",
    noteLabel: "Catatan",
    notePlaceholder: "Misalnya: dibayar tunai",
    noteTooLong: "Catatan terlalu panjang",
    allocationTitle: "Alokasi",
    covers: "Menutup cicilan {{sequences}}",
    coversNone: "Belum menutup cicilan mana pun.",
    allocated: "Teralokasi {{amount}}",
    unallocated: "{{amount}} tidak masuk ke cicilan mana pun",
    manualToggle: "Atur alokasi sendiri",
    manualHint: "Isi nominal per cicilan. Kosongkan untuk melewatinya.",
    manualReset: "Kembali ke otomatis",
    manualRemaining: "Sisa {{amount}}",
    errorNonPositive: "Nominal alokasi harus lebih dari nol",
    errorExceedsPayment: "Total alokasi melebihi nominal pembayaran",
    errorUnknownInstallment: "Ada alokasi ke cicilan yang tidak dikenal",
    errorOverpaid: "Cicilan #{{sequence}} jadi kelebihan bayar",
    errorDuplicate: "Satu cicilan dialokasikan dua kali",
    errorNoAllocation: "Isi minimal satu alokasi",
    willSettle: "Pembayaran ini melunasi catatan.",
    willRemain: "Sisa {{amount}} setelah pembayaran ini.",
    submit: "Simpan pembayaran",
    failed: "Pembayaran gagal disimpan. Coba lagi.",
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
  backup: {
    title: "Cadangkan & Pulihkan",
    subtitle:
      "Semua datamu tersimpan di perangkat ini saja. Buat cadangan agar tidak hilang.",
    open: "Cadangkan & Pulihkan",
    drive: {
      section: "Google Drive",
      description:
        "Cadangan disimpan di folder MyWallet Backups di Drive milikmu sendiri.",
      unavailable:
        "Google Drive belum dikonfigurasi di aplikasi ini. Gunakan cadangan berkas di bawah.",
      missingModule:
        "Google Drive belum tersedia di binary ini. Jalankan ulang build (npx expo run:android). Cadangan berkas di bawah tetap bisa dipakai.",
      signIn: "Hubungkan Google Drive",
      signOut: "Putuskan",
      signedInAs: "Terhubung sebagai {{email}}",
      backUpNow: "Cadangkan sekarang",
      lastBackup: "Terakhir dicadangkan {{time}}",
      backupsTitle: "Cadangan di Drive",
      empty: "Belum ada cadangan",
      emptyHint: "Cadangan yang kamu buat akan muncul di sini.",
      restore: "Pulihkan",
      refresh: "Muat ulang",
    },
    file: {
      section: "Berkas",
      description:
        "Simpan satu berkas cadangan ke mana pun, lalu pulihkan dari berkas itu.",
      export: "Simpan ke berkas",
      import: "Pulihkan dari berkas",
    },
    confirm: {
      title: "Ganti semua data?",
      message:
        "Seluruh dompet, transaksi, hutang dan piutang di perangkat ini akan dihapus dan diganti dengan isi cadangan. Tindakan ini tidak bisa dibatalkan.",
      summary: "Cadangan {{date}} · {{count}} baris",
      typePrompt: "Ketik {{keyword}} untuk melanjutkan",
      keyword: "PULIHKAN",
      cancel: "Batal",
      submit: "Pulihkan",
    },
    done: {
      uploaded: "Cadangan tersimpan ke Drive.",
      exported: "Cadangan siap dibagikan.",
      restored: "Data berhasil dipulihkan.",
      snapshot: "Data sebelumnya disalin ke {{uri}}",
    },
    errors: {
      signIn: "Gagal terhubung ke Google. Coba lagi.",
      backup: "Gagal membuat cadangan. Coba lagi.",
      restore: "Gagal memulihkan data. Coba lagi.",
      list: "Gagal memuat daftar cadangan. Coba lagi.",
      unknownFormat: "Berkas ini bukan cadangan MyWallet.",
      futureFormat:
        "Cadangan ini dibuat oleh versi aplikasi yang lebih baru. Perbarui aplikasi lebih dulu.",
      futureSchema:
        "Cadangan ini dibuat oleh versi aplikasi yang lebih baru. Perbarui aplikasi lebih dulu.",
      corrupt: "Berkas cadangan rusak atau tidak lengkap.",
      unauthorized:
        "Akses Google Drive ditolak. Hubungkan ulang akunmu lalu coba lagi.",
    },
  },
  common: {
    migrationFailed: "Migrasi database gagal",
    undo: "Urungkan",
  },
};
