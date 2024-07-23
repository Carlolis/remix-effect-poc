// First we create our UI with the form doing a POST and the inputs with the

import { Form, useLoaderData } from '@remix-run/react'

import { Button } from '~/components/ui/button'
import { ButtonGoBackHome } from '../components/buttonGoBackHome'

export { action, loader } from '../.server/login.server'
// names we are going to use in the strategy
export default function Screen() {
  const response = useLoaderData<{ userName: string | undefined }>()

  return (
    <div className="font-sans leading-5 mt-10 flex flex-col items-center justify-center">
      <ButtonGoBackHome />
      <h1 className="text-2xl font-bold mt-10">- LOGIN -</h1>
      {(response.userName) ?
        (
          <div>
            Account created ! Hello {response?.userName}{' '}
            ! Please check your email and Please log in !
          </div>
        ) :
        null}
      <div className="mt-10">
        <Form method="post" action="/login">
          <Button type="submit" className="bg-cyan-500 hover:bg-cyan-600 text-white">
            Sign in with Zitadel
          </Button>
        </Form>
      </div>
    </div>
  )
}
