const appJson = require('./app.json');

/** Base path for GitHub Pages project site (/{repo}/). Set in CI only. */
const pagesBase = process.env.GITHUB_PAGES_BASE_PATH?.trim() ?? '';

module.exports = {
  expo: {
    ...appJson.expo,
    experiments: {
      ...(appJson.expo.experiments ?? {}),
      ...(pagesBase ? { baseUrl: pagesBase } : {}),
    },
  },
};
