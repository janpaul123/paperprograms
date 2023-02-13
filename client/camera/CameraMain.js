import React from 'react';
import xhr from 'xhr';

import { codeToName, codeToPrint, getApiUrl } from '../utils';
import { colorNames, paperSizes, commonPaperSizeNames, otherPaperSizeNames } from '../constants';
import { printCalibrationPage, printPage } from './printPdf';

import helloWorld from './helloWorld';
import styles from './CameraMain.css';

import CameraVideo from './CameraVideo';

// constants
const SPACE_DATA_POLLING_PERIOD = 0.5; // in seconds

export default class CameraMain extends React.Component {
  constructor( props ) {
    super( props );
    this.state = {
      pageWidth: 1,
      framerate: 0,
      selectedColorIndex: -1,
      spaceData: { programs: [] },
      autoPrintedNumbers: [],
      isEditingSpaceUrl: false,
      selectedSpaceName: props.config.selectedSpaceName,
      availableSpaces: [],
      isAddingNewSpace: false,
      newSpaceName: '',
      debugPrograms: [],
    };

    // @private {number|null} - id of current timeout, null when no timeout set
    this._timeout = null;
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
          if ( this.props.config.autoPrintEnabled ) {
            this._autoPrint();
          }
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
    console.log( `request to add new space: spaceName = ${spaceName}` );

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
      else {
        // this.setState( { spaceData: response.body }, () => {
        //   if ( this.props.config.autoPrintEnabled ) {
        //     this._autoPrint();
        //   }
        //   this._programsChange( this.props.paperProgramsProgramsToRender );
        // } );
        console.log( `JSON.stringify(response.body) = ${JSON.stringify( response.body )}` );
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

  _autoPrint() {
    const toPrint = this.state.spaceData.programs.filter(
      program => !program.printed && !this.state.autoPrintedNumbers.includes( program.number )
    );
    if ( toPrint.length > 0 ) {
      this.setState(
        { autoPrintedNumbers: this.state.autoPrintedNumbers.concat( [ toPrint[ 0 ].number ] ) },
        () => this._print( toPrint[ 0 ] )
      );
    }
  };

  _createHelloWorld() {
    xhr.post(
      getApiUrl( this.state.spaceData.spaceName, '/programs' ),
      { json: { code: helloWorld } },
      error => {
        if ( error ) {
          console.error( error ); // eslint-disable-line no-console
        }
      }
    );
  };

  _createDebugProgram( number ) {
    const paperSize = paperSizes[ this.props.config.paperSize ];
    const widthToHeightRatio = paperSize[ 0 ] / paperSize[ 1 ];
    const height = 0.2;
    const width = height * widthToHeightRatio;

    const debugPrograms = this.state.debugPrograms;
    const newProgram = {
      number,
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
            <div className={`${styles.sidebarSection} ${styles.create}`}>
              <button onClick={this._createHelloWorld}>Create Program</button>
              <a href={editorUrl} target="_blank" className={styles.editorAnchor}>
                Open Editor
              </a>
            </div>
            <div className={styles.sidebarSection}>
              <h3>Printing</h3>
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
              <div className={styles.sidebarSubSection}>
                <h4 className={styles.headerWithOption}>Queue</h4>
                <div className={styles.optionWithHeader}>
                  <label htmlFor="show-printed">show printed</label>
                  <input
                    type="checkbox"
                    name="show-printed"
                    checked={this.props.config.showPrintedInQueue}
                    onChange={() =>
                      this.props.onConfigChange( {
                        ...this.props.config,
                        showPrintedInQueue: !this.props.config.showPrintedInQueue,
                      } )
                    }
                  />
                </div>
              </div>
              <div className={`${styles.sidebarSubSection} ${styles.printQueue}`}>
                <div>
                  {this.state.spaceData.programs
                    .filter( program => !program.printed || this.props.config.showPrintedInQueue )
                    .map( program => (
                      <div
                        key={program.number}
                        className={[
                          styles.printQueueItem,
                          program.printed
                          ? styles.printQueueItemPrinted
                          : styles.printQueueItemNotPrinted,
                        ].join( ' ' )}
                        onClick={() => this._print( program )}
                      >
                        <span className={styles.printQueueItemContent}>
                          <span className={styles.printQueueItemName}>
                            <strong>#{program.number}</strong> {codeToName( program.currentCode )}{' '}
                          </span>
                          <span
                            className={styles.printQueueItemToggle}
                            onClick={event => {
                              event.stopPropagation();
                              this._markPrinted( program, !program.printed );
                            }}
                          >
                            {program.printed ? '[show]' : '[hide]'}
                          </span>
                        </span>
                        {this.state.debugPrograms.find( p => p.number === program.number ) ===
                         undefined ? (
                           <span
                             className={styles.printQueueDebug}
                             onClick={event => {
                               event.stopPropagation();
                               this._createDebugProgram( program.number );
                             }}
                           >
                            [Preview]
                          </span>
                         ) : (
                           ''
                         )}
                      </div>
                    ) )}
                </div>
              </div>
              <div>
                <button onClick={this._printCalibration}>Print Calibration Page</button>
                {' '}
              </div>
              <div>
                <input
                  type="checkbox"
                  name="autoPrint"
                  checked={this.props.config.autoPrintEnabled}
                  onChange={() =>
                    this.props.onConfigChange( {
                      ...this.props.config,
                      autoPrintEnabled: !this.props.config.autoPrintEnabled,
                    } )
                  }
                />
                <label htmlFor="autoPrint">auto-print</label>
                <div className={styles.note}>(start Chrome with "--kiosk-printing" flag)</div>
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
          </div>
        </div>
      </div>
    );
  }
}
