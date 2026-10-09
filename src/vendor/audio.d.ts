/** Standard oscillator waveform source with optional FM synthesis. */
type OscillatorSource = {
    type: "sine" | "triangle" | "square" | "sawtooth";
    /** Fixed frequency in Hz, or a `{ start, end }` range for a pitch sweep. */
    frequency: number | {
        start: number;
        end: number;
    };
    /** Detune in cents. */
    detune?: number;
    /** Frequency modulation: `ratio` is the modulator-to-carrier ratio, `depth` is the modulation index. */
    fm?: {
        ratio: number;
        depth: number;
    };
};
/** Procedural noise source (white, pink, or brown). */
type NoiseSource = {
    type: "noise";
    /** @defaultValue `"white"` */
    color?: "white" | "pink" | "brown";
};
/** Custom waveform built from a harmonic series via `createPeriodicWave`. */
type WavetableSource = {
    type: "wavetable";
    /** Amplitude of each harmonic (index 0 = fundamental). */
    harmonics: number[];
    /** Fixed frequency in Hz, or a `{ start, end }` range for a pitch sweep. */
    frequency: number | {
        start: number;
        end: number;
    };
};
/** Plays a pre-recorded audio sample from a URL or an existing `AudioBuffer`. */
type SampleSource = {
    type: "sample";
    /** URL of the audio file to fetch and decode. Cached after first load. */
    url?: string;
    /** Pre-decoded buffer to use directly. */
    buffer?: AudioBuffer;
    /** Playback speed multiplier. @defaultValue `1` */
    playbackRate?: number;
    /** Detune in cents. */
    detune?: number;
    /** Whether the sample loops. */
    loop?: boolean;
    /** Loop region start in seconds. */
    loopStart?: number;
    /** Loop region end in seconds. */
    loopEnd?: number;
};
/** Live audio input from a `MediaStream` (e.g. microphone). Requires a real-time `AudioContext`. */
type StreamSource = {
    type: "stream";
    stream: MediaStream;
};
/** DC offset source, useful for control signals and modulation. */
type ConstantSource = {
    type: "constant";
    /** @defaultValue `1` */
    offset?: number;
};
/** Union of all audio source types that can drive a {@link Layer}. */
type Source = OscillatorSource | NoiseSource | WavetableSource | SampleSource | StreamSource | ConstantSource;
/** Biquad filter type identifiers matching the Web Audio API `BiquadFilterNode.type`. */
type BiquadFilterType = "lowpass" | "highpass" | "bandpass" | "notch" | "allpass" | "peaking" | "lowshelf" | "highshelf";
/** Time-varying envelope applied to a filter's cutoff frequency. */
type FilterEnvelope = {
    /** Time in seconds to ramp from the base frequency to `peak`. @defaultValue `0` */
    attack?: number;
    /** Target frequency in Hz at the peak of the envelope. */
    peak: number;
    /** Time in seconds to decay from `peak` back to the base frequency. */
    decay: number;
};
/** Standard biquad filter with optional frequency envelope. */
type BiquadFilter = {
    type: BiquadFilterType;
    /** Cutoff or center frequency in Hz. */
    frequency: number;
    /** Q factor (resonance). @defaultValue `1` */
    resonance?: number;
    /** Gain in dB (only applies to peaking / shelf types). */
    gain?: number;
    /** Optional frequency envelope that sweeps the cutoff over time. */
    envelope?: FilterEnvelope;
};
/** Arbitrary IIR filter defined by feedforward and feedback coefficients. */
type IIRFilter = {
    type: "iir";
    feedforward: number[];
    feedback: number[];
};
/** Union of supported filter types. */
type Filter = BiquadFilter | IIRFilter;
/**
 * Amplitude envelope (ADSR).
 *
 * Only `decay` is required. Omitting `attack` makes the sound start at full
 * volume; omitting `sustain` lets it fade to silence after the decay phase.
 */
