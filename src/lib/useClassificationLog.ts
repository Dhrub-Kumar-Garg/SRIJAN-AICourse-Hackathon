import { useEffect, useState } from "react";
import {
  CLASSIFICATION_LOG_EVENT,
  readClassificationLog,
} from "./classificationLog";

export function useClassificationLog() {
  const [log, setLog] = useState(readClassificationLog);
  useEffect(() => {
    const refresh = () => setLog(readClassificationLog());
    const storage = (event: StorageEvent) => {
      if (event.key === "srijan-classification-log" || event.key === null)
        refresh();
    };
    window.addEventListener(CLASSIFICATION_LOG_EVENT, refresh);
    window.addEventListener("storage", storage);
    window.addEventListener("focus", refresh);
    return () => {
      window.removeEventListener(CLASSIFICATION_LOG_EVENT, refresh);
      window.removeEventListener("storage", storage);
      window.removeEventListener("focus", refresh);
    };
  }, []);
  return log;
}
