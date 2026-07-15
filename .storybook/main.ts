import type { StorybookConfig } from '@storybook/nextjs'

/* LUNDE OS design-system catalog.
   Framework: @storybook/nextjs (Webpack5) — reliable next/font + CSS-Modules +
   tsconfig-path support on Next 15. Intended deploy target: Chromatic (visual
   regression across the four themes) — wired by Jake later. */

const config: StorybookConfig = {
  stories: ['../src/**/*.mdx', '../src/**/*.stories.@(ts|tsx|mdx)'],
  addons: ['@storybook/addon-essentials', '@storybook/addon-a11y'],
  framework: {
    name: '@storybook/nextjs',
    options: {},
  },
  staticDirs: ['../public'],
  webpackFinal: async (config) => {
    // Next 15.4+ ships plugin instances built against its own bundled webpack
    // (next/dist/compiled/webpack); @storybook/nextjs 8.6 mixes them with the
    // real webpack compiler, which crashes DefinePlugin.getCompilationHooks
    // ("compilation argument must be an instance of Compilation"). Drop the
    // duplicate DefinePlugin(s) so only the first (Storybook's) survives.
    const plugins = config.plugins ?? []
    let seenDefine = false
    config.plugins = plugins.filter((p) => {
      if (p && p.constructor && p.constructor.name === 'DefinePlugin') {
        if (seenDefine) return false
        seenDefine = true
      }
      return true
    })
    return config
  },
}

export default config
