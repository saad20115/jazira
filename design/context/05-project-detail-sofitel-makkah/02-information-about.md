# Information & about

- Figma node: `20:895` (file `tD3pU1vtvSr8akTMJPFLkA`)
- Page: 05 Project Detail – Sofitel Makkah
- Source: Figma MCP `get_design_context` (React + Tailwind reference code, saved verbatim). Treat as a high-fidelity reference, not production code: convert absolute positioning into real layout.
- The temporary `assetPathPrefix` URLs below expire; use the local files in the asset table instead.

## Asset map (code constant -> local file)

| Constant | Figma asset file | Local file (relative to design/) |
|---|---|---|
| `imgArrow` | `7d578.svg` | `assets/context/05-project-detail-sofitel-makkah/02-information-about/imgArrow.svg` |
| `imgIconChevronDown` | `58caa.svg` | `assets/context/05-project-detail-sofitel-makkah/02-information-about/imgIconChevronDown.svg` |
| `imgIconChevronUp` | `99900.svg` | `assets/context/05-project-detail-sofitel-makkah/02-information-about/imgIconChevronUp.svg` |
| `imgEllipse` | `f1f80.svg` | `assets/context/05-project-detail-sofitel-makkah/02-information-about/imgEllipse.svg` |

## Reference code

```jsx
const assetPathPrefix = "https://www.figma.com/api/mcp/asset/2d8956c4-042c-4ebe-b01e-f8784857abce";
const imgArrow = `${assetPathPrefix}/7d578.svg`;
const imgIconChevronDown = `${assetPathPrefix}/58caa.svg`;
const imgIconChevronUp = `${assetPathPrefix}/99900.svg`;
const imgEllipse = `${assetPathPrefix}/f1f80.svg`;

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

type AccordionItemProps = {
  className?: string;
  body?: string;
  number?: string;
  state?: "Collapsed" | "Expanded";
  title?: string;
};

function AccordionItem({ className, body = "Describe this part of the project here.", number = "01", state = "Collapsed", title = "Project overview" }: AccordionItemProps) {
  const isExpanded = state === "Expanded";
  return (
    <div className={className || `bg-[var(--white,white)] border border-solid content-stretch flex flex-col gap-[14px] items-start px-[22px] py-[20px] relative rounded-[16px] w-[692px] ${isExpanded ? String.raw`border-[var(--gold\/300,#efcb76)]` : "border-[var(--border,#e3e7ee)]"}`} id={isExpanded ? "node-105_301" : "node-105_292"}>
      <div className="content-stretch flex gap-[16px] items-center overflow-clip relative shrink-0 w-full" id={isExpanded ? "node-105_302" : "node-105_293"} data-name="Header">
        <div className={`content-stretch flex items-start overflow-clip px-[10px] py-[8px] relative rounded-[8px] shrink-0 ${isExpanded ? String.raw`bg-[var(--gold\/50,#fbf4e3)]` : "bg-[var(--surface,#f6f8fb)]"}`} id={isExpanded ? "node-105_303" : "node-105_294"} data-name="Number">
          <p className="[word-break:break-word] font-['Poppins:SemiBold'] leading-[22px] not-italic relative shrink-0 text-[14px] text-[color:var(--navy\/950,#011025)] whitespace-nowrap" data-node-id="105:295">
            {number}
          </p>
        </div>
        <p className="[word-break:break-word] flex-[1_0_0] font-['Poppins:SemiBold'] leading-[28px] min-w-px not-italic relative text-[20px] text-[color:var(--navy\/950,#011025)]" data-node-id="105:296">
          {title}
        </p>
        <p className="[word-break:break-word] font-['Poppins:Regular'] leading-[22px] not-italic relative shrink-0 text-[14px] text-[color:var(--gold\/600,#c38f1c)] whitespace-nowrap" id={isExpanded ? "node-105_306" : "node-105_297"}>
          {isExpanded ? "Hide details" : "Show details"}
        </p>
        {state === "Collapsed" && (
          <div className="relative shrink-0 size-[18px]" data-node-id="105:298" data-name="icon/chevron-down">
            <img alt="" className="absolute block inset-0 max-w-none size-full" src={imgIconChevronDown} />
          </div>
        )}
        {isExpanded && (
          <div className="relative shrink-0 size-[18px]" data-node-id="105:307" data-name="icon/chevron-up">
            <img alt="" className="absolute block inset-0 max-w-none size-full" src={imgIconChevronUp} />
          </div>
        )}
      </div>
      {isExpanded && (
        <p className="[word-break:break-word] font-['Poppins:Regular'] leading-[26px] not-italic relative shrink-0 text-[16px] text-[color:var(--text\/body,#5b6475)] w-full" data-node-id="105:309">
          {body}
        </p>
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

export default function InformationAbout() {
  return (
    <div className="bg-[var(--surface,#f6f8fb)] content-stretch flex gap-[48px] items-start pb-[72px] pt-[56px] px-[140px] relative size-full" data-node-id="20:895" data-name="Information & about">
      <div className="content-stretch flex flex-[1_0_0] flex-col gap-[20px] items-start min-w-px overflow-clip relative" data-node-id="106:1539" data-name="About the project">
        <Eyebrow className="bg-[var(--gold\/50,#fbf4e3)] border border-[rgba(239,203,118,0.6)] border-solid content-stretch flex gap-[8px] items-center px-[14px] py-[6px] relative rounded-[100px] shrink-0" label="About the project" />
        <p className="[word-break:break-word] font-['Poppins:Bold'] leading-[52px] min-w-full not-italic relative shrink-0 text-[44px] text-[color:var(--navy\/950,#011025)] tracking-[-0.44px] w-[min-content]" data-node-id="106:1543">
          A complete MEP delivery for a landmark hotel
        </p>
        <p className="[word-break:break-word] font-['Poppins:Regular'] leading-[30px] min-w-full not-italic relative shrink-0 text-[18px] text-[color:var(--text\/body,#5b6475)] w-[min-content]" data-node-id="106:1544">
          Al Jazira (formerly IMDAD Group) delivered the full mechanical, electrical and plumbing package for Sofitel Makkah Hotel, with our own engineers and technicians handling installation, testing and commissioning for Beyout Makkah Co. — one of several hotels we have delivered for the same developer.
        </p>
        <div className="content-stretch flex flex-col gap-[12px] items-start overflow-clip relative shrink-0 w-full" data-node-id="106:1545" data-name="Accordion">
          <AccordionItem body="Complete mechanical, electrical, and plumbing engineering for the prestigious Sofitel Makkah hotel. Our team delivered HVAC, power distribution, plumbing, and fire protection systems — all coordinated under strict timeline requirements to meet the hospitality sector's exacting standards." className="bg-[var(--white,white)] border border-[var(--gold\/300,#efcb76)] border-solid content-stretch flex flex-col gap-[14px] items-start px-[22px] py-[20px] relative rounded-[16px] shrink-0 w-full" state="Expanded" />
          <AccordionItem body="HVAC & chilled water, power distribution & lighting, plumbing & drainage, fire fighting & fire alarm, and low-current systems — the complete MEP package." className="bg-[var(--white,white)] border border-[var(--border,#e3e7ee)] border-solid content-stretch flex flex-col gap-[14px] items-start px-[22px] py-[20px] relative rounded-[16px] shrink-0 w-full" number="02" title="Scope of work" />
          <AccordionItem body="Self-performed by our own engineers and technicians, coordinated from shop drawings and procurement through installation on site." className="bg-[var(--white,white)] border border-[var(--border,#e3e7ee)] border-solid content-stretch flex flex-col gap-[14px] items-start px-[22px] py-[20px] relative rounded-[16px] shrink-0 w-full" number="03" title="Delivery approach" />
          <AccordionItem body="Every system tested, adjusted and balanced, then commissioned and handed over with as-built drawings and O&M manuals." className="bg-[var(--white,white)] border border-[var(--border,#e3e7ee)] border-solid content-stretch flex flex-col gap-[14px] items-start px-[22px] py-[20px] relative rounded-[16px] shrink-0 w-full" number="04" title="Testing, commissioning & handover" />
        </div>
      </div>
      <div className="content-stretch flex flex-col gap-[20px] items-start overflow-clip relative shrink-0 w-[420px]" data-node-id="106:1582" data-name="Sidebar">
        <div className="bg-[var(--navy\/950,#011025)] content-stretch flex flex-col items-start overflow-clip pb-[16px] pt-[28px] px-[26px] relative rounded-[20px] shrink-0 w-full" data-node-id="106:1583" data-name="Project sheet">
          <p className="[word-break:break-word] font-['Poppins:SemiBold'] leading-[16px] not-italic relative shrink-0 text-[12px] text-[color:var(--gold\/500,#dfa82a)] tracking-[1.2px] uppercase whitespace-nowrap" data-node-id="106:1584">
            PROJECT SHEET
          </p>
          <div className="h-[14px] relative shrink-0 w-[10px]" data-node-id="106:1585" data-name="Spacer" />
          <div className="[word-break:break-word] border-[rgba(255,255,255,0.1)] border-b border-solid content-stretch flex gap-[12px] items-center leading-[22px] not-italic overflow-clip py-[14px] relative shrink-0 text-[14px] w-full" data-node-id="106:1586" data-name="Client">
            <p className="font-['Poppins:Regular'] relative shrink-0 text-[color:var(--text\/muted,#8a93a3)] whitespace-nowrap" data-node-id="106:1587">
              Client
            </p>
            <p className="flex-[1_0_0] font-['Poppins:Medium'] min-w-px relative text-[color:var(--white,white)] text-right" data-node-id="106:1588">
              Beyout Makkah Co.
            </p>
          </div>
          <div className="[word-break:break-word] border-[rgba(255,255,255,0.1)] border-b border-solid content-stretch flex gap-[12px] items-center leading-[22px] not-italic overflow-clip py-[14px] relative shrink-0 text-[14px] w-full" data-node-id="106:1589" data-name="Location">
            <p className="font-['Poppins:Regular'] relative shrink-0 text-[color:var(--text\/muted,#8a93a3)] whitespace-nowrap" data-node-id="106:1590">
              Location
            </p>
            <p className="flex-[1_0_0] font-['Poppins:Medium'] min-w-px relative text-[color:var(--white,white)] text-right" data-node-id="106:1591">
              Makkah
            </p>
          </div>
          <div className="[word-break:break-word] border-[rgba(255,255,255,0.1)] border-b border-solid content-stretch flex gap-[12px] items-center leading-[22px] not-italic overflow-clip py-[14px] relative shrink-0 text-[14px] w-full" data-node-id="106:1592" data-name="Scope">
            <p className="font-['Poppins:Regular'] relative shrink-0 text-[color:var(--text\/muted,#8a93a3)] whitespace-nowrap" data-node-id="106:1593">
              Scope
            </p>
            <p className="flex-[1_0_0] font-['Poppins:Medium'] min-w-px relative text-[color:var(--white,white)] text-right" data-node-id="106:1594">
              Full MEP
            </p>
          </div>
          <div className="[word-break:break-word] border-[rgba(255,255,255,0.1)] border-b border-solid content-stretch flex gap-[12px] items-center leading-[22px] not-italic overflow-clip py-[14px] relative shrink-0 text-[14px] w-full" data-node-id="106:1595" data-name="Delivered by">
            <p className="font-['Poppins:Regular'] relative shrink-0 text-[color:var(--text\/muted,#8a93a3)] whitespace-nowrap" data-node-id="106:1596">
              Delivered by
            </p>
            <p className="flex-[1_0_0] font-['Poppins:Medium'] min-w-px relative text-[color:var(--white,white)] text-right" data-node-id="106:1597">
              Our own staff
            </p>
          </div>
          <div className="[word-break:break-word] content-stretch flex gap-[12px] items-center leading-[22px] not-italic overflow-clip py-[14px] relative shrink-0 text-[14px] w-full" data-node-id="106:1598" data-name="Status">
            <p className="font-['Poppins:Regular'] relative shrink-0 text-[color:var(--text\/muted,#8a93a3)] whitespace-nowrap" data-node-id="106:1599">
              Status
            </p>
            <p className="flex-[1_0_0] font-['Poppins:Medium'] min-w-px relative text-[color:var(--white,white)] text-right" data-node-id="106:1600">
              Completed
            </p>
          </div>
        </div>
        <div className="bg-[var(--gold\/50,#fbf4e3)] content-stretch flex flex-col gap-[10px] items-start overflow-clip p-[24px] relative rounded-[20px] shrink-0 w-full" data-node-id="106:1601" data-name="Planning a similar project">
          <p className="[word-break:break-word] font-['Poppins:SemiBold'] leading-[28px] not-italic relative shrink-0 text-[20px] text-[color:var(--navy\/950,#011025)] whitespace-nowrap" data-node-id="106:1602">
            Planning a similar project?
          </p>
          <p className="[word-break:break-word] font-['Poppins:Regular'] leading-[22px] min-w-full not-italic relative shrink-0 text-[14px] text-[color:var(--text\/body,#5b6475)] w-[min-content]" data-node-id="106:1603">{`Send your drawings and we'll prepare a proposal.`}</p>
          <div className="h-[4px] relative shrink-0 w-[10px]" data-node-id="106:1604" data-name="Spacer" />
          <Button className="bg-[var(--navy\/950,#011025)] content-stretch flex gap-[10px] items-center justify-center pl-[26px] pr-[24px] py-[14px] relative rounded-[8px] shrink-0 w-full" label="Request a Quote" />
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
These styles are contained in the design: Label/Eyebrow: Font(family: "Poppins", style: SemiBold, size: 12, weight: 600, lineHeight: 16, letterSpacing: 8), Heading/H2: Font(family: "Poppins", style: Bold, size: 44, weight: 700, lineHeight: 52, letterSpacing: -1), Body/L: Font(family: "Poppins", style: Regular, size: 18, weight: 400, lineHeight: 30, letterSpacing: 0), Label/Link: Font(family: "Poppins", style: SemiBold, size: 14, weight: 600, lineHeight: 22, letterSpacing: 0), Heading/H4: Font(family: "Poppins", style: SemiBold, size: 20, weight: 600, lineHeight: 28, letterSpacing: 0), Body/S: Font(family: "Poppins", style: Regular, size: 14, weight: 400, lineHeight: 22, letterSpacing: 0), Body/M: Font(family: "Poppins", style: Regular, size: 16, weight: 400, lineHeight: 26, letterSpacing: 0), Label/Caps: Font(family: "Poppins", style: SemiBold, size: 12, weight: 600, lineHeight: 16, letterSpacing: 10), Body/S Medium: Font(family: "Poppins", style: Medium, size: 14, weight: 500, lineHeight: 22, letterSpacing: 0), Label/Button: Font(family: "Poppins", style: SemiBold, size: 15, weight: 600, lineHeight: 22, letterSpacing: 0).
```

```text
Component descriptions: The following components have usage descriptions or documentation links defined in Figma. These descriptions provide important context about the intended usage, best practices, and any constraints for each component. Follow these guidelines when implementing or using these components.

## Accordion Item
**Node ID:** 105:310

Expandable detail row (project detail page). Toggle State to open/close; Body is hidden when collapsed.
```

```text
The generated code contains image and SVG URL constants, e.g. const image = `${assetPathPrefix}/<asset file name>`, where assetPathPrefix is declared once at the top of the code and every asset URL interpolates it. These URLs are temporary download sources and expire after 7 days. Download each asset into the project with curl -L, then replace its URL in the generated code with a reference to the downloaded asset. Never use the temporary URLs as runtime image sources.
```
