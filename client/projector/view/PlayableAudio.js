import globalAudioContext from './globalAudioContext.js';

class PlayableAudio {
  constructor( arrayBuffer ) {
    this.arrayBuffer = arrayBuffer;

    // gain controlling whether or not the audio is playing at all.
    this.outputGainNode = globalAudioContext.createGain();

    this.analyser = globalAudioContext.createAnalyser();
    this.distortion = globalAudioContext.createWaveShaper();
    this.lowpassFilter = globalAudioContext.createBiquadFilter();
    this.highpassFilter = globalAudioContext.createBiquadFilter();
    this.gain = globalAudioContext.createGain(); // volume control gain

    this.outputGainNode.gain.value = 0;
    this.gain.gain.value = 1;

    // by default all audio goes through the filter
    this.lowpassFilter.type = 'allpass';
    this.highpassFilter.type = 'allpass';

    this.audioBuffer = null;
  }

  setOutputLevel( outputLevel ) {
    const limitedOutputLevel = Math.min( 0.6, Math.max( outputLevel, 0 ) );

    // FOR NEXT TIME: There is a strange issue where this code causes
    // "BiquadFilterNode: state is bad, probably due to unstable filter caused by fast parameter automation."
    // and makes a horrible screeching sound.
    // this.outputGainNode.gain.value = limitedOutputLevel;
    this.outputGainNode.gain.setValueAtTime(
      limitedOutputLevel,
      globalAudioContext.currentTime
    );
  }

  async prepareAudioBuffer() {
    this.audioBuffer = await globalAudioContext.decodeAudioData( this.arrayBuffer );
  }

  async play() {
    if ( globalAudioContext.state === 'suspended' ) {
      globalAudioContext.resume();
    }

    this.source = globalAudioContext.createBufferSource();
    this.source.buffer = this.audioBuffer;
    this.source.loop = true;

    // connect to the web audio graph
    // TODO: This is where we need to match the audio graph to the model
    // this.source.connect( this.outputGainNode ).connect( globalAudioContext.destination );

    // this.source.connect( this.analyser );
    // this.analyser.connect( this.distortion );
    // this.distortion.connect( this.lowpassFilter );
    // this.lowpassFilter.connect( this.convolver );
    // this.convolver.connect( this.gain );
    // this.gain.connect( this.outputGainNode );
    // this.outputGainNode.connect( globalAudioContext.destination );

    // set up the audio
    this.source.connect( this.analyser );
    this.analyser.connect( this.distortion );
    this.distortion.connect( this.lowpassFilter );
    this.lowpassFilter.connect( this.gain );
    this.gain.connect( this.outputGainNode );
    this.outputGainNode.connect( globalAudioContext.destination );

    // this.source.connect( this.outputGainNode ).connect( globalAudioContext.destination );

    this.source.start();
  }

  updateConnections( audioTypes ) {

    // reset all of the audio parameters
    this.gain.gain.setTargetAtTime( 1, globalAudioContext.currentTime, 0.015 );
    this.lowpassFilter.type = 'allpass';
    this.highpassFilter.type = 'allpass';
    this.distortion.curve = makeDistortionCurve(0 );
    this.distortion.oversample = "none";

    // now set the audio parameters to exactly the ones that we should have here

    audioTypes.forEach( audioType => {
      if ( audioType === 'gain' ) {
        console.log( 'setting gain' );
        this.gain.gain.setTargetAtTime( 0.4, globalAudioContext.currentTime, 0.015 );
      }
      else if ( audioType === 'lowpass' ) {
        this.lowpassFilter.type = 'lowpass';
        this.lowpassFilter.frequency.setTargetAtTime( 2000, globalAudioContext.currentTime, 1 );
      }
      else if ( audioType === 'highpass' ) {
        this.lowpassFilter.type = 'highpass';
        this.lowpassFilter.frequency.setTargetAtTime( 2000, globalAudioContext.currentTime, 1 );
      }
      else if ( audioType === 'distortion' ) {
        this.distortion.curve = makeDistortionCurve(400);
        this.distortion.oversample = "4x";
      }
    } );

    // this.source.disconnect();
    // this.source.stop();

    // this.source = globalAudioContext.createBufferSource();
    // this.source.buffer = this.audioBuffer;
    // this.source.loop = true;

    // relative to the global audio context so that ALL clips are in the same time frame
    // const currentTime = globalAudioContext.currentTime;

    // update the AudioNodes based on the provided information


    // connect to other audio Nodes as specified by the graph
    // NOTE: I am not sure if I should connect each back to back like this or connect each to the return value of
    // the connect!! But this seems to work.
    // let nextNode = this.source;
    // audioNodes.forEach( audioNode => {
    //   nextNode.connect( audioNode );
    //   nextNode = audioNode;
    // } );

    // final output
    // nextNode.connect( this.outputGainNode ).connect( globalAudioContext.destination );

    // this.source.start();
  }

  pause() {
    if ( this.source ) {

      // stop playing
      this.source.stop();

      // disconnect from web audio graph
      this.source.disconnect();
    }
  }
}

function makeDistortionCurve(amount) {
  const k = typeof amount === "number" ? amount : 50;
  const n_samples = 44100;
  const curve = new Float32Array(n_samples);
  const deg = Math.PI / 180;

  for (let i = 0; i < n_samples; i++) {
    const x = (i * 2) / n_samples - 1;
    curve[i] = ((3 + k) * x * 20 * deg) / (Math.PI + k * Math.abs(x));
  }
  return curve;
}

export default PlayableAudio;
