import { Link } from "react-router-dom";
import {
  ArrowRight,
  ArrowUpRight,
  ScanLine,
  MapPin,
  ChartNoAxesCombined,
  Leaf,
  Recycle,
  Earth,
  MoveUpRight,
  Sparkles,
  Check,
  Plus,
  Heart,
  Package,
  Shirt,
  Play,
} from "lucide-react";
import { useStore } from "../store/useStore";
import {
  landfillAvoidedKg,
  co2eSavedKg,
  itemsRerouted,
  diversionRate,
} from "../store/selectors";
import { Button, Highlight, StatNumber } from "../components/ui";
import { useGuidedDemo } from "../components/GuidedDemo";
export default function Home() {
  const { start } = useGuidedDemo();
  const activities = useStore((s) => s.activities);
  return (
    <>
      <div className="home-top">
        <span className="row">
          <span className="live-dot" /> SMALL ACTIONS. CIRCULAR FUTURES.
        </span>
        <span className="home-date">
          Made for a world with less waste <Leaf size={14} />
        </span>
      </div>
      <section className="hero">
        <div className="hero-copy">
          <div className="eyebrow">
            <span className="mini-line" /> A FRESH START FOR EVERYDAY THINGS
          </div>
          <h1>
            Stop sending it
            <br />
            to landfill.
            <br />
            Give it a{" "}
            <Highlight>
              second
              <br className="desktop-break" /> route.
            </Highlight>
          </h1>
          <p>
            That bottle, that old tee, that almost-working phone.
            <br className="wide-break" /> There’s a better place for it. Let’s
            find it together.
          </p>
          <div className="hero-ctas">
            <Link to="/classify" className="button button-primary">
              Find my item’s route <ArrowUpRight size={19} />
            </Link>
            <Link to="/centers" className="quiet-link">
              <MapPin size={17} />
              Explore nearby centers
            </Link>
          </div>
          <div className="hero-proof">
            <div className="proof-icons">
              <span>
                <Leaf size={13} />
              </span>
              <span>
                <Recycle size={13} />
              </span>
              <span>
                <Heart size={13} />
              </span>
            </div>
            <span>Less guessing. More good.</span>
            <span className="proof-divider" />
            <Check size={13} />
            <span>Free & thoughtfully built</span>
          </div>
          <div className="home-demo-invite">
            <Button variant="accent" onClick={start}>
              <Play size={15} />
              Start demo
            </Button>
            <span>
              A phone drop-off, a lamp handover.
              <br />
              Follow the journey in a few steps.
            </span>
          </div>
        </div>
        <div
          className="hero-art"
          aria-label="Illustration of everyday items finding a circular route"
          role="img"
        >
          <div className="orbit orbit-one" />
          <div className="orbit orbit-two" />
          <div className="orbit orbit-three" />
          <Sparkles className="art-spark spark-one" size={29} />
          <Plus className="art-spark spark-two" size={21} />
          <div className="floating-label label-top">
            <span className="live-dot" /> A little care goes a long way
          </div>
          <div className="item-tile tile-bottle">
            <div className="bottle-drawing">
              <i />
              <b />
              <span />
              <em />
            </div>
            <div className="tile-caption">
              EMPTY BOTTLE
              <ArrowUpRight size={14} />
            </div>
          </div>
          <div className="item-tile tile-shirt">
            <Shirt size={84} strokeWidth={1.2} />
            <div className="tile-caption">
              PRE-LOVED TEE
              <Heart size={13} />
            </div>
          </div>
          <div className="item-tile tile-can">
            <div className="can-drawing">
              <i />
              <span />
              <b />
            </div>
            <div className="tile-caption">
              TIN CAN
              <ArrowUpRight size={14} />
            </div>
          </div>
          <div className="circular-seal">
            <Recycle size={36} strokeWidth={1.4} />
            <span>
              NOT WASTE.
              <br />
              POSSIBILITY.
            </span>
          </div>
          <div className="art-arrow arrow-one">↗</div>
          <div className="art-arrow arrow-two">↘</div>
          <div className="floating-label label-bottom">
            <span className="leaf-disc">
              <Leaf size={17} />
            </span>
            New purpose. Same planet.
            <ArrowRight size={15} />
          </div>
          <span className="art-note">Good things deserve another go.</span>
        </div>
      </section>
      <section className="impact-strip">
        <div className="impact-intro">
          <span className="eyebrow">YOUR SMALL ACTIONS,</span>
          <h3>a growing impact.</h3>
          <span className="demo-label">
            Your demo journey so far <ArrowUpRight size={13} />
          </span>
        </div>
        <StatNumber
          value={itemsRerouted(activities)}
          label="items given a new route"
          icon={<Recycle size={18} />}
        />
        <StatNumber
          value={landfillAvoidedKg(activities).toFixed(1)}
          unit="kg"
          label="kept out of landfill"
          icon={<Package size={18} />}
        />
        <StatNumber
          value={co2eSavedKg(activities).toFixed(1)}
          unit="kg"
          label="estimated CO₂e saved"
          icon={<Leaf size={18} />}
        />
        <Link
          to="/dashboard"
          className="impact-link"
          aria-label="View impact dashboard"
        >
          <ArrowUpRight size={23} />
        </Link>
      </section>
      <section className="how-section">
        <div className="section-heading">
          <div>
            <div className="eyebrow">FROM “WHERE DOES THIS GO?” TO “DONE.”</div>
            <h2>
              A better route in <Highlight>three little steps.</Highlight>
            </h2>
          </div>
          <span>
            No expert knowledge needed.
            <br />
            Just a little intention.
          </span>
        </div>
        <div className="steps-grid">
          {[
            {
              icon: ScanLine,
              n: "01",
              title: "Snap it. Or pick it.",
              copy: "Take a photo or find your item in our catalog. We’ll help you see what it’s made of.",
              link: "Meet your item",
              to: "/classify",
            },
            {
              icon: MapPin,
              n: "02",
              title: "Find its next chapter.",
              copy: "Recycle, reuse, repair, or compost. Get a clear route and a nearby place to make it happen.",
              link: "Find a center",
              to: "/centers",
            },
            {
              icon: ChartNoAxesCombined,
              n: "03",
              title: "See the good add up.",
              copy: "Log your actions and watch your impact grow. Every small decision makes a difference.",
              link: "Track your impact",
              to: "/dashboard",
            },
          ].map((s) => (
            <Link className="step-card" to={s.to} key={s.n}>
              <div className="row between">
                <span className="step-icon">
                  <s.icon size={23} />
                </span>
                <span className="step-number">{s.n}</span>
              </div>
              <h3>{s.title}</h3>
              <p>{s.copy}</p>
              <span className="text-link">
                {s.link}
                <ArrowUpRight size={15} />
              </span>
            </Link>
          ))}
        </div>
      </section>
      <section className="home-bottom">
        <div>
          <span className="eyebrow">SOMEONE ELSE’S NEXT FAVOURITE</span>
          <h2>
            Done with it?
            <br />
            Someone isn’t.
          </h2>
          <p>Give useful things a new home in the Reuse Exchange.</p>
          <Link className="button button-secondary" to="/exchange">
            Explore the exchange <ArrowUpRight size={17} />
          </Link>
        </div>
        <div className="exchange-visual">
          <div className="exchange-object">
            <Package size={60} strokeWidth={1} />
            <span>Still full of possibility.</span>
          </div>
          <div className="exchange-object">
            <Shirt size={60} strokeWidth={1} />
            <span>A new home awaits.</span>
          </div>
        </div>
      </section>
      <div className="gentle-note">
        <Earth size={17} />
        <span>Progress, one everyday item at a time.</span>
        <span className="muted">
          {Math.round(diversionRate(activities) * 100)}% of your logged weight
          has a route beyond landfill.
        </span>
      </div>
    </>
  );
}
