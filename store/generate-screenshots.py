#!/usr/bin/env python3
"""Generate branded App Store screenshots (1290x2796, 6.7") as SVG."""
import html, os

W, H = 1290, 2796
FONT = "Helvetica, Arial, sans-serif"

# Palette
ORANGE, ORANGE2, ORANGE_D = "#FF6B35", "#FF8A4B", "#ED551F"
GREEN, YELLOW = "#4CAF50", "#FFC23D"
INK, MUTED, LINE, CARD = "#1E1B18", "#6B655F", "#F0E9E3", "#F7F7F8"

# Phone geometry
PX, PW = 150, 990
PY, PH = 900, 1760
FRAME = 22
SX, SY = PX + FRAME, PY + FRAME
SW, SH = PW - 2 * FRAME, PH - 2 * FRAME
SR = 66  # screen corner radius


def esc(s):
    return html.escape(s, quote=True)


def rrect(x, y, w, h, r, fill, stroke=None, sw=0):
    s = f'<rect x="{x}" y="{y}" width="{w}" height="{h}" rx="{r}" ry="{r}" fill="{fill}"'
    if stroke:
        s += f' stroke="{stroke}" stroke-width="{sw}"'
    return s + "/>"


def text(x, y, s, size, weight, fill, anchor="start"):
    return (f'<text x="{x}" y="{y}" font-family="{FONT}" font-size="{size}" '
            f'font-weight="{weight}" fill="{fill}" text-anchor="{anchor}">{esc(s)}</text>')


def egg(cx, cy, scale):
    """Small egg logo mark centered at (cx,cy)."""
    return (f'<g transform="translate({cx} {cy}) scale({scale}) translate(-512 -520)">'
            '<g fill="#FFFFFF">'
            '<ellipse cx="512" cy="540" rx="258" ry="212"/>'
            '<circle cx="300" cy="472" r="98"/><circle cx="726" cy="600" r="88"/>'
            '<circle cx="565" cy="352" r="92"/><circle cx="405" cy="712" r="84"/>'
            '<circle cx="708" cy="428" r="72"/><circle cx="360" cy="628" r="80"/></g>'
            f'<circle cx="540" cy="512" r="122" fill="{YELLOW}"/>'
            '<ellipse cx="500" cy="476" rx="40" ry="26" fill="#FFFFFF" opacity="0.55"/></g>')


def chips(x, y, items, maxw, size=30):
    """Flow-layout rounded chips. items: [(label, dotcolor)]. Returns (svg, end_y)."""
    out, cx, cy = [], x, y
    h, padx, gap, dot = 60, 26, 16, 15
    for label, color in items:
        w = int(padx * 2 + dot + 14 + len(label) * size * 0.56)
        if cx + w > x + maxw:
            cx = x
            cy += h + gap
        out.append(rrect(cx, cy, w, h, h / 2, "#FFFFFF", LINE, 2))
        out.append(f'<circle cx="{cx+padx+dot/2}" cy="{cy+h/2}" r="{dot/2}" fill="{color}"/>')
        out.append(text(cx + padx + dot + 14, cy + h / 2 + size * 0.35, label, size, 600, INK))
        cx += w + gap
    return "".join(out), cy + h


def badge(x, y, label, fill, textcolor):
    w = int(46 + len(label) * 17)
    return rrect(x, y, w, 50, 12, fill) + text(x + w / 2, y + 33, label, 26, 700, textcolor, "middle"), w


def recipe_card(x, y, w, title, mins, diff, rows):
    """rows: [(name, available_bool)]"""
    ch = 64 + 60 + len(rows) * 46 + 30
    out = [rrect(x, y, w, ch, 28, "#FFFFFF", LINE, 2)]
    out.append(text(x + 34, y + 62, title, 38, 750, INK))
    bx = x + 34
    b1, w1 = badge(bx, y + 84, f"{mins} min", CARD, MUTED); out.append(b1); bx += w1 + 14
    b2, w2 = badge(bx, y + 84, diff, "#E8F5E9", "#2E7D32"); out.append(b2)
    ry = y + 190
    for name, avail in rows:
        mark = "✓" if avail else "•"
        mc = GREEN if avail else "#BDBDBD"
        out.append(text(x + 40, ry, mark, 34, 800, mc))
        out.append(text(x + 78, ry, name, 30, 500, INK if avail else MUTED))
        ry += 46
    return "".join(out), ch


