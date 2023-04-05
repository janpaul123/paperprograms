/**
 * Displays a bootstrap Alert that lets you know if a request to save was successful or failed.
 *
 * @author Jesse Greenberg (PhET Interactive Simulations)
 */

import React from 'react';
import Alert from 'react-bootstrap/Alert';

class SaveAlert extends React.Component {

  /**
   * @property success {boolean}
   * @property show {boolean}
   * @param props
   */
  constructor( props ) {
    super( props );
  }

  /**
   * Renders the component.
   */
  render() {
    const valueString = this.props.success ? 'Saved ✓' : 'Failed to save';
    const variant = this.props.success ? 'success' : 'danger';
    const show = this.props.show;

    return (
      <div
        style={{

          // centers the alert horizontally
          display: 'flex',
          justifyContent: 'center',
          padding: '10px'
        }}
      >
        <Alert
          show={show}
          variant={variant}
          style={{

            // makes the alert only as big as its contents
            display: 'inline-block'
          }}
        >
          <Alert.Heading>{valueString}</Alert.Heading>
        </Alert>
      </div>
    );
  }
}

export default SaveAlert;