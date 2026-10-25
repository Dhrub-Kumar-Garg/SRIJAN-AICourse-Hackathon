"""Download version-pinned public training data. Python standard library only."""
import concurrent.futures
import hashlib
from pathlib import Path
import subprocess
import sys
import urllib.request

ROOT=Path(__file__).resolve().parents[1]
CACHE=ROOT/'.evaluation-cache'
CACHE.mkdir(exist_ok=True)
# Existing helper downloads the UCI distribution and fixes the 99-photo benchmark.
subprocess.run([sys.executable,str(ROOT/'scripts/prepare-evaluation.py')],cwd=ROOT,check=True)

# Official public object returned by Mendeley Data version 1's download link:
# https://data.mendeley.com/public-files/datasets/77383kmdnw/files/ad031b3c-13e5-4913-8cdd-71dccfab980f/file_downloaded
url='https://prod-dcd-datasets-public-files-eu-west-1.s3.eu-west-1.amazonaws.com/c022fd6e-028e-44ba-ad98-cad7719d3538'
size=72987704
expected_md5='da856b28501176d9c9f06999efedb7c3' # public single-part S3 ETag
target=CACHE/'ewaste.zip'
if target.exists() and hashlib.md5(target.read_bytes()).hexdigest()==expected_md5:
    print('Verified cached Mendeley version 1 dataset.');sys.exit(0)
parts=CACHE/'ewaste-download-parts'
parts.mkdir(exist_ok=True)
chunk_size=2*1024*1024
def download(index):
    start=index*chunk_size;end=min(size,start+chunk_size)-1
    part=parts/str(index)
    if part.exists() and part.stat().st_size==end-start+1:return
    for attempt in range(6):
        try:
            request=urllib.request.Request(url,headers={'Range':f'bytes={start}-{end}'})
            with urllib.request.urlopen(request,timeout=60) as response:
                if response.status!=206:raise RuntimeError('Server did not honor Range')
                data=response.read()
            if len(data)!=end-start+1:raise RuntimeError('Incomplete chunk')
            part.write_bytes(data);return
        except Exception:
            if attempt==5:raise
count=(size+chunk_size-1)//chunk_size
with concurrent.futures.ThreadPoolExecutor(max_workers=6) as pool:
    list(pool.map(download,range(count)))
partial=CACHE/'ewaste.complete.partial'
with partial.open('wb') as output:
    for index in range(count):output.write((parts/str(index)).read_bytes())
if hashlib.md5(partial.read_bytes()).hexdigest()!=expected_md5:raise RuntimeError('Dataset checksum mismatch')
partial.replace(target)
print('Downloaded and verified Mendeley version 1 data.')
