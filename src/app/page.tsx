"use client";

import { Navbar } from "@/components/navbar";
import { AsanaIcon } from "@/components/ui/asana-icon";
import { AtlassianIcon } from "@/components/ui/atlassian-icon";
import { CanvaIcon } from "@/components/ui/canva-icon";
import { ClaudeIcon } from "@/components/ui/claude-icon";
import { DiscordIcon } from "@/components/ui/discord-icon";
import { GeminiIcon } from "@/components/ui/gemini-icon";
import { GithubIcon } from "@/components/ui/github-icon";
import { GlobalIcon } from "@/components/ui/global-icon";
import { GoogleIcon } from "@/components/ui/google-icon";
import { GrokIcon } from "@/components/ui/grok-icon";
import { LinearIcon } from "@/components/ui/linear-icon";
import { MicrosoftIcon } from "@/components/ui/microsoft-icon";
import { NeonIcon } from "@/components/ui/neon-icon";
import { NotionIcon } from "@/components/ui/notion-icon";
import { OllamaIcon } from "@/components/ui/ollama-icon";
import { OpenRouterIcon } from "@/components/ui/open-router-icon";
import { PaypalIcon } from "@/components/ui/paypal-icon";
import { PlaywrightIcon } from "@/components/ui/playwright-icon";
import { StripeIcon } from "@/components/ui/stripe-icon";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { WriteIcon } from "@/components/ui/write-icon";
import { authClient } from "lib/auth/client";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";

export const dynamic = "force-dynamic";

