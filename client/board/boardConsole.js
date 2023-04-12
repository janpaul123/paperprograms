/**
 * Implements logging functionality for the Board page. Emits an event when logging is requested so
 * view components can render the message. Also prints the messages to the dev tools console.
 */

import paperLand from './paperLand.js';

// Types of supported messages.
export class MessageType extends phet.phetCore.EnumerationValue {
  static LOG = new MessageType();
  static WARN = new MessageType();
  static ERROR = new MessageType();

  static enumeration = new phet.phetCore.Enumeration( MessageType );
}

/**
 * Joins multiple args into a single printable string.
 * @param args {string[]}
 * @returns {string}
 */
const argsToString = args => {
  return args.join( ', ' );
};

const boardConsole = {

  /**
   * Log a message to the console.
   * @param {...string} args - arguments are strings to print
   */
  log: function( ...args ) {
    boardConsole.messageEmitter.emit( argsToString( args ), MessageType.LOG );
    console.log( ...args );
  },

  /**
   * Put a warning message in the console.
   * @param {...string} args - arguments are strings to print
   */
  warn: function( ...args ) {
    boardConsole.messageEmitter.emit( argsToString( args ), MessageType.WARN );
    console.warn( ...args );
  },

  /**
   * Put an error message in the console
   * @param {...string} args - arguments are strings to print
   */
  error: function( ...args ) {
    boardConsole.messageEmitter.emit( argsToString( args ), MessageType.ERROR );
    console.error( ...args );
  },

  // Emits an event whenever a new message is logged.
  messageEmitter: new phet.axon.Emitter()
};

// add to the paperLand namespace
paperLand.console = boardConsole;

export default boardConsole;