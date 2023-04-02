/**
 * Unit tests for the boardModel and its operations.
 *
 * @author Jesse Greenberg (PhET Interactive Simulations)
 */

import boardModel from '../board/boardModel.js';

QUnit.module( 'boardModel' );

QUnit.test( 'add/remove model components', assert => {
  assert.ok( boardModel.size === 0, 'first test, empty model' );

  const componentA = { x: 5 };
  phet.paperLand.addModelComponent( 'componentA', componentA );
  assert.ok( boardModel.size === 1, 'componentA added' );
  assert.ok( boardModel.get( 'componentA' ) === componentA, 'componentA in map' );

  phet.paperLand.removeModelComponent( 'componentA' );
  assert.ok( boardModel.size === 0, 'componentA removed' );
} );

QUnit.test( 'addModelObserver/removeModelObserver', assert => {

  const modelComponent = new phet.axon.Property( 0 );
  const componentListener = () => {};
  const handleComponentAttach = component => component.link( componentListener );
  const handleComponentDetach = component => component.unlink( componentListener );

  // tests adding component, then adding observer
  phet.paperLand.addModelComponent( 'modelComponent', modelComponent );
  const observerId = phet.paperLand.addModelObserver( 'modelComponent', handleComponentAttach, handleComponentDetach );
  assert.ok( modelComponent.getListenerCount() === 1, 'handleComponentAttach should have been used since the model component exists' );
  assert.ok( phet.paperLand.modelComponentRemovedEmitter.getListenerCount() === 1, 'should be a listener watching for model component removal' );

  // tests removing component while observer is active
  phet.paperLand.removeModelComponent( 'modelComponent' );
  assert.ok( modelComponent.getListenerCount() === 0, 'handleComponentDetach should be used when the model component is removed' );
  assert.ok( phet.paperLand.modelComponentRemovedEmitter.getListenerCount() === 0, 'listener for component removal should have been removed' );
  assert.ok( phet.paperLand.modelComponentAddedEmitter.getListenerCount() === 1, 'should be a listener waiting for the model component to be added back' );

  // tests adding component after adding observer
  phet.paperLand.addModelComponent( 'modelComponent', modelComponent );
  assert.ok( modelComponent.getListenerCount() === 1, 'observer was active, component listener should have been added to the component' );
  assert.ok( phet.paperLand.modelComponentRemovedEmitter.getListenerCount() === 1, 'should be a listener watching for model component removal' );
  assert.ok( phet.paperLand.modelComponentAddedEmitter.getListenerCount() === 0, 'listener waiting for model component to be added should have been removed' );

  // tests removing observer while component is active
  phet.paperLand.removeModelObserver( 'modelComponent', handleComponentDetach, observerId );
  assert.ok( modelComponent.getListenerCount() === 0, 'observer was removed, componentListener should be detached' );
  assert.ok( phet.paperLand.modelComponentRemovedEmitter.getListenerCount() === 0, 'observer was removed, model should not be waiting for component removal' );
  assert.ok( phet.paperLand.modelComponentAddedEmitter.getListenerCount() === 0, 'observer was removed, model should not be waiting for component addition' );
  assert.ok( boardModel.has( 'modelComponent' ), 'observer removed but model component remains in model' );

  // clear for next test
  phet.paperLand.removeModelComponent( 'modelComponent' );
} );

// Tests for this are more sparse, but addModelPropertyLink uses addModelObserver so addModelObserver tests should
// also cover most cases
QUnit.test( 'addModelPropertyLink/removeModelPropertyLink', assert => {

  const modelComponent = new phet.axon.Property( 0 );
  const componentListener = () => {};

  // Test adding the component and then adding the observer
  phet.paperLand.addModelComponent( 'modelComponent', modelComponent );
  const linkId = phet.paperLand.addModelPropertyLink( 'modelComponent', componentListener );
  assert.ok( modelComponent.getListenerCount() === 1, 'addModelPropertyLink should add the componentListener since model component is available' );
  assert.ok( phet.paperLand.modelComponentRemovedEmitter.getListenerCount() === 1, 'should be waiting to handle component removal' );

  // tests removing the component observer while the model component is actives
  phet.paperLand.removeModelPropertyLink( 'modelComponent', linkId );
  assert.ok( modelComponent.getListenerCount() === 0, 'removeModelPropertyLink should detach the listener' );
  assert.ok( phet.paperLand.modelComponentRemovedEmitter.getListenerCount() === 0, 'observer removed, model should not be waiting for component removal' );
  assert.ok( phet.paperLand.modelComponentAddedEmitter.getListenerCount() === 0, 'observer removed, model should not be waiting for component add' );

  // clear for next test
  phet.paperLand.removeModelComponent( 'modelComponent' );
} );

