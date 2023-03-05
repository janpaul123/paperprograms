import Matrix from 'node-matrices';

export function norm( vector ) {
  if ( vector.x !== undefined ) {
    return norm( [ vector.x, vector.y ] );
  }
  return Math.sqrt( vector.reduce( ( sum, value ) => sum + value * value, 0 ) );
}

export function add( v1, v2 ) {
  if ( v1.x !== undefined ) {
    return { x: v1.x + v2.x, y: v1.y + v2.y };
  }
  return v1.map( ( value, index ) => value + v2[ index ] );
}

export function diff( v1, v2 ) {
  if ( v1.x !== undefined ) {
    return { x: v1.x - v2.x, y: v1.y - v2.y };
  }
  return v1.map( ( value, index ) => value - v2[ index ] );
}

export function mult( v1, v2 ) {
  if ( v1.x !== undefined ) {
    return { x: v1.x * v2.x, y: v1.y * v2.y };
  }
  return v1.map( ( value, index ) => value * v2[ index ] );
}

export function div( v1, v2 ) {
  if ( v1.x !== undefined ) {
    return { x: v1.x / v2.x, y: v1.y / v2.y };
  }
  return v1.map( ( value, index ) => value / v2[ index ] );
}

export function cross( v1, v2 ) {
  if ( v1.x === undefined || v2.x === undefined ) {
    throw new Error( 'Must be points' );
  }
  return v1.x * v2.y - v1.y * v2.x;
}

export function clamp( value, min, max ) {
  return Math.max( min, Math.min( max, value ) );
}

export function isMac() {
  return navigator.platform.toUpperCase().indexOf( 'MAC' ) >= 0;
}

// For "Save" buttons, which include hotkey info that depend on platform.
export function getSaveString() {
  return `Save (${isMac() ? 'cmd' : 'ctrl'}+s)`;
}

export function moveAlongVector( amount, vector ) {
  const size = norm( vector );
  return { x: amount * vector.x / size, y: amount * vector.y / size };
}

export function shrinkPoints( amount, points ) {
  return [ 0, 1, 2, 3 ].map( index => {
    const point = points[ index ];
    const nextPoint = points[ ( index + 1 ) % 4 ];
    const prevPoint = points[ ( index - 1 + 4 ) % 4 ];
    return add(
      add( point, moveAlongVector( amount, diff( nextPoint, point ) ) ),
      moveAlongVector( amount, diff( prevPoint, point ) )
    );
  } );
}

// Per http://graphics.cs.cmu.edu/courses/15-463/2008_fall/Papers/proj.pdf
export function forwardProjectionMatrixForPoints( points ) {
  const deltaX1 = points[ 1 ].x - points[ 2 ].x;
  const deltaX2 = points[ 3 ].x - points[ 2 ].x;
  const sumX = points[ 0 ].x - points[ 1 ].x + points[ 2 ].x - points[ 3 ].x;
  const deltaY1 = points[ 1 ].y - points[ 2 ].y;
  const deltaY2 = points[ 3 ].y - points[ 2 ].y;
  const sumY = points[ 0 ].y - points[ 1 ].y + points[ 2 ].y - points[ 3 ].y;
  const denominator = new Matrix( [ deltaX1, deltaX2 ], [ deltaY1, deltaY2 ] ).determinant();
  const g = new Matrix( [ sumX, deltaX2 ], [ sumY, deltaY2 ] ).determinant() / denominator;
  const h = new Matrix( [ deltaX1, sumX ], [ deltaY1, sumY ] ).determinant() / denominator;
  const a = points[ 1 ].x - points[ 0 ].x + g * points[ 1 ].x;
  const b = points[ 3 ].x - points[ 0 ].x + h * points[ 3 ].x;
  const c = points[ 0 ].x;
  const d = points[ 1 ].y - points[ 0 ].y + g * points[ 1 ].y;
  const e = points[ 3 ].y - points[ 0 ].y + h * points[ 3 ].y;
  const f = points[ 0 ].y;
  return new Matrix( [ a, b, c ], [ d, e, f ], [ g, h, 1 ] );
}

