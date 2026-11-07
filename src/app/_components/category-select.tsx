"use client";

import { SPENDING_CATEGORIES } from "@/lib/starling-types";
import { Autocomplete, AutocompleteItem } from "@heroui/autocomplete";
import { useRouter } from "next/navigation";

export const formatCategoryString = (c: string) =>
  c
    .toLocaleLowerCase()
    .replaceAll("_", " ")
    .split(" ")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");

export const CategorySelect = ({
  value,
  className = "mb-4",
  compact = false,
}: {
  value?: string;
  className?: string;
  compact?: boolean;
}) => {
  const router = useRouter();

  const options = [...SPENDING_CATEGORIES, "total"];

  return (
    <div className={className}>
      <Autocomplete
        label="Category"
        size={compact ? "sm" : "lg"}
        variant={compact ? "flat" : "bordered"}
        classNames={
          compact
            ? {
                base: "[&_[data-slot=input-wrapper]]:!bg-transparent [&_[data-slot=input-wrapper]]:!shadow-none [&_[data-slot=input-wrapper]]:!border-0 [&_[data-slot=input]]:!text-foreground",
              }
            : undefined
        }
        selectedKey={value ?? "total"}
        defaultItems={options.map((c) => ({
          label: formatCategoryString(c),
          value: c,
        }))}
        onSelectionChange={(v) => {
          const val = v as string;
          router.push(`/budgets?category=${val}`);
        }}
      >
        {(item) => (
          <AutocompleteItem key={item.value}>{item.label}</AutocompleteItem>
        )}
      </Autocomplete>
    </div>
  );
};

export default CategorySelect;
