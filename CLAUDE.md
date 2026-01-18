# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Psic-Gestor is a patient management system for psychologists (psicólogos) and aestheticians (esteticistas). It's a React SPA with Supabase backend, featuring appointment scheduling, patient records, payments, and WhatsApp integration via Evolution API.

## Development Commands

```bash
npm run dev      # Start Vite dev server (localhost:5173)
npm run build    # Production build + copy .htaccess to dist/
npm run preview  # Preview production build
```

## Tech Stack

- **Frontend**: React 18, React Router 6, Tailwind CSS
- **Backend**: Supabase (auth, database, realtime, edge functions)
- **Build**: Vite
- **Icons**: Lucide React
- **Date handling**: date-fns with ptBR locale

## Architecture

### Domain Detection
The app serves two domains (`psicgestor` and `esteticgestor`) from the same codebase. The `useDomainDetection` hook (`src/hooks/useDomainDetection.js`) determines the system type based on hostname, affecting UI and terminology.

### Authentication Flow
- `AuthContext` (`src/contexts/AuthContext.jsx`) manages auth state via Supabase
- User profiles stored in `profiles` table with roles: `admin_master`, `psicologo`, `esteticista`
- `ProtectedRoute` component guards routes, with optional `requireAdmin` prop

### WhatsApp Integration
The app integrates with Evolution API for WhatsApp messaging:

1. **Edge Function Proxy** (`supabase/functions/whatsapp-proxy/`): Authenticates requests and proxies to Evolution API
2. **WhatsApp Service** (`src/services/whatsappService.ts`): Client-side API for instance management, QR codes, messaging
3. **Monitor Service** (`src/services/whatsappMonitorService.ts`): Real-time connection monitoring with toast notifications
4. **Types** (`src/types/whatsapp.ts`): TypeScript interfaces for WhatsApp data

Key pattern: WhatsApp instances are stored in `whatsapp_instances` table, linked to `psicologo_id`. Disconnection events trigger automatic instance cleanup and user notifications.

### Contexts
- `AuthContext`: User auth state, profile, role helpers
- `ToastContext`: Toast notifications (success/error/info)
- `NotificationContext`: App-wide notification system

### Notification System
`notificationService.ts` sends patient notifications via n8n webhook with Basic Auth. Generates session confirmation tokens and URLs.

## Environment Variables

Required in `.env`:
```
VITE_SUPABASE_URL=<supabase-url>
VITE_SUPABASE_ANON_KEY=<supabase-anon-key>
```

## Deployment

Deploy to Hostinger (Apache):
1. `npm run build` - builds to `dist/` with `.htaccess`
2. Upload all `dist/` contents to `public_html/`
3. The `.htaccess` handles SPA routing redirects

For subdirectory deployment, set `base` in `vite.config.js`.

## Database Schema Notes

- `profiles`: User profiles linked to Supabase auth
- `pacientes`: Patient records (linked to psicologo_id)
- `sessoes_agendadas`: Scheduled sessions with recurrence support
- `whatsapp_instances`: WhatsApp connection state per psychologist
- `notifications`: User notifications (including WhatsApp disconnect alerts)

RLS (Row Level Security) is enforced. Some operations use RPC functions with `SECURITY DEFINER` to bypass RLS (e.g., `get_evolution_api_config`, `get_webhook_url`).
