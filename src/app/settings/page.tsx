import { getUserSettingsCached } from "@/lib/queries/user-settings";
import getUserAccount from "@/lib/user";
import Navbar from "../_components/navbar";
import { SettingsForm } from "./_components/settings-form";

export default async function SettingsPage() {
  const { user } = await getUserAccount();
  const settings = await getUserSettingsCached(user.id);

  return (
    <div>
      {/* TODO - this should really be in a layout */}
      <Navbar
        showHome
        mobileBottomBarIsButton
        desktopSafePadding
        backgroundClassName="bg-transparent pb-0 shadow-none md:bg-gradient-to-br md:from-pink-600 md:to-purple-800 md:pb-4 md:shadow-md"
        mobileBottomBar={
          <button
            type="submit"
            form="settings-form"
            aria-label="Submit settings"
            className="h-10 min-w-28 rounded-full border border-foreground-300/60 bg-primary px-6 text-sm font-semibold text-primary-foreground shadow-sm backdrop-blur-xl dark:border-white/20"
          >
            Submit
          </button>
        }
      />
      <div className="pl-safe pr-safe pb-[calc(5rem+env(safe-area-inset-bottom))] pt-4 md:pb-safe">
        <SettingsForm userSettings={settings} />
      </div>
    </div>
  );
}
