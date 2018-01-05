import MonacoEditor from 'react-monaco-editor';
import React from 'react';
import xhr from 'xhr';

import { codeToName, getApiUrl } from './utils';
import styles from './EditorMain.css';

export default class EditorMain extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      selectedProgramNumber: '',
      spaceData: { programs: [] },
      code: '',
      debugInfo: {},
    };
  }

  componentDidMount() {
    this._pollSpaceUrl();
    this._pollDebugUrl();
  }

  _pollSpaceUrl = () => {
    const targetTimeMs = 5000;
    const beginTimeMs = Date.now();
    xhr.get(getApiUrl(this.props.spaceName, ''), { json: true }, (error, response) => {
      if (error) {
        console.error(error); // eslint-disable-line no-console
      } else {
        this.setState({ spaceData: response.body });
      }

      const elapsedTimeMs = Date.now() - beginTimeMs;
      clearTimeout(this._pollSpaceUrlTimeout);
      this._pollSpaceUrlTimeout = setTimeout(
        this._pollSpaceUrl,
        Math.max(0, targetTimeMs - elapsedTimeMs)
      );
    });
  };

  _pollDebugUrl = () => {
    const targetTimeMs = 250;
    const beginTimeMs = Date.now();

    const done = () => {
      const elapsedTimeMs = Date.now() - beginTimeMs;
      clearTimeout(this._pollDebugUrlTimeout);
      this._pollDebugUrlTimeout = setTimeout(
        this._pollDebugUrl,
        Math.max(0, targetTimeMs - elapsedTimeMs)
      );
    };

    const program = this._selectedProgram(this.state.selectedProgramNumber);
    if (program) {
      xhr.get(program.debugUrl, { json: true }, (error, response) => {
        if (error) {
          console.error(error); // eslint-disable-line no-console
        } else {
          this.setState({ debugInfo: response.body });
        }
        done();
      });
    } else {
      done();
    }
  };

  _save = () => {
    const { code, selectedProgramNumber } = this.state;
    xhr.put(
      getApiUrl(this.props.spaceName, `/programs/${selectedProgramNumber}`),
      {
        json: { code },
      },
      error => {
        if (error) console.error(error); // eslint-disable-line no-console
      }
    );
  };

  _print = () => {
    const { code } = this.state;
    xhr.post(
      getApiUrl(this.props.spaceName, '/programs'),
      { json: { code } },
      (error, response) => {
        if (error) {
          console.error(error); // eslint-disable-line no-console
        } else {
          const { body } = response;
          this.setState({
            code,
            selectedProgramNumber: body.number,
            spaceData: body.spaceData,
            debugInfo: {},
          });
        }
      }
    );
  };

  _restore = () => {
    if (window.confirm('This will remove any changes, continue?')) {
      this.setState(
        {
          code: this._selectedProgram(this.state.selectedProgramNumber).originalCode,
          debugInfo: {},
        },
        () => {
          this._save();
          this._pollDebugUrl();
        }
      );
    }
  };

  _onEditorDidMount = (editor, monaco) => {
    editor.focus();
    editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.KEY_S, this._save);
  };

  _selectedProgram = selectedProgramNumber => {
    return this.state.spaceData.programs.find(
      program => program.number.toString() === selectedProgramNumber.toString()
    );
  };

  render() {
    const selectedProgram = this._selectedProgram(this.state.selectedProgramNumber);
    const isMac = navigator.platform.toUpperCase().indexOf('MAC') >= 0;
    const errors = this.state.debugInfo.errors || [];
    const logs = this.state.debugInfo.logs || [];

    return (
      <div className={styles.root}>
        {!selectedProgram && (
          <div className={styles.getStarted}>Select a program on the right to get started!</div>
        )}
        {selectedProgram && (
          <div className={styles.editor}>
            <MonacoEditor
              language="javascript"
              theme="vs-dark"
              value={this.state.code}
              onChange={code => this.setState({ code })}
              editorDidMount={this._onEditorDidMount}
            />
          </div>
        )}
        <div className={styles.sidebar}>
          <div className={styles.sidebarSection}>
            <select
              value={this.state.selectedProgramNumber}
              onChange={event => {
                if (event.target.value !== '') {
                  this.setState(
                    {
                      selectedProgramNumber: event.target.value,
                      code: this._selectedProgram(event.target.value).currentCode,
                      debugInfo: {},
                    },
                    () => this._pollDebugUrl()
                  );
                } else {
                  this.setState({ selectedProgramNumber: '', code: '', debugInfo: {} });
                }
              }}
            >
              <option value={''}>- select program -</option>
              {this.state.spaceData.programs.map(program => (
                <option key={program.number} value={program.number}>
                  #{program.number} {codeToName(program.currentCode)}
                  {program.printed ? '' : ' (queued to print)'}
                </option>
              ))}
            </select>
          </div>

          {selectedProgram && (
            <div className={styles.sidebarSection}>
              <button onClick={this._save}>save ({isMac ? 'cmd' : 'ctrl'}+s)</button>{' '}
              <button onClick={this._print}>print as new paper</button>{' '}
              <button onClick={this._restore}>restore original</button>
            </div>
          )}

          {selectedProgram &&
            errors.length > 0 && (
              <div className={styles.sidebarSection}>
                errors:{' '}
                {errors.map(error => (
                  <div className={styles.logline}>
                    <strong>
                      error[{error.filename}:{error.lineNumber}:{error.columnNumber}]:
                    </strong>{' '}
                    {error.message}
                  </div>
                ))}
              </div>
            )}

          {selectedProgram &&
            logs.length > 0 && (
              <div className={styles.sidebarSection}>
                console:{' '}
                {logs.map(logLine => (
                  <div className={styles.logline}>
                    <strong>
                      {logLine.name}[program:{logLine.lineNumber}:{logLine.columnNumber}]:
                    </strong>{' '}
                    {logLine.args.join(', ')}
                  </div>
                ))}
              </div>
            )}
        </div>
      </div>
    );
  }
}
