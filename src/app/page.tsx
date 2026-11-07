import { getStartAndEndOfMonth } from "@/lib/date-range";
import { getAutoCategoriseMatches } from "@/lib/queries/auto-categorise-matches";
import {
  getBudgetOverridesForUserCached,
  getDefaultBudgetsForUserCached,
  getPreviousBudgetsForUserCached,
} from "@/lib/queries/budgets";
import { getUserSettingsCached } from "@/lib/queries/user-settings";
import { SPENDING_CATEGORIES, SpendingCategory } from "@/lib/starling-types";
import getUserAccount from "@/lib/user";
import { UserSettings } from "@prisma/client";
import { cookies } from "next/headers";
import { Suspense } from "react";
import { AutoCategoriseForm } from "./_components/auto-categorise-form";
import { BalanceOverview } from "./_components/balance-overview";
import { DateNavigation } from "./_components/date-navigation";
import Navbar from "./_components/navbar";
import SpendingSummary from "./_components/spending-summary";
import { TransactionFeed } from "./_components/transaction-feed";

const getDates = async (
  userSettings: {
    monthBarrierOption: UserSettings["monthBarrierOption"];
    day: UserSettings["day"];
  },
  offsetStr?: string,
) => {
  const offset = parseInt(offsetStr ?? "0");

  const date = new Date(Date.now());
  const timeZone = decodeURIComponent(
    (await cookies()).get("banko-timezone")?.value ?? "UTC",
  );

  return getStartAndEndOfMonth(
    date,
    userSettings.monthBarrierOption,
    userSettings.day,
    offset,
    timeZone,
  );
};

export default async function Home(props: {
  searchParams: Promise<Record<string, string>>;
}) {
  const searchParams = await props.searchParams;
  const offset = searchParams.offset;
  const { user, starling, accountId, defaultCategory, settleUpProfile } =
    await getUserAccount();

  const userSettings = (await getUserSettingsCached(user.id)) ?? {
    monthBarrierOption: "CALENDAR",
    day: 1,
    settleUpLink: null,
    useSettleUpLinkOverride: false,
  };

  const datesPromise = getDates(userSettings, offset);

  const { start, end } = await datesPromise;

  const defaultBudgets = await getDefaultBudgetsForUserCached(user.id, start);
  const previousBudgets = await getPreviousBudgetsForUserCached(user.id, start);
  const budgetOverrides = await getBudgetOverridesForUserCached(user.id, start);

  const budgets = [...SPENDING_CATEGORIES, "total"]
    .map((category) => {
      const override = budgetOverrides.find((o) => o.category === category);
      const defaultBudget = defaultBudgets.find((b) => b.category === category);
      return override ? { ...override, isOverride: true } : defaultBudget;
    })
    .filter((b) => b !== undefined);

  const transactions = await starling.getTransactions(
    accountId,
    start,
    end,
    defaultCategory,
  );

  const feedItems = transactions.feedItems
    .filter((i) => i.status !== "DECLINED")
    .toSorted(
      (a, b) => Date.parse(b.transactionTime) - Date.parse(a.transactionTime),
    );

  const totals = feedItems.reduce(
    (total, transaction) => {
      const value =
        transaction.direction === "IN"
          ? transaction.amount.minorUnits
          : -1 * transaction.amount.minorUnits;
      const category = transaction.spendingCategory;

      return {
        ...total,
        total: total.total + value,
        [category]: (total[category] ?? 0) + value,
        upcoming:
          transaction.status === "UPCOMING"
            ? total.upcoming + value
            : total.upcoming,
      };
    },
    { total: 0, upcoming: 0 } as Record<
      SpendingCategory | "total" | "upcoming",
      number
    >,
  );

  const offsetNum = parseInt(offset ?? "0");

  return (
    <main className="flex h-[100lvh] flex-col bg-gradient-to-br from-pink-600 to-purple-800 md:h-dvh md:overflow-hidden">
      <div className="flex flex-1 flex-col md:min-h-0 md:flex-row">
        <aside className="pl-safe pr-safe pt-safe pb-safe md:mr-4 md:min-h-0 md:w-[calc(25rem_+_env(safe-area-inset-left))] md:flex-none md:overflow-y-auto md:pr-0">
          <Navbar
            showSettings
            rhs={
              <div className="hidden md:block">
                <DateNavigation dates={datesPromise} />
              </div>
            }
            isTopLevelBar={false}
            mobileBottomBar={<DateNavigation dates={datesPromise} mobile />}
            dividerClassName="md:border-b border-gray-400"
          />
          <div className="md:px-0 md:pb-0 md:pt-2">
            <div className="mt-8 flex flex-col gap-2 md:mt-0">
              <BalanceOverview
                totals={totals}
                budgets={budgets}
                offset={offsetNum}
              />
              <SpendingSummary
                budgets={budgets}
                previousBudgets={previousBudgets}
                startDate={start}
                totals={totals}
                offset={offsetNum}
                autoCategoriseForm={
                  <Suspense fallback={null}>
                    <AutoCategoriseFormServer offset={offsetNum} />
                  </Suspense>
                }
              />
            </div>
          </div>
        </aside>
        <div className="pl-safe pr-safe pb-safe md:pb-safe md:pr-safe md:pt-safe flex flex-grow flex-col bg-transparent pt-4 md:min-h-0 md:min-w-0 md:flex-1 md:overflow-hidden md:pl-0">
          <div className="flex min-h-0 flex-1 flex-col md:overflow-hidden md:rounded-2xl md:bg-transparent md:p-0.5">
            <div className="flex min-h-0 flex-1 flex-col md:overflow-hidden md:rounded-xl md:bg-foreground-100 md:p-3 md:dark:bg-background">
              <TransactionFeed
                feedItems={feedItems}
                settleUpProfile={settleUpProfile}
                settleUpOverride={
                  userSettings.useSettleUpLinkOverride
                    ? userSettings.settleUpLink
                    : null
                }
              />
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}

const AutoCategoriseFormServer = async ({ offset }: { offset: number }) => {
  const matches = await getAutoCategoriseMatches(offset);
  return <AutoCategoriseForm matches={matches} />;
};
