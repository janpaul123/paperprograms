import React from 'react';
import Button from 'react-bootstrap/Button';
import xhr from 'xhr';
import { colorNames, commonPaperSizeNames, otherPaperSizeNames, paperSizes } from '../constants';
import { codeToName, codeToPrint, getApiUrl, programMatchesFilterString } from '../utils';
import styles from './CameraMain.css';
import CameraVideo from './CameraVideo.js';
import CreateProgramDialog from './CreateProgramDialog.js';
import helloWorld from './helloWorld';
import { printCalibrationPage, printPage } from './printPdf';

// constants
const SPACE_DATA_POLLING_PERIOD = 1; // in seconds
export const ProgramCreateModes = {
  SIMPLE_HELLO_WORLD: 'simpleHelloWorld',
  COPY_EXISTING: 'copyExisting'
};

const BASE_API_URL = new URL( 'api', window.location.origin ).toString();

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
      programListFilterString: '',
      copyProgramListFilterString: '',
      showCreateProgramDialog: false,
      programCreateMode: ProgramCreateModes.SIMPLE_HELLO_WORLD,
      selectedProgramToCopy: '',
      programCodeToCopy: ''
    };

    // @private {number|null} - id of current timeout, null when no timeout set
    this._timeout = null;

    // Process query parameters
    const urlSearchParams = new URLSearchParams( window.location.search );
    const params = Object.fromEntries( urlSearchParams.entries() );
    this.showTestButton = params.hasOwnProperty( 'showTestButton' );
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
        console.error( error ); // eslint-disable-line no-console
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
        console.error( error ); // eslint-disable-line no-console
      }
      else {
        this.setState( { spaceData: response.body }, () => {
          this._programsChange( this.props.paperProgramsProgramsToRender );
        } );
      }
    } );

    // Set a timeout to call this function again at the appropriate time.
    const elapsedTimeMs = Date.now() - beginTimeMs;
    if ( this._timeout !== null ) {
      clearTimeout( this._timeout );
    }
    this._timeout = setTimeout(
      this._pollSpaceUrl.bind( this ),
      Math.max( 0, SPACE_DATA_POLLING_PERIOD * 1000 - elapsedTimeMs )
    );
  };

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
          console.error( error ); // eslint-disable-line no-console
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
    xhr.get( addRequestedSpaceUrl, { json: true }, ( error, response ) => {
      if ( error ) {
        console.error( `error adding space: ${error}` ); // eslint-disable-line no-console
      }
    } );
  }

  // TODO: Should this use async/Promise instead of callback?
  static getProgram( spaceName, programNumber, callback ) {

    // program.:spaceName.:number.js
    const getProgramUrl = new URL( 'program', window.location.origin ).toString();
    const getRequestedProgramUrl = `${getProgramUrl}.${spaceName}.${programNumber}.js`;
    xhr.get( getRequestedProgramUrl, { json: true }, ( error, response ) => {
      if ( error ) {
        console.error( `error adding space: ${error}` ); // eslint-disable-line no-console
      }
      else {
        callback( response.body );
      }
    } );
  }

  /**
   * Gets programs for the provided spaces from the database and passes them to the provided callback for further work.
   * Provide an array of the space names, or '*' for all spaces.
   *
   * TODO: We want to make this return summary information about the program.
   * @param {string[] | '*'} spaces
   * @param callback
   */
  static getProgramSummaryList( spaces, callback ) {

    let spacesString = '';
    if ( Array.isArray( spaces ) ) {
      spacesString = spaces.join( ',' );
    }
    else if ( spaces === '*' ) {

      // handle the wildcard space
      spacesString = spaces;
    }
    else {
      alert( 'Bad spaces list in getProgramSummaryList' );
    }

    const getProgramSummaryUrl = `${BASE_API_URL}/program-summary-list/${spacesString}`;
    xhr.get( getProgramSummaryUrl, { json: true }, ( error, response ) => {
      if ( error ) {
        console.error( `error getting program summary list: ${error}` ); // eslint-disable-line no-console
      }
      else {
        callback( response.body );
      }
    } );
  }

  _updatePageWidth() {
    this.setState( { pageWidth: document.body.clientWidth } );
  };

  _print( program ) {
    printPage(
      program.number,
      codeToName( program.currentCode ),
      codeToPrint( program.originalCode ),
      this.props.config.paperSize
    );
    this._markPrinted( program, true );
  };

  _printCalibration() {
    printCalibrationPage( this.props.config.paperSize );
  };

  _markPrinted( program, printed ) {
    xhr.post(
      getApiUrl( this.state.spaceData.spaceName, `/programs/${program.number}/markPrinted` ),
      { json: { printed } },
      ( error, response ) => {
        if ( error ) {
          console.error( error ); // eslint-disable-line no-console
        }
        else {
          this.setState( { spaceData: response.body } );
        }
      }
    );
  };

  _createHelloWorld() {
    xhr.post(
      getApiUrl( this.state.selectedSpaceName, '/programs' ),
      { json: { code: helloWorld } },
      error => {
        if ( error ) {
          console.error( error ); // eslint-disable-line no-console
        }
        else {
          alert( 'Created "Hello World" program' );
        }
      }
    );
  };

  /**
   * Create a copy of the provided program code and add it to the current space.  The program will be created with the
   * existing name with ' - Copy' appended to it.
   * @param {string} programCodeToCopy
   * @private
   */
  _createProgramCopyFromCode( programCodeToCopy ) {

    // Get the individual lines of the program that is being copied.
    const programLines = programCodeToCopy.split( '\n' );

    // Add the ' - Copy' portion to the title.
    programLines[ 0 ] = programLines[ 0 ] + ' - Copy';

    const copiedProgram = programLines.reduce( ( programSoFar, currentLine, index ) => {
      programSoFar += currentLine;
      if ( index < programLines.length ) {
        programSoFar += '\n';
      }
      return programSoFar;
    }, '' );

    xhr.post(
      getApiUrl( this.state.selectedSpaceName, '/programs' ),
      { json: { code: copiedProgram } },
      error => {
        if ( error ) {
          console.error( error ); // eslint-disable-line no-console
        }
        else {
          alert( `Created program "${codeToName( copiedProgram )}"` )
        }
      }
    );
  }

  _createDebugProgram( number, programName ) {
    const paperSize = paperSizes[ this.props.config.paperSize ];
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
        { x: 0.0, y: height },
      ],
    };
    debugPrograms.push( newProgram );
    this.setState( { debugPrograms } );
  };

  _programsChange( programsToRender ) {
    this.props.onProgramsChange(
      programsToRender
        .map( program => {
          const programWithData = this.state.spaceData.programs.find(
            program2 => program2.number.toString() === program.number.toString()
          );
          if ( !programWithData ) {
            return;
          }
          return {
            ...program,
            currentCodeUrl: programWithData.currentCodeUrl,
            currentCodeHash: programWithData.currentCodeHash,
            debugUrl: programWithData.debugUrl,
            claimUrl: programWithData.claimUrl,
            editorInfo: programWithData.editorInfo,
            codeHasChanged: programWithData.codeHasChanged,
          };
        } )
        .filter( Boolean )
    );
  };

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
      errorMessage += '\n\nNames can contain upper- and lower-case letters, numbers, dashes, and/or underscores.'
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

  /**
   * Handler function for the button in the "Create New Program" dialog that indicates that the user wants to create a
   * program by copying an existing one.
   * @private
   */
  _handleCreateNewProgramButtonClicked() {
    if ( this.state.programCreateMode === ProgramCreateModes.COPY_EXISTING ) {

      if ( this.state.programCodeToCopy !== '' ) {
        this._createProgramCopyFromCode( this.state.programCodeToCopy );
      }
      else {
        alert( `Error: Invalid program number - ${this.state.selectedProgramToCopy}` );
      }
    }
    else if ( this.state.programCreateMode === ProgramCreateModes.SIMPLE_HELLO_WORLD ) {
      this._createHelloWorld();
    }
    this._hideCreateProgramDialog();
  }

  /**
   * Hide the dialog that is used to create new programs.
   * @private
   */
  _hideCreateProgramDialog() {
    this.state.showCreateProgramDialog = false;
    this.state.selectedProgramToCopy = '';
  }

  render() {
    const padding = parseInt( styles.cameraMainPadding );
    const sidebarWidth = parseInt( styles.cameraMainSidebarWidth );
    const editorUrl = new URL(
      `editor.html?${this.state.spaceData.spaceName}`,
      window.location.origin
    ).toString();

    return (
      <div className={styles.root}>
        <div className={styles.appRoot}>

          {/* The modal dialog used to create a new program by copying an existing program. */}
          <CreateProgramDialog
            data={this.state}
            onCreateProgram={this._handleCreateNewProgramButtonClicked.bind( this )}
            onCancel={this._hideCreateProgramDialog.bind( this )}
            setSearchString={str => this.setState( { copyProgramListFilterString: str } )}
          />

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
            />
          </div>
          <div className={styles.sidebar}>
            {this.showTestButton ? (
              <Button onClick={() => CameraMain.getProgramSummaryList( [ 'taliesin', 'templates' ], ( summaryList ) => console.log( summaryList ) )}>Test Button</Button>
            ) : ( '' )}
            <div className={`${styles.sidebarSection} ${styles.create}`}>
              <button onClick={() => this.state.showCreateProgramDialog = true}>Create Program</button>
              <a href={editorUrl} target="_blank" className={styles.editorAnchor}>
                Open Editor
              </a>
            </div>
            <div className={styles.sidebarSection}>
              <h3 className={styles.sidebarSubSection}>Space</h3>
              <div>
                <div>
                  <label htmlFor="spaces">Select a Space:</label>
                  <select
                    name="spaces"
                    id="spaces"
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
                      </option>
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
                            type="text"
                            onChange={this._handleNewSpaceNameChange.bind( this )}
                          />
                        </label>
                        <br/>
                        <button type="submit">
                          Confirm
                        </button>
                        <button type="button" onClick={() => this.setState( { isAddingNewSpace: false } )}>
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
              <label>
                Filter on: <input
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
                          styles.programListItem,
                          program.printed
                          ? styles.programListItemPrinted
                          : styles.programListItemNotPrinted,
                        ].join( ' ' )}
                      >
                        <span className={styles.programListItemContent}>
                          <span className={styles.programListItemName}>
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
                          <img src={"media/images/printer.svg"}/>
                        </span>
                        {this.state.debugPrograms.find( p => p.number === program.number ) === undefined ? (
                          <span
                            className={styles.programListIcon}
                            onClick={event => {
                              event.stopPropagation();
                              this._createDebugProgram( program.number, codeToName( program.currentCode ) );
                            }}
                          >
                            <img src={"media/images/eye.svg"}/>
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
                  <optgroup label="Common">
                    {commonPaperSizeNames.map( name => {
                      return (
                        <option key={name} value={name}>
                          {name}
                        </option>
                      );
                    } )}
                  </optgroup>
                  <optgroup label="Other">
                    {otherPaperSizeNames.map( name => {
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
                  <div
                    key={colorIndex}
                    className={[
                      styles.colorListItem,
                      this.state.selectedColorIndex === colorIndex && styles.colorListItemSelected,
                    ].join( ' ' )}
                    style={{ background: `rgb(${color.slice( 0, 3 ).join( ',' )})` }}
                    onClick={() =>
                      this.setState( state => ( {
                        selectedColorIndex:
                          state.selectedColorIndex === colorIndex ? -1 : colorIndex,
                      } ) )
                    }
                  >
                    <strong>{colorNames[ colorIndex ]}</strong>
                  </div>
                ) )}
              </div>
            </div>

            <div className={styles.sidebarSection}>
              <h3 className={styles.headerWithOption}>Detection</h3>
              <div className={styles.optionWithHeader}>
                <input
                  type="checkbox"
                  name="freezeDetection"
                  checked={this.props.config.freezeDetection}
                  onChange={() =>
                    this.props.onConfigChange( {
                      ...this.props.config,
                      freezeDetection: !this.props.config.freezeDetection,
                    } )
                  }
                />
                <label htmlFor="freezeDetection">pause</label>
              </div>

              <div className={styles.sidebarSubSection}>
                <span>Accuracy</span>
                <input
                  name="scaleFactor"
                  type="range"
                  min="1"
                  max="10"
                  step="1"
                  value={this.props.config.scaleFactor}
                  onChange={event => {
                    this.props.onConfigChange( {
                      ...this.props.config,
                      scaleFactor: event.target.valueAsNumber,
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
                  type="checkbox"
                  checked={this.props.config.showOverlayKeyPointCircles}
                  onChange={() =>
                    this.props.onConfigChange( {
                      ...this.props.config,
                      showOverlayKeyPointCircles: !this.props.config.showOverlayKeyPointCircles,
                    } )
                  }
                />{' '}
                keypoint circles
              </div>

              <div className={styles.sidebarSubSection}>
                <input
                  type="checkbox"
                  checked={this.props.config.showOverlayKeyPointText}
                  onChange={() =>
                    this.props.onConfigChange( {
                      ...this.props.config,
                      showOverlayKeyPointText: !this.props.config.showOverlayKeyPointText,
                    } )
                  }
                />{' '}
                keypoint text
              </div>

              <div className={styles.sidebarSubSection}>
                <input
                  type="checkbox"
                  checked={this.props.config.showOverlayComponentLines}
                  onChange={() =>
                    this.props.onConfigChange( {
                      ...this.props.config,
                      showOverlayComponentLines: !this.props.config.showOverlayComponentLines,
                    } )
                  }
                />{' '}
                component lines
              </div>

              <div className={styles.sidebarSubSection}>
                <input
                  type="checkbox"
                  checked={this.props.config.showOverlayShapeId}
                  onChange={() =>
                    this.props.onConfigChange( {
                      ...this.props.config,
                      showOverlayShapeId: !this.props.config.showOverlayShapeId,
                    } )
                  }
                />{' '}
                shape ids
              </div>

              <div className={styles.sidebarSubSection}>
                <input
                  type="checkbox"
                  checked={this.props.config.showOverlayProgram}
                  onChange={() =>
                    this.props.onConfigChange( {
                      ...this.props.config,
                      showOverlayProgram: !this.props.config.showOverlayProgram,
                    } )
                  }
                />{' '}
                programs
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }
}
