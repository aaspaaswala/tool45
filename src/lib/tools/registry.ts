import { isPdfToolId, pdfToolIntros } from "@/lib/tools/pdf-tool-config";
import { productivityToolIds } from "@/lib/tools/productivity-tool-config";
import { calculatorToolIds } from "@/lib/tools/calculator-tool-config";
import { developerToolDefinitions, developerToolIds } from "@/lib/tools/developer-tool-config";
import { studentToolIds } from "@/lib/tools/student-tool-config";
import { textToolIds } from "@/lib/tools/text-tool-config";
import { seoToolIds } from "@/lib/tools/seo-tool-config";
import type { ToolCategory, ToolCategoryId, ToolDefinition } from "@/lib/tools/types";

export const categories: ToolCategory[] = [
  {
    id: "image",
    name: "Image Tools",
    description: "Resize, convert, and prepare images for everyday use.",
    icon: "image",
  },
  {
    id: "pdf",
    name: "PDF Tools",
    description: "Work with PDF files and common document formats.",
    icon: "file-text",
  },
  {
    id: "image-documents",
    name: "Image & Document Utilities",
    description: "Practical utilities for image and document workflows.",
    icon: "files",
  },
  {
    id: "student",
    name: "Student & Exam Tools",
    description: "Academic calculators and practical study helpers.",
    icon: "graduation-cap",
  },
  {
    id: "text",
    name: "Text & Writing Tools",
    description: "Simple utilities for editing and understanding text.",
    icon: "type",
  },
  {
    id: "developer",
    name: "Developer Tools",
    description: "Small, useful helpers for common development tasks.",
    icon: "code-2",
  },
  {
    id: "seo",
    name: "SEO & Website Tools",
    description: "Straightforward tools for website owners and publishers.",
    icon: "search",
  },
  {
    id: "calculators",
    name: "Math & Finance Calculators",
    description: "Everyday calculators with clear inputs and results.",
    icon: "calculator",
  },
  {
    id: "utilities",
    name: "Date, Time & Productivity",
    description: "Handy calendar, time, and productivity utilities.",
    icon: "clock-3",
  },
  {
    id: "social-color",
    name: "Social, QR & Color Tools",
    description: "Create, organize, and work with social, QR, and color assets.",
    icon: "palette",
  },
];

