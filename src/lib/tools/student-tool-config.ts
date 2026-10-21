export const studentToolDefinitions = {
  "cgpa-calculator": {
    title: "CGPA Calculator",
    intro: "Calculate a cumulative GPA from course credits and grade points.",
  },
  "sgpa-calculator": {
    title: "SGPA Calculator",
    intro: "Calculate a semester GPA from course credits and grade points.",
  },
  "cgpa-to-percentage": {
    title: "CGPA to Percentage",
    intro: "Convert a CGPA to a percentage using your institution's multiplier.",
  },
  "percentage-calculator": {
    title: "Percentage Calculator",
    intro: "Find a percentage of a value, a value's percentage, or a percentage change.",
  },
  "attendance-calculator": {
    title: "Attendance Calculator",
    intro: "Calculate your attendance percentage from classes attended and held.",
  },
  "required-attendance-calculator": {
    title: "Required Attendance Calculator",
    intro: "Find how many consecutive classes you must attend to reach a target.",
  },
  "marks-calculator": {
    title: "Marks Calculator",
    intro: "Add assessment marks and calculate your total and percentage.",
  },
  "grade-calculator": {
    title: "Grade Calculator",
    intro: "Convert a percentage score into a letter grade using common grade bands.",
  },
  "gate-score-estimator": {
    title: "GATE Score Estimator",
    intro: "Estimate a GATE score from marks and the official formula parameters.",
  },
  "age-eligibility-calculator": {
    title: "Age Eligibility Calculator",
    intro: "Check age on a specified date against minimum and maximum limits.",
  },
  "exam-countdown": {
    title: "Exam Countdown",
    intro: "See how many days remain until your exam date.",
  },
  "study-hours-calculator": {
    title: "Study Hours Calculator",
    intro: "Plan the daily study time needed to finish your remaining study hours.",
  },
  "semester-marks-calculator": {
    title: "Semester Marks Calculator",
    intro: "Combine internal and final exam marks using their maximum scores.",
  },
  "scholarship-checklist": {
    title: "Scholarship Checklist",
    intro: "Build and track a scholarship application checklist saved in this browser.",
  },
  "study-timetable-generator": {
    title: "Study Timetable Generator",
    intro: "Generate a balanced study plan from your subjects and available time.",
  },
  "gpa-calculator": {
    title: "GPA Calculator",
    intro: "Calculate a credit-weighted GPA from course grade points.",
  },
  "weighted-average-calculator": {
    title: "Weighted Average Calculator",
    intro: "Calculate the weighted average of values and their weights.",
  },
  "exam-percentage-calculator": {
    title: "Exam Percentage Calculator",
    intro: "Calculate your exam percentage from marks earned and possible.",
  },
  "target-marks-calculator": {
    title: "Target Marks Calculator",
    intro: "Find the score needed on remaining work to reach a target overall percentage.",
  },
  "study-break-timer": {
    title: "Study Break Timer",
    intro: "Run a simple focus and break timer for structured study sessions.",
  },
  "assignment-word-counter": {
    title: "Assignment Word Counter",
    intro: "Count words, characters, and estimated pages in an assignment draft.",
  },
  "citation-formatter": {
    title: "Citation Formatter",
    intro: "Format a basic book or article citation in APA, MLA, or Chicago style.",
  },
  "flashcard-generator": {
    title: "Flashcard Generator",
    intro: "Create interactive flashcards from lines of question-and-answer text.",
  },
  "pomodoro-timer": {
    title: "Pomodoro Timer",
    intro: "Focus in timed work intervals with short breaks between sessions.",
  },
  "timetable-maker": {
    title: "Timetable Maker",
    intro: "Create a weekly class or study timetable saved in this browser.",
  },
} as const;

export type StudentToolId = keyof typeof studentToolDefinitions;

export const studentToolIds = Object.keys(
  studentToolDefinitions,
) as StudentToolId[];

export function isStudentToolId(id: string): id is StudentToolId {
  return Object.hasOwn(studentToolDefinitions, id);
}
