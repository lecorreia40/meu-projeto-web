/**
 * Per-visa structured forms.
 *
 * Each visa category has its own set of sections and fields with validation
 * rules. This is the single source of truth used by both the client renderer
 * and the server-side Zod validator, so the two never drift.
 *
 * Field labels are in English (like the document requirement labels); the page
 * chrome around the form is localized.
 */
import { z } from "zod";

export type VisaFieldType =
  | "text"
  | "textarea"
  | "number"
  | "date"
  | "boolean"
  | "select"
  | "country"
  | "money"
  | "email";

export type VisaField = {
  key: string;
  label: string;
  type: VisaFieldType;
  required?: boolean;
  min?: number; // number: min value; text: min length
  max?: number; // number: max value; text: max length
  pattern?: string; // regex source for text
  patternHint?: string;
  options?: string[];
  help?: string;
  dependsOn?: string; // show only when another field is truthy / equals value
  dependsValue?: string;
};

export type VisaSection = { title: string; fields: VisaField[] };

// Shared applicant identity used by every visa
const IDENTITY: VisaSection = {
  title: "Applicant identity",
  fields: [
    { key: "fullName", label: "Full legal name", type: "text", required: true, min: 2, max: 120 },
    { key: "dateOfBirth", label: "Date of birth", type: "date", required: true },
    { key: "nationality", label: "Nationality", type: "country", required: true },
    { key: "passportNumber", label: "Passport number", type: "text", required: true, pattern: "^[A-Za-z0-9]{6,12}$", patternHint: "6 to 12 letters or digits" },
    { key: "passportExpiry", label: "Passport expiry date", type: "date", required: true },
    { key: "email", label: "Email", type: "email", required: true },
    { key: "phone", label: "Phone", type: "text", required: false },
  ],
};

const CONTACT_US: VisaSection = {
  title: "US contact",
  fields: [
    { key: "usAddress", label: "US address (if any)", type: "text", required: false },
    { key: "intendedEntryDate", label: "Intended entry date", type: "date", required: false },
  ],
};

