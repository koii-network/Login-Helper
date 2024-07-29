const { namespaceWrapper } = require('@_koii/namespace-wrapper');
const readline = require('readline');
const PCR = require('puppeteer-chromium-resolver');
const path = require('path');
const Data = require('../helper/data');

class Submission {

  constructor() {
    this.browser = null;
    this.w3sKey = null;
    this.db = new Data('db', []);
    this.db.initializeData();
  }
  negotiateSession = async () => {
    try {
      if (this.browser) {
        await this.browser.close();
        console.log('Old browser closed');
      }
      const options = {};
      const userDataDir = path.join(__dirname, 'puppeteer_cache_twitter_login');
      const stats = await PCR(options);
      console.log(
        '*****************************************CALLED PURCHROMIUM RESOLVER*****************************************',
      );
      this.browser = await stats.puppeteer.launch({
        executablePath: stats.executablePath,
        userDataDir: userDataDir,
        headless: false,
        userAgent:
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
        args: [
          '--aggressive-cache-discard',
          '--disable-cache',
          '--disable-application-cache',
          '--disable-offline-load-stale-cache',
          '--disable-gpu-shader-disk-cache',
          '--no-sandbox',
          '--disable-setuid-sandbox',
          '--disable-gpu',
        ],
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
      const userDataDir = path.join(__dirname, 'puppeteer_cache_twitter_login_headless');
      const stats = await PCR(options);
      console.log(
        '*****************************************CALLED PURCHROMIUM RESOLVER*****************************************',
      );
      this.browserHeadless = await stats.puppeteer.launch({
        executablePath: stats.executablePath,
        userDataDir: userDataDir,
        headless: false,
        userAgent:
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
        args: [
          '--aggressive-cache-discard',
          '--disable-cache',
          '--disable-application-cache',
          '--disable-offline-load-stale-cache',
          '--disable-gpu-shader-disk-cache',
          '--no-sandbox',
          '--disable-setuid-sandbox',
          '--disable-gpu',
        ],
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
      let value; 
      
      await this.negotiateHeadlessSession();
      const isLoggedIn = await this.checkLogin();
      if(isLoggedIn){
        value = true;
        console.log("Login Cookie Exists")
      }else{
        await this.negotiateSession();
        console.log("No Login Cookie ; Require Manual Login")
        await this.twitterLogin();
      }
      // Store the result in NeDB (optional)
      if (value) {
        await namespaceWrapper.storeSet('value', value);
      }
      await this.browser.close();
      process.exit(1);
      // Optional, return your task
      return value;
    } catch (err) {
      console.log('ERROR IN EXECUTING TASK', err);
      return 'ERROR IN EXECUTING TASK' + err;
    }
  }


  async checkLogin() {  

    const newPage = await this.browserHeadless.newPage(); // Create a new page
    await newPage.goto('https://x.com/home');
    await newPage.waitForTimeout(5000);
    // Replace the selector with a Twitter-specific element that indicates a logged-in state
    const isLoggedIn =
    (await newPage.url()) !==
    'https://x.com/i/flow/login?redirect_after_login=%2Fhome' && !(await newPage.url()).includes("https://x.com/?logout=");  
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

  };




async redirectToTwitterLogin() {
  console.log('Step: Redirect to Twitter login page');
  await this.page.goto('https://x.com/i/flow/login');

  console.log('Please login to Twitter manually and press the confirm button when done.');
}

async infoMessage(){
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
    messageDiv.innerText = 'Please Login In Another Page, and DO NOT CLOSE this browser After You Logged In';
    messageDiv.style.fontSize = '24px';
    messageDiv.style.color = 'red';
    messageDiv.style.textAlign = 'center';
    messageDiv.style.marginTop = '20%';
  });

  console.log('Please Login In Another Page, and DO NOT CLOSE this browser After You Logged In');
}



async saveCookiesToDB (cookies) {
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
};

async twitterLogin() {

  try {
    await this.redirectToTwitterLogin();
    await this.infoMessage();

    console.log('Before waiting for user login...');
    await new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        resolve();
      }, 150000); 
      this.page.on('close', () => {
        clearTimeout(timeout);
        reject(new Error('Browser was closed by user or system.'));
      });
    });
    console.log('After waiting for user login...');

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
    return this.sessionValid;
  } catch (error) {
    console.error('Error during Twitter login:', error);
  }
  if(this.sessionValid == true){
    await namespaceWrapper.logMessage("warn", "You are successfully Logged In. Now this login Task will Stop, you can start all the other Twitter Tasks.");
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
      console.log("No Submission Required");
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
    // Fetch the value from NeDB
    const value = await namespaceWrapper.storeGet('value'); // retrieves the value
    // Return cid/value, etc.
    return value;
  }
}
const submission = new Submission();
module.exports = { submission };
