const test = require('tape');
const Db = require('./FactLogDb');
const ast = require('./factLogAst');

function getFamilyDb() {
  const db = new Db();

  db.addClaim(ast.constantClaim('@ is father of @', ['Abe', 'Homer']));
  db.addClaim(ast.constantClaim('@ is father of @', ['Homer', 'Bart']));
  db.addClaim(ast.constantClaim('@ is father of @', ['Homer', 'Lisa']));

  db.addClaim(ast.constantClaim('@ has gender @', ['Homer', 'male']));
  db.addClaim(ast.constantClaim('@ has gender @', ['Bart', 'male']));
  db.addClaim(ast.constantClaim('@ has gender @', ['Lisa', 'female']));
  db.addClaim(ast.constantClaim('@ has gender @', ['Abe', 'male']));

  db.addClaim(ast.constantClaim('@ likes person @', ['Homer', 'Homer']));
  db.addClaim(ast.constantClaim('@ likes person @', ['Homer', 'Lisa']));

  return db;
}

test('simple query', t => {
  const db = getFamilyDb();
  const result = db.query([
    ast.claim('@ is father of @', [ast.constant('Homer'), ast.variable('child')]),
  ]);

  t.deepEqual(result, [{ child: 'Bart' }, { child: 'Lisa' }]);
  t.end();
});

test('single join query', t => {
  const db = getFamilyDb();
  const result = db.query([
    ast.claim('@ is father of @', [ast.variable('x'), ast.variable('y')]),
    ast.claim('@ is father of @', [ast.variable('y'), ast.variable('z')]),
  ]);

  t.deepEqual(result, [{ x: 'Abe', y: 'Homer', z: 'Bart' }, { x: 'Abe', y: 'Homer', z: 'Lisa' }]);
  t.end();
});

test('double join query', t => {
  const db = getFamilyDb();
  const result = db.query([
    ast.claim('@ is father of @', [ast.variable('x'), ast.variable('y')]),
    ast.claim('@ is father of @', [ast.variable('y'), ast.variable('z')]),
    ast.claim('@ has gender @', [ast.variable('z'), ast.constant('female')]),
  ]);

  t.deepEqual(result, [{ x: 'Abe', y: 'Homer', z: 'Lisa' }]);
  t.end();
});

test('query with equal constraints', t => {
  const db = getFamilyDb();
  const result = db.query([ast.claim('@ likes person @', [ast.variable('x'), ast.variable('x')])]);

  t.deepEqual(result, [{ x: 'Homer' }]);
  t.end();
});

test('non primitive constants', t => {
  const db = getFamilyDb();
  const result = db.query([ast.claim('@ is father of @', [ast.constant({}), ast.variable('y')])]);

  t.deepEqual(result, []);
  t.end();
});