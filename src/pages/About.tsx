import { useState } from "react";
import {
  BrainCircuit,
  ShieldCheck,
  Eye,
  LockKeyhole,
  Accessibility,
  TriangleAlert,
  UserCheck,
  Check,
  Clock3,
  RotateCcw,
} from "lucide-react";
import {
  PageHeader,
  Highlight,
  Card,
  Button,
  Badge,
  EmptyState,
  useToast,
  StatNumber,
} from "../components/ui";
import { useClassificationLog } from "../lib/useClassificationLog";
import {
  evaluationSummary,
  overrideSummary,
  LOW_CONFIDENCE_THRESHOLD,
} from "../lib/evaluation";
import { evalResults, EVALUATION_IS_PLACEHOLDER } from "../data/evalResults";
import { CATEGORY_META } from "../data/constants";
import { catalog } from "../data/catalog";
import { useStore } from "../store/useStore";

const workflow = [
  ["Input", "Photo or manual category"],
  ["MobileNet", "Photo inference in the browser"],
  ["Label → category", "Our keyword mapping rules"],
  ["User confirmation", "Accept or override the category"],
  ["Catalog lookup", "Choose the exact item"],
  ["Route Card", "Route, reason, and handling tip"],
  ["Activity / Exchange", "Log a drop-off or pass it on"],
  ["Dashboard", "See logged impact and flows"],
];
const responsibilities = [
  {
    icon: ShieldCheck,
    title: "Privacy",
    text: "Photo inference stays on your device; images are never uploaded or saved. Activity, listings, and confirmation logs use local storage. Model downloads, fonts, and map tiles make separate network requests.",
  },
  {
    icon: Eye,
    title: "Bias",
    text: "ImageNet recognises objects, not local waste streams. Lighting, backgrounds, packaging, and unfamiliar objects can change predictions. We have not established performance across communities or conditions.",
  },
  {
    icon: LockKeyhole,
    title: "Security",
    text: "This local demo has no accounts, ownership checks, or server validation. Avoid personal contact details in listings. A real exchange needs authentication, moderation, and protected storage.",
  },
  {
    icon: Accessibility,
    title: "Accessibility",
    text: "Manual catalog entry provides an alternative to photos. Controls have labels, visible focus, and keyboard support; motion respects your preferences. Formal assistive-technology and multilingual testing is still planned.",
  },
  {
    icon: TriangleAlert,
    title: "Limitations",
    text: "A photo cannot prove material composition or safe handling. Centers are fictional and carbon factors are approximate. Impact includes pending intentions, so these are logged estimates, not verified outcomes.",
  },
  {
    icon: UserCheck,
    title: "Human oversight",
    text: "You confirm every photo category and choose the exact item. Low-confidence or unmapped labels need manual review. Check real facility rules, and seek specialist guidance for hazardous items.",
  },
];
const percentage = (value: number | null) =>
  value === null ? "—" : `${Math.round(value * 100)}%`;