const css = `
  /* ── Scoped reset ── */
  .lp *, .lp *::before, .lp *::after { box-sizing: border-box; }

  /* ── Root ── */
  .lp {
    font-family: var(--font-geist-sans), ui-sans-serif, system-ui, sans-serif;
    background: var(--background);
    color: var(--foreground);
    min-height: 100dvh;
    overflow-x: hidden;
    -webkit-font-smoothing: antialiased;
    -moz-osx-font-smoothing: grayscale;
    font-size: 14px;
    line-height: 1.5;
  }

  /* ── Keyframes ── */
  @keyframes lp-fade-down {
    from { opacity: 0; transform: translateY(-8px); }
    to   { opacity: 1; transform: translateY(0); }
  }
  @keyframes lp-fade-up {
    from { opacity: 0; transform: translateY(20px); }
    to   { opacity: 1; transform: translateY(0); }
  }
  @keyframes lp-pulse {
    0%, 100% { opacity: 1; }
    50%       { opacity: 0.3; }
  }
  @keyframes lp-marquee {
    from { transform: translateX(0); }
    to   { transform: translateX(-50%); }
  }

  /* ── Scroll reveal ── */
  .lp-reveal {
    opacity: 0;
    transform: translateY(20px);
    transition: opacity 0.6s ease, transform 0.6s ease;
  }
  .lp-reveal.lp-visible {
    opacity: 1;
    transform: translateY(0);
  }

  /* ════════════════════════════════════
     HERO
     nav height = 66px (from NavFlowPro navHeight prop)
  ════════════════════════════════════ */
  .lp-hero {
    min-height: 94dvh;
    display: flex; flex-direction: column;
    align-items: center; justify-content: center;
    /* 66px nav + 72px clearance */
    padding: calc(66px + 72px) 40px 80px;
    text-align: center; position: relative;
  }

  /* Radial glow — increased opacity so it reads in dark mode */
  .lp-hero::before {
    content: '';
    position: absolute; top: 0; left: 50%; transform: translateX(-50%);
    width: min(900px, 100%); height: 55%;
    background: radial-gradient(ellipse at 50% 0%,
      color-mix(in oklch, var(--primary) 13%, transparent) 0%,
      transparent 62%);
    pointer-events: none;
  }

  /* Gradient separator at section bottom */
  .lp-hero::after {
    content: '';
    position: absolute; bottom: 0; left: 8%; right: 8%;
    height: 1px;
    background: linear-gradient(90deg,
      transparent 0%, var(--border) 25%,
      var(--border) 75%, transparent 100%);
  }

  .lp-hero-badge {
    display: inline-flex; align-items: center; gap: 7px;
    padding: 5px 14px; border-radius: 9999px;
    border: 1px solid var(--border); background: var(--card);
    font-size: 11px; font-weight: 500; letter-spacing: 0.08em; text-transform: uppercase;
    color: var(--muted-foreground);
    margin-bottom: 36px;
    animation: lp-fade-up 0.5s 0.05s ease both;
    position: relative; z-index: 1;
  }
  .lp-hero-badge-dot {
    width: 6px; height: 6px; border-radius: 50%;
    background: var(--primary);
    animation: lp-pulse 2.2s ease infinite;
  }

  .lp-hero-title {
    font-family: 'Instrument Serif', var(--font-geist-sans), serif;
    font-size: clamp(46px, 6.8vw, 88px);
    font-weight: 400; line-height: 1.02; letter-spacing: -0.038em;
    color: var(--foreground); max-width: 840px;
    animation: lp-fade-up 0.5s 0.12s ease both;
    position: relative; z-index: 1;
  }
  .lp-hero-title em { font-style: italic; color: var(--primary); }

  .lp-hero-sub {
    margin-top: 24px;
    font-size: 16px; font-weight: 400; line-height: 1.72;
    color: var(--muted-foreground); max-width: 460px;
    animation: lp-fade-up 0.5s 0.2s ease both;
    position: relative; z-index: 1;
  }

  .lp-hero-actions {
    display: flex; gap: 10px; flex-wrap: wrap; justify-content: center;
    margin-top: 40px;
    animation: lp-fade-up 0.5s 0.28s ease both;
    position: relative; z-index: 1;
  }

  /* ── Buttons ── */
  .lp-btn-primary {
    display: inline-flex; align-items: center; gap: 7px;
    padding: 11px 22px; border-radius: var(--radius, 10px);
    font-size: 14px; font-weight: 500;
    background: var(--primary); color: var(--primary-foreground);
    text-decoration: none;
    border: 1px solid color-mix(in oklch, var(--primary) 76%, black 24%);
    box-shadow: 0 1px 4px oklch(0 0 0 / 0.12), 0 0 0 0 color-mix(in oklch, var(--primary) 30%, transparent);
    transition: opacity 0.15s, transform 0.15s, box-shadow 0.15s;
    position: relative; overflow: hidden;
  }
  .lp-btn-primary::before {
    content: '';
    position: absolute; inset: 0;
    background: linear-gradient(180deg, rgba(255,255,255,0.06) 0%, transparent 60%);
    pointer-events: none;
  }
  .lp-btn-primary:hover {
    opacity: 0.88; transform: translateY(-1px);
    box-shadow: 0 6px 20px oklch(0 0 0 / 0.18);
  }
  .lp-btn-primary:active { transform: translateY(0); opacity: 1; }

  /* Chevron → arrow morph */
  .lp-btn-arrow { transition: transform 0.35s cubic-bezier(0.25, 0.46, 0.45, 0.94); overflow: visible; }
  .chevron-path { transition: opacity 0.35s cubic-bezier(0.25, 0.46, 0.45, 0.94); opacity: 1; }
  .arrow-path   { transition: opacity 0.35s cubic-bezier(0.25, 0.46, 0.45, 0.94); opacity: 0; }
  .lp-btn-primary:hover .lp-btn-arrow  { transform: translateX(2px); }
  .lp-btn-primary:hover .chevron-path  { opacity: 0; }
  .lp-btn-primary:hover .arrow-path    { opacity: 1; }

  .lp-btn-outline {
    display: inline-flex; align-items: center; gap: 7px;
    padding: 11px 22px; border-radius: var(--radius, 10px);
    font-size: 14px; font-weight: 400;
    color: var(--foreground); background: var(--card);
    text-decoration: none; border: 1px solid var(--border);
    box-shadow: 0 1px 2px oklch(0 0 0 / 0.04);
    transition: background 0.15s, border-color 0.15s, transform 0.15s;
  }
  .lp-btn-outline:hover {
    background: var(--accent); border-color: var(--ring); transform: translateY(-1px);
  }

  /* ── Stats row ── */
  .lp-stats {
    display: grid; grid-template-columns: repeat(4, 1fr);
    width: 100%; max-width: 560px; margin-top: 64px;
    border: 1px solid var(--border); border-radius: var(--radius, 10px);
    background: var(--card); overflow: hidden;
    box-shadow: 0 1px 4px oklch(0 0 0 / 0.06);
    animation: lp-fade-up 0.5s 0.36s ease both;
    position: relative; z-index: 1;
  }
  .lp-stat {
    padding: 20px 0; text-align: center;
    border-right: 1px solid var(--border);
    transition: background 0.15s;
  }
  .lp-stat:hover { background: var(--accent); }
  .lp-stat:last-child { border-right: none; }
  .lp-stat-val {
    font-family: 'Instrument Serif', serif;
    font-size: 26px; letter-spacing: -0.03em;
    color: var(--foreground); line-height: 1; font-weight: 400;
  }
  .lp-stat-lbl {
    font-size: 12px; color: var(--muted-foreground);
    margin-top: 4px; letter-spacing: 0.02em;
  }

  /* ════════════════════════════════════
     TRUST BAR — infinite marquee
  ════════════════════════════════════ */
  .lp-trust {
    padding: 52px 0 64px;
    border-top: 1px solid var(--border);
    overflow: hidden;
  }
  .lp-trust-label {
    text-align: center;
    font-size: 11px; font-weight: 500; letter-spacing: 0.09em; text-transform: uppercase;
    color: var(--muted-foreground); margin-bottom: 28px;
    padding: 0 40px;
  }
  .lp-trust-track-wrap {
    position: relative; overflow: hidden;
    mask-image: linear-gradient(90deg, transparent 0%, black 7%, black 93%, transparent 100%);
    -webkit-mask-image: linear-gradient(90deg, transparent 0%, black 7%, black 93%, transparent 100%);
  }
  .lp-trust-track {
    display: flex; gap: 10px; width: max-content;
    animation: lp-marquee 32s linear infinite;
  }
  .lp-trust-track:hover { animation-play-state: paused; }
  .lp-trust-pill {
    display: inline-flex; align-items: center; gap: 8px;
    padding: 7px 14px; border-radius: 9999px;
    border: 1px solid var(--border); background: var(--card);
    font-size: 13px; color: var(--muted-foreground);
    white-space: nowrap; flex-shrink: 0;
    transition: border-color 0.15s, color 0.15s, background 0.15s;
    cursor: default;
  }
  .lp-trust-pill:hover {
    border-color: var(--ring); color: var(--foreground); background: var(--accent);
  }
  /* Icon slot — consistent 18px box for brand SVGs */
  .lp-trust-pill svg, .lp-trust-pill .w-5 { width: 18px !important; height: 18px !important; }

  /* ════════════════════════════════════
     SECTION CHROME
  ════════════════════════════════════ */
  .lp-eyebrow {
    font-size: 11px; font-weight: 600; letter-spacing: 0.09em; text-transform: uppercase;
    color: var(--primary); display: block; margin-bottom: 12px;
  }
  .lp-section-title {
    font-family: 'Instrument Serif', serif;
    font-size: clamp(28px, 3.5vw, 46px);
    font-weight: 400; letter-spacing: -0.03em; line-height: 1.1;
    color: var(--foreground);
  }
  .lp-section-sub {
    margin-top: 13px; font-size: 15px;
    color: var(--muted-foreground); line-height: 1.7; max-width: 420px;
  }

  /* ════════════════════════════════════
     BENTO GRID — Unified cohesive design
  ════════════════════════════════════ */
  .lp-bento-section {
    padding: 72px 40px 80px;
    max-width: 1200px; margin: 0 auto;
  }
  .lp-bento-header { margin-bottom: 44px; }
  .lp-bento {
    display: grid;
    grid-template-columns: repeat(12, 1fr);
    gap: 16px;
  }

  /* Card base — unified glass-morphism treatment */
  .lp-bc {
    border-radius: var(--radius, 12px);
    border: 1px solid var(--border);
    background: var(--card);
    padding: 28px;
    overflow: hidden;
    position: relative;
    display: flex;
    flex-direction: column;
    transition: border-color 0.25s ease, box-shadow 0.25s ease, transform 0.25s ease;
    /* Clean neutral gradient for visual depth */
    background-image: linear-gradient(
      175deg,
      var(--card) 0%,
      color-mix(in oklch, var(--card) 98%, var(--secondary)) 60%,
      color-mix(in oklch, var(--card) 96%, var(--secondary)) 100%
    );
  }
  .lp-bc::before {
    content: '';
    position: absolute;
    inset: 0;
    background: radial-gradient(
      ellipse 70% 40% at 50% 0%,
      color-mix(in oklch, var(--primary) 6%, transparent) 0%,
      transparent 60%
    );
    pointer-events: none;
    z-index: 0;
  }
  .lp-bc:hover {
    border-color: color-mix(in oklch, var(--ring) 50%, var(--border) 50%);
    box-shadow:
      0 4px 12px oklch(0 0 0 / 0.05),
      0 16px 48px oklch(0 0 0 / 0.08);
    transform: translateY(-4px);
  }

  /* Accent tints — subtle primary highlights for featured cards */
  .lp-bc-accent {
    background-image: linear-gradient(
      175deg,
      color-mix(in oklch, var(--card) 100%, transparent) 0%,
      color-mix(in oklch, var(--card) 98%, var(--primary) 2%) 50%,
      color-mix(in oklch, var(--card) 94%, var(--primary) 6%) 100%
    );
  }
  .lp-bc-accent::before {
    background: radial-gradient(
      ellipse 70% 40% at 50% 0%,
      color-mix(in oklch, var(--primary) 12%, transparent) 0%,
      transparent 65%
    );
  }

  /* Grid columns — Row 1: 5+7, Row 2: 4+4+4 */
  .lp-bc1 { grid-column: span 5; }
  .lp-bc2 { grid-column: span 7; }
  .lp-bc3 { grid-column: span 4; }
  .lp-bc4 { grid-column: span 4; }
  .lp-bc5 { grid-column: span 4; }

  /* Chips — unified with subtle color coding */
  .lp-chip {
    display: inline-flex; align-items: center;
    padding: 4px 12px; border-radius: 9999px;
    font-size: 11px; font-weight: 600; letter-spacing: 0.05em;
    width: fit-content; flex-shrink: 0; margin-bottom: 16px;
    position: relative; z-index: 1;
    transition: transform 0.2s ease;
  }
  .lp-chip:hover { transform: scale(1.02); }
  .lp-chip-a {
    background: color-mix(in oklch, var(--primary) 12%, transparent);
    color: var(--primary);
    border: 1px solid color-mix(in oklch, var(--primary) 25%, transparent);
  }
  .lp-chip-b {
    background: color-mix(in oklch, var(--muted-foreground) 10%, var(--card));
    color: var(--muted-foreground);
    border: 1px solid var(--border);
  }
  .lp-chip-c {
    background: color-mix(in oklch, oklch(0.65 0.18 155) 12%, transparent);
    color: oklch(0.45 0.14 155);
    border: 1px solid color-mix(in oklch, oklch(0.65 0.18 155) 25%, transparent);
  }
  .dark .lp-chip-c { color: oklch(0.75 0.14 155); }

  /* Status pill — unified with live indicator */
  .lp-status-pill {
    display: inline-flex; align-items: center; gap: 6px;
    padding: 4px 12px; border-radius: 9999px;
    font-size: 11px; font-weight: 600; letter-spacing: 0.04em;
    background: color-mix(in oklch, oklch(0.65 0.18 155) 12%, transparent);
    color: oklch(0.45 0.14 155);
    border: 1px solid color-mix(in oklch, oklch(0.65 0.18 155) 25%, transparent);
    width: fit-content; margin-bottom: 16px;
    position: relative; z-index: 1;
  }
  .dark .lp-status-pill { color: oklch(0.75 0.14 155); }
  .lp-status-dot {
    width: 6px; height: 6px; border-radius: 50%;
    background: oklch(0.65 0.18 155);
    animation: lp-pulse 2s ease infinite; flex-shrink: 0;
  }

  /* Card title + body */
  .lp-bc-title {
    font-family: 'Instrument Serif', serif;
    font-size: clamp(20px, 2vw, 26px);
    font-weight: 400; letter-spacing: -0.025em; line-height: 1.2;
    color: var(--foreground);
    position: relative; z-index: 1;
  }
  .lp-bc-title em { font-style: italic; color: var(--primary); }
  .lp-bc1 .lp-bc-title { font-size: clamp(24px, 2.4vw, 32px); }
  .lp-bc-body {
    font-size: 13.5px; color: var(--muted-foreground); line-height: 1.7; margin-top: 10px;
    position: relative; z-index: 1;
  }

  /* Illustration container — enhanced with consistent styling */
  .lp-bc-img {
    margin-top: 20px;
    border-radius: calc(var(--radius, 10px) - 2px);
    display: flex; align-items: center; justify-content: center;
    overflow: hidden;
    flex-shrink: 0;
    height: 148px;
    object-fit: cover;
    border-radius: 8px;
    /* Enhanced inner shadow for depth */
    box-shadow:
      inset 0 2px 6px oklch(0 0 0 / 0.1),
      inset 0 -1px 2px oklch(0 0 0 / 0.05);
    position: relative;
    z-index: 1;
    border: 1px solid color-mix(in oklch, var(--border) 50%, transparent);
  }
  /* Refined dot grid pattern */
  .lp-bc-img::before {
    content: '';
    position: absolute;
    inset: 0;
    border-radius: 8px;
    background-image: radial-gradient(
      circle at center,
      color-mix(in oklch, var(--muted-foreground) 12%, transparent) 1px,
      transparent 1px
    );
    background-size: 14px 14px;
    opacity: 0.6;
    pointer-events: none;
    z-index: 0;
  }
  .lp-bc1 .lp-bc-img,
  .lp-bc2 .lp-bc-img,
  .lp-bc3 .lp-bc-img,
  .lp-bc4 .lp-bc-img,
  .lp-bc5 .lp-bc-img { height: 148px; }

  .lp-bc-img img {
    width: auto; height: 100%; max-width: 100%;
    border-radius: 6px;
    filter: drop-shadow(0 4px 12px oklch(0 0 0 / 0.4));
    position: relative;
    z-index: 1;
    transition: transform 0.3s ease, filter 0.3s ease;
  }
  .lp-bc:hover .lp-bc-img img {
    transform: scale(1.02);
    filter: drop-shadow(0 6px 16px oklch(0 0 0 / 0.5));
  }

  /* Integration icon grid */
  .lp-int-row {
    display: flex;
    flex-wrap: wrap;
    gap: 7px;
    margin-top: 16px;
    align-items: center;
  }
  .lp-int-icon {
    width: 32px; height: 32px; border-radius: 7px;
    border: 1px solid var(--border); background: var(--card);
    display: flex; align-items: center; justify-content: center;
    box-shadow: 0 1px 2px oklch(0 0 0 / 0.05);
    transition: transform 0.15s, box-shadow 0.15s; cursor: default;
    flex-shrink: 0;
  }
  .lp-int-icon:hover {
    transform: scale(1.12);
    box-shadow: 0 3px 8px oklch(0 0 0 / 0.12);
  }
  .lp-int-icon svg, .lp-int-icon .w-5 { width: 18px !important; height: 18px !important; }
  .lp-int-more {
    width: 32px; height: 32px; border-radius: 7px;
    background: color-mix(in oklch, var(--primary) 9%, transparent);
    color: var(--primary); font-size: 10px; font-weight: 600;
    border: 1px solid color-mix(in oklch, var(--primary) 20%, transparent);
    display: grid; place-items: center; flex-shrink: 0;
    cursor: help;
    transition: transform 0.15s, background 0.15s;
  }
  .lp-int-more:hover {
    transform: scale(1.08);
    background: color-mix(in oklch, var(--primary) 15%, transparent);
  }

  /* Code block */
  .lp-code {
    /* Use foreground as bg so it reads well in both light + dark themes */
    background: color-mix(in oklch, var(--foreground) 96%, var(--background) 4%);
    color: var(--background);
    border-radius: calc(var(--radius, 10px) - 2px);
    padding: 15px 17px;
    font-family: var(--font-geist-mono), 'Geist Mono', ui-monospace, monospace;
    font-size: 12px; line-height: 1.8;
    overflow: hidden; margin-top: 16px; flex-shrink: 0;
  }
  .lp-code > div { white-space: nowrap; }
  .tok-g { color: oklch(0.72 0.18 155); }
  .tok-b { color: oklch(0.68 0.18 250); }
  /* FIX: was 0.52 — nearly invisible on dark bg */
  .tok-d { color: oklch(0.62 0 0); }
  .tok-o { color: oklch(0.78 0.17 75); }
  .tok-p { color: oklch(0.74 0.18 295); }
  .tok-w { color: oklch(0.92 0 0); }

  /* ════════════════════════════════════
     FEATURES
  ════════════════════════════════════ */
  .lp-features {
    padding: 72px 40px 80px;
    max-width: 1200px; margin: 0 auto;
  }
  .lp-features-header { max-width: 480px; margin-bottom: 44px; }
  .lp-features-grid {
    display: grid; grid-template-columns: repeat(3, 1fr);
    border: 1px solid var(--border); border-radius: var(--radius, 10px);
    overflow: hidden; box-shadow: 0 1px 3px oklch(0 0 0 / 0.04);
  }
  .lp-feature {
    padding: 30px 26px;
    background: var(--card);
    border-right: 1px solid var(--border);
    border-bottom: 1px solid var(--border);
    transition: background 0.18s;
  }
  .lp-feature:hover { background: var(--accent); }
  .lp-feature:hover .lp-feature-icon {
    background: color-mix(in oklch, var(--primary) 10%, transparent);
    border-color: color-mix(in oklch, var(--primary) 20%, transparent);
  }
  .lp-feature:hover .lp-feature-icon svg { color: var(--primary); }
  .lp-feature:nth-child(3n)        { border-right: none; }
  .lp-feature:nth-last-child(-n+3) { border-bottom: none; }
  .lp-feature-icon {
    width: 36px; height: 36px; border-radius: 8px;
    display: grid; place-items: center; margin-bottom: 14px;
    background: var(--secondary); border: 1px solid var(--border);
    transition: background 0.18s, border-color 0.18s;
  }
  .lp-feature-icon svg { width: 17px; height: 17px; color: var(--muted-foreground); transition: color 0.18s; }
  .lp-feature-title {
    font-size: 13.5px; font-weight: 600; letter-spacing: -0.012em;
    color: var(--foreground); margin-bottom: 6px;
  }
  .lp-feature-body { font-size: 13px; color: var(--muted-foreground); line-height: 1.65; }

  /* ════════════════════════════════════
     CTA
  ════════════════════════════════════ */
  .lp-cta { padding: 80px 40px 96px; max-width: 1200px; margin: 0 auto; }
  .lp-cta-inner {
    border-radius: var(--radius, 10px);
    border: 1px solid var(--border);
    background: var(--card);
    padding: 80px 60px;
    text-align: center; position: relative; overflow: hidden;
    box-shadow: 0 1px 4px oklch(0 0 0 / 0.06);
  }
  /* Dot grid texture */
  .lp-cta-inner::after {
    content: '';
    position: absolute; inset: 0;
    background-image: radial-gradient(
      circle, color-mix(in oklch, var(--foreground) 6%, transparent) 1px, transparent 1px
    );
    background-size: 24px 24px;
    pointer-events: none; z-index: 0;
  }
  .lp-cta-inner::before {
    content: '';
    position: absolute; top: -60px; left: 50%; transform: translateX(-50%);
    width: 640px; height: 300px;
    background: radial-gradient(ellipse,
      color-mix(in oklch, var(--primary) 10%, transparent) 0%, transparent 65%);
    pointer-events: none; z-index: 1;
  }
  .lp-cta-title {
    font-family: 'Instrument Serif', serif;
    font-size: clamp(32px, 3.8vw, 54px);
    font-weight: 400; letter-spacing: -0.03em; color: var(--foreground);
    margin-bottom: 14px; position: relative; z-index: 2;
  }
  .lp-cta-sub {
    font-size: 15px; color: var(--muted-foreground); line-height: 1.7;
    margin: 0 auto 38px; position: relative; z-index: 2;
    max-width: 400px;
  }
  .lp-cta-btns {
    display: flex; gap: 10px; justify-content: center; flex-wrap: wrap;
    position: relative; z-index: 2;
  }

  /* ════════════════════════════════════
     FOOTER
  ════════════════════════════════════ */
  .lp-footer {
    border-top: 1px solid var(--border);
    background: var(--secondary);
    padding: 28px 40px;
    display: flex; justify-content: space-between; align-items: center;
    flex-wrap: wrap; gap: 16px;
  }
  .lp-footer-logo {
    display: flex; align-items: center; gap: 8px;
    text-decoration: none; color: var(--foreground);
    font-size: 14px; font-weight: 600; letter-spacing: -0.02em;
  }
  .lp-footer-logo-mark {
    width: 26px; height: 26px; background: var(--primary);
    border-radius: 6px; display: grid; place-items: center; flex-shrink: 0;
  }
  .lp-footer-logo-mark svg { width: 13px; height: 13px; color: var(--primary-foreground); }
  .lp-footer-links { display: flex; gap: 24px; align-items: center; }
  .lp-footer-link {
    font-size: 13px; color: var(--muted-foreground);
    text-decoration: none; transition: color 0.15s;
  }
  .lp-footer-link:hover { color: var(--foreground); }

  /* ── Footer CursorRevealText wrapper ── */
  .lp-footer-cursor-reveal {
    font-size: 12px;
    /* Ensure the component has enough hit area */
    padding: 4px 0;
  }

  /* ════════════════════════════════════
     RESPONSIVE  (all blocks properly closed)
  ════════════════════════════════════ */
  @media (max-width: 1024px) {
    .lp-bento-section, .lp-features, .lp-cta, .lp-footer {
      padding-left: 24px; padding-right: 24px;
    }
    .lp-bento { gap: 14px; }
    .lp-bento { grid-template-columns: 1fr 1fr; }
    .lp-bc1, .lp-bc2 { grid-column: span 2; }
    .lp-bc3, .lp-bc4 { grid-column: span 1; }
    .lp-bc5 { grid-column: span 2; }
    .lp-bc { padding: 24px; }
  }

  @media (max-width: 768px) {
    .lp-hero { padding: calc(66px + 40px) 20px 60px; }
    .lp-stats { grid-template-columns: repeat(2, 1fr); max-width: 100%; }
    .lp-stat:nth-child(2) { border-right: none; }
    .lp-stat:nth-child(3),
    .lp-stat:nth-child(4) { border-top: 1px solid var(--border); }
    .lp-stat:nth-child(4) { border-right: none; }
    .lp-trust-label { padding: 0 20px; }
    .lp-bento-section, .lp-features, .lp-cta { padding-left: 20px; padding-right: 20px; }
    .lp-bento { grid-template-columns: 1fr; }
    .lp-bc1, .lp-bc2, .lp-bc3, .lp-bc4, .lp-bc5 { grid-column: span 1; }
    .lp-bc1 .lp-bc-img, .lp-bc2 .lp-bc-img,
    .lp-bc3 .lp-bc-img, .lp-bc4 .lp-bc-img,
    .lp-bc5 .lp-bc-img { height: 148px; }
    .lp-features-grid { grid-template-columns: 1fr; }
    .lp-feature:nth-child(n)         { border-right: none; border-bottom: 1px solid var(--border); }
    .lp-feature:nth-last-child(-n+3) { border-bottom: 1px solid var(--border); }
    .lp-feature:last-child           { border-bottom: none; }
    .lp-cta-inner { padding: 52px 24px; }
    .lp-footer { padding: 24px 20px; flex-direction: column; align-items: flex-start; }
  }
`;

