# Our story

- Figma node: `21:1046` (file `tD3pU1vtvSr8akTMJPFLkA`)
- Page: 03 About Us
- Source: Figma MCP `get_design_context` (React + Tailwind reference code, saved verbatim). Treat as a high-fidelity reference, not production code: convert absolute positioning into real layout.
- The temporary `assetPathPrefix` URLs below expire; use the local files in the asset table instead.

## Asset map (code constant -> local file)

| Constant | Figma asset file | Local file (relative to design/) |
|---|---|---|
| `imgEllipse` | `f1f80.svg` | `assets/context/03-about-us/02-our-story/imgEllipse.svg` |
| `imgRectangle` | `7cda0.png` | `assets/images/about-team.png` (shared image) |
| `imgFrame` | `b67d9.svg` | `assets/context/03-about-us/02-our-story/imgFrame.svg` |

## Reference code

```jsx
const assetPathPrefix = "https://www.figma.com/api/mcp/asset/ba2f77a5-7726-454c-b9bc-00fb7950beef";
const imgEllipse = `${assetPathPrefix}/f1f80.svg`;
const imgRectangle = `${assetPathPrefix}/7cda0.png`;
const imgFrame = `${assetPathPrefix}/b67d9.svg`;

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

export default function OurStory() {
  return (
    <div className="bg-[var(--white,white)] content-stretch flex gap-[64px] items-center pb-[72px] pt-[56px] px-[140px] relative size-full" data-node-id="21:1046" data-name="Our story">
      <div className="h-[440px] relative shrink-0 w-[540px]" data-node-id="21:1047" data-name="Visual">
        <div className="absolute left-[-12px] size-[80px] top-[-12px]" data-node-id="21:1048" data-name="Frame">
          <img alt="" className="absolute block inset-0 max-w-none size-full" src={imgFrame} />
        </div>
        <div className="absolute h-[420px] left-[8px] rounded-[18px] shadow-[0px_24px_50px_0px_rgba(1,16,37,0.18)] top-[8px] w-[520px]" data-node-id="21:1050" data-name="Rectangle">
          <img alt="" className="absolute inset-0 max-w-none object-cover pointer-events-none rounded-[18px] size-full" src={imgRectangle} />
        </div>
        <div className="[word-break:break-word] absolute bg-[var(--white,white)] content-stretch drop-shadow-[0px_18px_20px_rgba(1,16,37,0.16)] flex flex-col gap-[2px] items-center left-[370px] not-italic px-[26px] py-[18px] rounded-[16px] top-[360px] whitespace-nowrap" data-node-id="21:1051" data-name="Badge">
          <p className="font-['Poppins:Bold'] leading-[48px] relative shrink-0 text-[40px] text-[color:var(--gold\/500,#dfa82a)] tracking-[-0.4px]" data-node-id="21:1052">
            45+
          </p>
          <p className="font-['Poppins:Regular'] leading-[22px] relative shrink-0 text-[14px] text-[color:var(--text\/body,#5b6475)]" data-node-id="21:1053">
            Years Experience
          </p>
        </div>
      </div>
      <div className="content-stretch flex flex-[1_0_0] flex-col gap-[20px] items-start min-w-px relative" data-node-id="21:1054" data-name="Frame">
        <div className="content-stretch flex flex-col gap-[16px] items-start relative shrink-0" data-node-id="21:1055" data-name="Section head">
          <Eyebrow className="bg-[var(--gold\/50,#fbf4e3)] border border-[rgba(239,203,118,0.6)] border-solid content-stretch flex gap-[8px] items-center px-[14px] py-[6px] relative rounded-[100px] shrink-0" label="Our Story" />
          <p className="[word-break:break-word] font-['Poppins:Bold'] leading-[0] not-italic relative shrink-0 text-[44px] text-[color:var(--navy\/950,#011025)] tracking-[-0.44px] w-[540px]" data-node-id="21:1059">
            <span className="leading-[52px]">{`Engineering Excellence `}</span>
            <span className="leading-[52px] text-[#dfa82a]">Since 1979</span>
          </p>
          <div className="bg-gradient-to-r from-[#dfa82a] h-[3px] relative rounded-[2px] shrink-0 to-[#efcb76] w-[52px]" data-node-id="21:1060" data-name="Divider" />
        </div>
        <p className="[word-break:break-word] font-['Poppins:Regular'] leading-[26px] not-italic relative shrink-0 text-[16px] text-[color:var(--text\/body,#5b6475)] w-[560px]" data-node-id="21:1061">
          Al Jazira for Imdad Smart Company (formerly known as IMDAD Group) is a leading name in the MEP construction sector in the Gulf region. With over 45 years of proven experience, the company continues to specialize in Mechanical and Electrical construction, offering complete, collaborative, and end-to-end solutions that bring life to new buildings and sustain existing ones.
        </p>
        <p className="[word-break:break-word] font-['Poppins:Regular'] leading-[26px] not-italic relative shrink-0 text-[16px] text-[color:var(--text\/body,#5b6475)] w-[560px]" data-node-id="21:1062">
          Starting as IMDAD sanitary works in KSA, the company diversified and constantly followed the market. For over 45 years, the team has been reinforcing its international presence in the Gulf, expanding its in-house expertise and enlarging its scope of MEP Engineering services.
        </p>
        <div className="content-stretch flex gap-[18px] items-start relative shrink-0 w-full" data-node-id="21:1063" data-name="Quote">
          <div className="bg-[var(--gold\/500,#dfa82a)] relative self-stretch shrink-0 w-[3px]" data-node-id="21:1064" data-name="Rectangle" />
          <div className="[word-break:break-word] content-stretch flex flex-[1_0_0] flex-col gap-[8px] items-start min-w-px relative" data-node-id="21:1065" data-name="Frame">
            <p className="font-['Poppins:Italic'] italic leading-[26px] relative shrink-0 text-[16px] text-[color:var(--navy\/950,#011025)] w-[520px]" data-node-id="21:1066">
              “Developing and serving society with the highest levels of professional integrity and commitment.”
            </p>
            <p className="font-['Poppins:SemiBold'] leading-[16px] not-italic relative shrink-0 text-[12px] text-[color:var(--gold\/600,#c38f1c)] tracking-[1.2px] uppercase whitespace-nowrap" data-node-id="21:1067">
              Mr. Rashwan Mahmoud — Founder
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
These styles are contained in the design: Stat/M: Font(family: "Poppins", style: Bold, size: 40, weight: 700, lineHeight: 48, letterSpacing: -1), Body/S: Font(family: "Poppins", style: Regular, size: 14, weight: 400, lineHeight: 22, letterSpacing: 0), Label/Eyebrow: Font(family: "Poppins", style: SemiBold, size: 12, weight: 600, lineHeight: 16, letterSpacing: 8), Heading/H2: Font(family: "Poppins", style: Bold, size: 44, weight: 700, lineHeight: 52, letterSpacing: -1), Body/M: Font(family: "Poppins", style: Regular, size: 16, weight: 400, lineHeight: 26, letterSpacing: 0), Body/Quote: Font(family: "Poppins", style: Italic, size: 16, weight: 400, lineHeight: 26, letterSpacing: 0), Label/Caps: Font(family: "Poppins", style: SemiBold, size: 12, weight: 600, lineHeight: 16, letterSpacing: 10).
```

```text
The generated code contains image and SVG URL constants, e.g. const image = `${assetPathPrefix}/<asset file name>`, where assetPathPrefix is declared once at the top of the code and every asset URL interpolates it. These URLs are temporary download sources and expire after 7 days. Download each asset into the project with curl -L, then replace its URL in the generated code with a reference to the downloaded asset. Never use the temporary URLs as runtime image sources.
```
