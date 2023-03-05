exports.up = function( knex ) {
  knex.schema.hasTable( 'snippets' ).then( exists => {
    if ( !exists ) {
      return knex.schema.createTable( 'snippets', table => {
        table.integer( 'number' ).notNullable();
        table.text( 'code' ).notNullable();
        table.primary( 'number' );
      } );
    }
    else {

      // knex requires a promise
      return Promise.resolve();
    }
  } );
};

exports.down = function( knex ) {
  return knex.schema.dropTableIfExists( 'snippets' );
};
