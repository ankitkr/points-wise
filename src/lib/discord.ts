import type { Tier } from '@/db/schema'

export type GuildCheck =
  | { ok: true; tier: Tier; roles: string[] }
  | { ok: false; reason: 'not_in_guild' | 'unauthorized' | 'rate_limited' | 'outage' }

// Reads the signer's member object in OUR guild and maps their roles to a tier.
// Discord roles are the source of truth. Failure modes are distinguished so an
// outage can't masquerade as "not in guild" (callers must not downgrade tier on
// a non-404 failure).
export async function checkGuildMembership(
  accessToken: string,
  env: CloudflareEnv,
): Promise<GuildCheck> {
  let res: Response
  try {
    res = await fetch(
      `https://discord.com/api/v10/users/@me/guilds/${env.DISCORD_GUILD_ID}/member`,
      { headers: { Authorization: `Bearer ${accessToken}` } },
    )
  } catch {
    return { ok: false, reason: 'outage' }
  }

  if (res.status === 404) return { ok: false, reason: 'not_in_guild' }
  if (res.status === 401 || res.status === 403) return { ok: false, reason: 'unauthorized' }
  if (res.status === 429) return { ok: false, reason: 'rate_limited' }
  if (!res.ok) return { ok: false, reason: 'outage' }

  const member = (await res.json()) as { roles?: string[] }
  const roles = member.roles ?? []
  const tier: Tier = roles.includes(env.DISCORD_FAMILY_ROLE_ID)
    ? 'family'
    : roles.includes(env.DISCORD_STANDALONE_ROLE_ID)
      ? 'standalone'
      : 'readonly'
  return { ok: true, tier, roles }
}
