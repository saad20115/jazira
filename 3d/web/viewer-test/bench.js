// R3a measurement routine, pasted into the page console (or run via the browser tool) after load:
//   await runR3a(1080)
// Returns load time, synchronous render cost at the hero view and inside each system, renderer info.
window.runR3a = async (px = 1080) => {
  const wait = (ms) => new Promise((r) => setTimeout(r, ms));
  for (let i = 0; i < 120 && !(window.__stats && window.__stats.loadMs); i++) await wait(250);
  await wait(1500);
  const out = { model: __stats.model, loadMs: __stats.loadMs, px, hero: syncBench(120, px), systems: {} };
  for (const s of ['hvac', 'fire', 'plumbing', 'power', 'smart']) {
    enterSystem(s); await wait(600); skipTween();
    out.systems[s] = syncBench(90, px);
    enterSystem(s); await wait(600); skipTween();
  }
  return out;
};
