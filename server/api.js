const express = require( 'express' );
const crypto = require( 'crypto' );
const restrictedSpacesList = require( './restrictedSpacesList.js' );

const router = express.Router();
router.use( express.json() );
router.use( require( 'nocache' )() );

const knex = require( 'knex' )( require( '../knexfile' )[ process.env.NODE_ENV || 'development' ] );

// Set a constant based on the .env file that will control whether access to restricted files will be allowed on the
// client side.
const ALLOW_ACCESS_TO_RESTRICTED_FILES = process.env.ALLOW_ACCESS_TO_RESTRICTED_FILES === 'true';

const editorHandleDuration = 1500;

/**
 * Get the current code for the specified space name and program number.
 */
router.get( '/program.:spaceName.:number.js', ( req, res ) => {
  const { spaceName, number } = req.params;
  knex
    .select( 'currentCode' )
    .from( 'programs' )
    .where( { spaceName, number } )
    .then( selectResult => {
      res.set( 'Content-Type', 'text/javascript;charset=UTF-8' );
      res.send( selectResult[ 0 ].currentCode );
    } );
} );

/**
 * Queries the database for program information in the requested spaces.
 *
 * TODO: It needs to extract specific information about the programs for the provided spaces like this:
 * Keywords, title, number
 *
 * {
 *   space: [
 *     {
 *       number: 'string'
 *       title: 'string'
 *       keywords: []
 *     },{
 *       ...
 *     }
 *   ]
 * }
 *
 * @param spacesList - A comma separated list of the space names to query, or '*' for all spaces.
 */
router.get( '/api/program-summary-list/:spacesList', ( req, res ) => {
  const { spacesList } = req.params;
  let summaryQuery = knex.select( [ 'currentCode', 'number', 'spaceName' ] ).from( 'programs' );

  const spaces = spacesList.split( ',' );
  if ( spacesList !== '*' ) {
    spaces.forEach( ( space, index ) => {
      if ( index === 0 ) {
        summaryQuery = summaryQuery.where( { spaceName: space } );
      }
      else {
        summaryQuery = summaryQuery.orWhere( { spaceName: space } );
      }
    } );
  }

  summaryQuery.then( selectResult => {
    res.json( selectResult );
  } );
} );

// Get a list of all the spaces available in the DB.
router.get( '/api/spaces-list', ( req, res ) => {
  knex
    .distinct()
    .from( 'programs' )
    .pluck( 'spaceName' )
    .then( spaceNames => {
      res.json( spaceNames );
    } )
    .catch( error => {
      console.log( `Error getting spaces list: ${error}` );
    } );
} );

// Add a new space to the DB.
router.get( '/api/add-space/:newSpaceName', ( req, res ) => {
  console.log( `req.params.newSpaceName = ${req.params.newSpaceName}` );
  res.json( req.params );

  // knex
  //   .distinct()
  //   .from('programs')
  //   .pluck('spaceName')
  //   .then(spaceNames => {
  //     res.json(spaceNames);
  //   });
} );

function getSpaceData( req, callback ) {
  const { spaceName } = req.params;
  knex( 'programs' )
    .select( 'number', 'originalCode', 'currentCode', 'printed', 'editorInfo' )
    .where( { spaceName } )
    .then( programData => {
      callback( {
        programs: programData.map( program => {
          const editorInfo = JSON.parse( program.editorInfo || '{}' );

          return {
            ...program,
            currentCodeUrl: `program.${spaceName}.${program.number}.js`,
            currentCodeHash: crypto
              .createHmac( 'sha256', '' )
              .update( program.currentCode )
              .digest( 'hex' ),
            debugUrl: `/api/spaces/${spaceName}/programs/${program.number}/debugInfo`,
            claimUrl: `/api/spaces/${spaceName}/programs/${program.number}/claim`,
            editorInfo: {
              ...editorInfo,
              claimed: !!( editorInfo.time && editorInfo.time + editorHandleDuration > Date.now() ),
              readOnly: !ALLOW_ACCESS_TO_RESTRICTED_FILES && restrictedSpacesList.includes( spaceName )
            },
            codeHasChanged: program.currentCode !== program.originalCode
          };
        } ),
        spaceName
      } );
    } );
}

router.get( '/api/spaces/:spaceName', ( req, res ) => {
  getSpaceData( req, spaceData => {
    res.json( spaceData );
  } );
} );

/**
 * Adds a new program to the database, assigning it a new unique number for the spacename.
 *
 * @param spaceName - The space to save the program to.
 */
