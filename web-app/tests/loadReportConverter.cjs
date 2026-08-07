const fs = require('fs');
const path = require('path');
const ExcelJS = require('exceljs');

async function convert(jsonPath, excelPath) {
  console.log(`Starting conversion: ${jsonPath} -> ${excelPath}`);

  if (!fs.existsSync(jsonPath)) {
    throw new Error(`Artillery JSON report not found at: ${jsonPath}. Did the load test run successfully?`);
  }

  const fileContent = fs.readFileSync(jsonPath, 'utf8');
  if (!fileContent || fileContent.trim() === '') {
    throw new Error(`Artillery JSON report is empty: ${jsonPath}`);
  }

  let data;
  try {
    data = JSON.parse(fileContent);
  } catch (e) {
    throw new Error(`Failed to parse Artillery JSON report: ${e.message}. Content starts with: ${fileContent.substring(0, 100)}`);
  }

  const workbook = new ExcelJS.Workbook();
  const sheet = workbook.addWorksheet('Load Test Report');

  sheet.columns = [
    { header: 'Metric', key: 'metric', width: 35 },
    { header: 'Value', key: 'value', width: 25 }
  ];

  const stats = data.aggregate || {};
  const counters = stats.counters || {};
  const summaries = stats.summaries || {};

  const startTime = data.meta?.timestamp || (stats.firstCounterAt ? new Date(stats.firstCounterAt).toISOString() : new Date().toISOString());

  sheet.addRow({ metric: 'Start Time', value: startTime });
  sheet.addRow({ metric: 'Total Sessions Created', value: counters['vusers.created'] || 0 });
  sheet.addRow({ metric: 'Completed Sessions', value: counters['vusers.completed'] || 0 });
  sheet.addRow({ metric: 'Failed Sessions', value: counters['vusers.failed'] || 0 });
  sheet.addRow({ metric: 'Total HTTP Requests', value: counters['http.requests'] || 0 });

  if (summaries['http.response_time']) {
    const rt = summaries['http.response_time'];
    sheet.addRow({ metric: 'Min Latency (ms)', value: rt.min ?? 'N/A' });
    sheet.addRow({ metric: 'Max Latency (ms)', value: rt.max ?? 'N/A' });
    sheet.addRow({ metric: 'Mean Latency (ms)', value: rt.mean ?? 'N/A' });
    sheet.addRow({ metric: 'Median Latency (ms)', value: rt.median ?? 'N/A' });
    sheet.addRow({ metric: 'p95 Latency (ms)', value: rt.p95 ?? 'N/A' });
    sheet.addRow({ metric: 'p99 Latency (ms)', value: rt.p99 ?? 'N/A' });
  }

  let totalErrors = 0;
  for (const [key, val] of Object.entries(counters)) {
    if (key.startsWith('http.codes.')) {
      const code = key.replace('http.codes.', '');
      sheet.addRow({ metric: `HTTP Status ${code}`, value: val });
      if (code.startsWith('4') || code.startsWith('5')) {
        totalErrors += val;
      }
    }
  }

  sheet.addRow({ metric: 'Total Error Responses (4xx/5xx)', value: totalErrors });

  await workbook.xlsx.writeFile(excelPath);
  console.log(`Load test Excel report successfully saved to: ${excelPath}`);
}

const jsonFile = path.join(__dirname, '../load-report.json');
const excelFile = path.join(__dirname, '../load-test-results.xlsx');

convert(jsonFile, excelFile).catch(err => {
  console.error('Failed to convert load report:', err);
  process.exit(1);
});

