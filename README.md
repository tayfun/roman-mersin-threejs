# Roman Mersin — a 3D map of ancient Cilicia

An interactive three.js map of ten Roman sites in Mersin province, Türkiye, on real terrain.
Click a beacon to fly to a site, read what stands there and how we know, and hear a short narration.
The map opens with a guided tour of all ten places (stop it any time to explore on your own), in English or Turkish.

```
npm install
npm run dev      # http://localhost:5173
npm run build    # static site in dist/
```

- **Research and citations:** [SOURCES.md](SOURCES.md)
- **Controls:** drag to orbit, scroll to zoom, right-drag to pan. `1–0` jump to a site, `←/→` previous/next, `T` tour, `M` sound, `G` golden hour, `R` roads, `H` overview, `L` English/Türkçe, `Esc` close. The language follows the browser, can be forced with `?lang=tr` or `?lang=en`, and is remembered.
- Add `?q=low` to the URL for a lighter render (slow devices automatically drop shadows and retina resolution).

## How it is built
- `public/heightmap.png`, `terrain-normal.jpg`, `terrain-color.jpg`, `landcover.png` — terrain built from open data by `tools/build_terrain_data.py` (`pip install rasterio numpy pillow`): elevation from the Copernicus 30 m DEM, ground colour from Sentinel-2 cloudless imagery, land/water and tree placement from ESA WorldCover 2021. See SOURCES.md.
- `src/terrain.js` — terrain mesh, hypsometric colouring, animated sea.
- `src/monuments/` — one procedural diorama per site (`<site>.js`), built from its standing remains with the shared modelling kit in `kit.js` (textured masonry, columns, theatres, vaults, rock faces, sculpted terrain bases).
- `preview.html` — dev-only page that renders one diorama on its own: `npm run dev`, then `/preview.html?m=soli&a=20&e=30&d=3` (`tools/model_shots.mjs` captures a set of views).
- `src/sites.js` — site texts, each claim keyed to a source.
- `src/i18n.js`, `src/narration.tr.json` — interface strings and the Turkish site texts and narration scripts
- `public/audio/` — narration (`vo-*.mp3` English, `vo-tr-*.mp3` Turkish), ambience and music generated with ElevenLabs by `tools/generate_audio.py`
  (`ELEVENLABS_API_KEY=… python3 tools/generate_audio.py`; the key is read from the environment and never stored).
