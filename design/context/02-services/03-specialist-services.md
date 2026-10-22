# Specialist services

- Figma node: `126:1887` (file `tD3pU1vtvSr8akTMJPFLkA`)
- Page: 02 Services
- Source: Figma MCP `get_design_context` (React + Tailwind reference code, saved verbatim). Treat as a high-fidelity reference, not production code: convert absolute positioning into real layout.
- The temporary `assetPathPrefix` URLs below expire; use the local files in the asset table instead.

## Asset map (code constant -> local file)

| Constant | Figma asset file | Local file (relative to design/) |
|---|---|---|
| `imgIconMaintenance` | `20cec.svg` | `assets/context/02-services/03-specialist-services/imgIconMaintenance.svg` |
| `imgIconTesting` | `534fb.svg` | `assets/context/02-services/03-specialist-services/imgIconTesting.svg` |
| `imgIconSupply` | `c0a57.svg` | `assets/context/02-services/03-specialist-services/imgIconSupply.svg` |
| `imgIconElectrical` | `d742d.svg` | `assets/context/02-services/03-specialist-services/imgIconElectrical.svg` |
| `imgIconPlumbing` | `a30c1.svg` | `assets/context/02-services/03-specialist-services/imgIconPlumbing.svg` |
| `imgIconHvac` | `63726.svg` | `assets/context/02-services/03-specialist-services/imgIconHvac.svg` |
| `imgEllipse` | `f1f80.svg` | `assets/context/02-services/03-specialist-services/imgEllipse.svg` |
| `imgIconArrowRight` | `34f59.svg` | `assets/context/02-services/03-specialist-services/imgIconArrowRight.svg` |

## Reference code

