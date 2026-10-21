import type { FaqItem } from "@/components/faq";
import type { ToolDefinition } from "@/lib/tools/types";
import { isProductivityToolId } from "@/lib/tools/productivity-tool-config";
import { isStudentToolId } from "@/lib/tools/student-tool-config";
import { isCalculatorToolId } from "@/lib/tools/calculator-tool-config";
import { isDeveloperToolId } from "@/lib/tools/developer-tool-config";
import { isSeoToolId } from "@/lib/tools/seo-tool-config";

interface ToolContent {
  steps: string[];
  faqs: FaqItem[];
}

const resizerContent: ToolContent = {
  steps: [
    "Upload or drag and drop your image into the upload area.",
    "Enter the new width and height, or keep the aspect ratio locked.",
    "Choose the output format and adjust the quality slider.",
    "Click the action button, preview the result and download it.",
  ],
  faqs: [
    {
      question: "Is the Image Resizer free to use?",
      answer: "Yes. It is free, needs no account and has no watermarks.",
    },
    {
      question: "Are my images uploaded to a server?",
      answer:
        "No. Resizing happens in your browser, so your image stays on your device.",
    },
    {
      question: "Which formats are supported?",
      answer:
        "You can start from common formats such as JPG, PNG and WebP and export to the formats your browser supports.",
    },
    {
      question: "What does maintain aspect ratio do?",
      answer:
        "It keeps the original proportions by updating one dimension automatically when you change the other, so the image is not stretched.",
    },
  ],
};

export function getToolContent(tool: ToolDefinition): ToolContent {
  if (tool.id === "image-resizer") return resizerContent;
  if (isProductivityToolId(tool.id)) {
    return {
      steps: [
        `Open ${tool.name} and enter the date, time, or details you want to work with.`,
        "Adjust the available options; results update immediately or when you run the action.",
        "Review the result and copy, print, or save it where the tool offers that option.",
      ],
      faqs: [
        {
          question: `Is ${tool.name} free to use?`,
          answer: "Yes. It is free to use and does not require an account.",
        },
        {
          question: "Is my information private?",
          answer:
            "Calculations run in your browser. Checklist, habit, and planner entries are stored only in this browser's local storage.",
        },
        {
          question: "Are times and dates affected by time zones?",
          answer:
            "Time zone tools use the selected IANA zone and current daylight-saving rules. Other date calculators use your device's local calendar.",
        },
      ],
    };
  }
  if (isStudentToolId(tool.id)) {
    return {
      steps: [
        `Choose the inputs for ${tool.name}.`,
        "Check that your values and grading rules match your school or exam.",
        "Review the result; timers and study lists work locally in your browser.",
      ],
      faqs: [
        {
          question: `Is ${tool.name} free to use?`,
          answer: "Yes. It is free to use and does not require an account.",
        },
        {
          question: "Are my study notes or application details uploaded?",
          answer:
            "No. Calculations run in your browser; checklist and timetable entries are saved only in this browser.",
        },
        {
          question: "Should I rely on the result for official academic decisions?",
          answer:
            "Use your institution's official grading, eligibility, and exam rules. Estimates are provided for planning and may not match local policies.",
        },
      ],
    };
  }
  if (isCalculatorToolId(tool.id)) {
    return {
      steps: [
        `Enter the values for ${tool.name}.`,
        "Review the assumptions and units shown next to the inputs.",
        "Use the result as an estimate and confirm financial, tax, and conversion rules for your situation.",
      ],
      faqs: [
        {
          question: `Is ${tool.name} free to use?`,
          answer: "Yes. It is free to use and does not require an account.",
        },
        {
          question: "Are the results official financial, tax, or exchange-rate advice?",
          answer:
            "No. Results are estimates based on the values and assumptions you enter. Verify rates and rules with an authoritative source.",
        },
        {
          question: "Are my inputs uploaded?",
          answer: "No. Calculations run in your browser and are not sent to a server.",
        },
      ],
    };
  }
  if (isDeveloperToolId(tool.id)) {
    return {
      steps: [
        `Enter or paste content into ${tool.name}.`,
        "Review the output or validation message before using it in your project.",
        tool.id === "jwt-decoder"
          ? "This tool only decodes the header and payload; it does not verify signatures or validate claims."
          : "Processing runs in your browser; formatting and conversion do not replace project tests or security review.",
      ],
      faqs: [
        {
          question: `Is ${tool.name} free to use?`,
          answer: "Yes. It is free to use and does not require an account.",
        },
        {
          question: "Is my source code or data uploaded?",
          answer: "No. Processing runs in your browser.",
        },
        {
          question: tool.id === "jwt-decoder"
            ? "Does decoding a JWT validate it?"
            : "Does formatting or conversion prove my code is correct?",
          answer:
            tool.id === "jwt-decoder"
              ? "No. This tool only decodes the header and payload. It does not verify signatures, claims, or token trustworthiness."
              : "No. These utilities transform or inspect input but do not type-check, test, or audit a project.",
        },
      ],
    };
  }
  if (isSeoToolId(tool.id)) {
    return {
      steps: [
        `Enter the content or website details requested by ${tool.name}.`,
        "Review the generated output or the local checks before using the result on your website.",
        "Copy generated markup into the appropriate page or file and validate it in your publishing workflow.",
      ],
      faqs: [
        {
          question: `Is ${tool.name} free to use?`,
          answer: "Yes. It is free to use and does not require an account.",
        },
        {
          question: "Is my page content uploaded?",
          answer:
            "Text analysis and generated markup are processed in your browser. DNS lookups send the domain to Cloudflare DNS over HTTPS, and IP lookups send the address to ipapi.co.",
        },
        {
          question: "Can this tool check a live website's response?",
          answer:
            "Browser security prevents reliable cross-origin access to many site responses. Where live checks are restricted, paste the relevant source or response details; the tool explains the limits in its workspace.",
        },
      ],
    };
  }

  return {
    steps: [
      `Open ${tool.name} and add your file or text.`,
      "Review the options and adjust them to suit your needs.",
      "Run the tool and check the preview or result.",
      "Copy or download the output.",
    ],
    faqs: [
      {
        question: `Is ${tool.name} free to use?`,
        answer: "Yes. It is free to use and does not require an account.",
      },
      {
        question: "Is my data private?",
        answer:
          "Processing happens in your browser, so your files and text stay on your device.",
      },
      {
        question: "Does it work on mobile devices?",
        answer:
          "Yes. The layout adapts to phones, tablets and desktop screens.",
      },
    ],
  };
}
