/// <reference types="jest" />
// Component tests of the UI kit (src/shared/ui/__tests__). Safe-area insets come from the library's own mock.
import mockSafeAreaContext from 'react-native-safe-area-context/jest/mock'

jest.mock('react-native-safe-area-context', () => mockSafeAreaContext)
