"use client";

import { TransactionMatch } from "@/lib/actions/auto-categorize/match-transactions";
import { formatAsGBP } from "@/lib/currency-format";
import { Button, Card, CardBody, Checkbox } from "@heroui/react";
import React from "react";
import { PiCheckCircle, PiProhibitBold } from "react-icons/pi";
import { formatCategoryString } from "./category-select";

interface Props {
  match: TransactionMatch;
  isSelected: boolean;
  onToggle: () => void;
  onIgnore: () => Promise<void>;
  onUnignore?: () => Promise<void>;
}

export const AutoCategoriseMatchCard = ({
  match,
  isSelected,
  onToggle,
  onIgnore,
  onUnignore,
}: Props) => {
  const [isPending, startTransition] = React.useTransition();

  const handleIgnore = () => {
    startTransition(async () => {
      await onIgnore();
    });
  };

  const handleUnignore = () => {
    startTransition(async () => {
      await onUnignore?.();
    });
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString(undefined, {
      day: "numeric",
      month: "short",
    });
  };

  return (
    <Card
      shadow="none"
      className={`border-1 transition-all ${
        isSelected
          ? "border-blue-500 bg-blue-50 dark:bg-blue-950"
          : "border-default hover:bg-gray-50 dark:hover:bg-gray-900"
      }`}
    >
      <CardBody className="flex-row gap-3 p-3">
        <div className="flex items-start pt-1">
          <Checkbox isSelected={isSelected} onChange={onToggle} />
        </div>
        <div
          className={`min-w-0 flex-1 cursor-pointer ${match.ignored ? "opacity-50" : ""}`}
          onClick={onToggle}
        >
          <div className="flex items-start justify-between gap-2">
            <div className="truncate font-semibold">
              {match.currentTransaction.counterPartyName}
            </div>
            <div className="mt-1 text-nowrap text-xs font-semibold">
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

          <div className="mt-1 text-xs text-gray-500 dark:text-gray-500">
            {formatDate(match.currentTransaction.transactionTime)} →{" "}
            {formatDate(match.previousTransaction.transactionTime)}
          </div>
        </div>
        <div className="flex items-start pt-1">
          <Button
            isIconOnly
            size="sm"
            className={`h-6 w-6 min-w-fit`}
            onPress={match.ignored ? handleUnignore : handleIgnore}
            isLoading={isPending}
          >
            {match.ignored ? (
              <PiCheckCircle className="text-base text-green-700 dark:text-green-400" />
            ) : (
              <PiProhibitBold className="text-base text-red-600" />
            )}
          </Button>
        </div>
      </CardBody>
    </Card>
  );
};
