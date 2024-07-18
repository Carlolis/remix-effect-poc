import { Effect } from 'effect'

export class ResponseHeaders
  extends Effect.Tag('@web/ResponseHeaders')<ResponseHeaders, Headers>() {}
