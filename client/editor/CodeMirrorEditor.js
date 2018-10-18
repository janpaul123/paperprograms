import React from 'react';
import CodeMirror from 'codemirror';
import 'codemirror/mode/javascript/javascript';

import 'codemirror/lib/codemirror.css';
import styles from './CodeMirrorEditor.css';

export default class CodeMirrorEditor extends React.Component {
  constructor() {
    super();

    this._errorWidgets = [];
  }

  componentDidMount() {
    debugger;

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
    }
  }

  render() {
    return (
      <div
        className={styles.container}
        ref={ref => {
          this._editor = ref;
        }}
      />
    );
  }
}