# ---- Screen content renderers (coords relative to full canvas, within screen) ----
def screen_header(title, kicker):
    r = SR
    clip = f'<clipPath id="sc"><rect x="{SX}" y="{SY}" width="{SW}" height="{SH}" rx="{r}" ry="{r}"/></clipPath>'
    hdr = (f'<g clip-path="url(#sc)">'
           f'<rect x="{SX}" y="{SY}" width="{SW}" height="{SH}" fill="#FFFDFB"/>'
           f'<rect x="{SX}" y="{SY}" width="{SW}" height="230" fill="url(#hg)"/>'
           + text(SX + 44, SY + 90, kicker, 30, 600, "#FFE9DE")
           + text(SX + 44, SY + 150, title, 52, 800, "#FFFFFF"))
    return clip, hdr


def funfact_card(x, y, w, lines):
    h = 66 + len(lines) * 40 + 24
    out = [rrect(x, y, w, h, 24, "#E8F5E9")]
    out.append(text(x + 32, y + 58, "FUN FACT", 26, 700, "#2E7D32"))
    ty = y + 104
    for ln in lines:
        out.append(text(x + 32, ty, ln, 29, 500, INK))
        ty += 40
    return "".join(out)


def content_results():
    clip, hdr = screen_header("12 ingredients", "I spotted…")
    items = [("Spinach", GREEN), ("Cherry tomatoes", GREEN), ("Eggs", GREEN),
             ("Broccoli", GREEN), ("Thyme", "#F5A623"), ("Sage", "#F5A623"),
             ("Carrots", GREEN), ("Lemon", GREEN)]
    csvg, cy = chips(SX + 40, SY + 290, items, SW - 80)
    card, ch = recipe_card(SX + 40, cy + 40, SW - 80, "Garden Frittata with Herbs", 20, "Easy",
                           [("Eggs", True), ("Spinach", True), ("Cherry tomatoes", True), ("Olive oil", False)])
    ff = funfact_card(SX + 40, cy + 40 + ch + 40, SW - 80,
                      ["Eggplants are technically berries —",
                       "same family as tomatoes & peppers!"])
    return clip + hdr + csvg + card + ff + "</g>"


def content_ingredients():
    clip, hdr = screen_header("Reads it all", "Every shelf")
    items = [("Spinach", GREEN), ("Cherry tomatoes", GREEN), ("Broccoli", GREEN), ("Eggplant", GREEN),
             ("Carrots", GREEN), ("Oranges", GREEN), ("Lemon", GREEN), ("Butter", "#F5A623"),
             ("Eggs", GREEN), ("Thyme", "#F5A623"), ("Sage", "#F5A623"), ("Mint", GREEN),
             ("Caraway", "#F5A623"), ("Red onion", GREEN)]
    csvg, _ = chips(SX + 40, SY + 300, items, SW - 80)
    return clip + hdr + csvg + "</g>"


def content_recipes():
    clip, hdr = screen_header("3 recipes to cook", "You can make")
    c1, h1 = recipe_card(SX + 40, SY + 290, SW - 80, "Roasted Veggie Medley", 25, "Easy",
                         [("Broccoli", True), ("Carrots", True), ("Olive oil", False)])
    c2, _ = recipe_card(SX + 40, SY + 290 + h1 + 34, SW - 80, "Citrus Mint Salad", 15, "Easy",
                        [("Spinach", True), ("Lemon", True), ("Mint", True)])
    return clip + hdr + c1 + c2 + "</g>"


