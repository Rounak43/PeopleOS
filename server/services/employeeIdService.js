/**
 * PeopleOS — Employee ID Service
 *
 * THE SINGLE SOURCE OF TRUTH for employee ID generation.
 *
 * Final format:  OSYYDDNNN
 * Example:       OS26CY010
 *
 *   OS   = PeopleOS prefix
 *   26   = 2-digit joining year (from dateJoined)
 *   CY   = 2-char department code (uppercase alphabetic)
 *   010  = 3-digit zero-padded atomic sequence (per year + dept)
 *
 * Rules:
 *  - Year comes from employee's dateJoined, NOT server clock
 *  - Sequence is YEAR + DEPARTMENT CODE scoped (resets per year)
 *  - Sequence is incremented atomically using MongoDB $inc + upsert
 *  - Frontend NEVER generates IDs — this service is backend-only
 *
 * Regex:  ^OS[0-9]{2}[A-Z]{2}[0-9]{3}$
 *
 * Valid:   OS26CY001  OS26DS010  OS27HR001
 * Invalid: EMP-001   OS2026CY001  OS26cy001  OS26CY0001
 */

const EmployeeSequence = require('../models/EmployeeSequence');

const EMPLOYEE_CODE_REGEX = /^OS[0-9]{2}[A-Z]{2}[0-9]{3}$/;
const DEPT_CODE_REGEX = /^[A-Z]{2}$/;

/**
 * Generates the next atomic employee code for a given year and department code.
 *
 * @param {number} year           - 4-digit year (e.g. 2026)
 * @param {string} departmentCode - 2-char uppercase dept code (e.g. "CY")
 * @returns {Promise<string>}     - Generated employee code (e.g. "OS26CY010")
 * @throws {Error}                - If department code is invalid or sequence exceeds 999
 */
const generateEmployeeCode = async (year, departmentCode) => {
  // Validate inputs
  if (!year || typeof year !== 'number' || year < 2000 || year > 2099) {
    const err = new Error(`Invalid year for employee ID generation: ${year}`);
    err.statusCode = 500;
    throw err;
  }

  const code = String(departmentCode).toUpperCase().trim();
  if (!DEPT_CODE_REGEX.test(code)) {
    const err = new Error(
      `Invalid department code "${departmentCode}" for employee ID generation. Must be exactly 2 uppercase alphabetic characters.`
    );
    err.statusCode = 500;
    throw err;
  }

  const sequenceKey = `${year}-${code}`;
  const yearShort = String(year).slice(-2); // "2026" → "26"

  // Atomic increment — safe under concurrent employee creation
  const result = await EmployeeSequence.findOneAndUpdate(
    { _id: sequenceKey },
    {
      $inc: { sequence: 1 },
      $setOnInsert: {
        year,
        departmentCode: code,
      },
    },
    { upsert: true, new: true }
  );

  const seq = result.sequence;

  if (seq > 999) {
    const err = new Error(
      `Employee ID sequence for ${year}-${code} has exceeded the maximum (999). Please contact the system administrator.`
    );
    err.statusCode = 500;
    throw err;
  }

  // Zero-pad to 3 digits: 1 → "001", 10 → "010", 999 → "999"
  const paddedSeq = String(seq).padStart(3, '0');

  return `OS${yearShort}${code}${paddedSeq}`;
};

/**
 * Validates that a string matches the official PeopleOS employee code format.
 *
 * @param {string} code - The employee code to validate
 * @returns {boolean}
 */
const isValidEmployeeCode = (code) => {
  return typeof code === 'string' && EMPLOYEE_CODE_REGEX.test(code);
};

/**
 * Extracts year and department code from an employee code.
 *
 * @param {string} code - e.g. "OS26CY010"
 * @returns {{ year: number, departmentCode: string, sequence: number } | null}
 */
const parseEmployeeCode = (code) => {
  if (!isValidEmployeeCode(code)) return null;
  return {
    year: 2000 + parseInt(code.slice(2, 4), 10),
    departmentCode: code.slice(4, 6),
    sequence: parseInt(code.slice(6, 9), 10),
  };
};

module.exports = {
  generateEmployeeCode,
  isValidEmployeeCode,
  parseEmployeeCode,
  EMPLOYEE_CODE_REGEX,
  DEPT_CODE_REGEX,
};
