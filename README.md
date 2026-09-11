# AI Masters Application Tracker

Research, organise, compare and track MSc applications in AI, Machine Learning, Data Science and
Computer Science across Europe. Fully static: all data lives in your browser's local storage, so it
can be hosted on GitHub Pages without any backend.

## Features

- Dashboard with KPIs, live deadline countdowns and "what to do next" suggestions
- Applications table with filters, sorting, grouping, column control and inline status editing
- Programme detail pages: checklist, timeline, personal scoring, finances, offers and notes
- Universities, countries, deadlines (list + month view, ICS export), comparison with radar chart
- Documents tracker, tagged notes, light/dark theme
- JSON backup/restore and CSV exports for programmes, universities and deadlines

## Local development

```bash
npm install
npm run dev      # http://localhost:8080
npm run build    # static output in dist/
npm run preview
```

## Deploy to GitHub Pages

The app uses relative asset paths (`base: "./"`) and hash-based routing, so it works from any
repository sub-path.

```bash
npm run deploy   # builds and publishes dist/ to the gh-pages branch
```

Then in GitHub → Settings → Pages, set the source to the `gh-pages` branch. Your app will be served
at `https://<user>.github.io/<repo>/`.

## Data & privacy

Nothing is sent anywhere. All universities, programmes, notes and settings are stored under the
`ai-masters-tracker:v1` key in local storage. Use Settings → Backup to export a JSON file before
clearing your browser data or switching device.

Seeded universities, programmes, dates and links are starting points only — verify them on the
official programme pages and edit anything that has changed. Tuition and living costs start at zero
so no figures are invented for you.