const catalog: Record<ToolCategoryId, string> = {
  image: `
    Image Resizer
    Image Compressor
    Image Cropper
    Image Format Converter
    JPG to PNG
    PNG to JPG
    WebP to JPG
    JPG to WebP
    PNG to WebP
    AVIF Converter
    Background Remover
    Passport Photo Maker
    Signature Resizer
    Photo KB Reducer
    Image DPI Checker
    Image to Base64
    Base64 to Image
    Image to PDF
    Watermark Image
    Blur Image
    Image Rotator
    Image Flipper
    Image Color Picker
    Favicon Generator
    Meme Generator
  `,
  pdf: `
    PDF Compressor
    Merge PDF
    Split PDF
    PDF to JPG
    JPG to PDF
    PDF to Word
    Word to PDF
    PDF to Text
    Rotate PDF
    Delete PDF Pages
    PDF Page Extractor
    Add PDF Page Numbers
    Watermark PDF
    Protect PDF
    Unlock Authorized PDF
    PDF Metadata Viewer
    PDF Page Size Checker
    Compare PDFs
    OCR PDF
    PDF Form Filler
    Excel to PDF
    PPT to PDF
    PDF to PNG
    PDF Page Organizer
    Repair PDF
  `,
  "image-documents": `
    Photo Signature Combiner
    Photo Resizer by Pixels
    Image to Grayscale
    Image Color Inverter
    Image Brightness Adjuster
    Image Contrast Adjuster
    Image to ASCII Art
    Image Palette Extractor
    HEIC Converter
    TIFF Converter
    SVG to PNG
    PNG to ICO
    QR Image Scanner
    EXIF Metadata Remover
    Image Watermark Remover for Owned Images
    ID Photo Sheet Maker
    Multiple Images to PDF
    PDF Metadata Editor
    PDF Text Extractor
    PDF to HTML
    PDF to Markdown
    PDF Print Size Checker
  `,
  student: `
    CGPA Calculator
    SGPA Calculator
    CGPA to Percentage
    Percentage Calculator
    Attendance Calculator
    Required Attendance Calculator
    Marks Calculator
    Grade Calculator
    GATE Score Estimator
    Age Eligibility Calculator
    Exam Countdown
    Study Hours Calculator
    Semester Marks Calculator
    Scholarship Checklist
    Study Timetable Generator
    GPA Calculator
    Weighted Average Calculator
    Exam Percentage Calculator
    Target Marks Calculator
    Study Break Timer
    Assignment Word Counter
    Citation Formatter
    Flashcard Generator
    Pomodoro Timer
    Timetable Maker
  `,
  text: `
    Word Counter
    Character Counter
    Sentence Counter
    Case Converter
    Remove Extra Spaces
    Duplicate Lines Remover
    Sort Lines
    Text Diff Checker
    Find and Replace
    Slug Generator
    Lorem Ipsum Generator
    Text Reverser
    Readability Checker
    Text Summarizer
    Text to Speech
    Speech to Text
    Remove Line Breaks
    Text Repeater
    Random Text Generator
    Palindrome Checker
    NATO Alphabet Converter
    Morse Code Converter
    Markdown Previewer
    Unicode Character Lookup
    Text Encryptor and Decryptor
  `,
  developer: `
    JSON Formatter
    JSON Validator
    XML Formatter
    HTML Formatter
    CSS Minifier
    JavaScript Minifier
    SQL Formatter
    Base64 Encoder
    Base64 Decoder
    URL Encoder
    URL Decoder
    HTML Entity Converter
    Regex Tester
    UUID Generator
    Hash Generator
    JWT Decoder
    Timestamp Converter
    YAML to JSON
    Markdown to HTML
    QR Code Generator
    JSON to CSV
    CSV to JSON
    Cron Expression Generator
    Diff Checker
    Code Syntax Highlighter
  `,
  seo: `
    Meta Tag Generator
    SERP Snippet Preview
    Keyword Density Checker
    Robots.txt Generator
    XML Sitemap Generator
    Canonical Tag Checker
    Open Graph Preview
    Twitter Card Preview
    Schema Markup Generator
    FAQ Schema Generator
    Redirect Checker
    Broken Link Checker
    UTM Builder
    Favicon Preview
    Website Screenshot
    Page Size Checker
    HTTP Header Checker
    SSL Certificate Checker
    DNS Lookup
    IP Address Lookup
    Hreflang Generator
    Open Graph Tag Generator
    SEO Slug Generator
    URL Status Checker
    Website Word Counter
  `,
  calculators: `
    Age Calculator
    Date Difference Calculator
    Days Between Dates
    Percentage Change Calculator
    Discount Calculator
    GST Calculator
    Loan EMI Calculator
    Simple Interest Calculator
    Compound Interest Calculator
    Profit Margin Calculator
    Markup Calculator
    Electricity Bill Estimator
    Fuel Cost Calculator
    Unit Converter
    Temperature Converter
    Weight Converter
    Length Converter
    Data Storage Converter
    Binary to Decimal
    Decimal to Binary
    Currency Converter
    Sales Tax Calculator
    Tip Calculator
    Salary Calculator
    Inflation Calculator
  `,
  utilities: `
    World Clock
    Countdown Timer
    Stopwatch
    Calendar Generator
    Leap Year Checker
    Business Days Calculator
    Working Hours Calculator
    Week Number Calculator
    Time Zone Converter
    Unix Time Converter
    Date Add/Subtract Calculator
    Time Duration Calculator
    Meeting Time Planner
    Days Until Date
    Age in Days Calculator
    Random Number Generator
    Random Password Generator
    Secure Password Generator
    Username Generator
    Checklist Maker
    Habit Tracker
    Daily Planner
    Event Countdown
    Workday Calculator
    Time Card Calculator
  `,
  "social-color": `
    WhatsApp Link Generator
    Wi-Fi QR Generator
    Social Media Image Resizer
    YouTube Thumbnail Preview
    Bio Link Generator
    Hashtag Organizer
    Instagram Caption Formatter
    QR Code Scanner
    QR Code Styler
    Barcode Generator
    Color Palette Generator
    HEX to RGB Converter
    RGB to HEX Converter
    HEX to HSL Converter
    Gradient Generator
    CSS Box Shadow Generator
    CSS Border Radius Generator
    Contrast Checker
    Random Color Generator
    Color Blindness Simulator
    YouTube Thumbnail Downloader for Permitted Content
    URL QR Generator
    vCard QR Generator
    Email QR Generator
    Social Media Banner Maker
  `,
};

