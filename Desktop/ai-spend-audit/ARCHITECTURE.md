# System Architecture

## Overview
A high-performance Next.js application designed for sub-second audit generation and viral shareability.

## Data Flow
1. **Input:** Client-side React Hook Form captures tool usage. State is persisted in `localStorage`.
2. **Logic:** A pure TypeScript engine (`lib/audit-engine.ts`) calculates savings based on `PRICING_DATA.md`.
3. **AI:** Results are sent to an Edge Function that prompts Claude 3.5 Sonnet for a 100-word summary.
4. **Persistence:** Audit metadata is stored in Supabase; unique IDs generate shareable URLs.

## System Diagram
```mermaid
graph LR
    User((User)) --> NextJS[Next.js App Router]
    NextJS --> Logic[Audit Engine]
    NextJS --> DB[(Supabase)]
    NextJS --> AI[Anthropic API]
    NextJS --> Email[Resend API]