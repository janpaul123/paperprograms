import AudioGraphElementNode from '../view/AudioGraphElementNode.js';
import AudioGraphSoundView from '../view/AudioGraphSoundView.js';

class AudioGraphElement {

  /**
   * @param soundFileIndex - the index of the sound file that will play when this element is in the graph
   *                         null means that this is an effect and has no sound clip to play
   * @param initialPosition - Vector2
   * @param displayName - visually displayed label for this component
   * @param options
   */
  constructor( soundFileIndex, initialPosition, displayName, options ) {

    options = _.merge( {
      webAudioNode: null,
      webAudioNodeType: null
    }, options );

    this._children = [];
    this.parent = null;

    this.soundFileIndex = soundFileIndex;
    this.displayName = displayName;

    this.positionProperty = new phet.dot.Vector2Property( initialPosition );

    this.playableAudio = soundFileIndex ? AudioGraphSoundView.INDEX_TO_FILE_MAP.get( soundFileIndex ) : null;

    this.webAudioNode = options.webAudioNode;

    this.webAudioNodeType = options.webAudioNodeType;

    this.modelBoundsProperty = new phet.axon.DerivedProperty( [ this.positionProperty ], position => {
      return new phet.dot.Bounds2( position.x, position.y, position.x + AudioGraphElementNode.WIDTH, position.y + AudioGraphElementNode.HEIGHT );
    } );

    // All of the audio effect nodes from the root to THIS leaf in the graph
    this.collectedAudioNodeTypes = [];

    // add the self webAudioNode effect initially
    if ( this.webAudioNodeType ) {
      this.collectedAudioNodeTypes.push( this.webAudioNodeType );
    }

    this.childAddedEmitter = new phet.axon.Emitter();
    this.childRemovedEmitter = new axon.Emitter();

    this.childAddedEmitter.addListener( addedChild=> {

      // recursively add effects through all ancestors, including self
      console.log( 'traversing subtree' );
      addedChild.traverseSubtree( childElement => {
        childElement.collectedAudioNodeTypes = childElement.collectedAudioNodeTypes.concat( childElement.parent.collectedAudioNodeTypes );

        if ( childElement.playableAudio ) {
          childElement.playableAudio.updateConnections( childElement.collectedAudioNodeTypes );
        }

        // will traverse through entire sub tree
        return false;
      } );
    } );

    this.childRemovedEmitter.addListener( removedChild => {

      // for the entire subtree under the removed child, remove the collectedAudioNodeTypes of this (parent)
      removedChild.traverseSubtree( childElement => {
        _.pullAll( childElement.collectedAudioNodeTypes, this.collectedAudioNodeTypes );

        console.log( 'traversing for removal' );
        if ( childElement.playableAudio ) {
          childElement.playableAudio.updateConnections( childElement.collectedAudioNodeTypes );
        }
        // traverse through entire subtree
        return false;
      } );
    } );
  }

  getChildren() {
    return this._children.slice( 0 );
  }

  addChild( childElement ) {
    if ( childElement.parent !== null ) {
      throw new Error( 'Excuse me, childElement has a parent already >:[' );
    }

    childElement.parent = this;
    this._children.push( childElement );

    this.childAddedEmitter.emit( childElement );
  }

  removeChild( childElement ) {
    if ( !this._children.includes( childElement ) ) {
      throw new Error( 'childElement is not a child of this AudioGraphElement' );
    }

    const index = this._children.indexOf( childElement );
    this._children.splice( index, 1 );

    childElement.parent = null;

    this.childRemovedEmitter.emit( childElement );
  }

  getNumberOfAncestors() {
    let numberOfAncestors = this._children.length;

    if ( this._children.length > 0 ) {
      for ( let i = 0; i < this._children.length; i++ ) {
        numberOfAncestors += this._children[ i ].getNumberOfAncestors();
      }
    }

    return numberOfAncestors;
  }

  traverseSubtree( callback ) {
    let callbackValue = callback( this );

    if ( !callbackValue ) {
      let children = this.getChildren();
      for ( let i = 0; i < children.length; i++ ) {
        if ( !callbackValue ) {
          callbackValue = children[ i ].traverseSubtree( callback );
        }
      }
    }
    return callbackValue
  }
}

export default AudioGraphElement;