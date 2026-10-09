type Vec3 = [number, number, number];
type Oklch = {
    L: number;
    C: number;
    H: number;
};
declare const rgbToOklch: (rgb: Vec3) => Oklch;
declare const oklchToRgb: ({ L, C, H }: Oklch) => Vec3;
declare const hexToRgb: (hex: string) => Vec3;

type Palette = {
    a: [number, number, number];
    b: [number, number, number];
    c: [number, number, number];
    d: [number, number, number];
};
declare const ACCENTS: {
    readonly red: "#FF3D7F";
    readonly orange: "#FF7A1A";
    readonly yellow: "#FFD600";
    readonly green: "#C2FF3D";
    readonly mint: "#00FFA8";
    readonly teal: "#00E5D6";
    readonly cyan: "#1FC8FF";
    readonly blue: "#2E70FF";
    readonly indigo: "#7B4FFF";
    readonly purple: "#D33CFF";
    readonly pink: "#FF3DC0";
    readonly brown: "#D8A87B";
};
type AccentName = keyof typeof ACCENTS;
declare const ACCENT_ORDER: AccentName[];
/**
 * Closed-form 2-color cosine palette: sweeps from A at t=0 to B at t=1.
 * Anchor blending is done in OKLCH (shortest-arc hue) before the cosine
 * fit so the midpoint colour matches a perceptually-uniform interpolation
 * — no muddy grey-brown mid for cross-hue pairs.
 */
declare const accentPair: (hexA: string, hexB: string) => Palette;
/**
 * Fit a cosine palette to an arbitrary chain of N anchor colors.
 *
 * Pipeline:
 *   hex anchors  →  OKLCH (perceptually uniform polar form)
 *                →  dense interpolation along shortest-arc hue path
 *                →  sRGB samples
 *                →  least-squares cosine fit (per channel)
 *
 * Interpolating in OKLCH instead of sRGB means red→pink stays bright
 * pink the whole way instead of dipping into muddy mid-grey. The
 * cosine fit then captures that perceptually-uniform sweep as best a
 * single sinusoid can.
 */
declare function accentChain(hexes: string[]): Palette;
declare const PALETTES: {
    prism: Palette;
    berry: Palette;
    lagoon: Palette;
    citrus: Palette;
    azure: Palette;
    ember: Palette;
};
type PaletteName = keyof typeof PALETTES;
declare function resolvePalette(p: PaletteName | Palette | undefined): Palette;
/**
 * Pick a random palette from the accent set with OKLCH-aware rhythm.
 *
 * Stop-count distribution:
 *   30% 2-color · 40% 3-color · 20% 4-color · 10% 5-color
 *
 * Each successive anchor is chosen by walking the hue ring with a
 * perceptual hue-distance window:
 *   70% analogous — 25-65° gap per step (smooth scale)
 *   30% contrast  — 70-150° gap per step (punchy)
 *
 * Brown is excluded entirely — the warm latte neutral fights with the
 * vibrant tone of the rest of the set, so neither presets nor shuffle
 * surface it.
 */
declare function shuffleAccentPalette(): Palette;

type Direction = 'ltr' | 'rtl' | 'ttb' | 'btt';
type ShaderController = {
    canvas: HTMLCanvasElement;
    setProgress: (p: number) => void;
    setAlpha: (a: number) => void;
    setPalette: (p: Palette) => void;
    setBandTight: (b: number) => void;
    setDirection: (d: Direction) => void;
    setWaveAmount: (v: number) => void;
    setRippleAmount: (v: number) => void;
    setWaveSpeed: (v: number) => void;
    setBrightness: (v: number) => void;
    setSwellAmount: (v: number) => void;
    getProgress: () => number;
    getAlpha: () => number;
    destroy: () => void;
};
declare function createShader(opts?: {
    canvas?: HTMLCanvasElement;
    palette?: Palette;
    bandTight?: number;
    direction?: Direction;
    waveAmount?: number;
    rippleAmount?: number;
    waveSpeed?: number;
    brightness?: number;
    /** 0..1, iridescent depth/swell on top of the flat band. Default 0.55;
     *  set to 0 to recover the pre-depth flat-stripe look. */
    swellAmount?: number;
}): ShaderController | null;