export function projectPoint( point, projectionMatrix ) {
  const pointMatrix = projectionMatrix.multiply( new Matrix( [ point.x ], [ point.y ], [ 1 ] ) );
  return {
    x: pointMatrix.get( 0, 0 ) / pointMatrix.get( 2, 0 ),
    y: pointMatrix.get( 1, 0 ) / pointMatrix.get( 2, 0 ),
  };
}

export function getApiUrl( spaceName, suffix = '' ) {
  return new URL( `api/spaces/${spaceName}${suffix}`, window.location.origin ).toString();
}

const commentRegex = /\s*\/\/\s*(.+)/;

export function codeToName( code ) {
  const firstLine = code.split( '\n' )[ 0 ];
  const match = firstLine.match( commentRegex );
  if ( match ) {
    return match[ 1 ].trim();
  }
  else {
    return '???';
  }
}

/**
 * Get a list of the keywords from a paper program.  Keywords are on the 2nd line and should be labeled like this:
 *   // Keywords: cool, fun, scary
 * If there are no keywords in the file, an empty array is returned.
 * @param {string} program
 * @returns {string[]}
 */
function getKeywordsFromProgram( program ) {
  const programLines = program.split( '\n' );
  const firstLine = programLines[ 0 ];
  const secondLine = programLines[ 1 ];
  const keywords = [];

  const commentRegEx = /\s*\/\/\s*(.+)/;
  const wordRegEx = /\b[a-zA-Z]+\b/g;

  // Test the first line and see if it is a comment and contains words.  If so, extract those words.
  const titleMatchResults = firstLine.match( commentRegEx );
  if ( titleMatchResults && titleMatchResults[ 1 ] ) {
    const titleWords = titleMatchResults[ 1 ].match( wordRegEx );
    keywords.push( ...titleWords );
  }

  // Test the second line to see if it is a comment and is formatted correctly to indicate that it contains keywords and
  // add them to our list if so.
  const keywordMatchResults = secondLine.match( commentRegEx );
  if ( keywordMatchResults && keywordMatchResults[ 1 ] && keywordMatchResults[ 1 ].includes( 'Keywords' ) ) {
    let explicitlySpecifiedKeywords = keywordMatchResults[ 1 ].match( wordRegEx );

    // Filter out the word "keywords" in case it was used on this line.
    explicitlySpecifiedKeywords = explicitlySpecifiedKeywords.filter( word => !word.toLowerCase().includes( 'keyword' ) );

    // Add these to our keyword list.
    keywords.push( ...explicitlySpecifiedKeywords );
  }

  return keywords;
}

/**
 *
 * @param {string} programCode - contents of a paper program, which is generally a JS file
 * @param {string} filterString - a string representing a list of words to test against the keywords for this sim
 * @returns {boolean} - true if there is a match OR if there are no words provided on which to filter
 */
export function programMatchesFilterString( programCode, filterString ){

  // Get the keywords that are contained in the program so that they can be used for filtering.
  const keywords = getKeywordsFromProgram( programCode ).map( keyword => keyword.toLowerCase() );

  // Determine whether any of the words contained in the filter string match any of the keywords in the program.
  let programMatchesFilterString = false;
  if ( filterString && filterString.length > 0 ) {
    const filterWordsFromUser = filterString.match( /\b[a-zA-Z]+\b/g ).map( word => word.toLowerCase() );

    if ( filterWordsFromUser.some( filterWord => keywords.some( keyword => keyword.includes( filterWord ) ) ) ) {
      programMatchesFilterString = true;
    }
  }
  else {

    // There are no search terms, so the program is included.
    programMatchesFilterString = true;
  }
  return programMatchesFilterString;
}

export function codeToPrint( code ) {
  let lines = code.split( '\n' );
  let i = 0;
  for ( ; i < lines.length; i++ ) {
    if ( !lines[ i ].match( commentRegex ) && lines[ i ].trim().length !== 0 ) {
      break;
    }
  }
  return lines.slice( i ).join( '\n' );
}
