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

  try {
    console.log('Navigating to login...');
    await driver.get(`${BASE_URL}/login`);
    await driver.wait(until.elementLocated(By.id('email')), 10000);

    await driver.findElement(By.id('email')).sendKeys('testadmin@example.com');
    await driver.findElement(By.id('password')).sendKeys('adminpass123');
    const submitBtn = await driver.findElement(By.css('button[type="submit"]'));
    await driver.executeScript("arguments[0].click();", submitBtn);

    console.log('Waiting for dashboard...');
    await driver.wait(until.urlContains('/dashboard'), 15000);

    console.log('Navigating to admin...');
    await driver.get(`${BASE_URL}/admin`);
    await driver.sleep(2000);

    console.log('Finding Classes tab...');
    const classesTab = await driver.findElement(By.xpath('//button[contains(., "Classes")]'));
    console.log('Classes tab properties:', {
      tagName: await classesTab.getTagName(),
      text: await classesTab.getText(),
      displayed: await classesTab.isDisplayed(),
      enabled: await classesTab.isEnabled()
    });

    console.log('Clicking Classes tab via dispatchEvent sequence...');
    await driver.executeScript(`
      const el = arguments[0];
      const events = ['pointerdown', 'mousedown', 'pointerup', 'mouseup', 'click'];
      events.forEach(type => {
        const ev = new MouseEvent(type, { bubbles: true, cancelable: true, view: window });
        el.dispatchEvent(ev);
      });
    `, classesTab);
    await driver.sleep(3000);

    const bodyText = await driver.findElement(By.css('body')).getText();
    const html = await driver.findElement(By.css('body')).getAttribute('innerHTML');

    let output = '';
    output += '--- Page Text ---\n' + bodyText + '\n-----------------\n';
    output += '--- Body HTML ---\n' + html + '\n-----------------\n';

    fs.writeFileSync('debug_admin_out.txt', output);
    console.log('Debug output written to debug_admin_out.txt');

  } catch (err) {
    console.error(err);
  } finally {
    await driver.quit();
  }
}

run();
