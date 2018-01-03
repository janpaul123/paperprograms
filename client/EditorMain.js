import MonacoEditor from 'react-monaco-editor';
import React from 'react';
import xhr from 'xhr';

import { codeToName, getApiUrl } from './utils';

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
          const body = JSON.parse(response.body);
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
    const sidebarWidth = 300;
    const padding = 20;

    return (
      <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }}>
        {selectedProgram && (
          <div
            style={{
              position: 'absolute',
              top: 0,
              bottom: 0,
              left: 0,
              right: sidebarWidth,
              overflow: 'hidden',
            }}
          >
            <MonacoEditor
              language="javascript"
              theme="vs-dark"
              value={this.state.code}
              onChange={code => this.setState({ code })}
              editorDidMount={this._onEditorDidMount}
            />
          </div>
        )}
        <div
          style={{
            position: 'absolute',
            top: 0,
            bottom: 0,
            width: sidebarWidth,
            right: 0,
            font: '20px sans-serif',
            fontWeight: 300,
            padding,
            boxSizing: 'border-box',
          }}
        >
          <div style={{ marginBottom: padding }}>
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
                </option>
              ))}
            </select>
          </div>

          {selectedProgram && (
            <div style={{ marginBottom: padding }}>
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
