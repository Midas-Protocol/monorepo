describe('Pool Creation', () => {
  let id;

  before(() => {
    cy.setupMetamask();
    // cy.changeMetamaskNetwork('localhost');
    cy.visit('/');
  });

  it('wallet modal should appear', () => {
    cy.get('[id=chakra-modal-select_wallet_modal]').should('contain.text', 'Select a Wallet');
  });

  it('local network should be connected', () => {
    cy.get('[id=MetaMask').click();
    cy.acceptMetamaskAccess();
    cy.url().should('include', '/en/1337?sortBy=supply');
  });

  it('Pool creation page should be shown', () => {
    cy.get('[id=create_pool_btn').click();
    cy.url().should('include', '/en/1337/create-pool');
  });

  it('Pool should be created successfully', () => {
    id = Date.now();
    cy.get('[id=pool_name').type('test pool ' + id);
    // cy.url().should('include', '/en/1337/create-pool');
    cy.get('[id=oracle_select]').select('MasterPriceOracle');
    cy.get('[id=pool_creation_btn]').click();
    cy.wait(2000);
  });

  // it('Created pool should be in the list', () => {
  //   cy.visit('/');
  //   cy.get('[id=MetaMask]').click();
  //   cy.get('body').should('contain.text', 'test pool ' + id);
  // });
});
