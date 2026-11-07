"""Lefedettségi térkép saját alaprajza — OSM-adatból, egyszeri lekérés (CI-ben).
Kimenet: terkep-alap.geojson (egyszerűsített, kerekített).
Rétegek: Budapest 23 kerülete, környező települések (admin_level 8),
Duna (vízfelület), autópályák/főutak. © OpenStreetMap közreműködők (ODbL).
"""
import json, subprocess, sys, time, urllib.parse, urllib.request
from shapely.geometry import shape, mapping, box
from shapely.ops import unary_union

S, W, N, E = 47.30, 18.70, 47.63, 19.36
BB = f"{S},{W},{N},{E}"
Q = {
 "districts": f'[out:json][timeout:180];area["name"="Budapest"]["admin_level"="6"]->.b;rel(area.b)["boundary"="administrative"]["admin_level"="9"];out geom;',
 "towns": f'[out:json][timeout:180];rel["boundary"="administrative"]["admin_level"="8"]({BB});out geom;',
 "water": f'[out:json][timeout:180];(way["natural"="water"]["water"="river"]({BB});rel["natural"="water"]["water"="river"]({BB});way["waterway"="riverbank"]({BB});rel["waterway"="riverbank"]({BB}););out geom;',
 "roads": f'[out:json][timeout:180];way["highway"~"^(motorway|trunk)$"]({BB});out geom;',
}
EPS = {"districts": 0.0006, "towns": 0.0008, "water": 0.0004, "roads": 0.0006}
clip = box(W, S, E, N)
out = []
for key, q in Q.items():
    for attempt in range(4):
        try:
            req = urllib.request.Request("https://overpass-api.de/api/interpreter", data=urllib.parse.urlencode({"data": q}).encode(), headers={"User-Agent": "soderarak-terkep-build"})
            raw = urllib.request.urlopen(req, timeout=240).read()
            break
        except Exception as e:
            print(key, "retry", e, file=sys.stderr); time.sleep(20)
    open(f"{key}.osm.json", "wb").write(raw)
    gj = json.loads(subprocess.check_output(["npx", "--yes", "osmtogeojson@3.0.0-beta.5", f"{key}.osm.json"]))
    feats = [f for f in gj["features"] if f["geometry"]]
    print(key, len(feats), file=sys.stderr)
    if key == "water":
        geoms = [shape(f["geometry"]) for f in feats if f["geometry"]["type"] in ("Polygon", "MultiPolygon")]
        g = unary_union([x.buffer(0) for x in geoms]).intersection(clip).simplify(EPS[key])
        out.append({"type": "Feature", "properties": {"k": "water"}, "geometry": mapping(g)})
        continue
    for f in feats:
        g = shape(f["geometry"])
        if key in ("districts", "towns") and g.geom_type not in ("Polygon", "MultiPolygon"):
            continue
        if key == "roads" and g.geom_type not in ("LineString", "MultiLineString"):
            continue
        g = g.buffer(0) if key != "roads" else g
        g = g.intersection(clip).simplify(EPS[key])
        if g.is_empty:
            continue
        p = f["properties"]
        props = {"k": {"districts": "district", "towns": "town", "roads": "road"}[key]}
        if key != "roads":
            props["name"] = p.get("name", "")
            if key == "districts":
                props["ref"] = p.get("ref", "")
        out.append({"type": "Feature", "properties": props, "geometry": mapping(g)})

def rnd(o):
    if isinstance(o, float): return round(o, 5)
    if isinstance(o, (list, tuple)): return [rnd(x) for x in o]
    if isinstance(o, dict): return {k: rnd(v) for k, v in o.items()}
    return o
# az utakból csak a lényeg (összevonás)
roads = [f for f in out if f["properties"]["k"] == "road"]
others = [f for f in out if f["properties"]["k"] != "road"]
if roads:
    m = unary_union([shape(f["geometry"]) for f in roads]).simplify(EPS["roads"])
    others.append({"type": "Feature", "properties": {"k": "road"}, "geometry": mapping(m)})
fc = {"type": "FeatureCollection", "attribution": "© OpenStreetMap közreműködők (ODbL)", "bbox": [W, S, E, N], "features": rnd(others)}
json.dump(fc, open("terkep-alap.geojson", "w"), ensure_ascii=False, separators=(",", ":"))
print("names:", sorted({f["properties"].get("name", "") for f in others}), file=sys.stderr)
