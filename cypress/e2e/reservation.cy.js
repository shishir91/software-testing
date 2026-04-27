describe("Customer reservation flows (haus9)", () => {
  beforeEach(() => {
    cy.stubStoreBootstrap();
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
  });

  it("filters reservation services via search", () => {
    cy.customerLoginViaUI();
    cy.visit("/reservation");
    cy.get('input[placeholder="Search..."]').type("Haircut");
    cy.contains("Haircut").should("be.visible");
    cy.contains("Table Reservation").should("not.exist");
  });

  it("navigates to /reservationForm after selecting a service", () => {
    cy.customerLoginViaUI();
    cy.visit("/reservation");
    cy.contains("Table Reservation").click();
    cy.location("pathname", { timeout: 20000 }).should("eq", "/reservationForm");
    cy.contains("Reserve").should("be.visible");
  });
});

