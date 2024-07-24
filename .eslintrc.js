/* eslint-disable @typescript-eslint/naming-convention */
/** @type {import('eslint').Linter.BaseConfig} */

module.exports = {
  extends: [
    '@cp-utils/eslint-config',
  ],
  overrides: [{
    files: ['**/package.json'],
    rules: {
      'eol-last': [2, 'always'],
    },
  }],

};
