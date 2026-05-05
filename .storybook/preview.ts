import type { Preview } from '@storybook/nextjs-vite'
import '../src/app/globals.css'

const preview: Preview = {
  parameters: {
    controls: {
      matchers: {
        color: /(background|color)$/i,
        date: /Date$/i,
      },
    },
    a11y: {
      test: 'todo',
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
