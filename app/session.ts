import { createCookieSessionStorage } from '@remix-run/node'

// export the whole sessionStorage object
export const sessionStorage = createCookieSessionStorage({
  cookie: {
    maxAge: 60 * 60 * 24 * 365, // 1 year
    name: '_session', // use any name you want here
    sameSite: 'lax', // this helps with CSRF
    path: '/', // remember to add this so the cookie will work in all routes
    httpOnly: true, // for security reasons, make this cookie http only
    // FIXME: secure:// replace this with an actual secret
    secrets: ['s3cr3t'],
    // FIXME: // enable this in prod only
    secure: false,
    /// FIXME change this in prod
    domain: 'localhost'
  }
})

// you can also export the methods individually for your own usage
export const { getSession, commitSession, destroySession } = sessionStorage
