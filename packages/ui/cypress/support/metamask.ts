const { setNetwork } = require('./helpers');
const puppeteer = require('./puppeteer');

let walletAddress;

module.exports = {
  walletAddress: () => {
    return walletAddress;
  },
  // workaround for metamask random blank page on first run
  async fixBlankPage() {
    await puppeteer.metamaskWindow().waitForTimeout(1000);
    for (let times = 0; times < 5; times++) {
      if ((await puppeteer.metamaskWindow().$('#app-content .app')) === null) {
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

      for await (const [index, word] of secretWords.entries()) {
        await puppeteer.waitAndType(`.MuiInputBase-root #import-srp__srp-word-${index}`, word);
      }

      await puppeteer.waitAndType('.MuiInputBase-root #password', password);
      await puppeteer.waitAndType('.MuiInputBase-root #confirm-password', password);
      await puppeteer.waitAndClick('#create-new-vault__terms-checkbox');
      await puppeteer.waitAndClick('.create-new-vault__submit-button');
      await puppeteer.waitFor('.lds-spinner');
      await puppeteer.waitAndClick('.first-time-flow__button');
      await puppeteer.waitAndClick('.popover-header__button');
    } else {
      // await puppeteer.metamaskWindow().waitForTimeout(1000);
      await puppeteer.waitAndClick('.unlock-page button');
      // await puppeteer.metamaskWindow().waitForTimeout(1000);

      if ((await puppeteer.metamaskWindow().$('.unlock-page__form')) !== null) {
        await puppeteer.waitAndType('.MuiInputBase-root #password', password);
        await puppeteer.waitAndClick('.unlock-page button');
      }
    }

    return true;
  },
  async changeNetwork() {
    // setNetwork('localhost');
    // await puppeteer.waitAndClick('.app-header__account-menu-container .network-display');
    // await puppeteer.waitAndClick(
    //   '.network-dropdown-header .network-dropdown-content .network-dropdown-content--link'
    // );

    await puppeteer.waitAndClick('.account-menu__icon');

    await puppeteer.waitAndClick('.account-menu__item.account-menu__item--clickable:nth-child(4)');
    await puppeteer.waitAndClick('.tab-bar__tab.pointer:nth-child(1)');
    if (
      (await puppeteer
        .metamaskWindow()
        .$('.settings-page__content-row:nth-child(6)')
        .$('.toggle-button--off')) !== null
    ) {
      await puppeteer.waitAndClick('.settings-page__content-row:nth-child(6) .toggle-button--off');
    }
    await puppeteer.waitAndClick('.settings-page__header__title-container__close-button');
    await puppeteer.waitAndClick('.app-header__account-menu-container .network-display');
    await puppeteer.waitAndClick('.dropdown-menu-item:nth-child(5)');
    await puppeteer.waitForText('.typography', 'Localhost:8545');

    return true;
  },
  async acceptAccess() {
    await puppeteer.metamaskWindow().waitForTimeout(3000);
    const notificationPage = await puppeteer.switchToMetamaskNotification();
    await puppeteer.waitAndClick(
      '.notification .permissions-connect-choose-account__bottom-buttons button:nth-child(2)',
      notificationPage
    );
    await puppeteer.waitAndClick(
      '.permissions-connect .permission-approval-container__footers button:nth-child(2)',
      notificationPage
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
    const secretWords = [
      'ill',
      'satoshi',
      'net',
      'solar',
      'quantum',
      'rally',
      'above',
      'lawsuit',
      'say',
      'decline',
      'modify',
      'burger',
    ];
    const password = 'uyDCA2U3MfPm2wk';

    await puppeteer.init();
    await puppeteer.assignWindows();
    await puppeteer.metamaskWindow().waitForTimeout(1000);
    await puppeteer.metamaskWindow().bringToFront();
    await module.exports.importWallet(secretWords, password);
    await module.exports.changeNetwork();
    await puppeteer.switchToCypressWindow();
    return true;
  },
};
