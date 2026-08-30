export const authConfig = {
  jwt: {
    secret: process.env.JWT_SECRET || 'brotherhood_secret_key_2026_super_safe',
    expiresIn: '7d',
  },
};