import { useState } from "react";
import { CodeBlock } from "./CodeBlock";
import { Section } from "./Section";
import { Tabs } from "./Tabs";
import styles from "./UseIt.module.css";

const managers = [
  { value: "npm", label: "npm", code: "npm i findmy-sdk" },
  { value: "pnpm", label: "pnpm", code: "pnpm add findmy-sdk" },
  { value: "yarn", label: "yarn", code: "yarn add findmy-sdk" },
  { value: "bun", label: "bun", code: "bun add findmy-sdk" },
] as const;

const examples = [
  {
    value: "devices",
    label: "Devices",
    code: `import { FindMy } from "findmy-sdk";

const fm = await FindMy.login("you@icloud.com", password);
const devices = await fm.devices();`,
  },
  {
    value: "family",
    label: "Family",
    code: `console.log(fm.owner.name); // "Alex Rivera"

// Devices shared through Family Sharing carry their owner's name.
for (const device of await fm.devices()) {
  console.log(device.ownerName, device.name);
}`,
  },
  {
    value: "errors",
    label: "Errors",
    code: `import { AuthError, FindMy } from "findmy-sdk";

try {
  await FindMy.login(email, password);
} catch (error) {
  if (!(error instanceof AuthError)) throw error;
  console.error("Sign-in failed:", error.message);
}`,
  },
] as const;

const api = [
  { name: "FindMy.login(email, password)", text: "Signs in and returns a client. Throws an AuthError when Apple rejects the sign-in." },
  { name: "fm.owner", text: "The account holder: name, Apple ID, email and country." },
  { name: "fm.devices()", text: "Every device on the account, with its location, battery and the actions it supports." },
  { name: "fm.watch(intervalMs?)", text: "Yields fresh device snapshots every 15 seconds by default, all on one sign-in." },
  { name: "fm.ring(id)", text: "Plays a sound on the device." },
  { name: "fm.message(id, text, sound?)", text: "Shows a message on the device’s screen, with a sound if you ask for one." },
  { name: "fm.markAsLost(id, options?)", text: "Turns on Lost Mode, with an optional phone number, message and passcode." },
  { name: "fm.erase(id, message?)", text: "Wipes the device and removes it from the account. There is no undo." },
];

export function UseIt() {
  const [manager, setManager] = useState<(typeof managers)[number]["value"]>("npm");
  const [example, setExample] = useState<(typeof examples)[number]["value"]>("devices");

  return (
    <Section
      id="install"
      title="Your devices in three lines"
      lede="Install the package, sign in with your Apple ID and ask for your devices. It needs Node 18 or later and nothing else."
    >
      <div className={`card ${styles.card}`}>
        <div className={styles.step}>
          <h3>
            <span className={styles.number}>1</span>Install
          </h3>
          <Tabs label="Package manager" options={managers} value={manager} onChange={setManager} />
          <CodeBlock code={managers.find((option) => option.value === manager)!.code} prompt />
        </div>
        <div className={styles.step}>
          <h3>
            <span className={styles.number}>2</span>Sign in and ask
          </h3>
          <Tabs label="Example" options={examples} value={example} onChange={setExample} />
          <CodeBlock code={examples.find((option) => option.value === example)!.code} />
        </div>
      </div>
      <div className={styles.api}>
        <h3>The whole API</h3>
        <dl>
          {api.map((item) => (
            <div key={item.name}>
              <dt>
                <code>{item.name}</code>
              </dt>
              <dd>{item.text}</dd>
            </div>
          ))}
        </dl>
      </div>
    </Section>
  );
}
