# ntsc-rs presets

ntsc-rs settings JSON, `"version": 1`, every key explicit. Unknown keys
(comments included) make the parser reject the file, so notes live here.

Tune on <https://web.ntsc.rs> → export → paste over the file. Rebake the
films with `npm run ntsc:bake` after touching `film.json`.

- `film.json` — the case-study cover films (`scripts/ntsc-bake.mjs`).
  Composite NTSC + a VHS **SP** dub, seed 1992: soft chroma, light snow,
  a head-switching tear at the foot, gentle edge wave. Calmer than the
  ntsc-rs defaults because the product on screen has to stay legible.
- `booth.json` — PhotoBooth's live VHS chip. Rougher — a camcorder tape
  played back on a tired deck: LP speed, more tracking noise, more snow.
- `crt.json` — PhotoBooth's CRT chip: composite NTSC off the air, no
  tape (VHS, head switching and tracking off). PhotoBooth lays its
  scanline + vignette pass over the top — the phosphor is still JS.
