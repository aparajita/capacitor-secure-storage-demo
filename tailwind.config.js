module.exports = {
  purge: {
    mode: 'layers',
    layers: ['utilities'],
    content: ['./src/**/*.html', './src/**/*.vue']
  },
  darkMode: false, // or 'media' or 'class'
  theme: {
    extend: {
      width: {
        fit: 'fit-content'
      }
    }
  },
  variants: {
    extend: {}
  },
  plugins: []
}
