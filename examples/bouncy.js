// Bouncy

Wish` ${you} is labelled ${'bouncy circle'}`

let x = 0;
let xSpeed = 1.5;
let y = 0;
let ySpeed = 1;

When`current time is {time},
     ${you} has width {width},
     ${you} has height {height}
     `(({ time, width, height }) => {

    const ill =
      new Illumination(
        Shapes.ellipse({
          x,
          y,
          width: 50,
          height: 50,
        })
      );

    if (x > width || x < 0) {
      xSpeed = -xSpeed;
    }
    if (y > height || y < 0) {
      ySpeed = -ySpeed;
    }

    x += xSpeed;
    y += ySpeed;

    Wish` ${you} has illumination ${ill}`
    Wish` ${you} has outline`

  })
  