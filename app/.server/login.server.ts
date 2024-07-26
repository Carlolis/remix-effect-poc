import { Effect as T } from 'effect'
import { CookieSessionStorage } from '~/runtime/services/CookieSessionStorage'
import { Remix } from '../runtime/Remix'
import { UserManagement } from '../services/userManagement/UserManagement'

// loader
export const loader = Remix.unwrapLoader(
  T.succeed(
    T.gen(function* () {
      const userInfo = yield* CookieSessionStorage.getUserInfo()
      return userInfo.preferred_username
    }).pipe(T.catchAll(() => T.succeed(undefined)))
  )
)

export const action = Remix.action(
  T.gen(function* () {
    T.log('action login')
    const userManagement = yield* UserManagement

    const { codeVerifier, nonce, authorizationUrl } = yield* userManagement.login

    return yield* (CookieSessionStorage.commitCodeVerifierAndNonceToSession({
      authorizationUrl,
      codeVerifier,
      nonce
    }))
  })
)
