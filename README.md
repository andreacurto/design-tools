# Design Tools

Una raccolta di tool browser-based per designer e team di design system — costruita con React, TypeScript e Tailwind CSS.

## Tool

### Fluid Type Scale Generator

Genera scale tipografiche fluide usando CSS `clamp()`. Definisci viewport e dimensioni base min/max, scegli un ratio modulare, visualizza l'anteprima in tempo reale ed esporta in CSS o Design Tokens JSON (Figma).

**Funzionalità:**
- Output `clamp()` fluido per ogni step
- Override dei moltiplicatori per step (min e max indipendenti)
- Anteprima live con slider viewport e testo personalizzabile
- Export come `:root {}` CSS, variabili SCSS o Design Tokens JSON
- Font, peso, viewport, dimensione base, ratio, modalità naming e prefisso token configurabili

## Avvio

```bash
npm install
npm run dev     # http://localhost:5173
```

## Comandi

| Comando | Descrizione |
|---|---|
| `npm run dev` | Avvia il server di sviluppo |
| `npm run build` | Build di produzione |
| `npm run lint` | Esegui ESLint |
| `npm run format` | Formatta con Prettier |

## Stack

React 18 · TypeScript 5 · Vite 5 · Tailwind CSS 4 · React Router 6
