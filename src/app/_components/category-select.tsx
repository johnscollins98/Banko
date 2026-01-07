"use client";

import { SPENDING_CATEGORIES } from "@/lib/starling-types";
import { Autocomplete, AutocompleteItem } from "@heroui/autocomplete";
import { useRouter } from "next/navigation";

const formatCategoryString = (c: string) =>
  c
    .toLocaleLowerCase()
    .replaceAll("_", " ")
    .split(" ")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");

export const CategorySelect = ({ value }: { value?: string }) => {
  const router = useRouter();

  const options = [...SPENDING_CATEGORIES, "total"];

  return (
    <div className="mb-4">
      <Autocomplete
        label="Category"
        size="lg"
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
