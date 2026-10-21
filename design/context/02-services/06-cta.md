# CTA

- Figma node: `24:1677` (file `tD3pU1vtvSr8akTMJPFLkA`)
- Page: 02 Services
- Source: Figma MCP `get_design_context` (React + Tailwind reference code, saved verbatim). Treat as a high-fidelity reference, not production code: convert absolute positioning into real layout.
- The temporary `assetPathPrefix` URLs below expire; use the local files in the asset table instead.

## Asset map (code constant -> local file)

| Constant | Figma asset file | Local file (relative to design/) |
|---|---|---|
| `imgArrow` | `eb39c.svg` | `assets/context/02-services/06-cta/imgArrow.svg` |
| `imgArrow1` | `7d578.svg` | `assets/context/02-services/06-cta/imgArrow1.svg` |
| `imgCta` | `c663e.png` | `assets/images/proj-tower.png` (shared image) |

## Reference code

```jsx
const assetPathPrefix = "https://www.figma.com/api/mcp/asset/6cd32601-0177-49e4-aecb-5a5581f177ff";
const imgArrow = `${assetPathPrefix}/eb39c.svg`;
const imgArrow1 = `${assetPathPrefix}/7d578.svg`;
const imgCta = `${assetPathPrefix}/c663e.png`;

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

export default function Cta() {
  return (
    <div className="bg-[var(--navy\/950,#011025)] content-stretch flex flex-col gap-[24px] items-center py-[83px] relative size-full" data-node-id="24:1677" data-name="CTA">
      <img alt="" className="absolute inset-0 max-w-none object-cover pointer-events-none size-full" src={imgCta} />
      <div className="absolute bg-gradient-to-b from-[rgba(1,16,37,0.9)] inset-0 to-[rgba(1,16,37,0.85)]" data-node-id="24:1690" data-name="Overlay" />
      <div className="[word-break:break-word] font-['Poppins:Bold'] leading-[0] not-italic relative shrink-0 text-[0px] text-[color:var(--white,white)] text-center tracking-[-0.672px] w-[900px]" data-node-id="24:1678">
        <p className="leading-[64px] mb-0 text-[56px]">Ready to Build</p>
        <p className="leading-[64px] text-[#dfa82a] text-[56px]">Your Next Project?</p>
      </div>
      <p className="[word-break:break-word] font-['Poppins:Regular'] leading-[30px] not-italic opacity-72 relative shrink-0 text-[18px] text-[color:var(--white,white)] text-center w-[560px]" data-node-id="24:1679">
        Let our 45+ years of MEP expertise work for your next construction or infrastructure project. Get in touch for a free consultation.
      </p>
      <div className="content-stretch flex gap-[14px] items-start relative shrink-0" data-node-id="24:1680" data-name="Frame">
        <Button className="bg-[var(--gold\/500,#dfa82a)] content-stretch cursor-pointer drop-shadow-[0px_8px_10px_rgba(223,168,42,0.35)] flex gap-[10px] items-center justify-center pl-[26px] pr-[24px] py-[14px] relative rounded-[8px] shrink-0" label="Contact Us Today" />
        <Button className="bg-[rgba(255,255,255,0.08)] border border-[rgba(255,255,255,0.28)] border-solid content-stretch flex gap-[10px] items-center justify-center pl-[26px] pr-[24px] py-[14px] relative rounded-[8px] shrink-0" label="Call Us Now" showArrow={false} variant="Glass" />
      </div>
      <div className="absolute flex items-center justify-center left-[230px] size-[109.1px] top-[68.23px]" data-node-id="24:1691">
        <div className="-rotate-14 flex-none">
          <div className="border-[1.2px] border-[rgba(255,255,255,0.22)] border-solid relative rounded-[14px] size-[90px]" data-name="Deco square" />
        </div>
      </div>
      <div className="absolute flex items-center justify-center left-[289.58px] size-[69.507px] top-[330px]" data-node-id="24:1692">
        <div className="flex-none rotate-10">
          <div className="border-[1.2px] border-[rgba(255,255,255,0.22)] border-solid relative rounded-[14px] size-[60px]" data-name="Deco square" />
        </div>
      </div>
      <div className="absolute flex items-center justify-center left-[1098.23px] size-[109.1px] top-[90px]" data-node-id="24:1693">
        <div className="flex-none rotate-14">
          <div className="border-[1.2px] border-[rgba(255,255,255,0.22)] border-solid relative rounded-[14px] size-[90px]" data-name="Deco square" />
        </div>
      </div>
      <div className="absolute flex items-center justify-center left-[1080px] size-[71.164px] top-[317.53px]" data-node-id="24:1694">
        <div className="-rotate-12 flex-none">
          <div className="border-[1.2px] border-[rgba(255,255,255,0.22)] border-solid relative rounded-[14px] size-[60px]" data-name="Deco square" />
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
These styles are contained in the design: Display/L: Font(family: "Poppins", style: Bold, size: 56, weight: 700, lineHeight: 64, letterSpacing: -1.2000000476837158), Body/L: Font(family: "Poppins", style: Regular, size: 18, weight: 400, lineHeight: 30, letterSpacing: 0), Label/Button: Font(family: "Poppins", style: SemiBold, size: 15, weight: 600, lineHeight: 22, letterSpacing: 0).
```

```text
The generated code contains image and SVG URL constants, e.g. const image = `${assetPathPrefix}/<asset file name>`, where assetPathPrefix is declared once at the top of the code and every asset URL interpolates it. These URLs are temporary download sources and expire after 7 days. Download each asset into the project with curl -L, then replace its URL in the generated code with a reference to the downloaded asset. Never use the temporary URLs as runtime image sources.
```
