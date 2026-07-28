import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";

import { currentLocale, setLocale, type AppLocale } from "@/i18n";

/**
 * The active language as real React state.
 *
 * Reading `currentLocale()` straight in a render is not enough: it is plain
 * module state, so with the React Compiler enabled (app.json →
 * experiments.reactCompiler) a component with no other reactive input gets its
 * JSX memoized and never recomputes. Components that call `t()` happen to
 * survive because `t` changes identity, but anything that only *reads* the
 * locale needs a tracked value — which is what this state is.
 */
export function useActiveLocale() {
  const { i18n } = useTranslation();
  const [locale, setLocaleState] = useState<AppLocale>(currentLocale);

  useEffect(() => {
    const sync = () => setLocaleState(currentLocale());

    i18n.on("languageChanged", sync);
    // Covers a change that landed between the first render and this subscribe.
    sync();

    return () => {
      i18n.off("languageChanged", sync);
    };
  }, [i18n]);

  return { locale, setLocale };
}
