import os from 'os'
import path from 'path'
import { describe, expect, it } from 'vitest'
import { env, parseEnv } from './env'

const VALID_SECRET_A = 'A'.repeat(48) + '_valid_random_payload_secret_123456'
const VALID_SECRET_B = 'B'.repeat(48) + '_valid_random_ip_hash_salt_654321'

function createValidRawEnv(): Record<string, string> {
  return {
    DATABASE_URL: 'postgresql://aljazira_app:strong_pass@127.0.0.1:5434/aljazira_dev',
    SERVER_URL: 'http://localhost:3000',
    PAYLOAD_SECRET: VALID_SECRET_A,
    IP_HASH_SALT: VALID_SECRET_B,
  }
}

describe('parseEnv (S1, S2)', () => {
  it('validates startup env singleton and accepts a valid environment configuration', () => {
    expect(env.SERVER_URL).toBe('http://localhost:3000')
    expect(env.MEDIA_DIR).toBe(path.resolve(process.cwd(), 'media'))
    expect(env.VIDEOS_DIR).toBe(path.resolve(process.cwd(), 'videos'))
    expect(env.UPLOAD_TMP_DIR).toBe(path.resolve(os.tmpdir(), 'aljazira-uploads'))
    const raw = createValidRawEnv()
    const parsed = parseEnv(raw)
    expect(parsed).toEqual({
      ...raw,
      MEDIA_DIR: path.resolve(process.cwd(), 'media'),
      VIDEOS_DIR: path.resolve(process.cwd(), 'videos'),
      UPLOAD_TMP_DIR: path.resolve(os.tmpdir(), 'aljazira-uploads'),
    })
  })

  it('validates MEDIA_DIR, VIDEOS_DIR, and UPLOAD_TMP_DIR as separate absolute paths outside public/ (R-4, R-6, R-18)', () => {
    const customAbsDir = path.resolve(process.cwd(), 'custom-media-storage')
    const customVideosDir = path.resolve(process.cwd(), 'custom-videos-storage')
    const customTmpDir = path.resolve(process.cwd(), 'custom-upload-tmp')
    const parsed = parseEnv({
      ...createValidRawEnv(),
      MEDIA_DIR: customAbsDir,
      VIDEOS_DIR: customVideosDir,
      UPLOAD_TMP_DIR: customTmpDir,
    })
    expect(parsed.MEDIA_DIR).toBe(customAbsDir)
    expect(parsed.VIDEOS_DIR).toBe(customVideosDir)
    expect(parsed.UPLOAD_TMP_DIR).toBe(customTmpDir)

    expect(() =>
      parseEnv({
        ...createValidRawEnv(),
        MEDIA_DIR: 'relative/media',
      }),
    ).toThrow(/MEDIA_DIR.*absolute/i)

    expect(() =>
      parseEnv({
        ...createValidRawEnv(),
        VIDEOS_DIR: 'relative/videos',
      }),
    ).toThrow(/VIDEOS_DIR.*absolute/i)

    expect(() =>
      parseEnv({
        ...createValidRawEnv(),
        UPLOAD_TMP_DIR: 'relative/tmp',
      }),
    ).toThrow(/UPLOAD_TMP_DIR.*absolute/i)

    expect(() =>
      parseEnv({
        ...createValidRawEnv(),
        MEDIA_DIR: path.resolve(process.cwd(), 'public/uploads'),
      }),
    ).toThrow(/MEDIA_DIR.*public/i)

    expect(() =>
      parseEnv({
        ...createValidRawEnv(),
        VIDEOS_DIR: path.resolve(process.cwd(), 'public/videos'),
      }),
    ).toThrow(/VIDEOS_DIR.*public/i)

    expect(() =>
      parseEnv({
        ...createValidRawEnv(),
        UPLOAD_TMP_DIR: path.resolve(process.cwd(), 'public/tmp'),
      }),
    ).toThrow(/UPLOAD_TMP_DIR.*public/i)

    expect(() =>
      parseEnv({
        ...createValidRawEnv(),
        MEDIA_DIR: path.resolve(process.cwd(), 'media'),
        VIDEOS_DIR: path.resolve(process.cwd(), 'media/videos'),
      }),
    ).toThrow(/VIDEOS_DIR.*sibling/i)

    expect(() =>
      parseEnv({
        ...createValidRawEnv(),
        VIDEOS_DIR: path.resolve(process.cwd(), 'videos'),
        UPLOAD_TMP_DIR: path.resolve(process.cwd(), 'videos/.tmp'),
      }),
    ).toThrow(/UPLOAD_TMP_DIR.*outside MEDIA_DIR and VIDEOS_DIR/i)
  })

  it('rejects missing PAYLOAD_SECRET and names the variable + openssl command without leaking values', () => {
    const raw = createValidRawEnv()
    delete raw.PAYLOAD_SECRET

    expect(() => parseEnv(raw)).toThrow(/PAYLOAD_SECRET/)
    expect(() => parseEnv(raw)).toThrow(/openssl rand -base64 48/)
  })

  it('rejects a PAYLOAD_SECRET shorter than 48 characters and never prints the secret value', () => {
    const shortSecret = 'my_super_secret_20ch'
    const raw = {
      ...createValidRawEnv(),
      PAYLOAD_SECRET: shortSecret,
    }

    let caughtError: Error | undefined
    try {
      parseEnv(raw)
    } catch (err) {
      caughtError = err as Error
    }

    expect(caughtError).toBeDefined()
    expect(caughtError?.message).toContain('PAYLOAD_SECRET')
    expect(caughtError?.message).toContain('at least 48 characters')
    expect(caughtError?.message).toContain('openssl rand -base64 48')
    expect(caughtError?.message).not.toContain(shortSecret)
    expect(caughtError?.message).not.toContain(VALID_SECRET_B)
  })

  it('rejects placeholder values from .env.example even when >= 48 characters', () => {
    const placeholder = 'CHANGE_ME_GENERATE_WITH_OPENSSL_RAND_BASE64_48_PAYLOAD_SECRET'
    expect(placeholder.length).toBeGreaterThanOrEqual(48)

    const raw = {
      ...createValidRawEnv(),
      PAYLOAD_SECRET: placeholder,
    }

    let caughtError: Error | undefined
    try {
      parseEnv(raw)
    } catch (err) {
      caughtError = err as Error
    }

    expect(caughtError).toBeDefined()
    expect(caughtError?.message).toContain('PAYLOAD_SECRET')
    expect(caughtError?.message).toContain('placeholder')
    expect(caughtError?.message).not.toContain(VALID_SECRET_B)
  })

  it('rejects identical PAYLOAD_SECRET and IP_HASH_SALT', () => {
    const raw = {
      ...createValidRawEnv(),
      PAYLOAD_SECRET: VALID_SECRET_A,
      IP_HASH_SALT: VALID_SECRET_A,
    }

    let caughtError: Error | undefined
    try {
      parseEnv(raw)
    } catch (err) {
      caughtError = err as Error
    }

    expect(caughtError).toBeDefined()
    expect(caughtError?.message).toContain('IP_HASH_SALT')
    expect(caughtError?.message).toContain('must differ')
    expect(caughtError?.message).not.toContain(VALID_SECRET_A)
  })

  it('rejects invalid SERVER_URL or placeholder DATABASE_URL', () => {
    const badUrl = {
      ...createValidRawEnv(),
      SERVER_URL: 'not-a-url',
    }
    expect(() => parseEnv(badUrl)).toThrow(/SERVER_URL/)

    const placeholderDb = {
      ...createValidRawEnv(),
      DATABASE_URL:
        'postgresql://CHANGE_ME_APP_DB_USER:CHANGE_ME_APP_DB_PASSWORD@127.0.0.1:5434/aljazira_dev',
    }
    expect(() => parseEnv(placeholderDb)).toThrow(/DATABASE_URL/)
  })
})
