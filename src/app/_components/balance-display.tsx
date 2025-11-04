"use client";

import { formatAsGBP } from "@/lib/currency-format";
import { Tooltip } from "@heroui/react";

export const BalanceDisplay = ({
  amount,
  label,
  tooltip,
}: {
  amount: number;
  label: string;
  tooltip?: string;
}) => {
  return (
    <Tooltip content={tooltip} placement="bottom" hidden={!tooltip}>
      <div className="flex flex-col items-center text-xl font-bold">
        <span className="text-xs font-semibold">{label}</span>
        <span
          className={amount >= 0 ? "text-blue-200" : "text-red-200"}
          suppressHydrationWarning
        >
          {formatAsGBP(amount, false, true)}
        </span>
      </div>
    </Tooltip>
  );
};
