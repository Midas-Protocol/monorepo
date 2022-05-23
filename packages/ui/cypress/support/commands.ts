Cypress.Commands.add('acceptMetamaskAccess', () => {
  return cy.task('acceptMetamaskAccess');
});

Cypress.Commands.add('confirmDaiContractTransaction', () => {
  return cy.task('confirmDaiContractTransaction');
});

Cypress.Commands.add('goodGhostingTransaction', () => {
  return cy.task('goodGhostingTransaction');
});

Cypress.Commands.add(
  'setupMetamask',
  (secretWords, network, password) => {
    return cy.task('setupMetamask', { secretWords, network, password });
  },
);
