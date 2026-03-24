"use client";

import { removeBudget } from "@/lib/actions/set-budget";
import { SpendingCategory } from "@/lib/starling-types";
import { Button } from "@heroui/button";
import {
  ModalBody,
  ModalContent,
  ModalFooter,
  ModalHeader,
} from "@heroui/modal";
import { Budget } from "@prisma/client";
import { useTransition } from "react";
import SafeModal from "./safe-modal";

export type BudgetWithOverride = Budget & { isOverride?: boolean };

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
  const [deletePending, startTransition] = useTransition();

  const onConfirm = async () => {
    startTransition(async () => {
      await removeBudget({
        category: budget.category as SpendingCategory,
        date: new Date(budget.date),
        isOverride: !!budget.isOverride,
      });
      onDeleted?.();
      onClose();
    });
  };

  return (
    <SafeModal isOpen={isOpen} onClose={onClose}>
      <ModalContent>
        <ModalHeader>Delete Budget</ModalHeader>
        <ModalBody>
          <div>
            Are you sure you want to delete the budget for{" "}
            <b>{budget.category}</b> {budget.isOverride ? "for" : "starting"}{" "}
            <b>{new Date(budget.date).toDateString()}</b>?
          </div>
        </ModalBody>
        <ModalFooter>
          <div className="flex items-center justify-end gap-1">
            <Button onPress={onClose}>No</Button>
            <Button
              color="danger"
              onPress={onConfirm}
              isDisabled={deletePending}
              isLoading={deletePending}
            >
              Yes
            </Button>
          </div>
        </ModalFooter>
      </ModalContent>
    </SafeModal>
  );
};

export default DeleteBudgetModal;
