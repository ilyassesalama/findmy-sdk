import { GithubLogo, GpsFix } from "@phosphor-icons/react";
import styles from "./Nav.module.css";

export const REPO = "https://github.com/ilyassesalama/findmy-sdk";
export const NPM = "https://www.npmjs.com/package/findmy-sdk";

export function Nav() {
  return (
    <header className={`page ${styles.nav}`}>
      <a href={import.meta.env.BASE_URL} className={styles.brand} aria-label="findmy-sdk, home">
        <GpsFix size={24} weight="bold" />
        <span>findmy-sdk</span>
      </a>
      <nav className={styles.actions} aria-label="Project">
        <a className={styles.link} href="#install">
          Get started
        </a>
        <a className={styles.icon} href={REPO} aria-label="GitHub repository">
          <GithubLogo size={22} weight="bold" />
        </a>
      </nav>
    </header>
  );
}
