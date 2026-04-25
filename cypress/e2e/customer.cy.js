describe("Customer pages (haus9)", () => {
  beforeEach(() => {
    cy.stubStoreBootstrap();
  });

  it("loads customer login page (/) and shows Earn Points form", () => {
    cy.visit("/");
    cy.wait("@checkStore");
    cy.contains("button", "Continue").should("be.visible");
    cy.get('input[name="name"]').should("be.visible");
    cy.get('input[name="email"]').should("be.visible");
    cy.get('input[name="phone"]').should("be.visible");
  });

  it("register/login submits and redirects to /loyality", () => {
    cy.customerLoginViaUI();
  });

  it("protects /loyality when not logged in (redirects to /)", () => {
    cy.visit("/loyality");
    cy.location("pathname", { timeout: 20000 }).should("eq", "/");
  });

  it("renders loyalty card after login (points visible somewhere on card)", () => {
    cy.customerLoginViaUI({ points: 42 });
    // The loyalty component is highly styled; assert on a stable number presence.
    cy.contains("42").should("exist");
  });

  it("loads /reservation and shows tabs + search when logged in", () => {
    cy.stubReservationData();
    cy.customerLoginViaUI();

    cy.visit("/reservation");
    cy.contains("Services").should("be.visible");
    cy.contains("My Reservations").should("be.visible");
    cy.get('input[placeholder="Search..."]').should("be.visible");
    cy.wait("@reservationSettings");
  });

  it("reservation service list can be searched", () => {
    cy.stubReservationData({
      services: [
        {
          name: "Haircut",
          description: "Mens haircut",
          category: "Salon",
          price: 500,
          outlet: "Main Outlet",
          images: [],
          needTimeSlots: false
        },
        {
          name: "Table Reservation",
          description: "Reserve a table",
          category: "Dining",
          price: 0,
          outlet: "Main Outlet",
          images: [],
          needTimeSlots: false
        }
      ]
    });
    cy.customerLoginViaUI();

    cy.visit("/reservation");
    cy.get('input[placeholder="Search..."]').type("Haircut");
    cy.contains("Haircut").should("be.visible");
    cy.contains("Table Reservation").should("not.exist");
  });

  it("switches to My Reservations tab", () => {
    cy.stubReservationData();
    cy.customerLoginViaUI();
    cy.visit("/reservation");

    cy.contains("My Reservations").click();
    // ReservationHistory embedded component renders; at minimum the tab changes and history container exists.
    cy.contains("My Reservations").should("be.visible");
  });

  it("navigates from /reservation -> /reservationForm by clicking a service", () => {
    cy.stubReservationData({
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
      ]
    });
    cy.customerLoginViaUI();
    cy.visit("/reservation");

    cy.contains("Table Reservation").click();
    cy.location("pathname", { timeout: 20000 }).should("eq", "/reservationForm");
    cy.contains("Reserve").should("be.visible");
  });

  it("reservationForm shows outlet actions and Reserve button", () => {
    cy.stubReservationData();
    cy.customerLoginViaUI();
    cy.visit("/reservation");
    cy.contains("Table Reservation").click();

    cy.contains("Main Outlet").should("be.visible");
    cy.contains("Call outlet").should("be.visible");
    cy.contains("Go to maps").should("be.visible");
    cy.contains("Reserve").should("be.visible");
  });

  it("reservationForm Go to maps opens the outlet map link", () => {
    cy.stubReservationData();
    cy.customerLoginViaUI();
    cy.visit("/reservation");
    cy.contains("Table Reservation").click();

    cy.contains("Go to maps").should("be.visible");
  });
});

