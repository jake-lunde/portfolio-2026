/* THE NTSC SIGNAL PATH — ntsc-rs, compiled to wasm (s75).

   ntsc-rs (https://ntsc.rs, MIT/ISC/Apache-2.0) models how an NTSC
   composite signal and a VHS deck actually degrade a picture: luma/chroma
   bandwidth, chroma subcarrier phase, head switching, tracking, snow —
   not a scanline overlay. `native/ntsc` wraps its core crate in a tiny
   C-ABI wasm module (`public/ntsc/lunde_ntsc.wasm`, ~190 KB, built by
   `npm run ntsc:build`); this file is the whole JS side of it.

   Two consumers, one code path:
   - PhotoBooth's VHS chip runs it live on the webcam canvas (browser,
     `loadNtsc(fetch(...))`).
   - `scripts/ntsc-bake.mjs` pipes the case-study films through it once,
     offline (Node, `loadNtsc(readFile(...))`) — the shipped .mp4s already
     carry the signal, so the site pays nothing at runtime.

   Settings are ntsc-rs's own JSON (what web.ntsc.rs exports), so a preset
   tuned in their UI drops in unchanged: `src/lib/ntsc/presets/`.

   Memory law: the frame lives in wasm memory. `frame()` returns a fresh
   view every call because wasm memory can grow and move on resize or
   settings change — never cache the view across calls. */

export type NtscSettings = string | object | null | undefined

type Exports = {
  memory: WebAssembly.Memory
  ntsc_alloc(len: number): number
  ntsc_free(ptr: number, len: number): void
  ntsc_new(json: number, len: number): number
  ntsc_set_settings(h: number, json: number, len: number): number
  ntsc_resize(h: number, w: number, h2: number): void
  ntsc_frame_ptr(h: number): number
  ntsc_apply(h: number, frame: number): void
  ntsc_drop(h: number): void
}

export class NtscModule {
  private readonly ex: Exports
  private constructor(ex: Exports) {
    this.ex = ex
  }

  static async instantiate(source: BufferSource | Response | Promise<Response>): Promise<NtscModule> {
    const isBuf = (s: unknown): s is BufferSource =>
      s instanceof ArrayBuffer || ArrayBuffer.isView(s as ArrayBufferView)
    let instance: WebAssembly.Instance
    if (isBuf(source)) {
      ;({ instance } = await WebAssembly.instantiate(source, {}))
    } else {
      const res = await source
      const streaming = typeof WebAssembly.instantiateStreaming === 'function'
      const result = streaming
        ? await WebAssembly.instantiateStreaming(res, {})
        : await WebAssembly.instantiate(await res.arrayBuffer(), {})
      instance = result.instance
    }
    return new NtscModule(instance.exports as unknown as Exports)
  }

  /** Create a filter. Empty settings → ntsc-rs defaults. Throws on bad JSON. */
  create(settings?: NtscSettings): NtscFilter {
    return new NtscFilter(this.ex, settings)
  }
}

export class NtscFilter {
  private readonly ex: Exports
  private h: number
  private w = 0
  private ht = 0
  private frameNum = 0

  constructor(ex: Exports, settings?: NtscSettings) {
    this.ex = ex
    this.h = withJson(ex, settings, (p, n) => ex.ntsc_new(p, n))
    if (!this.h) throw new Error('ntsc: settings JSON did not parse')
  }

  get width() {
    return this.w
  }
  get height() {
    return this.ht
  }

  /** Replace settings on the live filter (PhotoBooth chip swap). */
  setSettings(settings?: NtscSettings) {
    const ok = withJson(this.ex, settings, (p, n) => this.ex.ntsc_set_settings(this.h, p, n))
    if (!ok) throw new Error('ntsc: settings JSON did not parse')
  }

  resize(width: number, height: number) {
    if (width === this.w && height === this.ht) return
    this.w = width
    this.ht = height
    this.ex.ntsc_resize(this.h, width, height)
  }

  /** The RGBA8 frame in wasm memory — write pixels in, apply, read them out.
      A NEW view every call (see the memory law above). */
  frame(): Uint8ClampedArray<ArrayBuffer> {
    const ptr = this.ex.ntsc_frame_ptr(this.h)
    // non-shared memory by construction (no threads in this build), so the
    // view is ImageData-compatible
    return new Uint8ClampedArray(this.ex.memory.buffer as ArrayBuffer, ptr, this.w * this.ht * 4)
  }

  /** Run the signal path over the current frame, in place. `frameNum`
      drives the temporal noise/field alternation — pass your own or let
      the filter count. */
  apply(frameNum?: number) {
    const n = frameNum ?? this.frameNum++
    this.ex.ntsc_apply(this.h, n)
  }

  /** Convenience: filter an ImageData-shaped RGBA buffer, returning a copy. */
  process(rgba: Uint8ClampedArray | Uint8Array, width: number, height: number, frameNum?: number): Uint8ClampedArray {
    this.resize(width, height)
    this.frame().set(rgba)
    this.apply(frameNum)
    return this.frame().slice()
  }

  dispose() {
    if (this.h) this.ex.ntsc_drop(this.h)
    this.h = 0
  }
}

function withJson<T>(ex: Exports, settings: NtscSettings, f: (ptr: number, len: number) => T): T {
  const json = settings == null ? '' : typeof settings === 'string' ? settings : JSON.stringify(settings)
  if (!json) return f(0, 0)
  const bytes = new TextEncoder().encode(json)
  const ptr = ex.ntsc_alloc(bytes.length)
  new Uint8Array(ex.memory.buffer, ptr, bytes.length).set(bytes)
  try {
    return f(ptr, bytes.length)
  } finally {
    ex.ntsc_free(ptr, bytes.length)
  }
}
