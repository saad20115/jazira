# WhatsApp FAB

- Figma node: `12:93` (file `tD3pU1vtvSr8akTMJPFLkA`)
- Page: Design System
- Source: Figma MCP `get_design_context` (React + Tailwind reference code, saved verbatim). Treat as a high-fidelity reference, not production code: convert absolute positioning into real layout.
- The temporary `assetPathPrefix` URLs below expire; use the local files in the asset table instead.

## Asset map (code constant -> local file)

| Constant | Figma asset file | Local file (relative to design/) |
|---|---|---|
| `imgPulseRing` | `576e5.svg` | `assets/context/components/whatsapp-fab/imgPulseRing.svg` |
| `imgFrame` | `9aa38.svg` | `assets/context/components/whatsapp-fab/imgFrame.svg` |
| `imgPulseRing1` | `6f385.svg` | `assets/context/components/whatsapp-fab/imgPulseRing1.svg` |

## Reference code

```jsx
const assetPathPrefix = "https://www.figma.com/api/mcp/asset/5b730337-0b24-48bc-8ca5-036ab44acfd3";
const imgPulseRing = `${assetPathPrefix}/576e5.svg`;
const imgFrame = `${assetPathPrefix}/9aa38.svg`;
const imgPulseRing1 = `${assetPathPrefix}/6f385.svg`;

type WhatsAppFabProps = {
  className?: string;
  state?: "Idle" | "Pulse" | "Hover";
};

export default function WhatsAppFab({ className, state = "Idle" }: WhatsAppFabProps) {
  const isHover = state === "Hover";
  const isPulse = state === "Pulse";
  return (
    <a className={className || "block h-[88px] relative w-[280px]"} href="https://wa.me/966573534185" id={isHover ? "node-12_85" : isPulse ? "node-12_77" : "node-12_69"} target="_blank">
      <div className={`absolute ${isPulse ? "left-[186px] size-[100px] top-[-6px]" : "left-[204px] size-[64px] top-[12px]"}`} id={isHover ? "node-12_86" : isPulse ? "node-12_78" : "node-12_70"} data-name="Pulse ring">
        <img alt="" className="absolute block inset-0 max-w-none size-full" src={isPulse ? imgPulseRing1 : imgPulseRing} />
      </div>
      <div className="absolute bg-[#25d366] left-[206px] overflow-clip rounded-[30px] shadow-[0px_10px_24px_0px_rgba(18,115,51,0.35)] size-[60px] top-[14px]" id={isHover ? "node-12_87" : isPulse ? "node-12_79" : "node-12_71"} data-name="Button">
        <div className="absolute left-[15px] size-[30px] top-[15px]" id={isHover ? "node-12_88" : isPulse ? "node-12_80" : "node-12_72"} data-name="Frame">
          <img alt="" className="absolute block inset-0 max-w-none size-full" src={imgFrame} />
        </div>
      </div>
      <div className={`${String.raw`absolute bg-[var(--navy\/950,#011025)] content-stretch flex items-start overflow-clip px-[14px] py-[9px] rounded-[10px] top-[24px] `}${isHover ? "left-[-25px]" : "left-[-5px] opacity-0"}`} id={isHover ? "node-12_91" : isPulse ? "node-12_83" : "node-12_75"} data-name="Tooltip">
        <p className="[word-break:break-word] font-['Poppins:Medium'] leading-[22px] not-italic relative shrink-0 text-[15px] text-[color:var(--white,white)] text-left whitespace-nowrap" id={isHover ? "node-12_92" : isPulse ? "node-12_84" : "node-12_76"}>
          Chat with us on WhatsApp
        </p>
      </div>
    </a>
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
