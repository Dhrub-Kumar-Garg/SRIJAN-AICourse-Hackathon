import { useState } from "react";
import {
  BrainCircuit,
  ShieldCheck,
  SlidersHorizontal,
  FlaskConical,
  RotateCcw,
} from "lucide-react";
import {
  PageHeader,
  Highlight,
  Card,
  Button,
  useToast,
  StatNumber,
} from "../components/ui";
import { readClassificationLog } from "../lib/classificationLog";
import { useStore } from "../store/useStore";
export default function About() {
  const log = readClassificationLog();
  const [reset, setReset] = useState(false);
  const resetDemo = useStore((s) => s.resetDemo);
  const toast = useToast();
  const agreed = log.filter(
    (r) => r.predictedCategory === r.confirmedCategory,
  ).length;
  return (
    <>
      <PageHeader
        eyebrow="THOUGHTFULLY BUILT. OPEN ABOUT THE LIMITS."
        title={
          <>
            Helpful AI. <Highlight>Human judgement.</Highlight>
          </>
        }
        description="How Srijan makes suggestions, what stays private, and why you always have the final say."
      />
      <div className="about-intro">
        <BrainCircuit size={44} strokeWidth={1.3} />
        <h2>A starting point for better decisions.</h2>
        <p>
          Srijan uses MobileNet, an image classification model trained on
          ImageNet, to recognise familiar objects. Keyword rules map its
          predictions to material categories. You confirm the material and
          choose the exact catalog item; that item determines the recommended
          route.
        </p>
      </div>
      <div className="about-grid">
        {[
          {
            icon: ShieldCheck,
            title: "Your photos stay with you.",
            text: "Classification happens in your browser using TensorFlow.js. Images are never uploaded. The model, Google Fonts, and map tiles need an internet connection. Activity, listings, and evaluation logs are saved in this browser’s localStorage.",
          },
          {
            icon: SlidersHorizontal,
            title: "You are always in the loop.",
            text: "The model sees appearance, not material composition. A glass and plastic bottle can look alike. Low-confidence or unmapped predictions ask for confirmation. You can override every prediction; local acceptance rules should guide your final action.",
          },
          {
            icon: FlaskConical,
            title: "Estimates, openly explained.",
            text: "Carbon savings use indicative per-kilogram category factors. These are educational approximations, not a lifecycle assessment or verified offsets. Demo impact includes pending activity, so it represents logged intentions as well as completed actions.",
          },
        ].map((x) => (
          <Card key={x.title}>
            <x.icon size={27} />
            <h3>{x.title}</h3>
            <p>{x.text}</p>
          </Card>
        ))}
      </div>
      <Card className="evaluation">
        <div className="row between">
          <div>
            <div className="eyebrow">LOCAL EVALUATION</div>
            <h2>How the model is doing</h2>
          </div>
          <BadgeLocal />
        </div>
        <p>
          Each confirmed photo run records the prediction, confidence, confirmed
          category, and timestamp locally. Agreement measures user confirmation,
          not independently verified accuracy.
        </p>
        <div className="three-stats">
          <StatNumber value={log.length} label="confirmed photo runs" />
          <StatNumber
            value={
              log.length ? `${Math.round((agreed / log.length) * 100)}%` : "—"
            }
            label="prediction / confirmation agreement"
          />
          <StatNumber
            value={
              log.length
                ? `${Math.round((log.reduce((n, l) => n + l.confidence, 0) / log.length) * 100)}%`
                : "—"
            }
            label="mean top prediction confidence"
          />
        </div>
        <p className="footnote">
          A small or selective sample cannot establish general performance.
          Accuracy varies with lighting, object types, backgrounds, and training
          data.
        </p>
      </Card>
      <div className="about-bottom">
        <div>
          <h3>A fresh start for your demo</h3>
          <p>
            Reset activities and listings to the synthetic starter data.
            Classification logs are retained.
          </p>
        </div>
        {reset ? (
          <div className="row">
            <Button variant="secondary" onClick={() => setReset(false)}>
              Cancel
            </Button>
            <Button
              onClick={() => {
                resetDemo();
                setReset(false);
                toast("Demo activities and listings reset. A fresh start.");
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
function BadgeLocal() {
  return <span className="badge">Stored on this device</span>;
}
