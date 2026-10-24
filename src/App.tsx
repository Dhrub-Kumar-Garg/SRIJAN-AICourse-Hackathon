import { lazy, Suspense, useEffect } from "react";
import {
  BrowserRouter,
  Routes,
  Route,
  NavLink,
  Link,
  useLocation,
} from "react-router-dom";
import {
  House,
  ScanLine,
  MapPin,
  Clock3,
  ArrowLeftRight,
  ChartNoAxesCombined,
  BrainCircuit,
  ArrowUpRight,
  Leaf,
  MoveUpRight,
  RotateCw,
  LoaderCircle,
} from "lucide-react";
import Home from "./pages/Home";
import { Toast } from "./components/ui";
import { GuidedDemoBanner, GuidedDemoProvider } from "./components/GuidedDemo";
import PageBoundary from "./components/PageBoundary";
const Classify = lazy(() => import("./pages/Classify")),
  Centers = lazy(() => import("./pages/Centers")),
  Activity = lazy(() => import("./pages/Activity")),
  Exchange = lazy(() => import("./pages/Exchange")),
  Dashboard = lazy(() => import("./pages/Dashboard")),
  About = lazy(() => import("./pages/About"));
const nav = [
  { to: "/", label: "Home", icon: House },
  { to: "/classify", label: "Classify", icon: ScanLine },
  { to: "/centers", label: "Find Centers", icon: MapPin },
  { to: "/activity", label: "My Activity", icon: Clock3 },
  { to: "/exchange", label: "Reuse Exchange", icon: ArrowLeftRight },
  { to: "/dashboard", label: "Impact", icon: ChartNoAxesCombined },
  { to: "/about", label: "AI & Ethics", icon: BrainCircuit },
];
function Layout() {
  const location = useLocation();
  useEffect(() => {
    window.scrollTo(0, 0);
    document.title = `${nav.find((n) => n.to === location.pathname)?.label ?? "Page not found"} | Srijan`;
    document.getElementById("main")?.focus({ preventScroll: true });
  }, [location.pathname]);
  return (
    <>
      <a className="skip-link" href="#main">
        Skip to content
      </a>
      <aside className="sidebar">
        <Link to="/" className="brand" aria-label="Srijan home">
          <span>
            <RotateCw size={30} strokeWidth={2.4} />
            <MoveUpRight size={13} />
          </span>
          Srijan<span className="brand-dot">.</span>
        </Link>
        <p className="brand-tagline">
          Every item gets
          <br />a second route.
        </p>
        <div className="nav-label">YOUR CIRCULAR JOURNEY</div>
        <nav aria-label="Main navigation">
          {nav.map((n) => (
            <NavLink key={n.to} to={n.to} end={n.to === "/"}>
              <n.icon size={19} strokeWidth={1.7} />
              <span>{n.label}</span>
              {n.to === "/" && <span className="nav-active-dot" />}
            </NavLink>
          ))}
        </nav>
        <div className="sidebar-bottom">
          <div className="sidebar-note">
            <span className="sidebar-leaf">
              <Leaf size={25} strokeWidth={1.3} />
            </span>
            <h3>
              Small steps.
              <br />
              Lighter footprint.
            </h3>
            <p>
              A better tomorrow starts
              <br />
              with what you do today.
            </p>
            <Link to="/about">
              Our way of thinking <ArrowUpRight size={14} />
            </Link>
          </div>
          <div className="sidebar-credit">
            <span className="live-dot" /> MADE FOR A CIRCULAR WORLD
          </div>
        </div>
      </aside>
      <div className="app-shell">
        <header className="mobile-masthead">
          <Link to="/" aria-label="Srijan home">
            <RotateCw size={22} />
            Srijan<span>.</span>
          </Link>
          <span>Every item gets a second route.</span>
        </header>
        <GuidedDemoBanner />
        <main
          id="main"
          tabIndex={-1}
          key={location.pathname}
          className={location.pathname === "/" ? "main home-main" : "main"}
        >
          <PageBoundary key={location.pathname}>
            <Suspense
              fallback={
                <div className="page-loading" role="status" aria-live="polite">
                  <LoaderCircle className="spin" />
                  Finding your next route…
                </div>
              }
            >
              <Routes>
                <Route path="/" element={<Home />} />
                <Route path="/classify" element={<Classify />} />
                <Route path="/centers" element={<Centers />} />
                <Route path="/activity" element={<Activity />} />
                <Route path="/exchange" element={<Exchange />} />
                <Route path="/dashboard" element={<Dashboard />} />
                <Route path="/about" element={<About />} />
                <Route
                  path="*"
                  element={
                    <div className="empty-state">
                      <h1>This route is still waiting.</h1>
                      <Link className="button button-primary" to="/">
                        Go home
                      </Link>
                    </div>
                  }
                />
              </Routes>
            </Suspense>
          </PageBoundary>
        </main>
        <footer>
          <span className="footer-brand">
            <RotateCw size={18} />
            Srijan<span className="brand-dot">.</span>
          </span>
          <span>Every item gets a second route.</span>
          <Link to="/about">
            Built with care. Guided by you. <ArrowUpRight size={13} />
          </Link>
        </footer>
      </div>
    </>
  );
}
export default function App() {
  return (
    <BrowserRouter>
      <Toast>
        <GuidedDemoProvider>
          <Layout />
        </GuidedDemoProvider>
      </Toast>
    </BrowserRouter>
  );
}
