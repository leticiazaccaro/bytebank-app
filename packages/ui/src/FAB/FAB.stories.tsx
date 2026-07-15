import type { Meta, StoryObj } from '@storybook/nextjs-vite'
import { fn } from 'storybook/test'
import { FAB } from './FAB'

const meta: Meta<typeof FAB> = {
  title: 'Design System/FAB',
  component: FAB,
  parameters: { layout: 'centered' },
  tags: ['autodocs'],
  args: { onClick: fn() },
}

export default meta
type Story = StoryObj<typeof FAB>

export const Default: Story = {
  args: {},
}

export const CustomLabel: Story = {
  args: { label: 'Adicionar transação' },
}
