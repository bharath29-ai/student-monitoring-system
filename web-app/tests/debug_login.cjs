const { Builder, By, until } = require('selenium-webdriver');
const chrome = require('selenium-webdriver/chrome');
const fs = require('fs');

const BASE_URL = 'http://localhost:5173';

async function run() {
  const options = new chrome.Options();
  options.addArguments('--headless');
  options.addArguments('--no-sandbox');
  options.addArguments('--disable-dev-shm-usage');
  options.addArguments('--disable-gpu');
  options.setMobileEmulation({ deviceName: 'Nexus 5' });

  const driver = await new Builder()
    .forBrowser('chrome')
    .setChromeOptions(options)
    .build();

  let logContent = '';
  function log(msg) {
    console.log(msg);
    logContent += msg + '\n';
  }

  try {
    log('Navigating to login...');
    await driver.get(`${BASE_URL}/login`);
    await driver.wait(until.elementLocated(By.id('email')), 10000);

    // Override console.log/error in the browser
    await driver.executeScript(`
      window.appLogs = [];
      const origLog = console.log;
      console.log = function(...args) {
        window.appLogs.push('[LOG] ' + args.map(x => typeof x === 'object' ? JSON.stringify(x) : x).join(' '));
        origLog.apply(console, args);
      };
      const origError = console.error;
      console.error = function(...args) {
        window.appLogs.push('[ERROR] ' + args.map(x => typeof x === 'object' ? JSON.stringify(x) : x).join(' '));
        origError.apply(console, args);
      };
      window.addEventListener('error', function(e) {
        window.appLogs.push('[WINDOW ERROR] ' + e.message + ' at ' + e.filename + ':' + e.lineno);
      });
    `);

    log('Filling email and password...');
    await driver.findElement(By.id('email')).sendKeys('testadmin@example.com');
    await driver.findElement(By.id('password')).sendKeys('adminpass123');

    log('Clicking sign in button...');
    const submitBtn = await driver.findElement(By.css('button[type="submit"]'));
    await driver.executeScript("arguments[0].click();", submitBtn);

    log('Waiting for redirection...');
    await driver.sleep(6000);

    const currentUrl = await driver.getCurrentUrl();
    const finalPageText = await driver.findElement(By.css('body')).getText();

    log(`Final URL: ${currentUrl}`);
    logContent += '--- Final Page Text ---\n' + finalPageText + '\n-----------------------\n';

    log('Retrieving application console logs...');
    const appLogs = await driver.executeScript("return window.appLogs;");
    logContent += '--- Application Console Logs ---\n';
    if (appLogs && appLogs.length > 0) {
      appLogs.forEach(l => {
        logContent += l + '\n';
        console.log('AppLog: ' + l);
      });
    } else {
      logContent += 'No app logs found.\n';
      console.log('No app logs found.');
    }
    logContent += '--------------------------------\n';

  } catch (err) {
    log(`ERROR: ${err.message}`);
    log(err.stack);
  } finally {
    fs.writeFileSync('debug_login_out.txt', logContent);
    console.log('Finished. Output written to debug_login_out.txt');
    await driver.quit();
  }
}

run();
