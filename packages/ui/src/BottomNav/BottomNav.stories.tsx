import type { Meta, StoryObj } from '@storybook/nextjs-vite'
import { BottomNav } from './BottomNav'

const meta: Meta<typeof BottomNav> = {
  title: 'Design System/BottomNav',
  component: BottomNav,
  parameters: { layout: 'fullscreen' },
  tags: ['autodocs'],
  argTypes: {
    activeZone: {
      control: 'select',
      options: ['dashboard', 'transactions'],
    },
  },
}

export default meta
type Story = StoryObj<typeof BottomNav>

export const DashboardActive: Story = { args: { activeZone: 'dashboard' } }
export const TransactionsActive: Story = { args: { activeZone: 'transactions' } }
