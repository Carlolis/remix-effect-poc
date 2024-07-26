import { Effect as T } from 'effect'
import { CookieSessionStorage } from '~/runtime/services/CookieSessionStorage'
import { Remix } from '../runtime/Remix'
import { UserManagement } from '../services/userManagement/UserManagement'

// loader
export const loader = Remix.unwrapLoader(
  T.succeed(
    CookieSessionStorage.getUserName()
  )
)

export const action = Remix.unwrapAction(
  T.gen(function* () {
    T.log('action login')
    const userManagement = yield* UserManagement

    const { codeVerifier, nonce, authorizationUrl } = yield* userManagement.login

    return CookieSessionStorage.commitCodeVerifierAndNonce({
      authorizationUrl,
      codeVerifier,
      nonce
    })
  })
)
