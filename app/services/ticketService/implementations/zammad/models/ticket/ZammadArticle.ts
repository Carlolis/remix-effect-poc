/* eslint-disable @typescript-eslint/naming-convention */
import { Schema as Sc } from 'effect'

/**
 * @param body message
 */
export const ZammadArticle = Sc.Struct({
  subject: Sc.String,
  body: Sc.String,
  type: Sc.String,
  internal: Sc.Boolean
})

export type ZammadArticle = Sc.Schema.Type<typeof ZammadArticle>
