"""Calibrate on validation only, then export trained weights and browser reports."""
import base64
import hashlib
import json
from datetime import datetime, timezone
from pathlib import Path
import numpy as np

ROOT=Path(__file__).resolve().parents[1]
CACHE=ROOT/'.evaluation-cache/training'
PUBLIC=ROOT/'public/models/waste-v1'
CATEGORIES=['plastic','paper','glass','metal','organic','ewaste','textile','hazardous','residual']
split=json.loads((CACHE/'split.json').read_text())
rows=[r for r in split['rows'] if not r['split'].startswith('excluded')]
payload=json.loads((CACHE/'training-result.json').read_text())
logits=np.asarray(payload['logits'],dtype=np.float64)
assert logits.shape==(len(rows),9) and np.isfinite(logits).all()
labels=np.array([CATEGORIES.index(r['category']) for r in rows])
indices={name:np.array([i for i,r in enumerate(rows) if r['split']==name]) for name in ['train','validation','test','benchmark']}
def softmax(values,temperature=1):
    exp=np.exp((values-values.max(axis=1,keepdims=True))/temperature)
    return exp/exp.sum(axis=1,keepdims=True)
def summary(scores,expected,threshold,margin):
    order=np.argsort(-scores,axis=1)
    confidence=scores[np.arange(len(scores)),order[:,0]]
    accepted=(confidence>=threshold)&((confidence-scores[np.arange(len(scores)),order[:,1]])>=margin)
    matches=order[:,0]==expected
    suggested=int(accepted.sum());correct=int((matches&accepted).sum())
    return {'total':len(scores),'top1Correct':int(matches.sum()),'top1Accuracy':float(matches.mean()),'correct':correct,'accuracy':correct/len(scores),'suggested':suggested,'manualReview':len(scores)-suggested,'coverage':suggested/len(scores),'wrongSuggestions':suggested-correct,'suggestionAccuracy':correct/suggested if suggested else None}
validation=indices['validation']
def nll(t):return float(-np.log(np.maximum(softmax(logits[validation],t)[np.arange(len(validation)),labels[validation]],1e-8)).mean())
temperature=min([.7,1,1.3,1.7,2,2.5,3],key=nll)
validation_scores=softmax(logits[validation],temperature)
best=None
for threshold in [.35,.4,.45,.5,.55,.6,.65,.7,.75,.8,.85,.9]:
    for margin in [0,.05,.1,.15,.2]:
        stats=summary(validation_scores,labels[validation],threshold,margin)
        if stats['suggested']>=30 and stats['suggestionAccuracy']>=.8 and (best is None or (stats['coverage'],stats['suggestionAccuracy'])>(best[0]['coverage'],best[0]['suggestionAccuracy'])):best=(stats,threshold,margin)
threshold,margin=(best[1],best[2]) if best else (.9,.2)
policy={'confidenceThreshold':threshold,'marginThreshold':margin,'temperature':temperature,'selection':'Validation only: temperature minimizes NLL; maximize coverage with >=30 suggestions and >=80% suggestion accuracy; fallback threshold 0.9 / margin 0.2.'}
head_bytes=base64.b64decode(payload['headBase64'],validate=True)
assert len(head_bytes)==sum(int(np.prod(w['shape']))*4 for w in payload['headWeights'])
assert [w['shape'] for w in payload['headWeights']]==[[1280,128],[128],[128,9],[9]]
(PUBLIC/'head.bin').write_bytes(head_bytes)
metadata={
    'version':'waste-v1','trainedAt':datetime.now(timezone.utc).isoformat(),
    'categories':CATEGORIES,'unsupportedCategories':[],
    'architecture':'Frozen MobileNet v2 alpha 1.0 224px / 1280 embedding -> Dense(128, ReLU) -> Dropout(0.3 training only) -> Dense(9) -> temperature-scaled softmax',
    'baseWeightsSha256':hashlib.sha256((PUBLIC/'base/weights.bin').read_bytes()).hexdigest(),
    'headWeightsSha256':hashlib.sha256(head_bytes).hexdigest(),'headWeights':payload['headWeights'],
    'preprocessing':{'inputRange':[0,1],'imageSize':224,'alignCorners':True,'naturalDimensions':True},
    'embeddingNode':'module_apply_default/MobilenetV2/Logits/AvgPool','seed':20261025,
    'policy':policy,'splitCounts':split['counts'],'epochs':len(payload['history']),'bestValidationEpoch':payload['bestEpoch'],
    'training':'New head only; original feature extractor frozen. Class-balanced loss, training-only horizontal flips, L2, dropout, Adam 0.0005, validation-loss early stopping (patience 10).',
    'backend':payload['backend'],
    'limitations':['Hazardous examples cover batteries only; other hazards are not validated.','Same-source public holdout; not independent local photos.','Perceptual duplicate grouping is heuristic; physical-object identities are unavailable.','Scores do not establish composition, toxicity or recycling eligibility.'],
}
for path in [PUBLIC/'metadata.json',ROOT/'src/data/wasteModelMetadata.json']:path.write_text(json.dumps(metadata,indent=2)+'\n')
scores=softmax(logits,temperature)
def details(name):
    selected=indices[name];result=summary(scores[selected],labels[selected],threshold,margin)
    confusion=[[0]*9 for _ in CATEGORIES]
    for i in selected:confusion[labels[i]][int(scores[i].argmax())]+=1
    per_category=[]
    for j,category in enumerate(CATEGORIES):
        actual=labels[selected]==j;predicted=scores[selected].argmax(axis=1)==j
        tp=int((actual&predicted).sum());precision=tp/int(predicted.sum()) if predicted.sum() else 0.;recall=tp/int(actual.sum()) if actual.sum() else 0.
        per_category.append({'category':category,'total':int(actual.sum()),'correct':tp,'precision':precision,'recall':recall,'f1':2*precision*recall/(precision+recall) if precision+recall else 0.})
    return {**result,'perCategory':per_category,'macroF1':float(np.mean([r['f1'] for r in per_category])),'confusionMatrix':confusion}
