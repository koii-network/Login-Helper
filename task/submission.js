const { namespaceWrapper } = require('@_koii/namespace-wrapper');
const readline = require('readline');
const PCR = require('puppeteer-chromium-resolver');
const path = require('path');
const Data = require('../helper/data');
const dotenv = require('dotenv');
dotenv.config();

class Submission {
  constructor() {
    this.browser = null;
    this.browserHeadless = null;
    this.w3sKey = null;
    this.db = new Data('db', []);
    this.db.initializeData();
    this.username = process.env.TWITTER_USERNAME;
    this.password = process.env.TWITTER_PASSWORD;
    this.credentials = process.env.TWITTER_PHONE;
  }

  randomDelay = async delayTime => {
    const delay =
      Math.floor(Math.random() * (delayTime - 2000 + 1)) + (delayTime - 2000);
    // console.log('Delaying for', delay, 'ms');
    return delay;
  };


  negotiateSession = async () => {
    try {
      if (this.browser) {
        await this.browser.close();
        console.log('Old browser closed');
      }
      const options = {};
      const userDataDir = path.join('koii/puppeteer_cache');
      const stats = await PCR(options);
      console.log(
        '*****************************************CALLED PURCHROMIUM RESOLVER*****************************************',
      );
      this.browser = await stats.puppeteer.launch({
        executablePath: stats.executablePath,
        userDataDir: userDataDir,
        // headless: false,
        userAgent:
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
        args: ['--no-sandbox'],
      });
      console.log('Step: Open new page');
      this.page = await this.browser.newPage();
      await this.page.setUserAgent(
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
      );
      await this.page.setViewport({ width: 1920, height: 1080 });
      return true;
    } catch (e) {
      console.log('Error negotiating session', e);
      return false;
    }
  };

  negotiateHeadlessSession = async () => {
    try {
      if (this.browserHeadless) {
        await this.browserHeadless.close();
        console.log('Old browser closed');
      }
      const options = {};
      const userDataDir = path.join(__dirname, 'puppeteer_cache');
      const stats = await PCR(options);
      console.log(
        '*****************************************CALLED PURCHROMIUM RESOLVER*****************************************',
      );
      this.browserHeadless = await stats.puppeteer.launch({
        executablePath: stats.executablePath,
        userDataDir: userDataDir,
        // headless: false,
        userAgent:
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
        args: ['--no-sandbox'],
      });
      console.log('Step: Open new page');
      this.pageHeadless = await this.browserHeadless.newPage();
      await this.pageHeadless.setUserAgent(
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
      );
      await this.pageHeadless.setViewport({ width: 1920, height: 1080 });
      return true;
    } catch (e) {
      console.log('Error negotiating session', e);
      return false;
    }
  };

  /**
   * Executes your task, optionally storing the result.
   *
   * @param {number} round - The current round number
   * @returns {void}
   */
  async task(round) {
    try {
      console.log('ROUND', round);
      await this.negotiateHeadlessSession();
      const isLoggedIn = await this.checkLogin(this.browserHeadless);
      if (isLoggedIn) {
        console.log('Login Cookie Exists');
        await namespaceWrapper.logMessage(
          'warn',
          'Login successful. You can now start all the other Twitter tasks.'
        );
        await this.browserHeadless.close();
      } else {
        await this.negotiateSession();
        console.log('No Login Cookie ; Require Manual Login');
        const loginResult = await this.twitterLogin();
        if (loginResult) {
          await namespaceWrapper.logMessage(
            'warn',
            'You are successfully Logged In. Now this login Task will Stop, you can start all the other Twitter Tasks.'
          );
        } else {
          await namespaceWrapper.logMessage(
            'warn',
            'The Login Failed! Contact Discord Support for more information!',
          );
        }
        console.log('Closing Browser');
        // await this.browser.close();
      }
      process.exit(0);
      // Optional, return your task
    } catch (err) {
      console.log('ERROR IN EXECUTING TASK', err);
      return 'ERROR IN EXECUTING TASK' + err;
    }
  }

  async checkLogin(browser) {
    const newPage = await browser.newPage(); // Create a new page
    await newPage.waitForTimeout(5000);
    await newPage.goto('https://x.com/home');
    // Replace the selector with a Twitter-specific element that indicates a logged-in state
    const isLoggedIn =
      (await newPage.url()) !==
        'https://x.com/i/flow/login?redirect_after_login=%2Fhome' &&
      !(await newPage.url()).includes('https://x.com/?logout=');
    let sessionValid = false;
    if (isLoggedIn) {
      console.log('Logged in using existing cookies');
      console.log('Updating last session check');

      const cookies = await newPage.cookies();
      this.saveCookiesToDB(cookies);

      sessionValid = true;
    } else {
      console.log('No valid cookies found, proceeding with manual login');
      sessionValid = false;
    }
    await newPage.close();
    return sessionValid;
  }

