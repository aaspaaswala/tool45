"use client";

import { useEffect, useMemo, useState } from "react";
import { Check, Clipboard, Pause, Play, Plus, RotateCcw, Trash2 } from "lucide-react";

import {
  productivityToolDefinitions,
  type ProductivityToolId,
} from "@/lib/tools/productivity-tool-config";

type ChecklistItem = { id: number; text: string; done: boolean };
type PlannerItem = { id: number; time: string; task: string; done: boolean };
type Habit = { id: number; name: string; checked: boolean[] };
type Shift = { id: number; start: string; end: string; breakMinutes: number };

const timeZones = [
  "UTC",
  "America/Los_Angeles",
  "America/Denver",
  "America/Chicago",
  "America/New_York",
  "America/Sao_Paulo",
  "Europe/London",
  "Europe/Paris",
  "Europe/Istanbul",
  "Asia/Dubai",
  "Asia/Kolkata",
  "Asia/Singapore",
  "Asia/Tokyo",
  "Australia/Sydney",
];

function localDateValue(date = new Date()): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

function localDateTimeValue(date = new Date()): string {
  return `${localDateValue(date)}T${String(date.getHours()).padStart(2, "0")}:${String(date.getMinutes()).padStart(2, "0")}`;
}

function dateFromInput(value: string): Date {
  return new Date(`${value}T00:00:00`);
}

function formatDuration(totalSeconds: number): string {
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  return [hours, minutes, seconds].map((value) => String(value).padStart(2, "0")).join(":");
}

function daysBetween(start: Date, end: Date): number {
  return Math.round((Date.UTC(end.getFullYear(), end.getMonth(), end.getDate()) - Date.UTC(start.getFullYear(), start.getMonth(), start.getDate())) / 86_400_000);
}

function parseTimeMinutes(value: string): number | null {
  const match = /^([01]\d|2[0-3]):([0-5]\d)$/u.exec(value);
  return match ? Number(match[1]) * 60 + Number(match[2]) : null;
}

function isoWeek(date: Date): { week: number; year: number; start: Date; end: Date } {
  const target = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  const day = target.getUTCDay() || 7;
  target.setUTCDate(target.getUTCDate() + 4 - day);
  const year = target.getUTCFullYear();
  const yearStart = new Date(Date.UTC(year, 0, 1));
  const week = Math.ceil(((target.getTime() - yearStart.getTime()) / 86_400_000 + 1) / 7);
  const start = new Date(target);
  start.setUTCDate(target.getUTCDate() - ((target.getUTCDay() + 6) % 7));
  const end = new Date(start);
  end.setUTCDate(start.getUTCDate() + 6);
  return { week, year, start, end };
}

function addDate(date: Date, amount: number, unit: string): Date {
  const result = new Date(date);
  if (unit === "days") result.setDate(result.getDate() + amount);
  if (unit === "weeks") result.setDate(result.getDate() + amount * 7);
  if (unit === "months" || unit === "years") {
    const day = result.getDate();
    result.setDate(1);
    if (unit === "months") result.setMonth(result.getMonth() + amount);
    else result.setFullYear(result.getFullYear() + amount);
    const lastDay = new Date(result.getFullYear(), result.getMonth() + 1, 0).getDate();
    result.setDate(Math.min(day, lastDay));
  }
  return result;
}

function displayDate(date: Date, options?: Intl.DateTimeFormatOptions): string {
  return Number.isNaN(date.getTime())
    ? "Invalid date"
    : new Intl.DateTimeFormat(undefined, options ?? { dateStyle: "full" }).format(date);
}

function getLocalStorage<T>(key: string, fallback: T): T {
  const value = window.localStorage.getItem(key);
  return value === null ? fallback : (JSON.parse(value) as T);
}

function randomSecureIndex(max: number): number {
  const values = new Uint32Array(1);
  crypto.getRandomValues(values);
  return values[0] % max;
}

function convertZonedDateTime(value: string, timeZone: string): Date | null {
  const match = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})$/u.exec(value);
  if (!match) return null;
  const expected = match.slice(1).map(Number);
  const targetUtc = Date.UTC(
    expected[0],
    expected[1] - 1,
    expected[2],
    expected[3],
    expected[4],
  );
  let candidate = targetUtc;

  for (let attempt = 0; attempt < 4; attempt += 1) {
    const parts = new Intl.DateTimeFormat("en-US", {
      timeZone,
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      hourCycle: "h23",
    }).formatToParts(new Date(candidate));
    const values = Object.fromEntries(parts.map((part) => [part.type, Number(part.value)]));
    const representedUtc = Date.UTC(
      values.year,
      values.month - 1,
      values.day,
      values.hour,
      values.minute,
    );
    candidate += targetUtc - representedUtc;
  }

  const actual = new Intl.DateTimeFormat("en-US", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).formatToParts(new Date(candidate));
  const actualValues = Object.fromEntries(actual.map((part) => [part.type, Number(part.value)]));
  const resultParts = [
    actualValues.year,
    actualValues.month,
    actualValues.day,
    actualValues.hour,
    actualValues.minute,
  ];
  return expected.every((part, index) => part === resultParts[index])
    ? new Date(candidate)
    : null;
}

