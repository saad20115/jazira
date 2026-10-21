# Service Tile

- Figma node: `109:333` (file `tD3pU1vtvSr8akTMJPFLkA`)
- Page: Design System
- Source: Figma MCP `get_design_context` (React + Tailwind reference code, saved verbatim). Treat as a high-fidelity reference, not production code: convert absolute positioning into real layout.
- The temporary `assetPathPrefix` URLs below expire; use the local files in the asset table instead.

## Asset map (code constant -> local file)

| Constant | Figma asset file | Local file (relative to design/) |
|---|---|---|
| `imgIconContracting` | `e2586.svg` | `assets/context/components/service-tile/imgIconContracting.svg` |
| `imgIconArrowRight` | `34f59.svg` | `assets/context/components/service-tile/imgIconArrowRight.svg` |
| `imgIconArrowRight1` | `0a5b7.svg` | `assets/context/components/service-tile/imgIconArrowRight1.svg` |

## Reference code

```jsx
const assetPathPrefix = "https://www.figma.com/api/mcp/asset/6c163421-c26e-493f-afaf-820829595ecc";
const imgIconContracting = `${assetPathPrefix}/e2586.svg`;
const imgIconArrowRight = `${assetPathPrefix}/34f59.svg`;
const imgIconArrowRight1 = `${assetPathPrefix}/0a5b7.svg`;

function IconContracting({ className }: { className?: string }) {
  return (
    <div className={className || "relative size-[20px]"} data-node-id="15:272" data-name="Icon/contracting">
      <img alt="" className="absolute block inset-0 max-w-none size-full" src={imgIconContracting} />
    </div>
  );
}

type ServiceTileProps = {
  className?: string;
  description?: string;
  icon?: React.ReactNode | null;
  state?: "Default" | "Featured";
  title?: string;
};

export default function ServiceTile({ className, description = "Short description of the service.", icon = null, state = "Default", title = "General Contracting" }: ServiceTileProps) {
  const isDefault = state === "Default";
  const isFeatured = state === "Featured";
  return (
    <div className={className || `content-stretch drop-shadow-[0px_8px_12px_rgba(1,16,37,0.05)] flex flex-col gap-[14px] h-[250px] items-start px-[22px] py-[24px] relative rounded-[16px] w-[290px] ${isFeatured ? String.raw`bg-[var(--gold\/500,#dfa82a)]` : "bg-[var(--white,white)] border border-[var(--border,#e3e7ee)] border-solid"}`} id={isFeatured ? "node-109_321" : "node-109_309"}>
      <div className={`content-stretch flex items-start overflow-clip p-[12px] relative rounded-[12px] shrink-0 ${isFeatured ? "bg-[var(--white,white)]" : String.raw`bg-[var(--gold\/50,#fbf4e3)]`}`} id={isFeatured ? "node-109_322" : "node-109_310"} data-name="Icon tile">
        {icon || <IconContracting className="relative shrink-0 size-[20px]" />}
      </div>
      <p className="[word-break:break-word] font-['Poppins:SemiBold'] leading-[28px] min-w-full not-italic relative shrink-0 text-[20px] text-[color:var(--navy\/950,#011025)] w-[min-content]" data-node-id="109:314">
        {title}
      </p>
      {isDefault && (
        <>
          <p className="[word-break:break-word] font-['Poppins:Regular'] leading-[22px] min-w-full not-italic relative shrink-0 text-[14px] text-[color:var(--text\/body,#5b6475)] w-[min-content]" data-node-id="109:315">
            {description}
          </p>
          <div className="flex-[1_0_0] min-h-px relative w-full" data-node-id="109:316" data-name="Spacer" />
          <div className="content-stretch flex gap-[6px] items-center overflow-clip relative shrink-0" data-node-id="109:317" data-name="Learn more">
            <p className="[word-break:break-word] font-['Poppins:SemiBold'] leading-[22px] not-italic relative shrink-0 text-[14px] text-[color:var(--gold\/600,#c38f1c)] whitespace-nowrap" data-node-id="109:318">
              Learn more
            </p>
            <div className="relative shrink-0 size-[14px]" data-node-id="109:319" data-name="icon/arrow-right">
              <img alt="" className="absolute block inset-0 max-w-none size-full" src={imgIconArrowRight} />
            </div>
          </div>
        </>
      )}
      {isFeatured && (
        <>
          <p className="[word-break:break-word] font-['Poppins:Regular'] leading-[22px] min-w-full not-italic relative shrink-0 text-[14px] text-[color:var(--navy\/950,#011025)] w-[min-content]" data-node-id="109:327">
            {description}
          </p>
          <div className="flex-[1_0_0] min-h-px relative w-full" data-node-id="109:328" data-name="Spacer" />
          <div className="content-stretch flex gap-[6px] items-center overflow-clip relative shrink-0" data-node-id="109:329" data-name="Learn more">
            <p className="[word-break:break-word] font-['Poppins:SemiBold'] leading-[22px] not-italic relative shrink-0 text-[14px] text-[color:var(--navy\/950,#011025)] whitespace-nowrap" data-node-id="109:330">
              Learn more
            </p>
            <div className="relative shrink-0 size-[14px]" data-node-id="109:331" data-name="icon/arrow-right">
              <img alt="" className="absolute block inset-0 max-w-none size-full" src={imgIconArrowRight1} />
            </div>
          </div>
        </>
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
These styles are contained in the design: Heading/H4: Font(family: "Poppins", style: SemiBold, size: 20, weight: 600, lineHeight: 28, letterSpacing: 0), Body/S: Font(family: "Poppins", style: Regular, size: 14, weight: 400, lineHeight: 22, letterSpacing: 0), Label/Link: Font(family: "Poppins", style: SemiBold, size: 14, weight: 600, lineHeight: 22, letterSpacing: 0).
```

```text
Component descriptions: The following components have usage descriptions or documentation links defined in Figma. These descriptions provide important context about the intended usage, best practices, and any constraints for each component. Follow these guidelines when implementing or using these components.

## Service Tile
**Node ID:** 109:333

Service card from the previous design (white, featured = gold). Used in the scrolling services carousel on Home.
```

```text
The generated code contains image and SVG URL constants, e.g. const image = `${assetPathPrefix}/<asset file name>`, where assetPathPrefix is declared once at the top of the code and every asset URL interpolates it. These URLs are temporary download sources and expire after 7 days. Download each asset into the project with curl -L, then replace its URL in the generated code with a reference to the downloaded asset. Never use the temporary URLs as runtime image sources.
```
