try {
  await import('./dist/server.js');
} catch (error) {
  if (error?.code === 'ERR_MODULE_NOT_FOUND') {
    console.error('Missing backend build output. Run `npm run build` in the `server` directory before starting the cPanel application.');
    process.exit(1);
  }

  throw error;
}
