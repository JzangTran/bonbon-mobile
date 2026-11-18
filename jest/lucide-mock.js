// lucide-react-native ships ES modules only; in component tests an icon is an empty view named after the icon.
const React = require('react')
const { View } = require('react-native')

module.exports = new Proxy(
  { __esModule: true },
  {
    get(target, name) {
      if (name in target) return target[name]
      const Icon = (props) => React.createElement(View, { testID: `icon-${String(name)}`, ...props })
      Icon.displayName = String(name)
      return Icon
    },
  },
)
