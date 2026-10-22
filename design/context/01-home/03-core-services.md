# Core services

- Figma node: `17:254` (file `tD3pU1vtvSr8akTMJPFLkA`)
- Page: 01 Home
- Source: Figma MCP `get_design_context` (React + Tailwind reference code, saved verbatim). Treat as a high-fidelity reference, not production code: convert absolute positioning into real layout.
- The temporary `assetPathPrefix` URLs below expire; use the local files in the asset table instead.

## Asset map (code constant -> local file)

| Constant | Figma asset file | Local file (relative to design/) |
|---|---|---|
| `imgArrow` | `7d578.svg` | `assets/context/01-home/03-core-services/imgArrow.svg` |
| `imgIconTesting` | `534fb.svg` | `assets/context/01-home/03-core-services/imgIconTesting.svg` |
| `imgIconSupply` | `c0a57.svg` | `assets/context/01-home/03-core-services/imgIconSupply.svg` |
| `imgIconContracting` | `e2586.svg` | `assets/context/01-home/03-core-services/imgIconContracting.svg` |
| `imgIconSmart` | `2d8d8.svg` | `assets/context/01-home/03-core-services/imgIconSmart.svg` |
| `imgIconElectrical` | `d742d.svg` | `assets/context/01-home/03-core-services/imgIconElectrical.svg` |
| `imgIconPlumbing` | `a30c1.svg` | `assets/context/01-home/03-core-services/imgIconPlumbing.svg` |
| `imgIconFire` | `5a246.svg` | `assets/context/01-home/03-core-services/imgIconFire.svg` |
| `imgIconHvac` | `63726.svg` | `assets/context/01-home/03-core-services/imgIconHvac.svg` |
| `imgIconArrowRight` | `0a5b7.svg` | `assets/context/01-home/03-core-services/imgIconArrowRight.svg` |
| `imgIconArrowRight1` | `34f59.svg` | `assets/context/01-home/03-core-services/imgIconArrowRight1.svg` |
| `imgIconArrowLeft` | `d89b3.svg` | `assets/context/01-home/03-core-services/imgIconArrowLeft.svg` |
| `imgIconArrowRight2` | `0c84a.svg` | `assets/context/01-home/03-core-services/imgIconArrowRight2.svg` |
| `imgEllipse` | `f1f80.svg` | `assets/context/01-home/03-core-services/imgEllipse.svg` |

## Reference code

