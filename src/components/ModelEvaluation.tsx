import { useState } from "react";
import { Badge, Button, Card, EmptyState, StatNumber } from "./ui";
import training from "../data/trainingReport.json";
import { evalResults, evaluationReport } from "../data/evalResults";
import { CATEGORY_META } from "../data/constants";
import type { Category } from "../data/types";
import { evaluationSummary, overrideSummary } from "../lib/evaluation";
import { useClassificationLog } from "../lib/useClassificationLog";

const percent = (value: number | null) =>
  value === null ? "—" : `${(value * 100).toFixed(1)}%`;
export default function ModelEvaluation() {
  const [photos, setPhotos] = useState(false),
    [allCases, setAllCases] = useState(false);
  const log = useClassificationLog(),
    overrides = overrideSummary(log),
    benchmark = evaluationSummary(evalResults);
  const { test, metadata } = training;
  return (
    <section className="ethics-section" aria-labelledby="evaluation-title">
      <div className="section-kicker">03 · MEASURED EVALUATION</div>
      <div className="row between wrap">
        <h2 id="evaluation-title">A trained model. Measured results.</h2>
        <Badge>{metadata.version} · nine categories</Badge>
      </div>
      <Card className="benchmark-method">
        <h3>Held-out test images, separate from training</h3>
        <p>
          {metadata.splitCounts.train.toLocaleString()} training images,{" "}
          {metadata.splitCounts.validation} validation images and {test.total}{" "}
          held-out test images. The original 99 benchmark photos are reserved
          separately. Counts include source-authored training augmentations;
          validation and test retain one representative per duplicate group.
        </p>
        <p>
          Sources: RealWaste and the Bangladeshi E-Waste dataset. Byte hashes,
          perceptual hashes and source augmentation filenames keep related
          images together. Source e-waste partitions are preserved.
          Physical-object identities are unavailable, so grouping cannot rule
          out all leakage. These are same-source public results, not independent
          local field validation.
        </p>
        <p>
          Only the new material head was trained; MobileNet’s image features
          remain frozen. Hazardous training covers batteries. Other hazards,
          contamination and mixed materials still need human judgement.
        </p>
        <div className="row wrap">
          <a
            className="text-link"
            href="/models/waste-v1/training-report.json"
            download
          >
            Training &amp; test report
          </a>
          <a
            className="text-link"
            href="/models/waste-v1/heldout-results.json"
            download
          >
            Held-out labels &amp; predictions
          </a>
          <a
            className="text-link"
            href="/models/waste-v1/split-manifest.json"
            download
          >
            Auditable data split
          </a>
          <a className="text-link" href="/models/waste-v1/README.md">
            Model card &amp; sources
          </a>
        </div>
      </Card>
      <div className="evaluation-metrics">
        <Card>
          <StatNumber
            value={percent(test.top1Accuracy)}
            label="held-out top-1 material accuracy"
          />
          <p>
            {test.top1Correct} correct / {test.total} images, before
            manual-review gating
          </p>
        </Card>
        <Card>
          <StatNumber
            value={percent(test.suggestionAccuracy)}
            label="accuracy of accepted suggestions"
          />
          <p>
            {test.correct} correct / {test.suggested} suggestions that pass the
            review policy
          </p>
        </Card>
        <Card>
          <StatNumber
            value={percent(test.coverage)}
            label="held-out suggestion coverage"
          />
          <p>
            {test.suggested} receive suggestions · {test.manualReview} require
            manual selection
          </p>
        </Card>
        <Card>
          <StatNumber
            value={percent(evaluationReport.conservative.top1Accuracy)}
            label="original 99-photo top-1 accuracy"
          />
          <p>
            {evaluationReport.conservative.top1Correct} correct / 99; these
            images were excluded from training and validation
          </p>
        </Card>
      </div>
      <p className="evaluation-note">
        Top-1 accuracy counts the model’s highest-scoring material before
        review. Accepted-suggestion accuracy excludes abstentions; coverage
        shows how often a suggestion is offered. The validation-only policy
        requires at least{" "}
        {Math.round(metadata.policy.confidenceThreshold * 100)}% score
        {metadata.policy.marginThreshold
          ? ` and a ${Math.round(metadata.policy.marginThreshold * 100)}-point lead`
          : "; no extra margin cutoff was selected"}
        . Temperature {metadata.policy.temperature} was selected on validation
        loss. Every suggestion still requires confirmation. Browser
        decoding/backend can change scores slightly. Measured{" "}
        {metadata.trainedAt.slice(0, 10)}.
      </p>
      <div className="evaluation-columns">
        <Card className="category-accuracy">
          <h3>Held-out results by category</h3>
          <p>Top-1 correct / tested · macro F1 {percent(test.macroF1)}</p>
          {test.perCategory.map((row) => {
            const category = row.category as Category,
              meta = CATEGORY_META[category];
            return (
              <div className="accuracy-row" key={category}>
                <div className="row between">
                  <span>{meta.label}</span>
                  <strong>
                    {row.total ? percent(row.correct / row.total) : "Untested"}{" "}
                    <small>
                      ({row.correct}/{row.total})
                    </small>
                  </strong>
                </div>
                <progress
                  max={100}
                  value={row.total ? (row.correct / row.total) * 100 : 0}
                  aria-label={`${meta.label}: ${row.correct} correct of ${row.total}`}
                  style={{ accentColor: meta.color }}
                />
                <small>
                  Precision {percent(row.precision)} · recall{" "}
                  {percent(row.recall)}
                </small>
              </div>
            );
          })}
        </Card>
        <Card className="live-evaluation">
          <h3>Live confirmation log</h3>
          <p>
            Changed or unassigned model categories count as overrides. User
            agreement is not independently verified accuracy. Existing logs may
            include earlier model versions.
          </p>
          {log.length ? (
            <>
              <div className="live-override">
                <strong>{percent(overrides.rate)}</strong>
                <span>
                  {overrides.overridden} overrides / {overrides.total} confirmed
                  photo runs on this device
                </span>
              </div>
              <p className="footnote">
                Photos and personal contact information are never stored in this
                log. Manual catalog and guided-demo actions are excluded.
              </p>
            </>
          ) : (
            <EmptyState
              title="No confirmed photo runs yet"
              description="Confirm a photo category to start the local log. An empty log has no measurable override rate."
            />
          )}
          <h3 className="benchmark-gallery-heading">
            Original benchmark comparison
          </h3>
          <p>
            Previous rule mapper: {evaluationReport.baseline.correct}/99 correct
            suggestions, {evaluationReport.baseline.wrongSuggestions} wrong.
            Earlier cautious policy:{" "}
            {evaluationReport.legacyConservative.correct}/99 correct
            suggestions, {evaluationReport.legacyConservative.wrongSuggestions}{" "}
            wrong.
          </p>
          <p>
            Trained head with review policy: {benchmark.correct}/99 correct
            suggestions, {evaluationReport.conservative.wrongSuggestions} wrong,{" "}
            {benchmark.manualReview} manual selections. The 99-photo benchmark
            still has no e-waste or hazardous examples; those are represented in
            the separate held-out test above.
          </p>
          <a className="text-link" href="/evaluation/report.json" download>
            Download the 99-photo results
          </a>
        </Card>
      </div>
      <div className="failure-heading">
        <h3>99-photo review cases</h3>
        <p>{benchmark.failures.length} wrong suggestions or abstentions</p>
      </div>
      {benchmark.failures.length ? (
        <div className="failure-grid">
          {(allCases ? benchmark.failures : benchmark.failures.slice(0, 6)).map(
            (row) => (
              <Card className="failure-case" key={row.testImage}>
                <span className="failure-image-id">{row.testImage}</span>
                <h4>
                  {CATEGORY_META[row.expectedCategory].label} →{" "}
                  {row.predictedCategory
                    ? CATEGORY_META[row.predictedCategory].label
                    : "Manual selection"}
                </h4>
                <p>{row.failureReason}</p>
                <small>
                  {percent(row.confidence)} score ·{" "}
                  {row.predictedCategory
                    ? "confirmation required"
                    : "manual selection required"}
                </small>
              </Card>
            ),
          )}
        </div>
      ) : (
        <EmptyState
          title="No unsuccessful cases in this sample"
          description="A small benchmark does not establish general performance."
        />
      )}
      {benchmark.failures.length > 6 && (
        <Button
          variant="secondary"
          aria-expanded={allCases}
          onClick={() => setAllCases(!allCases)}
        >
          {allCases
            ? "Show fewer cases"
            : `Review all ${benchmark.failures.length} cases`}
        </Button>
      )}
      <div className="benchmark-gallery-heading">
        <h3>Inspect the original 99 labelled photos</h3>
        <p>
          Source-author labels are shown alongside the trained model’s top three
          material scores. Labels describe materials, not disposal eligibility.
        </p>
        <Button
          variant="secondary"
          aria-expanded={photos}
          onClick={() => setPhotos(!photos)}
        >
          {photos ? "Hide photos" : "View 99 labelled photos"}
        </Button>
      </div>
      {photos && (
        <div className="benchmark-gallery">
          {evalResults.map((row) => (
            <Card key={row.testImage}>
              <a
                href={`/evaluation/photos/${row.testImage}`}
                target="_blank"
                rel="noreferrer"
              >
                <img
                  loading="lazy"
                  src={`/evaluation/photos/${row.testImage}`}
                  alt={`Source-labelled ${row.sourceLabel}: ${row.testImage}`}
                />
              </a>
              <h4>{row.testImage}</h4>
              <p>
                Expected: {CATEGORY_META[row.expectedCategory].label}
                <br />
                Suggested:{" "}
                {row.predictedCategory
                  ? CATEGORY_META[row.predictedCategory].label
                  : "Manual selection"}
              </p>
              <small>
                Source: {row.sourceLabel}
                <br />
                {row.predictions
                  .map(
                    (p) =>
                      `${CATEGORY_META[p.className as Category]?.label ?? p.className} (${percent(p.probability)})`,
                  )
                  .join(" · ")}
              </small>
            </Card>
          ))}
        </div>
      )}
    </section>
  );
}
