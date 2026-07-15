import type { Meta, StoryObj } from '@storybook/nextjs-vite'
import { Header } from './Header'

const meta: Meta<typeof Header> = {
  title: 'Design System/Header',
  component: Header,
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
type Story = StoryObj<typeof Header>

export const DashboardActive: Story = { args: { activeZone: 'dashboard' } }
export const TransactionsActive: Story = { args: { activeZone: 'transactions' } }