// ─── Icons ────────────────────────────────────────────────────────────────────
function IconLogo() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
    </svg>
  );
}
function IconArrow() {
  return (
    <svg
      width="13"
      height="13"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="lp-btn-arrow"
    >
      <path className="chevron-path" d="M9 18l6-6-6-6" />
      <path className="arrow-path" d="M5 12h14M12 5l7 7-7 7" />
    </svg>
  );
}
function IconShield() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.75"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
    </svg>
  );
}
function IconActivity() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.75"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
    </svg>
  );
}
function IconNetwork() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.75"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <circle cx="18" cy="18" r="3" />
      <circle cx="6" cy="6" r="3" />
      <path d="M6 21V9a9 9 0 0 0 9 9" />
    </svg>
  );
}
function IconMonitor() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.75"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <rect x="2" y="3" width="20" height="14" rx="2" />
      <path d="M8 21h8M12 17v4" />
    </svg>
  );
}
function IconZap() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.75"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" />
    </svg>
  );
}
function IconUsers() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.75"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <path d="M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" />
    </svg>
  );
}

// ─── Navbar ───────────────────────────────────────────────────────────────────
function NavbarWrapper() {
  return <Navbar />;
}

// ─── Hero ─────────────────────────────────────────────────────────────────────
function Hero({ isAuthenticated }: { isAuthenticated: boolean }) {
  const stats = [
    { val: "100+", lbl: "Integrations" },
    { val: "99.9%", lbl: "Uptime SLA" },
    { val: "SOC 2", lbl: "Certified" },
    { val: "<80ms", lbl: "Avg latency" },
  ];
  return (
    <section className="lp-hero">
      <div className="lp-hero-badge">
        <span className="lp-hero-badge-dot" />
        Enterprise AI Platform
      </div>
      <h1 className="lp-hero-title">
        AI agents that
        <br />
        actually <em>work</em>
      </h1>
      <p className="lp-hero-sub">
        Connect your agents to every tool and workflow — with enterprise-grade
        security built in from day one.
      </p>
      <div className="lp-hero-actions">
        <Link
          href={isAuthenticated ? "/chat" : "/sign-up"}
          className="lp-btn-primary"
        >
          Get started free <IconArrow />
        </Link>
      </div>
      <div className="lp-stats">
        {stats.map((s, i) => (
          <div key={i} className="lp-stat">
            <div className="lp-stat-val">{s.val}</div>
            <div className="lp-stat-lbl">{s.lbl}</div>
          </div>
        ))}
      </div>
    </section>
  );
}

