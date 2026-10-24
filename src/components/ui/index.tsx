import {
  createContext,
  useContext,
  useState,
  type ReactNode,
  type ButtonHTMLAttributes,
} from "react";
import { Check, Inbox, X } from "lucide-react";
import { clsx } from "clsx";
import type { Activity } from "../../data/types";
export function Button({
  variant = "primary",
  className,
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "secondary" | "accent" | "disabled";
}) {
  return (
    <button
      {...props}
      disabled={props.disabled || variant === "disabled"}
      className={clsx("button", `button-${variant}`, className)}
    />
  );
}
export function Card({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) {
  return <div className={`card ${className}`}>{children}</div>;
}
export function Badge({ children }: { children: ReactNode }) {
  return <span className="badge">{children}</span>;
}
export function Highlight({ children }: { children: ReactNode }) {
  return <span className="highlight">{children}</span>;
}
export function StatNumber({
  value,
  label,
  unit,
  icon,
}: {
  value: ReactNode;
  label: string;
  unit?: string;
  icon?: ReactNode;
}) {
  return (
    <div className="stat">
      {icon && <span className="stat-icon">{icon}</span>}
      <div className="stat-value">
        {value}
        <span>{unit}</span>
      </div>
      <div className="stat-label">{label}</div>
    </div>
  );
}
export function PageHeader({
  eyebrow,
  title,
  description,
  action,
}: {
  eyebrow?: string;
  title: ReactNode;
  description: string;
  action?: ReactNode;
}) {
  return (
    <header className="page-header">
      <div>
        {eyebrow && <div className="eyebrow">{eyebrow}</div>}
        <h1>{title}</h1>
        <p>{description}</p>
      </div>
      {action}
    </header>
  );
}
export function EmptyState({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  return (
    <div className="empty-state">
      <Inbox size={36} />
      <h3>{title}</h3>
      <p>{description}</p>
    </div>
  );
}
export function StatusPill({
  status,
}: {
  status: Activity["status"] | string;
}) {
  return (
    <span className={`status status-${status}`}>
      <i />
      {status.replaceAll("_", " ")}
    </span>
  );
}
const ToastContext = createContext<(message: string) => void>(() => {});
export const useToast = () => useContext(ToastContext);
export function Toast({ children }: { children: ReactNode }) {
  const [message, setMessage] = useState("");
  return (
    <ToastContext.Provider
      value={(m) => {
        setMessage(m);
        window.setTimeout(() => setMessage(""), 4500);
      }}
    >
      {children}
      {message && (
        <div className="toast" role="status">
          <Check size={19} />
          {message}
          <button
            aria-label="Dismiss notification"
            onClick={() => setMessage("")}
          >
            <X size={17} />
          </button>
        </div>
      )}
    </ToastContext.Provider>
  );
}
