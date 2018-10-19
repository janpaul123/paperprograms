import React from 'react';
import randomColor from 'randomcolor';
import sortBy from 'lodash/sortBy';
import xhr from 'xhr';
import PulseLoader from 'react-spinners/PulseLoader';

import { codeToName, getApiUrl } from '../utils';
import styles from './EditorMain.css';
import CodeMirrorEditor from './CodeMirrorEditor';

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
      const { editorId } = this.props.editorConfig;
      xhr.post(program.claimUrl, { json: { editorId } }, (error, response) => {
        if (error) {
          console.error(error); // eslint-disable-line no-console
        } else if (response.statusCode === 400) {
          this.setState({
            selectedProgramNumber: '',
            code: '',
            debugInfo: {},
          });
        } else {
          this.setState({ debugInfo: response.body.debugInfo });
        }
        done();
      });
    } else {
      done();
    }
  };

  _save = () => {
    const { code, selectedProgramNumber } = this.state;
    this.setState({ debugInfo: {} });
    xhr.put(
      getApiUrl(this.props.spaceName, `/programs/${selectedProgramNumber}`),
      {
        json: { code },
      },
      error => {
        if (error) console.error(error); // eslint-disable-line no-console
        this.setState({ isDirty: false });
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

  _selectedProgram = selectedProgramNumber => {
    return this.state.spaceData.programs.find(
      program => program.number.toString() === selectedProgramNumber.toString()
    );
  };

  _editorColor = () => {
    return randomColor({ seed: this.props.editorConfig.editorId });
  };

  render() {
    const selectedProgram = this._selectedProgram(this.state.selectedProgramNumber);
    // TODO: readd support for cmd
    const isMac = false; // navigator.platform.toUpperCase().indexOf('MAC') >= 0;
    const errors = this.state.debugInfo.errors || [];
    const inlineErrors = errors.filter(({ isInFile }) => isInFile);
    const externalErrors = errors.filter(({ isInFile }) => !isInFile);

    const isLoading =
      !!(!this.state.isDirty &&
      (this.state.debugInfo.currentCodeHash &&
        this.state.debugInfo.currentCodeHash !== md5(this.state.code)) &&
      this.state.selectedProgramNumber);


    //  const logs = this.state.debugInfo.logs || [];

    return (
      <div className={styles.root}>
        {!selectedProgram && (
          <div className={styles.getStarted}>Select a program on the right to get started!</div>
        )}
        {selectedProgram && (
          <div className={styles.editor}>
            <CodeMirrorEditor
              isDirty={this.state.isDirty}
              value={this.state.code}
              errors={inlineErrors}
              onSave={this._save}
              onChange={code => this.setState({ code, isDirty: true })}
            />
          </div>
        )}
        <div className={styles.sidebar}>
          <PulseLoader sizeUnit={'px'} size={10} color={'white'} loading={isLoading} />

          <div className={styles.sidebarSection}>
            editor color{' '}
            <div className={styles.editorColor} style={{ background: this._editorColor() }} />
          </div>

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
              {sortBy(this.state.spaceData.programs, 'number').map(program => {
                const beingEditedBySomeoneElse =
                  program.editorInfo.claimed &&
                  program.editorInfo.editorId !== this.props.editorConfig.editorId;

                return (
                  <option
                    key={program.number}
                    value={program.number}
                    disabled={beingEditedBySomeoneElse}
                  >
                    #{program.number} {codeToName(program.currentCode)}
                    {program.printed ? '' : ' (queued to print)'}
                    {beingEditedBySomeoneElse ? ' (being edited)' : ''}
                  </option>
                );
              })}
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
            externalErrors.length > 0 && (
              <div className={styles.sidebarSection}>
                Errors:{' '}
                {externalErrors.map((error, index) => (
                  <div key={index} className={styles.logline}>
                    <strong>
                      error[{error.fileName}:{error.lineNumber}:{error.columnNumber}]:
                    </strong>{' '}
                    {error.message}
                  </div>
                ))}
              </div>
            )}
        </div>
      </div>
    );
  }
}
