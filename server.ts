import express, { Request, Response, NextFunction } from 'express';
import { createServer as createViteServer } from 'vite';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const PORT = 3000;

  // API routes go here
  app.get('/api/health', (req: Request, res: Response) => {
    res.json({ status: 'ok' });
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { 
        middlewareMode: true,
        hmr: false // HMR is disabled by platform
      },
      appType: 'spa',
    });
    app.use(vite.middlewares);
    
    // Explicit SPA fallback for development
    app.use('*', async (req: Request, res: Response, next: NextFunction) => {
      const url = req.originalUrl;
      
      // Skip if it looks like a file request (has an extension)
      if (url.includes('.') && !url.endsWith('.html')) {
        return next();
      }

      try {
        const fs = await import('fs');
        const templatePath = path.resolve(__dirname, 'index.html');
        if (!fs.existsSync(templatePath)) {
          return res.status(404).send('index.html not found');
        }
        let template = fs.readFileSync(templatePath, 'utf-8');
        template = await vite.transformIndexHtml(url, template);
        res.status(200).set({ 'Content-Type': 'text/html' }).end(template);
      } catch (e) {
        vite.ssrFixStacktrace(e as Error);
        next(e);
      }
    });
  } else {
    // Production serving
    app.use(express.static(path.join(__dirname, 'dist')));
    app.get('*', (req: Request, res: Response) => {
      res.sendFile(path.join(__dirname, 'dist', 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
