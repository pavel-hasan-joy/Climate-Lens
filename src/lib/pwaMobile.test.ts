import { describe, expect, it } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';
import { en } from './i18n/en';
import { bn } from './i18n/bn';

describe('PWA & Mobile Navigation Suite', () => {
  it('validates manifest.webmanifest exists and contains proper PWA install fields', () => {
    const manifestPath = path.resolve(__dirname, '../../public/manifest.webmanifest');
    expect(fs.existsSync(manifestPath)).toBe(true);

    const content = JSON.parse(fs.readFileSync(manifestPath, 'utf-8'));
    expect(content.name).toContain('Climate Lens');
    expect(content.short_name).toBe('ClimateLens');
    expect(content.display).toBe('standalone');
    expect(content.start_url).toBe('/');
    expect(content.theme_color).toBe('#0b0f19');
    expect(content.background_color).toBe('#0b0f19');

    // Verify icons
    expect(Array.isArray(content.icons)).toBe(true);
    expect(content.icons.length).toBeGreaterThanOrEqual(3);

    const sizes = content.icons.map((ic: { sizes: string }) => ic.sizes);
    expect(sizes).toContain('any');
    expect(sizes).toContain('192x192');
    expect(sizes).toContain('512x512');
  });

  it('validates PWA icon binary files exist in public directory', () => {
    const publicDir = path.resolve(__dirname, '../../public');
    expect(fs.existsSync(path.join(publicDir, 'icon.svg'))).toBe(true);
    expect(fs.existsSync(path.join(publicDir, 'icon-192.png'))).toBe(true);
    expect(fs.existsSync(path.join(publicDir, 'icon-512.png'))).toBe(true);
    expect(fs.existsSync(path.join(publicDir, 'apple-touch-icon.png'))).toBe(true);
  });

  it('validates service worker file exists and caches PWA assets', () => {
    const swPath = path.resolve(__dirname, '../../public/sw.js');
    expect(fs.existsSync(swPath)).toBe(true);

    const swContent = fs.readFileSync(swPath, 'utf-8');
    expect(swContent).toContain('/manifest.webmanifest');
    expect(swContent).toContain('/icon-192.png');
    expect(swContent).toContain('/icon-512.png');
  });

  it('validates index.html contains mobile viewport-fit and Apple touch meta tags', () => {
    const indexPath = path.resolve(__dirname, '../../index.html');
    const indexContent = fs.readFileSync(indexPath, 'utf-8');
    expect(indexContent).toContain('viewport-fit=cover');
    expect(indexContent).toContain('apple-mobile-web-app-capable');
    expect(indexContent).toContain('apple-mobile-web-app-status-bar-style');
    expect(indexContent).toContain('apple-touch-icon');
  });

  it('validates mobileNav translation keys completeness between EN and BN', () => {
    expect(en.mobileNav).toBeDefined();
    expect(bn.mobileNav).toBeDefined();

    const enKeys = Object.keys(en.mobileNav).sort();
    const bnKeys = Object.keys(bn.mobileNav).sort();

    expect(enKeys).toEqual(bnKeys);
    expect(bn.mobileNav.map).toBe('ম্যাপ');
    expect(bn.mobileNav.districts).toBe('জেলাসমূহ');
    expect(bn.mobileNav.details).toBe('বিশ্লেষণ');
    expect(bn.mobileNav.more).toBe('মেনু');
    expect(bn.mobileNav.layers).toBe('লেয়ার ও লেজেন্ড');
  });
});
