import { z } from 'zod'

// FORM-01: tipo, valor e descrição são campos obrigatórios — a ausência de
// qualquer um deles bloqueia o envio com uma mensagem de erro por campo.
// FORM-02: um valor não numérico ou <= 0 também bloqueia o envio.
export const transactionFormSchema = z.object({
  type: z.enum(['Debit', 'Credit'], { error: 'Selecione o tipo de transação.' }),
  description: z.string().trim().min(1, 'Informe a descrição.'),
  value: z
    .union([z.string(), z.number()])
    .refine((raw) => raw !== '' && raw !== undefined && raw !== null, {
      message: 'Informe o valor.',
    })
    .transform((raw, ctx) => {
      const numeric = typeof raw === 'number' ? raw : Number(String(raw).replace(',', '.'))
      if (Number.isNaN(numeric)) {
        ctx.addIssue({ code: 'custom', message: 'Informe um valor numérico válido.' })
        return z.NEVER
      }
      return numeric
    })
    .refine((value) => value > 0, { message: 'Informe um valor maior que zero.' }),
})

export type TransactionFormInput = z.infer<typeof transactionFormSchema>
