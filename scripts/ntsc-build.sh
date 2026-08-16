#!/bin/sh
# Build native/ntsc (ntsc-rs core → C-ABI wasm) and drop it in public/.
# Needs a Rust toolchain with the wasm32-unknown-unknown target:
#   curl https://sh.rustup.rs -sSf | sh -s -- -y --profile minimal -t wasm32-unknown-unknown
# The built .wasm is committed, so `npm run build` never needs cargo —
# run this only after touching native/ntsc or bumping the ntsc-rs rev.
set -e
export PATH="$HOME/.cargo/bin:$PATH"
cd "$(dirname "$0")/../native/ntsc"
cargo build --release --target wasm32-unknown-unknown
cp target/wasm32-unknown-unknown/release/lunde_ntsc.wasm ../../public/ntsc/lunde_ntsc.wasm
ls -la ../../public/ntsc/lunde_ntsc.wasm
