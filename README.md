# Roman Mersin — a 3D map of ancient Cilicia

An interactive three.js map of ten Roman sites in Mersin province, Türkiye, on real terrain.
Click a beacon to fly to a site, read what stands there and how we know, and hear a short narration.

```
npm install
npm run dev      # http://localhost:5173
npm run build    # static site in dist/
```

- **Research and citations:** [SOURCES.md](SOURCES.md)
- **Controls:** drag to orbit, scroll to zoom, right-drag to pan. `1–0` jump to a site, `←/→` previous/next, `T` tour, `M` sound, `G` golden hour, `R` roads, `H` overview, `Esc` close.
- Add `?q=low` to the URL for a lighter render (slow devices automatically drop shadows and retina resolution).

## How it is built
- `public/heightmap.png` — real elevation (SRTM via Mapzen Terrarium tiles), built by `tools/build_heightmap.py`.
- `src/terrain.js` — terrain mesh, hypsometric colouring, animated sea.
- `src/monuments.js` — procedural miniature of each site, based on its standing remains.
- `src/sites.js` — site texts, each claim keyed to a source.
- `public/audio/` — narration, ambience and music generated with ElevenLabs by `tools/generate_audio.py`
  (`ELEVENLABS_API_KEY=… python3 tools/generate_audio.py`; the key is read from the environment and never stored).