type MeshIdeaFlags = {
    asymmetricSwell: number;
    secondaryCrest: number;
    refraction: number;
    chromaticDispersion: number;
    noiseEdge: number;
    cameraSweep: number;
    bloom: number;
    sparkles: number;
    curlWake: number;
};
type MeshShaderController = ShaderController & {
    /** Set a single idea flag (0 = off, 1 = on). */
    setIdea: (key: keyof MeshIdeaFlags, value: number) => void;
    /** Bulk-set all idea flags. */
    setIdeas: (flags: MeshIdeaFlags) => void;
    /** Live-tune the per-vertex elevation peak. */
    setElevation: (v: number) => void;
    /** Install a CanvasImageSource (typically a <canvas layoutsubtree>
     *  rasterising live DOM via drawElementImage) as the texture the
     *  band samples from. Pass null to clear. */
    setTextureSource: (src: TexImageSource | null) => void;
    /** Toggle texture mode (1 = sample the texture as the band's base
     *  colour, 0 = use the palette colour like the vanilla mesh sweep). */
    setUseTexture: (on: number) => void;
    /** Strength of the N-normal-driven UV offset when sampling the
     *  texture. 0 = no refraction, page warps purely from the mesh's
     *  z-displacement / perspective. 0.04 ≈ a subtle glass lens. */
    setRefractStrength: (v: number) => void;
};
declare function createMeshShader(opts?: {
    canvas?: HTMLCanvasElement;
    palette?: Palette;
    bandTight?: number;
    direction?: Direction;
    waveAmount?: number;
    rippleAmount?: number;
    waveSpeed?: number;
    brightness?: number;
    swellAmount?: number;
    /** Peak z displacement of the crest, in plane units. Default 0.18. */
    elevation?: number;
    /** Mesh subdivision. Higher = smoother normals, more vertex work.
     *  Default 96 × 56. */
    cols?: number;
    rows?: number;
    /** Initial values for the nine experimental idea flags. Each is 0..1;
     *  default all-zero (base mesh look). */
    ideas?: Partial<MeshIdeaFlags>;
}): MeshShaderController | null;

type NamedropController = ShaderController & {
    setTextureSource: (src: TexImageSource | null) => void;
    setUseTexture: (on: number) => void;
    /** Install a "before" snapshot for the wipe effect. When set, the
     *  FS samples this texture on the side of the bulge that hasn't
     *  been passed yet (ahead of the sweep), and the live `uTex` on
     *  the side that has been passed. The boundary is the bulge's
     *  travel-mode anchor X. Pass null to disable the wipe (FS falls
     *  back to sampling only uTex). */
    setSnapshotSource: (src: TexImageSource | null) => void;
    /** Bulge anchor in UV space (0..1, 0..1). Default (0.5, 0.5).
     *  Ignored when travel mode is on. */
    setAnchor: (u: number, v: number) => void;
    /** Max radial extent of the bulge in aspect-corrected UV. Default 0.55. */
    setBulgeRadius: (r: number) => void;
    /** Peak z displacement at the bulge centre. Default 0.32. */
    setElevation: (z: number) => void;
    /** 0..2, intensity of the iridescent foil shimmer. Default 1. */
    setIridescence: (i: number) => void;
    /** UV refraction strength at the bulge edges. Default 0.04. */
    setRefractStrength: (r: number) => void;
    /** 0 = static anchor (uAnchor), 1 = anchor travels left→right with
     *  progress (anchor.x = mix(-0.2, 1.2, progress), anchor.y = uAnchor.y).
     *  In travel mode the bulge has constant amplitude — entry/exit
     *  fades happen naturally as the anchor moves off the viewport. */
    setTravelMode: (on: number) => void;
};
declare function createNamedropShader(opts?: {
    canvas?: HTMLCanvasElement;
    palette?: Palette;
    direction?: Direction;
    bandTight?: number;
    /** Mesh subdivision. Default 96 × 56. */
    cols?: number;
    rows?: number;
    /** UV anchor of the bulge centre. Default (0.5, 0.5). */
    anchor?: [number, number];
    /** Max radial extent. Default 0.55. */
    bulgeRadius?: number;
    /** Peak z displacement. Default 0.32. */
    elevation?: number;
    /** Iridescent foil intensity. Default 1. */
    iridescence?: number;
    /** UV refraction strength at bulge rim. Default 0.04. */
    refractStrength?: number;
    /** 0 = static anchor, 1 = traveling left→right. Default 0. */
    travelMode?: number;
}): NamedropController | null;

