import { useSyncExternalStore } from 'react'

/**
 * What the server said that blocks the whole app, not just one call: the app is too old (426 APP_UPDATE_REQUIRED), the system is in
 * full maintenance (503 MAINTENANCE), or legal documents have to be accepted again (403 LEGAL_ACCEPTANCE_REQUIRED). The API client
 * reports it here; the app gate shows it.
 */
export type GateState = {
  updateRequiredAt: number | null
  maintenanceAt: number | null
  legalRequiredAt: number | null
}

let state: GateState = { updateRequiredAt: null, maintenanceAt: null, legalRequiredAt: null }
const listeners = new Set<() => void>()

function set(next: GateState) {
  state = next
  listeners.forEach((l) => l())
}

export function reportUpdateRequired() {
  set({ ...state, updateRequiredAt: Date.now() })
}

export function reportMaintenance() {
  set({ ...state, maintenanceAt: Date.now() })
}

export function reportLegalRequired() {
  set({ ...state, legalRequiredAt: Date.now() })
}

export function clearLegalRequired() {
  set({ ...state, legalRequiredAt: null })
}

export function useGateState(): GateState {
  return useSyncExternalStore(
    (listener) => {
      listeners.add(listener)
      return () => listeners.delete(listener)
    },
    () => state,
  )
}
