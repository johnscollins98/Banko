import { MonthBarrierOption } from "@prisma/client";

export interface StartAndEndDate {
  start: Date;
  end: Date;
}

interface CalendarDate {
  year: number;
  month: number;
  day: number;
}

export function getStartAndEndOfMonth(
  date: Date,
  monthBarrier: MonthBarrierOption,
  day: number,
  offset: number,
  timeZone = "UTC",
): StartAndEndDate {
  const localDate = getCalendarDate(date, timeZone);
  const calendarDate = new Date(
    Date.UTC(localDate.year, localDate.month, localDate.day),
  );

  if (monthBarrier === "LAST") {
    return getBasedOnLastPayDay(calendarDate, day, offset, timeZone);
  }

  if (monthBarrier === "CALENDAR") {
    return getBasedOnCalendar(calendarDate, day, offset, timeZone);
  }

  throw new Error("Unrecognised email");
}

function getBasedOnLastPayDay(
  date: Date,
  dayOfWeek: number,
  offset: number,
  timeZone: string,
): StartAndEndDate {
  let firstDayNextMonth = lastDayOfMonth(
    dayOfWeek,
    date.getUTCFullYear(),
    date.getUTCMonth(),
  );
  if (firstDayNextMonth <= date) {
    // To account for days in the month that are after the last Wednesday
    date.setUTCDate(date.getUTCDate() + 7);
    firstDayNextMonth = lastDayOfMonth(
      dayOfWeek,
      date.getUTCFullYear(),
      date.getUTCMonth(),
    );
  }
  const lastDayThisMonth = new Date(firstDayNextMonth);
  lastDayThisMonth.setUTCDate(firstDayNextMonth.getUTCDate() - 1);

  const lastDayPreviousMonth = lastDayOfMonth(
    dayOfWeek,
    date.getUTCFullYear(),
    date.getUTCMonth() - 1,
  );

  if (offset === 0) {
    return {
      start: atStartOfDay(lastDayPreviousMonth, timeZone),
      end: atEndOfDay(lastDayThisMonth, timeZone),
    };
  }

  return offset < 0
    ? getBasedOnLastPayDay(
        new Date(
          Date.UTC(
            lastDayPreviousMonth.getUTCFullYear(),
            lastDayPreviousMonth.getUTCMonth(),
            lastDayPreviousMonth.getUTCDate() - 1,
          ),
        ),
        dayOfWeek,
        offset + 1,
        timeZone,
      )
    : getBasedOnLastPayDay(
        new Date(
          Date.UTC(
            lastDayThisMonth.getUTCFullYear(),
            lastDayThisMonth.getUTCMonth(),
            lastDayThisMonth.getUTCDate() + 1,
          ),
        ),
        dayOfWeek,
        offset - 1,
        timeZone,
      );
}

function getBasedOnCalendar(
  month: Date,
  day: number,
  offset: number,
  timeZone: string,
): StartAndEndDate {
  const offBy1 = month.getUTCDate() < day ? -1 : 0;

  return {
    start: atStartOfDay(
      new Date(
        Date.UTC(
          month.getUTCFullYear(),
          month.getUTCMonth() + offBy1 + offset,
          day,
        ),
      ),
      timeZone,
    ),
    end: atEndOfDay(
      new Date(
        Date.UTC(
          month.getUTCFullYear(),
          month.getUTCMonth() + offBy1 + 1 + offset,
          day - 1,
        ),
      ),
      timeZone,
    ),
  };
}

function lastDayOfMonth(dayIndex: number, year: number, month: number) {
  const lastDay = new Date(Date.UTC(year, month + 1, 0));
  if (lastDay.getUTCDay() < dayIndex) {
    lastDay.setUTCDate(lastDay.getUTCDate() - 7);
  }
  lastDay.setUTCDate(lastDay.getUTCDate() - (lastDay.getUTCDay() - dayIndex));
  return lastDay;
}

function getCalendarDate(date: Date, timeZone: string): CalendarDate {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone,
    year: "numeric",
    month: "numeric",
    day: "numeric",
  }).formatToParts(date);
  const values: Record<string, number> = Object.fromEntries(
    parts.map(({ type, value }) => [type, Number(value)]),
  );
  return {
    year: values.year!,
    month: values.month! - 1,
    day: values.day!,
  };
}

function atStartOfDay(calendarDate: Date, timeZone: string): Date {
  return zonedDateToUtc(calendarDate, timeZone);
}

function atEndOfDay(calendarDate: Date, timeZone: string): Date {
  const nextDay = new Date(calendarDate);
  nextDay.setUTCDate(nextDay.getUTCDate() + 1);
  return new Date(zonedDateToUtc(nextDay, timeZone).getTime() - 1);
}

function zonedDateToUtc(calendarDate: Date, timeZone: string): Date {
  const utcGuess = new Date(
    Date.UTC(
      calendarDate.getUTCFullYear(),
      calendarDate.getUTCMonth(),
      calendarDate.getUTCDate(),
    ),
  );
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone,
    year: "numeric",
    month: "numeric",
    day: "numeric",
    hour: "numeric",
    minute: "numeric",
    second: "numeric",
    hourCycle: "h23",
  }).formatToParts(utcGuess);
  const values: Record<string, number> = Object.fromEntries(
    parts.map(({ type, value }) => [type, Number(value)]),
  );
  const offset =
    Date.UTC(
      values.year!,
      values.month! - 1,
      values.day!,
      values.hour!,
      values.minute!,
      values.second!,
    ) - utcGuess.getTime();
  return new Date(utcGuess.getTime() - offset);
}
