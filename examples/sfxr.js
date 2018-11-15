// sfxr

let globalVolume = 1;
const sounds = {};

When` {someone} wishes ${'sfxr'} has effect named {effect} with params {params}`(({ effect, params }) => {
  if (!sounds[effect]) {
    sounds[effect] = { params, pool: [], playing: [] };
  }
  if (sounds[effect].params !== params) {
    if (!sounds[effect].every((value, index) => params[index] === value)) {
      log(effect);
      sounds[effect].params = params;
      for (const [index, audio] of sounds[effect].pool) {
        audio.src = jsfxr(params);
      }
    }
  }
});

function getAudio(effect) {
  const sound = sounds[effect];
  let audio = sound.pool.pop();
  if (!audio) {
    audio = new Audio();
    audio.src = jsfxr(sound.params);
  }
  sound.playing.push(audio);
  return audio;
}

// Return finished audios to the pool
When` current time is {time}`(() => {
  for (const [name, { playing, pool }] of Object.entries(sounds)) {
    for (let i = playing.length - 1; i >= 0; i--) {
      const audio = playing[i];
      if (audio.ended) {
        playing.splice(i, 1);
        pool.push(audio);
      }
    }
  }
});

function playSound(effect, volume) {
  const sound = sounds[effect];
  if (!sound) return;

  const audio = getAudio(effect, volume);
  audio.volume = globalVolume * volume;
  audio.play();

  const ill = new Illumination(
    Shapes.text({
      x: 3, y: 60,
      text: effect,
      fill: 'yellow',
      size: 50, fit: true,
    })
  );
  Wish`${you} has illumination ${ill}`;
}

// Load the library
const url = `/lib/jsfxr.js`;
Wish` ${'system'} loads js library from ${url}`;

When` ${'system'} loaded js library from ${url}`(() => {
  // Default to full volume if not specified
  When` {someone} wishes ${'sfxr'} plays effect named {effect}`(({ effect }) => {
    playSound(effect, 1);
  });

  // Play a one-shot sound effect
  When` {someone} wishes ${'sfxr'} plays effect named {effect} with volume {volume}`(({ effect, volume }) => {
    playSound(effect, volume);
  });

  // Set global volume
  When` ${you} has numerical value {value}`(({ value }) => {
    globalVolume = value / 100;
    const ill = new Illumination(
      Shapes.text({
        x: 3, y: 120,
        text: 'Volume ' + Math.round(volume * 100),
        fill: 'yellow',
        size: 25, fit: true,
      })
    );
    Wish`${you} has illumination ${ill}`;
  });
});