const descriptions: Record<string, string> = {
  "Meta Tag Generator": "Create SEO title, description, canonical, and social meta tags from your page details.",
  "SERP Snippet Preview": "Preview how a page title, URL, and description can appear in search results.",
  "Keyword Density Checker": "Count words and review keyword frequency in text you provide.",
  "Robots.txt Generator": "Build a robots.txt file with crawl rules and an optional sitemap URL.",
  "XML Sitemap Generator": "Turn a list of page URLs into a valid XML sitemap.",
  "Canonical Tag Checker": "Inspect canonical link tags in HTML source you paste and compare their URLs.",
  "Open Graph Preview": "Preview a social card using the Open Graph values for your page.",
  "Twitter Card Preview": "Preview a social card using Twitter/X card metadata.",
  "Schema Markup Generator": "Validate and wrap JSON-LD structured data for a web page.",
  "FAQ Schema Generator": "Create FAQPage JSON-LD from matching question and answer lists.",
  "Redirect Checker": "Review a pasted HTTP response or redirect trace without sending requests to a server.",
  "Broken Link Checker": "Extract and validate links in pasted HTML source.",
  "UTM Builder": "Add campaign tracking parameters to a destination URL.",
  "Favicon Preview": "Preview common favicon paths for a website and generate link markup.",
  "Website Screenshot": "Preview a public website in a restricted frame; some sites block embedding.",
  "Page Size Checker": "Measure the UTF-8 size of page source or response content you provide.",
  "HTTP Header Checker": "Review pasted HTTP response headers and check common security headers.",
  "SSL Certificate Checker": "Check certificate hostname and expiry details copied from your browser or certificate viewer.",
  "DNS Lookup": "Look up common DNS records using Cloudflare DNS over HTTPS.",
  "IP Address Lookup": "Look up public IP network details using ipapi.co.",
  "Hreflang Generator": "Generate alternate-language link tags from locale and URL pairs.",
  "Open Graph Tag Generator": "Generate Open Graph meta tags from your page details.",
  "SEO Slug Generator": "Convert a title or phrase into a clean, URL-friendly slug.",
  "URL Status Checker": "Validate URL syntax and inspect a pasted HTTP status response.",
  "Website Word Counter": "Count words in pasted website text or HTML source.",
  "Image Resizer": "Change an image's dimensions for a specific use.",
  "Image Compressor": "Reduce image file size while balancing visual quality.",
  "Image Cropper": "Crop by pixel coordinates or choose a common aspect ratio.",
  "Image Format Converter": "Convert images between common file formats.",
  "Signature Resizer": "Prepare a signature image to meet common size requirements.",
  "Passport Photo Maker": "Prepare a passport-style photo with configurable dimensions.",
  "Image to Base64": "Encode an image as a Base64 data URL.",
  "Base64 to Image": "Preview and download an image from Base64 data.",
  "Word Counter": "Count words in text you enter or paste.",
  "Character Counter": "Count characters, including spaces, in a text sample.",
  "Sentence Counter": "Count sentences in the text you enter or paste.",
  "Case Converter": "Change text to common capitalization styles.",
  "Remove Extra Spaces": "Clean up repeated spaces in a block of text.",
  "Duplicate Lines Remover": "Remove repeated lines while keeping first occurrences.",
  "Sort Lines": "Sort text lines alphabetically with optional reverse order.",
  "Text Diff Checker": "Compare two text blocks and highlight line changes.",
  "Find and Replace": "Find text and replace matches using literal text or regex.",
  "Slug Generator": "Convert text into clean URL-friendly slugs.",
  "Lorem Ipsum Generator": "Generate placeholder paragraphs for drafts and mockups.",
  "Text Reverser": "Reverse text content or reverse each line individually.",
  "Readability Checker": "Estimate readability and reading grade from your text.",
  "Text Summarizer": "Create a short extractive summary from longer text.",
  "Text to Speech": "Read text aloud in your browser with speech controls.",
  "Speech to Text": "Transcribe microphone speech in supported browsers.",
  "Remove Line Breaks": "Remove line breaks or compact lines into paragraphs.",
  "Text Repeater": "Repeat text multiple times with custom separators.",
  "Random Text Generator": "Generate random words, sentences, or passwords.",
  "Palindrome Checker": "Check whether text is a palindrome.",
  "NATO Alphabet Converter": "Convert text characters to NATO phonetic words.",
  "Morse Code Converter": "Convert text to Morse code and Morse code to text.",
  "Markdown Previewer": "Render a safe preview of Markdown content.",
  "Unicode Character Lookup": "Inspect Unicode code points and UTF-16 values.",
  "Text Encryptor and Decryptor": "Encrypt and decrypt text using AES-GCM and a passphrase.",
  "World Clock": "See current local times across cities and time zones.",
  "Countdown Timer": "Set a countdown timer and get an alert when it finishes.",
  Stopwatch: "Measure elapsed time and record lap times.",
  "Calendar Generator": "Create and print a calendar for any month and year.",
  "Leap Year Checker": "Check whether a year is a leap year and see its calendar details.",
  "Business Days Calculator": "Count weekdays between dates and optionally exclude holidays.",
  "Working Hours Calculator": "Calculate net hours between start and end times after breaks.",
  "Week Number Calculator": "Find the ISO week number and week dates for any date.",
  "Time Zone Converter": "Convert a date and time between IANA time zones.",
  "Unix Time Converter": "Convert Unix timestamps to dates and dates to Unix time.",
  "Date Add/Subtract Calculator": "Add or subtract days, weeks, months, or years from a date.",
  "Time Duration Calculator": "Calculate the duration between two dates and times.",
  "Meeting Time Planner": "Compare a proposed meeting time across time zones.",
  "Days Until Date": "Count the days between today and an upcoming date.",
  "Age in Days Calculator": "Calculate your age in days, weeks, and years.",
  "Random Number Generator": "Generate random integers in a range with optional unique results.",
  "Random Password Generator": "Generate passwords with adjustable length and character sets.",
  "Secure Password Generator": "Generate cryptographically secure passwords in your browser.",
  "Username Generator": "Generate username ideas from a name, topic, or keyword.",
  "Checklist Maker": "Create and save a checklist locally in your browser.",
  "Habit Tracker": "Track daily habits with a simple private weekly check-in.",
  "Daily Planner": "Plan the day with editable tasks and time slots saved locally.",
  "Event Countdown": "Create a live countdown to an event date and time.",
  "Workday Calculator": "Find a date a number of working days before or after a start date.",
  "Time Card Calculator": "Add multiple shifts and calculate total hours and pay.",
  "Percentage Calculator": "Find a percentage of a value, a percentage share, or percentage change.",
  "Age Calculator": "Calculate an age from a date of birth.",
  "Date Difference Calculator": "Find calendar years, months, and days between two dates.",
  "Days Between Dates": "Count days between two dates, optionally including both dates.",
  "Percentage Change Calculator": "Calculate the percentage increase or decrease between two values.",
  "Discount Calculator": "Calculate savings and final price after a discount.",
  "GST Calculator": "Add or remove a configurable GST rate from a price.",
  "Loan EMI Calculator": "Estimate monthly loan payment and total interest.",
  "Simple Interest Calculator": "Calculate simple interest from principal, rate, and time.",
  "Compound Interest Calculator": "Estimate compound growth using a compounding schedule.",
  "Profit Margin Calculator": "Calculate profit and profit margin from cost and selling price.",
  "Markup Calculator": "Calculate a selling price by applying a markup to cost.",
  "Electricity Bill Estimator": "Estimate an electricity bill from usage and unit rate.",
  "Fuel Cost Calculator": "Estimate trip fuel usage and cost from distance and efficiency.",
  "Unit Converter": "Convert between common length, weight, temperature, and data units.",
  "Temperature Converter": "Convert between Celsius, Fahrenheit, and Kelvin.",
  "Weight Converter": "Convert between common metric and imperial mass units.",
  "Length Converter": "Convert between metric and imperial distance units.",
  "Data Storage Converter": "Convert data sizes using decimal or binary storage units.",
  "Binary to Decimal": "Convert a binary integer to decimal.",
  "Decimal to Binary": "Convert an integer in base 10 to binary.",
  "Currency Converter": "Convert an amount using an exchange rate you provide.",
  "Sales Tax Calculator": "Calculate sales tax and the final total from a price and rate.",
  "Tip Calculator": "Calculate a tip and split the bill across a group.",
  "Salary Calculator": "Estimate take-home salary from gross pay and deductions.",
  "Inflation Calculator": "Estimate value changes using an entered annual inflation rate.",
  "CGPA Calculator": "Calculate a cumulative grade point average.",
  "SGPA Calculator": "Calculate a semester grade point average.",
  "CGPA to Percentage": "Convert a CGPA using a configurable institutional multiplier.",
  "Attendance Calculator": "Calculate attendance from classes attended and held.",
  "Required Attendance Calculator": "Find how many classes to attend to reach a target percentage.",
  "Marks Calculator": "Add assessment marks and calculate the total and percentage.",
  "Grade Calculator": "Convert a percentage score to a letter grade.",
  "GATE Score Estimator": "Estimate a GATE score using editable formula parameters.",
  "Age Eligibility Calculator": "Check age on a specified date against eligibility limits.",
  "Exam Countdown": "See how many days remain until an exam.",
  "Study Hours Calculator": "Plan daily study time from your remaining hours and days.",
  "Semester Marks Calculator": "Combine internal and final exam marks.",
  "Scholarship Checklist": "Track scholarship application requirements in this browser.",
  "Study Timetable Generator": "Generate a balanced timetable from subjects and available time.",
  "GPA Calculator": "Calculate a credit-weighted grade point average.",
  "Weighted Average Calculator": "Calculate an average using values and their weights.",
  "Exam Percentage Calculator": "Calculate an exam percentage from marks earned and possible.",
  "Target Marks Calculator": "Find the score needed on remaining work to reach a target.",
  "Study Break Timer": "Run a focus and break timer for study sessions.",
  "Assignment Word Counter": "Count words, characters, and estimated pages in a draft.",
  "Citation Formatter": "Format a basic citation in APA, MLA, or Chicago style.",
  "Flashcard Generator": "Create interactive flashcards from question-and-answer lines.",
  "Pomodoro Timer": "Focus in timed intervals with breaks between sessions.",
  "Timetable Maker": "Create and save a weekly class or study timetable.",
  "JSON Formatter": "Format JSON to make its structure easier to read.",
  "JSON Validator": "Check whether a text value is valid JSON.",
  "URL Encoder": "Encode text so it can be safely included in a URL.",
  "URL Decoder": "Decode percent-encoded text from a URL.",
  "Photo Signature Combiner":
    "Combine a portrait photo and signature into one image.",
  "Image to Grayscale": "Convert an image to black and white.",
  "Image Color Inverter": "Invert the colors in an image.",
  "Image Brightness Adjuster": "Adjust the brightness of an image.",
  "Image Contrast Adjuster": "Adjust the contrast of an image.",
  "Image to ASCII Art": "Convert a small image into text-based ASCII art.",
  "Image Palette Extractor": "Find the most common colors in an image.",
  "Image Watermark Remover for Owned Images":
    "Not offered: removing watermarks can remove creators' attribution or rights notices.",
  "HEIC Converter": "Convert supported HEIC photos to a common image format.",
  "TIFF Converter": "Convert supported TIFF images to a common image format.",
  "SVG to PNG": "Rasterize an SVG image as a PNG file.",
  "PNG to ICO": "Create a Windows icon file from a PNG image.",
  "QR Image Scanner": "Try to read a QR code from an uploaded image.",
  "EXIF Metadata Remover": "Export an image copy without embedded metadata.",
  "ID Photo Sheet Maker": "Create a photo sheet with adjustable photo size, layout, and spacing.",
  "Multiple Images to PDF": "Place multiple images into a downloadable PDF.",
  "Photo Resizer by Pixels": "Resize an image to exact pixel dimensions.",
  "Image to PDF": "Create a downloadable PDF from an image.",
  "AVIF Converter": "Convert images to AVIF when your browser supports encoding.",
  "Background Remover":
    "Remove a simple, near-uniform background color in your browser.",
  "Photo KB Reducer":
    "Reduce a JPEG image toward a target file size; exact sizes may vary.",
  "Image DPI Checker": "Inspect image pixel dimensions and available DPI metadata.",
  "Watermark Image": "Add a text watermark to an image you own.",
  "Blur Image": "Apply a configurable blur to an image.",
  "Image Rotator": "Rotate an image by quarter turns.",
  "Image Flipper": "Flip an image horizontally or vertically.",
  "Image Color Picker": "Select a pixel from an image and inspect its color.",
  "Favicon Generator": "Create a square PNG favicon from an image.",
  "Meme Generator": "Add caption text to an image and download the result.",
  "Social Media Image Resizer":
    "Resize an image for common social post, story, and thumbnail dimensions.",
};

