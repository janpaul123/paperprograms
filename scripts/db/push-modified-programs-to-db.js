/**
 * NodeJS script to push all local paper programs that, according to git, have been modified, to the shared database.
 *
 * IMPORTANT NOTE: This script must be run from the top level of the repo if you want to use the URL in the .env file.
 * Example Usage:
 *
 *   node scripts/db/push-modified-programs-to-db.js ./paper-programs-backup
 *
 * @author John Blanco (PhET Interactive Simulations)
 */

const pushProgramToDatabase = require( './common/pushProgramToDatabase.js' );
const { execSync } = require( 'child_process' );
const fs = require( 'fs' );

const USAGE_STRING = 'Usage: node push-modified-programs-to-db.js <path-to-local-programs-dir>';

// Make sure the correct number of arguments were supplied.
if ( process.argv.length !== 3 || ( process.argv.length >= 3 && process.argv[ 2 ][ 0 ] === '-' ) ) {
  console.log( USAGE_STRING );
  process.exit( 1 );
}

// Extract arguments.
let pathToLocalProgramsDirectory = process.argv[ 2 ];

// Add a trailing space to the directory path if needed.
if ( pathToLocalProgramsDirectory.charAt( pathToLocalProgramsDirectory.length - 1 ) !== '/' ) {
  pathToLocalProgramsDirectory += '/';
}

// Verify that the paper programs directory exists.
if ( !fs.existsSync( pathToLocalProgramsDirectory ) ) {
  console.log( `Paper program directory ${pathToLocalProgramsDirectory} not found, aborting.` );
  process.exit( 1 );
}

// Get a list of all modified files according to git.  This lists ALL modified files, not just the paper programs.
let modifiedFiles = execSync( 'git diff --name-only' ).toString().split( '\n' );

// Filter out zero-length strings, which are sometimes included in the response to the git command.
modifiedFiles = modifiedFiles.filter( fileName => fileName.length > 0 );

// Paper programs are stored in a directory structure where there is a root, then the space names, then each program
// name is a number.  For example, the path from the root of the repo should look something like this:
//
//   paper-programs-backup/templates/244.js
//
// The following code filters out any modified files that don't match this format.
const modifiedPaperPrograms = modifiedFiles.filter( filePath => {

  const pathElements = filePath.split( '/' );
  const fileName = pathElements[ pathElements.length - 1 ];
  const fileStem = fileName.split( '.' )[ 0 ];

  // Make sure the file name is a number.
  const fileNameIsNumber = !isNaN( fileStem );

  // Make sure the parent directory for the file exists in the backup space.
  const parentDirName = pathElements[ pathElements.length - 2 ];
  const parentDirExistsInLocalArea = parentDirName && fs.existsSync( `${pathToLocalProgramsDirectory}${parentDirName}` );

  return fileNameIsNumber && parentDirExistsInLocalArea;
} );

if ( modifiedPaperPrograms.length === 0 ) {
  console.log( 'No modified paper programs found, aborting.' );
  process.exit();
}
else {
  console.log( `Found ${modifiedPaperPrograms.length} modified program(s), preparing to push to DB.` );
}

( async () => {

  // Set up the DB connection.
  const knex = require( 'knex' )( require( '../../knexfile' )[ process.env.NODE_ENV || 'development' ] );

  // Push each modified paper program to the DB.
  for ( const modifiedPaperProgram of modifiedPaperPrograms ) {
    console.log( `  Pushing ${modifiedPaperProgram}` );
    const pathElements = modifiedPaperProgram.split( '/' );
    const fileName = pathElements[ pathElements.length - 1 ];
    const programNumber = fileName.split( '.' )[ 0 ];
    const spaceName = pathElements[ pathElements.length - 2 ];
    const pathToPaperProgram = `${pathToLocalProgramsDirectory}${spaceName}/${fileName}`;
    const programCode = fs.readFileSync( pathToPaperProgram, 'utf-8' );
    await pushProgramToDatabase( spaceName, programNumber, programCode, knex );
  }

  // Close the database connection.
  console.log( '  Terminating DB connection.' );
  await knex.destroy();
  console.log( 'Done.' );
} )();