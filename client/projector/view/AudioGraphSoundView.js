import PlayableAudio from './PlayableAudio.js';

const allSounds = [
  './media/sounds/Quad_Base_Beat_Simple.mp3',
  './media/sounds/Quad_Base_Beat_Simpler.mp3',
  './media/sounds/Quad_Base_Beat_Simpler_Concave_Quadrilateral_Just_Rhythm.mp3',
  './media/sounds/Quad_Base_Beat_Simpler_Concave_Quadrilateral_Just_Rhythm_v2.mp3',
  './media/sounds/Quad_Beat_Tracks_Building_Building_Tracks-000.mp3',
  './media/sounds/Quad_Beat_Tracks_Building_Building_Tracks-001.mp3',
  './media/sounds/Quad_Beat_Tracks_Building_Building_Tracks-002.mp3',
  './media/sounds/Quad_Beat_Tracks_Building_Building_Tracks-003.mp3',
  './media/sounds/Quad_Beat_Tracks_Building_Building_Tracks-004.mp3',
  './media/sounds/Quad_Beat_Tracks_Building_Building_Tracks-005.mp3',
  './media/sounds/Quad_Beat_Tracks_Building_Building_Tracks-006.mp3',
  './media/sounds/Quad_Melody_Tracks-001.mp3',
  './media/sounds/Quad_Melody_Tracks-002.mp3',
  './media/sounds/Quad_Melody_Tracks-003.mp3',
  './media/sounds/Quad_Melody_Tracks-004.mp3',
  './media/sounds/Quad_Melody_Tracks-005.mp3',
  './media/sounds/Quad_Melody_Tracks_000.mp3',
  './media/sounds/Quad_Simple_Building_Tracks-000.mp3',
  './media/sounds/Quad_Simple_Building_Tracks-001.mp3',
  './media/sounds/Quad_Simple_Building_Tracks-002.mp3',
  './media/sounds/Quad_Simple_Building_Tracks-003.mp3',
  './media/sounds/Quad_Simple_Building_Tracks-004.mp3',
  './media/sounds/Quad_Simple_Building_Tracks-004-Trapezoid.mp3',
  './media/sounds/Quad_Simple_Building_Tracks-005.mp3',
  './media/sounds/Quad_Simple_Building_Tracks-006.mp3',
  './media/sounds/Quad_Simple_Building_Tracks-007.mp3'
];

const INDEX_TO_FILE_MAP = new Map();

// In seconds, how long all tracks should play after there has been some change in shape.
const ALL_TRACKS_PLAY_TIME = 4;

// In seconds, how long tracks fade in or fade out when sound transitions between playing and stopped.
const FADE_TIME = 1;

// The maximum output level for all tracks of this sound design. Applied to this SoundGenerator, so that all tracks
// connected to this one will be limited by this output level.
const MAX_OUTPUT_LEVEL = 0.5;

// Range of output levels for individual sound clips under this sound view.
const OUTPUT_LEVEL_RANGE = new dot.Range( 0, 1 );

// linear maps that determine output level from remaining fade time
const REMAINING_FADE_IN_TIME_TO_GAIN = new dot.LinearFunction( FADE_TIME, 0, 0, MAX_OUTPUT_LEVEL );
const REMAINING_FADE_OUT_TIME_TO_GAIN = new dot.LinearFunction( FADE_TIME, 0, MAX_OUTPUT_LEVEL, 0 );

// For the state of the sound view, indicating how sound is currently behaving.
class PlayingState extends phetCore.EnumerationValue {
  static PLAYING = new PlayingState();
  static STOPPED = new PlayingState();
  static FADING_IN = new PlayingState();
  static FADING_OUT = new PlayingState();

  static enumeration = new phetCore.Enumeration( PlayingState );
}

let AUDIO_CLIPS = null;

class AudioGraphSoundView extends tambo.SoundGenerator {
  constructor() {
    super();
  }

  async init() {

    AUDIO_CLIPS = await Promise.all( allSounds.map( async soundPath => {
      return await AudioGraphSoundView.processLoopableSound( soundPath );
    } ) );

    AUDIO_CLIPS.forEach( ( playableAudio, index ) => {

      // set up the map for lookup later
      INDEX_TO_FILE_MAP.set( index, playableAudio );

      // initially not any output
      playableAudio.setOutputLevel( 0 );
    } );
  }

  static async processLoopableSound( soundPath ) {
    const arrayBuffer = await fetch( soundPath ).then( ( res ) => res.arrayBuffer() );
    const playableAudio = new PlayableAudio( arrayBuffer );
    await playableAudio.prepareAudioBuffer();
    return playableAudio;
  }
}

// @public, @static
AudioGraphSoundView.INDEX_TO_FILE_MAP = INDEX_TO_FILE_MAP;

export default AudioGraphSoundView;