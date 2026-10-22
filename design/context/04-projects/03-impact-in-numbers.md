# Impact in numbers

- Figma node: `19:884` (file `tD3pU1vtvSr8akTMJPFLkA`)
- Page: 04 Projects
- Source: Figma MCP `get_design_context` (React + Tailwind reference code, saved verbatim). Treat as a high-fidelity reference, not production code: convert absolute positioning into real layout.
- The temporary `assetPathPrefix` URLs below expire; use the local files in the asset table instead.

## Asset map (code constant -> local file)

| Constant | Figma asset file | Local file (relative to design/) |
|---|---|---|
| `imgImpactInNumbers` | `2f8f8.png` | `assets/images/bg-pipes.png` (shared image) |

## Reference code

```jsx
const assetPathPrefix = "https://www.figma.com/api/mcp/asset/7ccd8303-66d7-465f-bff1-620fd900f0a7";
const imgImpactInNumbers = `${assetPathPrefix}/2f8f8.png`;

export default function ImpactInNumbers() {
  return (
    <div className="bg-[var(--navy\/950,#011025)] content-stretch flex flex-col gap-[52px] items-center px-[140px] py-[65px] relative size-full" data-node-id="19:884" data-name="Impact in numbers">
      <img alt="" className="absolute inset-0 max-w-none object-cover pointer-events-none size-full" src={imgImpactInNumbers} />
      <div className="absolute bg-gradient-to-b from-[rgba(1,16,37,0.88)] inset-0 to-[rgba(1,16,37,0.94)]" data-node-id="19:903" data-name="Overlay" />
      <div className="content-stretch flex flex-col gap-[16px] items-center relative shrink-0" data-node-id="19:885" data-name="Section head">
        <p className="[word-break:break-word] font-['Poppins:Bold'] leading-[52px] not-italic relative shrink-0 text-[44px] text-[color:var(--white,white)] text-center tracking-[-0.44px] whitespace-nowrap" data-node-id="19:886">
          Our Impact in Numbers
        </p>
        <p className="[word-break:break-word] font-['Poppins:Regular'] leading-[30px] not-italic opacity-70 relative shrink-0 text-[18px] text-[color:var(--white,white)] text-center w-[620px]" data-node-id="19:887">
          Key metrics and proven milestones across four decades of engineering excellence.
        </p>
        <div className="bg-gradient-to-r from-[#dfa82a] h-[3px] relative rounded-[2px] shrink-0 to-[#efcb76] w-[52px]" data-node-id="19:888" data-name="Divider" />
      </div>
      <div className="[word-break:break-word] content-stretch flex items-start not-italic relative shrink-0 w-full whitespace-nowrap" data-node-id="19:889" data-name="Stats">
        <div className="content-stretch flex flex-[1_0_0] flex-col gap-[6px] items-center min-w-px relative" data-node-id="19:890" data-name="Frame">
          <p className="font-['Poppins:Bold'] leading-[60px] relative shrink-0 text-[56px] text-[color:var(--gold\/500,#dfa82a)] tracking-[-0.56px]" data-node-id="19:891">
            100+
          </p>
          <p className="font-['Poppins:Regular'] leading-[26px] opacity-65 relative shrink-0 text-[16px] text-[color:var(--white,white)]" data-node-id="19:892">
            Completed Projects
          </p>
        </div>
        <div className="content-stretch flex flex-[1_0_0] flex-col gap-[6px] items-center min-w-px relative" data-node-id="19:893" data-name="Frame">
          <p className="font-['Poppins:Bold'] leading-[60px] relative shrink-0 text-[56px] text-[color:var(--gold\/500,#dfa82a)] tracking-[-0.56px]" data-node-id="19:894">
            3
          </p>
          <p className="font-['Poppins:Regular'] leading-[26px] opacity-65 relative shrink-0 text-[16px] text-[color:var(--white,white)]" data-node-id="19:895">
            Countries Served
          </p>
        </div>
        <div className="content-stretch flex flex-[1_0_0] flex-col gap-[6px] items-center min-w-px relative" data-node-id="19:896" data-name="Frame">
          <p className="font-['Poppins:Bold'] leading-[60px] relative shrink-0 text-[56px] text-[color:var(--gold\/500,#dfa82a)] tracking-[-0.56px]" data-node-id="19:897">
            45+
          </p>
          <p className="font-['Poppins:Regular'] leading-[26px] opacity-65 relative shrink-0 text-[16px] text-[color:var(--white,white)]" data-node-id="19:898">
            Years of Experience
          </p>
        </div>
        <div className="content-stretch flex flex-[1_0_0] flex-col gap-[6px] items-center min-w-px relative" data-node-id="19:899" data-name="Frame">
          <p className="font-['Poppins:Bold'] leading-[60px] relative shrink-0 text-[56px] text-[color:var(--gold\/500,#dfa82a)] tracking-[-0.56px]" data-node-id="19:900">
            85%
          </p>
          <p className="font-['Poppins:Regular'] leading-[26px] opacity-65 relative shrink-0 text-[16px] text-[color:var(--white,white)]" data-node-id="19:901">
            Self-Performed Work
          </p>
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
These styles are contained in the design: Heading/H2: Font(family: "Poppins", style: Bold, size: 44, weight: 700, lineHeight: 52, letterSpacing: -1), Body/L: Font(family: "Poppins", style: Regular, size: 18, weight: 400, lineHeight: 30, letterSpacing: 0), Stat/Number: Font(family: "Poppins", style: Bold, size: 56, weight: 700, lineHeight: 60, letterSpacing: -1), Body/M: Font(family: "Poppins", style: Regular, size: 16, weight: 400, lineHeight: 26, letterSpacing: 0).
```

```text
The generated code contains image and SVG URL constants, e.g. const image = `${assetPathPrefix}/<asset file name>`, where assetPathPrefix is declared once at the top of the code and every asset URL interpolates it. These URLs are temporary download sources and expire after 7 days. Download each asset into the project with curl -L, then replace its URL in the generated code with a reference to the downloaded asset. Never use the temporary URLs as runtime image sources.
```
