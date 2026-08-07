const fs = require('fs');
const path = require('path');
const ExcelJS = require('exceljs');

async function convert(jsonPath, excelPath) {
  if (!fs.existsSync(jsonPath)) {
    console.error(`Source file not found: ${jsonPath}`);
    return;
  }

  const data = JSON.parse(fs.readFileSync(jsonPath, 'utf8'));
  const workbook = new ExcelJS.Workbook();
  const sheet = workbook.addWorksheet('Load Test Report');

  sheet.columns = [
    { header: 'Metric', key: 'metric', width: 30 },
    { header: 'Value', key: 'value', width: 20 }
  ];

  // Aggregate stats
  const stats = data.aggregate;
  sheet.addRow({ metric: 'Start Time', value: data.meta.timestamp });
  sheet.addRow({ metric: 'Total Sessions', value: stats.counters['vusers.created'] || 0 });
  sheet.addRow({ metric: 'Completed Sessions', value: stats.counters['vusers.completed'] || 0 });

  if (stats.summaries['http.response_time']) {
    sheet.addRow({ metric: 'Min Latency (ms)', value: stats.summaries['http.response_time'].min });
    sheet.addRow({ metric: 'Max Latency (ms)', value: stats.summaries['http.response_time'].max });
    sheet.addRow({ metric: 'Median Latency (ms)', value: stats.summaries['http.response_time'].median });
    sheet.addRow({ metric: 'p95 Latency (ms)', value: stats.summaries['http.response_time'].p95 });
    sheet.addRow({ metric: 'p99 Latency (ms)', value: stats.summaries['http.response_time'].p99 });
  }

  sheet.addRow({ metric: 'HTTP 2xx Responses', value: stats.counters['http.codes.200'] || 0 });
  sheet.addRow({ metric: 'HTTP Errors', value: (stats.counters['http.codes.4xx'] || 0) + (stats.counters['http.codes.5xx'] || 0) });

  await workbook.xlsx.writeFile(excelPath);
  console.log(`Load test Excel report saved to: ${excelPath}`);
}

const jsonFile = path.join(__dirname, '../load-report.json');
const excelFile = path.join(__dirname, '../load-test-results.xlsx');

convert(jsonFile, excelFile).catch(err => {
  console.error('Failed to convert load report:', err);
  process.exit(1);
});
