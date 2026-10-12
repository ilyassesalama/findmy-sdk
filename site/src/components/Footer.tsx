import { GpsFix } from "@phosphor-icons/react";
import styles from "./Footer.module.css";
import { NPM, REPO } from "./Nav";

export function Footer() {
  return (
    <footer className="page">
      <div className={styles.footer}>
        <span className={styles.brand}>
          <GpsFix size={20} weight="bold" />
          findmy-sdk
        </span>
        <nav className={styles.links} aria-label="Project">
          <a href={NPM}>npm</a>
          <a href={REPO}>GitHub</a>
          <a href={`${REPO}/blob/main/LICENSE`}>MIT license</a>
        </nav>
      </div>
      <p className={styles.fine}>Not affiliated with Apple. Find My, iPhone, iPad, Mac and AirPods are trademarks of Apple Inc.</p>
    </footer>
  );
}
