module.exports = {
  root: true,
  env: {
    node: true,
    es2022: true
  },
  extends: ["eslint:recommended", "plugin:cypress/recommended"],
  plugins: ["cypress"],
  overrides: [
    {
      files: ["cypress/**/*.js"],
      env: {
        browser: true,
        mocha: true
      }
    }
  ],
  rules: {
    "cypress/no-unnecessary-waiting": "error"
  }
};

