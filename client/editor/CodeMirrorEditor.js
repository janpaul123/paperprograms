import React from 'react';
import CodeMirror from 'codemirror';
import 'codemirror/mode/javascript/javascript';

import 'codemirror/lib/codemirror.css';
import styles from './CodeMirrorEditor.css';

export default class CodeMirrorEditor extends React.Component {
  constructor() {
    super();

    this._errorWidgets = [];
    this._lineClasses = [];
  }

  componentDidMount() {
    this._codeMirror = CodeMirror(this._editor, {
      tabSize: 2,
      value: this.props.value,
      mode: 'text/javascript',
      lineNumbers: true,
      extraKeys: {
        'Ctrl-S': () => this.props.onSave(),
        'Cmd-s': () => this.props.onSave(),
      },
    });

    this._codeMirror.on('change', doc => {
      const newValue = doc.getValue();
      if (this.props.value !== newValue) {
        this.props.onChange(newValue);
      }
    });
  }

  componentDidUpdate(prevProps) {
    if (this.props.value !== prevProps.value && this._codeMirror.getValue() !== this.props.value) {
      this._codeMirror.setValue(this.props.value);
    }

    this._errorWidgets.forEach(widget => {
      this._codeMirror.removeLineWidget(widget);
    });

    this._lineClasses.forEach(({ lineNumber, className }) => {
      this._codeMirror.removeLineClass(lineNumber, 'text', className);
    });

    if (!this.props.isDirty) {
      this._errorWidgets = this.props.errors.map(error => {
        const message = document.createElement('div');
        message.innerText = error.message;
        message.className = styles.errorMessage;

        return this._codeMirror.addLineWidget(error.lineNumber - 1, message, {
          coverGutter: false,
          noHScroll: true,
        });
      });

      this._lineClasses = this.props.matches.map(({ count, lineNumber }) => {
        const className = `${styles.matchesIndicator} has-${count}-matches`;
        this._codeMirror.addLineClass(lineNumber, 'text', className);
        return { className, lineNumber };
      });
    }
  }

  getHelperClasses() {
    const __html = this.props.matches
      .map(({ count }) => {
        return `.has-${count}-matches:after { content: '${count} ${
          count === 1 ? 'match' : 'matches'
        }' }`;
      })
      .join('\n');

    return { __html };
  }

  render() {
    return (
      <div className={styles.container}>
        <style dangerouslySetInnerHTML={this.getHelperClasses()} />
        <div
          className={styles.container}
          ref={ref => {
            this._editor = ref;
          }}
        />
      </div>
    );
  }
}
