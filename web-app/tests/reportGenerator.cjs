const fs = require('fs');
const path = require('path');
const ExcelJS = require('exceljs');

class ReportGenerator {
  constructor() {
    this.results = [];
    this.startTime = Date.now();
    this.logs = [];
  }

  init() {
    if (this.results.length > 0) {
      this.log('Continuing existing test session. Cumulative results will be reported.');
      return;
    }
    this.results = [];
    this.startTime = Date.now();
    this.logs = [];
    this.log('Test session initialized.');
  }

  log(message, level = 'INFO') {
    const timestamp = new Date().toISOString();
    const logLine = `[${timestamp}] [${level}] ${message}`;
    this.logs.push(logLine);
    console.log(logLine);
  }

  addResult(category, testName, passed, error = null, duration = 0) {
    this.results.push({
      category,
      testName,
      status: passed ? 'PASS' : 'FAIL',
      error: error || '',
      duration,
      timestamp: new Date().toISOString()
    });
    this.log(`Result added: [${category}] ${testName} - ${passed ? 'PASS' : 'FAIL'} (${duration}ms)`);
  }

  async generateAndPrint() {
    const total = this.results.length;
    const passed = this.results.filter(r => r.status === 'PASS').length;
    const failed = total - passed;
    const passRate = total > 0 ? ((passed / total) * 100).toFixed(1) : '0.0';

    this.log('--- TEST RUN SUMMARY ---');
    this.log(`Total: ${total} | Passed: ${passed} | Failed: ${failed} | Pass Rate: ${passRate}%`);

    // Write text log file
    const logFilePath = path.join(__dirname, '../test-run.log');
    fs.writeFileSync(logFilePath, this.logs.join('\n'));
    this.log(`Detailed logs saved to ${logFilePath}`);

    // Generate Excel File
    await this.generateExcelReport(total, passed, failed, passRate);

    return { total, passed, failed, passRate };
  }

