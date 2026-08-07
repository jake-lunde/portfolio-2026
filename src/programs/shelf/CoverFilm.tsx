'use client'

import { useEffect, useRef, useState } from 'react'
import styles from './shelf.module.css'

/* THE COVER FILM, AND THE GATE IN FRONT OF IT.

   A box on this shelf can have a moving cover: a silent, chromeless YouTube
   embed sitting in the art plate, which is the one thing a 1992 box could
   never have had. The problem it always carried is what happens when the
   film does NOT roll. Autoplay is refused all the time — data saver, iOS Low
   Power, a browser that has decided this tab is not interesting — and what
   YouTube paints instead is its own title overlay and a centre play button
   that can never be clicked away here, because the embed is pointer-inert by
   design. Pass 4 buried that failure under a 1.4× overscan and Jake struck
   the overscan in pass 5: the crop threw away the picture. Pass 6 has his
   ruling on the failure itself — the player chrome "can't be seen, it's the
   signature cover" — so the embed is gated instead of cropped.

   PASS 7 FOUND THAT GATE OPENING TOO EARLY AND FAR TOO OFTEN. Jake still saw
   YouTube's furniture in a real browser, so pass 7 measured what the player
   actually paints and when (headless chromium 1178, both films, screenshots
   every 0.5s — the numbers are on BURN_OFF_MS below). Two findings, and the
   second is the one that mattered:

     1. PLAYING IS THE MOMENT THE CHROME ARRIVES, NOT THE MOMENT IT LEAVES.
        The title bar, the channel avatar, the top gradient, the centre
        transport glyphs and the "More videos" pill are all up for the first
        ~5 seconds OF PLAYBACK and then fade together. Pass 6 faded the film
        in exactly when they appeared.
     2. EVERY RESTART PAYS IT AGAIN. `loop=1&playlist=` does not seek — it
        takes the player back through UNSTARTED → BUFFERING → PLAYING, and
        the whole five-second display replays. Measured on the invest film
        (47s): a full title bar every single cycle, for a tenth of the time
        the box is on screen. That is what Jake was seeing.

   So the gate is now armed by the TRANSITION, not by the session: the film
   is visible only while the player has been continuously PLAYING for longer
   than the chrome lasts, and ANY state that is not PLAYING shuts it again
   at once. Every failure resolves to the same state — the printed cover,
   which is a composed front designed to be looked at rather than a poster
   frame waiting to be replaced:

     · the API script is blocked or fails       → promise rejects, no fade
     · the API loads but never calls back       → promise never settles
     · autoplay is refused                      → PLAYING never fires
     · the playlist loop comes round            → gate shuts, then re-opens
     · a stall, a pause, a quality switch       → gate shuts, then re-opens
     · reduced motion                           → this component never mounts
                                                  (ShelfBox drops `film`)

   ⚠️ PASS 6'S "NEVER WRITE IT BACK" IS REVERSED, DELIBERATELY. That rule
   read: a film that stalls has already proved it can play, and blinking the
   printed cover back in would be worse than the pause it is covering. It
   was written without the measurement. A stall is a BUFFERING → PLAYING
   transition, and the player paints its title over the artwork on the far
   side of one exactly as it does at a loop. Jake's rule is absolute — no
   YouTube pixel, ever — so the cover comes back. It is the box's own front;
   there is no worse state to fall to.

   ⚠️ AND CROPPING CANNOT DO THIS JOB — DO NOT TRY IT AGAIN. Pass 4 buried
   the chrome under a 1.4× overscan and Jake struck it in pass 5 because the
   crop threw away the picture; pass 7 measured why no smaller crop can
   replace it. The furniture is not confined to bands: the transport glyphs
   sit dead centre on the artwork and the "More videos" pill sits centre
   bottom. Even the part that IS a band cannot be reached cheaply — at the
   246px the plate is actually painted at, YouTube's title bar is ~36px, a
   quarter of a 138px 16:9 picture, so clipping it costs an overscan of 1.52.
   The gate is free and total; a crop is expensive and partial.

   THE DEPENDENCY IS THE SCRIPT, AND IT IS LAZY. `iframe_api` is fetched by
   the first box that has a film, on mount, from this module — never from the
   shell, never on a page without a shelf. One promise is shared by every box
   on the shelf, so four covers cost one script and one namespace; each box
   then owns its own YT.Player over its own iframe.

   ⚠️ WHY THE WRAPPER SPAN EXISTS. `player.destroy()` removes the iframe from
   the DOM, and React did not put it there — if React later tried to remove
   the same node it would throw. So the component's ROOT is a span that React
   owns and the iframe is a child of it: React unmounts the subtree by
   removing the root, never touching the iframe underneath it, and the effect
   cleanup has already destroyed the player by then. Do not hoist the iframe
   to the root of this component. */

