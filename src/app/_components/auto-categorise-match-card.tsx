"use client";

import { TransactionMatch } from "@/lib/actions/auto-categorize/match-transactions";
import { formatAsGBP } from "@/lib/currency-format";
import { Button, Card, CardBody, Checkbox } from "@heroui/react";
import React from "react";
import { PiProhibitBold } from "react-icons/pi";
import { formatCategoryString } from "./category-select";

interface Props {
  match: TransactionMatch;
  isSelected: boolean;
  onToggle: () => void;
  onIgnore: () => Promise<void>;
}

export const AutoCategoriseMatchCard = ({
  match,
  isSelected,
  onToggle,
  onIgnore,
}: Props) => {
  const [isPending, startTransition] = React.useTransition();

  const handleIgnore = () => {
    startTransition(async () => {
      await onIgnore();
    });
  };

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
            <div className="flex items-center gap-2">
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
              <Button
                isIconOnly
                size="sm"
                variant="light"
                className="h-6 w-6 min-w-fit"
                onPress={handleIgnore}
                isLoading={isPending}
              >
                <PiProhibitBold className="text-base text-gray-500 hover:text-red-500" />
              </Button>
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
