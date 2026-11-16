import WebLoginScreen from '@/screens/web-login'

/** A dual-role identity can confirm from its customer session too; the backend checks the seller role. */
export default function CustomerWebLoginRoute() {
  return <WebLoginScreen home="/customer" />
}
