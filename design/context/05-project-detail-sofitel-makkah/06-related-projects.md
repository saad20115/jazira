# Related projects

- Figma node: `20:1009` (file `tD3pU1vtvSr8akTMJPFLkA`)
- Page: 05 Project Detail – Sofitel Makkah
- Source: Figma MCP `get_design_context` (React + Tailwind reference code, saved verbatim). Treat as a high-fidelity reference, not production code: convert absolute positioning into real layout.
- The temporary `assetPathPrefix` URLs below expire; use the local files in the asset table instead.

## Asset map (code constant -> local file)

| Constant | Figma asset file | Local file (relative to design/) |
|---|---|---|
| `imgImage` | `c663e.png` | `assets/images/proj-tower.png` (shared image) |
| `imgImage1` | `efac6.png` | `assets/images/svc-mep.png` (shared image) |
| `imgImage2` | `7cda0.png` | `assets/images/about-team.png` (shared image) |
| `imgEllipse` | `d67b3.svg` | `assets/context/05-project-detail-sofitel-makkah/06-related-projects/imgEllipse.svg` |
| `imgFrame` | `f349a.svg` | `assets/context/05-project-detail-sofitel-makkah/06-related-projects/imgFrame.svg` |

## Reference code

```jsx
const assetPathPrefix = "https://www.figma.com/api/mcp/asset/5bab38b9-d3ae-4061-91c4-7e29b35dfe70";
const imgImage = `${assetPathPrefix}/c663e.png`;
const imgImage1 = `${assetPathPrefix}/efac6.png`;
const imgImage2 = `${assetPathPrefix}/7cda0.png`;
const imgEllipse = `${assetPathPrefix}/d67b3.svg`;
const imgFrame = `${assetPathPrefix}/f349a.svg`;

export default function RelatedProjects() {
  return (
    <div className="bg-[var(--surface,#f6f8fb)] content-stretch flex flex-col gap-[32px] items-start pb-[72px] pt-[65px] px-[140px] relative size-full" data-node-id="20:1009" data-name="Related projects">
      <div className="[word-break:break-word] content-stretch flex flex-col gap-[10px] items-start not-italic relative shrink-0 whitespace-nowrap" data-node-id="20:1010" data-name="Frame">
        <p className="font-['Poppins:Bold'] leading-[52px] relative shrink-0 text-[44px] text-[color:var(--navy\/950,#011025)] tracking-[-0.44px]" data-node-id="20:1011">
          Related Projects
        </p>
        <p className="font-['Poppins:Regular'] leading-[30px] relative shrink-0 text-[18px] text-[color:var(--text\/body,#5b6475)]" data-node-id="20:1012">
          Explore more projects in the same category.
        </p>
      </div>
      <div className="content-stretch flex gap-[24px] items-start relative shrink-0 w-full" data-node-id="20:1013" data-name="Frame">
        <div className="bg-[var(--navy\/900,#0b1a33)] content-stretch flex flex-[1_0_0] flex-col h-[280px] items-start justify-end min-w-px overflow-clip pb-[18px] pt-[16px] px-[22px] relative rounded-[18px] shadow-[0px_10px_28px_0px_rgba(1,16,37,0.12)]" data-node-id="20:1014" data-name="Project Card">
          <div className="absolute h-[280px] left-0 top-0 w-[370px]" data-node-id="I20:1014;15:232" data-name="Image">
            <img alt="" className="absolute inset-0 max-w-none object-cover pointer-events-none size-full" src={imgImage} />
          </div>
          <div className="absolute bg-gradient-to-b from-[rgba(1,16,37,0.15)] h-[280px] left-0 to-[rgba(1,16,37,0.92)] top-0 via-[45%] via-[rgba(1,16,37,0.2)] w-[370px]" data-node-id="I20:1014;15:233" data-name="Overlay" />
          <div className="absolute bg-[rgba(1,16,37,0.55)] border border-[rgba(255,255,255,0.15)] border-solid content-stretch flex items-start left-[16px] px-[10px] py-[5px] rounded-[100px] top-[16px]" data-node-id="I20:1014;15:234" data-name="Category">
            <p className="[word-break:break-word] font-['Poppins:SemiBold'] leading-[14px] not-italic relative shrink-0 text-[11px] text-[color:var(--white,white)] tracking-[0.66px] whitespace-nowrap" data-node-id="I20:1014;15:235">
              FULL MEP WORKS
            </p>
          </div>
          <div className="absolute bg-[rgba(33,161,107,0.18)] border border-[rgba(51,204,128,0.5)] border-solid content-stretch flex gap-[6px] items-center px-[10px] py-[5px] right-[16px] rounded-[100px] top-[16px]" data-node-id="I20:1014;15:236" data-name="Status">
            <div className="relative shrink-0 size-[6px]" data-node-id="I20:1014;15:237" data-name="Ellipse">
              <img alt="" className="absolute block inset-0 max-w-none size-full" src={imgEllipse} />
            </div>
            <p className="[word-break:break-word] font-['Poppins:SemiBold'] leading-[14px] not-italic relative shrink-0 text-[#73eba6] text-[11px] tracking-[0.66px] whitespace-nowrap" data-node-id="I20:1014;15:238">
              In Progress
            </p>
          </div>
          <div className="content-stretch flex flex-col gap-[8px] items-start relative shrink-0 w-full" data-node-id="I20:1014;15:239" data-name="Body">
            <p className="[word-break:break-word] font-['Poppins:SemiBold'] leading-[28px] min-w-full not-italic relative shrink-0 text-[20px] text-[color:var(--white,white)] w-[min-content]" data-node-id="I20:1014;15:240">
              Stella Hotel (32 Floors)
            </p>
            <div className="content-stretch flex gap-[6px] items-center relative shrink-0" data-node-id="I20:1014;15:241" data-name="Location">
              <div className="relative shrink-0 size-[14px]" data-node-id="I20:1014;15:242" data-name="Frame">
                <img alt="" className="absolute block inset-0 max-w-none size-full" src={imgFrame} />
              </div>
              <p className="[word-break:break-word] font-['Poppins:Regular'] leading-[20px] not-italic opacity-80 relative shrink-0 text-[13px] text-white whitespace-nowrap" data-node-id="I20:1014;15:244">
                Dubai, UAE
              </p>
            </div>
          </div>
          <div className="absolute bg-[var(--gold\/500,#dfa82a)] h-[4px] left-0 top-[276px] w-[0.01px]" data-node-id="I20:1014;15:249" data-name="Gold bar" />
        </div>
        <div className="bg-[var(--navy\/900,#0b1a33)] content-stretch flex flex-[1_0_0] flex-col h-[280px] items-start justify-end min-w-px overflow-clip pb-[18px] pt-[16px] px-[22px] relative rounded-[18px] shadow-[0px_10px_28px_0px_rgba(1,16,37,0.12)]" data-node-id="20:1033" data-name="Project Card">
          <div className="absolute h-[280px] left-0 top-0 w-[370px]" data-node-id="I20:1033;15:196" data-name="Image">
            <img alt="" className="absolute inset-0 max-w-none object-cover pointer-events-none size-full" src={imgImage1} />
          </div>
          <div className="absolute bg-gradient-to-b from-[rgba(1,16,37,0.15)] h-[280px] left-0 to-[rgba(1,16,37,0.92)] top-0 via-[45%] via-[rgba(1,16,37,0.2)] w-[370px]" data-node-id="I20:1033;15:197" data-name="Overlay" />
          <div className="absolute bg-[rgba(1,16,37,0.55)] border border-[rgba(255,255,255,0.15)] border-solid content-stretch flex items-start left-[16px] px-[10px] py-[5px] rounded-[100px] top-[16px]" data-node-id="I20:1033;15:198" data-name="Category">
            <p className="[word-break:break-word] font-['Poppins:SemiBold'] leading-[14px] not-italic relative shrink-0 text-[11px] text-[color:var(--white,white)] tracking-[0.66px] whitespace-nowrap" data-node-id="I20:1033;15:199">
              FULL MEP WORKS
            </p>
          </div>
          <div className="absolute bg-[rgba(1,16,37,0.55)] border border-[rgba(255,255,255,0.15)] border-solid content-stretch flex items-center px-[10px] py-[5px] right-[16px] rounded-[100px] top-[16px]" data-node-id="I20:1033;15:200" data-name="Status">
            <p className="[word-break:break-word] font-['Poppins:SemiBold'] leading-[14px] not-italic relative shrink-0 text-[11px] text-[color:var(--white,white)] tracking-[0.66px] whitespace-nowrap" data-node-id="I20:1033;15:201">
              Completed
            </p>
          </div>
          <div className="content-stretch flex flex-col gap-[8px] items-start relative shrink-0 w-full" data-node-id="I20:1033;15:202" data-name="Body">
            <p className="[word-break:break-word] font-['Poppins:SemiBold'] leading-[28px] min-w-full not-italic relative shrink-0 text-[20px] text-[color:var(--white,white)] w-[min-content]" data-node-id="I20:1033;15:203">
              King Salman Oasis of Science
            </p>
            <div className="content-stretch flex gap-[6px] items-center relative shrink-0" data-node-id="I20:1033;15:204" data-name="Location">
              <div className="relative shrink-0 size-[14px]" data-node-id="I20:1033;15:205" data-name="Frame">
                <img alt="" className="absolute block inset-0 max-w-none size-full" src={imgFrame} />
              </div>
              <p className="[word-break:break-word] font-['Poppins:Regular'] leading-[20px] not-italic opacity-80 relative shrink-0 text-[13px] text-white whitespace-nowrap" data-node-id="I20:1033;15:207">
                Riyadh, KSA
              </p>
            </div>
          </div>
          <div className="absolute bg-[var(--gold\/500,#dfa82a)] h-[4px] left-0 top-[276px] w-[0.01px]" data-node-id="I20:1033;15:212" data-name="Gold bar" />
        </div>
        <div className="bg-[var(--navy\/900,#0b1a33)] content-stretch flex flex-[1_0_0] flex-col h-[280px] items-start justify-end min-w-px overflow-clip pb-[18px] pt-[16px] px-[22px] relative rounded-[18px] shadow-[0px_10px_28px_0px_rgba(1,16,37,0.12)]" data-node-id="20:1051" data-name="Project Card">
          <div className="absolute h-[280px] left-0 top-0 w-[370px]" data-node-id="I20:1051;15:196" data-name="Image">
            <img alt="" className="absolute inset-0 max-w-none object-cover pointer-events-none size-full" src={imgImage2} />
          </div>
          <div className="absolute bg-gradient-to-b from-[rgba(1,16,37,0.15)] h-[280px] left-0 to-[rgba(1,16,37,0.92)] top-0 via-[45%] via-[rgba(1,16,37,0.2)] w-[370px]" data-node-id="I20:1051;15:197" data-name="Overlay" />
          <div className="absolute bg-[rgba(1,16,37,0.55)] border border-[rgba(255,255,255,0.15)] border-solid content-stretch flex items-start left-[16px] px-[10px] py-[5px] rounded-[100px] top-[16px]" data-node-id="I20:1051;15:198" data-name="Category">
            <p className="[word-break:break-word] font-['Poppins:SemiBold'] leading-[14px] not-italic relative shrink-0 text-[11px] text-[color:var(--white,white)] tracking-[0.66px] whitespace-nowrap" data-node-id="I20:1051;15:199">
              FULL MEP WORKS
            </p>
          </div>
          <div className="absolute bg-[rgba(1,16,37,0.55)] border border-[rgba(255,255,255,0.15)] border-solid content-stretch flex items-center px-[10px] py-[5px] right-[16px] rounded-[100px] top-[16px]" data-node-id="I20:1051;15:200" data-name="Status">
            <p className="[word-break:break-word] font-['Poppins:SemiBold'] leading-[14px] not-italic relative shrink-0 text-[11px] text-[color:var(--white,white)] tracking-[0.66px] whitespace-nowrap" data-node-id="I20:1051;15:201">
              Completed
            </p>
          </div>
          <div className="content-stretch flex flex-col gap-[8px] items-start relative shrink-0 w-full" data-node-id="I20:1051;15:202" data-name="Body">
            <p className="[word-break:break-word] font-['Poppins:SemiBold'] leading-[28px] min-w-full not-italic relative shrink-0 text-[20px] text-[color:var(--white,white)] w-[min-content]" data-node-id="I20:1051;15:203">
              Al Maqam Towers (A, B, C, D)
            </p>
            <div className="content-stretch flex gap-[6px] items-center relative shrink-0" data-node-id="I20:1051;15:204" data-name="Location">
              <div className="relative shrink-0 size-[14px]" data-node-id="I20:1051;15:205" data-name="Frame">
                <img alt="" className="absolute block inset-0 max-w-none size-full" src={imgFrame} />
              </div>
              <p className="[word-break:break-word] font-['Poppins:Regular'] leading-[20px] not-italic opacity-80 relative shrink-0 text-[13px] text-white whitespace-nowrap" data-node-id="I20:1051;15:207">
                Makkah, KSA
              </p>
            </div>
          </div>
          <div className="absolute bg-[var(--gold\/500,#dfa82a)] h-[4px] left-0 top-[276px] w-[0.01px]" data-node-id="I20:1051;15:212" data-name="Gold bar" />
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
These styles are contained in the design: Heading/H2: Font(family: "Poppins", style: Bold, size: 44, weight: 700, lineHeight: 52, letterSpacing: -1), Body/L: Font(family: "Poppins", style: Regular, size: 18, weight: 400, lineHeight: 30, letterSpacing: 0), Label/Tag: Font(family: "Poppins", style: SemiBold, size: 11, weight: 600, lineHeight: 14, letterSpacing: 6), Heading/H4: Font(family: "Poppins", style: SemiBold, size: 20, weight: 600, lineHeight: 28, letterSpacing: 0), Caption: Font(family: "Poppins", style: Regular, size: 13, weight: 400, lineHeight: 20, letterSpacing: 0).
```

```text
The generated code contains image and SVG URL constants, e.g. const image = `${assetPathPrefix}/<asset file name>`, where assetPathPrefix is declared once at the top of the code and every asset URL interpolates it. These URLs are temporary download sources and expire after 7 days. Download each asset into the project with curl -L, then replace its URL in the generated code with a reference to the downloaded asset. Never use the temporary URLs as runtime image sources.
```
