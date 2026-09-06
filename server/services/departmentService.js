/**
 * PeopleOS — Department Service
 */

const Department = require('../models/Department');
const JobPosition = require('../models/JobPosition');
const Employee = require('../models/Employee');
const { buildPaginationMeta } = require('../utils/pagination');
const { DEPT_CODE_REGEX } = require('./employeeIdService');

/**
 * Auto-suggest a 2-character department code from a department name.
 * Takes the first 2 letters of the first meaningful word, uppercased.
 *
 * Examples:
 *   "Software Engineering"         → SE
 *   "Human Resources (HR)"         → HR
 *   "Cybersecurity & IT Security"  → CY
 *   "Data & AI"                    → DA
 *   "Finance & Accounts"           → FA
 *
 * @param {string} name
 * @returns {string} 2-char uppercase suggestion
 */
const suggestDepartmentCode = (name) => {
  // Strip parenthetical suffixes: "Quality Assurance (QA)" → "Quality Assurance"
  const clean = name.replace(/\(.*?\)/g, '').trim();

  // Split into words, filter out stop words/connectors
  const stopWords = new Set(['and', 'or', 'the', 'of', 'for', 'in', 'at', 'to', 'a', '&']);
  const words = clean
    .split(/[\s&\/\-+]+/)
    .map((w) => w.replace(/[^a-zA-Z]/g, ''))
    .filter((w) => w.length >= 2 && !stopWords.has(w.toLowerCase()));

  if (words.length === 0) {
    return clean.toUpperCase().slice(0, 2);
  }

  if (words.length === 1) {
    return words[0].toUpperCase().slice(0, 2);
  }

  // Two or more words: take first letter of first two words
  return (words[0][0] + words[1][0]).toUpperCase();
};

/**
 * Ensures a department code is unique. If the suggested code is taken,
 * tries variations by iterating through letters.
 *
 * @param {string} suggested - Initial 2-char suggested code
 * @param {string|null} excludeId - Department ID to exclude from uniqueness check (for updates)
 * @returns {Promise<string>} - A guaranteed unique code
 */
const resolveUniqueCode = async (suggested, excludeId = null) => {
  const query = { code: suggested };
  if (excludeId) query._id = { $ne: excludeId };

  const existing = await Department.findOne(query);
  if (!existing) return suggested;

  // Collision — try variations: change the second character A→Z
  const first = suggested[0];
  for (let i = 0; i < 26; i++) {
    const variant = first + String.fromCharCode(65 + i); // A-Z
    if (variant === suggested) continue;
    const variantQuery = { code: variant };
    if (excludeId) variantQuery._id = { $ne: excludeId };
    const taken = await Department.findOne(variantQuery);
    if (!taken) return variant;
  }

  // Try first character variations too
  for (let i = 0; i < 26; i++) {
    for (let j = 0; j < 26; j++) {
      const variant = String.fromCharCode(65 + i) + String.fromCharCode(65 + j);
      const variantQuery = { code: variant };
      if (excludeId) variantQuery._id = { $ne: excludeId };
      const taken = await Department.findOne(variantQuery);
      if (!taken) return variant;
    }
  }

  const err = new Error('No available 2-character department codes remain. System has reached capacity.');
  err.statusCode = 500;
  throw err;
};

const createDepartment = async (data) => {
  // Validate or auto-generate the department code
  let code;
  if (data.code) {
    code = data.code.toUpperCase().trim();
    if (!DEPT_CODE_REGEX.test(code)) {
      const err = new Error(
        `Department code "${code}" is invalid. Must be exactly 2 uppercase alphabetic characters (e.g. CY, HR, DS).`
      );
      err.statusCode = 400;
      throw err;
    }
    // Check uniqueness
    const existing = await Department.findOne({ code });
    if (existing) {
      const err = new Error(
        `Department code "${code}" is already in use by "${existing.name}". Please choose a different code.`
      );
      err.statusCode = 409;
      throw err;
    }
  } else {
    // Auto-suggest and guarantee uniqueness
    const suggested = suggestDepartmentCode(data.name || '');
    code = await resolveUniqueCode(suggested);
  }

  if (data.parentDepartmentId) {
    const parent = await Department.findById(data.parentDepartmentId);
    if (!parent) {
      const err = new Error('Parent department does not exist');
      err.statusCode = 400;
      throw err;
    }
  }

  if (data.managerEmployeeId) {
    const manager = await Employee.findById(data.managerEmployeeId);
    if (!manager) {
      const err = new Error('Manager employee does not exist');
      err.statusCode = 400;
      throw err;
    }
  }

  const department = new Department({ ...data, code });
  return await department.save();
};

