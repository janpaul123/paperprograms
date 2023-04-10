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
import { codeToName, programMatchesFilterString } from '../utils.js';
import styles from './CameraMain.css';
import CameraMain, { ProgramCreateModes } from './CameraMain.js';

class CreateProgramsDialog extends React.Component {

  constructor( props ) {
    super( props );
    this.state = {

      // The name of the space we are going to use to populate templates.
      sourceSpace: '*',

      // Whether we are selecting from all spaces or a single space. If false, you can select which space to chose from.
      selectFromAllSpaces: true,

      showCodePreview: false,

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
    CameraMain.getProgramSummaryList( [ space ], summaryList => {
      this.setState( {
        sourceSpace: space,
        programsForSelectedSpace: summaryList
      } );
    } );
  }

  /**
   * Render the component
   * @returns {JSX.Element}
   * @public
   */
  render() {

    const {
      data, setSearchString, onCreateProgram, onCancel
    } = this.props;

    return (
      <>
        <Modal
          dialogClassName={styles.createProgramDialog}
          contentClassName={styles.createProgramContent}
          show={data.showCreateProgramDialog}
          className={styles.dialog}
          onHide={() => {data.showCreateProgramDialog = false;}}
        >
          <Modal.Header>
            <Modal.Title>Create New Programs</Modal.Title>
            <CloseButton variant='white' onClick={() => { data.showCreateProgramDialog = false;}}/>
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
                        checked={data.programCreateMode === ProgramCreateModes.SIMPLE_HELLO_WORLD}
                        onChange={() => {data.programCreateMode = ProgramCreateModes.SIMPLE_HELLO_WORLD;}}
                      />
                      <Form.Check
                        id='create-from-program-option'
                        inline
                        type='radio'
                        label='Copy from existing programs'
                        name='create-mode-group'
                        checked={data.programCreateMode === ProgramCreateModes.COPY_EXISTING}
                        onChange={() => {data.programCreateMode = ProgramCreateModes.COPY_EXISTING;}}
                      />
                    </div>
                  </Form>
                  {data.programCreateMode === ProgramCreateModes.COPY_EXISTING ? (
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
                            data.programCodeToCopy.length = 0;

                            // Loop through the selections, since multiple selections are allowed, and add them to the
                            // list of programs to create when the user presses the Create button is press.
                            for ( const option of event.target.selectedOptions ) {

                              // The code for the programs was previously put on the "options" elements to make it easy
                              // to access, which is why it is available here.
                              data.programCodeToCopy.push( option.dataset.programCode );
                            }
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
                <Col sm={8} hidden={data.programCreateMode === ProgramCreateModes.SIMPLE_HELLO_WORLD}>
                  <MonacoEditor
                    language='javascript'
                    theme='vs-dark'
                    value={data.programCodeToCopy[ 0 ] || '// Select Program(s)'}
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
              onClick={onCreateProgram}
              disabled={data.programCreateMode === ProgramCreateModes.COPY_EXISTING &&
                        data.programCodeToCopy.length === 0}
            >
              Create
            </Button>
            <Button
              variant='secondary'
              onClick={onCancel}
            >
              Cancel
            </Button>
          </Modal.Footer>
        </Modal>
      </>
    );
  }
}

export default CreateProgramsDialog;