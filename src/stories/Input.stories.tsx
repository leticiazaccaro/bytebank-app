import type { Meta, StoryObj } from '@storybook/nextjs-vite'
import { Input } from '@/components/ui/Input/Input'

const meta: Meta<typeof Input> = {
  title: 'Design System/Input',
  component: Input,
  parameters: { layout: 'centered' },
  tags: ['autodocs'],
  decorators: [(Story) => <div style={{ width: 320 }}><Story /></div>],
}

export default meta
type Story = StoryObj<typeof Input>

export const Default: Story = {
  args: { label: 'Valor', placeholder: 'R$ 0,00', type: 'number' },
}

export const WithError: Story = {
  args: { label: 'Valor', placeholder: 'R$ 0,00', error: 'Campo obrigatório' },
}

export const WithHint: Story = {
  args: { label: 'Data', type: 'date', hint: 'Selecione a data da transação' },
}

export const Disabled: Story = {
  args: { label: 'Campo bloqueado', value: 'Valor fixo', disabled: true },
}
