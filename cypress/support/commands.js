const DEFAULT_SUBDOMAIN = "haus9";

function apiPattern(path) {
  // Backend base URL differs per env; match by path suffix.
  return `**${path}`;
}

Cypress.Commands.add("stubStoreBootstrap", (overrides = {}) => {
  const store = {
    _id: "store_haus9_test_id",
    url: DEFAULT_SUBDOMAIN,
    name: "Haus9",
    logo: "/logo.png",
    frontLogo: "/logo.png",
    loyaltyCard: { cardColor: "#16a34a" },
    phone: "9800000000",
    website: "https://samparka.co",
    address: "Kathmandu",
    whatsapp: false,
    isRounded: true,
    conversionRate: 100,
    amount: true,
    needBillID: true,
    needCustomerDOB: false,
    needCustomerGender: false,
    showPhoneNumberOnSubAdmin: false,
    letSubAdminToGiveManualPoints: true,
    services: {
      powered: true,
      reservation: true,
      multipleOutlets: false,
      ecommerce: { status: false },
      games: false
    },
    outlets: []
  };

  const mergedStore = { ...store, ...overrides, services: { ...store.services, ...(overrides.services || {}) } };

  // AppStore: axios GET /store/checkStore/:subdomain
  cy.intercept("GET", apiPattern(`/store/checkStore/${DEFAULT_SUBDOMAIN}`), {
    statusCode: 200,
    body: { success: true, store: mergedStore }
  }).as("checkStore");

  // AppStore: fetch(manifest.json?subdomain=...&type=user/admin...)
  cy.intercept(
    "GET",
    apiPattern(`/manifest.json?subdomain=${DEFAULT_SUBDOMAIN}*`),
    {
      statusCode: 200,
      body: {
        name: mergedStore.name,
        short_name: mergedStore.name,
        icons: [{ src: mergedStore.logo }]
      }
    }
  ).as("manifest");
});

Cypress.Commands.add("customerLoginViaUI", (customerOverrides = {}) => {
  cy.clearCookies();
  cy.clearLocalStorage();

  const customer = {
    _id: "cust_test_id",
    name: "Test Customer",
    email: "test.customer@example.com",
    phone: "9800000000",
    countryCode: "+977",
    points: 12
  };
  const mergedCustomer = { ...customer, ...customerOverrides };

  cy.intercept("POST", apiPattern(`/customer/register/${DEFAULT_SUBDOMAIN}`), {
    statusCode: 200,
    body: {
      success: true,
      message: "Logged in",
      token: "cust_token_test",
      customer: mergedCustomer,
      isNew: false
    }
  }).as("customerRegister");

  cy.intercept("GET", apiPattern("/customer"), {
    statusCode: 200,
    body: mergedCustomer
  }).as("customerMe");

  cy.intercept("GET", apiPattern(`/customer/loyaltyCard/${DEFAULT_SUBDOMAIN}`), {
    statusCode: 200,
    body: {
      success: true,
      store: {
        name: "Haus9",
        logo: "/logo.png",
        loyaltyCard: { cardColor: "#16a34a" }
      }
    }
  }).as("loyaltyCard");

  // Visit login page and submit the register/login form.
  cy.visit("/");
  cy.wait("@checkStore");
  // Wait for either new login step input or legacy form inputs to appear.
  cy.get(
    'input[placeholder="Email address"], input[placeholder="Phone or email"], input[name="name"], input[placeholder="Name"]',
    { timeout: 20000 }
  ).should("exist");

  // Haus9 prod currently uses the new login flow (email-only identifier step).
  cy.get("body").then(($body) => {
    const hasEmailOnly = $body.find('input[placeholder="Email address"]').length > 0;

    if (hasEmailOnly) {
      cy.get('input[placeholder="Email address"]').as("emailInput");
      cy.get("@emailInput").should("be.visible");
      cy.get("@emailInput").clear();
      cy.get("@emailInput").type(mergedCustomer.email, { delay: 0 });
      cy.contains("button", "Continue").should("not.be.disabled");
      cy.contains("button", "Continue").click();
    } else {
      cy.contains("button", "Continue").should("be.visible");
      // Avoid flaky "detached DOM" typing in heavily re-rendered inputs.
      const setValue = (selectors, value) => {
        const sel = Array.isArray(selectors) ? selectors.join(",") : selectors;
        cy.get(sel)
          .filter(":visible")
          .first()
          .should("be.visible")
          .then(($el) => {
            const el = $el[0];
            el.value = "";
            el.dispatchEvent(new Event("input", { bubbles: true }));
            el.value = String(value);
            el.dispatchEvent(new Event("input", { bubbles: true }));
            el.dispatchEvent(new Event("change", { bubbles: true }));
          });
      };
      setValue(['input[name="name"]', 'input[placeholder="Name"]'], mergedCustomer.name);
      setValue(['input[name="email"]', 'input[placeholder="Email"]'], mergedCustomer.email);
      setValue(['input[name="phone"]', 'input[placeholder="Phone No"]', 'input[placeholder="Phone Number"]'], mergedCustomer.phone);
      cy.contains("button", "Continue").click();
    }
  });

  cy.wait("@customerRegister");
  // App navigates to /loyality on success.
  cy.location("pathname", { timeout: 20000 }).should("match", /\/loyality\/?$/);
});