type Envelope = {
    /** Time in seconds to ramp from silence to peak volume. @defaultValue `0` */
    attack?: number;
    /** Time in seconds for the decay phase. */
    decay: number;
    /** Sustain level as a fraction of peak volume (0 – 1). @defaultValue `0` */
    sustain?: number;
    /** Time in seconds for the release phase after sustain. @defaultValue `0` */
    release?: number;
};
/** Parameter that an {@link LFO} can modulate. */
type LFOTarget = "frequency" | "detune" | "gain" | "pan" | "filter.frequency" | "filter.detune" | "filter.Q" | "filter.gain" | "playbackRate";
/** Low-frequency oscillator for periodic modulation of a target parameter. */
type LFO = {
    /** Waveform shape of the modulator. */
    type: "sine" | "triangle" | "square" | "sawtooth";
    /** Modulation rate in Hz. */
    frequency: number;
    /** Modulation depth (units depend on the target parameter). */
    depth: number;
    /** Which parameter this LFO modulates. */
    target: LFOTarget;
};
/** 3D spatial panner configuration using the Web Audio `PannerNode`. */
type Panner3D = {
    positionX: number;
    positionY: number;
    positionZ: number;
    orientationX?: number;
    orientationY?: number;
    orientationZ?: number;
    /** @defaultValue `"HRTF"` */
    panningModel?: "equalpower" | "HRTF";
    /** @defaultValue `"inverse"` */
    distanceModel?: "linear" | "inverse" | "exponential";
    maxDistance?: number;
    refDistance?: number;
    rolloffFactor?: number;
    coneInnerAngle?: number;
    coneOuterAngle?: number;
    coneOuterGain?: number;
};
/** Position and orientation of the audio listener for 3D spatialization. */
type Listener = {
    positionX: number;
    positionY: number;
    positionZ: number;
    forwardX?: number;
    forwardY?: number;
    forwardZ?: number;
    upX?: number;
    upY?: number;
    upZ?: number;
};
/** Algorithmic reverb generated from an exponentially-decaying noise impulse. */
type ReverbEffect = {
    type: "reverb";
    /** Tail length in seconds. @defaultValue `0.5` */
    decay?: number;
    /** Delay in seconds before the reverb onset. @defaultValue `0` */
    preDelay?: number;
    /** High-frequency damping (0 – 1). @defaultValue `0` */
    damping?: number;
    /** Multiplier on the decay length. @defaultValue `1` */
    roomSize?: number;
    /** Dry/wet mix (0 = fully dry, 1 = fully wet). @defaultValue `0.3` */
    mix?: number;
};
/** Convolution reverb using a provided impulse response buffer or URL. */
type ConvolverEffect = {
    type: "convolver";
    /** URL of the impulse response audio file. */
    url?: string;
    /** Pre-decoded impulse response buffer. */
    buffer?: AudioBuffer;
    /** @defaultValue `0.5` */
    mix?: number;
};
/** Feedback delay with optional filter in the feedback path. */
type DelayEffect = {
    type: "delay";
    /** Delay time in seconds. @defaultValue `0.25` */
    time?: number;
    /** Feedback gain (0 – 1). @defaultValue `0.3` */
    feedback?: number;
    /** Optional filter applied in the feedback loop. */
    feedbackFilter?: {
        type: BiquadFilterType;
        frequency: number;
        Q?: number;
    };
    /** @defaultValue `0.3` */
    mix?: number;
};
/** Waveshaper-based distortion using a `tanh` transfer curve. */
type DistortionEffect = {
    type: "distortion";
    /** Drive amount (higher = more distortion). @defaultValue `50` */
    amount?: number;
    /** @defaultValue `0.5` */
    mix?: number;
};
/** Stereo chorus using two LFO-modulated delay lines. */
type ChorusEffect = {
    type: "chorus";
    /** LFO rate in Hz. @defaultValue `1.5` */
    rate?: number;
    /** LFO depth in seconds. @defaultValue `0.003` */
    depth?: number;
    /** @defaultValue `0.3` */
    mix?: number;
};
/** Flanging effect via a short LFO-modulated delay with feedback. */
type FlangerEffect = {
    type: "flanger";
    /** LFO rate in Hz. @defaultValue `0.5` */
    rate?: number;
    /** LFO depth in seconds. @defaultValue `0.002` */
    depth?: number;
    /** Feedback gain (0 – 1). @defaultValue `0.5` */
    feedback?: number;
    /** @defaultValue `0.5` */
    mix?: number;
};
/** Multi-stage allpass phaser with LFO sweep. */
type PhaserEffect = {
    type: "phaser";
    /** LFO rate in Hz. @defaultValue `0.5` */
    rate?: number;
    /** LFO depth in Hz. @defaultValue `1000` */
    depth?: number;
    /** Number of allpass stages. @defaultValue `4` */
    stages?: number;
    /** Feedback gain (0 – 1). @defaultValue `0.5` */
    feedback?: number;
    /** @defaultValue `0.5` */
    mix?: number;
};
/** Amplitude modulation (volume tremolo). */
type TremoloEffect = {
    type: "tremolo";
    /** LFO rate in Hz. @defaultValue `4` */
    rate?: number;
    /** Modulation depth (0 – 1). @defaultValue `0.5` */
    depth?: number;
};
/** Pitch vibrato via a short modulated delay line. */
type VibratoEffect = {
    type: "vibrato";
    /** LFO rate in Hz. @defaultValue `5` */
    rate?: number;
    /** LFO depth in seconds. @defaultValue `0.002` */
    depth?: number;
};
/** Bit-depth reduction and optional sample-rate decimation. */
type BitcrusherEffect = {
    type: "bitcrusher";
    /** Bit depth. @defaultValue `8` */
    bits?: number;
    /** Sample rate reduction factor. @defaultValue `1` */
    sampleRateReduction?: number;
    /** @defaultValue `1` */
    mix?: number;
};
/** Dynamics compressor wrapping the native `DynamicsCompressorNode`. */
type CompressorEffect = {
    type: "compressor";
    /** Threshold in dB. @defaultValue `-24` */
    threshold?: number;
    /** Knee width in dB. @defaultValue `30` */
    knee?: number;
    /** Compression ratio. @defaultValue `4` */
    ratio?: number;
    /** Attack time in seconds. @defaultValue `0.003` */
    attack?: number;
    /** Release time in seconds. @defaultValue `0.25` */
    release?: number;
};
/** A single band in a parametric EQ. */
type EQBand = {
    type: "lowshelf" | "highshelf" | "peaking";
    /** Center or corner frequency in Hz. */
    frequency: number;
    /** Gain in dB. */
    gain: number;
    /** Q factor. @defaultValue `1` */
    Q?: number;
};
/** Multi-band parametric equalizer built from chained `BiquadFilterNode`s. */
type EQEffect = {
    type: "eq";
    bands: EQBand[];
};
/** Simple gain stage. */
type GainEffect = {
    type: "gain";
    /** Linear gain value. */
    value: number;
};
/** Stereo panner effect. */
type StereoPanEffect = {
    type: "pan";
    /** Pan position from -1 (full left) to 1 (full right). */
    value: number;
};
/** Union of all effect types that can be applied to a {@link Layer} or globally. */
type Effect = ReverbEffect | ConvolverEffect | DelayEffect | DistortionEffect | ChorusEffect | FlangerEffect | PhaserEffect | TremoloEffect | VibratoEffect | BitcrusherEffect | CompressorEffect | EQEffect | GainEffect | StereoPanEffect;
/**
 * A single audio layer combining a source, envelope, filter chain, effects,
 * LFO modulation, and spatial positioning.
 */
