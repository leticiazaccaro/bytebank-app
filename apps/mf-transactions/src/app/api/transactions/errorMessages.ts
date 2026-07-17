// FORM-09/API-02/API-03: the real API's body-size limit (Express's default
// ~100kb) rejects a base64-encoded attachment with a raw, English,
// implementation-detail message ("Payload Too Large") — unlike other 4xx
// responses from that API, this one isn't safe to relay verbatim to the
// client (design.md Error Handling Strategy's "validation-error passthrough"
// pattern assumes a user-facing message, which this isn't).
export const ATTACHMENT_TOO_LARGE_MESSAGE =
  'O anexo é grande demais para o servidor aceitar. Tente um arquivo menor ou sem anexo.'