```jsx
const assetPathPrefix = "https://www.figma.com/api/mcp/asset/3e618e8d-56e7-430e-8781-a86157258768";
const imgIconMaintenance = `${assetPathPrefix}/20cec.svg`;
const imgIconTesting = `${assetPathPrefix}/534fb.svg`;
const imgIconSupply = `${assetPathPrefix}/c0a57.svg`;
const imgIconElectrical = `${assetPathPrefix}/d742d.svg`;
const imgIconPlumbing = `${assetPathPrefix}/a30c1.svg`;
const imgIconHvac = `${assetPathPrefix}/63726.svg`;
const imgEllipse = `${assetPathPrefix}/f1f80.svg`;
const imgIconArrowRight = `${assetPathPrefix}/34f59.svg`;

function IconMaintenance({ className }: { className?: string }) {
  return (
    <div className={className || "relative size-[20px]"} data-node-id="126:1884" data-name="Icon/maintenance">
      <img alt="" className="absolute block inset-0 max-w-none size-full" src={imgIconMaintenance} />
    </div>
  );
}

function IconTesting({ className }: { className?: string }) {
  return (
    <div className={className || "relative size-[20px]"} data-node-id="109:305" data-name="Icon/testing">
      <img alt="" className="absolute block inset-0 max-w-none size-full" src={imgIconTesting} />
    </div>
  );
}

function IconSupply({ className }: { className?: string }) {
  return (
    <div className={className || "relative size-[20px]"} data-node-id="109:301" data-name="Icon/supply">
      <img alt="" className="absolute block inset-0 max-w-none size-full" src={imgIconSupply} />
    </div>
  );
}

function IconElectrical({ className }: { className?: string }) {
  return (
    <div className={className || "relative size-[20px]"} data-node-id="109:298" data-name="Icon/electrical">
      <img alt="" className="absolute block inset-0 max-w-none size-full" src={imgIconElectrical} />
    </div>
  );
}

function IconPlumbing({ className }: { className?: string }) {
  return (
    <div className={className || "relative size-[20px]"} data-node-id="109:295" data-name="Icon/plumbing">
      <img alt="" className="absolute block inset-0 max-w-none size-full" src={imgIconPlumbing} />
    </div>
  );
}

function IconHvac({ className }: { className?: string }) {
  return (
    <div className={className || "relative size-[20px]"} data-node-id="109:292" data-name="Icon/hvac">
      <img alt="" className="absolute block inset-0 max-w-none size-full" src={imgIconHvac} />
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

export default function SpecialistServices() {
  return (
    <div className="bg-[var(--surface,#f6f8fb)] content-stretch flex flex-col gap-[48px] items-center pb-[72px] pt-[65px] px-[140px] relative size-full" data-node-id="126:1887" data-name="Specialist services">
      <div className="content-stretch flex flex-col gap-[16px] items-center relative shrink-0" data-node-id="126:1888" data-name="Section head">
        <Eyebrow className="bg-[var(--gold\/50,#fbf4e3)] border border-[rgba(239,203,118,0.6)] border-solid content-stretch flex gap-[8px] items-center px-[14px] py-[6px] relative rounded-[100px] shrink-0" label="More services" />
        <p className="[word-break:break-word] font-['Poppins:Bold'] leading-[0] not-italic relative shrink-0 text-[44px] text-[color:var(--navy\/950,#011025)] text-center tracking-[-0.44px] whitespace-nowrap" data-node-id="126:1890">
          <span className="leading-[52px]">{`Specialist `}</span>
          <span className="leading-[52px] text-[#dfa82a]">Services</span>
        </p>
        <p className="[word-break:break-word] font-['Poppins:Regular'] leading-[30px] not-italic relative shrink-0 text-[18px] text-[color:var(--text\/body,#5b6475)] text-center w-[640px]" data-node-id="126:1891">
          Dedicated teams for each MEP discipline, plus equipment supply, testing and long-term maintenance.
        </p>
        <div className="bg-gradient-to-r from-[#dfa82a] h-[3px] relative rounded-[2px] shrink-0 to-[#efcb76] w-[52px]" data-node-id="126:1892" data-name="Divider" />
      </div>
      <div className="content-start flex flex-wrap gap-[20px] items-start overflow-clip relative shrink-0 w-full" data-node-id="126:1895" data-name="Grid">
        <div className="bg-[var(--white,white)] border border-[var(--border,#e3e7ee)] border-solid content-stretch drop-shadow-[0px_8px_12px_rgba(1,16,37,0.05)] flex flex-col gap-[14px] h-[276px] items-start px-[22px] py-[24px] relative rounded-[16px] shrink-0 w-[373.333px]" data-node-id="126:1896" data-name="Service Tile / HVAC, Ventilation & Refrigeration">
          <div className="bg-[var(--gold\/50,#fbf4e3)] content-stretch flex items-start overflow-clip p-[12px] relative rounded-[12px] shrink-0" data-node-id="I126:1896;109:310" data-name="Icon tile">
            <IconHvac className="relative shrink-0 size-[20px]" />
          </div>
          <p className="[word-break:break-word] font-['Poppins:SemiBold'] leading-[28px] min-w-full not-italic relative shrink-0 text-[20px] text-[color:var(--navy\/950,#011025)] w-[min-content]" data-node-id="I126:1896;109:314">{`HVAC, Ventilation & Refrigeration`}</p>
          <p className="[word-break:break-word] font-['Poppins:Regular'] leading-[22px] min-w-full not-italic relative shrink-0 text-[14px] text-[color:var(--text\/body,#5b6475)] w-[min-content]" data-node-id="I126:1896;109:315">
            Chilled water and VRF systems, AHUs and FCUs, ventilation, smoke management, staircase pressurization and cold rooms.
          </p>
          <div className="flex-[1_0_0] min-h-px relative w-full" data-node-id="I126:1896;109:316" data-name="Spacer" />
          <div className="content-stretch flex gap-[6px] items-center overflow-clip relative shrink-0" data-node-id="I126:1896;109:317" data-name="Learn more">
            <p className="[word-break:break-word] font-['Poppins:SemiBold'] leading-[22px] not-italic relative shrink-0 text-[14px] text-[color:var(--gold\/600,#c38f1c)] whitespace-nowrap" data-node-id="I126:1896;109:318">
              Learn more
            </p>
            <div className="relative shrink-0 size-[14px]" data-node-id="I126:1896;109:319" data-name="icon/arrow-right">
              <img alt="" className="absolute block inset-0 max-w-none size-full" src={imgIconArrowRight} />
            </div>
          </div>
        </div>
        <div className="bg-[var(--white,white)] border border-[var(--border,#e3e7ee)] border-solid content-stretch drop-shadow-[0px_8px_12px_rgba(1,16,37,0.05)] flex flex-col gap-[14px] h-[276px] items-start px-[22px] py-[24px] relative rounded-[16px] shrink-0 w-[373.333px]" data-node-id="126:1910" data-name="Service Tile / Plumbing, Water & Drainage">
          <div className="bg-[var(--gold\/50,#fbf4e3)] content-stretch flex items-start overflow-clip p-[12px] relative rounded-[12px] shrink-0" data-node-id="I126:1910;109:310" data-name="Icon tile">
            <IconPlumbing className="relative shrink-0 size-[20px]" />
          </div>
          <p className="[word-break:break-word] font-['Poppins:SemiBold'] leading-[28px] min-w-full not-italic relative shrink-0 text-[20px] text-[color:var(--navy\/950,#011025)] w-[min-content]" data-node-id="I126:1910;109:314">{`Plumbing, Water & Drainage`}</p>
          <p className="[word-break:break-word] font-['Poppins:Regular'] leading-[22px] min-w-full not-italic relative shrink-0 text-[14px] text-[color:var(--text\/body,#5b6475)] w-[min-content]" data-node-id="I126:1910;109:315">
            Water supply and booster sets, tanks, drainage and vent networks, and complete sanitary installations.
          </p>
          <div className="flex-[1_0_0] min-h-px relative w-full" data-node-id="I126:1910;109:316" data-name="Spacer" />
          <div className="content-stretch flex gap-[6px] items-center overflow-clip relative shrink-0" data-node-id="I126:1910;109:317" data-name="Learn more">
            <p className="[word-break:break-word] font-['Poppins:SemiBold'] leading-[22px] not-italic relative shrink-0 text-[14px] text-[color:var(--gold\/600,#c38f1c)] whitespace-nowrap" data-node-id="I126:1910;109:318">
              Learn more
            </p>
            <div className="relative shrink-0 size-[14px]" data-node-id="I126:1910;109:319" data-name="icon/arrow-right">
              <img alt="" className="absolute block inset-0 max-w-none size-full" src={imgIconArrowRight} />
            </div>
          </div>
        </div>
        <div className="bg-[var(--white,white)] border border-[var(--border,#e3e7ee)] border-solid content-stretch drop-shadow-[0px_8px_12px_rgba(1,16,37,0.05)] flex flex-col gap-[14px] h-[276px] items-start px-[22px] py-[24px] relative rounded-[16px] shrink-0 w-[373.333px]" data-node-id="126:1924" data-name="Service Tile / Electrical & Power Distribution">
          <div className="bg-[var(--gold\/50,#fbf4e3)] content-stretch flex items-start overflow-clip p-[12px] relative rounded-[12px] shrink-0" data-node-id="I126:1924;109:310" data-name="Icon tile">
            <IconElectrical className="relative shrink-0 size-[20px]" />
          </div>
          <p className="[word-break:break-word] font-['Poppins:SemiBold'] leading-[28px] min-w-full not-italic relative shrink-0 text-[20px] text-[color:var(--navy\/950,#011025)] w-[min-content]" data-node-id="I126:1924;109:314">{`Electrical & Power Distribution`}</p>
          <p className="[word-break:break-word] font-['Poppins:Regular'] leading-[22px] min-w-full not-italic relative shrink-0 text-[14px] text-[color:var(--text\/body,#5b6475)] w-[min-content]" data-node-id="I126:1924;109:315">
            MV/LV panels, busways, small power, lighting and emergency generator distribution.
          </p>
          <div className="flex-[1_0_0] min-h-px relative w-full" data-node-id="I126:1924;109:316" data-name="Spacer" />
          <div className="content-stretch flex gap-[6px] items-center overflow-clip relative shrink-0" data-node-id="I126:1924;109:317" data-name="Learn more">
            <p className="[word-break:break-word] font-['Poppins:SemiBold'] leading-[22px] not-italic relative shrink-0 text-[14px] text-[color:var(--gold\/600,#c38f1c)] whitespace-nowrap" data-node-id="I126:1924;109:318">
              Learn more
            </p>
            <div className="relative shrink-0 size-[14px]" data-node-id="I126:1924;109:319" data-name="icon/arrow-right">
              <img alt="" className="absolute block inset-0 max-w-none size-full" src={imgIconArrowRight} />
            </div>
          </div>
        </div>
        <div className="bg-[var(--white,white)] border border-[var(--border,#e3e7ee)] border-solid content-stretch drop-shadow-[0px_8px_12px_rgba(1,16,37,0.05)] flex flex-col gap-[14px] h-[276px] items-start px-[22px] py-[24px] relative rounded-[16px] shrink-0 w-[373.333px]" data-node-id="126:1938" data-name="Service Tile / MEP Equipment Supply">
          <div className="bg-[var(--gold\/50,#fbf4e3)] content-stretch flex items-start overflow-clip p-[12px] relative rounded-[12px] shrink-0" data-node-id="I126:1938;109:310" data-name="Icon tile">
            <IconSupply className="relative shrink-0 size-[20px]" />
          </div>
          <p className="[word-break:break-word] font-['Poppins:SemiBold'] leading-[28px] min-w-full not-italic relative shrink-0 text-[20px] text-[color:var(--navy\/950,#011025)] w-[min-content]" data-node-id="I126:1938;109:314">
            MEP Equipment Supply
          </p>
          <p className="[word-break:break-word] font-['Poppins:Regular'] leading-[22px] min-w-full not-italic relative shrink-0 text-[14px] text-[color:var(--text\/body,#5b6475)] w-[min-content]" data-node-id="I126:1938;109:315">
            Genuine equipment from our partner brands, with brand pricing, submittals and delivery to site.
          </p>
          <div className="flex-[1_0_0] min-h-px relative w-full" data-node-id="I126:1938;109:316" data-name="Spacer" />
          <div className="content-stretch flex gap-[6px] items-center overflow-clip relative shrink-0" data-node-id="I126:1938;109:317" data-name="Learn more">
            <p className="[word-break:break-word] font-['Poppins:SemiBold'] leading-[22px] not-italic relative shrink-0 text-[14px] text-[color:var(--gold\/600,#c38f1c)] whitespace-nowrap" data-node-id="I126:1938;109:318">
              Learn more
            </p>
            <div className="relative shrink-0 size-[14px]" data-node-id="I126:1938;109:319" data-name="icon/arrow-right">
              <img alt="" className="absolute block inset-0 max-w-none size-full" src={imgIconArrowRight} />
            </div>
          </div>
        </div>
        <div className="bg-[var(--white,white)] border border-[var(--border,#e3e7ee)] border-solid content-stretch drop-shadow-[0px_8px_12px_rgba(1,16,37,0.05)] flex flex-col gap-[14px] h-[276px] items-start px-[22px] py-[24px] relative rounded-[16px] shrink-0 w-[373.333px]" data-node-id="126:1953" data-name="Service Tile / Testing, Commissioning & TAB">
          <div className="bg-[var(--gold\/50,#fbf4e3)] content-stretch flex items-start overflow-clip p-[12px] relative rounded-[12px] shrink-0" data-node-id="I126:1953;109:310" data-name="Icon tile">
            <IconTesting className="relative shrink-0 size-[20px]" />
          </div>
          <p className="[word-break:break-word] font-['Poppins:SemiBold'] leading-[28px] min-w-full not-italic relative shrink-0 text-[20px] text-[color:var(--navy\/950,#011025)] w-[min-content]" data-node-id="I126:1953;109:314">{`Testing, Commissioning & TAB`}</p>
          <p className="[word-break:break-word] font-['Poppins:Regular'] leading-[22px] min-w-full not-italic relative shrink-0 text-[14px] text-[color:var(--text\/body,#5b6475)] w-[min-content]" data-node-id="I126:1953;109:315">{`Testing, adjusting and balancing, commissioning and handover with as-built drawings and O&M manuals.`}</p>
          <div className="flex-[1_0_0] min-h-px relative w-full" data-node-id="I126:1953;109:316" data-name="Spacer" />
          <div className="content-stretch flex gap-[6px] items-center overflow-clip relative shrink-0" data-node-id="I126:1953;109:317" data-name="Learn more">
            <p className="[word-break:break-word] font-['Poppins:SemiBold'] leading-[22px] not-italic relative shrink-0 text-[14px] text-[color:var(--gold\/600,#c38f1c)] whitespace-nowrap" data-node-id="I126:1953;109:318">
              Learn more
            </p>
            <div className="relative shrink-0 size-[14px]" data-node-id="I126:1953;109:319" data-name="icon/arrow-right">
              <img alt="" className="absolute block inset-0 max-w-none size-full" src={imgIconArrowRight} />
            </div>
          </div>
        </div>
        <div className="bg-[var(--white,white)] border border-[var(--border,#e3e7ee)] border-solid content-stretch drop-shadow-[0px_8px_12px_rgba(1,16,37,0.05)] flex flex-col gap-[14px] h-[276px] items-start px-[22px] py-[24px] relative rounded-[16px] shrink-0 w-[373.333px]" data-node-id="126:1968" data-name="Service Tile / Maintenance & Upgrades">
          <div className="bg-[var(--gold\/50,#fbf4e3)] content-stretch flex items-start overflow-clip p-[12px] relative rounded-[12px] shrink-0" data-node-id="I126:1968;109:310" data-name="Icon tile">
            <IconMaintenance className="relative shrink-0 size-[20px]" />
          </div>
          <p className="[word-break:break-word] font-['Poppins:SemiBold'] leading-[28px] min-w-full not-italic relative shrink-0 text-[20px] text-[color:var(--navy\/950,#011025)] w-[min-content]" data-node-id="I126:1968;109:314">{`Maintenance & Upgrades`}</p>
          <p className="[word-break:break-word] font-['Poppins:Regular'] leading-[22px] min-w-full not-italic relative shrink-0 text-[14px] text-[color:var(--text\/body,#5b6475)] w-[min-content]" data-node-id="I126:1968;109:315">
            Planned maintenance contracts and upgrades of existing buildings to keep systems efficient and compliant.
          </p>
          <div className="flex-[1_0_0] min-h-px relative w-full" data-node-id="I126:1968;109:316" data-name="Spacer" />
          <div className="content-stretch flex gap-[6px] items-center overflow-clip relative shrink-0" data-node-id="I126:1968;109:317" data-name="Learn more">
            <p className="[word-break:break-word] font-['Poppins:SemiBold'] leading-[22px] not-italic relative shrink-0 text-[14px] text-[color:var(--gold\/600,#c38f1c)] whitespace-nowrap" data-node-id="I126:1968;109:318">
              Learn more
            </p>
            <div className="relative shrink-0 size-[14px]" data-node-id="I126:1968;109:319" data-name="icon/arrow-right">
              <img alt="" className="absolute block inset-0 max-w-none size-full" src={imgIconArrowRight} />
            </div>
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
These styles are contained in the design: Label/Eyebrow: Font(family: "Poppins", style: SemiBold, size: 12, weight: 600, lineHeight: 16, letterSpacing: 8), Heading/H2: Font(family: "Poppins", style: Bold, size: 44, weight: 700, lineHeight: 52, letterSpacing: -1), Body/L: Font(family: "Poppins", style: Regular, size: 18, weight: 400, lineHeight: 30, letterSpacing: 0), Heading/H4: Font(family: "Poppins", style: SemiBold, size: 20, weight: 600, lineHeight: 28, letterSpacing: 0), Body/S: Font(family: "Poppins", style: Regular, size: 14, weight: 400, lineHeight: 22, letterSpacing: 0), Label/Link: Font(family: "Poppins", style: SemiBold, size: 14, weight: 600, lineHeight: 22, letterSpacing: 0).
```

```text
Component descriptions: The following components have usage descriptions or documentation links defined in Figma. These descriptions provide important context about the intended usage, best practices, and any constraints for each component. Follow these guidelines when implementing or using these components.

## Service Tile
**Node ID:** 109:333

Service card from the previous design (white, featured = gold). Used in the scrolling services carousel on Home.
```

```text
The generated code contains image and SVG URL constants, e.g. const image = `${assetPathPrefix}/<asset file name>`, where assetPathPrefix is declared once at the top of the code and every asset URL interpolates it. These URLs are temporary download sources and expire after 7 days. Download each asset into the project with curl -L, then replace its URL in the generated code with a reference to the downloaded asset. Never use the temporary URLs as runtime image sources.
```
