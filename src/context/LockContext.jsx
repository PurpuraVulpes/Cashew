import React, { createContext, useContext, useCallback, useEffect, useMemo, useRef, useState } from 'react'

const LOCK_KEY = 'cashew-lock-v1'
const MAX_FAILS = 5
const BLOCK_MS = 30000

// Empreinte SHA-256 du code (jamais stocké en clair)
async function hashPin(pin) {
  const str = 'cashew-pin:' + pin
  try {
    if (typeof crypto !== 'undefined' && crypto.subtle) {
      const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(str))
      return [...new Uint8Array(buf)].map((b) => b.toString(16).padStart(2, '0')).join('')
    }
  } catch { /* repli ci-dessous */ }
  // Repli pour contextes non sécurisés : cyrb53
  let h1 = 0xdeadbeef, h2 = 0x41c6ce57
  for (let i = 0; i < str.length; i++) {
    const ch = str.charCodeAt(i)
    h1 = Math.imul(h1 ^ ch, 2654435761)
    h2 = Math.imul(h2 ^ ch, 1597334677)
  }
  h1 = Math.imul(h1 ^ (h1 >>> 16), 2246822507) ^ Math.imul(h2 ^ (h2 >>> 13), 3266489909)
  h2 = Math.imul(h2 ^ (h2 >>> 16), 2246822507) ^ Math.imul(h1 ^ (h1 >>> 13), 3266489909)
  return 'f' + (4294967296 * (2097151 & h2) + (h1 >>> 0)).toString(16)
}

function loadConfig() {
  try {
    const raw = localStorage.getItem(LOCK_KEY)
    if (raw) {
      const c = JSON.parse(raw)
      return {
        enabled: !!c.enabled && !!c.hash,
        length: c.length === 6 ? 6 : 4,
        hash: c.hash || null,
        delay: typeof c.delay === 'number' ? c.delay : 5,
      }
    }
  } catch { /* ignore */ }
  return { enabled: false, length: 4, hash: null, delay: 5 }
}

const LockContext = createContext(null)

export function LockProvider({ children }) {
  const [config, setConfig] = useState(loadConfig)
  const [locked, setLocked] = useState(() => loadConfig().enabled)
  const [fails, setFails] = useState(0)
  const [blockedUntil, setBlockedUntil] = useState(0)
  const [now, setNow] = useState(Date.now())
  const timerRef = useRef(null)

  const save = (c) => {
    setConfig(c)
    try {
      localStorage.setItem(LOCK_KEY, JSON.stringify(c))
    } catch { /* ignore */ }
  }

  const clearTimer = () => {
    if (timerRef.current) {
      clearTimeout(timerRef.current)
      timerRef.current = null
    }
  }

  const lock = useCallback(() => {
    setLocked(true)
  }, [])

  const armTimer = useCallback((cfg, isLocked) => {
    if (timerRef.current) {
      clearTimeout(timerRef.current)
      timerRef.current = null
    }
    if (!cfg.enabled || isLocked || !(cfg.delay > 0)) return
    timerRef.current = setTimeout(() => setLocked(true), cfg.delay * 60000)
  }, [])

  // (Ré)arme le verrouillage auto quand la config ou l'état change
  useEffect(() => {
    armTimer(config, locked)
    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current)
        timerRef.current = null
      }
    }
  }, [config, locked, armTimer])

  // Toute activité repousse le verrouillage auto
  useEffect(() => {
    if (!config.enabled || locked || !(config.delay > 0)) return
    const reset = () => armTimer(config, false)
    window.addEventListener('pointerdown', reset)
    window.addEventListener('keydown', reset)
    return () => {
      window.removeEventListener('pointerdown', reset)
      window.removeEventListener('keydown', reset)
    }
  }, [config, locked, armTimer])

  // Onglet masqué → verrouillage immédiat
  useEffect(() => {
    if (!config.enabled) return
    const onVis = () => {
      if (document.hidden) setLocked(true)
    }
    document.addEventListener('visibilitychange', onVis)
    return () => document.removeEventListener('visibilitychange', onVis)
  }, [config.enabled])

  // Compte à rebours anti-bruteforce
  useEffect(() => {
    if (!blockedUntil) return
    if (Date.now() >= blockedUntil) {
      setBlockedUntil(0)
      setFails(0)
      return
    }
    const i = setInterval(() => {
      setNow(Date.now())
      if (Date.now() >= blockedUntil) {
        setBlockedUntil(0)
        setFails(0)
        clearInterval(i)
      }
    }, 500)
    return () => clearInterval(i)
  }, [blockedUntil])

  const unlock = useCallback(async (pin) => {
    if (Date.now() < blockedUntil) return false
    const h = await hashPin(pin)
    if (h === config.hash) {
      setFails(0)
      setBlockedUntil(0)
      setLocked(false)
      return true
    }
    const f = fails + 1
    setFails(f)
    if (f >= MAX_FAILS) setBlockedUntil(Date.now() + BLOCK_MS)
    return false
  }, [blockedUntil, config.hash, fails])

  const verify = useCallback(async (pin) => {
    const h = await hashPin(pin)
    return h === config.hash
  }, [config.hash])

  const setPin = useCallback(async (pin, length) => {
    const h = await hashPin(pin)
    const c = { ...config, enabled: true, length, hash: h }
    setConfig(c)
    try {
      localStorage.setItem(LOCK_KEY, JSON.stringify(c))
    } catch { /* ignore */ }
    setFails(0)
    setBlockedUntil(0)
  }, [config])

  const disable = useCallback(() => {
    const c = { ...config, enabled: false, hash: null }
    setConfig(c)
    try {
      localStorage.setItem(LOCK_KEY, JSON.stringify(c))
    } catch { /* ignore */ }
    setFails(0)
    setBlockedUntil(0)
    setLocked(false)
  }, [config])

  const setDelay = useCallback((delay) => {
    const c = { ...config, delay }
    setConfig(c)
    try {
      localStorage.setItem(LOCK_KEY, JSON.stringify(c))
    } catch { /* ignore */ }
  }, [config])

  const clear = useCallback(() => {
    try {
      localStorage.removeItem(LOCK_KEY)
    } catch { /* ignore */ }
    setConfig({ enabled: false, length: 4, hash: null, delay: 5 })
    setFails(0)
    setBlockedUntil(0)
    setLocked(false)
  }, [])

  const value = useMemo(() => ({
    ...config,
    locked,
    fails,
    blockedUntil,
    blockLeft: Math.max(0, Math.ceil((blockedUntil - now) / 1000)),
    lock, unlock, verify, setPin, disable, setDelay, clear,
    maxFails: MAX_FAILS,
  }), [config, locked, fails, blockedUntil, now, lock, unlock, verify, setPin, disable, setDelay, clear])

  return <LockContext.Provider value={value}>{children}</LockContext.Provider>
}

export function useLock() {
  const ctx = useContext(LockContext)
  if (!ctx) throw new Error('useLock must be used within LockProvider')
  return ctx
}
