import { useEffect, useState, type ReactNode } from "react";
import * as control from "../../device/controller";
import type { ControlSnapshot } from "../../device/types";
import { displayText, t, type I18nKey } from "../../i18n/index";
import { bindingFromKeyEvent, shortcutText } from "./logitech-commands";

/** The two side buttons a Host mode mouse hands to software, by their bit in the mouse's report. */
const SIDE_BUTTONS: readonly { bit: number; label: I18nKey }[] = [
  { bit: 16, label: "hostbuttons.front" },
  { bit: 8, label: "hostbuttons.back" },
];

/**
 * Assigns a key to each side button while a game runs. Shown only in a game
 * profile: Bridge presses the keys from the saved profile, so there is nothing
 * to apply to the mouse itself.
 */
export function HostButtons({ snapshot }: { snapshot: ControlSnapshot }): ReactNode {
  const locale = snapshot.preferences.locale;
  const assigned = snapshot.status?.hostButtons ?? {};
  const [recording, setRecording] = useState<number | null>(null);

  useEffect(() => {
    if (recording === null) return;
    const onKey = (event: KeyboardEvent): void => {
      event.preventDefault();
      if (event.code === "Escape" && !event.ctrlKey && !event.shiftKey && !event.altKey && !event.metaKey) {
        setRecording(null);
        return;
      }
      const binding = bindingFromKeyEvent(event);
      if (!binding || binding.kind !== "keyboard") return;
      control.applyHostButton(recording, { key: binding.key, modifiers: binding.modifiers });
      setRecording(null);
    };
    window.addEventListener("keydown", onKey, true);
    return () => window.removeEventListener("keydown", onKey, true);
  }, [recording]);

  return (
    <div id="host-buttons-card">
      <article className="setting-card superstrike-tuning-card">
        <div className="setting-heading superstrike-tuning-heading">
          <div><h2>{t(locale, "hostbuttons.title")}</h2></div>
        </div>
        {SIDE_BUTTONS.map(({ bit, label }) => {
          const action = assigned[bit];
          return (
            <div key={bit} className="bunny-hop-controls">
              <span>{t(locale, label)}</span>
              <code className="gamereq-mono">
                {recording === bit
                  ? t(locale, "hostbuttons.recording")
                  : action ? displayText(locale, shortcutText(action.key, action.modifiers)) : t(locale, "hostbuttons.default")}
              </code>
              <button
                type="button"
                className="om-btn is-sm"
                disabled={snapshot.settingInProgress}
                onClick={() => setRecording(recording === bit ? null : bit)}
              >
                {t(locale, "hostbuttons.record")}
              </button>
              {action ? (
                <button
                  type="button"
                  className="om-btn is-sm is-ghost"
                  disabled={snapshot.settingInProgress}
                  onClick={() => control.applyHostButton(bit, null)}
                >
                  {t(locale, "hostbuttons.clear")}
                </button>
              ) : null}
            </div>
          );
        })}
        <small className="setting-note">{t(locale, "hostbuttons.note")}</small>
      </article>
    </div>
  );
}
