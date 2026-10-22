# 00 Intro – start

- Figma node: `28:1609` (file `tD3pU1vtvSr8akTMJPFLkA`)
- Page: Website page (intro/overlays)
- Source: Figma MCP `get_design_context` (React + Tailwind reference code, saved verbatim). Treat as a high-fidelity reference, not production code: convert absolute positioning into real layout.
- The temporary `assetPathPrefix` URLs below expire; use the local files in the asset table instead.

## Asset map (code constant -> local file)

| Constant | Figma asset file | Local file (relative to design/) |
|---|---|---|
| `imgGlow` | `beb5a.svg` | `assets/context/overlays/00-intro-start/imgGlow.svg` |
| `imgSymbol` | `07d6e.svg` | `assets/context/overlays/00-intro-start/imgSymbol.svg` |
| `imgWordmark` | `5709e.svg` | `assets/context/overlays/00-intro-start/imgWordmark.svg` |
| `imgTaglineEn` | `ccd09.svg` | `assets/context/overlays/00-intro-start/imgTaglineEn.svg` |
| `imgTaglineAr` | `548f6.svg` | `assets/context/overlays/00-intro-start/imgTaglineAr.svg` |

## Reference code

```jsx
const assetPathPrefix = "https://www.figma.com/api/mcp/asset/7eb7cd61-d003-428e-a630-62c2ee208a0d";
const imgGlow = `${assetPathPrefix}/beb5a.svg`;
const imgSymbol = `${assetPathPrefix}/07d6e.svg`;
const imgWordmark = `${assetPathPrefix}/5709e.svg`;
const imgTaglineEn = `${assetPathPrefix}/ccd09.svg`;
const imgTaglineAr = `${assetPathPrefix}/548f6.svg`;

export default function Component00IntroStart() {
  return (
    <div className="relative size-full" data-node-id="28:1609" style={{ backgroundImage: "url(\"data:image/svg+xml;utf8,<svg viewBox='0 0 1440 900' xmlns='http://www.w3.org/2000/svg' preserveAspectRatio='none'><rect x='0' y='0' height='100%' width='100%' fill='url(%23grad)' opacity='1'/><defs><radialGradient id='grad' gradientUnits='userSpaceOnUse' cx='0' cy='0' r='10' gradientTransform='matrix(72 0 0 45 720 450)'><stop stop-color='rgba(11,26,51,1)' offset='0'/><stop stop-color='rgba(1,16,37,1)' offset='1'/></radialGradient></defs></svg>\")" }} data-name="00 Intro – start">
      <div className="absolute left-[570px] size-[300px] top-[280px]" data-node-id="28:1610" data-name="Glow">
        <img alt="" className="absolute block inset-0 max-w-none size-full" src={imgGlow} />
      </div>
      <div className="absolute h-[86.416px] left-[570.75px] opacity-0 top-[386.5px] w-[298.5px]" data-node-id="28:1611" data-name="Logo">
        <div className="absolute inset-[0_71.48%_4.29%_0]" data-node-id="I28:1611;100:357" data-name="Symbol">
          <img alt="" className="absolute block inset-0 max-w-none size-full" src={imgSymbol} />
        </div>
        <div className="absolute inset-[15.03%_0_33.53%_26.46%]" data-node-id="I28:1611;100:360" data-name="Wordmark">
          <img alt="" className="absolute block inset-0 max-w-none size-full" src={imgWordmark} />
        </div>
        <div className="absolute inset-[72.09%_5.43%_19.77%_27.54%]" data-node-id="I28:1611;100:363" data-name="Tagline EN">
          <img alt="" className="absolute block inset-0 max-w-none size-full" src={imgTaglineEn} />
        </div>
        <div className="absolute inset-[83.73%_5.59%_0_27.77%]" data-node-id="I28:1611;100:366" data-name="Tagline AR">
          <img alt="" className="absolute block inset-0 max-w-none size-full" src={imgTaglineAr} />
        </div>
      </div>
      <div className="absolute bg-[#dfa82a] h-[3px] left-[719.99px] rounded-[2px] top-[471.5px] w-[0.01px]" data-node-id="28:1613" data-name="Line" />
      <p className="[word-break:break-word] absolute font-['Poppins:SemiBold'] leading-[22px] left-[491.5px] not-italic opacity-0 text-[14px] text-white top-[507.5px] whitespace-nowrap" data-node-id="28:1614">
        MEP CONTRACTING · FIREFIGHTING · SMART SYSTEMS
      </p>
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
These styles are contained in the design: Label/Link: Font(family: "Poppins", style: SemiBold, size: 14, weight: 600, lineHeight: 22, letterSpacing: 0).
```

```text
Component descriptions: The following components have usage descriptions or documentation links defined in Figma. These descriptions provide important context about the intended usage, best practices, and any constraints for each component. Follow these guidelines when implementing or using these components.

## Logo
**Node ID:** 100:515

ALJAZIRA for IMDAD Smart Company — official logo (vector, from the identity PDF). Primary/Dark/Navy for light backgrounds; Reversed/White for dark backgrounds. Compact drops the EN/AR taglines for small sizes; Icon is the symbol only.
```

```text
The generated code contains image and SVG URL constants, e.g. const image = `${assetPathPrefix}/<asset file name>`, where assetPathPrefix is declared once at the top of the code and every asset URL interpolates it. These URLs are temporary download sources and expire after 7 days. Download each asset into the project with curl -L, then replace its URL in the generated code with a reference to the downloaded asset. Never use the temporary URLs as runtime image sources.
```
