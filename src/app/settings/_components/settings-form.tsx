"use client";

import { ButtonLink } from "@/app/_components/button-link";
import {
  UserSettingsDto,
  UserSettingsSchema,
} from "@/lib/actions/user-settings/dtos";
import setUserSettings from "@/lib/actions/user-settings/set-user-settings";
import { Button, Input, Select, SelectItem } from "@heroui/react";
import { MonthBarrierOption } from "@prisma/client";
import { useTheme } from "next-themes";
import {
  FormEventHandler,
  startTransition,
  useMemo,
  useOptimistic,
  useState,
} from "react";
import { CgArrowLeft } from "react-icons/cg";

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

  const [pending, setPending] = useOptimistic(false);

  const settingsToSave = useMemo(
    () => ({
      day: parseFloat(day),
      monthBarrierOption,
    }),
    [day, monthBarrierOption],
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

  return (
    <form
      onSubmit={onSubmitHandler}
      className="flex flex-col gap-5"
      ref={() => setMounted(true)}
    >
      <div className="text-xl font-semibold">Please enter your settings</div>
      <Select
        label="Calendar Style"
        selectedKeys={[monthBarrierOption]}
        isInvalid={
          !!validation.error?.formErrors.fieldErrors.monthBarrierOption
        }
        errorMessage={
          validation.error?.formErrors.fieldErrors.monthBarrierOption
        }
        onChange={(e) => setMonthHandler(e.target.value as MonthBarrierOption)}
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
      <div className="flex items-center gap-3">
        <ButtonLink href="/" prefetch className="flex w-32 gap-2">
          <CgArrowLeft />
          Home Page
        </ButtonLink>
        <Button
          type="submit"
          color="primary"
          isDisabled={!validation.success || pending}
          isLoading={pending}
        >
          Submit
        </Button>
      </div>
    </form>
  );
};
