const axios = require('axios')
const puppeteer = require('puppeteer-core');

let puppeteerBrowser;
let mainWindow;
let metamaskWindow;

module.exports = {
  puppeteerBrowser() {
    return puppeteerBrowser;
  },
  mainWindow() {
    return mainWindow;
  },
  metamaskWindow() {
    return metamaskWindow;
  },
  async init() {
    const debuggerDetails = await axios.get('http://localhost:9222/json/version'); //DevSkim: ignore DS137138
    const debuggerDetailsConfig = debuggerDetails.data
    const webSocketDebuggerUrl = debuggerDetailsConfig.webSocketDebuggerUrl;

    puppeteerBrowser = await puppeteer.connect({
      browserWSEndpoint: webSocketDebuggerUrl,
      ignoreHTTPSErrors: true,
      defaultViewport: null,
    });
    return puppeteerBrowser.isConnected();
  },
  async assignWindows() {
    let pages = await puppeteerBrowser.pages();
    for (const page of pages) {
      if (page.url().includes('integration')) {
        mainWindow = page;
      } else if (page.url().includes('extension')) {
        metamaskWindow = page;
      }
    }
    return true;
  },
  async switchToCypressWindow() {
    await mainWindow.bringToFront();
    return true;
  },
  async switchToMetamaskNotification() {
    let pages = await puppeteerBrowser.pages();
    for (const page of pages) {
      if (page.url().includes('notification')) {
        await page.bringToFront();
        return page;
      }
    }
  },
  async waitFor(selector, page = metamaskWindow) {
    await page.waitForFunction(
      `document.querySelector('${selector}') && document.querySelector('${selector}')?.clientHeight != 0`,
      { visible: true },
    );
    // puppeteer going too fast breaks metamask in corner cases
    await page.waitForTimeout(300);
  },

  async waitAndClick(selector, page = metamaskWindow) {
    if (page === 'main') {
        page = mainWindow
    }
    await module.exports.waitFor(selector, page);
    console.log('here')
    await page.evaluate(
      selector => document.querySelector(selector).click(),
      selector,
    );
  },
  async waitAndType(selector, value, page = metamaskWindow) {
    await module.exports.waitFor(selector, page);
    const element = await page.$(selector);
    await element.type(value);
  },
  async waitForText(selector, text, page = metamaskWindow) {
    await module.exports.waitFor(selector, page);
    await page.waitForFunction(
      `document.querySelector('${selector}').innerText.toLowerCase().includes('${text}')`,
    );
  },
};