// ─── Trust Bar ────────────────────────────────────────────────────────────────
// All imported brand icon components are used here in the marquee.
// GlobalIcon, ModelProviderIcon, WriteIcon are used as generic placeholders.
function Trust() {
  const logos = [
    { name: "Asana", icon: <AsanaIcon className="w-5 h-5" /> },
    { name: "Atlassian", icon: <AtlassianIcon className="w-5 h-5" /> },
    { name: "Canva", icon: <CanvaIcon className="w-5 h-5" /> },
    { name: "Claude", icon: <ClaudeIcon className="w-5 h-5" /> },
    { name: "Discord", icon: <DiscordIcon className="w-5 h-5" /> },
    { name: "Gemini", icon: <GeminiIcon className="w-5 h-5" /> },
    { name: "GitHub", icon: <GithubIcon className="w-5 h-5" /> },
    { name: "Google", icon: <GoogleIcon className="w-5 h-5" /> },
    { name: "Grok", icon: <GrokIcon className="w-5 h-5" /> },
    { name: "Linear", icon: <LinearIcon className="w-5 h-5" /> },
    { name: "Microsoft", icon: <MicrosoftIcon className="w-5 h-5" /> },
    { name: "Neon", icon: <NeonIcon className="w-5 h-5" /> },
    { name: "Notion", icon: <NotionIcon className="w-5 h-5" /> },
    { name: "Ollama", icon: <OllamaIcon className="w-5 h-5" /> },
    { name: "OpenRouter", icon: <OpenRouterIcon className="w-5 h-5" /> },
    { name: "PayPal", icon: <PaypalIcon className="w-5 h-5" /> },
    { name: "Playwright", icon: <PlaywrightIcon className="w-5 h-5" /> },
    { name: "Stripe", icon: <StripeIcon className="w-5 h-5" /> },
    { name: "Global", icon: <GlobalIcon className="w-5 h-5" /> },
    { name: "Write", icon: <WriteIcon className="w-5 h-5" /> },
  ];

  // Duplicate for seamless loop
  const doubled = [...logos, ...logos];

  return (
    <div className="lp-trust lp-reveal">
      <p className="lp-trust-label">
        Compatible with popular software, AI models, and frameworks
      </p>
      <div className="lp-trust-track-wrap">
        <div className="lp-trust-track">
          {doubled.map(({ name, icon }, i) => (
            <div key={i} className="lp-trust-pill">
              {icon}
              {name}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── Bento ────────────────────────────────────────────────────────────────────
// Card 2 retains the code block as a differentiating element.
// Card 1 retains the integration icon row.
function Bento() {
  return (
    <section className="lp-bento-section">
      <div className="lp-bento-header lp-reveal">
        <span className="lp-eyebrow">Platform</span>
        <h2 className="lp-section-title">Everything your AI agents need</h2>
        <p className="lp-section-sub">
          One layer to connect, authenticate, and orchestrate across your entire
          stack.
        </p>
      </div>

      <div className="lp-bento lp-reveal">
        {/* Card 1 — Connect (5 col): featured card with accent treatment */}
        <div className="lp-bc lp-bc1 lp-bc-accent">
          <div className="lp-chip lp-chip-a">Connect</div>
          <div className="lp-bc-title">
            Connect agents
            <br />
            to <em>everything</em>
          </div>
          <p className="lp-bc-body">
            Discover, authenticate, and execute across hundreds of apps — zero
            integration code required.
          </p>
          <div className="lp-int-row">
            <div className="lp-int-icon">
              <AsanaIcon className="w-5 h-5" />
            </div>
            <div className="lp-int-icon">
              <GithubIcon className="w-5 h-5" />
            </div>
            <div className="lp-int-icon">
              <StripeIcon className="w-5 h-5" />
            </div>
            <div className="lp-int-icon">
              <NotionIcon className="w-5 h-5" />
            </div>
            <div className="lp-int-icon">
              <DiscordIcon className="w-5 h-5" />
            </div>
            <div className="lp-int-icon">
              <LinearIcon className="w-5 h-5" />
            </div>
            <Tooltip>
              <TooltipTrigger asChild>
                <div className="lp-int-more">+94</div>
              </TooltipTrigger>
              <TooltipContent side="top">
                <p>94 more integrations available</p>
              </TooltipContent>
            </Tooltip>
          </div>
          <div className="lp-bc-img">
            <img
              src="/assets/connect.png"
              alt="Connect integrations"
              className="object-cover"
            />
          </div>
        </div>

        {/* Card 2 — Auth (7 col): accent treatment for visual balance */}
        <div className="lp-bc lp-bc2 lp-bc-accent">
          <div className="lp-status-pill">
            <span className="lp-status-dot" /> Live execution
          </div>
          <div className="lp-bc-title">
            One-click
            <br />
            authentication
          </div>
          <p className="lp-bc-body">
            Connect any service instantly — OAuth2, API keys, SAML, all handled
            automatically. No setup required.
          </p>
          <div className="lp-bc-img">
            <img src="/assets/authenticate.png" alt="Authentication" />
          </div>
        </div>

        {/* Card 3 — Automate (4 col): standard card */}
        <div className="lp-bc lp-bc3">
          <div className="lp-chip lp-chip-b">Automate</div>
          <div className="lp-bc-title">
            Workflow
            <br />
            Automation
          </div>
          <p className="lp-bc-body">
            Chain actions across services into reliable multi-step workflows.
          </p>
          <div className="lp-bc-img">
            <img src="/assets/automate.png" alt="Workflow automation" />
          </div>
        </div>

        {/* Card 4 — Integrations (4 col): accent treatment */}
        <div className="lp-bc lp-bc4 lp-bc-accent">
          <div className="lp-chip lp-chip-a">Integrations</div>
          <div className="lp-bc-title">
            <em>100+</em>
            <br />
            Native integrations
          </div>
          <p className="lp-bc-body">
            Every major SaaS tool, ready out of the box.
          </p>
          <div className="lp-bc-img">
            <img src="/assets/integrations.png" alt="Native integrations" />
          </div>
        </div>

        {/* Card 5 — Discover (4 col): standard card */}
        <div className="lp-bc lp-bc5">
          <div className="lp-chip lp-chip-b">Discover</div>
          <div className="lp-bc-title">
            Intelligent
            <br />
            Discovery
          </div>
          <p className="lp-bc-body">
            Agents surface the right tools automatically — no manual wiring.
          </p>
          <div className="lp-bc-img">
            <img src="/assets/discover.png" alt="Intelligent discovery" />
          </div>
        </div>
      </div>
    </section>
  );
}

// ─── Features ─────────────────────────────────────────────────────────────────
function Features() {
  const items = [
    {
      I: IconShield,
      title: "Enterprise-grade security",
      body: "SOC 2 Type II, SSO, RBAC, and full audit logs. Deploy in your VPC or our managed cloud.",
    },
    {
      I: IconActivity,
      title: "Real-time observability",
      body: "Full traces, latency breakdowns, and cost attribution per action — zero instrumentation needed.",
    },
    {
      I: IconNetwork,
      title: "Universal tool registry",
      body: "One registry to discover, version, and govern every tool across all teams and environments.",
    },
    {
      I: IconMonitor,
      title: "Model-agnostic design",
      body: "Swap LLM providers without rewriting logic. Works with OpenAI, Anthropic, Gemini, and self-hosted.",
    },
    {
      I: IconZap,
      title: "Sub-100ms execution",
      body: "Globally distributed edge infrastructure keeps agents responsive wherever your users are.",
    },
    {
      I: IconUsers,
      title: "Team collaboration",
      body: "Shared workspaces, approval flows, and per-team access controls that scale with your org.",
    },
  ];
  return (
    <section className="lp-features">
      <div className="lp-features-header lp-reveal">
        <span className="lp-eyebrow">Capabilities</span>
        <h2 className="lp-section-title">
          Built for how enterprises
          <br />
          actually work
        </h2>
      </div>
      <div className="lp-features-grid lp-reveal">
        {items.map(({ I, title, body }, i) => (
          <div key={i} className="lp-feature">
            <div className="lp-feature-icon">
              <I />
            </div>
            <div className="lp-feature-title">{title}</div>
            <div className="lp-feature-body">{body}</div>
          </div>
        ))}
      </div>
    </section>
  );
}

// ─── CTA ──────────────────────────────────────────────────────────────────────
function Cta({ isAuthenticated }: { isAuthenticated: boolean }) {
  return (
    <section className="lp-cta">
      <div className="lp-cta-inner lp-reveal">
        <h2 className="lp-cta-title">Ready to build intelligent agents?</h2>
        <p className="lp-cta-sub">
          Join teams using Squid to automate complex workflows with
          enterprise-grade security.
        </p>
        <div className="lp-cta-btns">
          <Link
            href={isAuthenticated ? "/chat" : "/sign-up"}
            className="lp-btn-primary"
          >
            Start for free <IconArrow />
          </Link>
        </div>
      </div>
    </section>
  );
}

// ─── Footer ───────────────────────────────────────────────────────────────────
// CursorRevealText: baseText and revealText must be the same string so the
// two layers align perfectly. The hover reveals the primary-coloured version.
function Footer() {
  return (
    <footer className="lp-footer">
      <Link href="/" className="lp-footer-logo">
        <div className="lp-footer-logo-mark">
          <IconLogo />
        </div>
        Squid
      </Link>

      <p className="lp-footer-copyright">
        © 2026 Squid Inc. All rights reserved.
      </p>
    </footer>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────
export default function LandingPage() {
  const ref = useRef<HTMLDivElement>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    const checkAuth = async () => {
      try {
        await authClient.getSession();
        setIsAuthenticated(true);
      } catch {
        setIsAuthenticated(false);
      }
    };
    checkAuth();
  }, []);

  useEffect(() => {
    const io = new IntersectionObserver(
      (entries) =>
        entries.forEach((e, i) => {
          if (e.isIntersecting) {
            (e.target as HTMLElement).style.transitionDelay = `${i * 0.055}s`;
            e.target.classList.add("lp-visible");
          }
        }),
      { threshold: 0.06 },
    );
    ref.current?.querySelectorAll(".lp-reveal").forEach((el) => io.observe(el));
    return () => io.disconnect();
  }, []);

  return (
    <>
      <link
        rel="stylesheet"
        href="https://fonts.googleapis.com/css2?family=Instrument+Serif:ital@0;1&display=swap"
      />
      <style dangerouslySetInnerHTML={{ __html: css }} />
      <div className="lp" ref={ref}>
        <NavbarWrapper />
        <Hero isAuthenticated={isAuthenticated} />
        <Trust />
        <Bento />
        <Features />
        <Cta isAuthenticated={isAuthenticated} />
        <Footer />
      </div>
    </>
  );
}