QUnit.test( 'multiple observers on the same observable', assert => {

  // add model components
  const modelComponent = new phet.axon.Property( 0 );
  phet.paperLand.addModelComponent( 'modelComponent', modelComponent );

  // link two listeners to the same model component
  const listenerA = () => {};
  const listenerB = () => {};
  const linkIdA = phet.paperLand.addModelPropertyLink( 'modelComponent', listenerA );
  const linkIdB = phet.paperLand.addModelPropertyLink( 'modelComponent', listenerB );
  assert.ok( modelComponent.getListenerCount() === 2, 'two listeners linked to model Property' );
  assert.ok( phet.paperLand.modelComponentRemovedEmitter.getListenerCount() === 2, 'both waiting for model component to be removed' );

  // remove the model component, links should be detached
  phet.paperLand.removeModelComponent( 'modelComponent' );
  assert.ok( modelComponent.getListenerCount() === 0, 'both links detached' );
  assert.ok( phet.paperLand.modelComponentRemovedEmitter.getListenerCount() === 0, 'neither waiting for component removal' );
  assert.ok( phet.paperLand.modelComponentAddedEmitter.getListenerCount() === 2, 'both now waiting for component addition' );

  // add the model component back
  phet.paperLand.addModelComponent( 'modelComponent', modelComponent );
  assert.ok( modelComponent.getListenerCount() === 2, 'two listeners linked to model Property' );
  assert.ok( phet.paperLand.modelComponentRemovedEmitter.getListenerCount() === 2, 'both waiting for model component to be removed' );
  assert.ok( phet.paperLand.modelComponentAddedEmitter.getListenerCount() === 0, 'neither waiting for component addition' );

  // remove one of the links
  phet.paperLand.removeModelPropertyLink( 'modelComponent', linkIdA );
  assert.ok( modelComponent.getListenerCount() === 1, 'one listener remains on property after first link removal' );
  assert.ok( phet.paperLand.modelComponentRemovedEmitter.getListenerCount() === 1, 'remaining observer waiting for model component to be removed' );
  assert.ok( phet.paperLand.modelComponentAddedEmitter.getListenerCount() === 0, 'neither waiting for component addition' );

  // remove both of the links
  phet.paperLand.removeModelPropertyLink( 'modelComponent', linkIdB );
  assert.ok( modelComponent.getListenerCount() === 0, 'all links detached' );
  assert.ok( phet.paperLand.modelComponentRemovedEmitter.getListenerCount() === 0, 'nothing watching for removal' );
  assert.ok( phet.paperLand.modelComponentAddedEmitter.getListenerCount() === 0, 'nothing watching for added' );

  phet.paperLand.removeModelComponent( 'modelComponent' );
} );

QUnit.test( 'addModelController/removeModelController', assert => {

  // I tried to do this test with an axon Property. For a reason I could not understand, setting the Property value
  // with property.value and property.set had no effect on the Property value in this context.
  const modelComponent = {
    value: 0
  };
  phet.paperLand.addModelComponent( 'modelComponent', modelComponent );

  const controllerAttach = component => { modelComponent.value = component.value + 1; };
  const controllerDetach = component => { modelComponent.value = component.value - 1; };
  const controllerId = phet.paperLand.addModelController( 'modelComponent', controllerAttach, controllerDetach );

  assert.ok( modelComponent.value === 1, 'controller should have incremented the value' );

  phet.paperLand.removeModelComponent( 'modelComponent' );
  assert.ok( modelComponent.value === 0, 'removing component should invoke the detach' );
  assert.ok( phet.paperLand.modelComponentAddedEmitter.getListenerCount() === 1, 'should be waiting for component to come back' );

  phet.paperLand.addModelComponent( 'modelComponent', modelComponent );
  assert.ok( modelComponent.value === 1, 'component added back, controller should be used' );
  assert.ok( phet.paperLand.modelComponentAddedEmitter.getListenerCount() === 0, 'component returned, should not be waiting for it' );
  assert.ok( phet.paperLand.modelComponentRemovedEmitter.getListenerCount() === 1, 'component returned, should waiting for its removal' );

  phet.paperLand.removeModelController( 'modelComponent', controllerId );
  assert.ok( modelComponent.value === 0, 'removing controller should invoke the detach' );
  assert.ok( phet.paperLand.modelComponentAddedEmitter.getListenerCount() === 0, 'no longer waiting for add' );
  assert.ok( phet.paperLand.modelComponentRemovedEmitter.getListenerCount() === 0, 'no longer waiting for removal' );

  phet.paperLand.removeModelComponent( 'modelComponent' );
} );