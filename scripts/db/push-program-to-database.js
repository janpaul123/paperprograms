/**
 * NodeJS script to push a local copy of a paper program to the shared DB.  This is generally used to restore a lost
 * program or to push changes made locally to the shared database.
 *
 * IMPORTANT NOTE: This script must be run from the top level of the repo if you want to use the URL in the .env file.
 * Example Usage:
 *
 *   node scripts/db/push-program-to-database.js shared-experiments 275 ./paper-programs-backup
 *
 * @author John Blanco (PhET Interactive Simulations)
 */

const fs = require( 'fs' );

const USAGE_STRING = 'Usage: node push-program-to-database.js <space-name> <program-number> <path-to-backup-dir>';

// Make sure the correct number of arguments were supplied.
if ( process.argv.length !== 5 || ( process.argv.length >= 3 && process.argv[ 2 ][ 0 ] === '-' ) ) {
  console.log( USAGE_STRING );
  process.exit( 1 );
}

// Extract arguments.
const spaceName = process.argv[ 2 ];
const programNumber = process.argv[ 3 ];
let pathToBackupDirectory = process.argv[ 4 ];

if ( pathToBackupDirectory.charAt( pathToBackupDirectory.length - 1 ) === '/' ) {
  pathToBackupDirectory = pathToBackupDirectory.substring( 0, pathToBackupDirectory.length - 1 );
}

// Log startup info.
console.log( `\nAttempting to push program number ${programNumber} to space ${spaceName}` );

// Set up the DB connection.
const knex = require( 'knex' )( require( '../../knexfile' )[ process.env.NODE_ENV || 'development' ] );

// Compose the path to the source file from the provided information.
const sourceFilePath = `${pathToBackupDirectory}/${spaceName}/${programNumber}.js`;

// Verify that the source location for the program exists.
if ( !fs.existsSync( sourceFilePath ) ) {
  console.log( `  Source file not found: ${sourceFilePath}, aborting.` );
  process.exit( 1 );
}

// Read the contents of the source file.
const sourceFileContents = fs.readFileSync( sourceFilePath, 'utf-8' );

// Read the information from the DB and store it on the local file system.  This uses async options, so it needs to be
// enclosed in an async function.
( async () => {

  try {

    // Make sure the space exists.  It's not possible to create a new one using this script.
    const spaceInfo = await knex( 'programs' )
      .select( [ 'number' ] )
      .where( { spaceName } );
    console.log( `spaceInfo = ${spaceInfo}` );
    if ( spaceInfo.length === 0 ) {
      console.log( `  Error: Specified space ${spaceName} does not exist in DB, aborting.` );
    }

    // Get the current version of the code from the DB.
    const programInfo = await knex
      .select( [ 'currentCode' ] )
      .from( 'programs' )
      .where( { spaceName, number: programNumber } );

    // There should be at most one match in the DB.  If there are more, something is wrong.
    if ( programInfo.length > 1 ) {
      console.error( `  Expected at most one matching program, found ${programInfo.length}, aborting.` );
      process.exit( 1 );
    }

    if ( programInfo.length === 0 ) {

      // This program wasn't found in the DB.  That most likely means that it was accidentally deleted and this is a
      // restore operation.
      console.log( `  Adding new paper program ${programNumber} to space ${spaceName}.` );
      knex( 'programs' )
        .insert( {
          spaceName,
          number: programNumber,
          currentCode: sourceFileContents,
          originalCode: sourceFileContents
        } );
    }
    else if ( programInfo[ 0 ].currentCode !== sourceFileContents ) {

      // The local program content is different from what is in the DB, so push the local content.
      await knex( 'programs' )
        .update( { currentCode: sourceFileContents } )
        .where( { spaceName, number: programNumber } );
    }
    else {
      console.log( 'The source file and the code in the DB are the same, skipping update.' );
    }

    process.exit();
  }
  catch( e ) {
    console.log( `  Error:  = ${e}` );
  }

  // Close the database connection.
  console.log( '  Terminating DB connection.' );
  await knex.destroy();
  console.log( 'Done.' );
} )();