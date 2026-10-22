# WhatsApp FAB (fixed)

- Figma node: `18:775` (file `tD3pU1vtvSr8akTMJPFLkA`)
- Page: 01 Home
- Source: Figma MCP `get_design_context` (React + Tailwind reference code, saved verbatim). Treat as a high-fidelity reference, not production code: convert absolute positioning into real layout.
- The temporary `assetPathPrefix` URLs below expire; use the local files in the asset table instead.

## Asset map (code constant -> local file)

| Constant | Figma asset file | Local file (relative to design/) |
|---|---|---|
| `imgPulseRing` | `576e5.svg` | `assets/context/01-home/11-whatsapp-fab/imgPulseRing.svg` |
| `imgFrame` | `9aa38.svg` | `assets/context/01-home/11-whatsapp-fab/imgFrame.svg` |

## Reference code

```jsx
const assetPathPrefix = "https://www.figma.com/api/mcp/asset/861b877a-801f-4433-97b8-a3559478cf68";
const imgPulseRing = `${assetPathPrefix}/576e5.svg`;
const imgFrame = `${assetPathPrefix}/9aa38.svg`;

export default function WhatsAppFabFixed() {
  return (
    <a className="block cursor-pointer relative size-full" href="https://wa.me/966573534185" data-node-id="18:775" target="_blank" data-name="WhatsApp FAB (fixed)">
      <div className="absolute left-[204px] size-[64px] top-[12px]" data-node-id="I18:775;12:70" data-name="Pulse ring">
        <img alt="" className="absolute block inset-0 max-w-none size-full" src={imgPulseRing} />
      </div>
      <div className="absolute bg-[#25d366] left-[206px] overflow-clip rounded-[30px] shadow-[0px_10px_24px_0px_rgba(18,115,51,0.35)] size-[60px] top-[14px]" data-node-id="I18:775;12:71" data-name="Button">
        <div className="absolute left-[15px] size-[30px] top-[15px]" data-node-id="I18:775;12:72" data-name="Frame">
          <img alt="" className="absolute block inset-0 max-w-none size-full" src={imgFrame} />
        </div>
      </div>
      <div className="absolute bg-[var(--navy\/950,#011025)] content-stretch flex items-start left-[-5px] opacity-0 overflow-clip px-[14px] py-[9px] rounded-[10px] top-[24px]" data-node-id="I18:775;12:75" data-name="Tooltip">
        <p className="[word-break:break-word] font-['Poppins:Medium'] leading-[22px] not-italic relative shrink-0 text-[15px] text-[color:var(--white,white)] text-left whitespace-nowrap" data-node-id="I18:775;12:76">
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
