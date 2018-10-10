function FactLogClient({ onEmitChanges }) {
  this.onEmitChanges = onEmitChanges;
  this.whens = [];
  this.claims = [];

  this.isEmittingChanges = false;
  this.isInWhenEvaluationMode = false;
}

FactLogClient.prototype = {
  evaluateWhens(groupedMatches) {
    const currentWhens = this.whens.slice();

    // remove dynamic whens and claims
    this.whens = this.whens.filter(({ isDynamic }) => !isDynamic);
    this.claims = this.claims.filter(({ isDynamic }) => !isDynamic);

    // START: WHEN EVALUATION MODE
    this.isInWhenEvaluationMode = true;

    groupedMatches.forEach((matches, subscriptionName) => {
      const callbacks = currentWhens[subscriptionName];

      if (callbacks.length === 0) {
        return;
      }

      callbacks.forEach(callback => matches.forEach(callback));
    });

    // END: WHEN EVALUATION MODE
    this.isInWhenEvaluationMode = false;
  },

  addWhen(claims, callback) {
    this.whens.push({
      id: JSON.stringify(claims),
      claims,
      callback: callback,
      isDynamic: this.isInWhenEvaluationMode,
    });

    this._emitChanges();
  },

  addClaim(claim) {
    this.claims.push({ ...claim, isDynamic: this.isInWhenEvaluationMode });
    this._emitChanges();
  },

  _emitChanges() {
    if (this.isEmittingChanges) {
      return;
    }

    this.isEmittingChanges = true;

    setTimeout(() => {
      this.onEmitChanges({
        claims: this.claims.map(({ name, args }) => ({ name, args })),
        whens: this.whens.map(({ id, claims }) => ({ id, claims })), // drop callbacks
      });
    });
  },
};

module.exports = FactLogClient;
