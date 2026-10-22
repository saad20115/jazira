# Services Carousel

- Figma node: `175:3714` (file `tD3pU1vtvSr8akTMJPFLkA`)
- Page: Design System
- Source: Figma MCP `get_design_context` (React + Tailwind reference code, saved verbatim). Treat as a high-fidelity reference, not production code: convert absolute positioning into real layout.
- The temporary `assetPathPrefix` URLs below expire; use the local files in the asset table instead.

## Asset map (code constant -> local file)

| Constant | Figma asset file | Local file (relative to design/) |
|---|---|---|
| `imgArrow` | `7d578.svg` | `assets/context/components/services-carousel/imgArrow.svg` |
| `imgIconTesting` | `534fb.svg` | `assets/context/components/services-carousel/imgIconTesting.svg` |
| `imgIconSupply` | `c0a57.svg` | `assets/context/components/services-carousel/imgIconSupply.svg` |
| `imgIconContracting` | `e2586.svg` | `assets/context/components/services-carousel/imgIconContracting.svg` |
| `imgIconSmart` | `2d8d8.svg` | `assets/context/components/services-carousel/imgIconSmart.svg` |
| `imgIconElectrical` | `d742d.svg` | `assets/context/components/services-carousel/imgIconElectrical.svg` |
| `imgIconPlumbing` | `a30c1.svg` | `assets/context/components/services-carousel/imgIconPlumbing.svg` |
| `imgIconFire` | `5a246.svg` | `assets/context/components/services-carousel/imgIconFire.svg` |
| `imgIconHvac` | `63726.svg` | `assets/context/components/services-carousel/imgIconHvac.svg` |
| `imgIconArrowRight` | `0a5b7.svg` | `assets/context/components/services-carousel/imgIconArrowRight.svg` |
| `imgIconArrowRight1` | `34f59.svg` | `assets/context/components/services-carousel/imgIconArrowRight1.svg` |
| `imgIconArrowLeft` | `d89b3.svg` | `assets/context/components/services-carousel/imgIconArrowLeft.svg` |
| `imgIconArrowRight2` | `0c84a.svg` | `assets/context/components/services-carousel/imgIconArrowRight2.svg` |

## Reference code

