import sortBy from 'lodash/sortBy';
import throttle from 'lodash/throttle';
import randomColor from 'randomcolor';
import React from 'react';
import xhr from 'xhr';

import { forwardProjectionMatrixForPoints, mult } from '../utils';
import AudioGraphElement from './model/AudioGraphElement.js';

import AudioMixerModel from './model/AudioMixerModel.js';
import styles from './Program.css';
import AudioGraphSoundView from './view/AudioGraphSoundView.js';

const audioMixerModel = new AudioMixerModel();

const soundView = new AudioGraphSoundView()
soundView.init();

const initListener = () => {
  AudioGraphSoundView.INDEX_TO_FILE_MAP.forEach( ( value, key ) => {

    // start playing all audio in response to user input
    value.play();
  } );

  console.log( 'sounds ready!' );
  window.removeEventListener( 'click', initListener );
};
window.addEventListener( 'click', initListener );

function matrixToCssTransform( matrix ) {
  // prettier-ignore
  const values = [
    matrix.get( 0, 0 ), matrix.get( 1, 0 ), 0, matrix.get( 2, 0 ),
    matrix.get( 0, 1 ), matrix.get( 1, 1 ), 0, matrix.get( 2, 1 ),
    0, 0, 1, 0,
    matrix.get( 0, 2 ), matrix.get( 1, 2 ), 0, matrix.get( 2, 2 ),
  ];
  return `matrix3d(${values.join( ',' )})`;
}

const canvasSizeMatrixes = [];

const programNumberToElementMap = {};

function getCanvasSizeMatrix( width, height ) {
  const key = `${width},${height}`;
  canvasSizeMatrixes[ key ] =
    canvasSizeMatrixes[ key ] ||
    forwardProjectionMatrixForPoints( [
      { x: 0, y: 0 },
      { x: width, y: 0 },
      { x: width, y: height },
      { x: 0, y: height },
    ] ).adjugate();
  return canvasSizeMatrixes[ key ];
}

const defaultCanvasWidth = 100;
const iframeWidth = 400;
const maxLogLength = 100;

export default class Program extends React.Component {
  constructor( props ) {
    super( props );
    this.state = {
      canvasSizeByProgramNumber: {},
      showSupporterCanvasById: {},
      iframe: null,
      paperRatio: this.props.paperRatio,
      debugData: { logs: [] },
    };
  }

  componentDidMount() {
    this._worker = new Worker( this._program().currentCodeUrl );
    this._worker.onmessage = this._receiveMessage;
    this._worker.onerror = this._receiveError;
    this._updateDebugData();
  }

  componentWillUnmount() {
    this._worker.terminate();

    const releasedElement = programNumberToElementMap[ this._program().number ];
    // console.log( 'unmounting' );

    if ( releasedElement ) {

      // remove all children from this element
      releasedElement.getChildren().forEach( childElement => {
        releasedElement.removeChild( childElement );
      } );

      // remove it from the root
      if ( !releasedElement.parent && audioMixerModel.hasChild( releasedElement ) ) {
        audioMixerModel.removeRootLevelElement( releasedElement );
      }

      // stop playing music
      if ( releasedElement.playableAudio ) {
        releasedElement.playableAudio.setOutputLevel( 0 );
      }

      // unmount may happen multiple times? Need to clear so we don't try to remove again
      programNumberToElementMap[ this._program().number ] = null;
    }
  }

  _program = () => {
    return this.props.programsToRenderByNumber[ this.props.programNumber ];
  };

