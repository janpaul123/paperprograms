/*globals Claim */

module.exports = function() {
  const env = require('../../../.env.client');

  for (const [name, value] of Object.entries(env)) {
    Claim` environment has parameter named ${name} set to value ${value}`;
  }
};
