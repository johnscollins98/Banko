"use client";

import { setBudget } from "@/lib/actions/set-budget";
import { SpendingCategory } from "@/lib/starling-types";
import { Button } from "@heroui/button";
import { Input } from "@heroui/input";
import {
  ModalBody,
  ModalContent,
  ModalFooter,
  ModalHeader,
} from "@heroui/modal";
import { Select, SelectItem } from "@heroui/react";
import { Budget } from "@prisma/client";
import { FormEvent, useState, useTransition } from "react";
import SafeModal from "./safe-modal";

export type BudgetWithOverride = Budget & { isOverride?: boolean };

interface Props {
  isOpen: boolean;
  onClose: () => void;
  budget: BudgetWithOverride;
  onSaved?: (newAmount: number) => void;
}

export const EditBudgetModal = ({
  isOpen,
  onClose,
  budget,
  onSaved,
}: Props) => {
  const [pending, startTransition] = useTransition();
  const [amountStr, setAmountStr] = useState<string | null>(null);
  const [direction, setDirection] = useState<"income" | "expense" | null>(null);

  const handleClose = () => {
    setAmountStr(null);
    setDirection(null);
    onClose();
  };

  const formString = amountStr ?? Math.abs(budget.amount).toString();
  const formDirection =
    direction ?? (budget.amount >= 0 ? "income" : "expense");

  const onSave = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    e.stopPropagation();

    startTransition(async () => {
      const parsed = parseFloat(formString);
      if (isNaN(parsed)) return;
      const amount = parsed * (formDirection === "income" ? 1 : -1);
      await setBudget({
        amount,
        category: budget.category as SpendingCategory,
        date: new Date(budget.date),
        isOverride: !!budget.isOverride,
      });
      onSaved?.(amount);
      handleClose();
    });
  };

  return (
    <SafeModal isOpen={isOpen} onClose={handleClose}>
      <ModalContent>
        <ModalHeader>Edit Budget</ModalHeader>
        <form onSubmit={onSave}>
          <ModalBody>
            <div className="flex flex-col gap-3">
              <div className="flex items-center gap-1">
                £
                <Input
                  value={formString}
                  onChange={(e) => setAmountStr(e.target.value)}
                  size="lg"
                  label="Amount"
                />
              </div>
              <Select
                label="Direction"
                selectedKeys={[formDirection]}
                onChange={(e) =>
                  setDirection(e.target.value as "income" | "expense")
                }
              >
                <SelectItem key="income">Income</SelectItem>
                <SelectItem key="expense">Expense</SelectItem>
              </Select>
            </div>
          </ModalBody>
          <ModalFooter>
            <div className="flex items-center justify-end gap-1">
              <Button onPress={handleClose}>Cancel</Button>
              <Button
                color="primary"
                isDisabled={pending}
                isLoading={pending}
                type="submit"
              >
                Save
              </Button>
            </div>
          </ModalFooter>
        </form>
      </ModalContent>
    </SafeModal>
  );
};

export default EditBudgetModal;
