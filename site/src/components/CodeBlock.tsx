import { Check, Copy } from "@phosphor-icons/react";
import type { ReactNode } from "react";
import { useCopy } from "../lib/useCopy";
import styles from "./CodeBlock.module.css";
import { IconSwap } from "./IconSwap";

const TOKENS =
  /(\/\/.*$|"(?:[^"\\]|\\.)*"|'(?:[^'\\]|\\.)*'|`(?:[^`\\]|\\.)*`)|\b(import|from|const|new|await|for|of|if|try|catch|throw|instanceof|true|false|null)\b|\b([a-zA-Z_$][\w$]*)(?=\()|\b(\d[\d_]*(?:\.\d+)?)\b/gm;

/** Just enough highlighting to read the snippets on this page. */
function highlight(code: string): ReactNode[] {
  const nodes: ReactNode[] = [];
  let last = 0;
  for (const match of code.matchAll(TOKENS)) {
    const index = match.index;
    if (index > last) nodes.push(code.slice(last, index));
    const [text, stringOrComment, keyword, call] = match;
    const kind = stringOrComment ? (stringOrComment.startsWith("//") ? "comment" : "string") : keyword ? "keyword" : call ? "call" : "number";
    nodes.push(
      <span key={index} className={styles[kind]}>
        {text}
      </span>,
    );
    last = index + text.length;
  }
  if (last < code.length) nodes.push(code.slice(last));
  return nodes;
}

export function CodeBlock({ code, prompt = false, className }: { code: string; prompt?: boolean; className?: string }) {
  const [copied, copy] = useCopy(code);
  return (
    <div className={className ? `${styles.block} ${className}` : styles.block}>
      <pre className={styles.code}>
        {prompt && <span className={styles.prompt}>$ </span>}
        <code>{highlight(code)}</code>
      </pre>
      <button type="button" className={styles.copy} onClick={copy} aria-label={copied ? "Copied" : "Copy code"}>
        <IconSwap on={copied} onIcon={<Check size={16} weight="bold" />} offIcon={<Copy size={16} weight="bold" />} />
      </button>
    </div>
  );
}
