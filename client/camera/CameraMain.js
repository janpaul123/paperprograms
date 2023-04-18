import React from 'react';
import Button from 'react-bootstrap/Button';
import MonacoEditor from 'react-monaco-editor';
import xhr from 'xhr';
import clientConstants from '../clientConstants.js';
import { codeToName, getApiUrl, programMatchesFilterString } from '../utils';
import styles from './CameraMain.css';
import CameraVideo from './CameraVideo.js';
import ColorListItem from './ColorListItem.js';
import CreateProgramsDialog from './CreateProgramsDialog.js';
import helloWorld from './helloWorld';
import { printCalibrationPage, printPage } from './printPdf';

// constants
const SPACE_DATA_POLLING_PERIOD = 1; // in seconds
const PROGRAM_DELETE_WARNING = 'This will remove the program for all users of the database.\nAre you sure you want to delete this program?';

// Produces a unique ID for each debug marker component, important for React to
// render a list of components.
let markerCount = 0;

export default class CameraMain extends React.Component {

  constructor( props ) {
    super( props );
    this.state = {
      pageWidth: 1,
      framerate: 0,
      selectedColorIndex: -1,
      spaceData: { programs: [] },
      isEditingSpaceUrl: false,
      selectedSpaceName: props.config.selectedSpaceName,
      availableSpaces: [],
      isAddingNewSpace: false,
      newSpaceName: '',
      debugPrograms: [],
      debugMarkers: [],
      programListFilterString: '',
      copyProgramListFilterString: '',
      showCreateProgramDialog: false,

      // {Object|null} - The program currently selected and being displayed in the editor, null for none.
      programInEditor: null,

      // {string|null} - The program code currently being edited.  When a program is first selected, this is set to
      // the current value of that program's code.  It diverges from that code as the user makes edits.
      codeInEditor: null
    };

    // @private {Object|null} - local reference to the editor, initialized when the editor component mounts
    this._editor = null;

    // @private {number|null} - id of current timeout for polling the space info in the DB, null when no timeout set
    this._pollSpaceTimeout = null;

    // Process query parameters
    const urlSearchParams = new URLSearchParams( window.location.search );
    const params = Object.fromEntries( urlSearchParams.entries() );
    this.showTestButton = params.showTestButton !== undefined;
  }

  componentDidMount() {
    window.addEventListener( 'resize', this._updatePageWidth.bind( this ) );
    this._updatePageWidth();
    this._updateSpacesList();
    this._pollSpaceUrl();
  }

  /**
   * Update the list of spaces that are available by getting them from the server.
   * @private
   */
  _updateSpacesList() {
    const spacesListUrl = new URL( 'api/spaces-list', window.location.origin ).toString();
    xhr.get( spacesListUrl, { json: true }, ( error, response ) => {
      if ( error ) {
        console.error( error );
      }
      else {
        if ( Array.isArray( response.body ) ) {
          this.setState( { availableSpaces: response.body } );

          // If the currently selected space name is not on the list of available spaces, use the first available space.
          if ( this.state.availableSpaces.length > 0 &&
               !this.state.availableSpaces.includes( this.state.selectedSpaceName ) ) {
            this.setState( { selectedSpaceName: this.state.availableSpaces[ 0 ] } );

            // Since the space was changed, we need to update the information associated with it.
            this._pollSpaceUrl();
          }
        }
      }
    } );
  }

  /**
   * Update the data about the "space" that is currently in use by requesting the latest data from the server and
   * updating the local state with the response.  Also, set a timeout to poll again at the next time period.
   * @private
   */
  _pollSpaceUrl() {
    const beginTimeMs = Date.now();

    // Request the space data from the server.
    const spaceUrl = getApiUrl( this.state.selectedSpaceName );
    xhr.get( spaceUrl, { json: true }, ( error, response ) => {
      if ( error ) {
        console.error( error );
      }
      else {
        if ( !_.isEqual( this.state.spaceData, response.body ) ) {
          this.setState( { spaceData: response.body }, () => {
            this._programsChange( this.props.paperProgramsProgramsToRender );

            // Determine whether the program that is currently selected in the editor is in the selected space.
            const selectedProgramInSpace = !!this.state.programInEditor && this.state.spaceData.programs.find(
              program => program.number === this.state.programInEditor.number
            ) !== undefined;
            if ( !selectedProgramInSpace ) {

              // The selected space does not contain the currently selected program, probably because the user chose
              // a new space.  Load a default program from the selected space into the editor.
              this._loadEditorWithDefault();
            }
          } );
        }
      }
    } );

    // Set a timeout to call this function again at the appropriate time.
    const elapsedTimeMs = Date.now() - beginTimeMs;
    if ( this._pollSpaceTimeout !== null ) {
      clearTimeout( this._pollSpaceTimeout );
    }
    this._pollSpaceTimeout = setTimeout(
      this._pollSpaceUrl.bind( this ),
      Math.max( 0, SPACE_DATA_POLLING_PERIOD * 1000 - elapsedTimeMs )
    );
  }

