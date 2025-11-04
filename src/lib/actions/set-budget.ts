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
    date: z.date().optional(),
  }),
  async ({ amount, category, date }, { user }) => {
    if (date) {
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
        },
        update: {
          amount,
        },
        where: {
          userId_category: {
            category,
            userId: user.id,
          },
        },
      });
      revalidateTag("budget", {});
    }

    revalidatePath("/");
  },
);

export const removeBudget = protectedAction(
  z.object({
    category: z.enum([...SPENDING_CATEGORIES, "total"]),
    date: z.date().optional(),
  }),
  async ({ category, date }, { user }) => {
    if (date) {
      const res = await db.budgetOverride.deleteMany({
        where: {
          category,
          date,
          userId: user.id,
        },
      });

      if (res.count !== 0) {
        revalidateTag("budgetOverride", {});
        revalidatePath("/");
        return;
      }
    }

    await db.budget.delete({
      where: {
        userId_category: { category, userId: user.id },
      },
    });

    revalidateTag("budget", {});
    revalidatePath("/");
  },
);
