// @vitest-environment jsdom
//
// FileReader/File are DOM APIs, not available under this app's default
// 'node' vitest environment — same rationale as T5's localStorage tests.
import { afterEach, describe, expect, it, vi } from 'vitest'
import {
  ALLOWED_ATTACHMENT_TYPES,
  MAX_ATTACHMENT_SIZE,
  readFileAsDataURL,
  validateAttachment,
} from './AttachmentField'

function makeFile(sizeInBytes: number, type: string, name = 'anexo.png'): File {
  const content = new Uint8Array(sizeInBytes)
  return new File([content], name, { type })
}

afterEach(() => {
  vi.unstubAllGlobals()
})

describe('validateAttachment (FORM-05)', () => {
  it('rejects a file larger than 2MB with a clear error message', () => {
    const file = makeFile(MAX_ATTACHMENT_SIZE + 1, 'image/png')

    expect(validateAttachment(file)).toBe('Arquivo muito grande. O limite é 2MB.')
  })

  it('rejects a file whose type is not in the allowed list', () => {
    const file = makeFile(1024, 'application/zip')

    expect(validateAttachment(file)).toBe('Tipo de arquivo não suportado. Envie um PNG, JPEG ou PDF.')
  })

  it.each(ALLOWED_ATTACHMENT_TYPES)('accepts a %s file within the size limit', (type) => {
    const file = makeFile(1024, type)

    expect(validateAttachment(file)).toBeNull()
  })

  it('accepts a file exactly at the 2MB limit', () => {
    const file = makeFile(MAX_ATTACHMENT_SIZE, 'application/pdf')

    expect(validateAttachment(file)).toBeNull()
  })
})

describe('readFileAsDataURL (FORM-06)', () => {
  it('resolves with a Base64 Data URL for a valid file', async () => {
    const file = new File(['hello'], 'nota.png', { type: 'image/png' })

    const dataUrl = await readFileAsDataURL(file)

    expect(dataUrl.startsWith('data:image/png;base64,')).toBe(true)
    const base64Payload = dataUrl.split(',')[1]
    expect(Buffer.from(base64Payload, 'base64').toString('utf-8')).toBe('hello')
  })

  it('rejects without throwing synchronously when the FileReader read fails (Edge Case: arquivo corrompido)', async () => {
    class FailingFileReader {
      onload: (() => void) | null = null
      onerror: (() => void) | null = null
      readAsDataURL() {
        queueMicrotask(() => this.onerror?.())
      }
    }
    vi.stubGlobal('FileReader', FailingFileReader)

    const file = new File(['corrupted'], 'quebrado.pdf', { type: 'application/pdf' })

    await expect(readFileAsDataURL(file)).rejects.toThrow('Não foi possível ler o arquivo selecionado.')
  })
})