const additionalKeywords: Record<string, string[]> = {
  "Photo KB Reducer": ["photo resizer by kb", "target file size", "compress"],
  "Photo Resizer by Pixels": ["photo resizer by pixels", "image dimensions"],
  "PDF Page Extractor": ["extract pdf pages", "extract pages"],
  "PDF Page Organizer": ["reorder pdf pages", "organize pages"],
  "PDF to Text": ["pdf text extractor", "extract text"],
  "Text Diff Checker": ["diff checker", "compare text"],
  "Image Watermark Remover for Owned Images": ["remove watermark", "owned images"],
};

const availableImageToolNames = new Set([
  "Image Resizer",
  "Image Compressor",
  "Image Cropper",
  "Image Format Converter",
  "JPG to PNG",
  "PNG to JPG",
  "WebP to JPG",
  "JPG to WebP",
  "PNG to WebP",
  "AVIF Converter",
  "Background Remover",
  "Passport Photo Maker",
  "Signature Resizer",
  "Photo KB Reducer",
  "Image DPI Checker",
  "Image to Base64",
  "Base64 to Image",
  "Image to PDF",
  "Watermark Image",
  "Blur Image",
  "Image Rotator",
  "Image Flipper",
  "Image Color Picker",
  "Favicon Generator",
  "Meme Generator",
  "Photo Signature Combiner",
  "Photo Resizer by Pixels",
  "Image to Grayscale",
  "Image Color Inverter",
  "Image Brightness Adjuster",
  "Image Contrast Adjuster",
  "Image to ASCII Art",
  "Image Palette Extractor",
  "HEIC Converter",
  "TIFF Converter",
  "SVG to PNG",
  "PNG to ICO",
  "QR Image Scanner",
  "EXIF Metadata Remover",
  "ID Photo Sheet Maker",
  "Multiple Images to PDF",
  "Social Media Image Resizer",
]);

