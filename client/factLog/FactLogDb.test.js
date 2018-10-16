const test = require('tape');
const Db = require('./FactLogDb');
const ast = require('./factLogAst');

function getFamilyDb() {
  const db = new Db();

  db.addClaim(ast.constantClaim({ name: '@ is father of @', args: ['Abe', 'Homer'] }));
  db.addClaim(ast.constantClaim({ name: '@ is father of @', args: ['Homer', 'Bart'] }));
  db.addClaim(ast.constantClaim({ name: '@ is father of @', args: ['Homer', 'Lisa'] }));

  db.addClaim(ast.constantClaim({ name: '@ has gender @', args: ['Homer', 'male'] }));
  db.addClaim(ast.constantClaim({ name: '@ has gender @', args: ['Bart', 'male'] }));
  db.addClaim(ast.constantClaim({ name: '@ has gender @', args: ['Lisa', 'female'] }));
  db.addClaim(ast.constantClaim({ name: '@ has gender @', args: ['Abe', 'male'] }));

  db.addClaim(ast.constantClaim({ name: '@ likes person @', args: ['Homer', 'Homer'] }));
  db.addClaim(ast.constantClaim({ name: '@ likes person @', args: ['Homer', 'Lisa'] }));

  return db;
}

test('simple query', t => {
  const db = getFamilyDb();
  const result = db.query([
    ast.claim({ name: '@ is father of @', args: [ast.constant('Homer'), ast.variable('child')] }),
  ]);

  t.deepEqual(result, [{ child: 'Bart' }, { child: 'Lisa' }]);
  t.end();
});

test('single join query', t => {
  const db = getFamilyDb();
  const result = db.query([
    ast.claim({ name: '@ is father of @', args: [ast.variable('x'), ast.variable('y')] }),
    ast.claim({ name: '@ is father of @', args: [ast.variable('y'), ast.variable('z')] }),
  ]);

  t.deepEqual(result, [{ x: 'Abe', y: 'Homer', z: 'Bart' }, { x: 'Abe', y: 'Homer', z: 'Lisa' }]);
  t.end();
});

test('double join query', t => {
  const db = getFamilyDb();
  const result = db.query([
    ast.claim({ name: '@ is father of @', args: [ast.variable('x'), ast.variable('y')] }),
    ast.claim({ name: '@ is father of @', args: [ast.variable('y'), ast.variable('z')] }),
    ast.claim({ name: '@ has gender @', args: [ast.variable('z'), ast.constant('female')] }),
  ]);

  t.deepEqual(result, [{ x: 'Abe', y: 'Homer', z: 'Lisa' }]);
  t.end();
});

test('query with equal constraints', t => {
  const db = getFamilyDb();
  const result = db.query([
    ast.claim({ name: '@ likes person @', args: [ast.variable('x'), ast.variable('x')] }),
  ]);

  t.deepEqual(result, [{ x: 'Homer' }]);
  t.end();
});

test('non primitive constants', t => {
  const db = getFamilyDb();
  const result = db.query([
    ast.claim({ name: '@ is father of @', args: [ast.constant({}), ast.variable('y')] }),
  ]);

  t.deepEqual(result, []);
  t.end();
});