type YTPlayerLike = { destroy?: () => void; unloadModule?: (name: string) => void }

type YTNamespace = {
  Player: new (
    el: Element,
    opts: {
      host?: string
      events?: {
        onReady?: (e: { target: YTPlayerLike }) => void
        onStateChange?: (e: { data: number }) => void
      }
    },
  ) => YTPlayerLike
  PlayerState: { PLAYING: number }
}

/* HOW LONG THE PLAYER PAINTS ITS OWN FURNITURE AFTER EVERY →PLAYING.

   Measured pass 7, headless chromium 1178, the invest film in a 640×360
   embed with controls=0, screenshots every 0.5s, chrome detected as the
   luminance step across YouTube's top gradient:

     first play          chrome up through +5.00s, gone by +5.50s
     playlist loop       chrome up through +4.68s, gone by +5.68s
     seekTo(0) mid-roll  chrome up through +4.63s (probe ended there)
     seekTo(20) mid-roll chrome up through +4.43s, gone by +4.93s

   — i.e. YouTube's documented 3s autohide plus its own start sequence,
   restarted by every buffering→playing edge including a plain seek. 6.2s is
   the worst of those plus half a second of margin for a slower machine.

   It is the only number in this file that is a guess about someone else's
   software, so it is deliberately generous: too long costs a few seconds of
   printed cover — which is the artwork, and the resting state — while too
   short costs exactly the thing Jake has now rejected twice. */
const BURN_OFF_MS = 6200

declare global {
  interface Window {
    YT?: YTNamespace
    onYouTubeIframeAPIReady?: () => void
  }
}

const API_SRC = 'https://www.youtube.com/iframe_api'
/* the privacy host. The embed URL already points at it (nothing is written
   until the reader plays), and the option is passed as well so the API talks
   to the same origin it was handed. */
const HOST = 'https://www.youtube-nocookie.com'

/** one script, one namespace, shared by every film on the shelf. Never
    resolves if the API loads and then goes quiet, which is the correct
    behaviour here: the gate simply stays shut. */
let api: Promise<YTNamespace> | null = null

function loadApi(): Promise<YTNamespace> {
  api ??= new Promise<YTNamespace>((resolve, reject) => {
    if (window.YT?.Player) {
      resolve(window.YT)
      return
    }
    // the API's one callback hook is a global. Chain rather than clobber:
    // another loader (or a second mount racing this one) may own it.
    const prev = window.onYouTubeIframeAPIReady
    window.onYouTubeIframeAPIReady = () => {
      prev?.()
      if (window.YT?.Player) resolve(window.YT)
    }
    const s = document.createElement('script')
    s.src = API_SRC
    s.async = true
    s.onerror = () => reject(new Error('iframe_api unavailable'))
    document.head.appendChild(s)
  })
  return api
}

/* THE CAPTION TRACK, which is chrome painted INSIDE the frame where the
   opacity gate cannot help. `cc_load_policy=0` is documented as the way to
   leave captions off and it is not enough — measured on both films, each
   printed a "[Music]" box across its own artwork, because a reader whose
   account has captions on gets them whatever the URL asked for. The API's
   own switch is the only reliable one. Two module names because the current
   player answers to 'captions' and the older one to 'cc', and both calls are
   undocumented enough to deserve a net. */
const mute = (p: YTPlayerLike) => {
  for (const m of ['captions', 'cc']) {
    try {
      p.unloadModule?.(m)
    } catch {}
  }
}

