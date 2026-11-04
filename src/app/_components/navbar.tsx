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
  mobileBottomBar,
  backgroundClassName = "bg-gradient-to-br from-pink-600 to-purple-800 pb-4 shadow-md",
}: {
  showSettings?: boolean;
  showHome?: boolean;
  rhs?: ReactNode;
  children?: ReactNode;
  mobileBottomBar?: ReactNode;
  backgroundClassName?: string;
}) {
  return (
    <div
      className={`${mobileBottomBar ? "md:pt-safe md:pl-safe md:pr-safe" : "pt-safe pl-safe pr-safe"} ${backgroundClassName}`}
    >
      <div
        className={`items-center justify-between ${mobileBottomBar ? "hidden md:flex" : "flex"}`}
      >
        <div className="flex gap-2">
          <LogoutButton />
          {showHome && <HomeButton />}
          {showSettings && <SettingsButton />}
        </div>
        {rhs}
      </div>
      {children}
      {mobileBottomBar ? (
        <div
          className="pl-safe pr-safe fixed inset-x-0 bottom-0 z-50 flex items-center justify-center gap-2 pt-2 md:hidden"
          style={{
            paddingBottom: "max(0.75rem, env(safe-area-inset-bottom))",
          }}
        >
          <LogoutButton
            iconSize={20}
            className="!h-10 !w-10 !min-w-10 rounded-full border border-foreground-300/60 bg-foreground-200/50 !p-0 text-foreground shadow-sm backdrop-blur-xl dark:border-white/20 dark:bg-background/25"
          />
          <div className="flex h-10 flex-none justify-center rounded-full border border-foreground-300/60 bg-foreground-200/50 p-1 text-foreground shadow-sm backdrop-blur-xl dark:border-white/20 dark:bg-background/25">
            {mobileBottomBar}
          </div>
          {showHome && (
            <HomeButton
              iconSize={20}
              className="!h-10 !w-10 !min-w-10 rounded-full border border-foreground-300/60 bg-foreground-200/50 !p-0 text-foreground shadow-sm backdrop-blur-xl dark:border-white/20 dark:bg-background/25"
            />
          )}
          {showSettings && (
            <SettingsButton
              iconSize={20}
              className="!h-10 !w-10 !min-w-10 rounded-full border border-foreground-300/60 bg-foreground-200/50 !p-0 text-foreground shadow-sm backdrop-blur-xl dark:border-white/20 dark:bg-background/25"
            />
          )}
        </div>
      ) : null}
    </div>
  );
}

const LogoutButton = ({
  className = "",
  iconSize,
}: {
  className?: string;
  iconSize?: number;
} = {}) => {
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
        className={`w-9 min-w-9 ${className}`}
        aria-label="Log out"
        isDisabled={loggingOut}
      >
        {loggingOut ? <Spinner size="sm" /> : <MdLogout size={iconSize} />}
      </Button>
    </Tooltip>
  );
};

const HomeButton = ({
  className = "",
  iconSize,
}: {
  className?: string;
  iconSize?: number;
} = {}) => {
  return (
    <Tooltip content="Home">
      <ButtonLink
        href="/"
        size="sm"
        className={`min-w-0 ${className}`}
        prefetch
        aria-label="Home"
      >
        <MdHome size={iconSize} />
      </ButtonLink>
    </Tooltip>
  );
};

const SettingsButton = ({
  className = "",
  iconSize,
}: {
  className?: string;
  iconSize?: number;
} = {}) => {
  return (
    <Tooltip content="Settings">
      <ButtonLink
        href="/settings"
        size="sm"
        className={`min-w-0 ${className}`}
        prefetch
        aria-label="Settings"
      >
        <MdSettings size={iconSize} />
      </ButtonLink>
    </Tooltip>
  );
};