const getDepartments = async ({ search, page = 1, limit = 20, skip = 0 }) => {
  const query = {};
  if (search) {
    query.$or = [
      { name: { $regex: search, $options: 'i' } },
      { code: { $regex: search, $options: 'i' } },
    ];
  }

  const [items, total] = await Promise.all([
    Department.find(query)
      .populate('parentDepartmentId', 'name code')
      .populate('managerEmployeeId', 'fullName employeeCode')
      .skip(skip)
      .limit(limit)
      .sort({ name: 1 }),
    Department.countDocuments(query),
  ]);

  return {
    items,
    pagination: buildPaginationMeta(page, limit, total),
  };
};

const getDepartmentById = async (id) => {
  const department = await Department.findById(id)
    .populate('parentDepartmentId', 'name code')
    .populate('managerEmployeeId', 'fullName employeeCode');

  if (!department) {
    const err = new Error('Department not found');
    err.statusCode = 404;
    throw err;
  }
  return department;
};

const updateDepartment = async (id, data) => {
  // CRITICAL: Department code is immutable once employee IDs reference it.
  // If code update is attempted, reject it.
  if (data.code !== undefined) {
    const existing = await Department.findById(id);
    if (existing && data.code.toUpperCase().trim() !== existing.code) {
      const err = new Error(
        `Department code "${existing.code}" cannot be changed once assigned. ` +
        `Employee IDs referencing this department encode this code permanently.`
      );
      err.statusCode = 400;
      throw err;
    }
    // Allow if same value (idempotent)
  }

  if (data.parentDepartmentId && data.parentDepartmentId.toString() === id.toString()) {
    const err = new Error('A department cannot be its own parent');
    err.statusCode = 400;
    throw err;
  }

  if (data.parentDepartmentId) {
    const parent = await Department.findById(data.parentDepartmentId);
    if (!parent) {
      const err = new Error('Parent department does not exist');
      err.statusCode = 400;
      throw err;
    }
  }

  // Strip code from update payload — code is immutable
  const { code, ...safeData } = data;

  const department = await Department.findByIdAndUpdate(id, safeData, { new: true, runValidators: true });
  if (!department) {
    const err = new Error('Department not found');
    err.statusCode = 404;
    throw err;
  }
  return department;
};

const deleteDepartment = async (id) => {
  const [childDept, jobPos, employee] = await Promise.all([
    Department.findOne({ parentDepartmentId: id }),
    JobPosition.findOne({ departmentId: id }),
    Employee.findOne({ departmentId: id }),
  ]);

  if (childDept || jobPos || employee) {
    const err = new Error('Cannot delete department: It is referenced by child departments, job positions, or employees');
    err.statusCode = 400;
    throw err;
  }

  const deleted = await Department.findByIdAndDelete(id);
  if (!deleted) {
    const err = new Error('Department not found');
    err.statusCode = 404;
    throw err;
  }
  return true;
};

/**
 * Returns a suggested department code for a given name.
 * Used by the frontend to show a code suggestion when creating a new department.
 */
const suggestCode = async (name) => {
  const suggested = suggestDepartmentCode(name || '');
  const unique = await resolveUniqueCode(suggested);
  return { suggested: unique };
};

module.exports = {
  createDepartment,
  getDepartments,
  getDepartmentById,
  updateDepartment,
  deleteDepartment,
  suggestCode,
};
