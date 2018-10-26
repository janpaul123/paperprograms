import errorStackParser from 'error-stack-parser';
import xhr from 'xhr';
import { mult } from '../utils';
import parser from '../factLog/factLogDslParser';
import ast from '../factLog/factLogAst';
import evaluateProgram from './evaluateProgram';
import FactLogDb from '../factLog/FactLogDb';
import once from 'lodash/once';
const acorn = require('acorn');

const state = (window.$state = {
  runningProgramsByNumber: {},
  claims: [],
  whens: [],
  errors: [],
  matches: [],
  logs: [],
});

const ghostPages = [
  getGhostPage('canvas', require('./core/canvas.js')),
  getGhostPage('geometry', require('./core/geometry.js')),
  getGhostPage('whisker', require('./core/whisker.js')),
  getGhostPage('illumination', require('./core/illumination.js')),
  getGhostPage('labeller', require('./core/labeller.js')),
  getGhostPage('outline', require('./core/outline.js')),
  getGhostPage('persistentState', require('./core/persistentState.js')),
];

function getGhostPage(name, fn) {
  return {
    isGhostPage: true,
    number: name,
    currentCode: `(${fn.toString()})();`,
  };
}

const currentHashesByProgram = {};

setInterval(() => {
  xhr.get(`/api/spaces/${window.__SPACE_HASH__}`, { json: true }, (error, response) => {
    if (error) {
      console.error(error); // eslint-disable-line no-console
    } else {
      response.body.programs.forEach(({ number, currentCodeHash }) => {
        currentHashesByProgram[number] = currentCodeHash;
      });
    }
  });
}, 500);

function getGhostPages(programs) {
  if (!window.__GHOST_PAGES__) {
    return ghostPages;
  }

  return window.__GHOST_PAGES__
    .map(number => {
      return {
        number,
        currentCodeUrl: `program.${window.__SPACE_HASH__}.${number}.js`,
        currentCodeHash: currentHashesByProgram[number],
        debugUrl: `/api/spaces/${window.__SPACE_HASH__}/programs/${number}/debugInfo`,
      };
    })
    .filter(({ number }) => !programs.some(p => p.number === number))
    .concat(getGhostPage('canvas', require('./core/canvas.js')));
}

function reportError({ source, isDynamic, error }) {
  const stackFrame = errorStackParser.parse(error);

  // eslint-disable-next-line no-console
  console.error(`error from ${source}: ${error}`);

  state.errors.push({
    source,
    isDynamic,
    message: error.message,
    isInFile: stackFrame[0].fileName.endsWith(`${source}.js`),
    lineNumber: stackFrame[0].lineNumber,
    columnNumber: stackFrame[0].columnNumber,
  });
}

function reportErrorMessage({
  source,
  isDynamic,
  message,
  isInFile = true,
  lineNumber,
  columnNumber,
}) {
  // eslint-disable-next-line no-console
  console.error(`error from ${source}: ${message}`);

  state.errors.push({
    source,
    isDynamic,
    isInFile,
    message,
    lineNumber,
    columnNumber,
  });
}

const programHelperFunctions = {
  getClaimTagFunction: ({ source, isDynamic }) => (literals, ...params) => {
    const claim = parser.parseClaim({ literals, params, source, isDynamic });
    state.claims.push(claim);
  },

  getWishTagFunction: ({ source, isDynamic }) => (literals, ...params) => {
    const claim = parser.parseWishClaim({ literals, params, source, isDynamic });
    state.claims.push(claim);
  },

  getWhenTagFunction: ({ source, isDynamic, groupMatches }) => (literals, ...params) => {
    const stackFrame = errorStackParser.parse(new Error());
    const originalCall = stackFrame.find(({ fileName }) => fileName.endsWith(`${source}.js`));

    const claims = parser.parseWhenClaims({ literals, params });

    return callback => {
      const when = ast.when({ claims, callback, isDynamic, source, groupMatches });

      if (originalCall) {
        when.lineNumber = originalCall.lineNumber;
      }

      state.whens.push(when);
    };
  },

  getLogFunction: ({ source, isDynamic }) => (...values) => {
    const stackFrame = errorStackParser.parse(new Error());
    const originalCall = stackFrame.find(({ fileName }) => fileName.endsWith(`${source}.js`));

    if (!originalCall) {
      return;
    }

    state.logs.push({ source, values, lineNumber: originalCall.lineNumber, isDynamic });
  },
  reportError,
  reportErrorMessage,
  acorn,
};

