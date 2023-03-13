/**
 * Main model component for the audio mixer. Responsible for managing all nodes in the audio graph.
 */

class AudioMixerModel {
  constructor() {

    // what does this do?
    this.rootLevelElements = [];

    this.rootElementAddedEmitter = new phet.axon.Emitter();
    this.rootElementRemovedEmitter = new phet.axon.Emitter();
  }

  addRootLevelElement( audioElement ) {
    this.rootLevelElements.push( audioElement );
    this.rootElementAddedEmitter.emit( audioElement );
  }

  hasChild( audioElement ) {
    return this.rootLevelElements.includes( audioElement );
  }

  removeRootLevelElement( audioElement ) {
    const indexOfElement = this.rootLevelElements.indexOf( audioElement );

    if ( indexOfElement < 0 ) {
      throw new Error( `Could not find audioElement in list, index: ${indexOfElement}` );
    }
    this.rootLevelElements.splice( indexOfElement, 1 );

    this.rootElementRemovedEmitter.emit( audioElement );
  }

  traverseRootLevelElements( callback ) {
    let callbackValue;
    for ( let i = 0; i < this.rootLevelElements.length; i++ ) {
      const rootLevelElement = this.rootLevelElements[ i ];

      if ( !callbackValue ) {
        callbackValue = this.traverseSubtree( rootLevelElement, callback );
      }
    }

    return callbackValue;
  }

  traverseSubtree( rootElement, callback ) {
    let callbackValue = callback( rootElement );

    if ( !callbackValue ) {
      let children = rootElement.getChildren();
      for ( let i = 0; i < children.length; i++ ) {
        if ( !callbackValue ) {
          callbackValue = this.traverseSubtree( children[ i ], callback );
        }
      }
    }
    return callbackValue
  }

  // in seconds
  step( dt ) {

  }
}

export default AudioMixerModel;