const excludedToolNames = new Set([
  "Image Watermark Remover for Owned Images",
]);

const availableToolIds = new Set<string>([
  ...textToolIds,
  ...seoToolIds,
  ...productivityToolIds,
  ...studentToolIds,
  ...calculatorToolIds,
  ...developerToolIds,
]);

function slugify(name: string): string {
  return name
    .toLowerCase()
    .replace(/&/g, " and ")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

export const tools: ToolDefinition[] = Object.entries(catalog).flatMap(
  ([categoryId, names]) => {
    const category = categories.find((entry) => entry.id === categoryId);
    if (!category) throw new Error(`Missing category: ${categoryId}`);

    return names
      .trim()
      .split("\n")
      .map((name) => name.trim())
      .filter(Boolean)
      .map((name) => ({
        id: slugify(name),
        name,
        description:
          descriptions[name] ??
          (isPdfToolId(slugify(name)) ? pdfToolIntros[slugify(name) as keyof typeof pdfToolIntros] : undefined) ??
          (Object.hasOwn(developerToolDefinitions, slugify(name))
            ? developerToolDefinitions[slugify(name) as keyof typeof developerToolDefinitions].intro
            : undefined) ??
          "Planned tool. Workflow details and supported inputs will be documented before release.",
        categoryId: category.id,
        keywords: [
          ...new Set([
            ...slugify(name).split("-"),
            ...(additionalKeywords[name] ?? []),
          ]),
        ],
        status: excludedToolNames.has(name)
          ? ("excluded" as const)
          : availableToolIds.has(slugify(name)) ||
              availableImageToolNames.has(name) ||
              isPdfToolId(slugify(name))
            ? ("available" as const)
            : ("planned" as const),
      }));
  },
);

const toolIds = new Set(tools.map((tool) => tool.id));
if (toolIds.size !== tools.length) {
  throw new Error("Tool catalog contains duplicate IDs.");
}

export function getCategory(id: string): ToolCategory | undefined {
  return categories.find((category) => category.id === id);
}

export function getToolsForCategory(categoryId: string): ToolDefinition[] {
  return tools.filter((tool) => tool.categoryId === categoryId);
}

export function getTool(id: string): ToolDefinition | undefined {
  return tools.find((tool) => tool.id === id);
}
