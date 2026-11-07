"use client";

import { Button, Spinner, Tooltip } from "@heroui/react";
import { signOut } from "next-auth/react";
import { ReactNode, startTransition, useOptimistic } from "react";
import { MdHome, MdLogout, MdSettings } from "react-icons/md";
import { ButtonLink } from "./button-link";
import {
  glassCapsuleClassName,
  glassIconButtonClassName,
} from "./glass-styles";

export default function Navbar({
  showSettings = false,
  showHome = false,
  rhs,
  children,
  mobileBottomBar,
  mobileBottomBarIsButton = false,
  desktopSafePadding = false,
  desktopPadding = true,
  backgroundClassName = "bg-gradient-to-br from-pink-600 to-purple-800 pb-4 shadow-md",
}: {
  showSettings?: boolean;
  showHome?: boolean;
  rhs?: ReactNode;
  children?: ReactNode;
  mobileBottomBar?: ReactNode;
  mobileBottomBarIsButton?: boolean;
  desktopSafePadding?: boolean;
  desktopPadding?: boolean;
  backgroundClassName?: string;
}) {
  const navbarPaddingClassName = getNavbarPaddingClassName({
    mobileBottomBar: Boolean(mobileBottomBar),
    desktopSafePadding,
    desktopPadding,
  });

  return (
    <div
      className={`${navbarPaddingClassName} ${backgroundClassName}`}
    >
      <div
        className={`items-center justify-between ${mobileBottomBar ? "hidden md:flex" : "flex"}`}
      >
        <div className="flex gap-2">
          <LogoutButton iconSize={20} className={glassIconButtonClassName} />
          {showHome && (
            <HomeButton iconSize={20} className={glassIconButtonClassName} />
          )}
          {showSettings && (
            <SettingsButton iconSize={20} className={glassIconButtonClassName} />
          )}
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
            className={glassIconButtonClassName}
          />
          {mobileBottomBarIsButton ? (
            mobileBottomBar
          ) : (
            <div className={`h-10 flex-none ${glassCapsuleClassName}`}>
              {mobileBottomBar}
            </div>
          )}
          {showSettings && (
            <SettingsButton
              iconSize={20}
              className={glassIconButtonClassName}
            />
          )}
          {showHome && (
            <HomeButton
              iconSize={20}
              className={glassIconButtonClassName}
            />
          )}
        </div>
      ) : null}
    </div>
  );
}

const getNavbarPaddingClassName = ({
  mobileBottomBar,
  desktopSafePadding,
  desktopPadding,
}: {
  mobileBottomBar: boolean;
  desktopSafePadding: boolean;
  desktopPadding: boolean;
}) => {
  if (!mobileBottomBar) return "pt-safe pl-safe pr-safe";

  const verticalPadding = desktopPadding
    ? "md:pt-[max(8px,env(safe-area-inset-top))] md:pb-2"
    : "md:pt-0 md:pb-0";
  const horizontalPadding = desktopSafePadding
    ? "md:pl-safe md:pr-safe"
    : desktopPadding
      ? "md:pl-4 md:pr-4"
      : "md:pl-0 md:pr-0";

  return `${verticalPadding} ${horizontalPadding}`;
};

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
