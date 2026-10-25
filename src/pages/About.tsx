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
  useToast,
} from "../components/ui";
import ModelEvaluation from "../components/ModelEvaluation";
import { catalog } from "../data/catalog";
import { useStore } from "../store/useStore";

const workflow = [
  ["Input", "Photo or manual category"],
  ["MobileNet", "Photo inference in the browser"],
  ["Material classifier", "Our trained nine-category head"],
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
    text: "The new material head learns from two public datasets. Lighting, backgrounds and source-specific cues may bias its predictions. Hazardous examples cover batteries; performance across communities and local conditions is unverified.",
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
    text: "A photo cannot prove material composition or safe handling. The center directory uses dated operator and community-map sources; access and acceptance need confirmation. Carbon factors and logged impact remain estimates, including pending intentions.",
  },
  {
    icon: UserCheck,
    title: "Human oversight",
    text: "You confirm every photo category and choose the exact item. Low-scoring or closely matched materials need manual review. Check real facility rules, and seek specialist guidance for hazardous items.",
  },
];
export default function About() {
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
            An image-based material prediction is a clue, not proof. Every route
            stays in your hands.
          </p>
        </div>
      </div>

      <section className="ethics-section" aria-labelledby="how-it-works">
        <div className="section-kicker">01 · THE WORKFLOW</div>
        <h2 id="how-it-works">How it works</h2>
        <p className="section-description">
          A trained material classifier, a review policy, and a person making
          the final call.
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
            Manual category or catalog input skips the photo model. The guided
            demo uses this manual path; it does not simulate photo inference.
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
              trained material head predicts nine categories from frozen image
              features; you confirm the category and choose an item from our{" "}
              {catalog.length}-item catalog.
            </p>
          </Card>
          <Card>
            <h3>What we trained and what we did not</h3>
            <p>
              We trained a new material classification head using published
              RealWaste and Bangladeshi E-Waste labels. MobileNet’s pretrained
              image features remain frozen; no carbon-estimation model was
              trained. The catalog and starter activities/listings remain
              synthetic. Facilities now come from sourced Bengaluru operator
              listings and OpenStreetMap, with source dates and limitations on
              each card. Public-source evaluation does not establish local
              real-world performance.
            </p>
          </Card>
        </div>
      </section>

      <ModelEvaluation />

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
                "Trained material classifier & manual confirmation",
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
                "Broader local waste training and independent validation",
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