export function CoverFilm({
  id,
  title,
  onClear,
}: {
  id: string
  title: string
  /** THE GATE, REPORTED OUT (pass 9). The film used to be the only thing
      that answered to it, and CSS could read it off the iframe's own
      attribute. It now has a partner underneath — the plate loader, which
      has to fade out as the film fades in and back as it fades out — and no
      CSS combinator reaches BACKWARD from the iframe to a preceding
      sibling. So the state comes up here and ShelfBox hands it down to
      both, which is also the honest shape: the gate is a property of the
      box's cover, not of the embed. One render per gate edge — a loop every
      forty-odd seconds — and nothing per frame. */
  onClear?: (clear: boolean) => void
}) {
  const frame = useRef<HTMLIFrameElement>(null)
  /** the player has been PLAYING for longer than its own chrome lasts */
  const [clear, setClear] = useState(false)
  const burn = useRef<ReturnType<typeof setTimeout> | null>(null)

  /* built once, on the client, because `origin` is a real requirement of the
     API rather than a nicety: the player validates the postMessage channel
     against it. This component only ever mounts after ShelfBox's own client
     gate, so there is no window to be missing. */
  const [src] = useState(
    () =>
      `${HOST}/embed/${id}?` +
      [
        'autoplay=1',
        'mute=1',
        'loop=1',
        `playlist=${id}`,
        'controls=0',
        'playsinline=1',
        'rel=0',
        'modestbranding=1',
        // the last two pieces of chrome the player paints INSIDE the frame,
        // where no gate can help: the caption track it turns on by itself
        // (measured — both films printed a "[Music]" box over the artwork)
        // and the annotation layer
        'cc_load_policy=0',
        'iv_load_policy=3',
        // the gate's whole mechanism: without this the player has no channel
        // to tell us it is rolling, and the cover could never fade in
        'enablejsapi=1',
        `origin=${encodeURIComponent(window.location.origin)}`,
      ].join('&'),
  )

  useEffect(() => {
    let dropped = false
    let player: YTPlayerLike | null = null
    const disarm = () => {
      if (burn.current) clearTimeout(burn.current)
      burn.current = null
    }

    loadApi()
      .then((YT) => {
        if (dropped || !frame.current) return
        player = new YT.Player(frame.current, {
          host: HOST,
          events: {
            /* THE CAPTION TRACK. `cc_load_policy=0` is documented as the way
               to leave captions off and it is NOT enough — measured here,
               both films still printed a "[Music]" box across the artwork,
               because a reader whose account has captions on gets them
               whatever the URL says. The only reliable off switch is the
               API's, and it has to wait for the player to exist. Both module
               names are tried: the current player answers to 'captions', the
               older one to 'cc', and neither call is documented enough to
               trust without a net. */
            onReady: (e) => {
              player = e.target
              mute(e.target)
            },
            /* THE GATE, ARMED BY THE TRANSITION.

               Not playing → shut, now, whatever it was: unstarted (the
               playlist loop), ended, paused, buffering. Each of those is
               followed by a →PLAYING edge, and the player paints its title
               across the artwork on the far side of every one of them.

               Playing → wait out the chrome, then open. The timer is
               re-armed from scratch on each edge, so a stall that flickers
               3→1→3→1 can never leave a half-expired countdown standing. */
            onStateChange: (e) => {
              disarm()
              if (e.data !== YT.PlayerState.PLAYING) {
                setClear(false)
                return
              }
              // again on the transition: the caption module loads WITH the
              // video, so an unload issued before it started has nothing to
              // unload and the track arrives anyway
              if (player) mute(player)
              burn.current = setTimeout(() => {
                if (!dropped) setClear(true)
              }, BURN_OFF_MS)
            },
          },
        })
      })
      // every failure lands on the printed cover, which is the design
      .catch(() => {})

    return () => {
      dropped = true
      disarm()
      try {
        player?.destroy?.()
      } catch {}
    }
  }, [])

  /* the gate, announced. Its own effect rather than a call inside the
     player's callback: `setClear` is fired from a YouTube event, which is
     outside React's tree, and reporting from the render the state actually
     landed in is what keeps the loader's fade and the film's fade on the
     same frame. Unmounting reports the gate SHUT — a box whose film has
     gone away is a box that is tuning again, not one holding a stale
     clearance. */
  useEffect(() => {
    onClear?.(clear)
  }, [clear, onClear])

  /* and it is reported SHUT on the way out, in an effect of its own. Folding
     this into the cleanup above would fire a false on every edge — React
     runs the old cleanup before the new effect — and a gate that blinks shut
     between two open states is a loader that flashes. */
  useEffect(() => () => onClear?.(false), [onClear])

  return (
    <span className={styles.filmWrap} aria-hidden="true">
      <iframe
        ref={frame}
        className={styles.coverFrame}
        // the gate, read by CSS. Present → opacity 1, and it comes and goes
        // with the player's state — see `.coverFrame[data-clear]`.
        data-clear={clear ? '' : undefined}
        src={src}
        title={title}
        aria-hidden="true"
        tabIndex={-1}
        allow="autoplay; encrypted-media"
      />
    </span>
  )
}
