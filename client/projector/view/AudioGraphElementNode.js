// import AudioGraphLineNode from './AudioGraphLineNode.js';

const HEIGHT = 80;
const WIDTH = 50;

const CHILD_HORIZONTAL_SPACING = 15;
const CHILD_VERTICAL_SPACING = 15;

class AudioGraphElementNode extends phet.scenery.Rectangle {
  static WIDTH = WIDTH;
  static HEIGHT = HEIGHT;

  constructor( audioGraphElement, screenView, audioMixerModel ) {
    super( 0, 0, WIDTH, HEIGHT, {
      fill: new phet.scenery.Color( 255, 217, 102 ),
      stroke: 'black'
    } );

    this.addChild( new phet.scenery.Text( audioGraphElement.displayName, {
      font: new phet.sceneryPhet.PhetFont( { size: 24 } ),
      center: this.center
    } ) );

    this.model = audioGraphElement;

    this.lineNodes = [];

    // translate with model positionProperty
    audioGraphElement.positionProperty.link( position => {
      this.translation = position;
      this.layoutAncestors()
    } );

    // add a listener so that whenever this model gets a new child, create and add a new AudioGraphElementNode
    audioGraphElement.childAddedEmitter.addListener( addedElement => {

      // The new Node is added to the ScreenView by the creator, we do not add a new Node here
      this.layoutAncestors();

      // const newLineNode = new AudioGraphLineNode( audioGraphElement, addedElement )
      // screenView.addChild( newLineNode );
      // this.lineNodes.push( newLineNode );
    } );

    audioGraphElement.childRemovedEmitter.addListener( removedElement => {
      this.layoutAncestors();

      // update lines showing graph relations
      const removedLineNodes = _.remove( this.lineNodes, lineNode => {
        return lineNode.childElement === removedElement;
      } );
      if ( removedLineNodes.length !== 1 ) {
        console.log( removedLineNodes.length );
        throw new Error( 'There should be one and only one line to remove when removing a child' );
      }
      screenView.removeChild( removedLineNodes[ 0 ] );
    } );

    // add a drag listener
    this.dragListener = new phet.scenery.DragListener( {
      positionProperty: audioGraphElement.positionProperty,
      start: () => {
        if ( audioGraphElement.parent ) {
          audioGraphElement.parent.removeChild( audioGraphElement );

          // this element is now a root level element
          audioMixerModel.addRootLevelElement( audioGraphElement );
        }
      },
      drag: ( event, listener ) => {

      },
      end: () => {

        // tell the screen view we would like to try to place the new element in the graph
        screenView.elementReleasedEmitter.emit( this.model );
      },
    } );
    this.addInputListener( this.dragListener );
  }

  getLayoutWidthOfSubtree( graphElement ) {

    // add one to include width of self
    const numberOfElements = graphElement.getNumberOfAncestors() + 1;
    return numberOfElements * ( WIDTH );
  }

  /**
   * Layout all ancestors under this Node by updating their positionProperties. Uses information about the width
   * of all ancestors (recursively) so there is enough space for sub-trees of elements.
   *
   * This definitely isn't perfect layout and it looks a little strange (too much spacing sometimes and things
   * may not be centered). But it is good enough for now and avoids overlap.
   */
  layoutAncestors() {
    const modelChildren = this.model.getChildren();
    const totalWidth = _.sumBy( this.model.getChildren(), childElement => {
      return this.getLayoutWidthOfSubtree( childElement );
    } );

    let currentLocalX = -totalWidth / 2;
    const localY = HEIGHT + CHILD_VERTICAL_SPACING;
    modelChildren.forEach( ( child, i ) => {

      // add width / 2 to offset for center
      currentLocalX = currentLocalX + ( WIDTH / 2 );

      // shift this subtree over by the width of the previous child and its subtree in this algorithm
      if ( i > 0 ) {
        const previousChild = modelChildren[ i - 1 ];
        currentLocalX = currentLocalX + ( this.getLayoutWidthOfSubtree( previousChild ) );
      }
      child.positionProperty.value = this.localToGlobalPoint( new phet.dot.Vector2( currentLocalX, localY ) )
    } );
  }
}

export default AudioGraphElementNode;