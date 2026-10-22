# Project hero

- Figma node: `20:880` (file `tD3pU1vtvSr8akTMJPFLkA`)
- Page: 05 Project Detail – Sofitel Makkah
- Source: Figma MCP `get_design_context` (React + Tailwind reference code, saved verbatim). Treat as a high-fidelity reference, not production code: convert absolute positioning into real layout.
- The temporary `assetPathPrefix` URLs below expire; use the local files in the asset table instead.

## Asset map (code constant -> local file)

| Constant | Figma asset file | Local file (relative to design/) |
|---|---|---|
| `imgProjectHero` | `7cda0.png` | `assets/images/about-team.png` (shared image) |
| `imgFrame` | `23327.svg` | `assets/context/05-project-detail-sofitel-makkah/01-project-hero/imgFrame.svg` |
| `imgWave` | `1f9f0.svg` | `assets/context/05-project-detail-sofitel-makkah/01-project-hero/imgWave.svg` |

## Reference code

```jsx
const assetPathPrefix = "https://www.figma.com/api/mcp/asset/c4f35832-a625-46f9-857c-68f9c497d4af";
const imgProjectHero = `${assetPathPrefix}/7cda0.png`;
const imgFrame = `${assetPathPrefix}/23327.svg`;
const imgWave = `${assetPathPrefix}/1f9f0.svg`;

export default function ProjectHero() {
  return (
    <div className="bg-[var(--navy\/950,#011025)] content-stretch flex flex-col gap-[16px] items-center pb-[150px] pt-[230px] relative size-full" data-node-id="20:880" data-name="Project hero">
      <img alt="" className="absolute inset-0 max-w-none object-cover pointer-events-none size-full" src={imgProjectHero} />
      <div className="absolute bg-gradient-to-b from-[rgba(1,16,37,0.55)] inset-0 to-[rgba(1,16,37,0.85)]" data-node-id="20:892" data-name="Overlay" />
      <a className="content-stretch cursor-pointer flex gap-[8px] items-center relative shrink-0" data-node-id="20:881" data-name="Back">
        <div className="relative shrink-0 size-[16px]" data-node-id="20:882" data-name="Frame">
          <img alt="" className="absolute block inset-0 max-w-none size-full" src={imgFrame} />
        </div>
        <p className="[word-break:break-word] font-['Poppins:Regular'] leading-[22px] not-italic opacity-80 relative shrink-0 text-[14px] text-[color:var(--white,white)] text-left whitespace-nowrap" data-node-id="20:884">
          Back to Projects
        </p>
      </a>
      <div className="content-stretch flex gap-[8px] items-start relative shrink-0" data-node-id="20:885" data-name="Frame">
        <div className="bg-[rgba(223,168,42,0.2)] border border-[rgba(223,168,42,0.6)] border-solid content-stretch flex items-start px-[12px] py-[5px] relative rounded-[100px] shrink-0" data-node-id="20:886" data-name="Frame">
          <p className="[word-break:break-word] font-['Poppins:SemiBold'] leading-[16px] not-italic relative shrink-0 text-[12px] text-[color:var(--gold\/300,#efcb76)] tracking-[1.2px] uppercase whitespace-nowrap" data-node-id="20:887">
            Full MEP Works
          </p>
        </div>
        <div className="bg-[rgba(255,255,255,0.1)] border border-[rgba(255,255,255,0.25)] border-solid content-stretch flex items-start px-[12px] py-[5px] relative rounded-[100px] shrink-0" data-node-id="20:888" data-name="Frame">
          <p className="[word-break:break-word] font-['Poppins:SemiBold'] leading-[16px] not-italic relative shrink-0 text-[12px] text-[color:var(--white,white)] tracking-[1.2px] uppercase whitespace-nowrap" data-node-id="20:889">
            Completed
          </p>
        </div>
      </div>
      <p className="[word-break:break-word] font-['Poppins:Bold'] leading-[64px] not-italic relative shrink-0 text-[56px] text-[color:var(--white,white)] tracking-[-0.672px] whitespace-nowrap" data-node-id="20:890">
        Sofitel Makkah Hotel
      </p>
      <div className="absolute bottom-[-2px] h-[90px] left-0 w-[1440px]" data-node-id="20:893" data-name="Wave">
        <img alt="" className="absolute block inset-0 max-w-none size-full" src={imgWave} />
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
These styles are contained in the design: Body/S: Font(family: "Poppins", style: Regular, size: 14, weight: 400, lineHeight: 22, letterSpacing: 0), Label/Caps: Font(family: "Poppins", style: SemiBold, size: 12, weight: 600, lineHeight: 16, letterSpacing: 10), Display/L: Font(family: "Poppins", style: Bold, size: 56, weight: 700, lineHeight: 64, letterSpacing: -1.2000000476837158).
```

```text
The generated code contains image and SVG URL constants, e.g. const image = `${assetPathPrefix}/<asset file name>`, where assetPathPrefix is declared once at the top of the code and every asset URL interpolates it. These URLs are temporary download sources and expire after 7 days. Download each asset into the project with curl -L, then replace its URL in the generated code with a reference to the downloaded asset. Never use the temporary URLs as runtime image sources.
```
