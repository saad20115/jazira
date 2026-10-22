# Button

- Figma node: `12:36` (file `tD3pU1vtvSr8akTMJPFLkA`)
- Page: Design System
- Source: Figma MCP `get_design_context` (React + Tailwind reference code, saved verbatim). Treat as a high-fidelity reference, not production code: convert absolute positioning into real layout.
- The temporary `assetPathPrefix` URLs below expire; use the local files in the asset table instead.

## Asset map (code constant -> local file)

| Constant | Figma asset file | Local file (relative to design/) |
|---|---|---|
| `imgArrow` | `eb39c.svg` | `assets/context/components/button/imgArrow.svg` |
| `imgArrow1` | `7d578.svg` | `assets/context/components/button/imgArrow1.svg` |

## Reference code

```jsx
const assetPathPrefix = "https://www.figma.com/api/mcp/asset/066fa5ac-e54d-4d28-8efd-563c54294f81";
const imgArrow = `${assetPathPrefix}/eb39c.svg`;
const imgArrow1 = `${assetPathPrefix}/7d578.svg`;

type ButtonProps = {
  className?: string;
  label?: string;
  showArrow?: boolean;
  state?: "Default" | "Hover";
  variant?: "Gold" | "Dark" | "Glass" | "Outline";
};

export default function Button({ className, label = "Get a Quote", showArrow = true, state = "Default", variant = "Gold" }: ButtonProps) {
  const isDarkAndDefault = variant === "Dark" && state === "Default";
  const isDarkAndHover = variant === "Dark" && state === "Hover";
  const isDarkOrGlass = ["Dark", "Glass"].includes(variant);
  const isGlassAndDefault = variant === "Glass" && state === "Default";
  const isGlassAndHover = variant === "Glass" && state === "Hover";
  const isGold = variant === "Gold";
  const isGoldAndHover = variant === "Gold" && state === "Hover";
  const isOutlineAndDefault = variant === "Outline" && state === "Default";
  const isOutlineAndHover = variant === "Outline" && state === "Hover";
  return (
    <div className={className || `content-stretch flex items-center justify-center pl-[26px] py-[14px] relative rounded-[8px] ${isOutlineAndHover ? String.raw`bg-[var(--navy\/950,#011025)] border-[1.5px] border-[var(--navy\/950,#011025)] border-solid gap-[14px] pr-[20px]` : isOutlineAndDefault ? String.raw`border-[1.5px] border-[var(--navy\/950,#011025)] border-solid gap-[10px] pr-[24px]` : isGlassAndHover ? "bg-[rgba(255,255,255,0.18)] border border-[rgba(255,255,255,0.5)] border-solid gap-[14px] pr-[20px]" : isGlassAndDefault ? "bg-[rgba(255,255,255,0.08)] border border-[rgba(255,255,255,0.28)] border-solid gap-[10px] pr-[24px]" : isDarkAndHover ? String.raw`bg-[var(--navy\/800,#002854)] drop-shadow-[0px_10px_12px_rgba(1,16,37,0.25)] gap-[14px] pr-[20px]` : isDarkAndDefault ? String.raw`bg-[var(--navy\/950,#011025)] gap-[10px] pr-[24px]` : isGoldAndHover ? String.raw`bg-[var(--gold\/600,#c38f1c)] drop-shadow-[0px_12px_14px_rgba(223,168,42,0.5)] gap-[14px] pr-[20px]` : String.raw`bg-[var(--gold\/500,#dfa82a)] drop-shadow-[0px_8px_10px_rgba(223,168,42,0.35)] gap-[10px] pr-[24px]`}`} id={isOutlineAndHover ? "node-12_32" : isOutlineAndDefault ? "node-12_28" : isGlassAndHover ? "node-12_24" : isGlassAndDefault ? "node-12_20" : isDarkAndHover ? "node-12_16" : isDarkAndDefault ? "node-12_12" : isGoldAndHover ? "node-12_8" : "node-12_4"}>
      {(isDarkOrGlass || isOutlineAndHover) && (
        <p className="[word-break:break-word] font-['Poppins:SemiBold'] leading-[22px] not-italic relative shrink-0 text-[15px] text-[color:var(--white,white)] whitespace-nowrap" data-node-id="12:13">
          {label}
        </p>
      )}
      {(isDarkOrGlass || isOutlineAndHover) && showArrow && (
        <div className="relative shrink-0 size-[18px]" data-node-id="12:14" data-name="Arrow">
          <img alt="" className="absolute block inset-0 max-w-none size-full" src={imgArrow1} />
        </div>
      )}
      {(isGold || isOutlineAndDefault) && (
        <p className="[word-break:break-word] font-['Poppins:SemiBold'] leading-[22px] not-italic relative shrink-0 text-[15px] text-[color:var(--navy\/950,#011025)] whitespace-nowrap" data-node-id="12:5">
          {label}
        </p>
      )}
      {(isGold || isOutlineAndDefault) && showArrow && (
        <div className="relative shrink-0 size-[18px]" data-node-id="12:6" data-name="Arrow">
          <img alt="" className="absolute block inset-0 max-w-none size-full" src={imgArrow} />
        </div>
      )}
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
These styles are contained in the design: Label/Button: Font(family: "Poppins", style: SemiBold, size: 15, weight: 600, lineHeight: 22, letterSpacing: 0).
```

```text
The generated code contains image and SVG URL constants, e.g. const image = `${assetPathPrefix}/<asset file name>`, where assetPathPrefix is declared once at the top of the code and every asset URL interpolates it. These URLs are temporary download sources and expire after 7 days. Download each asset into the project with curl -L, then replace its URL in the generated code with a reference to the downloaded asset. Never use the temporary URLs as runtime image sources.
```