type Layer = {
    /** The audio source that generates the signal. */
    source: Source;
    /** One or more filters applied before the envelope. */
    filter?: Filter | Filter[];
    /** Amplitude envelope (ADSR). Defaults to a short 0.5 s fade if omitted. */
    envelope?: Envelope;
    /** Output gain (0 – 1). @defaultValue `0.5` */
    gain?: number;
    /** Stereo pan (-1 left, 0 center, 1 right). */
    pan?: number;
    /** 3D spatialization config. Mutually exclusive with `pan`. */
    panner?: Panner3D;
    /** Start delay in seconds relative to the sound's trigger time. */
    delay?: number;
    /** One or more LFOs for periodic modulation. */
    lfo?: LFO | LFO[];
    /** Per-layer effects chain applied after the envelope. */
    effects?: Effect[];
};
/** A sound built from multiple parallel {@link Layer}s with an optional global effects chain. */
type MultiLayerSound = {
    layers: Layer[];
    /** Effects applied to the summed output of all layers. */
    effects?: Effect[];
};
/**
 * Top-level sound definition: either a single {@link Layer} or a
 * {@link MultiLayerSound} with multiple layers.
 */
type SoundDefinition = Layer | MultiLayerSound;
/** Handle returned by the engine for stopping an in-flight voice. */
type VoiceHandle = {
    /**
     * Stops the voice with an optional fade-out.
     *
     * @param releaseTime - Fade-out duration in seconds. @defaultValue `0.015`
     */
    stop: (releaseTime?: number) => void;
};
/** Runtime overrides passed when triggering a sound. */
type PlayOptions = {
    /** Volume multiplier (0 – 1). */
    volume?: number;
    /** Stereo pan override (-1 left, 0 center, 1 right). */
    pan?: number;
    /** Detune in cents, added to the source's existing detune. */
    detune?: number;
    /** Playback rate multiplier. */
    playbackRate?: number;
    /** Velocity sensitivity (0 – 1). Scales gain and can dim filter cutoffs. */
    velocity?: number;
};
/** A single step in a {@link playSequence} timeline. */
type SequenceStep = {
    /** A sound definition to render, or a pre-bound play function. */
    sound: SoundDefinition | ((opts?: PlayOptions) => VoiceHandle | undefined);
    /** Absolute time in seconds within the sequence. */
    at?: number;
    /** Relative offset in seconds from the previous step. */
    wait?: number;
    /** Per-step volume override. */
    volume?: number;
};
/** Options for sequence playback. */
type SequenceOptions = {
    /** Whether the sequence loops indefinitely. */
    loop?: boolean;
    /** Total loop duration in seconds (used when `loop` is true). */
    duration?: number;
};
/** JSON-serializable patch containing named sound definitions. */
type SoundPatch = {
    /** Optional JSON Schema reference for validation. */
    $schema?: string;
    /** Display name of the patch. */
    name: string;
    author?: string;
    version?: string;
    description?: string;
    tags?: string[];
    /** Map of sound names to their definitions. */
    sounds: Record<string, SoundDefinition>;
};
/** Configuration for creating an {@link AudioAnalyser}. */
type AnalyserOptions = {
    /** FFT window size (must be a power of 2). @defaultValue `2048` */
    fftSize?: number;
    /** Smoothing between consecutive frames (0 – 1). @defaultValue `0.8` */
    smoothingTimeConstant?: number;
    /** Minimum dB range for frequency data. */
    minDecibels?: number;
    /** Maximum dB range for frequency data. */
    maxDecibels?: number;
};
/** Options for offline (non-realtime) audio rendering. */
type OfflineRenderOptions = {
    /** Total render duration in seconds. */
    duration: number;
    /** Sample rate in Hz. @defaultValue `44100` */
    sampleRate?: number;
    /** Number of output channels. @defaultValue `2` */
    numberOfChannels?: number;
};
/** A connectable effect node with an input, output, and optional cleanup. */
type EffectNode = {
    input: AudioNode;
    output: AudioNode;
    /** Stops any internal oscillators / resources. */
    dispose?: () => void;
};
/** Options passed when creating the shared `AudioContext`. */
type ContextOptions = {
    /** Hint for the desired audio latency category. */
    latencyHint?: AudioContextLatencyCategory;
    /** Desired sample rate in Hz. */
    sampleRate?: number;
};

