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
    // A11Y-01/A11Y-04: fails the Storybook gate on any real axe-core
    // violation, including `color-contrast` (T48 fixes the last gaps that
    // rule found — see theme.css/BottomNav.tsx — so it's enforced here
    // rather than staying disabled as it was during T47's audit).
    a11y: {
      test: 'error',
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
