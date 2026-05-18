"use server";

import { protectedAction } from "@/lib/actions/utils";
import { db } from "@/lib/db";
import { revalidatePath } from "next/cache";
import { z } from "zod";

const unignoreTransactionMatchSchema = z.object({
  currentTransactionId: z.string().uuid(),
  previousTransactionId: z.string().uuid(),
});

/**
 * Server action to un-ignore a transaction match
 * Removes the match from the ignored list so it can appear in suggestions again
 */
const unignoreTransactionMatch = protectedAction(
  unignoreTransactionMatchSchema,
  async ({ currentTransactionId, previousTransactionId }, ctx) => {
    const { user } = ctx;

    await db.ignoredTransactionMatch.deleteMany({
      where: {
        userId: user.id,
        currentTransactionId,
        previousTransactionId,
      },
    });

    // Invalidate the home page to refetch the auto-categorise matches
    revalidatePath("/");

    return { success: true };
  },
);

export default unignoreTransactionMatch;
