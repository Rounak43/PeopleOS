/**
 * PeopleOS — Salary Rule Engine
 *
 * The SINGLE SOURCE OF TRUTH for salary computation.
 *
 * This engine:
 *  1. Loads the SalaryStructure with its ordered SalaryRules from MongoDB
 *  2. Builds an execution context (WAGE, HOURS, DAYS, etc.)
 *  3. Executes each rule in sequence order
 *  4. Supports Fixed, Percentage, and Formula rule types
 *  5. Uses a SAFE evaluator (no eval()) — only allows arithmetic on known variables
 *  6. Returns a complete payslip breakdown
 *
 * Safe Formula Evaluator:
 *  - Variables: any code computed so far + WAGE, HOURS, DAYS, OT_HOURS
 *  - Operations: +, -, *, /, (, )
 *  - No function calls, no globals, no property access
 */
const SalaryStructure = require('../../models/SalaryStructure');
const SalaryRule = require('../../models/SalaryRule');

// ─────────────────────────────────────────────────────────────
// Safe Arithmetic Evaluator
// Replaces known variable names with their numeric values,
// then evaluates the remaining pure-number arithmetic expression.
// ─────────────────────────────────────────────────────────────

/**
 * Safely evaluate an arithmetic expression with known variables.
 * @param {string} expression - e.g. "BASIC * 0.12" or "BASIC + HRA + CONV"
 * @param {Object} context - map of variable name → numeric value
 * @returns {number}
 */
const safeEvaluate = (expression, context) => {
  if (!expression || typeof expression !== 'string') return 0;

  // Replace all known variable names (longest first to avoid partial matches)
  const sortedKeys = Object.keys(context).sort((a, b) => b.length - a.length);

  let expr = expression.trim();

  for (const key of sortedKeys) {
    const val = Number(context[key]) || 0;
    // Replace whole-word occurrences only (word boundary on both sides)
    const regex = new RegExp(`\\b${key}\\b`, 'g');
    expr = expr.replace(regex, val.toString());
  }

  // Validate that the expression is ONLY numbers, operators, whitespace, and parens
  // This is the security gate — nothing else is allowed through
  const SAFE_PATTERN = /^[\d\s\+\-\*\/\.\(\)]+$/;
  if (!SAFE_PATTERN.test(expr)) {
    throw new Error(`Unsafe formula expression detected after variable substitution: "${expr}" (original: "${expression}")`);
  }

  // Final arithmetic evaluation using Function() with no global access
  // This is safe because we have already validated only numbers/operators remain
  try {
    // eslint-disable-next-line no-new-func
    const result = new Function(`"use strict"; return (${expr});`)();
    return typeof result === 'number' && isFinite(result) ? result : 0;
  } catch {
    return 0;
  }
};

/**
 * Safely evaluate a boolean condition expression.
 * @param {string} condition - e.g. "WAGE <= 21000" or "GROSS > 50000"
 * @param {Object} context
 * @returns {boolean}
 */
const safeEvaluateCondition = (condition, context) => {
  if (!condition || typeof condition !== 'string' || condition.trim() === '') {
    return true; // Empty condition = always run
  }

  const sortedKeys = Object.keys(context).sort((a, b) => b.length - a.length);
  let expr = condition.trim();

  for (const key of sortedKeys) {
    const val = Number(context[key]) || 0;
    const regex = new RegExp(`\\b${key}\\b`, 'g');
    expr = expr.replace(regex, val.toString());
  }

  // Validate condition expression - allow &&, ||, !, comparison operators
  const SAFE_CONDITION = /^[\d\s\+\-\*\/\.\(\)\<\>\=\!\&\|]+$/;
  if (!SAFE_CONDITION.test(expr)) {
    throw new Error(`Unsafe condition expression: "${expr}" (original: "${condition}")`);
  }

  try {
    // eslint-disable-next-line no-new-func
    const result = new Function(`"use strict"; return (${expr});`)();
    return Boolean(result);
  } catch {
    return false;
  }
};

// ─────────────────────────────────────────────────────────────
// Rule Execution Engine
// ─────────────────────────────────────────────────────────────

/**
 * Execute all salary rules in a structure against an employee's data.
 *
 * @param {Object} params
 * @param {string|ObjectId} params.salaryStructureId - MongoDB ID of the structure
 * @param {number} params.wage - Contract wage (monthly base)
 * @param {string} params.wageFrequency - 'Monthly', 'Bi-weekly', 'Hourly'
 * @param {number} params.workedDays - Attendance days in period
 * @param {number} params.regularHours - Regular hours worked
 * @param {number} params.overtimeHours - Overtime hours worked
 * @param {number} params.unpaidLeaveDays - Days of unpaid absence
 * @param {number} params.workingDaysInPeriod - Total calendar working days in period
 *
 * @returns {{ lines: Array, grossSalary: number, totalDeductions: number, netSalary: number, warnings: Array, context: Object }}
 */
