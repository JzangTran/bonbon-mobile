import { useQuery } from '@tanstack/react-query'
import { useEffect, useRef, useState, type ReactNode } from 'react'
import { AppState, Linking, StyleSheet, View } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { useSession } from '@/entities/session'
import { api, useGateState } from '@/shared/api'
import { secureStorage } from '@/shared/lib/secure-storage'
import { Button, Sheet, Text, spacing, useTheme } from '@/shared/ui'
import { LegalAcceptanceScreen } from './gates/legal-acceptance'
import { MaintenanceScreen } from './gates/maintenance'
import { UpdateRequiredScreen } from './gates/update-required'

const RECHECK_AFTER_BACKGROUND_MS = 10 * 60_000
const RECOVERY_CHECK_MS = 15_000
const UPDATE_PROMPT_KEY = 'bonbon.updatePromptedAt'
const DAY_MS = 24 * 60 * 60_000

/**
 * What can stop the whole app (force-update.md, maintenance-mode.md, accept-legal-documents.md): a version below the server's minimum,
 * full maintenance, or a legal document to accept again. They are layers over the app, which stays mounted underneath. The server config
 * is read at startup and when the app returns from the background after 10 minutes; while blocked it is rechecked every 15 seconds so
 * the app lets the person back in by itself.
 */
export function AppGate({ children }: { children: ReactNode }) {
  const { session } = useSession()
  const gate = useGateState()
  const config = useQuery({
    queryKey: ['app', 'config'],
    staleTime: 0,
    refetchIntervalInBackground: true,
    refetchInterval: (query) => {
      const d = query.state.data
      return d?.updateRequired || (d?.maintenance?.active && d.maintenance.level === 'FULL') ? RECOVERY_CHECK_MS : false
    },
    queryFn: async () => {
      const { data, error } = await api.GET('/api/app/config')
      if (error || !data) throw error
      return data
    },
  })
  const { refetch, dataUpdatedAt } = config

  // Back from the background after a while: look again.
  const leftAt = useRef<number | null>(null)
  useEffect(() => {
    const sub = AppState.addEventListener('change', (next) => {
      if (next === 'active') {
        if (leftAt.current !== null && Date.now() - leftAt.current >= RECHECK_AFTER_BACKGROUND_MS) void refetch()
        leftAt.current = null
      } else if (leftAt.current === null) {
        leftAt.current = Date.now()
      }
    })
    return () => sub.remove()
  }, [refetch])

  const d = config.data
  // A refused call newer than the last answer of the config means the state changed after we last looked.
  const mustUpdate = d?.updateRequired === true || (gate.updateRequiredAt !== null && gate.updateRequiredAt > dataUpdatedAt)
  const fullMaintenance = (d?.maintenance?.active === true && d.maintenance.level === 'FULL') || (gate.maintenanceAt !== null && gate.maintenanceAt > dataUpdatedAt)
  const readOnly = d?.maintenance?.active === true && d.maintenance.level === 'READ_ONLY'

  // The gate itself is refused (426/503) before the config can say why: ask again right away.
  useEffect(() => {
    if (gate.updateRequiredAt !== null || gate.maintenanceAt !== null) void refetch()
  }, [gate.updateRequiredAt, gate.maintenanceAt, refetch])

  return (
    <View style={styles.root}>
      {children}
      {readOnly ? <ReadOnlyBanner message={d?.maintenance?.message} /> : null}
      <UpdatePrompt available={d?.updateAvailable === true && !mustUpdate} storeUrl={d?.storeUrl} message={d?.updateMessage} />
      {session && gate.legalRequiredAt !== null && !mustUpdate && !fullMaintenance ? <LegalAcceptanceScreen /> : null}
      {fullMaintenance && !mustUpdate ? (
        <MaintenanceScreen message={d?.maintenance?.message} endsAt={d?.maintenance?.endsAt} checking={config.isFetching} onRetry={() => void refetch()} />
      ) : null}
      {mustUpdate ? <UpdateRequiredScreen storeUrl={d?.storeUrl} message={d?.updateMessage} /> : null}
    </View>
  )
}

function ReadOnlyBanner({ message }: { message?: string }) {
  const theme = useTheme()
  const insets = useSafeAreaInsets()
  return (
    <View style={[styles.banner, { backgroundColor: theme.warningSubtle, paddingTop: insets.top + spacing.xs }]} pointerEvents="none" accessibilityRole="alert">
      <Text variant="caption" color={theme.onWarningSubtle}>
        Hệ thống đang bảo trì: chỉ xem được, các thao tác ghi sẽ bị từ chối. {message}
      </Text>
    </View>
  )
}

/** A newer version exists but this one still works: a dismissible prompt, at most once a day. */
function UpdatePrompt({ available, storeUrl, message }: { available: boolean; storeUrl?: string; message?: string }) {
  const [visible, setVisible] = useState(false)
  useEffect(() => {
    if (!available) return
    let cancelled = false
    void secureStorage.get(UPDATE_PROMPT_KEY).then((last) => {
      if (cancelled) return
      const elapsed = last ? Date.now() - Number(last) : Infinity
      if (!(elapsed < DAY_MS)) setVisible(true)
    })
    return () => {
      cancelled = true
    }
  }, [available])

  const dismiss = () => {
    setVisible(false)
    void secureStorage.set(UPDATE_PROMPT_KEY, String(Date.now()))
  }

  return (
    <Sheet visible={visible} onClose={dismiss} title="Có phiên bản mới">
      <Text variant="bodySm" muted>
        {message || 'bonbon đã có phiên bản mới với cải tiến và sửa lỗi. Bạn vẫn dùng được phiên bản hiện tại.'}
      </Text>
      {storeUrl ? (
        <Button
          title="Cập nhật"
          onPress={() => {
            void Linking.openURL(storeUrl)
            dismiss()
          }}
        />
      ) : null}
      <Button title="Để sau" variant="ghost" onPress={dismiss} />
    </Sheet>
  )
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  banner: { position: 'absolute', top: 0, left: 0, right: 0, zIndex: 900, paddingHorizontal: spacing.md, paddingBottom: spacing.xs },
})
