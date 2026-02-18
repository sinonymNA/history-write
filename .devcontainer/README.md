# GitHub Codespaces Development Environment

This directory contains the configuration for running HistoryWrite in GitHub Codespaces.

## Quick Start with Codespaces

### Option 1: Launch from GitHub Web
1. Go to your GitHub repository
2. Click **Code** → **Codespaces** → **Create codespace on main**
3. Wait for the Codespace to build (2-3 minutes)
4. Terminal will automatically run `npm install`
5. Once ready, run: `npm run dev`
6. Vite will open the dev server at `http://localhost:5173`

### Option 2: Launch from Command Line
```bash
gh codespace create --repo sinonymNA/history-write
gh codespace code -r sinonymNA/history-write
```

## Configuration

The `devcontainer.json` includes:

- **Node.js 20** - Latest stable Node runtime
- **Port 5173** - Vite dev server (auto-forwarded)
- **VS Code Extensions**:
  - ESLint - JavaScript linting
  - Prettier - Code formatting
  - Tailwind CSS IntelliSense
  - React snippets
  - Firebase tools
- **Auto Commands**:
  - `npm install` runs on Codespace creation
  - Success message on startup

## Environment Variables

Before running `npm run dev`, you must add your Firebase credentials:

1. Create `.env` file in the root directory:
   ```bash
   cp .env.example .env
   ```

2. Add your Firebase project credentials from [Firebase Console](https://console.firebase.google.com/):
   ```
   VITE_FIREBASE_API_KEY=your_key_here
   VITE_FIREBASE_AUTH_DOMAIN=your_domain_here
   VITE_FIREBASE_PROJECT_ID=your_project_id
   VITE_FIREBASE_STORAGE_BUCKET=your_bucket_here
   VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
   VITE_FIREBASE_APP_ID=your_app_id
   ```

## Running the Development Server

```bash
npm run dev
```

This starts the Vite development server on port 5173. The port is automatically forwarded in Codespaces, so you can access it via:
- Click the **Ports** tab in the terminal
- Or use the browser preview that appears

## Building for Production

```bash
npm run build
```

Output goes to `/dist` directory.

## Stopping/Deleting Codespaces

- **Stop**: `gh codespace stop`
- **Delete**: `gh codespace delete`

You can also manage Codespaces from [GitHub.com → Settings → Codespaces](https://github.com/settings/codespaces)

## Troubleshooting

### Port Already in Use
If port 5173 is already in use, Vite will automatically use the next available port.

### Module Not Found
If you see module errors, run:
```bash
npm install
```

### Firebase Connection Issues
- Verify `.env` file has correct credentials
- Check Firebase project allows web app access
- Ensure Firestore database is created and rules are set to allow read/write

### Slow Performance
Codespaces with 2 CPU cores is sufficient. If experiencing lag:
- Clear browser cache
- Restart the dev server
- Try a larger Codespace instance

## Resources

- [GitHub Codespaces Documentation](https://docs.github.com/en/codespaces)
- [Dev Containers Documentation](https://containers.dev/)
- [Firebase Documentation](https://firebase.google.com/docs)
- [Vite Documentation](https://vitejs.dev/)
