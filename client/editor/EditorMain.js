import sortBy from 'lodash/sortBy';
import randomColor from 'randomcolor';
import React from 'react';
import MonacoEditor from 'react-monaco-editor';
import xhr from 'xhr';
import {
  codeToName, getApiUrl, getSaveString, programMatchesFilterString
} from '../utils';
import CodeSnippetsDialog from './CodeSnippetsDialog.js';
import styles from './EditorMain.css';
import SaveAlert from './SaveAlert.js';

export default class EditorMain extends React.Component {

  constructor( props ) {
    super( props );
    this.state = {
      programListFilterString: '',
      selectedProgramNumber: '',
      spaceData: { programs: [] },
      code: '',
      debugInfo: {},
      showSnippetsDialog: false,
      saveSuccess: true, // Did the save command succeed?
      showSaveModal: false
    };

    // A reference to the timeout that will hide the save alert, so we can clear it early if we need to.
    this.saveAlertTimeout = null;
  }

  componentDidMount() {
    this._pollSpaceUrl();
    this._pollDebugUrl();
  }

  _pollSpaceUrl = () => {
    const targetTimeMs = 5000;
    const beginTimeMs = Date.now();
    xhr.get( getApiUrl( this.props.spaceName, '' ), { json: true }, ( error, response ) => {
      if ( error ) {
        console.error( error );
      }
      else {
        this.setState( { spaceData: response.body } );
      }

      const elapsedTimeMs = Date.now() - beginTimeMs;
      clearTimeout( this._pollSpaceUrlTimeout );
      this._pollSpaceUrlTimeout = setTimeout(
        this._pollSpaceUrl,
        Math.max( 0, targetTimeMs - elapsedTimeMs )
      );
    } );
  };

  _pollDebugUrl = () => {
    const targetTimeMs = 1000;
    const beginTimeMs = Date.now();

    const done = () => {
      const elapsedTimeMs = Date.now() - beginTimeMs;
      clearTimeout( this._pollDebugUrlTimeout );
      this._pollDebugUrlTimeout = setTimeout(
        this._pollDebugUrl,
        Math.max( 0, targetTimeMs - elapsedTimeMs )
      );
    };

    const program = this._selectedProgram( this.state.selectedProgramNumber );
    if ( program ) {
      const { editorId } = this.props.editorConfig;
      xhr.post( program.claimUrl, { json: { editorId } }, ( error, response ) => {
        if ( error ) {
          console.error( error );
        }
        else if ( response.statusCode === 400 ) {
          this.setState( {
            selectedProgramNumber: '',
            code: '',
            debugInfo: {}
          } );
        }
        else {
          this.setState( { debugInfo: response.body.debugInfo } );
        }
        done();
      } );
    }
    else {
      done();
    }
  };

  _save = () => {
    const { code, selectedProgramNumber } = this.state;
    xhr.put(
      getApiUrl( this.props.spaceName, `/programs/${selectedProgramNumber}` ),
      {
        json: { code }
      },
      ( error, response ) => {

        const state = { showSaveModal: true };
        if ( error ) {
          console.error( error );
          state.saveSuccess = false;
        }
        else {
          state.saveSuccess = true;
        }
        this.setState( state );

        // Clear previous timeout if one is still running
        window.clearTimeout( this.saveAlertTimeout );

        // Display the alert for a short time (setTimeout will remove itself after it is called)
        this.saveAlertTimeout = window.setTimeout( () => {
          this.setState( { showSaveModal: false } );
          this.saveAlertTimeout = null;
        }, 2000 );
      }
    );
  };

  _print = () => {
    const { code } = this.state;
    xhr.post(
      getApiUrl( this.props.spaceName, '/programs' ),
      { json: { code } },
      ( error, response ) => {
        if ( error ) {
          console.error( error );
        }
        else {
          const { body } = response;
          this.setState( {
            code,
            selectedProgramNumber: body.number,
            spaceData: body.spaceData,
            debugInfo: {}
          } );
        }
      }
    );
  };

  _restore = () => {
    if ( window.confirm( 'This will remove any changes, continue?' ) ) {
      this.setState(
        {
          code: this._selectedProgram( this.state.selectedProgramNumber ).originalCode,
          debugInfo: {}
        },
        () => {
          this._save();
          this._pollDebugUrl();
        }
      );
    }
  };

  _onEditorDidMount = ( editor, monaco ) => {
    editor.focus();

    // eslint-disable-next-line no-bitwise
    editor.addCommand( monaco.KeyMod.CtrlCmd | monaco.KeyCode.KEY_S, this._save );
  };

  _selectedProgram = selectedProgramNumber => {
    return this.state.spaceData.programs.find(
      program => program.number.toString() === selectedProgramNumber.toString()
    );
  };

  _editorColor = () => {
    return randomColor( { seed: this.props.editorConfig.editorId } );
  };

