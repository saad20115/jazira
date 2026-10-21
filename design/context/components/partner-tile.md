# Partner Tile

- Figma node: `15:332` (file `tD3pU1vtvSr8akTMJPFLkA`)
- Page: Design System
- Source: Figma MCP `get_design_context` (React + Tailwind reference code, saved verbatim). Treat as a high-fidelity reference, not production code: convert absolute positioning into real layout.
- The temporary `assetPathPrefix` URLs below expire; use the local files in the asset table instead.

## Reference code

```jsx
type PartnerTileProps = {
  className?: string;
  category?: string;
  name?: string;
  state?: "Default" | "Hover";
  wordmark?: string;
};

export default function PartnerTile({ className, category = "Category", name = "Brand name", state = "Default", wordmark = "BRAND" }: PartnerTileProps) {
  const isHover = state === "Hover";
  return (
    <div className={className || `bg-[var(--white,white)] border-solid content-stretch flex flex-col gap-[6px] h-[158px] items-center justify-center relative rounded-[16px] w-[275px] ${isHover ? String.raw`border-[1.5px] border-[var(--gold\/500,#dfa82a)] drop-shadow-[0px_18px_18px_rgba(1,16,37,0.12)] pb-[8px]` : "border border-[var(--border,#e3e7ee)] drop-shadow-[0px_4px_6px_rgba(1,16,37,0.03)] pt-[8px]"}`} id={isHover ? "node-15_327" : "node-15_322"}>
      <div className="content-stretch flex h-[60px] items-center justify-center relative shrink-0 w-[150px]" id={isHover ? "node-15_328" : "node-15_323"} data-name="Logo slot">
        <p className="[word-break:break-word] font-['Poppins:Bold'] leading-[36px] not-italic relative shrink-0 text-[28px] text-[color:var(--navy\/800,#002854)] tracking-[-0.112px] whitespace-nowrap" data-node-id="15:324">
          {wordmark}
        </p>
      </div>
      <p className="[word-break:break-word] font-['Poppins:SemiBold'] leading-[24px] not-italic relative shrink-0 text-[17px] text-[color:var(--navy\/950,#011025)] whitespace-nowrap" data-node-id="15:325">
        {name}
      </p>
      {state === "Default" && (
        <p className="[word-break:break-word] font-['Poppins:Regular'] leading-[18px] not-italic relative shrink-0 text-[12px] text-[color:var(--text\/muted,#8a93a3)] whitespace-nowrap" data-node-id="15:326">
          {category}
        </p>
      )}
      {isHover && (
        <p className="[word-break:break-word] font-['Poppins:Regular'] leading-[18px] not-italic relative shrink-0 text-[12px] text-[color:var(--gold\/600,#c38f1c)] whitespace-nowrap" data-node-id="15:331">
          {category}
        </p>
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
These styles are contained in the design: Heading/H3: Font(family: "Poppins", style: Bold, size: 28, weight: 700, lineHeight: 36, letterSpacing: -0.4000000059604645), Heading/H5: Font(family: "Poppins", style: SemiBold, size: 17, weight: 600, lineHeight: 24, letterSpacing: 0), Caption/S: Font(family: "Poppins", style: Regular, size: 12, weight: 400, lineHeight: 18, letterSpacing: 0).
```

```text
The generated code contains image and SVG URL constants, e.g. const image = `${assetPathPrefix}/<asset file name>`, where assetPathPrefix is declared once at the top of the code and every asset URL interpolates it. These URLs are temporary download sources and expire after 7 days. Download each asset into the project with curl -L, then replace its URL in the generated code with a reference to the downloaded asset. Never use the temporary URLs as runtime image sources.
```
