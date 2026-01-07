"use client";

import { formatAsGBP } from "@/lib/currency-format";
import { Button } from "@heroui/button";
import { Budget } from "@prisma/client";
import { useState } from "react";
import { HiOutlinePencilAlt, HiOutlineTrash } from "react-icons/hi";
import DateDisplay from "./date";
import DeleteBudgetModal from "./delete-budget-modal";
import EditBudgetModal from "./edit-budget-modal";

export type BudgetWithOverride = Budget & { isOverride?: boolean };

export const BudgetItem = ({ budget }: { budget: BudgetWithOverride }) => {
  const [removeWarningOpen, setRemoveWarningOpen] = useState(false);
  const [removed, setRemoved] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [localAmount, setLocalAmount] = useState<number>(budget.amount);

  const onRemoveBudget = () => {
    setRemoved(true);
  };

  if (removed) return null;

  return (
    <>
      <div
        className={`flex items-center justify-between rounded p-3 transition-colors duration-100 hover:bg-foreground-50`}
      >
        <div className="flex flex-col items-start gap-1">
          <div
            className={`font-bold ${localAmount > 0 ? "text-blue-600 dark:text-blue-400" : ""}`}
          >
            {formatAsGBP(localAmount)}
          </div>
          <span className="flex gap-1 text-sm font-normal">
            <DateDisplay
              date={new Date(budget.date)}
              options={{ day: "numeric", month: "short", year: "numeric" }}
            />{" "}
            <span className="text-red-500">
              {budget.isOverride ? "(Override)" : ""}
            </span>
          </span>
        </div>
        <div className="flex items-center gap-1">
          <Button
            variant="light"
            isIconOnly
            size="sm"
            onPress={() => setEditOpen(true)}
            aria-label={`Edit budget ${budget.category} ${new Date(
              budget.date,
            ).toDateString()}`}
            title="Edit"
          >
            <HiOutlinePencilAlt size={16} />
          </Button>
          <Button
            variant="light"
            isIconOnly
            size="sm"
            color="danger"
            onPress={() => setRemoveWarningOpen(true)}
            aria-label={`Delete budget ${budget.category} ${new Date(
              budget.date,
            ).toDateString()}`}
            title="Delete"
          >
            <HiOutlineTrash size={16} />
          </Button>
        </div>
      </div>

      <DeleteBudgetModal
        isOpen={removeWarningOpen}
        onClose={() => setRemoveWarningOpen(false)}
        budget={budget}
        onDeleted={onRemoveBudget}
        key={`deletebudget-${budget.id}`}
      />
      <EditBudgetModal
        isOpen={editOpen}
        onClose={() => setEditOpen(false)}
        budget={budget}
        onSaved={(newAmount) => setLocalAmount(newAmount)}
        key={`editbudget-${budget.id}`}
      />
    </>
  );
};

export default BudgetItem;
