"use server";

import { revalidatePath, revalidateTag } from "next/cache";
import { redirect } from "next/navigation";
import { db } from "../../db";
import { protectedAction } from "../utils";
import { UserSettingsSchema } from "./dtos";

const setUserSettings = protectedAction(
  UserSettingsSchema,
  async (userSettings, ctx) => {
    const { user } = ctx;

    await db.userSettings.upsert({
      where: { userId: user.id },
      create: { userId: user.id, ...userSettings },
      update: { ...userSettings },
    });

    revalidateTag("userSettings", {});
    revalidatePath("/settings");
    redirect("/");
  },
);

export default setUserSettings;
