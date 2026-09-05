import http from '../common/http';

const BASE = '/api/salary-structures';

export const getSalaryStructures = () => http.get(BASE);
export const createSalaryStructure = (data) => http.post(BASE, data);
