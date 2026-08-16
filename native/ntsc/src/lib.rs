//! LUNDE OS ↔ ntsc-rs bridge.
//!
//! A deliberately tiny C-ABI surface (no wasm-bindgen glue): the JS side owns
//! a handle, asks for the RGBA frame buffer's address, writes pixels into
//! wasm memory, calls `apply`, reads them back. Zero copies beyond the two
//! the caller already does with a canvas. Settings arrive as ntsc-rs's own
//! JSON (the format web.ntsc.rs / the desktop app export), so a preset tuned
//! in their UI drops straight in.
//!
//! One module, two consumers: PhotoBooth's live VHS filter in the browser and
//! `scripts/ntsc-bake.mjs`, which pipes the case-study films through it in Node.

use ntsc_rs::settings::SettingsList;
use ntsc_rs::yiq_fielding::{BlitInfo, DeinterlaceMode, Rgbx, YiqField, YiqView};
use ntsc_rs::{Context, NtscEffect};
use std::alloc::{alloc, dealloc, Layout};

pub struct Ntsc {
    ctx: Context,
    effect: NtscEffect,
    width: usize,
    height: usize,
    /// RGBA8, width*height*4 — the caller's window into wasm memory
    frame: Vec<u8>,
    /// planar YIQ scratch, sized for the largest field layout, reused per frame
    yiq: Vec<f32>,
}

impl Ntsc {
    fn set_size(&mut self, width: usize, height: usize) {
        self.width = width;
        self.height = height;
        self.frame.clear();
        self.frame.resize(width * height * 4, 0);
        let len = YiqView::max_buf_length_for((width, height), self.effect.use_field);
        self.yiq.clear();
        self.yiq.resize(len, 0.0);
    }

    fn apply(&mut self, frame_num: usize) {
        if self.width == 0 || self.height == 0 {
            return;
        }
        let field: YiqField = self.effect.use_field.to_yiq_field(frame_num);
        let dims = (self.width, self.height);
        let row_bytes = self.width * 4;
        let mut view = YiqView::from_parts(&mut self.yiq, dims, field);
        let blit = BlitInfo::from_full_frame(self.width, self.height, row_bytes);
        view.set_from_strided_buffer::<Rgbx, u8, _>(&self.ctx, &self.frame, blit, ());
        self.effect
            .apply_effect_to_yiq(&self.ctx, &mut view, frame_num, [1.0, 1.0]);
        view.write_to_strided_buffer::<Rgbx, u8, _>(
            &self.ctx,
            &mut self.frame,
            blit,
            DeinterlaceMode::Bob,
            (),
        );
    }
}

/// Scratch allocation for passing strings in (the JSON settings). Caller frees
/// with `ntsc_free`.
#[no_mangle]
pub extern "C" fn ntsc_alloc(len: usize) -> *mut u8 {
    if len == 0 {
        return core::ptr::null_mut();
    }
    unsafe { alloc(Layout::from_size_align_unchecked(len, 1)) }
}

#[no_mangle]
pub extern "C" fn ntsc_free(ptr: *mut u8, len: usize) {
    if ptr.is_null() || len == 0 {
        return;
    }
    unsafe { dealloc(ptr, Layout::from_size_align_unchecked(len, 1)) }
}

/// Create an effect from ntsc-rs settings JSON (empty → their defaults).
/// Returns null if the JSON doesn't parse.
#[no_mangle]
pub extern "C" fn ntsc_new(json_ptr: *const u8, json_len: usize) -> *mut Ntsc {
    let effect = match parse(json_ptr, json_len) {
        Some(e) => e,
        None => return core::ptr::null_mut(),
    };
    Box::into_raw(Box::new(Ntsc {
        ctx: Context::new(),
        effect,
        width: 0,
        height: 0,
        frame: Vec::new(),
        yiq: Vec::new(),
    }))
}

/// Swap settings on a live handle (PhotoBooth's chips). Returns 0 on parse
/// failure and leaves the old effect in place.
#[no_mangle]
pub extern "C" fn ntsc_set_settings(h: *mut Ntsc, json_ptr: *const u8, json_len: usize) -> u32 {
    let Some(effect) = parse(json_ptr, json_len) else { return 0 };
    let n = unsafe { &mut *h };
    n.effect = effect;
    // field mode may change the scratch size
    let (w, hh) = (n.width, n.height);
    n.set_size(w, hh);
    1
}

fn parse(json_ptr: *const u8, json_len: usize) -> Option<NtscEffect> {
    if json_len == 0 {
        return Some(NtscEffect::default());
    }
    let bytes = unsafe { core::slice::from_raw_parts(json_ptr, json_len) };
    let json = core::str::from_utf8(bytes).ok()?;
    SettingsList::<NtscEffect>::new().from_json(json).ok()
}

#[no_mangle]
pub extern "C" fn ntsc_resize(h: *mut Ntsc, width: usize, height: usize) {
    unsafe { &mut *h }.set_size(width, height);
}

/// Address of the RGBA8 frame (width*height*4 bytes). Re-read after every
/// resize/set_settings/apply — wasm memory may have grown and moved.
#[no_mangle]
pub extern "C" fn ntsc_frame_ptr(h: *mut Ntsc) -> *mut u8 {
    unsafe { &mut *h }.frame.as_mut_ptr()
}

#[no_mangle]
pub extern "C" fn ntsc_apply(h: *mut Ntsc, frame_num: usize) {
    unsafe { &mut *h }.apply(frame_num);
}

#[no_mangle]
pub extern "C" fn ntsc_drop(h: *mut Ntsc) {
    if !h.is_null() {
        drop(unsafe { Box::from_raw(h) });
    }
}
