import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { ArrowRight, Check, Play, X } from "lucide-react";
import { Button } from "./ui";
import { useStore } from "../store/useStore";
import {
  demoCenter,
  demoDestination,
  demoReady,
  demoRecords,
  impactSnapshot,
  parseDemoSession,
  phoneSteps,
  reuseSteps,
  type DemoSession,
} from "../lib/demo";

const storageKey = "srijan-guided-demo-v1";
const DemoContext = createContext<{
  session: DemoSession | null;
  records: ReturnType<typeof demoRecords>;
  start: () => void;
  exit: () => void;
  advance: () => void;
  resume: () => void;
  ready: boolean;
}>({
  session: null,
  records: { dropoff: undefined, listing: undefined },
  start: () => {},
  exit: () => {},
  advance: () => {},
  resume: () => {},
  ready: false,
});
export const useGuidedDemo = () => useContext(DemoContext);

export function GuidedDemoProvider({ children }: { children: ReactNode }) {
  const navigate = useNavigate();
  const location = useLocation();
  const activities = useStore((s) => s.activities);
  const listings = useStore((s) => s.listings);
  const [session, setSession] = useState<DemoSession | null>(() => {
    try {
      return parseDemoSession(sessionStorage.getItem(storageKey));
    } catch {
      return null;
    }
  });
  const records = demoRecords(session, activities, listings);
  const ready = !!session && demoReady(session, records);
  useEffect(() => {
    try {
      if (session) sessionStorage.setItem(storageKey, JSON.stringify(session));
      else sessionStorage.removeItem(storageKey);
    } catch {
      /* The tour still works in memory when session storage is unavailable. */
    }
  }, [session]);
  useEffect(() => {
    if (!session) return;
    if (
      (records.dropoff && !session.activityId) ||
      (records.listing && !session.listingId)
    ) {
      setSession((s) =>
        s
          ? {
              ...s,
              activityId: records.dropoff?.id ?? s.activityId,
              listingId: records.listing?.id ?? s.listingId,
            }
          : s,
      );
    }
  }, [session, records.dropoff, records.listing]);
  const go = (next: DemoSession) => {
    setSession(next);
    navigate(demoDestination(next));
  };
  const start = () =>
    go({
      phase: "phone",
      step: 0,
      startedAt: Date.now(),
      baseline: impactSnapshot(useStore.getState().activities),
    });
  const advance = () => {
    if (!session || !ready) return;
    if (session.phase === "complete") {
      exit();
      return;
    }
    if (session.phase === "phone" && session.step === 4)
      go({ ...session, phase: "reuse", step: 0 });
    else if (session.phase === "reuse" && session.step === 2)
      go({ ...session, phase: "complete", step: 0 });
    else go({ ...session, step: session.step + 1 });
  };
  const exit = () => {
    setSession(null);
    const params = new URLSearchParams(location.search);
    ["demo", "dropoff", "new", "focus"].forEach((key) => params.delete(key));
    navigate(
      { pathname: location.pathname, search: params.toString() },
      { replace: true },
    );
  };
  return (
    <DemoContext.Provider
      value={{
        session,
        records,
        ready,
        start,
        exit,
        advance,
        resume: () => session && navigate(demoDestination(session)),
      }}
    >
      {children}
    </DemoContext.Provider>
  );
}

