import { defineConfig } from "cypress";

export default defineConfig({
  projectId: "py2jbh",
  e2e: {
    specPattern: 'cypress/e2e/**/*.js',
    setupNodeEvents(on, config) {
      // implement node event listeners here
    },
  },
});
