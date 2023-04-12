/**
 * NodeJS script to read the paper programs from the configured database and store them locally.  This is generally
 * used to back up the paper programs and potentially store them in GitHub.
 *
 * IMPORTANT NOTE: This script must be run from the top level of the repo if you want to use the URL in the .env file.
 * Example Usage:
 *
 *   node scripts/db/get-programs-from-database.js paper-programs-backup
 *
 * @author John Blanco (PhET Interactive Simulations)
 */

const fs = require( 'fs' );
const os = require( 'os' );

const USAGE_STRING = 'Usage: node get-programs-from-db.js <path-to-backup-dir>';

// Make sure the correct number of arguments were supplied.
if ( process.argv.length !== 3 || ( process.argv.length === 3 && process.argv[ 2 ][ 0 ] === '-' ) ) {
  console.log( USAGE_STRING );
  process.exit( 1 );
}

// Helper function to fix end-of-line issues so that this works on any OS.
const fixEOL = string => string.split( '\r' ).join( '' ).split( '\n' ).join( os.EOL );

const pathToBackupDirectory = process.argv[ 2 ];

// Set up the DB connection.
const knex = require( 'knex' )( require( '../../knexfile' )[ process.env.NODE_ENV || 'development' ] );

// Verify that the location where the programs will be stored exists.
if ( !fs.existsSync( pathToBackupDirectory ) ) {
  console.log( `Local backup directory ${pathToBackupDirectory} not found, aborting.` );
  process.exit( 1 );
}

// Read the information from the DB and store it on the local file system.  This uses async options, so it needs to be
// enclosed in an async function.
( async () => {

  console.log( 'Reading paper programs from DB...' );
  console.log( `  DB URL =  ${process.env.DATABASE_URL}` );

  try {

    // Get a list of all the "play spaces" in the DB.
    const playSpaces = await knex
      .distinct()
      .from( 'programs' )
      .pluck( 'spaceName' );

    console.log( `  Found ${playSpaces.length} play spaces` );

    for ( const playSpace of playSpaces ) {

      // Check if the subdirectory for this play space exists and, if not, create it.
      const playSpaceSubdirectory = `${pathToBackupDirectory}/${playSpace}`;
      if ( !fs.existsSync( playSpaceSubdirectory ) ) {
        fs.mkdirSync( playSpaceSubdirectory );
      }

      console.log( `  Getting programs in playSpace ${playSpace}` );

      const programInfo = await knex
        .select( [ 'number', 'currentCode' ] )
        .from( 'programs' )
        .where( { spaceName: playSpace } );

      programInfo.forEach( programInfoObject => {
        console.log( `    Getting program #${programInfoObject.number}, "${extractTitleFromCode( programInfoObject.currentCode )}"` );
        const filePath = `${playSpaceSubdirectory}/${programInfoObject.number.toString()}.js`;
        fs.writeFileSync( filePath, fixEOL( programInfoObject.currentCode ) );
      } );
    }
  }
  catch( e ) {
    console.log( `  Error:  = ${e}` );
  }

  // Close the database connection.
  console.log( '  Terminating DB connection.' );
  await knex.destroy();
  console.log( 'Done.' );
} )();

/**
 * Helper function to extract the title from a string representing a paper program.  In paper programs, the first line
 * should be a comment with the title name.  If no title is found, a default string is returned.
 * @param {string} paperProgramCode
 * @returns {string}
 */
const extractTitleFromCode = paperProgramCode => {
  let endOfFirstLine = paperProgramCode.indexOf( '\n' );
  if ( endOfFirstLine === -1 ) {
    endOfFirstLine = paperProgramCode.length;
  }
  const firstLine = paperProgramCode.substring( 0, endOfFirstLine );
  let title = ( firstLine.match( /[A-Za-z0-9].*$/ ) || [] )[ 0 ];
  if ( title === undefined || title.length === 0 ) {
    title = '(no title found)';
  }
  return title;
};