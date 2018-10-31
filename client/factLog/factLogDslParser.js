const ast = require('./factLogAst');

function parseClaim({ literals, params, source, isDynamic }) {
  const name = normalizeWhitespace(literals.join('@')).trim();
  const args = params.map(ast.constant);

  return ast.claim({ name, args, source, isDynamic });
}

function parseWishClaim({ literals, params, source, isDynamic }) {
  const claim = parseClaim({ literals, params, source, isDynamic });

  claim.name = `@ wishes ${claim.name}`;
  claim.args = [ast.constant(source)].concat(claim.args);

  return claim;
}

function parseWhenClaims({ literals, params }) {
  const whenStatement = literals.join('');
  const constantValues = params.map(ast.constant);

  const claims = [];
  let tempClaim = { name: '', args: [] };

  interleave(literals, constantValues).forEach(chunk => {
    if (typeof chunk !== 'string') {
      tempClaim.name += '@';
      tempClaim.args.push(chunk);
      return;
    }

    let normalizedChunk = normalizeWhitespace(chunk);
    let buffer = '';
    let insideVariableToken = false;

    for (let i = 0; i < normalizedChunk.length; i++) {
      switch (normalizedChunk[i]) {
        case '{':
          if (insideVariableToken) {
            throw new Error(`unexpected character { in When: '${whenStatement}'`);
          }

          insideVariableToken = true;
          buffer = '';
          break;

        case '}':
          if (!insideVariableToken) {
            throw new Error(`unexpected character } in When: '${whenStatement}'`);
          }

          insideVariableToken = false;
          tempClaim.name += '@';
          tempClaim.args.push(ast.variable(buffer));
          buffer = '';
          break;

        case ',':
          claims.push(ast.claim({ name: tempClaim.name.trim(), args: tempClaim.args }));
          tempClaim = { name: '', args: [] };
          break;

        default:
          if (insideVariableToken) {
            buffer += normalizedChunk[i];
          } else {
            tempClaim.name += normalizedChunk[i];
          }
          break;
      }
    }
  });

  claims.push(ast.claim({ name: tempClaim.name.trim(), args: tempClaim.args }));

  return claims;
}

function normalizeWhitespace(str) {
  return str.replace(/\s+/g, ' ');
}

function interleave(arr1, arr2) {
  const result = [];
  const n = Math.max(arr1.length, arr2.length);

  for (let i = 0; i < n; i++) {
    if (arr1[i]) {
      result.push(arr1[i]);
    }

    if (arr2[i]) {
      result.push(arr2[i]);
    }
  }

  return result;
}

module.exports = {
  parseClaim,
  parseWishClaim,
  parseWhenClaims,
};
