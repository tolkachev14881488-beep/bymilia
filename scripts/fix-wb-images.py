"""Подобрать рабочие URL фото WB и обновить data/products.json"""
import json
import urllib.request
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
PRODUCTS = ROOT / "data" / "products.json"


def probe(url: str) -> bool:
    try:
        req = urllib.request.Request(
            url,
            method="HEAD",
            headers={"User-Agent": "Mozilla/5.0", "Referer": "https://www.wildberries.by/"},
        )
        with urllib.request.urlopen(req, timeout=8) as r:
            return r.status == 200
    except Exception:
        return False


def find_image(nm: int, idx: int = 1) -> str:
    vol = nm // 100000
    part = nm // 1000
    for host in range(1, 25):
        hs = f"{host:02d}"
        for size in ("c516x688", "big", "tm"):
            for ext in ("webp", "jpg"):
                url = f"https://basket-{hs}.wbbasket.ru/vol{vol}/part{part}/{nm}/images/{size}/{idx}.{ext}"
                if probe(url):
                    return url
    return ""


def main() -> None:
    data = json.loads(PRODUCTS.read_text(encoding="utf-8"))
    for p in data["products"]:
        nm = p.get("wbNm")
        if not nm:
            continue
        url = find_image(int(nm), p.get("wbPhoto", 1))
        p["image"] = url
        status = "OK" if url else "нет фото (цветной блок)"
        print(f"{p['colorName']}: {status}")
        if url:
            print(f"  {url}")
    PRODUCTS.write_text(json.dumps(data, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")


if __name__ == "__main__":
    main()
