import type { Translation } from "./id";

// EN mengikuti bentuk yang sama persis dengan ID agar type-safe.
export const en: Translation = {
  onboarding: {
    title: "All your assets,\none summary.",
    subtitle:
      "Wallets, income, expenses, debts & receivables — calculated automatically.",
    continueGoogle: "Continue with Google",
    guest: "Continue as Guest",
    guestNote: "Guest data is stored on this device only.",
    nameModal: {
      title: "What's your name?",
      description: "This name is used to greet you across the app.",
      placeholder: "Enter your name",
      submit: "Continue",
      cancel: "Cancel",
      required: "Name is required",
    },
  },
  home: {
    greeting: "Hi, {{name}}",
    totalAssets: "Total Assets",
    allWallets: "All your wallets",
    actions: {
      add: "Add",
      transfer: "Transfer",
      debts: "Debts",
      wallets: "Wallets",
    },
  },
  tabs: {
    home: "Home",
    transactions: "Transactions",
    debts: "Debts",
    settings: "Settings",
  },
};