```jsx
const assetPathPrefix = "https://www.figma.com/api/mcp/asset/3e7b90e0-7f25-4f12-830d-2cba8ca88f48";
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
  position?: "1" | "2" | "3" | "4" | "5";
};

export default function ServicesCarousel({ className, position = "1" }: ServicesCarouselProps) {
  const is2 = position === "2";
  const is3 = position === "3";
  const is4 = position === "4";
  const is5 = position === "5";
  return (
    <div className={className || "content-stretch flex flex-col gap-[40px] items-start relative w-[1300px]"} id={is5 ? "node-175_3242" : is4 ? "node-175_3220" : is3 ? "node-175_3198" : is2 ? "node-175_3176" : "node-175_3151"}>
      <div className="h-[340px] overflow-x-auto overflow-y-clip relative shrink-0 w-full" id={is5 ? "node-175_3243" : is4 ? "node-175_3221" : is3 ? "node-175_3199" : is2 ? "node-175_3177" : "node-175_3152"} data-name="Viewport">
        <div className={`absolute content-stretch flex gap-[20px] items-start overflow-clip pb-[30px] pr-[140px] pt-[10px] top-0 ${is5 ? "left-[-1240px]" : is4 ? "left-[-930px]" : is3 ? "left-[-620px]" : is2 ? "left-[-310px]" : "left-0"}`} id={is5 ? "node-175_3244" : is4 ? "node-175_3222" : is3 ? "node-175_3200" : is2 ? "node-175_3178" : "node-175_3153"} data-name="Track">
          <div className="bg-[var(--gold\/500,#dfa82a)] content-stretch drop-shadow-[0px_8px_12px_rgba(1,16,37,0.05)] flex flex-col gap-[14px] h-[300px] items-start px-[22px] py-[24px] relative rounded-[16px] shrink-0 w-[290px]" id={is5 ? "node-175_3245" : is4 ? "node-175_3223" : is3 ? "node-175_3201" : is2 ? "node-175_3179" : "node-175_3154"} data-name="Service Tile / HVAC, Ventilation & Refrigeration">
            <div className="bg-[var(--white,white)] content-stretch flex items-start overflow-clip p-[12px] relative rounded-[12px] shrink-0" id={is5 ? "node-I175_3245-109_322" : is4 ? "node-I175_3223-109_322" : is3 ? "node-I175_3201-109_322" : is2 ? "node-I175_3179-109_322" : "node-I175_3154-109_322"} data-name="Icon tile">
              <IconHvac className="relative shrink-0 size-[20px]" />
            </div>
            <p className="[word-break:break-word] font-['Poppins:SemiBold'] leading-[28px] min-w-full not-italic relative shrink-0 text-[20px] text-[color:var(--navy\/950,#011025)] w-[min-content]" id={is5 ? "node-I175_3245-109_326" : is4 ? "node-I175_3223-109_326" : is3 ? "node-I175_3201-109_326" : is2 ? "node-I175_3179-109_326" : "node-I175_3154-109_326"}>{`HVAC, Ventilation & Refrigeration`}</p>
            <p className="[word-break:break-word] font-['Poppins:Regular'] leading-[22px] min-w-full not-italic relative shrink-0 text-[14px] text-[color:var(--navy\/950,#011025)] w-[min-content]" id={is5 ? "node-I175_3245-109_327" : is4 ? "node-I175_3223-109_327" : is3 ? "node-I175_3201-109_327" : is2 ? "node-I175_3179-109_327" : "node-I175_3154-109_327"}>{`Chilled water & VRF systems, ventilation, smoke management, staircase pressurization, cold rooms and central refrigeration.`}</p>
            <div className="flex-[1_0_0] min-h-px relative w-full" id={is5 ? "node-I175_3245-109_328" : is4 ? "node-I175_3223-109_328" : is3 ? "node-I175_3201-109_328" : is2 ? "node-I175_3179-109_328" : "node-I175_3154-109_328"} data-name="Spacer" />
            <div className="content-stretch flex gap-[6px] items-center overflow-clip relative shrink-0" id={is5 ? "node-I175_3245-109_329" : is4 ? "node-I175_3223-109_329" : is3 ? "node-I175_3201-109_329" : is2 ? "node-I175_3179-109_329" : "node-I175_3154-109_329"} data-name="Learn more">
              <p className="[word-break:break-word] font-['Poppins:SemiBold'] leading-[22px] not-italic relative shrink-0 text-[14px] text-[color:var(--navy\/950,#011025)] whitespace-nowrap" id={is5 ? "node-I175_3245-109_330" : is4 ? "node-I175_3223-109_330" : is3 ? "node-I175_3201-109_330" : is2 ? "node-I175_3179-109_330" : "node-I175_3154-109_330"}>
                Learn more
              </p>
              <div className="relative shrink-0 size-[14px]" id={is5 ? "node-I175_3245-109_331" : is4 ? "node-I175_3223-109_331" : is3 ? "node-I175_3201-109_331" : is2 ? "node-I175_3179-109_331" : "node-I175_3154-109_331"} data-name="icon/arrow-right">
                <img alt="" className="absolute block inset-0 max-w-none size-full" src={imgIconArrowRight} />
              </div>
            </div>
          </div>
          <div className="bg-[var(--white,white)] border border-[var(--border,#e3e7ee)] border-solid content-stretch drop-shadow-[0px_8px_12px_rgba(1,16,37,0.05)] flex flex-col gap-[14px] h-[300px] items-start px-[22px] py-[24px] relative rounded-[16px] shrink-0 w-[290px]" id={is5 ? "node-175_3246" : is4 ? "node-175_3224" : is3 ? "node-175_3202" : is2 ? "node-175_3180" : "node-175_3155"} data-name="Service Tile / Fire Fighting & Fire Alarm">
            <div className="bg-[var(--gold\/50,#fbf4e3)] content-stretch flex items-start overflow-clip p-[12px] relative rounded-[12px] shrink-0" id={is5 ? "node-I175_3246-109_310" : is4 ? "node-I175_3224-109_310" : is3 ? "node-I175_3202-109_310" : is2 ? "node-I175_3180-109_310" : "node-I175_3155-109_310"} data-name="Icon tile">
              <IconFire className="relative shrink-0 size-[20px]" />
            </div>
            <p className="[word-break:break-word] font-['Poppins:SemiBold'] leading-[28px] min-w-full not-italic relative shrink-0 text-[20px] text-[color:var(--navy\/950,#011025)] w-[min-content]" id={is5 ? "node-I175_3246-109_314" : is4 ? "node-I175_3224-109_314" : is3 ? "node-I175_3202-109_314" : is2 ? "node-I175_3180-109_314" : "node-I175_3155-109_314"}>{`Fire Fighting & Fire Alarm`}</p>
            <p className="[word-break:break-word] font-['Poppins:Regular'] leading-[22px] min-w-full not-italic relative shrink-0 text-[14px] text-[color:var(--text\/body,#5b6475)] w-[min-content]" id={is5 ? "node-I175_3246-109_315" : is4 ? "node-I175_3224-109_315" : is3 ? "node-I175_3202-109_315" : is2 ? "node-I175_3180-109_315" : "node-I175_3155-109_315"}>{`Fire pumps, sprinklers and hose systems, clean-agent suppression, fire detection & alarm, and fire stopping.`}</p>
            <div className="flex-[1_0_0] min-h-px relative w-full" id={is5 ? "node-I175_3246-109_316" : is4 ? "node-I175_3224-109_316" : is3 ? "node-I175_3202-109_316" : is2 ? "node-I175_3180-109_316" : "node-I175_3155-109_316"} data-name="Spacer" />
            <div className="content-stretch flex gap-[6px] items-center overflow-clip relative shrink-0" id={is5 ? "node-I175_3246-109_317" : is4 ? "node-I175_3224-109_317" : is3 ? "node-I175_3202-109_317" : is2 ? "node-I175_3180-109_317" : "node-I175_3155-109_317"} data-name="Learn more">
              <p className="[word-break:break-word] font-['Poppins:SemiBold'] leading-[22px] not-italic relative shrink-0 text-[14px] text-[color:var(--gold\/600,#c38f1c)] whitespace-nowrap" id={is5 ? "node-I175_3246-109_318" : is4 ? "node-I175_3224-109_318" : is3 ? "node-I175_3202-109_318" : is2 ? "node-I175_3180-109_318" : "node-I175_3155-109_318"}>
                Learn more
              </p>
              <div className="relative shrink-0 size-[14px]" id={is5 ? "node-I175_3246-109_319" : is4 ? "node-I175_3224-109_319" : is3 ? "node-I175_3202-109_319" : is2 ? "node-I175_3180-109_319" : "node-I175_3155-109_319"} data-name="icon/arrow-right">
                <img alt="" className="absolute block inset-0 max-w-none size-full" src={imgIconArrowRight1} />
              </div>
            </div>
          </div>
          <div className="bg-[var(--white,white)] border border-[var(--border,#e3e7ee)] border-solid content-stretch drop-shadow-[0px_8px_12px_rgba(1,16,37,0.05)] flex flex-col gap-[14px] h-[300px] items-start px-[22px] py-[24px] relative rounded-[16px] shrink-0 w-[290px]" id={is5 ? "node-175_3247" : is4 ? "node-175_3225" : is3 ? "node-175_3203" : is2 ? "node-175_3181" : "node-175_3156"} data-name="Service Tile / Plumbing, Water & Drainage">
            <div className="bg-[var(--gold\/50,#fbf4e3)] content-stretch flex items-start overflow-clip p-[12px] relative rounded-[12px] shrink-0" id={is5 ? "node-I175_3247-109_310" : is4 ? "node-I175_3225-109_310" : is3 ? "node-I175_3203-109_310" : is2 ? "node-I175_3181-109_310" : "node-I175_3156-109_310"} data-name="Icon tile">
              <IconPlumbing className="relative shrink-0 size-[20px]" />
            </div>
            <p className="[word-break:break-word] font-['Poppins:SemiBold'] leading-[28px] min-w-full not-italic relative shrink-0 text-[20px] text-[color:var(--navy\/950,#011025)] w-[min-content]" id={is5 ? "node-I175_3247-109_314" : is4 ? "node-I175_3225-109_314" : is3 ? "node-I175_3203-109_314" : is2 ? "node-I175_3181-109_314" : "node-I175_3156-109_314"}>{`Plumbing, Water & Drainage`}</p>
            <p className="[word-break:break-word] font-['Poppins:Regular'] leading-[22px] min-w-full not-italic relative shrink-0 text-[14px] text-[color:var(--text\/body,#5b6475)] w-[min-content]" id={is5 ? "node-I175_3247-109_315" : is4 ? "node-I175_3225-109_315" : is3 ? "node-I175_3203-109_315" : is2 ? "node-I175_3181-109_315" : "node-I175_3156-109_315"}>
              Water supply and booster sets, tanks, drainage and exhaust networks, and complete sanitary installations.
            </p>
            <div className="flex-[1_0_0] min-h-px relative w-full" id={is5 ? "node-I175_3247-109_316" : is4 ? "node-I175_3225-109_316" : is3 ? "node-I175_3203-109_316" : is2 ? "node-I175_3181-109_316" : "node-I175_3156-109_316"} data-name="Spacer" />
            <div className="content-stretch flex gap-[6px] items-center overflow-clip relative shrink-0" id={is5 ? "node-I175_3247-109_317" : is4 ? "node-I175_3225-109_317" : is3 ? "node-I175_3203-109_317" : is2 ? "node-I175_3181-109_317" : "node-I175_3156-109_317"} data-name="Learn more">
              <p className="[word-break:break-word] font-['Poppins:SemiBold'] leading-[22px] not-italic relative shrink-0 text-[14px] text-[color:var(--gold\/600,#c38f1c)] whitespace-nowrap" id={is5 ? "node-I175_3247-109_318" : is4 ? "node-I175_3225-109_318" : is3 ? "node-I175_3203-109_318" : is2 ? "node-I175_3181-109_318" : "node-I175_3156-109_318"}>
                Learn more
              </p>
              <div className="relative shrink-0 size-[14px]" id={is5 ? "node-I175_3247-109_319" : is4 ? "node-I175_3225-109_319" : is3 ? "node-I175_3203-109_319" : is2 ? "node-I175_3181-109_319" : "node-I175_3156-109_319"} data-name="icon/arrow-right">
                <img alt="" className="absolute block inset-0 max-w-none size-full" src={imgIconArrowRight1} />
              </div>
            </div>
          </div>
          <div className="bg-[var(--white,white)] border border-[var(--border,#e3e7ee)] border-solid content-stretch drop-shadow-[0px_8px_12px_rgba(1,16,37,0.05)] flex flex-col gap-[14px] h-[300px] items-start px-[22px] py-[24px] relative rounded-[16px] shrink-0 w-[290px]" id={is5 ? "node-175_3248" : is4 ? "node-175_3226" : is3 ? "node-175_3204" : is2 ? "node-175_3182" : "node-175_3157"} data-name="Service Tile / Electrical & Power Distribution">
            <div className="bg-[var(--gold\/50,#fbf4e3)] content-stretch flex items-start overflow-clip p-[12px] relative rounded-[12px] shrink-0" id={is5 ? "node-I175_3248-109_310" : is4 ? "node-I175_3226-109_310" : is3 ? "node-I175_3204-109_310" : is2 ? "node-I175_3182-109_310" : "node-I175_3157-109_310"} data-name="Icon tile">
              <IconElectrical className="relative shrink-0 size-[20px]" />
            </div>
            <p className="[word-break:break-word] font-['Poppins:SemiBold'] leading-[28px] min-w-full not-italic relative shrink-0 text-[20px] text-[color:var(--navy\/950,#011025)] w-[min-content]" id={is5 ? "node-I175_3248-109_314" : is4 ? "node-I175_3226-109_314" : is3 ? "node-I175_3204-109_314" : is2 ? "node-I175_3182-109_314" : "node-I175_3157-109_314"}>{`Electrical & Power Distribution`}</p>
            <p className="[word-break:break-word] font-['Poppins:Regular'] leading-[22px] min-w-full not-italic relative shrink-0 text-[14px] text-[color:var(--text\/body,#5b6475)] w-[min-content]" id={is5 ? "node-I175_3248-109_315" : is4 ? "node-I175_3226-109_315" : is3 ? "node-I175_3204-109_315" : is2 ? "node-I175_3182-109_315" : "node-I175_3157-109_315"}>
              Power distribution, small power and MV systems, lighting and cable networks — from main panel to final outlet.
            </p>
            <div className="flex-[1_0_0] min-h-px relative w-full" id={is5 ? "node-I175_3248-109_316" : is4 ? "node-I175_3226-109_316" : is3 ? "node-I175_3204-109_316" : is2 ? "node-I175_3182-109_316" : "node-I175_3157-109_316"} data-name="Spacer" />
            <div className="content-stretch flex gap-[6px] items-center overflow-clip relative shrink-0" id={is5 ? "node-I175_3248-109_317" : is4 ? "node-I175_3226-109_317" : is3 ? "node-I175_3204-109_317" : is2 ? "node-I175_3182-109_317" : "node-I175_3157-109_317"} data-name="Learn more">
              <p className="[word-break:break-word] font-['Poppins:SemiBold'] leading-[22px] not-italic relative shrink-0 text-[14px] text-[color:var(--gold\/600,#c38f1c)] whitespace-nowrap" id={is5 ? "node-I175_3248-109_318" : is4 ? "node-I175_3226-109_318" : is3 ? "node-I175_3204-109_318" : is2 ? "node-I175_3182-109_318" : "node-I175_3157-109_318"}>
                Learn more
              </p>
              <div className="relative shrink-0 size-[14px]" id={is5 ? "node-I175_3248-109_319" : is4 ? "node-I175_3226-109_319" : is3 ? "node-I175_3204-109_319" : is2 ? "node-I175_3182-109_319" : "node-I175_3157-109_319"} data-name="icon/arrow-right">
                <img alt="" className="absolute block inset-0 max-w-none size-full" src={imgIconArrowRight1} />
              </div>
            </div>
          </div>
          <div className="bg-[var(--white,white)] border border-[var(--border,#e3e7ee)] border-solid content-stretch drop-shadow-[0px_8px_12px_rgba(1,16,37,0.05)] flex flex-col gap-[14px] h-[300px] items-start px-[22px] py-[24px] relative rounded-[16px] shrink-0 w-[290px]" id={is5 ? "node-175_3249" : is4 ? "node-175_3227" : is3 ? "node-175_3205" : is2 ? "node-175_3183" : "node-175_3158"} data-name="Service Tile / Smart Systems, ELV & Security">
            <div className="bg-[var(--gold\/50,#fbf4e3)] content-stretch flex items-start overflow-clip p-[12px] relative rounded-[12px] shrink-0" id={is5 ? "node-I175_3249-109_310" : is4 ? "node-I175_3227-109_310" : is3 ? "node-I175_3205-109_310" : is2 ? "node-I175_3183-109_310" : "node-I175_3158-109_310"} data-name="Icon tile">
              <IconSmart className="relative shrink-0 size-[20px]" />
            </div>
            <p className="[word-break:break-word] font-['Poppins:SemiBold'] leading-[28px] min-w-full not-italic relative shrink-0 text-[20px] text-[color:var(--navy\/950,#011025)] w-[min-content]" id={is5 ? "node-I175_3249-109_314" : is4 ? "node-I175_3227-109_314" : is3 ? "node-I175_3205-109_314" : is2 ? "node-I175_3183-109_314" : "node-I175_3158-109_314"}>{`Smart Systems, ELV & Security`}</p>
            <p className="[word-break:break-word] font-['Poppins:Regular'] leading-[22px] min-w-full not-italic relative shrink-0 text-[14px] text-[color:var(--text\/body,#5b6475)] w-[min-content]" id={is5 ? "node-I175_3249-109_315" : is4 ? "node-I175_3227-109_315" : is3 ? "node-I175_3205-109_315" : is2 ? "node-I175_3183-109_315" : "node-I175_3158-109_315"}>{`Structured cabling, data centers & NOC rooms, CCTV, access control, sound & AV, queue management and BMS.`}</p>
            <div className="flex-[1_0_0] min-h-px relative w-full" id={is5 ? "node-I175_3249-109_316" : is4 ? "node-I175_3227-109_316" : is3 ? "node-I175_3205-109_316" : is2 ? "node-I175_3183-109_316" : "node-I175_3158-109_316"} data-name="Spacer" />
            <div className="content-stretch flex gap-[6px] items-center overflow-clip relative shrink-0" id={is5 ? "node-I175_3249-109_317" : is4 ? "node-I175_3227-109_317" : is3 ? "node-I175_3205-109_317" : is2 ? "node-I175_3183-109_317" : "node-I175_3158-109_317"} data-name="Learn more">
              <p className="[word-break:break-word] font-['Poppins:SemiBold'] leading-[22px] not-italic relative shrink-0 text-[14px] text-[color:var(--gold\/600,#c38f1c)] whitespace-nowrap" id={is5 ? "node-I175_3249-109_318" : is4 ? "node-I175_3227-109_318" : is3 ? "node-I175_3205-109_318" : is2 ? "node-I175_3183-109_318" : "node-I175_3158-109_318"}>
                Learn more
              </p>
              <div className="relative shrink-0 size-[14px]" id={is5 ? "node-I175_3249-109_319" : is4 ? "node-I175_3227-109_319" : is3 ? "node-I175_3205-109_319" : is2 ? "node-I175_3183-109_319" : "node-I175_3158-109_319"} data-name="icon/arrow-right">
                <img alt="" className="absolute block inset-0 max-w-none size-full" src={imgIconArrowRight1} />
              </div>
            </div>
          </div>
          <div className="bg-[var(--white,white)] border border-[var(--border,#e3e7ee)] border-solid content-stretch drop-shadow-[0px_8px_12px_rgba(1,16,37,0.05)] flex flex-col gap-[14px] h-[300px] items-start px-[22px] py-[24px] relative rounded-[16px] shrink-0 w-[290px]" id={is5 ? "node-175_3250" : is4 ? "node-175_3228" : is3 ? "node-175_3206" : is2 ? "node-175_3184" : "node-175_3159"} data-name="Service Tile / General Contracting">
            <div className="bg-[var(--gold\/50,#fbf4e3)] content-stretch flex items-start overflow-clip p-[12px] relative rounded-[12px] shrink-0" id={is5 ? "node-I175_3250-109_310" : is4 ? "node-I175_3228-109_310" : is3 ? "node-I175_3206-109_310" : is2 ? "node-I175_3184-109_310" : "node-I175_3159-109_310"} data-name="Icon tile">
              <IconContracting className="relative shrink-0 size-[20px]" />
            </div>
            <p className="[word-break:break-word] font-['Poppins:SemiBold'] leading-[28px] min-w-full not-italic relative shrink-0 text-[20px] text-[color:var(--navy\/950,#011025)] w-[min-content]" id={is5 ? "node-I175_3250-109_314" : is4 ? "node-I175_3228-109_314" : is3 ? "node-I175_3206-109_314" : is2 ? "node-I175_3184-109_314" : "node-I175_3159-109_314"}>
              General Contracting
            </p>
            <p className="[word-break:break-word] font-['Poppins:Regular'] leading-[22px] min-w-full not-italic relative shrink-0 text-[14px] text-[color:var(--text\/body,#5b6475)] w-[min-content]" id={is5 ? "node-I175_3250-109_315" : is4 ? "node-I175_3228-109_315" : is3 ? "node-I175_3206-109_315" : is2 ? "node-I175_3184-109_315" : "node-I175_3159-109_315"}>
              New construction, project management from design to delivery, and upgrading of existing buildings.
            </p>
            <div className="flex-[1_0_0] min-h-px relative w-full" id={is5 ? "node-I175_3250-109_316" : is4 ? "node-I175_3228-109_316" : is3 ? "node-I175_3206-109_316" : is2 ? "node-I175_3184-109_316" : "node-I175_3159-109_316"} data-name="Spacer" />
            <div className="content-stretch flex gap-[6px] items-center overflow-clip relative shrink-0" id={is5 ? "node-I175_3250-109_317" : is4 ? "node-I175_3228-109_317" : is3 ? "node-I175_3206-109_317" : is2 ? "node-I175_3184-109_317" : "node-I175_3159-109_317"} data-name="Learn more">
              <p className="[word-break:break-word] font-['Poppins:SemiBold'] leading-[22px] not-italic relative shrink-0 text-[14px] text-[color:var(--gold\/600,#c38f1c)] whitespace-nowrap" id={is5 ? "node-I175_3250-109_318" : is4 ? "node-I175_3228-109_318" : is3 ? "node-I175_3206-109_318" : is2 ? "node-I175_3184-109_318" : "node-I175_3159-109_318"}>
                Learn more
              </p>
              <div className="relative shrink-0 size-[14px]" id={is5 ? "node-I175_3250-109_319" : is4 ? "node-I175_3228-109_319" : is3 ? "node-I175_3206-109_319" : is2 ? "node-I175_3184-109_319" : "node-I175_3159-109_319"} data-name="icon/arrow-right">
                <img alt="" className="absolute block inset-0 max-w-none size-full" src={imgIconArrowRight1} />
              </div>
            </div>
          </div>
          <div className="bg-[var(--white,white)] border border-[var(--border,#e3e7ee)] border-solid content-stretch drop-shadow-[0px_8px_12px_rgba(1,16,37,0.05)] flex flex-col gap-[14px] h-[300px] items-start px-[22px] py-[24px] relative rounded-[16px] shrink-0 w-[290px]" id={is5 ? "node-175_3251" : is4 ? "node-175_3229" : is3 ? "node-175_3207" : is2 ? "node-175_3185" : "node-175_3160"} data-name="Service Tile / MEP Equipment Supply">
            <div className="bg-[var(--gold\/50,#fbf4e3)] content-stretch flex items-start overflow-clip p-[12px] relative rounded-[12px] shrink-0" id={is5 ? "node-I175_3251-109_310" : is4 ? "node-I175_3229-109_310" : is3 ? "node-I175_3207-109_310" : is2 ? "node-I175_3185-109_310" : "node-I175_3160-109_310"} data-name="Icon tile">
              <IconSupply className="relative shrink-0 size-[20px]" />
            </div>
            <p className="[word-break:break-word] font-['Poppins:SemiBold'] leading-[28px] min-w-full not-italic relative shrink-0 text-[20px] text-[color:var(--navy\/950,#011025)] w-[min-content]" id={is5 ? "node-I175_3251-109_314" : is4 ? "node-I175_3229-109_314" : is3 ? "node-I175_3207-109_314" : is2 ? "node-I175_3185-109_314" : "node-I175_3160-109_314"}>
              MEP Equipment Supply
            </p>
            <p className="[word-break:break-word] font-['Poppins:Regular'] leading-[22px] min-w-full not-italic relative shrink-0 text-[14px] text-[color:var(--text\/body,#5b6475)] w-[min-content]" id={is5 ? "node-I175_3251-109_315" : is4 ? "node-I175_3229-109_315" : is3 ? "node-I175_3207-109_315" : is2 ? "node-I175_3185-109_315" : "node-I175_3160-109_315"}>
              Genuine equipment from our partner brands, with brand pricing, submittals and delivery to site.
            </p>
            <div className="flex-[1_0_0] min-h-px relative w-full" id={is5 ? "node-I175_3251-109_316" : is4 ? "node-I175_3229-109_316" : is3 ? "node-I175_3207-109_316" : is2 ? "node-I175_3185-109_316" : "node-I175_3160-109_316"} data-name="Spacer" />
            <div className="content-stretch flex gap-[6px] items-center overflow-clip relative shrink-0" id={is5 ? "node-I175_3251-109_317" : is4 ? "node-I175_3229-109_317" : is3 ? "node-I175_3207-109_317" : is2 ? "node-I175_3185-109_317" : "node-I175_3160-109_317"} data-name="Learn more">
              <p className="[word-break:break-word] font-['Poppins:SemiBold'] leading-[22px] not-italic relative shrink-0 text-[14px] text-[color:var(--gold\/600,#c38f1c)] whitespace-nowrap" id={is5 ? "node-I175_3251-109_318" : is4 ? "node-I175_3229-109_318" : is3 ? "node-I175_3207-109_318" : is2 ? "node-I175_3185-109_318" : "node-I175_3160-109_318"}>
                Learn more
              </p>
              <div className="relative shrink-0 size-[14px]" id={is5 ? "node-I175_3251-109_319" : is4 ? "node-I175_3229-109_319" : is3 ? "node-I175_3207-109_319" : is2 ? "node-I175_3185-109_319" : "node-I175_3160-109_319"} data-name="icon/arrow-right">
                <img alt="" className="absolute block inset-0 max-w-none size-full" src={imgIconArrowRight1} />
              </div>
            </div>
          </div>
          <div className="bg-[var(--white,white)] border border-[var(--border,#e3e7ee)] border-solid content-stretch drop-shadow-[0px_8px_12px_rgba(1,16,37,0.05)] flex flex-col gap-[14px] h-[300px] items-start px-[22px] py-[24px] relative rounded-[16px] shrink-0 w-[290px]" id={is5 ? "node-175_3252" : is4 ? "node-175_3230" : is3 ? "node-175_3208" : is2 ? "node-175_3186" : "node-175_3161"} data-name="Service Tile / Testing, Commissioning & Maintenance">
            <div className="bg-[var(--gold\/50,#fbf4e3)] content-stretch flex items-start overflow-clip p-[12px] relative rounded-[12px] shrink-0" id={is5 ? "node-I175_3252-109_310" : is4 ? "node-I175_3230-109_310" : is3 ? "node-I175_3208-109_310" : is2 ? "node-I175_3186-109_310" : "node-I175_3161-109_310"} data-name="Icon tile">
              <IconTesting className="relative shrink-0 size-[20px]" />
            </div>
            <p className="[word-break:break-word] font-['Poppins:SemiBold'] leading-[28px] min-w-full not-italic relative shrink-0 text-[20px] text-[color:var(--navy\/950,#011025)] w-[min-content]" id={is5 ? "node-I175_3252-109_314" : is4 ? "node-I175_3230-109_314" : is3 ? "node-I175_3208-109_314" : is2 ? "node-I175_3186-109_314" : "node-I175_3161-109_314"}>{`Testing, Commissioning & Maintenance`}</p>
            <p className="[word-break:break-word] font-['Poppins:Regular'] leading-[22px] min-w-full not-italic relative shrink-0 text-[14px] text-[color:var(--text\/body,#5b6475)] w-[min-content]" id={is5 ? "node-I175_3252-109_315" : is4 ? "node-I175_3230-109_315" : is3 ? "node-I175_3208-109_315" : is2 ? "node-I175_3186-109_315" : "node-I175_3161-109_315"}>{`Testing, adjusting & balancing, commissioning and handover — plus planned maintenance and upgrades.`}</p>
            <div className="flex-[1_0_0] min-h-px relative w-full" id={is5 ? "node-I175_3252-109_316" : is4 ? "node-I175_3230-109_316" : is3 ? "node-I175_3208-109_316" : is2 ? "node-I175_3186-109_316" : "node-I175_3161-109_316"} data-name="Spacer" />
            <div className="content-stretch flex gap-[6px] items-center overflow-clip relative shrink-0" id={is5 ? "node-I175_3252-109_317" : is4 ? "node-I175_3230-109_317" : is3 ? "node-I175_3208-109_317" : is2 ? "node-I175_3186-109_317" : "node-I175_3161-109_317"} data-name="Learn more">
              <p className="[word-break:break-word] font-['Poppins:SemiBold'] leading-[22px] not-italic relative shrink-0 text-[14px] text-[color:var(--gold\/600,#c38f1c)] whitespace-nowrap" id={is5 ? "node-I175_3252-109_318" : is4 ? "node-I175_3230-109_318" : is3 ? "node-I175_3208-109_318" : is2 ? "node-I175_3186-109_318" : "node-I175_3161-109_318"}>
                Learn more
              </p>
              <div className="relative shrink-0 size-[14px]" id={is5 ? "node-I175_3252-109_319" : is4 ? "node-I175_3230-109_319" : is3 ? "node-I175_3208-109_319" : is2 ? "node-I175_3186-109_319" : "node-I175_3161-109_319"} data-name="icon/arrow-right">
                <img alt="" className="absolute block inset-0 max-w-none size-full" src={imgIconArrowRight1} />
              </div>
            </div>
          </div>
        </div>
      </div>
      <div className="content-stretch flex gap-[24px] items-center overflow-clip pr-[140px] relative shrink-0 w-full" id={is5 ? "node-175_3253" : is4 ? "node-175_3231" : is3 ? "node-175_3209" : is2 ? "node-175_3187" : "node-175_3162"} data-name="Controls">
        <div className="bg-[var(--border,#e3e7ee)] flex-[1_0_0] h-[4px] min-w-px overflow-clip relative rounded-[4px]" id={is5 ? "node-175_3254" : is4 ? "node-175_3232" : is3 ? "node-175_3210" : is2 ? "node-175_3188" : "node-175_3163"} data-name="Scroll indicator">
          <div className={`${String.raw`absolute bg-[var(--gold\/500,#dfa82a)] h-[4px] rounded-[4px] top-0 w-[290px] `}${is5 ? "left-[516px]" : is4 ? "left-[387px]" : is3 ? "left-[258px]" : is2 ? "left-[129px]" : "left-0"}`} id={is5 ? "node-175_3255" : is4 ? "node-175_3233" : is3 ? "node-175_3211" : is2 ? "node-175_3189" : "node-175_3164"} data-name="Thumb" />
        </div>
        <div className="content-stretch cursor-pointer flex gap-[10px] items-start overflow-clip relative shrink-0" id={is5 ? "node-175_3256" : is4 ? "node-175_3234" : is3 ? "node-175_3212" : is2 ? "node-175_3190" : "node-175_3166"} data-name="Arrows">
          <button className="bg-[var(--white,white)] border border-[var(--border,#e3e7ee)] border-solid content-stretch flex items-start overflow-clip p-[13px] relative rounded-[100px] shrink-0" id={is5 ? "node-175_3257" : is4 ? "node-175_3235" : is3 ? "node-175_3213" : is2 ? "node-175_3191" : "node-175_3167"} data-name="Arrow left">
            <div className="relative shrink-0 size-[18px]" id={is5 ? "node-175_3258" : is4 ? "node-175_3236" : is3 ? "node-175_3214" : is2 ? "node-175_3192" : "node-175_3168"} data-name="icon/arrow-left">
              <img alt="" className="absolute block inset-0 max-w-none size-full" src={imgIconArrowLeft} />
            </div>
          </button>
          <button className="bg-[var(--navy\/950,#011025)] content-stretch flex items-start overflow-clip p-[13px] relative rounded-[100px] shrink-0" id={is5 ? "node-175_3260" : is4 ? "node-175_3238" : is3 ? "node-175_3216" : is2 ? "node-175_3194" : "node-175_3170"} data-name="Arrow right">
            <div className="relative shrink-0 size-[18px]" id={is5 ? "node-175_3261" : is4 ? "node-175_3239" : is3 ? "node-175_3217" : is2 ? "node-175_3195" : "node-175_3171"} data-name="icon/arrow-right">
              <img alt="" className="absolute block inset-0 max-w-none size-full" src={imgIconArrowRight2} />
            </div>
          </button>
        </div>
        <Button className="bg-[var(--navy\/950,#011025)] content-stretch cursor-pointer flex gap-[10px] items-center justify-center pl-[26px] pr-[24px] py-[14px] relative rounded-[8px] shrink-0" label="View All Services" />
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
These styles are contained in the design: Heading/H4: Font(family: "Poppins", style: SemiBold, size: 20, weight: 600, lineHeight: 28, letterSpacing: 0), Body/S: Font(family: "Poppins", style: Regular, size: 14, weight: 400, lineHeight: 22, letterSpacing: 0), Label/Link: Font(family: "Poppins", style: SemiBold, size: 14, weight: 600, lineHeight: 22, letterSpacing: 0), Label/Button: Font(family: "Poppins", style: SemiBold, size: 15, weight: 600, lineHeight: 22, letterSpacing: 0).
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
