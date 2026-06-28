import type { Screen } from '@/types/database'

function agentUrl(screen: Screen, path: string): string {
  return `http://${screen.ip}:${screen.port}${path}`
}

function agentHeaders(screen: Screen): HeadersInit {
  return {
    'Content-Type': 'application/json',
    'X-Secret': screen.secret ?? '',
  }
}

export async function agentStartSession(
  screen: Screen,
  sessionPassword: string
): Promise<void> {
  if (!screen.ip) return
  await fetch(agentUrl(screen, '/session/start'), {
    method: 'POST',
    headers: agentHeaders(screen),
    body: JSON.stringify({ password: sessionPassword }),
  })
}

export async function agentEndSession(screen: Screen): Promise<void> {
  if (!screen.ip) return
  await fetch(agentUrl(screen, '/session/end'), {
    method: 'POST',
    headers: agentHeaders(screen),
  })
}

export async function agentLockScreen(screen: Screen): Promise<void> {
  if (!screen.ip) return
  await fetch(agentUrl(screen, '/screen/lock'), {
    method: 'POST',
    headers: agentHeaders(screen),
  })
}

export async function agentUnlockScreen(screen: Screen): Promise<void> {
  if (!screen.ip) return
  await fetch(agentUrl(screen, '/screen/unlock'), {
    method: 'POST',
    headers: agentHeaders(screen),
  })
}

export async function agentGetStatus(
  screen: Screen
): Promise<{ status: string } | null> {
  if (!screen.ip) return null
  try {
    const res = await fetch(agentUrl(screen, '/status'), {
      headers: agentHeaders(screen),
      signal: AbortSignal.timeout(3000),
    })
    return res.ok ? res.json() : null
  } catch {
    return null
  }
}

export async function agentShowMessage(
  screen: Screen,
  message: string
): Promise<void> {
  if (!screen.ip) return
  await fetch(agentUrl(screen, '/message'), {
    method: 'POST',
    headers: agentHeaders(screen),
    body: JSON.stringify({ message }),
  })
}
