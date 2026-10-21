export const calculatorToolDefinitions = {
  "age-calculator": {
    title: "Age Calculator",
    intro: "Calculate your age in years, months, and days from your date of birth.",
  },
  "date-difference-calculator": {
    title: "Date Difference Calculator",
    intro: "Find the calendar years, months, and days between two dates.",
  },
  "days-between-dates": {
    title: "Days Between Dates",
    intro: "Count the days between two dates, optionally including both endpoints.",
  },
  "percentage-change-calculator": {
    title: "Percentage Change Calculator",
    intro: "Calculate the percentage increase or decrease between two values.",
  },
  "discount-calculator": {
    title: "Discount Calculator",
    intro: "Find the savings and final price after a percentage discount.",
  },
  "gst-calculator": {
    title: "GST Calculator",
    intro: "Add or remove a configurable GST rate from a price.",
  },
  "loan-emi-calculator": {
    title: "Loan EMI Calculator",
    intro: "Estimate a monthly loan payment and total interest from loan terms.",
  },
  "simple-interest-calculator": {
    title: "Simple Interest Calculator",
    intro: "Calculate simple interest and total amount from principal, rate, and time.",
  },
  "compound-interest-calculator": {
    title: "Compound Interest Calculator",
    intro: "Estimate compound growth using a principal, rate, term, and compounding schedule.",
  },
  "profit-margin-calculator": {
    title: "Profit Margin Calculator",
    intro: "Calculate profit and profit margin from cost and selling price.",
  },
  "markup-calculator": {
    title: "Markup Calculator",
    intro: "Calculate a selling price by applying a markup to cost.",
  },
  "electricity-bill-estimator": {
    title: "Electricity Bill Estimator",
    intro: "Estimate an electricity bill from usage, unit rate, and fixed charges.",
  },
  "fuel-cost-calculator": {
    title: "Fuel Cost Calculator",
    intro: "Estimate trip fuel usage and cost from distance, efficiency, and fuel price.",
  },
  "unit-converter": {
    title: "Unit Converter",
    intro: "Convert between common length, weight, temperature, and data units.",
  },
  "temperature-converter": {
    title: "Temperature Converter",
    intro: "Convert temperatures between Celsius, Fahrenheit, and Kelvin.",
  },
  "weight-converter": {
    title: "Weight Converter",
    intro: "Convert between common metric and imperial mass units.",
  },
  "length-converter": {
    title: "Length Converter",
    intro: "Convert between metric and imperial distance units.",
  },
  "data-storage-converter": {
    title: "Data Storage Converter",
    intro: "Convert data sizes using decimal or binary storage units.",
  },
  "binary-to-decimal": {
    title: "Binary to Decimal",
    intro: "Convert a binary integer to its decimal value.",
  },
  "decimal-to-binary": {
    title: "Decimal to Binary",
    intro: "Convert an integer in base 10 to its binary representation.",
  },
  "currency-converter": {
    title: "Currency Converter",
    intro: "Convert an amount using an exchange rate you provide.",
  },
  "sales-tax-calculator": {
    title: "Sales Tax Calculator",
    intro: "Calculate sales tax and the final total from a price and tax rate.",
  },
  "tip-calculator": {
    title: "Tip Calculator",
    intro: "Calculate a tip and split the total bill across a group.",
  },
  "salary-calculator": {
    title: "Salary Calculator",
    intro: "Estimate take-home salary from gross pay and a deduction rate.",
  },
  "inflation-calculator": {
    title: "Inflation Calculator",
    intro: "Estimate how inflation changes a value over time using an entered annual rate.",
  },
} as const;

export type CalculatorToolId = keyof typeof calculatorToolDefinitions;

export const calculatorToolIds = Object.keys(
  calculatorToolDefinitions,
) as CalculatorToolId[];

export function isCalculatorToolId(id: string): id is CalculatorToolId {
  return Object.hasOwn(calculatorToolDefinitions, id);
}
