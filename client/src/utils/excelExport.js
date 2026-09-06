/**
 * Utility to export employee data cleanly into Microsoft Excel formatted sheet (.xls)
 */
export const exportEmployeesToExcel = (employees) => {
  if (!employees || employees.length === 0) {
    alert('No employee data available to export.');
    return;
  }

  // Structured Headers
  const headers = [
    'Sr No',
    'Employee ID',
    'Full Name',
    'Email Address',
    'Phone Number',
    'Department',
    'Job Position',
    'Schedule',
    'Status',
    'Joining Date',
    'Reporting Manager',
  ];

  // Map rows
  const rows = employees.map((emp, index) => {
    const fullName =
      emp.firstName && emp.lastName
        ? `${emp.firstName} ${emp.lastName}`
        : emp.fullName || emp.name || emp.email || 'N/A';

    return [
      index + 1,
      emp.employeeCode || emp.id || emp._id || 'N/A',
      fullName,
      emp.email || 'N/A',
      emp.phone || 'N/A',
      emp.department || emp.departmentId?.name || 'General',
      emp.jobTitle || emp.position || emp.jobPositionId?.title || 'Staff',
      emp.workingSchedule || 'Standard',
      emp.employmentStatus || emp.status || 'Active',
      emp.joinDate || emp.joiningDate || 'N/A',
      emp.managerName || emp.manager || 'Unassigned',
    ];
  });

  // Build organized HTML template for Excel with native styling & gridlines
  const tableHeaderHtml = headers
    .map(
      (h) =>
        `<th style="background-color: #2563eb; color: #ffffff; font-weight: bold; padding: 10px; border: 1px solid #1d4ed8; text-align: left; font-size: 14px;">${h}</th>`
    )
    .join('');

  const tableRowsHtml = rows
    .map((row, idx) => {
      const bgColor = idx % 2 === 0 ? '#ffffff' : '#f8fafc';
      const cells = row
        .map(
          (cell) =>
            `<td style="padding: 8px 12px; border: 1px solid #cbd5e1; font-size: 13px; color: #1e293b;">${String(
              cell ?? ''
            )
              .replace(/</g, '&lt;')
              .replace(/>/g, '&gt;')}</td>`
        )
        .join('');
      return `<tr style="background-color: ${bgColor};">${cells}</tr>`;
    })
    .join('');

  const excelDoc = `
    <html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel" xmlns="http://www.w3.org/TR/REC-html40">
    <head>
      <meta charset="utf-8" />
      <!--[if gte mso 9]>
      <xml>
        <x:ExcelWorkbook>
          <x:ExcelWorksheets>
            <x:ExcelWorksheet>
              <x:Name>Employees Directory</x:Name>
              <x:WorksheetOptions>
                <x:DisplayGridlines/>
              </x:WorksheetOptions>
            </x:ExcelWorksheet>
          </x:ExcelWorksheets>
        </x:ExcelWorkbook>
      </xml>
      <![endif]-->
      <style>
        body { font-family: Arial, sans-serif; margin: 20px; }
        h2 { color: #1e293b; font-size: 18px; margin-bottom: 4px; }
        p { color: #64748b; font-size: 12px; margin-top: 0; margin-bottom: 16px; }
        table { border-collapse: collapse; width: 100%; }
      </style>
    </head>
    <body>
      <h2>PeopleOS — Employee Master Data Report</h2>
      <p>Report Generated On: ${new Date().toLocaleString()} | Total Records: ${employees.length}</p>
      <table>
        <thead>
          <tr>${tableHeaderHtml}</tr>
        </thead>
        <tbody>
          ${tableRowsHtml}
        </tbody>
      </table>
    </body>
    </html>
  `;

  const blob = new Blob([excelDoc], { type: 'application/vnd.ms-excel;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  const dateTag = new Date().toISOString().split('T')[0];
  link.setAttribute('download', `PeopleOS_Employee_Data_${dateTag}.xls`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};
