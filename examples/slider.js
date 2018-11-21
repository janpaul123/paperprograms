// slider

Wish` ${you} is labelled ${'horiz slider'}`;

let x = 0;

When`${you} has width {width},
		 ${you} has markers {markers}
     `(({ width, markers }) => {

  if (markers.length > 0 && width > 0) {
    const marker = markers[0]
    const value = Math.round(marker.position.x / width) * 100
    Claim` ${you} has numerical value ${value}`;
    Wish` ${you} has whisker that points ${up}`;

    const ill = new Illumination(
      Shapes.text({
        x: 3,
        y: 60,
        text: value,
        fill: 'green',
        size: 25,
        fit: true,
      })
    );
    Wish`${you} has illumination ${ill}`;
  }
  else {
    const ill = new Illumination(
      Shapes.text({
        x: 3,
        y: 60,
        text: 'Place a marker',
        fill: 'green',
        size: 25,
        fit: true,
      })
    );
    Wish`${you} has illumination ${ill}`;
  }
})

When` ${you} points at {target},
      ${you} has numerical value {value}`(({ target, value }) => {
  Claim` ${target} has numerical value ${value}`;
})
