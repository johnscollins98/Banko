"use client";

import { StartAndEndDate } from "@/lib/date-range";
import { useSearchParams } from "next/navigation";
import { Suspense, use } from "react";
import {
  FaArrowLeft,
  FaArrowRight,
  FaChevronLeft,
  FaChevronRight,
} from "react-icons/fa";
import { ButtonLink } from "./button-link";
import DateDisplay from "./date";

interface Props {
  dates: Promise<StartAndEndDate>;
  mobile?: boolean;
}

export const DateNavigation = ({ dates, mobile = false }: Props) => {
  const searchParams = useSearchParams();

  const parsedOffsetParam = parseInt(searchParams.get("offset") ?? "0");
  const offset = Number.isNaN(parsedOffsetParam) ? 0 : parsedOffsetParam;

  const createRedirectLink = (newOffset: number) => {
    const params = new URLSearchParams(searchParams.toString());
    if (newOffset) {
      params.set("offset", newOffset.toString());
    } else {
      params.delete("offset");
    }
    return params.toString();
  };

  if (mobile) {
    return (
      <div className="flex items-center gap-0.5">
        <ButtonLink
          size="sm"
          href={`.?${createRedirectLink(offset - 1)}`}
          aria-label="Previous month"
          className="h-8 w-8 min-w-8 rounded-full bg-transparent px-0 text-foreground hover:bg-foreground-100"
        >
          <FaChevronLeft size={14} />
        </ButtonLink>
        <ButtonLink
          size="sm"
          aria-label="Go to current month"
          className="h-8 w-28 min-w-28 rounded-full bg-transparent px-2 text-xs font-medium text-foreground hover:bg-foreground-100"
          href={`.?${createRedirectLink(0)}`}
        >
          <Suspense>
            <TodaysDate datePromise={dates} />
          </Suspense>
        </ButtonLink>
        <ButtonLink
          size="sm"
          href={`.?${createRedirectLink(offset + 1)}`}
          aria-label="Next month"
          className="h-8 w-8 min-w-8 rounded-full bg-transparent px-0 text-foreground hover:bg-foreground-100"
        >
          <FaChevronRight size={14} />
        </ButtonLink>
      </div>
    );
  }

  return (
    <div className="flex gap-1">
      <ButtonLink size="sm" href={`.?${createRedirectLink(offset - 1)}`}>
        <FaArrowLeft />
      </ButtonLink>
      <ButtonLink
        size="sm"
        className="w-32"
        href={`.?${createRedirectLink(0)}`}
      >
        <Suspense>
          <TodaysDate datePromise={dates} />
        </Suspense>
      </ButtonLink>
      <ButtonLink size="sm" href={`.?${createRedirectLink(offset + 1)}`}>
        <FaArrowRight />
      </ButtonLink>
    </div>
  );
};

export const TodaysDate = ({
  datePromise,
}: {
  datePromise: Promise<StartAndEndDate>;
}) => {
  const { start, end } = use(datePromise);
  return (
    <>
      <DateDisplay date={start} /> - <DateDisplay date={end} />
    </>
  );
};
