import type { Meta, StoryObj } from '@storybook/nextjs-vite'
import { useState } from 'react'
import { expect, userEvent, waitFor, within } from 'storybook/test'
import { LiveRegion } from './LiveRegion'
import { Button } from '../Button/Button'

const meta: Meta<typeof LiveRegion> = {
  title: 'Design System/LiveRegion',
  component: LiveRegion,
  parameters: { layout: 'centered' },
  tags: ['autodocs'],
}

export default meta
type Story = StoryObj<typeof LiveRegion>

export const Polite: Story = {
  args: { message: 'Carregando seus dados financeiros…', politeness: 'polite' },
}

export const Assertive: Story = {
  args: { message: 'Não foi possível salvar a transação. Tente novamente.', politeness: 'assertive' },
}

export const Empty: Story = {
  args: { message: null },
}

// A11Y-03: the region must already be mounted before its content changes —
// screen readers announce content *changes* to an existing live region, not
// the initial mount of one, which is why callers always render `LiveRegion`
// unconditionally and only ever swap `message`.
export const AnnouncesOnChange: Story = {
  render: () => {
    const [message, setMessage] = useState<string | null>(null)
    return (
      <div className="flex flex-col gap-3">
        <Button onClick={() => setMessage('Preencha o valor da transação.')}>Simular erro</Button>
        <LiveRegion message={message} politeness="assertive" />
      </div>
    )
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    const trigger = canvas.getByRole('button', { name: 'Simular erro' })
    const region = canvasElement.querySelector('[role="alert"]')

    expect(region).not.toBeNull()
    expect(region).toHaveTextContent('')

    await userEvent.click(trigger)

    await waitFor(() => expect(region).toHaveTextContent('Preencha o valor da transação.'))
  },
}
