import type { Meta, StoryObj } from '@storybook/nextjs-vite'
import { Badge } from './Badge'

const meta: Meta<typeof Badge> = {
  title: 'Design System/Badge',
  component: Badge,
  parameters: { layout: 'centered' },
  tags: ['autodocs'],
  argTypes: {
    type: {
      control: 'select',
      options: ['deposit', 'withdrawal', 'transfer', 'pix'],
    },
  },
}

export default meta
type Story = StoryObj<typeof Badge>

export const Deposit: Story = { args: { type: 'deposit' } }
export const Withdrawal: Story = { args: { type: 'withdrawal' } }
export const Transfer: Story = { args: { type: 'transfer' } }
export const Pix: Story = { args: { type: 'pix' } }

export const AllTypes: Story = {
  render: () => (
    <div className="flex gap-2 flex-wrap">
      <Badge type="deposit" />
      <Badge type="withdrawal" />
      <Badge type="transfer" />
      <Badge type="pix" />
    </div>
  ),
}
