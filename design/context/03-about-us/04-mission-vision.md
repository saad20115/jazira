# Mission & vision

- Figma node: `108:1576` (file `tD3pU1vtvSr8akTMJPFLkA`)
- Page: 03 About Us
- Source: Figma MCP `get_design_context` (React + Tailwind reference code, saved verbatim). Treat as a high-fidelity reference, not production code: convert absolute positioning into real layout.
- The temporary `assetPathPrefix` URLs below expire; use the local files in the asset table instead.

## Asset map (code constant -> local file)

| Constant | Figma asset file | Local file (relative to design/) |
|---|---|---|
| `imgEllipse` | `f1f80.svg` | `assets/context/03-about-us/04-mission-vision/imgEllipse.svg` |
| `imgRectangle` | `7cda0.png` | `assets/images/about-team.png` (shared image) |
| `imgRectangle1` | `fb7bc.png` | `assets/images/hero-city.png` (shared image) |
| `imgFrame` | `5d9e9.svg` | `assets/context/03-about-us/04-mission-vision/imgFrame.svg` |

## Reference code

```jsx
const assetPathPrefix = "https://www.figma.com/api/mcp/asset/eb5d65c0-5e6f-44ad-a3e9-60cccd8f92c6";
const imgEllipse = `${assetPathPrefix}/f1f80.svg`;
const imgRectangle = `${assetPathPrefix}/7cda0.png`;
const imgRectangle1 = `${assetPathPrefix}/fb7bc.png`;
const imgFrame = `${assetPathPrefix}/5d9e9.svg`;

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

export default function MissionVision() {
  return (
    <div className="bg-[var(--white,white)] content-stretch flex flex-col gap-[70px] items-center pb-[78px] pt-[65px] px-[140px] relative size-full" data-node-id="108:1576" data-name="Mission & vision">
      <div className="content-stretch flex flex-col gap-[16px] items-center relative shrink-0" data-node-id="108:1577" data-name="Section head">
        <Eyebrow className="bg-[var(--gold\/50,#fbf4e3)] border border-[rgba(239,203,118,0.6)] border-solid content-stretch flex gap-[8px] items-center px-[14px] py-[6px] relative rounded-[100px] shrink-0" label="Who we are" />
        <p className="[word-break:break-word] font-['Poppins:Bold'] leading-[0] not-italic relative shrink-0 text-[44px] text-[color:var(--navy\/950,#011025)] text-center tracking-[-0.44px] whitespace-nowrap" data-node-id="108:1579">
          <span className="leading-[52px]">{`Our `}</span>
          <span className="leading-[52px] text-[#dfa82a]">{`Mission & Vision`}</span>
        </p>
        <p className="[word-break:break-word] font-['Poppins:Regular'] leading-[30px] not-italic relative shrink-0 text-[18px] text-[color:var(--text\/body,#5b6475)] text-center w-[640px]" data-node-id="108:1580">
          The purpose behind every project we deliver — and where we are heading next.
        </p>
        <div className="bg-gradient-to-r from-[#dfa82a] h-[3px] relative rounded-[2px] shrink-0 to-[#efcb76] w-[52px]" data-node-id="108:1581" data-name="Divider" />
      </div>
      <div className="content-stretch flex gap-[72px] items-center relative shrink-0 w-full" data-node-id="108:1584" data-name="Mission">
        <div className="h-[400px] relative shrink-0 w-[540px]" data-node-id="108:1585" data-name="Visual">
          <div className="absolute h-[400px] left-0 rounded-[20px] shadow-[0px_24px_50px_0px_rgba(1,16,37,0.16)] top-0 w-[540px]" data-node-id="108:1586" data-name="Rectangle">
            <img alt="" className="absolute inset-0 max-w-none object-cover pointer-events-none rounded-[20px] size-full" src={imgRectangle} />
          </div>
          <div className="absolute bg-[var(--gold\/500,#dfa82a)] content-stretch drop-shadow-[0px_10px_12px_rgba(1,16,37,0.2)] flex items-start left-[-20px] px-[18px] py-[12px] rounded-[14px] top-[-20px]" data-node-id="108:1587" data-name="Frame">
            <p className="[word-break:break-word] font-['Poppins:Bold'] leading-[36px] not-italic relative shrink-0 text-[28px] text-[color:var(--navy\/950,#011025)] tracking-[-0.112px] whitespace-nowrap" data-node-id="108:1588">
              01
            </p>
          </div>
        </div>
        <div className="content-stretch flex flex-[1_0_0] flex-col gap-[18px] items-start min-w-px relative" data-node-id="108:1589" data-name="Frame">
          <Eyebrow className="bg-[var(--gold\/50,#fbf4e3)] border border-[rgba(239,203,118,0.6)] border-solid content-stretch flex gap-[8px] items-center px-[14px] py-[6px] relative rounded-[100px] shrink-0" label="Our mission" />
          <p className="[word-break:break-word] font-['Poppins:Bold'] leading-[52px] min-w-full not-italic relative shrink-0 text-[44px] text-[color:var(--navy\/950,#011025)] tracking-[-0.44px] w-[min-content]" data-node-id="108:1591">
            Our Mission
          </p>
          <div className="bg-gradient-to-r from-[#dfa82a] h-[3px] relative rounded-[2px] shrink-0 to-[#efcb76] w-[52px]" data-node-id="108:1592" data-name="Divider" />
          <p className="[word-break:break-word] font-['Poppins:Regular'] leading-[30px] min-w-full not-italic relative shrink-0 text-[18px] text-[color:var(--text\/body,#5b6475)] w-[min-content]" data-node-id="108:1593">
            To safely deliver world-class Quality MEP projects and infrastructure projects on time, promoting environmental protection and sustainable community development.
          </p>
          <div className="content-stretch flex flex-col gap-[12px] items-start relative shrink-0 w-full" data-node-id="108:1594" data-name="Frame">
            <div className="content-stretch flex gap-[12px] items-start relative shrink-0 w-full" data-node-id="108:1621" data-name="Frame">
              <div className="relative shrink-0 size-[22px]" data-node-id="108:1622" data-name="Frame">
                <img alt="" className="absolute block inset-0 max-w-none size-full" src={imgFrame} />
              </div>
              <p className="[word-break:break-word] flex-[1_0_0] font-['Inter:Regular'] font-normal leading-[0] min-w-px not-italic relative text-[0px] text-[color:var(--navy\/950,#011025)]" data-node-id="108:1625">
                <span className="font-['Poppins:SemiBold'] leading-[26px] text-[#011025] text-[16px]">Engineering Excellence</span>
                <span className="font-['Poppins:Regular'] leading-[26px] text-[16px]">{` — Providing comprehensive and effective solutions across all mechanical, electrical, and plumbing works.`}</span>
              </p>
            </div>
            <div className="content-stretch flex gap-[12px] items-start relative shrink-0 w-full" data-node-id="108:1626" data-name="Frame">
              <div className="relative shrink-0 size-[22px]" data-node-id="108:1627" data-name="Frame">
                <img alt="" className="absolute block inset-0 max-w-none size-full" src={imgFrame} />
              </div>
              <p className="[word-break:break-word] flex-[1_0_0] font-['Inter:Regular'] font-normal leading-[0] min-w-px not-italic relative text-[0px] text-[color:var(--navy\/950,#011025)]" data-node-id="108:1630">
                <span className="font-['Poppins:SemiBold'] leading-[26px] text-[#011025] text-[16px]">Safety First</span>
                <span className="font-['Poppins:Regular'] leading-[26px] text-[16px]">{` — Strictly following occupational health and safety standards to protect individuals and assets at all sites.`}</span>
              </p>
            </div>
            <div className="content-stretch flex gap-[12px] items-start relative shrink-0 w-full" data-node-id="108:1631" data-name="Frame">
              <div className="relative shrink-0 size-[22px]" data-node-id="108:1632" data-name="Frame">
                <img alt="" className="absolute block inset-0 max-w-none size-full" src={imgFrame} />
              </div>
              <p className="[word-break:break-word] flex-[1_0_0] font-['Inter:Regular'] font-normal leading-[0] min-w-px not-italic relative text-[0px] text-[color:var(--navy\/950,#011025)]" data-node-id="108:1635">
                <span className="font-['Poppins:SemiBold'] leading-[26px] text-[#011025] text-[16px]">Sustainability</span>
                <span className="font-['Poppins:Regular'] leading-[26px] text-[16px]">{` — Implementing eco-friendly solutions that reduce energy consumption and contribute to sustainable community development.`}</span>
              </p>
            </div>
            <div className="content-stretch flex gap-[12px] items-start relative shrink-0 w-full" data-node-id="108:1636" data-name="Frame">
              <div className="relative shrink-0 size-[22px]" data-node-id="108:1637" data-name="Frame">
                <img alt="" className="absolute block inset-0 max-w-none size-full" src={imgFrame} />
              </div>
              <p className="[word-break:break-word] flex-[1_0_0] font-['Inter:Regular'] font-normal leading-[0] min-w-px not-italic relative text-[0px] text-[color:var(--navy\/950,#011025)]" data-node-id="108:1640">
                <span className="font-['Poppins:SemiBold'] leading-[26px] text-[#011025] text-[16px]">Customer Focus</span>
                <span className="font-['Poppins:Regular'] leading-[26px] text-[16px]">{` — Understanding client needs and adapting services to ensure full satisfaction with tailored solutions.`}</span>
              </p>
            </div>
            <div className="content-stretch flex gap-[12px] items-start relative shrink-0 w-full" data-node-id="108:1641" data-name="Frame">
              <div className="relative shrink-0 size-[22px]" data-node-id="108:1642" data-name="Frame">
                <img alt="" className="absolute block inset-0 max-w-none size-full" src={imgFrame} />
              </div>
              <p className="[word-break:break-word] flex-[1_0_0] font-['Inter:Regular'] font-normal leading-[0] min-w-px not-italic relative text-[0px] text-[color:var(--navy\/950,#011025)]" data-node-id="108:1645">
                <span className="font-['Poppins:SemiBold'] leading-[26px] text-[#011025] text-[16px]">Innovation</span>
                <span className="font-['Poppins:Regular'] leading-[26px] text-[16px]">{` — Developing innovative technologies and solutions to enhance project efficiency without compromising quality.`}</span>
              </p>
            </div>
          </div>
        </div>
      </div>
      <div className="content-stretch flex gap-[72px] items-center relative shrink-0 w-full" data-node-id="108:1646" data-name="Vision">
        <div className="content-stretch flex flex-[1_0_0] flex-col gap-[18px] items-start min-w-px relative" data-node-id="108:1647" data-name="Frame">
          <Eyebrow className="bg-[var(--gold\/50,#fbf4e3)] border border-[rgba(239,203,118,0.6)] border-solid content-stretch flex gap-[8px] items-center px-[14px] py-[6px] relative rounded-[100px] shrink-0" label="Our vision" />
          <p className="[word-break:break-word] font-['Poppins:Bold'] leading-[52px] min-w-full not-italic relative shrink-0 text-[44px] text-[color:var(--navy\/950,#011025)] tracking-[-0.44px] w-[min-content]" data-node-id="108:1649">
            Our Vision
          </p>
          <div className="bg-gradient-to-r from-[#dfa82a] h-[3px] relative rounded-[2px] shrink-0 to-[#efcb76] w-[52px]" data-node-id="108:1650" data-name="Divider" />
          <p className="[word-break:break-word] font-['Poppins:Regular'] leading-[30px] min-w-full not-italic relative shrink-0 text-[18px] text-[color:var(--text\/body,#5b6475)] w-[min-content]" data-node-id="108:1651">
            To become a regional market leader in the MEP Construction Industry, providing engineering excellence to valued clients through commitment to delivering best practices in corporate governance and transparency.
          </p>
          <div className="content-stretch flex flex-col gap-[12px] items-start relative shrink-0 w-full" data-node-id="108:1652" data-name="Frame">
            <div className="content-stretch flex gap-[12px] items-start relative shrink-0 w-full" data-node-id="108:1683" data-name="Frame">
              <div className="relative shrink-0 size-[22px]" data-node-id="108:1684" data-name="Frame">
                <img alt="" className="absolute block inset-0 max-w-none size-full" src={imgFrame} />
              </div>
              <p className="[word-break:break-word] flex-[1_0_0] font-['Inter:Regular'] font-normal leading-[0] min-w-px not-italic relative text-[0px] text-[color:var(--navy\/950,#011025)]" data-node-id="108:1687">
                <span className="font-['Poppins:SemiBold'] leading-[26px] text-[#011025] text-[16px]">Expanding Core Competencies</span>
                <span className="font-['Poppins:Regular'] leading-[26px] text-[16px]">{` — Strengthening our electro-mechanical capabilities and broadening our multi-disciplined EPIC service portfolio.`}</span>
              </p>
            </div>
            <div className="content-stretch flex gap-[12px] items-start relative shrink-0 w-full" data-node-id="108:1688" data-name="Frame">
              <div className="relative shrink-0 size-[22px]" data-node-id="108:1689" data-name="Frame">
                <img alt="" className="absolute block inset-0 max-w-none size-full" src={imgFrame} />
              </div>
              <p className="[word-break:break-word] flex-[1_0_0] font-['Inter:Regular'] font-normal leading-[0] min-w-px not-italic relative text-[0px] text-[color:var(--navy\/950,#011025)]" data-node-id="108:1692">
                <span className="font-['Poppins:SemiBold'] leading-[26px] text-[#011025] text-[16px]">Unique Technologies</span>
                <span className="font-['Poppins:Regular'] leading-[26px] text-[16px]">{` — Identifying and producing unique technologies that set us apart and deliver innovative solutions for our clients.`}</span>
              </p>
            </div>
            <div className="content-stretch flex gap-[12px] items-start relative shrink-0 w-full" data-node-id="108:1693" data-name="Frame">
              <div className="relative shrink-0 size-[22px]" data-node-id="108:1694" data-name="Frame">
                <img alt="" className="absolute block inset-0 max-w-none size-full" src={imgFrame} />
              </div>
              <p className="[word-break:break-word] flex-[1_0_0] font-['Inter:Regular'] font-normal leading-[0] min-w-px not-italic relative text-[0px] text-[color:var(--navy\/950,#011025)]" data-node-id="108:1697">
                <span className="font-['Poppins:SemiBold'] leading-[26px] text-[#011025] text-[16px]">Strategic Partnerships</span>
                <span className="font-['Poppins:Regular'] leading-[26px] text-[16px]">{` — Aligning with key partners that enhance our capabilities to produce and distribute cutting-edge engineering ideas.`}</span>
              </p>
            </div>
          </div>
        </div>
        <div className="h-[400px] relative shrink-0 w-[540px]" data-node-id="108:1674" data-name="Visual">
          <div className="absolute h-[400px] left-0 rounded-[20px] shadow-[0px_24px_50px_0px_rgba(1,16,37,0.16)] top-0 w-[540px]" data-node-id="108:1675" data-name="Rectangle">
            <img alt="" className="absolute inset-0 max-w-none object-cover pointer-events-none rounded-[20px] size-full" src={imgRectangle1} />
          </div>
          <div className="absolute bg-[var(--gold\/500,#dfa82a)] content-stretch drop-shadow-[0px_10px_12px_rgba(1,16,37,0.2)] flex items-start left-[489px] px-[18px] py-[12px] rounded-[14px] top-[-20px]" data-node-id="108:1676" data-name="Frame">
            <p className="[word-break:break-word] font-['Poppins:Bold'] leading-[36px] not-italic relative shrink-0 text-[28px] text-[color:var(--navy\/950,#011025)] tracking-[-0.112px] whitespace-nowrap" data-node-id="108:1677">
              02
            </p>
          </div>
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
These styles are contained in the design: Label/Eyebrow: Font(family: "Poppins", style: SemiBold, size: 12, weight: 600, lineHeight: 16, letterSpacing: 8), Heading/H2: Font(family: "Poppins", style: Bold, size: 44, weight: 700, lineHeight: 52, letterSpacing: -1), Body/L: Font(family: "Poppins", style: Regular, size: 18, weight: 400, lineHeight: 30, letterSpacing: 0), Heading/H3: Font(family: "Poppins", style: Bold, size: 28, weight: 700, lineHeight: 36, letterSpacing: -0.4000000059604645).
```

```text
The generated code contains image and SVG URL constants, e.g. const image = `${assetPathPrefix}/<asset file name>`, where assetPathPrefix is declared once at the top of the code and every asset URL interpolates it. These URLs are temporary download sources and expire after 7 days. Download each asset into the project with curl -L, then replace its URL in the generated code with a reference to the downloaded asset. Never use the temporary URLs as runtime image sources.
```
