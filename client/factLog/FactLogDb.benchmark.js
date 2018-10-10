// basic benchmark emulation paper programs environment with 100 papers
//
// baseline: 24 ms
// use index lookup: 16 ms
// new ast structure: 17 ms

const Db = require('./FactLogDb');
const ast = require('./factLogAst');

let minTime = Infinity;

for (let iter = 0; iter < 50; iter++) {
  let timestamp = Date.now();

  const db = getPaperProgramsDb();

  for (let you = 0; you < 100; you++) {
    db.query([
      ast.claim('@ contains markers @', [ast.constant(you), ast.variable('markers')]),
      ast.claim('@ is on supporter @', [ast.constant(you), ast.variable('supporter')]),
      ast.claim('@ has center point @', [ast.constant(you), ast.variable('point')]),
    ]);

    db.query([
      ast.claim('@ is a @', [ast.variable('paper'), ast.constant('paper')]),
      ast.claim('@ has center point @', [ast.variable('paper'), ast.variable('otherPoint')]),
    ]);
  }

  if (minTime > Date.now() - timestamp) {
    minTime = Date.now() - timestamp;
  }
}

// eslint-disable-next-line no-console
console.log('query duration', minTime);

function getPaperProgramsDb() {
  const db = new Db();
  db.addClaim(ast.constantClaim('@ is a @', ['table', 'supporter']));
  db.addClaim(ast.constantClaim('@ has width @', ['table', Math.random()]));
  db.addClaim(ast.constantClaim('@ has height @', ['table', Math.random()]));
  db.addClaim(ast.constantClaim('@ contains markers @', ['table', randomPoints()]));

  for (let i = 0; i < 100; i++) {
    db.addClaim(ast.constantClaim('@ is a @', [i, 'paper']));
    db.addClaim(ast.constantClaim('@ has width @', [i, Math.random()]));
    db.addClaim(ast.constantClaim('@ has height @', [i, Math.random()]));
    db.addClaim(
      ast.constantClaim('@ has corner points @', [
        i,
        {
          top: randomPoint(),
          left: randomPoint(),
          bottom: randomPoint(),
          right: randomPoint(),
        },
      ])
    );
    db.addClaim(ast.constantClaim('@ has center point @', [i, randomPoint()]));
    db.addClaim(ast.constantClaim('@ is on supporter @', [i, 'table']));
    db.addClaim(ast.constantClaim('@ contains markers @', [i, randomPoints()]));
  }

  return db;
}

function randomPoint() {
  return { x: Math.random(), y: Math.random() };
}

function randomPoints() {
  const points = [randomPoint()];

  while (Math.random() < 0.9) {
    points.push(randomPoint());
  }

  return points;
}
