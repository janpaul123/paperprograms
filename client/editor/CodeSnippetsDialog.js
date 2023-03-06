/**
 * A Dialog to find and create new code snippets.
 *
 * TODO: It would be awesome if the MonacoEditor could be toggled as readonly, but that is not supported in our
 * version of monaco. See https://github.com/microsoft/monaco-editor/issues/1773.
 *
 * @author Jesse Greenberg (PhET Interactive Simulations)
 */

import React from 'react';
import Button from 'react-bootstrap/Button';
import Modal from 'react-bootstrap/Modal';
import MonacoEditor from 'react-monaco-editor';
import xhr from 'xhr';
import { getSaveString, programMatchesFilterString } from '../utils';
import styles from './EditorMain.css';

const NEW_SNIPPET_CODE = '// New Snippet\n//\n// Add new code here!';
const SELECT_SNIPPET_STRING = '// Select a snippet or create a new one.'

class CodeSnippetsDialog extends React.Component {

  constructor( props ) {
    super( props );
    this.state = {

      // to support searching for a specific snippet
      snippetListFilterString: '',

      // number of the current snippet in the editor
      snippetNumber: null,

      // total number of snippets - supports creating new snippets without having all snippets in state
      numberOfSnippets: 0
    };

    // map: snippet number -> snippet code
    this.snippets = {};

    // populate snippets from database
    this._getSnippets();
  }

  /**
   * Render the component.
   */
  render() {
    const onClose = this.props.onClose;

    return (
      <>
        <Modal
          show={true}
          size="xl"
          className={styles.dialog}
          onHide={onClose}
        >
          <Modal.Header closeButton>
            <Modal.Title>Code Snippets</Modal.Title>
          </Modal.Header>
          <Modal.Body>
            <div className={styles.snippetControls}>
              <div>
                <label>
                  Filter on: <input
                  name='filterSnippetsOn'
                  style={{ marginBottom: '10px' }}
                  onChange={e => this.setState( { snippetListFilterString: e.target.value } )}
                />
                </label>
              </div>
              <div>
              </div>
              <Button variant='primary' onClick={this._createSnippet}>New Snippet</Button>
              <Button variant='primary' disabled={this.state.snippetNumber === null} onClick={this._saveSnippet}>{getSaveString()}</Button>
            </div>
            <select className={styles.snippetSelect} size={5} onChange={event => {
              this.setState( {
                snippetNumber: event.target.value
              } );
            }
            }>
              {
                Object.keys( this.snippets ).filter( key => {
                  const code = this.snippets[ key ];
                  if ( code ) {
                    return programMatchesFilterString( code, this.state.snippetListFilterString )
                  }
                  else {

                    // only include the empty code if there is no filter
                    return this.state.snippetListFilterString === '';
                  }
                } )
                  .map( key => {
                    return <option
                      key={key}
                      value={key}
                    >{this._getNameFromSnippet( this.snippets[ key ], key )}
                    </option>
                  } )}
            </select>
            <div className={styles.snippetEditor}>
              <MonacoEditor
                language="javascript"
                theme="vs-dark"
                value={this.state.snippetNumber === null ? SELECT_SNIPPET_STRING : this.snippets[ this.state.snippetNumber ]}
                onChange={
                  code => {
                    if ( this.state.snippetNumber !== null ) {
                      this.snippets[ this.state.snippetNumber ] = code;
                    }
                  }
                }
                editorDidMount={this._onEditorDidMount}
                options={{ tabSize: 2, fontSize:"20px" }}
              />
            </div>
          </Modal.Body>
          <Modal.Footer>
            <Button variant='secondary' onClick={onClose}>Close</Button>
          </Modal.Footer>
        </Modal>
      </>
    );
  }

  /**
   * Adds hotkey to save the snippet.
   */
  _onEditorDidMount = ( editor, monaco ) => {
    editor.addCommand( monaco.KeyMod.CtrlCmd | monaco.KeyCode.KEY_S, this._saveSnippet );
  };

  /**
   * Get the code string from the provided snippet number. Empty string if number is not in our list.
   */
  _getCodeFromNumber( snippetNumber ) {
    for ( const key in this.snippets ) {
      if ( key.toString() === snippetNumber ) {
        return this.snippets[ key ];
      }
    }

    return '';
  }

  /**
   * Get the name of the snippet by reading the first line of code.
   */
  _getNameFromSnippet( code, number ) {
    const numberString = `#${number}`;
    let nameString = '';

    const firstLine = code.split( '\n' )[ 0 ];
    if ( firstLine ) {
      nameString = firstLine.replaceAll( '/', '' );
    }

    return `${numberString} ${nameString}`;
  }

  /**
   * Used to make requests to the server for snippet operations.
   */
  _getSnippetApiUrl( suffix = '' ) {
    return new URL( `api/snippets/${suffix}`, window.location.origin ).toString();
  }

  /**
   * Get all snippets from the database and use them to update state for this component. Use
   * sparingly, requests all snippet code from the database.
   */
  _getSnippets() {
    xhr.get(
      this._getSnippetApiUrl(),
      { json: true },
      ( error, response ) => {
        if ( error ) {
          console.error( error );
        }
        else {

          // clear all previous snippets, then add new ones
          this.snippets = {};
          response.body.snippets.forEach( snippet => {
            this.snippets[ snippet.number ] = snippet.code;
          } );

          this.setState( {
            numberOfSnippets: this.snippets.length
          } )
        }
      }
    )
  }

  /**
   * Create a new snippet and add to database.
   */
  _createSnippet = () => {
    xhr.post(
      this._getSnippetApiUrl(),
      { json: { snippetCode: NEW_SNIPPET_CODE } },
      ( error, response ) => {
        if ( error ) {
          console.error( error ); // eslint-disable-line no-console
        }
        else {
          this.snippets[ response.body.number ] = response.body.snippetCode;
          this.setState( {
            numberOfSnippets: Object.keys( this.snippets ).length
          } )
        }
      }
    );
  }

  /**
   * Save the active snippet, updating the database.
   */
  _saveSnippet = () => {
    const { snippetNumber } = this.state;
    if ( snippetNumber === null ) {
      throw new Error( 'No snippetNumber, cannot save...' );
    }
    const snippetCode = this.snippets[ snippetNumber ];
    const snippetUrl = this._getSnippetApiUrl( snippetNumber );
    xhr.put(
      snippetUrl,
      {
        json: { snippetCode: snippetCode },
      },
      error => {
        if ( error ) {
          console.error( error );
        } // eslint-disable-line no-console
      }
    );
  };
}

export default CodeSnippetsDialog;