  _receiveMessage = event => {
    const { command, sendData, messageId } = event.data;

    if ( command === 'get' ) {
      if ( sendData.name === 'number' ) {
        this._worker.postMessage( {
          messageId,
          receiveData: { object: this._program().number.toString() },
        } );
      }
      else if ( sendData.name === 'canvas' ) {
        const programNumber = sendData.data.number || this._program().number;

        if ( this.state.canvasSizeByProgramNumber[ programNumber ] ) {
          this._worker.postMessage( { messageId, receiveData: { object: null } } );
        }
        else {
          this[ `_canvasAvailableCallback_${programNumber}` ] = canvas => {
            const offscreen = canvas.transferControlToOffscreen();
            this._worker.postMessage( { messageId, receiveData: { object: offscreen } }, [
              offscreen,
            ] );
            delete this[ `_canvasAvailableCallback_${programNumber}` ];
          };
          this.setState( {
            canvasSizeByProgramNumber: {
              ...this.state.canvasSizeByProgramNumber,
              [ programNumber ]: {
                width: sendData.data.width || defaultCanvasWidth,
                height:
                  sendData.data.height ||
                  ( sendData.data.width ? sendData.data.width : defaultCanvasWidth ) *
                  this.state.paperRatio,
              },
            },
          } );
        }
      }
      else if ( sendData.name === 'supporterCanvas' ) {
        const supporterCanvasId = sendData.data.id || 'default';

        if ( this.state.showSupporterCanvasById[ supporterCanvasId ] ) {
          this._worker.postMessage( { messageId, receiveData: { object: null } } );
        }
        else {
          this[ `_supporterCanvasAvailableCallback_${supporterCanvasId}` ] = canvas => {
            const offscreen = canvas.transferControlToOffscreen();
            this._worker.postMessage( { messageId, receiveData: { object: offscreen } }, [
              offscreen,
            ] );
            delete this[ `_supporterCanvasAvailableCallback_${supporterCanvasId}` ];
          };
          this.setState( {
            showSupporterCanvasById: {
              ...this.state.showSupporterCanvasById,
              [ supporterCanvasId ]: true,
            },
          } );
        }
      }
      else if ( sendData.name === 'papers' ) {
        this._worker.postMessage( { messageId, receiveData: { object: this.props.papers } } );
      }
      else if ( sendData.name === 'markers' ) {
        this._worker.postMessage( { messageId, receiveData: { object: this.props.markers } } );
      }
      else if ( sendData.name === 'camera' ) {
        this.props.grabCameraImageAndProjectionData().then( object => {
          this._worker.postMessage(
            {
              messageId,
              receiveData: { object },
            },
            [ object.cameraImage ]
          );
        } );
      }
    }
    else if ( command === 'set' ) {
      if ( sendData.name === 'data' ) {
        this.props.onDataChange( sendData.data, () => {
          this._worker.postMessage( { messageId } );
        } );
      }
      if ( sendData.name === 'audio' ) {
        const audioData = sendData.data;

        // please send the file index, x, y, displayName string, and a nullable webAudioNodeType
        const newGraphElement = new AudioGraphElement(
          audioData.soundFileIndex,
          new phet.dot.Vector2( audioData.x, audioData.y ),
          audioData.displayName,
          {
            webAudioNodeType: audioData.webAudioNodeType
          } );

        // save a reference so it can be removed later
        programNumberToElementMap[ this._program().number ] = newGraphElement;

        // add the element to the root of the model
        audioMixerModel.addRootLevelElement( newGraphElement );

        if ( newGraphElement.playableAudio ) {
          newGraphElement.playableAudio.setOutputLevel( 1 );
        }

        this._worker.postMessage( { messageId } );
      }
      else if ( sendData.name === 'audioGraphAdd' ) {
        const relationData = sendData.data;

        const parentElement = programNumberToElementMap[ relationData.parentProgramNumber ];
        const childElement = programNumberToElementMap[ relationData.childProgramNumber ];

        if ( !parentElement ) {

        }

        console.log( childElement, parentElement, programNumberToElementMap );
        if ( childElement && parentElement && childElement.parent === null ) {

          if ( audioMixerModel.hasChild( childElement ) ) {

            // may not have the child yet
            audioMixerModel.removeRootLevelElement( childElement );
          }
          parentElement.addChild( childElement );
        }

        this._worker.postMessage( { messageId } );
      }
      else if ( sendData.name === 'audioGraphUpdateConnections' ) {
        const element = programNumberToElementMap[ sendData.data.programNumber ];
        if ( element ) {

          // whenever we move, try to update connections if necesssary because whiskers may not have triggered
          // certain behaviors
          const parentElement = element.parent || element;
          // console.log( parentElement, element.getChildren() );
          parentElement.traverseSubtree( childElement => {
            if ( childElement.playableAudio ) {
              console.log( childElement.collectedAudioNodeTypes );
              childElement.playableAudio.updateConnections( childElement.collectedAudioNodeTypes );
            }
            return false;
          } );
        }

        this._worker.postMessage( { messageId } );
      }
      else if ( sendData.name === 'audioGraphRemove' ) {
        const relationData = sendData.data;

        const parentElement = programNumberToElementMap[ relationData.parentProgramNumber ];
        const childElement = programNumberToElementMap[ relationData.childProgramNumber ];

        // the unmount may have removed things already for us
        if ( parentElement && childElement && childElement.parent === parentElement ) {
          parentElement.removeChild( childElement );

          // this element is now a root level element
          audioMixerModel.addRootLevelElement( childElement );

          // console.log( `removing child ${childElement.soundFileIndex}` );
        }
      }
      else if ( sendData.name === 'iframe' ) {
        this.setState( { iframe: sendData.data } );
      }
    }
    else if ( command === 'flushLogs' ) {
      this._addLogs( sendData );
    }
  };

