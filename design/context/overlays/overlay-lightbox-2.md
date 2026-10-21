# Overlay – Lightbox 2

- Figma node: `28:1688` (file `tD3pU1vtvSr8akTMJPFLkA`)
- Page: Website page (intro/overlays)
- Source: Figma MCP `get_design_context` (React + Tailwind reference code, saved verbatim). Treat as a high-fidelity reference, not production code: convert absolute positioning into real layout.
- The temporary `assetPathPrefix` URLs below expire; use the local files in the asset table instead.

## Asset map (code constant -> local file)

| Constant | Figma asset file | Local file (relative to design/) |
|---|---|---|
| `imgImage` | `fac6f.png` | `assets/images/svc-fire.png` (shared image) |
| `imgClose` | `0faff.svg` | `assets/context/overlays/overlay-lightbox-2/imgClose.svg` |
| `imgPrev` | `7f201.svg` | `assets/context/overlays/overlay-lightbox-2/imgPrev.svg` |
| `imgNext` | `092ac.svg` | `assets/context/overlays/overlay-lightbox-2/imgNext.svg` |

## Reference code

```jsx
const assetPathPrefix = "https://www.figma.com/api/mcp/asset/a1e8a2db-00f0-410f-9154-e8d425e32d10";
const imgImage = `${assetPathPrefix}/fac6f.png`;
const imgClose = `${assetPathPrefix}/0faff.svg`;
const imgPrev = `${assetPathPrefix}/7f201.svg`;
const imgNext = `${assetPathPrefix}/092ac.svg`;

export default function OverlayLightbox2() {
  return (
    <div className="bg-[rgba(1,16,37,0.9)] relative size-full" data-node-id="28:1688" data-name="Overlay – Lightbox 2">
      <div className="-translate-x-1/2 -translate-y-1/2 absolute h-[720px] left-1/2 top-1/2 w-[1100px]" data-node-id="28:1650" data-name="Viewer">
        <div className="absolute h-[640px] left-0 rounded-[18px] top-0 w-[1100px]" data-node-id="28:1651" data-name="Image">
          <img alt="" className="absolute inset-0 max-w-none object-cover pointer-events-none rounded-[18px] size-full" src={imgImage} />
        </div>
        <p className="[word-break:break-word] absolute font-['Poppins:Medium'] leading-[22px] left-0 not-italic opacity-85 text-[15px] text-white top-[660px] whitespace-pre" data-node-id="28:1652">{`2 / 3  ·  Fire pump room installation`}</p>
        <button className="absolute block cursor-pointer left-[1040px] size-[44px] top-[16px]" data-node-id="28:1653" data-name="Close">
          <img alt="" className="absolute block inset-0 max-w-none size-full" src={imgClose} />
        </button>
        <button className="absolute block cursor-pointer left-[-26px] size-[52px] top-[294px]" data-node-id="28:1656" data-name="Prev">
          <img alt="" className="absolute block inset-0 max-w-none size-full" src={imgPrev} />
        </button>
        <button className="absolute block cursor-pointer left-[1074px] size-[52px] top-[294px]" data-node-id="28:1659" data-name="Next">
          <img alt="" className="absolute block inset-0 max-w-none size-full" src={imgNext} />
        </button>
      </div>
    </div>
  );
}
```

## Notes returned by Figma with this node (verbatim)

```text
SUPER CRITICAL: The generated React+Tailwind code MUST be converted to match the target project's technology stack and styling system.
1. Analyze the target codebase to identify: technology stack, styling approach, component patterns, and design tokens
2. Convert React syntax to the target framework/library
3. Transform all Tailwind classes to the target styling system while preserving exact visual design
4. Follow the project's existing patterns and conventions
DO NOT install any Tailwind as a dependency unless the user instructs you to do so.
```

```text
Node ids have been added to the code as data attributes, e.g. `data-node-id="1:2"`.
```

```text
These styles are contained in the design: Label/Nav: Font(family: "Poppins", style: Medium, size: 15, weight: 500, lineHeight: 22, letterSpacing: 0).
```

```text
The generated code contains image and SVG URL constants, e.g. const image = `${assetPathPrefix}/<asset file name>`, where assetPathPrefix is declared once at the top of the code and every asset URL interpolates it. These URLs are temporary download sources and expire after 7 days. Download each asset into the project with curl -L, then replace its URL in the generated code with a reference to the downloaded asset. Never use the temporary URLs as runtime image sources.
```
