import { SpendingCategory } from "@/lib/starling-types";
import getUserAccount from "@/lib/user";
import { Divider } from "@heroui/react";
import { BalanceDisplay } from "./balance-display";
import {
  BudgetsWithOverride,
  SpendingCategoryWithTotal,
  Totals,
} from "./spending-summary";

export const calculateRemainingSpend = (
  budgets: BudgetsWithOverride,
  totals: Totals<SpendingCategory>,
) => {
  return budgets.reduce((bal, { category, amount }) => {
    const budgetPennies = amount * 100;
    const totalSpendEarned = totals[category as SpendingCategory];

    if (totalSpendEarned === undefined) {
      return bal + budgetPennies;
    }

    const remainingBalance = budgetPennies - totalSpendEarned;
    const clampedRemainingBalance =
      amount > 0
        ? Math.max(0, remainingBalance)
        : Math.min(0, remainingBalance);

    return bal + clampedRemainingBalance;
  }, 0);
};

export const BalanceOverview = async ({
  totals,
  budgets,
  offset,
}: {
  totals: Totals<SpendingCategoryWithTotal | "upcoming">;
  budgets: BudgetsWithOverride;
  offset: number;
}) => {
  if (offset !== 0) return null;

  const { starling, accountId } = await getUserAccount();
  const balance = await starling.getBalance(accountId);

  const balancePennies = balance.effectiveBalance.minorUnits;

  const remainingBudgetSpend = calculateRemainingSpend(budgets, totals);

  const balanceAfterBudget =
    balancePennies + totals.upcoming + remainingBudgetSpend;

  return (
    <div className="flex items-center justify-between rounded-lg bg-primary-600 px-4 py-3 text-white dark:bg-primary-100">
      <BalanceDisplay
        amount={balancePennies / 100}
        label="Balance"
        tooltip="Current balance in the bank."
      />
      <Divider
        orientation="vertical"
        className="mx-2 h-auto self-stretch bg-gray-400 dark:bg-gray-400"
      />
      <BalanceDisplay
        amount={balanceAfterBudget / 100}
        label="After Budget"
        tooltip="Balance you would have if you spent your remaining budget."
      />
    </div>
  );
};