Cypress.Commands.add("stubReservationData", (overrides = {}) => {
  const reservationSettings = {
    services: [
      {
        name: "Table Reservation",
        description: "Reserve a table",
        category: "Dining",
        price: 0,
        outlet: "Main Outlet",
        images: [],
        needTimeSlots: false
      }
    ],
    ...overrides
  };

  cy.intercept(
    "GET",
    apiPattern("/customer/reservation-settings?*"),
    { statusCode: 200, body: reservationSettings }
  ).as("reservationSettings");

  cy.intercept("GET", apiPattern("/store/getOutlets/*"), {
    statusCode: 200,
    body: { outlets: [{ _id: "out1", location: "Main Outlet", phone: "9800000000", mapLink: "https://maps.google.com" }] }
  }).as("getOutlets");

  cy.intercept("GET", apiPattern("/store/reservation/*"), {
    statusCode: 200,
    body: { reservations: [] }
  }).as("getReservations");

  cy.intercept("POST", apiPattern(`/customer/reservation/${DEFAULT_SUBDOMAIN}`), {
    statusCode: 200,
    body: { success: true, message: "Reservation created" }
  }).as("createReservation");
});

Cypress.Commands.add("stubL6RewardsData", (options = {}) => {
  const storeId = options.storeId || "store_haus9_test_id";
  const token = options.token || "cust_token_test";

  const rewards = options.rewards || [
    {
      _id: "r_point_1",
      type: "l6",
      name: "Free Coffee",
      description: "Redeem for a free coffee",
      isPointBased: true,
      pointCost: 10,
      redeemable: true,
      evergreen: true,
      redeemableTimes: 999,
      isTierBased: false,
      isMissionBased: false
    },
    {
      _id: "r_tier_1",
      type: "l6",
      name: "VIP Dessert",
      description: "Tier reward",
      isPointBased: false,
      isTierBased: true,
      tier: "Gold",
      redeemable: true,
      evergreen: true,
      redeemableTimes: 999,
      isMissionBased: false
    }
  ];

  const myRewards = options.myRewards || [];

  // Rewards list
  cy.intercept("GET", apiPattern(`/reward/getRewards/${storeId}`), {
    statusCode: 200,
    body: { rewards }
  }).as("getRewards");

  // Customer profile (points)
  cy.intercept("GET", apiPattern("/customer"), (req) => {
    if (req.headers?.token !== token) {
      req.reply({ statusCode: 200, body: { points: 12, tier: "Gold", l6Data: { missionProgress: {} } } });
      return;
    }
    req.reply({ statusCode: 200, body: { points: options.customerPoints ?? 12, tier: options.customerTier ?? "Gold", l6Data: { missionProgress: options.missionProgress ?? {} } } });
  }).as("customerProfile");

  // My rewards history
  cy.intercept("GET", apiPattern("/customer/myRewards"), {
    statusCode: 200,
    body: { myRewards }
  }).as("myRewards");

  // Redeem endpoint (success by default)
  cy.intercept("PUT", apiPattern(`/customer/redeemL6Reward/*`), (req) => {
    const ok = options.redeemSuccess ?? true;
    req.reply({
      statusCode: 200,
      body: ok
        ? { success: true, message: options.redeemMessage ?? "Reward redeemed" }
        : { success: false, message: options.redeemMessage ?? "Not enough points" }
    });
  }).as("redeemReward");
});

