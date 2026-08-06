const { Builder, By, until, Key } = require('selenium-webdriver');
const chrome = require('selenium-webdriver/chrome');
const { expect } = require('chai');
const reportGenerator = require('./reportGenerator.cjs');
const { runSetup } = require('./setupHelper.cjs');

const BASE_URL = 'http://localhost:5173';
const TEST_TIMESTAMP = Date.now();
const STUDENT_USER = {
  fullName: `Student_${TEST_TIMESTAMP}`,
  email: `teststudent_${TEST_TIMESTAMP}@example.com`,
  password: 'studentpass123'
};
const CLASS_NAME = `Math E2E Class_${TEST_TIMESTAMP}`;

describe('Smart Classroom Pulse - E2E Test Suite', function() {
  this.timeout(180000); // 3 minutes timeout for the entire suite

  let driver;

  // Helper to log page state details on failure
  async function logFailureDetails(testName, error) {
    if (driver) {
      try {
        const url = await driver.getCurrentUrl();
        const pageText = await driver.findElement(By.css('body')).getText();
        reportGenerator.log(`DIAGNOSTIC [${testName}]:`, 'ERROR');
        reportGenerator.log(`  Current URL: ${url}`, 'ERROR');
        reportGenerator.log(`  Page Text: ${pageText.substring(0, 500).replace(/\n/g, ' | ')}`, 'ERROR');
        
        // Retrieve and print browser console logs
        reportGenerator.log('  Browser Console Logs:', 'ERROR');
        const logs = await driver.manage().logs().get('browser');
        if (logs && logs.length > 0) {
          logs.forEach(log => {
            reportGenerator.log(`    [${log.level.name}] ${log.message}`, 'ERROR');
          });
        } else {
          reportGenerator.log('    No console logs found.', 'ERROR');
        }
      } catch (e) {
        reportGenerator.log(`Failed to retrieve diagnostics: ${e.message}`, 'WARNING');
      }
    }
  }

  // Seeding Admin & Teacher in database before tests start
  before(async function() {
    reportGenerator.init();
    reportGenerator.log('Running pre-test database setup...');
    
    try {
      await runSetup();
      reportGenerator.log('Database setup complete.');
    } catch (err) {
      reportGenerator.log(`Database setup failed: ${err.message}`, 'ERROR');
      throw err;
    }

    reportGenerator.log('Initializing WebDriver...');
    const options = new chrome.Options();
    options.addArguments('--headless'); // Run headless for stability
    options.addArguments('--no-sandbox');
    options.addArguments('--disable-dev-shm-usage');
    options.addArguments('--disable-gpu');
    options.addArguments('--window-size=1920,1080');

    driver = await new Builder()
      .forBrowser('chrome')
      .setChromeOptions(options)
      .build();
    await driver.manage().setTimeouts({ implicit: 5000, pageLoad: 30000 });
    reportGenerator.log('WebDriver initialized successfully.');
  });

  after(async function() {
    if (driver) {
      try {
        reportGenerator.log('Closing WebDriver...');
        await driver.quit();
      } catch (e) {
        reportGenerator.log(`Driver quit error: ${e.message}`, 'ERROR');
      }
    }
    const summary = await reportGenerator.generateAndPrint();
    console.log(`Test Execution Finished. Total: ${summary.total}, Passed: ${summary.passed}, Failed: ${summary.failed}`);
  });

  // UI-based Logout Helper that handles all interface states
  async function logoutCurrentUser() {
    reportGenerator.log('Logging out current user...');
    try {
      // Navigate to splash/splash is a good neutral ground
      await driver.get(`${BASE_URL}/splash`);
      await driver.sleep(1000);

      // Force clear all session storage and cookies
      await driver.executeScript(`
        localStorage.clear();
        sessionStorage.clear();
        document.cookie.split(";").forEach(c => {
          document.cookie = c.replace(/^ +/, "").replace(/=.*/, "=;expires=" + new Date().toUTCString() + ";path=/");
        });
        if (window.indexedDB) {
           window.indexedDB.databases().then(dbs => {
             dbs.forEach(db => window.indexedDB.deleteDatabase(db.name));
           });
        }
      `);

      await driver.sleep(1000);
      await driver.get(`${BASE_URL}/login`);
      reportGenerator.log('Session forced cleared.');
    } catch (e) {
      reportGenerator.log(`Logout failure: ${e.message}`, 'WARNING');
      await driver.get(`${BASE_URL}/login`);
    }
  }

  // ============================================================
  // CATEGORY 1: AUTHENTICATION FLOW
  // ============================================================
  describe('Authentication Flow', function() {
    it('should sign up a new student account', async function() {
      const startTime = Date.now();
      try {
        reportGenerator.log('Navigating to signup page...');
        await driver.get(`${BASE_URL}/signup`);
        await driver.wait(until.elementLocated(By.id('name')), 15000);
        
        reportGenerator.log(`Filling out signup form for student: ${STUDENT_USER.email}`);
        await driver.findElement(By.id('name')).sendKeys(STUDENT_USER.fullName);
        await driver.findElement(By.id('email')).sendKeys(STUDENT_USER.email);
        
        // Wait for teachers to load from Firestore to prevent race conditions on form submit
        reportGenerator.log('Waiting for approved teacher selection list to load...');
        await driver.wait(until.elementLocated(By.xpath('//option[text()="testteacher"]')), 15000);

        // Select Student Role
        const roleTrigger = await driver.findElement(By.css('button[role="combobox"]'));
        await driver.executeScript("arguments[0].click();", roleTrigger);
        await driver.sleep(500);
        
        const studentOption = await driver.findElement(By.xpath('//div[@role="option"]//span[text()="Student"] | //div[@role="option" and contains(., "Student")]'));
        await driver.executeScript("arguments[0].click();", studentOption);
        await driver.sleep(500);

        await driver.findElement(By.id('password')).sendKeys(STUDENT_USER.password);
        await driver.findElement(By.id('confirmPassword')).sendKeys(STUDENT_USER.password);

        reportGenerator.log('Submitting signup form...');
        const submitBtn = await driver.findElement(By.css('button[type="submit"]'));
        await driver.executeScript("arguments[0].click();", submitBtn);

        // Wait to land on the Pending Approval page (because Firebase auto-logs in the user)
        await driver.wait(until.elementLocated(By.xpath('//h1[contains(., "Pending Approval")]')), 15000);
        reportGenerator.log('New account registered. Lands on Pending Approval page.');

        // Crucial sleep to allow Firestore to finish syncing write to the server before logging out!
        await driver.sleep(3000);

        // Clean up session by logging out
        await logoutCurrentUser();

        reportGenerator.addResult('Authentication', 'Sign up a new student account', true, null, Date.now() - startTime);
      } catch (error) {
        await logFailureDetails('Sign up a new student account', error);
        reportGenerator.addResult('Authentication', 'Sign up a new student account', false, error.message, Date.now() - startTime);
        throw error;
      }
    });

    it('should show pending approval message when logging in a pending account', async function() {
      const startTime = Date.now();
      try {
        // Self-healing logout in case previous session leaked
        await logoutCurrentUser();

        reportGenerator.log(`Logging in with pending account: ${STUDENT_USER.email}`);
        await driver.get(`${BASE_URL}/login`);
        await driver.wait(until.elementLocated(By.id('email')), 15000);

        await driver.findElement(By.id('email')).sendKeys(STUDENT_USER.email);
        await driver.findElement(By.id('password')).sendKeys(STUDENT_USER.password);

        const submitBtn = await driver.findElement(By.css('button[type="submit"]'));
        await driver.executeScript("arguments[0].click();", submitBtn);

        // Verify Pending screen loads
        reportGenerator.log('Waiting for Pending Approval screen to render...');
        await driver.wait(until.elementLocated(By.xpath('//h1[contains(., "Pending Approval")]')), 15000);
        const pageText = await driver.findElement(By.css('body')).getText();
        expect(pageText.toLowerCase()).to.include('pending');
        reportGenerator.log('Verified pending approval screen message.');

        // Sign out to prepare for next test
        await logoutCurrentUser();

        reportGenerator.addResult('Authentication', 'Show pending approval screen for new user', true, null, Date.now() - startTime);
      } catch (error) {
        await logFailureDetails('Show pending approval screen for new user', error);
        reportGenerator.addResult('Authentication', 'Show pending approval screen for new user', false, error.message, Date.now() - startTime);
        throw error;
      }
    });
  });

  // ============================================================
  // CATEGORY 2: ADMIN PANEL FLOW
  // ============================================================
  describe('Admin Panel Flow', function() {
    it('should block direct access to admin panel when not logged in', async function() {
      const startTime = Date.now();
      try {
        await logoutCurrentUser();
        reportGenerator.log('Trying to access /admin directly without login...');
        await driver.get(`${BASE_URL}/admin`);
        await driver.sleep(1500);
        const url = await driver.getCurrentUrl();
        expect(url).to.satisfy(u => u.includes('/splash') || u.includes('/login'));
        reportGenerator.log('Verified direct access is blocked (redirected).');
        reportGenerator.addResult('Admin Flow', 'Block direct access to admin panel when not logged in', true, null, Date.now() - startTime);
      } catch (error) {
        await logFailureDetails('Block direct access to admin panel when not logged in', error);
        reportGenerator.addResult('Admin Flow', 'Block direct access to admin panel when not logged in', false, error.message, Date.now() - startTime);
        throw error;
      }
    });

    it('should login as admin and approve the pending student', async function() {
      const startTime = Date.now();
      try {
        // Self-healing logout in case previous session leaked
        await logoutCurrentUser();

        reportGenerator.log('Logging in as Admin...');
        await driver.get(`${BASE_URL}/login`);
        await driver.wait(until.elementLocated(By.id('email')), 15000);

        await driver.findElement(By.id('email')).sendKeys('testadmin@example.com');
        await driver.findElement(By.id('password')).sendKeys('adminpass123');

        const submitBtn = await driver.findElement(By.css('button[type="submit"]'));
        await driver.executeScript("arguments[0].click();", submitBtn);

        // Wait to land on Admin Dashboard
        await driver.wait(until.urlContains('/dashboard'), 15000);
        reportGenerator.log('Logged into Admin Dashboard.');

        // Navigate to Admin Panel
        const adminLink = await driver.findElement(By.xpath('//a[@href="/admin"]'));
        await driver.executeScript("arguments[0].click();", adminLink);
        await driver.wait(until.elementLocated(By.xpath('//h3[contains(text(), "Pending Approvals")]')), 15000);

        // Approve Student
        reportGenerator.log(`Approving student: ${STUDENT_USER.email}`);
        const studentRowXpath = `//div[contains(@class, "shadow-sm") and .//p[text()="${STUDENT_USER.email}"]]`;
        await driver.wait(until.elementLocated(By.xpath(studentRowXpath)), 15000);
        const userRow = await driver.findElement(By.xpath(studentRowXpath));
        const approveBtn = await userRow.findElement(By.xpath('.//button[contains(., "Approve")]'));
        
        // Use JS Click to ensure we trigger approval handler reliably regardless of coordinate movement/animations
        await driver.executeScript("arguments[0].click();", approveBtn);

        // Wait for the row to become stale (disappear from the list), indicating successful DB write and update
        reportGenerator.log('Waiting for student row to disappear (approved)...');
        await driver.wait(until.stalenessOf(userRow), 15000);
        reportGenerator.log('Student approved successfully.');

        // Wait 2 seconds to make sure state propagates fully
        await driver.sleep(2000);

        reportGenerator.addResult('Admin Flow', 'Login as Admin and approve pending student', true, null, Date.now() - startTime);
      } catch (error) {
        await logFailureDetails('Login as Admin and approve pending student', error);
        reportGenerator.addResult('Admin Flow', 'Login as Admin and approve pending student', false, error.message, Date.now() - startTime);
        throw error;
      }
    });

    it('should create a new classroom and assign teacher', async function() {
      const startTime = Date.now();
      try {
        reportGenerator.log('Navigating to Classes management in Admin Panel...');

        // Wait for tabs to be present
        await driver.wait(until.elementLocated(By.xpath('//button[contains(., "Classes")]')), 10000);
        const classesTab = await driver.findElement(By.xpath('//button[contains(., "Classes")]'));

        await driver.executeScript(`
          const el = arguments[0];
          const events = ['pointerdown', 'mousedown', 'pointerup', 'mouseup', 'click'];
          events.forEach(type => {
            const ev = new MouseEvent(type, { bubbles: true, cancelable: true, view: window });
            el.dispatchEvent(ev);
          });
        `, classesTab);

        await driver.sleep(2000); // Wait for tab transition

        // Check if we are on the Classes tab by looking for the header
        await driver.wait(until.elementLocated(By.xpath('//h3[contains(text(), "Create New Class")]')), 15000);

        // Fill out form
        const nameInput = await driver.findElement(By.css('input[placeholder="e.g. Physics 101"]'));
        await nameInput.sendKeys(CLASS_NAME);

        // Click Assign Teacher select
        reportGenerator.log('Opening teacher selection dropdown...');
        const teacherSelect = await driver.findElement(By.css('button[role="combobox"]'));
        await driver.executeScript("arguments[0].click();", teacherSelect);
        await driver.sleep(1000);

        // Select the pre-seeded teacher: 'testteacher'
        reportGenerator.log('Selecting teacher from dropdown...');
        const teacherOptionXpath = '//div[@role="option"]//span[contains(text(), "testteacher")] | //div[@role="option" and contains(., "testteacher")]';
        await driver.wait(until.elementLocated(By.xpath(teacherOptionXpath)), 10000);
        const teacherItem = await driver.findElement(By.xpath(teacherOptionXpath));
        await driver.executeScript("arguments[0].click();", teacherItem);
        await driver.sleep(500);

        // Submit create class
        reportGenerator.log('Submitting classroom creation...');
        const createBtn = await driver.findElement(By.xpath('//button[contains(., "Create Class")]'));
        await driver.executeScript("arguments[0].click();", createBtn);

        // Wait for list update
        await driver.wait(until.elementLocated(By.xpath(`//h4[contains(text(), "${CLASS_NAME}")]`)), 15000);
        reportGenerator.log(`Class created successfully: ${CLASS_NAME}`);

        // Wait for Firestore write sync
        await driver.sleep(2000);

        // Sign out Admin
        await logoutCurrentUser();

        reportGenerator.addResult('Admin Flow', 'Create new class and assign teacher', true, null, Date.now() - startTime);
      } catch (error) {
        await logFailureDetails('Create new class and assign teacher', error);
        reportGenerator.addResult('Admin Flow', 'Create new class and assign teacher', false, error.message, Date.now() - startTime);
        throw error;
      }
    });
  });

  // ============================================================
  // CATEGORY 3: STUDENT FLOW
  // ============================================================
  describe('Student Flow', function() {
    it('should login as student and enroll in the new class', async function() {
      const startTime = Date.now();
      try {
        // Self-healing logout in case previous session leaked
        await logoutCurrentUser();

        reportGenerator.log(`Logging in as approved student: ${STUDENT_USER.email}`);
        await driver.get(`${BASE_URL}/login`);
        await driver.wait(until.elementLocated(By.id('email')), 15000);

        await driver.findElement(By.id('email')).sendKeys(STUDENT_USER.email);
        await driver.findElement(By.id('password')).sendKeys(STUDENT_USER.password);

        const submitBtn = await driver.findElement(By.css('button[type="submit"]'));
        await driver.executeScript("arguments[0].click();", submitBtn);

        // Landing on Student Dashboard
        await driver.wait(until.urlContains('/dashboard'), 20000);
        reportGenerator.log('Logged in to Student Dashboard.');

        // Find available class and click Enroll
        reportGenerator.log(`Looking for class: ${CLASS_NAME}`);
        const classCardXpath = `//div[contains(@class, "border-border/60") and .//p[contains(text(), "${CLASS_NAME}")]]`;
        await driver.wait(until.elementLocated(By.xpath(classCardXpath)), 20000);
        const classCard = await driver.findElement(By.xpath(classCardXpath));

        // Find the enroll button within this card
        const enrollBtn = await classCard.findElement(By.css('button[data-testid^="enroll-button-"]'));
        await driver.executeScript("arguments[0].scrollIntoView({block: 'center'});", enrollBtn);
        await driver.sleep(1000);
        await driver.executeScript("arguments[0].click();", enrollBtn);
        reportGenerator.log('Clicked Enroll button.');

        // Wait for list update - checking that the class card disappears from "Available" or appears in "My Classes"
        await driver.sleep(4000);

        // Verify it is now in My Classes
        const myClassesCardXpath = `//div[contains(@class, "bg-secondary/35")]//p[contains(text(), "${CLASS_NAME}")]`;
        await driver.wait(until.elementLocated(By.xpath(myClassesCardXpath)), 20000);
        reportGenerator.log(`Enrolled in ${CLASS_NAME} successfully.`);

        reportGenerator.addResult('Student Flow', 'Student dashboard login and class enrollment', true, null, Date.now() - startTime);
      } catch (error) {
        await logFailureDetails('Student dashboard login and class enrollment', error);
        reportGenerator.addResult('Student Flow', 'Student dashboard login and class enrollment', false, error.message, Date.now() - startTime);
        throw error;
      }
    });

    it('should block direct access to admin panel when logged in as a student', async function() {
      const startTime = Date.now();
      try {
        reportGenerator.log('Trying to access /admin directly as student...');
        await driver.get(`${BASE_URL}/admin`);
        try {
          await driver.wait(until.elementLocated(By.xpath('//*[contains(text(), "Admin Access Required")]')), 15000);
        } catch (e) {
          reportGenerator.log(`Timeout waiting for Admin Access Required page text: ${e.message}`, 'WARNING');
        }
        const pageText = await driver.findElement(By.css('body')).getText();
        expect(pageText).to.include("Admin Access Required");
        reportGenerator.log('Verified student is blocked from admin panel.');

        // Return to dashboard
        await driver.get(`${BASE_URL}/dashboard`);
        await driver.wait(until.urlContains('/dashboard'), 10000);

        reportGenerator.addResult('Student Flow', 'Block direct access to admin panel when logged in as a student', true, null, Date.now() - startTime);
      } catch (error) {
        await logFailureDetails('Block direct access to admin panel when logged in as a student', error);
        reportGenerator.addResult('Student Flow', 'Block direct access to admin panel when logged in as a student', false, error.message, Date.now() - startTime);
        throw error;
      }
    });

    it('should navigate to Camera Monitor and start monitoring', async function() {
      const startTime = Date.now();
      try {
        // Find Start Monitoring button using data-testid
        reportGenerator.log('Looking for Start Monitoring button...');
        const monitorBtn = await driver.wait(until.elementLocated(By.css('button[data-testid="start-monitoring-button"]')), 20000);
        await driver.executeScript("arguments[0].scrollIntoView({block: 'center'});", monitorBtn);
        await driver.sleep(1000);
        await driver.executeScript("arguments[0].click();", monitorBtn);

        // Redirect to camera monitor page
        await driver.wait(until.urlContains('/camera'), 20000);
        reportGenerator.log('Redirected to Camera page.');

        // Verify monitor component loaded
        await driver.wait(async () => {
           const text = await driver.findElement(By.css('body')).getText();
           return text.includes('Face Monitor') || text.includes('Hardware Ready');
        }, 20000, 'Camera Monitor page failed to load content');

        reportGenerator.log('Verified Camera Monitor page content.');

        // Sign out Student
        await logoutCurrentUser();

        reportGenerator.addResult('Student Flow', 'Navigate to Camera Monitor from dashboard', true, null, Date.now() - startTime);
      } catch (error) {
        await logFailureDetails('Navigate to Camera Monitor from dashboard', error);
        reportGenerator.addResult('Student Flow', 'Navigate to Camera Monitor from dashboard', false, error.message, Date.now() - startTime);
        throw error;
      }
    });
  });

  // ============================================================
  // CATEGORY 4: TEACHER FLOW
  // ============================================================
  describe('Teacher Flow', function() {
    it('should login as teacher and view metrics overview', async function() {
      const startTime = Date.now();
      try {
        await logoutCurrentUser();

        reportGenerator.log('Logging in as Teacher...');
        await driver.get(`${BASE_URL}/login`);
        await driver.wait(until.elementLocated(By.id('email')), 15000);

        await driver.findElement(By.id('email')).sendKeys('testteacher@example.com');
        await driver.findElement(By.id('password')).sendKeys('teacherpass123');

        const submitBtn = await driver.findElement(By.css('button[type="submit"]'));
        await driver.executeScript("arguments[0].click();", submitBtn);

        // Wait for dashboard redirection
        reportGenerator.log('Waiting for redirection to dashboard...');
        await driver.wait(async () => {
          const url = await driver.getCurrentUrl();
          return url.includes('/dashboard');
        }, 20000, 'Timed out waiting for teacher dashboard redirection');

        reportGenerator.log('Logged in to Teacher Dashboard.');

        // Verify stats card or welcome message
        await driver.wait(async () => {
           const body = await driver.findElement(By.css('body')).getText();
           return body.includes('Welcome') && body.includes('testteacher');
        }, 20000, 'Teacher Dashboard welcome message failed to appear');

        reportGenerator.log('Verified Teacher Dashboard welcome message.');

        reportGenerator.addResult('Teacher Flow', 'Teacher dashboard login and metrics overview', true, null, Date.now() - startTime);
      } catch (error) {
        await logFailureDetails('Teacher dashboard login and metrics overview', error);
        reportGenerator.addResult('Teacher Flow', 'Teacher dashboard login and metrics overview', false, error.message, Date.now() - startTime);
        throw error;
      }
    });
  });
});