  _receiveError = error => {
    const logData = {
      name: 'Error',
      args: [ error.message ],
      lineNumber: error.lineno,
      columnNumber: error.colno,
      filename: error.filename,
      timestamp: Date.now(),
    };
    if ( logData.filename.match( /\/program\..*/ ) ) {
      logData.filename = 'program';
    }
    this._addLogs( [ logData ] );
  };

  _addLogs = newLogs => {
    const logs = sortBy( this.state.debugData.logs.concat( newLogs ), 'timestamp' ).slice(
      -maxLogLength
    );
    this.setState( { debugData: { ...this.state.debugData, logs } }, () => {
      this._updateDebugData();
    } );
  };

  _updateDebugData = throttle( () => {
    xhr.put( this._program().debugUrl, { json: this.state.debugData }, () => {} );
  }, 300 );

  _getCssTransform = ( program, width, height ) => {
    return matrixToCssTransform(
      forwardProjectionMatrixForPoints(
        program.points.map( point => mult( point, { x: this.props.width, y: this.props.height } ) )
      ).multiply( getCanvasSizeMatrix( width, height ) )
    );
  };

  render() {
    const program = this._program();

    return (
      <div>
        <div
          className={
            !program.editorInfo.claimed && program.codeHasChanged
            ? styles.canvasWithChangedCode
            : ''
          }
          style={{
            position: 'absolute',
            left: 0,
            top: 0,
            width: 200,
            height: 200,
            transform: this._getCssTransform( this._program(), 200, 200 ),
            transformOrigin: '0 0 0',
            zIndex: 3,
            boxShadow: program.editorInfo.claimed
                       ? `0 0 0 1px ${randomColor( {
                seed: program.editorInfo.editorId,
              } )} inset`
                       : '',
          }}
        />
        {Object.keys( this.state.canvasSizeByProgramNumber ).map( programNumberString => {
          const { width, height } = this.state.canvasSizeByProgramNumber[ programNumberString ];
          const programNumber = parseInt( programNumberString, 10 );

          return (
            <canvas
              key={`canvas_${programNumberString}`}
              ref={el => {
                if ( el && this[ `_canvasAvailableCallback_${programNumber}` ] ) {
                  this[ `_canvasAvailableCallback_${programNumber}` ]( el );
                }
              }}
              width={width}
              height={height}
              style={{
                position: 'absolute',
                left: 0,
                top: 0,
                width,
                height,
                transform: this._getCssTransform(
                  this.props.programsToRenderByNumber[ programNumber ],
                  width,
                  height
                ),
                transformOrigin: '0 0 0',
                zIndex: programNumber == program.number ? 1 : 2,
              }}
            />
          );
        } )}
        {this.state.iframe && this.renderIframe()}
        {Object.keys( this.state.showSupporterCanvasById ).map( supporterCanvasId => (
          <canvas
            key={`supporterCanvas_${supporterCanvasId}`}
            ref={el => {
              if ( el && this[ `_supporterCanvasAvailableCallback_${supporterCanvasId}` ] ) {
                this[ `_supporterCanvasAvailableCallback_${supporterCanvasId}` ]( el );
              }
            }}
            width={this.props.width}
            height={this.props.height}
            style={{
              position: 'absolute',
              left: 0,
              top: 0,
              width: this.props.width,
              height: this.props.height,
              zIndex: 2,
            }}
          />
        ) )}
      </div>
    );
  }

  renderIframe() {
    const iframeHeight = iframeWidth * this.state.paperRatio;
    const iframeStyle = {
      position: 'absolute',
      left: 0,
      top: 0,
      width: iframeWidth,
      height: iframeHeight,
      transform: this._getCssTransform( this._program(), iframeWidth, iframeHeight ),
      transformOrigin: '0 0 0',
      zIndex: 1,
    };

    return <iframe key="iframe" src={this.state.iframe.src} style={{ ...iframeStyle }}/>;
  }
}