training_report={'metadata':metadata,'validation':details('validation'),'test':details('test'),'benchmark':details('benchmark'),'categories':CATEGORIES,'splitMethod':split['method'],'limitations':split['limitations']}
for path in [PUBLIC/'training-report.json',ROOT/'src/data/trainingReport.json']:path.write_text(json.dumps(training_report,indent=2)+'\n')
legacy_path=ROOT/'public/evaluation/legacy-report.json'
if not legacy_path.exists():legacy_path.write_bytes((ROOT/'src/data/evaluationReport.json').read_bytes())
legacy=json.loads(legacy_path.read_text())
benchmark_source=json.loads((ROOT/'src/data/evaluationManifest.json').read_text())
lookup={r['sha256']:i for i,r in enumerate(rows)}
results=[]
for photo in benchmark_source:
    i=lookup[photo['sha256']];order=np.argsort(-scores[i])[:3]
    predictions=[{'className':CATEGORIES[j],'probability':float(scores[i,j])} for j in order]
    accepted=predictions[0]['probability']>=threshold and predictions[0]['probability']-predictions[1]['probability']>=margin
    predicted=predictions[0]['className'] if accepted else None
    reason=('Low material-model score; choose a category manually.' if predictions[0]['probability']<threshold else 'Leading material scores are too close; choose manually.') if not accepted else f'Material model suggested {predicted}; source label is {photo["sourceLabel"]}.'
    old=next(r for r in legacy['results'] if r['sha256']==photo['sha256'])
    results.append({**photo,'predictedCategory':predicted,'confidence':predictions[0]['probability'],'predictions':predictions,'top1Category':predictions[0]['className'],'baselineCategory':old['baselineCategory'],**({'failureReason':reason} if predicted!=photo['expectedCategory'] else {})})
benchmark_indices=np.array([lookup[p['sha256']] for p in benchmark_source])
report={'version':2,'measuredAt':metadata['trainedAt'],'model':metadata['architecture'],'backend':payload['backend'],'selection':'Original fixed 99-photo benchmark; excluded along with duplicate groups from training and validation.','untestedCategories':['ewaste','hazardous'],'baseline':legacy['baseline'],'legacyConservative':legacy['conservative'],'conservative':summary(scores[benchmark_indices],labels[benchmark_indices],threshold,margin),'results':results}
for path in [ROOT/'src/data/evaluationReport.json',ROOT/'public/evaluation/report.json']:path.write_text(json.dumps(report,indent=2)+'\n')
parity=[{**item,'probabilities':softmax(np.array([item['logits']]),temperature)[0].tolist()} for item in payload['parity']]
(CACHE/'parity.json').write_text(json.dumps(parity)+'\n')
# Full held-out rows support auditing without adding hundreds of image downloads.
heldout=[]
for i in indices['test']:
    heldout.append({**{k:v for k,v in rows[i].items() if k!='file'},'probabilities':{c:float(scores[i,j]) for j,c in enumerate(CATEGORIES)}})
(PUBLIC/'heldout-results.json').write_text(json.dumps(heldout,indent=2)+'\n')
(PUBLIC/'history.json').write_text(json.dumps(payload['history'],indent=2)+'\n')
print(json.dumps({'test':training_report['test'],'benchmark':report['conservative'],'policy':policy}))
