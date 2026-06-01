"""Remove backgrounds from hero boot photos and save to assets/."""
from pathlib import Path

from PIL import Image
from rembg import remove

SRC = Path(r"C:\Users\СмайлБук\.cursor\projects\c-Users-Downloads-sapozhki\assets")
DST = Path(__file__).resolve().parent.parent / "assets"

MAPPING = {
    "30d86f7a": "hero-boot-comic.png",
    "2e2daddc": "hero-boot-tropical.png",
    "c5e2f2fa": "hero-boot-unicorn.png",
}


def trim_alpha(img: Image.Image) -> Image.Image:
    bbox = img.getbbox()
    if bbox:
        img = img.crop(bbox)
    return img


def process_one(src: Path, out: Path) -> None:
    raw = src.read_bytes()
    result = remove(raw)
    img = Image.open(__import__("io").BytesIO(result)).convert("RGBA")
    img = trim_alpha(img)
    w, h = img.size
    max_side = 900
    if max(w, h) > max_side:
        scale = max_side / max(w, h)
        img = img.resize((int(w * scale), int(h * scale)), Image.Resampling.LANCZOS)
    out.parent.mkdir(parents=True, exist_ok=True)
    img.save(out, "PNG", optimize=True)
    print(f"OK {out.name} {img.size}")


def main() -> None:
    for key, name in MAPPING.items():
        matches = list(SRC.glob(f"*{key}*"))
        if not matches:
            raise FileNotFoundError(f"No source for {key}")
        process_one(matches[0], DST / name)


if __name__ == "__main__":
    main()
