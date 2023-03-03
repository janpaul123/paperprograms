/**
 * CreateProgramDialog is a React component that presents a modal dialog that allows the user to create a new paper
 * program and add it to the current space. It allows the user create a simple "Hello World" program, or to search on
 * and select an existing program to copy from.
 *
 * @author John Blanco (PhET Interactive Simulations)
 */

import React from 'react';
import Button from 'react-bootstrap/Button';
import Form from 'react-bootstrap/Form';
import Modal from 'react-bootstrap/Modal';
import { codeToName, programMatchesFilterString } from '../utils.js';
import styles from './CameraMain.css';
import { ProgramCreateModes } from './CameraMain.js';

class CreateProgramDialog extends React.Component {

  constructor( props ) {
    super( props );
    this.state = {};
  }

  /**
   * Render the component
   * @returns {JSX.Element}
   * @public
   */
  render() {

    const { data, setSearchString, onCreateProgram, onCancel } = this.props;
    return (
      <>
        <Modal
          show={data.showCreateProgramDialog}
          className={styles.dialog}
          onHide={() => data.showCreateProgramDialog = false}
        >
          <Modal.Header closeButton>
            <Modal.Title>Create New Program</Modal.Title>
          </Modal.Header>
          <Modal.Body>
            <Form>
              <div key={`default-radio`} className="mb-3">
                <Form.Check
                  inline
                  type='radio'
                  id='radio-1'
                  label='Create a simple "Hello World" program'
                  name='group1'
                  checked={data.programCreateMode === ProgramCreateModes.SIMPLE_HELLO_WORLD}
                  onChange={() => data.programCreateMode = ProgramCreateModes.SIMPLE_HELLO_WORLD}
                />
                <Form.Check
                  inline
                  type='radio'
                  id='radio-2'
                  label='Copy an existing program'
                  name='group1'
                  checked={data.programCreateMode === ProgramCreateModes.COPY_EXISTING}
                  onChange={() => data.programCreateMode = ProgramCreateModes.COPY_EXISTING}
                />
              </div>
            </Form>
            {data.programCreateMode === ProgramCreateModes.COPY_EXISTING ? (
              <>
                <label>
                  Filter on: <input
                  name='filterCopyProgramListOn'
                  style={{ marginBottom: '10px' }}
                  value={data.copyProgramListFilterString}
                  onChange={e => setSearchString( e.target.value )}
                />
                </label>
                <Form.Select
                  htmlSize={10}
                  name='programs'
                  id='programsID'
                  onChange={event => {
                    data.selectedProgramToCopy = event.target.value;
                  }}
                >
                  {data.spaceData.programs
                    .filter( program => programMatchesFilterString( program, data.copyProgramListFilterString ) )
                    .sort( ( programA, programB ) =>
                      codeToName( programA.currentCode ).localeCompare( codeToName( programB.currentCode ) )
                    )
                    .map( program => {
                      return <option
                        key={program.number.toString()}
                        value={program.number.toString()}
                      >
                        {codeToName( program.currentCode )}
                      </option>
                    } )
                  }
                </Form.Select>
              </> ) : ' '
            }
          </Modal.Body>
          <Modal.Footer>
            <Button
              variant='primary'
              onClick={onCreateProgram}
              disabled={data.programCreateMode === ProgramCreateModes.COPY_EXISTING &&
                        data.selectedProgramToCopy === ''}
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

export default CreateProgramDialog;