# Paper Playground

## This project is currently under construction. More details coming soon!

For the best documentation currently available, see the wonderful project this was based on:
- [Paper Programs](https://paperprograms.org)

## Installation
0. Make sure you have [Nodejs](https://nodejs.org/en/) and [Git](https://git-scm.com/) installed on your machine. Up to Node 18.15.x and Git 2.39.x (windows) are confirmed to work currently.
1. Clone the repository: `git clone https://github.com/phetsims/paper-land.git`
2. Install dependencies: `npm install`
3. Set up database (see below for Remote or Local database)
4. Start the tool: `npm start`
5. Open [localhost:3000](localhost:3000) in your browser and follow the links on the landing page.

### Remote Database
-  If you are using a remote database, create a `.env` file in the root of paper-land and provide the address for the database under `DATABASE_URL`
- e.g., `DATABASE_URL=postgres://someDatabaseAddressFromSomeHostingService`

### Local Database
-  You will need to install [PostgreSQL](https://www.postgresql.org/download/) and set up a local database. See the [Paper Programs tutorial documentation](https://github.com/janpaul123/paperprograms/blob/master/docs/tutorial.md#optional-setting-up-the-server-locally)) for more details and commands

### Recommended Start Up
At this time, Paper Playground must be run from the command line (e.g., Bash, Terminal, Command Prompt, etc). If you're following along with the development of Paper Playground, you should run the following regularly:
1. `git pull`
2. `npm update`
3. `npm start`

## Coming soon
- Description and project goals!
- Updated tutorial!
- CONTRIBUTING.md and how to help out!

## Want to chat?
- Make a post in this repository's Discussions tab!

## License
This software is licensed under the MIT license. See the [LICENSE](https://github.com/phetsims/paper-land/blob/master/LICENSE) in this repository.
