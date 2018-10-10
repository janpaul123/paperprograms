function FactLogClient({ onEmitChanges }) {
  this.onEmitChanges = onEmitChanges;
  this.whens = [];
  this.claims = [];

  this.isEmittingChanges = false;
  this.isInWhenEvaluationMode = false;
}

FactLogClient.prototype = {
  evaluateWhens(matchesByWhenId) {
    const currentWhens = this.whens.slice();

    // remove dynamic whens and claims
    this.whens = this.whens.filter(({ isDynamic }) => !isDynamic);
    this.claims = this.claims.filter(({ isDynamic }) => !isDynamic);

    // START: WHEN EVALUATION MODE
    this.isInWhenEvaluationMode = true;

    currentWhens.forEach(({ id, callback }) => {
      const matches = matchesByWhenId[id];

      if (!matches || matches.length === 0) {
        return;
      }

      matches.forEach(callback);
    });

    // END: WHEN EVALUATION MODE
    this.isInWhenEvaluationMode = false;
  },

  addWhen(when, callback) {
    this.whens.push({ ...when, callback, isDynamic: this.isInWhenEvaluationMode });
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
        claims: this.claims.map(({ type, name, args }) => ({ type, name, args })),
        whens: this.whens.map(({ type, id, claims }) => ({ type, id, claims })),
      });
    });
  },
};

module.exports = FactLogClient;
