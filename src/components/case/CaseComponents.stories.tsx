import type { Meta, StoryObj } from '@storybook/react'
import {
  Hero,
  Section,
  Lead,
  Plate,
  Placeholder,
  Moves,
  Move,
  Decide,
  PullQuote,
  Metrics,
  Stat,
} from './CaseComponents'

/* Case-study vocabulary (§7 anatomy). These are the static, presentational
   pieces — interactive islands (MoatDiagram, FrequencyBars) live elsewhere.
   Sample content is on-brand but generic. */

const meta = {
  title: 'Case Study/Components',
  parameters: { layout: 'fullscreen' },
  decorators: [
    (Story) => (
      <div style={{ maxWidth: 780, margin: '0 auto', padding: '10px 30px' }}>
        <Story />
      </div>
    ),
  ],
} satisfies Meta

export default meta
type Story = StoryObj

export const HeroStory: Story = {
  name: 'Hero',
  render: () => (
    <Hero
      eyebrow="Fintech · 2024–2025"
      title="Meridian Ledger"
      thesis={
        <>
          A savings product that turns a spreadsheet into a{' '}
          <b style={{ color: 'var(--accent-expressive-text)', background: 'var(--accent-expressive-mark)' }}>ritual</b>.
        </>
      }
      meta={[
        ['Role', 'Principal Product Designer'],
        ['Partners', 'Eng, Data, Compliance'],
        ['Timeline', '9 months'],
        ['Shipped', 'iOS · Android · Web'],
      ]}
    />
  ),
}

export const SectionStory: Story = {
  name: 'Section',
  render: () => (
    <Section no="01" label="The gap" title="People saved, but never felt it.">
      <p>
        The data said balances were growing. The interviews said something else: no one could
        point to the moment their money became a plan. The number moved; the meaning didn&apos;t.
      </p>
      <p>
        We stopped optimizing the dashboard and started designing the beat — the small, repeatable
        act that makes progress legible.
      </p>
    </Section>
  ),
}

export const LeadStory: Story = {
  name: 'Lead',
  render: () => (
    <Lead>
      <p>
        The strongest version of this product wasn&apos;t a better chart. It was a smaller promise,
        kept more often — a system you could feel working.
      </p>
    </Lead>
  ),
}

export const PlateStory: Story = {
  name: 'Plate (with Placeholder)',
  render: () => (
    <Plate cap="Plate 03 · Onboarding flow" fig="FIG. 3" caption="The three-tap setup, end to end.">
      <Placeholder>
        Screen recording
        <br />
        720 × 1560
      </Placeholder>
    </Plate>
  ),
}

export const PlaceholderStory: Story = {
  name: 'Placeholder',
  render: () => (
    <Plate cap="Plate 01 · Asset" fig="FIG. 1">
      <Placeholder>Duotone photo — swappable</Placeholder>
    </Plate>
  ),
}

export const MovesStory: Story = {
  name: 'Moves / Move',
  render: () => (
    <Moves>
      <Move n="1" title="Name the streak">
        <p>Progress needs a noun. We gave the habit a name and put it where the eye lands first.</p>
      </Move>
      <Move n="2" title="Shrink the ask">
        <p>One decision per session. Everything else defers to a smarter default.</p>
      </Move>
      <Move n="3" title="Close the loop">
        <p>Every deposit earns an immediate, tactile acknowledgment — the system answers back.</p>
      </Move>
    </Moves>
  ),
}

export const DecideStory: Story = {
  name: 'Decide',
  render: () => (
    <Decide
      cap="The call — what we traded"
      questions={[
        { n: '01', q: 'Automate deposits, or keep the user in the loop?', tag: 'Agency' },
        { n: '02', q: 'One goal at a time, or a portfolio view?', tag: 'Focus' },
        { n: '03', q: 'Celebrate every deposit, or only milestones?', tag: 'Signal' },
      ]}
    />
  ),
}

export const PullQuoteStory: Story = {
  name: 'PullQuote',
  render: () => (
    <PullQuote cite="VP Product, partner team">
      It&apos;s the first flow our users describe back to us in their own words.
    </PullQuote>
  ),
}

export const MetricsStory: Story = {
  name: 'Metrics / Stat',
  render: () => (
    <Metrics>
      <Stat big="+41%" label="Weekly active savers, first quarter post-launch" />
      <Stat big="3 taps" label="Median time to first deposit" secondary />
    </Metrics>
  ),
}

/* The whole vocabulary composed, to read the vertical rhythm across a theme. */
export const FullAnatomy: Story = {
  name: 'Full anatomy',
  render: () => (
    <>
      <Hero
        eyebrow="Fintech · 2024–2025"
        title="Meridian Ledger"
        thesis={
          <>
            A savings product that turns a spreadsheet into a{' '}
            <b style={{ color: 'var(--accent-expressive-text)', background: 'var(--accent-expressive-mark)' }}>ritual</b>.
          </>
        }
        meta={[
          ['Role', 'Principal Product Designer'],
          ['Partners', 'Eng, Data, Compliance'],
          ['Timeline', '9 months'],
          ['Shipped', 'iOS · Android · Web'],
        ]}
      />
      <Section no="01" label="The gap" title="People saved, but never felt it.">
        <Lead>
          <p>The number moved; the meaning didn&apos;t. So we designed the beat, not the chart.</p>
        </Lead>
        <p>
          We stopped optimizing the dashboard and started designing the smallest repeatable act
          that makes progress legible.
        </p>
      </Section>
      <Section no="02" label="The system" title="Three moves.">
        <Moves>
          <Move n="1" title="Name the streak">
            <p>Progress needs a noun.</p>
          </Move>
          <Move n="2" title="Shrink the ask">
            <p>One decision per session.</p>
          </Move>
          <Move n="3" title="Close the loop">
            <p>The system answers back.</p>
          </Move>
        </Moves>
      </Section>
      <Section no="03" label="What it did" title="Outcome.">
        <Metrics>
          <Stat big="+41%" label="Weekly active savers" />
          <Stat big="3 taps" label="Median time to first deposit" secondary />
        </Metrics>
        <PullQuote cite="VP Product, partner team">
          It&apos;s the first flow our users describe back to us in their own words.
        </PullQuote>
      </Section>
    </>
  ),
}
