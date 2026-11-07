import { getAllBudgetsForUserAndCategoryCached } from "@/lib/queries/budgets";
import getUserAccount from "@/lib/user";
import { HiOutlineCash } from "react-icons/hi";
import BudgetItem from "../_components/budget-item";
import CategorySelect from "../_components/category-select";
import Navbar from "../_components/navbar";

export default async function ManageBudgets(props: {
  searchParams: Promise<Record<string, string>>;
}) {
  const searchParams = await props.searchParams;

  const userInfo = await getUserAccount();

  const budgetsForCategory = await getAllBudgetsForUserAndCategoryCached(
    userInfo.user.id,
    searchParams.category ?? "total",
  );

  return (
    <div className="min-h-[100lvh] md:min-h-0">
      <Navbar
        showHome
        mobileBottomBar={
          <CategorySelect
            value={searchParams.category ?? "total"}
            className="mb-0 w-[min(58vw,18rem)]"
            compact
          />
        }
      />
      <div className="pl-safe pr-safe pt-safe md:pb-safe pb-[calc(5rem+env(safe-area-inset-bottom))]">
        <div className="mt-8 md:mt-0">
          <h1 className="mb-4 text-3xl font-bold">Manage Budgets</h1>
          <div className="hidden md:block">
            <CategorySelect value={searchParams.category ?? "total"} />
          </div>
          {budgetsForCategory.length > 0 ? (
            <div className="flex flex-col gap-2">
              {budgetsForCategory.map((budget) => (
                <BudgetItem key={budget.id} budget={budget} />
              ))}
            </div>
          ) : (
            <div className="mt-32 flex flex-col items-center justify-center gap-2 text-3xl text-foreground-500">
              <div>
                <HiOutlineCash size={"100px"} />
              </div>
              <div>Nothing to see here!</div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
