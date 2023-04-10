/**
 * CreateProgramsDialog is a React component that presents a modal dialog that allows the user to create a new paper
 * program and add it to the current space. It allows the user create a simple "Hello World" program, or to search on
 * and select an existing program to copy from.
 *
 * @author John Blanco (PhET Interactive Simulations)
 */

import React from 'react';
import Button from 'react-bootstrap/Button';
import CloseButton from 'react-bootstrap/CloseButton';
import Col from 'react-bootstrap/Col';
import Container from 'react-bootstrap/Container';
import Form from 'react-bootstrap/Form';
import Modal from 'react-bootstrap/Modal';
import Row from 'react-bootstrap/Row';
import MonacoEditor from 'react-monaco-editor';
import xhr from 'xhr';
import { codeToName, getApiUrl, programMatchesFilterString } from '../utils.js';
import styles from './CameraMain.css';
import helloWorld from './helloWorld';

// constants
const ProgramCreateModes = {
  SIMPLE_HELLO_WORLD: 'simpleHelloWorld',
  COPY_EXISTING: 'copyExisting'
};

const BASE_API_URL = new URL( 'api', window.location.origin ).toString();

class CreateProgramsDialog extends React.Component {

  constructor( props ) {
    super( props );
    this.state = {

      // The name of the space we are going to use to populate templates.
      sourceSpace: '*',

      // Whether we are selecting from all spaces or a single space. If false, you can select which space to chose from.
      selectFromAllSpaces: true,

      showCodePreview: false,

      programCreateMode: ProgramCreateModes.SIMPLE_HELLO_WORLD,

      // {string[]} - An array of strings, each of which represent the contents of a paper program, that are being
      // copied into newly created programs in the DB.
      codeFromSelectedPrograms: [],

      // List of programs for the selected space.
      // TODO: This should be summary info instead of full program.
      programsForSelectedSpace: []
    };

    this._setSpaceAndRequestPrograms( this.state.sourceSpace );
  }

  /**
   * Returns only the subset of programs that match the entered filter.
   */
  _getFilteredProgramNames( programs ) {
    return programs
      .filter( program => programMatchesFilterString( program.currentCode, this.props.data.copyProgramListFilterString ) )
      .sort( ( programA, programB ) =>
        codeToName( programA.currentCode ).localeCompare( codeToName( programB.currentCode ) )
      );
  }

  /**
   * Makes a request to the database to get all programs in the provided space. Then sets state data on this
   * component to render that space and its programs.
   *
   * @param {string} space - space name or "*" for all spaces.
   */
  _setSpaceAndRequestPrograms( space ) {
    CreateProgramsDialog.getProgramSummaryList( [ space ], summaryList => {
      this.setState( {
        sourceSpace: space,
        programsForSelectedSpace: summaryList
      } );
    } );
  }

  /**
   * Handler function for the button in the "Create New Program" dialog that indicates that the user wants to create one
   * or more new programs by copying from existing ones.
   * @param {string} spaceName
   *
   * @private
   */
  async _handleCreateNewProgramsButtonClicked( spaceName ) {
    if ( this.state.programCreateMode === ProgramCreateModes.COPY_EXISTING ) {

      if ( this.state.codeFromSelectedPrograms.length > 0 ) {
        for ( const programCode of this.state.codeFromSelectedPrograms ) {
          await this._createProgramCopyFromCode( spaceName, programCode );
          console.log( 'created a program' );
        }
      }
      else {
        alert( 'Error: Invalid program(s) selection.' );
      }
    }
    else if ( this.state.programCreateMode === ProgramCreateModes.SIMPLE_HELLO_WORLD ) {
      this._createHelloWorld( spaceName );
    }
  }

  /**
   * Create a basic program from the hello world template.
   * @param {string} spaceName
   * @private
   */
  _createHelloWorld( spaceName ) {
    xhr.post(
      getApiUrl( spaceName, '/programs' ),
      { json: { code: helloWorld } },
      error => {
        if ( error ) {
          console.error( error );
        }
        else {
          alert( 'Created "Generic Template" program' );
        }
      }
    );
  }

