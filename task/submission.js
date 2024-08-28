const { namespaceWrapper } = require('@_koii/namespace-wrapper');
const PCR = require('puppeteer-chromium-resolver');
const path = require('path');
const Data = require('../helper/data');
const os = require('os');

class Submission {
  constructor() {
    this.browser = null;
    this.browserHeadless = null;
    this.w3sKey = null;
    this.db = new Data('db', []);
    this.db.initializeData();
  }


  async infoMessage() {
    const page = await this.browser.newPage();
  
    await page.setContent(`
      <html>
        <head>
          <style>
            body {
              font-family: Arial, sans-serif;
              display: flex;
              justify-content: center;
              align-items: center;
              height: 100vh;
              margin: 0;
              background-color: #f4f4f4;
            }
            #container {
              max-width: 600px;
              text-align: center;
              background-color: white;
              padding: 30px;
              box-shadow: 0px 4px 10px rgba(0, 0, 0, 0.1);
              border-radius: 10px;
            }
            #message {
              font-size: 18px;
              color: #333;
              line-height: 1.6;
            }
            #message strong {
              color: #d9534f; /* A soft red color */
            }
            #message p {
              margin: 20px 0;
            }
            .highlight {
              color: #0275d8; /* A soft blue color */
              font-weight: bold;
            }
          </style>
        </head>
        <body>
          <div id="container">
            <div id="message"></div>
          </div>
        </body>
      </html>
    `);
  
    await page.evaluate(() => {
      const messageDiv = document.getElementById('message');
      messageDiv.innerHTML = `
        <p class="highlight">Please log in to the website that you would like to run next.</p>
        <p>For example, if you would like to run Twitter-related tasks, please log in to Twitter, then run the Twitter task. If you want to run YouTube tasks, please log in to Google and YouTube.</p>
        <p><strong>Note:</strong> For your safety, we highly recommend using a spare account or creating a new account.</p>
        <p class="highlight">DO NOT CLOSE this browser after you have logged in.</p>
      `;
    });
  
    console.log(
      'Please log in to the website that you would like to run next. For example, if you would like to run Twitter-related tasks, please log in to Twitter, then run the Twitter task. If you want to run YouTube tasks, please log in to Google and YouTube. Note: For your safety, we highly recommend using a spare account or creating a new account.'
    );
  }
  

  negotiateSession = async () => {
    try {
      if (this.browser) {
        console.log('browser already exists');
      } else {
        const platform = os.platform();
        console.log('Platform:', platform);
      let revision;

      if (platform === 'linux') {
        revision = '1347928'; // Linux revision
      } else if (platform === 'darwin') {
        revision = '1347941'; // MacOS revision
      } else if (platform === 'win32') {
        // Determine if the Windows platform is 32-bit or 64-bit
        const is64Bit = os.arch() === 'x64';
        if (is64Bit) {
          revision = '1347979'; // Windows 64-bit revision
        } else {
          revision = '1347966'; // Windows 32-bit revision
        }
      } else {
        throw new Error('Unsupported platform: ' + platform);
      }
      const options = {
        revision: revision, // Always use the latest revision of puppeteer-chromium-resolver
      };
      console.log(__dirname);
      const userDataDir = path.join('koii/puppeteer_cache');
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
          args: [],
      });
      console.log('Step: Open new page');
      this.page = await this.browser.newPage();
        // Disable cache
     await this.page.setCacheEnabled(false);
      await this.infoMessage();
      await this.page.setUserAgent(
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
      );
      await this.page.setViewport({ width: 1920, height: 1080 });
    // Perform actions on the page
      return true;
    }
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
        await this.negotiateSession();
    } catch (err) {
      console.log('ERROR IN EXECUTING TASK', err);
      return 'ERROR IN EXECUTING TASK' + err;
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
