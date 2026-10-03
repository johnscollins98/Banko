import { unstable_cache } from "next/cache";
import { db } from "../db";

export const getUserSettings = (userId: string) => {
  return db.userSettings.findFirst({
    where: { userId: userId },
    select: {
      monthBarrierOption: true,
      day: true,
      settleUpLink: true,
      useSettleUpLinkOverride: true,
    },
  });
};

export const getUserSettingsCached = unstable_cache(
  getUserSettings,
  undefined,
  { tags: ["userSettings"], revalidate: 3600 },
);
