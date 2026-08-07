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

   THE GATE: the iframe mounts at opacity 0 with the printed cover showing
   through it, and it is faded in only when the player reports that it is
   actually PLAYING. Every failure resolves to the same state — the printed
   cover, which is a composed front designed to be looked at rather than a
   poster frame waiting to be replaced:

     · the API script is blocked or fails       → promise rejects, no fade
     · the API loads but never calls back       → promise never settles
     · autoplay is refused                      → PLAYING never fires
     · reduced motion                           → this component never mounts
                                                  (ShelfBox drops `film`)

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

export function CoverFilm({ id, title }: { id: string; title: string }) {
  const frame = useRef<HTMLIFrameElement>(null)
  const [rolling, setRolling] = useState(false)

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
            onStateChange: (e) => {
              if (e.data !== YT.PlayerState.PLAYING) return
              // again on the transition: the caption module loads WITH the
              // video, so an unload issued before it started has nothing to
              // unload and the track arrives anyway
              if (player) mute(player)
              setRolling(true)
            },
          },
        })
      })
      // every failure lands on the printed cover, which is the design
      .catch(() => {})

    return () => {
      dropped = true
      try {
        player?.destroy?.()
      } catch {}
    }
  }, [])

  return (
    <span className={styles.filmWrap} aria-hidden="true">
      <iframe
        ref={frame}
        className={styles.coverFrame}
        // the gate, read by CSS. Present → opacity 1. Set once and never
        // unset: see the note on `.coverFrame[data-playing]`.
        data-playing={rolling ? '' : undefined}
        src={src}
        title={title}
        aria-hidden="true"
        tabIndex={-1}
        allow="autoplay; encrypted-media"
      />
    </span>
  )
}
