import { Component, type ReactNode } from "react";
import { Link } from "react-router-dom";
import { TriangleAlert } from "lucide-react";
import { Button, Card } from "./ui";

export default class PageBoundary extends Component<
  { children: ReactNode },
  { failed: boolean }
> {
  state = { failed: false };
  static getDerivedStateFromError() {
    return { failed: true };
  }
  render() {
    if (!this.state.failed) return this.props.children;
    return (
      <Card className="page-error">
        <div role="alert">
          <TriangleAlert size={30} />
          <h1>This route needs a fresh start.</h1>
          <p>
            The page could not load. Your saved activities and listings remain
            in this browser.
          </p>
        </div>
        <div className="row wrap center">
          <Button onClick={() => window.location.reload()}>Reload page</Button>
          <Link to="/" className="button button-secondary">
            Go home
          </Link>
        </div>
      </Card>
    );
  }
}