  async generateExcelReport(total, passed, failed, passRate) {
    const workbook = new ExcelJS.Workbook();
    workbook.creator = 'Smart Classroom Pulse Test Suite';
    workbook.lastModifiedBy = 'Smart Classroom Pulse Test Suite';
    workbook.created = new Date();
    workbook.modified = new Date();

    const sheet = workbook.addWorksheet('E2E Test Report', {
      views: [{ showGridLines: true }]
    });

    // Color definitions
    const COLORS = {
      primary: 'FF1E293B', // Dark slate
      secondary: 'FF475569', // Medium slate
      white: 'FFFFFFFF',
      passBg: 'FFD4EDDA', // Light green
      passText: 'FF155724',
      failBg: 'FFF8D7DA', // Light red
      failText: 'FF721C24',
      zebraBg: 'FFF8FAFC', // Very light grey
      borderLight: 'FFE2E8F0',
      headerBg: 'FFF1F5F9'
    };

    // --- Font Definitions ---
    const fontTitle = { name: 'Segoe UI', size: 16, bold: true, color: { argb: COLORS.white } };
    const fontHeader = { name: 'Segoe UI', size: 11, bold: true, color: { argb: COLORS.white } };
    const fontSubHeader = { name: 'Segoe UI', size: 11, bold: true, color: { argb: COLORS.primary } };
    const fontBodyBold = { name: 'Segoe UI', size: 10, bold: true, color: { argb: COLORS.primary } };
    const fontBody = { name: 'Segoe UI', size: 10, color: { argb: COLORS.primary } };

    // 1. Header Banner
    sheet.mergeCells('A1:E2');
    const titleCell = sheet.getCell('A1');
    titleCell.value = 'Smart Classroom Pulse - E2E Test Execution Report';
    titleCell.font = fontTitle;
    titleCell.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: COLORS.primary }
    };
    titleCell.alignment = { horizontal: 'center', vertical: 'middle' };

    // 2. Metadata / Stats Section
    sheet.getCell('A4').value = 'Report Date:';
    sheet.getCell('A4').font = fontBodyBold;
    sheet.getCell('B4').value = new Date().toLocaleString();
    sheet.getCell('B4').font = fontBody;

    sheet.getCell('A5').value = 'Total Duration:';
    sheet.getCell('A5').font = fontBodyBold;
    const totalDuration = Date.now() - this.startTime;
    sheet.getCell('B5').value = `${(totalDuration / 1000).toFixed(2)} seconds`;
    sheet.getCell('B5').font = fontBody;

    // Summary Cards (Rows 4-6, Columns D-E)
    // Card Title
    sheet.getCell('D4').value = 'Test Success Summary';
    sheet.getCell('D4').font = fontSubHeader;
    sheet.mergeCells('D4:E4');
    sheet.getCell('D4').alignment = { horizontal: 'center' };

    const stats = [
      { label: 'Total Test Cases', val: total },
      { label: 'Passed', val: passed, type: 'pass' },
      { label: 'Failed', val: failed, type: 'fail' },
      { label: 'Success Rate', val: `${passRate}%` }
    ];

    let startRow = 5;
    stats.forEach(stat => {
      sheet.getCell(`D${startRow}`).value = stat.label;
      sheet.getCell(`D${startRow}`).font = fontBodyBold;
      sheet.getCell(`D${startRow}`).border = {
        top: { style: 'thin', color: { argb: COLORS.borderLight } },
        bottom: { style: 'thin', color: { argb: COLORS.borderLight } }
      };

      const valCell = sheet.getCell(`E${startRow}`);
      valCell.value = stat.val;
      valCell.font = fontBodyBold;
      valCell.alignment = { horizontal: 'right' };
      valCell.border = {
        top: { style: 'thin', color: { argb: COLORS.borderLight } },
        bottom: { style: 'thin', color: { argb: COLORS.borderLight } }
      };

      if (stat.type === 'pass') {
        valCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: COLORS.passBg } };
        valCell.font = { name: 'Segoe UI', size: 10, bold: true, color: { argb: COLORS.passText } };
      } else if (stat.type === 'fail') {
        if (stat.val > 0) {
          valCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: COLORS.failBg } };
          valCell.font = { name: 'Segoe UI', size: 10, bold: true, color: { argb: COLORS.failText } };
        } else {
          valCell.font = { name: 'Segoe UI', size: 10, bold: true, color: { argb: COLORS.passText } };
        }
      }
      startRow++;
    });

    // 3. Category Summary Breakdown
    sheet.getCell('A10').value = 'Results By Category';
    sheet.getCell('A10').font = fontSubHeader;

    // Header for Category Table
    const catHeaders = ['Category / User Flow', 'Total', 'Passed', 'Failed', 'Pass Rate'];
    catHeaders.forEach((h, idx) => {
      const colLetter = String.fromCharCode(65 + idx); // A, B, C, D, E
      const cell = sheet.getCell(`${colLetter}11`);
      cell.value = h;
      cell.font = fontHeader;
      cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: COLORS.secondary } };
      cell.alignment = { horizontal: idx === 0 ? 'left' : 'right' };
      cell.border = {
        top: { style: 'thin', color: { argb: COLORS.primary } },
        bottom: { style: 'medium', color: { argb: COLORS.primary } }
      };
    });

    // Calculate categories
    const categories = [...new Set(this.results.map(r => r.category))];
    let catRowIndex = 12;
    categories.forEach(cat => {
      const catResults = this.results.filter(r => r.category === cat);
      const catTotal = catResults.length;
      const catPassed = catResults.filter(r => r.status === 'PASS').length;
      const catFailed = catTotal - catPassed;
      const catPassRate = catTotal > 0 ? ((catPassed / catTotal) * 100).toFixed(1) : '0.0';

      const rowValues = [cat, catTotal, catPassed, catFailed, `${catPassRate}%`];
      rowValues.forEach((val, colIdx) => {
        const colLetter = String.fromCharCode(65 + colIdx);
        const cell = sheet.getCell(`${colLetter}${catRowIndex}`);
        cell.value = val;
        cell.font = fontBody;
        cell.alignment = { horizontal: colIdx === 0 ? 'left' : 'right' };
        cell.border = {
          bottom: { style: 'thin', color: { argb: COLORS.borderLight } }
        };

        if (colIdx === 2 && catPassed > 0) {
          cell.font = { name: 'Segoe UI', size: 10, color: { argb: COLORS.passText }, bold: true };
        }
        if (colIdx === 3 && catFailed > 0) {
          cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: COLORS.failBg } };
          cell.font = { name: 'Segoe UI', size: 10, color: { argb: COLORS.failText }, bold: true };
        }
      });
      catRowIndex++;
    });

    // 4. Detailed Test Results Table
    let detailStartRow = catRowIndex + 2;
    sheet.getCell(`A${detailStartRow}`).value = 'Detailed Test Cases';
    sheet.getCell(`A${detailStartRow}`).font = fontSubHeader;

    const detailHeaders = ['Category', 'Test Case Description', 'Status', 'Duration', 'Error Message'];
    detailHeaders.forEach((h, idx) => {
      const colLetter = String.fromCharCode(65 + idx);
      const cell = sheet.getCell(`${colLetter}${detailStartRow + 1}`);
      cell.value = h;
      cell.font = fontHeader;
      cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: COLORS.secondary } };
      cell.alignment = { horizontal: idx === 2 ? 'center' : 'left' };
      cell.border = {
        top: { style: 'thin', color: { argb: COLORS.primary } },
        bottom: { style: 'medium', color: { argb: COLORS.primary } }
      };
    });

    let currentDetailRow = detailStartRow + 2;
    this.results.forEach((res, rowIdx) => {
      const isZebra = rowIdx % 2 === 1;
      const fill = isZebra ? { type: 'pattern', pattern: 'solid', fgColor: { argb: COLORS.zebraBg } } : null;

      const cells = [
        { col: 'A', val: res.category, align: 'left' },
        { col: 'B', val: res.testName, align: 'left' },
        { col: 'C', val: res.status, align: 'center' },
        { col: 'D', val: `${(res.duration / 1000).toFixed(2)}s`, align: 'left' },
        { col: 'E', val: res.error, align: 'left' }
      ];

      cells.forEach(c => {
        const cell = sheet.getCell(`${c.col}${currentDetailRow}`);
        cell.value = c.val;
        cell.font = fontBody;
        cell.alignment = { horizontal: c.align };
        cell.border = {
          bottom: { style: 'thin', color: { argb: COLORS.borderLight } },
          left: { style: 'thin', color: { argb: COLORS.borderLight } },
          right: { style: 'thin', color: { argb: COLORS.borderLight } }
        };

        if (fill) cell.fill = fill;

        if (c.col === 'C') {
          cell.font = { name: 'Segoe UI', size: 10, bold: true, color: { argb: res.status === 'PASS' ? COLORS.passText : COLORS.failText } };
          cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: res.status === 'PASS' ? COLORS.passBg : COLORS.failBg } };
        }
      });

      currentDetailRow++;
    });

    // Auto-fit Columns with some padding
    sheet.columns.forEach((column, colIdx) => {
      let maxLen = 0;
      column.eachCell({ includeEmpty: false }, cell => {
        if (cell.value && cell.address !== 'A1' && cell.address !== 'A2') {
          const valString = cell.value.toString();
          if (valString.length > maxLen) {
            maxLen = valString.length;
          }
        }
      });
      // Cap column size for readability
      column.width = Math.min(Math.max(maxLen + 4, 12), 50);
    });

    // Save File
    const outputPath = path.join(__dirname, '../test-results.xlsx');
    try {
      await workbook.xlsx.writeFile(outputPath);
      this.log(`Excel report saved to ${outputPath}`);
    } catch (e) {
      this.log(`Warning: Failed to write to primary report file ${outputPath}: ${e.message}`, 'WARNING');
      const backupPath = path.join(__dirname, `../test-results_${Date.now()}.xlsx`);
      try {
        await workbook.xlsx.writeFile(backupPath);
        this.log(`Excel report saved to backup path ${backupPath}`);
      } catch (backupError) {
        this.log(`Error: Failed to write backup report file ${backupPath}: ${backupError.message}`, 'ERROR');
      }
    }
  }
}

module.exports = new ReportGenerator();
