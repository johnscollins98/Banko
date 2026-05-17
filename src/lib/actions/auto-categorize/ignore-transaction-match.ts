"use server";

import { protectedAction } from "@/lib/actions/utils";
import { db } from "@/lib/db";
import { z } from "zod";

const ignoreTransactionMatchSchema = z.object({
  currentTransactionId: z.string().uuid(),
  previousTransactionId: z.string().uuid(),
});

/**
 * Server action to ignore a transaction match
 * Stores the match in the database so it won't appear in future suggestions
 */
const ignoreTransactionMatch = protectedAction(
  ignoreTransactionMatchSchema,
  async ({ currentTransactionId, previousTransactionId }, ctx) => {
    const { user } = ctx;

    await db.ignoredTransactionMatch.create({
      data: {
        userId: user.id,
        currentTransactionId,
        previousTransactionId,
      },
    });

    return { success: true };
  },
);

export default ignoreTransactionMatch;
