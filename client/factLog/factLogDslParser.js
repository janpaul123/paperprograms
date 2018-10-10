const ast = require('./factLogAst');

function parseClaim(literals, params) {
  const name = normalizeWhitespace(literals.join('@'));
  const args = params.map(ast.constant);

  return ast.claim(name, args);
}

function parseWhen(literals, params) {
  const whenStatement = literals.join('');
  const constantValues = params.map(ast.constant);
  const tokens = interleave(literals, constantValues)
    .map(chunk => {
      if (typeof chunk !== 'string') {
        return [chunk];
      }

      let normalizedChunk = normalizeWhitespace(chunk);
      let tokensOfChunk = [];
      let insideVariableToken = false;
      let part = '';

      for (let i = 0; i < normalizedChunk.length; i++) {
        switch (normalizedChunk[i]) {
          case '{':
            if (insideVariableToken) {
              throw new Error(`unexpected character { in When: '${whenStatement}'`);
            }

            insideVariableToken = true;
            tokensOfChunk.push(part);
            part = '';
            break;

          case '}':
            if (!insideVariableToken) {
              throw new Error(`unexpected character } in When: '${whenStatement}'`);
            }

            insideVariableToken = false;
            tokensOfChunk.push(ast.variable(part));
            part = '';
            break;

          default:
            part += normalizedChunk[i];
            break;
        }
      }

      return tokensOfChunk;
    })
    .reduce(flatten);

  const name = tokens.map(token => (typeof token === 'string' ? token : '@')).join('');
  const args = tokens.filter(token => typeof token !== 'string');

  return ast.when([ast.claim(name, args)]);
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

function flatten(arr1, arr2) {
  return arr1.concat(arr2);
}

module.exports = {
  parseClaim,
  parseWhen,
};
