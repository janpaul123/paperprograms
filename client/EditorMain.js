import MonacoEditor from 'react-monaco-editor';
import React from 'react';
import xhr from 'xhr';

import { codeToName, getApiUrl } from './utils';
import styles from './EditorMain.css';

export default class EditorMain extends React.Component {
  constructor(props) {
    super(props);
    this.state = { selectedProgramNumber: '', spaceData: { programs: [] }, code: '' };
  }

  componentDidMount() {
    this._pollSpaceUrl();
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
      clearTimeout(this._timeout);
      this._timeout = setTimeout(this._pollSpaceUrl, Math.max(0, targetTimeMs - elapsedTimeMs));
    });
  };

  _update = () => {
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
          this.setState({ code, selectedProgramNumber: body.number, spaceData: body.spaceData });
        }
      }
    );
  };

  _restore = () => {
    if (window.confirm('This will remove any changes, continue?')) {
      this.setState(
        { code: this._selectedProgram(this.state.selectedProgramNumber).originalCode },
        this._update
      );
    }
  };

  _onEditorDidMount = (editor, monaco) => {
    editor.focus();
    editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.KEY_S, this._update);
  };

  _selectedProgram = selectedProgramNumber => {
    return this.state.spaceData.programs.find(
      program => program.number.toString() === selectedProgramNumber.toString()
    );
  };

  render() {
    const selectedProgram = this._selectedProgram(this.state.selectedProgramNumber);

    return (
      <div className={styles.root}>
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
                  this.setState({
                    selectedProgramNumber: event.target.value,
                    code: this._selectedProgram(event.target.value).currentCode,
                  });
                } else {
                  this.setState({ selectedProgramNumber: '', code: '' });
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
              <button onClick={this._update}>update</button>{' '}
              <button onClick={this._print}>print new</button>{' '}
              <button onClick={this._restore}>restore original</button>
            </div>
          )}
        </div>
      </div>
    );
  }
}
