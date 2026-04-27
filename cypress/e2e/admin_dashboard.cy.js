describe("Samparka Admin Dashboard (samparka.co)", () => {
  const base = "https://samparka.co";

  const adminEmail = () => Cypress.env("ADMIN_EMAIL");
  const adminPassword = () => Cypress.env("ADMIN_PASSWORD");

  beforeEach(() => {
    cy.clearCookies();
    cy.clearLocalStorage();

    // Stub login so we don't rely on production auth state
    cy.intercept("POST", "**/user/login", {
      statusCode: 200,
      body: {
        success: true,
        message: "Logged in",
        token: "admin_token_test",
        userData: { _id: "admin1", role: "admin", email: "admin@example.com", name: "Admin" }
      }
    }).as("adminLogin");

    cy.intercept("GET", "**/store", {
      statusCode: 200,
      body: { success: true, stores: [{ _id: "store1", name: "Haus9" }, { _id: "store2", name: "Cafe Demo" }] }
    }).as("adminStores");

    cy.intercept("GET", "**/api/visitAnalytics/segments/*", {
      statusCode: 200,
      body: {
        success: true,
        data: { segments: [{ name: "first_visit", count: 2 }, { name: "second_visit", count: 1 }, { name: "third_visit", count: 0 }] }
      }
    }).as("segments");

    cy.intercept("GET", "**/api/campaigns/*/customers/segment-counts", {
      statusCode: 200,
      body: { success: true, data: { at_risk: 3, churned: 1 } }
    }).as("segmentCounts");

    cy.intercept("GET", "**/api/visitAnalytics/summary/*", {
      statusCode: 200,
      body: { success: true, data: { totalRegisteredCustomers: 25 } }
    }).as("summary");

    cy.intercept("GET", "**/api/visitAnalytics/customers/*", {
      statusCode: 200,
      body: { success: true, data: [], pagination: { page: 1, limit: 10, total: 0, pages: 1 } }
    }).as("customers");

    cy.intercept("GET", "**/api/visitAnalytics/lastVisitDistribution/*", {
      statusCode: 200,
      body: { success: true, data: [] }
    }).as("lastVisitDistribution");

    // Some admin layouts fetch user lists on load
    cy.intercept("GET", "**/admin/getUsers*", {
      statusCode: 200,
      body: { success: true, users: [] }
    }).as("getUsers");

    cy.intercept("GET", "**/api/campaigns/*/templates/*", {
      statusCode: 200,
      body: { success: true, data: [] }
    }).as("templates");

    cy.intercept("POST", "**/api/campaigns/*/preview", {
      statusCode: 200,
      body: { success: true, data: { count: 5 } }
    }).as("previewRecipients");

    cy.intercept("POST", "**/api/campaigns/**", (req) => {
      // Ignore preview endpoint handled above
      if (req.url.includes("/preview")) return;
      req.reply({
        statusCode: 200,
        body: { success: true, message: "Campaign created successfully!" }
      });
    }).as("createCampaign");
  });

  it("logs in on /login using ADMIN_EMAIL + ADMIN_PASSWORD and redirects", () => {
    cy.visit(`${base}/login`);
    cy.get('input[placeholder="Email"]').type(adminEmail() || "admin@example.com");
    cy.get('input[placeholder="Password"]').type(adminPassword() || "password");
    cy.contains("button", "Login").click();
    cy.wait("@adminLogin");
  });

  it("opens /messaging and requires selecting a store", () => {
    cy.visit(`${base}/login`);
    cy.get('input[placeholder="Email"]').type(adminEmail() || "admin@example.com");
    cy.get('input[placeholder="Password"]').type(adminPassword() || "password");
    cy.contains("button", "Login").click();
    cy.wait("@adminLogin");

    cy.visit(`${base}/messaging`);
    cy.wait("@adminStores");
    cy.contains("Messaging").should("be.visible");
    cy.contains("Please select a store").should("be.visible");
  });

  it("creates a push campaign via wizard (segments → compose → send)", () => {
    cy.visit(`${base}/login`);
    cy.get('input[placeholder="Email"]').type(adminEmail() || "admin@example.com");
    cy.get('input[placeholder="Password"]').type(adminPassword() || "password");
    cy.contains("button", "Login").click();
    cy.wait("@adminLogin");

    cy.visit(`${base}/messaging`);
    cy.wait("@adminStores");

    // Open selector and choose Haus9
    cy.get('input[placeholder*="select store"]').click({ force: true });
    cy.contains("Haus9").click({ force: true });
    cy.wait("@segments");
    cy.wait("@segmentCounts");
    cy.wait("@summary");

    // Step 1: selecting segment triggers preview
    cy.contains("At-Risk").click({ force: true });
    cy.wait("@previewRecipients");

    // Next to step 2
    cy.contains("button", "Next").click();

    // Compose message (push custom)
    cy.contains("Select Channel").should("be.visible");
    cy.get('input[placeholder="e.g., Special Offer for You!"]').type("Hello!");
    cy.get('textarea[placeholder="Write your message here..."]').type("Hello from Cypress test");

    cy.contains("button", "Next").should("not.be.disabled").click();

    // Step 3: campaign name and Send Now
    cy.contains("Campaign Name").should("be.visible");
    cy.contains("Campaign Name").parent().find("input").type("At-risk re-engagement");
    cy.contains("Campaign Summary").should("be.visible");
    cy.get("button:visible").then(($btns) => {
      const matches = [...$btns].filter((b) => (b.innerText || "").includes("Send Now"));
      expect(matches.length, "visible 'Send Now' buttons").to.be.greaterThan(0);
      cy.wrap(Cypress.$(matches[matches.length - 1])).should("not.be.disabled").click();
    });
    cy.wait("@createCampaign");
  });

  it("blocks sending when campaign name is empty (validation)", () => {
    cy.visit(`${base}/login`);
    cy.get('input[placeholder="Email"]').type(adminEmail() || "admin@example.com");
    cy.get('input[placeholder="Password"]').type(adminPassword() || "password");
    cy.contains("button", "Login").click();
    cy.wait("@adminLogin");

    cy.visit(`${base}/messaging`);
    cy.wait("@adminStores");

    cy.get('input[placeholder*="select store"]').click({ force: true });
    cy.contains("Haus9").click({ force: true });
    cy.wait("@segments");

    cy.contains("At-Risk").click({ force: true });
    cy.wait("@previewRecipients");
    cy.contains("button", "Next").click();

    // Ensure some message is present so only name blocks
    cy.get('textarea[placeholder="Write your message here..."]').type("Body");
    cy.contains("button", "Next").click();

    cy.contains("Campaign Summary").should("be.visible");
    cy.get("button:visible").then(($btns) => {
      const matches = [...$btns].filter((b) => (b.innerText || "").includes("Send Now"));
      expect(matches.length, "visible 'Send Now' buttons").to.be.greaterThan(0);
      cy.wrap(Cypress.$(matches[matches.length - 1])).should("be.disabled");
    });
  });
});

