import { Links, LinksFunction, Meta, Outlet, Scripts, ScrollRestoration,
  useRouteError } from 'react-router'

import stylesheet from '~/globals.css?url'

export const links: LinksFunction = () => [
  { rel: 'stylesheet', href: stylesheet }
]
// export const links: LinksFunction = () => [
//   { rel: "stylesheet", href: styles },
//   ...(cssBundleHref ? [{ rel: "stylesheet", href: cssBundleHref }] : []),
// ]

export function Layout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <Meta />
        <Links />
      </head>
      <body>
        {children}
        <ScrollRestoration />
        <Scripts />
      </body>
    </html>
  )
}

export function ErrorBoundary() {
  const error = useRouteError()
  console.error(error)
  return (
    <html lang="fr">
      <head>
        <title>Oh no!</title>
        <Meta />
        <Links />
      </head>
      <body>
        {/* add the UI you want your users to see */}
        <Scripts />
      </body>
    </html>
  )
}

export default function App() {
  return <Outlet />
}
