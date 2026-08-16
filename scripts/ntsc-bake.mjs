#!/usr/bin/env node
/* NTSC BAKE — run a film through the ntsc-rs signal path once, offline.

   The case-study cover films ship pre-degraded: the same wasm PhotoBooth
   runs live (`public/ntsc/lunde_ntsc.wasm`, see src/lib/ntsc/ntsc.ts)
   is fed every frame of the source here, and the result is re-encoded.
   The site then plays a plain <video> — no per-viewer CPU, no overlay,
   and the artifacts are in the pixels the way they were on tape.

   Pipeline (ffmpeg on both ends, raw RGBA between):
     source.mp4 ─ffmpeg decode + resample to N scanlines─▶ rgba frames
       ─▶ ntsc-rs (wasm) per frame ─▶ ffmpeg h264 encode ─▶ out.mp4

   Resampling to N scanlines (default 480 — a real NTSC frame) is what
   ntsc-rs's own GUI does before filtering: the model's bandwidths are
   defined against a 480-line picture, so at 1080p the artifacts would be
   subpixel. It also cuts the file to a fraction of the source.

   Usage:
     node --experimental-strip-types scripts/ntsc-bake.mjs \
       --in public/case/family-hub/box-film.src.mp4 \
       --out public/case/family-hub/box-film.mp4 \
       [--preset src/lib/ntsc/presets/film.json] [--lines 480] \
       [--crf 24] [--seek 0] [--dur 0]

   `npm run ntsc:bake -- --in … --out …` wraps the flag. Needs ffmpeg +
   ffprobe on PATH (brew install ffmpeg). Sources live next to the shipped
   film as `*.src.mp4` and are gitignored — the baked film is what ships. */

import { spawn, execFileSync } from 'node:child_process'
import { readFile } from 'node:fs/promises'
import { resolve } from 'node:path'
import { NtscModule } from '../src/lib/ntsc/ntsc.ts'

const args = parseArgs(process.argv.slice(2))
const input = must(args.in, '--in')
const output = must(args.out, '--out')
const presetPath = args.preset ?? 'src/lib/ntsc/presets/film.json'
const lines = Number(args.lines ?? 480)
const crf = Number(args.crf ?? 24)
const seek = Number(args.seek ?? 0)
const dur = Number(args.dur ?? 0)

const probe = execFileSync('ffprobe', [
  '-v', 'error', '-select_streams', 'v:0',
  '-show_entries', 'stream=width,height,r_frame_rate',
  '-of', 'csv=p=0', input,
]).toString().trim().split(',')
const srcW = Number(probe[0])
const srcH = Number(probe[1])
const fps = probe[2]
const H = lines
// even width — h264 yuv420p needs it
const W = Math.round((srcW * H) / srcH / 2) * 2
const frameBytes = W * H * 4

const wasm = await readFile(resolve('public/ntsc/lunde_ntsc.wasm'))
const preset = await readFile(resolve(presetPath), 'utf8')
const mod = await NtscModule.instantiate(wasm)
const filter = mod.create(preset)
filter.resize(W, H)

console.log(`ntsc-bake  ${input} (${srcW}x${srcH} @ ${fps}) → ${output} (${W}x${H}) preset=${presetPath}`)

const decodeArgs = ['-v', 'error', '-hide_banner']
if (seek) decodeArgs.push('-ss', String(seek))
decodeArgs.push('-i', input)
if (dur) decodeArgs.push('-t', String(dur))
decodeArgs.push('-vf', `scale=${W}:${H}:flags=lanczos`, '-f', 'rawvideo', '-pix_fmt', 'rgba', 'pipe:1')
const dec = spawn('ffmpeg', decodeArgs, { stdio: ['ignore', 'pipe', 'inherit'] })

const enc = spawn('ffmpeg', [
  '-v', 'error', '-hide_banner', '-y',
  '-f', 'rawvideo', '-pix_fmt', 'rgba', '-s', `${W}x${H}`, '-r', fps, '-i', 'pipe:0',
  '-an', '-c:v', 'libx264', '-preset', 'slow', '-crf', String(crf),
  '-pix_fmt', 'yuv420p', '-movflags', '+faststart', output,
], { stdio: ['pipe', 'inherit', 'inherit'] })

let pending = Buffer.alloc(0)
let n = 0
const t0 = performance.now()

for await (const chunk of dec.stdout) {
  pending = pending.length ? Buffer.concat([pending, chunk]) : chunk
  while (pending.length >= frameBytes) {
    const rgba = pending.subarray(0, frameBytes)
    pending = pending.subarray(frameBytes)
    filter.frame().set(rgba)
    filter.apply(n)
    const out = Buffer.from(filter.frame()) // copy: wasm memory may move
    if (!enc.stdin.write(out)) await new Promise((r) => enc.stdin.once('drain', r))
    n++
    if (n % 120 === 0) process.stdout.write(`  ${n} frames  ${((performance.now() - t0) / n).toFixed(1)} ms/frame\r`)
  }
}
enc.stdin.end()
await new Promise((res, rej) => enc.on('close', (code) => (code ? rej(new Error(`encode exit ${code}`)) : res())))
filter.dispose()
console.log(`\ndone: ${n} frames in ${((performance.now() - t0) / 1000).toFixed(1)}s`)

function parseArgs(argv) {
  const o = {}
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i]
    if (a.startsWith('--')) o[a.slice(2)] = argv[i + 1]?.startsWith('--') || argv[i + 1] == null ? true : argv[++i]
  }
  return o
}
function must(v, flag) {
  if (!v || v === true) {
    console.error(`missing ${flag}`)
    process.exit(2)
  }
  return v
}
