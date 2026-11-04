"use client";

import { Button, Spinner, Tooltip } from "@heroui/react";
import { signOut } from "next-auth/react";
import { ReactNode, startTransition, useOptimistic } from "react";
import { MdHome, MdLogout, MdSettings } from "react-icons/md";
import { ButtonLink } from "./button-link";

export default function Navbar({
  showSettings = false,
  showHome = false,
  rhs,
  children,
  backgroundClassName = "bg-gradient-to-br from-pink-600 to-purple-800 pb-4 shadow-md",
}: {
  showSettings?: boolean;
  showHome?: boolean;
  rhs?: ReactNode;
  children?: ReactNode;
  backgroundClassName?: string;
}) {
  return (
    <div
      className={`pt-safe pl-safe pr-safe ${backgroundClassName}`}
    >
      <div className="flex items-center justify-between">
        <div className="flex gap-2">
          <LogoutButton />
          {showHome && <HomeButton />}
          {showSettings && <SettingsButton />}
        </div>
        {rhs}
      </div>
      {children}
    </div>
  );
}

const LogoutButton = () => {
  const [loggingOut, setLoggingOut] = useOptimistic(false);
  const logoutHandler = () => {
    startTransition(async () => {
      setLoggingOut(true);
      await signOut();
    });
  };
  return (
    <Tooltip content="Log out">
      <Button
        size="sm"
        href="/api/auth/signout"
        onPress={logoutHandler}
        className="w-9 min-w-9"
        aria-label="Log out"
        isDisabled={loggingOut}
      >
        {loggingOut ? <Spinner size="sm" /> : <MdLogout />}
      </Button>
    </Tooltip>
  );
};

const HomeButton = () => {
  return (
    <Tooltip content="Home">
      <ButtonLink
        href="/"
        size="sm"
        className="min-w-0"
        prefetch
        aria-label="Home"
      >
        <MdHome />
      </ButtonLink>
    </Tooltip>
  );
};

const SettingsButton = () => {
  return (
    <Tooltip content="Settings">
      <ButtonLink
        href="/settings"
        size="sm"
        className="min-w-0"
        prefetch
        aria-label="Settings"
      >
        <MdSettings />
      </ButtonLink>
    </Tooltip>
  );
};