  /**
   * Add a new space to the DB.  Since the DB doesn't REALLY have separate spaces, this is done be adding an initial
   * program with this new space name as the space value.
   * @param {string} spaceName
   * @private
   */
  _addNewSpace( spaceName ) {

    xhr.post(
      getApiUrl( spaceName, '/programs' ),
      { json: { code: helloWorld } },
      error => {
        if ( error ) {
          console.error( error );
        }
        else {

          // The request to add a new space succeeded, so add this to the list of available spaces.
          this.setState( { availableSpaces: [ ...this.state.availableSpaces, spaceName ] } );

          // Select this space.
          this.setState( { selectedSpaceName: spaceName } );
        }
      }
    );

    const addSpaceUrl = new URL( 'api/add-space', window.location.origin ).toString();
    const addRequestedSpaceUrl = `${addSpaceUrl}/${spaceName}`;
    xhr.get( addRequestedSpaceUrl, { json: true }, error => {
      if ( error ) {
        console.error( `error adding space: ${error}` );
      }
    } );
  }

  _updatePageWidth() {
    this.setState( { pageWidth: document.body.clientWidth } );
  }

  _print( program ) {
    printPage(
      program.number,
      codeToName( program.currentCode ),
      this.props.config.paperSize
    );
    this._markPrinted( program, true );
  }

  _printCalibration() {
    printCalibrationPage( this.props.config.paperSize );
  }

  _markPrinted( program, printed ) {
    xhr.post(
      getApiUrl( this.state.spaceData.spaceName, `/programs/${program.number}/markPrinted` ),
      { json: { printed } },
      ( error, response ) => {
        if ( error ) {
          console.error( error );
        }
        else {
          this.setState( { spaceData: response.body } );
        }
      }
    );
  }

  _createDebugProgram( number, programName ) {
    const paperSize = clientConstants.paperSizes[ this.props.config.paperSize ];
    const widthToHeightRatio = paperSize[ 0 ] / paperSize[ 1 ];
    const height = 0.2;
    const width = height * widthToHeightRatio;

    const debugPrograms = this.state.debugPrograms;
    const newProgram = {
      number,
      programName,
      points: [
        { x: 0.0, y: 0.0 },
        { x: width, y: 0.0 },
        { x: width, y: height },
        { x: 0.0, y: height }
      ]
    };
    debugPrograms.push( newProgram );
    this.setState( { debugPrograms } );
  }

  /**
   * Creates a debug marker with the provided color. It will be rendered in the camera view and the code
   * will run as if a marker of this color is detected by the camera.
   * @private
   */
  _createDebugMarker( colorIndex ) {
    markerCount++;

    const colorsRGB = this.props.config.colorsRGB.slice();

    const debugMarkers = this.state.debugMarkers;
    const newMarker = {

      // further from the origin so it is easier to grab initially
      position: { x: 0.3, y: 0.3 },
      color: colorsRGB[ colorIndex ],
      colorName: clientConstants.englishColorNames[ colorIndex ],
      count: markerCount
    };
    debugMarkers.push( newMarker );
    this.setState( { debugMarkers } );
  }

  _programsChange( programsToRender ) {
    this.props.onProgramsChange(
      programsToRender.map( program => {
        const programWithData = this.state.spaceData.programs.find(
          program2 => program2.number.toString() === program.number.toString()
        );
        if ( !programWithData ) {
          return null;
        }
        return {
          ...program,
          currentCodeUrl: programWithData.currentCodeUrl,
          currentCodeHash: programWithData.currentCodeHash,
          debugUrl: programWithData.debugUrl,
          claimUrl: programWithData.claimUrl,
          editorInfo: programWithData.editorInfo,
          codeHasChanged: programWithData.codeHasChanged
        };
      } ).filter( Boolean )
    );
  }

