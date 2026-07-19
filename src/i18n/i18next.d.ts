import "i18next";

import type { id } from "./locales/id";

// Membuat key t() bertipe (autocomplete + pengecekan key).
declare module "i18next" {
  interface CustomTypeOptions {
    defaultNS: "translation";
    resources: {
      translation: typeof id;
    };
  }
}