```jsx
const assetPathPrefix = "https://www.figma.com/api/mcp/asset/6895dc5f-f98a-4f71-8a95-30926ba21de1";
const imgArrow = `${assetPathPrefix}/7d578.svg`;
const imgIconTesting = `${assetPathPrefix}/534fb.svg`;
const imgIconSupply = `${assetPathPrefix}/c0a57.svg`;
const imgIconContracting = `${assetPathPrefix}/e2586.svg`;
const imgIconSmart = `${assetPathPrefix}/2d8d8.svg`;
const imgIconElectrical = `${assetPathPrefix}/d742d.svg`;
const imgIconPlumbing = `${assetPathPrefix}/a30c1.svg`;
const imgIconFire = `${assetPathPrefix}/5a246.svg`;
const imgIconHvac = `${assetPathPrefix}/63726.svg`;
const imgIconArrowRight = `${assetPathPrefix}/0a5b7.svg`;
const imgIconArrowRight1 = `${assetPathPrefix}/34f59.svg`;
const imgIconArrowLeft = `${assetPathPrefix}/d89b3.svg`;
const imgIconArrowRight2 = `${assetPathPrefix}/0c84a.svg`;
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

function IconContracting({ className }: { className?: string }) {
  return (
    <div className={className || "relative size-[20px]"} data-node-id="15:272" data-name="Icon/contracting">
      <img alt="" className="absolute block inset-0 max-w-none size-full" src={imgIconContracting} />
    </div>
  );
}

function IconSmart({ className }: { className?: string }) {
  return (
    <div className={className || "relative size-[20px]"} data-node-id="15:281" data-name="Icon/smart">
      <img alt="" className="absolute block inset-0 max-w-none size-full" src={imgIconSmart} />
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

function IconFire({ className }: { className?: string }) {
  return (
    <div className={className || "relative size-[20px]"} data-node-id="15:278" data-name="Icon/fire">
      <img alt="" className="absolute block inset-0 max-w-none size-full" src={imgIconFire} />
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

type ServicesCarouselProps = {
  className?: string;
  position?: "1";
};

function ServicesCarousel({ className, position = "1" }: ServicesCarouselProps) {
  return (
    <div className={className || "content-stretch flex flex-col gap-[40px] items-start relative w-[1300px]"} data-node-id="175:3151">
      <div className="h-[340px] overflow-x-auto overflow-y-clip relative shrink-0 w-full" data-node-id="175:3152" data-name="Viewport">
        <div className="absolute content-stretch flex gap-[20px] items-start left-0 overflow-clip pb-[30px] pr-[140px] pt-[10px] top-0" data-node-id="175:3153" data-name="Track">
          <div className="bg-[var(--gold\/500,#dfa82a)] content-stretch drop-shadow-[0px_8px_12px_rgba(1,16,37,0.05)] flex flex-col gap-[14px] h-[300px] items-start px-[22px] py-[24px] relative rounded-[16px] shrink-0 w-[290px]" data-node-id="175:3154" data-name="Service Tile / HVAC, Ventilation & Refrigeration">
            <div className="bg-[var(--white,white)] content-stretch flex items-start overflow-clip p-[12px] relative rounded-[12px] shrink-0" data-node-id="I175:3154;109:322" data-name="Icon tile">
              <IconHvac className="relative shrink-0 size-[20px]" />
            </div>
            <p className="[word-break:break-word] font-['Poppins:SemiBold'] leading-[28px] min-w-full not-italic relative shrink-0 text-[20px] text-[color:var(--navy\/950,#011025)] w-[min-content]" data-node-id="I175:3154;109:326">{`HVAC, Ventilation & Refrigeration`}</p>
            <p className="[word-break:break-word] font-['Poppins:Regular'] leading-[22px] min-w-full not-italic relative shrink-0 text-[14px] text-[color:var(--navy\/950,#011025)] w-[min-content]" data-node-id="I175:3154;109:327">{`Chilled water & VRF systems, ventilation, smoke management, staircase pressurization, cold rooms and central refrigeration.`}</p>
            <div className="flex-[1_0_0] min-h-px relative w-full" data-node-id="I175:3154;109:328" data-name="Spacer" />
            <div className="content-stretch flex gap-[6px] items-center overflow-clip relative shrink-0" data-node-id="I175:3154;109:329" data-name="Learn more">
              <p className="[word-break:break-word] font-['Poppins:SemiBold'] leading-[22px] not-italic relative shrink-0 text-[14px] text-[color:var(--navy\/950,#011025)] whitespace-nowrap" data-node-id="I175:3154;109:330">
                Learn more
              </p>
              <div className="relative shrink-0 size-[14px]" data-node-id="I175:3154;109:331" data-name="icon/arrow-right">
                <img alt="" className="absolute block inset-0 max-w-none size-full" src={imgIconArrowRight} />
              </div>
            </div>
          </div>
          <div className="bg-[var(--white,white)] border border-[var(--border,#e3e7ee)] border-solid content-stretch drop-shadow-[0px_8px_12px_rgba(1,16,37,0.05)] flex flex-col gap-[14px] h-[300px] items-start px-[22px] py-[24px] relative rounded-[16px] shrink-0 w-[290px]" data-node-id="175:3155" data-name="Service Tile / Fire Fighting & Fire Alarm">
            <div className="bg-[var(--gold\/50,#fbf4e3)] content-stretch flex items-start overflow-clip p-[12px] relative rounded-[12px] shrink-0" data-node-id="I175:3155;109:310" data-name="Icon tile">
              <IconFire className="relative shrink-0 size-[20px]" />
            </div>
            <p className="[word-break:break-word] font-['Poppins:SemiBold'] leading-[28px] min-w-full not-italic relative shrink-0 text-[20px] text-[color:var(--navy\/950,#011025)] w-[min-content]" data-node-id="I175:3155;109:314">{`Fire Fighting & Fire Alarm`}</p>
            <p className="[word-break:break-word] font-['Poppins:Regular'] leading-[22px] min-w-full not-italic relative shrink-0 text-[14px] text-[color:var(--text\/body,#5b6475)] w-[min-content]" data-node-id="I175:3155;109:315">{`Fire pumps, sprinklers and hose systems, clean-agent suppression, fire detection & alarm, and fire stopping.`}</p>
            <div className="flex-[1_0_0] min-h-px relative w-full" data-node-id="I175:3155;109:316" data-name="Spacer" />
            <div className="content-stretch flex gap-[6px] items-center overflow-clip relative shrink-0" data-node-id="I175:3155;109:317" data-name="Learn more">
              <p className="[word-break:break-word] font-['Poppins:SemiBold'] leading-[22px] not-italic relative shrink-0 text-[14px] text-[color:var(--gold\/600,#c38f1c)] whitespace-nowrap" data-node-id="I175:3155;109:318">
                Learn more
              </p>
              <div className="relative shrink-0 size-[14px]" data-node-id="I175:3155;109:319" data-name="icon/arrow-right">
                <img alt="" className="absolute block inset-0 max-w-none size-full" src={imgIconArrowRight1} />
              </div>
            </div>
          </div>
          <div className="bg-[var(--white,white)] border border-[var(--border,#e3e7ee)] border-solid content-stretch drop-shadow-[0px_8px_12px_rgba(1,16,37,0.05)] flex flex-col gap-[14px] h-[300px] items-start px-[22px] py-[24px] relative rounded-[16px] shrink-0 w-[290px]" data-node-id="175:3156" data-name="Service Tile / Plumbing, Water & Drainage">
            <div className="bg-[var(--gold\/50,#fbf4e3)] content-stretch flex items-start overflow-clip p-[12px] relative rounded-[12px] shrink-0" data-node-id="I175:3156;109:310" data-name="Icon tile">
              <IconPlumbing className="relative shrink-0 size-[20px]" />
            </div>
            <p className="[word-break:break-word] font-['Poppins:SemiBold'] leading-[28px] min-w-full not-italic relative shrink-0 text-[20px] text-[color:var(--navy\/950,#011025)] w-[min-content]" data-node-id="I175:3156;109:314">{`Plumbing, Water & Drainage`}</p>
            <p className="[word-break:break-word] font-['Poppins:Regular'] leading-[22px] min-w-full not-italic relative shrink-0 text-[14px] text-[color:var(--text\/body,#5b6475)] w-[min-content]" data-node-id="I175:3156;109:315">
              Water supply and booster sets, tanks, drainage and exhaust networks, and complete sanitary installations.
            </p>
            <div className="flex-[1_0_0] min-h-px relative w-full" data-node-id="I175:3156;109:316" data-name="Spacer" />
            <div className="content-stretch flex gap-[6px] items-center overflow-clip relative shrink-0" data-node-id="I175:3156;109:317" data-name="Learn more">
              <p className="[word-break:break-word] font-['Poppins:SemiBold'] leading-[22px] not-italic relative shrink-0 text-[14px] text-[color:var(--gold\/600,#c38f1c)] whitespace-nowrap" data-node-id="I175:3156;109:318">
                Learn more
              </p>
              <div className="relative shrink-0 size-[14px]" data-node-id="I175:3156;109:319" data-name="icon/arrow-right">
                <img alt="" className="absolute block inset-0 max-w-none size-full" src={imgIconArrowRight1} />
              </div>
            </div>
          </div>
          <div className="bg-[var(--white,white)] border border-[var(--border,#e3e7ee)] border-solid content-stretch drop-shadow-[0px_8px_12px_rgba(1,16,37,0.05)] flex flex-col gap-[14px] h-[300px] items-start px-[22px] py-[24px] relative rounded-[16px] shrink-0 w-[290px]" data-node-id="175:3157" data-name="Service Tile / Electrical & Power Distribution">
            <div className="bg-[var(--gold\/50,#fbf4e3)] content-stretch flex items-start overflow-clip p-[12px] relative rounded-[12px] shrink-0" data-node-id="I175:3157;109:310" data-name="Icon tile">
              <IconElectrical className="relative shrink-0 size-[20px]" />
            </div>
            <p className="[word-break:break-word] font-['Poppins:SemiBold'] leading-[28px] min-w-full not-italic relative shrink-0 text-[20px] text-[color:var(--navy\/950,#011025)] w-[min-content]" data-node-id="I175:3157;109:314">{`Electrical & Power Distribution`}</p>
            <p className="[word-break:break-word] font-['Poppins:Regular'] leading-[22px] min-w-full not-italic relative shrink-0 text-[14px] text-[color:var(--text\/body,#5b6475)] w-[min-content]" data-node-id="I175:3157;109:315">
              Power distribution, small power and MV systems, lighting and cable networks — from main panel to final outlet.
            </p>
            <div className="flex-[1_0_0] min-h-px relative w-full" data-node-id="I175:3157;109:316" data-name="Spacer" />
            <div className="content-stretch flex gap-[6px] items-center overflow-clip relative shrink-0" data-node-id="I175:3157;109:317" data-name="Learn more">
              <p className="[word-break:break-word] font-['Poppins:SemiBold'] leading-[22px] not-italic relative shrink-0 text-[14px] text-[color:var(--gold\/600,#c38f1c)] whitespace-nowrap" data-node-id="I175:3157;109:318">
                Learn more
              </p>
              <div className="relative shrink-0 size-[14px]" data-node-id="I175:3157;109:319" data-name="icon/arrow-right">
                <img alt="" className="absolute block inset-0 max-w-none size-full" src={imgIconArrowRight1} />
              </div>
            </div>
          </div>
          <div className="bg-[var(--white,white)] border border-[var(--border,#e3e7ee)] border-solid content-stretch drop-shadow-[0px_8px_12px_rgba(1,16,37,0.05)] flex flex-col gap-[14px] h-[300px] items-start px-[22px] py-[24px] relative rounded-[16px] shrink-0 w-[290px]" data-node-id="175:3158" data-name="Service Tile / Smart Systems, ELV & Security">
            <div className="bg-[var(--gold\/50,#fbf4e3)] content-stretch flex items-start overflow-clip p-[12px] relative rounded-[12px] shrink-0" data-node-id="I175:3158;109:310" data-name="Icon tile">
              <IconSmart className="relative shrink-0 size-[20px]" />
            </div>
            <p className="[word-break:break-word] font-['Poppins:SemiBold'] leading-[28px] min-w-full not-italic relative shrink-0 text-[20px] text-[color:var(--navy\/950,#011025)] w-[min-content]" data-node-id="I175:3158;109:314">{`Smart Systems, ELV & Security`}</p>
            <p className="[word-break:break-word] font-['Poppins:Regular'] leading-[22px] min-w-full not-italic relative shrink-0 text-[14px] text-[color:var(--text\/body,#5b6475)] w-[min-content]" data-node-id="I175:3158;109:315">{`Structured cabling, data centers & NOC rooms, CCTV, access control, sound & AV, queue management and BMS.`}</p>
            <div className="flex-[1_0_0] min-h-px relative w-full" data-node-id="I175:3158;109:316" data-name="Spacer" />
            <div className="content-stretch flex gap-[6px] items-center overflow-clip relative shrink-0" data-node-id="I175:3158;109:317" data-name="Learn more">
              <p className="[word-break:break-word] font-['Poppins:SemiBold'] leading-[22px] not-italic relative shrink-0 text-[14px] text-[color:var(--gold\/600,#c38f1c)] whitespace-nowrap" data-node-id="I175:3158;109:318">
                Learn more
              </p>
              <div className="relative shrink-0 size-[14px]" data-node-id="I175:3158;109:319" data-name="icon/arrow-right">
                <img alt="" className="absolute block inset-0 max-w-none size-full" src={imgIconArrowRight1} />
              </div>
            </div>
          </div>
          <div className="bg-[var(--white,white)] border border-[var(--border,#e3e7ee)] border-solid content-stretch drop-shadow-[0px_8px_12px_rgba(1,16,37,0.05)] flex flex-col gap-[14px] h-[300px] items-start px-[22px] py-[24px] relative rounded-[16px] shrink-0 w-[290px]" data-node-id="175:3159" data-name="Service Tile / General Contracting">
            <div className="bg-[var(--gold\/50,#fbf4e3)] content-stretch flex items-start overflow-clip p-[12px] relative rounded-[12px] shrink-0" data-node-id="I175:3159;109:310" data-name="Icon tile">
              <IconContracting className="relative shrink-0 size-[20px]" />
            </div>
            <p className="[word-break:break-word] font-['Poppins:SemiBold'] leading-[28px] min-w-full not-italic relative shrink-0 text-[20px] text-[color:var(--navy\/950,#011025)] w-[min-content]" data-node-id="I175:3159;109:314">
              General Contracting
            </p>
            <p className="[word-break:break-word] font-['Poppins:Regular'] leading-[22px] min-w-full not-italic relative shrink-0 text-[14px] text-[color:var(--text\/body,#5b6475)] w-[min-content]" data-node-id="I175:3159;109:315">
              New construction, project management from design to delivery, and upgrading of existing buildings.
            </p>
            <div className="flex-[1_0_0] min-h-px relative w-full" data-node-id="I175:3159;109:316" data-name="Spacer" />
            <div className="content-stretch flex gap-[6px] items-center overflow-clip relative shrink-0" data-node-id="I175:3159;109:317" data-name="Learn more">
              <p className="[word-break:break-word] font-['Poppins:SemiBold'] leading-[22px] not-italic relative shrink-0 text-[14px] text-[color:var(--gold\/600,#c38f1c)] whitespace-nowrap" data-node-id="I175:3159;109:318">
                Learn more
              </p>
              <div className="relative shrink-0 size-[14px]" data-node-id="I175:3159;109:319" data-name="icon/arrow-right">
                <img alt="" className="absolute block inset-0 max-w-none size-full" src={imgIconArrowRight1} />
              </div>
            </div>
          </div>
          <div className="bg-[var(--white,white)] border border-[var(--border,#e3e7ee)] border-solid content-stretch drop-shadow-[0px_8px_12px_rgba(1,16,37,0.05)] flex flex-col gap-[14px] h-[300px] items-start px-[22px] py-[24px] relative rounded-[16px] shrink-0 w-[290px]" data-node-id="175:3160" data-name="Service Tile / MEP Equipment Supply">
            <div className="bg-[var(--gold\/50,#fbf4e3)] content-stretch flex items-start overflow-clip p-[12px] relative rounded-[12px] shrink-0" data-node-id="I175:3160;109:310" data-name="Icon tile">
              <IconSupply className="relative shrink-0 size-[20px]" />
            </div>
            <p className="[word-break:break-word] font-['Poppins:SemiBold'] leading-[28px] min-w-full not-italic relative shrink-0 text-[20px] text-[color:var(--navy\/950,#011025)] w-[min-content]" data-node-id="I175:3160;109:314">
              MEP Equipment Supply
            </p>
            <p className="[word-break:break-word] font-['Poppins:Regular'] leading-[22px] min-w-full not-italic relative shrink-0 text-[14px] text-[color:var(--text\/body,#5b6475)] w-[min-content]" data-node-id="I175:3160;109:315">
              Genuine equipment from our partner brands, with brand pricing, submittals and delivery to site.
            </p>
            <div className="flex-[1_0_0] min-h-px relative w-full" data-node-id="I175:3160;109:316" data-name="Spacer" />
            <div className="content-stretch flex gap-[6px] items-center overflow-clip relative shrink-0" data-node-id="I175:3160;109:317" data-name="Learn more">
              <p className="[word-break:break-word] font-['Poppins:SemiBold'] leading-[22px] not-italic relative shrink-0 text-[14px] text-[color:var(--gold\/600,#c38f1c)] whitespace-nowrap" data-node-id="I175:3160;109:318">
                Learn more
              </p>
              <div className="relative shrink-0 size-[14px]" data-node-id="I175:3160;109:319" data-name="icon/arrow-right">
                <img alt="" className="absolute block inset-0 max-w-none size-full" src={imgIconArrowRight1} />
              </div>
            </div>
          </div>
          <div className="bg-[var(--white,white)] border border-[var(--border,#e3e7ee)] border-solid content-stretch drop-shadow-[0px_8px_12px_rgba(1,16,37,0.05)] flex flex-col gap-[14px] h-[300px] items-start px-[22px] py-[24px] relative rounded-[16px] shrink-0 w-[290px]" data-node-id="175:3161" data-name="Service Tile / Testing, Commissioning & Maintenance">
            <div className="bg-[var(--gold\/50,#fbf4e3)] content-stretch flex items-start overflow-clip p-[12px] relative rounded-[12px] shrink-0" data-node-id="I175:3161;109:310" data-name="Icon tile">
              <IconTesting className="relative shrink-0 size-[20px]" />
            </div>
            <p className="[word-break:break-word] font-['Poppins:SemiBold'] leading-[28px] min-w-full not-italic relative shrink-0 text-[20px] text-[color:var(--navy\/950,#011025)] w-[min-content]" data-node-id="I175:3161;109:314">{`Testing, Commissioning & Maintenance`}</p>
            <p className="[word-break:break-word] font-['Poppins:Regular'] leading-[22px] min-w-full not-italic relative shrink-0 text-[14px] text-[color:var(--text\/body,#5b6475)] w-[min-content]" data-node-id="I175:3161;109:315">{`Testing, adjusting & balancing, commissioning and handover — plus planned maintenance and upgrades.`}</p>
            <div className="flex-[1_0_0] min-h-px relative w-full" data-node-id="I175:3161;109:316" data-name="Spacer" />
            <div className="content-stretch flex gap-[6px] items-center overflow-clip relative shrink-0" data-node-id="I175:3161;109:317" data-name="Learn more">
              <p className="[word-break:break-word] font-['Poppins:SemiBold'] leading-[22px] not-italic relative shrink-0 text-[14px] text-[color:var(--gold\/600,#c38f1c)] whitespace-nowrap" data-node-id="I175:3161;109:318">
                Learn more
              </p>
              <div className="relative shrink-0 size-[14px]" data-node-id="I175:3161;109:319" data-name="icon/arrow-right">
                <img alt="" className="absolute block inset-0 max-w-none size-full" src={imgIconArrowRight1} />
              </div>
            </div>
          </div>
        </div>
      </div>
      <div className="content-stretch flex gap-[24px] items-center overflow-clip pr-[140px] relative shrink-0 w-full" data-node-id="175:3162" data-name="Controls">
        <div className="bg-[var(--border,#e3e7ee)] flex-[1_0_0] h-[4px] min-w-px overflow-clip relative rounded-[4px]" data-node-id="175:3163" data-name="Scroll indicator">
          <div className="absolute bg-[var(--gold\/500,#dfa82a)] h-[4px] left-0 rounded-[4px] top-0 w-[290px]" data-node-id="175:3164" data-name="Thumb" />
        </div>
        <div className="content-stretch cursor-pointer flex gap-[10px] items-start overflow-clip relative shrink-0" data-node-id="175:3166" data-name="Arrows">
          <button className="bg-[var(--white,white)] border border-[var(--border,#e3e7ee)] border-solid content-stretch flex items-start overflow-clip p-[13px] relative rounded-[100px] shrink-0" data-node-id="175:3167" data-name="Arrow left">
            <div className="relative shrink-0 size-[18px]" data-node-id="175:3168" data-name="icon/arrow-left">
              <img alt="" className="absolute block inset-0 max-w-none size-full" src={imgIconArrowLeft} />
            </div>
          </button>
          <button className="bg-[var(--navy\/950,#011025)] content-stretch flex items-start overflow-clip p-[13px] relative rounded-[100px] shrink-0" data-node-id="175:3170" data-name="Arrow right">
            <div className="relative shrink-0 size-[18px]" data-node-id="175:3171" data-name="icon/arrow-right">
              <img alt="" className="absolute block inset-0 max-w-none size-full" src={imgIconArrowRight2} />
            </div>
          </button>
        </div>
        <Button className="bg-[var(--navy\/950,#011025)] content-stretch cursor-pointer flex gap-[10px] items-center justify-center pl-[26px] pr-[24px] py-[14px] relative rounded-[8px] shrink-0" label="View All Services" />
      </div>
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

export default function CoreServices() {
  return (
    <div className="bg-[var(--surface,#f6f8fb)] content-stretch flex flex-col gap-[40px] items-start pl-[140px] py-[72px] relative size-full" data-node-id="17:254" data-name="Core services">
      <div className="content-stretch flex gap-[64px] items-end overflow-clip pr-[140px] relative shrink-0 w-full" data-node-id="110:1586" data-name="Section head">
        <div className="content-stretch flex flex-[1_0_0] flex-col gap-[16px] items-start min-w-px overflow-clip relative" data-node-id="110:1587" data-name="Title">
          <Eyebrow className="bg-[var(--gold\/50,#fbf4e3)] border border-[rgba(239,203,118,0.6)] border-solid content-stretch flex gap-[8px] items-center px-[14px] py-[6px] relative rounded-[100px] shrink-0" />
          <p className="[word-break:break-word] font-['Poppins:Bold'] leading-[0] min-w-full not-italic relative shrink-0 text-[44px] text-[color:var(--navy\/950,#011025)] tracking-[-0.44px] w-[min-content]" data-node-id="110:1591">
            <span className="leading-[52px]">{`Integrated MEP & construction services `}</span>
            <span className="leading-[52px] text-[#dfa82a]">under one contract</span>
          </p>
        </div>
        <div className="content-stretch flex flex-col items-start overflow-clip relative shrink-0 w-[380px]" data-node-id="110:1592" data-name="Intro & controls">
          <p className="[word-break:break-word] font-['Poppins:Regular'] leading-[26px] not-italic relative shrink-0 text-[16px] text-[color:var(--text\/body,#5b6475)] w-full" data-node-id="110:1593">{`From design coordination to testing & commissioning, around 85% of every MEP package is delivered by our own engineers and technicians — fewer interfaces, lower risk, faster handover.`}</p>
        </div>
      </div>
      <ServicesCarousel className="content-stretch flex flex-col gap-[40px] items-start relative shrink-0 w-full" />
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
These styles are contained in the design: Label/Eyebrow: Font(family: "Poppins", style: SemiBold, size: 12, weight: 600, lineHeight: 16, letterSpacing: 8), Heading/H2: Font(family: "Poppins", style: Bold, size: 44, weight: 700, lineHeight: 52, letterSpacing: -1), Body/M: Font(family: "Poppins", style: Regular, size: 16, weight: 400, lineHeight: 26, letterSpacing: 0), Heading/H4: Font(family: "Poppins", style: SemiBold, size: 20, weight: 600, lineHeight: 28, letterSpacing: 0), Body/S: Font(family: "Poppins", style: Regular, size: 14, weight: 400, lineHeight: 22, letterSpacing: 0), Label/Link: Font(family: "Poppins", style: SemiBold, size: 14, weight: 600, lineHeight: 22, letterSpacing: 0), Label/Button: Font(family: "Poppins", style: SemiBold, size: 15, weight: 600, lineHeight: 22, letterSpacing: 0).
```

```text
Component descriptions: The following components have usage descriptions or documentation links defined in Figma. These descriptions provide important context about the intended usage, best practices, and any constraints for each component. Follow these guidelines when implementing or using these components.

## Services Carousel
**Node ID:** 175:3714

Home services carousel. Prototype: auto-advances every 3.5 s, arrows go prev/next, drag advances, progress bar follows. Build: horizontal scroll-snap track (cards 290 px + 20 px gap), autoplay pauses on hover/focus, arrows and swipe supported; cards turn gold on hover.

## Service Tile
**Node ID:** 109:333

Service card from the previous design (white, featured = gold). Used in the scrolling services carousel on Home.
```

```text
The generated code contains image and SVG URL constants, e.g. const image = `${assetPathPrefix}/<asset file name>`, where assetPathPrefix is declared once at the top of the code and every asset URL interpolates it. These URLs are temporary download sources and expire after 7 days. Download each asset into the project with curl -L, then replace its URL in the generated code with a reference to the downloaded asset. Never use the temporary URLs as runtime image sources.
```
