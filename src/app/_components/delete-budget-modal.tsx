"use client";

import { removeBudget } from "@/lib/actions/set-budget";
import { SpendingCategory } from "@/lib/starling-types";
import { Budget } from "@prisma/client";
import ConfirmationModal from "./confirmation-modal";

export type BudgetWithOverride = Budget & { isOverride?: boolean };

const formatCategory = (category: string) =>
  category
    .toLocaleLowerCase()
    .replaceAll("_", " ")
    .split(" ")
    .map((word) => word.charAt(0).toLocaleUpperCase() + word.slice(1))
    .join(" ");

interface Props {
  isOpen: boolean;
  onClose: () => void;
  budget: BudgetWithOverride;
  onDeleted?: () => void;
}

export const DeleteBudgetModal = ({
  isOpen,
  onClose,
  budget,
  onDeleted,
}: Props) => {
  const onConfirm = async () => {
    await removeBudget({
      category: budget.category as SpendingCategory,
      date: new Date(budget.date),
      isOverride: !!budget.isOverride,
    });
    onDeleted?.();
  };

  const categoryName = formatCategory(budget.category);

  return (
    <ConfirmationModal
      isOpen={isOpen}
      onClose={onClose}
      title="Delete Budget?"
      description={
        budget.isOverride
          ? `Delete the one-month override for ${categoryName} in ${new Date(budget.date).toLocaleDateString(undefined, { month: "long", year: "numeric" })}? The recurring budget will apply again for that month.`
          : `Delete the recurring ${categoryName} budget starting ${new Date(budget.date).toLocaleDateString(undefined, { month: "long", year: "numeric" })}? Later months will use the previous budget until another change takes effect.`
      }
      confirmLabel="Delete Budget"
      onConfirm={onConfirm}
      danger
    />
  );
};

export default DeleteBudgetModal;
