import { ParseResult as PR, Schema as Sc } from 'effect'
import { Either } from 'effect/Either'

export const StringFromStringOrNumberDecoder = (
  s: unknown
): Either<string, PR.ParseIssue> => {
  if (!(typeof s === 'string' || typeof s === 'number')) {
    return PR.fail(new PR.Type(Sc.String.ast, s))
  } else return PR.succeed(stringFromStringOrNumberOpt(s))
}

export const StringFromStringOrNumber = Sc.transformOrFail(
  Sc.Union(Sc.String, Sc.Number),
  Sc.String,
  { decode: StringFromStringOrNumberDecoder, encode: PR.succeed }
)

export const stringFromStringOrNumberOpt = (s: string | number): string =>
  typeof s === 'number' ? s.toString() : s
