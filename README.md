# Scenevis

Scenevis measures how clearly a selected target separates from its photographic surroundings.
It combines a React image workspace with a typed Python analysis engine for Canon CR2, DNG,
JPEG, PNG, and TIFF sources.

The application keeps the original image, selected regions, preview, and result in browser
memory. The local backend uses bounded temporary files only while decoding a request. It does not
create region sidecars, retain images, or persist analysis state.

## Application

Start the development application with live reload:

```sh
mise run dev
```

Open <http://127.0.0.1:5173>, then:

1. Drop or choose one or more RAW or raster images.
2. Rename each scenario in the location rail when the filename is not descriptive enough.
3. Select **Target**, then draw it with the floating **Box** or **Lasso** tool.
4. Review the detected **Local Background** and **Bright Background** regions. Use **Select**,
   **Box**, or **Lasso** to inspect or refine them.
5. Analyze scenarios individually or select **Analyze All** when every target is ready.
6. Open **Compare** to review aligned KPIs, then select **Export Report**.

The HTML artifact embeds a compressed display preview and validated zones for every completed
scenario, an aligned comparison table, warnings, ordered KPI values, and their descriptions. It
contains no external assets or executable scripts.

Build the frontend into the Python package and run the single-word CLI:

```sh
mise run build:dev
scenevis
```

`scenevis --no-browser` starts the packaged app without opening a browser automatically. The
packaged service listens on `127.0.0.1:8765` by default.

## Measurement Order

The interface presents the most relevant target-visibility evidence first:

1. **Robust Contrast-to-Noise Ratio**
2. **Weber Contrast**
3. **Target Dynamic Range**
4. **Target Signal-to-Noise Ratio**
5. **Bright-Background Clipping**
6. **Target Shadows Below 1%**
7. **Local-Background Dynamic Range**
8. **Michelson Contrast**

Each metric includes a plain-language description directly below its Title Case name. Validity
warnings remain visually separate from the measurements.

Scenevis is an engineering comparison tool, not a calibrated lux meter. Quantitative work uses
normalized linear image data. Display previews are exposure-adjusted and never feed back into the
measurement pipeline.

## Architecture

The repository is organized by workflow ownership:

```text
scenevis/
├── app/                              React 19 and Vite 8 application
│   └── src/
│       ├── app/                      application composition
│       ├── components/ui/            shadcn UI primitives
│       ├── features/scene-analysis/ scenario state, region editing, KPIs, and reports
│       └── shared/api/               generated contract types and client
├── src/scenevis/
│   ├── scene/                        image loading and normalized regions
│   ├── analysis/                     statistics and visibility formulas
│   └── api/                          ephemeral FastAPI transport
├── tests/                            Python and full-camera integration tests
└── mise.toml                         unified developer command surface
```

FastAPI owns the OpenAPI contract. `openapi-typescript` derives the frontend schema from it, and
`mise run contract:check` prevents drift. The transport accepts two commands:

- `POST /api/previews`: upload one image and receive a compressed display preview, metadata, and a
  bright-background suggestion.
- `POST /api/analyses`: upload the image plus normalized in-memory regions and receive the result
  with the validated regions that produced it.

Both operations return a stable error envelope and reject unsupported, empty, or larger-than-100
MiB uploads.

## Development

Install the pinned Python and Node toolchains, locked dependencies, and hooks:

```sh
mise install
mise run sync
mise run hooks:install
```

Use the mise task surface:

```sh
mise run check
mise run test
mise run test:gui
mise run test:gui:e2e
mise run test:fixtures
mise run audit
mise run build:dev
mise run python:release
```

`check` is read-only and covers Python formatting, Ruff, ty, Biome, TypeScript, version metadata,
both lockfiles, and API-contract drift. The normal Python suite excludes the slower original-camera
lane.

Full-resolution Canon EOS 200D fixtures live under `tests/fixtures/canon_eos_200d/`. Their JSON
manifest records source provenance, exact byte sizes, dimensions, and SHA-256 hashes. Run the
original CR2 integration path explicitly with `mise run test:fixtures`.

## Python API

```python
from pathlib import Path

from scenevis import Rectangle, Regions, analyze_scene

regions = Regions(
    target=Rectangle(x=0.40, y=0.35, width=0.12, height=0.18),
    local_background=Rectangle(x=0.30, y=0.25, width=0.32, height=0.38),
    bright_background=Rectangle(x=0.72, y=0.08, width=0.18, height=0.20),
)
result = analyze_scene(image_path=Path("scene.CR2"), regions=regions)

print(result.metrics.cnr_robust)
print(result.metrics.dr_target_median_stops)
```

The primary formulas are:

```text
DR_target = log2(bright_median / target_median)
Weber = (target_median - local_median) / local_median
Michelson = (target_median - local_median) / (target_median + local_median)
CNR = |target_median - local_median| / sqrt(target_sigma² + local_sigma²)
SNR_target = target_median / target_sigma
sigma_robust = 1.4826 × median(|x - median(x)|)
```

Thresholds are reported as measurements and warnings rather than universal pass/fail rules.
