function findCopyTargets() {
  /** @type {Array<{btn: HTMLButtonElement, text: string}>} */
  const targets = [];
  const blocks = document.querySelectorAll("[data-copy]");
  for (const block of blocks) {
    const btn = block.querySelector("button.copy");
    const code = block.querySelector("pre > code");
    if (!btn || !code) continue;
    targets.push({ btn, text: code.textContent || "" });
  }
  return targets;
}

async function copyText(text) {
  if (navigator.clipboard?.writeText) {
    await navigator.clipboard.writeText(text);
    return true;
  }

  // Fallback
  const ta = document.createElement("textarea");
  ta.value = text;
  ta.setAttribute("readonly", "true");
  ta.style.position = "fixed";
  ta.style.top = "-9999px";
  document.body.appendChild(ta);
  ta.select();
  const ok = document.execCommand("copy");
  document.body.removeChild(ta);
  return ok;
}

function flash(btn, next, ms = 900) {
  const prev = btn.textContent || "";
  btn.textContent = next;
  btn.disabled = true;
  window.setTimeout(() => {
    btn.textContent = prev;
    btn.disabled = false;
  }, ms);
}

function init() {
  const targets = findCopyTargets();
  for (const { btn, text } of targets) {
    btn.addEventListener("click", async () => {
      try {
        const ok = await copyText(text);
        flash(btn, ok ? "Copied" : "Copy failed");
      } catch {
        flash(btn, "Copy failed");
      }
    });
  }
}

init();


