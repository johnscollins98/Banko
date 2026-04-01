"use client";

import { TransactionMatch } from "@/lib/actions/auto-categorize/match-transactions";
import { formatAsGBP } from "@/lib/currency-format";
import { Card, CardBody, Checkbox } from "@heroui/react";
import { formatCategoryString } from "./category-select";

interface Props {
  match: TransactionMatch;
  isSelected: boolean;
  onToggle: () => void;
}

export const AutoCategoriseMatchCard = ({
  match,
  isSelected,
  onToggle,
}: Props) => {
  return (
    <Card
      isPressable
      shadow="none"
      onPress={onToggle}
      className={`border-1 transition-colors ${
        isSelected
          ? "border-blue-500 bg-blue-50 dark:bg-blue-950"
          : "border-default hover:bg-gray-50 dark:hover:bg-gray-900"
      }`}
    >
      <CardBody className="flex-row gap-3 p-3">
        <div className="flex items-start pt-1">
          <Checkbox isSelected={isSelected} onChange={onToggle} />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex justify-between">
            <div className="truncate font-semibold">
              {match.currentTransaction.counterPartyName}
            </div>
            <div className="mt-1 text-xs font-semibold">
              {formatAsGBP(
                match.currentTransaction.amount.minorUnits / 100,
                false,
              )}
              {match.previousTransaction.amount.minorUnits !==
              match.currentTransaction.amount.minorUnits
                ? ` (was ${formatAsGBP(match.previousTransaction.amount.minorUnits / 100, false)})`
                : ""}
            </div>
          </div>
          <div className="truncate text-sm text-gray-600 dark:text-gray-400">
            {match.currentTransaction.reference}
          </div>

          <div className="mt-1 flex items-center gap-1">
            <div className="text-xs">
              {formatCategoryString(match.currentTransaction.spendingCategory)}
            </div>
            <div className="text-xs font-semibold text-blue-600 dark:text-blue-400">
              → {formatCategoryString(match.categoryFromPrevious)}
            </div>
          </div>
        </div>
      </CardBody>
    </Card>
  );
};
