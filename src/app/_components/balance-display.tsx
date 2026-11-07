"use client";

import { formatAsGBP } from "@/lib/currency-format";
import { cn, Tooltip } from "@heroui/react";

export const BalanceDisplay = ({
  amount,
  label,
  tooltip,
  containerClassName,
  balanceSize = "text-2xl",
  labelClassName = "text-xs",
  positiveColor = "text-blue-100",
  negativeColor = "text-red-200",
}: {
  amount: number;
  label?: string;
  tooltip?: string;
  containerClassName?: string;
  balanceSize?: string;
  labelClassName?: string;
  positiveColor?: string;
  negativeColor?: string;
}) => {
  return (
    <Tooltip content={tooltip} placement="bottom" hidden={!tooltip}>
      <div className={cn("items-left flex flex-col", containerClassName)}>
        {label && <span className={labelClassName}>{label}</span>}
        <span
          className={cn(
            "font-bold",
            amount >= 0 ? positiveColor : negativeColor,
            balanceSize,
          )}
          suppressHydrationWarning
        >
          {formatAsGBP(amount, false, true)}
        </span>
      </div>
    </Tooltip>
  );
};
