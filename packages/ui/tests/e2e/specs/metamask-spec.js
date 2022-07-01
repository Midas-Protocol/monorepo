describe('Metamask', () => {
  it(`acceptMetamaskAccess should accept connection request to metamask`, async () => {
		return cy.fetchMetamaskWalletAddress();

    // cy.visit('/');
    // cy.get('#connectButton').click();
    // cy.acceptMetamaskAccess().then(connected => {
    //   expect(connected).to.be.true;
    // });
    // cy.get('#network').contains('97');
    // // cy.get('#chainId').contains('0x2a');
    // cy.get('#accounts').contains(
    //   '0x304aE8f9300e09c8B33bb1a8AE1c14A6253a5F4D',
    // );
  });
});