export interface AuthUser {
  name?: string
  email?: string
  picture?: string
}

export interface AuthSession {
  accessToken: string
  idToken?: string
  expiresAt: number
  user?: AuthUser
}

const buildQueryParams = (url: string) => {
  const parsed = new URL(url)
  const params = new URLSearchParams(parsed.search)

  if (parsed.hash.startsWith("#")) {
    const hashParams = new URLSearchParams(parsed.hash.slice(1))
    hashParams.forEach((value, key) => params.set(key, value))
  }

  return params
}

const randomString = (length: number) => {
  const bytes = crypto.getRandomValues(new Uint8Array(length))
  return Array.from(bytes, (b) => b.toString(16).padStart(2, "0")).join("")
}

const toBase64Url = (bytes: Uint8Array) => {
  const chars =
    "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/"
  let output = ""

  for (let i = 0; i < bytes.length; i += 3) {
    const a = bytes[i]
    const b = i + 1 < bytes.length ? bytes[i + 1] : 0
    const c = i + 2 < bytes.length ? bytes[i + 2] : 0

    const value = (a << 16) | (b << 8) | c

    output += chars[(value >> 18) & 63]
    output += chars[(value >> 12) & 63]
    output += i + 1 < bytes.length ? chars[(value >> 6) & 63] : "="
    output += i + 2 < bytes.length ? chars[value & 63] : "="
  }

  return output.replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "")
}

const createCodeChallenge = async (verifier: string) => {
  const data = new TextEncoder().encode(verifier)
  const digest = await crypto.subtle.digest("SHA-256", data)
  return toBase64Url(new Uint8Array(digest))
}

const getAuth0Config = () => {
  const domain = process.env.PLASMO_PUBLIC_AUTH0_DOMAIN
  const clientId = process.env.PLASMO_PUBLIC_AUTH0_CLIENT_ID
  const audience = process.env.PLASMO_PUBLIC_AUTH0_AUDIENCE

  if (!domain || !clientId) {
    throw new Error("Auth0 configuration missing in .env")
  }

  return { domain, clientId, audience }
}

export const getAuth0RedirectUri = () => chrome.identity.getRedirectURL("auth0")

export const parseAuthError = (error: unknown) => {
  if (typeof error === "string") {
    return error
  }

  if (error instanceof Error) {
    return error.message
  }

  return "Authentication failed"
}

export const isAuthSessionValid = (session: AuthSession | null) =>
  !!session && session.expiresAt > Date.now()

export const loginWithAuth0 = async (): Promise<AuthSession> => {
  const { domain, clientId, audience } = getAuth0Config()

  const redirectUri = getAuth0RedirectUri()
  const state = randomString(16)
  const codeVerifier = randomString(64)
  const codeChallenge = await createCodeChallenge(codeVerifier)

  const authorizeUrl = new URL(`https://${domain}/authorize`)
  authorizeUrl.searchParams.set("response_type", "code")
  authorizeUrl.searchParams.set("client_id", clientId)
  authorizeUrl.searchParams.set("redirect_uri", redirectUri)
  authorizeUrl.searchParams.set("scope", "openid profile email")
  authorizeUrl.searchParams.set("state", state)
  authorizeUrl.searchParams.set("code_challenge", codeChallenge)
  authorizeUrl.searchParams.set("code_challenge_method", "S256")

  if (audience) {
    authorizeUrl.searchParams.set("audience", audience)
  }

  const callbackUrl = await chrome.identity.launchWebAuthFlow({
    url: authorizeUrl.toString(),
    interactive: true
  })

  if (!callbackUrl) {
    throw new Error("No callback URL returned from Auth0")
  }

  const params = buildQueryParams(callbackUrl)
  const returnedState = params.get("state")
  const authCode = params.get("code")
  const authResponseError = params.get("error")
  const authResponseErrorDescription = params.get("error_description")

  if (authResponseError) {
    throw new Error(authResponseErrorDescription || authResponseError)
  }

  if (!returnedState || returnedState !== state) {
    throw new Error("Invalid OAuth state returned from Auth0")
  }

  if (!authCode) {
    throw new Error("Missing authorization code in OAuth callback")
  }

  const tokenResponse = await fetch(`https://${domain}/oauth/token`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      grant_type: "authorization_code",
      client_id: clientId,
      code: authCode,
      redirect_uri: redirectUri,
      code_verifier: codeVerifier
    })
  })

  if (!tokenResponse.ok) {
    const tokenError = await tokenResponse.text()
    throw new Error(`Token exchange failed: ${tokenError}`)
  }

  const tokenPayload = await tokenResponse.json()
  const accessToken = tokenPayload.access_token as string | undefined
  const idToken = tokenPayload.id_token as string | undefined
  const expiresIn = Number(tokenPayload.expires_in || 3600)

  if (!accessToken) {
    throw new Error("Missing access token from Auth0")
  }

  const profileResponse = await fetch(`https://${domain}/userinfo`, {
    headers: {
      Authorization: `Bearer ${accessToken}`
    }
  })

  if (!profileResponse.ok) {
    const profileError = await profileResponse.text()
    throw new Error(`Failed to fetch user profile: ${profileError}`)
  }

  const profile = (await profileResponse.json()) as AuthUser

  return {
    accessToken,
    idToken,
    expiresAt: Date.now() + expiresIn * 1000,
    user: profile
  }
}

export const logoutFromAuth0 = async () => {
  const { domain, clientId } = getAuth0Config()
  const returnTo = getAuth0RedirectUri()

  const logoutUrl = new URL(`https://${domain}/v2/logout`)
  logoutUrl.searchParams.set("client_id", clientId)
  logoutUrl.searchParams.set("returnTo", returnTo)

  try {
    await chrome.identity.launchWebAuthFlow({
      url: logoutUrl.toString(),
      interactive: false
    })
  } catch {
    // Fallback for providers/pages that require a visible flow to complete logout.
    await chrome.identity.launchWebAuthFlow({
      url: logoutUrl.toString(),
      interactive: true
    })
  }
}
