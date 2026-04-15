import { describe, it, expect } from 'vitest'

/**
 * 奶茶店管理系统 - API 测试
 * 测试后端API是否正常工作
 */

describe('API Health Check', () => {
  const BASE_URL = 'http://localhost:3849'

  it('i18n API should return system title', async () => {
    const res = await fetch(`${BASE_URL}/api/i18n`)
    const data = await res.json()
    expect(data.title).toBe('奶茶店管理系统')
  })

  it('login API should return token with valid credentials', async () => {
    const res = await fetch(`${BASE_URL}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: 'admin', password: 'admin123' })
    })
    const data = await res.json()
    expect(data.token).toBeDefined()
    expect(data.user.role).toBe('admin')
  })

  it('inventory API should require auth', async () => {
    const res = await fetch(`${BASE_URL}/api/inventory`)
    expect(res.status).toBe(401)
  })

  it('inventory API should return data with auth', async () => {
    // First login
    const loginRes = await fetch(`${BASE_URL}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: 'admin', password: 'admin123' })
    })
    const { token } = await loginRes.json()

    // Get inventory
    const res = await fetch(`${BASE_URL}/api/inventory`, {
      headers: { Authorization: `Bearer ${token}` }
    })
    const data = await res.json()
    expect(Array.isArray(data)).toBe(true)
  })

  it('products API should return product list', async () => {
    const loginRes = await fetch(`${BASE_URL}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: 'admin', password: 'admin123' })
    })
    const { token } = await loginRes.json()

    const res = await fetch(`${BASE_URL}/api/products`, {
      headers: { Authorization: `Bearer ${token}` }
    })
    const data = await res.json()
    expect(Array.isArray(data)).toBe(true)
    expect(data.length).toBeGreaterThan(0)
  })

  it('expense API should work with auth', async () => {
    const loginRes = await fetch(`${BASE_URL}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: 'admin', password: 'admin123' })
    })
    const { token } = await loginRes.json()

    const res = await fetch(`${BASE_URL}/api/expense`, {
      headers: { Authorization: `Bearer ${token}` }
    })
    const data = await res.json()
    expect(Array.isArray(data)).toBe(true)
  })

  it('anomalies API should return anomaly detection data', async () => {
    const loginRes = await fetch(`${BASE_URL}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: 'admin', password: 'admin123' })
    })
    const { token } = await loginRes.json()

    const res = await fetch(`${BASE_URL}/api/anomalies`, {
      headers: { Authorization: `Bearer ${token}` }
    })
    const data = await res.json()
    expect(data).toHaveProperty('total')
    expect(data).toHaveProperty('items')
    expect(Array.isArray(data.items)).toBe(true)
  })
})
