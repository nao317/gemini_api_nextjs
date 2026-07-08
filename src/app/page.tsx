import styles from "./page.module.css";

import { GeminiResponsePanel } from "@/components/ui/gemini-response-panel";

export default function Home() {
  return (
    <main className={styles.page}>
      <div className={styles.backgroundGlow} aria-hidden="true" />
      <div className={styles.container}>
        <GeminiResponsePanel />
      </div>
    </main>
  );
}
