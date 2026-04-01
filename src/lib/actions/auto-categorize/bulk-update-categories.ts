"use server";

import { protectedAction } from "@/lib/actions/utils";
import { SPENDING_CATEGORIES } from "@/lib/starling-types";
import { revalidatePath } from "next/cache";
import { z } from "zod";

const bulkUpdateCategoriesSchema = z.object({
  updates: z.array(
    z.object({
      transactionId: z.string().uuid(),
      category: z.enum(SPENDING_CATEGORIES),
    }),
  ),
});

export type BulkUpdateCategoriesInput = z.infer<
  typeof bulkUpdateCategoriesSchema
>;

/**
 * Server action to bulk update transaction categories
 * Updates multiple transactions' spending categories
 */
const bulkUpdateCategories = protectedAction(
  bulkUpdateCategoriesSchema,
  async ({ updates }, ctx) => {
    const { starling, accountId, defaultCategory } = ctx;

    // Execute all updates in parallel
    await Promise.all(
      updates.map(({ transactionId, category }) =>
        starling.setCategory(
          accountId,
          defaultCategory,
          transactionId,
          category,
        ),
      ),
    );

    revalidatePath("/");
  },
);

export default bulkUpdateCategories;
