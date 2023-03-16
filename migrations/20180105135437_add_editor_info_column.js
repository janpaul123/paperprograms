exports.up = function( knex ) {
  return knex.schema.table( 'programs', table => {
    table
      .text( 'editorInfo' )
      .notNullable()
      .defaultTo( '' );
  } );
};

exports.down = function( knex ) {
  return knex.schema.table( 'programs', table => {
    table.dropColumn( 'editorInfo' );
  } );
};