// Visa-specific sections
const FORMS: Record<string, VisaSection[]> = {
  "B1-B2": [
    IDENTITY,
    {
      title: "Trip details",
      fields: [
        { key: "purpose", label: "Purpose of trip", type: "select", options: ["Business", "Tourism", "Medical", "Family visit"], required: true },
        { key: "tripLengthDays", label: "Planned length of stay (days)", type: "number", required: true, min: 1, max: 180 },
        { key: "fundsAvailable", label: "Funds available for the trip (USD)", type: "money", required: true, min: 0 },
        { key: "tiesHome", label: "Ties to home country (job, family, property)", type: "textarea", required: true },
      ],
    },
  ],
  "F-1": [
    IDENTITY,
    {
      title: "Study details",
      fields: [
        { key: "schoolName", label: "School / SEVIS institution", type: "text", required: true },
        { key: "programName", label: "Program of study", type: "text", required: true },
        { key: "i20Issued", label: "Has the school issued an I-20?", type: "boolean", required: true },
        { key: "annualCost", label: "Annual cost of attendance (USD)", type: "money", required: true, min: 0 },
        { key: "fundingSource", label: "Source of funding", type: "select", options: ["Self / family", "Scholarship", "Sponsor", "Loan"], required: true },
      ],
    },
  ],
  "H-1B": [
    IDENTITY,
    {
      title: "Employment & sponsor",
      fields: [
        { key: "employerName", label: "Sponsoring employer", type: "text", required: true },
        { key: "jobTitle", label: "Job title", type: "text", required: true },
        { key: "annualSalary", label: "Offered annual salary (USD)", type: "money", required: true, min: 0 },
        { key: "degreeField", label: "Field of degree", type: "text", required: true },
        { key: "degreeLevel", label: "Highest degree", type: "select", options: ["Bachelor", "Master", "PhD", "Other"], required: true },
        { key: "specialtyRationale", label: "Why the role is a specialty occupation", type: "textarea", required: true },
      ],
    },
  ],
  "L-1A": [
    IDENTITY,
    {
      title: "Intracompany transfer",
      fields: [
        { key: "foreignEntity", label: "Foreign employer (entity abroad)", type: "text", required: true },
        { key: "usEntity", label: "US entity", type: "text", required: true },
        { key: "relationship", label: "Relationship between entities", type: "select", options: ["Parent", "Subsidiary", "Affiliate", "Branch"], required: true },
        { key: "roleType", label: "Applicant role", type: "select", options: ["Executive", "Managerial"], required: true },
        { key: "monthsAbroad", label: "Months employed abroad (last 3 years)", type: "number", required: true, min: 12, max: 36, patternHint: "Must be at least 12" },
        { key: "newOffice", label: "Is this a new US office?", type: "boolean", required: true },
        { key: "reportsCount", label: "Number of direct reports (if managerial)", type: "number", required: false, min: 0, dependsOn: "roleType", dependsValue: "Managerial" },
      ],
    },
  ],
  "L-1B": [
    IDENTITY,
    {
      title: "Specialized knowledge transfer",
      fields: [
        { key: "foreignEntity", label: "Foreign employer", type: "text", required: true },
        { key: "usEntity", label: "US entity", type: "text", required: true },
        { key: "specializedKnowledge", label: "Describe the specialized knowledge", type: "textarea", required: true },
        { key: "monthsAbroad", label: "Months employed abroad (last 3 years)", type: "number", required: true, min: 12, max: 36 },
      ],
    },
  ],
  "E-2": [
    IDENTITY,
    {
      title: "Investment",
      fields: [
        { key: "treatyCountry", label: "Treaty country of nationality", type: "country", required: true },
        { key: "investmentAmount", label: "Total investment (USD)", type: "money", required: true, min: 1 },
        { key: "ownershipPct", label: "Ownership percentage", type: "number", required: true, min: 50, max: 100, patternHint: "Must be at least 50%" },
        { key: "fundsSource", label: "Source of funds", type: "select", options: ["Business income", "Savings", "Sale of assets", "Gift/Inheritance", "Loan"], required: true },
        { key: "businessType", label: "Type of business", type: "text", required: true },
        { key: "jobsCreated", label: "US jobs created or planned", type: "number", required: true, min: 0 },
        { key: "physicalLocation", label: "Does the business have a physical location?", type: "boolean", required: true },
        { key: "leaseTerm", label: "Commercial lease term (months)", type: "number", required: false, min: 0, dependsOn: "physicalLocation", dependsValue: "true" },
      ],
    },
  ],
  "O-1": [
    IDENTITY,
    {
      title: "Extraordinary ability",
      fields: [
        { key: "field", label: "Field of extraordinary ability", type: "select", options: ["Sciences", "Arts", "Education", "Business", "Athletics"], required: true },
        { key: "awards", label: "Major awards or recognition", type: "textarea", required: true },
        { key: "mediaCoverage", label: "Notable media coverage", type: "textarea", required: false },
        { key: "recommenders", label: "Number of expert recommendation letters", type: "number", required: true, min: 3, max: 30, patternHint: "At least 3 recommended" },
        { key: "usEmployerOrAgent", label: "US employer or agent", type: "text", required: true },
      ],
    },
  ],
  "EB-1A": [
    IDENTITY,
    {
      title: "Extraordinary ability (permanent)",
      fields: [
        { key: "field", label: "Field", type: "text", required: true },
        { key: "criteriaMet", label: "USCIS criteria you believe you meet (list)", type: "textarea", required: true },
        { key: "publications", label: "Number of publications", type: "number", required: false, min: 0 },
        { key: "citations", label: "Approximate citation count", type: "number", required: false, min: 0 },
      ],
    },
  ],
  "EB-1C": [
    IDENTITY,
    {
      title: "Multinational manager (permanent)",
      fields: [
        { key: "foreignEntity", label: "Foreign employer", type: "text", required: true },
        { key: "usEntity", label: "US entity", type: "text", required: true },
        { key: "roleType", label: "Role", type: "select", options: ["Executive", "Managerial"], required: true },
        { key: "monthsAbroad", label: "Months employed abroad (last 3 years)", type: "number", required: true, min: 12, max: 36 },
      ],
    },
  ],
  "EB-2-NIW": [
    IDENTITY,
    {
      title: "National interest waiver",
      fields: [
        { key: "degreeLevel", label: "Highest degree", type: "select", options: ["Bachelor + 5yr exp", "Master", "PhD"], required: true },
        { key: "field", label: "Field of endeavor", type: "text", required: true },
        { key: "nationalImportance", label: "Why the work has national importance", type: "textarea", required: true },
        { key: "wellPositioned", label: "Why you are well positioned to advance it", type: "textarea", required: true },
      ],
    },
  ],
  "EB-5-DIRECT": [
    IDENTITY,
    {
      title: "Direct investment",
      fields: [
        { key: "investmentAmount", label: "Investment amount (USD)", type: "money", required: true, min: 800000, patternHint: "Typically at least $800,000" },
        { key: "tea", label: "Is the investment in a Targeted Employment Area?", type: "boolean", required: true },
        { key: "fundsSource", label: "Lawful source of funds", type: "select", options: ["Business income", "Salary/savings", "Sale of assets", "Gift/Inheritance", "Loan"], required: true },
        { key: "jobsCreated", label: "Full-time US jobs created", type: "number", required: true, min: 0, patternHint: "10 required" },
        { key: "enterpriseName", label: "New commercial enterprise", type: "text", required: true },
      ],
    },
  ],
  "EB-5-RC": [
    IDENTITY,
    {
      title: "Regional center investment",
      fields: [
        { key: "investmentAmount", label: "Investment amount (USD)", type: "money", required: true, min: 800000 },
        { key: "regionalCenter", label: "Regional center / project name", type: "text", required: true },
        { key: "tea", label: "Is the project in a Targeted Employment Area?", type: "boolean", required: true },
        { key: "fundsSource", label: "Lawful source of funds", type: "select", options: ["Business income", "Salary/savings", "Sale of assets", "Gift/Inheritance", "Loan"], required: true },
      ],
    },
  ],
  "J-1": [
    IDENTITY,
    CONTACT_US,
    {
      title: "Exchange program",
      fields: [
        { key: "programType", label: "Program category", type: "select", options: ["Intern", "Trainee", "Scholar", "Au pair", "Teacher", "Other"], required: true },
        { key: "sponsorName", label: "Designated sponsor", type: "text", required: true },
        { key: "subjectTo212e", label: "Subject to the 2-year home residency requirement?", type: "boolean", required: false },
      ],
    },
  ],
};