  /**
   * Create a copy of the provided program code and add it to the current space.  The program will be created with the
   * existing name with ' - Copy' appended to it.
   * @param {string} spaceName
   * @param {string} programCodeToCopy
   * @private
   */
  async _createProgramCopyFromCode( spaceName, programCodeToCopy ) {

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
      getApiUrl( spaceName, '/programs' ),
      { json: { code: copiedProgram } },
      error => {
        if ( error ) {
          alert( `Error creating program "${codeToName( copiedProgram )}": ${error}` );
          console.error( error );
        }
      }
    );
  }

  /**
   * Render the component
   * @returns {JSX.Element}
   * @public
   */
  render() {

    const {
      data, setSearchString, hideDialog
    } = this.props;

    const closeDialog = () => {
      this.setState( { codeFromSelectedPrograms: [] } );
      hideDialog();
    };

    return (
      <>
        <Modal
          dialogClassName={styles.createProgramDialog}
          contentClassName={styles.createProgramContent}
          show={data.showCreateProgramDialog}
          className={styles.dialog}

          // Called when the background pane is clicked
          onHide={() => {
            closeDialog();
          }}
        >
          <Modal.Header>
            <Modal.Title>Create New Programs</Modal.Title>
            <CloseButton variant='white' onClick={closeDialog}/>
          </Modal.Header>
          <Modal.Body>
            <Container>
              <Row>
                <Col sm={4}>
                  <Form>
                    <div key={'create-mode-radio'} className='mb-3'>
                      <Form.Check
                        id='create-simple-option'
                        inline
                        type='radio'
                        label='Create a simple "Hello World" program'
                        name='create-mode-group'
                        checked={this.state.programCreateMode === ProgramCreateModes.SIMPLE_HELLO_WORLD}
                        onChange={() => {this.setState( { programCreateMode: ProgramCreateModes.SIMPLE_HELLO_WORLD } ); }}
                      />
                      <Form.Check
                        id='create-from-program-option'
                        inline
                        type='radio'
                        label='Copy from existing programs'
                        name='create-mode-group'
                        checked={this.state.programCreateMode === ProgramCreateModes.COPY_EXISTING}
                        onChange={() => {this.setState( { programCreateMode: ProgramCreateModes.COPY_EXISTING } ); }}
                      />
                    </div>
                  </Form>
                  {this.state.programCreateMode === ProgramCreateModes.COPY_EXISTING ? (
                    <>
                      <p><b>Spaces:</b></p>
                      <Form>
                        <div key={'spaces-radio'} className='mb-3'>
                          <Form.Check
                            inline
                            id='all-spaces-option'
                            type='radio'
                            label='All Spaces'
                            name='spaces-radio-group'
                            checked={this.state.selectFromAllSpaces}
                            onChange={() => {
                              this.setState( { selectFromAllSpaces: true } );
                              this._setSpaceAndRequestPrograms( '*' );
                            }}
                          />
                          <Form.Check
                            inline
                            id='select-space-option'
                            type='radio'
                            label='Select Space'
                            name='spaces-radio-group'
                            checked={!this.state.selectFromAllSpaces}
                            onChange={() => {
                              this.setState( { selectFromAllSpaces: false } );
                              this._setSpaceAndRequestPrograms( this.props.data.availableSpaces[ 0 ] );
                            }}
                          />
                        </div>
                      </Form>
                      {this.state.selectFromAllSpaces ? ' ' :
                       <Form.Select
                         id='spacesID'
                         value={this.state.sourceSpace}
                         onChange={event => {
                           this._setSpaceAndRequestPrograms( event.target.value );
                         }}
                       >
                         {data.availableSpaces.map( spaceName => {
                           return <option
                             key={spaceName}
                             value={spaceName}
                           >{spaceName}
                           </option>;
                         } )
                         }
                       </Form.Select>}
                      <label>
                        <b>Filter on:</b>
                        <input
                          name='filterCopyProgramListOn'
                          style={{ margin: '10px' }}
                          value={data.copyProgramListFilterString}
                          onChange={e => setSearchString( e.target.value )}
                        />
                      </label>
                      <Form.Group as={Col} controlId='my_multiselect_field'>
                        <Form.Label>Select one or more programs.</Form.Label>
                        <Form.Control
                          as='select'
                          multiple
                          htmlSize={10}
                          onChange={event => {

                            // Clear out previous selection.
                            const codeFromSelectedPrograms = [];

                            // Loop through the selections, since multiple selections are allowed, and add them to the
                            // list of programs to create when the user presses the Create button is press.
                            for ( const option of event.target.selectedOptions ) {

                              // The code for the programs was previously put on the "options" elements to make it easy
                              // to access, which is why it is available here.
                              codeFromSelectedPrograms.push( option.dataset.programCode );
                            }

                            this.setState( { codeFromSelectedPrograms } );
                          }}
                        >
                          {this._getFilteredProgramNames( this.state.programsForSelectedSpace )
                            .map( program => {
                              return <option
                                key={`${program.number.toString()}-${program.spaceName}`}
                                value={program.number.toString()}

                                // Put the program code on this option element so that we can reference it easily later.
                                data-program-code={program.currentCode}
                              >
                                {`${codeToName( program.currentCode )} - #${program.number}`}
                              </option>;
                            } )
                          }
                        </Form.Control>
                      </Form.Group>
                    </> ) : ' '
                  }
                </Col>
                <Col sm={8} hidden={this.state.programCreateMode === ProgramCreateModes.SIMPLE_HELLO_WORLD}>
                  <MonacoEditor
                    language='javascript'
                    theme='vs-dark'
                    value={this.state.codeFromSelectedPrograms[ 0 ] || '// Select Program(s)'}
                    options={{
                      lineNumbers: 'off',
                      readOnly: true,
                      tabSize: 2,
                      fontSize: '16px',
                      minimap: { enabled: false },
                      automaticLayout: true
                    }}
                  />
                </Col>
              </Row>
            </Container>
          </Modal.Body>
          <Modal.Footer>
            <Button
              variant='light'
              onClick={async () => {
                await this._handleCreateNewProgramsButtonClicked( data.selectedSpaceName );
                alert( `Created ${this.state.codeFromSelectedPrograms.length} new program(s).` );
                closeDialog();
              }}
              disabled={this.state.programCreateMode === ProgramCreateModes.COPY_EXISTING &&
                        this.state.codeFromSelectedPrograms.length === 0}
            >
              Create
            </Button>
            <Button
              variant='secondary'
              onClick={closeDialog}
            >
              Cancel
            </Button>
          </Modal.Footer>
        </Modal>
      </>
    );
  }

  /**
   * Gets programs for the provided spaces from the database and passes them to the provided callback for further work.
   * Provide an array of the space names, or '*' for all spaces.
   *
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
        console.error( `error getting program summary list: ${error}` );
      }
      else {
        callback( response.body );
      }
    } );
  }
}

export default CreateProgramsDialog;