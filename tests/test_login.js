const { namespaceWrapper } = require('@_koii/namespace-wrapper');
const PCR = require('puppeteer-chromium-resolver');
const path = require('path');
const Data = require('../helper/data');

class LoginAdaptor {
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
  negotiateSession = async () => {
    try {
      if (this.browser) {
        await this.browser.close();
        console.log('Old browser closed');
      }
      const options = {
        revision: '1347928', // Always use the latest revision of puppeteer-chromium-resolver
      };
      const userDataDir = path.join(__dirname, 'puppeteer_cache');
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
    } catch (e) {
      console.log('Error negotiating session', e);
      return false;
    }
  };

  async task(round) {
    try {
        console.log('ROUND', round);
        await this.negotiateSession();
    } catch (err) {
      console.log('ERROR IN EXECUTING TASK', err);
      return 'ERROR IN EXECUTING TASK' + err;
    }
  }
}

const test = new LoginAdaptor();
test.task(1);
