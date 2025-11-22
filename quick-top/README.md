# Audible Autocomplete Atlas

This project visualizes Audible's autocomplete suggestions as a horizontal strip of cover "pyramids." Each letter gets its own column where the first, second, and third rows show 1 → 2 → 4 progressively smaller jackets. Hovering a tile reveals the metadata, and clicking opens the matching Audible PDP.

## Refreshing the dataset

```
node download_suggestions.js
```

The script makes a polite request for every letter (1 s pause between calls), writes a timestamped archive in the repo root, and keeps `public/audible-suggestions.json` in sync so the UI can fetch the latest snapshot on page load.

## Developing

```
npm install
npm run dev
```

Open the printed URL and scroll through the pyramid strip. The visualization rebuilds automatically when you edit code.

## Building for production

```
npm run build
npm run preview
```

`npm run build` creates the static bundle, and `npm run preview` serves it locally for a final smoke test.
