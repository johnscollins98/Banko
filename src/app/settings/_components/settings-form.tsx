"use client";

import Navbar from "@/app/_components/navbar";
import {
  UserSettingsDto,
  UserSettingsSchema,
} from "@/lib/actions/user-settings/dtos";
import setUserSettings from "@/lib/actions/user-settings/set-user-settings";
import { Button, Checkbox, Input, Select, SelectItem } from "@heroui/react";
import { MonthBarrierOption } from "@prisma/client";
import { useTheme } from "next-themes";
import {
  FormEventHandler,
  startTransition,
  useMemo,
  useOptimistic,
  useState,
} from "react";

export const SettingsForm = ({
  userSettings,
}: {
  userSettings?: UserSettingsDto | null;
}) => {
  const [day, setDay] = useState(userSettings?.day?.toString() ?? "");
  const [monthBarrierOption, setMonthBarrierOption] =
    useState<MonthBarrierOption>(
      userSettings?.monthBarrierOption ?? "CALENDAR",
    );
  const [settleUpLink, setSettleUpLink] = useState(
    userSettings?.settleUpLink ?? "",
  );
  const [useSettleUpLinkOverride, setUseSettleUpLinkOverride] = useState(
    userSettings?.useSettleUpLinkOverride ?? false,
  );

  const [pending, setPending] = useOptimistic(false);

  const settingsToSave = useMemo(
    () => ({
      day: parseFloat(day),
      monthBarrierOption,
      settleUpLink: settleUpLink || null,
      useSettleUpLinkOverride,
    }),
    [day, monthBarrierOption, settleUpLink, useSettleUpLinkOverride],
  );

  const setMonthHandler = (v: MonthBarrierOption) => {
    setMonthBarrierOption(v);
    setDay("");
  };

  const validation = useMemo(
    () => UserSettingsSchema.safeParse(settingsToSave),
    [settingsToSave],
  );

  const onSubmitHandler: FormEventHandler<HTMLFormElement> = (e) => {
    e.preventDefault();
    e.stopPropagation();

    startTransition(async () => {
      setPending(true);
      if (validation.success) {
        await setUserSettings(settingsToSave);
      }
    });
  };

  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  const submitButton = (
    <Button
      type="submit"
      color="primary"
      isDisabled={!validation.success || pending}
      isLoading={pending}
      className="h-10 w-48 rounded-full border border-foreground-300/60 px-6 text-sm font-semibold shadow-sm backdrop-blur-xl dark:border-white/20 md:w-auto"
    >
      Submit
    </Button>
  );

  return (
    <form
      id="settings-form"
      onSubmit={onSubmitHandler}
      ref={() => setMounted(true)}
      className="flex flex-1 flex-col"
    >
      <Navbar showHome mobileBottomBarIsButton mobileBottomBar={submitButton} />
      <div className="pl-safe pr-safe pt-safe md:pb-safe pb-[calc(5rem+env(safe-area-inset-bottom))]">
        <div className="mt-8 md:mt-0">
          <div className="flex flex-1 flex-col gap-4">
            <div className="text-xl font-semibold">
              Please enter your settings
            </div>
            <section className="flex flex-col gap-2 rounded-md bg-white p-4 shadow dark:bg-foreground-100">
              <h2 className="text-lg font-semibold">Calendar Settings</h2>
              <Select
                label="Calendar Style"
                selectedKeys={[monthBarrierOption]}
                isInvalid={
                  !!validation.error?.formErrors.fieldErrors.monthBarrierOption
                }
                errorMessage={
                  validation.error?.formErrors.fieldErrors.monthBarrierOption
                }
                onChange={(e) =>
                  setMonthHandler(e.target.value as MonthBarrierOption)
                }
              >
                <SelectItem key="CALENDAR">Calendar</SelectItem>
                <SelectItem key="LAST">Last Day</SelectItem>
              </Select>
              {monthBarrierOption === "CALENDAR" && (
                <Input
                  isRequired
                  label="Day"
                  value={day}
                  isInvalid={
                    day != "" && !!validation.error?.formErrors.fieldErrors.day
                  }
                  errorMessage={validation.error?.formErrors.fieldErrors.day}
                  onChange={(e) => setDay(e.target.value)}
                />
              )}
              {monthBarrierOption === "LAST" && (
                <Select
                  label="Day"
                  selectedKeys={day}
                  onChange={(e) => setDay(e.target.value)}
                  isRequired
                >
                  <SelectItem key="1">Monday</SelectItem>
                  <SelectItem key="2">Tuesday</SelectItem>
                  <SelectItem key="3">Wednesday</SelectItem>
                  <SelectItem key="4">Thursday</SelectItem>
                  <SelectItem key="5">Friday</SelectItem>
                  <SelectItem key="6">Saturday</SelectItem>
                  <SelectItem key="7">Sunday</SelectItem>
                </Select>
              )}
            </section>
            <section className="flex flex-col gap-2 rounded-md bg-white p-4 shadow dark:bg-foreground-100">
              <h2 className="text-lg font-semibold">Settle Up Settings</h2>
              <Checkbox
                isSelected={useSettleUpLinkOverride}
                onValueChange={setUseSettleUpLinkOverride}
              >
                Use settle-up link override
              </Checkbox>
              <Input
                label="Settle Up Link"
                value={settleUpLink}
                isDisabled={!useSettleUpLinkOverride}
                isInvalid={
                  !!validation.error?.formErrors.fieldErrors.settleUpLink
                }
                errorMessage={
                  validation.error?.formErrors.fieldErrors.settleUpLink
                }
                onChange={(e) => setSettleUpLink(e.target.value)}
                isClearable
                onClear={() => setSettleUpLink("")}
              />
            </section>
            <section className="flex flex-col gap-2 rounded-md bg-white p-4 shadow dark:bg-foreground-100">
              <h2 className="text-lg font-semibold">Theme</h2>
              <Select
                label="Theme"
                selectedKeys={mounted ? [theme ?? "system"] : []}
                onChange={(e) => setTheme(e.target.value)}
                isLoading={!mounted}
              >
                <SelectItem key="system">System</SelectItem>
                <SelectItem key="dark">Dark</SelectItem>
                <SelectItem key="light">Light</SelectItem>
              </Select>
            </section>
            <div className="hidden items-center gap-3 md:flex">
              {submitButton}
            </div>
          </div>
        </div>
      </div>
    </form>
  );
};
