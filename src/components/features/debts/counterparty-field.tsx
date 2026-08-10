import { useTranslation } from "react-i18next";
import { Pressable, ScrollView, Text, View } from "react-native";

import { TextField } from "@/components/ui/text-field";
import { COUNTERPARTY_KINDS, type CounterpartyKind } from "@/db";
import { useCounterparties } from "@/hooks/features/debts/use-counterparties";
import { cn } from "@/utils/cn";

type CounterpartyFieldProps = {
  name: string;
  kind: CounterpartyKind;
  selectedId: number | null;
  error?: string | null;
  onChangeName: (value: string) => void;
  onSelect: (id: number | null, name: string, kind: CounterpartyKind) => void;
};

const KIND_LABEL_KEYS = {
  person: "newDebt.counterpartyKindPerson",
  institution: "newDebt.counterpartyKindInstitution",
} as const;

/**
 * Who the debt is with: a kind toggle, a name, and the parties already on file.
 *
 * The chips matter more than they look. Typing "Budi" a second time would
 * create a second Budi, and the per-party totals would quietly split in half
 * with nothing on screen explaining why. Tapping a chip reuses the existing
 * row; typing over the name drops back to find-or-create.
 *
 * The kind is not a rule either — it only decides the icon and, in the list,
 * whether a missed date is worth alarming about.
 */
export function CounterpartyField({
  name,
  kind,
  selectedId,
  error,
  onChangeName,
  onSelect,
}: CounterpartyFieldProps) {
  const { t } = useTranslation();
  const { counterparties } = useCounterparties(kind);

  return (
    <View className="flex-col gap-2">
      <View className="flex-row items-center gap-2">
        {COUNTERPARTY_KINDS.map((option) => {
          const isActive = option === kind;
          return (
            <Pressable
              key={option}
              accessibilityRole="button"
              accessibilityState={{ selected: isActive }}
              // Switching kind drops the picked party: a person and an
              // institution are different rows even under the same name.
              onPress={() => onSelect(null, name, option)}
              className={cn(
                "flex-1 flex-row items-center justify-center rounded-full border px-3 py-2",
                isActive ? "border-primary bg-primary" : "border-line bg-surface",
              )}
            >
              <Text
                className={cn(
                  "text-sm font-semibold",
                  isActive ? "text-primary-fg" : "text-fg-muted",
                )}
              >
                {t(KIND_LABEL_KEYS[option])}
              </Text>
            </Pressable>
          );
        })}
      </View>

      <TextField
        label={t("newDebt.counterpartyLabel")}
        placeholder={t("newDebt.counterpartyPlaceholder")}
        value={name}
        onChangeText={onChangeName}
        error={error}
        maxLength={80}
        autoCapitalize="words"
      />

      {counterparties.length > 0 ? (
        <View className="flex-col gap-1.5">
          <Text className="text-xs text-fg-muted">
            {t("newDebt.counterpartyRecent")}
          </Text>

          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ gap: 8 }}
          >
            {counterparties.map((counterparty) => {
              const isActive = counterparty.id === selectedId;
              return (
                <Pressable
                  key={counterparty.id}
                  accessibilityRole="button"
                  accessibilityState={{ selected: isActive }}
                  onPress={() =>
                    onSelect(counterparty.id, counterparty.name, kind)
                  }
                  className={cn(
                    "rounded-full border px-3 py-2",
                    isActive
                      ? "border-primary bg-primary-soft"
                      : "border-line bg-elevated",
                  )}
                >
                  <Text
                    className={cn(
                      "text-sm",
                      isActive ? "font-semibold text-primary" : "text-fg",
                    )}
                  >
                    {counterparty.name}
                  </Text>
                </Pressable>
              );
            })}
          </ScrollView>
        </View>
      ) : null}
    </View>
  );
}
