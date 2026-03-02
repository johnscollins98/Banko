"server-only";

import { authOptions } from "@/app/api/auth/[...nextauth]/auth-options";
import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { cache } from "react";
import { getAccounts } from "./accounts";
import { Starling } from "./starling-api-service";

const getUserAccount = cache(async () => {
  const session = await getServerSession(authOptions);
  if (!session) {
    redirect("/login");
  }

  const { user } = session;
  if (!user) {
    redirect("/forbidden");
  }

  const { email } = user;
  if (!email) {
    redirect("/forbidden");
  }

  const localAccounts = getAccounts();

  const accountToken = localAccounts[email];

  if (!accountToken) {
    redirect("/forbidden");
  }

  const starling = new Starling(accountToken);
  const accounts = await starling.getAccounts();
  const accountId = accounts.accounts[0]?.accountUid;
  const defaultCategory = accounts.accounts[0]?.defaultCategory;
  const settleUpProfile = await starling.getSettleUpProfile();

  if (!accountId || !defaultCategory) {
    redirect("/forbidden");
  }

  return {
    user,
    starling,
    accountId,
    defaultCategory,
    settleUpProfile,
  };
});

export type Context = Awaited<ReturnType<typeof getUserAccount>>;
export type User = Context["user"];

export default getUserAccount;
