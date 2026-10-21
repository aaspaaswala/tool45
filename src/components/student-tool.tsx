"use client";

import { useEffect, useMemo, useState, type InputHTMLAttributes } from "react";
import { Plus, RotateCcw, Trash2 } from "lucide-react";

import {
  studentToolDefinitions,
  type StudentToolId,
} from "@/lib/tools/student-tool-config";

type Course = { id: number; name: string; credits: number; grade: number };
type Mark = { id: number; name: string; earned: number; possible: number };
type ChecklistItem = { id: number; text: string; done: boolean };
type TimetableEntry = { id: number; day: string; time: string; subject: string };

function localDateValue(date = new Date()): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

function Input({
  label,
  ...props
}: InputHTMLAttributes<HTMLInputElement> & { label: string }) {
  return (
    <label className="productivity-field">
      <span>{label}</span>
      <input {...props} />
    </label>
  );
}

function Result({ children }: { children: React.ReactNode }) {
  return <p className="productivity-result" aria-live="polite">{children}</p>;
}

function numeric(value: number): string {
  return Number.isFinite(value) ? value.toLocaleString(undefined, { maximumFractionDigits: 2 }) : "—";
}

function ageOnDate(birth: Date, asOf: Date): number {
  let years = asOf.getFullYear() - birth.getFullYear();
  const birthdayHasPassed =
    asOf.getMonth() > birth.getMonth() ||
    (asOf.getMonth() === birth.getMonth() && asOf.getDate() >= birth.getDate());
  if (!birthdayHasPassed) years -= 1;
  return years;
}

