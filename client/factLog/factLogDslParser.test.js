const test = require('tape');
const parser = require('./factLogDslParser');
const dsl = require('./factLogAst');

const you = 123;

function Claim(literals, ...params) {
  return parser.parseClaim({ literals, params });
}

function Wish(literals, ...params) {
  return parser.parseWishClaim({ literals, params, source: you });
}

function When(literals, ...params) {
  return parser.parseWhenClaims({ literals, params });
}

test('claim: parse string', t => {
  t.deepEqual(
    Claim`${'Homer'} is father of ${'Bart'}`,
    dsl.claim({ name: '@ is father of @', args: [dsl.constant('Homer'), dsl.constant('Bart')] })
  );

  t.end();
});

test('claim: normalize whitespace', t => {
  t.deepEqual(
    Claim`${'Homer'} is father of ${'Bart'}`,
    Claim`
        ${'Homer'}   is   father    of ${'Bart'} 
      
      `
  );

  t.end();
});

test('wish: parse string', t => {
  t.deepEqual(
    Wish`${you} is labelled ${'Hello World!'}`,
    dsl.claim({
      source: you,
      name: '@ wishes @ is labelled @',
      args: [dsl.constant(you), dsl.constant(you), dsl.constant('Hello World!')],
    })
  );
  t.end();
});

test('wish: normalize whitespace', t => {
  t.deepEqual(
    Wish`${you} is labelled ${'Hello World!'}`,
    Wish`
        ${you}  is  labelled  ${'Hello World!'} 
      
      `
  );
  t.end();
});

test('when: parse string', t => {
  t.deepEqual(When`${'Homer'} is father of {child}`, [
    dsl.claim({
      name: '@ is father of @',
      args: [dsl.constant('Homer'), dsl.variable('child')],
    }),
  ]);

  t.end();
});

test('when: parse with joins', t => {
  t.deepEqual(When`{x} is father of {y}, {y} is father of {z}`, [
    dsl.claim({ name: '@ is father of @', args: [dsl.variable('x'), dsl.variable('y')] }),
    dsl.claim({ name: '@ is father of @', args: [dsl.variable('y'), dsl.variable('z')] }),
  ]);

  t.end();
});

test('when: parse with join normalize whitespace', t => {
  t.deepEqual(
    When`{x} is father of {y}, {y} is father of {x}`,
    When` {x} is father of {y}, 
    {y} is father of {x} 
    
    
    `
  );
  t.end();
});
