import type { ButtonHTMLAttributes, ReactNode } from "react";
import { Link } from "react-router-dom";
import paceLabLogo from "./assets/Pace_Lab_logo_complet_transparent.png";

export function Brand({ to = "/" }: { to?: string }) {
  return (
    <Link
      className="brand"
      to={to}
      aria-label={to === "/activities" ? "PACE / LAB, historique" : "PACE / LAB, accueil"}
    >
      <img className="brand__logo" src={paceLabLogo} alt="PACE / LAB" />
      <span className="brand__descriptor">Performance lab</span>
    </Link>
  );
}

export function EditorialLabel({ children }: { children: ReactNode }) {
  return <p className="editorial-label">{children}</p>;
}

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "secondary" | "text";
  showArrow?: boolean;
};

export function Button({
  children,
  className = "",
  variant = "primary",
  showArrow = false,
  ...props
}: ButtonProps) {
  return (
    <button className={`button button--${variant} ${className}`.trim()} {...props}>
      <span>{children}</span>
      {showArrow && <span className="button__arrow" aria-hidden="true">↗</span>}
    </button>
  );
}
