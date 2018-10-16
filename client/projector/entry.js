import parser from '../factLog/factLogDslParser';
import ast from '../factLog/factLogAst';
import evaluateProgram from './evaluateProgram';
import FactLogDb from '../factLog/FactLogDb';

const canvas = document.createElement('canvas');
canvas.width = document.width;
canvas.height = document.height;

document.body.appendChild(canvas);

const state = window.$state = {
  runningProgramsByNumber: {},
  claims: [],
  whens: [],
};

const programNamespace = Object.create(null);

programNamespace.__getClaimTagFunction = (source, isDynamic) => (literals, ...params) => {
  const claim = parser.parseClaim({ literals, params, source, isDynamic });
  state.claims.push(claim);
};

programNamespace.__getWishTagFunction = (source, isDynamic) => (literals, ...params) => {
  const claim = parser.parseWishClaim({ literals, params, source, isDynamic });
  state.claims.push(claim);
};

programNamespace.__getWhenTagFunction = (source, isDynamic) => (literals, ...params) => {
  const claims = parser.parseWhenClaims({ literals, params });

  return callback => {
    const when = ast.when({ claims, callback, isDynamic, source });
    state.whens.push(when);
  };
};

let counter = 0;

function main() {
  canvas.width = document.body.clientWidth;
  canvas.height = document.body.clientHeight;

  const programsToRun = JSON.parse(localStorage.paperProgramsProgramsToRender || '[]');
  //const markers = JSON.parse(localStorage.paperProgramsMarkers || '[]')

  updatePrograms(programsToRun);

  evaluateClaimsAndWhens();

  counter++;

  if (counter < 50) {
    setTimeout(main);
  }
}

main();

function updatePrograms(programsToRun) {
  const { runningProgramsByNumber, claims, whens } = state;

  const programsToRunByNumber = {};
  const programsToTerminateByNumber = {};
  const nextRunningProgramsByNumber = {};

  programsToRun.forEach(program => {
    programsToRunByNumber[program.number] = program;
  });

  // start new programs
  programsToRun.forEach(program => {
    if (!runningProgramsByNumber[program.number]) {
      nextRunningProgramsByNumber[program.number] = program;
      evaluateProgram.apply({ namespace: programNamespace, program }, program);
    }
  });

  // check if running programs should be terminated
  Object.keys(runningProgramsByNumber).forEach(programNumber => {
    if (!programsToRunByNumber[programNumber]) {
      programsToTerminateByNumber[programNumber] = runningProgramsByNumber[programNumber];
      return;
    }

    nextRunningProgramsByNumber[programNumber] = runningProgramsByNumber[programNumber];
  });

  state.whens = whens.filter(({ source }) => !programsToTerminateByNumber[source]);
  state.claims = claims.filter(({ source }) => !programsToTerminateByNumber[source]);
  state.runningProgramsByNumber = nextRunningProgramsByNumber;
}

function baseClaim(name, args) {
  return ast.constantClaim({ name, args, source: 'core' });
}

function evaluateClaimsAndWhens() {
  const db = new FactLogDb();

  state.claims.forEach(claim => {
    db.addClaim(claim);
  });

  // base claims

  db.addClaim(baseClaim('current time is @', [Date.now()]));

  Object.values(state.runningProgramsByNumber).forEach(program => {

    // base paper claims

    db.addClaim(baseClaim('@ is a @', [program.number, 'program']));
    db.addClaim(
      baseClaim('@ has corner points @', [
        program.number,
        {
          topLeft: program.points[0],
          topRight: program.points[0],
          bottomRight: program.points[0],
          bottomLeft: program.points[0],
        },
      ])
    );
    db.addClaim(baseClaim('@ has center point @', [program.number, program.points.center]));
  });

  // custom claims

  // reset dynamic claims / whens

  const currentWhens = state.whens.slice();
  state.whens = state.whens.filter(({ isDynamic}) => !isDynamic)
  state.claims = state.claims.filter(({ isDynamic }) => !isDynamic);

  // evaluate whens

  currentWhens.forEach(({ claims, callback }) => {
    const matches = db.query(claims);

    matches.forEach(match => callback(match));
  });
}
