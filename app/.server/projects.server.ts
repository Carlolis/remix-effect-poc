import { Effect as T } from 'effect'

import { CookieSessionStorage } from '~/runtime/services/CookieSessionStorage'
import { unwrapLoader } from '../runtime/Remix'
import { UserManagement } from '../services/userManagement/UserManagement'

export const loader = T.gen(function* () {
  const userManagement = yield* UserManagement;

    return T.gen(function* () {

      const userInfo = yield* (
        CookieSessionStorage.getUserInfo()
      )
      const projects = yield* (
        userManagement.getUserProjectsWithRoles(userInfo.sub)
      )

      return projects
    })
  }).pipe(unwrapLoader)

