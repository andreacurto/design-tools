# Documentazione Tecnica — Design Tools

Documentazione tecnica per sviluppatori e AI assistants per modifiche future al progetto.

## Indice

1. [Architettura Progetto](#architettura-progetto)
2. [Stack Tecnico](#stack-tecnico)
3. [Convenzioni Codice](#convenzioni-codice)
4. [Aggiungere un Nuovo Tool](#aggiungere-un-nuovo-tool)
5. [Workflow Git](#workflow-git)

---

## Architettura Progetto

### Struttura File

```
design-tools/
├── src/
│   ├── App.tsx                        # Router principale (BrowserRouter + Routes)
│   ├── main.tsx                       # Entry point React
│   ├── index.css                      # Reset globale + @import tailwindcss
│   ├── components/
│   │   └── Layout.tsx                 # Shell con sidebar sinistra + <Outlet />
│   └── tools/
│       └── fluid-type-scale/
│           ├── index.tsx              # Componente tool (UI + sotto-componenti)
│           └── useTypeScale.ts        # Custom hook (logica + funzioni pure)
├── public/
├── index.html
├── vite.config.ts
├── tailwind.config.ts
├── tsconfig.json
├── eslint.config.js
├── .prettierrc
└── package.json
```

### Routing

- `/` → redirect automatico al primo tool
- `/<tool-slug>` → tool renderizzato nell'`<Outlet />` del Layout
- Ogni tool è una route indipendente registrata in `App.tsx`

### Layout Shell

La sidebar (`Layout.tsx`) contiene un array `tools` con path, label e icona SVG di ogni tool. Aggiungere un tool = aggiungere un elemento all'array e registrare la route in `App.tsx`.

---

## Stack Tecnico

| Tecnologia | Versione | Note |
|---|---|---|
| React | 18 | |
| TypeScript | 5 | strict mode |
| Vite | 5 | bundler + dev server |
| Tailwind CSS | 4 | via `@tailwindcss/vite`, config CSS-first |
| React Router | 6 | `BrowserRouter` + `<Outlet />` |
| ESLint | 9 | flat config (`eslint.config.js`) |
| Prettier | 3 | `.prettierrc` |

### Comandi

```bash
npm run dev       # dev server → http://localhost:5173
npm run build     # build produzione (tsc + vite build)
npm run lint      # ESLint
npm run format    # Prettier su src/
```

---

## Convenzioni Codice

### Stile Generale

- TypeScript strict, nessun `any` implicito
- Nessun commento salvo quando il *perché* è non ovvio
- Nessun `console.log` lasciato in produzione
- Inline style per valori di design specifici (colori, misure pixel esatti); Tailwind per layout e utilità generiche

### Struttura di un Tool

Ogni tool vive in `src/tools/<slug>/` ed è composto da:

- **`index.tsx`** — componente default export; contiene l'UI e i sotto-componenti locali (possono stare nello stesso file se non superano ~400 righe)
- **`useXxx.ts`** — custom hook che separa tutta la logica di stato; esporta anche le funzioni pure (calcoli, formattatori) usate dal componente

Il componente non calcola nulla: delega al hook e ai suoi helper.

### Componenti

- Funzioni, non classi
- Props tipizzate con `interface`
- Nomi descrittivi in PascalCase
- Sotto-componenti locali definiti nello stesso file del componente principale se strettamente accoppiati

---

## Aggiungere un Nuovo Tool

1. Creare `src/tools/<slug>/index.tsx` e `src/tools/<slug>/useXxx.ts`
2. In `App.tsx`: importare il componente e aggiungere `<Route path="<slug>" element={<NuovoTool />} />`
3. In `Layout.tsx`: aggiungere un elemento all'array `tools` con path, label e icona SVG
4. Il redirect da `/` punterà automaticamente al primo tool nell'array — aggiornare se necessario

---

## Workflow Git

### Branching Strategy

```
main (stabile, solo release taggate)
  └── feature/<slug>   (nuove funzionalità, nuovi tool)
  └── fix/<slug>       (bug fix, correzioni, tweaks)
```

- **`feature/`** → nuove funzionalità o nuovi tool → bump MINOR
- **`fix/`** → bug fix, UI tweaks, correzioni minori → bump PATCH
- **Merge su main**: solo dopo approvazione esplicita
- **Tag**: creato dopo il merge

### Processo di Sviluppo

**IMPORTANTE**: seguire SEMPRE questo processo per qualsiasi modifica.

#### 0. Sincronizzazione (PRIMA di qualsiasi altra cosa)

```bash
git fetch origin
git pull --rebase origin main
git tag --sort=-version:refname | head -5
```

Verificare i tag remoti **prima** di decidere la versione target, per evitare conflitti con tag già esistenti sul remote.

#### 1. Piano di rilascio (PRIMA di qualsiasi codice)

Presentare SEMPRE un piano che includa:

- **Tipo di branch**: `feature/` o `fix/`
- **Nome branch**: descrittivo e conciso
- **Elenco commit previsti**: lista con descrizione sintetica
- **Versione target**: bump previsto (PATCH / MINOR / MAJOR) — stabilita dopo lo step 0

Attendere approvazione prima di procedere.

#### 2. Sviluppo (dopo approvazione piano)

- Creare il branch e lavorare in autonomia
- Eseguire tutte le operazioni senza chiedere permesso
- Ogni commit viene pushato automaticamente
- Aggiornare sempre `CLAUDE.md` (changelog) come parte del rilascio

#### 3. Review pre-merge (PRIMA del merge in main)

Verificare che il codice sia allineato allo stato attuale del progetto:

- TypeScript compila senza errori (`npm run build`)
- Nessun warning ESLint (`npm run lint`)
- Il tool funziona nel dev server (golden path + edge case)
- `CLAUDE.md` aggiornato con il changelog della release

Solo dopo questa verifica chiedere conferma all'utente prima di mergiare.

#### 4. Rilascio (dopo approvazione merge) — Squash Merge

Eseguire tutto in autonomia:

```bash
# 1. Bump version in package.json come ultimo commit sul branch
# (editare manualmente il campo "version")
git add package.json && git commit -m "Chore: bump version to a.b.c" && git push

# 2. Squash merge su main
git checkout main
git merge --squash feature/<slug>

# 3. Commit unico con changelog
git commit -m "$(cat <<'EOF'
Tipo: titolo descrittivo

Versione: x.y.z → a.b.c

Modifiche:
- Feat: descrizione funzionalità 1
- Fix: descrizione correzione significativa
EOF
)"

# 4. Push + tag + cleanup
git push
git tag va.b.c && git push origin va.b.c
git branch -d feature/<slug>
git push origin --delete feature/<slug>
```

**Formato commit su main**: prima riga sintetica, poi `Versione: X → Y`, poi `Modifiche:` con i soli cambiamenti significativi (non i fix intermedi di sviluppo). Risultato: un commit per release, leggibile come changelog.

### Convenzioni Commit

Formato [Conventional Commits](https://www.conventionalcommits.org/):

```
<Tipo>: <descrizione imperativa breve>

<corpo opzionale: cosa e perché, non come>
```

| Prefisso | Uso | Esempio |
|---|---|---|
| `Feat` | nuova funzionalità o tool | `Feat: aggiunto tool spacing scale` |
| `Fix` | bug fix | `Fix: overflow colonna preview su viewport stretti` |
| `Style` | UI/UX, formattazione visiva | `Style: ridotto padding sidebar` |
| `Refactor` | ristrutturazione senza cambi funzionali | `Refactor: estratto hook useSpacingScale` |
| `Docs` | documentazione | `Docs: aggiornato workflow rilascio in CLAUDE.md` |
| `Chore` | manutenzione, version bump, dipendenze | `Chore: bump version to 0.2.0` |

**Regole**:
- Prefisso con iniziale maiuscola (`Feat`, `Fix`…)
- Prima riga: max ~70 caratteri, minuscolo dopo i due punti
- Lingua: italiano per la descrizione
- Corpo opzionale, separato da riga vuota

### Versionamento Semantico

Seguire [Semantic Versioning](https://semver.org/lang/it/):

- **PATCH** (x.y.**Z**): bug fix, tweaks, refactor senza impatto UI
- **MINOR** (x.**Y**.0): nuovo tool, nuova funzionalità significativa
- **MAJOR** (**X**.0.0): breaking change (es. cambio routing, redesign shell)

La versione in `package.json` deve corrispondere al tag git. Aggiornare come ultimo commit sul branch prima del merge.

---

## Changelog

### v0.0.3 — README (2026-05-08)

- **Docs**: aggiunto README in italiano

### v0.0.2 — Formattazione Prettier (2026-05-08)

- **Style**: riformattazione Prettier su tutti i file sorgente (JSX, stili inline, trailing comma)

### v0.0.1 — Bootstrap iniziale (2026-05-08)

- **Feat**: setup progetto Vite + React 18 + TypeScript strict + Tailwind CSS v4
- **Feat**: shell con sidebar navigazione tool
- **Feat**: React Router v6 con redirect automatico da `/`
- **Feat**: primo tool — Fluid Type Scale Generator (migrazione da HTML standalone)
  - Custom hook `useTypeScale` con logica scala, overrides, calcolo `clamp()`
  - Colonna scala con overrides moltiplicatori per min/max
  - Anteprima live con slider viewport e testo personalizzabile
  - Export CSS (`:root` / SCSS) e Design Tokens JSON (Figma)
  - Drawer impostazioni (font, viewport, base size, ratio, nomenclatura, prefisso)

---

_Ultimo aggiornamento: 2026-05-08 — Versione: 0.0.3_