const executeSalaryRules = async ({
  salaryStructureId,
  wage,
  wageFrequency = 'Monthly',
  workedDays = 0,
  regularHours = 0,
  overtimeHours = 0,
  unpaidLeaveDays = 0,
  workingDaysInPeriod = 26,
}) => {
  const warnings = [];
  const lines = [];

  // Load salary structure with its ordered rules
  const structure = await SalaryStructure.findById(salaryStructureId)
    .populate({
      path: 'rules',
      match: { active: true },
      options: { sort: { sequence: 1 } },
    })
    .lean();

  if (!structure) {
    warnings.push({
      type: 'MISSING_SALARY_STRUCTURE',
      message: `Salary structure (id: ${salaryStructureId}) not found. Cannot compute payslip.`,
      severity: 'Error',
      isBlocking: true,
    });
    return {
      lines: [],
      grossSalary: 0,
      totalDeductions: 0,
      netSalary: 0,
      warnings,
      context: {},
    };
  }

  if (!structure.rules || structure.rules.length === 0) {
    warnings.push({
      type: 'PAYROLL_CONFIGURATION_ERROR',
      message: `Salary structure "${structure.name}" has no active rules. Cannot compute payslip.`,
      severity: 'Error',
      isBlocking: true,
    });
    return {
      lines: [],
      grossSalary: 0,
      totalDeductions: 0,
      netSalary: 0,
      warnings,
      context: {},
    };
  }

  // ─── Normalize wage to monthly basis ─────────────────────────
  let monthlyWage = wage;
  if (wageFrequency === 'Hourly') {
    // Standard: 160 hours/month (used only as a fallback context variable)
    monthlyWage = wage * 160;
  } else if (wageFrequency === 'Bi-weekly') {
    monthlyWage = wage * 2;
  }

  // ─── Attendance & Hourly Rate Calculations ───────────────────
  const totalPeriodDays = workingDaysInPeriod || 20;
  const standardPeriodHours = totalPeriodDays * 8; // 8 hrs per standard working day
  const hourlyRate = standardPeriodHours > 0 ? (monthlyWage / standardPeriodHours) : (monthlyWage / 160);

  // Overall Total Hours Worked by Employee in Period (Regular + Overtime)
  const totalHoursWorkedInPeriod = (regularHours || 0) + (overtimeHours || 0);

  // Overall Period Net Calculation (Mutual Exclusion: either Overall Net Overtime OR Overall Net Undertime)
  let netOvertimeHours = 0;
  let netUndertimeHours = 0;
  let overtimePay = 0;
  let undertimeDeduction = 0;

  if (totalHoursWorkedInPeriod > standardPeriodHours) {
    netOvertimeHours = Math.round((totalHoursWorkedInPeriod - standardPeriodHours) * 100) / 100;
    overtimePay = Math.round(netOvertimeHours * (hourlyRate * 1.5) * 100) / 100;
  } else if (totalHoursWorkedInPeriod < standardPeriodHours) {
    netUndertimeHours = Math.round((standardPeriodHours - totalHoursWorkedInPeriod) * 100) / 100;
    undertimeDeduction = Math.round(netUndertimeHours * hourlyRate * 100) / 100;
  }

  // Effective wage after deducting unpaid leave days
  const attendanceFactor = workingDaysInPeriod > 0
    ? Math.max(0, (workedDays + (workingDaysInPeriod - workedDays - unpaidLeaveDays)) / workingDaysInPeriod)
    : 1;

  // ─── Build execution context ──────────────────────────────────
  // This is the "variable namespace" for rule formulas/conditions
  const context = {
    WAGE: monthlyWage,
    DAYS: workedDays,
    TOTAL_DAYS: workingDaysInPeriod,
    HOURS: regularHours,
    TOTAL_WORKED_HOURS: totalHoursWorkedInPeriod,
    OT_HOURS: netOvertimeHours,
    UNDERTIME_HOURS: netUndertimeHours,
    HOURLY_RATE: Math.round(hourlyRate * 100) / 100,
    OT_PAY: overtimePay,
    UNDERTIME_DED: undertimeDeduction,
    UNPAID_DAYS: unpaidLeaveDays,
    ATTENDANCE_FACTOR: attendanceFactor,
  };

  // ─── Execute rules in sequence ────────────────────────────────
  for (const rule of structure.rules) {
    let amount = 0;

    try {
      // Check condition (e.g. "WAGE <= 21000" for ESI eligibility)
      const conditionMet = safeEvaluateCondition(rule.condition || '', context);
      if (!conditionMet) {
        // Rule condition not met — skip (no line added)
        continue;
      }

      // Compute amount based on rule type
      if (rule.amountType === 'Fixed') {
        amount = rule.amountValue || 0;
      } else if (rule.amountType === 'Percentage') {
        const base = context[rule.percentageBase || 'WAGE'] || context['WAGE'] || 0;
        amount = base * ((rule.amountValue || 0) / 100);
      } else if (rule.amountType === 'Formula') {
        amount = safeEvaluate(rule.formula || '0', context);
      }

      // Round to 2 decimal places
      amount = Math.round(amount * 100) / 100;

      // For deduction rules, store as negative
      if (rule.isDeduction && amount > 0) {
        amount = -amount;
      }

      // Add to context under this rule's code (for downstream rules)
      context[rule.code] = Math.abs(amount); // context always stores positive values

      // Build payslip line
      lines.push({
        salaryRuleId: rule._id,
        code: rule.code,
        name: rule.name,
        category: rule.category,
        sequence: rule.sequence,
        amount,
      });
    } catch (ruleError) {
      warnings.push({
        type: 'SALARY_RULE_ERROR',
        message: `Error computing rule "${rule.code}" (${rule.name}): ${ruleError.message}`,
        severity: 'Error',
        isBlocking: true,
      });
    }
  }

  // ─── Inject Net Overtime Allowance line if overall net overtime > 0 ───
  if (netOvertimeHours > 0 && !lines.some((l) => l.code === 'OVERTIME' || l.code === 'OT')) {
    lines.push({
      salaryRuleId: null,
      code: 'OVERTIME',
      name: `Overtime Allowance (${netOvertimeHours.toFixed(1)} hrs @ 1.5x)`,
      category: 'Allowance',
      sequence: 45,
      amount: overtimePay,
    });
  }

  // ─── Inject Net Undertime Deduction line if overall net undertime > 0 ─
  if (netUndertimeHours > 0 && !lines.some((l) => l.code === 'UNDERTIME' || l.code === 'SHORT_HOURS')) {
    lines.push({
      salaryRuleId: null,
      code: 'UNDERTIME',
      name: `Undertime / Short Hours Deduction (${netUndertimeHours.toFixed(1)} hrs)`,
      category: 'Deduction',
      sequence: 75,
      amount: -undertimeDeduction,
    });
  }

  // ─── Compute totals from lines ────────────────────────────────
  const baseEarningsSum = lines
    .filter((l) => l.amount > 0 && l.code !== 'GROSS')
    .reduce((sum, l) => sum + l.amount, 0);

  const grossLine = lines.find((l) => l.code === 'GROSS');
  if (grossLine) {
    grossLine.amount = Math.round(baseEarningsSum * 100) / 100;
  }

  const grossSalary = baseEarningsSum;

  const totalDeductions = lines
    .filter((l) => l.amount < 0)
    .reduce((sum, l) => sum + Math.abs(l.amount), 0);

  const netSalary = Math.max(0, grossSalary - totalDeductions);

  return {
    lines,
    grossSalary: Math.round(grossSalary * 100) / 100,
    totalDeductions: Math.round(totalDeductions * 100) / 100,
    netSalary: Math.round(netSalary * 100) / 100,
    warnings,
    context,
    structureName: structure.name,
  };
};

/**
 * Load the best applicable salary structure for a payslip.
 * Priority: contract.salaryStructureId > payrun.salaryStructureId > first active structure
 *
 * @param {Object} params
 * @param {string|null} params.contractStructureId
 * @param {string|null} params.payrunStructureId
 * @returns {string|null} - salaryStructureId to use
 */
const resolveSalaryStructureId = async ({ contractStructureId, payrunStructureId }) => {
  if (contractStructureId) return contractStructureId;
  if (payrunStructureId) return payrunStructureId;

  // Fallback: use STANDARD_MONTHLY structure or first available structure with rules
  const stdStructure = await SalaryStructure.findOne({ code: 'STANDARD_MONTHLY' }).lean();
  if (stdStructure) return stdStructure._id;

  const defaultStructure = await SalaryStructure.findOne({ rules: { $exists: true, $not: { $size: 0 } } }).sort({ createdAt: 1 }).lean();
  return defaultStructure ? defaultStructure._id : null;
};

module.exports = {
  executeSalaryRules,
  resolveSalaryStructureId,
  safeEvaluate,
  safeEvaluateCondition,
};