/**
 * Wrapper around the native `AnalyserNode` with pre-allocated typed arrays
 * for zero-allocation reads in animation loops.
 */
type AudioAnalyser = {
    /** The underlying Web Audio `AnalyserNode`. */
    node: AnalyserNode;
    /** Returns byte-scaled frequency magnitudes (0 – 255). */
    getFrequencyData: () => Uint8Array;
    /** Returns byte-scaled time-domain waveform (0 – 255). */
    getTimeDomainData: () => Uint8Array;
    /** Returns frequency magnitudes in dB. */
    getFloatFrequencyData: () => Float32Array;
    /** Returns time-domain waveform as floats (-1 to 1). */
    getFloatTimeDomainData: () => Float32Array;
    /** Number of frequency bins (half of `fftSize`). */
    frequencyBinCount: number;
    /** Disconnects the analyser and releases resources. */
    dispose: () => void;
};
/**
 * Creates a standalone {@link AudioAnalyser}.
 *
 * The caller is responsible for connecting a source to `analyser.node`.
 * Call `analyser.dispose()` when finished to disconnect.
 *
 * @param opts - FFT size, smoothing, and dB range overrides
 */
declare function createAnalyser(opts?: AnalyserOptions): AudioAnalyser;
/**
 * Creates an {@link AudioAnalyser} that is pre-connected to the master bus.
 *
 * Useful for visualising the combined output of all sounds.
 * The returned analyser automatically disconnects from the master bus on
 * `dispose()`.
 *
 * @param opts - FFT size, smoothing, and dB range overrides
 */
