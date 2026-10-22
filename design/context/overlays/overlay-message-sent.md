# Overlay – Message sent

- Figma node: `28:1686` (file `tD3pU1vtvSr8akTMJPFLkA`)
- Page: Website page (intro/overlays)
- Source: Figma MCP `get_design_context` (React + Tailwind reference code, saved verbatim). Treat as a high-fidelity reference, not production code: convert absolute positioning into real layout.
- The temporary `assetPathPrefix` URLs below expire; use the local files in the asset table instead.

## Asset map (code constant -> local file)

| Constant | Figma asset file | Local file (relative to design/) |
|---|---|---|
| `imgArrow` | `7d578.svg` | `assets/context/overlays/overlay-message-sent/imgArrow.svg` |
| `imgFrame` | `01a09.svg` | `assets/context/overlays/overlay-message-sent/imgFrame.svg` |

## Reference code

```jsx
const assetPathPrefix = "https://www.figma.com/api/mcp/asset/c8dbf719-4464-4b01-bc5e-d0daa29c2f8d";
const imgArrow = `${assetPathPrefix}/7d578.svg`;
const imgFrame = `${assetPathPrefix}/01a09.svg`;

type ButtonProps = {
  className?: string;
  label?: string;
  showArrow?: boolean;
  state?: "Default";
  variant?: "Dark";
};

function Button({ className, label = "Get a Quote", showArrow = true, state = "Default", variant = "Dark" }: ButtonProps) {
  return (
    <div className={className || "bg-[var(--navy\\/950,#011025)] content-stretch flex gap-[10px] items-center justify-center pl-[26px] pr-[24px] py-[14px] relative rounded-[8px]"} data-node-id="12:12">
      <p className="[word-break:break-word] font-['Poppins:SemiBold'] leading-[22px] not-italic relative shrink-0 text-[15px] text-[color:var(--white,white)] whitespace-nowrap" data-node-id="12:13">
        {label}
      </p>
      {showArrow && (
        <div className="relative shrink-0 size-[18px]" data-node-id="12:14" data-name="Arrow">
          <img alt="" className="absolute block inset-0 max-w-none size-full" src={imgArrow} />
        </div>
      )}
    </div>
  );
}

export default function OverlayMessageSent() {
  return (
    <div className="bg-[rgba(1,16,37,0.65)] relative size-full" data-node-id="28:1686" data-name="Overlay – Message sent">
      <div className="-translate-x-1/2 -translate-y-1/2 absolute bg-white content-stretch flex flex-col gap-[16px] items-center left-1/2 overflow-clip px-[48px] py-[44px] rounded-[24px] shadow-[0px_30px_70px_0px_rgba(1,16,37,0.3)] top-1/2 w-[460px]" data-node-id="28:1624" data-name="Dialog">
        <div className="relative shrink-0 size-[76px]" data-node-id="28:1625" data-name="Frame">
          <img alt="" className="absolute block inset-0 max-w-none size-full" src={imgFrame} />
        </div>
        <p className="[word-break:break-word] font-['Poppins:Bold'] leading-[36px] not-italic relative shrink-0 text-[#011025] text-[28px] tracking-[-0.112px] whitespace-nowrap" data-node-id="28:1629">
          Message Sent Successfully
        </p>
        <p className="[word-break:break-word] font-['Poppins:Regular'] leading-[26px] not-italic relative shrink-0 text-[#5b6475] text-[16px] text-center w-[364px]" data-node-id="28:1630">
          Thank you for contacting Al Jazira for Imdad Smart Company. Our team will get back to you as soon as possible.
        </p>
        <Button className="bg-[var(--navy\/950,#011025)] content-stretch cursor-pointer flex gap-[10px] items-center justify-center pl-[26px] pr-[24px] py-[14px] relative rounded-[8px] shrink-0" label="Back to Website" showArrow={false} />
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
These styles are contained in the design: Heading/H3: Font(family: "Poppins", style: Bold, size: 28, weight: 700, lineHeight: 36, letterSpacing: -0.4000000059604645), Body/M: Font(family: "Poppins", style: Regular, size: 16, weight: 400, lineHeight: 26, letterSpacing: 0), Label/Button: Font(family: "Poppins", style: SemiBold, size: 15, weight: 600, lineHeight: 22, letterSpacing: 0).
```

```text
The generated code contains image and SVG URL constants, e.g. const image = `${assetPathPrefix}/<asset file name>`, where assetPathPrefix is declared once at the top of the code and every asset URL interpolates it. These URLs are temporary download sources and expire after 7 days. Download each asset into the project with curl -L, then replace its URL in the generated code with a reference to the downloaded asset. Never use the temporary URLs as runtime image sources.
```