  async redirectToTwitterLogin() {
    console.log('Step: Redirect to Twitter login page');
    console.log('User manuuly logging in.');
    await this.page.goto('https://x.com/i/flow/login');
    await this.page.evaluate(() => {
      alert('Please login to Twitter manually');
    });

    // Wait for the page to navigate to "https://x.com/home"
    await this.page.waitForFunction(
      'window.location.href === "https://x.com/home"',
      { timeout: 0 }, // Wait indefinitely until the condition is met
    );

    // Show another alert once the URL changes to "https://x.com/home"
    await this.page.evaluate(() => {
      alert('You have successfully logged in!');
    });
  }

  async infoMessage() {
    const page = await this.browser.newPage();

    await page.setContent(`
    <html>
      <body>
        <div id="message"></div>
      </body>
    </html>
  `);

    await page.evaluate(() => {
      const messageDiv = document.getElementById('message');
      messageDiv.innerText =
        'Please Login In Another Page, and DO NOT CLOSE this browser After You Logged In';
      messageDiv.style.fontSize = '24px';
      messageDiv.style.color = 'red';
      messageDiv.style.textAlign = 'center';
      messageDiv.style.marginTop = '20%';
    });

    console.log(
      'Please Login In Another Page, and DO NOT CLOSE this browser After You Logged In',
    );
  }

  async saveCookiesToDB(cookies) {
    try {
      const data = await this.db.getCookie();
      // console.log('data', data);
      if (data) {
        await this.db.updateCookie({ id: 'cookies', data: cookies });
      } else {
        await this.db.createCookie({ id: 'cookies', data: cookies });
      }
    } catch (e) {
      console.log('Error saving cookies to database', e);
    }
  }

  async twitterLogin() {
    try {
      console.log('Step: Go to login page');
      await this.page.goto('https://x.com/i/flow/login', {
        timeout: await this.randomDelay(60000),
        waitUntil: 'networkidle0',
      });
      await this.page.waitForSelector('input', {
        timeout: await this.randomDelay(60000),
      });
      await this.page.waitForSelector('input[name="text"]', {
        timeout: await this.randomDelay(60000),
      });

      console.log('Step: Fill in username');
      await this.page.type('input[name="text"]', this.username);
      await this.page.keyboard.press('Enter');
      await new Promise(resolve => setTimeout(resolve, 10000));

      const twitter_verify = await this.page
        .waitForSelector('input[data-testid="ocfEnterTextTextInput"]', {
          timeout: await this.randomDelay(5000),
          visible: true,
        })
        .then(() => true)
        .catch(() => false);

      if (twitter_verify) {
        const verifyURL = await this.page.url();
        console.log('Twitter verify needed, trying phone number');
        console.log('Step: Fill in phone number');
        await this.page.type(
          'input[data-testid="ocfEnterTextTextInput"]',
          this.credentials.phone,
        );
        await this.page.keyboard.press('Enter');

        // add delay
        await new Promise(resolve => setTimeout(resolve, 3000));
      }

      await this.page.waitForSelector('input[name="password"]');
      console.log('Step: Fill in password');
      await this.page.type('input[name="password"]', this.password);
      console.log('Step: Click login button');
      await this.page.keyboard.press('Enter');
      await this.page.waitForTimeout(await this.randomDelay(5000));

      if (!(await this.checkLogin(this.browser))) {
        console.log('Password is incorrect or email verification needed.');
        await this.page.waitForTimeout(await this.randomDelay(5000));
        this.sessionValid = false;
      } else {
        console.log('Password is correct.');
        this.page.waitForNavigation({ waitUntil: 'load' });
        await this.page.waitForTimeout(await this.randomDelay(10000));
        this.sessionValid = true;

        console.log('Step: Login successful');
        // Extract cookies after user confirmation
        const cookies = await this.page.cookies();

        if (cookies && cookies.length > 0) {
          console.log('Cookies retrieved successfully.');
          await this.saveCookiesToDB(cookies);
          this.sessionValid = true;
          this.lastSessionCheck = Date.now();
        } else {
          console.log('No cookies retrieved. Please try again.');
          this.sessionValid = false;
        }
      }
      return this.sessionValid;
    } catch (error) {
      console.error('Error during Twitter login:', error);
    }
  }

  /**
   * Submits a task for a given round
   *
   * @param {number} round - The current round number
   * @returns {Promise<any>} The submission value that you will use in audit. Ex. cid of the IPFS file
   */
  async submitTask(round) {
    console.log('SUBMIT TASK CALLED ROUND NUMBER', round);
    try {
      console.log('No Submission Required');
      return true;
    } catch (error) {
      console.log('ERROR IN SUBMISSION', error);
    }
  }
  /**
   * Fetches the submission value
   *
   * @param {number} round - The current round number
   * @returns {Promise<string>} The submission value that you will use in audit. It can be the real value, cid, etc.
   *
   */
  async fetchSubmission(round) {
    console.log('FETCH SUBMISSION');
  }
}
const submission = new Submission();
module.exports = { submission };
