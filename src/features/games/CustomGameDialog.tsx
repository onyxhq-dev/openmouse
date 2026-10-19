import { useEffect, useRef, useState, type ReactNode } from "react";
import { saveBridgeCustomGames, type BridgeGame } from "../bridge/bridge";
import { t } from "../../i18n/index";
import type { InterfaceLocale } from "../settings/interface-preferences";

const MAX_NAME_LENGTH = 80;

/** The game name a file name suggests: `my-game.exe` becomes `my-game`. */
function suggestedName(fileName: string): string {
  return fileName.replace(/\.(exe|app)$/i, "");
}

// A browser file picker only reveals the file's name, never its folder, and the
// name is exactly what Bridge matches running games on, so that is all we keep.
export function CustomGameDialog({ open, onClose, locale = "en", knownGames, customGames, onSaved }: {
  open: boolean;
  onClose: () => void;
  locale?: InterfaceLocale;
  knownGames: BridgeGame[];
  customGames: BridgeGame[];
  onSaved: () => void;
}): ReactNode {
  const dialog = useRef<HTMLDialogElement>(null);
  const picker = useRef<HTMLInputElement>(null);
  const [name, setName] = useState("");
  const [exe, setExe] = useState("");
  const [busy, setBusy] = useState(false);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    const element = dialog.current;
    if (!element) return;
    if (open) {
      if (typeof element.showModal === "function") element.showModal();
      else element.setAttribute("open", "");
    } else if (typeof element.close === "function") {
      if (element.open) element.close();
    } else {
      element.removeAttribute("open");
    }
  }, [open]);

  useEffect(() => {
    if (!open) return;
    setName("");
    setExe("");
    setFailed(false);
  }, [open]);

  const trimmedName = name.trim();
  const duplicate = knownGames.some((game) =>
    game.name.toLowerCase() === trimmedName.toLowerCase()
    || (exe !== "" && game.executables.some((known) => known.toLowerCase() === exe.toLowerCase())),
  );
  const canAdd = trimmedName !== "" && exe !== "" && !duplicate && !busy;

  async function add(): Promise<void> {
    if (!canAdd) return;
    setBusy(true);
    setFailed(false);
    try {
      await saveBridgeCustomGames([...customGames, { name: trimmedName, executables: [exe] }]);
      onSaved();
      onClose();
    } catch {
      setFailed(true);
    } finally {
      setBusy(false);
    }
  }

  return (
    <dialog
      ref={dialog}
      className="support-dialog feedback-dialog gamereq-dialog"
      aria-labelledby="customgame-dialog-title"
      onClose={onClose}
      onClick={(event) => { if (event.target === dialog.current) onClose(); }}
    >
      <form
        className="support-dialog-inner feedback-dialog-inner"
        onSubmit={(event) => {
          event.preventDefault();
          void add();
        }}
      >
        <header className="om-dialog-head">
          <div>
            <h2 id="customgame-dialog-title">{t(locale, "customgame.tile")}</h2>
          </div>
          <button className="om-icon-btn" type="button" onClick={onClose} aria-label={t(locale, "common.close")}>×</button>
        </header>

        <p className="feedback-description">{t(locale, "customgame.description")}</p>

        <div className="gamereq-exe">
          <input
            ref={picker}
            type="file"
            hidden
            onChange={(event) => {
              const file = event.currentTarget.files?.[0];
              event.currentTarget.value = "";
              if (!file) return;
              setExe(file.name);
              if (!name.trim()) setName(suggestedName(file.name).slice(0, MAX_NAME_LENGTH));
            }}
          />
          <button type="button" className="om-btn" onClick={() => picker.current?.click()}>
            {t(locale, "customgame.choose")}
          </button>
          {exe ? <code className="gamereq-mono">{exe}</code> : null}
        </div>

        <label className="feedback-handle" htmlFor="customgame-name">
          <span>{t(locale, "gamereq.nameLabel")}</span>
          <input
            id="customgame-name"
            type="text"
            required
            maxLength={MAX_NAME_LENGTH}
            value={name}
            onChange={(event) => setName(event.currentTarget.value)}
          />
        </label>

        {duplicate ? <p className="feedback-error" role="alert">{t(locale, "customgame.duplicate")}</p> : null}
        {failed ? <p className="feedback-error" role="alert">{t(locale, "customgame.failed")}</p> : null}

        <div className="om-dialog-foot feedback-actions">
          <button className="om-btn is-ghost" type="button" onClick={onClose}>{t(locale, "common.cancel")}</button>
          <button type="submit" className="om-btn is-primary" disabled={!canAdd}>
            {t(locale, "customgame.add")}
          </button>
        </div>
      </form>
    </dialog>
  );
}
