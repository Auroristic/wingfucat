# Wingfucat Repository Development & Environment Rules

## 1. Local Filesystem Boundary
- **Never touch or modify anything outside this repository folder** (`/home/retro/retroistickx/projects/wingfucat`).
- If any changes are needed outside this repo (editing system files, installing packages, or anything on the local machine), you MUST explicitly ask the user for permission first.

## 2. Server Environment Delegation (`ssh nei`)
- Use the remote VPS host `ssh nei` for ALL dependency installations, builds, database execution, service hosting, and system modifications.
- Treat `ssh nei` as the dedicated server environment.
- Do NOT install server packages, background daemons, or runtime services on the local PC.

## 3. Workflow Protocol
- Write and edit code locally inside this repository.
- Commit and push to git (`git push origin main`).
- Pull and execute on `ssh nei` (`ssh nei "cd /opt/wingfucat && git pull ..."`).
