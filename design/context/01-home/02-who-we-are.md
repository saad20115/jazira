# Who we are

- Figma node: `17:222` (file `tD3pU1vtvSr8akTMJPFLkA`)
- Page: 01 Home
- Source: Figma MCP `get_design_context` (React + Tailwind reference code, saved verbatim). Treat as a high-fidelity reference, not production code: convert absolute positioning into real layout.
- The temporary `assetPathPrefix` URLs below expire; use the local files in the asset table instead.

## Asset map (code constant -> local file)

| Constant | Figma asset file | Local file (relative to design/) |
|---|---|---|
| `imgArrow` | `7d578.svg` | `assets/context/01-home/02-who-we-are/imgArrow.svg` |
| `imgEllipse` | `f1f80.svg` | `assets/context/01-home/02-who-we-are/imgEllipse.svg` |
| `imgImage` | `7cda0.png` | `assets/images/about-team.png` (shared image) |
| `imgCornerBracket` | `b67d9.svg` | `assets/context/01-home/02-who-we-are/imgCornerBracket.svg` |

## Reference code

```jsx
const assetPathPrefix = "https://www.figma.com/api/mcp/asset/8db7c86e-e0ff-4268-8096-8571d74e5fdb";
const imgArrow = `${assetPathPrefix}/7d578.svg`;
const imgEllipse = `${assetPathPrefix}/f1f80.svg`;
const imgImage = `${assetPathPrefix}/7cda0.png`;
const imgCornerBracket = `${assetPathPrefix}/b67d9.svg`;

type ButtonProps = {
  className?: string;
  label?: string;
  showArrow?: boolean;
  state?: "Default";
  variant?: "Dark";
};

function Button({ className, label = "Get a Quote", showArrow = true, state = "Default", variant = "Dark" }: ButtonProps) {
  return (
    <div className={className || "bg-[var(--navy\\/950,#011025)] content-stretch flex gap-[10px] items-center justify-center pl-[26px] pr-[24px] py-[14px] relative rounded-[8px]"} data-node-id="12:12">
      <p className="[word-break:break-word] font-['Poppins:SemiBold'] leading-[22px] not-italic relative shrink-0 text-[15px] text-[color:var(--white,white)] whitespace-nowrap" data-node-id="12:13">
        {label}
      </p>
      {showArrow && (
        <div className="relative shrink-0 size-[18px]" data-node-id="12:14" data-name="Arrow">
          <img alt="" className="absolute block inset-0 max-w-none size-full" src={imgArrow} />
        </div>
      )}
    </div>
  );
}

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

export default function WhoWeAre() {
  return (
    <div className="bg-[var(--white,white)] content-stretch flex gap-[64px] items-center px-[140px] py-[78px] relative size-full" data-node-id="17:222" data-name="Who we are">
      <div className="h-[440px] relative shrink-0 w-[560px]" data-node-id="17:223" data-name="Visual">
        <div className="absolute left-[-12px] size-[80px] top-[-12px]" data-node-id="17:224" data-name="Corner bracket">
          <img alt="" className="absolute block inset-0 max-w-none size-full" src={imgCornerBracket} />
        </div>
        <div className="absolute h-[410px] left-[8px] rounded-[18px] shadow-[0px_24px_50px_0px_rgba(1,16,37,0.18)] top-[8px] w-[540px]" data-node-id="17:226" data-name="Image">
          <img alt="" className="absolute inset-0 max-w-none object-cover pointer-events-none rounded-[18px] size-full" src={imgImage} />
        </div>
        <div className="[word-break:break-word] absolute bg-[var(--white,white)] content-stretch drop-shadow-[0px_18px_20px_rgba(1,16,37,0.16)] flex flex-col gap-[2px] items-center left-[380px] not-italic px-[26px] py-[18px] rounded-[16px] top-[350px] whitespace-nowrap" data-node-id="17:227" data-name="Badge">
          <p className="font-['Poppins:Bold'] leading-[48px] relative shrink-0 text-[40px] text-[color:var(--gold\/500,#dfa82a)] tracking-[-0.4px]" data-node-id="17:228">
            45+
          </p>
          <p className="font-['Poppins:Regular'] leading-[22px] relative shrink-0 text-[14px] text-[color:var(--text\/body,#5b6475)]" data-node-id="17:229">
            Years Experience
          </p>
        </div>
      </div>
      <div className="content-stretch flex flex-[1_0_0] flex-col gap-[20px] items-start min-w-px relative" data-node-id="17:230" data-name="Frame">
        <Eyebrow className="bg-[var(--gold\/50,#fbf4e3)] border border-[rgba(239,203,118,0.6)] border-solid content-stretch flex gap-[8px] items-center px-[14px] py-[6px] relative rounded-[100px] shrink-0" label="Who We Are" />
        <p className="[word-break:break-word] font-['Poppins:Bold'] leading-[0] not-italic relative shrink-0 text-[44px] text-[color:var(--navy\/950,#011025)] tracking-[-0.44px] w-[520px]" data-node-id="17:234">
          <span className="leading-[52px]">{`Engineering Excellence `}</span>
          <span className="leading-[52px] text-[#dfa82a]">Since 1979</span>
        </p>
        <p className="[word-break:break-word] font-['Poppins:Regular'] leading-[26px] not-italic relative shrink-0 text-[16px] text-[color:var(--text\/body,#5b6475)] w-[540px]" data-node-id="17:235">
          With nearly five decades of expertise in Gulf markets, Al Jazira for Imdad Smart Company has rapidly expanded and grown from strength to strength, delivering exceptional performance and earning a reputation as a highly dependable specialist MEP contractor.
        </p>
        <p className="[word-break:break-word] font-['Poppins:Regular'] leading-[26px] not-italic relative shrink-0 text-[16px] text-[color:var(--text\/body,#5b6475)] w-[540px]" data-node-id="17:236">
          We deliver comprehensive MEP packages through our in-house engineers, minimizing reliance on subcontractors and ensuring better quality, service, and on-time delivery.
        </p>
        <Button className="bg-[var(--navy\/950,#011025)] content-stretch cursor-pointer flex gap-[10px] items-center justify-center pl-[26px] pr-[24px] py-[14px] relative rounded-[8px] shrink-0" label="Learn More About Us" />
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
These styles are contained in the design: Stat/M: Font(family: "Poppins", style: Bold, size: 40, weight: 700, lineHeight: 48, letterSpacing: -1), Body/S: Font(family: "Poppins", style: Regular, size: 14, weight: 400, lineHeight: 22, letterSpacing: 0), Label/Eyebrow: Font(family: "Poppins", style: SemiBold, size: 12, weight: 600, lineHeight: 16, letterSpacing: 8), Heading/H2: Font(family: "Poppins", style: Bold, size: 44, weight: 700, lineHeight: 52, letterSpacing: -1), Body/M: Font(family: "Poppins", style: Regular, size: 16, weight: 400, lineHeight: 26, letterSpacing: 0), Label/Button: Font(family: "Poppins", style: SemiBold, size: 15, weight: 600, lineHeight: 22, letterSpacing: 0).
```

```text
The generated code contains image and SVG URL constants, e.g. const image = `${assetPathPrefix}/<asset file name>`, where assetPathPrefix is declared once at the top of the code and every asset URL interpolates it. These URLs are temporary download sources and expire after 7 days. Download each asset into the project with curl -L, then replace its URL in the generated code with a reference to the downloaded asset. Never use the temporary URLs as runtime image sources.
```
