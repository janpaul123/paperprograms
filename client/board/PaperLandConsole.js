/**
 * The react component for the console. Displays messages from paper-land code or from
 * user program code.
 */

import React, { useEffect, useRef, useState } from 'react';
import Button from 'react-bootstrap/Button';
import ListGroup from 'react-bootstrap/ListGroup';
import boardConsole, { MessageType } from './boardConsole.js';
import styles from './BoardMain.css';

// Maps the types of log functions to the variant of the react-bootstrap ListGroup.Item.
const consoleTypeToItemVariant = new Map( [
  [ MessageType.LOG, 'light' ],
  [ MessageType.WARN, 'warning' ],
  [ MessageType.ERROR, 'danger' ]
] );

// Is the user scrolling through the log? If so, auto scroll will be disabled.
let userScroll = false;

// A reference to a listener on the console message Emitter. Every render, we need to remove
// the old listener to add a new one that will update the logArray.
let messageListener;

export default function PaperLandConsole( props ) {
  const [ logArray, setLogArray ] = useState( [] );

  // references to React elements for scrolling and layout calculations
  const panelRef = useRef( null );
  const lastItemRef = useRef( null );

  // clear old listener after the previous render
  if ( messageListener ) {
    boardConsole.messageEmitter.removeListener( messageListener );
    messageListener = null;
  }

  // Update the log array when there is a new message for the boardConsole
  messageListener = ( message, type ) => {

    // negative value means to only slice that number of elements from the END of the array
    const newArray = logArray.slice( -100 );
    newArray.push( {
      content: message,
      type: type
    } );
    setLogArray( newArray );
  };
  boardConsole.messageEmitter.addListener( messageListener );

  const items = logArray.map( ( logObject, i ) => {
    const itemVariant = consoleTypeToItemVariant.get( logObject.type );
    return <ListGroup.Item
      key={i}
      variant={itemVariant}
      ref={i === logArray.length - 1 ? lastItemRef : null}
    >{logObject.content}</ListGroup.Item>;
  } );

  // Scrolls to the bottom of the list (if user is already there)
  const scrollToBottom = () => {
    const panelElement = panelRef.current;
    const lastItem = lastItemRef.current;
    if ( panelElement && lastItem ) {

      // detecting whether we are at the bottom of the scroll to enable auto scrolling, from
      // https://developer.mozilla.org/en-US/docs/Web/API/Element/scrollHeight
      // But for some reason, the distance is off by the height of the last item in the list (not sure why)
      const distance = Math.abs( panelElement.scrollHeight - panelElement.clientHeight - panelElement.scrollTop - lastItem.clientHeight );
      if ( distance < 5 ) {
        userScroll = false;
      }
    }

    if ( !userScroll ) {
      const panelElement = panelRef.current;
      if ( panelElement ) {

        // set the scrollTop instead of using scrollIntoView so the entire page doesn't scroll
        panelElement.scrollTop = panelElement.scrollHeight;
      }
    }
  };

  // When user scrolls into the log, stop auto scrolling to the bottom
  const handleWheel = () => {
    userScroll = true;
  };

  // When an item is added to the logArray, attempt to scroll to the most recent item
  useEffect( () => {
    scrollToBottom();
  }, [ logArray ] );

  return (
    <div className={`${styles.boardPanel} ${styles.consolePanel}`} hidden={!props.consoleVisible}>
      <div>
        <h5 style={{ float: 'left', margin: '5px' }}>Console</h5>
        <Button
          variant='secondary'
          style={{ float: 'right', margin: '5px' }}
          onClick={() => setLogArray( [] )}
        >Clear</Button>
      </div>
      {/*`clear` puts the breaker after the floating button */}
      <hr style={{ clear: 'both', marginBottom: '0px' }}/>
      <div
        className={`${styles.consoleContainer}`}
        ref={panelRef}
        onWheel={handleWheel}>
        <ListGroup variant='flush'>
          {items}
        </ListGroup>
      </div>
    </div>
  );
}