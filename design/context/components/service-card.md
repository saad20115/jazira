# Service Card

- Figma node: `15:320` (file `tD3pU1vtvSr8akTMJPFLkA`)
- Page: Design System
- Source: Figma MCP `get_design_context` (React + Tailwind reference code, saved verbatim). Treat as a high-fidelity reference, not production code: convert absolute positioning into real layout.
- The temporary `assetPathPrefix` URLs below expire; use the local files in the asset table instead.

## Asset map (code constant -> local file)

| Constant | Figma asset file | Local file (relative to design/) |
|---|---|---|
| `imgImage` | `efac6.png` | `assets/images/svc-mep.png` (shared image) |
| `imgIcon` | `59968.svg` | `assets/context/components/service-card/imgIcon.svg` |
| `imgFrame` | `39b66.svg` | `assets/context/components/service-card/imgFrame.svg` |
| `imgFrame1` | `55cd1.svg` | `assets/context/components/service-card/imgFrame1.svg` |

## Reference code

```jsx
const assetPathPrefix = "https://www.figma.com/api/mcp/asset/09c60b3c-2233-416f-82e1-a6d478eb0abc";
const imgImage = `${assetPathPrefix}/efac6.png`;
const imgIcon = `${assetPathPrefix}/59968.svg`;
const imgFrame = `${assetPathPrefix}/39b66.svg`;
const imgFrame1 = `${assetPathPrefix}/55cd1.svg`;

type ServiceCardProps = {
  className?: string;
  description?: string;
  icon?: React.ReactNode | null;
  number?: string;
  state?: "Default" | "Hover";
  title?: string;
};

export default function ServiceCard({ className, description = "Short description", icon = null, number = "01", state = "Default", title = "Service title" }: ServiceCardProps) {
  const isDefault = state === "Default";
  const isHover = state === "Hover";
  return (
    <div className={className || `${String.raw`bg-[var(--navy\/900,#0b1a33)] h-[360px] overflow-clip relative rounded-[18px] w-[275px] `}${isHover ? "shadow-[0px_26px_52px_0px_rgba(1,16,37,0.3)]" : "shadow-[0px_10px_28px_0px_rgba(1,16,37,0.12)]"}`} id={isHover ? "node-15_302" : "node-15_284"}>
      <div className={`absolute ${isHover ? "h-[388.8px] left-[-11px] top-[-14.4px] w-[297px]" : "h-[360px] left-0 top-0 w-[275px]"}`} id={isHover ? "node-15_303" : "node-15_285"} data-name="Image">
        <img alt="" className="absolute inset-0 max-w-none object-cover pointer-events-none size-full" src={imgImage} />
      </div>
      <div className={`absolute bg-gradient-to-b from-[rgba(1,16,37,0.25)] h-[360px] left-0 to-[rgba(1,16,37,0.95)] top-0 via-1/2 w-[275px] ${isHover ? "via-[rgba(1,16,37,0.5)]" : "via-[rgba(1,16,37,0.25)]"}`} id={isHover ? "node-15_304" : "node-15_286"} data-name="Overlay" />
      <div className={`absolute border border-[rgba(255,255,255,0.2)] border-solid content-stretch flex items-center justify-center left-[18px] rounded-[10px] size-[36px] top-[18px] ${isHover ? String.raw`bg-[var(--gold\/500,#dfa82a)]` : "bg-[rgba(255,255,255,0.14)]"}`} id={isHover ? "node-15_305" : "node-15_287"} data-name="Number">
        {isDefault && (
          <p className="[word-break:break-word] font-['Poppins:SemiBold'] leading-[22px] not-italic relative shrink-0 text-[14px] text-[color:var(--white,white)] whitespace-nowrap" data-node-id="15:288">
            {number}
          </p>
        )}
        {isHover && (
          <p className="[word-break:break-word] font-['Poppins:SemiBold'] leading-[22px] not-italic relative shrink-0 text-[14px] text-[color:var(--navy\/950,#011025)] whitespace-nowrap" data-node-id="15:306">
            {number}
          </p>
        )}
      </div>
      <div className="absolute bg-[rgba(1,16,37,0.5)] border border-[rgba(223,168,42,0.5)] border-solid content-stretch flex items-center justify-center left-[221px] rounded-[10px] size-[36px] top-[18px]" id={isHover ? "node-15_307" : "node-15_289"} data-name="Icon box">
        {icon || (
          <div className="relative shrink-0 size-[20px]" data-node-id="15:290" data-name="Icon">
            <img alt="" className="absolute block inset-0 max-w-none size-full" src={imgIcon} />
          </div>
        )}
      </div>
      <div className={`absolute content-stretch flex flex-col gap-[14px] items-start left-[20px] w-[235px] ${isHover ? "top-[219px]" : "top-[253px]"}`} id={isHover ? "node-15_311" : "node-15_293"} data-name="Body">
        <p className="[word-break:break-word] font-['Poppins:SemiBold'] leading-[28px] not-italic relative shrink-0 text-[20px] text-[color:var(--white,white)] w-full" data-node-id="15:294">
          {title}
        </p>
        {isDefault && (
          <>
            <div className="bg-[rgba(255,255,255,0.15)] h-px relative shrink-0 w-full" data-node-id="15:296" data-name="Rectangle" />
            <div className="content-stretch flex items-center justify-between relative shrink-0 w-full" data-node-id="15:297" data-name="Link row">
              <p className="[word-break:break-word] font-['Poppins:SemiBold'] leading-[14px] not-italic relative shrink-0 text-[11px] text-[color:var(--gold\/500,#dfa82a)] tracking-[0.66px] whitespace-nowrap" data-node-id="15:298">
                VIEW ALL SERVICES
              </p>
              <div className="bg-[rgba(255,255,255,0.12)] content-stretch flex items-center justify-center relative rounded-[15px] shrink-0 size-[30px]" data-node-id="15:299" data-name="Frame">
                <div className="relative shrink-0 size-[14px]" data-node-id="15:300" data-name="Frame">
                  <img alt="" className="absolute block inset-0 max-w-none size-full" src={imgFrame} />
                </div>
              </div>
            </div>
          </>
        )}
        {isHover && (
          <>
            <p className="[word-break:break-word] font-['Poppins:Regular'] leading-[20px] not-italic opacity-75 relative shrink-0 text-[13px] text-white w-full" data-node-id="15:313">
              {description}
            </p>
            <div className="bg-[rgba(255,255,255,0.15)] h-px relative shrink-0 w-full" data-node-id="15:314" data-name="Rectangle" />
            <div className="content-stretch flex items-center justify-between relative shrink-0 w-full" data-node-id="15:315" data-name="Link row">
              <p className="[word-break:break-word] font-['Poppins:SemiBold'] leading-[14px] not-italic relative shrink-0 text-[11px] text-[color:var(--gold\/500,#dfa82a)] tracking-[0.66px] whitespace-nowrap" data-node-id="15:316">
                VIEW ALL SERVICES
              </p>
              <div className="bg-[var(--gold\/500,#dfa82a)] content-stretch flex items-center justify-center relative rounded-[15px] shrink-0 size-[30px]" data-node-id="15:317" data-name="Frame">
                <div className="relative shrink-0 size-[14px]" data-node-id="15:318" data-name="Frame">
                  <img alt="" className="absolute block inset-0 max-w-none size-full" src={imgFrame1} />
                </div>
              </div>
            </div>
          </>
        )}
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
These styles are contained in the design: Label/Link: Font(family: "Poppins", style: SemiBold, size: 14, weight: 600, lineHeight: 22, letterSpacing: 0), Heading/H4: Font(family: "Poppins", style: SemiBold, size: 20, weight: 600, lineHeight: 28, letterSpacing: 0), Label/Tag: Font(family: "Poppins", style: SemiBold, size: 11, weight: 600, lineHeight: 14, letterSpacing: 6), Caption: Font(family: "Poppins", style: Regular, size: 13, weight: 400, lineHeight: 20, letterSpacing: 0).
```

```text
The generated code contains image and SVG URL constants, e.g. const image = `${assetPathPrefix}/<asset file name>`, where assetPathPrefix is declared once at the top of the code and every asset URL interpolates it. These URLs are temporary download sources and expire after 7 days. Download each asset into the project with curl -L, then replace its URL in the generated code with a reference to the downloaded asset. Never use the temporary URLs as runtime image sources.
```
