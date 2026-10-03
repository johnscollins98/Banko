"use client";

import {
  removeAllBudgetsForCategory,
  removeBudget,
  setBudget,
} from "@/lib/actions/set-budget";
import { SPENDING_CATEGORIES, SpendingCategory } from "@/lib/starling-types";
import { Autocomplete, AutocompleteItem } from "@heroui/autocomplete";
import { Button } from "@heroui/button";
import { Checkbox } from "@heroui/checkbox";
import { Divider } from "@heroui/divider";
import {
  Dropdown,
  DropdownItem,
  DropdownMenu,
  DropdownTrigger,
} from "@heroui/dropdown";
import { Input } from "@heroui/input";
import {
  ModalBody,
  ModalContent,
  ModalFooter,
  ModalHeader,
} from "@heroui/modal";
import { Select, SelectItem } from "@heroui/react";
import { Budget } from "@prisma/client";
import { useRouter } from "next/navigation";
import {
  FormEventHandler,
  startTransition,
  useOptimistic,
  useState,
} from "react";
import {
  HiOutlineArrowUturnLeft,
  HiOutlineBanknotes,
  HiOutlinePencilSquare,
  HiOutlineTrash,
  HiOutlineWrenchScrewdriver,
  HiOutlineXMark,
} from "react-icons/hi2";
import ConfirmationModal from "./confirmation-modal";
import SafeModal from "./safe-modal";

export interface Props {
  budgets: (Budget & { isOverride?: boolean })[];
  previousBudgets: Budget[];
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

export const BudgetForm = ({
  budgets,
  previousBudgets,
  filterBy,
  startDate,
}: Props) => {
  const router = useRouter();
  const category = (filterBy as SpendingCategory) || "total";
  const existingBudget = budgets.find((b) => b.category === category);
  const budgetStartsThisMonth =
    existingBudget &&
    new Date(existingBudget.date).getTime() === new Date(startDate).getTime();
  const previousBudget = previousBudgets.find(
    (b) =>
      b.category === category &&
      (!existingBudget ||
        new Date(b.date).getTime() < new Date(existingBudget.date).getTime()),
  );
  const categoryString = formatCategoryString(category);

  const [submitPending, setSubmitPending] = useOptimistic(false);

  const [budgetModalOpen, setBudgetModalOpen] = useState(false);
  const [removeWarningOpen, setRemoveWarningOpen] = useState(false);
  const [revertPreviousOpen, setRevertPreviousOpen] = useState(false);
  const [removeCurrentOpen, setRemoveCurrentOpen] = useState(false);
  const [removeAllWarningOpen, setRemoveAllWarningOpen] = useState(false);
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

  const currentAmountLabel = existingBudget
    ? `${existingBudget.amount < 0 ? "−" : ""}£${Math.abs(existingBudget.amount).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
    : "No budget";
  const previousAmountLabel = previousBudget
    ? `${previousBudget.amount < 0 ? "−" : ""}£${Math.abs(previousBudget.amount).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
    : "";

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
        date: startDate,
        isOverride: formSingleMonthOnly,
      });

