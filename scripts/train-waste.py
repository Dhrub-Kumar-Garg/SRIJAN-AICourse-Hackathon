"""Train a material head; leave original MobileNet features frozen.

Requires Python 3.12 and requirements-training.txt. Run prepare-training.py and
prepare-feature-model.mjs first. Validation selects checkpoints and review policy;
test and original benchmark have no role in selection.
"""
import os
os.environ.setdefault('TF_CPP_MIN_LOG_LEVEL','2')
os.environ.setdefault('TF_NUM_INTRAOP_THREADS','8')
os.environ.setdefault('TF_NUM_INTEROP_THREADS','2')
import base64
import hashlib
import json
import subprocess
import sys
from pathlib import Path
import numpy as np
from PIL import Image, ImageOps
from google.protobuf import json_format
import tensorflow as tf

ROOT=Path(__file__).resolve().parents[1]
CACHE=ROOT/'.evaluation-cache/training'
PUBLIC=ROOT/'public/models/waste-v1'
CATEGORIES=['plastic','paper','glass','metal','organic','ewaste','textile','hazardous','residual']
tf.keras.utils.set_random_seed(20261025)
split=json.loads((CACHE/'split.json').read_text())
rows=[r for r in split['rows'] if not r['split'].startswith('excluded')]
base_json=json.loads((PUBLIC/'base/model.json').read_text())
weight_bytes=(PUBLIC/'base/weights.bin').read_bytes()
signature=hashlib.sha256(weight_bytes+json.dumps([(r['sha256'],r['split']) for r in rows]).encode()).hexdigest()
feature_path=CACHE/'features.npz'
if feature_path.exists() and (CACHE/'features-signature.txt').read_text()==signature:
    cache=np.load(feature_path);features,flipped=cache['features'],cache['flipped']
    print('Using split-specific, verified cached features.',flush=True)
else:
    graph_def=tf.compat.v1.GraphDef()
    json_format.ParseDict(base_json['modelTopology'],graph_def)
    constants={node.name:node for node in graph_def.node}
    offset=0
    for weight in base_json['weightsManifest'][0]['weights']:
        dtype={'float32':np.float32,'int32':np.int32,'bool':np.bool_}[weight['dtype']]
        count=int(np.prod(weight['shape']));size=count*np.dtype(dtype).itemsize
        values=np.frombuffer(weight_bytes,dtype=dtype,count=count,offset=offset).reshape(weight['shape'])
        constants[weight['name']].attr['value'].tensor.CopyFrom(tf.make_tensor_proto(values))
        offset+=size
    assert offset==len(weight_bytes)
    # The original TF.js checkpoint predates TF's explicit fused-op argument
    # type list. Supply the same float dtype for its existing bias arguments.
    for node in graph_def.node:
        if node.op=='_FusedConv2D' and 'TArgs' not in node.attr:
            node.attr['TArgs'].list.type.extend([node.attr['T'].type]*node.attr['num_args'].i)
    graph=tf.Graph()
    with graph.as_default():
        source_rgb=tf.compat.v1.placeholder(tf.float32,[None,None,None,3],name='source_rgb')
        resize_rgb=tf.compat.v1.image.resize_bilinear(source_rgb/255.,[224,224],align_corners=True)
        raw=tf.compat.v1.placeholder(tf.float32,[None,224,224,3],name='resized_rgb')
        tf.import_graph_def(graph_def,input_map={'images:0':raw},name='base')
        output=graph.get_tensor_by_name('base/module_apply_default/MobilenetV2/Logits/AvgPool:0')
    features=np.zeros((len(rows),1280),dtype=np.float32);flipped=np.zeros_like(features)
    config=tf.compat.v1.ConfigProto(intra_op_parallelism_threads=8,inter_op_parallelism_threads=2)
    with tf.compat.v1.Session(graph=graph,config=config) as session:
        for start in range(0,len(rows),24):
            batch=rows[start:start+24]
            decoded=[np.asarray(ImageOps.exif_transpose(Image.open(ROOT/r['file'])).convert('RGB'),dtype=np.float32) for r in batch]
            pixels=np.stack([session.run(resize_rgb,{source_rgb:photo[None]})[0] for photo in decoded])
            features[start:start+len(batch)]=session.run(output,{raw:pixels}).reshape(-1,1280)
            positions=[i for i,r in enumerate(batch) if r['split']=='train']
            if positions:flipped[start+np.array(positions)]=session.run(output,{raw:pixels[positions,:,::-1,:]}).reshape(-1,1280)
            if start%240==0 or start+24>=len(rows):print(f'Features {min(start+24,len(rows))}/{len(rows)}; horizontal flip on training only',flush=True)
    np.savez_compressed(feature_path,features=features,flipped=flipped)
    (CACHE/'features-signature.txt').write_text(signature)
labels=np.array([CATEGORIES.index(r['category']) for r in rows],dtype=np.int32)
training=np.array([i for i,r in enumerate(rows) if r['split']=='train'])
validation=np.array([i for i,r in enumerate(rows) if r['split']=='validation'])
train_x=np.concatenate([features[training],flipped[training]])
train_y=np.concatenate([labels[training],labels[training]])
counts=np.bincount(train_y,minlength=9)
assert np.all(counts>0), 'Every model output needs training examples'
class_weight={i:float(len(train_y)/(9*count)) for i,count in enumerate(counts)}
head=tf.keras.Sequential([tf.keras.layers.Input(shape=(1280,)),tf.keras.layers.Dense(128,activation='relu',kernel_regularizer=tf.keras.regularizers.l2(.0005)),tf.keras.layers.Dropout(.3),tf.keras.layers.Dense(9)])
head.compile(optimizer=tf.keras.optimizers.Adam(.0005),loss=tf.keras.losses.SparseCategoricalCrossentropy(from_logits=True),metrics=['accuracy'])
history=head.fit(train_x,train_y,validation_data=(features[validation],labels[validation]),batch_size=64,epochs=100,class_weight=class_weight,callbacks=[tf.keras.callbacks.EarlyStopping(monitor='val_loss',patience=10,restore_best_weights=True)],verbose=2)
logits=head(features,training=False).numpy()
weights=[w.numpy().astype('<f4') for w in head.weights]
benchmark=[i for i,r in enumerate(rows) if r['split']=='benchmark']
parity_indices=[benchmark[0],benchmark[len(benchmark)//2],benchmark[-1]]
payload={
    'signature':signature,'backend':'TensorFlow 2.16.2 CPU / original TensorFlow.js MobileNet graph; NumPy calibration',
    'headBase64':base64.b64encode(b''.join(w.tobytes() for w in weights)).decode(),
    'headWeights':[{'shape':list(w.shape),'dtype':'float32'} for w in weights],
    'history':[{key:float(values[i]) for key,values in history.history.items()} for i in range(len(history.history['loss']))],
    'bestEpoch':int(np.argmin(history.history['val_loss']))+1,'logits':logits.tolist(),
    'parity':[{'sha256':rows[i]['sha256'],'embedding':features[i].tolist(),'logits':logits[i].tolist()} for i in parity_indices],
}
(CACHE/'training-result.json').write_text(json.dumps(payload))
head.save(CACHE/'head.keras')
subprocess.run([sys.executable,str(ROOT/'scripts/finalize-training.py')],cwd=ROOT,check=True)
