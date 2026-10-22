# How we work

- Figma node: `24:1646` (file `tD3pU1vtvSr8akTMJPFLkA`)
- Page: 02 Services
- Source: Figma MCP `get_design_context` (React + Tailwind reference code, saved verbatim). Treat as a high-fidelity reference, not production code: convert absolute positioning into real layout.
- The temporary `assetPathPrefix` URLs below expire; use the local files in the asset table instead.

## Asset map (code constant -> local file)

| Constant | Figma asset file | Local file (relative to design/) |
|---|---|---|
| `imgEllipse` | `f1f80.svg` | `assets/context/02-services/05-how-we-work/imgEllipse.svg` |
| `imgHowWeWork` | `2f8f8.png` | `assets/images/bg-pipes.png` (shared image) |

## Reference code

```jsx
const assetPathPrefix = "https://www.figma.com/api/mcp/asset/f18322f9-b8be-4054-bcaa-23ee1ecce131";
const imgEllipse = `${assetPathPrefix}/f1f80.svg`;
const imgHowWeWork = `${assetPathPrefix}/2f8f8.png`;

type EyebrowProps = {
  className?: string;
  label?: string;
  tone?: "Dark";
};

function Eyebrow({ className, label = "What we do", tone = "Dark" }: EyebrowProps) {
  return (
    <div className={className || "bg-[rgba(255,255,255,0.08)] border border-[rgba(255,255,255,0.16)] border-solid content-stretch flex gap-[8px] items-center px-[14px] py-[6px] relative rounded-[100px]"} data-node-id="12:44">
      <div className="relative shrink-0 size-[6px]" data-node-id="12:45" data-name="Ellipse">
        <img alt="" className="absolute block inset-0 max-w-none size-full" src={imgEllipse} />
      </div>
      <p className="[word-break:break-word] font-['Poppins:SemiBold'] leading-[16px] not-italic relative shrink-0 text-[12px] text-[color:var(--gold\/300,#efcb76)] tracking-[0.96px] uppercase whitespace-nowrap" data-node-id="12:46">
        {label}
      </p>
    </div>
  );
}

export default function HowWeWork() {
  return (
    <div className="bg-[var(--navy\/950,#011025)] content-stretch flex flex-col gap-[52px] items-center px-[140px] py-[72px] relative size-full" data-node-id="24:1646" data-name="How we work">
      <img alt="" className="absolute inset-0 max-w-none object-cover pointer-events-none size-full" src={imgHowWeWork} />
      <div className="absolute bg-gradient-to-b from-[rgba(1,16,37,0.9)] inset-0 to-[rgba(1,16,37,0.94)]" data-node-id="24:1676" data-name="Overlay" />
      <div className="content-stretch flex flex-col gap-[16px] items-center relative shrink-0" data-node-id="24:1647" data-name="Section head">
        <Eyebrow className="bg-[rgba(255,255,255,0.08)] border border-[rgba(255,255,255,0.16)] border-solid content-stretch flex gap-[8px] items-center px-[14px] py-[6px] relative rounded-[100px] shrink-0" label="How We Work" />
        <p className="[word-break:break-word] font-['Poppins:Bold'] leading-[0] not-italic relative shrink-0 text-[44px] text-[color:var(--white,white)] text-center tracking-[-0.44px] whitespace-nowrap" data-node-id="24:1651">
          <span className="leading-[52px]">{`From Survey to `}</span>
          <span className="leading-[52px] text-[#dfa82a]">Handover</span>
        </p>
        <p className="[word-break:break-word] font-['Poppins:Regular'] leading-[30px] not-italic opacity-70 relative shrink-0 text-[18px] text-[color:var(--white,white)] text-center w-[640px]" data-node-id="24:1652">
          A clear, accountable process — delivered by one team from the first site visit to final commissioning.
        </p>
        <div className="bg-gradient-to-r from-[#dfa82a] h-[3px] relative rounded-[2px] shrink-0 to-[#efcb76] w-[52px]" data-node-id="24:1653" data-name="Divider" />
      </div>
      <div className="[word-break:break-word] content-stretch flex gap-[16px] items-start not-italic relative shrink-0 w-full" data-node-id="24:1654" data-name="Frame">
        <div className="bg-[rgba(255,255,255,0.05)] border border-[rgba(255,255,255,0.12)] border-solid content-stretch flex flex-[1_0_0] flex-col gap-[12px] items-start min-w-px px-[22px] py-[26px] relative rounded-[16px] self-stretch" data-node-id="24:1655" data-name="Frame">
          <p className="font-['Poppins:Bold'] leading-[48px] relative shrink-0 text-[40px] text-[color:var(--gold\/500,#dfa82a)] tracking-[-0.4px] whitespace-nowrap" data-node-id="24:1656">
            01
          </p>
          <p className="font-['Poppins:SemiBold'] leading-[24px] min-w-full relative shrink-0 text-[17px] text-[color:var(--white,white)] w-[min-content]" data-node-id="24:1657">{`Survey & Consult`}</p>
          <p className="font-['Poppins:Regular'] leading-[22px] min-w-full opacity-65 relative shrink-0 text-[14px] text-[color:var(--white,white)] w-[min-content]" data-node-id="24:1658">
            Site visit, requirements and scope definition.
          </p>
        </div>
        <div className="bg-[rgba(255,255,255,0.05)] border border-[rgba(255,255,255,0.12)] border-solid content-stretch flex flex-[1_0_0] flex-col gap-[12px] items-start min-w-px px-[22px] py-[26px] relative rounded-[16px] self-stretch" data-node-id="24:1659" data-name="Frame">
          <p className="font-['Poppins:Bold'] leading-[48px] relative shrink-0 text-[40px] text-[color:var(--gold\/500,#dfa82a)] tracking-[-0.4px] whitespace-nowrap" data-node-id="24:1660">
            02
          </p>
          <p className="font-['Poppins:SemiBold'] leading-[24px] min-w-full relative shrink-0 text-[17px] text-[color:var(--white,white)] w-[min-content]" data-node-id="24:1661">{`Design & Value Engineering`}</p>
          <p className="font-['Poppins:Regular'] leading-[22px] min-w-full opacity-65 relative shrink-0 text-[14px] text-[color:var(--white,white)] w-[min-content]" data-node-id="24:1662">
            Coordinated shop drawings and cost-optimized options.
          </p>
        </div>
        <div className="bg-[rgba(255,255,255,0.05)] border border-[rgba(255,255,255,0.12)] border-solid content-stretch flex flex-[1_0_0] flex-col gap-[12px] items-start min-w-px px-[22px] py-[26px] relative rounded-[16px] self-stretch" data-node-id="24:1663" data-name="Frame">
          <p className="font-['Poppins:Bold'] leading-[48px] relative shrink-0 text-[40px] text-[color:var(--gold\/500,#dfa82a)] tracking-[-0.4px] whitespace-nowrap" data-node-id="24:1664">
            03
          </p>
          <p className="font-['Poppins:SemiBold'] leading-[24px] min-w-full relative shrink-0 text-[17px] text-[color:var(--white,white)] w-[min-content]" data-node-id="24:1665">{`Procurement & Supply`}</p>
          <p className="font-['Poppins:Regular'] leading-[22px] min-w-full opacity-65 relative shrink-0 text-[14px] text-[color:var(--white,white)] w-[min-content]" data-node-id="24:1666">
            Genuine equipment from our partner brands.
          </p>
        </div>
        <div className="bg-[rgba(255,255,255,0.05)] border border-[rgba(255,255,255,0.12)] border-solid content-stretch flex flex-[1_0_0] flex-col gap-[12px] items-start min-w-px px-[22px] py-[26px] relative rounded-[16px] self-stretch" data-node-id="24:1667" data-name="Frame">
          <p className="font-['Poppins:Bold'] leading-[48px] relative shrink-0 text-[40px] text-[color:var(--gold\/500,#dfa82a)] tracking-[-0.4px] whitespace-nowrap" data-node-id="24:1668">
            04
          </p>
          <p className="font-['Poppins:SemiBold'] leading-[24px] min-w-full relative shrink-0 text-[17px] text-[color:var(--white,white)] w-[min-content]" data-node-id="24:1669">
            Installation
          </p>
          <p className="font-['Poppins:Regular'] leading-[22px] min-w-full opacity-65 relative shrink-0 text-[14px] text-[color:var(--white,white)] w-[min-content]" data-node-id="24:1670">
            Executed by our own engineers and technicians.
          </p>
        </div>
        <div className="bg-[var(--gold\/500,#dfa82a)] content-stretch flex flex-[1_0_0] flex-col gap-[12px] items-start min-w-px px-[22px] py-[26px] relative rounded-[16px] self-stretch text-[color:var(--navy\/950,#011025)]" data-node-id="24:1671" data-name="Frame">
          <p className="font-['Poppins:Bold'] leading-[48px] relative shrink-0 text-[40px] tracking-[-0.4px] whitespace-nowrap" data-node-id="24:1672">
            05
          </p>
          <p className="font-['Poppins:SemiBold'] leading-[24px] min-w-full relative shrink-0 text-[17px] w-[min-content]" data-node-id="24:1673">{`Testing & Handover`}</p>
          <p className="font-['Poppins:Regular'] leading-[22px] min-w-full opacity-80 relative shrink-0 text-[14px] w-[min-content]" data-node-id="24:1674">{`T&C, TAB, as-built documents and O&M support.`}</p>
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
These styles are contained in the design: Label/Eyebrow: Font(family: "Poppins", style: SemiBold, size: 12, weight: 600, lineHeight: 16, letterSpacing: 8), Heading/H2: Font(family: "Poppins", style: Bold, size: 44, weight: 700, lineHeight: 52, letterSpacing: -1), Body/L: Font(family: "Poppins", style: Regular, size: 18, weight: 400, lineHeight: 30, letterSpacing: 0), Stat/M: Font(family: "Poppins", style: Bold, size: 40, weight: 700, lineHeight: 48, letterSpacing: -1), Heading/H5: Font(family: "Poppins", style: SemiBold, size: 17, weight: 600, lineHeight: 24, letterSpacing: 0), Body/S: Font(family: "Poppins", style: Regular, size: 14, weight: 400, lineHeight: 22, letterSpacing: 0).
```

```text
The generated code contains image and SVG URL constants, e.g. const image = `${assetPathPrefix}/<asset file name>`, where assetPathPrefix is declared once at the top of the code and every asset URL interpolates it. These URLs are temporary download sources and expire after 7 days. Download each asset into the project with curl -L, then replace its URL in the generated code with a reference to the downloaded asset. Never use the temporary URLs as runtime image sources.
```
