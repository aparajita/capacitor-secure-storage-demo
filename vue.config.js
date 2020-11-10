const ENV_VARS = {
  WS_BIOMETRIC_AUTH_PASSPHRASE: String
}

function addEnvironmentVars(config) {
  // Pass some process.env vars to Vue
  config.plugin('define').tap((args) => {
    const [defines] = args

    if (!defines['process.env']) {
      defines['process.env'] = {}
    }

    const env = defines['process.env']

    Object.entries(ENV_VARS).forEach(([name, type]) => {
      const value = process.env[name]

      if (value !== undefined) {
        if (type === String) {
          env[name] = `"${value}"`
        } else {
          env[name] = value
        }
      }
    })

    return args
  })
}

module.exports = {
  chainWebpack: (config) => {
    addEnvironmentVars(config)
  }
}
