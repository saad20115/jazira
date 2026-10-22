# Page header

- Figma node: `19:556` (file `tD3pU1vtvSr8akTMJPFLkA`)
- Page: 04 Projects
- Source: Figma MCP `get_design_context` (React + Tailwind reference code, saved verbatim). Treat as a high-fidelity reference, not production code: convert absolute positioning into real layout.
- The temporary `assetPathPrefix` URLs below expire; use the local files in the asset table instead.

## Asset map (code constant -> local file)

| Constant | Figma asset file | Local file (relative to design/) |
|---|---|---|
| `imgPageHeader` | `c663e.png` | `assets/images/proj-tower.png` (shared image) |
| `imgEllipse` | `daf84.svg` | `assets/context/04-projects/01-page-header/imgEllipse.svg` |
| `imgVector` | `a660b.svg` | `assets/context/04-projects/01-page-header/imgVector.svg` |

## Reference code

```jsx
const assetPathPrefix = "https://www.figma.com/api/mcp/asset/1c73243a-376e-4be9-9777-a9678f210bcf";
const imgPageHeader = `${assetPathPrefix}/c663e.png`;
const imgEllipse = `${assetPathPrefix}/daf84.svg`;
const imgVector = `${assetPathPrefix}/a660b.svg`;

export default function PageHeader() {
  return (
    <div className="bg-[var(--navy\/950,#011025)] content-stretch flex flex-col gap-[18px] items-center pb-[150px] pt-[190px] relative size-full" data-node-id="19:556" data-name="Page header">
      <img alt="" className="absolute inset-0 max-w-none object-cover pointer-events-none size-full" src={imgPageHeader} />
      <div className="absolute bg-gradient-to-b from-[rgba(1,16,37,0.72)] inset-0 to-[rgba(1,16,37,0.88)]" data-node-id="19:565" data-name="Overlay" />
      <div className="bg-[var(--gold\/500,#dfa82a)] h-[3px] relative rounded-[2px] shrink-0 w-[56px]" data-node-id="19:557" data-name="Rectangle" />
      <p className="[word-break:break-word] font-['Poppins:Bold'] leading-[64px] not-italic relative shrink-0 text-[56px] text-[color:var(--gold\/500,#dfa82a)] text-center tracking-[-0.672px] whitespace-nowrap" data-node-id="19:558">
        Our Projects
      </p>
      <p className="[word-break:break-word] font-['Poppins:Regular'] leading-[30px] not-italic opacity-82 relative shrink-0 text-[18px] text-[color:var(--white,white)] text-center w-[640px]" data-node-id="19:559">
        100+ completed MEP, fire fighting, smart-systems and data-center projects across the Gulf. Filter by discipline to explore our track record.
      </p>
      <div className="content-stretch flex gap-[8px] items-center relative shrink-0" data-node-id="19:560" data-name="Breadcrumb">
        <a className="[word-break:break-word] block cursor-pointer font-['Poppins:SemiBold'] leading-[0] not-italic opacity-60 relative shrink-0 text-[12px] text-[color:var(--white,white)] tracking-[1.2px] uppercase whitespace-nowrap" data-node-id="19:561">
          <p className="leading-[16px]">Home</p>
        </a>
        <div className="relative shrink-0 size-[5px]" data-node-id="19:562" data-name="Ellipse">
          <img alt="" className="absolute block inset-0 max-w-none size-full" src={imgEllipse} />
        </div>
        <p className="[word-break:break-word] font-['Poppins:SemiBold'] leading-[16px] not-italic relative shrink-0 text-[12px] text-[color:var(--gold\/500,#dfa82a)] tracking-[1.2px] uppercase whitespace-nowrap" data-node-id="19:563">
          Our Projects
        </p>
      </div>
      <div className="absolute bottom-[-2px] h-[90px] left-0 overflow-clip right-0" data-node-id="19:566" data-name="Wave">
        <div className="absolute inset-[14.58%_0_0_0]" data-node-id="19:567" data-name="Vector">
          <img alt="" className="absolute block inset-0 max-w-none size-full" src={imgVector} />
        </div>
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
These styles are contained in the design: Display/L: Font(family: "Poppins", style: Bold, size: 56, weight: 700, lineHeight: 64, letterSpacing: -1.2000000476837158), Body/L: Font(family: "Poppins", style: Regular, size: 18, weight: 400, lineHeight: 30, letterSpacing: 0), Label/Caps: Font(family: "Poppins", style: SemiBold, size: 12, weight: 600, lineHeight: 16, letterSpacing: 10).
```

```text
The generated code contains image and SVG URL constants, e.g. const image = `${assetPathPrefix}/<asset file name>`, where assetPathPrefix is declared once at the top of the code and every asset URL interpolates it. These URLs are temporary download sources and expire after 7 days. Download each asset into the project with curl -L, then replace its URL in the generated code with a reference to the downloaded asset. Never use the temporary URLs as runtime image sources.
```
