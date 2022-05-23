const puppeteer = require('./puppeteer');
const { setNetwork } = require('./helpers');

let walletAddress;

module.exports = {
  walletAddress: () => {
    return walletAddress;
  },
  // workaround for metamask random blank page on first run
  async fixBlankPage() {
    await puppeteer.metamaskWindow().waitForTimeout(1000);
    for (let times = 0; times < 5; times++) {
      if (
        (await puppeteer.metamaskWindow().$('#app-content .app')) === null
      ) {
        await puppeteer.metamaskWindow().reload();
        await puppeteer.metamaskWindow().waitForTimeout(2000);
      } else {
        break;
      }
    }
  },

  async confirmWelcomePage() {
    await module.exports.fixBlankPage();
    await puppeteer.waitAndClick('.welcome-page .first-time-flow__button');
    return true;
  },
  async importWallet(secretWords, password) {
    if ((await puppeteer.metamaskWindow().$('.welcome-page__wrapper')) !== null) {
        await puppeteer.waitAndClick('.welcome-page__wrapper button');
        await puppeteer.waitAndClick('.first-time-flow__button');
        await puppeteer.waitAndClick('.btn-primary');
    } else {
        await puppeteer.metamaskWindow().waitForTimeout(1000);
        await puppeteer.waitAndClick('.unlock-page .unlock-page__links button');
        await puppeteer.metamaskWindow().waitForTimeout(1000);

        if ((await puppeteer.metamaskWindow().$('.unlock-page__form')) !== null) {
          await puppeteer.waitAndType('.MuiInputBase-root #password', password);
          await puppeteer.metamaskWindow().waitForTimeout(1000);
          await puppeteer.waitAndClick('.unlock-page__form .MuiButton-containedSizeLarge')
        }
    }

    await puppeteer.waitAndType('.MuiInput-formControl input', secretWords);
    await puppeteer.waitAndType('.MuiInputBase-root #password', password);
    await puppeteer.waitAndType('.MuiInputBase-root #confirm-password', password);

    if ((await puppeteer.metamaskWindow().$('.MuiFormControl-root + .first-time-flow__checkbox-container .first-time-flow__checkbox')) !== null) {
      await puppeteer.waitAndClick('.MuiFormControl-root + .first-time-flow__checkbox-container .first-time-flow__checkbox')
      await puppeteer.waitAndClick('.MuiFormControl-root + .first-time-flow__checkbox-container .first-time-flow__checkbox')
    }

    await puppeteer.waitAndClick('.first-time-flow__button');
    await puppeteer.waitFor('.lds-spinner');
    if ((await puppeteer.metamaskWindow().$('.popover-header__button')) !== null) {
      await puppeteer.waitAndClick('.popover-header__button');
    }

    await puppeteer.metamaskWindow().waitForTimeout(1000);

    if ((await puppeteer.metamaskWindow().$('.first-time-flow__button')) !== null) {
      await puppeteer.waitAndClick('.first-time-flow__button');
    }

    return true;
  },
  async changeNetwork() {
    setNetwork('kovan');
    await puppeteer.waitAndClick('.app-header__account-menu-container .network-display');
    await puppeteer.waitAndClick('.dropdown-menu-item:nth-child(5)');
    await puppeteer.waitForText('.typography', 'kovan');
    return true;
  },
  async acceptAccess() {
    await puppeteer.metamaskWindow().waitForTimeout(3000);
    const notificationPage = await puppeteer.switchToMetamaskNotification();
    await puppeteer.waitAndClick(
      '.notification .permissions-connect-choose-account__bottom-buttons button:nth-child(2)',
      notificationPage,
    );
    await puppeteer.waitAndClick(
      '.permissions-connect .permission-approval-container__footers button:nth-child(2)',
      notificationPage,
    );
    await puppeteer.metamaskWindow().waitForTimeout(3000);
    return true;
  },
  async confirmTransaction() {
    await puppeteer.metamaskWindow().waitForTimeout(3000);
    const notificationPage = await puppeteer.switchToMetamaskNotification();
    await puppeteer.metamaskWindow().waitForTimeout(3000);
    await puppeteer.waitAndClick('button.btn-primary', notificationPage);
    await puppeteer.metamaskWindow().waitForTimeout(22000);
    return true;
  },
  async initialSetup() {
    // do not put real money on this account
    const secretWords = 'ill satoshi net solar quantum rally above lawsuit say decline modify burger'
    const password = 'uyDCA2U3MfPm2wk'

    await puppeteer.init();
    await puppeteer.assignWindows();
    await puppeteer.metamaskWindow().waitForTimeout(1000);
    await puppeteer.metamaskWindow().bringToFront()
    await module.exports.importWallet(secretWords, password);
    await module.exports.changeNetwork('kovan');
    await puppeteer.switchToCypressWindow();
    return true;
  },
};
