/**
 * CreateProgramDialog is a React component that presents a dialog that allows the user to create a new paper program.
 * It allows the user use a simple "Hello World" program, or to search on and select an existing program to copy from.
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

  state = {}

  render() {
    return (
      <>
        <Modal
          show={this.props.data.showCreateProgramDialog}
          className={styles.dialog}
          onHide={() => this.props.data.showCreateProgramDialog = false}
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
                  checked={this.props.data.programCreateMode === ProgramCreateModes.SIMPLE_HELLO_WORLD}
                  onChange={() => this.props.data.programCreateMode = ProgramCreateModes.SIMPLE_HELLO_WORLD}
                />
                <Form.Check
                  inline
                  type='radio'
                  id='radio-2'
                  label='Copy an existing program'
                  name='group1'
                  checked={this.props.data.programCreateMode === ProgramCreateModes.COPY_EXISTING}
                  onChange={() => this.props.data.programCreateMode = ProgramCreateModes.COPY_EXISTING}
                />
              </div>
            </Form>
            {this.props.data.programCreateMode === ProgramCreateModes.COPY_EXISTING ? (
              <>
                <label>
                  Filter on: <input
                  name='filterCopyProgramListOn'
                  style={{ marginBottom: '10px' }}
                  value={this.props.data.copyProgramListFilterString}
                  onChange={e => this.props.setSearchString( e.target.value )}
                />
                </label>
                <Form.Select
                  htmlSize={10}
                  name='programs'
                  id='programsID'
                  onChange={event => {
                    this.props.data.selectedProgramToCopy = event.target.value;
                  }}
                >
                  <option value=''>-- Select program to copy --</option>
                  {this.props.data.spaceData.programs
                    .filter( program => programMatchesFilterString( program, this.props.data.copyProgramListFilterString ) )
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
              onClick={this.props.onCreateProgram}
              disabled={this.props.data.programCreateMode === ProgramCreateModes.COPY_EXISTING &&
                        this.props.data.selectedProgramToCopy === ''}
            >
              Create
            </Button>
            <Button
              variant='secondary'
              onClick={this.props.onCancel}
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