import "i18next";

import type { id } from "./locales/id";

// Makes t() keys typed — autocomplete plus a compile error on a typo.
declare module "i18next" {
  interface CustomTypeOptions {
    defaultNS: "translation";
    resources: {
      translation: typeof id;
    };
  }
}
