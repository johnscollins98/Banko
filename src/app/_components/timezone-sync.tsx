"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";

export function TimezoneSync() {
  const router = useRouter();

  useEffect(() => {
    const timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone;
    const cookie = document.cookie
      .split("; ")
      .find((value) => value.startsWith("banko-timezone="));
    const currentTimeZone = cookie
      ? decodeURIComponent(cookie.split("=")[1] ?? "")
      : undefined;

    if (timeZone && currentTimeZone !== timeZone) {
      document.cookie = `banko-timezone=${encodeURIComponent(timeZone)};path=/;max-age=31536000;samesite=lax`;
      router.refresh();
    }
  }, [router]);

  return null;
}
