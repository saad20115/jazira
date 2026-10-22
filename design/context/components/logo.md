# Logo

- Figma node: `100:515` (file `tD3pU1vtvSr8akTMJPFLkA`)
- Page: Design System
- Source: Figma MCP `get_design_context` (React + Tailwind reference code, saved verbatim). Treat as a high-fidelity reference, not production code: convert absolute positioning into real layout.
- The temporary `assetPathPrefix` URLs below expire; use the local files in the asset table instead.

## Asset map (code constant -> local file)

| Constant | Figma asset file | Local file (relative to design/) |
|---|---|---|
| `imgSymbol` | `9a550.svg` | `assets/context/components/logo/imgSymbol.svg` |
| `imgWordmark` | `e4fa1.svg` | `assets/context/components/logo/imgWordmark.svg` |
| `imgTaglineEn` | `e1fc9.svg` | `assets/context/components/logo/imgTaglineEn.svg` |
| `imgTaglineAr` | `98d28.svg` | `assets/context/components/logo/imgTaglineAr.svg` |
| `imgSymbol1` | `3271c.svg` | `assets/context/components/logo/imgSymbol1.svg` |
| `imgWordmark1` | `121ab.svg` | `assets/context/components/logo/imgWordmark1.svg` |
| `imgTaglineEn1` | `dd42a.svg` | `assets/context/components/logo/imgTaglineEn1.svg` |
| `imgTaglineAr1` | `aef0c.svg` | `assets/context/components/logo/imgTaglineAr1.svg` |
| `imgSymbol2` | `895ad.svg` | `assets/context/components/logo/imgSymbol2.svg` |
| `imgWordmark2` | `2c839.svg` | `assets/context/components/logo/imgWordmark2.svg` |
| `imgTaglineEn2` | `6a003.svg` | `assets/context/components/logo/imgTaglineEn2.svg` |
| `imgTaglineAr2` | `19e72.svg` | `assets/context/components/logo/imgTaglineAr2.svg` |
| `imgSymbol3` | `009b2.svg` | `assets/context/components/logo/imgSymbol3.svg` |
| `imgWordmark3` | `d19ca.svg` | `assets/context/components/logo/imgWordmark3.svg` |
| `imgTaglineEn3` | `f2219.svg` | `assets/context/components/logo/imgTaglineEn3.svg` |
| `imgTaglineAr3` | `e4712.svg` | `assets/context/components/logo/imgTaglineAr3.svg` |
| `imgSymbol4` | `524d3.svg` | `assets/context/components/logo/imgSymbol4.svg` |
| `imgWordmark4` | `bbedc.svg` | `assets/context/components/logo/imgWordmark4.svg` |
| `imgTaglineEn4` | `2baf1.svg` | `assets/context/components/logo/imgTaglineEn4.svg` |
| `imgTaglineAr4` | `8f6ca.svg` | `assets/context/components/logo/imgTaglineAr4.svg` |

## Reference code

