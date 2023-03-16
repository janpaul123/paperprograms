const api = require( './api' );
const express = require( 'express' );
const path = require( 'path' );

express.static.mime.types.wasm = 'application/wasm';

process.on( 'unhandledRejection', error => {
  console.error( 'unhandledRejection', error.message );
} );

const app = express();
app.use( require( 'morgan' )( 'short' ) );
app.use( require( 'heroku-ssl-redirect' )( [ 'production' ] ) );
app.use( express.static( path.join( __dirname, '..', 'www' ) ) );
app.use( api );

if ( process.env.NODE_ENV !== 'production' ) {
  const compiler = require( 'webpack' )( require( '../webpack.config.js' ) );
  app.use( require( 'webpack-dev-middleware' )( compiler ) );
}

 
const port = process.env.PORT || 3000;
app.listen( port, () => console.log( `Listening on port ${port}!` ) );