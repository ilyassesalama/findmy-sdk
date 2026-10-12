import styles from "./HowItWorks.module.css";
import { Section } from "./Section";

const steps = [
  {
    title: "Prove the password",
    text: "It runs Apple’s SRP-6a handshake on Node’s built-in crypto, so the password itself never leaves your machine.",
  },
  {
    title: "Skip the code",
    text: "Apple answers that the account needs a two-factor code. Find My doesn’t, so the session carries on without one.",
  },
  {
    title: "Call Find My",
    text: "The session opens Apple’s Find My web service, and every call after that is a plain fetch with the session’s cookies.",
  },
];

const notes = [
  { title: "Your own devices only", text: "Locating someone else’s devices without their consent is illegal in most places." },
  {
    title: "Unofficial",
    text: "These are Apple’s private web endpoints. Using them is against Apple’s terms, and Apple can change them without notice.",
  },
  { title: "The real password", text: "App-specific passwords don’t work. Find My needs the account’s actual password." },
  { title: "Sign-in alerts", text: "Your trusted devices may say your Apple ID was just used to sign in, even though no code was asked for." },
  { title: "Gentle polling", text: "Every refresh pings your devices and costs them battery. Every 30 to 60 seconds is plenty." },
];

export function HowItWorks() {
  return (
    <Section
      id="how"
      title="How it signs in without a code"
      lede="Apple keeps Find My reachable with just a password, because the device that would get your two-factor code may be the one you lost. findmy-sdk signs in the way iCloud.com does and takes that same path."
    >
      <ol className={styles.steps}>
        {steps.map((step, index) => (
          <li key={step.title}>
            <span className={styles.number}>{index + 1}</span>
            <h3>{step.title}</h3>
            <p>{step.text}</p>
          </li>
        ))}
      </ol>
      <h3 className={styles.subhead}>Before you use it</h3>
      <ul className={styles.notes}>
        {notes.map((note) => (
          <li key={note.title}>
            <h4>{note.title}</h4>
            <p>{note.text}</p>
          </li>
        ))}
      </ul>
    </Section>
  );
}
