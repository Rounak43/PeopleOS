/**
 * PeopleOS — Salary Structure Controller
 */
const salaryStructureService = require('../services/salaryStructureService');
const { sendSuccess } = require('../utils/apiResponse');

const getSalaryStructures = async (req, res, next) => {
  try {
    const structures = await salaryStructureService.getSalaryStructures();
    return sendSuccess(res, structures, 'Salary structures retrieved successfully');
  } catch (error) {
    next(error);
  }
};

const getSalaryStructureById = async (req, res, next) => {
  try {
    const structure = await salaryStructureService.getSalaryStructureById(req.params.id);
    return sendSuccess(res, structure, 'Salary structure retrieved successfully');
  } catch (error) {
    next(error);
  }
};

const createSalaryStructure = async (req, res, next) => {
  try {
    const structure = await salaryStructureService.createSalaryStructure(req.body);
    return sendSuccess(res, structure, 'Salary structure created successfully', 201);
  } catch (error) {
    next(error);
  }
};

const updateSalaryStructure = async (req, res, next) => {
  try {
    const structure = await salaryStructureService.updateSalaryStructure(req.params.id, req.body);
    return sendSuccess(res, structure, 'Salary structure updated successfully');
  } catch (error) {
    next(error);
  }
};

const deleteSalaryStructure = async (req, res, next) => {
  try {
    const result = await salaryStructureService.deleteSalaryStructure(req.params.id);
    return sendSuccess(res, result, 'Salary structure deleted successfully');
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getSalaryStructures,
  getSalaryStructureById,
  createSalaryStructure,
  updateSalaryStructure,
  deleteSalaryStructure,
};
