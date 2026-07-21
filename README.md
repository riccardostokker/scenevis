# scene-analyzer

`scene-analyzer` measures target visibility in photographs with dark targets and bright
backgrounds. It keeps quantitative work on linear image data and generates a clean source-plus-
KPI summary image along with a separate ROI diagnostic image.

The tool is an engineering comparison system, not a calibrated lux meter. Rendered JPEG, PNG,
and TIFF inputs are supported but explicitly reported as lower-confidence sources; Canon CR2
and DNG inputs use a fixed rawpy profile with linear gamma, camera white balance, no automatic
brightness, clipped highlights, and disabled noise reduction.

## Package shape

The source tree uses three narrative owners rather than horizontal `models`, `utils`, and
`loaders` buckets:

```text
src/scene_analyzer/
├── __init__.py          curated public API
├── __main__.py          thin executable entrypoint
├── cli.py               command parsing and result presentation
├── error.py             package-wide actionable error
├── scene/               source images and authored ROI contracts
│   ├── model.py
│   ├── roi.py
│   ├── selection/       native ROI authoring window and suggestion policy
│   │   ├── model.py
│   │   └── view.py
│   └── load/            sealed RAW/raster source variants
│       ├── raw.py
│       └── raster.py
├── analysis/            formulas, result contract, and analysis workflow
│   ├── model.py
│   ├── metrics.py
│   └── pipeline.py
└── report/              output image and machine-readable records
    ├── overlay.py
    └── write.py
```

Dependencies point forward through the workflow: `scene → analysis → report`. Display-adjusted
pixels exist only for the output images and selection window; metric code receives only
normalized linear arrays.

## Development

Install the pinned toolchain, locked dependencies, and Git hooks:

```sh
mise install
mise run sync
mise run hooks:install
```

Use the mise task surface for routine work:

```sh
mise run check
mise run test
mise run hooks
mise run changelog:preview
mise run python:release
```

`check` is read-only and intentionally excludes tests. `version:release` is the explicit
mutating release workflow driven by Conventional Commits and git-cliff.

Full-resolution Canon EOS 200D fixtures live under `tests/fixtures/canon_eos_200d/`. The normal
suite skips their slower decode pass; run the original-file integration coverage explicitly:

```sh
mise run test:fixtures
```

The fixture manifest records source provenance, exact byte sizes, dimensions, and SHA-256 hashes.
The originals are intentionally exempted only from prek's generic 1 MB file limit; all other
large files remain rejected.

Curated ROI documents for the indoor clipped-lamp scene and outdoor bright-sky scene live under
`tests/fixtures/canon_eos_200d/rois/`. The fixture suite runs both CR2 files through the complete
analysis and PNG/JSON/CSV output path.

## Select regions

Open the desktop selector with an image:

```sh
scene-analyzer select-rois corridor_01.CR2
```

Draw the target first. The tool suggests a surrounding local-background rectangle and the
brightest available background rectangle; redraw either suggestion before saving when the scene
calls for it. All three regions remain explicit, reviewable inputs to the measurements.

By default the YAML is stored beside the source image as `corridor_01.rois.yaml`. Choose another
location when needed:

```sh
scene-analyzer select-rois corridor_01.CR2 --output rois/corridor_01.yaml
```

## Analyze a scene

Create a YAML region file like [examples/corridor.rois.yaml](examples/corridor.rois.yaml), then
run:

```sh
scene-analyzer analyze corridor_01.CR2 \
  --rois corridor_01.rois.yaml \
  --output-dir results
```

The command writes:

```text
results/
├── corridor_01.summary.png
├── corridor_01.diagnostic.png
├── corridor_01.analysis.json
└── corridor_01.analysis.csv
```

The summary PNG places the unobstructed, exposure-adjusted source preview beside a KPI column.
The diagnostic PNG adds target, local-background, and bright-background outlines for auditing.
Both side panels report dynamic-range stress, robust CNR, Weber and Michelson contrast, target
SNR, shadow-floor occupancy, highlight clipping, and all validity warnings. JSON and CSV contain
the same numerical result.

## Python API

```python
from pathlib import Path

from scene_analyzer import analyze_scene, load_roi_config

config = load_roi_config(Path("examples/corridor.rois.yaml"))
result = analyze_scene(image_path=Path("corridor_01.CR2"), roi_config=config)

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

Small denominators use the configured epsilon. Thresholds are reported as measurements and
warnings, not universal device pass/fail rules; those need calibration against real device data.
