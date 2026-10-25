"""Group duplicates, reserve existing benchmark, create deterministic data splits.

Run after prepare-evaluation.py. Training images remain in the ignored cache.
No model predictions are read here. Pillow is the only non-standard dependency.
"""
import ast
import hashlib
import io
import json
from collections import Counter, defaultdict
from pathlib import Path
import zipfile
from PIL import Image, ImageOps

ROOT = Path(__file__).resolve().parents[1]
CACHE = ROOT / '.evaluation-cache/training'
CACHE.mkdir(parents=True, exist_ok=True)
MAPPING = {
    'Cardboard': 'paper', 'Paper': 'paper',
    'Food Organics': 'organic', 'Vegetation': 'organic',
    'Glass': 'glass', 'Metal': 'metal', 'Miscellaneous Trash': 'residual',
    'Plastic': 'plastic', 'Textile Trash': 'textile',
}
EWASTE_MAPPING = {
    'battery waste':'hazardous', 'keyboard':'ewaste', 'mobile':'ewaste',
    'mouse':'ewaste', 'pcb':'ewaste', 'glass waste':'glass',
    'metal waste':'metal', 'organic waste':'organic',
    'paper waste':'paper', 'plastic waste':'plastic',
}
benchmark = json.loads((ROOT / 'src/data/evaluationManifest.json').read_text())
benchmark_hashes = {r['sha256'] for r in benchmark}
rows = []
for archive_file, source_name, source_mapping, source_url in [
    ('realwaste.zip','RealWaste',MAPPING,'https://archive.ics.uci.edu/dataset/908/realwaste'),
    ('ewaste.zip','Bangladeshi e-waste',EWASTE_MAPPING,'https://data.mendeley.com/datasets/77383kmdnw/1'),
]:
  with zipfile.ZipFile(ROOT / '.evaluation-cache' / archive_file) as archive:
    source_names = ast.literal_eval(next(line.split(':',1)[1].strip() for line in archive.read('data.yaml').decode().splitlines() if line.startswith('names:'))) if source_name!='RealWaste' else None
    for name in sorted(archive.namelist()):
        path = Path(name)
        normalized = path.parent.name.lower().replace('_',' ').replace('-',' ').strip()
        label_key = path.parent.name if source_name=='RealWaste' else normalized
        source_label = path.parent.name
        if source_names and path.suffix.lower() in ('.jpg','.jpeg','.png'):
            label_path = str(path.with_suffix('.txt')).replace('\\','/').replace('/images/','/labels/')
            if label_path not in archive.namelist():
                continue
            ids = {int(float(line.split()[0])) for line in archive.read(label_path).decode().splitlines() if line.strip()}
            if len(ids)!=1:
                continue  # image-level material labels require one source class
            source_label = source_names[next(iter(ids))]
            label_key = source_label.lower().replace('_',' ').strip()
        if path.suffix.lower() not in ('.jpg', '.jpeg', '.png') or label_key not in source_mapping:
            continue
        data = archive.read(name)
        digest = hashlib.sha256(data).hexdigest()
        photo = ImageOps.exif_transpose(Image.open(io.BytesIO(data))).convert('RGB')
        # 64-bit difference hash: group very similar images without fitting labels.
        gray = list(photo.convert('L').resize((9, 8), Image.Resampling.LANCZOS).getdata())
        dhash = sum((gray[y * 9 + x] > gray[y * 9 + x + 1]) << (y * 8 + x) for y in range(8) for x in range(8))
        destination = CACHE / 'photos' / (digest + path.suffix.lower())
        destination.parent.mkdir(exist_ok=True)
        if not destination.exists():
            destination.write_bytes(data)
        rows.append({'source':source_name, 'sourceUrl':source_url, 'sourcePath':name, 'sourceLabel':source_label, 'sourceGroup':path.stem.split('.rf.')[0] if source_names else None, 'sourceSplit':{'train':'train','valid':'validation','test':'test'}.get(path.parts[0]) if source_names else None, 'category':source_mapping[label_key], 'sha256':digest, 'dhash':format(dhash, '016x'), 'file':str(destination.relative_to(ROOT)).replace('\\', '/')})

