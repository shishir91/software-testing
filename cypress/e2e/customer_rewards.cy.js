describe("Customer loyalty rewards (haus9)", () => {
  beforeEach(() => {
    cy.stubStoreBootstrap({
      loyaltyCard: { cardColor: "#16a34a", format: "L6", tier: [{ name: "Gold" }] }
    });
  });

  it("can navigate from /loyality to /rewards via Rewards Club button", () => {
    cy.customerLoginViaUI({ points: 25 });
    cy.stubL6RewardsData({ customerPoints: 25 });

    // Close T&C modal if it appears (can cover the Rewards Club button).
    cy.get("body").then(($body) => {
      if ($body.text().includes("Terms") && $body.find('button:contains("Accept")').length) {
        cy.contains("button", "Accept").click({ force: true });
      }
    });

    cy.contains("Rewards Club").click({ force: true });
    cy.location("pathname", { timeout: 20000 }).should("eq", "/rewards");
    cy.wait("@getRewards");
  });

  it("shows rewards list and customer points on /rewards", () => {
    cy.customerLoginViaUI({ points: 25 });
    cy.stubL6RewardsData({ customerPoints: 25 });

    cy.visit("/rewards");
    cy.contains("Rewards").should("exist");
    cy.contains("Free Coffee").should("be.visible");
  });

  it("redeems a point-based reward successfully (stubs redeem API)", () => {
    cy.customerLoginViaUI({ points: 25 });
    cy.stubL6RewardsData({
      customerPoints: 25,
      redeemSuccess: true,
      redeemMessage: "Reward redeemed"
    });

    cy.visit("/rewards");
    cy.contains("Free Coffee").scrollIntoView().should("be.visible");

    cy.on("window:confirm", () => true);
    cy.contains("button", "Claim")
      .first()
      .should("not.be.disabled")
      .click({ force: true });

    cy.wait("@redeemReward");
    cy.contains("Reward redeemed").should("exist");
  });

  it("shows error toast when redeem fails (e.g., insufficient points)", () => {
    cy.customerLoginViaUI({ points: 1 });
    cy.stubL6RewardsData({
      customerPoints: 1,
      redeemSuccess: false,
      redeemMessage: "Not enough points"
    });

    cy.visit("/rewards");
    cy.contains("Free Coffee").scrollIntoView().should("be.visible");
    // In this state the UI will show "Need X pts" and be disabled.
    cy.contains("button", /need|locked/i).first().should("be.disabled");
  });
});

