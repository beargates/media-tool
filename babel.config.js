module.exports = {
  presets: [
    [
      '@babel/preset-env',
      {
        targets: {node: '10'},
        useBuiltIns: 'entry',
        corejs: {version: 3, proposals: true},
        loose: true,
      },
    ],
  ],
  plugins: [
    ['@babel/plugin-proposal-class-properties', {loose: true}],
    ['@babel/plugin-proposal-optional-chaining', {loose: true}],
    // ["@babel/plugin-proposal-decorators", {"legacy": true}]
  ],
  parserOpts: {
    allowReturnOutsideFunction: true,
  },
}
