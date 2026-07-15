import type { Preview } from '@storybook/nextjs-vite'
import './preview.css'

const preview: Preview = {
  parameters: {
    controls: {
      matchers: {
        color: /(background|color)$/i,
        date: /Date$/i,
      },
    },
    // A11Y-01: fails the Storybook gate on any real axe-core violation
    // (keyboard/focus-order/ARIA gaps audited in T47) instead of only
    // logging them. `color-contrast` is disabled here — that rule is
    // audited and enforced separately in T48, so a still-open contrast gap
    // at this point in Execute doesn't block T47's own gate.
    a11y: {
      test: 'error',
      options: {
        rules: {
          'color-contrast': { enabled: false },
        },
      },
    },
    backgrounds: {
      default: 'app',
      values: [
        { name: 'app', value: '#f0f4f8' },
        { name: 'white', value: '#ffffff' },
      ],
    },
  },
}

export default preview
