export default {
  root: true,
  extends: ['next', 'next/core-web-vitals', 'prettier'],
  parserOptions: {
    ecmaVersion: 2022,
    sourceType: 'module',
  },
  rules: {
    // Add custom rules here
    '@next/next/no-html-link-for-pages': 'off',
    'react/react-in-jsx-scope': 'off',
  },
};