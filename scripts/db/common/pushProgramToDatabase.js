/**
 * Function for pushing a local paper program to the shared database.
 *
 * @author John Blanco (PhET Interactive Simulations)
 */

/**
 * Push the provided code to the specified space and program number.
 * @param {string} spaceName
 * @param {string|number} programNumber
 * @param {string} programCode
 * @param {Object} knex - DB connection
 */
const pushProgramToDatabase = async ( spaceName, programNumber, programCode, knex ) => {

  console.log( `pushProgramToDatabase called, spaceName = ${spaceName}, programNumber = ${programNumber}` );

  try {

    // Make sure the space exists.
    const spaceInfo = await knex( 'programs' )
      .select( [ 'number' ] )
      .where( { spaceName } );
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
      return;
      // process.exit( 1 );
    }

    if ( programInfo.length === 0 ) {

      // This program wasn't found in the DB.  That most likely means that it was accidentally deleted and this is a
      // restore operation.
      console.log( `  Adding new paper program ${programNumber} to space ${spaceName}.` );
      knex( 'programs' )
        .insert( {
          spaceName,
          number: programNumber,
          currentCode: programCode,
          originalCode: programCode
        } );
    }
    else if ( programInfo[ 0 ].currentCode !== programCode ) {

      // The local program content is different from what is in the DB, so push the local content.
      await knex( 'programs' )
        .update( { currentCode: programCode } )
        .where( { spaceName, number: programNumber } );
    }
    else {
      console.log( 'The source file and the code in the DB are the same, skipping update.' );
    }

    return;
    // process.exit();
  }
  catch( e ) {
    console.log( `  Error adding program to DB:  = ${e}` );
  }

};

module.exports = pushProgramToDatabase;