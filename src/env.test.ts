import os from 'os'
import path from 'path'
import { describe, expect, it } from 'vitest'
import { env, parseEnv } from './env'

const VALID_SECRET_A = 'K9v#mP2$xL7@qR4!wZ8^nT5&yB3*jF6_hD1+gS0-cV9=aU2?eW4~pM7/kX3:uY8'
const VALID_SECRET_B = 'Q3z!rN8#vH5$bK1@mW6^pL9&tF2*xC7_jG4+yD0-sV3=eA5?uJ8~wM1/nR6:kP4'

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
    expect(env).toEqual(parseEnv(process.env))
    expect(path.isAbsolute(env.MEDIA_DIR)).toBe(true)
    expect(path.isAbsolute(env.VIDEOS_DIR)).toBe(true)
    expect(path.isAbsolute(env.UPLOAD_TMP_DIR)).toBe(true)

    const envWithoutDirs: NodeJS.ProcessEnv = { ...process.env }
    delete envWithoutDirs.MEDIA_DIR
    delete envWithoutDirs.VIDEOS_DIR
    delete envWithoutDirs.UPLOAD_TMP_DIR
    const parsedFromProcessDefaults = parseEnv(envWithoutDirs)
    expect(parsedFromProcessDefaults.MEDIA_DIR).toBe(path.resolve(process.cwd(), 'media'))
    expect(parsedFromProcessDefaults.VIDEOS_DIR).toBe(path.resolve(process.cwd(), 'videos'))
    expect(parsedFromProcessDefaults.UPLOAD_TMP_DIR).toBe(
      path.resolve(os.tmpdir(), 'aljazira-uploads'),
    )

    const raw = createValidRawEnv()
    const parsed = parseEnv(raw)
    expect(parsed).toEqual({
      ...raw,
      MEDIA_DIR: path.resolve(process.cwd(), 'media'),
      VIDEOS_DIR: path.resolve(process.cwd(), 'videos'),
      UPLOAD_TMP_DIR: path.resolve(os.tmpdir(), 'aljazira-uploads'),
      PAYLOAD_JOBS_AUTORUN: true,
      SMTP_HOST: '127.0.0.1',
      SMTP_PORT: 1025,
    })
  })

  it('requires PAYLOAD_JOBS_AUTORUN to be explicitly set in production while defaulting to true in dev/test (P2-T4 R-14)', () => {
    expect(() =>
      parseEnv({
        ...createValidRawEnv(),
        NODE_ENV: 'production',
        SMTP_HOST: 'smtp.aljazira.co',
        SMTP_PORT: '587',
      }),
    ).toThrow(/PAYLOAD_JOBS_AUTORUN.*production/i)

    expect(() =>
      parseEnv({
        ...createValidRawEnv(),
        NODE_ENV: 'production',
        PAYLOAD_JOBS_AUTORUN: 'invalid',
        SMTP_HOST: 'smtp.aljazira.co',
        SMTP_PORT: '587',
      }),
    ).toThrow(/PAYLOAD_JOBS_AUTORUN/i)

    expect(
      parseEnv({
        ...createValidRawEnv(),
        NODE_ENV: 'production',
        PAYLOAD_JOBS_AUTORUN: 'true',
        SMTP_HOST: 'smtp.aljazira.co',
        SMTP_PORT: '587',
      }).PAYLOAD_JOBS_AUTORUN,
    ).toBe(true)

    expect(
      parseEnv({
        ...createValidRawEnv(),
        NODE_ENV: 'production',
        PAYLOAD_JOBS_AUTORUN: 'false',
        SMTP_HOST: 'smtp.aljazira.co',
        SMTP_PORT: '587',
      }).PAYLOAD_JOBS_AUTORUN,
    ).toBe(false)
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

  it('rejects low-entropy secrets and superuser DB roles in DATABASE_URL (A-08)', () => {
    expect(() =>
      parseEnv({
        ...createValidRawEnv(),
        PAYLOAD_SECRET: 'a'.repeat(64),
      }),
    ).toThrow(/PAYLOAD_SECRET[\s\S]*entropy/i)

    expect(() =>
      parseEnv({
        ...createValidRawEnv(),
        PAYLOAD_SECRET: 'A'.repeat(48) + '_valid_random_payload_secret_123456',
      }),
    ).toThrow(/PAYLOAD_SECRET[\s\S]*entropy/i)

    expect(() =>
      parseEnv({
        ...createValidRawEnv(),
        IP_HASH_SALT: '0123456789abcdef'.repeat(4),
      }),
    ).toThrow(/IP_HASH_SALT[\s\S]*entropy/i)

    // R1-5: 48 hex chars = 24 bytes (~192-213 estimated bits), below the 32-random-byte (256-bit) entropy floor
    expect(() =>
      parseEnv({
        ...createValidRawEnv(),
        PAYLOAD_SECRET: '0123456789abcdeffedcba9876543210a1b2c3d4e5f60718',
      }),
    ).toThrow(/PAYLOAD_SECRET[\s\S]*entropy/i)

    expect(() =>
      parseEnv({
        ...createValidRawEnv(),
        DATABASE_URL: 'postgresql://postgres:strong_pass@127.0.0.1:5434/aljazira_dev',
      }),
    ).toThrow(/DATABASE_URL[\s\S]*superuser/i)

    expect(() =>
      parseEnv({
        ...createValidRawEnv(),
        DATABASE_URL: 'postgresql://aljazira_pg_super:strong_pass@127.0.0.1:5434/aljazira_dev',
      }),
    ).toThrow(/DATABASE_URL[\s\S]*superuser/i)
  })

  it('requires SMTP_HOST and SMTP_PORT in production instead of silently falling back to 127.0.0.1:1025 (A-09)', () => {
    expect(() =>
      parseEnv({
        ...createValidRawEnv(),
        NODE_ENV: 'production',
        PAYLOAD_JOBS_AUTORUN: 'false',
      }),
    ).toThrow(/SMTP_HOST.*production/i)

    expect(() =>
      parseEnv({
        ...createValidRawEnv(),
        NODE_ENV: 'production',
        PAYLOAD_JOBS_AUTORUN: 'false',
        SMTP_HOST: 'smtp.aljazira.co',
      }),
    ).toThrow(/SMTP_PORT.*production/i)

    const parsedProd = parseEnv({
      ...createValidRawEnv(),
      NODE_ENV: 'production',
      PAYLOAD_JOBS_AUTORUN: 'false',
      SMTP_HOST: 'smtp.aljazira.co',
      SMTP_PORT: '587',
    })
    expect(parsedProd.SMTP_HOST).toBe('smtp.aljazira.co')
    expect(parsedProd.SMTP_PORT).toBe(587)
  })
})
