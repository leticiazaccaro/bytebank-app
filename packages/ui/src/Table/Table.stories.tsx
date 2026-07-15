import type { Meta, StoryObj } from '@storybook/nextjs-vite'
import { Table, TableColumn } from './Table'

interface Row {
  id: string
  description: string
  value: string
}

const columns: TableColumn<Row>[] = [
  { key: 'description', header: 'Descrição', render: (row) => row.description },
  { key: 'value', header: 'Valor', render: (row) => row.value, align: 'right' },
]

const data: Row[] = [
  { id: '1', description: 'Salário', value: 'R$ 3.500,00' },
  { id: '2', description: 'Mercado', value: '-R$ 240,50' },
]

const meta: Meta<typeof Table> = {
  title: 'Design System/Table',
  component: Table,
  parameters: { layout: 'centered' },
  tags: ['autodocs'],
  decorators: [(Story) => <div style={{ width: 480 }}><Story /></div>],
}

export default meta
type Story = StoryObj<typeof Table<Row>>

export const Default: Story = {
  args: { columns, data },
}

export const Empty: Story = {
  args: { columns, data: [], emptyMessage: 'Nenhuma transação encontrada.' },
}
