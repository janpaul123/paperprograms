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

const boardConsole = {

  /**
   * Log a message to the console.
   * @param message {string}
   */
  log: message => {
    const stringMessage = message.toString();
    boardConsole.messageEmitter.emit( stringMessage, MessageType.LOG );
    console.log( message );
  },

  /**
   * Put a warning message in the console.
   * @param message {string}
   */
  warn: message => {
    const stringMessage = message.toString();
    boardConsole.messageEmitter.emit( stringMessage, MessageType.WARN );
    console.warn( stringMessage );
  },

  /**
   * Put an error message in the console
   * @param message {string}
   */
  error: message => {
    const stringMessage = message.toString();
    boardConsole.messageEmitter.emit( stringMessage, MessageType.ERROR );
    console.error( message );
  },

  // Emits an event whenever a new message is logged.
  messageEmitter: new phet.axon.Emitter()
};

// add to the paperLand namespace
paperLand.console = boardConsole;

export default boardConsole;