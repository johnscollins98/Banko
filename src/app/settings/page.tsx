import { getUserSettingsCached } from "@/lib/queries/user-settings";
import getUserAccount from "@/lib/user";
import { SettingsForm } from "./_components/settings-form";

export default async function SettingsPage() {
  const { user } = await getUserAccount();
  const settings = await getUserSettingsCached(user.id);

  return (
    <div className="min-h-[100lvh] md:min-h-0">
      <SettingsForm userSettings={settings} />
    </div>
  );
}
