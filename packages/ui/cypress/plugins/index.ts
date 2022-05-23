/// <reference types="cypress" />
const helpers = require('../support/helpers')
const puppeteer = require('../support/puppeteer');
const metamask = require('../support/metamask');
/**
 * @type {Cypress.PluginConfig}
 */
// eslint-disable-next-line no-unused-vars
module.exports = (on, config) => {
  on('before:browser:launch', async (browser = {}, arguments_) => {
    if (browser.name === 'chrome' && browser.isHeadless) {
      console.log('TRUE'); // required by cypress ¯\_(ツ)_/¯
      arguments_.args.push('--window-size=1920,1080');
      return arguments_;
    }

    if (browser.name === 'electron') {
      arguments_['width'] = 1920;
      arguments_['height'] = 1080;
      arguments_['resizable'] = false;
      return arguments_;
    }

    // metamask welcome screen blocks cypress from loading
    if (browser.name === 'chrome') {
      arguments_.args.push(
        // '--auto-open-devtools-for-tabs',
        '--remote-debugging-port=9222',
        '--disable-background-timer-throttling',
        '--disable-backgrounding-occluded-windows',
        '--disable-renderer-backgrounding',
      );
    }

    // NOTE: extensions cannot be loaded in headless Chrome
    const metamaskPath = await helpers.prepareMetamask(
      'latest' || '9.4.0',
    );
    arguments_.extensions.push(metamaskPath);
    return arguments_;
  });


  on('task', {
    error(message) {
      console.error('\u001B[31m', 'ERROR:', message, '\u001B[0m');
      return true;
    },
    warn(message) {
      console.warn('\u001B[33m', 'WARNING:', message, '\u001B[0m');
      return true;
    },
    async acceptMetamaskAccess() {
      const accepted = await metamask.acceptAccess();
      return accepted;
    },
    async confirmDaiContractTransaction() {
      const confirmed = await metamask.confirmTransaction();
      return confirmed;
    },
    async goodGhostingTransaction() {
      const confirmed = await metamask.confirmTransaction();
      return confirmed;
    },
    async setupMetamask() {
      if (puppeteer.metamaskWindow()) {
        await puppeteer.switchToCypressWindow();
        return true
      } else {
        await metamask.initialSetup();
        return true;
      }
    },
  });

  return config;
}