  _handleNewSpaceNameChange( event ) {
    this.setState( { newSpaceName: event.target.value } );
  }

  /**
   * Validate a potential space name.  This optionally puts up alert dialogs for invalid values.
   * @param {string} spaceName
   * @param {boolean} [showErrors]
   * @returns {boolean}
   * @private
   */
  _isValidSpaceName( spaceName, showErrors = false ) {
    let isValid = true;
    let errorMessage = '';
    if ( isValid && spaceName.length === 0 ) {
      isValid = false;
      errorMessage = 'Space name too short.';
    }
    if ( isValid && spaceName.match( /[^A-Za-z0-9\-_]+/ ) !== null ) {
      isValid = false;
      errorMessage = 'Invalid characters in space name.';
      errorMessage += '\n\nNames can contain upper- and lower-case letters, numbers, dashes, and/or underscores.';
    }
    if ( isValid && this.state.availableSpaces.includes( spaceName ) ) {
      isValid = false;
      errorMessage = `Space ${spaceName} already exists.`;
    }

    if ( showErrors && errorMessage.length ) {
      window.alert( `Error: ${errorMessage}` );
    }

    return isValid;
  }

  /**
   * Handler for when the user submits a new space name.
   * @param {Event} event
   * @returns boolean - true if name is valid and space creation request was successfully submitted
   * @private
   */
  _handleNewSpaceNameSubmit( event ) {
    let succeeded = false;
    const newSpaceName = this.state.newSpaceName;
    if ( this._isValidSpaceName( newSpaceName, true ) ) {
      this._addNewSpace( newSpaceName );
      succeeded = true;
    }
    event.preventDefault();
    return succeeded;
  }

  _saveProgram() {
    const { programInEditor, codeInEditor } = this.state;
    if ( !programInEditor ) {
      alert( 'Error: No program selected, save operation not possible.' );
    }
    else {

      // Save this program by sending it to the server.
      xhr.put(
        getApiUrl( this.state.selectedSpaceName, `/programs/${programInEditor.number}` ),
        {
          json: { code: codeInEditor }
        },
        error => {
          if ( error ) {
            alert( `Error saving program: ${error}` );
          }
          else {

            // The save succeeded.  Update the code associated with the editor.
            const programInEditor = this.state.programInEditor;
            programInEditor.currentCode = codeInEditor;
            this.setState( { programInEditor } );

            // Update the space data.  This would be updated on the next poll anyway, but it's probably best to make
            // sure that they aren't out of sync, even briefly.
            const spaceData = this.state.spaceData;
            const programInSpaceData = this.state.spaceData.programs.find(
              program => program.number === programInEditor.number
            );
            programInSpaceData.currentCode = codeInEditor;
            this.setState( { spaceData } );
          }
        }
      );
    }
  }

  /**
   * Delete the specified program.
   * @param {string} spaceName
   * @param {string|number} programNumber
   * @private
   */
  _deleteProgram( spaceName, programNumber ) {
    xhr.get(
      getApiUrl( spaceName, `/delete/${programNumber}` ),
      {
        json: {}
      },
      ( error, response ) => {
        if ( error ) {
          alert( `Error deleting program: ${error}` );
        }
        else if ( response.body.numberOfProgramsDeleted !== 1 ) {
          if ( response.body.numberOfProgramsDeleted === 0 ) {
            alert( 'Delete failed - program not found in database.' );
          }
          else {
            alert( `Unexpected number of programs deleted: ${response.body.numberOfProgramsDeleted}` );
          }
        }
      }
    );
  }

  /**
   * Load the editor with the default program, which is the program with the lowest number if there are some, or a
   * default string if not.
   * @private
   */
  _loadEditorWithDefault() {

    // Set the editor to display the first program on the program list.
    if ( this.state.spaceData.programs.length > 0 ) {
      const programsSortedByIdNumber = this.state.spaceData.programs.sort(
        ( programA, programB ) => programA.number - programB.number
      );
      const autoSelectedProgram = programsSortedByIdNumber[ 0 ];
      this.setState( {
        programInEditor: autoSelectedProgram,
        codeInEditor: autoSelectedProgram.currentCode.slice()
      } );
    }
    else {
      this.setState( {
        programInEditor: null,
        codeInEditor: '// No programs available.'
      } );
    }
  }

