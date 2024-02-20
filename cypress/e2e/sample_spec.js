describe('Google Search', () => {
  it('should search for a term', () => {
    cy.visit('https://www.google.com')
    cy.get('[name="q"]').type('Cypress.io{enter}')

    cy.url().should('include', 'search')
    cy.get('#search').should('exist')
    cy.contains('Cypress.io').should('exist')
  })
})
