# Hero

- Figma node: `17:199` (file `tD3pU1vtvSr8akTMJPFLkA`)
- Page: 01 Home
- Source: Figma MCP `get_design_context` (React + Tailwind reference code, saved verbatim). Treat as a high-fidelity reference, not production code: convert absolute positioning into real layout.
- The temporary `assetPathPrefix` URLs below expire; use the local files in the asset table instead.

## Asset map (code constant -> local file)

| Constant | Figma asset file | Local file (relative to design/) |
|---|---|---|
| `imgArrow` | `eb39c.svg` | `assets/context/01-home/01-hero/imgArrow.svg` |
| `imgArrow1` | `7d578.svg` | `assets/context/01-home/01-hero/imgArrow1.svg` |
| `imgEllipse` | `f1f80.svg` | `assets/context/01-home/01-hero/imgEllipse.svg` |
| `imgHero` | `fb7bc.png` | `assets/images/hero-city.png` (shared image) |
| `imgGoldGlow` | `b6263.svg` | `assets/context/01-home/01-hero/imgGoldGlow.svg` |
| `imgFrame` | `7b1e6.svg` | `assets/context/01-home/01-hero/imgFrame.svg` |

## Reference code

```jsx
const assetPathPrefix = "https://www.figma.com/api/mcp/asset/3e848012-eee6-432c-ae90-84fab141d265";
const imgArrow = `${assetPathPrefix}/eb39c.svg`;
const imgArrow1 = `${assetPathPrefix}/7d578.svg`;
const imgEllipse = `${assetPathPrefix}/f1f80.svg`;
const imgHero = `${assetPathPrefix}/fb7bc.png`;
const imgGoldGlow = `${assetPathPrefix}/b6263.svg`;
const imgFrame = `${assetPathPrefix}/7b1e6.svg`;

type ButtonProps = {
  className?: string;
  label?: string;
  showArrow?: boolean;
  state?: "Default";
  variant?: "Gold" | "Glass";
};

function Button({ className, label = "Get a Quote", showArrow = true, state = "Default", variant = "Gold" }: ButtonProps) {
  const isGlassAndDefault = variant === "Glass" && state === "Default";
  const isGoldAndDefault = variant === "Gold" && state === "Default";
  return (
    <div className={className || `content-stretch flex gap-[10px] items-center justify-center pl-[26px] pr-[24px] py-[14px] relative rounded-[8px] ${isGlassAndDefault ? "bg-[rgba(255,255,255,0.08)] border border-[rgba(255,255,255,0.28)] border-solid" : String.raw`bg-[var(--gold\/500,#dfa82a)] drop-shadow-[0px_8px_10px_rgba(223,168,42,0.35)]`}`} id={isGlassAndDefault ? "node-12_20" : "node-12_4"}>
      {isGoldAndDefault && (
        <p className="[word-break:break-word] font-['Poppins:SemiBold'] leading-[22px] not-italic relative shrink-0 text-[15px] text-[color:var(--navy\/950,#011025)] whitespace-nowrap" data-node-id="12:5">
          {label}
        </p>
      )}
      {isGoldAndDefault && showArrow && (
        <div className="relative shrink-0 size-[18px]" data-node-id="12:6" data-name="Arrow">
          <img alt="" className="absolute block inset-0 max-w-none size-full" src={imgArrow} />
        </div>
      )}
      {isGlassAndDefault && (
        <p className="[word-break:break-word] font-['Poppins:SemiBold'] leading-[22px] not-italic relative shrink-0 text-[15px] text-[color:var(--white,white)] whitespace-nowrap" data-node-id="12:21">
          {label}
        </p>
      )}
      {isGlassAndDefault && showArrow && (
        <div className="relative shrink-0 size-[18px]" data-node-id="12:22" data-name="Arrow">
          <img alt="" className="absolute block inset-0 max-w-none size-full" src={imgArrow1} />
        </div>
      )}
    </div>
  );
}

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

export default function Hero() {
  return (
    <div className="bg-[var(--navy\/950,#011025)] content-stretch flex flex-col gap-[28px] items-center justify-center pb-[90px] pt-[200px] relative size-full" data-node-id="17:199" data-name="Hero">
      <img alt="" className="absolute inset-0 max-w-none object-cover pointer-events-none size-full" src={imgHero} />
      <div className="absolute bg-gradient-to-b from-[rgba(1,16,37,0.75)] inset-0 to-[rgba(1,16,37,0.92)] via-[55%] via-[rgba(1,16,37,0.6)]" data-node-id="17:220" data-name="Overlay" />
      <div className="absolute left-[370px] size-[700px] top-[120px]" data-node-id="17:221" data-name="Gold glow">
        <img alt="" className="absolute block inset-0 max-w-none size-full" src={imgGoldGlow} />
      </div>
      <Eyebrow className="bg-[rgba(255,255,255,0.08)] border border-[rgba(255,255,255,0.16)] border-solid content-stretch flex gap-[8px] items-center px-[14px] py-[6px] relative rounded-[100px] shrink-0" label="45+ Years of Engineering Excellence" />
      <div className="[word-break:break-word] font-['Poppins:Bold'] leading-[0] not-italic relative shrink-0 text-[0px] text-[color:var(--white,white)] text-center tracking-[-1.08px] w-[1000px]" data-node-id="17:203">
        <p className="leading-[80px] mb-0 text-[72px]">Building the Future</p>
        <p className="leading-[80px] text-[#dfa82a] text-[72px]">with Smart Solutions</p>
      </div>
      <p className="[word-break:break-word] font-['Poppins:Regular'] leading-[30px] not-italic opacity-75 relative shrink-0 text-[18px] text-[color:var(--white,white)] text-center w-[640px]" data-node-id="17:204">
        Al Jazira for Imdad Smart Company is a leading MEP contractor in the Gulf region, delivering world-class mechanical, electrical, and plumbing solutions with over four decades of proven excellence.
      </p>
      <div className="content-stretch cursor-pointer flex gap-[16px] items-start relative shrink-0" data-node-id="17:205" data-name="Frame">
        <Button className="bg-[var(--gold\/500,#dfa82a)] content-stretch drop-shadow-[0px_8px_10px_rgba(223,168,42,0.35)] flex gap-[10px] items-center justify-center pl-[26px] pr-[24px] py-[14px] relative rounded-[8px] shrink-0" label="Explore Our Services" />
        <Button className="bg-[rgba(255,255,255,0.08)] border border-[rgba(255,255,255,0.28)] border-solid content-stretch flex gap-[10px] items-center justify-center pl-[26px] pr-[24px] py-[14px] relative rounded-[8px] shrink-0" label="View Projects" variant="Glass" />
      </div>
      <div className="h-[60px] relative shrink-0 w-[10px]" data-node-id="17:214" data-name="Frame" />
      <button className="content-stretch cursor-pointer flex flex-col gap-[8px] items-center relative shrink-0" data-node-id="17:215" data-name="Scroll hint">
        <p className="[word-break:break-word] font-['Poppins:SemiBold'] leading-[16px] not-italic opacity-55 relative shrink-0 text-[12px] text-[color:var(--white,white)] text-left tracking-[1.2px] uppercase whitespace-nowrap" data-node-id="17:216">
          Scroll to explore
        </p>
        <div className="relative shrink-0 size-[18px]" data-node-id="17:217" data-name="Frame">
          <img alt="" className="absolute block inset-0 max-w-none size-full" src={imgFrame} />
        </div>
      </button>
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
These styles are contained in the design: Label/Eyebrow: Font(family: "Poppins", style: SemiBold, size: 12, weight: 600, lineHeight: 16, letterSpacing: 8), Display/XL: Font(family: "Poppins", style: Bold, size: 72, weight: 700, lineHeight: 80, letterSpacing: -1.5), Body/L: Font(family: "Poppins", style: Regular, size: 18, weight: 400, lineHeight: 30, letterSpacing: 0), Label/Button: Font(family: "Poppins", style: SemiBold, size: 15, weight: 600, lineHeight: 22, letterSpacing: 0), Label/Caps: Font(family: "Poppins", style: SemiBold, size: 12, weight: 600, lineHeight: 16, letterSpacing: 10).
```

```text
The generated code contains image and SVG URL constants, e.g. const image = `${assetPathPrefix}/<asset file name>`, where assetPathPrefix is declared once at the top of the code and every asset URL interpolates it. These URLs are temporary download sources and expire after 7 days. Download each asset into the project with curl -L, then replace its URL in the generated code with a reference to the downloaded asset. Never use the temporary URLs as runtime image sources.
```
