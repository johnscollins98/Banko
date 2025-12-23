"use client";

import { removeBudget, setBudget } from "@/lib/actions/set-budget";
import { SPENDING_CATEGORIES, SpendingCategory } from "@/lib/starling-types";
import { Autocomplete, AutocompleteItem } from "@heroui/autocomplete";
import { Button } from "@heroui/button";
import { Checkbox } from "@heroui/checkbox";
import { Input } from "@heroui/input";
import {
  Modal,
  ModalBody,
  ModalContent,
  ModalFooter,
  ModalHeader,
} from "@heroui/modal";
import { Select, SelectItem } from "@heroui/react";
import { Budget } from "@prisma/client";
import {
  FormEventHandler,
  startTransition,
  useOptimistic,
  useState,
} from "react";

export interface Props {
  budgets: (Budget & { isOverride?: boolean })[];
  filterBy: string | null;
  startDate: Date;
}

const formatCategoryString = (c: string) => {
  return c
    .toLocaleLowerCase()
    .replaceAll("_", " ")
    .split(" ")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
};

export const BudgetForm = ({ budgets, filterBy, startDate }: Props) => {
  const category = (filterBy as SpendingCategory) || "total";
  const existingBudget = budgets.find((b) => b.category === category);
  const categoryString = formatCategoryString(category);

  const [submitPending, setSubmitPending] = useOptimistic(false);
  const [deletePending, setDeletePending] = useOptimistic(false);

  const [budgetModalOpen, setBudgetModalOpen] = useState(false);
  const [removeWarningOpen, setRemoveWarningOpen] = useState(false);
  const [amount, setAmount] = useState<string | null>(null);
  const [selectedCategory, setSelectedCategory] =
    useState<SpendingCategory | null>(null);

  const [singleMonthOnly, setSingleMonthOnly] = useState<null | boolean>(null);

  const formSingleMonthOnly =
    singleMonthOnly ?? existingBudget?.isOverride ?? false;

  const [direction, setDirection] = useState<string | null>(null);

  const formCategory = selectedCategory ?? category;
  const formAmount =
    amount ??
    (existingBudget?.amount
      ? Math.abs(existingBudget?.amount ?? 0).toString()
      : "");
  const formDirection =
    direction ?? ((existingBudget?.amount ?? 0) > 0 ? "income" : "expense");

  const onClose = () => {
    setBudgetModalOpen(false);
    setAmount(null);
    setDirection(null);
    setSelectedCategory(null);
    setSingleMonthOnly(null);
  };

  const setBudgetSubmitHandler: FormEventHandler<HTMLFormElement> = (e) => {
    e.preventDefault();
    e.stopPropagation();

    startTransition(async () => {
      setSubmitPending(true);
      const multiplier = formDirection === "income" ? 1 : -1;
      await setBudget({
        amount: parseFloat(formAmount) * multiplier,
        category: formCategory,
        date: formSingleMonthOnly ? startDate : undefined,
      });

      onClose();
    });
  };

  const onRemoveBudget = async () => {
    startTransition(async () => {
      setDeletePending(true);
      await removeBudget({
        category,
        date: startDate,
      });
      setRemoveWarningOpen(false);
    });
  };

  return (
    <>
      <div className="flex items-center justify-end gap-2">
        {existingBudget && (
          <Button onPress={() => setRemoveWarningOpen(true)}>
            {existingBudget?.isOverride ? "Use Default" : "Remove"} Budget
          </Button>
        )}
        <Button onPress={() => setBudgetModalOpen(true)}>
          {existingBudget ? "Update" : "Add"} Budget
        </Button>
      </div>
      <Modal isOpen={removeWarningOpen} onClose={onClose}>
        <ModalContent>
          <ModalHeader>
            {existingBudget?.isOverride ? "Use Default" : "Remove"} Budget
          </ModalHeader>
          <ModalBody>
            Are you sure you want to{" "}
            {existingBudget?.isOverride ? "use the default" : "remove the"}{" "}
            budget for &quot;
            {categoryString}&quot;
            {existingBudget?.isOverride && " in this month"}?
          </ModalBody>
          <ModalFooter>
            <div className="flex items-center justify-end gap-1">
              <Button onPress={() => setRemoveWarningOpen(false)}>No</Button>
              <Button
                color="danger"
                onPress={onRemoveBudget}
                isDisabled={deletePending}
                isLoading={deletePending}
              >
                Yes
              </Button>
            </div>
          </ModalFooter>
        </ModalContent>
      </Modal>
      <Modal isOpen={budgetModalOpen} onClose={() => setBudgetModalOpen(false)}>
        <ModalContent>
          <form
            onSubmit={setBudgetSubmitHandler}
            onReset={() => setBudgetModalOpen(false)}
          >
            <ModalHeader>
              Set Budget for &quot;{categoryString}&quot;
            </ModalHeader>
            <ModalBody>
              <div className="flex flex-col gap-3">
                <div className="flex items-center gap-1">
                  £
                  <Input
                    value={formAmount}
                    onChange={(e) => setAmount(e.target.value)}
                    isRequired
                    required
                    validate={(v) => {
                      const vFloat = parseFloat(v);
                      if (isNaN(vFloat)) {
                        return "Must be a number.";
                      }
                      if (parseFloat(v) <= 0) {
                        return "Must be a positive number.";
                      }
                    }}
                    size="lg"
                    label="Amount"
                  />
                </div>
                <Select
                  label="Direction"
                  selectedKeys={[formDirection]}
                  onChange={(e) => setDirection(e.target.value)}
                  required
                  isRequired
                >
                  <SelectItem key="income">Income</SelectItem>
                  <SelectItem key="expense">Expense</SelectItem>
                </Select>
                <Autocomplete
                  label="Category"
                  required
                  isRequired
                  size="lg"
                  selectedKey={formCategory}
                  defaultItems={[...SPENDING_CATEGORIES, "total"].map((c) => ({
                    label: formatCategoryString(c),
                    value: c,
                  }))}
                  onSelectionChange={(v) =>
                    setSelectedCategory(v as SpendingCategory)
                  }
                >
                  {(item) => (
                    <AutocompleteItem key={item.value}>
                      {item.label}
                    </AutocompleteItem>
                  )}
                </Autocomplete>
                <div className="flex gap-2">
                  <label htmlFor="single-month">
                    Override for this month only:
                  </label>
                  <Checkbox
                    name="single-month"
                    id="single-month"
                    isSelected={formSingleMonthOnly}
                    onValueChange={setSingleMonthOnly}
                  />
                </div>
              </div>
            </ModalBody>
            <ModalFooter>
              <Button type="reset">Cancel</Button>
              <Button
                type="submit"
                color="primary"
                isDisabled={submitPending}
                isLoading={submitPending}
              >
                Submit
              </Button>
            </ModalFooter>
          </form>
        </ModalContent>
      </Modal>
    </>
  );
};
