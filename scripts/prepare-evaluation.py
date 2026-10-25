"""Select source-labelled photos before inference. Python 3, standard library only."""
import hashlib, json, pathlib, urllib.request, zipfile

ROOT = pathlib.Path(__file__).resolve().parents[1]
CACHE = ROOT / '.evaluation-cache'
CACHE.mkdir(exist_ok=True)
archive = CACHE / 'realwaste.zip'
if not archive.exists() or not zipfile.is_zipfile(archive):
    partial = CACHE / 'realwaste.partial'
    with urllib.request.urlopen('https://archive.ics.uci.edu/static/public/908/realwaste.zip', timeout=120) as response, partial.open('wb') as output:
        while chunk := response.read(4 * 1024 * 1024):
            output.write(chunk)
    partial.replace(archive)

mapping = {'Cardboard':'paper', 'Paper':'paper', 'Food Organics':'organic', 'Vegetation':'organic', 'Glass':'glass', 'Metal':'metal', 'Miscellaneous Trash':'residual', 'Plastic':'plastic', 'Textile Trash':'textile'}
photos = ROOT / 'public/evaluation/photos'
photos.mkdir(parents=True, exist_ok=True)
manifest = []
seen = set()
with zipfile.ZipFile(archive) as z:
    pools = {}
    for name in z.namelist():
        path = pathlib.PurePosixPath(name)
        if path.suffix.lower() not in ('.jpg', '.jpeg', '.png') or path.parent.name not in mapping:
            continue
        category = mapping[path.parent.name]
        pools.setdefault(category, []).append(name)
    print({key:len(value) for key,value in pools.items()})
    for category in sorted(set(mapping.values())):
        # Fixed seed and source path; independent of model predictions.
        ordered = sorted(pools[category], key=lambda name:hashlib.sha256(('srijan-eval-v1:'+name).encode()).hexdigest())
        count = 15 if category == 'plastic' else 14
        selected = 0
        for source in ordered:
            data = z.read(source)
            digest = hashlib.sha256(data).hexdigest()
            if digest in seen:
                continue
            seen.add(digest)
            selected += 1
            file = f'{category}-{selected:02d}{pathlib.PurePosixPath(source).suffix.lower()}'
            (photos / file).write_bytes(data)
            manifest.append({'testImage':file, 'expectedCategory':category, 'sourceLabel':pathlib.PurePosixPath(source).parent.name, 'sourcePath':source, 'sha256':digest, 'source':'RealWaste (UCI distribution)', 'sourceUrl':'https://archive.ics.uci.edu/dataset/908/realwaste', 'license':'CC BY 4.0 (UCI distribution; see attribution) '})
            if selected == count:
                break
        assert selected == count
assert len(manifest) == 99
(ROOT / 'src/data/evaluationManifest.json').write_text(json.dumps(manifest, indent=2)+'\n', encoding='utf-8')
print(f'Prepared {len(manifest)} unique source-labelled photos; e-waste and hazardous are untested.')
