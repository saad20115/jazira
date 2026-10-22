# Brand Tile

- Figma node: `156:890` (file `tD3pU1vtvSr8akTMJPFLkA`)
- Page: Design System
- Source: Figma MCP `get_design_context` (React + Tailwind reference code, saved verbatim). Treat as a high-fidelity reference, not production code: convert absolute positioning into real layout.
- The temporary `assetPathPrefix` URLs below expire; use the local files in the asset table instead.

## Reference code

```jsx
type BrandTileProps = {
  className?: string;
  brand?: string;
  origin?: string;
};

export default function BrandTile({ className, brand = "Brand", origin = "Country" }: BrandTileProps) {
  return (
    <div className={className || "[word-break:break-word] bg-[var(--white,white)] border border-[var(--border,#e3e7ee)] border-solid content-stretch drop-shadow-[0px_6px_8px_rgba(1,16,37,0.04)] flex flex-col gap-[2px] h-[76px] items-center justify-center not-italic relative rounded-[14px] text-center w-[200px] whitespace-nowrap"} data-node-id="156:890" data-name="Brand Tile">
      <p className="font-['Poppins:SemiBold'] leading-[24px] relative shrink-0 text-[17px] text-[color:var(--navy\/950,#011025)]" data-node-id="156:891">
        {brand}
      </p>
      <p className="font-['Poppins:Regular'] leading-[18px] relative shrink-0 text-[12px] text-[color:var(--text\/muted,#8a93a3)]" data-node-id="156:892">
        {origin}
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
These styles are contained in the design: Heading/H5: Font(family: "Poppins", style: SemiBold, size: 17, weight: 600, lineHeight: 24, letterSpacing: 0), Caption/S: Font(family: "Poppins", style: Regular, size: 12, weight: 400, lineHeight: 18, letterSpacing: 0).
```

```text
Component descriptions: The following components have usage descriptions or documentation links defined in Figma. These descriptions provide important context about the intended usage, best practices, and any constraints for each component. Follow these guidelines when implementing or using these components.

## Brand Tile
**Node ID:** 156:890

Brand wordmark tile. Replace with the official logo file from the dashboard (Brands) when available; keep the same 200×76 slot.
```

```text
The generated code contains image and SVG URL constants, e.g. const image = `${assetPathPrefix}/<asset file name>`, where assetPathPrefix is declared once at the top of the code and every asset URL interpolates it. These URLs are temporary download sources and expire after 7 days. Download each asset into the project with curl -L, then replace its URL in the generated code with a reference to the downloaded asset. Never use the temporary URLs as runtime image sources.
```
