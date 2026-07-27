import type { Tier } from '@/db/schema'

export type GuildCheck =
  | { ok: true; tier: Tier; isAdmin: boolean; roles: string[] }
  | { ok: false; reason: 'not_in_guild' | 'unauthorized' | 'rate_limited' | 'outage' }

// Only the guild/role ids are needed — narrowing keeps the function easy to test.
type GuildEnv = Pick<
  CloudflareEnv,
  | 'DISCORD_GUILD_ID'
  | 'DISCORD_FAMILY_ROLE_ID'
  | 'DISCORD_STANDALONE_ROLE_ID'
  | 'DISCORD_ADMIN_ROLE_ID'
>

// Reads the signer's member object in OUR guild and maps their roles to a tier.
// Discord roles are the source of truth. Failure modes are distinguished so an
// outage can't masquerade as "not in guild" (callers must not downgrade tier on
// a non-404 failure).
export async function checkGuildMembership(
  accessToken: string,
  env: GuildEnv,
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
  // @admin is a capability flag orthogonal to tier: it gates Knowledge Base
  // editing, not personal-ledger features.
  const isAdmin = roles.includes(env.DISCORD_ADMIN_ROLE_ID)
  return { ok: true, tier, isAdmin, roles }
}