      onClose();
    });
  };

  const onRemoveBudget = async () => {
    await removeBudget({
      category,
      date: startDate,
      isOverride: formSingleMonthOnly,
    });
    router.refresh();
  };

  const onRemoveAllBudgets = async () => {
    await removeAllBudgetsForCategory({ category });
    router.refresh();
  };

  const onRemoveCurrentRecurringBudget = async () => {
    await removeBudget({ category, date: startDate, isOverride: false });
    router.refresh();
  };

  return (
    <>
      <Dropdown placement="top-start">
        <DropdownTrigger>
          <Button startContent={<HiOutlineBanknotes size={18} />}>
            Budgets
          </Button>
        </DropdownTrigger>
        <DropdownMenu>
          <DropdownItem
            key="current"
            isReadOnly
            className="cursor-default opacity-100"
          >
            <div className="flex flex-col gap-0.5 py-1">
              <span className="text-xs text-default-500">
                Current {categoryString} Budget
              </span>
              <span className="font-semibold text-foreground">
                {currentAmountLabel}
              </span>
              {existingBudget ? (
                <span className="text-xs text-default-500">
                  {existingBudget.isOverride
                    ? "One-Month Override"
                    : "Recurring From "}
                  {!existingBudget.isOverride &&
                    new Date(existingBudget.date).toLocaleDateString(
                      undefined,
                      { month: "short", year: "numeric" },
                    )}
                </span>
              ) : null}
            </div>
          </DropdownItem>
          <DropdownItem
            key="divider"
            isReadOnly
            className="h-2 cursor-default p-0 opacity-100"
          >
            <Divider />
          </DropdownItem>
          <DropdownItem
            key="update"
            onPress={() => {
              setAmount(
                existingBudget
                  ? Math.abs(existingBudget.amount).toString()
                  : "",
              );
              setBudgetModalOpen(true);
            }}
            textValue="Update Budget From This Month"
          >
            <div className="flex w-full items-center gap-3">
              <HiOutlinePencilSquare className="shrink-0" size={18} />
              <div className="flex flex-col">
                <span>Update Budget From This Month</span>
                <span className="text-xs text-default-500">
                  Set a new amount that carries forward.
                </span>
              </div>
            </div>
          </DropdownItem>
          <DropdownItem
            key="zero"
            onPress={() => {
              startTransition(async () => {
                setSubmitPending(true);
                await setBudget({
                  amount: 0,
                  category,
                  date: startDate,
                  isOverride: false,
                });
                router.refresh();
              });
            }}
            textValue="Set To £0 From This Month"
          >
            <div className="flex w-full items-center gap-3">
              <HiOutlineXMark className="shrink-0" size={18} />
              <div className="flex flex-col">
                <span>Set To £0 From This Month</span>
                <span className="text-xs text-default-500">
                  Set this month to zero and carry it forward until another change.
                </span>
              </div>
            </div>
          </DropdownItem>
          {existingBudget?.isOverride ? (
            <DropdownItem
              key="revert"
              onPress={() => setRemoveWarningOpen(true)}
              textValue="Revert To Recurring Budget"
            >
              <div className="flex w-full items-center gap-3">
                <HiOutlineArrowUturnLeft className="shrink-0" size={18} />
                <div className="flex flex-col">
                  <span>Revert To Recurring Budget</span>
                  <span className="text-xs text-default-500">
                    Use the regular budget for this month.
                  </span>
                </div>
              </div>
            </DropdownItem>
          ) : null}
          {previousBudget &&
          budgetStartsThisMonth &&
          !existingBudget?.isOverride ? (
            <DropdownItem
              key="previous"
              onPress={() => setRevertPreviousOpen(true)}
              textValue="Revert To Previous Budget"
            >
              <div className="flex w-full items-center gap-3">
                <HiOutlineArrowUturnLeft className="shrink-0" size={18} />
                <div className="flex flex-col">
                  <span>Revert To Previous Budget</span>
                  <span className="text-xs text-default-500">
                    {previousAmountLabel} · From{" "}
                    {new Date(previousBudget.date).toLocaleDateString(
                      undefined,
                      { month: "short", year: "numeric" },
                    )}
                  </span>
                </div>
              </div>
            </DropdownItem>
          ) : null}
          {budgetStartsThisMonth &&
          !previousBudget &&
          !existingBudget?.isOverride ? (
            <DropdownItem
              key="remove-current"
              onPress={() => setRemoveCurrentOpen(true)}
              color="danger"
              textValue="Delete This Month’s Budget"
            >
              <div className="flex w-full items-center gap-3">
                <HiOutlineTrash className="shrink-0" size={18} />
                <div className="flex flex-col">
                  <span>Delete This Month’s Budget</span>
                  <span className="text-xs text-default-500">
                    Remove the current entry; earlier months stay unchanged.
                  </span>
                </div>
              </div>
            </DropdownItem>
          ) : null}
          <DropdownItem
            key="manage-divider"
            isReadOnly
            className="h-2 cursor-default p-0 opacity-100"
          >
            <Divider />
          </DropdownItem>
          <DropdownItem
            key="remove-all"
            onPress={() => setRemoveAllWarningOpen(true)}
            color="danger"
            textValue="Remove All Budget History"
          >
            <div className="flex w-full items-center gap-3">
              <HiOutlineTrash className="shrink-0" size={18} />
              <div className="flex flex-col">
                <span>Remove All Budget History</span>
                <span className="text-xs text-default-500">
                  Permanently delete past and future budget entries.
                </span>
              </div>
            </div>
          </DropdownItem>
          <DropdownItem
            key="manage"
            onPress={() => router.push(`/budgets?category=${category}`)}
          >
            <div className="flex w-full items-center gap-3">
              <HiOutlineWrenchScrewdriver className="shrink-0" size={18} />
              <div className="flex flex-col">
                <span>Manage All</span>
                <span className="text-xs text-default-500">
                  View and edit the full budget history.
                </span>
              </div>
            </div>
          </DropdownItem>
        </DropdownMenu>
      </Dropdown>
      <ConfirmationModal
        isOpen={removeWarningOpen}
        onClose={() => setRemoveWarningOpen(false)}
        title={`Revert ${categoryString} Override?`}
        description="Remove this month’s override. The recurring budget will apply again this month; past months will stay unchanged."
        confirmLabel="Revert Override"
        onConfirm={onRemoveBudget}
        danger
      />
      <ConfirmationModal
        isOpen={removeAllWarningOpen}
        onClose={() => setRemoveAllWarningOpen(false)}
        title={`Remove All ${categoryString} Budgets?`}
        description={`Permanently delete all recurring budgets and monthly overrides for ${categoryString}, including past months. This cannot be undone.`}
        confirmLabel="Remove All History"
        onConfirm={onRemoveAllBudgets}
        danger
      />
      <ConfirmationModal
        isOpen={revertPreviousOpen}
        onClose={() => setRevertPreviousOpen(false)}
        title={`Revert ${categoryString} Budget?`}
        description={`Delete this month’s budget change and use the previous budget of ${previousAmountLabel} from ${previousBudget ? new Date(previousBudget.date).toLocaleDateString(undefined, { month: "long", year: "numeric" }) : "the previous month"}. Past months will stay unchanged.`}
        confirmLabel="Revert Budget"
        onConfirm={onRemoveCurrentRecurringBudget}
        danger
      />
      <ConfirmationModal
        isOpen={removeCurrentOpen}
        onClose={() => setRemoveCurrentOpen(false)}
        title={`Delete ${categoryString} Budget?`}
        description="Delete this month’s recurring budget entry. Earlier months will stay unchanged."
        confirmLabel="Delete Budget"
        onConfirm={onRemoveCurrentRecurringBudget}
        danger
      />
      <SafeModal isOpen={budgetModalOpen} onClose={onClose}>
        <ModalContent>
          <form onSubmit={setBudgetSubmitHandler} onReset={onClose}>
            <ModalHeader>
              {existingBudget ? "Change" : "Set"} {categoryString} Budget From
              This Month
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
      </SafeModal>
    </>
  );
};