declare function createMasterAnalyser(opts?: AnalyserOptions): AudioAnalyser;

/**
 * Ensures the `AudioContext` is running and ready for playback.
 *
 * Unlike {@link getContext}, this awaits the `resume()` promise so the
 * caller can be certain audio output is active before proceeding.
 *
 * @param options - Context creation options
 * @returns A promise that resolves to the active `AudioContext`
 */
declare function ensureReady(options?: ContextOptions): Promise<AudioContext>;
/**
 * Closes the shared `AudioContext` and releases all associated resources.
 *
 * After calling this, the next call to {@link getContext} will create a
 * fresh context.
 */
declare function dispose(): void;
/**
 * Returns the master bus `GainNode`, creating it on first access.
 *
 * The master bus sits between all sound output and `ctx.destination`,
 * providing a single point to control global volume.
 */
declare function getMasterBus(): GainNode;
/**
 * Returns the appropriate destination node for sound output.
 *
 * If a master bus has been created, routes through it; otherwise falls
 * back to `ctx.destination`.
 */
declare function getDestination(): AudioNode;
/**
 * Sets the master volume for all audio output.
 *
 * @param volume - Linear gain value (0 = silent, 1 = unity)
 */
declare function setMasterVolume(volume: number): void;
/**
 * Configures the 3D audio listener position and orientation.
 *
 * @param listener - Position and orientation values
 * @see {@link getListener}
 */
declare function setListener(listener: Listener): void;
/**
 * Reads the current 3D audio listener position and orientation.
 *
 * @returns A snapshot of the listener's spatial parameters
 * @see {@link setListener}
 */
declare function getListener(): Listener;

/**
 * Renders a sound definition to an `AudioBuffer` using `OfflineAudioContext`.
 *
 * No speakers are involved — the entire render happens in memory.
 *
 * @param definition - The sound to render
 * @param options - Duration, sample rate, and channel count
 * @param playOpts - Runtime overrides (volume, detune, etc.)
 * @returns A promise resolving to the rendered `AudioBuffer`
 */
