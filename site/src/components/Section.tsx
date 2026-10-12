import type { ReactNode } from "react";
import { useReveal } from "../lib/useReveal";

export function Section({ id, title, lede, children }: { id?: string; title: string; lede: ReactNode; children: ReactNode }) {
  const ref = useReveal<HTMLElement>();
  return (
    <section ref={ref} id={id} className="page section reveal">
      <h2 className="section-title">{title}</h2>
      <p className="section-lede">{lede}</p>
      {children}
    </section>
  );
}
