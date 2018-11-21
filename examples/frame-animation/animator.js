// animator

Wish` ${you} has canvas with name ${'frame'}`;

let fps = 1;
let frameTime = 0;
let lastTime = 0;

function calcFrame(time) {
  const dt = (time - lastTime) / 1000;
  lastTime = time;
  frameTime += dt * fps;
	return Math.floor((frameTime / 2) % 3) + 1;
}

When` ${you} has numerical value {value}`(({ value }) => {
  fps = (value / 20) + 1;
  log(fps);
});

When` current time is {time}`(({ time }) => {
  const frame = calcFrame(time);
  log(frame);

  When` {animFrame} is frame number ${frame},
				{animFrame} has corner points {corners},
				${you} has canvas {target} with name ${'frame'},
				${'table'} has camera snapshot {snapshot}`(({ snapshot, corners, target }) => {
    Wish` part of camera snapshot ${snapshot} with corner points ${corners} is drawn on canvas ${target}`;
  });
});
