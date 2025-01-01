import { pipe, Schema as Sc } from 'effect'
import { useLoaderData } from 'react-router'

import { CustomButton } from '~/components/CustomButton'
import { Email } from '~/runtime/models/Email'
import { UserIdSchema } from '../services/userManagement/models/user/UserId'

export { loader } from '../.server/callback.server'

/**
 * @param iss domain 'http://localhost:8081'
 * @param sub userId
 * @param client_id id from api 'xxx@POC'
 * @param preferred_username userName
 */
export const JwtUserInfo = Sc.Struct({
  iss: Sc.String,
  sub: UserIdSchema,
  email: Email,
  // eslint-disable-next-line @typescript-eslint/naming-convention
  preferred_username: Sc.String,
  // eslint-disable-next-line @typescript-eslint/naming-convention
  client_id: Sc.String
})

export type JwtUserInfo = Sc.Schema.Type<typeof JwtUserInfo>

export default function CallBack() {
  const userInfo = pipe(useLoaderData(), Sc.decodeUnknownSync(JwtUserInfo))
  return (
    <div className="flex flex-col items-center justify-center h-screen">
      <div className="text-center mb-4">
        {`Congrats ${userInfo.preferred_username}, you are now logged in! You can view your tickets!`}
      </div>
      <div className="space-y-4">
        <CustomButton to="/tickets">Your Tickets</CustomButton>
        <CustomButton to="/">Go back home</CustomButton>
      </div>
    </div>
  )
}