declare function renderToBuffer(definition: SoundDefinition, options: OfflineRenderOptions, playOpts?: PlayOptions): Promise<AudioBuffer>;
/**
 * Encodes an `AudioBuffer` as a 16-bit PCM WAV `Blob`.
 *
 * @param buffer - The audio buffer to encode
 * @returns A `Blob` with MIME type `audio/wav`
 */
declare function bufferToWav(buffer: AudioBuffer): Blob;
/**
 * Convenience wrapper that renders a sound and encodes it as a WAV `Blob`.
 *
 * Equivalent to calling {@link renderToBuffer} followed by {@link bufferToWav}.
 *
 * @param definition - The sound to render
 * @param options - Duration, sample rate, and channel count
 * @param playOpts - Runtime overrides
 * @returns A promise resolving to a WAV `Blob`
 */
declare function renderToWav(definition: SoundDefinition, options: OfflineRenderOptions, playOpts?: PlayOptions): Promise<Blob>;

/**
 * A loaded sound patch with methods to play individual sounds by name.
 *
 * @example
 * ```typescript
 * const patch = await loadPatch("https://example.com/ui-sounds.json");
 * patch.play("click");
 * ```
 */
type AudioPatch = {
    /** `true` once the patch data has been loaded and parsed. */
    ready: boolean;
    name: string;
    author?: string;
    version?: string;
    description?: string;
    tags?: string[];
    /** Names of all sounds contained in this patch. */
    sounds: string[];
    /**
     * Plays a named sound from the patch.
     *
     * @param name - Sound name (must exist in {@link sounds})
     * @param opts - Runtime overrides
     * @throws {Error} If the sound name is not found in the patch
     */
    play: (name: string, opts?: PlayOptions) => VoiceHandle;
    /** Returns the raw {@link SoundDefinition} for a named sound, or `undefined`. */
    get: (name: string) => SoundDefinition | undefined;
    /** Returns a deep-cloned copy of the underlying {@link SoundPatch} data. */
    toJSON: () => SoundPatch;
};
declare function createPatchInstance(data: SoundPatch): AudioPatch;
/**
 * Creates an {@link AudioPatch} from an in-memory {@link SoundPatch} object.
 *
 * @param data - The sound patch data
 * @returns A ready-to-play `AudioPatch`
 */
declare function definePatch(data: SoundPatch): AudioPatch;
/**
 * Loads a sound patch from a URL or an in-memory object.
 *
 * When `source` is a string, it is fetched as JSON and decoded into a
 * {@link SoundPatch}. When it is already a `SoundPatch`, it is used directly.
 *
 * @param source - URL string or `SoundPatch` object
 * @returns A promise that resolves to a ready-to-play {@link AudioPatch}
 * @throws {Error} If the network request fails
 */
declare function loadPatch(source: string | SoundPatch): Promise<AudioPatch>;

/**
 * Binds a {@link SoundDefinition} into a reusable play function.
 *
 * The returned function creates a new voice each time it is called,
 * routing through the master bus.
 *
 * @param definition - The sound to bind
 * @returns A function that plays the sound and returns a {@link VoiceHandle}
 *
 * @example
 * ```typescript
 * import { defineSound } from "./audio";
 *
 * const click = defineSound({
 *   source: { type: "sine", frequency: { start: 1800, end: 400 } },
 *   envelope: { attack: 0, decay: 0.08 },
 *   gain: 0.3,
 * });
 *
 * click(); // plays the sound
 * ```
 */