Cypress.Commands.add("storeLoginViaUI", () => {
  cy.clearCookies();
  cy.clearLocalStorage();

  cy.intercept("POST", apiPattern(`/store/verifyPIN/${DEFAULT_SUBDOMAIN}`), {
    statusCode: 200,
    body: { success: true, message: "Logged in", token: "store_token_test" }
  }).as("verifyPIN");

  cy.visit("/store/login");
  cy.contains("Please enter the 4 digit PIN", { matchCase: false }).should("be.visible");

  // PinInput renders 4 password inputs; type into them sequentially.
  cy.get('input[type="password"]').should("have.length.at.least", 4);
  const pinDigits = ["1", "2", "3", "4"];
  pinDigits.forEach((d, i) => {
    cy.get('input[type="password"]').eq(i).clear().type(d);
  });

  cy.contains("button", "Submit").click();

  cy.wait("@verifyPIN");
  cy.location("pathname", { timeout: 20000 }).should("eq", "/store/points");
});

Cypress.Commands.add("stubStoreAdminData", () => {
  cy.intercept("GET", apiPattern(`/store/getPointsDetail/${DEFAULT_SUBDOMAIN}`), {
    statusCode: 200,
    body: { success: true, points: { _id: "points1", points: 5 } }
  }).as("getPointsDetail");

  cy.intercept("PUT", apiPattern(`/store/changePoints/${DEFAULT_SUBDOMAIN}`), {
    statusCode: 200,
    body: { success: true, message: "Points changed" }
  }).as("changePoints");

  cy.intercept("POST", apiPattern("/store/createPrintPoints/*"), {
    statusCode: 200,
    body: { success: true, points: { _id: "pp1", points: 3, billID: "B-1", createdAt: new Date().toISOString() } }
  }).as("createPrintPoints");

  cy.intercept("GET", apiPattern("/store/getCustomersS/*"), {
    statusCode: 200,
    body: {
      success: true,
      customers: [
        { _id: "c1", name: "Alice", email: "alice@example.com", phone: "9800000001", points: 10, createdAt: new Date().toISOString(), store: { needBillID: false, amount: false } },
        { _id: "c2", name: "Bob", email: "bob@example.com", phone: "9800000002", points: 4, createdAt: new Date().toISOString(), store: { needBillID: false, amount: false } }
      ]
    }
  }).as("getCustomers");

  cy.intercept("POST", apiPattern("/store/createCustomerS/*"), {
    statusCode: 200,
    body: { success: true, message: "Customer created" }
  }).as("createCustomer");

  // Production may use slightly different paths; keep a broad fallback.
  cy.intercept("POST", "**/*createCustomer*", {
    statusCode: 200,
    body: { success: true, message: "Customer created" }
  }).as("createCustomerAny");

  cy.intercept("PUT", apiPattern("/store/updatePointsS/*"), {
    statusCode: 200,
    body: { success: true }
  }).as("updateCustomerPoints");
});

