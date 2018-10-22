import React from 'react';
import CodeMirror from 'codemirror';
import 'codemirror/mode/javascript/javascript';
import isEqual from 'lodash/isEqual';

import 'codemirror/lib/codemirror.css';
import styles from './CodeMirrorEditor.css';

export default class CodeMirrorEditor extends React.Component {
  constructor() {
    super();

    this._widgets = [];
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

    if (this.props.isDirty && !prevProps.isDirty) {
      // remove widgets
      this._widgets.forEach(widget => {
        this._codeMirror.removeLineWidget(widget);
      });
    }

    // update widgets if errors logs or matches changed
    if (
      !isEqual(this.props.errors, prevProps.errors) ||
      !isEqual(this.props.logs, prevProps.logs) ||
      !isEqual(this.props.matches, prevProps.matches)
    ) {
      // remove widgets
      this._widgets.forEach(widget => {
        this._codeMirror.removeLineWidget(widget);
      });

      // readd if not dirty
      if (!this.props.isDirty) {
        const errorWidgets = this.props.errors.map(({ message, lineNumber }) => {
          const el = document.createElement('div');
          el.innerText = message;
          el.className = styles.errorMessage;

          return this._codeMirror.addLineWidget(lineNumber - 1, el, {
            coverGutter: false,
            noHScroll: true,
          });
        });

        const logWidgets = this.props.logs.map(({ lineNumber, values }) => {
          const el = document.createElement('div');
          el.innerText = values.map(v => JSON.stringify(v)).join(', ');
          el.className = styles.logMessage;

          return this._codeMirror.addLineWidget(lineNumber - 1, el, {
            coverGutter: false,
            noHScroll: true,
          });
        });

        const matchWidgets = this.props.matches.map(({ lineNumber, count }) => {
          const message = document.createElement('div');
          message.innerText = `${count} ${count === 1 ? 'match' : 'matches'}`;
          message.className = styles.matchMessage;

          return this._codeMirror.addLineWidget(lineNumber - 1, message, {
            coverGutter: false,
            noHScroll: true,
            above: true,
          });
        });

        this._widgets = errorWidgets.concat(logWidgets).concat(matchWidgets);
      }
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