  /**
   * Handler function for when the editor mounts, adds the keycode for saving a program.
   * @param editor
   * @param monaco
   * @private
   */
  _onEditorDidMount( editor, monaco ) {

    this._loadEditorWithDefault();

    // Add the hot key for saving changes in the editor.
    // eslint-disable-next-line no-bitwise
    editor.addCommand( monaco.KeyMod.CtrlCmd | monaco.KeyCode.KEY_S, this._saveProgram.bind( this ) );

    // Save a reference to the editor so that its configuration can be changed if necessary.
    this._editor = editor;
  }

  /**
   * Get a boolean value indicating whether the code in the editor has changed since the last time the program was
   * saved.
   * @returns {boolean}
   * @private
   */
  _isCodeChanged() {
    return !!this.state.programInEditor && this.state.programInEditor.currentCode !== this.state.codeInEditor;
  }

  /**
   * Get the text that should be used as the label for the editor component.  This varies based on the state of the
   * program, which is why there is a method for getting it.
   * @returns {string}
   * @private
   */
  _getEditorLabelText() {
    let editorLabelText = 'No program selected.';
    if ( this.state.programInEditor ) {
      const program = this.state.programInEditor;
      if ( this.state.programInEditor.editorInfo.readOnly ||
           this.state.programInEditor.editorInfo.claimed ) {

        // The text should indicate that the file is only available for viewing, not editing.
        editorLabelText = `Viewing program #${program.number} (read only)`;
      }
      else {

        // The program is in a state where the user should be able to edit it.
        editorLabelText = `Editing program #${program.number}`;
      }
    }
    return editorLabelText;
  }

  /**
   * A method to print debug information during rendering.  Feel free to alter as needed for debugging purposes.
   * @param message
   * @param retVal
   * @private
   */
  _printDebugMessage( message, retVal ) {
    if ( this.lastDebugMessage === undefined || message !== this.lastDebugMessage ) {
      console.log( message );
      this.lastDebugMessage = message;
    }
    return retVal;
  }

