---
name: vercel
description: Deploy, monitor, and configure Vercel projects. Use when the user says "deploy", "deploy to Vercel", "push to production", "deploy my app", "go live", "show logs", "check logs", "vercel logs", "set up Vercel", "configure Vercel", "link to Vercel", or "vercel init".
---

# Vercel Integration

## Deploy

### Prerequisites Check

```bash
vercel --version
vercel whoami
```

If not installed: `npm install -g vercel`
If not logged in: `vercel login`

### Production Deployment

```bash
vercel --prod
```

### Preview Deployment

```bash
vercel
```

### After Deployment

- Display the deployment URL
- Show build status
- Mention `vercel logs <url>` for debugging if needed

## Logs

### List Deployments

```bash
vercel ls
```

### View Logs

```bash
vercel logs <deployment-url>
```

**Follow logs in real-time:**

```bash
vercel logs <deployment-url> --follow
```

### Analyze

- Look for errors or warnings
- Check for failed function invocations
- Identify build failures

## Setup

### Install CLI

```bash
npm install -g vercel
```

### Authenticate

```bash
vercel login
```

### Link Project

```bash
vercel link
```

### Environment Variables

```bash
vercel env ls
vercel env add <NAME>
```

### Configuration

Check for `vercel.json` and `.vercelignore` files.