function main() {
  const programsToRun = getProgramsToRun();
  //const markers = JSON.parse(localStorage.paperProgramsMarkers || '[]')

  updatePrograms(programsToRun);

  evaluateClaimsAndWhens();

  requestAnimationFrame(main);
}

main();

function getProgramsToRun() {
  const programs = JSON.parse(localStorage.paperProgramsProgramsToRender || '[]');
  const result = getGhostPages(programs).concat(programs);
  return result;
}

function updatePrograms(programsToRun) {
  const { runningProgramsByNumber, claims, whens, errors, matches, logs } = state;

  const programsToRunByNumber = {};
  const programsToClearByNumber = {};
  const nextRunningProgramsByNumber = {};

  programsToRun.forEach(program => {
    programsToRunByNumber[program.number] = program;
  });

  programsToRun.forEach(program => {
    // start program if new
    if (!runningProgramsByNumber[program.number]) {
      nextRunningProgramsByNumber[program.number] = program;

      evaluateProgram.apply({ ...programHelperFunctions, program }, program);

      // restart program if code has changed
    } else if (
      program.currentCodeHash !== runningProgramsByNumber[program.number].currentCodeHash
    ) {
      nextRunningProgramsByNumber[program.number] = program;
      programsToClearByNumber[program.number] = program;
      evaluateProgram.apply({ ...programHelperFunctions, program }, program);
    }
  });

  // check if running programs should be terminated
  Object.keys(runningProgramsByNumber).forEach(programNumber => {
    if (!programsToRunByNumber[programNumber]) {
      programsToClearByNumber[programNumber] = runningProgramsByNumber[programNumber];
      return;
    }

    nextRunningProgramsByNumber[programNumber] = programsToRunByNumber[programNumber];
  });

  state.whens = whens.filter(({ source }) => !programsToClearByNumber[source]);
  state.claims = claims.filter(({ source }) => !programsToClearByNumber[source]);
  state.errors = errors.filter(({ source }) => !programsToClearByNumber[source]);
  state.matches = matches.filter(({ source }) => !programsToClearByNumber[source]);
  state.logs = logs.filter(({ source }) => !programsToClearByNumber[source]);

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
  db.addClaim(baseClaim('@ is a @', ['table', 'supporter']));
  db.addClaim(
    baseClaim('@ has corner points @', [
      'table',
      {
        topLeft: { x: 0, y: 0 },
        topRight: { x: document.body.clientWidth, y: 0 },
        bottomRight: { x: document.body.clientWidth, y: document.body.clientHeight },
        bottomLeft: { x: 0, y: document.body.clientHeight },
      },
    ])
  );

  const multPoint = { x: document.body.clientWidth, y: document.body.clientHeight };

  Object.values(state.runningProgramsByNumber).forEach(program => {
    // base paper claims

    if (program.codeHasChanged) {
      db.addClaim(baseClaim('@ has changed code', [program.number]));
    }

    db.addClaim(baseClaim('@ is a @', [program.number, 'program']));
    db.addClaim(baseClaim('@ is on supporter @', [program.number, 'table']));

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
    }
  });

  // custom claims

  // reset dynamic claims, whens and errors

  const currentWhens = state.whens.slice();
  state.whens = state.whens.filter(({ isDynamic }) => !isDynamic);
  state.claims = state.claims.filter(({ isDynamic }) => !isDynamic);
  state.errors = state.errors.filter(({ isDynamic }) => !isDynamic);
  state.logs = state.logs.filter(({ isDynamic }) => !isDynamic);
  state.matches = [];

  // evaluate whens

  currentWhens.forEach(({ source, claims, callback, groupMatches, lineNumber }) => {
    const matches = db.query(claims);

    if (lineNumber !== undefined) {
      state.matches.push({ source, count: matches.length, lineNumber });
    }

    try {
      if (groupMatches) {
        callback(matches);
        return;
      }

      matches.forEach(match => callback(match));
    } catch (error) {
      reportError({ source, isDynamic: true, error });
    }
  });
}

// error reporting

setInterval(() => {
  Object.values(state.runningProgramsByNumber)
    .filter(({ isGhostPage }) => !isGhostPage)
    .forEach(program => {
      const debugData = {
        matches: state.matches.filter(({ source }) => source === program.number),
        errors: state.errors.filter(({ source }) => source === program.number),
        logs: state.logs.filter(({ source }) => source === program.number),
      };

      xhr.put(program.debugUrl, { json: debugData }, () => {});
    });
}, 300);
