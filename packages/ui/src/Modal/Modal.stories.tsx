'use client'

import type { Meta, StoryObj } from '@storybook/nextjs-vite'
import { useState } from 'react'
import { expect, userEvent, waitFor, within } from 'storybook/test'
import { Modal } from './Modal'
import { Button } from '../Button/Button'

const meta: Meta<typeof Modal> = {
  title: 'Design System/Modal',
  component: Modal,
  parameters: { layout: 'centered' },
  tags: ['autodocs'],
}

export default meta
type Story = StoryObj<typeof Modal>

export const Default: Story = {
  render: () => {
    const [open, setOpen] = useState(false)
    return (
      <>
        <Button onClick={() => setOpen(true)}>Abrir Modal</Button>
        <Modal isOpen={open} onClose={() => setOpen(false)} title="Exemplo de Modal">
          <p className="text-neutral-600 text-sm">Conteúdo do modal aqui.</p>
          <div className="flex gap-2 mt-4 justify-end">
            <Button variant="ghost" size="sm" onClick={() => setOpen(false)}>Cancelar</Button>
            <Button size="sm" onClick={() => setOpen(false)}>Confirmar</Button>
          </div>
        </Modal>
      </>
    )
  },
}

// A11Y-02: Modal renders into a portal on `document.body`, a sibling of the
// story's own root — `within(canvasElement)` only reaches the trigger
// button, so the dialog's contents are queried via the shared document body.
export const FocusManagement: Story = {
  render: () => {
    const [open, setOpen] = useState(false)
    return (
      <>
        <Button onClick={() => setOpen(true)}>Abrir Modal</Button>
        <Modal isOpen={open} onClose={() => setOpen(false)} title="Exemplo de Modal">
          <p className="text-neutral-600 text-sm">Conteúdo do modal aqui.</p>
          <div className="flex gap-2 mt-4 justify-end">
            <Button variant="ghost" size="sm" onClick={() => setOpen(false)}>Cancelar</Button>
            <Button size="sm" onClick={() => setOpen(false)}>Confirmar</Button>
          </div>
        </Modal>
      </>
    )
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    const body = within(canvasElement.ownerDocument.body)
    const trigger = canvas.getByRole('button', { name: 'Abrir Modal' })

    await userEvent.click(trigger)

    // Focus moves into the dialog on open.
    const closeButton = await body.findByRole('button', { name: 'Fechar modal' })
    await waitFor(() => expect(closeButton).toHaveFocus())

    const cancelButton = body.getByRole('button', { name: 'Cancelar' })
    const confirmButton = body.getByRole('button', { name: 'Confirmar' })

    // Tab cycles forward within the dialog only — it never reaches an
    // element outside it (e.g. the trigger button).
    await userEvent.tab()
    await waitFor(() => expect(cancelButton).toHaveFocus())
    await userEvent.tab()
    await waitFor(() => expect(confirmButton).toHaveFocus())
    await userEvent.tab()
    await waitFor(() => expect(closeButton).toHaveFocus())

    // Shift+Tab from the first element wraps to the last, not out of the dialog.
    await userEvent.tab({ shift: true })
    await waitFor(() => expect(confirmButton).toHaveFocus())

    // Closing (Confirmar) returns focus to the element that opened the modal.
    await userEvent.click(confirmButton)
    await waitFor(() => expect(trigger).toHaveFocus())
  },
}
