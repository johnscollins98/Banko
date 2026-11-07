import { BalanceDisplay } from "./balance-display";
import { calculateRemainingSpend } from "./balance-overview";
import {
  BudgetsWithOverride,
  SpendingCategoryWithTotal,
  Totals,
} from "./spending-summary";

interface Props {
  totals: Totals<SpendingCategoryWithTotal> & { upcoming?: number };
  budgets: BudgetsWithOverride;
  offset: number;
}

export const CashFlowOverview = ({ totals, budgets, offset }: Props) => {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { total, upcoming, ...otherTotals } = totals;

  const budgetsWithoutTotal = budgets.filter((b) => b.category !== "total");

  const actualCashflow = Object.values(otherTotals).reduce(
    (total, entry) => total + entry,
    0,
  );

  const budgetCashflow = Object.values(budgetsWithoutTotal).reduce(
    (total, entry) => total + entry.amount,
    0,
  );

  const remainingSpend = calculateRemainingSpend(
    budgetsWithoutTotal,
    otherTotals,
  );

  const cashflowAfterBudget = actualCashflow + remainingSpend;

  return (
    <div className="rounded-lg bg-foreground-200 p-4">
      <div className="flex items-baseline justify-between">
        <div className="font-bold text-foreground">Cash Flow</div>
        <BalanceDisplay
          amount={actualCashflow / 100}
          tooltip="Actual cash flow for this period (based on real spending)"
          balanceSize="text-lg"
          positiveColor={positiveColor}
          negativeColor={negativeColor}
          containerClassName="items-start"
        />
      </div>
      <div className="mt-2 flex justify-between gap-1">
        {offset === 0 && (
          <SubBalanceDisplay
            amount={cashflowAfterBudget / 100}
            label="After Budget"
            tooltip="Cash flow for this period if you were to spend your remaining budget."
          />
        )}
        <SubBalanceDisplay
          amount={budgetCashflow}
          label="Budgeted"
          tooltip="Cash flow based on your budgets alone for this period."
        />
      </div>
    </div>
  );
};

const SubBalanceDisplay = ({
  amount,
  label,
  tooltip,
}: {
  amount: number;
  label: string;
  tooltip: string;
}) => {
  return (
    <BalanceDisplay
      amount={amount}
      containerClassName="bg-foreground-100 rounded px-2 py-1 flex-1"
      balanceSize="text-md"
      labelClassName="text-xs text-foreground"
      positiveColor={positiveColor}
      negativeColor={negativeColor}
      label={label}
      tooltip={tooltip}
    />
  );
};

const positiveColor = "text-green-600 dark:text-green-400";
const negativeColor = "text-red-500 dark:text-red-400";
