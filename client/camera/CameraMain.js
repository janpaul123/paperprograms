import React from 'react';
import xhr from 'xhr';

import { codeToName, codeToPrint, getApiUrl } from '../utils';
import { colorNames } from '../constants';
import { printCalibrationPage, printPage } from './printPdf';

import helloWorld from './helloWorld';
import styles from './CameraMain.css';

import CameraVideo from './CameraVideo';

export default class CameraMain extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      pageWidth: 1,
      framerate: 0,
      selectedColorIndex: -1,
      spaceData: { programs: [] },
      autoPrintedNumbers: [],
      isEditingSpaceUrl: false,
      spaceUrlSwitcherValue: props.config.spaceUrl,
    };
  }

  componentDidMount() {
    window.addEventListener('resize', this._updatePageWidth);
    this._updatePageWidth();
    this._pollSpaceUrl();
  }

  _pollSpaceUrl = () => {
    const targetTimeMs = 500;
    const beginTimeMs = Date.now();
    xhr.get(this.props.config.spaceUrl, { json: true }, (error, response) => {
      if (error) {
        console.error(error); // eslint-disable-line no-console
      } else {
        this.setState({ spaceData: response.body }, () => {
          if (this.props.config.autoPrintEnabled) this._autoPrint();
          this._programsChange(this.props.paperProgramsProgramsToRender);
        });
      }

      const elapsedTimeMs = Date.now() - beginTimeMs;
      clearTimeout(this._timeout);
      this._timeout = setTimeout(this._pollSpaceUrl, Math.max(0, targetTimeMs - elapsedTimeMs));
    });
  };

  _updatePageWidth = () => {
    this.setState({ pageWidth: document.body.clientWidth });
  };

  _print = program => {
    printPage(program.number, codeToName(program.originalCode), codeToPrint(program.originalCode));
  };

  _printCalibration = () => {
    printCalibrationPage();
  };

  _markPrinted = program => {
    xhr.post(
      getApiUrl(this.state.spaceData.spaceName, `/programs/${program.number}/markPrinted`),
      { json: true },
      (error, response) => {
        if (error) {
          console.error(error); // eslint-disable-line no-console
        } else {
          this.setState({ spaceData: response.body });
        }
      }
    );
  };

  _autoPrint = () => {
    const toPrint = this.state.spaceData.programs.filter(
      program => !program.printed && !this.state.autoPrintedNumbers.includes(program.number)
    );
    if (toPrint.length > 0) {
      this.setState(
        { autoPrintedNumbers: this.state.autoPrintedNumbers.concat([toPrint[0].number]) },
        () => {
          this._print(toPrint[0]);
          this._markPrinted(toPrint[0]);
        }
      );
    }
  };

  _createHelloWorld = () => {
    xhr.post(
      getApiUrl(this.state.spaceData.spaceName, '/programs'),
      { json: { code: helloWorld } },
      error => {
        if (error) {
          console.error(error); // eslint-disable-line no-console
        }
      }
    );
  };

  _programsChange = programsToRender => {
    this.props.onProgramsChange(
      programsToRender
        .map(program => {
          const programWithData = this.state.spaceData.programs.find(
            program2 => program2.number.toString() === program.number.toString()
          );
          if (!programWithData) return;
          return {
            ...program,
            currentCodeUrl: programWithData.currentCodeUrl,
            currentCodeHash: programWithData.currentCodeHash,
            debugUrl: programWithData.debugUrl,
            claimUrl: programWithData.claimUrl,
            editorInfo: programWithData.editorInfo,
            codeHasChanged: programWithData.codeHasChanged,
          };
        })
        .filter(Boolean)
    );
  };

  render() {
    const padding = parseInt(styles.cameraMainPadding);
    const sidebarWidth = parseInt(styles.cameraMainSidebarWidth);
    const editorUrl = new URL(
      `editor.html?${this.state.spaceData.spaceName}`,
      window.location.origin
    ).toString();

    return (
      <div className={styles.root}>
        <div className={styles.dynamicland}>
          Thanks for using Paper Programs. It’s just a thin slice of what is possible at{' '}
          <a href={'http://dynamicland.org'}>Dynamicland</a>, which this project only means to be a
          taste of. If you like this, then please support Dynamicland by visiting, collaborating,
          and donating. Thanks! 🙂
        </div>
        <div className={styles.appRoot}>
          <div className={styles.video}>
            <CameraVideo
              width={this.state.pageWidth - padding * 3 - sidebarWidth}
              config={this.props.config}
              onConfigChange={this.props.onConfigChange}
              onProcessVideo={({ programsToRender, markers, framerate }) => {
                this.setState({ framerate });
                this._programsChange(programsToRender);
                this.props.onMarkersChange(markers);
              }}
              allowSelectingDetectedPoints={this.state.selectedColorIndex !== -1}
              onSelectPoint={({ color, size }) => {
                if (this.state.selectedColorIndex === -1) return;

                const colorsRGB = this.props.config.colorsRGB.slice();
                colorsRGB[this.state.selectedColorIndex] = color.map(value => Math.round(value));

                const paperDotSizes = this.props.config.paperDotSizes.slice();
                paperDotSizes[this.state.selectedColorIndex] = size;

                this.props.onConfigChange({ ...this.props.config, colorsRGB, paperDotSizes });
                this.setState({ selectedColorIndex: -1 });
              }}
            />
          </div>
          <div className={styles.sidebar}>
            <div>
              <div className={styles.sidebarSection}>
                <div className={styles.sidebarSectionSection}>editor url</div>
                <a href={editorUrl} target="_blank">
                  {editorUrl}
                </a>
              </div>

              <div className={styles.sidebarSection}>
                framerate <strong>{this.state.framerate}</strong>
              </div>

              <div className={styles.sidebarSection}>
                <div className={styles.sidebarSectionSection}>print queue</div>
                <div>
                  {this.state.spaceData.programs
                    .filter(program => !program.printed || this.props.config.showPrintedInQueue)
                    .map(program => (
                      <div
                        key={program.number}
                        className={
                          program.printed
                            ? styles.printQueueItemPrinted
                            : styles.printQueueItemNotPrinted
                        }
                        onClick={() => this._print(program)}
                      >
                        <strong>#{program.number}</strong> {codeToName(program.originalCode)}{' '}
                        {!program.printed && (
                          <span
                            className={styles.printQueueItemDone}
                            onClick={event => {
                              event.stopPropagation();
                              this._markPrinted(program);
                            }}
                          >
                            [done]
                          </span>
                        )}
                      </div>
                    ))}
                </div>
                <button onClick={this._printCalibration}>print calibration page</button>{' '}
                <button onClick={this._createHelloWorld}>create hello world program</button>
                <div>
                  <input
                    type="checkbox"
                    checked={this.props.config.autoPrintEnabled}
                    onChange={() =>
                      this.props.onConfigChange({
                        ...this.props.config,
                        autoPrintEnabled: !this.props.config.autoPrintEnabled,
                      })
                    }
                  />{' '}
                  auto-print (start Chrome with "--kiosk-printing" flag)
                </div>
                <div>
                  <input
                    type="checkbox"
                    checked={this.props.config.showPrintedInQueue}
                    onChange={() =>
                      this.props.onConfigChange({
                        ...this.props.config,
                        showPrintedInQueue: !this.props.config.showPrintedInQueue,
                      })
                    }
                  />{' '}
                  show printed in queue
                </div>
              </div>

              <div className={styles.sidebarSection}>
                <div className={styles.sidebarSectionSection}>colors</div>
                <div>
                  {this.props.config.colorsRGB.map((color, colorIndex) => (
                    <div
                      key={colorIndex}
                      className={[
                        styles.colorListItem,
                        this.state.selectedColorIndex === colorIndex &&
                          styles.colorListItemSelected,
                      ].join(' ')}
                      style={{ background: `rgb(${color.slice(0, 3).join(',')})` }}
                      onClick={() =>
                        this.setState(state => ({
                          selectedColorIndex:
                            state.selectedColorIndex === colorIndex ? -1 : colorIndex,
                        }))
                      }
                    >
                      <strong>{colorNames[colorIndex]}</strong>
                    </div>
                  ))}
                </div>
              </div>

              <div className={styles.sidebarSection}>
                <div className={styles.sidebarSectionSection}>show overlay</div>

                <div className={styles.sidebarSectionSection}>
                  <input
                    type="checkbox"
                    checked={this.props.config.showOverlayKeyPointCircles}
                    onChange={() =>
                      this.props.onConfigChange({
                        ...this.props.config,
                        showOverlayKeyPointCircles: !this.props.config.showOverlayKeyPointCircles,
                      })
                    }
                  />{' '}
                  keypoint circles
                </div>

                <div className={styles.sidebarSectionSection}>
                  <input
                    type="checkbox"
                    checked={this.props.config.showOverlayKeyPointText}
                    onChange={() =>
                      this.props.onConfigChange({
                        ...this.props.config,
                        showOverlayKeyPointText: !this.props.config.showOverlayKeyPointText,
                      })
                    }
                  />{' '}
                  keypoint text
                </div>

                <div className={styles.sidebarSectionSection}>
                  <input
                    type="checkbox"
                    checked={this.props.config.showOverlayComponentLines}
                    onChange={() =>
                      this.props.onConfigChange({
                        ...this.props.config,
                        showOverlayComponentLines: !this.props.config.showOverlayComponentLines,
                      })
                    }
                  />{' '}
                  component lines
                </div>

                <div className={styles.sidebarSectionSection}>
                  <input
                    type="checkbox"
                    checked={this.props.config.showOverlayShapeId}
                    onChange={() =>
                      this.props.onConfigChange({
                        ...this.props.config,
                        showOverlayShapeId: !this.props.config.showOverlayShapeId,
                      })
                    }
                  />{' '}
                  shape ids
                </div>

                <div className={styles.sidebarSectionSection}>
                  <input
                    type="checkbox"
                    checked={this.props.config.showOverlayProgram}
                    onChange={() =>
                      this.props.onConfigChange({
                        ...this.props.config,
                        showOverlayProgram: !this.props.config.showOverlayProgram,
                      })
                    }
                  />{' '}
                  programs
                </div>
              </div>

              <div className={styles.sidebarSection}>
                <div className={styles.sidebarSectionSection}>debugging</div>
                <div className={styles.sidebarSectionSection}>
                  <input
                    type="checkbox"
                    checked={this.props.config.freezeDetection}
                    onChange={() =>
                      this.props.onConfigChange({
                        ...this.props.config,
                        freezeDetection: !this.props.config.freezeDetection,
                      })
                    }
                  />{' '}
                  freeze detection
                </div>
              </div>
            </div>
            <div className={styles.sidebarSection}>
              <div className={styles.sidebarSectionSection}>space url </div>
              {!this.state.isEditingSpaceUrl ? (
                <div>
                  <div className={styles.spaceUrl}>{this.props.config.spaceUrl}</div>
                  <button onClick={() => this.setState({ isEditingSpaceUrl: true })}>
                    change space
                  </button>
                </div>
              ) : (
                <div>
                  <input
                    className={styles.spaceNameInput}
                    value={this.state.spaceUrlSwitcherValue}
                    onChange={event => this.setState({ spaceUrlSwitcherValue: event.target.value })}
                  />
                  <div>
                    <button
                      onClick={() => {
                        this.props.onConfigChange({
                          ...this.props.config,
                          spaceUrl: this.state.spaceUrlSwitcherValue,
                        });
                        this.setState({ isEditingSpaceUrl: false });
                      }}
                    >
                      switch to new url
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }
}
