/**
 * PeopleOS — Payroll Domain Services
 * 
 * Central export for all payroll domain services.
 * Import from this file for cleaner dependency management.
 */
module.exports = {
  contractResolver: require('./contractResolver'),
  salaryRuleEngine: require('./salaryRuleEngine'),
  attendanceAggregator: require('./attendanceAggregator'),
  timeOffAggregator: require('./timeOffAggregator'),
  payrollValidationService: require('./payrollValidationService'),
};
