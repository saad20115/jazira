# Eyebrow

- Figma node: `12:47` (file `tD3pU1vtvSr8akTMJPFLkA`)
- Page: Design System
- Source: Figma MCP `get_design_context` (React + Tailwind reference code, saved verbatim). Treat as a high-fidelity reference, not production code: convert absolute positioning into real layout.
- The temporary `assetPathPrefix` URLs below expire; use the local files in the asset table instead.

## Asset map (code constant -> local file)

| Constant | Figma asset file | Local file (relative to design/) |
|---|---|---|
| `imgEllipse` | `f1f80.svg` | `assets/context/components/eyebrow/imgEllipse.svg` |

## Reference code

```jsx
const assetPathPrefix = "https://www.figma.com/api/mcp/asset/7e4d4269-cc21-490b-bbad-640401319a50";
const imgEllipse = `${assetPathPrefix}/f1f80.svg`;

type EyebrowProps = {
  className?: string;
  label?: string;
  tone?: "Light" | "Dark";
};

export default function Eyebrow({ className, label = "What we do", tone = "Light" }: EyebrowProps) {
  const isDark = tone === "Dark";
  return (
    <div className={className || `border border-solid content-stretch flex gap-[8px] items-center px-[14px] py-[6px] relative rounded-[100px] ${isDark ? "bg-[rgba(255,255,255,0.08)] border-[rgba(255,255,255,0.16)]" : String.raw`bg-[var(--gold\/50,#fbf4e3)] border-[rgba(239,203,118,0.6)]`}`} id={isDark ? "node-12_44" : "node-12_41"}>
      <div className="relative shrink-0 size-[6px]" id={isDark ? "node-12_45" : "node-12_42"} data-name="Ellipse">
        <img alt="" className="absolute block inset-0 max-w-none size-full" src={imgEllipse} />
      </div>
      {tone === "Light" && (
        <p className="[word-break:break-word] font-['Poppins:SemiBold'] leading-[16px] not-italic relative shrink-0 text-[12px] text-[color:var(--gold\/600,#c38f1c)] tracking-[0.96px] uppercase whitespace-nowrap" data-node-id="12:43">
          {label}
        </p>
      )}
      {isDark && (
        <p className="[word-break:break-word] font-['Poppins:SemiBold'] leading-[16px] not-italic relative shrink-0 text-[12px] text-[color:var(--gold\/300,#efcb76)] tracking-[0.96px] uppercase whitespace-nowrap" data-node-id="12:46">
          {label}
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
These styles are contained in the design: Label/Eyebrow: Font(family: "Poppins", style: SemiBold, size: 12, weight: 600, lineHeight: 16, letterSpacing: 8).
```

```text
The generated code contains image and SVG URL constants, e.g. const image = `${assetPathPrefix}/<asset file name>`, where assetPathPrefix is declared once at the top of the code and every asset URL interpolates it. These URLs are temporary download sources and expire after 7 days. Download each asset into the project with curl -L, then replace its URL in the generated code with a reference to the downloaded asset. Never use the temporary URLs as runtime image sources.
```