export function GuidedDemoBanner() {
  const { session, records, ready, exit, advance, resume, start } =
    useGuidedDemo();
  const location = useLocation();
  const activities = useStore((s) => s.activities);
  if (!session) return null;
  const steps = session.phase === "phone" ? phoneSteps : reuseSteps;
  const [destination, destinationQuery] = demoDestination(session).split("?");
  const away =
    location.pathname !== destination ||
    new URLSearchParams(location.search).get("demo") !==
      new URLSearchParams(destinationQuery).get("demo");
  const current = impactSnapshot(activities);
  const query = new URLSearchParams(location.search);
  const needsForm =
    (session.phase === "phone" &&
      session.step === 3 &&
      !records.dropoff &&
      !query.has("dropoff")) ||
    (session.phase === "reuse" &&
      session.step === 0 &&
      !records.listing &&
      !query.has("new"));
  const missingRecord =
    (session.phase === "phone" && session.step === 4 && !records.dropoff) ||
    (session.phase === "reuse" && session.step > 0 && !records.listing) ||
    (session.phase === "complete" && (!records.dropoff || !records.listing));
  const descriptions =
    session.phase === "phone"
      ? [
          "“old phone” is prefilled in the catalog. This tour uses manual selection; no photo inference is simulated.",
          "Old phone → E-waste → Special care. Read the handling tip before continuing.",
          `${demoCenter.name} is a real operator-listed e-waste collection location. Check the linked source and call before a real visit.`,
          records.dropoff
            ? "Drop-off saved as collected. Continue to see its impact."
            : "For this tour, save the prefilled illustrative drop-off. It creates a local demo record, not a verified visit or booking.",
          `Diversion ${session.baseline.diversion.toFixed(2)}% → ${current.diversion.toFixed(2)}%. The E-waste → Special care flow now includes your drop-off.`,
        ]
      : [
          records.listing
            ? "Your working study lamp is listed. Next, request it as a demo neighbour."
            : "List “working study lamp” in good condition. Add a neighbourhood and publish locally.",
          records.listing?.status !== "available"
            ? "Request saved. Next, confirm the handover."
            : "Choose Request this on the highlighted lamp and enter a nickname.",
          records.listing?.status === "handed_over"
            ? "Handover complete. See the new reuse flow on Impact."
            : "Choose Confirm handover once the demo lamp has reached its new owner.",
        ];
  return (
    <aside className="guided-demo" aria-label="Guided demo">
      <div
        className="demo-step-copy"
        role="status"
        aria-live="polite"
        aria-atomic="true"
      >
        <span className="eyebrow">
          <Play size={12} aria-hidden="true" />
          {session.phase === "complete"
            ? "DEMO COMPLETE"
            : `${session.phase === "phone" ? "GUIDED DEMO" : "REUSE BRANCH"} · ${session.step + 1} OF ${steps.length}`}
        </span>
        <strong>
          {missingRecord
            ? "Your demo needs a restart."
            : session.phase === "complete"
              ? "Two items. Two better routes."
              : steps[session.step]}
        </strong>
        <p>
          {missingRecord
            ? "A demo record is no longer available. Restart the tour to create it again; existing records are kept."
            : session.phase === "complete"
              ? "Your drop-off and handover are saved locally. Explore the updated charts, or exit to keep exploring."
              : descriptions[session.step]}
        </p>
      </div>
      {session.phase !== "complete" && (
        <ol className="demo-dots" aria-label="Demo steps">
          {steps.map((label, i) => (
            <li
              key={label}
              aria-current={i === session.step ? "step" : undefined}
              className={i <= session.step ? "reached" : ""}
            >
              <span className="sr-only">
                {i + 1}. {label}
              </span>
              <span aria-hidden="true">
                {i < session.step ? <Check size={12} /> : i + 1}
              </span>
            </li>
          ))}
        </ol>
      )}
      <div className="demo-controls">
        {missingRecord ? (
          <Button variant="accent" onClick={start}>
            Restart demo
          </Button>
        ) : (
          session.phase !== "complete" && (
            <Button
              variant="accent"
              onClick={away || needsForm ? resume : advance}
              disabled={!away && !needsForm && !ready}
              aria-describedby={!ready ? "demo-action-help" : undefined}
            >
              {away
                ? "Return to step"
                : needsForm
                  ? session.phase === "phone"
                    ? "Open drop-off"
                    : "Open listing"
                  : session.phase === "phone" && session.step === 4
                    ? "Try reuse branch"
                    : session.phase === "reuse" && session.step === 2
                      ? "See impact"
                      : "Next"}
              <ArrowRight size={15} />
            </Button>
          )
        )}
        <button className="demo-exit" onClick={exit}>
          <X size={15} aria-hidden="true" />
          Exit demo
        </button>
      </div>
      {!ready && (
        <span id="demo-action-help" className="sr-only">
          Complete the action described in this step to continue.
        </span>
      )}
    </aside>
  );
}
