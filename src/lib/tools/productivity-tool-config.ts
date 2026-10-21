export const productivityToolDefinitions = {
  "world-clock": {
    title: "World Clock",
    intro: "See current local times across cities and time zones.",
  },
  "countdown-timer": {
    title: "Countdown Timer",
    intro: "Set a countdown timer and get an alert when it finishes.",
  },
  stopwatch: {
    title: "Stopwatch",
    intro: "Measure elapsed time and record lap times.",
  },
  "calendar-generator": {
    title: "Calendar Generator",
    intro: "Create and print a calendar for any month and year.",
  },
  "leap-year-checker": {
    title: "Leap Year Checker",
    intro: "Check whether a year is a leap year and see its calendar details.",
  },
  "business-days-calculator": {
    title: "Business Days Calculator",
    intro: "Count weekdays between dates and optionally exclude holidays.",
  },
  "working-hours-calculator": {
    title: "Working Hours Calculator",
    intro: "Calculate net hours between start and end times after breaks.",
  },
  "week-number-calculator": {
    title: "Week Number Calculator",
    intro: "Find the ISO week number and week dates for any date.",
  },
  "time-zone-converter": {
    title: "Time Zone Converter",
    intro: "Convert a date and time between IANA time zones.",
  },
  "unix-time-converter": {
    title: "Unix Time Converter",
    intro: "Convert Unix timestamps to dates and dates to Unix time.",
  },
  "date-add-subtract-calculator": {
    title: "Date Add/Subtract Calculator",
    intro: "Add or subtract days, weeks, months, or years from a date.",
  },
  "time-duration-calculator": {
    title: "Time Duration Calculator",
    intro: "Calculate the duration between two dates and times.",
  },
  "meeting-time-planner": {
    title: "Meeting Time Planner",
    intro: "Compare a proposed meeting time across time zones.",
  },
  "days-until-date": {
    title: "Days Until Date",
    intro: "Count the days between today and an upcoming date.",
  },
  "age-in-days-calculator": {
    title: "Age in Days Calculator",
    intro: "Calculate your age in days, weeks, and years.",
  },
  "random-number-generator": {
    title: "Random Number Generator",
    intro: "Generate random integers in a range with optional unique results.",
  },
  "random-password-generator": {
    title: "Random Password Generator",
    intro: "Generate passwords with adjustable length and character sets.",
  },
  "secure-password-generator": {
    title: "Secure Password Generator",
    intro: "Generate cryptographically secure passwords in your browser.",
  },
  "username-generator": {
    title: "Username Generator",
    intro: "Generate username ideas from a name, topic, or keyword.",
  },
  "checklist-maker": {
    title: "Checklist Maker",
    intro: "Create and save a checklist locally in your browser.",
  },
  "habit-tracker": {
    title: "Habit Tracker",
    intro: "Track daily habits with a simple private weekly check-in.",
  },
  "daily-planner": {
    title: "Daily Planner",
    intro: "Plan the day with editable tasks and time slots saved locally.",
  },
  "event-countdown": {
    title: "Event Countdown",
    intro: "Create a live countdown to an event date and time.",
  },
  "workday-calculator": {
    title: "Workday Calculator",
    intro: "Find a date a number of working days before or after a start date.",
  },
  "time-card-calculator": {
    title: "Time Card Calculator",
    intro: "Add multiple shifts and calculate total hours and pay.",
  },
} as const;

export type ProductivityToolId = keyof typeof productivityToolDefinitions;

export const productivityToolIds = Object.keys(
  productivityToolDefinitions,
) as ProductivityToolId[];

export function isProductivityToolId(id: string): id is ProductivityToolId {
  return id in productivityToolDefinitions;
}
