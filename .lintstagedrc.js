module.exports = {
  '*.{json,md,css}': ['prettier --write', 'git add'],
  '*.{js,jsx}': ['prettier --write', 'eslint --fix', 'git add'],
}
