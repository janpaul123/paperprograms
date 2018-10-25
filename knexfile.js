require('dotenv').config();

if (!process.env.DATABASE_URL) {
  throw new Error('please set DATABASE_URL');
}

module.exports = {
  development: {
    client: 'pg',
    connection: process.env.DATABASE_URL || 'postgres://localhost/paper_programs_development',
  },
  docker: {
    client: 'pg',
    connection: process.env.DATABASE_URL || 'postgres://root@postgres/paper_programs_development',
  },
  production: {
    client: 'pg',
    connection: process.env.DATABASE_URL + '?ssl=true',
  },
};
