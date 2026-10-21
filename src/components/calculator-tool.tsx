"use client";

import { useState, type InputHTMLAttributes } from "react";

import {
  calculatorToolDefinitions,
  type CalculatorToolId,
} from "@/lib/tools/calculator-tool-config";

const lengthUnits = {
  Millimeters: 0.001,
  Centimeters: 0.01,
  Meters: 1,
  Kilometers: 1000,
  Inches: 0.0254,
  Feet: 0.3048,
  Yards: 0.9144,
  Miles: 1609.344,
} as const;

const weightUnits = {
  Milligrams: 0.000001,
  Grams: 0.001,
  Kilograms: 1,
  Tonnes: 1000,
  Ounces: 0.028349523125,
  Pounds: 0.45359237,
} as const;

const dataUnits = {
  Bytes: 1,
  Kilobytes: 1_000,
  Megabytes: 1_000_000,
  Gigabytes: 1_000_000_000,
  Terabytes: 1_000_000_000_000,
  Kibibytes: 1_024,
  Mebibytes: 1_048_576,
  Gibibytes: 1_073_741_824,
  Tebibytes: 1_099_511_627_776,
} as const;

type Measure = "Length" | "Weight" | "Data";
type UnitName = keyof typeof lengthUnits | keyof typeof weightUnits | keyof typeof dataUnits;

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

function Select({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: string;
  options: string[];
  onChange: (value: string) => void;
}) {
  return (
    <label className="productivity-field">
      <span>{label}</span>
      <select value={value} onChange={(event) => onChange(event.target.value)}>
        {options.map((option) => <option key={option}>{option}</option>)}
      </select>
    </label>
  );
}

function Result({ children }: { children: React.ReactNode }) {
  return <p className="productivity-result" aria-live="polite">{children}</p>;
}

function number(value: number): string {
  return Number.isFinite(value)
    ? value.toLocaleString(undefined, { maximumFractionDigits: 6 })
    : "—";
}

function money(value: number): string {
  return Number.isFinite(value)
    ? value.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })
    : "—";
}

function localDateValue(date = new Date()): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

function parseDate(value: string): Date | null {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/u.exec(value);
  if (!match) return null;
  const year = Number(match[1]);
  const month = Number(match[2]) - 1;
  const day = Number(match[3]);
  const date = new Date(Date.UTC(year, month, day));
  return date.getUTCFullYear() === year && date.getUTCMonth() === month && date.getUTCDate() === day
    ? date
    : null;
}

function ageBetween(birth: Date, asOf: Date): { years: number; months: number; days: number } | null {
  if (asOf < birth) return null;
  let years = asOf.getUTCFullYear() - birth.getUTCFullYear();
  let months = asOf.getUTCMonth() - birth.getUTCMonth();
  let days = asOf.getUTCDate() - birth.getUTCDate();
  if (days < 0) {
    months -= 1;
    const previousMonthDays = new Date(Date.UTC(asOf.getUTCFullYear(), asOf.getUTCMonth(), 0)).getUTCDate();
    days += previousMonthDays;
  }
  if (months < 0) {
    years -= 1;
    months += 12;
  }
  return { years, months, days };
}

function dateDifference(start: Date, end: Date): { years: number; months: number; days: number } {
  let years = end.getUTCFullYear() - start.getUTCFullYear();
  let months = end.getUTCMonth() - start.getUTCMonth();
  let days = end.getUTCDate() - start.getUTCDate();
  if (days < 0) {
    months -= 1;
    days += new Date(Date.UTC(end.getUTCFullYear(), end.getUTCMonth(), 0)).getUTCDate();
  }
  if (months < 0) {
    years -= 1;
    months += 12;
  }
  return { years, months, days };
}

function temperatureToCelsius(value: number, unit: string): number {
  if (unit === "Fahrenheit") return (value - 32) * 5 / 9;
  if (unit === "Kelvin") return value - 273.15;
  return value;
}

function celsiusToTemperature(value: number, unit: string): number {
  if (unit === "Fahrenheit") return value * 9 / 5 + 32;
  if (unit === "Kelvin") return value + 273.15;
  return value;
}

