exports.up = function(knex) {
  return knex.schema.createTable('programs', function(table) {
    table.string('spaceName').notNullable();
    table.integer('number').notNullable();
    table.text('originalCode').notNullable();
    table.text('currentCode').notNullable();
    table
      .boolean('printed')
      .notNullable()
      .defaultTo(false);
    table
      .text('debugInfo')
      .notNullable()
      .defaultTo('');
    table.primary(['spaceName', 'number']);
  });
};

exports.down = function(knex) {
  return knex.schema.dropTableIfExists('programs');
};