  render() {
    const padding = parseInt( styles.cameraMainPadding, 10 );
    const sidebarWidth = parseInt( styles.cameraMainSidebarWidth, 10 );
    const editorUrl = new URL(
      `editor.html?${this.state.spaceData.spaceName}`,
      window.location.origin
    ).toString();

    // Determine whether it is okay for the user to make changes to the program that is currently shown in the editor.
    const okayToEditSelectedProgram = !!this.state.programInEditor &&
                                      !this.state.programInEditor.editorInfo.readOnly &&
                                      !this.state.programInEditor.editorInfo.claimed;

    // Update the readOnly state of the editor if necessary.
    if ( this._editor && this._editor.getConfiguration().readOnly !== !okayToEditSelectedProgram ) {
      this._editor.updateOptions( { readOnly: !okayToEditSelectedProgram } );
    }

    // Return the JSX that essentially renders the component.
    return (
      <div className={styles.root}>
        <div className={styles.appRoot}>

          {/* The modal dialog used to create a new program by copying an existing program. */}
          <CreateProgramsDialog
            data={this.state}
            hideDialog={() => this.setState( { showCreateProgramDialog: false } )}
            setSearchString={str => this.setState( { copyProgramListFilterString: str } )}
          />

          <div
            className={styles.videoAndEditorContainer}
            style={{ width: this.state.pageWidth - padding * 3 - sidebarWidth }}
          >
            <div className={styles.video}>
              <CameraVideo
                width={this.state.pageWidth - padding * 3 - sidebarWidth}
                config={this.props.config}
                onConfigChange={this.props.onConfigChange}
                onProcessVideo={( { programsToRender, markers, framerate } ) => {
                  this.setState( { framerate } );
                  this._programsChange( programsToRender );
                  this.props.onMarkersChange( markers );
                }}
                allowSelectingDetectedPoints={this.state.selectedColorIndex !== -1}
                onSelectPoint={( { color, size } ) => {
                  if ( this.state.selectedColorIndex === -1 ) {
                    return;
                  }

                  const colorsRGB = this.props.config.colorsRGB.slice();
                  colorsRGB[ this.state.selectedColorIndex ] = color.map( value => Math.round( value ) );

                  const paperDotSizes = this.props.config.paperDotSizes.slice();
                  paperDotSizes[ this.state.selectedColorIndex ] = size;

                  this.props.onConfigChange( { ...this.props.config, colorsRGB, paperDotSizes } );
                  this.setState( { selectedColorIndex: -1 } );
                }}
                debugPrograms={this.state.debugPrograms}
                removeDebugProgram={program => {
                  const debugPrograms = this.state.debugPrograms.filter( p => p !== program );
                  this.setState( { debugPrograms } );
                }}
                debugMarkers={this.state.debugMarkers}
                removeDebugMarker={marker => {
                  const debugMarkers = this.state.debugMarkers.slice();
                  const index = debugMarkers.indexOf( marker );
                  debugMarkers.splice( index, 1 );
                  this.setState( { debugMarkers } );
                }}
              />
            </div>

            <div className={styles.editorTitleBar}>
              <p>{this._getEditorLabelText()}</p>
              {
                okayToEditSelectedProgram &&
                (
                  <>
                    <Button
                      onClick={this._saveProgram.bind( this )}
                      disabled={!this._isCodeChanged()}
                    >
                      <span className={styles.iconButtonSpan}>
                        <img src={'media/images/upload.svg'} alt={'Save icon'}/>
                        Save to DB
                      </span>
                    </Button>
                    <Button
                      onClick={() => {
                        if ( confirm( PROGRAM_DELETE_WARNING ) === true ) {
                          this._deleteProgram( this.state.selectedSpaceName, this.state.programInEditor.number );
                        }
                      }}
                    >
                      <span className={styles.iconButtonSpan}>
                        <img src={'media/images/trash3.svg'} alt={'Delete icon'}/>
                        Delete
                      </span>
                    </Button>
                  </>
                )
              }
            </div>

            <div className={styles.editor}>
              <MonacoEditor
                language='javascript'
                theme='vs-dark'
                value={this.state.codeInEditor || '// Select Program'}
                onChange={code => this.setState( { codeInEditor: code } )}
                editorDidMount={this._onEditorDidMount.bind( this )}
                options={{
                  tabSize: 2,
                  fontSize: '16px',
                  minimap: { enabled: false },
                  automaticLayout: true
                }}
              />
            </div>
          </div>

          <div className={styles.sidebar}>
            {this.showTestButton ? (
              <Button
                onClick={() => {

                  // Get a list of the supported constraints for the devices available from this browser.
                  const supportedConstraints = navigator.mediaDevices.getSupportedConstraints();
                  console.log( '===== Supported Constraints =====' );
                  console.log( `${JSON.stringify( supportedConstraints, null, 2 )}` );

                  // Get a list of all media devices and log some of the information to the console.
                  navigator.mediaDevices
                    .enumerateDevices()
                    .then( devices => {
                      console.log( '===== Device List =====' );
                      devices.forEach( device => {
                        console.log( `${device.kind}: ${device.label} id = ${device.deviceId}` );
                      } );
                    } )
                    .catch( err => {
                      console.error( `${err.name}: ${err.message}` );
                    } );

                  // Get the video track.
                  navigator.mediaDevices.getUserMedia( { video: true } )
                    .then( mediaStream => {
                      const track = mediaStream.getVideoTracks()[ 0 ];
                      if ( track ) {

                        // Log information about the video track to the console.
                        console.log( `===== found track = ${track.label}, capabilities below =====` );
                        console.log( `${JSON.stringify( track.getCapabilities(), null, 2 )}` );

                        console.log( '===== track settings =====' );
                        console.log( `${JSON.stringify( track.getSettings(), null, 1 )}` );

                        console.log( '===== track constraints =====' );
                        console.log( `${JSON.stringify( track.getConstraints(), null, 1 )}` );
                      }
                    } )
                    .catch( e => {
                      console.log( `Error getting video track = ${e}` );
                    } );
                }
                }
              >
                Test Button
              </Button>
            ) : ( '' )}
            <div className={`${styles.sidebarSection} ${styles.create}`}>
              <button onClick={() => { this.setState( { showCreateProgramDialog: true } ); }}>Create Programs</button>
              <a href={editorUrl} target='_blank' className={styles.editorAnchor} rel='noreferrer'>
                Open Code Editor <br></br>
                for this Space
              </a>
            </div>
            <div className={styles.sidebarSection}>
              <h3 className={styles.sidebarSubSection}>Space</h3>
              <div>
                <div>
                  <label htmlFor='spaces'>Select a Space:</label>
                  <select
                    name='spaces'
                    id='spaces'
                    value={this.state.selectedSpaceName}
                    onChange={event => {
                      this.setState( { selectedSpaceName: event.target.value } );
                      this.props.onConfigChange( {
                        ...this.props.config,
                        selectedSpaceName: event.target.value
                      } );
                    }}
                  >
                    {this.state.availableSpaces.map( ( option, index ) => {
                      return <option key={index}>
                        {option}
                      </option>;
                    } )}
                  </select>
                </div>
                <div>
                  {this.state.isAddingNewSpace ? (
                    <div>
                      <form onSubmit={event => {
                        if ( this._handleNewSpaceNameSubmit( event ) ) {
                          this.setState( { isAddingNewSpace: false } );
                        }
                      }}>
                        <label>
                          Name:&nbsp;
                          <input
                            type='text'
                            onChange={this._handleNewSpaceNameChange.bind( this )}
                          />
                        </label>
                        <br/>
                        <button type='submit'>
                          Confirm
                        </button>
                        <button type='button' onClick={() => this.setState( { isAddingNewSpace: false } )}>
                          Cancel
                        </button>
                      </form>
                    </div>
                  ) : (
                     <div>
                       <button onClick={() => {
                         this.setState( { isAddingNewSpace: true } );
                         this.setState( { newSpaceName: '' } );
                       }}>
                         Add New Space
                       </button>
                     </div>
                   )}
                </div>
              </div>
            </div>
            <div className={styles.sidebarSection}>
              <h3>Programs</h3>
              <label>Filter on:
                <input
                  name='filterProgramsOn'
                  style={{ marginBottom: '10px' }}
                  onChange={e => this.setState( { programListFilterString: e.target.value } )}
                />
              </label>
              <div className={`${styles.sidebarSubSection} ${styles.programList}`}>
                <div>
                  {this.state.spaceData.programs
                    .filter( program => programMatchesFilterString( program.currentCode, this.state.programListFilterString ) )
                    .sort( ( programA, programB ) => programA.number - programB.number )
                    .map( program => (
                      <div
                        key={program.number}
                        className={[
                          this.state.programInEditor && program.number === this.state.programInEditor.number ?
                          styles.selectedProgramListItem :
                          styles.programListItem
                        ].join( ' ' )}
                      >
                        <span
                          className={styles.programListItemContent}
                          onClick={event => {
                            event.stopPropagation();
                            this.setState( {
                              programInEditor: program,
                              codeInEditor: program.currentCode.slice()
                            } );
                          }}
                        >
                          <span
                            className={styles.programListItemName}
                          >
                            <strong>#{program.number}</strong> {codeToName( program.currentCode )}{' '}
                          </span>
                        </span>
                        <span
                          className={styles.programListIcon}
                          onClick={event => {
                            event.stopPropagation();
                            this._print( program );
                          }}
                        >
                          <img src={'media/images/printer.svg'} alt={'Printer icon'}/>
                        </span>
                        {this.state.debugPrograms.find( p => p.number === program.number ) === undefined ? (
                          <span
                            className={styles.programListIcon}
                            onClick={event => {
                              event.stopPropagation();
                              this._createDebugProgram( program.number, codeToName( program.currentCode ) );
                            }}
                          >
                            <img src={'media/images/eye.svg'} alt={'Preview icon'}/>
                          </span>
                        ) : (
                           ''
                         )}
                      </div>
                    ) )}
                </div>
              </div>
            </div>
            <div className={styles.sidebarSection}>
              <h3>Markers</h3>
              <div
                className={styles.sidebarSubSection}
              >
                {this.props.config.colorsRGB.map( ( color, colorIndex ) => (
                  <ColorListItem
                    key={colorIndex}
                    colorIndex={colorIndex}
                    color={color}
                    size={50}
                    onClick={this._createDebugMarker.bind( this )}
                  ></ColorListItem>
                ) )}
              </div>
            </div>

            <div className={styles.sidebarSection}>
              <h3>Printing</h3>
              <p>Click the print icon next to the program name to print.</p>
              <div className={styles.sidebarSubSection}>
                <span>Paper Size: </span>
                <select
                  value={this.props.config.paperSize}
                  onChange={event => {
                    const paperSize = event.target.value;
                    this.props.onConfigChange( { ...this.props.config, paperSize } );
                  }}
                >
                  <optgroup label='Common'>
                    {clientConstants.commonPaperSizeNames.map( name => {
                      return (
                        <option key={name} value={name}>
                          {name}
                        </option>
                      );
                    } )}
                  </optgroup>
                  <optgroup label='Other'>
                    {clientConstants.otherPaperSizeNames.map( name => {
                      return (
                        <option key={name} value={name}>
                          {name}
                        </option>
                      );
                    } )}
                  </optgroup>
                </select>
              </div>
              <div>
                <button onClick={this._printCalibration}>Print Calibration Page</button>
                {' '}
              </div>
            </div>

            <div className={styles.sidebarSection}>
              <h3>Calibration</h3>
              <div className={styles.sidebarSubSection}>
                {this.props.config.colorsRGB.map( ( color, colorIndex ) => (
                  <ColorListItem
                    colorIndex={colorIndex}
                    color={color}
                    key={colorIndex}
                  ></ColorListItem>

                ) )}
              </div>
            </div>

            <div className={styles.sidebarSection}>
              <h3 className={styles.headerWithOption}>Detection</h3>
              <div className={styles.optionWithHeader}>
                <input
                  type='checkbox'
                  name='freezeDetection'
                  checked={this.props.config.freezeDetection}
                  onChange={() =>
                    this.props.onConfigChange( {
                      ...this.props.config,
                      freezeDetection: !this.props.config.freezeDetection
                    } )
                  }
                />
                <label htmlFor='freezeDetection'>pause</label>
              </div>

              <div className={styles.sidebarSubSection}>
                <span>Accuracy</span>
                <input
                  name='scaleFactor'
                  type='range'
                  min='1'
                  max='10'
                  step='1'
                  value={this.props.config.scaleFactor}
                  onChange={event => {
                    this.props.onConfigChange( {
                      ...this.props.config,
                      scaleFactor: event.target.valueAsNumber
                    } );
                  }}
                />
                <span>Performance</span>
              </div>
              <div className={styles.sidebarSubSection}>
                Framerate <strong>{this.state.framerate}</strong>
              </div>

              <h4>Overlays</h4>
              <div className={styles.sidebarSubSection}>
                <input
                  type='checkbox'
                  checked={this.props.config.showOverlayKeyPointCircles}
                  onChange={() =>
                    this.props.onConfigChange( {
                      ...this.props.config,
                      showOverlayKeyPointCircles: !this.props.config.showOverlayKeyPointCircles
                    } )
                  }
                />{' '}
                keypoint circles
              </div>

              <div className={styles.sidebarSubSection}>
                <input
                  type='checkbox'
                  checked={this.props.config.showOverlayKeyPointText}
                  onChange={() =>
                    this.props.onConfigChange( {
                      ...this.props.config,
                      showOverlayKeyPointText: !this.props.config.showOverlayKeyPointText
                    } )
                  }
                />{' '}
                keypoint text
              </div>

              <div className={styles.sidebarSubSection}>
                <input
                  type='checkbox'
                  checked={this.props.config.showOverlayComponentLines}
                  onChange={() =>
                    this.props.onConfigChange( {
                      ...this.props.config,
                      showOverlayComponentLines: !this.props.config.showOverlayComponentLines
                    } )
                  }
                />{' '}
                component lines
              </div>

              <div className={styles.sidebarSubSection}>
                <input
                  type='checkbox'
                  checked={this.props.config.showOverlayShapeId}
                  onChange={() =>
                    this.props.onConfigChange( {
                      ...this.props.config,
                      showOverlayShapeId: !this.props.config.showOverlayShapeId
                    } )
                  }
                />{' '}
                shape ids
              </div>

              <div className={styles.sidebarSubSection}>
                <input
                  type='checkbox'
                  checked={this.props.config.showOverlayProgram}
                  onChange={() =>
                    this.props.onConfigChange( {
                      ...this.props.config,
                      showOverlayProgram: !this.props.config.showOverlayProgram
                    } )
                  }
                />{' '}
                programs
              </div>
            </div>
            {/*<div className={styles.sidebarSection}>*/}
            {/*  <CameraControls*/}
            {/*    data={this.state}*/}
            {/*  />*/}
            {/*</div>*/}
          </div>
        </div>
      </div>
    );
  }
}