# Core strengths

- Figma node: `21:1068` (file `tD3pU1vtvSr8akTMJPFLkA`)
- Page: 03 About Us
- Source: Figma MCP `get_design_context` (React + Tailwind reference code, saved verbatim). Treat as a high-fidelity reference, not production code: convert absolute positioning into real layout.
- The temporary `assetPathPrefix` URLs below expire; use the local files in the asset table instead.

## Asset map (code constant -> local file)

| Constant | Figma asset file | Local file (relative to design/) |
|---|---|---|
| `imgEllipse` | `f1f80.svg` | `assets/context/03-about-us/03-core-strengths/imgEllipse.svg` |
| `imgCoreStrengths` | `efac6.png` | `assets/images/svc-mep.png` (shared image) |
| `imgFrame` | `da908.svg` | `assets/context/03-about-us/03-core-strengths/imgFrame.svg` |
| `imgFrame1` | `25878.svg` | `assets/context/03-about-us/03-core-strengths/imgFrame1.svg` |
| `imgFrame2` | `84ac1.svg` | `assets/context/03-about-us/03-core-strengths/imgFrame2.svg` |
| `imgFrame3` | `c2f5a.svg` | `assets/context/03-about-us/03-core-strengths/imgFrame3.svg` |

## Reference code

```jsx
const assetPathPrefix = "https://www.figma.com/api/mcp/asset/70d5069d-36fc-47a0-9ab7-6ecd0cfc3743";
const imgEllipse = `${assetPathPrefix}/f1f80.svg`;
const imgCoreStrengths = `${assetPathPrefix}/efac6.png`;
const imgFrame = `${assetPathPrefix}/da908.svg`;
const imgFrame1 = `${assetPathPrefix}/25878.svg`;
const imgFrame2 = `${assetPathPrefix}/84ac1.svg`;
const imgFrame3 = `${assetPathPrefix}/c2f5a.svg`;

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

export default function CoreStrengths() {
  return (
    <div className="bg-[var(--navy\/950,#011025)] content-stretch flex flex-col gap-[52px] items-center px-[140px] py-[72px] relative size-full" data-node-id="21:1068" data-name="Core strengths">
      <img alt="" className="absolute inset-0 max-w-none object-cover pointer-events-none size-full" src={imgCoreStrengths} />
      <div className="absolute bg-gradient-to-b from-[rgba(1,16,37,0.9)] inset-0 to-[rgba(1,16,37,0.94)]" data-node-id="21:1114" data-name="Overlay" />
      <div className="content-stretch flex flex-col gap-[16px] items-center relative shrink-0" data-node-id="21:1069" data-name="Section head">
        <Eyebrow className="bg-[rgba(255,255,255,0.08)] border border-[rgba(255,255,255,0.16)] border-solid content-stretch flex gap-[8px] items-center px-[14px] py-[6px] relative rounded-[100px] shrink-0" label="Why Choose Us" />
        <p className="[word-break:break-word] font-['Poppins:Bold'] leading-[0] not-italic relative shrink-0 text-[44px] text-[color:var(--white,white)] text-center tracking-[-0.44px] whitespace-nowrap" data-node-id="21:1073">
          <span className="leading-[52px]">{`Our Core `}</span>
          <span className="leading-[52px] text-[#dfa82a]">Strengths</span>
        </p>
        <p className="[word-break:break-word] font-['Poppins:Regular'] leading-[30px] not-italic opacity-70 relative shrink-0 text-[18px] text-[color:var(--white,white)] text-center w-[620px]" data-node-id="21:1074">
          Nearly five decades of building trust, delivering quality, and exceeding expectations across the Gulf region.
        </p>
        <div className="bg-gradient-to-r from-[#dfa82a] h-[3px] relative rounded-[2px] shrink-0 to-[#efcb76] w-[52px]" data-node-id="21:1075" data-name="Divider" />
      </div>
      <div className="content-stretch flex gap-[20px] items-start relative shrink-0 w-full" data-node-id="21:1076" data-name="Frame">
        <div className="bg-[rgba(255,255,255,0.05)] border border-[rgba(255,255,255,0.12)] border-solid content-stretch flex flex-[1_0_0] flex-col gap-[16px] items-start min-w-px px-[26px] py-[28px] relative rounded-[18px] self-stretch" data-node-id="21:1077" data-name="Frame">
          <div className="content-stretch flex items-start justify-between relative shrink-0 w-full" data-node-id="21:1078" data-name="Frame">
            <div className="bg-[rgba(223,168,42,0.15)] border border-[rgba(223,168,42,0.4)] border-solid content-stretch flex items-center justify-center p-[12px] relative rounded-[12px] shrink-0" data-node-id="21:1079" data-name="Frame">
              <div className="relative shrink-0 size-[20px]" data-node-id="21:1080" data-name="Frame">
                <img alt="" className="absolute block inset-0 max-w-none size-full" src={imgFrame} />
              </div>
            </div>
            <p className="[word-break:break-word] font-['Poppins:Bold'] leading-[48px] not-italic opacity-12 relative shrink-0 text-[40px] text-[color:var(--white,white)] tracking-[-0.4px] whitespace-nowrap" data-node-id="21:1082">
              1
            </p>
          </div>
          <p className="[word-break:break-word] font-['Poppins:SemiBold'] leading-[28px] not-italic relative shrink-0 text-[20px] text-[color:var(--white,white)] whitespace-nowrap" data-node-id="21:1083">
            Gulf Market Expertise
          </p>
          <div className="bg-[var(--gold\/500,#dfa82a)] h-[2px] relative shrink-0 w-[28px]" data-node-id="21:1084" data-name="Rectangle" />
          <p className="[word-break:break-word] font-['Poppins:Regular'] leading-[22px] min-w-full not-italic opacity-68 relative shrink-0 text-[14px] text-[color:var(--white,white)] w-[min-content]" data-node-id="21:1085">
            Nearly five decades of deep expertise operating across Gulf markets, understanding local requirements and international standards.
          </p>
        </div>
        <div className="bg-[rgba(255,255,255,0.05)] border border-[rgba(255,255,255,0.12)] border-solid content-stretch flex flex-[1_0_0] flex-col gap-[16px] items-start min-w-px px-[26px] py-[28px] relative rounded-[18px] self-stretch" data-node-id="21:1086" data-name="Frame">
          <div className="content-stretch flex items-start justify-between relative shrink-0 w-full" data-node-id="21:1087" data-name="Frame">
            <div className="bg-[rgba(223,168,42,0.15)] border border-[rgba(223,168,42,0.4)] border-solid content-stretch flex items-center justify-center p-[12px] relative rounded-[12px] shrink-0" data-node-id="21:1088" data-name="Frame">
              <div className="relative shrink-0 size-[20px]" data-node-id="21:1089" data-name="Frame">
                <img alt="" className="absolute block inset-0 max-w-none size-full" src={imgFrame1} />
              </div>
            </div>
            <p className="[word-break:break-word] font-['Poppins:Bold'] leading-[48px] not-italic opacity-12 relative shrink-0 text-[40px] text-[color:var(--white,white)] tracking-[-0.4px] whitespace-nowrap" data-node-id="21:1091">
              2
            </p>
          </div>
          <p className="[word-break:break-word] font-['Poppins:SemiBold'] leading-[28px] not-italic relative shrink-0 text-[20px] text-[color:var(--white,white)] whitespace-nowrap" data-node-id="21:1092">
            Proven Track Record
          </p>
          <div className="bg-[var(--gold\/500,#dfa82a)] h-[2px] relative shrink-0 w-[28px]" data-node-id="21:1093" data-name="Rectangle" />
          <p className="[word-break:break-word] font-['Poppins:Regular'] leading-[22px] min-w-full not-italic opacity-68 relative shrink-0 text-[14px] text-[color:var(--white,white)] w-[min-content]" data-node-id="21:1094">
            Over 100 completed projects with a reputation for exceptional performance and dependable specialist MEP contracting.
          </p>
        </div>
        <div className="bg-[rgba(255,255,255,0.05)] border border-[rgba(255,255,255,0.12)] border-solid content-stretch flex flex-[1_0_0] flex-col gap-[16px] items-start min-w-px px-[26px] py-[28px] relative rounded-[18px] self-stretch" data-node-id="21:1095" data-name="Frame">
          <div className="content-stretch flex items-start justify-between relative shrink-0 w-full" data-node-id="21:1096" data-name="Frame">
            <div className="bg-[rgba(223,168,42,0.15)] border border-[rgba(223,168,42,0.4)] border-solid content-stretch flex items-center justify-center p-[12px] relative rounded-[12px] shrink-0" data-node-id="21:1097" data-name="Frame">
              <div className="relative shrink-0 size-[20px]" data-node-id="21:1098" data-name="Frame">
                <img alt="" className="absolute block inset-0 max-w-none size-full" src={imgFrame2} />
              </div>
            </div>
            <p className="[word-break:break-word] font-['Poppins:Bold'] leading-[48px] not-italic opacity-12 relative shrink-0 text-[40px] text-[color:var(--white,white)] tracking-[-0.4px] whitespace-nowrap" data-node-id="21:1100">
              3
            </p>
          </div>
          <p className="[word-break:break-word] font-['Poppins:SemiBold'] leading-[28px] not-italic relative shrink-0 text-[20px] text-[color:var(--white,white)] whitespace-nowrap" data-node-id="21:1101">{`Quality & Reliability`}</p>
          <div className="bg-[var(--gold\/500,#dfa82a)] h-[2px] relative shrink-0 w-[28px]" data-node-id="21:1102" data-name="Rectangle" />
          <p className="[word-break:break-word] font-['Poppins:Regular'] leading-[22px] min-w-full not-italic opacity-68 relative shrink-0 text-[14px] text-[color:var(--white,white)] w-[min-content]" data-node-id="21:1103">
            Strong reputation for quality, reliability, and timely delivery — strictly conforming to international standards.
          </p>
        </div>
        <div className="bg-[rgba(255,255,255,0.05)] border border-[rgba(255,255,255,0.12)] border-solid content-stretch flex flex-[1_0_0] flex-col gap-[16px] items-start min-w-px px-[26px] py-[28px] relative rounded-[18px] self-stretch" data-node-id="21:1104" data-name="Frame">
          <div className="content-stretch flex items-start justify-between relative shrink-0 w-full" data-node-id="21:1105" data-name="Frame">
            <div className="bg-[rgba(223,168,42,0.15)] border border-[rgba(223,168,42,0.4)] border-solid content-stretch flex items-center justify-center p-[12px] relative rounded-[12px] shrink-0" data-node-id="21:1106" data-name="Frame">
              <div className="relative shrink-0 size-[20px]" data-node-id="21:1107" data-name="Frame">
                <img alt="" className="absolute block inset-0 max-w-none size-full" src={imgFrame3} />
              </div>
            </div>
            <p className="[word-break:break-word] font-['Poppins:Bold'] leading-[48px] not-italic opacity-12 relative shrink-0 text-[40px] text-[color:var(--white,white)] tracking-[-0.4px] whitespace-nowrap" data-node-id="21:1109">
              4
            </p>
          </div>
          <p className="[word-break:break-word] font-['Poppins:SemiBold'] leading-[28px] not-italic relative shrink-0 text-[20px] text-[color:var(--white,white)] whitespace-nowrap" data-node-id="21:1110">
            In-House Execution
          </p>
          <div className="bg-[var(--gold\/500,#dfa82a)] h-[2px] relative shrink-0 w-[28px]" data-node-id="21:1111" data-name="Rectangle" />
          <p className="[word-break:break-word] font-['Poppins:Regular'] leading-[22px] min-w-full not-italic opacity-68 relative shrink-0 text-[14px] text-[color:var(--white,white)] w-[min-content]" data-node-id="21:1112">
            85% of MEP work is self-performed by our in-house engineers, minimizing risks and ensuring consistent quality.
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
These styles are contained in the design: Label/Eyebrow: Font(family: "Poppins", style: SemiBold, size: 12, weight: 600, lineHeight: 16, letterSpacing: 8), Heading/H2: Font(family: "Poppins", style: Bold, size: 44, weight: 700, lineHeight: 52, letterSpacing: -1), Body/L: Font(family: "Poppins", style: Regular, size: 18, weight: 400, lineHeight: 30, letterSpacing: 0), Stat/M: Font(family: "Poppins", style: Bold, size: 40, weight: 700, lineHeight: 48, letterSpacing: -1), Heading/H4: Font(family: "Poppins", style: SemiBold, size: 20, weight: 600, lineHeight: 28, letterSpacing: 0), Body/S: Font(family: "Poppins", style: Regular, size: 14, weight: 400, lineHeight: 22, letterSpacing: 0).
```

```text
The generated code contains image and SVG URL constants, e.g. const image = `${assetPathPrefix}/<asset file name>`, where assetPathPrefix is declared once at the top of the code and every asset URL interpolates it. These URLs are temporary download sources and expire after 7 days. Download each asset into the project with curl -L, then replace its URL in the generated code with a reference to the downloaded asset. Never use the temporary URLs as runtime image sources.
```
