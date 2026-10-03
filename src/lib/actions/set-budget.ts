"use server";

import { revalidatePath, revalidateTag } from "next/cache";
import { z } from "zod";
import { db } from "../db";
import { SPENDING_CATEGORIES } from "../starling-types";
import { protectedAction } from "./utils";

export const setBudget = protectedAction(
  z.object({
    amount: z.number(),
    category: z.enum([...SPENDING_CATEGORIES, "total"]),
    date: z.date(),
    isOverride: z.boolean(),
  }),
  async ({ amount, category, date, isOverride }, { user }) => {
    if (isOverride) {
      await db.budgetOverride.upsert({
        create: {
          amount,
          category,
          date,
          userId: user.id,
        },
        update: {
          amount,
        },
        where: {
          userId_category_date: {
            category,
            userId: user.id,
            date,
          },
        },
      });
      revalidateTag("budgetOverride", {});
    } else {
      await db.budget.upsert({
        create: {
          amount,
          category,
          userId: user.id,
          date,
        },
        update: {
          amount,
        },
        where: {
          userId_category_date: {
            category,
            userId: user.id,
            date,
          },
        },
      });
      revalidateTag("budget", {});
    }

    revalidatePath("/");
    revalidatePath("/budgets");
  },
);

export const removeBudget = protectedAction(
  z.object({
    category: z.enum([...SPENDING_CATEGORIES, "total"]),
    date: z.date(),
    isOverride: z.boolean(),
  }),
  async ({ category, date, isOverride }, { user }) => {
    if (isOverride) {
      await db.budgetOverride.deleteMany({
        where: {
          category,
          date,
          userId: user.id,
        },
      });
      revalidateTag("budgetOverride", {});
      revalidatePath("/");
      revalidatePath("/budgets");
      return;
    }

    await db.budget.delete({
      where: {
        userId_category_date: {
          category,
          userId: user.id,
          date,
        },
      },
    });

    revalidateTag("budget", {});
    revalidatePath("/");
    revalidatePath("/budgets");
  },
);

export const removeAllBudgetsForCategory = protectedAction(
  z.object({
    category: z.enum([...SPENDING_CATEGORIES, "total"]),
  }),
  async ({ category }, { user }) => {
    await db.$transaction([
      db.budget.deleteMany({ where: { category, userId: user.id } }),
      db.budgetOverride.deleteMany({ where: { category, userId: user.id } }),
    ]);
    revalidateTag("budget", {});
    revalidateTag("budgetOverride", {});
    revalidatePath("/");
    revalidatePath("/budgets");
  },
);
