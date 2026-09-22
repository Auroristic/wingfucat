import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { execFileSync, spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const deployDir = path.resolve(__dirname, '..');

describe('Task 7: Production Deployment Configuration Tests', () => {
  const caddyfilePath = path.join(deployDir, 'Caddyfile');
  const servicePath = path.join(deployDir, 'couple-chat.service');
  const backupSyncPath = path.join(deployDir, 'backup-sync.sh');
  const setupPath = path.join(deployDir, 'setup.sh');

  describe('Caddyfile', () => {
    it('should exist', () => {
      assert.ok(fs.existsSync(caddyfilePath), 'Caddyfile should exist');
    });

    it('should target wingfu.duckdns.org with environment override', () => {
      const content = fs.readFileSync(caddyfilePath, 'utf-8');
      assert.match(content, /\{\$DOMAIN:wingfu\.duckdns\.org\}/, 'Should define domain with fallback');
    });

    it('should block public access to PocketBase admin dashboard with 403', () => {
      const content = fs.readFileSync(caddyfilePath, 'utf-8');
      assert.match(content, /handle\s+\/_\/\*\s*\{[^}]*respond\s+"Access denied"\s+403/s, 'Should block /_/* with 403');
    });

    it('should reverse proxy to 127.0.0.1:8090 with flush_interval -1 for SSE', () => {
      const content = fs.readFileSync(caddyfilePath, 'utf-8');
      assert.match(content, /reverse_proxy\s+127\.0\.0\.1:8090\s*\{[^}]*flush_interval\s+-1/s, 'Should reverse proxy with flush_interval -1');
    });
  });

  describe('Systemd Service (couple-chat.service)', () => {
    it('should exist', () => {
      assert.ok(fs.existsSync(servicePath), 'couple-chat.service should exist');
    });

    it('should configure unit metadata and network dependency', () => {
      const content = fs.readFileSync(servicePath, 'utf-8');
      assert.match(content, /\[Unit\]/);
      assert.match(content, /Description=Couple Chat PocketBase Service/);
      assert.match(content, /After=network\.target/);
      assert.match(content, /\[Install\]/);
      assert.match(content, /WantedBy=multi-user\.target/);
    });

    it('should configure unprivileged user and service execution parameters', () => {
      const content = fs.readFileSync(servicePath, 'utf-8');
      assert.match(content, /User=couplechat/);
      assert.match(content, /Group=couplechat/);
      assert.match(content, /WorkingDirectory=\/opt\/couple-chat/);
      assert.match(content, /ExecStart=\/opt\/couple-chat\/pocketbase\s+serve\s+--http=127\.0\.0\.1:8090/);
      assert.match(content, /Restart=always/);
      assert.match(content, /RestartSec=5/);
    });

    it('should configure all required security hardening sandboxing flags', () => {
      const content = fs.readFileSync(servicePath, 'utf-8');
      assert.match(content, /ProtectSystem=strict/, 'ProtectSystem=strict must be set');
      assert.match(content, /ProtectHome=true/, 'ProtectHome=true must be set');
      assert.match(content, /ReadWritePaths=\/opt\/couple-chat\/pb_data/, 'ReadWritePaths must be limited to pb_data');
      assert.match(content, /PrivateTmp=true/, 'PrivateTmp=true must be set');
      assert.match(content, /NoNewPrivileges=true/, 'NoNewPrivileges=true must be set');
    });
  });

  describe('Backup Sync Script (backup-sync.sh)', () => {
    it('should exist and be executable', () => {
      assert.ok(fs.existsSync(backupSyncPath), 'backup-sync.sh should exist');
      fs.accessSync(backupSyncPath, fs.constants.X_OK);
    });

    it('should pass bash -n syntax validation', () => {
      const result = execFileSync('bash', ['-n', backupSyncPath], { encoding: 'utf-8' });
      assert.strictEqual(result, '');
    });

    it('should read from PocketBase pb_data/backups directory and sync off-box', () => {
      const content = fs.readFileSync(backupSyncPath, 'utf-8');
      assert.match(content, /pb_data\/backups/, 'Should reference pb_data/backups');
      assert.ok(/rsync|scp/.test(content), 'Should use rsync or scp for off-box sync');
      assert.match(content, /set -euo pipefail/, 'Should use bash strict error handling');
    });

    it('should fail with exit code 1 when REMOTE_TARGET is missing', () => {
      const res = spawnSync('bash', [backupSyncPath], {
        env: { ...process.env, REMOTE_TARGET: '' },
        encoding: 'utf-8',
      });
      assert.strictEqual(res.status, 1);
      assert.match(res.stderr, /Remote target destination not specified/);
    });

    it('should fail with exit code 1 when backup directory does not exist', () => {
      const res = spawnSync('bash', [backupSyncPath, 'user@remote:/backups'], {
        env: { ...process.env, BACKUP_DIR: '/nonexistent/path/for/test' },
        encoding: 'utf-8',
      });
      assert.strictEqual(res.status, 1);
      assert.match(res.stderr, /does not exist/);
    });

    it('should fail with exit code 1 when no backup archives are present', () => {
      const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'backup-test-'));
      try {
        const res = spawnSync('bash', [backupSyncPath, 'user@remote:/backups'], {
          env: { ...process.env, BACKUP_DIR: tempDir },
          encoding: 'utf-8',
        });
        assert.strictEqual(res.status, 1);
        assert.match(res.stderr, /No backup archives \(\*\.zip\) found/);
      } finally {
        fs.rmSync(tempDir, { recursive: true, force: true });
      }
    });

    it('should select the latest archive when multiple backups exist', () => {
      const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'backup-test-multi-'));
      try {
        const oldFile = path.join(tempDir, 'backup_2026_01_01.zip');
        const newFile = path.join(tempDir, 'backup_2026_09_22.zip');
        fs.writeFileSync(oldFile, 'old backup');
        // Give 100ms gap and set mtime
        fs.utimesSync(oldFile, new Date(Date.now() - 10000), new Date(Date.now() - 10000));
        fs.writeFileSync(newFile, 'new backup');

        // Test with a mock sync command using mock script in a custom PATH or simple dry run
        const res = spawnSync('bash', [backupSyncPath, 'dummy-target'], {
          env: {
            ...process.env,
            BACKUP_DIR: tempDir,
            DRY_RUN: '1',
          },
          encoding: 'utf-8',
        });
        assert.strictEqual(res.status, 0);
        assert.match(res.stdout, /Found latest backup archive: .*backup_2026_09_22\.zip/);
        assert.match(res.stdout, /Off-box backup sync completed successfully/);
      } finally {
        fs.rmSync(tempDir, { recursive: true, force: true });
      }
    });
  });

  describe('Setup Script (setup.sh)', () => {
    it('should exist and be executable', () => {
      assert.ok(fs.existsSync(setupPath), 'setup.sh should exist');
      fs.accessSync(setupPath, fs.constants.X_OK);
    });

    it('should pass bash -n syntax validation', () => {
      const result = execFileSync('bash', ['-n', setupPath], { encoding: 'utf-8' });
      assert.strictEqual(result, '');
    });

    it('should contain all required deployment provisions for Ubuntu 22.04', () => {
      const content = fs.readFileSync(setupPath, 'utf-8');
      assert.match(content, /set -euo pipefail/, 'Should use bash strict error handling');
      assert.match(content, /useradd -r -s \/usr\/sbin\/nologin couplechat/, 'Must create couplechat unprivileged user');
      assert.match(content, /\/opt\/couple-chat\/pb_data/, 'Must set up pb_data directory');
      assert.match(content, /\/opt\/couple-chat\/pb_public/, 'Must set up pb_public directory');
      assert.match(content, /pocketbase_.*linux_amd64\.zip/, 'Must download PocketBase Linux amd64 archive');
      assert.match(content, /couple-chat\.service/, 'Must configure couple-chat systemd service');
      assert.match(content, /Caddyfile/, 'Must configure Caddy web server');
    });

    it('should fail with exit code 1 when executed by non-root user', () => {
      // Running setup.sh as non-root user must be safely rejected immediately
      const res = spawnSync('bash', [setupPath], { encoding: 'utf-8' });
      assert.strictEqual(res.status, 1);
      assert.match(res.stderr, /must be run as root/);
    });
  });
});
