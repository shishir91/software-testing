describe("Customer pages (haus9)", () => {
  beforeEach(() => {
    cy.stubStoreBootstrap();
  });

  it("protects /loyality when not logged in (redirects to /)", () => {
    cy.visit("/loyality");
    cy.location("pathname", { timeout: 20000 }).should("eq", "/");
  });

  it("customer login submits and redirects to /loyality", () => {
    cy.customerLoginViaUI();
  });
});

