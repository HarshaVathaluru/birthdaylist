let app;
try {
  app = require('../server');
} catch (err) {
  console.error('[Vercel Boot Error]:', err);
  app = (req, res) => {
    res.status(500).json({
      error: 'Vercel Serverless Boot Error',
      message: err.message,
      details: 'Check Vercel Runtime Logs for full stack trace'
    });
  };
}

module.exports = app;

