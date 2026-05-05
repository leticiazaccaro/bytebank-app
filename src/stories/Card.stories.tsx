import type { Meta, StoryObj } from '@storybook/nextjs-vite'
import { Card } from '@/components/ui/Card/Card'

const meta: Meta<typeof Card> = {
  title: 'Design System/Card',
  component: Card,
  parameters: { layout: 'centered' },
  tags: ['autodocs'],
  decorators: [(Story) => <div style={{ width: 320 }}><Story /></div>],
}

export default meta
type Story = StoryObj<typeof Card>

export const Default: Story = {
  args: {
    children: (
      <div>
        <h3 className="font-semibold text-neutral-800">Saldo disponível</h3>
        <p className="text-2xl font-bold text-primary mt-1">R$ 3.282,60</p>
      </div>
    ),
  },
}

export const Small: Story = {
  args: { padding: 'sm', children: <p>Conteúdo compacto</p> },
}

export const Large: Story = {
  args: { padding: 'lg', children: <p>Conteúdo com mais espaço</p> },
}
