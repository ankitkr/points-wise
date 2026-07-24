import { env, fetchMock } from 'cloudflare:test'
import { describe, expect, it } from 'vitest'
import { checkGuildMembership } from './discord'

const MEMBER_PATH = `/api/v10/users/@me/guilds/${env.DISCORD_GUILD_ID}/member`

function mockMember(statusCode: number, data?: unknown) {
  fetchMock
    .get('https://discord.com')
    .intercept({ path: MEMBER_PATH })
    .reply(statusCode, data as never)
}

describe('checkGuildMembership — role → tier', () => {
  it('maps @family to family', async () => {
    mockMember(200, { roles: ['role-family', 'x'] })
    expect(await checkGuildMembership('tok', env)).toEqual({
      ok: true,
      tier: 'family',
      roles: ['role-family', 'x'],
    })
  })

  it('maps @standalone to standalone', async () => {
    mockMember(200, { roles: ['role-standalone'] })
    expect(await checkGuildMembership('tok', env)).toMatchObject({ ok: true, tier: 'standalone' })
  })

  it('family wins when both roles present', async () => {
    mockMember(200, { roles: ['role-standalone', 'role-family'] })
    expect(await checkGuildMembership('tok', env)).toMatchObject({ ok: true, tier: 'family' })
  })

  it('in guild with no tier role → readonly', async () => {
    mockMember(200, { roles: [] })
    expect(await checkGuildMembership('tok', env)).toMatchObject({ ok: true, tier: 'readonly' })
  })

  it('missing roles field → readonly', async () => {
    mockMember(200, {})
    expect(await checkGuildMembership('tok', env)).toMatchObject({ ok: true, tier: 'readonly' })
  })
})

describe('checkGuildMembership — failure modes', () => {
  it('404 → not_in_guild', async () => {
    mockMember(404, {})
    expect(await checkGuildMembership('tok', env)).toEqual({ ok: false, reason: 'not_in_guild' })
  })

  it('401 → unauthorized', async () => {
    mockMember(401, {})
    expect(await checkGuildMembership('tok', env)).toEqual({ ok: false, reason: 'unauthorized' })
  })

  it('403 → unauthorized', async () => {
    mockMember(403, {})
    expect(await checkGuildMembership('tok', env)).toEqual({ ok: false, reason: 'unauthorized' })
  })

  it('429 → rate_limited', async () => {
    mockMember(429, {})
    expect(await checkGuildMembership('tok', env)).toEqual({ ok: false, reason: 'rate_limited' })
  })

  it('500 → outage', async () => {
    mockMember(500, {})
    expect(await checkGuildMembership('tok', env)).toEqual({ ok: false, reason: 'outage' })
  })
})