def content_camera():
    r = SR
    clip = f'<clipPath id="sc"><rect x="{SX}" y="{SY}" width="{SW}" height="{SH}" rx="{r}" ry="{r}"/></clipPath>'
    g = [f'<g clip-path="url(#sc)"><rect x="{SX}" y="{SY}" width="{SW}" height="{SH}" fill="#26211D"/>']
    # tip pill
    tip = "Snap your fridge, pantry & spices"
    tw = int(60 + len(tip) * 15)
    g.append(rrect(SX + (SW - tw) / 2, SY + 70, tw, 66, 33, "rgba(0,0,0,0.55)"))
    g.append(text(SX + SW / 2, SY + 112, tip, 28, 600, "#FFFFFF", "middle"))
    # framing guide
    g.append(rrect(SX + 90, SY + 260, SW - 180, SH - 720, 28, "none", "rgba(255,255,255,0.55)", 4))
    # thumbnail strip
    tx = SX + 80
    for i in range(3):
        g.append(rrect(tx, SY + SH - 320, 120, 120, 20, "#E7DFD6"))
        g.append(egg(tx + 60, SY + SH - 260, 0.09))
        tx += 140
    # shutter
    g.append(f'<circle cx="{SX+SW/2}" cy="{SY+SH-140}" r="66" fill="none" stroke="rgba(255,255,255,0.85)" stroke-width="8"/>')
    g.append(f'<circle cx="{SX+SW/2}" cy="{SY+SH-140}" r="50" fill="#FFFFFF"/>')
    # done button
    g.append(text(SX + SW - 130, SY + SH - 122, "Done", 32, 750, ORANGE, "middle"))
    return "".join(g) + "</g>"


SHOTS = [
    ("01-know-what-to-cook", "Know what to cook.", "Point your camera. Get dinner.", content_results),
    ("02-reads-your-fridge", "AI reads your\nwhole fridge.", "Every ingredient, spotted for you.", content_ingredients),
    ("03-real-recipes", "Real recipes from\nwhat you have.", "Ranked by what you already own.", content_recipes),
    ("04-fridge-pantry-spice", "Fridge, pantry\n& spice rack.", "Snap as many shelves as you like.", content_camera),
]


def phone():
    return (f'<g filter="url(#shadow)">'
            f'{rrect(PX, PY, PW, PH, 90, "#111111")}'
            f'{rrect(SX, SY, SW, SH, SR, "#FFFDFB")}'
            f'</g>')


def caption(title, sub):
    lines = title.split("\n")
    out = []
    ty = 320 if len(lines) == 1 else 300
    for ln in lines:
        out.append(text(W / 2, ty, ln, 108, 820, "#FFFFFF", "middle"))
        ty += 128
    out.append(text(W / 2, ty + 20, sub, 44, 500, "rgba(255,255,255,0.92)", "middle"))
    return "".join(out)


def build(name, title, sub, content_fn):
    svg = [f'<svg xmlns="http://www.w3.org/2000/svg" width="{W}" height="{H}" viewBox="0 0 {W} {H}">']
    svg.append('<defs>'
               f'<linearGradient id="bg" x1="0" y1="0" x2="0.4" y2="1">'
               f'<stop offset="0" stop-color="{ORANGE2}"/><stop offset="0.6" stop-color="{ORANGE}"/>'
               f'<stop offset="1" stop-color="{ORANGE_D}"/></linearGradient>'
               f'<linearGradient id="hg" x1="0" y1="0" x2="1" y2="1">'
               f'<stop offset="0" stop-color="{ORANGE}"/><stop offset="1" stop-color="#FF9138"/></linearGradient>'
               '<filter id="shadow" x="-30%" y="-20%" width="160%" height="160%">'
               '<feDropShadow dx="0" dy="30" stdDeviation="40" flood-color="#000000" flood-opacity="0.28"/>'
               '</filter></defs>')
    svg.append(rrect(0, 0, W, H, 0, "url(#bg)"))
    svg.append(caption(title, sub))
    svg.append(phone())
    svg.append(content_fn())
    svg.append("</svg>")
    path = f"/tmp/shot-{name}.svg"
    open(path, "w").write("".join(svg))
    return path


os.makedirs("/tmp/shots", exist_ok=True)
for name, title, sub, fn in SHOTS:
    p = build(name, title, sub, fn)
    print(p)
