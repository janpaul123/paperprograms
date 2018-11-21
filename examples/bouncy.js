// Bouncy

Wish` ${you} is labelled ${'bouncy circle'}`;

const bounceParams = [0,,0.0421,0.4951,0.2269,0.6387,,,,,,0.482,0.691,,,,,,1,,,,,0.5];
Wish` ${'sfxr'} has effect named ${'bounce'} with params ${bounceParams}`;

let x = 0;
let speed = 40;
let xDir = 1;
let xSpeed = xDir * 1.5 * speed;
let y = 0;
let yDir = 1;
let ySpeed = yDir * 1 * speed;
let size = 50;
let radius = size / 2;
let isInitialized = false;
let lastTime = null;

When` ${you} has numerical value {value}`(({ value }) => {
  speed = value * 2;
  xSpeed = xDir * 1.5 * speed;
  ySpeed = yDir * 1. * speed;
})

When`current time is {time},
     ${you} has width {width},
     ${you} has height {height}
     `(({ time, width, height }) => {

  if (!isInitialized) {
    isInitialized = true;
    x = width / 2 - radius;
    y = height / 2 - radius;
    lastTime = time;
  }

  const dt = (time - lastTime) / 1000;
  lastTime = time;
  
	const ill =
  new Illumination(
  	Shapes.ellipse({
    	x,
			y,
      width: size,
			height: size,
    })
	);
  let bounce = false;
  if (x + radius > width) {
    if (xDir !== -1) bounce = true;
    xDir = -1;
  }
  else if (x - radius < 0) {
    if (xDir !== 1) bounce = true;
    xDir = 1;
  }
  if (y + radius > height) {
    if (yDir !== -1) bounce = true;
    yDir = -1;
  }
  else if (y - radius < 0) {
    if (yDir !== 1) bounce = true;
    yDir = 1;
  }
	if (bounce) Wish` ${'sfxr'} plays effect named ${'bounce'}`;
  log(bounce);
  xSpeed = xDir * 1.5 * speed;
	ySpeed = yDir * 1 * speed;
  x += xSpeed * dt;
  y += ySpeed * dt;
  Wish` ${you} has illumination ${ill}`;
  Wish` ${you} has outline`;
});
