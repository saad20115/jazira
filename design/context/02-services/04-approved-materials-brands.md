# Approved materials & brands

- Figma node: `157:3293` (file `tD3pU1vtvSr8akTMJPFLkA`)
- Page: 02 Services
- Source: Figma MCP `get_design_context` (React + Tailwind reference code, saved verbatim). Treat as a high-fidelity reference, not production code: convert absolute positioning into real layout.
- The temporary `assetPathPrefix` URLs below expire; use the local files in the asset table instead.

## Asset map (code constant -> local file)

| Constant | Figma asset file | Local file (relative to design/) |
|---|---|---|
| `imgArrow` | `eb39c.svg` | `assets/context/02-services/04-approved-materials-brands/imgArrow.svg` |
| `imgEllipse` | `f1f80.svg` | `assets/context/02-services/04-approved-materials-brands/imgEllipse.svg` |
| `imgIconSearch` | `d9dec.svg` | `assets/context/02-services/04-approved-materials-brands/imgIconSearch.svg` |

## Reference code

```jsx
const assetPathPrefix = "https://www.figma.com/api/mcp/asset/9c31912b-b433-4d09-bcc7-2ae6dbe37924";
const imgArrow = `${assetPathPrefix}/eb39c.svg`;
const imgEllipse = `${assetPathPrefix}/f1f80.svg`;
const imgIconSearch = `${assetPathPrefix}/d9dec.svg`;

type ButtonProps = {
  className?: string;
  label?: string;
  showArrow?: boolean;
  state?: "Default";
  variant?: "Outline";
};

function Button({ className, label = "Get a Quote", showArrow = true, state = "Default", variant = "Outline" }: ButtonProps) {
  return (
    <div className={className || "border-[1.5px] border-[var(--navy\\/950,#011025)] border-solid content-stretch flex gap-[10px] items-center justify-center pl-[26px] pr-[24px] py-[14px] relative rounded-[8px]"} data-node-id="12:28">
      <p className="[word-break:break-word] font-['Poppins:SemiBold'] leading-[22px] not-italic relative shrink-0 text-[15px] text-[color:var(--navy\/950,#011025)] whitespace-nowrap" data-node-id="12:29">
        {label}
      </p>
      {showArrow && (
        <div className="relative shrink-0 size-[18px]" data-node-id="12:30" data-name="Arrow">
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

export default function ApprovedMaterialsBrands() {
  return (
    <div className="bg-[var(--white,white)] content-stretch flex flex-col gap-[28px] items-start pb-[72px] pt-[65px] px-[140px] relative size-full" data-node-id="157:3293" data-name="Approved materials & brands">
      <div className="content-stretch flex gap-[64px] items-end overflow-clip relative shrink-0 w-full" data-node-id="157:3294" data-name="Section head">
        <div className="content-stretch flex flex-[1_0_0] flex-col gap-[16px] items-start min-w-px overflow-clip relative" data-node-id="157:3295" data-name="Title">
          <Eyebrow className="bg-[var(--gold\/50,#fbf4e3)] border border-[rgba(239,203,118,0.6)] border-solid content-stretch flex gap-[8px] items-center px-[14px] py-[6px] relative rounded-[100px] shrink-0" label="Materials & brands" />
          <p className="[word-break:break-word] font-['Poppins:Bold'] leading-[0] not-italic relative shrink-0 text-[44px] text-[color:var(--navy\/950,#011025)] tracking-[-0.44px] whitespace-nowrap" data-node-id="157:3299">
            <span className="leading-[52px]">{`Approved `}</span>
            <span className="leading-[52px] text-[#dfa82a]">{`Materials & Brands`}</span>
          </p>
          <p className="[word-break:break-word] font-['Poppins:Regular'] leading-[30px] min-w-full not-italic relative shrink-0 text-[18px] text-[color:var(--text\/body,#5b6475)] w-[min-content]" data-node-id="157:3300">
            The materials and manufacturers we specify and install on our projects, grouped by system.
          </p>
        </div>
        <div className="bg-[var(--surface,#f6f8fb)] border border-[var(--border,#e3e7ee)] border-solid content-stretch flex gap-[10px] items-center overflow-clip px-[16px] py-[13px] relative rounded-[12px] shrink-0 w-[340px]" data-node-id="157:3301" data-name="Search">
          <div className="relative shrink-0 size-[18px]" data-node-id="157:3302" data-name="icon/search">
            <img alt="" className="absolute block inset-0 max-w-none size-full" src={imgIconSearch} />
          </div>
          <p className="[word-break:break-word] font-['Poppins:Regular'] leading-[22px] not-italic relative shrink-0 text-[14px] text-[color:var(--text\/muted,#8a93a3)] whitespace-nowrap" data-node-id="157:3305">
            Search material or brand
          </p>
        </div>
      </div>
      <div className="content-stretch flex gap-[10px] items-start overflow-clip relative shrink-0" data-node-id="157:3306" data-name="System tabs">
        <div className="bg-[var(--white,white)] border border-[var(--border,#e3e7ee)] border-solid content-stretch flex gap-[8px] items-center overflow-clip pl-[16px] pr-[12px] py-[9px] relative rounded-[100px] shrink-0" data-node-id="157:3307" data-name="Tab / All systems">
          <p className="[word-break:break-word] font-['Poppins:Medium'] leading-[22px] not-italic relative shrink-0 text-[15px] text-[color:var(--navy\/950,#011025)] whitespace-nowrap" data-node-id="157:3308">
            All systems
          </p>
          <div className="bg-[var(--surface,#f6f8fb)] content-stretch flex items-start overflow-clip px-[8px] py-[2px] relative rounded-[100px] shrink-0" data-node-id="157:3309" data-name="Count">
            <p className="[word-break:break-word] font-['Poppins:SemiBold'] leading-[14px] not-italic relative shrink-0 text-[11px] text-[color:var(--text\/body,#5b6475)] tracking-[0.66px] whitespace-nowrap" data-node-id="157:3310">
              73
            </p>
          </div>
        </div>
        <div className="bg-[var(--navy\/950,#011025)] content-stretch flex gap-[8px] items-center overflow-clip pl-[16px] pr-[12px] py-[9px] relative rounded-[100px] shrink-0" data-node-id="157:3311" data-name="Tab / Electrical">
          <p className="[word-break:break-word] font-['Poppins:Medium'] leading-[22px] not-italic relative shrink-0 text-[15px] text-[color:var(--white,white)] whitespace-nowrap" data-node-id="157:3312">
            Electrical
          </p>
          <div className="bg-[var(--gold\/500,#dfa82a)] content-stretch flex items-start overflow-clip px-[8px] py-[2px] relative rounded-[100px] shrink-0" data-node-id="157:3313" data-name="Count">
            <p className="[word-break:break-word] font-['Poppins:SemiBold'] leading-[14px] not-italic relative shrink-0 text-[11px] text-[color:var(--navy\/950,#011025)] tracking-[0.66px] whitespace-nowrap" data-node-id="157:3314">
              20
            </p>
          </div>
        </div>
        <div className="bg-[var(--white,white)] border border-[var(--border,#e3e7ee)] border-solid content-stretch flex gap-[8px] items-center overflow-clip pl-[16px] pr-[12px] py-[9px] relative rounded-[100px] shrink-0" data-node-id="157:3315" data-name="Tab / Mechanical">
          <p className="[word-break:break-word] font-['Poppins:Medium'] leading-[22px] not-italic relative shrink-0 text-[15px] text-[color:var(--navy\/950,#011025)] whitespace-nowrap" data-node-id="157:3316">
            Mechanical
          </p>
          <div className="bg-[var(--surface,#f6f8fb)] content-stretch flex items-start overflow-clip px-[8px] py-[2px] relative rounded-[100px] shrink-0" data-node-id="157:3317" data-name="Count">
            <p className="[word-break:break-word] font-['Poppins:SemiBold'] leading-[14px] not-italic relative shrink-0 text-[11px] text-[color:var(--text\/body,#5b6475)] tracking-[0.66px] whitespace-nowrap" data-node-id="157:3318">
              37
            </p>
          </div>
        </div>
        <div className="bg-[var(--white,white)] border border-[var(--border,#e3e7ee)] border-solid content-stretch flex gap-[8px] items-center overflow-clip pl-[16px] pr-[12px] py-[9px] relative rounded-[100px] shrink-0" data-node-id="157:3319" data-name="Tab / Structural">
          <p className="[word-break:break-word] font-['Poppins:Medium'] leading-[22px] not-italic relative shrink-0 text-[15px] text-[color:var(--navy\/950,#011025)] whitespace-nowrap" data-node-id="157:3320">
            Structural
          </p>
          <div className="bg-[var(--surface,#f6f8fb)] content-stretch flex items-start overflow-clip px-[8px] py-[2px] relative rounded-[100px] shrink-0" data-node-id="157:3321" data-name="Count">
            <p className="[word-break:break-word] font-['Poppins:SemiBold'] leading-[14px] not-italic relative shrink-0 text-[11px] text-[color:var(--text\/body,#5b6475)] tracking-[0.66px] whitespace-nowrap" data-node-id="157:3322">
              8
            </p>
          </div>
        </div>
        <div className="bg-[var(--white,white)] border border-[var(--border,#e3e7ee)] border-solid content-stretch flex gap-[8px] items-center overflow-clip pl-[16px] pr-[12px] py-[9px] relative rounded-[100px] shrink-0" data-node-id="157:3323" data-name="Tab / Architectural">
          <p className="[word-break:break-word] font-['Poppins:Medium'] leading-[22px] not-italic relative shrink-0 text-[15px] text-[color:var(--navy\/950,#011025)] whitespace-nowrap" data-node-id="157:3324">
            Architectural
          </p>
          <div className="bg-[var(--surface,#f6f8fb)] content-stretch flex items-start overflow-clip px-[8px] py-[2px] relative rounded-[100px] shrink-0" data-node-id="157:3325" data-name="Count">
            <p className="[word-break:break-word] font-['Poppins:SemiBold'] leading-[14px] not-italic relative shrink-0 text-[11px] text-[color:var(--text\/body,#5b6475)] tracking-[0.66px] whitespace-nowrap" data-node-id="157:3326">
              8
            </p>
          </div>
        </div>
      </div>
      <div className="bg-[var(--white,white)] border border-[var(--border,#e3e7ee)] border-solid content-stretch flex flex-col items-start overflow-clip relative rounded-[18px] shrink-0 w-full" data-node-id="157:3327" data-name="Table (data from dashboard)">
        <div className="[word-break:break-word] bg-[var(--navy\/950,#011025)] content-stretch flex font-['Poppins:SemiBold'] items-center leading-[16px] not-italic overflow-clip px-[24px] py-[14px] relative shrink-0 text-[12px] text-[color:var(--gold\/500,#dfa82a)] tracking-[1.2px] uppercase w-full" data-node-id="157:3328" data-name="Header">
          <p className="relative shrink-0 w-[64px]" data-node-id="157:3329">
            NO.
          </p>
          <p className="flex-[1_0_0] min-w-px relative" data-node-id="157:3330">
            MATERIAL / ITEM
          </p>
          <p className="relative shrink-0 w-[360px]" data-node-id="157:3331">
            BRAND
          </p>
          <p className="relative shrink-0 w-[230px]" data-node-id="157:3332">
            ORIGIN
          </p>
        </div>
        <div className="bg-[var(--white,white)] content-stretch flex items-center overflow-clip px-[24px] py-[15px] relative shrink-0 w-full" data-node-id="157:3333" data-name="Row 01">
          <p className="[word-break:break-word] font-['Poppins:Medium'] leading-[22px] not-italic relative shrink-0 text-[14px] text-[color:var(--text\/muted,#8a93a3)] w-[64px]" data-node-id="157:3334">
            01
          </p>
          <p className="[word-break:break-word] flex-[1_0_0] font-['Poppins:Medium'] leading-[22px] min-w-px not-italic relative text-[14px] text-[color:var(--navy\/950,#011025)]" data-node-id="157:3335">
            EMT Conduit
          </p>
          <div className="content-start flex flex-wrap gap-y-[6px] items-start overflow-clip relative shrink-0 w-[360px]" data-node-id="157:3336" data-name="Brands">
            <div className="bg-[var(--gold\/50,#fbf4e3)] border border-[var(--gold\/300,#efcb76)] border-solid content-stretch flex items-start overflow-clip px-[10px] py-[4px] relative rounded-[8px] shrink-0" data-node-id="157:3337" data-name="Al Rouf">
              <p className="[word-break:break-word] font-['Poppins:SemiBold'] leading-[22px] not-italic relative shrink-0 text-[14px] text-[color:var(--navy\/950,#011025)] whitespace-nowrap" data-node-id="157:3338">
                Al Rouf
              </p>
            </div>
          </div>
          <p className="[word-break:break-word] font-['Poppins:Regular'] leading-[22px] not-italic relative shrink-0 text-[14px] text-[color:var(--text\/body,#5b6475)] w-[230px]" data-node-id="157:3339">
            Saudi Arabia
          </p>
        </div>
        <div className="bg-[var(--surface,#f6f8fb)] content-stretch flex items-center overflow-clip px-[24px] py-[15px] relative shrink-0 w-full" data-node-id="157:3340" data-name="Row 02">
          <p className="[word-break:break-word] font-['Poppins:Medium'] leading-[22px] not-italic relative shrink-0 text-[14px] text-[color:var(--text\/muted,#8a93a3)] w-[64px]" data-node-id="157:3341">
            02
          </p>
          <p className="[word-break:break-word] flex-[1_0_0] font-['Poppins:Medium'] leading-[22px] min-w-px not-italic relative text-[14px] text-[color:var(--navy\/950,#011025)]" data-node-id="157:3342">
            Electric Box
          </p>
          <div className="content-start flex flex-wrap gap-[6px] items-start overflow-clip relative shrink-0 w-[360px]" data-node-id="157:3343" data-name="Brands">
            <div className="bg-[var(--gold\/50,#fbf4e3)] border border-[var(--gold\/300,#efcb76)] border-solid content-stretch flex items-start overflow-clip px-[10px] py-[4px] relative rounded-[8px] shrink-0" data-node-id="157:3344" data-name="Al Rouf">
              <p className="[word-break:break-word] font-['Poppins:SemiBold'] leading-[22px] not-italic relative shrink-0 text-[14px] text-[color:var(--navy\/950,#011025)] whitespace-nowrap" data-node-id="157:3345">
                Al Rouf
              </p>
            </div>
            <div className="bg-[var(--gold\/50,#fbf4e3)] border border-[var(--gold\/300,#efcb76)] border-solid content-stretch flex items-start overflow-clip px-[10px] py-[4px] relative rounded-[8px] shrink-0" data-node-id="157:3346" data-name="Alfanar">
              <p className="[word-break:break-word] font-['Poppins:SemiBold'] leading-[22px] not-italic relative shrink-0 text-[14px] text-[color:var(--navy\/950,#011025)] whitespace-nowrap" data-node-id="157:3347">
                Alfanar
              </p>
            </div>
          </div>
          <p className="[word-break:break-word] font-['Poppins:Regular'] leading-[22px] not-italic relative shrink-0 text-[14px] text-[color:var(--text\/body,#5b6475)] w-[230px]" data-node-id="157:3348">
            Saudi Arabia
          </p>
        </div>
        <div className="bg-[var(--white,white)] content-stretch flex items-center overflow-clip px-[24px] py-[15px] relative shrink-0 w-full" data-node-id="157:3349" data-name="Row 03">
          <p className="[word-break:break-word] font-['Poppins:Medium'] leading-[22px] not-italic relative shrink-0 text-[14px] text-[color:var(--text\/muted,#8a93a3)] w-[64px]" data-node-id="157:3350">
            03
          </p>
          <p className="[word-break:break-word] flex-[1_0_0] font-['Poppins:Medium'] leading-[22px] min-w-px not-italic relative text-[14px] text-[color:var(--navy\/950,#011025)]" data-node-id="157:3351">
            Electrical Steel Box
          </p>
          <div className="content-start flex flex-wrap gap-y-[6px] items-start overflow-clip relative shrink-0 w-[360px]" data-node-id="157:3352" data-name="Brands">
            <div className="bg-[var(--gold\/50,#fbf4e3)] border border-[var(--gold\/300,#efcb76)] border-solid content-stretch flex items-start overflow-clip px-[10px] py-[4px] relative rounded-[8px] shrink-0" data-node-id="157:3353" data-name="Alfanar">
              <p className="[word-break:break-word] font-['Poppins:SemiBold'] leading-[22px] not-italic relative shrink-0 text-[14px] text-[color:var(--navy\/950,#011025)] whitespace-nowrap" data-node-id="157:3354">
                Alfanar
              </p>
            </div>
          </div>
          <p className="[word-break:break-word] font-['Poppins:Regular'] leading-[22px] not-italic relative shrink-0 text-[14px] text-[color:var(--text\/body,#5b6475)] w-[230px]" data-node-id="157:3355">
            Saudi Arabia
          </p>
        </div>
        <div className="bg-[var(--surface,#f6f8fb)] content-stretch flex items-center overflow-clip px-[24px] py-[15px] relative shrink-0 w-full" data-node-id="157:3356" data-name="Row 04">
          <p className="[word-break:break-word] font-['Poppins:Medium'] leading-[22px] not-italic relative shrink-0 text-[14px] text-[color:var(--text\/muted,#8a93a3)] w-[64px]" data-node-id="157:3357">
            04
          </p>
          <p className="[word-break:break-word] flex-[1_0_0] font-['Poppins:Medium'] leading-[22px] min-w-px not-italic relative text-[14px] text-[color:var(--navy\/950,#011025)]" data-node-id="157:3358">
            PVC Electric Conduit
          </p>
          <div className="content-start flex flex-wrap gap-y-[6px] items-start overflow-clip relative shrink-0 w-[360px]" data-node-id="157:3359" data-name="Brands">
            <div className="bg-[var(--gold\/50,#fbf4e3)] border border-[var(--gold\/300,#efcb76)] border-solid content-stretch flex items-start overflow-clip px-[10px] py-[4px] relative rounded-[8px] shrink-0" data-node-id="157:3360" data-name="EGA">
              <p className="[word-break:break-word] font-['Poppins:SemiBold'] leading-[22px] not-italic relative shrink-0 text-[14px] text-[color:var(--navy\/950,#011025)] whitespace-nowrap" data-node-id="157:3361">
                EGA
              </p>
            </div>
          </div>
          <p className="[word-break:break-word] font-['Poppins:Regular'] leading-[22px] not-italic relative shrink-0 text-[14px] text-[color:var(--text\/body,#5b6475)] w-[230px]" data-node-id="157:3362">
            Saudi Arabia
          </p>
        </div>
        <div className="bg-[var(--white,white)] content-stretch flex items-center overflow-clip px-[24px] py-[15px] relative shrink-0 w-full" data-node-id="157:3363" data-name="Row 05">
          <p className="[word-break:break-word] font-['Poppins:Medium'] leading-[22px] not-italic relative shrink-0 text-[14px] text-[color:var(--text\/muted,#8a93a3)] w-[64px]" data-node-id="157:3364">
            05
          </p>
          <p className="[word-break:break-word] flex-[1_0_0] font-['Poppins:Medium'] leading-[22px] min-w-px not-italic relative text-[14px] text-[color:var(--navy\/950,#011025)]" data-node-id="157:3365">
            Cable Tray
          </p>
          <div className="content-start flex flex-wrap gap-y-[6px] items-start overflow-clip relative shrink-0 w-[360px]" data-node-id="157:3366" data-name="Brands">
            <div className="bg-[var(--gold\/50,#fbf4e3)] border border-[var(--gold\/300,#efcb76)] border-solid content-stretch flex items-start overflow-clip px-[10px] py-[4px] relative rounded-[8px] shrink-0" data-node-id="157:3367" data-name="United Technology Group">
              <p className="[word-break:break-word] font-['Poppins:SemiBold'] leading-[22px] not-italic relative shrink-0 text-[14px] text-[color:var(--navy\/950,#011025)] whitespace-nowrap" data-node-id="157:3368">
                United Technology Group
              </p>
            </div>
          </div>
          <p className="[word-break:break-word] font-['Poppins:Regular'] leading-[22px] not-italic relative shrink-0 text-[14px] text-[color:var(--text\/body,#5b6475)] w-[230px]" data-node-id="157:3369">
            Saudi Arabia
          </p>
        </div>
        <div className="bg-[var(--surface,#f6f8fb)] content-stretch flex items-center overflow-clip px-[24px] py-[15px] relative shrink-0 w-full" data-node-id="157:3370" data-name="Row 06">
          <p className="[word-break:break-word] font-['Poppins:Medium'] leading-[22px] not-italic relative shrink-0 text-[14px] text-[color:var(--text\/muted,#8a93a3)] w-[64px]" data-node-id="157:3371">
            06
          </p>
          <p className="[word-break:break-word] flex-[1_0_0] font-['Poppins:Medium'] leading-[22px] min-w-px not-italic relative text-[14px] text-[color:var(--navy\/950,#011025)]" data-node-id="157:3372">
            Cable Trunking
          </p>
          <div className="content-start flex flex-wrap gap-y-[6px] items-start overflow-clip relative shrink-0 w-[360px]" data-node-id="157:3373" data-name="Brands">
            <div className="bg-[var(--gold\/50,#fbf4e3)] border border-[var(--gold\/300,#efcb76)] border-solid content-stretch flex items-start overflow-clip px-[10px] py-[4px] relative rounded-[8px] shrink-0" data-node-id="157:3374" data-name="United Technology Group">
              <p className="[word-break:break-word] font-['Poppins:SemiBold'] leading-[22px] not-italic relative shrink-0 text-[14px] text-[color:var(--navy\/950,#011025)] whitespace-nowrap" data-node-id="157:3375">
                United Technology Group
              </p>
            </div>
          </div>
          <p className="[word-break:break-word] font-['Poppins:Regular'] leading-[22px] not-italic relative shrink-0 text-[14px] text-[color:var(--text\/body,#5b6475)] w-[230px]" data-node-id="157:3376">
            Saudi Arabia
          </p>
        </div>
        <div className="bg-[var(--white,white)] content-stretch flex items-center overflow-clip px-[24px] py-[15px] relative shrink-0 w-full" data-node-id="157:3377" data-name="Row 07">
          <p className="[word-break:break-word] font-['Poppins:Medium'] leading-[22px] not-italic relative shrink-0 text-[14px] text-[color:var(--text\/muted,#8a93a3)] w-[64px]" data-node-id="157:3378">
            07
          </p>
          <p className="[word-break:break-word] flex-[1_0_0] font-['Poppins:Medium'] leading-[22px] min-w-px not-italic relative text-[14px] text-[color:var(--navy\/950,#011025)]" data-node-id="157:3379">
            Electric Cables
          </p>
          <div className="content-start flex flex-wrap gap-[6px] items-start overflow-clip relative shrink-0 w-[360px]" data-node-id="157:3380" data-name="Brands">
            <div className="bg-[var(--gold\/50,#fbf4e3)] border border-[var(--gold\/300,#efcb76)] border-solid content-stretch flex items-start overflow-clip px-[10px] py-[4px] relative rounded-[8px] shrink-0" data-node-id="157:3381" data-name="Jeddah Cables">
              <p className="[word-break:break-word] font-['Poppins:SemiBold'] leading-[22px] not-italic relative shrink-0 text-[14px] text-[color:var(--navy\/950,#011025)] whitespace-nowrap" data-node-id="157:3382">
                Jeddah Cables
              </p>
            </div>
            <div className="bg-[var(--gold\/50,#fbf4e3)] border border-[var(--gold\/300,#efcb76)] border-solid content-stretch flex items-start overflow-clip px-[10px] py-[4px] relative rounded-[8px] shrink-0" data-node-id="157:3383" data-name="Bahra Cables">
              <p className="[word-break:break-word] font-['Poppins:SemiBold'] leading-[22px] not-italic relative shrink-0 text-[14px] text-[color:var(--navy\/950,#011025)] whitespace-nowrap" data-node-id="157:3384">
                Bahra Cables
              </p>
            </div>
          </div>
          <p className="[word-break:break-word] font-['Poppins:Regular'] leading-[22px] not-italic relative shrink-0 text-[14px] text-[color:var(--text\/body,#5b6475)] w-[230px]" data-node-id="157:3385">
            Saudi Arabia
          </p>
        </div>
        <div className="bg-[var(--surface,#f6f8fb)] content-stretch flex items-center overflow-clip px-[24px] py-[15px] relative shrink-0 w-full" data-node-id="157:3386" data-name="Row 08">
          <p className="[word-break:break-word] font-['Poppins:Medium'] leading-[22px] not-italic relative shrink-0 text-[14px] text-[color:var(--text\/muted,#8a93a3)] w-[64px]" data-node-id="157:3387">
            08
          </p>
          <p className="[word-break:break-word] flex-[1_0_0] font-['Poppins:Medium'] leading-[22px] min-w-px not-italic relative text-[14px] text-[color:var(--navy\/950,#011025)]" data-node-id="157:3388">
            Wires
          </p>
          <div className="content-start flex flex-wrap gap-y-[6px] items-start overflow-clip relative shrink-0 w-[360px]" data-node-id="157:3389" data-name="Brands">
            <div className="bg-[var(--gold\/50,#fbf4e3)] border border-[var(--gold\/300,#efcb76)] border-solid content-stretch flex items-start overflow-clip px-[10px] py-[4px] relative rounded-[8px] shrink-0" data-node-id="157:3390" data-name="Bahra Cables">
              <p className="[word-break:break-word] font-['Poppins:SemiBold'] leading-[22px] not-italic relative shrink-0 text-[14px] text-[color:var(--navy\/950,#011025)] whitespace-nowrap" data-node-id="157:3391">
                Bahra Cables
              </p>
            </div>
          </div>
          <p className="[word-break:break-word] font-['Poppins:Regular'] leading-[22px] not-italic relative shrink-0 text-[14px] text-[color:var(--text\/body,#5b6475)] w-[230px]" data-node-id="157:3392">
            Saudi Arabia
          </p>
        </div>
        <div className="bg-[var(--white,white)] content-stretch flex items-center overflow-clip px-[24px] py-[15px] relative shrink-0 w-full" data-node-id="157:3393" data-name="Row 09">
          <p className="[word-break:break-word] font-['Poppins:Medium'] leading-[22px] not-italic relative shrink-0 text-[14px] text-[color:var(--text\/muted,#8a93a3)] w-[64px]" data-node-id="157:3394">
            09
          </p>
          <p className="[word-break:break-word] flex-[1_0_0] font-['Poppins:Medium'] leading-[22px] min-w-px not-italic relative text-[14px] text-[color:var(--navy\/950,#011025)]" data-node-id="157:3395">
            Fire Alarm Cables
          </p>
          <div className="content-start flex flex-wrap gap-y-[6px] items-start overflow-clip relative shrink-0 w-[360px]" data-node-id="157:3396" data-name="Brands">
            <div className="bg-[var(--gold\/50,#fbf4e3)] border border-[var(--gold\/300,#efcb76)] border-solid content-stretch flex items-start overflow-clip px-[10px] py-[4px] relative rounded-[8px] shrink-0" data-node-id="157:3397" data-name="MESC">
              <p className="[word-break:break-word] font-['Poppins:SemiBold'] leading-[22px] not-italic relative shrink-0 text-[14px] text-[color:var(--navy\/950,#011025)] whitespace-nowrap" data-node-id="157:3398">
                MESC
              </p>
            </div>
          </div>
          <p className="[word-break:break-word] font-['Poppins:Regular'] leading-[22px] not-italic relative shrink-0 text-[14px] text-[color:var(--text\/body,#5b6475)] w-[230px]" data-node-id="157:3399">
            Saudi Arabia
          </p>
        </div>
        <div className="bg-[var(--surface,#f6f8fb)] content-stretch flex items-center overflow-clip px-[24px] py-[15px] relative shrink-0 w-full" data-node-id="157:3400" data-name="Row 10">
          <p className="[word-break:break-word] font-['Poppins:Medium'] leading-[22px] not-italic relative shrink-0 text-[14px] text-[color:var(--text\/muted,#8a93a3)] w-[64px]" data-node-id="157:3401">
            10
          </p>
          <p className="[word-break:break-word] flex-[1_0_0] font-['Poppins:Medium'] leading-[22px] min-w-px not-italic relative text-[14px] text-[color:var(--navy\/950,#011025)]" data-node-id="157:3402">
            Floor Box Data Cable
          </p>
          <div className="content-start flex flex-wrap gap-[6px] items-start overflow-clip relative shrink-0 w-[360px]" data-node-id="157:3403" data-name="Brands">
            <div className="bg-[var(--gold\/50,#fbf4e3)] border border-[var(--gold\/300,#efcb76)] border-solid content-stretch flex items-start overflow-clip px-[10px] py-[4px] relative rounded-[8px] shrink-0" data-node-id="157:3404" data-name="Belden">
              <p className="[word-break:break-word] font-['Poppins:SemiBold'] leading-[22px] not-italic relative shrink-0 text-[14px] text-[color:var(--navy\/950,#011025)] whitespace-nowrap" data-node-id="157:3405">
                Belden
              </p>
            </div>
            <div className="bg-[var(--gold\/50,#fbf4e3)] border border-[var(--gold\/300,#efcb76)] border-solid content-stretch flex items-start overflow-clip px-[10px] py-[4px] relative rounded-[8px] shrink-0" data-node-id="157:3406" data-name="CommScope">
              <p className="[word-break:break-word] font-['Poppins:SemiBold'] leading-[22px] not-italic relative shrink-0 text-[14px] text-[color:var(--navy\/950,#011025)] whitespace-nowrap" data-node-id="157:3407">
                CommScope
              </p>
            </div>
            <div className="bg-[var(--gold\/50,#fbf4e3)] border border-[var(--gold\/300,#efcb76)] border-solid content-stretch flex items-start overflow-clip px-[10px] py-[4px] relative rounded-[8px] shrink-0" data-node-id="157:3408" data-name="MESC">
              <p className="[word-break:break-word] font-['Poppins:SemiBold'] leading-[22px] not-italic relative shrink-0 text-[14px] text-[color:var(--navy\/950,#011025)] whitespace-nowrap" data-node-id="157:3409">
                MESC
              </p>
            </div>
          </div>
          <p className="[word-break:break-word] font-['Poppins:Regular'] leading-[22px] not-italic relative shrink-0 text-[14px] text-[color:var(--text\/body,#5b6475)] w-[230px]" data-node-id="157:3410">
            USA · Saudi Arabia
          </p>
        </div>
      </div>
      <div className="content-stretch flex gap-[16px] items-center overflow-clip relative shrink-0 w-full" data-node-id="157:3411" data-name="Table footer">
        <p className="[word-break:break-word] flex-[1_0_0] font-['Poppins:Regular'] leading-[22px] min-w-px not-italic relative text-[14px] text-[color:var(--text\/body,#5b6475)]" data-node-id="157:3412">
          Showing 10 of 20 electrical items
        </p>
        <Button className="border-[1.5px] border-[var(--navy\/950,#011025)] border-solid content-stretch flex gap-[10px] items-center justify-center pl-[26px] pr-[24px] py-[14px] relative rounded-[8px] shrink-0" label="View all 20 items" />
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
These styles are contained in the design: Label/Eyebrow: Font(family: "Poppins", style: SemiBold, size: 12, weight: 600, lineHeight: 16, letterSpacing: 8), Heading/H2: Font(family: "Poppins", style: Bold, size: 44, weight: 700, lineHeight: 52, letterSpacing: -1), Body/L: Font(family: "Poppins", style: Regular, size: 18, weight: 400, lineHeight: 30, letterSpacing: 0), Body/S: Font(family: "Poppins", style: Regular, size: 14, weight: 400, lineHeight: 22, letterSpacing: 0), Label/Nav: Font(family: "Poppins", style: Medium, size: 15, weight: 500, lineHeight: 22, letterSpacing: 0), Label/Tag: Font(family: "Poppins", style: SemiBold, size: 11, weight: 600, lineHeight: 14, letterSpacing: 6), Label/Caps: Font(family: "Poppins", style: SemiBold, size: 12, weight: 600, lineHeight: 16, letterSpacing: 10), Body/S Medium: Font(family: "Poppins", style: Medium, size: 14, weight: 500, lineHeight: 22, letterSpacing: 0), Label/Link: Font(family: "Poppins", style: SemiBold, size: 14, weight: 600, lineHeight: 22, letterSpacing: 0), Label/Button: Font(family: "Poppins", style: SemiBold, size: 15, weight: 600, lineHeight: 22, letterSpacing: 0).
```

```text
The generated code contains image and SVG URL constants, e.g. const image = `${assetPathPrefix}/<asset file name>`, where assetPathPrefix is declared once at the top of the code and every asset URL interpolates it. These URLs are temporary download sources and expire after 7 days. Download each asset into the project with curl -L, then replace its URL in the generated code with a reference to the downloaded asset. Never use the temporary URLs as runtime image sources.
```
