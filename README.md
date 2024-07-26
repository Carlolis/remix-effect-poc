# How to configure ZITADEL with ZAMMAD

<https://www.notion.so/POC-integration-6d23d648b833416bb9e1a9dc503f2443>

## Configure docker with docker-compose

## 1 ZITADEL

### Change the ZITADEL port to 8080

First change the 8081 zitadel port to 8080 in the docker-compose.yml file (line 17)

### Run ZITADEL with docker-compose

Run the following commands:

```bash
cd docker-compose/zitadel
docker compose up -d
cd ../../
```

### Connect and change your admin password

Got to <http://localhost:8080> and login with the default credentials:

login : `zitadel-admin@zitadel.localhost`
password: Password1!

Set and save a new password

### Set redirection URL in ZITADEL

See : <https://www.notion.so/tuto-dev-Zitadel-and-Zammad-3c57a95a09b144f6b387783b05bfc5d3?pvs=4#47632a93cb7b4d56b855dfbefa137c00>

### Change back the ZITADEL port to 8081

First change the 8080 zitadel port to 8081 in the docker-compose.yml file (line 17)

### Run again ZITADEL with docker-compose

Run the following commands:

```bash
cd docker-compose/zitadel
docker compose up -d
cd ../../
```

### Create a new Project (<https://www.notion.so/tuto-dev-ZiTADEL-3d0ed032232d4e5ab90b66bb2ac3a128?pvs=4#9c3cf0dba0174836b8a286e093231b1f>)

Go to <http://localhost:8081/ui/console/projects> and login with the new password, create a new project.

### Create an application

In the new project, create an application

Select the WEB type

Select PKCE authentication method

Put the redirect url as in the implementation, our is : <http://localhost:4200/callback> and click on "Development Mode"

Copy paste it in your System Environment Variables (.zshrc) the ClientId in  the variable : ZITADEL_CLIENT_ID

then go in this app and check the boxes in "Token Setting" :

- "User roles inside ID Token"
- "User Info inside ID Token"

### Create a Machine User (<https://www.notion.so/tuto-dev-ZiTADEL-3d0ed032232d4e5ab90b66bb2ac3a128?pvs=4#6a140af8e65a41149a14cf30d148915c>)

Go to <http://localhost:8081/ui/console/users?type=machine>

And create a new machine user with default values

Go to its "Personal Access Tokens" section and create a Personal Access Token. then copy paste it in your SystemEnvironmentVariables : ZITADEL_ACCESS_TOKEN

IMPORTANT ⇒ add this machineUser as a Manager to give him more permissions (check: To add Managers) (<https://www.notion.so/tuto-dev-ZiTADEL-3d0ed032232d4e5ab90b66bb2ac3a128?pvs=4#2a3b0b4a29c44db4a985df2267477571>)

## 2 ZAMMAD

### Run ZAMMAD with docker-compose

```bash
cd docker-compose/zammad
docker compose up -d
cd ../../
```

### Set up a new system

Got to localhost:8080 and set up a new system and create a new user

### Get your ZAMMAD_ACCESS_TOKEN

Go to  <http://localhost:8080/#profile/token_access>

Create a token with all the permissions and copy paste it in your System Environment Variables (.zshrc) the variable ZAMMAD_ACCESS_TOKEN

## 4 Run dev application with bun

### Install dependencies with bun

```bash
bun i
```

### Run dev server with bun

```bash
bun dev
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

### Production

See [PRODUCTION.md](PRODUCTION.md)
