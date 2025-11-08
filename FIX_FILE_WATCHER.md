# Fix File Watcher Limit Error

## Problem
You're getting `ENOSPC: System limit for number of file watchers reached` error. This happens when Vite tries to watch too many files.

## Solution 1: Increase System Limit (Recommended)

Run this command in your terminal:

```bash
echo fs.inotify.max_user_watches=524288 | sudo tee -a /etc/sysctl.conf && sudo sysctl -p
```

This will:
- Increase the file watcher limit to 524,288
- Make the change permanent
- Apply it immediately

## Solution 2: Temporary Fix (Until Reboot)

If you can't use sudo, you can set it temporarily:

```bash
sudo sysctl fs.inotify.max_user_watches=524288
```

## Solution 3: Already Fixed in vite.config.ts

I've already updated `vite.config.ts` to ignore the Django venv directory and other unnecessary files. This should help reduce the number of files being watched.

## After Fixing

1. Stop the current `npm run dev` process (Ctrl+C)
2. Restart it:
   ```bash
   npm run dev
   ```

The error should be resolved now!

