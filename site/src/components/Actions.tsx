import { ChatText, type Icon, LockSimple, SpeakerHigh, Trash } from "@phosphor-icons/react";
import { type CSSProperties, useState } from "react";
import styles from "./Actions.module.css";
import { CodeBlock } from "./CodeBlock";
import { Phone, type PhoneAction } from "./Phone";
import { Section } from "./Section";

const actions: { name: PhoneAction; title: string; method: string; icon: Icon; tone: string; code: string }[] = [
  { name: "ring", title: "Play a sound", method: "ring()", icon: SpeakerHigh, tone: "blue", code: `await fm.ring(iphone.id);` },
  {
    name: "message",
    title: "Show a message",
    method: "message()",
    icon: ChatText,
    tone: "green",
    code: `await fm.message(iphone.id, "Please call me!", true);`,
  },
  {
    name: "lost",
    title: "Mark as lost",
    method: "markAsLost()",
    icon: LockSimple,
    tone: "orange",
    code: `await fm.markAsLost(iphone.id, {
  phoneNumber: "+15551234567",
  message: "This iPhone is lost. Please call me.",
});`,
  },
  {
    name: "erase",
    title: "Erase",
    method: "erase()",
    icon: Trash,
    tone: "red",
    code: `// Wipes the iPhone. There is no undo.
await fm.erase(iphone.id);`,
  },
];

export function Actions() {
  const [current, setCurrent] = useState<PhoneAction>("ring");
  // Keys the phone so every press replays, even of the same action. Zero until the first press.
  const [runs, setRuns] = useState(0);
  const action = actions.find((item) => item.name === current)!;

  const play = (name: PhoneAction) => {
    setCurrent(name);
    setRuns((count) => count + 1);
  };

  return (
    <Section
      title="Ring it, message it, lock it"
      lede="Every Find My action is one awaited call with the device’s id. Select one to see what it does on the phone."
    >
      <div className={`card ${styles.card}`}>
        <div className={styles.stage}>
          <Phone key={runs} action={runs ? current : null} />
        </div>
        <div className={styles.controls}>
          <div className={styles.keys}>
            {actions.map(({ name, title, method, icon: Glyph, tone }) => (
              <button
                key={name}
                type="button"
                className={styles.key}
                style={{ "--tone": `var(--${tone})`, "--tone-bg": `var(--${tone}-bg)` } as CSSProperties}
                aria-pressed={runs > 0 && name === current}
                onClick={() => play(name)}
              >
                <Glyph size={22} weight="bold" />
                <span className={styles.title}>{title}</span>
                <code className={styles.method}>{method}</code>
              </button>
            ))}
          </div>
          <CodeBlock code={action.code} />
        </div>
      </div>
    </Section>
  );
}
