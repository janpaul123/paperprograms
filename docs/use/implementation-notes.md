# Paper Land Implementation Notes

## Model-View Separation

Paper Land is set up to support a software design pattern called "model-view separation" in the Program code. This pattern
is often used when developing user interfaces and is heavily used by PhET libraries. It separates internal
data from the way it is presented to the user.

Benefits of model-view separation include:

- You can create multiple output modalities/representations from a single model.
- Changes to the view do not impact application behavior.

### Model

The "model" is the internal data that represents application state and logic.

### View

The view is everything that can be observed by the user. Graphics, sounds, descriptions, vibrations, tangibles -
anything!

### More info

For more info about this pattern and how it can be used for more than just user interface development, please
see https://github.com/phetsims/phet-info/blob/master/doc/phet-software-design-patterns.md#model-view-controller-mvc
and https://en.wikipedia.org/wiki/Model%E2%80%93view%E2%80%93controller.

### Example Paper Land model

Let's pretend we want to represent a cupcake 🧁 in the Paper Land Board. On the Board, we want to display a visual cupcake
and write strings that describe its properties.

First, lets consider the important things to draw and describe about the cupcake. That will determine the components we
need in the model.

- Type of cake (carrot, chocolate, lemon, ...)
- Type of icing (buttercream, royal, whipped cream, ...)
- Type of sprinkles (confetti, jimmies, pearls, ...)

Let's create a Paper Land model that represents these attributes! As of 2/20/23, Paper Land Program code looks like this:

```js
  const onProgramAdded = ( paperProgramNumber, scratchPad, sharedData ) => {
  
    // (1)
    const model = sharedData.modelProperty.value;
    
    // (2)
    model.cakeTypeProperty = new phet.axon.Property( "Chocolate" );
    model.icingTypeProperty = new phet.axon.Property( "Buttercream" );
    model.sprinklesProperty = new phet.axon.Property( "Confetti" );
  };

  // (3)
  await paper.set('data', {
    paperPlaygroundData: {
      updateTime: Date.now(),
      eventHandlers: {
        onProgramAdded: onProgramAdded.toString()
      }
    }
  } );
```

Quickly breaking down the numbered sections of the above Program code:

1) Get the Board model so that we can assign our cupcake model attributes to it and use them later in the view.
2) Create model attributes for our cupcake. We are using a PhET library component
   called `axon.Property`. `axon.Property` will later be used to watch for value changes to update the view dynamically.
3) Boilerplate that tells Paper Land to create these model components when this Program is detected.

This code demonstrates creating a model but may not be complete for direct use in a Program. We plan to have templates
available with the full code needed to run a Program.

### Example Paper Land view

Let's use the model we just created in some Paper Land Program view code. This view could add dynamic graphics and
descriptions that will change with the model.

```js
  const onProgramAdded = ( paperProgramNumber, scratchPad, sharedData ) => {

    // (1)
    const cupcakeNode = new CupcakeNode(); 
    sharedData.scene.addChild( cupcakeNode );
    
    // (2)
    sharedData.modelProperty.value.cakeTypeProperty.link( cakeType => {
    
      // (3)
      if ( cakeType === "Chocolate" ) {
        cupcakeNode.drawChocolate();
        cupcakeNode.descriptionContent = "The richest chocolate you have ever tasted."
      }
      else if ( cakeType === "Carrot" ) {
        cupcakeNode.drawCarrot();
        cupcakeNode.descriptionContent = "Spiced to perfection."
      }
      else if ( cakeType === "Lemon" ) {
        cupcakeNode.drawLemon();
        cupcakeNode.descriptionContent = "As refreshing as it is sweet."
      }
    } );
  };

  // (4)
  await paper.set('data', {
    paperPlaygroundData: {
      updateTime: Date.now(),
      eventHandlers: {
        onProgramAdded: onProgramAdded.toString(),
      }
    }
  } );
```

Quickly breaking down the numbered sections of the above Program code:

1) We create a `CupcakeNode` and add it to the scene. The `CupcakeNode` could use scenery to draw the cake, icing, and
   sprinkles and add PDOM structure for a screen reader but that is beyond the scope of these notes. The `cupcakeNode` is
   added as a child to the scene so that it is drawn to the Board.
2) We get our `cakeTypeProperty` that we created in our model Program and use `link`. With `link`, whenever
   the `cakeTypeProperty` value changes, the provided code is run. This is what creates dynamic behavior.
3) This is the logic called whenever the model `cakeTypeProperty` changes. I introduced
   imaginary `drawChocolate`, `drawCarrot` and `drawLemon` functions. These functions are beyond the scope of these
   notes, but you could imagine they change images or colors representing the cupcake. They are followed by code
   that changes how the cupcake is described in the PDOM for a screen reader.
4) Boilerplate that tells Paper Land to run this view code whenever the Program is detected.

From a single `cakeTypeProperty`, we could support several output modalities. We can imagine many other view
Programs that could play sounds, trigger vibrations, and many other things from this single model component.

## Board Console
From program code you can use functions like
phet.paperLand.console.log( string )
phet.paperLand.console.warn( string )
phet.paperLand.console.error( message )

and messages will appear in the box and in dev tools.

New messages appear at the bottom of the box and it will auto scroll with new messages unless the user has scrolled up.

The console can be hidden/shown with a checkbox in the board controls panel.