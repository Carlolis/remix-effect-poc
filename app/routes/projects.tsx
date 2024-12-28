import { useLoaderData } from 'react-router';
import { pipe } from 'effect'
import * as O from 'effect/Option'

import type { loader } from '../.server/projects.server'
import { ButtonGoBackHome } from '../components/buttonGoBackHome'

export { loader } from '../.server/projects.server'
export default function Projects() {
  const projects = pipe(useLoaderData<typeof loader>(), O.fromNullable)

  return (
    <div className="font-sans leading-5 mt-10 flex flex-col items-center justify-center">
      <ButtonGoBackHome />
      <h1 className="text-2xl font-bold mt-4">- YOUR PROJECTS -</h1>
      <div className="mt-4">
        {pipe(
          projects,
          O.map(projects =>
            projects.map(project => (
              <div key={project.projectId} className="mb-4">
                <div className="text-lg font-semibold">{project.projectName}</div>
                <div className="ml-2">
                  Roles:
                  <ul className="list-disc ml-4">
                    {project.roleKeys.map(role => <li key={role}>{role}</li>)}
                  </ul>
                </div>
              </div>
            ))
          ),
          O.getOrNull
        )}
      </div>
    </div>
  )
}
