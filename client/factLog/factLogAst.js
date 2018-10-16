const CONSTANT_ARG = 'FACT_LOG_CONSTANT_ARG';
const VARIABLE_ARG = 'FACT_LOG_VARIABLE_ARG';
const CLAIM = 'FACT_LOG_CLAIM';
const WHEN = 'FACT_LOG_WHEN';

function constant(value) {
  return { type: CONSTANT_ARG, value };
}

function variable(name) {
  return { type: VARIABLE_ARG, name };
}

function claim({ name, args, source = null, isDynamic = true }) {
  return { type: CLAIM, name, args, source, isDynamic };
}

function constantClaim({ name, args, source = null, isDynamic = true }) {
  return claim({ name, args: args.map(constant), source, isDynamic });
}

function when({ claims, callback, source = null, isDynamic = true }) {
  return { type: WHEN, claims, callback, source, isDynamic };
}

function isConstant(obj) {
  return obj && obj.type === CONSTANT_ARG;
}

function isVariable(obj) {
  return obj && obj.type === VARIABLE_ARG;
}

function isClaim(obj) {
  return obj && obj.type === CLAIM;
}

function isWhen(obj) {
  return obj && obj.type === WHEN;
}

module.exports = {
  constant,
  variable,
  claim,
  constantClaim,
  when,
  isConstant,
  isVariable,
  isClaim,
  isWhen,
};
