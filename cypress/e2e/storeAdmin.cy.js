describe("Store sub-admin pages (haus9)", () => {
  beforeEach(() => {
    cy.stubStoreBootstrap();
    cy.stubStoreAdminData();
  });

  it("redirects /store/points to /store/login when not authenticated", () => {
    cy.visit("/store/points");
    cy.location("pathname", { timeout: 20000 }).should("eq", "/store/login");
  });

  it("logs in via PIN on /store/login and redirects to /store/points", () => {
    cy.storeLoginViaUI();
  });

  it("loads /store/points after login and shows Points Management header", () => {
    cy.storeLoginViaUI();
    cy.contains("Points Management").should("be.visible");
    cy.wait("@getPointsDetail");
  });

  it("points page QR/NFC mode lets you enter bill id + points and submit", () => {
    cy.storeLoginViaUI();
    cy.contains("Points Management").should("be.visible");

    cy.get('input[placeholder="Enter Bill ID"]').type("B-123");
    cy.get('input[placeholder="Enter Bill Amount"]').type("300");
    cy.contains("button", "Enter").click();
    cy.wait("@changePoints");
  });

  it("points page can switch to Print QR mode and submit print form (stubbed)", () => {
    cy.viewport(1400, 900);
    cy.storeLoginViaUI();
    cy.contains("Print QR").click({ force: true });
    cy.get('input[name="billID"]').type("B-1");
    cy.get('input[name="amount"]').type("200");

    // prevent popup blockers issues in Cypress
    cy.window().then((win) => {
      cy.stub(win, "open").callsFake(() => ({
        document: { write() {}, close() {} }
      }));
    });

    cy.contains("button", "Print").click();
    cy.contains("button", "Print").should("be.visible");
  });

  it("loads /store/customers and shows customers table + search", () => {
    cy.storeLoginViaUI();
    cy.viewport(1280, 720);
    cy.visit("/store/customers");
    cy.wait("@getCustomers");
    cy.contains("Customers").should("be.visible");
    cy.get('input[placeholder="Search customers..."]').should("be.visible");
  });

  it("customers search filters results", () => {
    cy.storeLoginViaUI();
    cy.viewport(1280, 720);
    cy.visit("/store/customers");
    cy.wait("@getCustomers");

    cy.get('input[placeholder="Search customers..."]').type("Alice");
    cy.contains("Alice").scrollIntoView().should("be.visible");
    cy.contains("Bob").should("not.exist");
  });

  it("opens Add Customer modal and submits create customer", () => {
    cy.storeLoginViaUI();
    cy.viewport(1280, 720);
    cy.visit("/store/customers");
    cy.wait("@getCustomers");

    cy.contains("button", "Add Customer").click({ force: true });
    cy.contains("Add New Customer").should("be.visible");
    cy.get('input[name="name"]').type("Charlie");
    cy.get('input[name="email"]').type("charlie@example.com");
    cy.get('input[name="phone"]').type("9800000099");
    cy.contains("button", "Add Customer").last().click({ force: true });
    cy.contains("button", "Add Customer").last().should("be.visible");
  });
});

