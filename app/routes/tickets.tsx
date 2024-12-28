import { useLoaderData } from 'react-router';
import { pipe } from 'effect'
import * as O from 'effect/Option'
import type { loader } from '../.server/tickets.server'
import { ButtonGoBackHome } from '../components/buttonGoBackHome'
export { loader } from '../.server/tickets.server'
export default function Tickets() {
  const tickets = pipe(useLoaderData<typeof loader>(), O.fromNullable)
  // console.log(tickets)
  return (
    <div className="font-sans leading-5 mt-10 flex flex-col items-center justify-center">
      <ButtonGoBackHome />
      <h1 className="text-2xl font-bold mt-10">- YOUR TICKETS -</h1>
      <div className="mt-10">
        {pipe(
          tickets,
          O.map(tickets =>
            tickets.map(ticket => (
              <div key={ticket.ticketId}>
                <h2 className="text-xl font-bold">{ticket.title}</h2>
                <div>Messages:</div>
                <div>
                  {ticket.messages.map(message => <div key={message}>{message}</div>)}
                </div>
                <div>Priority: {ticket.priority}</div>
              </div>
            ))
          ),
          O.getOrNull
        )}
      </div>
    </div>
  )
}
