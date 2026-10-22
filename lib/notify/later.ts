import { after } from "next/server";

export function runLater(task: () => Promise<unknown>) {
  after(() => task().catch((error) => console.error("[notify]", error)));
}
