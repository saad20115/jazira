# Accordion Item

- Figma node: `105:310` (file `tD3pU1vtvSr8akTMJPFLkA`)
- Page: Design System
- Source: Figma MCP `get_design_context` (React + Tailwind reference code, saved verbatim). Treat as a high-fidelity reference, not production code: convert absolute positioning into real layout.
- The temporary `assetPathPrefix` URLs below expire; use the local files in the asset table instead.

## Asset map (code constant -> local file)

| Constant | Figma asset file | Local file (relative to design/) |
|---|---|---|
| `imgIconChevronDown` | `58caa.svg` | `assets/context/components/accordion-item/imgIconChevronDown.svg` |
| `imgIconChevronUp` | `99900.svg` | `assets/context/components/accordion-item/imgIconChevronUp.svg` |

## Reference code

```jsx
const assetPathPrefix = "https://www.figma.com/api/mcp/asset/efc61cb6-d0f4-41be-a873-59dcc88adfb7";
const imgIconChevronDown = `${assetPathPrefix}/58caa.svg`;
const imgIconChevronUp = `${assetPathPrefix}/99900.svg`;

type AccordionItemProps = {
  className?: string;
  body?: string;
  number?: string;
  state?: "Collapsed" | "Expanded";
  title?: string;
};

export default function AccordionItem({ className, body = "Describe this part of the project here.", number = "01", state = "Collapsed", title = "Project overview" }: AccordionItemProps) {
  const isExpanded = state === "Expanded";
  return (
    <div className={className || `bg-[var(--white,white)] border border-solid content-stretch flex flex-col gap-[14px] items-start px-[22px] py-[20px] relative rounded-[16px] w-[692px] ${isExpanded ? String.raw`border-[var(--gold\/300,#efcb76)]` : "border-[var(--border,#e3e7ee)]"}`} id={isExpanded ? "node-105_301" : "node-105_292"}>
      <div className="content-stretch flex gap-[16px] items-center overflow-clip relative shrink-0 w-full" id={isExpanded ? "node-105_302" : "node-105_293"} data-name="Header">
        <div className={`content-stretch flex items-start overflow-clip px-[10px] py-[8px] relative rounded-[8px] shrink-0 ${isExpanded ? String.raw`bg-[var(--gold\/50,#fbf4e3)]` : "bg-[var(--surface,#f6f8fb)]"}`} id={isExpanded ? "node-105_303" : "node-105_294"} data-name="Number">
          <p className="[word-break:break-word] font-['Poppins:SemiBold'] leading-[22px] not-italic relative shrink-0 text-[14px] text-[color:var(--navy\/950,#011025)] whitespace-nowrap" data-node-id="105:295">
            {number}
          </p>
        </div>
        <p className="[word-break:break-word] flex-[1_0_0] font-['Poppins:SemiBold'] leading-[28px] min-w-px not-italic relative text-[20px] text-[color:var(--navy\/950,#011025)]" data-node-id="105:296">
          {title}
        </p>
        <p className="[word-break:break-word] font-['Poppins:Regular'] leading-[22px] not-italic relative shrink-0 text-[14px] text-[color:var(--gold\/600,#c38f1c)] whitespace-nowrap" id={isExpanded ? "node-105_306" : "node-105_297"}>
          {isExpanded ? "Hide details" : "Show details"}
        </p>
        {state === "Collapsed" && (
          <div className="relative shrink-0 size-[18px]" data-node-id="105:298" data-name="icon/chevron-down">
            <img alt="" className="absolute block inset-0 max-w-none size-full" src={imgIconChevronDown} />
          </div>
        )}
        {isExpanded && (
          <div className="relative shrink-0 size-[18px]" data-node-id="105:307" data-name="icon/chevron-up">
            <img alt="" className="absolute block inset-0 max-w-none size-full" src={imgIconChevronUp} />
          </div>
        )}
      </div>
      {isExpanded && (
        <p className="[word-break:break-word] font-['Poppins:Regular'] leading-[26px] not-italic relative shrink-0 text-[16px] text-[color:var(--text\/body,#5b6475)] w-full" data-node-id="105:309">
          {body}
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
These styles are contained in the design: Label/Link: Font(family: "Poppins", style: SemiBold, size: 14, weight: 600, lineHeight: 22, letterSpacing: 0), Heading/H4: Font(family: "Poppins", style: SemiBold, size: 20, weight: 600, lineHeight: 28, letterSpacing: 0), Body/S: Font(family: "Poppins", style: Regular, size: 14, weight: 400, lineHeight: 22, letterSpacing: 0), Body/M: Font(family: "Poppins", style: Regular, size: 16, weight: 400, lineHeight: 26, letterSpacing: 0).
```

```text
Component descriptions: The following components have usage descriptions or documentation links defined in Figma. These descriptions provide important context about the intended usage, best practices, and any constraints for each component. Follow these guidelines when implementing or using these components.

## Accordion Item
**Node ID:** 105:310

Expandable detail row (project detail page). Toggle State to open/close; Body is hidden when collapsed.
```

```text
The generated code contains image and SVG URL constants, e.g. const image = `${assetPathPrefix}/<asset file name>`, where assetPathPrefix is declared once at the top of the code and every asset URL interpolates it. These URLs are temporary download sources and expire after 7 days. Download each asset into the project with curl -L, then replace its URL in the generated code with a reference to the downloaded asset. Never use the temporary URLs as runtime image sources.
```