const maxNumber = 8400 / 4;
router.post( '/api/spaces/:spaceName/programs', ( req, res ) => {
  const { spaceName } = req.params;

  // extract code from the request
  const { code } = req.body;
  if ( !code ) {
    res.status( 400 ).send( 'Missing "code"' );
  }

  knex
    .select( 'number' )
    .from( 'programs' )
    .where( { spaceName } )
    .then( selectResult => {
      const existingNumbers = selectResult.map( result => result.number );
      const potentialNumbers = [];
      for ( let i = 0; i < maxNumber; i++ ) {
        if ( !existingNumbers.includes( i ) ) {
          potentialNumbers.push( i );
        }
      }
      if ( potentialNumbers.length === 0 ) {
        res.status( 400 ).send( 'No more available numbers' );
      }
      const number = potentialNumbers[ Math.floor( Math.random() * potentialNumbers.length ) ];

      knex( 'programs' )
        .insert( {
          spaceName, number, originalCode: code, currentCode: code
        } )
        .then( () => {
          getSpaceData( req, spaceData => {
            res.json( { number, spaceData } );
          } );
        } );
    } );
} );

// Create a new snippet
const maxSnippets = 500;
router.post( '/api/snippets', ( req, res ) => {
  const { snippetCode } = req.body;
  if ( !snippetCode ) {
    res.status( 400 ).send( 'Missing "code"' );
  }

  knex
    .select( 'number' )
    .from( 'snippets' )
    .then( selectResult => {
      const nextNumber = selectResult.length + 1;
      if ( nextNumber > maxSnippets ) {
        res.status( 400 ).send( `Cannot make any more snippets, max ${maxSnippets}` );
      }

      knex( 'snippets' )
        .insert( { number: nextNumber, code: snippetCode } )
        .then( () => {
          res.json( { number: nextNumber, snippetCode: snippetCode } );
        } );
    } );
} );

// Save the program with the provided number to the provided space.
router.put( '/api/spaces/:spaceName/programs/:number', ( req, res ) => {
  const { spaceName, number } = req.params;
  const { code } = req.body;
  if ( !code ) {
    res.status( 400 ).send( 'Missing "code"' );
  }

  knex( 'programs' )
    .update( { currentCode: code } )
    .where( { spaceName, number } )
    .then( () => {
      res.json( {} );
    } );
} );

// Get all code snippets in the database
router.get( '/api/snippets', ( req, res ) => {
  knex
    .select( [ 'code', 'number' ] )
    .from( 'snippets' )
    .then( selectResult => {
      res.json( { snippets: selectResult } );
    } );
} );

// Save the snippet of the provided number
router.put( '/api/snippets/:number', ( req, res ) => {

  const { number } = req.params;
  const { snippetCode } = req.body;
  if ( !snippetCode ) {
    res.status( 400 ).send( 'Missing "snippetCode"' );
  }

  knex( 'snippets' )
    .update( { code: snippetCode } )
    .where( { number } )
    .then( () => {
      res.json( {} );
    } );
} );

router.post( '/api/spaces/:spaceName/programs/:number/markPrinted', ( req, res ) => {
  const { spaceName, number } = req.params;
  const { printed } = req.body;
  if ( printed === undefined ) {
    res.status( 400 ).send( 'Missing "printed"' );
  }

  knex( 'programs' )
    .update( { printed } )
    .where( { spaceName, number } )
    .then( () => {
      getSpaceData( req, spaceData => {
        res.json( spaceData );
      } );
    } );
} );

router.put( '/api/spaces/:spaceName/programs/:number/debugInfo', ( req, res ) => {
  const { spaceName, number } = req.params;

  knex( 'programs' )
    .update( { debugInfo: JSON.stringify( req.body ) } )
    .where( { spaceName, number } )
    .then( () => {
      res.json( {} );
    } );
} );

router.post( '/api/spaces/:spaceName/programs/:number/claim', ( req, res ) => {
  const { spaceName, number } = req.params;

  knex
    .select( [ 'debugInfo', 'editorInfo' ] )
    .from( 'programs' )
    .where( { spaceName, number } )
    .then( selectResult => {
      if ( selectResult.length === 0 ) {
        res.status( 404 );
      }
      const editorInfo = JSON.parse( selectResult[ 0 ].editorInfo || '{}' );
      if (
        editorInfo.time &&
        editorInfo.time + editorHandleDuration > Date.now() &&
        editorInfo.editorId !== req.body.editorId
      ) {
        res.status( 400 );
        res.json( {} );
      }
      else {
        knex( 'programs' )
          .update( { editorInfo: JSON.stringify( { ...req.body, time: Date.now() } ) } )
          .where( { spaceName, number } )
          .then( () => {
            res.json( {
              debugInfo: JSON.parse( selectResult[ 0 ].debugInfo || '{}' ),
              editorInfo
            } );
          } );
      }
    } );
} );

module.exports = router;