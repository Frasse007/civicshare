// Runs before every test file, before any app module is imported.
// Tests use their own database so they can freely wipe and reseed data.
process.env.NODE_ENV = 'test';
process.env.DATABASE_URL = process.env.TEST_DATABASE_URL || 'postgres://civic:civic@localhost:5432/civicshare_test';
process.env.JWT_SECRET = 'test-secret-test-secret-test-secret';
process.env.JWT_EXPIRES_HOURS = '2';
process.env.CORS_ORIGINS = 'http://localhost:5173';
process.env.COOKIE_SAMESITE = 'lax';