```jsx
const assetPathPrefix = "https://www.figma.com/api/mcp/asset/a58c0a2b-9b6d-458e-aeb1-c68ae5103098";
const imgSymbol = `${assetPathPrefix}/9a550.svg`;
const imgWordmark = `${assetPathPrefix}/e4fa1.svg`;
const imgTaglineEn = `${assetPathPrefix}/e1fc9.svg`;
const imgTaglineAr = `${assetPathPrefix}/98d28.svg`;
const imgSymbol1 = `${assetPathPrefix}/3271c.svg`;
const imgWordmark1 = `${assetPathPrefix}/121ab.svg`;
const imgTaglineEn1 = `${assetPathPrefix}/dd42a.svg`;
const imgTaglineAr1 = `${assetPathPrefix}/aef0c.svg`;
const imgSymbol2 = `${assetPathPrefix}/895ad.svg`;
const imgWordmark2 = `${assetPathPrefix}/2c839.svg`;
const imgTaglineEn2 = `${assetPathPrefix}/6a003.svg`;
const imgTaglineAr2 = `${assetPathPrefix}/19e72.svg`;
const imgSymbol3 = `${assetPathPrefix}/009b2.svg`;
const imgWordmark3 = `${assetPathPrefix}/d19ca.svg`;
const imgTaglineEn3 = `${assetPathPrefix}/f2219.svg`;
const imgTaglineAr3 = `${assetPathPrefix}/e4712.svg`;
const imgSymbol4 = `${assetPathPrefix}/524d3.svg`;
const imgWordmark4 = `${assetPathPrefix}/bbedc.svg`;
const imgTaglineEn4 = `${assetPathPrefix}/2baf1.svg`;
const imgTaglineAr4 = `${assetPathPrefix}/8f6ca.svg`;

type LogoProps = {
  className?: string;
  color?: "Primary" | "Reversed" | "Dark" | "Navy" | "White";
  type?: "Full" | "Compact" | "Icon";
};

export default function Logo({ className, color = "Primary", type = "Full" }: LogoProps) {
  const isCompactAndDark = type === "Compact" && color === "Dark";
  const isCompactAndIsDarkOrNavyOrWhite = type === "Compact" && ["Dark", "Navy", "White"].includes(color);
  const isCompactAndIsPrimaryOrReversed = type === "Compact" && ["Primary", "Reversed"].includes(color);
  const isCompactAndNavy = type === "Compact" && color === "Navy";
  const isCompactAndPrimary = type === "Compact" && color === "Primary";
  const isCompactAndReversed = type === "Compact" && color === "Reversed";
  const isCompactAndWhite = type === "Compact" && color === "White";
  const isDarkAndIsFullOrCompact = color === "Dark" && ["Full", "Compact"].includes(type);
  const isFull = type === "Full";
  const isFullAndDark = type === "Full" && color === "Dark";
  const isFullAndIsDarkOrNavyOrWhite = type === "Full" && ["Dark", "Navy", "White"].includes(color);
  const isFullAndNavy = type === "Full" && color === "Navy";
  const isFullAndReversed = type === "Full" && color === "Reversed";
  const isFullAndWhite = type === "Full" && color === "White";
  const isFullOrCompact = ["Full", "Compact"].includes(type);
  const isIconAndDark = type === "Icon" && color === "Dark";
  const isIconAndNavy = type === "Icon" && color === "Navy";
  const isIconAndReversed = type === "Icon" && color === "Reversed";
  const isIconAndWhite = type === "Icon" && color === "White";
  const isNavyAndIsFullOrCompact = color === "Navy" && ["Full", "Compact"].includes(type);
  const isReversedAndIsFullOrCompact = color === "Reversed" && ["Full", "Compact"].includes(type);
  const isWhiteAndIsFullOrCompact = color === "White" && ["Full", "Compact"].includes(type);
  return (
    <div className={className || `relative ${type === "Icon" && ["Dark", "Navy", "White"].includes(color) ? "h-[54.486px] w-[56.113px]" : isCompactAndIsDarkOrNavyOrWhite ? "h-[54.486px] w-[198.349px]" : isFullAndIsDarkOrNavyOrWhite ? "h-[57.35px] w-[198.349px]" : type === "Icon" && ["Primary", "Reversed"].includes(color) ? "h-[55.137px] w-[56.764px]" : isCompactAndIsPrimaryOrReversed ? "h-[55.137px] w-[199px]" : "h-[57.61px] w-[199px]"}`} id={isIconAndWhite ? "node-100_505" : isCompactAndWhite ? "node-100_495" : isIconAndNavy ? "node-100_485" : isCompactAndNavy ? "node-100_475" : isIconAndDark ? "node-100_465" : isCompactAndDark ? "node-100_455" : isFullAndWhite ? "node-100_445" : isFullAndNavy ? "node-100_435" : isFullAndDark ? "node-100_425" : isIconAndReversed ? "node-100_411" : type === "Icon" && color === "Primary" ? "node-100_397" : isCompactAndReversed ? "node-100_383" : isCompactAndPrimary ? "node-100_369" : isFullAndReversed ? "node-100_355" : "node-12_2"}>
      {isFullOrCompact && (
        <>
          <div className={`absolute ${isCompactAndIsDarkOrNavyOrWhite ? "inset-[0_71.71%_0_0]" : isFullAndIsDarkOrNavyOrWhite ? "inset-[0_71.71%_4.99%_0]" : isCompactAndIsPrimaryOrReversed ? "inset-[0_71.48%_0_0]" : "inset-[0_71.48%_4.29%_0]"}`} id={isCompactAndWhite ? "node-100_497" : isCompactAndNavy ? "node-100_477" : isCompactAndDark ? "node-100_457" : isFullAndWhite ? "node-100_447" : isFullAndNavy ? "node-100_437" : isFullAndDark ? "node-100_427" : isCompactAndReversed ? "node-100_385" : isCompactAndPrimary ? "node-100_371" : isFullAndReversed ? "node-100_357" : "node-96_200"} data-name="Symbol">
            <img alt="" className="absolute block inset-0 max-w-none size-full" src={isWhiteAndIsFullOrCompact ? imgSymbol4 : isNavyAndIsFullOrCompact ? imgSymbol3 : isDarkAndIsFullOrCompact ? imgSymbol2 : isReversedAndIsFullOrCompact ? imgSymbol1 : imgSymbol} />
          </div>
          <div className={`absolute ${isCompactAndIsDarkOrNavyOrWhite ? "inset-[15.89%_0_30.91%_26.55%]" : isFullAndIsDarkOrNavyOrWhite ? "inset-[15.1%_0_34.36%_26.55%]" : isCompactAndIsPrimaryOrReversed ? "inset-[15.7%_0_30.55%_26.46%]" : "inset-[15.03%_0_33.53%_26.46%]"}`} id={isCompactAndWhite ? "node-100_499" : isCompactAndNavy ? "node-100_479" : isCompactAndDark ? "node-100_459" : isFullAndWhite ? "node-100_449" : isFullAndNavy ? "node-100_439" : isFullAndDark ? "node-100_429" : isCompactAndReversed ? "node-100_388" : isCompactAndPrimary ? "node-100_374" : isFullAndReversed ? "node-100_360" : "node-96_203"} data-name="Wordmark">
            <img alt="" className="absolute block inset-0 max-w-none size-full" src={isWhiteAndIsFullOrCompact ? imgWordmark4 : isNavyAndIsFullOrCompact ? imgWordmark3 : isDarkAndIsFullOrCompact ? imgWordmark2 : isReversedAndIsFullOrCompact ? imgWordmark1 : imgWordmark} />
          </div>
        </>
      )}
      {isFull && (
        <>
          <div className={`absolute ${isFullAndIsDarkOrNavyOrWhite ? "inset-[72.42%_5.12%_19.41%_27.63%]" : "inset-[72.09%_5.43%_19.77%_27.54%]"}`} id={isFullAndWhite ? "node-100_451" : isFullAndNavy ? "node-100_441" : isFullAndDark ? "node-100_431" : isFullAndReversed ? "node-100_363" : "node-96_206"} data-name="Tagline EN">
            <img alt="" className="absolute block inset-0 max-w-none size-full" src={isFullAndWhite ? imgTaglineEn4 : isFullAndNavy ? imgTaglineEn3 : isFullAndDark ? imgTaglineEn2 : isFullAndReversed ? imgTaglineEn1 : imgTaglineEn} />
          </div>
          <div className={`absolute ${isFullAndIsDarkOrNavyOrWhite ? "inset-[84.11%_5.35%_0_27.86%]" : "inset-[83.73%_5.59%_0_27.77%]"}`} id={isFullAndWhite ? "node-100_453" : isFullAndNavy ? "node-100_443" : isFullAndDark ? "node-100_433" : isFullAndReversed ? "node-100_366" : "node-96_209"} data-name="Tagline AR">
            <img alt="" className="absolute block inset-0 max-w-none size-full" src={isFullAndWhite ? imgTaglineAr4 : isFullAndNavy ? imgTaglineAr3 : isFullAndDark ? imgTaglineAr2 : isFullAndReversed ? imgTaglineAr1 : imgTaglineAr} />
          </div>
        </>
      )}
      {type === "Icon" && <img alt="" className="absolute block inset-0 max-w-none size-full" src={isIconAndWhite ? imgSymbol4 : isIconAndNavy ? imgSymbol3 : isIconAndDark ? imgSymbol2 : isIconAndReversed ? imgSymbol1 : imgSymbol} />}
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
Component descriptions: The following components have usage descriptions or documentation links defined in Figma. These descriptions provide important context about the intended usage, best practices, and any constraints for each component. Follow these guidelines when implementing or using these components.

## Logo
**Node ID:** 100:515

ALJAZIRA for IMDAD Smart Company — official logo (vector, from the identity PDF). Primary/Dark/Navy for light backgrounds; Reversed/White for dark backgrounds. Compact drops the EN/AR taglines for small sizes; Icon is the symbol only.
```

```text
The generated code contains image and SVG URL constants, e.g. const image = `${assetPathPrefix}/<asset file name>`, where assetPathPrefix is declared once at the top of the code and every asset URL interpolates it. These URLs are temporary download sources and expire after 7 days. Download each asset into the project with curl -L, then replace its URL in the generated code with a reference to the downloaded asset. Never use the temporary URLs as runtime image sources.
```
