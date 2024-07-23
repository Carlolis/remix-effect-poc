# How to

<https://www.notion.so/POC-integration-6d23d648b833416bb9e1a9dc503f2443>

## Install dependencies with bun (install bun globally first)

```bash
bun i
```

## Run dev server with bun

```bash
bun dev
```

## Configure docker with docker-compose

### ZITADEL

```bash
cd docker-compose/zitadel
docker compose up -d
cd ../../
```

### ZAMMAD

```bash
cd docker-compose/zammad
docker compose up -d
cd ../../
```

### OIDC Authorization Code Flow

sequenceDiagram
    participant User as User
    participant RemixAppFront as Remix Frontend App
    participant RemixAppBack as Remix Backend API
    participant IdP as Identity Provider (IdP)

User->>RemixAppFront: GET <https://app.example.com>
RemixAppFront->>User: 401 Unauthorized (no session or token)

User->>RemixAppFront: Click "Login"
RemixAppFront->>IdP: GET <https://idp.example.com/auth?client_id=CLIENT123&redirect_uri=https://app.example.com/callback&scope=openid> profile&response_type=code&state=RANDOM_STATE123
User->>IdP: POST credentials to <https://idp.example.com/auth>

Note over IdP: Validates user credentials

IdP->>User: 302 Redirect to <https://app.example.com/callback?code=AUTHCODE456&state=RANDOM_STATE123>
User->>RemixAppFront: GET <https://app.example.com/callback?code=AUTHCODE456&state=RANDOM_STATE123>
RemixAppFront->>RemixAppBack: POST code, state, redirect_uri to <https://api.example.com/exchange_code>

RemixAppBack->>IdP: POST <https://idp.example.com/token> with code=AUTHCODE456, client_id=CLIENT123, client_secret=SECRET789, redirect_uri=<https://app.example.com/callback>, grant_type=authorization_code
IdP->>RemixAppBack: 200 OK with access token=ACCESSTOKEN012, ID token=IDTOKEN034, expiry

RemixAppBack->>RemixAppFront: 200 OK, Set-Cookie: session=SESSIONXYZ or send tokens
RemixAppFront->>User: 200 OK, Display authenticated state

Note over RemixAppFront,RemixAppBack: Optional: Refresh token mechanism can be implemented for long-term sessions

### Run tests with bun

```bash
bun test-vite
```

### Notion Links

- [Notion POC link](https://www.notion.so/POC-integration-6d23d648b833416bb9e1a9dc503f2443?pvs=4)
