# Services

- Figma node: `24:1490` (file `tD3pU1vtvSr8akTMJPFLkA`)
- Page: 02 Services
- Source: Figma MCP `get_design_context` (React + Tailwind reference code, saved verbatim). Treat as a high-fidelity reference, not production code: convert absolute positioning into real layout.
- The temporary `assetPathPrefix` URLs below expire; use the local files in the asset table instead.

## Asset map (code constant -> local file)

| Constant | Figma asset file | Local file (relative to design/) |
|---|---|---|
| `imgArrow` | `7d578.svg` | `assets/context/02-services/02-services/imgArrow.svg` |
| `imgEllipse` | `f1f80.svg` | `assets/context/02-services/02-services/imgEllipse.svg` |
| `imgRectangle` | `7cda0.png` | `assets/images/about-team.png` (shared image) |
| `imgRectangle1` | `efac6.png` | `assets/images/svc-mep.png` (shared image) |
| `imgRectangle2` | `fac6f.png` | `assets/images/svc-fire.png` (shared image) |
| `imgRectangle3` | `0ee6d.png` | `assets/images/svc-smart.png` (shared image) |
| `imgFrame` | `5d9e9.svg` | `assets/context/02-services/02-services/imgFrame.svg` |

## Reference code

```jsx
const assetPathPrefix = "https://www.figma.com/api/mcp/asset/a552864b-8903-4f48-bf97-ec9d63a5f95b";
const imgArrow = `${assetPathPrefix}/7d578.svg`;
const imgEllipse = `${assetPathPrefix}/f1f80.svg`;
const imgRectangle = `${assetPathPrefix}/7cda0.png`;
const imgRectangle1 = `${assetPathPrefix}/efac6.png`;
const imgRectangle2 = `${assetPathPrefix}/fac6f.png`;
const imgRectangle3 = `${assetPathPrefix}/0ee6d.png`;
const imgFrame = `${assetPathPrefix}/5d9e9.svg`;

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

export default function Services() {
  return (
    <div className="bg-[var(--white,white)] content-stretch flex flex-col gap-[70px] items-center pb-[78px] pt-[56px] px-[140px] relative size-full" data-node-id="24:1490" data-name="Services">
      <div className="content-stretch flex gap-[72px] items-center relative shrink-0 w-full" data-node-id="24:1498" data-name="Service / General Contracting">
        <div className="h-[400px] relative shrink-0 w-[540px]" data-node-id="24:1499" data-name="Visual">
          <div className="absolute h-[400px] left-0 rounded-[20px] shadow-[0px_24px_50px_0px_rgba(1,16,37,0.16)] top-0 w-[540px]" data-node-id="24:1500" data-name="Rectangle">
            <img alt="" className="absolute inset-0 max-w-none object-cover pointer-events-none rounded-[20px] size-full" src={imgRectangle} />
          </div>
          <div className="absolute bg-[var(--gold\/500,#dfa82a)] content-stretch drop-shadow-[0px_10px_12px_rgba(1,16,37,0.2)] flex items-start left-[-20px] px-[18px] py-[12px] rounded-[14px] top-[-20px]" data-node-id="24:1501" data-name="Frame">
            <p className="[word-break:break-word] font-['Poppins:Bold'] leading-[36px] not-italic relative shrink-0 text-[28px] text-[color:var(--navy\/950,#011025)] tracking-[-0.112px] whitespace-nowrap" data-node-id="24:1502">
              01
            </p>
          </div>
        </div>
        <div className="content-stretch flex flex-[1_0_0] flex-col gap-[18px] items-start min-w-px relative" data-node-id="24:1503" data-name="Frame">
          <Eyebrow className="bg-[var(--gold\/50,#fbf4e3)] border border-[rgba(239,203,118,0.6)] border-solid content-stretch flex gap-[8px] items-center px-[14px] py-[6px] relative rounded-[100px] shrink-0" label="Service 01" />
          <p className="[word-break:break-word] font-['Poppins:Bold'] leading-[52px] not-italic relative shrink-0 text-[44px] text-[color:var(--navy\/950,#011025)] tracking-[-0.44px] whitespace-nowrap" data-node-id="24:1507">
            General Contracting
          </p>
          <div className="bg-gradient-to-r from-[#dfa82a] h-[3px] relative rounded-[2px] shrink-0 to-[#efcb76] w-[52px]" data-node-id="24:1508" data-name="Divider" />
          <p className="[word-break:break-word] font-['Poppins:Regular'] leading-[30px] not-italic relative shrink-0 text-[18px] text-[color:var(--text\/body,#5b6475)] w-[540px]" data-node-id="24:1509">
            Execution of new construction projects adhering to the highest quality standards, with comprehensive project management from design to delivery.
          </p>
          <div className="content-stretch flex flex-col gap-[12px] items-start relative shrink-0 w-full" data-node-id="24:1510" data-name="Frame">
            <div className="content-stretch flex gap-[12px] items-center relative shrink-0" data-node-id="24:1511" data-name="Frame">
              <div className="relative shrink-0 size-[22px]" data-node-id="24:1512" data-name="Frame">
                <img alt="" className="absolute block inset-0 max-w-none size-full" src={imgFrame} />
              </div>
              <p className="[word-break:break-word] font-['Poppins:Medium'] leading-[26px] not-italic relative shrink-0 text-[16px] text-[color:var(--navy\/950,#011025)] whitespace-nowrap" data-node-id="24:1515">
                New construction projects
              </p>
            </div>
            <div className="content-stretch flex gap-[12px] items-center relative shrink-0" data-node-id="24:1516" data-name="Frame">
              <div className="relative shrink-0 size-[22px]" data-node-id="24:1517" data-name="Frame">
                <img alt="" className="absolute block inset-0 max-w-none size-full" src={imgFrame} />
              </div>
              <p className="[word-break:break-word] font-['Poppins:Medium'] leading-[26px] not-italic relative shrink-0 text-[16px] text-[color:var(--navy\/950,#011025)] whitespace-nowrap" data-node-id="24:1520">
                Project management from design to delivery
              </p>
            </div>
            <div className="content-stretch flex gap-[12px] items-center relative shrink-0" data-node-id="24:1521" data-name="Frame">
              <div className="relative shrink-0 size-[22px]" data-node-id="24:1522" data-name="Frame">
                <img alt="" className="absolute block inset-0 max-w-none size-full" src={imgFrame} />
              </div>
              <p className="[word-break:break-word] font-['Poppins:Medium'] leading-[26px] not-italic relative shrink-0 text-[16px] text-[color:var(--navy\/950,#011025)] whitespace-nowrap" data-node-id="24:1525">{`Maintenance & upgrading of existing buildings`}</p>
            </div>
            <div className="content-stretch flex gap-[12px] items-center relative shrink-0" data-node-id="24:1526" data-name="Frame">
              <div className="relative shrink-0 size-[22px]" data-node-id="24:1527" data-name="Frame">
                <img alt="" className="absolute block inset-0 max-w-none size-full" src={imgFrame} />
              </div>
              <p className="[word-break:break-word] font-['Poppins:Medium'] leading-[26px] not-italic relative shrink-0 text-[16px] text-[color:var(--navy\/950,#011025)] whitespace-nowrap" data-node-id="24:1530">{`Civil & MEP works with sister companies`}</p>
            </div>
          </div>
          <Button className="bg-[var(--navy\/950,#011025)] content-stretch cursor-pointer flex gap-[10px] items-center justify-center pl-[26px] pr-[24px] py-[14px] relative rounded-[8px] shrink-0" label="Request a Quote" />
        </div>
      </div>
      <div className="content-stretch flex gap-[72px] items-center relative shrink-0 w-full" data-node-id="24:1535" data-name="Service / MEP Works">
        <div className="content-stretch flex flex-[1_0_0] flex-col gap-[18px] items-start min-w-px relative" data-node-id="24:1540" data-name="Frame">
          <Eyebrow className="bg-[var(--gold\/50,#fbf4e3)] border border-[rgba(239,203,118,0.6)] border-solid content-stretch flex gap-[8px] items-center px-[14px] py-[6px] relative rounded-[100px] shrink-0" label="Service 02" />
          <p className="[word-break:break-word] font-['Poppins:Bold'] leading-[52px] not-italic relative shrink-0 text-[44px] text-[color:var(--navy\/950,#011025)] tracking-[-0.44px] whitespace-nowrap" data-node-id="24:1544">
            MEP Works
          </p>
          <div className="bg-gradient-to-r from-[#dfa82a] h-[3px] relative rounded-[2px] shrink-0 to-[#efcb76] w-[52px]" data-node-id="24:1545" data-name="Divider" />
          <p className="[word-break:break-word] font-['Poppins:Regular'] leading-[30px] not-italic relative shrink-0 text-[18px] text-[color:var(--text\/body,#5b6475)] w-[540px]" data-node-id="24:1546">
            Complete mechanical, electrical, and plumbing engineering services delivered by our in-house engineers, with innovative solutions to improve energy efficiency and reduce operating costs.
          </p>
          <div className="content-stretch flex flex-col gap-[12px] items-start relative shrink-0 w-full" data-node-id="24:1547" data-name="Frame">
            <div className="content-stretch flex gap-[12px] items-center relative shrink-0" data-node-id="24:1548" data-name="Frame">
              <div className="relative shrink-0 size-[22px]" data-node-id="24:1549" data-name="Frame">
                <img alt="" className="absolute block inset-0 max-w-none size-full" src={imgFrame} />
              </div>
              <p className="[word-break:break-word] font-['Poppins:Medium'] leading-[26px] not-italic relative shrink-0 text-[16px] text-[color:var(--navy\/950,#011025)] whitespace-nowrap" data-node-id="24:1552">{`HVAC, chilled water & ventilation`}</p>
            </div>
            <div className="content-stretch flex gap-[12px] items-center relative shrink-0" data-node-id="24:1553" data-name="Frame">
              <div className="relative shrink-0 size-[22px]" data-node-id="24:1554" data-name="Frame">
                <img alt="" className="absolute block inset-0 max-w-none size-full" src={imgFrame} />
              </div>
              <p className="[word-break:break-word] font-['Poppins:Medium'] leading-[26px] not-italic relative shrink-0 text-[16px] text-[color:var(--navy\/950,#011025)] whitespace-nowrap" data-node-id="24:1557">{`Power distribution, lighting & MV`}</p>
            </div>
            <div className="content-stretch flex gap-[12px] items-center relative shrink-0" data-node-id="24:1558" data-name="Frame">
              <div className="relative shrink-0 size-[22px]" data-node-id="24:1559" data-name="Frame">
                <img alt="" className="absolute block inset-0 max-w-none size-full" src={imgFrame} />
              </div>
              <p className="[word-break:break-word] font-['Poppins:Medium'] leading-[26px] not-italic relative shrink-0 text-[16px] text-[color:var(--navy\/950,#011025)] whitespace-nowrap" data-node-id="24:1562">{`Plumbing, water supply & drainage`}</p>
            </div>
            <div className="content-stretch flex gap-[12px] items-center relative shrink-0" data-node-id="24:1563" data-name="Frame">
              <div className="relative shrink-0 size-[22px]" data-node-id="24:1564" data-name="Frame">
                <img alt="" className="absolute block inset-0 max-w-none size-full" src={imgFrame} />
              </div>
              <p className="[word-break:break-word] font-['Poppins:Medium'] leading-[26px] not-italic relative shrink-0 text-[16px] text-[color:var(--navy\/950,#011025)] whitespace-nowrap" data-node-id="24:1567">{`BMS, data networks & low current`}</p>
            </div>
          </div>
          <Button className="bg-[var(--navy\/950,#011025)] content-stretch cursor-pointer flex gap-[10px] items-center justify-center pl-[26px] pr-[24px] py-[14px] relative rounded-[8px] shrink-0" label="Request a Quote" />
        </div>
        <div className="h-[400px] relative shrink-0 w-[540px]" data-node-id="24:1536" data-name="Visual">
          <div className="absolute h-[400px] left-0 rounded-[20px] shadow-[0px_24px_50px_0px_rgba(1,16,37,0.16)] top-0 w-[540px]" data-node-id="24:1537" data-name="Rectangle">
            <img alt="" className="absolute inset-0 max-w-none object-cover pointer-events-none rounded-[20px] size-full" src={imgRectangle1} />
          </div>
          <div className="absolute bg-[var(--gold\/500,#dfa82a)] content-stretch drop-shadow-[0px_10px_12px_rgba(1,16,37,0.2)] flex items-start left-[489px] px-[18px] py-[12px] rounded-[14px] top-[-20px]" data-node-id="24:1538" data-name="Frame">
            <p className="[word-break:break-word] font-['Poppins:Bold'] leading-[36px] not-italic relative shrink-0 text-[28px] text-[color:var(--navy\/950,#011025)] tracking-[-0.112px] whitespace-nowrap" data-node-id="24:1539">
              02
            </p>
          </div>
        </div>
      </div>
      <div className="content-stretch flex gap-[72px] items-center relative shrink-0 w-full" data-node-id="24:1572" data-name="Service / Firefighting Systems">
        <div className="h-[400px] relative shrink-0 w-[540px]" data-node-id="24:1573" data-name="Visual">
          <div className="absolute h-[400px] left-0 rounded-[20px] shadow-[0px_24px_50px_0px_rgba(1,16,37,0.16)] top-0 w-[540px]" data-node-id="24:1574" data-name="Rectangle">
            <img alt="" className="absolute inset-0 max-w-none object-cover pointer-events-none rounded-[20px] size-full" src={imgRectangle2} />
          </div>
          <div className="absolute bg-[var(--gold\/500,#dfa82a)] content-stretch drop-shadow-[0px_10px_12px_rgba(1,16,37,0.2)] flex items-start left-[-20px] px-[18px] py-[12px] rounded-[14px] top-[-20px]" data-node-id="24:1575" data-name="Frame">
            <p className="[word-break:break-word] font-['Poppins:Bold'] leading-[36px] not-italic relative shrink-0 text-[28px] text-[color:var(--navy\/950,#011025)] tracking-[-0.112px] whitespace-nowrap" data-node-id="24:1576">
              03
            </p>
          </div>
        </div>
        <div className="content-stretch flex flex-[1_0_0] flex-col gap-[18px] items-start min-w-px relative" data-node-id="24:1577" data-name="Frame">
          <Eyebrow className="bg-[var(--gold\/50,#fbf4e3)] border border-[rgba(239,203,118,0.6)] border-solid content-stretch flex gap-[8px] items-center px-[14px] py-[6px] relative rounded-[100px] shrink-0" label="Service 03" />
          <p className="[word-break:break-word] font-['Poppins:Bold'] leading-[52px] not-italic relative shrink-0 text-[44px] text-[color:var(--navy\/950,#011025)] tracking-[-0.44px] whitespace-nowrap" data-node-id="24:1581">
            Firefighting Systems
          </p>
          <div className="bg-gradient-to-r from-[#dfa82a] h-[3px] relative rounded-[2px] shrink-0 to-[#efcb76] w-[52px]" data-node-id="24:1582" data-name="Divider" />
          <p className="[word-break:break-word] font-['Poppins:Regular'] leading-[30px] not-italic relative shrink-0 text-[18px] text-[color:var(--text\/body,#5b6475)] w-[540px]" data-node-id="24:1583">
            Design and implementation of firefighting systems according to international standards, with integrated safety solutions to protect lives and property.
          </p>
          <div className="content-stretch flex flex-col gap-[12px] items-start relative shrink-0 w-full" data-node-id="24:1584" data-name="Frame">
            <div className="content-stretch flex gap-[12px] items-center relative shrink-0" data-node-id="24:1585" data-name="Frame">
              <div className="relative shrink-0 size-[22px]" data-node-id="24:1586" data-name="Frame">
                <img alt="" className="absolute block inset-0 max-w-none size-full" src={imgFrame} />
              </div>
              <p className="[word-break:break-word] font-['Poppins:Medium'] leading-[26px] not-italic relative shrink-0 text-[16px] text-[color:var(--navy\/950,#011025)] whitespace-nowrap" data-node-id="24:1589">{`Fire pumps & sprinkler networks`}</p>
            </div>
            <div className="content-stretch flex gap-[12px] items-center relative shrink-0" data-node-id="24:1590" data-name="Frame">
              <div className="relative shrink-0 size-[22px]" data-node-id="24:1591" data-name="Frame">
                <img alt="" className="absolute block inset-0 max-w-none size-full" src={imgFrame} />
              </div>
              <p className="[word-break:break-word] font-['Poppins:Medium'] leading-[26px] not-italic relative shrink-0 text-[16px] text-[color:var(--navy\/950,#011025)] whitespace-nowrap" data-node-id="24:1594">{`Fire detection & alarm systems`}</p>
            </div>
            <div className="content-stretch flex gap-[12px] items-center relative shrink-0" data-node-id="24:1595" data-name="Frame">
              <div className="relative shrink-0 size-[22px]" data-node-id="24:1596" data-name="Frame">
                <img alt="" className="absolute block inset-0 max-w-none size-full" src={imgFrame} />
              </div>
              <p className="[word-break:break-word] font-['Poppins:Medium'] leading-[26px] not-italic relative shrink-0 text-[16px] text-[color:var(--navy\/950,#011025)] whitespace-nowrap" data-node-id="24:1599">
                Clean-agent suppression
              </p>
            </div>
            <div className="content-stretch flex gap-[12px] items-center relative shrink-0" data-node-id="24:1600" data-name="Frame">
              <div className="relative shrink-0 size-[22px]" data-node-id="24:1601" data-name="Frame">
                <img alt="" className="absolute block inset-0 max-w-none size-full" src={imgFrame} />
              </div>
              <p className="[word-break:break-word] font-['Poppins:Medium'] leading-[26px] not-italic relative shrink-0 text-[16px] text-[color:var(--navy\/950,#011025)] whitespace-nowrap" data-node-id="24:1604">{`Installation & maintenance of safety equipment`}</p>
            </div>
          </div>
          <Button className="bg-[var(--navy\/950,#011025)] content-stretch cursor-pointer flex gap-[10px] items-center justify-center pl-[26px] pr-[24px] py-[14px] relative rounded-[8px] shrink-0" label="Request a Quote" />
        </div>
      </div>
      <div className="content-stretch flex gap-[72px] items-center relative shrink-0 w-full" data-node-id="24:1609" data-name="Service / Smart Systems">
        <div className="content-stretch flex flex-[1_0_0] flex-col gap-[18px] items-start min-w-px relative" data-node-id="24:1614" data-name="Frame">
          <Eyebrow className="bg-[var(--gold\/50,#fbf4e3)] border border-[rgba(239,203,118,0.6)] border-solid content-stretch flex gap-[8px] items-center px-[14px] py-[6px] relative rounded-[100px] shrink-0" label="Service 04" />
          <p className="[word-break:break-word] font-['Poppins:Bold'] leading-[52px] not-italic relative shrink-0 text-[44px] text-[color:var(--navy\/950,#011025)] tracking-[-0.44px] whitespace-nowrap" data-node-id="24:1618">
            Smart Systems
          </p>
          <div className="bg-gradient-to-r from-[#dfa82a] h-[3px] relative rounded-[2px] shrink-0 to-[#efcb76] w-[52px]" data-node-id="24:1619" data-name="Divider" />
          <p className="[word-break:break-word] font-['Poppins:Regular'] leading-[30px] not-italic relative shrink-0 text-[18px] text-[color:var(--text\/body,#5b6475)] w-[540px]" data-node-id="24:1620">
            Audio visual, smart automation, security, IT networking, and building management system integration for modern intelligent buildings.
          </p>
          <div className="content-stretch flex flex-col gap-[12px] items-start relative shrink-0 w-full" data-node-id="24:1621" data-name="Frame">
            <div className="content-stretch flex gap-[12px] items-center relative shrink-0" data-node-id="24:1622" data-name="Frame">
              <div className="relative shrink-0 size-[22px]" data-node-id="24:1623" data-name="Frame">
                <img alt="" className="absolute block inset-0 max-w-none size-full" src={imgFrame} />
              </div>
              <p className="[word-break:break-word] font-['Poppins:Medium'] leading-[26px] not-italic relative shrink-0 text-[16px] text-[color:var(--navy\/950,#011025)] whitespace-nowrap" data-node-id="24:1626">{`Audio visual & meeting rooms`}</p>
            </div>
            <div className="content-stretch flex gap-[12px] items-center relative shrink-0" data-node-id="24:1627" data-name="Frame">
              <div className="relative shrink-0 size-[22px]" data-node-id="24:1628" data-name="Frame">
                <img alt="" className="absolute block inset-0 max-w-none size-full" src={imgFrame} />
              </div>
              <p className="[word-break:break-word] font-['Poppins:Medium'] leading-[26px] not-italic relative shrink-0 text-[16px] text-[color:var(--navy\/950,#011025)] whitespace-nowrap" data-node-id="24:1631">{`CCTV, access control & security`}</p>
            </div>
            <div className="content-stretch flex gap-[12px] items-center relative shrink-0" data-node-id="24:1632" data-name="Frame">
              <div className="relative shrink-0 size-[22px]" data-node-id="24:1633" data-name="Frame">
                <img alt="" className="absolute block inset-0 max-w-none size-full" src={imgFrame} />
              </div>
              <p className="[word-break:break-word] font-['Poppins:Medium'] leading-[26px] not-italic relative shrink-0 text-[16px] text-[color:var(--navy\/950,#011025)] whitespace-nowrap" data-node-id="24:1636">{`IT networks, data centers & NOC`}</p>
            </div>
            <div className="content-stretch flex gap-[12px] items-center relative shrink-0" data-node-id="24:1637" data-name="Frame">
              <div className="relative shrink-0 size-[22px]" data-node-id="24:1638" data-name="Frame">
                <img alt="" className="absolute block inset-0 max-w-none size-full" src={imgFrame} />
              </div>
              <p className="[word-break:break-word] font-['Poppins:Medium'] leading-[26px] not-italic relative shrink-0 text-[16px] text-[color:var(--navy\/950,#011025)] whitespace-nowrap" data-node-id="24:1641">{`Queue management & smart automation`}</p>
            </div>
          </div>
          <Button className="bg-[var(--navy\/950,#011025)] content-stretch cursor-pointer flex gap-[10px] items-center justify-center pl-[26px] pr-[24px] py-[14px] relative rounded-[8px] shrink-0" label="Request a Quote" />
        </div>
        <div className="h-[400px] relative shrink-0 w-[540px]" data-node-id="24:1610" data-name="Visual">
          <div className="absolute h-[400px] left-0 rounded-[20px] shadow-[0px_24px_50px_0px_rgba(1,16,37,0.16)] top-0 w-[540px]" data-node-id="24:1611" data-name="Rectangle">
            <img alt="" className="absolute inset-0 max-w-none object-cover pointer-events-none rounded-[20px] size-full" src={imgRectangle3} />
          </div>
          <div className="absolute bg-[var(--gold\/500,#dfa82a)] content-stretch drop-shadow-[0px_10px_12px_rgba(1,16,37,0.2)] flex items-start left-[488px] px-[18px] py-[12px] rounded-[14px] top-[-20px]" data-node-id="24:1612" data-name="Frame">
            <p className="[word-break:break-word] font-['Poppins:Bold'] leading-[36px] not-italic relative shrink-0 text-[28px] text-[color:var(--navy\/950,#011025)] tracking-[-0.112px] whitespace-nowrap" data-node-id="24:1613">
              04
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
These styles are contained in the design: Heading/H3: Font(family: "Poppins", style: Bold, size: 28, weight: 700, lineHeight: 36, letterSpacing: -0.4000000059604645), Label/Eyebrow: Font(family: "Poppins", style: SemiBold, size: 12, weight: 600, lineHeight: 16, letterSpacing: 8), Heading/H2: Font(family: "Poppins", style: Bold, size: 44, weight: 700, lineHeight: 52, letterSpacing: -1), Body/L: Font(family: "Poppins", style: Regular, size: 18, weight: 400, lineHeight: 30, letterSpacing: 0), Body/M Medium: Font(family: "Poppins", style: Medium, size: 16, weight: 500, lineHeight: 26, letterSpacing: 0), Label/Button: Font(family: "Poppins", style: SemiBold, size: 15, weight: 600, lineHeight: 22, letterSpacing: 0).
```

```text
The generated code contains image and SVG URL constants, e.g. const image = `${assetPathPrefix}/<asset file name>`, where assetPathPrefix is declared once at the top of the code and every asset URL interpolates it. These URLs are temporary download sources and expire after 7 days. Download each asset into the project with curl -L, then replace its URL in the generated code with a reference to the downloaded asset. Never use the temporary URLs as runtime image sources.
```