function securePassword(length: number, sets: string[]): string {
  const pool = sets.join("");
  if (!pool) return "";
  const chars = sets.map((set) => set[randomSecureIndex(set.length)]);
  while (chars.length < length) chars.push(pool[randomSecureIndex(pool.length)]);
  for (let index = chars.length - 1; index > 0; index -= 1) {
    const swap = randomSecureIndex(index + 1);
    [chars[index], chars[swap]] = [chars[swap], chars[index]];
  }
  return chars.join("");
}

function TextInput({
  label,
  ...props
}: React.InputHTMLAttributes<HTMLInputElement> & { label: string }) {
  return (
    <label className="productivity-field">
      <span>{label}</span>
      <input {...props} />
    </label>
  );
}

export function ProductivityTool({ toolId }: { toolId: ProductivityToolId }) {
  const definition = productivityToolDefinitions[toolId];
  const [notice, setNotice] = useState("");
  const [dateA, setDateA] = useState(localDateValue());
  const [dateB, setDateB] = useState(localDateValue(new Date(Date.now() + 86_400_000)));
  const [dateTime, setDateTime] = useState(localDateTimeValue());
  const [now, setNow] = useState(Date.now());
  const [timerInput, setTimerInput] = useState(300);
  const [timerEnd, setTimerEnd] = useState<number | null>(null);
  const [timerLeft, setTimerLeft] = useState(300);
  const [stopwatchStart, setStopwatchStart] = useState<number | null>(null);
  const [stopwatchElapsed, setStopwatchElapsed] = useState(0);
  const [laps, setLaps] = useState<number[]>([]);
  const [calendarMonth, setCalendarMonth] = useState(new Date().getMonth());
  const [calendarYear, setCalendarYear] = useState(new Date().getFullYear());
  const [yearValue, setYearValue] = useState(new Date().getFullYear());
  const [holidays, setHolidays] = useState("");
  const [startTime, setStartTime] = useState("09:00");
  const [endTime, setEndTime] = useState("17:00");
  const [breakMinutes, setBreakMinutes] = useState(30);
  const [zoneA, setZoneA] = useState("America/Los_Angeles");
  const [zoneB, setZoneB] = useState("Asia/Kolkata");
  const [unixInput, setUnixInput] = useState(String(Math.floor(Date.now() / 1000)));
  const [unixUnit, setUnixUnit] = useState<"seconds" | "milliseconds">("seconds");
  const [amount, setAmount] = useState(10);
  const [unit, setUnit] = useState("days");
  const [direction, setDirection] = useState<"add" | "subtract">("add");
  const [fromDateTime, setFromDateTime] = useState(localDateTimeValue());
  const [toDateTime, setToDateTime] = useState(localDateTimeValue(new Date(Date.now() + 3_600_000)));
  const [minNumber, setMinNumber] = useState(1);
  const [maxNumber, setMaxNumber] = useState(100);
  const [quantity, setQuantity] = useState(1);
  const [unique, setUnique] = useState(false);
  const [randomResult, setRandomResult] = useState("");
  const [passwordLength, setPasswordLength] = useState(16);
  const [includeLower, setIncludeLower] = useState(true);
  const [includeUpper, setIncludeUpper] = useState(true);
  const [includeNumbers, setIncludeNumbers] = useState(true);
  const [includeSymbols, setIncludeSymbols] = useState(true);
  const [keyword, setKeyword] = useState("");
  const [checklistInput, setChecklistInput] = useState("");
  const [checklist, setChecklist] = useState<ChecklistItem[]>([]);
  const [habits, setHabits] = useState<Habit[]>([]);
  const [habitInput, setHabitInput] = useState("");
  const [planner, setPlanner] = useState<PlannerItem[]>([]);
  const [plannerTime, setPlannerTime] = useState("09:00");
  const [plannerTask, setPlannerTask] = useState("");
  const [eventName, setEventName] = useState("");
  const [eventDate, setEventDate] = useState(localDateTimeValue(new Date(Date.now() + 7 * 86_400_000)));
  const [workdays, setWorkdays] = useState(5);
  const [shifts, setShifts] = useState<Shift[]>([
    { id: 1, start: "09:00", end: "17:00", breakMinutes: 30 },
  ]);
  const [hourlyRate, setHourlyRate] = useState(0);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const active = timerEnd !== null || stopwatchStart !== null || toolId === "world-clock" || toolId === "event-countdown";
    if (!active) return;
    const interval = window.setInterval(() => {
      const timestamp = Date.now();
      setNow(timestamp);
      if (timerEnd !== null) {
        const remaining = Math.max(0, Math.ceil((timerEnd - timestamp) / 1000));
        setTimerLeft(remaining);
        if (remaining === 0) {
          setTimerEnd(null);
          setNotice("Timer complete.");
          if ("Notification" in window && Notification.permission === "granted") {
            new Notification("Countdown complete");
          }
        }
      }
      if (stopwatchStart !== null) {
        setStopwatchElapsed(timestamp - stopwatchStart);
      }
    }, 250);
    return () => window.clearInterval(interval);
  }, [timerEnd, stopwatchStart, toolId]);

  useEffect(() => {
    if (toolId !== "checklist-maker" && toolId !== "habit-tracker" && toolId !== "daily-planner") return;
    try {
      if (toolId === "checklist-maker") setChecklist(getLocalStorage("toolhub-checklist", []));
      if (toolId === "habit-tracker") setHabits(getLocalStorage("toolhub-habits", []));
      if (toolId === "daily-planner") setPlanner(getLocalStorage(`toolhub-planner-${localDateValue()}`, []));
    } catch {
      setNotice("Saved data could not be read. Clear this browser's site data if the problem continues.");
    }
  }, [toolId]);

  function persist<T>(key: string, value: T) {
    try {
      window.localStorage.setItem(key, JSON.stringify(value));
      setNotice("Saved in this browser.");
    } catch {
      setNotice("Could not save locally. Check browser storage permissions.");
    }
  }

  function copy(value: string) {
    void navigator.clipboard.writeText(value).then(
      () => {
        setCopied(true);
        setNotice("Copied to clipboard.");
      },
      () => {
        setCopied(false);
        setNotice("Clipboard unavailable. Select and copy the result manually.");
      },
    );
  }

  const dateResult = dateFromInput(dateA);
  const businessDays = useMemo(() => {
    if (!dateA || !dateB) return 0;
    const start = dateFromInput(dateA);
    const end = dateFromInput(dateB);
    if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) return 0;
    const lower = start <= end ? start : end;
    const upper = start <= end ? end : start;
    const dayCount = daysBetween(lower, upper) + 1;
    const completeWeeks = Math.floor(dayCount / 7);
    let count = completeWeeks * 5;
    const remainder = dayCount % 7;
    for (let index = 0; index < remainder; index += 1) {
      const day = (lower.getDay() + completeWeeks * 7 + index) % 7;
      if (day !== 0 && day !== 6) count += 1;
    }
    const holidaySet = new Set(holidays.split(/[\n,]+/u).map((value) => value.trim()).filter(Boolean));
    for (const holiday of holidaySet) {
      const parsed = dateFromInput(holiday);
      if (Number.isNaN(parsed.getTime()) || parsed < lower || parsed > upper) continue;
      if (parsed.getDay() !== 0 && parsed.getDay() !== 6) count -= 1;
    }
    return count;
  }, [dateA, dateB, holidays]);

  const workingHours = useMemo(() => {
    const startMinutes = parseTimeMinutes(startTime);
    const parsedEndMinutes = parseTimeMinutes(endTime);
    if (startMinutes === null || parsedEndMinutes === null) return null;
    let endMinutes = parsedEndMinutes;
    if (endMinutes < startMinutes) endMinutes += 24 * 60;
    return Math.max(0, endMinutes - startMinutes - Math.max(0, breakMinutes));
  }, [startTime, endTime, breakMinutes]);

  const isoWeekResult = dateFromInput(dateA);
  const weekInfo = Number.isNaN(isoWeekResult.getTime()) ? null : isoWeek(isoWeekResult);
  const zoneDate = useMemo(() => convertZonedDateTime(dateTime, zoneA), [dateTime, zoneA]);
  const zoneAFormatted = zoneDate ? new Intl.DateTimeFormat(undefined, { dateStyle: "full", timeStyle: "long", timeZone: zoneA }).format(zoneDate) : "";
  const zoneBFormatted = zoneDate ? new Intl.DateTimeFormat(undefined, { dateStyle: "full", timeStyle: "long", timeZone: zoneB }).format(zoneDate) : "";
  const timestampDate = Number.isFinite(Number(unixInput))
    ? new Date(Number(unixInput) * (unixUnit === "seconds" ? 1000 : 1))
    : new Date(Number.NaN);
  const durationMillis = new Date(toDateTime).getTime() - new Date(fromDateTime).getTime();
  const durationSeconds = Math.abs(Math.floor(durationMillis / 1000));
  const daysToTarget =
    dateB && !Number.isNaN(dateFromInput(dateB).getTime())
      ? daysBetween(new Date(now), dateFromInput(dateB))
      : null;
  const ageDays =
    dateA && !Number.isNaN(dateFromInput(dateA).getTime())
      ? daysBetween(dateFromInput(dateA), new Date(now))
      : null;
  const calendarFirstDay = new Date(calendarYear, calendarMonth, 1).getDay();
  const calendarDays = new Date(calendarYear, calendarMonth + 1, 0).getDate();
  const calendarCells = [
    ...Array.from({ length: calendarFirstDay }, () => 0),
    ...Array.from({ length: calendarDays }, (_, index) => index + 1),
  ];
  const convertedDate = dateFromInput(dateA);
  const adjustedDate = addDate(convertedDate, direction === "add" ? amount : -amount, unit);
  const workdayDate = useMemo(() => {
    const result = dateFromInput(dateA);
    let remaining = Math.abs(workdays);
    const step = workdays >= 0 ? 1 : -1;
    while (remaining > 0) {
      result.setDate(result.getDate() + step);
      if (result.getDay() !== 0 && result.getDay() !== 6) remaining -= 1;
    }
    return result;
  }, [dateA, workdays]);
  const eventTimestamp = new Date(eventDate).getTime();
  const eventSeconds = Number.isFinite(eventTimestamp)
    ? Math.max(0, Math.floor((eventTimestamp - now) / 1000))
    : null;
  const totalShiftMinutes = shifts.reduce((sum, shift) => {
    const start = parseTimeMinutes(shift.start);
    const end = parseTimeMinutes(shift.end);
    if (start === null || end === null) return sum;
    let minutes = end - start;
    if (minutes < 0) minutes += 24 * 60;
    return sum + Math.max(0, minutes - Math.max(0, shift.breakMinutes));
  }, 0);

  function addChecklistItem() {
    const next = checklistInput.trim();
    if (!next) return;
    const updated = [...checklist, { id: Date.now(), text: next, done: false }];
    setChecklist(updated);
    setChecklistInput("");
    persist("toolhub-checklist", updated);
  }

  function updateChecklist(updated: ChecklistItem[]) {
    setChecklist(updated);
    persist("toolhub-checklist", updated);
  }

  function addHabit() {
    const name = habitInput.trim();
    if (!name) return;
    const updated = [...habits, { id: Date.now(), name, checked: Array(7).fill(false) }];
    setHabits(updated);
    setHabitInput("");
    persist("toolhub-habits", updated);
  }

  function addPlannerItem() {
    const task = plannerTask.trim();
    if (!task) return;
    const updated = [...planner, { id: Date.now(), time: plannerTime, task, done: false }].sort((a, b) => a.time.localeCompare(b.time));
    setPlanner(updated);
    setPlannerTask("");
    persist(`toolhub-planner-${localDateValue()}`, updated);
  }

  function generateNumbers() {
    const low = Math.ceil(Math.min(minNumber, maxNumber));
    const high = Math.floor(Math.max(minNumber, maxNumber));
    if (!Number.isFinite(low) || !Number.isFinite(high) || high < low) {
      setNotice("Enter a valid minimum and maximum.");
      return;
    }
    const count = Math.min(100, Math.max(1, quantity));
    const range = high - low + 1;
    if (unique && count > range) {
      setNotice("Unique results cannot exceed the number of values in the selected range.");
      return;
    }
    const values: number[] = [];
    while (values.length < count) {
      const value = low + Math.floor(Math.random() * range);
      if (!unique || !values.includes(value)) values.push(value);
    }
    setRandomResult(values.join(", "));
  }

  function generatePassword(secure: boolean) {
    const sets = [
      includeLower ? "abcdefghijklmnopqrstuvwxyz" : "",
      includeUpper ? "ABCDEFGHIJKLMNOPQRSTUVWXYZ" : "",
      includeNumbers ? "0123456789" : "",
      includeSymbols ? "!@#$%^&*()-_=+[]{};:,.?" : "",
    ].filter(Boolean);
    if (!sets.length) {
      setNotice("Select at least one character set.");
      return;
    }
    if (secure && !window.isSecureContext) {
      setNotice("Secure password generation requires HTTPS or localhost.");
      return;
    }
    const password = secure
      ? securePassword(Math.min(128, Math.max(8, passwordLength)), sets)
      : [...Array.from({ length: Math.min(128, Math.max(8, passwordLength)) }, () => {
          const pool = sets.join("");
          return pool[Math.floor(Math.random() * pool.length)];
        })].join("");
    setRandomResult(password);
  }

  function generateUsernames() {
    const base = keyword.toLowerCase().normalize("NFKD").replace(/[\u0300-\u036f]/gu, "").replace(/[^a-z0-9]/gu, "");
    if (!base) {
      setNotice("Enter a name or keyword first.");
      return;
    }
    const adjectives = ["bright", "calm", "swift", "curious", "cosmic", "bold", "daily", "clever"];
    const nouns = ["fox", "pixel", "cloud", "maple", "orbit", "maker", "wave", "spark"];
    const generated = Array.from({ length: 8 }, (_, index) =>
      index % 2 === 0
        ? `${adjectives[Math.floor(Math.random() * adjectives.length)]}${base}${Math.floor(Math.random() * 99) + 1}`
        : `${base}${nouns[Math.floor(Math.random() * nouns.length)]}${Math.floor(Math.random() * 99) + 1}`,
    );
    setRandomResult(generated.join("\n"));
  }

  return (
    <section className="productivity-tool" aria-label={`${definition.title} workspace`}>
      <header className="productivity-heading">
        <div>
          <h2>{definition.title}</h2>
          <p>{definition.intro}</p>
        </div>
        <span className="productivity-private">Private, in-browser</span>
      </header>

      {toolId === "world-clock" && (
        <div className="productivity-panel">
          <p className="productivity-live-time">{new Intl.DateTimeFormat(undefined, { timeStyle: "medium" }).format(now)}</p>
          <p className="productivity-muted">Your local time · {displayDate(new Date(now))}</p>
          <div className="world-clock-grid">
            {timeZones.map((zone) => (
              <article key={zone} className="world-clock-card">
                <span>{zone.replaceAll("_", " ")}</span>
                <strong>{new Intl.DateTimeFormat(undefined, { timeStyle: "medium", timeZone: zone }).format(now)}</strong>
                <small>{new Intl.DateTimeFormat(undefined, { dateStyle: "medium", timeZone: zone }).format(now)}</small>
              </article>
            ))}
          </div>
        </div>
      )}

      {toolId === "countdown-timer" && (
        <div className="productivity-panel productivity-center">
          <div className="productivity-live-time">{formatDuration(timerLeft)}</div>
          <TextInput label="Timer length (seconds)" type="number" min={1} max={359999} value={timerInput} onChange={(event) => setTimerInput(Number(event.target.value))} />
          <div className="productivity-actions">
            <button className="button-primary" type="button" onClick={() => {
              if (!Number.isFinite(timerInput) || timerInput < 1) { setNotice("Timer duration must be at least one second."); return; }
              setTimerLeft(Math.floor(timerInput)); setTimerEnd(Date.now() + Math.floor(timerInput) * 1000); setNotice("Timer started.");
            }} disabled={timerEnd !== null}><Play size={16} />Start</button>
            <button className="secondary-button" type="button" onClick={() => {
              if (timerEnd === null || timerLeft <= 0) return;
              const remaining = Math.max(0, Math.ceil((timerEnd - Date.now()) / 1000));
              setTimerLeft(remaining);
              setTimerEnd(null);
              setNotice("Timer paused.");
            }} disabled={timerEnd === null}><Pause size={16} />Pause</button>
            <button className="secondary-button" type="button" onClick={() => {
              if (timerEnd !== null || timerLeft <= 0) return;
              setTimerEnd(Date.now() + timerLeft * 1000);
              setNotice("Timer resumed.");
            }} disabled={timerEnd !== null || timerLeft <= 0}><Play size={16} />Resume</button>
            <button className="secondary-button" type="button" onClick={() => { setTimerEnd(null); setTimerLeft(Math.max(0, Math.floor(timerInput))); setNotice("Timer reset."); }}><RotateCcw size={16} />Reset</button>
          </div>
        </div>
      )}

      {toolId === "stopwatch" && (
        <div className="productivity-panel productivity-center">
          <div className="productivity-live-time">{formatDuration(Math.floor(stopwatchElapsed / 1000))}</div>
          <div className="productivity-actions">
            <button className="button-primary" type="button" onClick={() => setStopwatchStart(Date.now() - stopwatchElapsed)} disabled={stopwatchStart !== null}><Play size={16} />Start</button>
            <button className="secondary-button" type="button" onClick={() => setStopwatchStart(null)} disabled={stopwatchStart === null}><Pause size={16} />Pause</button>
            <button className="secondary-button" type="button" onClick={() => setLaps([...laps, stopwatchElapsed])} disabled={stopwatchStart === null}>Lap</button>
            <button className="secondary-button" type="button" onClick={() => { setStopwatchStart(null); setStopwatchElapsed(0); setLaps([]); }}>Reset</button>
          </div>
          {laps.length > 0 && <ol className="productivity-list">{laps.map((lap, index) => <li key={`${lap}-${index}`}>Lap {index + 1}<strong>{formatDuration(Math.floor(lap / 1000))}</strong></li>)}</ol>}
        </div>
      )}

      {toolId === "calendar-generator" && (
        <div className="productivity-panel">
          <div className="productivity-actions">
            <TextInput label="Month" type="month" value={`${calendarYear}-${String(calendarMonth + 1).padStart(2, "0")}`} onChange={(event) => { const [year, month] = event.target.value.split("-").map(Number); setCalendarYear(year); setCalendarMonth(month - 1); }} />
            <button className="secondary-button" type="button" onClick={() => window.print()}>Print calendar</button>
          </div>
          <h3>{new Intl.DateTimeFormat(undefined, { month: "long", year: "numeric" }).format(new Date(calendarYear, calendarMonth, 1))}</h3>
          <div className="calendar-grid">{["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => <strong key={day}>{day}</strong>)}{calendarCells.map((day, index) => <span key={`${day}-${index}`} className={day ? "calendar-day" : ""}>{day || ""}</span>)}</div>
        </div>
      )}

      {toolId === "leap-year-checker" && (
        <div className="productivity-panel">
          <TextInput label="Year" type="number" min={1} value={yearValue} onChange={(event) => setYearValue(Number(event.target.value))} />
          <p className="productivity-result">{yearValue > 0 && (yearValue % 400 === 0 || (yearValue % 4 === 0 && yearValue % 100 !== 0)) ? `${yearValue} is a leap year.` : `${yearValue} is not a leap year.`}</p>
          <p className="productivity-muted">A leap year has {yearValue > 0 && (yearValue % 400 === 0 || (yearValue % 4 === 0 && yearValue % 100 !== 0)) ? 366 : 365} days.</p>
        </div>
      )}

      {(toolId === "business-days-calculator" || toolId === "days-until-date" || toolId === "age-in-days-calculator" || toolId === "week-number-calculator" || toolId === "date-add-subtract-calculator" || toolId === "workday-calculator") && (
        <div className="productivity-panel">
          {(toolId === "business-days-calculator" || toolId === "days-until-date") && <TextInput label={toolId === "days-until-date" ? "Target date" : "Start date"} type="date" value={toolId === "days-until-date" ? dateB : dateA} onChange={(event) => toolId === "days-until-date" ? setDateB(event.target.value) : setDateA(event.target.value)} />}
          {toolId === "business-days-calculator" && <>
            <TextInput label="End date" type="date" value={dateB} onChange={(event) => setDateB(event.target.value)} />
            <label className="productivity-field"><span>Holidays to exclude (one YYYY-MM-DD per line)</span><textarea value={holidays} onChange={(event) => setHolidays(event.target.value)} rows={3} /></label>
            <p className="productivity-result">{businessDays} weekdays inclusive</p>
          </>}
          {toolId === "days-until-date" && <p className="productivity-result">{daysToTarget === null ? "Choose a valid target date." : daysToTarget === 0 ? "Today is the target date." : `${Math.abs(daysToTarget)} day${Math.abs(daysToTarget) === 1 ? "" : "s"} ${daysToTarget > 0 ? "until" : "since"} the target date.`}</p>}
          {toolId === "age-in-days-calculator" && <>
            <TextInput label="Date of birth" type="date" value={dateA} onChange={(event) => setDateA(event.target.value)} />
            {ageDays === null ? <p className="productivity-notice">Choose a valid date of birth.</p> : <>
              <p className="productivity-result">{Math.max(0, ageDays).toLocaleString()} days old</p>
              <p className="productivity-muted">About {Math.floor(Math.max(0, ageDays) / 7).toLocaleString()} weeks · {Math.floor(Math.max(0, ageDays) / 365.2425).toLocaleString()} years</p>
            </>}
          </>}
          {toolId === "week-number-calculator" && <>
            <TextInput label="Date" type="date" value={dateA} onChange={(event) => setDateA(event.target.value)} />
            {weekInfo && <p className="productivity-result">ISO week {weekInfo.week}, {weekInfo.year}<br />{displayDate(weekInfo.start)} – {displayDate(weekInfo.end)}</p>}
          </>}
          {toolId === "date-add-subtract-calculator" && <>
            <TextInput label="Start date" type="date" value={dateA} onChange={(event) => setDateA(event.target.value)} />
            <div className="productivity-inline">
              <TextInput label="Amount" type="number" value={amount} onChange={(event) => setAmount(Number(event.target.value))} />
              <label className="productivity-field"><span>Unit</span><select value={unit} onChange={(event) => setUnit(event.target.value)}><option value="days">Days</option><option value="weeks">Weeks</option><option value="months">Months</option><option value="years">Years</option></select></label>
              <label className="productivity-field"><span>Operation</span><select value={direction} onChange={(event) => setDirection(event.target.value as "add" | "subtract")}><option value="add">Add</option><option value="subtract">Subtract</option></select></label>
            </div>
            <p className="productivity-result">{displayDate(adjustedDate)}</p>
          </>}
          {toolId === "workday-calculator" && <>
            <TextInput label="Start date" type="date" value={dateA} onChange={(event) => setDateA(event.target.value)} />
            <TextInput label="Working days (negative to go backward)" type="number" value={workdays} onChange={(event) => setWorkdays(Number(event.target.value))} />
            <p className="productivity-result">{displayDate(workdayDate)}</p>
          </>}
        </div>
      )}

      {(toolId === "working-hours-calculator" || toolId === "time-card-calculator") && (
        <div className="productivity-panel">
          {toolId === "working-hours-calculator" ? <>
            <div className="productivity-inline">
              <TextInput label="Start time" type="time" value={startTime} onChange={(event) => setStartTime(event.target.value)} />
              <TextInput label="End time" type="time" value={endTime} onChange={(event) => setEndTime(event.target.value)} />
              <TextInput label="Break (minutes)" type="number" min={0} value={breakMinutes} onChange={(event) => setBreakMinutes(Math.max(0, Number(event.target.value)))} />
            </div>
            {workingHours === null ? (
              <p className="productivity-notice">Enter valid start and end times.</p>
            ) : (
              <p className="productivity-result">{Math.floor(workingHours / 60)}h {workingHours % 60}m net working time</p>
            )}
          </> : <>
            {shifts.map((shift) => <div className="shift-row" key={shift.id}>
              <TextInput label="Start" type="time" value={shift.start} onChange={(event) => setShifts(shifts.map((entry) => entry.id === shift.id ? { ...entry, start: event.target.value } : entry))} />
              <TextInput label="End" type="time" value={shift.end} onChange={(event) => setShifts(shifts.map((entry) => entry.id === shift.id ? { ...entry, end: event.target.value } : entry))} />
              <TextInput label="Break min" type="number" min={0} value={shift.breakMinutes} onChange={(event) => setShifts(shifts.map((entry) => entry.id === shift.id ? { ...entry, breakMinutes: Math.max(0, Number(event.target.value)) } : entry))} />
              <button className="icon-button" aria-label="Remove shift" type="button" onClick={() => setShifts(shifts.filter((entry) => entry.id !== shift.id))}><Trash2 size={16} /></button>
            </div>)}
            <div className="productivity-actions"><button className="secondary-button" type="button" onClick={() => setShifts([...shifts, { id: Date.now(), start: "09:00", end: "17:00", breakMinutes: 0 }])}><Plus size={15} />Add shift</button><TextInput label="Hourly rate (USD, optional)" type="number" min={0} step={0.01} value={hourlyRate} onChange={(event) => setHourlyRate(Number(event.target.value))} /></div>
            <p className="productivity-result">{(totalShiftMinutes / 60).toFixed(2)} hours · Estimated pay {(totalShiftMinutes / 60 * Math.max(0, hourlyRate)).toLocaleString(undefined, { style: "currency", currency: "USD" })}</p>
          </>}
        </div>
      )}

      {(toolId === "time-zone-converter" || toolId === "meeting-time-planner") && (
        <div className="productivity-panel">
          <TextInput label="Date and time" type="datetime-local" value={dateTime} onChange={(event) => setDateTime(event.target.value)} />
          <div className="productivity-inline">
            <label className="productivity-field"><span>{toolId === "meeting-time-planner" ? "Meeting timezone" : "From timezone"}</span><select value={zoneA} onChange={(event) => setZoneA(event.target.value)}>{timeZones.map((zone) => <option key={zone}>{zone}</option>)}</select></label>
            <label className="productivity-field"><span>To timezone</span><select value={zoneB} onChange={(event) => setZoneB(event.target.value)}>{timeZones.map((zone) => <option key={zone}>{zone}</option>)}</select></label>
          </div>
          {zoneDate ? (
            <div className="timezone-results"><p><strong>{zoneA}</strong><br />{zoneAFormatted}</p><p><strong>{zoneB}</strong><br />{zoneBFormatted}</p></div>
          ) : (
            <p className="productivity-notice">That local time does not exist in {zoneA} because of a daylight-saving transition. Choose another time.</p>
          )}
        </div>
      )}

      {toolId === "unix-time-converter" && (
        <div className="productivity-panel">
          <div className="productivity-inline">
            <TextInput label="Unix timestamp" inputMode="numeric" value={unixInput} onChange={(event) => setUnixInput(event.target.value)} />
            <label className="productivity-field"><span>Unit</span><select value={unixUnit} onChange={(event) => setUnixUnit(event.target.value as "seconds" | "milliseconds")}><option value="seconds">Seconds</option><option value="milliseconds">Milliseconds</option></select></label>
          </div>
          <p className="productivity-result">{displayDate(timestampDate, { dateStyle: "full", timeStyle: "long" })}</p>
          <p className="productivity-muted">Current Unix time: {Math.floor(now / 1000)} seconds · {now} milliseconds</p>
          <button className="secondary-button" type="button" onClick={() => { setUnixInput(String(now)); setUnixUnit("milliseconds"); }}>Use current time</button>
        </div>
      )}

      {toolId === "time-duration-calculator" && (
        <div className="productivity-panel">
          <div className="productivity-inline"><TextInput label="From" type="datetime-local" value={fromDateTime} onChange={(event) => setFromDateTime(event.target.value)} /><TextInput label="To" type="datetime-local" value={toDateTime} onChange={(event) => setToDateTime(event.target.value)} /></div>
          <p className="productivity-result">{Number.isFinite(durationMillis) ? `${durationMillis < 0 ? "−" : ""}${Math.floor(durationSeconds / 86400)} days, ${formatDuration(durationSeconds % 86400)}` : "Enter valid date and times."}</p>
        </div>
      )}

      {(toolId === "random-number-generator" || toolId === "random-password-generator" || toolId === "secure-password-generator" || toolId === "username-generator") && (
        <div className="productivity-panel">
          {toolId === "random-number-generator" && <div className="productivity-inline">
            <TextInput label="Minimum" type="number" value={minNumber} onChange={(event) => setMinNumber(Number(event.target.value))} />
            <TextInput label="Maximum" type="number" value={maxNumber} onChange={(event) => setMaxNumber(Number(event.target.value))} />
            <TextInput label="How many" type="number" min={1} max={100} value={quantity} onChange={(event) => setQuantity(Number(event.target.value))} />
            <label className="productivity-check"><input type="checkbox" checked={unique} onChange={(event) => setUnique(event.target.checked)} />Unique results</label>
          </div>}
          {(toolId === "random-password-generator" || toolId === "secure-password-generator") && <>
            <TextInput label="Password length" type="number" min={8} max={128} value={passwordLength} onChange={(event) => setPasswordLength(Number(event.target.value))} />
            <div className="productivity-checks">
              <label className="productivity-check"><input type="checkbox" checked={includeLower} onChange={(event) => setIncludeLower(event.target.checked)} />Lowercase</label>
              <label className="productivity-check"><input type="checkbox" checked={includeUpper} onChange={(event) => setIncludeUpper(event.target.checked)} />Uppercase</label>
              <label className="productivity-check"><input type="checkbox" checked={includeNumbers} onChange={(event) => setIncludeNumbers(event.target.checked)} />Numbers</label>
              <label className="productivity-check"><input type="checkbox" checked={includeSymbols} onChange={(event) => setIncludeSymbols(event.target.checked)} />Symbols</label>
            </div>
          </>}
          {toolId === "username-generator" && <TextInput label="Name or keyword" value={keyword} onChange={(event) => setKeyword(event.target.value)} placeholder="e.g. rohit" />}
          <div className="productivity-actions"><button className="button-primary" type="button" onClick={() => {
            if (toolId === "random-number-generator") generateNumbers();
            else if (toolId === "username-generator") generateUsernames();
            else generatePassword(toolId === "secure-password-generator");
          }}>Generate</button>
          {randomResult && <button className="secondary-button" type="button" onClick={() => copy(randomResult)}>{copied ? <Check size={15} /> : <Clipboard size={15} />}Copy</button>}</div>
          {randomResult && <textarea className="productivity-output" readOnly value={randomResult} aria-label="Generated result" />}
          {toolId === "secure-password-generator" && <p className="productivity-muted">Uses the browser cryptographic random number generator. Passwords are not sent anywhere.</p>}
        </div>
      )}

      {toolId === "checklist-maker" && (
        <div className="productivity-panel">
          <form className="productivity-actions" onSubmit={(event) => { event.preventDefault(); addChecklistItem(); }}><input className="productivity-text-input" value={checklistInput} onChange={(event) => setChecklistInput(event.target.value)} placeholder="Add a task" /><button className="button-primary" type="submit"><Plus size={16} />Add item</button></form>
          <ul className="productivity-list">{checklist.map((item) => <li key={item.id}><label className="productivity-check"><input type="checkbox" checked={item.done} onChange={() => updateChecklist(checklist.map((entry) => entry.id === item.id ? { ...entry, done: !entry.done } : entry))} /><span className={item.done ? "is-done" : ""}>{item.text}</span></label><button className="icon-button" aria-label={`Delete ${item.text}`} type="button" onClick={() => updateChecklist(checklist.filter((entry) => entry.id !== item.id))}><Trash2 size={16} /></button></li>)}</ul>
          <button className="secondary-button" type="button" onClick={() => updateChecklist([])} disabled={!checklist.length}>Clear checklist</button>
        </div>
      )}

      {toolId === "habit-tracker" && (
        <div className="productivity-panel">
          <form className="productivity-actions" onSubmit={(event) => { event.preventDefault(); addHabit(); }}><input className="productivity-text-input" value={habitInput} onChange={(event) => setHabitInput(event.target.value)} placeholder="Add a habit" /><button className="button-primary" type="submit"><Plus size={16} />Add habit</button></form>
          <div className="habit-table"><div className="habit-row habit-header"><strong>Habit</strong>{["M", "T", "W", "T", "F", "S", "S"].map((day, index) => <strong key={`${day}-${index}`}>{day}</strong>)}</div>{habits.map((habit) => <div className="habit-row" key={habit.id}><span>{habit.name}</span>{habit.checked.map((done, index) => <input key={index} aria-label={`${habit.name}, day ${index + 1}`} type="checkbox" checked={done} onChange={() => { const updated = habits.map((entry) => entry.id === habit.id ? { ...entry, checked: entry.checked.map((value, day) => day === index ? !value : value) } : entry); setHabits(updated); persist("toolhub-habits", updated); }} />)}<button className="icon-button" aria-label={`Delete ${habit.name}`} type="button" onClick={() => { const updated = habits.filter((entry) => entry.id !== habit.id); setHabits(updated); persist("toolhub-habits", updated); }}><Trash2 size={14} /></button></div>)}</div>
        </div>
      )}

      {toolId === "daily-planner" && (
        <div className="productivity-panel">
          <p className="productivity-muted">Plan for {displayDate(new Date())}; tasks save in this browser.</p>
          <form className="productivity-actions" onSubmit={(event) => { event.preventDefault(); addPlannerItem(); }}><input className="productivity-text-input productivity-time" type="time" value={plannerTime} onChange={(event) => setPlannerTime(event.target.value)} /><input className="productivity-text-input" value={plannerTask} onChange={(event) => setPlannerTask(event.target.value)} placeholder="Task or appointment" /><button className="button-primary" type="submit"><Plus size={16} />Add</button></form>
          <ul className="productivity-list">{planner.map((item) => <li key={item.id}><label className="productivity-check"><input type="checkbox" checked={item.done} onChange={() => { const updated = planner.map((entry) => entry.id === item.id ? { ...entry, done: !entry.done } : entry); setPlanner(updated); persist(`toolhub-planner-${localDateValue()}`, updated); }} /><strong>{item.time}</strong><span className={item.done ? "is-done" : ""}>{item.task}</span></label><button className="icon-button" aria-label={`Delete ${item.task}`} type="button" onClick={() => { const updated = planner.filter((entry) => entry.id !== item.id); setPlanner(updated); persist(`toolhub-planner-${localDateValue()}`, updated); }}><Trash2 size={16} /></button></li>)}</ul>
        </div>
      )}

      {(toolId === "event-countdown") && (
        <div className="productivity-panel productivity-center">
          <TextInput label="Event name" value={eventName} onChange={(event) => setEventName(event.target.value)} placeholder="My event" />
          <TextInput label="Event date and time" type="datetime-local" value={eventDate} onChange={(event) => setEventDate(event.target.value)} />
          {eventSeconds === null ? (
            <p className="productivity-notice">Enter a valid event date and time.</p>
          ) : (
            <>
              <div className="productivity-live-time">{formatDuration(eventSeconds % 86400)}</div>
              <p className="productivity-result">{eventSeconds === 0 ? "The event is happening now or has passed." : `${Math.floor(eventSeconds / 86400)} days ${formatDuration(eventSeconds % 86400)} remaining`}</p>
            </>
          )}
          {eventName && <p className="productivity-muted">Countdown to {eventName}</p>}
        </div>
      )}

      {toolId === "meeting-time-planner" && <p className="productivity-muted">Times are converted using the selected local date/time and current timezone rules, including daylight-saving changes.</p>}

      {toolId === "time-card-calculator" && totalShiftMinutes < 0 && <p className="productivity-muted">Check shift entries for valid start and end times.</p>}

      {notice && <p className="productivity-notice" role="status" aria-live="polite">{notice}</p>}
    </section>
  );
}
