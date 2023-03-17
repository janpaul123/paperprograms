/**
 * NodeJS script to read the paper programs from the configured database and store them locally.  This is generally
 * used to back up the paper programs and potentially store them in GitHub.
 *
 * @author John Blanco (PhET Interactive Simulations)
 */

const fs = require( 'fs' );

// Set up the DB connection.
const knex = require( 'knex' )( require( '../../knexfile' )[ process.env.NODE_ENV || 'development' ] );

// other constants
const LOCAL_STORAGE_DIRECTORY = 'paper-programs-backup';

// Verify that the location where the programs will be stored exists.
if ( !fs.existsSync( LOCAL_STORAGE_DIRECTORY ) ) {
  console.log( `Local backup directory ${LOCAL_STORAGE_DIRECTORY} not found, aborting.` );
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
      const playSpaceSubdirectory = `${LOCAL_STORAGE_DIRECTORY}/${playSpace}`;
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
        fs.writeFileSync( filePath, programInfoObject.currentCode );
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
  let title = firstLine.match( /[A-Za-z0-9].*$/ )[ 0 ];
  if ( title === undefined || title.length === 0 ) {
    title = '(no title found)';
  }
  return title;
};