# PROJECT HANDOVER & CONTINUATION GUIDE

> **To the next agent:** This is an active project. Read this entire document first. Everything has been designed, reviewed, and signed off. Do not re-brainstorm or alter signed-off architecture. Continue directly from **Current Progress & Next Step** below.

---

## 1. Project Overview & Context

- **Project Name:** `wingfucat`
- **Local Path:** `/home/retro/retroistickx/projects/wingfucat`
- **GitHub Repository:** [https://github.com/Auroristic/wingfucat](https://github.com/Auroristic/wingfucat) (Remote set to `git@github.com:Auroristic/wingfucat.git`, branch `main`).
- **Target Domain:** `wingfu.duckdns.org` (DuckDNS).
- **Target Server:** Ubuntu Minimal 1GB VPS via `ssh nei` (Public IP: `140.245.209.190`, username `ubuntu`).
- **Purpose:** A private, reliable, self-hosted web chat application designed exclusively for a couple (Retro and his partner) to communicate from any device (phone, laptop, public/shared computer) if personal phones break or are lost.

---

## 2. Strict User Rules & Environment Constraints (DO NOT VIOLATE)

1. **Local Filesystem Lockdown:**
   - **NEVER touch or modify any file outside `/home/retro/retroistickx/projects/wingfucat`.**
   - If any changes are needed outside this repo on the local PC, you MUST explicitly ask the user for permission first.
   - Do NOT install packages or run background daemons on the local machine.
2. **Remote VPS Delegation (`ssh nei`):**
   - Use `ssh nei` for ALL dependency installations, builds, database execution, service hosting, and system modifications.
   - Treat `ssh nei` as the dedicated server environment.
3. **Workflow Protocol:**
   - Write and edit code locally inside `/home/retro/retroistickx/projects/wingfucat`.
   - Commit and push to git (`git push origin main`).
   - Pull and execute on `ssh nei` (`ssh nei "cd /opt/wingfucat && git pull ..."`).
4. **Shell Environment:**
   - The user uses `fish` shell locally. Keep commands compatible with `fish`.
5. **System Change Logging:**
   - If any system modification is approved and made on the PC, log it in `~/SYSTEM_CHANGES.md`.

---

## 3. Signed-Off Architecture & Technical Design

### 3.1 Technology Stack
- **Backend:** PocketBase v0.25+ (Single Go static binary, embedded SQLite with WAL mode, built-in REST API, auth, file storage, rate limiting, and Server-Sent Events).
- **Frontend:** React 19 / Vite + Tailwind CSS + PWA (Web App Manifest + Service Worker for standalone mobile install).
- **Reverse Proxy & SSL:** Stock Caddy (installed from standard apt repo on `nei`) with automatic Let's Encrypt / ZeroSSL HTTPS.
- **Process Management:** Single systemd service running PocketBase under an unprivileged user `couplechat`. PocketBase serves the built React static assets directly from `./pb_public`. Total memory footprint: **~35MB - 50MB RAM** (fits easily inside the 1GB VPS).

### 3.2 Security & Access Lockdown
1. **Network Binding:** PocketBase is strictly bound to `127.0.0.1:8090` (localhost only).
2. **Admin UI Lockdown:** Caddy explicitly blocks `/_/*` with a `403 Access Denied`. The admin dashboard is NEVER accessible publicly.
   - To access the admin dashboard: Use an SSH tunnel (`ssh -L 8090:127.0.0.1:8090 nei` -> `http://localhost:8090/_/`).
3. **Registration Closed:** The `users` collection has `Create: null`. Public registration is disabled; only the two couple accounts exist.
4. **Rate Limiting:** Managed natively by PocketBase core (`Settings > Application > Rate Limits`), max 5-10 auth attempts per minute. No custom Caddy plugins needed.
5. **Public Computer / Internet Cafe Session Safety:**
   - "Remember Me" toggle on login is **OFF by default**.
   - When unchecked: Session token is kept in `sessionStorage` only (wiped as soon as the tab/browser is closed).
   - When checked: Token persisted in `localStorage` for trusted personal devices.
   - A prominent **Log Out** button (`logout` icon) is permanently visible in the header for fast, safe exit.
6. **systemd Hardening:**
   - Dedicated user: `couplechat` (created via `useradd -r -s /usr/sbin/nologin couplechat`).
   - Hardened flags: `ProtectSystem=strict`, `ProtectHome=true`, `ReadWritePaths=/opt/couple-chat/pb_data`, `NoNewPrivileges=true`.

### 3.3 Data Model & PocketBase v0.25+ Rules
*Note: Uses `@request.body.*` (v0.23+ syntax) and native `:isset` modifiers:*

```text
Collection: users (Auth Collection)
- Fields: username, email, display_name (string, max 100), avatar (file, max 5MB, image types).
- Rules:
  - List / View: @request.auth.id != ""
  - Create:      null  (Closed to public)
  - Update:      @request.auth.id = id
  - Delete:      null

Collection: messages (Base Collection)
- Fields:
  - sender (relation -> users, required, single)
  - text (string, max 5000)
  - attachment (file, max 26214400 [25MB], mime types: image/jpeg, image/png, image/webp, image/gif, audio/webm, audio/mp4, audio/ogg, audio/aac)
  - media_type (select: "text", "image", "audio", required)
  - duration (number, min 0, seconds for voice notes)
  - read_at (datetime)
  - created (system datetime)
- Rules:
  - List / View: @request.auth.id != ""
  - Create:      @request.auth.id != "" && @request.body.sender = @request.auth.id
  - Update:      @request.auth.id != "" && 
                 @request.auth.id != sender && 
                 @request.body.text:isset = false && 
                 @request.body.sender:isset = false && 
                 @request.body.attachment:isset = false && 
                 @request.body.media_type:isset = false && 
                 @request.body.duration:isset = false
  - Delete:      null

Collection: chat_settings (Base Collection, Singleton)
- Fields:
  - archived_at (text/datetime, default "")
- Rules:
  - List / View: @request.auth.id != ""
  - Update:      @request.auth.id != ""
  - Create / Delete: null
```

### 3.4 Key Features & Logic
1. **Real-time SSE:** Client subscribes via `pb.collection('messages').subscribe('*', callback)` on mount.
2. **Read Receipts:** When recipient views message with window active, client calls `pb.collection('messages').update(id, { read_at: new Date().toISOString() })`. The native update rule ensures only the recipient can perform this, and cannot alter text/sender.
3. **Archive & Restore:**
   - Partner taps "Archive Chat": Sets `chat_settings.archived_at = new Date().toISOString()`.
   - Active view queries: `filter: chatSettings.archived_at ? 'created >= "' + chatSettings.archived_at + '"' : ""` (clears screen for new messages).
   - Archive view queries: `created < chatSettings.archived_at`.
   - "Restore History" button: Sets `chat_settings.archived_at = ""` (instantly restores full history without SQL NULL bugs).
4. **Voice Notes:** Browser `MediaRecorder` API recording `audio/webm;codecs=opus` with timer & waveform preview. Custom inline player with play/pause and scrubber.
5. **Photo Sharing:** Direct image file upload with client-side canvas compression.

### 3.5 UI & Styling Direction (Strictly Enforced)
- **Theme:** Clean, minimal, high-contrast dark-and-white theme.
  - Background: Deep black / charcoal (`bg-black`, `bg-zinc-950`).
  - Cards & Borders: Minimalist dark surfaces (`bg-zinc-900`, `border-zinc-800`).
  - Text: Crisp white (`text-white`) and muted gray (`text-zinc-400`).
  - Message Bubbles: User messages in crisp high-contrast light surface (`bg-zinc-100 text-zinc-950`), partner messages in subtle dark card (`bg-zinc-900 text-zinc-100 border border-zinc-800`).
  - **No saturated couple colors** (pink/indigo bubbles removed).
- **Icons:** **Google Fonts Material Symbols Rounded EXCLUSIVELY.**
  - Loaded via: `<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Material+Symbols+Rounded:opsz,wght,FILL,GRAD@24,400,0,0" />`
  - CSS rule: `.material-symbols-rounded { font-variation-settings: 'FILL' 0, 'wght' 400, 'GRAD' 0, 'opsz' 24; font-family: 'Material Symbols Rounded'; }`
  - **Zero other icon sets** (Lucide forbidden).
  - Used for all UI actions: `send`, `mic`, `image`, `archive`, `unarchive`, `done` (sent), `done_all` (read), `play_arrow`, `pause`, `lock`, `logout`, `close`.

---

## 4. Current Progress & Next Step

### Completed So Far:
- Git repo initialized at `/home/retro/retroistickx/projects/wingfucat` and connected to `git@github.com:Auroristic/wingfucat.git`.
- `.agents/rules/repo_rules.md` created.
- **Task 1 files written and committed:**
  - `backend/package.json`
  - `backend/setup_schema.js` (Automated script to create collections, API rules, and field limits)
  - `backend/seed.js` (Creates default `chat_settings` and partner accounts)
  - `backend/tests/schema_rules.test.js` (Security and tamper verification suite)
  - Commit `635199b` pushed to GitHub `origin/main`.
- Remote server verified via SSH: `ssh nei` (Ubuntu 22.04 LTS, IP `140.245.209.190`).
- DuckDNS subdomain: `wingfu.duckdns.org` (needs to point to `140.245.209.190`).

### NEXT TASK: Task 2 — React Frontend Scaffolding, Typography & PWA
**Files to create:**
- `frontend/package.json` (React 19, Vite, Tailwind CSS, pocketbase SDK)
- `frontend/vite.config.ts`
- `frontend/index.html` (Google Material Symbols Rounded link tag)
- `frontend/src/index.css` (Tailwind + Material Symbols CSS settings)
- `frontend/public/manifest.json` (PWA standalone configuration)
- `frontend/src/lib/pocketbase.ts` (PocketBase client instance)
- `frontend/src/components/Icon.tsx` (Reusable Material Symbols Rounded icon component)
- `frontend/src/components/Icon.test.tsx`

**Remaining Tasks after Task 2:**
- **Task 3:** Authentication & Session State (`AuthContext.tsx`, `LoginView.tsx` with default-unchecked "Remember Me").
- **Task 4:** Real-time Message Thread & Read Receipts (`useMessages.ts`, `MessageThread.tsx`, `MessageBubble.tsx`).
- **Task 5:** Media Attachments (`VoiceRecorder.tsx`, `AudioPlayer.tsx`, `imageCompressor.ts`, `MessageComposer.tsx`).
- **Task 6:** Header, Prominent Logout & Archive/Restore (`Header.tsx`, `ArchiveModal.tsx`).
- **Task 7:** Deployment to `ssh nei` (`deploy/Caddyfile`, `deploy/couple-chat.service`, `deploy/backup-sync.sh`, `deploy/setup.sh`).

---

## 5. Deployment Quick Reference (for Task 7)

### Caddyfile (`/etc/caddy/Caddyfile` on `nei`):
```caddy
wingfu.duckdns.org {
    # Block public access to PocketBase Admin Dashboard
    handle /_/* {
        respond "Access denied" 403
    }

    # Reverse proxy app & realtime SSE
    reverse_proxy 127.0.0.1:8090 {
        flush_interval -1
    }
}
```

### Systemd Service (`/etc/systemd/system/couple-chat.service` on `nei`):
```ini
[Unit]
Description=Couple Chat PocketBase Service
After=network.target

[Service]
Type=simple
User=couplechat
Group=couplechat
WorkingDirectory=/opt/couple-chat
ExecStart=/opt/couple-chat/pocketbase serve --http=127.0.0.1:8090
Restart=always
RestartSec=5

ProtectSystem=strict
ProtectHome=true
ReadWritePaths=/opt/couple-chat/pb_data
PrivateTmp=true
NoNewPrivileges=true

[Install]
WantedBy=multi-user.target
```
