const factLog = require('./factLogAst');

function FactLogDb() {
  this._claims = {};
  this._indexes = {};
}

FactLogDb.prototype = {
  addClaim({ name, args }) {
    const invalidArgs = args.filter(arg => !factLog.isConstant(arg));

    if (invalidArgs.length > 0) {
      // eslint-disable-next-line no-console
      console.warn(
        `skip claim "${name}" because it contains ${invalidArgs.length} invalid arg(s):`,
        invalidArgs
      );
      return;
    }

    if (!this._claims[name]) {
      this._claims[name] = [];
    }

    if (!this._indexes[name]) {
      this._indexes[name] = {};
    }

    for (let i = 0; i < args.length; i++) {
      const value = args[i].value;

      // don't index non primitive values
      if (value instanceof Object) {
        continue;
      }

      if (!this._indexes[name][i]) {
        this._indexes[name][i] = {};
      }

      if (!this._indexes[name][i][value]) {
        this._indexes[name][i][value] = [];
      }

      this._indexes[name][i][value].push(args);
    }

    this._claims[name].push(args);
  },

  query(claims) {
    let matches = [{}];

    for (let ci = 0; ci < claims.length; ci++) {
      const claim = claims[ci];

      let joinedMatches = [];

      for (let mi = 0; mi < matches.length; mi++) {
        const context = matches[mi];
        const newMatches = this._findMatchesForClaim(claim, context);

        joinedMatches = joinedMatches.concat(newMatches);
      }

      matches = joinedMatches;

      if (matches.length === 0) {
        return [];
      }
    }

    return matches;
  },

  _findMatchesForClaim(claim, context = {}) {
    const name = claim.name;
    const args = claim.args.slice(); // clone args because they will be mutated

    let claims = this._claims[name];

    const equalConstraints = [];
    let constantArgs = [];
    const varArgs = [];
    const matchingClaims = [];

    // quick return if no claims with that name exist
    if (!claims) {
      return [];
    }

    // proccess arguments
    for (let ai = 0; ai < args.length; ai++) {
      const arg = args[ai];

      if (factLog.isVariable(arg)) {
        if (context[arg.name]) {
          // resolve variables which are in context
          args[ai] = context[arg.name];
          constantArgs.push({ index: ai, value: context[arg.name] });
        } else {
          // add other variables to varArgs

          // add equal constraint if variable was used before
          for (let vi = 0; vi < varArgs.length; vi++) {
            const varArg = varArgs[vi];
            if (varArg.name === arg.name) {
              equalConstraints.push([varArg.index, ai]);
              break;
            }
          }

          varArgs.push({ index: ai, name: arg.name });
        }
      } else if (factLog.isConstant(arg)) {
        constantArgs.push({ index: ai, value: arg.value });
      }
    }

    // return all claims without filter if there are no constant arguments and not equalConstraints
    if (constantArgs.length === 0 && equalConstraints.length === 0) {
      return claimsToMatches(claims, varArgs, context);
    }

    if (constantArgs.length > 0) {
      // lookup first constant arg
      let [firstConstantArg, ...restConstantArgs] = constantArgs;
      claims = this._indexes[name][firstConstantArg.index][firstConstantArg.value] || [];

      if (restConstantArgs.length === 0 && equalConstraints.length === 0) {
        return claimsToMatches(claims, varArgs, context);
      }

      constantArgs = restConstantArgs;
    }

    // ... otherwise filter
    for (let ci = 0; ci < claims.length; ci++) {
      const compareClaim = claims[ci];
      let isMatch = true;

      // check if claim matches constant values
      for (let ai = 0; ai < constantArgs.length; ai++) {
        const { index, value } = constantArgs[ai];

        if (value !== compareClaim[index].value) {
          isMatch = false;
          break;
        }
      }

      // check if claim fulfills equal constraints
      if (isMatch) {
        for (let coi = 0; coi < equalConstraints.length; coi++) {
          const [indexA, indexB] = equalConstraints[coi];

          if (compareClaim[indexA].value !== compareClaim[indexB].value) {
            isMatch = false;
            break;
          }
        }
      }

      if (isMatch) {
        matchingClaims.push(compareClaim);
      }
    }

    return claimsToMatches(matchingClaims, varArgs, context);
  },
};

function claimsToMatches(claims, varArgs, context) {
  const matches = [];

  for (let ci = 0; ci < claims.length; ci++) {
    const claim = claims[ci];
    const match = { ...context };

    for (let ai = 0; ai < varArgs.length; ai++) {
      const arg = varArgs[ai];
      match[arg.name] = claim[arg.index].value;
    }

    matches.push(match);
  }

  return matches;
}

module.exports = FactLogDb;