export default function About() {
  const log = useClassificationLog();
  const evaluation = evaluationSummary(evalResults);
  const overrides = overrideSummary(log);
  const [reset, setReset] = useState(false);
  const resetDemo = useStore((s) => s.resetDemo);
  const toast = useToast();
  return (
    <>
      <PageHeader
        eyebrow="AI & ETHICS · OPEN ABOUT THE LIMITS"
        title={
          <>
            Helpful AI. <Highlight>Human judgement.</Highlight>
          </>
        }
        description="How Srijan makes suggestions, what we have measured, and where your judgement matters."
      />
      <div className="about-intro ethics-intro">
        <BrainCircuit size={36} strokeWidth={1.4} />
        <div>
          <Badge>AI suggests. You decide.</Badge>
          <h2>A starting point for better decisions.</h2>
          <p>
            An object label is a clue, not proof of its material. Every route
            stays in your hands.
          </p>
        </div>
      </div>

      <section className="ethics-section" aria-labelledby="how-it-works">
        <div className="section-kicker">01 · THE WORKFLOW</div>
        <h2 id="how-it-works">How it works</h2>
        <p className="section-description">
          A small model, explicit rules, and a person making the final call.
        </p>
        <Card className="workflow-card">
          <ol
            className="workflow-diagram"
            aria-label="Classification and routing workflow"
          >
            {workflow.map(([title, description], index) => (
              <li key={title}>
                <span className="workflow-number">0{index + 1}</span>
                <strong>{title}</strong>
                <span>{description}</span>
                <i aria-hidden="true">
                  {index === 3 ? "↓" : index >= 4 ? "←" : "→"}
                </i>
              </li>
            ))}
          </ol>
          <p className="footnote">
            Manual category or catalog input skips MobileNet and label mapping.
            The guided demo uses this manual path; it does not simulate photo
            inference.
          </p>
        </Card>
      </section>

      <section className="ethics-section" aria-labelledby="method-data">
        <div className="section-kicker">02 · METHOD & DATA</div>
        <h2 id="method-data">Built on a pretrained model.</h2>
        <div className="method-grid">
          <Card>
            <h3>What we use</h3>
            <p>
              Pretrained MobileNet v2, trained on ImageNet, runs through
              TensorFlow.js in your browser. Photos stay on the device. Our
              rule-based keyword mapping translates object labels into nine
              material categories; you confirm the category and choose an item
              from our {catalog.length}-item catalog.
            </p>
          </Card>
          <Card>
            <h3>What we did not train</h3>
            <p>
              We did not train or fine-tune MobileNet, create a custom waste
              model, or train a carbon-estimation model. The catalog,
              facilities, starter records, and evaluation placeholders are
              synthetic, authored demo data. They are not a municipal directory
              or an independently labelled waste-image dataset.
            </p>
          </Card>
        </div>
      </section>

      <section className="ethics-section" aria-labelledby="evaluation-title">
        <div className="section-kicker">03 · EVALUATION</div>
        <div className="row between wrap">
          <h2 id="evaluation-title">Show the evidence. Show the gaps.</h2>
          <Badge>
            {EVALUATION_IS_PLACEHOLDER
              ? "Placeholder results"
              : "Evaluation results"}
          </Badge>
        </div>
        {EVALUATION_IS_PLACEHOLDER && (
          <div className="notice evaluation-disclosure">
            <TriangleAlert size={20} aria-hidden="true" />
            <div>
              <strong>
                These are {evaluation.total} invented placeholder rows, not
                measured model results.
              </strong>
              <p>
                They exercise the evaluation interface. Replace all rows in{" "}
                <code>src/data/evalResults.ts</code> with real, independently
                labelled test results before reporting performance. No test
                photos are bundled.
              </p>
            </div>
          </div>
        )}
        <div className="evaluation-metrics">
          <Card>
            <StatNumber
              value={percentage(evaluation.accuracy)}
              label={
                EVALUATION_IS_PLACEHOLDER
                  ? "placeholder overall accuracy"
                  : "overall test accuracy"
              }
            />
            <p>
              {evaluation.correct} correct / {evaluation.total} test rows
            </p>
          </Card>
          <Card>
            <StatNumber
              value={percentage(evaluation.lowConfidenceShare)}
              label="low-confidence share → manual review"
            />
            <p>
              {evaluation.lowConfidence} / {evaluation.total} below{" "}
              {LOW_CONFIDENCE_THRESHOLD * 100}% confidence
            </p>
          </Card>
          <Card>
            <StatNumber
              value={percentage(overrides.rate)}
              label="live local override rate"
            />
            <p>
              {overrides.overridden} overrides / {overrides.total} confirmed
              photo runs
            </p>
          </Card>
        </div>
        <p className="evaluation-note">
          Confidence is the model’s top-label score, not calibrated material
          certainty. Below {LOW_CONFIDENCE_THRESHOLD * 100}% or with an unmapped
          label, the app asks for manual category review; every photo prediction
          requires confirmation. The fixture contains no evidence that an
          override was completed.
        </p>
        <div className="evaluation-columns">
          <Card className="category-accuracy">
            <h3>Per-category accuracy</h3>
            <p>Grouped by expected category · correct / tested</p>
            {evaluation.perCategory.map((c) => (
              <div className="accuracy-row" key={c.category}>
                <div className="row between">
                  <span>{c.label}</span>
                  <strong>
                    {percentage(c.accuracy)}{" "}
                    <small>
                      ({c.correct}/{c.total})
                    </small>
                  </strong>
                </div>
                <progress
                  max={100}
                  value={(c.accuracy ?? 0) * 100}
                  aria-label={`${c.label} accuracy: ${c.total ? `${c.correct} of ${c.total}` : "no test rows"}`}
                  style={{ accentColor: c.color }}
                />
              </div>
            ))}
          </Card>
          <Card className="live-evaluation">
            <h3>Live confirmation log</h3>
            <p>
              Updates from classificationLog on this device. A changed or
              unmapped prediction counts as an override. User agreement is not
              independently verified accuracy.
            </p>
            {log.length ? (
              <>
                <div className="live-override">
                  <strong>{percentage(overrides.rate)}</strong>
                  <span>
                    of {overrides.total} confirmed photo runs changed the
                    predicted category
                  </span>
                </div>
                <p className="footnote">
                  Manual catalog choices and guided-demo actions are excluded.
                  Photos and contact information are never recorded in this log.
                </p>
              </>
            ) : (
              <EmptyState
                title="No confirmed photo runs yet"
                description="Confirm a photo classification to start your local log. An empty log has no measurable override rate."
              />
            )}
          </Card>
        </div>
        <div className="failure-heading">
          <h3>Failure cases</h3>
          <p>
            {evaluation.failures.length}{" "}
            {EVALUATION_IS_PLACEHOLDER
              ? "placeholder mismatches"
              : "mismatches"}{" "}
            worth examining
          </p>
        </div>
        {evaluation.failures.length ? (
          <div className="failure-grid">
            {evaluation.failures.map((row) => (
              <Card className="failure-case" key={row.testImage}>
                <span className="failure-image-id">{row.testImage}</span>
                <h4>
                  {CATEGORY_META[row.expectedCategory].label} →{" "}
                  {row.predictedCategory
                    ? CATEGORY_META[row.predictedCategory].label
                    : "Unmapped"}
                </h4>
                <p>
                  {row.failureReason ??
                    "Prediction differs from the expected category; review the image and mapping rules."}
                </p>
                <small>
                  {Math.round(row.confidence * 100)}% confidence
                  {row.confidence < LOW_CONFIDENCE_THRESHOLD
                    ? " · manual review required"
                    : " · user confirmation still required"}
                </small>
              </Card>
            ))}
          </div>
        ) : (
          <EmptyState
            title="No mismatches in these rows"
            description="A small sample without failures does not establish general performance."
          />
        )}
      </section>

      <section className="ethics-section" aria-labelledby="responsible-title">
        <div className="section-kicker">04 · RESPONSIBLE AI</div>
        <h2 id="responsible-title">Care is part of the design.</h2>
        <div className="responsibility-grid">
          {responsibilities.map((r) => (
            <Card key={r.title}>
              <r.icon size={25} aria-hidden="true" />
              <h3>{r.title}</h3>
              <p>{r.text}</p>
            </Card>
          ))}
        </div>
      </section>
      <section className="ethics-section" aria-labelledby="sdg-title">
        <div className="section-kicker">05 · SDG ALIGNMENT</div>
        <h2 id="sdg-title">Small actions, shared goals.</h2>
        <p className="section-description">
          Design intent aligned with these goals; no measured SDG outcomes or UN
          endorsement is claimed.
        </p>
        <div className="sdg-grid">
          {[
            [
              "11",
              "Sustainable cities & communities",
              "Help neighbours discover responsible routes and local reuse.",
            ],
            [
              "12",
              "Responsible consumption & production",
              "Keep usable items and materials in circulation for longer.",
            ],
            [
              "13",
              "Climate action",
              "Make the potential climate implications of everyday choices visible.",
            ],
          ].map(([number, title, text]) => (
            <Card key={number}>
              <Badge>SDG {number}</Badge>
              <h3>{title}</h3>
              <p>{text}</p>
            </Card>
          ))}
        </div>
      </section>
      <section className="ethics-section" aria-labelledby="roadmap-title">
        <div className="section-kicker">06 · IMPLEMENTED VS PLANNED</div>
        <h2 id="roadmap-title">A working demo, an honest roadmap.</h2>
        <div className="roadmap-grid">
          <Card>
            <h3>
              <Check size={20} />
              Implemented
            </h3>
            <ul>
              {[
                "Browser classification & manual confirmation",
                "Catalog lookup & Route Cards",
                "Illustrative center directory & map",
                "Local activity and drop-off tracking",
                "Live Impact dashboard",
                "Local Reuse Exchange & handovers",
                "Guided demo with two item journeys",
              ].map((item) => (
                <li key={item}>
                  <Check size={15} aria-hidden="true" />
                  {item}
                </li>
              ))}
            </ul>
          </Card>
          <Card>
            <h3>
              <Clock3 size={20} />
              Planned
            </h3>
            <ul>
              {[
                "Custom-trained waste model",
                "Verified municipal data",
                "Pickup scheduling",
                "User accounts & shared marketplace",
                "Multilingual UI",
              ].map((item) => (
                <li key={item}>
                  <Clock3 size={15} aria-hidden="true" />
                  {item}
                </li>
              ))}
            </ul>
          </Card>
        </div>
      </section>
      <div className="about-bottom">
        <div>
          <h3>A fresh start for your demo</h3>
          <p>
            Reset activities and listings to synthetic starter data.
            Classification logs are retained.
          </p>
        </div>
        {reset ? (
          <div className="row wrap">
            <Button variant="secondary" onClick={() => setReset(false)}>
              Cancel
            </Button>
            <Button
              onClick={() => {
                resetDemo();
                setReset(false);
                toast(
                  "Demo activities and listings reset. Classification logs retained.",
                );
              }}
            >
              Confirm reset
            </Button>
          </div>
        ) : (
          <Button variant="secondary" onClick={() => setReset(true)}>
            <RotateCcw size={16} />
            Reset demo
          </Button>
        )}
      </div>
    </>
  );
}