declare function defineSound(definition: SoundDefinition): (opts?: PlayOptions) => VoiceHandle;
/**
 * Binds a list of {@link SequenceStep}s into a reusable play function.
 *
 * @param steps - Ordered list of sequence steps
 * @param options - Loop and duration settings
 * @returns A function that starts the sequence and returns a stop callback
 *
 * @example
 * ```typescript
 * const melody = defineSequence([
 *   { sound: noteC, at: 0 },
 *   { sound: noteE, at: 0.25 },
 *   { sound: noteG, at: 0.5 },
 * ], { loop: true, duration: 1 });
 *
 * const stop = melody();
 * // later...
 * stop?.();
 * ```
 */
declare function defineSequence(steps: SequenceStep[], options?: SequenceOptions): (opts?: PlayOptions) => (() => void) | undefined;
/**
 * Shortcut: creates a sine-wave sound with the given frequency and decay.
 *
 * @param frequency - Fixed Hz or `{ start, end }` sweep
 * @param decay - Envelope decay time in seconds
 * @param gain - Output gain (0 – 1). @defaultValue `0.4`
 */
declare function sine(frequency: number | {
    start: number;
    end: number;
}, decay: number, gain?: number): (opts?: PlayOptions) => VoiceHandle;
/**
 * Shortcut: creates a triangle-wave sound with the given frequency and decay.
 *
 * @param frequency - Fixed Hz or `{ start, end }` sweep
 * @param decay - Envelope decay time in seconds
 * @param gain - Output gain (0 – 1). @defaultValue `0.4`
 */
declare function triangle(frequency: number | {
    start: number;
    end: number;
}, decay: number, gain?: number): (opts?: PlayOptions) => VoiceHandle;
/**
 * Shortcut: creates a square-wave sound with the given frequency and decay.
 *
 * @param frequency - Fixed Hz or `{ start, end }` sweep
 * @param decay - Envelope decay time in seconds
 * @param gain - Output gain (0 – 1). @defaultValue `0.4`
 */
declare function square(frequency: number | {
    start: number;
    end: number;
}, decay: number, gain?: number): (opts?: PlayOptions) => VoiceHandle;
/**
 * Shortcut: creates a sawtooth-wave sound with the given frequency and decay.
 *
 * @param frequency - Fixed Hz or `{ start, end }` sweep
 * @param decay - Envelope decay time in seconds
 * @param gain - Output gain (0 – 1). @defaultValue `0.4`
 */
declare function sawtooth(frequency: number | {
    start: number;
    end: number;
}, decay: number, gain?: number): (opts?: PlayOptions) => VoiceHandle;
/**
 * Shortcut: creates a noise burst with the given color and decay.
 *
 * @param color - Noise spectrum. @defaultValue `"white"`
 * @param decay - Envelope decay time in seconds. @defaultValue `0.05`
 * @param gain - Output gain (0 – 1). @defaultValue `0.4`
 */
declare function noise(color?: "white" | "pink" | "brown", decay?: number, gain?: number): (opts?: PlayOptions) => VoiceHandle;

export { bufferToWav, createAnalyser, createMasterAnalyser, createPatchInstance, definePatch, defineSequence, defineSound, dispose, ensureReady, getDestination, getListener, getMasterBus, loadPatch, noise, renderToBuffer, renderToWav, sawtooth, setListener, setMasterVolume, sine, square, triangle };
export type { AnalyserOptions, AudioAnalyser, AudioPatch, BiquadFilter, BiquadFilterType, BitcrusherEffect, ChorusEffect, CompressorEffect, ConstantSource, ContextOptions, ConvolverEffect, DelayEffect, DistortionEffect, EQBand, EQEffect, Effect, EffectNode, Envelope, Filter, FilterEnvelope, FlangerEffect, GainEffect, IIRFilter, LFO, LFOTarget, Layer, Listener, MultiLayerSound, NoiseSource, OfflineRenderOptions, OscillatorSource, Panner3D, PhaserEffect, PlayOptions, ReverbEffect, SampleSource, SequenceOptions, SequenceStep, SoundDefinition, SoundPatch, Source, StereoPanEffect, StreamSource, TremoloEffect, VibratoEffect, VoiceHandle, WavetableSource };