export function getVisaForm(visaKey: string): VisaSection[] {
  return FORMS[visaKey] ?? [IDENTITY];
}

/** All fields flattened for a visa. */
export function visaFields(visaKey: string): VisaField[] {
  return getVisaForm(visaKey).flatMap((s) => s.fields);
}

/** Build a Zod schema for server-side validation from the field specs. */
export function buildVisaSchema(visaKey: string) {
  const shape: Record<string, z.ZodTypeAny> = {};
  for (const field of visaFields(visaKey)) {
    let s: z.ZodTypeAny;
    switch (field.type) {
      case "number":
      case "money": {
        let n = z.coerce.number();
        if (field.min != null) n = n.min(field.min);
        if (field.max != null) n = n.max(field.max);
        s = n;
        break;
      }
      case "boolean":
        s = z.coerce.boolean();
        break;
      case "email":
        s = z.string().email();
        break;
      case "date":
        s = z.string().min(1);
        break;
      default: {
        let str = z.string();
        if (field.min != null) str = str.min(field.min);
        if (field.max != null) str = str.max(field.max);
        if (field.pattern) str = str.regex(new RegExp(field.pattern), field.patternHint ?? "Invalid format");
        if (field.options) s = z.enum(field.options as [string, ...string[]]);
        else s = str;
      }
    }
    // Required vs optional; optional fields also accept empty string
    shape[field.key] = field.required ? s : s.optional().or(z.literal("")).or(z.null());
  }
  return z.object(shape);
}

/**
 * Validate one field value. Returns an error code (null when valid). Codes are
 * localized in the UI; params are appended after a colon (e.g. "min:12").
 */
export function validateVisaField(field: VisaField, value: unknown): string | null {
  const isEmpty = value === undefined || value === null || String(value).trim() === "";
  if (isEmpty) return field.required ? "required" : null;
  const str = String(value);

  if (field.type === "email") {
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(str)) return "email";
    return null;
  }
  if (field.type === "number" || field.type === "money") {
    const n = Number(str);
    if (Number.isNaN(n)) return "number";
    if (field.min != null && n < field.min) return `min:${field.min}`;
    if (field.max != null && n > field.max) return `max:${field.max}`;
    return null;
  }
  if (field.type === "select" && field.options && !field.options.includes(str)) return "invalid";
  if (field.type === "text" || field.type === "textarea") {
    if (field.min != null && str.length < field.min) return `minlen:${field.min}`;
    if (field.max != null && str.length > field.max) return `maxlen:${field.max}`;
    if (field.pattern && !new RegExp(field.pattern).test(str)) return "format";
  }
  return null;
}

/** Validate an entire submission; returns a map of fieldKey -> error code. */
export function validateVisaForm(visaKey: string, data: Record<string, unknown>): Record<string, string> {
  const errors: Record<string, string> = {};
  for (const field of visaFields(visaKey)) {
    // Respect conditional visibility: skip hidden fields
    if (field.dependsOn) {
      const dep = data[field.dependsOn];
      if (field.dependsValue != null) {
        if (String(dep) !== field.dependsValue) continue;
      } else if (!dep) {
        continue;
      }
    }
    const err = validateVisaField(field, data[field.key]);
    if (err) errors[field.key] = err;
  }
  return errors;
}

/** Fraction (0..1) of required fields that have a non-empty value. */
export function visaFormCompleteness(visaKey: string, data: Record<string, unknown>): number {
  const required = visaFields(visaKey).filter((f) => f.required);
  if (required.length === 0) return 1;
  const filled = required.filter((f) => {
    const v = data[f.key];
    return v !== undefined && v !== null && String(v).trim() !== "";
  }).length;
  return filled / required.length;
}
