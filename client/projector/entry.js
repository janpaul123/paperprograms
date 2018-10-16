import { mult } from '../utils';
import parser from '../factLog/factLogDslParser';
import ast from '../factLog/factLogAst';
import evaluateProgram from './evaluateProgram';
import FactLogDb from '../factLog/FactLogDb';

const canvas = document.createElement('canvas');
canvas.width = document.width;
canvas.height = document.height;

document.body.appendChild(canvas);

const state = (window.$state = {
  runningProgramsByNumber: {},
  claims: [],
  whens: [],
});

const ghostPages = [getGhostPage('illumination', require('./core/illumination.js'))];

function getGhostPage(name, fn) {
  return {
    number: name,
    currentCode: `(${fn.toString()})();`,
  };
}

const programNamespace = Object.create(null);

programNamespace.__getClaimTagFunction = ({ source, isDynamic }) => (literals, ...params) => {
  const claim = parser.parseClaim({ literals, params, source, isDynamic });
  state.claims.push(claim);
};

programNamespace.__getWishTagFunction = ({ source, isDynamic }) => (literals, ...params) => {
  const claim = parser.parseWishClaim({ literals, params, source, isDynamic });
  state.claims.push(claim);
};

programNamespace.__getWhenTagFunction = ({ source, isDynamic, groupMatches }) => (
  literals,
  ...params
) => {
  const claims = parser.parseWhenClaims({ literals, params });

  return callback => {
    const when = ast.when({ claims, callback, isDynamic, source, groupMatches });
    state.whens.push(when);
  };
};

let counter = 0;
let RUN_FOREVER = true;

function main() {
  canvas.width = document.body.clientWidth;
  canvas.height = document.body.clientHeight;
  programNamespace.canvas = canvas;

  const programsToRun = getProgramsToRun();
  //const markers = JSON.parse(localStorage.paperProgramsMarkers || '[]')

  updatePrograms(programsToRun);

  evaluateClaimsAndWhens();

  counter++;

  if (RUN_FOREVER || counter < 50) {
    setTimeout(main);
  }
}

main();

function getProgramsToRun() {
  const programs = JSON.parse(localStorage.paperProgramsProgramsToRender || '[]');

  return programs.concat(ghostPages);
}

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

    nextRunningProgramsByNumber[programNumber] = programsToRunByNumber[programNumber];
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

  const multPoint = { x: document.body.clientWidth, y: document.body.clientHeight };

  Object.values(state.runningProgramsByNumber).forEach(program => {
    // base paper claims

    db.addClaim(baseClaim('@ is a @', [program.number, 'program']));

    if (program.points) {
      db.addClaim(
        baseClaim('@ has corner points @', [
          program.number,
          {
            topLeft: mult(program.points[0], multPoint),
            topRight: mult(program.points[1], multPoint),
            bottomRight: mult(program.points[2], multPoint),
            bottomLeft: mult(program.points[3], multPoint),
          },
        ])
      );
      db.addClaim(baseClaim('@ has center point @', [program.number, program.points.center]));
    }
  });

  // custom claims

  // reset dynamic claims / whens

  const currentWhens = state.whens.slice();
  state.whens = state.whens.filter(({ isDynamic }) => !isDynamic);
  state.claims = state.claims.filter(({ isDynamic }) => !isDynamic);

  // evaluate whens

  currentWhens.forEach(({ claims, callback, groupMatches }) => {
    const matches = db.query(claims);

    if (groupMatches) {
      callback(matches);
      return;
    }

    matches.forEach(match => callback(match));
  });
}
