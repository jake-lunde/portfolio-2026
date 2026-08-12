import type { Meta, StoryObj } from '@storybook/react'
import { Bubble, Feed, IdentityHeader } from './Chat'
import { avatarFor } from '@/components/shell/crew'

/* The chat anatomy (see Chat.tsx's own header comment): a centred
   identity, a feed that scrolls and follows itself down, and bubbles
   that arrive on the window spring. ASK MY AI and the SUGGESTION BOX
   are both this shape wearing different copy — these stories are the
   proof, so `component` is left off the meta (as in
   CaseComponents.stories.tsx) and every story renders explicitly rather
   than driving one primitive through the controls panel. */

const meta = {
  title: 'Chat/Components',
  parameters: { layout: 'padded' },
} satisfies Meta

export default meta
type Story = StoryObj

/* classic-skin avatars — the same call every program makes
   (avatarFor(agent, skin)); Storybook's theme toolbar doesn't feed the
   app's own skin state, so these are fixed to classic on purpose. */
const fableAvatar = avatarFor('fable', 'classic')
const dopplerAvatar = avatarFor('doppler', 'classic')

const windowStyle: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  maxWidth: 420,
  border: 'var(--border-width-default) solid var(--border)',
  borderRadius: 'var(--radius-control)',
  padding: '16px 18px',
  background: 'var(--surface)',
}

export const Tones: Story = {
  name: 'Bubble tones',
  render: () => (
    <div style={{ display: 'flex', flexDirection: 'column', maxWidth: 420 }}>
      <Bubble tone="user">What does the SUGGESTION BOX actually score?</Bubble>
      <Bubble tone="assistant">
        Feasibility, fit, and whether it&apos;s already on the roadmap — DOPPLER reads all three
        before the number lands.
      </Bubble>
      <Bubble tone="system" machine>
        FILED — DOPPLER WILL JUDGE THIS ON THE NEXT PASS
      </Bubble>
    </div>
  ),
}

export const Thinking: Story = {
  name: 'Bubble — thinking state',
  /* Both registers of the wait: plain (ASK MY AI pending) and machine
     (the SUGGESTION BOX's DOPPLER line). The capsule must win over the
     machine's square — cascade order, so it gets a snapshot. */
  render: () => (
    <div style={{ display: 'flex', flexDirection: 'column', maxWidth: 420 }}>
      <Bubble thinking={{ mark: fableAvatar, label: 'THINKING' }} />
      <Bubble machine thinking={{ mark: fableAvatar, label: 'JUDGING' }} />
    </div>
  ),
}

export const MachineVsHuman: Story = {
  name: 'Machine vs human voice',
  render: () => (
    <div style={{ display: 'flex', gap: 32, flexWrap: 'wrap' }}>
      <div style={{ maxWidth: 260 }}>
        <p
          style={{
            font: 'var(--type-caption-size) var(--mono)',
            letterSpacing: '0.08em',
            textTransform: 'uppercase',
            color: 'var(--content-muted)',
            marginBottom: 8,
          }}
        >
          Machine — the CRT register
        </p>
        <Bubble machine as="div">
          RESUME.EXE COMPILED CLEAN — 1 WARNING, 0 ERRORS
        </Bubble>
      </div>
      <div style={{ maxWidth: 260 }}>
        <p
          style={{
            font: 'var(--type-caption-size) var(--mono)',
            letterSpacing: '0.08em',
            textTransform: 'uppercase',
            color: 'var(--content-muted)',
            marginBottom: 8,
          }}
        >
          Quoting / explaining — body prose
        </p>
        <Bubble>
          The warning is a missing alt tag on the hero plate — cosmetic, not a blocker.
        </Bubble>
      </div>
    </div>
  ),
}

/* `reduced` is a prop, not a media query — storied explicitly so the
   catalog shows the no-motion state under any `prefers-reduced-motion`
   setting the machine reading it happens to have. */
export const ReducedMotion: Story = {
  name: 'Bubble — reduced motion',
  render: () => (
    <div style={{ maxWidth: 420 }}>
      <Bubble tone="user" reduced>
        Same message, motion off
      </Bubble>
      <Bubble reduced>
        `reduced` renders landed with no rise — no delay, no spring, `initial: false`.
      </Bubble>
    </div>
  ),
}

export const IdentityHeaderStory: Story = {
  name: 'IdentityHeader',
  render: () => (
    <div style={windowStyle}>
      <IdentityHeader name="DOPPLER" avatar={dopplerAvatar} role="REVIEW UNIT · ON LOAN" />
    </div>
  ),
}

export const FeedBusy: Story = {
  name: 'Feed (busy)',
  render: () => (
    <div style={{ ...windowStyle, height: 220 }}>
      <Feed busy>
        <Bubble tone="user">Is the token pipeline hooked up yet?</Bubble>
        <Bubble thinking={{ mark: fableAvatar, label: 'THINKING' }} />
      </Feed>
    </div>
  ),
}

/* A realistic exchange, header on top, mid-answer (busy) — the shape
   ASK MY AI and the SUGGESTION BOX both are underneath their own copy
   and card rails. */
export const ComposedExchange: Story = {
  name: 'Composed — identity + feed',
  render: () => (
    <div style={{ ...windowStyle, height: 320 }}>
      <IdentityHeader name="CLAUDE" avatar={fableAvatar} />
      <Feed busy>
        <Bubble machine as="div">
          ASK ME ANYTHING ABOUT THE WORK — OR PICK A CARD BELOW
        </Bubble>
        <Bubble tone="user">What was the hardest part of the token migration?</Bubble>
        <Bubble thinking={{ mark: fableAvatar, label: 'THINKING' }} />
      </Feed>
    </div>
  ),
}