  render() {
    const selectedProgram = this._selectedProgram( this.state.selectedProgramNumber );
    const okayToEditSelectedProgram = selectedProgram &&
                                      !selectedProgram.editorInfo.readOnly &&
                                      !selectedProgram.editorInfo.claimed;
    const errors = this.state.debugInfo.errors || [];
    const logs = this.state.debugInfo.logs || [];
    const showSnippetsDialog = this.state.showSnippetsDialog;

    return (
      <div className={styles.root}>
        {!selectedProgram && (
          <div className={styles.getStarted}>Select a program on the right to get started.</div>
        )}
        {selectedProgram && (
          <div>
            <div className={styles.editor}>
              <MonacoEditor
                language='javascript'
                theme='vs-dark'
                value={this.state.code}
                onChange={code => this.setState( { code } )}
                editorDidMount={this._onEditorDidMount}
                options={{ tabSize: 2, fontSize: '20px', readOnly: !okayToEditSelectedProgram }}
              />
            </div>
          </div>
        )}
        <SaveAlert
          success={this.state.saveSuccess}
          show={this.state.showSaveModal}
        ></SaveAlert>
        {showSnippetsDialog && (
          <CodeSnippetsDialog
            onClose={() => this.setState( { showSnippetsDialog: false } )}
          ></CodeSnippetsDialog>
        )}
        <div className={styles.sidebar}>

          <h2>Edit Program</h2>

          <label>
            Filter on:
            <input
              name='filterProgramsOn'
              style={{ marginBottom: '10px' }}
              onChange={e => this.setState( { programListFilterString: e.target.value } )}
            />
          </label>

          <div className={styles.sidebarSection}>
            <select
              className={styles.select}
              value={this.state.selectedProgramNumber}
              size={10}
              onChange={event => {
                if ( event.target.value !== '' ) {
                  this.setState(
                    {
                      selectedProgramNumber: event.target.value,
                      code: this._selectedProgram( event.target.value ).currentCode,
                      debugInfo: {}
                    },
                    () => this._pollDebugUrl()
                  );
                }
                else {
                  this.setState( { selectedProgramNumber: '', code: '', debugInfo: {} } );
                }
              }}
            >
              <option value={''}>(none)</option>
              {sortBy( this.state.spaceData.programs, 'number' )
                .filter( program => programMatchesFilterString( program.currentCode, this.state.programListFilterString ) )
                .map( program => {

                  return (
                    <option
                      key={program.number}
                      value={program.number}
                    >
                      #{program.number} {codeToName( program.currentCode )}
                    </option>
                  );
                } )}
            </select>
          </div>

          {selectedProgram && (
            <div className={styles.sidebarSection}>
              <button onClick={this._save}>{getSaveString()}</button>
              {' '}
            </div>
          )}

          {
            selectedProgram && errors.length > 0 &&
            (
              <div className={styles.sidebarSection}>
                errors:{' '}
                {errors.map( ( error, index ) => (
                  <div key={index} className={styles.logline}>
                    <strong>
                      error[{error.filename}:{error.lineNumber}:{error.columnNumber}]:
                    </strong>{' '}
                    {error.message}
                  </div>
                ) )}
              </div>
            )
          }

          {
            selectedProgram && logs.length > 0 &&
            (
              <div className={styles.sidebarSection}>
                {logs.map( ( logLine, index ) => (
                  <div key={index} className={styles.logline}>
                    <strong>
                      {logLine.name}[{logLine.filename}:{logLine.lineNumber}:{logLine.columnNumber}]:
                    </strong>{' '}
                    {logLine.args.join( ', ' )}
                  </div>
                ) )}
              </div>
            )
          }

          <div className={styles.sidebarSection}>
            <a
              href='https://github.com/janpaul123/paperprograms/blob/master/docs/api.md'
              target='_blank'
              className={styles.link} rel='noreferrer'
            >
              Paper API Reference
            </a>
          </div>

          <div className={styles.sidebarSection}>
            <a
              href='https://learnxinyminutes.com/docs/javascript/'
              target='_blank'
              className={styles.link} rel='noreferrer'
            >
              JavaScript Reference
            </a>
          </div>

          <div className={styles.sidebarSection}>
            <a
              href='https://github.com/phetsims/phet-info/blob/master/doc/phet-development-overview.md#source-code-and-dependencies'
              target='_blank'
              className={styles.link} rel='noreferrer'
            >
              PhET Library References
            </a>
          </div>

          <div className={styles.sidebarSection}>
            <button onClick={() => {this.setState( { showSnippetsDialog: true } );}}>Code Snippets</button>
            {' '}
          </div>

          <div className={styles.sidebarSection}>
            editor color{' '}
            <div className={styles.editorColor} style={{ background: this._editorColor() }}/>
          </div>

        </div>
      </div>
    );
  }
}