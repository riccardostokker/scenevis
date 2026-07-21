from __future__ import annotations

from pathlib import Path

from PIL import Image, ImageDraw, ImageFont

from scene_analyzer.analysis.model import Result
from scene_analyzer.scene.roi import Region, RoiConfig, vertices

COLORS = {
    "target": "#ffb000",
    "local_background": "#00d5ff",
    "bright_background": "#ff4f81",
}


def save(*, preview: Image.Image, config: RoiConfig, result: Result, path: Path) -> None:
    """Save a scene preview with ROI outlines, KPIs, and validity warnings."""

    scene = preview.convert("RGB").copy()
    scene.thumbnail((1600, 1200), Image.Resampling.LANCZOS)
    panel_width = max(460, scene.width // 3)
    panel_height = 680 + 62 * len(result.warnings)
    canvas_height = max(scene.height, panel_height)
    canvas = Image.new("RGB", (scene.width + panel_width, canvas_height), "#121212")
    canvas.paste(scene, (0, 0))
    draw = ImageDraw.Draw(canvas)
    font = _font(22)
    small = _font(18)
    title = _font(28)

    regions: list[tuple[str, Region]] = [
        ("target", config.regions.target),
        ("local_background", config.regions.local_background),
        ("bright_background", config.regions.bright_background),
    ]
    for name, region in regions:
        points = vertices(region, width=scene.width, height=scene.height)
        draw.line([*points, points[0]], fill=COLORS[name], width=5, joint="curve")
        label = name.replace("_", " ")
        origin = points[0]
        box = draw.textbbox(origin, label, font=small, stroke_width=1)
        draw.rectangle((box[0] - 4, box[1] - 2, box[2] + 4, box[3] + 2), fill="#101010")
        draw.text(origin, label, font=small, fill=COLORS[name], stroke_width=1)

    x = scene.width + 28
    y = 28
    draw.text((x, y), result.scene_id, font=title, fill="white")
    y += 48
    draw.text((x, y), result.image, font=small, fill="#b8b8b8")
    y += 46

    metrics = result.metrics
    kpis = [
        ("DR target", f"{metrics.dr_target_median_stops:.2f} stops"),
        ("DR local", f"{metrics.dr_local_median_stops:.2f} stops"),
        ("CNR robust", f"{metrics.cnr_robust:.2f}"),
        ("Weber contrast", f"{metrics.weber_contrast_signed:+.3f}"),
        ("Michelson contrast", f"{metrics.michelson_contrast:+.3f}"),
        ("Target SNR", f"{metrics.snr_target_robust:.2f}"),
        ("Target below 1%", f"{metrics.target_below_1_percent:.1%}"),
        ("Bright clipped", f"{metrics.bright_clipped_99_percent:.1%}"),
    ]
    for label, value in kpis:
        draw.text((x, y), label, font=small, fill="#a9a9a9")
        draw.text((x + panel_width - 56, y), value, font=font, fill="white", anchor="ra")
        y += 38

    y += 20
    warning_color = "#ffb000" if result.warnings else "#61d095"
    draw.text((x, y), "Validity warnings", font=font, fill=warning_color)
    y += 36
    if not result.warnings:
        draw.text((x, y), "None", font=small, fill="#b8b8b8")
    for warning in result.warnings:
        y = _wrapped_text(
            draw,
            text=f"• {warning}",
            x=x,
            y=y,
            width=panel_width - 56,
            font=small,
            fill="#e5e5e5",
        )
        y += 10

    notice_y = canvas.height - 70
    _wrapped_text(
        draw,
        text=result.preview_notice,
        x=x,
        y=notice_y,
        width=panel_width - 56,
        font=_font(15),
        fill="#8e8e8e",
    )
    canvas.save(path, format="PNG")


def _wrapped_text(
    draw: ImageDraw.ImageDraw,
    *,
    text: str,
    x: int,
    y: int,
    width: int,
    font: ImageFont.FreeTypeFont | ImageFont.ImageFont,
    fill: str,
) -> int:
    words = text.split()
    lines: list[str] = []
    current = ""
    for word in words:
        candidate = f"{current} {word}".strip()
        if current and draw.textlength(candidate, font=font) > width:
            lines.append(current)
            current = word
        else:
            current = candidate
    if current:
        lines.append(current)
    for line in lines:
        draw.text((x, y), line, font=font, fill=fill)
        y += 24
    return y


def _font(size: int) -> ImageFont.FreeTypeFont | ImageFont.ImageFont:
    try:
        return ImageFont.truetype("DejaVuSans.ttf", size)
    except OSError:
        return ImageFont.load_default()