parent = list(range(len(rows)))
def find(index):
    while parent[index] != index:
        parent[index] = parent[parent[index]]
        index = parent[index]
    return index
def union(left, right):
    a, b = find(left), find(right)
    if a != b:
        parent[max(a, b)] = min(a, b)

# Group source-authored augmentation variants by original filename as well.
original_groups = {}
for index,row in enumerate(rows):
    if row['sourceGroup']:
        if row['sourceGroup'] in original_groups:
            union(index,original_groups[row['sourceGroup']])
        original_groups[row['sourceGroup']] = index
# Also group byte/perceptual duplicates across both sources.
for i, row in enumerate(rows):
    for j in range(i):
        other = rows[j]
        if row['sha256'] == other['sha256'] or (int(row['dhash'],16) ^ int(other['dhash'],16)).bit_count() <= 4:
            union(i,j)
groups = defaultdict(list)
for index, row in enumerate(rows):
    groups[find(index)].append(row)

for group in groups.values():
    identifier = min(row['sha256'] for row in group)
    if any(row['sha256'] in benchmark_hashes for row in group):
        split = 'benchmark'  # also excludes near-duplicates of every test photo
    elif len({row['category'] for row in group}) != 1:
        split = 'excluded-label-conflict'
    else:
        partitions = {row['sourceSplit'] for row in group if row['sourceSplit']}
        if partitions:
            split = 'test' if 'test' in partitions else 'validation' if 'validation' in partitions else 'train'
        else:
            bucket = int(hashlib.sha256(('srijan-train-v1:' + identifier).encode()).hexdigest()[:8],16) % 100
            split = 'train' if bucket < 75 else 'validation' if bucket < 87 else 'test'
    for row in group:
        row['group'] = identifier
        row['split'] = split
    seen_hashes = set()
    for row in group:
        if split=='benchmark' and row['sha256'] not in benchmark_hashes:
            row['split']='excluded-benchmark-neighbour'
        if row['sha256'] in seen_hashes:
            row['split'] = 'excluded-byte-duplicate'
        seen_hashes.add(row['sha256'])
    if split in ('validation','test'):
        active = sorted((r for r in group if not r['split'].startswith('excluded')), key=lambda r:(r['sourceSplit']!=split,r['sha256']))
        for row in active[1:]:
            row['split']='excluded-heldout-duplicate'

assert all(row['split'] != 'train' for row in rows if row['sha256'] in benchmark_hashes)
for group in groups.values():
    assert len({r['split'] for r in group if not r['split'].startswith('excluded')}) <= 1
report = {
    'version':1, 'seed':'srijan-train-v1',
    'sources':['https://archive.ics.uci.edu/dataset/908/realwaste','https://data.mendeley.com/datasets/77383kmdnw/1'],
    'method':'SHA-256 bytes, source augmentation filenames and dHash Hamming <=4 form groups. Conflicting labels excluded. Original 99 benchmark groups reserved. RealWaste: SHA-256 group buckets 75/12/13 train/validation/test. Mendeley: source train/valid/test partitions preserved (test takes precedence on overlap). Only one representative per validation/test group. Mixed-class source images, Medical_Waste and Light_Bulb omitted. All source augmentations of one original stay together.',
    'limitations':'No physical-object identity metadata; perceptual grouping reduces but cannot rule out leakage. Same-source held-out data is not independent local validation.',
    'counts':dict(Counter(row['split'] for row in rows)),
    'perCategory':{category:dict(Counter(row['split'] for row in rows if row['category']==category)) for category in sorted(set(MAPPING.values()) | set(EWASTE_MAPPING.values()))},
    'rows':rows,
}
(CACHE / 'split.json').write_text(json.dumps(report,indent=2)+'\n')
public = ROOT / 'public/models/waste-v1'
public.mkdir(parents=True,exist_ok=True)
(public / 'split-manifest.json').write_text(json.dumps({**report,'rows':[{key:value for key,value in row.items() if key!='file'} for row in rows]},indent=2)+'\n')
print(json.dumps({key:report[key] for key in ['counts','perCategory']},indent=2),flush=True)
