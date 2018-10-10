const test = require('tape');
const parser = require('./factLogDslParser');
const dsl = require('./factLogAst');

function When(literals, ...args) {
  return parser.parseWhen(literals, args);
}

function Claim(literals, ...args) {
  return parser.parseClaim(literals, args);
}

test('claim: parse string', t => {
  t.deepEqual(
    Claim`${'Homer'} is father of ${'Bart'}`,
    dsl.claim('@ is father of @', [dsl.constant('Homer'), dsl.constant('Bart')])
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

test('when: parse string', t => {
  t.deepEqual(
    When`${'Homer'} is father of {child}`,
    dsl.when([dsl.claim('@ is father of @', [dsl.constant('Homer'), dsl.variable('child')])])
  );

  t.end();
});

test('when: parse with joins', t => {
  t.deepEqual(
    When`{x} is father of {y}, {y} is father of {z}`,
    dsl.when([
      dsl.claim('@ is father of @', [dsl.variable('x'), dsl.variable('y')]),
      dsl.claim('@ is father of @', [dsl.variable('y'), dsl.variable('z')]),
    ])
  );

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
