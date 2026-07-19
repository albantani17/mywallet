export type Translation = {
  onboarding: {
    title: string;
    subtitle: string;
    continueGoogle: string;
    guest: string;
    guestNote: string;
    nameModal: {
      title: string;
      description: string;
      placeholder: string;
      submit: string;
      cancel: string;
      required: string;
    };
  };
  home: {
    greeting: string;
  };
};

export const id: Translation = {
  onboarding: {
    title: "Semua asetmu,\nsatu ringkasan.",
    subtitle:
      "Wallet, pemasukan, pengeluaran, hutang & piutang — terhitung otomatis.",
    continueGoogle: "Lanjut dengan Google",
    guest: "Masuk sebagai Tamu",
    guestNote: "Data tamu tersimpan di perangkat ini saja.",
    nameModal: {
      title: "Siapa nama kamu?",
      description: "Nama ini dipakai untuk menyapa kamu di aplikasi.",
      placeholder: "Masukkan nama kamu",
      submit: "Lanjut",
      cancel: "Batal",
      required: "Nama wajib diisi",
    },
  },
  home: {
    greeting: "Halo, {{name}} 👋",
  },
};