export function CalculatorTool({ toolId }: { toolId: CalculatorToolId }) {
  const [amount, setAmount] = useState(1000);
  const [secondAmount, setSecondAmount] = useState(1200);
  const [rate, setRate] = useState(10);
  const [years, setYears] = useState(1);
  const [months, setMonths] = useState(12);
  const [frequency, setFrequency] = useState(12);
  const [dateA, setDateA] = useState("2000-01-01");
  const [dateB, setDateB] = useState(localDateValue());
  const [inclusive, setInclusive] = useState(false);
  const [taxInclusive, setTaxInclusive] = useState(false);
  const [fixedCharge, setFixedCharge] = useState(0);
  const [quantity, setQuantity] = useState(100);
  const [unitPrice, setUnitPrice] = useState(0.25);
  const [distance, setDistance] = useState(100);
  const [efficiency, setEfficiency] = useState(15);
  const [fuelPrice, setFuelPrice] = useState(1.5);
  const [measurement, setMeasurement] = useState<Measure>("Length");
  const [fromUnit, setFromUnit] = useState<UnitName>("Meters");
  const [toUnit, setToUnit] = useState<UnitName>("Feet");
  const [temperature, setTemperature] = useState(0);
  const [fromTemperature, setFromTemperature] = useState("Celsius");
  const [toTemperature, setToTemperature] = useState("Fahrenheit");
  const [binaryInput, setBinaryInput] = useState("1010");
  const [decimalInput, setDecimalInput] = useState("10");
  const [exchangeRate, setExchangeRate] = useState(1);
  const [fromCurrency, setFromCurrency] = useState("USD");
  const [toCurrency, setToCurrency] = useState("EUR");
  const [tipRate, setTipRate] = useState(15);
  const [people, setPeople] = useState(2);
  const [salaryFrequency, setSalaryFrequency] = useState("Annual");
  const [otherDeductions, setOtherDeductions] = useState(0);
  const [compounding, setCompounding] = useState(12);
  const [measureValue, setMeasureValue] = useState(1);

  const startDate = parseDate(dateA);
  const endDate = parseDate(dateB);
  const orderedStart = startDate && endDate ? (startDate <= endDate ? startDate : endDate) : null;
  const orderedEnd = startDate && endDate ? (startDate <= endDate ? endDate : startDate) : null;
  const dateDays = orderedStart && orderedEnd
    ? (orderedEnd.getTime() - orderedStart.getTime()) / 86_400_000
    : null;
  const age = startDate && endDate ? ageBetween(startDate, endDate) : null;
  const calendarDifference = orderedStart && orderedEnd ? dateDifference(orderedStart, orderedEnd) : null;
  const emiMonthlyRate = rate / 100 / 12;
  const emi = Number.isInteger(months) && months > 0 && amount >= 0
    ? emiMonthlyRate === 0
      ? amount / months
      : amount * emiMonthlyRate * (1 + emiMonthlyRate) ** months / ((1 + emiMonthlyRate) ** months - 1)
    : null;
  const compoundedAmount = amount * (1 + rate / 100 / Math.max(1, compounding)) ** (Math.max(0, years) * Math.max(1, compounding));

  function unitsFor(measure: Measure): UnitName[] {
    if (measure === "Length") return Object.keys(lengthUnits) as UnitName[];
    if (measure === "Weight") return Object.keys(weightUnits) as UnitName[];
    return Object.keys(dataUnits) as UnitName[];
  }

  function changeMeasure(value: string) {
    const next = value as Measure;
    const options = unitsFor(next);
    setMeasurement(next);
    setFromUnit(options[0]);
    setToUnit(options[1] ?? options[0]);
  }

  function conversionFactor(measure: Measure, unit: UnitName): number {
    if (measure === "Length") return lengthUnits[unit as keyof typeof lengthUnits];
    if (measure === "Weight") return weightUnits[unit as keyof typeof weightUnits];
    return dataUnits[unit as keyof typeof dataUnits];
  }

  function renderConverter(measure: Measure) {
    const options = unitsFor(measure);
    return (
      <>
        <div className="productivity-inline">
          <Input label="Value" type="number" step="any" value={measureValue} onChange={(event) => setMeasureValue(Number(event.target.value))} />
          <Select label="From" value={fromUnit} options={options} onChange={(value) => setFromUnit(value as UnitName)} />
          <Select label="To" value={toUnit} options={options} onChange={(value) => setToUnit(value as UnitName)} />
        </div>
        <Result>{number(measureValue * conversionFactor(measure, fromUnit) / conversionFactor(measure, toUnit))} {toUnit}</Result>
      </>
    );
  }

  function renderFinanceTax(label: string) {
    const tax = Math.max(0, rate);
    if (taxInclusive) {
      const base = amount / (1 + tax / 100);
      const taxAmount = amount - base;
      return <Result>Before tax: {money(base)} · Tax: {money(taxAmount)} · Total: {money(amount)}</Result>;
    }
    const taxAmount = amount * tax / 100;
    return <Result>{label}: {money(taxAmount)} · Total including tax: {money(amount + taxAmount)}</Result>;
  }

  return (
    <section className="productivity-panel" aria-label={`${calculatorToolDefinitions[toolId].title} workspace`}>
      {toolId === "age-calculator" && <>
        <div className="productivity-inline">
          <Input label="Date of birth" type="date" value={dateA} onChange={(event) => setDateA(event.target.value)} />
          <Input label="Age on" type="date" value={dateB} onChange={(event) => setDateB(event.target.value)} />
        </div>
        <Result>{age ? `${age.years} years, ${age.months} months, ${age.days} days` : "Enter valid dates; the check date must not be before the birth date."}</Result>
      </>}

      {(toolId === "date-difference-calculator" || toolId === "days-between-dates") && <>
        <div className="productivity-inline">
          <Input label="Start date" type="date" value={dateA} onChange={(event) => setDateA(event.target.value)} />
          <Input label="End date" type="date" value={dateB} onChange={(event) => setDateB(event.target.value)} />
        </div>
        {toolId === "date-difference-calculator" ? (
          <Result>{calendarDifference
            ? `${calendarDifference.years} years, ${calendarDifference.months} months, ${calendarDifference.days} days · ${number(dateDays ?? 0)} days apart`
            : "Choose two valid dates."}</Result>
        ) : <>
          <label className="productivity-check"><input type="checkbox" checked={inclusive} onChange={(event) => setInclusive(event.target.checked)} />Include both start and end dates</label>
          <Result>{dateDays === null ? "Choose two valid dates." : `${number(dateDays + (inclusive ? 1 : 0))} days${startDate && endDate && startDate > endDate ? " (dates counted in either order)" : ""}`}</Result>
        </>}
      </>}

      {toolId === "percentage-change-calculator" && <>
        <div className="productivity-inline">
          <Input label="Original value" type="number" step="any" value={amount} onChange={(event) => setAmount(Number(event.target.value))} />
          <Input label="New value" type="number" step="any" value={secondAmount} onChange={(event) => setSecondAmount(Number(event.target.value))} />
        </div>
        <Result>{amount === 0 ? "Percentage change is undefined when the original value is zero." : `${number((secondAmount - amount) / Math.abs(amount) * 100)}% ${secondAmount >= amount ? "increase" : "decrease"} · Difference: ${number(secondAmount - amount)}`}</Result>
      </>}

      {toolId === "discount-calculator" && <>
        <div className="productivity-inline">
          <Input label="Original price" type="number" min={0} step="any" value={amount} onChange={(event) => setAmount(Number(event.target.value))} />
          <Input label="Discount (%)" type="number" min={0} max={100} step="any" value={rate} onChange={(event) => setRate(Number(event.target.value))} />
        </div>
        <Result>{rate < 0 || rate > 100 || amount < 0 ? "Enter a non-negative price and a discount from 0% to 100%." : `You save ${money(amount * rate / 100)} · Final price: ${money(amount * (1 - rate / 100))}`}</Result>
      </>}

      {(toolId === "gst-calculator" || toolId === "sales-tax-calculator") && <>
        <div className="productivity-inline">
          <Input label={taxInclusive ? "Price including tax" : "Price before tax"} type="number" min={0} step="any" value={amount} onChange={(event) => setAmount(Number(event.target.value))} />
          <Input label="Tax rate (%)" type="number" min={0} step="any" value={rate} onChange={(event) => setRate(Number(event.target.value))} />
        </div>
        <label className="productivity-check"><input type="checkbox" checked={taxInclusive} onChange={(event) => setTaxInclusive(event.target.checked)} />Price already includes tax</label>
        {amount < 0 || rate < 0
          ? <Result>Enter a non-negative price and tax rate.</Result>
          : renderFinanceTax(toolId === "gst-calculator" ? "GST" : "Sales tax")}
        <p className="productivity-muted">Tax rates and rules vary by location. Enter the applicable rate.</p>
      </>}

      {toolId === "loan-emi-calculator" && <>
        <div className="productivity-inline">
          <Input label="Loan principal" type="number" min={0} step="any" value={amount} onChange={(event) => setAmount(Number(event.target.value))} />
          <Input label="Annual interest rate (%)" type="number" min={0} step="any" value={rate} onChange={(event) => setRate(Number(event.target.value))} />
          <Input label="Term (months)" type="number" min={1} step={1} value={months} onChange={(event) => setMonths(Number(event.target.value))} />
        </div>
        {emi === null || rate < 0
          ? <Result>Enter a non-negative principal and rate and a whole-number term of at least one month.</Result>
          : <Result>Monthly payment: {money(emi)} · Total paid: {money(emi * months)} · Total interest: {money(emi * months - amount)}</Result>}
        <p className="productivity-muted">Estimate excludes fees, insurance, and changes in rate. Actual lender payments may differ.</p>
      </>}

      {toolId === "simple-interest-calculator" && <>
        <div className="productivity-inline">
          <Input label="Principal" type="number" min={0} step="any" value={amount} onChange={(event) => setAmount(Number(event.target.value))} />
          <Input label="Annual interest rate (%)" type="number" min={0} step="any" value={rate} onChange={(event) => setRate(Number(event.target.value))} />
          <Input label="Time (years)" type="number" min={0} step="any" value={years} onChange={(event) => setYears(Number(event.target.value))} />
        </div>
        <Result>{amount < 0 || rate < 0 || years < 0 ? "Enter non-negative values." : `Interest: ${money(amount * rate / 100 * years)} · Total amount: ${money(amount * (1 + rate / 100 * years))}`}</Result>
      </>}

      {toolId === "compound-interest-calculator" && <>
        <div className="productivity-inline">
          <Input label="Principal" type="number" min={0} step="any" value={amount} onChange={(event) => setAmount(Number(event.target.value))} />
          <Input label="Annual interest rate (%)" type="number" min={0} step="any" value={rate} onChange={(event) => setRate(Number(event.target.value))} />
          <Input label="Time (years)" type="number" min={0} step="any" value={years} onChange={(event) => setYears(Number(event.target.value))} />
          <Select label="Compounds per year" value={String(compounding)} options={["1", "2", "4", "12", "52", "365"]} onChange={(value) => setCompounding(Number(value))} />
        </div>
        <Result>{amount < 0 || rate < 0 || years < 0
          ? "Enter non-negative values."
          : `Final amount: ${money(compoundedAmount)} · Interest earned: ${money(compoundedAmount - amount)}`}</Result>
        <p className="productivity-muted">Assumes a fixed rate and no additional deposits or withdrawals.</p>
      </>}

      {toolId === "profit-margin-calculator" && <>
        <div className="productivity-inline">
          <Input label="Cost" type="number" min={0} step="any" value={amount} onChange={(event) => setAmount(Number(event.target.value))} />
          <Input label="Selling price" type="number" min={0} step="any" value={secondAmount} onChange={(event) => setSecondAmount(Number(event.target.value))} />
        </div>
        <Result>{secondAmount === 0 ? "Margin is undefined when the selling price is zero." : `Profit: ${number(secondAmount - amount)} · Profit margin: ${number((secondAmount - amount) / secondAmount * 100)}%`}</Result>
      </>}

      {toolId === "markup-calculator" && <>
        <div className="productivity-inline">
          <Input label="Cost" type="number" min={0} step="any" value={amount} onChange={(event) => setAmount(Number(event.target.value))} />
          <Input label="Markup (%)" type="number" min={0} step="any" value={rate} onChange={(event) => setRate(Number(event.target.value))} />
        </div>
        <Result>{amount < 0 || rate < 0 ? "Enter non-negative values." : `Markup amount: ${number(amount * rate / 100)} · Selling price: ${number(amount * (1 + rate / 100))}`}</Result>
      </>}

      {toolId === "electricity-bill-estimator" && <>
        <div className="productivity-inline">
          <Input label="Usage (kWh)" type="number" min={0} step="any" value={quantity} onChange={(event) => setQuantity(Number(event.target.value))} />
          <Input label="Rate per kWh" type="number" min={0} step="any" value={unitPrice} onChange={(event) => setUnitPrice(Number(event.target.value))} />
          <Input label="Fixed charges" type="number" min={0} step="any" value={fixedCharge} onChange={(event) => setFixedCharge(Number(event.target.value))} />
        </div>
        <Result>{quantity < 0 || unitPrice < 0 || fixedCharge < 0
          ? "Enter non-negative usage, unit rate, and fixed charges."
          : `Estimated energy charge: ${money(quantity * unitPrice)} · Estimated bill: ${money(quantity * unitPrice + fixedCharge)}`}</Result>
        <p className="productivity-muted">Estimate excludes tiered rates, taxes, and other utility fees.</p>
      </>}

      {toolId === "fuel-cost-calculator" && <>
        <div className="productivity-inline">
          <Input label="Trip distance (km)" type="number" min={0} step="any" value={distance} onChange={(event) => setDistance(Number(event.target.value))} />
          <Input label="Fuel efficiency (km/L)" type="number" min={0} step="any" value={efficiency} onChange={(event) => setEfficiency(Number(event.target.value))} />
          <Input label="Fuel price per liter" type="number" min={0} step="any" value={fuelPrice} onChange={(event) => setFuelPrice(Number(event.target.value))} />
        </div>
        <Result>{distance < 0 || efficiency <= 0 || fuelPrice < 0
          ? "Enter non-negative distance and price and efficiency greater than zero."
          : `Fuel needed: ${number(distance / efficiency)} L · Estimated cost: ${money(distance / efficiency * fuelPrice)}`}</Result>
      </>}

      {toolId === "unit-converter" && <>
        <Select label="Measurement" value={measurement} options={["Length", "Weight", "Data"]} onChange={changeMeasure} />
        {renderConverter(measurement)}
      </>}
      {(toolId === "length-converter" || toolId === "weight-converter" || toolId === "data-storage-converter") &&
        renderConverter(toolId === "length-converter" ? "Length" : toolId === "weight-converter" ? "Weight" : "Data")}

      {toolId === "temperature-converter" && <>
        <div className="productivity-inline">
          <Input label="Temperature" type="number" step="any" value={temperature} onChange={(event) => setTemperature(Number(event.target.value))} />
          <Select label="From" value={fromTemperature} options={["Celsius", "Fahrenheit", "Kelvin"]} onChange={setFromTemperature} />
          <Select label="To" value={toTemperature} options={["Celsius", "Fahrenheit", "Kelvin"]} onChange={setToTemperature} />
        </div>
        <Result>{toTemperature === "Kelvin" && temperatureToCelsius(temperature, fromTemperature) < -273.15
          ? "Temperature cannot be below absolute zero."
          : `${number(celsiusToTemperature(temperatureToCelsius(temperature, fromTemperature), toTemperature))}° ${toTemperature}`}</Result>
      </>}

      {toolId === "binary-to-decimal" && <>
        <Input label="Binary integer" value={binaryInput} onChange={(event) => setBinaryInput(event.target.value)} placeholder="e.g. 1010" />
        <Result>{/^[01]+$/u.test(binaryInput) && binaryInput.length <= 256
          ? BigInt(`0b${binaryInput}`).toString(10)
          : "Enter up to 256 binary digits (0 or 1)."}</Result>
      </>}
      {toolId === "decimal-to-binary" && <>
        <Input label="Decimal integer" value={decimalInput} onChange={(event) => setDecimalInput(event.target.value)} placeholder="e.g. 42 or -42" />
        <Result>{/^-?\d+$/u.test(decimalInput) && decimalInput.replace("-", "").length <= 256
          ? BigInt(decimalInput).toString(2)
          : "Enter a whole number of up to 256 digits."}</Result>
      </>}

      {toolId === "currency-converter" && <>
        <div className="productivity-inline">
          <Input label="Amount" type="number" min={0} step="any" value={amount} onChange={(event) => setAmount(Number(event.target.value))} />
          <Input label="From currency" value={fromCurrency} onChange={(event) => setFromCurrency(event.target.value.toUpperCase().slice(0, 8))} />
          <Input label="To currency" value={toCurrency} onChange={(event) => setToCurrency(event.target.value.toUpperCase().slice(0, 8))} />
          <Input label={`Rate (${toCurrency} per 1 ${fromCurrency})`} type="number" min={0} step="any" value={exchangeRate} onChange={(event) => setExchangeRate(Number(event.target.value))} />
        </div>
        <Result>{amount < 0 || exchangeRate < 0 ? "Enter non-negative amount and exchange rate." : `${money(amount)} ${fromCurrency} = ${money(amount * exchangeRate)} ${toCurrency}`}</Result>
        <p className="productivity-muted">Exchange rates change. Enter a current rate from a source you trust; this calculator does not fetch live rates.</p>
      </>}

      {toolId === "tip-calculator" && <>
        <div className="productivity-inline">
          <Input label="Bill amount" type="number" min={0} step="any" value={amount} onChange={(event) => setAmount(Number(event.target.value))} />
          <Input label="Tip (%)" type="number" min={0} step="any" value={tipRate} onChange={(event) => setTipRate(Number(event.target.value))} />
          <Input label="People sharing" type="number" min={1} step={1} value={people} onChange={(event) => setPeople(Number(event.target.value))} />
        </div>
        <Result>{amount < 0 || tipRate < 0 || people < 1
          ? "Enter a non-negative bill and tip and at least one person."
          : `Tip: ${money(amount * tipRate / 100)} · Total: ${money(amount * (1 + tipRate / 100))} · Per person: ${money(amount * (1 + tipRate / 100) / people)}`}</Result>
      </>}

      {toolId === "salary-calculator" && <>
        <div className="productivity-inline">
          <Input label={`Gross ${salaryFrequency.toLowerCase()} salary`} type="number" min={0} step="any" value={amount} onChange={(event) => setAmount(Number(event.target.value))} />
          <Select label="Pay frequency" value={salaryFrequency} options={["Annual", "Monthly", "Biweekly", "Weekly"]} onChange={setSalaryFrequency} />
          <Input label="Estimated tax/deduction rate (%)" type="number" min={0} max={100} step="any" value={rate} onChange={(event) => setRate(Number(event.target.value))} />
          <Input label="Other deductions per year" type="number" min={0} step="any" value={otherDeductions} onChange={(event) => setOtherDeductions(Number(event.target.value))} />
        </div>
        {(() => {
          const periods = salaryFrequency === "Monthly" ? 12 : salaryFrequency === "Biweekly" ? 26 : salaryFrequency === "Weekly" ? 52 : 1;
          const annualGross = amount * periods;
          const annualNet = annualGross * (1 - rate / 100) - otherDeductions;
          return <Result>{amount < 0 || rate < 0 || rate > 100 || otherDeductions < 0
            ? "Enter non-negative salary and deductions and a deduction rate from 0% to 100%."
            : `Estimated annual gross: ${money(annualGross)} · Annual take-home: ${money(annualNet)} · Per ${salaryFrequency.toLowerCase()} take-home: ${money(annualNet / periods)}`}</Result>;
        })()}
        <p className="productivity-muted">Tax estimate only; actual deductions depend on your location, benefits, and tax rules.</p>
      </>}

      {toolId === "inflation-calculator" && <>
        <div className="productivity-inline">
          <Input label="Starting value" type="number" min={0} step="any" value={amount} onChange={(event) => setAmount(Number(event.target.value))} />
          <Input label="Average annual inflation (%)" type="number" min={-100} step="any" value={rate} onChange={(event) => setRate(Number(event.target.value))} />
          <Input label="Number of years" type="number" min={0} step="any" value={years} onChange={(event) => setYears(Number(event.target.value))} />
        </div>
        <Result>{amount < 0 || rate <= -100 || years < 0
          ? "Enter a non-negative value and duration and an annual rate above -100%."
          : `Future equivalent: ${money(amount * (1 + rate / 100) ** years)} · Change: ${money(amount * ((1 + rate / 100) ** years - 1))}`}</Result>
        <p className="productivity-muted">Uses a constant rate you provide, not historical CPI data or an inflation forecast.</p>
      </>}
    </section>
  );
}
