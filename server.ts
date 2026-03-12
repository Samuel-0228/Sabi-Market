import express, { Request, Response, NextFunction } from 'express';
import { createServer as createViteServer } from 'vite';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';
import webpush from 'web-push';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// VAPID keys should be generated once and stored in environment variables
const vapidKeys = {
  publicKey: process.env.VAPID_PUBLIC_KEY || 'BJ6_v_Y_z-o_X_Y_z-o_X_Y_z-o_X_Y_z-o_X_Y_z-o_X_Y_z-o_X_Y_z-o_X_Y_z-o_X_Y_z-o_X_Y_z-o',
  privateKey: process.env.VAPID_PRIVATE_KEY || ''
};

if (vapidKeys.publicKey && vapidKeys.privateKey) {
  webpush.setVapidDetails(
    'mailto:support@savvymarket.aau',
    vapidKeys.publicKey,
    vapidKeys.privateKey
  );
}

async function startServer() {
  const app = express();
  app.use(express.json());
  const PORT = 3000;

  // API routes
  app.get('/api/health', (_req: Request, res: Response) => {
    res.json({ status: 'ok' });
  });

  app.post('/api/notifications/send', async (req: Request, res: Response) => {
    const { subscription, title, body, url } = req.body;

    if (!subscription) {
      return res.status(400).json({ error: 'Subscription is required' });
    }

    try {
      const payload = JSON.stringify({ title, body, url });
      await webpush.sendNotification(JSON.parse(subscription), payload);
      res.json({ success: true });
    } catch (error) {
      console.error('Error sending push notification:', error);
      res.status(500).json({ error: 'Failed to send notification' });
    }
  });

  app.get('/auth/callback', (_req: Request, res: Response) => {
    res.send(`
      <html>
        <body>
          <script>
            if (window.opener) {
              window.opener.postMessage({ type: 'OAUTH_AUTH_SUCCESS' }, '*');
              window.close();
            } else {
              window.location.href = '/';
            }
          </script>
          <p>Authentication successful. This window should close automatically.</p>
        </body>
      </html>
    `);
  });

  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { 
        middlewareMode: true,
        hmr: false,
        watch: {
          usePolling: true,
          interval: 100
        }
      },
      appType: 'spa',
    });
    
    app.use(vite.middlewares);
    
    app.get('*', async (req: Request, res: Response, next: NextFunction) => {
      const url = req.originalUrl;
      console.log(`[Savvy Server] GET ${url}`);
      
      try {
        // Serve index.html for all GET requests that reach here
        const templatePath = path.join(process.cwd(), 'index.html');
        if (!fs.existsSync(templatePath)) {
          console.error(`[Savvy Server] index.html not found at ${templatePath}`);
          return next();
        }
        let template = fs.readFileSync(templatePath, 'utf-8');
        template = await vite.transformIndexHtml(url, template);
        res.status(200).set({ 'Content-Type': 'text/html' }).end(template);
      } catch (e) {
        console.error(`[Savvy Server] Error serving index.html:`, e);
        vite.ssrFixStacktrace(e as Error);
        next(e);
      }
    });
  } else {
    const distPath = path.join(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req: Request, res: Response) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`> Savvy Server listening on port ${PORT}`);
  });
}

startServer().catch(err => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
