import { Check, Copy } from "@phosphor-icons/react";
import { useCopy } from "../lib/useCopy";
import { Explorer } from "./Explorer";
import styles from "./Hero.module.css";
import { IconSwap } from "./IconSwap";

const INSTALL = "npm i findmy-sdk";

export function Hero() {
  return (
    <section className={`page ${styles.hero}`}>
      <div className={styles.copy}>
        <h1 className={styles.title}>Find My for Node.js</h1>
        <p className={styles.lede}>
          Sign in with an Apple ID, then locate, ring, message, lock or erase your devices. No two-factor code and no dependencies.
        </p>
        <div className={styles.actions}>
          <InstallPill />
          <a className={styles.secondary} href="#how">
            How it signs in
          </a>
        </div>
      </div>
      <div className={styles.demo}>
        <Explorer />
      </div>
    </section>
  );
}

function InstallPill() {
  const [copied, copy] = useCopy(INSTALL);
  return (
    <button type="button" className={styles.install} onClick={copy} aria-label={copied ? "Copied" : `Copy ${INSTALL}`}>
      <code>
        <span className={styles.prompt}>$</span> {INSTALL}
      </code>
      <IconSwap on={copied} onIcon={<Check size={18} weight="bold" />} offIcon={<Copy size={18} weight="bold" />} />
    </button>
  );
}