export function StudentTool({ toolId }: { toolId: StudentToolId }) {
  const [notice, setNotice] = useState("");
  const [courses, setCourses] = useState<Course[]>([
    { id: 1, name: "Course 1", credits: 3, grade: 8 },
    { id: 2, name: "Course 2", credits: 3, grade: 9 },
  ]);
  const [gradeScale, setGradeScale] = useState(10);
  const [factor, setFactor] = useState(9.5);
  const [numberA, setNumberA] = useState(75);
  const [numberB, setNumberB] = useState(100);
  const [numberC, setNumberC] = useState(10);
  const [cgpaValue, setCgpaValue] = useState(8);
  const [attendanceTarget, setAttendanceTarget] = useState(75);
  const [marks, setMarks] = useState<Mark[]>([
    { id: 1, name: "Assessment 1", earned: 0, possible: 100 },
  ]);
  const [gradeScore, setGradeScore] = useState(85);
  const [birthDate, setBirthDate] = useState("2005-01-01");
  const [asOfDate, setAsOfDate] = useState(localDateValue());
  const [minAge, setMinAge] = useState(0);
  const [maxAge, setMaxAge] = useState(100);
  const [targetDate, setTargetDate] = useState(localDateValue(new Date(Date.now() + 30 * 86_400_000)));
  const [hoursRemaining, setHoursRemaining] = useState(30);
  const [daysAvailable, setDaysAvailable] = useState(10);
  const [internalEarned, setInternalEarned] = useState(30);
  const [internalPossible, setInternalPossible] = useState(40);
  const [finalEarned, setFinalEarned] = useState(45);
  const [finalPossible, setFinalPossible] = useState(60);
  const [gateMarks, setGateMarks] = useState(50);
  const [gateQualifyingMarks, setGateQualifyingMarks] = useState(25);
  const [gateTopMarks, setGateTopMarks] = useState(75);
  const [gateQualifyingScore, setGateQualifyingScore] = useState(350);
  const [gateMaxScore, setGateMaxScore] = useState(900);
  const [completedWeight, setCompletedWeight] = useState(40);
  const [currentScore, setCurrentScore] = useState(80);
  const [targetScore, setTargetScore] = useState(85);
  const [assignment, setAssignment] = useState("");
  const [citationStyle, setCitationStyle] = useState("APA");
  const [author, setAuthor] = useState("");
  const [citationTitle, setCitationTitle] = useState("");
  const [publisher, setPublisher] = useState("");
  const [publicationYear, setPublicationYear] = useState(String(new Date().getFullYear()));
  const [flashcardText, setFlashcardText] = useState("");
  const [flashcardIndex, setFlashcardIndex] = useState(0);
  const [showAnswer, setShowAnswer] = useState(false);
  const [focusMinutes, setFocusMinutes] = useState(toolId === "study-break-timer" ? 45 : 25);
  const [breakMinutes, setBreakMinutes] = useState(toolId === "study-break-timer" ? 10 : 5);
  const [phase, setPhase] = useState<"focus" | "break">("focus");
  const [secondsLeft, setSecondsLeft] = useState((toolId === "study-break-timer" ? 45 : 25) * 60);
  const [timerRunning, setTimerRunning] = useState(false);
  const [subjects, setSubjects] = useState("Math\nScience\nEnglish");
  const [studyHoursPerDay, setStudyHoursPerDay] = useState(3);
  const [studyDays, setStudyDays] = useState(5);
  const [checklistInput, setChecklistInput] = useState("");
  const [checklist, setChecklist] = useState<ChecklistItem[]>([]);
  const [timetableDay, setTimetableDay] = useState("Monday");
  const [timetableTime, setTimetableTime] = useState("09:00");
  const [timetableSubject, setTimetableSubject] = useState("");
  const [timetable, setTimetable] = useState<TimetableEntry[]>([]);

  useEffect(() => {
    if (toolId !== "scholarship-checklist" && toolId !== "timetable-maker") return;
    try {
      const key = toolId === "scholarship-checklist" ? "toolhub-scholarship-checklist" : "toolhub-student-timetable";
      const saved = window.localStorage.getItem(key);
      if (!saved) return;
      if (toolId === "scholarship-checklist") setChecklist(JSON.parse(saved) as ChecklistItem[]);
      else setTimetable(JSON.parse(saved) as TimetableEntry[]);
    } catch {
      setNotice("Saved data could not be read. Clear this browser's site data if the problem continues.");
    }
  }, [toolId]);

  useEffect(() => {
    if (!timerRunning) return;
    const interval = window.setInterval(() => {
      setSecondsLeft((seconds) => {
        if (seconds > 1) return seconds - 1;
        setTimerRunning(false);
        setNotice(`${phase === "focus" ? "Focus" : "Break"} session complete.`);
        const nextPhase = phase === "focus" ? "break" : "focus";
        setPhase(nextPhase);
        return (nextPhase === "focus" ? focusMinutes : breakMinutes) * 60;
      });
    }, 1000);
    return () => window.clearInterval(interval);
  }, [timerRunning, phase, focusMinutes, breakMinutes]);

  function saveLocal(key: string, value: unknown) {
    try {
      window.localStorage.setItem(key, JSON.stringify(value));
      setNotice("Saved in this browser.");
    } catch {
      setNotice("Could not save locally. Check browser storage permissions.");
    }
  }

  function addCourse() {
    setCourses((items) => [...items, { id: Date.now(), name: `Course ${items.length + 1}`, credits: 3, grade: 8 }]);
  }

  function addMark() {
    setMarks((items) => [...items, { id: Date.now(), name: `Assessment ${items.length + 1}`, earned: 0, possible: 100 }]);
  }

  function addChecklistItem(text = checklistInput) {
    const trimmed = text.trim();
    if (!trimmed) return;
    const updated = [...checklist, { id: Date.now(), text: trimmed, done: false }];
    setChecklist(updated);
    setChecklistInput("");
    saveLocal("toolhub-scholarship-checklist", updated);
  }

  function addTimetableEntry(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!timetableSubject.trim()) {
      setNotice("Enter a class or study subject first.");
      return;
    }
    const updated = [...timetable, { id: Date.now(), day: timetableDay, time: timetableTime, subject: timetableSubject.trim() }]
      .sort((a, b) => ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"].indexOf(a.day) - ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"].indexOf(b.day) || a.time.localeCompare(b.time));
    setTimetable(updated);
    setTimetableSubject("");
    saveLocal("toolhub-student-timetable", updated);
  }

  const courseCredits = courses.reduce((sum, course) => sum + Math.max(0, course.credits), 0);
  const coursesValid = gradeScale > 0 && courses.every(
    (course) => course.credits >= 0 && course.grade >= 0 && course.grade <= gradeScale,
  );
  const gpa = courseCredits > 0
    ? courses.reduce((sum, course) => sum + Math.max(0, course.credits) * course.grade, 0) / courseCredits
    : null;
  const marksValid = marks.every((item) =>
    item.earned >= 0 && item.possible >= 0 && item.earned <= item.possible,
  );
  const totalEarned = marks.reduce((sum, item) => sum + Math.max(0, item.earned), 0);
  const totalPossible = marks.reduce((sum, item) => sum + Math.max(0, item.possible), 0);
  const marksPercent = totalPossible > 0 ? (totalEarned / totalPossible) * 100 : null;
  const parsedBirth = new Date(`${birthDate}T00:00:00`);
  const parsedAsOf = new Date(`${asOfDate}T00:00:00`);
  const age = !Number.isNaN(parsedBirth.getTime()) && !Number.isNaN(parsedAsOf.getTime())
    ? ageOnDate(parsedBirth, parsedAsOf)
    : null;
  const countdownDays = targetDate
    ? Math.ceil((new Date(`${targetDate}T00:00:00`).getTime() - new Date(`${localDateValue()}T00:00:00`).getTime()) / 86_400_000)
    : null;
  const flashcards = useMemo(
    () => flashcardText.split(/\r?\n/u).map((line) => {
      const separator = line.includes("::") ? "::" : "\t";
      const splitAt = line.indexOf(separator);
      return splitAt < 0 ? null : { front: line.slice(0, splitAt).trim(), back: line.slice(splitAt + separator.length).trim() };
    }).filter((card): card is { front: string; back: string } => Boolean(card?.front && card.back)),
    [flashcardText],
  );
  const schedule = useMemo(() => {
    const items = subjects.split(/\r?\n/u).map((subject) => subject.trim()).filter(Boolean);
    if (!items.length || studyDays < 1 || studyHoursPerDay <= 0) return [];
    const sessionsPerDay = Math.min(12, Math.max(1, Math.floor(studyHoursPerDay)));
    return Array.from({ length: Math.min(30, Math.floor(studyDays)) }, (_, day) =>
      Array.from({ length: sessionsPerDay }, (_, session) => items[(day * sessionsPerDay + session) % items.length]),
    );
  }, [subjects, studyDays, studyHoursPerDay]);
  const daysOfWeek = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];
  const timerDisplay = `${String(Math.floor(secondsLeft / 60)).padStart(2, "0")}:${String(secondsLeft % 60).padStart(2, "0")}`;
  const wordCount = assignment.trim() ? assignment.trim().split(/\s+/u).length : 0;
  const citation = (() => {
    const cleanAuthor = author.trim();
    const cleanTitle = citationTitle.trim();
    const cleanPublisher = publisher.trim();
    const year = publicationYear.trim();
    if (!cleanTitle) return "";
    if (citationStyle === "MLA") return `${cleanAuthor ? `${cleanAuthor}. ` : ""}"${cleanTitle}."${cleanPublisher ? ` ${cleanPublisher},` : ""} ${year}.`.trim();
    if (citationStyle === "Chicago") return `${cleanAuthor ? `${cleanAuthor}. ` : ""}${cleanTitle}.${cleanPublisher ? ` ${cleanPublisher},` : ""} ${year}.`.trim();
    return `${cleanAuthor ? `${cleanAuthor}. ` : ""}(${year}). ${cleanTitle}.${cleanPublisher ? ` ${cleanPublisher}.` : ""}`;
  })();
  const requiredNextScore = completedWeight < 100
    ? (targetScore * 100 - currentScore * completedWeight) / (100 - completedWeight)
    : null;

  return (
    <section className="productivity-panel" aria-label={`${studentToolDefinitions[toolId].title} workspace`}>
      {(toolId === "cgpa-calculator" || toolId === "sgpa-calculator" || toolId === "gpa-calculator") && (
        <>
          <div className="productivity-actions">
            <Input label="Maximum grade point" type="number" min={1} max={100} step="any" value={gradeScale} onChange={(event) => setGradeScale(Number(event.target.value))} />
            <button className="button-primary" type="button" onClick={addCourse}><Plus size={16} />Add course</button>
          </div>
          {courses.map((course) => (
            <div className="productivity-inline" key={course.id}>
              <Input label="Course" value={course.name} onChange={(event) => setCourses((items) => items.map((entry) => entry.id === course.id ? { ...entry, name: event.target.value } : entry))} />
              <Input label="Credits" type="number" min={0} step="any" value={course.credits} onChange={(event) => setCourses((items) => items.map((entry) => entry.id === course.id ? { ...entry, credits: Number(event.target.value) } : entry))} />
              <Input label="Grade points" type="number" min={0} max={gradeScale} step="any" value={course.grade} onChange={(event) => setCourses((items) => items.map((entry) => entry.id === course.id ? { ...entry, grade: Number(event.target.value) } : entry))} />
              <button className="icon-button" type="button" aria-label={`Remove ${course.name}`} onClick={() => setCourses((items) => items.filter((entry) => entry.id !== course.id))}><Trash2 size={16} /></button>
            </div>
          ))}
          <Result>{!coursesValid
            ? "Check that credits and grade points are non-negative and grade points do not exceed the selected scale."
            : gpa === null ? "Enter positive course credits to calculate." : `Weighted GPA: ${numeric(gpa)} / ${numeric(gradeScale)} · ${numeric(courseCredits)} credits`}</Result>
          <p className="productivity-muted">Use the same grade-point scale and credit rules as your institution.</p>
        </>
      )}

      {toolId === "cgpa-to-percentage" && (
        <div className="productivity-inline">
          <Input label="CGPA" type="number" min={0} max={gradeScale} step="any" value={cgpaValue} onChange={(event) => setCgpaValue(Number(event.target.value))} />
          <Input label="Institution multiplier" type="number" min={0} step="any" value={factor} onChange={(event) => setFactor(Number(event.target.value))} />
          <Result>{cgpaValue >= 0 && cgpaValue <= gradeScale && factor >= 0
            ? `${numeric(cgpaValue * factor)}%`
            : `Enter a CGPA between 0 and ${numeric(gradeScale)} and a non-negative multiplier.`}</Result>
          <p className="productivity-muted">Conversion rules vary. Change the multiplier to the one published by your institution.</p>
        </div>
      )}

      {toolId === "percentage-calculator" && (
        <>
          <div className="productivity-inline">
            <Input label="Percentage / new value" type="number" step="any" value={numberA} onChange={(event) => setNumberA(Number(event.target.value))} />
            <Input label="Value / original value" type="number" step="any" value={numberB} onChange={(event) => setNumberB(Number(event.target.value))} />
            <Input label="Percentage for 'what is x% of y'" type="number" step="any" value={numberC} onChange={(event) => setNumberC(Number(event.target.value))} />
          </div>
          <Result>{numeric(numberC)}% of {numeric(numberB)} = {numeric(numberC * numberB / 100)} · {numeric(numberA)} is {numberB ? `${numeric(numberA / numberB * 100)}%` : "—"} of {numeric(numberB)} · Change: {numberB ? `${numeric((numberA - numberB) / Math.abs(numberB) * 100)}%` : "—"}</Result>
        </>
      )}

      {(toolId === "attendance-calculator" || toolId === "required-attendance-calculator") && (
        <>
          <div className="productivity-inline">
            <Input label="Classes attended" type="number" min={0} value={numberA} onChange={(event) => setNumberA(Number(event.target.value))} />
            <Input label="Total classes held" type="number" min={0} value={numberB} onChange={(event) => setNumberB(Number(event.target.value))} />
            {toolId === "required-attendance-calculator" && <Input label="Target attendance (%)" type="number" min={1} max={100} value={attendanceTarget} onChange={(event) => setAttendanceTarget(Number(event.target.value))} />}
          </div>
          {toolId === "attendance-calculator" ? (
            <Result>{numberB > 0 && numberA >= 0 && numberA <= numberB
              ? `${numeric(numberA / numberB * 100)}% attendance`
              : "Enter attended classes between zero and the positive total classes held."}</Result>
          ) : (
            <Result>{numberB <= 0 || numberA < 0 || numberA > numberB || attendanceTarget <= 0 || attendanceTarget >= 100
              ? "Enter attended classes within the total and a target between 1% and 99%."
              : numberA / numberB * 100 >= attendanceTarget
                ? `Target met. You may miss up to ${Math.floor(numberA / (attendanceTarget / 100) - numberB)} more class${Math.floor(numberA / (attendanceTarget / 100) - numberB) === 1 ? "" : "es"} and remain at the target.`
                : `Attend ${Math.max(0, Math.ceil((attendanceTarget * numberB / 100 - numberA) / (1 - attendanceTarget / 100)))} consecutive classes to reach ${attendanceTarget}%.`}</Result>
          )}
        </>
      )}

      {(toolId === "marks-calculator" || toolId === "weighted-average-calculator") && (
        <>
          <div className="productivity-actions">
            <button className="button-primary" type="button" onClick={addMark}><Plus size={16} />Add {toolId === "marks-calculator" ? "assessment" : "value"}</button>
          </div>
          {marks.map((item) => (
            <div className="productivity-inline" key={item.id}>
              <Input label={toolId === "marks-calculator" ? "Assessment" : "Value"} value={item.name} onChange={(event) => setMarks((items) => items.map((entry) => entry.id === item.id ? { ...entry, name: event.target.value } : entry))} />
              <Input label={toolId === "marks-calculator" ? "Marks earned" : "Value"} type="number" step="any" value={item.earned} onChange={(event) => setMarks((items) => items.map((entry) => entry.id === item.id ? { ...entry, earned: Number(event.target.value) } : entry))} />
              <Input label={toolId === "marks-calculator" ? "Marks possible" : "Weight"} type="number" min={0} step="any" value={item.possible} onChange={(event) => setMarks((items) => items.map((entry) => entry.id === item.id ? { ...entry, possible: Number(event.target.value) } : entry))} />
              <button className="icon-button" type="button" aria-label={`Remove ${item.name}`} onClick={() => setMarks((items) => items.filter((entry) => entry.id !== item.id))}><Trash2 size={16} /></button>
            </div>
          ))}
          {toolId === "marks-calculator"
            ? <Result>{!marksValid
              ? "Marks must be non-negative and earned marks cannot exceed marks possible."
              : totalPossible > 0 ? `${numeric(totalEarned)} / ${numeric(totalPossible)} · ${numeric(marksPercent ?? 0)}%` : "Enter marks possible greater than zero."}</Result>
            : <Result>{marks.some((item) => item.possible < 0)
              ? "Weights cannot be negative."
              : marks.reduce((sum, item) => sum + item.possible, 0) > 0
                ? `Weighted average: ${numeric(marks.reduce((sum, item) => sum + item.earned * item.possible, 0) / marks.reduce((sum, item) => sum + item.possible, 0))}`
                : "Enter a positive weight."}</Result>}
        </>
      )}

      {toolId === "grade-calculator" && (
        <div className="productivity-inline">
          <Input label="Score (%)" type="number" min={0} max={100} step="any" value={gradeScore} onChange={(event) => setGradeScore(Number(event.target.value))} />
          <Result>{gradeScore < 0 || gradeScore > 100
            ? "Enter a score from 0% to 100%."
            : `${gradeScore >= 90 ? "A" : gradeScore >= 80 ? "B" : gradeScore >= 70 ? "C" : gradeScore >= 60 ? "D" : "F"} grade · ${numeric(gradeScore)}%`}</Result>
          <p className="productivity-muted">Common default bands: A ≥ 90, B ≥ 80, C ≥ 70, D ≥ 60. Your school may use different thresholds.</p>
        </div>
      )}

      {toolId === "gate-score-estimator" && (
        <>
          <div className="productivity-inline">
            <Input label="Your marks" type="number" step="any" value={gateMarks} onChange={(event) => setGateMarks(Number(event.target.value))} />
            <Input label="Qualifying marks (Mq)" type="number" step="any" value={gateQualifyingMarks} onChange={(event) => setGateQualifyingMarks(Number(event.target.value))} />
            <Input label="Top-score reference marks (M0)" type="number" step="any" value={gateTopMarks} onChange={(event) => setGateTopMarks(Number(event.target.value))} />
            <Input label="Qualifying score (Sq)" type="number" step="any" value={gateQualifyingScore} onChange={(event) => setGateQualifyingScore(Number(event.target.value))} />
            <Input label="Maximum score (St)" type="number" step="any" value={gateMaxScore} onChange={(event) => setGateMaxScore(Number(event.target.value))} />
          </div>
          <Result>{gateTopMarks > gateQualifyingMarks
            ? `Estimated score: ${numeric(gateQualifyingScore + (gateMarks - gateQualifyingMarks) * (gateMaxScore - gateQualifyingScore) / (gateTopMarks - gateQualifyingMarks))}`
            : "Top-score reference marks must exceed qualifying marks."}</Result>
          <p className="productivity-muted">Planning estimate only. The official GATE score depends on the paper, year, and published normalization parameters.</p>
        </>
      )}

      {toolId === "age-eligibility-calculator" && (
        <>
          <div className="productivity-inline">
            <Input label="Date of birth" type="date" value={birthDate} onChange={(event) => setBirthDate(event.target.value)} />
            <Input label="Check eligibility on" type="date" value={asOfDate} onChange={(event) => setAsOfDate(event.target.value)} />
            <Input label="Minimum age" type="number" min={0} value={minAge} onChange={(event) => setMinAge(Number(event.target.value))} />
            <Input label="Maximum age" type="number" min={0} value={maxAge} onChange={(event) => setMaxAge(Number(event.target.value))} />
          </div>
          <Result>{age === null || age < 0
            ? "Enter valid dates."
            : `${age} years old · ${age >= minAge && age <= maxAge ? "Within the specified age range" : "Outside the specified age range"}`}</Result>
          <p className="productivity-muted">Eligibility rules may include category-based relaxations or a different cutoff date. Verify the official notice.</p>
        </>
      )}

      {toolId === "exam-countdown" && (
        <>
          <Input label="Exam date" type="date" value={targetDate} onChange={(event) => setTargetDate(event.target.value)} />
          <Result>{countdownDays === null || !Number.isFinite(countdownDays)
            ? "Choose a valid exam date."
            : countdownDays > 0
              ? `${countdownDays} day${countdownDays === 1 ? "" : "s"} until your exam.`
              : countdownDays === 0 ? "Your exam is today." : `The exam date was ${Math.abs(countdownDays)} day${Math.abs(countdownDays) === 1 ? "" : "s"} ago.`}</Result>
        </>
      )}

      {toolId === "study-hours-calculator" && (
        <div className="productivity-inline">
          <Input label="Study hours remaining" type="number" min={0} step="any" value={hoursRemaining} onChange={(event) => setHoursRemaining(Number(event.target.value))} />
          <Input label="Days available" type="number" min={1} value={daysAvailable} onChange={(event) => setDaysAvailable(Number(event.target.value))} />
          <Result>{daysAvailable > 0 && hoursRemaining >= 0
            ? `${numeric(hoursRemaining / daysAvailable)} hours per day · about ${numeric(Math.ceil(hoursRemaining / daysAvailable * 2))} half-hour sessions per day`
            : "Enter non-negative remaining hours and at least one day."}</Result>
        </div>
      )}

      {toolId === "semester-marks-calculator" && (
        <div className="productivity-inline">
          <Input label="Internal marks earned" type="number" min={0} step="any" value={internalEarned} onChange={(event) => setInternalEarned(Number(event.target.value))} />
          <Input label="Internal marks possible" type="number" min={0} step="any" value={internalPossible} onChange={(event) => setInternalPossible(Number(event.target.value))} />
          <Input label="Final exam marks earned" type="number" min={0} step="any" value={finalEarned} onChange={(event) => setFinalEarned(Number(event.target.value))} />
          <Input label="Final exam marks possible" type="number" min={0} step="any" value={finalPossible} onChange={(event) => setFinalPossible(Number(event.target.value))} />
          <Result>{internalEarned < 0 || finalEarned < 0 || internalPossible < 0 || finalPossible < 0 || internalEarned > internalPossible || finalEarned > finalPossible
            ? "Earned marks must be non-negative and cannot exceed the possible marks."
            : internalPossible + finalPossible > 0
            ? `${numeric(internalEarned + finalEarned)} / ${numeric(internalPossible + finalPossible)} · ${numeric((internalEarned + finalEarned) / (internalPossible + finalPossible) * 100)}%`
            : "Enter the maximum possible marks."}</Result>
        </div>
      )}

      {toolId === "scholarship-checklist" && (
        <>
          <p className="productivity-muted">Checklist entries stay in this browser. Requirements vary by scholarship; confirm against the official application.</p>
          <form className="productivity-actions" onSubmit={(event) => { event.preventDefault(); addChecklistItem(); }}>
            <input className="productivity-text-input" aria-label="Checklist item" value={checklistInput} onChange={(event) => setChecklistInput(event.target.value)} placeholder="Add a requirement or task" />
            <button className="button-primary" type="submit"><Plus size={16} />Add item</button>
            <button className="secondary-button" type="button" onClick={() => {
              const items = ["Read eligibility criteria", "Gather transcripts", "Prepare proof of identity", "Request recommendation letters", "Review and submit application"];
              const updated = [...checklist, ...items.map((text, index) => ({ id: Date.now() + index, text, done: false }))];
              setChecklist(updated);
              saveLocal("toolhub-scholarship-checklist", updated);
            }}>Load starter list</button>
          </form>
          <ul className="productivity-list">{checklist.map((item) => <li key={item.id}>
            <label className="productivity-check"><input type="checkbox" checked={item.done} onChange={() => {
              const updated = checklist.map((entry) => entry.id === item.id ? { ...entry, done: !entry.done } : entry);
              setChecklist(updated);
              saveLocal("toolhub-scholarship-checklist", updated);
            }} /><span className={item.done ? "is-done" : ""}>{item.text}</span></label>
            <button className="icon-button" type="button" aria-label={`Delete ${item.text}`} onClick={() => {
              const updated = checklist.filter((entry) => entry.id !== item.id);
              setChecklist(updated);
              saveLocal("toolhub-scholarship-checklist", updated);
            }}><Trash2 size={16} /></button>
          </li>)}</ul>
          <p className="productivity-muted">{checklist.filter((item) => item.done).length} of {checklist.length} complete</p>
        </>
      )}

      {toolId === "study-timetable-generator" && (
        <>
          <div className="productivity-inline">
            <label className="productivity-field"><span>Subjects (one per line)</span><textarea rows={5} value={subjects} onChange={(event) => setSubjects(event.target.value)} /></label>
            <Input label="Study hours per day" type="number" min={1} max={12} step="any" value={studyHoursPerDay} onChange={(event) => setStudyHoursPerDay(Number(event.target.value))} />
            <Input label="Number of days" type="number" min={1} max={30} value={studyDays} onChange={(event) => setStudyDays(Number(event.target.value))} />
          </div>
          <div className="productivity-actions"><button className="secondary-button" type="button" onClick={() => window.print()}>Print timetable</button></div>
          <div className="productivity-list">{schedule.map((day, index) => <div key={index}>
            <strong>Day {index + 1}</strong>
            <ol>{day.map((subject, session) => <li key={`${session}-${subject}`}>Session {session + 1}: {subject} · {numeric(studyHoursPerDay / day.length)} hr</li>)}</ol>
          </div>)}</div>
        </>
      )}

      {toolId === "exam-percentage-calculator" && (
        <div className="productivity-inline">
          <Input label="Marks earned" type="number" min={0} step="any" value={numberA} onChange={(event) => setNumberA(Number(event.target.value))} />
          <Input label="Maximum marks" type="number" min={0} step="any" value={numberB} onChange={(event) => setNumberB(Number(event.target.value))} />
          <Result>{numberA < 0 || numberB <= 0 || numberA > numberB
            ? "Enter earned marks between zero and a positive maximum."
            : `${numeric(numberA / numberB * 100)}%`}</Result>
        </div>
      )}

      {toolId === "target-marks-calculator" && (
        <>
          <div className="productivity-inline">
            <Input label="Target overall score (%)" type="number" min={0} max={100} step="any" value={targetScore} onChange={(event) => setTargetScore(Number(event.target.value))} />
            <Input label="Completed work weight (%)" type="number" min={0} max={100} step="any" value={completedWeight} onChange={(event) => setCompletedWeight(Number(event.target.value))} />
            <Input label="Current average on completed work (%)" type="number" min={0} max={100} step="any" value={currentScore} onChange={(event) => setCurrentScore(Number(event.target.value))} />
          </div>
          <Result>{requiredNextScore === null
            ? "Remaining work must have a positive weight."
            : requiredNextScore <= 0
              ? "Your target is already secured by the completed-work score."
              : requiredNextScore > 100
                ? `You would need ${numeric(requiredNextScore)}% on remaining work; the target is no longer reachable.`
                : `You need ${numeric(requiredNextScore)}% on the remaining work to reach ${numeric(targetScore)}%.`}</Result>
          <p className="productivity-muted">Assumes the completed and remaining weights account for the full course grade.</p>
        </>
      )}

      {toolId === "study-break-timer" || toolId === "pomodoro-timer" ? (
        <>
          <div className="productivity-inline">
            <Input label="Focus minutes" type="number" min={1} max={180} value={focusMinutes} onChange={(event) => {
              const value = Number(event.target.value);
              setFocusMinutes(value);
              if (phase === "focus" && !timerRunning) setSecondsLeft(Math.max(1, value) * 60);
            }} />
            <Input label="Break minutes" type="number" min={1} max={60} value={breakMinutes} onChange={(event) => {
              const value = Number(event.target.value);
              setBreakMinutes(value);
              if (phase === "break" && !timerRunning) setSecondsLeft(Math.max(1, value) * 60);
            }} />
          </div>
          <div className="productivity-center">
            <p className="productivity-muted">{phase === "focus" ? "Focus session" : "Break"}</p>
            <div className="productivity-live-time" aria-live="polite">{timerDisplay}</div>
            <div className="productivity-actions">
              <button className="button-primary" type="button" onClick={() => { setNotice(""); setTimerRunning(true); }} disabled={timerRunning}>{timerRunning ? "Running" : "Start"}</button>
              <button className="secondary-button" type="button" onClick={() => setTimerRunning(false)} disabled={!timerRunning}>Pause</button>
              <button className="secondary-button" type="button" onClick={() => { setTimerRunning(false); setPhase("focus"); setSecondsLeft(Math.max(1, focusMinutes) * 60); setNotice(""); }}><RotateCcw size={15} />Reset</button>
              <button className="secondary-button" type="button" onClick={() => { setTimerRunning(false); const next = phase === "focus" ? "break" : "focus"; setPhase(next); setSecondsLeft((next === "focus" ? focusMinutes : breakMinutes) * 60); }}>Skip phase</button>
            </div>
          </div>
          <p className="productivity-muted">When a phase ends, the timer pauses and prepares the next phase. Start it again when you are ready.</p>
        </>
      ) : null}

      {toolId === "assignment-word-counter" && (
        <>
          <label className="productivity-field"><span>Assignment text</span><textarea rows={12} value={assignment} onChange={(event) => setAssignment(event.target.value)} placeholder="Paste or write your assignment here…" /></label>
          <Result>{wordCount.toLocaleString()} words · {assignment.length.toLocaleString()} characters · about {Math.ceil(wordCount / 250)} page{Math.ceil(wordCount / 250) === 1 ? "" : "s"} at 250 words per page</Result>
          <p className="productivity-muted">Page count is a rough estimate; actual layout depends on font, spacing, and margins.</p>
        </>
      )}

      {toolId === "citation-formatter" && (
        <>
          <div className="productivity-inline">
            <label className="productivity-field"><span>Style</span><select value={citationStyle} onChange={(event) => setCitationStyle(event.target.value)}><option>APA</option><option>MLA</option><option>Chicago</option></select></label>
            <Input label="Author(s)" value={author} onChange={(event) => setAuthor(event.target.value)} placeholder="e.g. Jane Smith" />
            <Input label="Title" value={citationTitle} onChange={(event) => setCitationTitle(event.target.value)} placeholder="Book or article title" />
            <Input label="Publisher or journal" value={publisher} onChange={(event) => setPublisher(event.target.value)} />
            <Input label="Publication year" value={publicationYear} onChange={(event) => setPublicationYear(event.target.value)} />
          </div>
          <label className="productivity-field"><span>Formatted citation</span><textarea readOnly rows={3} value={citation} /></label>
          <p className="productivity-muted">Basic formatter only. Add edition, volume, issue, pages, DOI, and other details required for your source and style guide.</p>
        </>
      )}

      {toolId === "flashcard-generator" && (
        <>
          <label className="productivity-field"><span>Cards (one per line, question :: answer)</span><textarea rows={7} value={flashcardText} onChange={(event) => { setFlashcardText(event.target.value); setFlashcardIndex(0); setShowAnswer(false); }} placeholder={"What is a cell? :: The basic unit of life.\nWhat is H2O? :: Water."} /></label>
          {flashcards.length > 0 ? <>
            <div className="productivity-panel" aria-live="polite">
              <p className="productivity-muted">Card {flashcardIndex + 1} of {flashcards.length}</p>
              <h3>{showAnswer ? "Answer" : "Question"}</h3>
              <p>{showAnswer ? flashcards[flashcardIndex]?.back : flashcards[flashcardIndex]?.front}</p>
            </div>
            <div className="productivity-actions">
              <button className="button-primary" type="button" onClick={() => setShowAnswer((value) => !value)}>{showAnswer ? "Show question" : "Show answer"}</button>
              <button className="secondary-button" type="button" onClick={() => { setFlashcardIndex((index) => (index + flashcards.length - 1) % flashcards.length); setShowAnswer(false); }}>Previous</button>
              <button className="secondary-button" type="button" onClick={() => { setFlashcardIndex((index) => (index + 1) % flashcards.length); setShowAnswer(false); }}>Next</button>
            </div>
          </> : <p className="productivity-muted">Add at least one question and answer separated by “::” or a tab.</p>}
        </>
      )}

      {toolId === "timetable-maker" && (
        <>
          <form className="productivity-actions" onSubmit={addTimetableEntry}>
            <label className="productivity-field"><span>Day</span><select value={timetableDay} onChange={(event) => setTimetableDay(event.target.value)}>{daysOfWeek.map((day) => <option key={day}>{day}</option>)}</select></label>
            <Input label="Start time" type="time" value={timetableTime} onChange={(event) => setTimetableTime(event.target.value)} />
            <input className="productivity-text-input" aria-label="Class or study subject" value={timetableSubject} onChange={(event) => setTimetableSubject(event.target.value)} placeholder="Class or study subject" />
            <button className="button-primary" type="submit"><Plus size={16} />Add entry</button>
            <button className="secondary-button" type="button" onClick={() => window.print()}>Print</button>
          </form>
          <div className="productivity-list">{daysOfWeek.map((day) => {
            const entries = timetable.filter((entry) => entry.day === day);
            return entries.length ? <div key={day}><strong>{day}</strong><ul>{entries.map((entry) => <li key={entry.id}>
              <span>{entry.time} · {entry.subject}</span>
              <button className="icon-button" type="button" aria-label={`Delete ${entry.subject} on ${day}`} onClick={() => {
                const updated = timetable.filter((item) => item.id !== entry.id);
                setTimetable(updated);
                saveLocal("toolhub-student-timetable", updated);
              }}><Trash2 size={15} /></button>
            </li>)}</ul></div> : null;
          })}</div>
          {!timetable.length && <p className="productivity-muted">Add entries to build your weekly timetable. It saves in this browser.</p>}
        </>
      )}

      {notice && <p className="productivity-notice" role="status" aria-live="polite">{notice}</p>}
    </section>
  );
}
