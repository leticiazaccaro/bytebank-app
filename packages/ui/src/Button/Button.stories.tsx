import type { Meta, StoryObj } from '@storybook/nextjs-vite'
import { Button } from './Button'

const meta: Meta<typeof Button> = {
  title: 'Design System/Button',
  component: Button,
  parameters: { layout: 'centered' },
  tags: ['autodocs'],
  argTypes: {
    variant: {
      control: 'select',
      options: ['primary', 'secondary', 'danger', 'ghost'],
    },
    size: {
      control: 'select',
      options: ['sm', 'md', 'lg'],
    },
  },
}

export default meta
type Story = StoryObj<typeof Button>

export const Primary: Story = {
  args: { variant: 'primary', children: 'Nova Transação' },
}

export const Secondary: Story = {
  args: { variant: 'secondary', children: 'Cancelar' },
}

export const Danger: Story = {
  args: { variant: 'danger', children: 'Excluir' },
}

export const Ghost: Story = {
  args: { variant: 'ghost', children: 'Ver detalhes' },
}

export const Small: Story = {
  args: { size: 'sm', children: 'Pequeno' },
}

export const Large: Story = {
  args: { size: 'lg', children: 'Grande' },
}

export const Disabled: Story = {
  args: { children: 'Desabilitado', disabled: true },
}

export const FullWidth: Story = {
  args: { children: 'Largura total', fullWidth: true },
  decorators: [(Story) => <div style={{ width: 320 }}><Story /></div>],
}
