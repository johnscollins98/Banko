export const glassSurfaceClassName =
  "rounded-full border border-foreground-300/60 bg-foreground-200/50 text-foreground shadow-sm backdrop-blur-xl dark:border-white/20 dark:bg-background/25";

export const glassButtonClassName =
  `${glassSurfaceClassName} hover:bg-foreground-200/70 dark:hover:bg-background/40`;

export const glassIconButtonClassName =
  `!h-10 !w-10 !min-w-10 ${glassButtonClassName} !p-0`;

export const glassCapsuleClassName =
  `${glassSurfaceClassName} flex items-center justify-center p-1`;

export const glassCapsuleControlClassName =
  "!h-10 rounded-full bg-transparent text-foreground hover:bg-foreground-100";
