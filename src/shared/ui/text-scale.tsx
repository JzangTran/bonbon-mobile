import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'
import { secureStorage } from '@/shared/lib/secure-storage'

/**
 * Text size chosen in the app, on top of the phone's own font size setting (iOS Dynamic Type, Android font scale), which the
 * Text component already follows up to 200 %. The three sizes are shortcuts for people who have not changed the phone setting.
 */
export const TEXT_SCALES = [
  { id: 'normal', label: 'Chuẩn', factor: 1 },
  { id: 'large', label: 'Lớn', factor: 1.2 },
  { id: 'xlarge', label: 'Rất lớn', factor: 1.4 },
] as const
export type TextScaleId = (typeof TEXT_SCALES)[number]['id']

const KEY = 'bonbon.textScale'

type Value = { id: TextScaleId; factor: number; setId: (id: TextScaleId) => void }
const Ctx = createContext<Value>({ id: 'normal', factor: 1, setId: () => undefined })

export function TextScaleProvider({ children }: { children: ReactNode }) {
  const [id, setIdState] = useState<TextScaleId>('normal')
  useEffect(() => {
    secureStorage
      .get(KEY)
      .then((saved) => {
        if (TEXT_SCALES.some((s) => s.id === saved)) setIdState(saved as TextScaleId)
      })
      .catch(() => undefined)
  }, [])
  const setId = useCallback((next: TextScaleId) => {
    setIdState(next)
    secureStorage.set(KEY, next).catch(() => undefined)
  }, [])
  const value = useMemo(() => ({ id, factor: TEXT_SCALES.find((s) => s.id === id)?.factor ?? 1, setId }), [id, setId])
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>
}

export const useTextScale = () => useContext(Ctx)
