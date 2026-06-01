"""Импорт 4 карточек WB в data/products.json"""
import json
import urllib.request
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
OUT = ROOT / "data" / "products.json"

BASKET_RANGES = [
    (0, 143, "01"), (144, 287, "02"), (288, 431, "03"), (432, 575, "04"),
    (576, 719, "05"), (720, 863, "06"), (864, 1007, "07"), (1008, 1151, "08"),
    (1152, 1295, "09"), (1296, 1439, "10"), (1440, 1583, "11"), (1584, 1727, "12"),
    (1728, 1871, "13"), (1872, 2015, "14"), (2016, 2159, "15"), (2160, 2303, "16"),
    (2304, 2447, "17"), (2448, 2591, "18"),
]

COLOR_HEX = {
    "черный": "#1c1c1c", "белый": "#f5f5f0", "розовый": "#f48fb1",
    "красный": "#e53935", "желтый": "#ffca28", "оранжевый": "#ff5500",
    "голубой": "#4fc3f7", "синий": "#3d5afe", "фиолетовый": "#9c27b0",
}

LABELS = {
    230183062: ("wb-black", "Чёрный", "#1c1c1c"),
    216515622: ("wb-tropical", "Тропический принт", "#4fc3f7"),
    471902869: ("wb-bright", "Яркий принт", "#ffca28"),
    216496169: ("wb-classic", "Классика · 5 цветов", "#ff5500"),
}

URLS = [
    "https://www.wildberries.by/catalog/230183062/detail.aspx",
    "https://www.wildberries.by/catalog/216515622/detail.aspx",
    "https://www.wildberries.by/catalog/471902869/detail.aspx",
    "https://www.wildberries.by/catalog/216496169/detail.aspx",
]


def basket_host(vol: int) -> str:
    for f, t, h in BASKET_RANGES:
        if f <= vol <= t:
            return h
    return "14"


def image_url(nm: int, idx: int = 1) -> str:
    vol = nm // 100000
    part = nm // 1000
    host = basket_host(vol)
    return f"https://basket-{host}.wbbasket.ru/vol{vol}/part{part}/{nm}/images/big/{idx}.webp"


def fetch(nm: int) -> dict:
    url = f"https://card.wb.ru/cards/v4/detail?appType=1&curr=byn&dest=-59208&nm={nm}"
    req = urllib.request.Request(url, headers={"User-Agent": "Mozilla/5.0"})
    data = json.loads(urllib.request.urlopen(req, timeout=25).read())
    p = data["products"][0]
    pr = p["sizes"][0]["price"]
    price = round(pr["product"] / 100)
    old = round(pr["basic"] / 100)
    pid, cname, chex = LABELS.get(nm, (f"wb-{nm}", p["name"], "#ff5500"))
    colors = [c["name"] for c in p.get("colors", [])]
    return {
        "id": pid,
        "colorName": cname,
        "colorHex": chex,
        "price": price,
        "oldPrice": old if old > price else None,
        "skuPrefix": f"BM-{nm}",
        "image": image_url(nm, 1),
        "wbNm": nm,
        "wbUrl": f"https://www.wildberries.by/catalog/{nm}/detail.aspx",
        "wbPhoto": 1,
        "published": True,
        "description": (
            "Сапожки для разогрева By Milia — согревают стопы перед занятием, "
            "на репетиции и между номерами. Мягкий флис, удобная посадка, производство в Минске."
        ),
        "features": [
            "6 размеров · 25–42 см",
            f"На WB: {', '.join(colors)}" if colors else "См. карточку на Wildberries",
            f"{p.get('feedbacks', 0)} отзывов · рейтинг {p.get('reviewRating', p.get('rating', '—'))}",
            "Заказ на сайте или на Wildberries",
        ],
    }


def main() -> None:
    products = []
    for u in URLS:
        nm = int(u.split("/catalog/")[1].split("/")[0])
        products.append(fetch(nm))
        print(f"OK {nm} -> {products[-1]['colorName']} {products[-1]['price']} руб.")
    OUT.write_text(json.dumps({"products": products}, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    print("Written", OUT)


if __name__ == "__main__":
    main()
