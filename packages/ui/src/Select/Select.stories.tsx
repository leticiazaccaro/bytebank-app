import type { Meta, StoryObj } from '@storybook/nextjs-vite'
import { Select } from './Select'

const transactionOptions = [
  { value: 'deposit', label: 'Depósito' },
  { value: 'withdrawal', label: 'Saque' },
  { value: 'transfer', label: 'Transferência' },
  { value: 'pix', label: 'PIX' },
]

const meta: Meta<typeof Select> = {
  title: 'Design System/Select',
  component: Select,
  parameters: { layout: 'centered' },
  tags: ['autodocs'],
  decorators: [(Story) => <div style={{ width: 320 }}><Story /></div>],
}

export default meta
type Story = StoryObj<typeof Select>

export const Default: Story = {
  args: {
    label: 'Tipo de transação',
    options: transactionOptions,
    placeholder: 'Selecione...',
  },
}

export const WithError: Story = {
  args: {
    label: 'Tipo de transação',
    options: transactionOptions,
    error: 'Selecione um tipo',
  },
}