/**
 * CSS-style `cubic-bezier(x1, y1, x2, y2)` easing. Returns an Easing that
 * accepts progress 0..1 and returns the eased value. Allows y < 0 and
 * y > 1, so curves can dip below zero or overshoot past one.
 */
declare function cubicBezier(x1: number, y1: number, x2: number, y2: number): Easing;
declare const EASINGS: {
    linear: (p: number) => number;
    easeOutQuart: (p: number) => number;
    easeOutCubic: (p: number) => number;
    easeInCubic: (p: number) => number;
    easeInOutCubic: (p: number) => number;
    easeOutExpo: (p: number) => number;
    easeInOutQuint: (p: number) => number;
    snap: Easing;
    ease: Easing;
    back: Easing;
};
type EasingName = keyof typeof EASINGS;
declare const resolveEasing: (e: EasingName | Easing | undefined) => Easing;

type Easing = (p: number) => number;
type SweepOptions = {
    /** ms for the band to traverse. Default 1100. */
    sweepMs?: number;
    /** ms for the post-traversal fade-out. Default 700. */
    outroMs?: number;
    /** 0..1, when in the sweep to fire `onMidpoint` (i.e. swap pages). Default 0.56. */
    midpoint?: number;
    palette?: PaletteName | Palette;
    bandTight?: number;
    direction?: Direction;
    easing?: EasingName | Easing;
    /** Caps the band's peak alpha. 0..1.5, default 1. Useful for dimming. */
    peakAlpha?: number;
    /** 0..2, opt-in edge displacement. 0 = straight default, 1 = organic, 2 = strong. */
    waveAmount?: number;
    /** 0..2, vertical ripple texture intensity. 0 = smooth, 1 = default. */
    rippleAmount?: number;
    /** 0..3, multiplies all time-based shader motion. 1 = default. */
    waveSpeed?: number;
    /** 0..1.5, multiplies the band's RGB. Lower it on dark backgrounds so the
     *  iridescent colours don't read as harsh whites. 1 = default. */
    brightness?: number;
    /** 0..1, depth/iridescent swell on top of the flat band. 0 = legacy flat
     *  stripe, 1 = full crest highlight + Fresnel rim. Default left to the
     *  shader controller (0.55). */
    swellAmount?: number;
    /** Called once the band has reached `midpoint`. Use this to navigate / swap content. */
    onMidpoint?: () => void | Promise<void>;
    /** Called when the full animation (incl. outro) finishes. */
    onComplete?: () => void;
};
type SweepHandle = {
    /** Resolves when the band reaches the configured midpoint. */
    midpoint: Promise<void>;
    /** Resolves when the outro fade finishes. */
    done: Promise<void>;
    /**
     * Cancel mid-flight. Stops the animation loop but leaves the shader's
     * current alpha/progress untouched so a following sweep can continue
     * from where this one was.
     */
    cancel: () => void;
};
/**
 * Plays one full sweep on a given shader controller.
 *
 * Continues from the controller's current progress/alpha — so when called
 * while a previous sweep is still in flight (after that one has been
 * `cancel`led), the band keeps moving forward instead of snapping back
 * to the start. The midpoint callback then fires as soon as the (in-progress)
 * band crosses the configured midpoint — which for an interrupted sweep is
 * typically immediate, so the page swap feels snappy.
 */
declare function playSweep(ctrl: ShaderController, opts?: SweepOptions): SweepHandle;

export { ACCENTS, ACCENT_ORDER, type AccentName, type Direction, EASINGS, type Easing, type EasingName, type MeshShaderController, type NamedropController, type Oklch, PALETTES, type Palette, type PaletteName, type ShaderController, type SweepHandle, type SweepOptions, type Vec3, accentChain, accentPair, createMeshShader, createNamedropShader, createShader, cubicBezier, hexToRgb, oklchToRgb, playSweep, resolveEasing, resolvePalette, rgbToOklch, shuffleAccentPalette };
