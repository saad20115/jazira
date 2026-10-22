# Gallery

- Figma node: `20:976` (file `tD3pU1vtvSr8akTMJPFLkA`)
- Page: 05 Project Detail – Sofitel Makkah
- Source: Figma MCP `get_design_context` (React + Tailwind reference code, saved verbatim). Treat as a high-fidelity reference, not production code: convert absolute positioning into real layout.
- The temporary `assetPathPrefix` URLs below expire; use the local files in the asset table instead.

## Asset map (code constant -> local file)

| Constant | Figma asset file | Local file (relative to design/) |
|---|---|---|
| `imgEllipse` | `f1f80.svg` | `assets/context/05-project-detail-sofitel-makkah/04-gallery/imgEllipse.svg` |
| `imgPhoto1` | `7cda0.png` | `assets/images/about-team.png` (shared image) |
| `imgPhoto2` | `fac6f.png` | `assets/images/svc-fire.png` (shared image) |
| `imgPhoto3` | `efac6.png` | `assets/images/svc-mep.png` (shared image) |
| `imgFrame` | `6a7c1.svg` | `assets/context/05-project-detail-sofitel-makkah/04-gallery/imgFrame.svg` |

## Reference code

```jsx
const assetPathPrefix = "https://www.figma.com/api/mcp/asset/d3e4dbe3-e993-4e5b-8a53-c6a2ff846cbd";
const imgEllipse = `${assetPathPrefix}/f1f80.svg`;
const imgPhoto1 = `${assetPathPrefix}/7cda0.png`;
const imgPhoto2 = `${assetPathPrefix}/fac6f.png`;
const imgPhoto3 = `${assetPathPrefix}/efac6.png`;
const imgFrame = `${assetPathPrefix}/6a7c1.svg`;

type EyebrowProps = {
  className?: string;
  label?: string;
  tone?: "Light";
};

function Eyebrow({ className, label = "What we do", tone = "Light" }: EyebrowProps) {
  return (
    <div className={className || "bg-[var(--gold\\/50,#fbf4e3)] border border-[rgba(239,203,118,0.6)] border-solid content-stretch flex gap-[8px] items-center px-[14px] py-[6px] relative rounded-[100px]"} data-node-id="12:41">
      <div className="relative shrink-0 size-[6px]" data-node-id="12:42" data-name="Ellipse">
        <img alt="" className="absolute block inset-0 max-w-none size-full" src={imgEllipse} />
      </div>
      <p className="[word-break:break-word] font-['Poppins:SemiBold'] leading-[16px] not-italic relative shrink-0 text-[12px] text-[color:var(--gold\/600,#c38f1c)] tracking-[0.96px] uppercase whitespace-nowrap" data-node-id="12:43">
        {label}
      </p>
    </div>
  );
}

export default function Gallery() {
  return (
    <div className="bg-[var(--surface,#f6f8fb)] content-stretch flex flex-col gap-[32px] items-start pb-[72px] pt-[65px] px-[140px] relative size-full" data-node-id="20:976" data-name="Gallery">
      <div className="content-stretch flex flex-col gap-[14px] items-start relative shrink-0" data-node-id="20:977" data-name="Frame">
        <Eyebrow className="bg-[var(--gold\/50,#fbf4e3)] border border-[rgba(239,203,118,0.6)] border-solid content-stretch flex gap-[8px] items-center px-[14px] py-[6px] relative rounded-[100px] shrink-0" label="Gallery" />
        <p className="[word-break:break-word] font-['Poppins:Bold'] leading-[52px] not-italic relative shrink-0 text-[44px] text-[color:var(--navy\/950,#011025)] tracking-[-0.44px] whitespace-nowrap" data-node-id="20:981">
          Project Visual Showcase
        </p>
      </div>
      <div className="content-stretch cursor-pointer flex gap-[20px] items-start relative shrink-0 w-full" data-node-id="20:982" data-name="Frame">
        <button className="block flex-[1_0_0] h-[260px] min-w-px overflow-clip relative rounded-[16px] shadow-[0px_14px_32px_0px_rgba(1,16,37,0.12)]" data-node-id="20:983" data-name="Photo 1">
          <img alt="" className="absolute inset-0 max-w-none object-cover pointer-events-none rounded-[16px] size-full" src={imgPhoto1} />
          <div className="absolute bg-[rgba(255,255,255,0.9)] content-stretch flex items-center justify-center p-[14px] right-[803.33px] rounded-[20px] size-[40px] top-[16px]" data-node-id="20:984" data-name="Frame">
            <div className="relative shrink-0 size-[16px]" data-node-id="20:985" data-name="Frame">
              <img alt="" className="absolute block inset-0 max-w-none size-full" src={imgFrame} />
            </div>
          </div>
        </button>
        <button className="block flex-[1_0_0] h-[260px] min-w-px overflow-clip relative rounded-[16px] shadow-[0px_14px_32px_0px_rgba(1,16,37,0.12)]" data-node-id="20:987" data-name="Photo 2">
          <img alt="" className="absolute inset-0 max-w-none object-cover pointer-events-none rounded-[16px] size-full" src={imgPhoto2} />
          <div className="absolute bg-[rgba(255,255,255,0.9)] content-stretch flex items-center justify-center p-[14px] right-[213.33px] rounded-[20px] size-[40px] top-[16px]" data-node-id="20:988" data-name="Frame">
            <div className="relative shrink-0 size-[16px]" data-node-id="20:989" data-name="Frame">
              <img alt="" className="absolute block inset-0 max-w-none size-full" src={imgFrame} />
            </div>
          </div>
        </button>
        <button className="block flex-[1_0_0] h-[260px] min-w-px overflow-clip relative rounded-[16px] shadow-[0px_14px_32px_0px_rgba(1,16,37,0.12)]" data-node-id="20:991" data-name="Photo 3">
          <img alt="" className="absolute inset-0 max-w-none object-cover pointer-events-none rounded-[16px] size-full" src={imgPhoto3} />
          <div className="absolute bg-[rgba(255,255,255,0.9)] content-stretch flex items-center justify-center p-[14px] right-[16.33px] rounded-[20px] size-[40px] top-[16px]" data-node-id="20:992" data-name="Frame">
            <div className="relative shrink-0 size-[16px]" data-node-id="20:993" data-name="Frame">
              <img alt="" className="absolute block inset-0 max-w-none size-full" src={imgFrame} />
            </div>
          </div>
        </button>
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
These styles are contained in the design: Label/Eyebrow: Font(family: "Poppins", style: SemiBold, size: 12, weight: 600, lineHeight: 16, letterSpacing: 8), Heading/H2: Font(family: "Poppins", style: Bold, size: 44, weight: 700, lineHeight: 52, letterSpacing: -1).
```

```text
The generated code contains image and SVG URL constants, e.g. const image = `${assetPathPrefix}/<asset file name>`, where assetPathPrefix is declared once at the top of the code and every asset URL interpolates it. These URLs are temporary download sources and expire after 7 days. Download each asset into the project with curl -L, then replace its URL in the generated code with a reference to the downloaded asset. Never use the temporary URLs as runtime image sources.
```
