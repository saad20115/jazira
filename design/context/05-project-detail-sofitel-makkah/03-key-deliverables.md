# Key deliverables

- Figma node: `20:947` (file `tD3pU1vtvSr8akTMJPFLkA`)
- Page: 05 Project Detail – Sofitel Makkah
- Source: Figma MCP `get_design_context` (React + Tailwind reference code, saved verbatim). Treat as a high-fidelity reference, not production code: convert absolute positioning into real layout.
- The temporary `assetPathPrefix` URLs below expire; use the local files in the asset table instead.

## Asset map (code constant -> local file)

| Constant | Figma asset file | Local file (relative to design/) |
|---|---|---|
| `imgEllipse` | `f1f80.svg` | `assets/context/05-project-detail-sofitel-makkah/03-key-deliverables/imgEllipse.svg` |
| `imgKeyDeliverables` | `2f8f8.png` | `assets/images/bg-pipes.png` (shared image) |
| `imgFrame` | `f25de.svg` | `assets/context/05-project-detail-sofitel-makkah/03-key-deliverables/imgFrame.svg` |

## Reference code

```jsx
const assetPathPrefix = "https://www.figma.com/api/mcp/asset/fd80efd2-6470-44fb-9546-1e2b2dd826d7";
const imgEllipse = `${assetPathPrefix}/f1f80.svg`;
const imgKeyDeliverables = `${assetPathPrefix}/2f8f8.png`;
const imgFrame = `${assetPathPrefix}/f25de.svg`;

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

export default function KeyDeliverables() {
  return (
    <div className="bg-[var(--navy\/950,#011025)] content-stretch flex flex-col gap-[36px] items-start px-[140px] py-[65px] relative size-full" data-node-id="20:947" data-name="Key deliverables">
      <img alt="" className="absolute inset-0 max-w-none object-cover pointer-events-none size-full" src={imgKeyDeliverables} />
      <div className="absolute bg-gradient-to-b from-[rgba(1,16,37,0.9)] inset-0 to-[rgba(1,16,37,0.94)]" data-node-id="20:975" data-name="Overlay" />
      <div className="content-stretch flex flex-col gap-[14px] items-start relative shrink-0" data-node-id="20:948" data-name="Frame">
        <Eyebrow className="bg-[rgba(255,255,255,0.08)] border border-[rgba(255,255,255,0.16)] border-solid content-stretch flex gap-[8px] items-center px-[14px] py-[6px] relative rounded-[100px] shrink-0" label="Engineering Scope" />
        <p className="[word-break:break-word] font-['Poppins:Bold'] leading-[52px] not-italic relative shrink-0 text-[44px] text-[color:var(--white,white)] tracking-[-0.44px] whitespace-nowrap" data-node-id="20:952">{`Key Deliverables & Technical Highlights`}</p>
      </div>
      <div className="content-start flex flex-wrap gap-[20px] items-start relative shrink-0 w-full" data-node-id="20:953" data-name="Frame">
        <div className="bg-[rgba(255,255,255,0.05)] border border-[rgba(255,255,255,0.12)] border-solid content-stretch flex gap-[14px] h-[80px] items-center p-[20px] relative rounded-[14px] shrink-0 w-[570px]" data-node-id="20:954" data-name="Frame">
          <div className="bg-[rgba(223,168,42,0.15)] border border-[rgba(223,168,42,0.4)] border-solid content-stretch flex items-center justify-center p-[12px] relative rounded-[12px] shrink-0" data-node-id="20:955" data-name="Frame">
            <div className="relative shrink-0 size-[20px]" data-node-id="20:956" data-name="Frame">
              <img alt="" className="absolute block inset-0 max-w-none size-full" src={imgFrame} />
            </div>
          </div>
          <p className="[word-break:break-word] flex-[1_0_0] font-['Poppins:Medium'] leading-[26px] min-w-px not-italic opacity-90 relative text-[16px] text-[color:var(--white,white)]" data-node-id="20:958">{`Centralized chilled-water HVAC system & air handling units (AHUs)`}</p>
        </div>
        <div className="bg-[rgba(255,255,255,0.05)] border border-[rgba(255,255,255,0.12)] border-solid content-stretch flex gap-[14px] h-[80px] items-center p-[20px] relative rounded-[14px] shrink-0 w-[570px]" data-node-id="20:959" data-name="Frame">
          <div className="bg-[rgba(223,168,42,0.15)] border border-[rgba(223,168,42,0.4)] border-solid content-stretch flex items-center justify-center p-[12px] relative rounded-[12px] shrink-0" data-node-id="20:960" data-name="Frame">
            <div className="relative shrink-0 size-[20px]" data-node-id="20:961" data-name="Frame">
              <img alt="" className="absolute block inset-0 max-w-none size-full" src={imgFrame} />
            </div>
          </div>
          <p className="[word-break:break-word] flex-[1_0_0] font-['Poppins:Medium'] leading-[26px] min-w-px not-italic opacity-90 relative text-[16px] text-[color:var(--white,white)]" data-node-id="20:963">{`High-voltage transformers & emergency generator power distribution`}</p>
        </div>
        <div className="bg-[rgba(255,255,255,0.05)] border border-[rgba(255,255,255,0.12)] border-solid content-stretch flex gap-[14px] h-[80px] items-center p-[20px] relative rounded-[14px] shrink-0 w-[570px]" data-node-id="20:964" data-name="Frame">
          <div className="bg-[rgba(223,168,42,0.15)] border border-[rgba(223,168,42,0.4)] border-solid content-stretch flex items-center justify-center p-[12px] relative rounded-[12px] shrink-0" data-node-id="20:965" data-name="Frame">
            <div className="relative shrink-0 size-[20px]" data-node-id="20:966" data-name="Frame">
              <img alt="" className="absolute block inset-0 max-w-none size-full" src={imgFrame} />
            </div>
          </div>
          <p className="[word-break:break-word] flex-[1_0_0] font-['Poppins:Medium'] leading-[26px] min-w-px not-italic opacity-90 relative text-[16px] text-[color:var(--white,white)]" data-node-id="20:968">{`Domestic water booster pumps & sanitary drainage risers`}</p>
        </div>
        <div className="bg-[rgba(255,255,255,0.05)] border border-[rgba(255,255,255,0.12)] border-solid content-stretch flex gap-[14px] h-[80px] items-center p-[20px] relative rounded-[14px] shrink-0 w-[570px]" data-node-id="20:969" data-name="Frame">
          <div className="bg-[rgba(223,168,42,0.15)] border border-[rgba(223,168,42,0.4)] border-solid content-stretch flex items-center justify-center p-[12px] relative rounded-[12px] shrink-0" data-node-id="20:970" data-name="Frame">
            <div className="relative shrink-0 size-[20px]" data-node-id="20:971" data-name="Frame">
              <img alt="" className="absolute block inset-0 max-w-none size-full" src={imgFrame} />
            </div>
          </div>
          <p className="[word-break:break-word] flex-[1_0_0] font-['Poppins:Medium'] leading-[26px] min-w-px not-italic opacity-90 relative text-[16px] text-[color:var(--white,white)]" data-node-id="20:973">{`Automated NFPA-compliant fire sprinkler & alarm systems`}</p>
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
These styles are contained in the design: Label/Eyebrow: Font(family: "Poppins", style: SemiBold, size: 12, weight: 600, lineHeight: 16, letterSpacing: 8), Heading/H2: Font(family: "Poppins", style: Bold, size: 44, weight: 700, lineHeight: 52, letterSpacing: -1), Body/M Medium: Font(family: "Poppins", style: Medium, size: 16, weight: 500, lineHeight: 26, letterSpacing: 0).
```

```text
The generated code contains image and SVG URL constants, e.g. const image = `${assetPathPrefix}/<asset file name>`, where assetPathPrefix is declared once at the top of the code and every asset URL interpolates it. These URLs are temporary download sources and expire after 7 days. Download each asset into the project with curl -L, then replace its URL in the generated code with a reference to the downloaded asset. Never use the temporary URLs as runtime image sources.
```
