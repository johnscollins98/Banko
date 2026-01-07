import { getAllBudgetsForUserAndCategoryCached } from "@/lib/queries/budgets";
import getUserAccount from "@/lib/user";
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
    <div>
      <Navbar showHome />
      <div className="pl-safe pr-safe pb-safe pt-4">
        <h1 className="mb-4 text-3xl font-bold">Manage Budgets</h1>
        <CategorySelect value={searchParams.category ?? "total"} />
        <div className="flex flex-col gap-2">
          {budgetsForCategory.map((budget) => (
            <BudgetItem key={budget.id} budget={budget} />
          ))}
        </div>
      </div>
    </div>
  );
}
