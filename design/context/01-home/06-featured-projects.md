# Featured projects

- Figma node: `18:308` (file `tD3pU1vtvSr8akTMJPFLkA`)
- Page: 01 Home
- Source: Figma MCP `get_design_context` (React + Tailwind reference code, saved verbatim). Treat as a high-fidelity reference, not production code: convert absolute positioning into real layout.
- The temporary `assetPathPrefix` URLs below expire; use the local files in the asset table instead.

## Asset map (code constant -> local file)

| Constant | Figma asset file | Local file (relative to design/) |
|---|---|---|
| `imgArrow` | `7d578.svg` | `assets/context/01-home/06-featured-projects/imgArrow.svg` |
| `imgEllipse` | `f1f80.svg` | `assets/context/01-home/06-featured-projects/imgEllipse.svg` |
| `imgImage` | `0ee6d.png` | `assets/images/svc-smart.png` (shared image) |
| `imgImage1` | `7cda0.png` | `assets/images/about-team.png` (shared image) |
| `imgImage2` | `c663e.png` | `assets/images/proj-tower.png` (shared image) |
| `imgImage3` | `efac6.png` | `assets/images/svc-mep.png` (shared image) |
| `imgFrame` | `f349a.svg` | `assets/context/01-home/06-featured-projects/imgFrame.svg` |
| `imgEllipse1` | `d67b3.svg` | `assets/context/01-home/06-featured-projects/imgEllipse1.svg` |

## Reference code

```jsx
const assetPathPrefix = "https://www.figma.com/api/mcp/asset/1786f5b3-120c-4e0a-ab11-0a23d2213711";
const imgArrow = `${assetPathPrefix}/7d578.svg`;
const imgEllipse = `${assetPathPrefix}/f1f80.svg`;
const imgImage = `${assetPathPrefix}/0ee6d.png`;
const imgImage1 = `${assetPathPrefix}/7cda0.png`;
const imgImage2 = `${assetPathPrefix}/c663e.png`;
const imgImage3 = `${assetPathPrefix}/efac6.png`;
const imgFrame = `${assetPathPrefix}/f349a.svg`;
const imgEllipse1 = `${assetPathPrefix}/d67b3.svg`;

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

export default function FeaturedProjects() {
  return (
    <div className="bg-[var(--surface,#f6f8fb)] content-stretch flex flex-col gap-[48px] items-center px-[140px] py-[72px] relative size-full" data-node-id="18:308" data-name="Featured projects">
      <div className="content-stretch flex flex-col gap-[16px] items-center relative shrink-0" data-node-id="18:309" data-name="Section head">
        <Eyebrow className="bg-[var(--gold\/50,#fbf4e3)] border border-[rgba(239,203,118,0.6)] border-solid content-stretch flex gap-[8px] items-center px-[14px] py-[6px] relative rounded-[100px] shrink-0" label="Our Portfolio" />
        <p className="[word-break:break-word] font-['Poppins:Bold'] leading-[0] not-italic relative shrink-0 text-[44px] text-[color:var(--navy\/950,#011025)] text-center tracking-[-0.44px] whitespace-nowrap" data-node-id="18:313">
          <span className="leading-[52px]">{`Featured `}</span>
          <span className="leading-[52px] text-[#dfa82a]">Projects</span>
        </p>
        <p className="[word-break:break-word] font-['Poppins:Regular'] leading-[30px] not-italic relative shrink-0 text-[18px] text-[color:var(--text\/body,#5b6475)] text-center w-[620px]" data-node-id="18:314">
          A showcase of our most prestigious MEP construction and smart systems projects across the Gulf region.
        </p>
        <div className="bg-gradient-to-r from-[#dfa82a] h-[3px] relative rounded-[2px] shrink-0 to-[#efcb76] w-[52px]" data-node-id="18:315" data-name="Divider" />
      </div>
      <div className="content-start cursor-pointer flex flex-wrap gap-[24px] items-start relative shrink-0 w-full" data-node-id="18:316" data-name="Grid">
        <a className="bg-[var(--navy\/900,#0b1a33)] content-stretch flex flex-col h-[280px] items-start justify-end overflow-clip pb-[18px] pt-[16px] px-[22px] relative rounded-[18px] shadow-[0px_10px_28px_0px_rgba(1,16,37,0.12)] shrink-0 w-[370.66px]" data-node-id="18:317" data-name="Project Card">
          <div className="absolute h-[280px] left-0 top-0 w-[370px]" data-node-id="I18:317;15:196" data-name="Image">
            <img alt="" className="absolute inset-0 max-w-none object-cover pointer-events-none size-full" src={imgImage} />
          </div>
          <div className="absolute bg-gradient-to-b from-[rgba(1,16,37,0.15)] h-[280px] left-0 to-[rgba(1,16,37,0.92)] top-0 via-[45%] via-[rgba(1,16,37,0.2)] w-[370px]" data-node-id="I18:317;15:197" data-name="Overlay" />
          <div className="absolute bg-[rgba(1,16,37,0.55)] border border-[rgba(255,255,255,0.15)] border-solid content-stretch flex items-start left-[16px] px-[10px] py-[5px] rounded-[100px] top-[16px]" data-node-id="I18:317;15:198" data-name="Category">
            <p className="[word-break:break-word] font-['Poppins:SemiBold'] leading-[14px] not-italic relative shrink-0 text-[11px] text-[color:var(--white,white)] text-left tracking-[0.66px] whitespace-nowrap" data-node-id="I18:317;15:199">
              LOW CURRENT SCS
            </p>
          </div>
          <div className="absolute bg-[rgba(1,16,37,0.55)] border border-[rgba(255,255,255,0.15)] border-solid content-stretch flex items-center px-[10px] py-[5px] right-[16px] rounded-[100px] top-[16px]" data-node-id="I18:317;15:200" data-name="Status">
            <p className="[word-break:break-word] font-['Poppins:SemiBold'] leading-[14px] not-italic relative shrink-0 text-[11px] text-[color:var(--white,white)] text-left tracking-[0.66px] whitespace-nowrap" data-node-id="I18:317;15:201">
              Completed
            </p>
          </div>
          <div className="content-stretch flex flex-col gap-[8px] items-start relative shrink-0 w-full" data-node-id="I18:317;15:202" data-name="Body">
            <p className="[word-break:break-word] font-['Poppins:SemiBold'] leading-[28px] min-w-full not-italic relative shrink-0 text-[20px] text-[color:var(--white,white)] text-left w-[min-content]" data-node-id="I18:317;15:203">
              Princess Noura University (PNU)
            </p>
            <div className="content-stretch flex gap-[6px] items-center relative shrink-0" data-node-id="I18:317;15:204" data-name="Location">
              <div className="relative shrink-0 size-[14px]" data-node-id="I18:317;15:205" data-name="Frame">
                <img alt="" className="absolute block inset-0 max-w-none size-full" src={imgFrame} />
              </div>
              <p className="[word-break:break-word] font-['Poppins:Regular'] leading-[20px] not-italic opacity-80 relative shrink-0 text-[13px] text-left text-white whitespace-nowrap" data-node-id="I18:317;15:207">
                Riyadh, KSA
              </p>
            </div>
          </div>
          <div className="absolute bg-[var(--gold\/500,#dfa82a)] h-[4px] left-0 top-[276px] w-[0.01px]" data-node-id="I18:317;15:212" data-name="Gold bar" />
        </a>
        <a className="bg-[var(--navy\/900,#0b1a33)] content-stretch flex flex-col h-[280px] items-start justify-end overflow-clip pb-[18px] pt-[16px] px-[22px] relative rounded-[18px] shadow-[0px_10px_28px_0px_rgba(1,16,37,0.12)] shrink-0 w-[370.66px]" data-node-id="18:335" data-name="Project Card">
          <div className="absolute h-[280px] left-0 top-0 w-[370px]" data-node-id="I18:335;15:196" data-name="Image">
            <img alt="" className="absolute inset-0 max-w-none object-cover pointer-events-none size-full" src={imgImage1} />
          </div>
          <div className="absolute bg-gradient-to-b from-[rgba(1,16,37,0.15)] h-[280px] left-0 to-[rgba(1,16,37,0.92)] top-0 via-[45%] via-[rgba(1,16,37,0.2)] w-[370px]" data-node-id="I18:335;15:197" data-name="Overlay" />
          <div className="absolute bg-[rgba(1,16,37,0.55)] border border-[rgba(255,255,255,0.15)] border-solid content-stretch flex items-start left-[16px] px-[10px] py-[5px] rounded-[100px] top-[16px]" data-node-id="I18:335;15:198" data-name="Category">
            <p className="[word-break:break-word] font-['Poppins:SemiBold'] leading-[14px] not-italic relative shrink-0 text-[11px] text-[color:var(--white,white)] text-left tracking-[0.66px] whitespace-nowrap" data-node-id="I18:335;15:199">
              FULL MEP WORKS
            </p>
          </div>
          <div className="absolute bg-[rgba(1,16,37,0.55)] border border-[rgba(255,255,255,0.15)] border-solid content-stretch flex items-center px-[10px] py-[5px] right-[16px] rounded-[100px] top-[16px]" data-node-id="I18:335;15:200" data-name="Status">
            <p className="[word-break:break-word] font-['Poppins:SemiBold'] leading-[14px] not-italic relative shrink-0 text-[11px] text-[color:var(--white,white)] text-left tracking-[0.66px] whitespace-nowrap" data-node-id="I18:335;15:201">
              Completed
            </p>
          </div>
          <div className="content-stretch flex flex-col gap-[8px] items-start relative shrink-0 w-full" data-node-id="I18:335;15:202" data-name="Body">
            <p className="[word-break:break-word] font-['Poppins:SemiBold'] leading-[28px] min-w-full not-italic relative shrink-0 text-[20px] text-[color:var(--white,white)] text-left w-[min-content]" data-node-id="I18:335;15:203">
              Sofitel Makkah Hotel
            </p>
            <div className="content-stretch flex gap-[6px] items-center relative shrink-0" data-node-id="I18:335;15:204" data-name="Location">
              <div className="relative shrink-0 size-[14px]" data-node-id="I18:335;15:205" data-name="Frame">
                <img alt="" className="absolute block inset-0 max-w-none size-full" src={imgFrame} />
              </div>
              <p className="[word-break:break-word] font-['Poppins:Regular'] leading-[20px] not-italic opacity-80 relative shrink-0 text-[13px] text-left text-white whitespace-nowrap" data-node-id="I18:335;15:207">
                Makkah, KSA
              </p>
            </div>
          </div>
          <div className="absolute bg-[var(--gold\/500,#dfa82a)] h-[4px] left-0 top-[276px] w-[0.01px]" data-node-id="I18:335;15:212" data-name="Gold bar" />
        </a>
        <a className="bg-[var(--navy\/900,#0b1a33)] content-stretch flex flex-col h-[280px] items-start justify-end overflow-clip pb-[18px] pt-[16px] px-[22px] relative rounded-[18px] shadow-[0px_10px_28px_0px_rgba(1,16,37,0.12)] shrink-0 w-[370.66px]" data-node-id="18:353" data-name="Project Card">
          <div className="absolute h-[280px] left-0 top-0 w-[370px]" data-node-id="I18:353;15:232" data-name="Image">
            <img alt="" className="absolute inset-0 max-w-none object-cover pointer-events-none size-full" src={imgImage2} />
          </div>
          <div className="absolute bg-gradient-to-b from-[rgba(1,16,37,0.15)] h-[280px] left-0 to-[rgba(1,16,37,0.92)] top-0 via-[45%] via-[rgba(1,16,37,0.2)] w-[370px]" data-node-id="I18:353;15:233" data-name="Overlay" />
          <div className="absolute bg-[rgba(1,16,37,0.55)] border border-[rgba(255,255,255,0.15)] border-solid content-stretch flex items-start left-[16px] px-[10px] py-[5px] rounded-[100px] top-[16px]" data-node-id="I18:353;15:234" data-name="Category">
            <p className="[word-break:break-word] font-['Poppins:SemiBold'] leading-[14px] not-italic relative shrink-0 text-[11px] text-[color:var(--white,white)] text-left tracking-[0.66px] whitespace-nowrap" data-node-id="I18:353;15:235">
              FULL MEP WORKS
            </p>
          </div>
          <div className="absolute bg-[rgba(33,161,107,0.18)] border border-[rgba(51,204,128,0.5)] border-solid content-stretch flex gap-[6px] items-center px-[10px] py-[5px] right-[16px] rounded-[100px] top-[16px]" data-node-id="I18:353;15:236" data-name="Status">
            <div className="relative shrink-0 size-[6px]" data-node-id="I18:353;15:237" data-name="Ellipse">
              <img alt="" className="absolute block inset-0 max-w-none size-full" src={imgEllipse1} />
            </div>
            <p className="[word-break:break-word] font-['Poppins:SemiBold'] leading-[14px] not-italic relative shrink-0 text-[#73eba6] text-[11px] text-left tracking-[0.66px] whitespace-nowrap" data-node-id="I18:353;15:238">
              In Progress
            </p>
          </div>
          <div className="content-stretch flex flex-col gap-[8px] items-start relative shrink-0 w-full" data-node-id="I18:353;15:239" data-name="Body">
            <p className="[word-break:break-word] font-['Poppins:SemiBold'] leading-[28px] min-w-full not-italic relative shrink-0 text-[20px] text-[color:var(--white,white)] text-left w-[min-content]" data-node-id="I18:353;15:240">
              Stella Hotel (32 Floors)
            </p>
            <div className="content-stretch flex gap-[6px] items-center relative shrink-0" data-node-id="I18:353;15:241" data-name="Location">
              <div className="relative shrink-0 size-[14px]" data-node-id="I18:353;15:242" data-name="Frame">
                <img alt="" className="absolute block inset-0 max-w-none size-full" src={imgFrame} />
              </div>
              <p className="[word-break:break-word] font-['Poppins:Regular'] leading-[20px] not-italic opacity-80 relative shrink-0 text-[13px] text-left text-white whitespace-nowrap" data-node-id="I18:353;15:244">
                Dubai, UAE
              </p>
            </div>
          </div>
          <div className="absolute bg-[var(--gold\/500,#dfa82a)] h-[4px] left-0 top-[276px] w-[0.01px]" data-node-id="I18:353;15:249" data-name="Gold bar" />
        </a>
        <a className="bg-[var(--navy\/900,#0b1a33)] content-stretch flex flex-col h-[280px] items-start justify-end overflow-clip pb-[18px] pt-[16px] px-[22px] relative rounded-[18px] shadow-[0px_10px_28px_0px_rgba(1,16,37,0.12)] shrink-0 w-[370.66px]" data-node-id="18:372" data-name="Project Card">
          <div className="absolute h-[280px] left-0 top-0 w-[370px]" data-node-id="I18:372;15:196" data-name="Image">
            <img alt="" className="absolute inset-0 max-w-none object-cover pointer-events-none size-full" src={imgImage} />
          </div>
          <div className="absolute bg-gradient-to-b from-[rgba(1,16,37,0.15)] h-[280px] left-0 to-[rgba(1,16,37,0.92)] top-0 via-[45%] via-[rgba(1,16,37,0.2)] w-[370px]" data-node-id="I18:372;15:197" data-name="Overlay" />
          <div className="absolute bg-[rgba(1,16,37,0.55)] border border-[rgba(255,255,255,0.15)] border-solid content-stretch flex items-start left-[16px] px-[10px] py-[5px] rounded-[100px] top-[16px]" data-node-id="I18:372;15:198" data-name="Category">
            <p className="[word-break:break-word] font-['Poppins:SemiBold'] leading-[14px] not-italic relative shrink-0 text-[11px] text-[color:var(--white,white)] text-left tracking-[0.66px] whitespace-nowrap" data-node-id="I18:372;15:199">
              DATA CENTER MEP
            </p>
          </div>
          <div className="absolute bg-[rgba(1,16,37,0.55)] border border-[rgba(255,255,255,0.15)] border-solid content-stretch flex items-center px-[10px] py-[5px] right-[16px] rounded-[100px] top-[16px]" data-node-id="I18:372;15:200" data-name="Status">
            <p className="[word-break:break-word] font-['Poppins:SemiBold'] leading-[14px] not-italic relative shrink-0 text-[11px] text-[color:var(--white,white)] text-left tracking-[0.66px] whitespace-nowrap" data-node-id="I18:372;15:201">
              Completed
            </p>
          </div>
          <div className="content-stretch flex flex-col gap-[8px] items-start relative shrink-0 w-full" data-node-id="I18:372;15:202" data-name="Body">
            <p className="[word-break:break-word] font-['Poppins:SemiBold'] leading-[28px] min-w-full not-italic relative shrink-0 text-[20px] text-[color:var(--white,white)] text-left w-[min-content]" data-node-id="I18:372;15:203">{`Roads & Transport Authority (RTA)`}</p>
            <div className="content-stretch flex gap-[6px] items-center relative shrink-0" data-node-id="I18:372;15:204" data-name="Location">
              <div className="relative shrink-0 size-[14px]" data-node-id="I18:372;15:205" data-name="Frame">
                <img alt="" className="absolute block inset-0 max-w-none size-full" src={imgFrame} />
              </div>
              <p className="[word-break:break-word] font-['Poppins:Regular'] leading-[20px] not-italic opacity-80 relative shrink-0 text-[13px] text-left text-white whitespace-nowrap" data-node-id="I18:372;15:207">
                Dubai, UAE
              </p>
            </div>
          </div>
          <div className="absolute bg-[var(--gold\/500,#dfa82a)] h-[4px] left-0 top-[276px] w-[0.01px]" data-node-id="I18:372;15:212" data-name="Gold bar" />
        </a>
        <a className="bg-[var(--navy\/900,#0b1a33)] content-stretch flex flex-col h-[280px] items-start justify-end overflow-clip pb-[18px] pt-[16px] px-[22px] relative rounded-[18px] shadow-[0px_10px_28px_0px_rgba(1,16,37,0.12)] shrink-0 w-[370.66px]" data-node-id="18:390" data-name="Project Card">
          <div className="absolute h-[280px] left-0 top-0 w-[370px]" data-node-id="I18:390;15:196" data-name="Image">
            <img alt="" className="absolute inset-0 max-w-none object-cover pointer-events-none size-full" src={imgImage3} />
          </div>
          <div className="absolute bg-gradient-to-b from-[rgba(1,16,37,0.15)] h-[280px] left-0 to-[rgba(1,16,37,0.92)] top-0 via-[45%] via-[rgba(1,16,37,0.2)] w-[370px]" data-node-id="I18:390;15:197" data-name="Overlay" />
          <div className="absolute bg-[rgba(1,16,37,0.55)] border border-[rgba(255,255,255,0.15)] border-solid content-stretch flex items-start left-[16px] px-[10px] py-[5px] rounded-[100px] top-[16px]" data-node-id="I18:390;15:198" data-name="Category">
            <p className="[word-break:break-word] font-['Poppins:SemiBold'] leading-[14px] not-italic relative shrink-0 text-[11px] text-[color:var(--white,white)] text-left tracking-[0.66px] whitespace-nowrap" data-node-id="I18:390;15:199">
              FULL MEP WORKS
            </p>
          </div>
          <div className="absolute bg-[rgba(1,16,37,0.55)] border border-[rgba(255,255,255,0.15)] border-solid content-stretch flex items-center px-[10px] py-[5px] right-[16px] rounded-[100px] top-[16px]" data-node-id="I18:390;15:200" data-name="Status">
            <p className="[word-break:break-word] font-['Poppins:SemiBold'] leading-[14px] not-italic relative shrink-0 text-[11px] text-[color:var(--white,white)] text-left tracking-[0.66px] whitespace-nowrap" data-node-id="I18:390;15:201">
              Completed
            </p>
          </div>
          <div className="content-stretch flex flex-col gap-[8px] items-start relative shrink-0 w-full" data-node-id="I18:390;15:202" data-name="Body">
            <p className="[word-break:break-word] font-['Poppins:SemiBold'] leading-[28px] min-w-full not-italic relative shrink-0 text-[20px] text-[color:var(--white,white)] text-left w-[min-content]" data-node-id="I18:390;15:203">
              King Salman Oasis of Science
            </p>
            <div className="content-stretch flex gap-[6px] items-center relative shrink-0" data-node-id="I18:390;15:204" data-name="Location">
              <div className="relative shrink-0 size-[14px]" data-node-id="I18:390;15:205" data-name="Frame">
                <img alt="" className="absolute block inset-0 max-w-none size-full" src={imgFrame} />
              </div>
              <p className="[word-break:break-word] font-['Poppins:Regular'] leading-[20px] not-italic opacity-80 relative shrink-0 text-[13px] text-left text-white whitespace-nowrap" data-node-id="I18:390;15:207">
                Riyadh, KSA
              </p>
            </div>
          </div>
          <div className="absolute bg-[var(--gold\/500,#dfa82a)] h-[4px] left-0 top-[276px] w-[0.01px]" data-node-id="I18:390;15:212" data-name="Gold bar" />
        </a>
        <a className="bg-[var(--navy\/900,#0b1a33)] content-stretch flex flex-col h-[280px] items-start justify-end overflow-clip pb-[18px] pt-[16px] px-[22px] relative rounded-[18px] shadow-[0px_10px_28px_0px_rgba(1,16,37,0.12)] shrink-0 w-[370.66px]" data-node-id="18:408" data-name="Project Card">
          <div className="absolute h-[280px] left-0 top-0 w-[370px]" data-node-id="I18:408;15:196" data-name="Image">
            <img alt="" className="absolute inset-0 max-w-none object-cover pointer-events-none size-full" src={imgImage1} />
          </div>
          <div className="absolute bg-gradient-to-b from-[rgba(1,16,37,0.15)] h-[280px] left-0 to-[rgba(1,16,37,0.92)] top-0 via-[45%] via-[rgba(1,16,37,0.2)] w-[370px]" data-node-id="I18:408;15:197" data-name="Overlay" />
          <div className="absolute bg-[rgba(1,16,37,0.55)] border border-[rgba(255,255,255,0.15)] border-solid content-stretch flex items-start left-[16px] px-[10px] py-[5px] rounded-[100px] top-[16px]" data-node-id="I18:408;15:198" data-name="Category">
            <p className="[word-break:break-word] font-['Poppins:SemiBold'] leading-[14px] not-italic relative shrink-0 text-[11px] text-[color:var(--white,white)] text-left tracking-[0.66px] whitespace-nowrap" data-node-id="I18:408;15:199">
              FULL MEP WORKS
            </p>
          </div>
          <div className="absolute bg-[rgba(1,16,37,0.55)] border border-[rgba(255,255,255,0.15)] border-solid content-stretch flex items-center px-[10px] py-[5px] right-[16px] rounded-[100px] top-[16px]" data-node-id="I18:408;15:200" data-name="Status">
            <p className="[word-break:break-word] font-['Poppins:SemiBold'] leading-[14px] not-italic relative shrink-0 text-[11px] text-[color:var(--white,white)] text-left tracking-[0.66px] whitespace-nowrap" data-node-id="I18:408;15:201">
              Completed
            </p>
          </div>
          <div className="content-stretch flex flex-col gap-[8px] items-start relative shrink-0 w-full" data-node-id="I18:408;15:202" data-name="Body">
            <p className="[word-break:break-word] font-['Poppins:SemiBold'] leading-[28px] min-w-full not-italic relative shrink-0 text-[20px] text-[color:var(--white,white)] text-left w-[min-content]" data-node-id="I18:408;15:203">
              Al Maqam Towers (A, B, C, D)
            </p>
            <div className="content-stretch flex gap-[6px] items-center relative shrink-0" data-node-id="I18:408;15:204" data-name="Location">
              <div className="relative shrink-0 size-[14px]" data-node-id="I18:408;15:205" data-name="Frame">
                <img alt="" className="absolute block inset-0 max-w-none size-full" src={imgFrame} />
              </div>
              <p className="[word-break:break-word] font-['Poppins:Regular'] leading-[20px] not-italic opacity-80 relative shrink-0 text-[13px] text-left text-white whitespace-nowrap" data-node-id="I18:408;15:207">
                Makkah, KSA
              </p>
            </div>
          </div>
          <div className="absolute bg-[var(--gold\/500,#dfa82a)] h-[4px] left-0 top-[276px] w-[0.01px]" data-node-id="I18:408;15:212" data-name="Gold bar" />
        </a>
      </div>
      <Button className="bg-[var(--navy\/950,#011025)] content-stretch cursor-pointer flex gap-[10px] items-center justify-center pl-[26px] pr-[24px] py-[14px] relative rounded-[8px] shrink-0" label="View All Projects" />
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
These styles are contained in the design: Label/Eyebrow: Font(family: "Poppins", style: SemiBold, size: 12, weight: 600, lineHeight: 16, letterSpacing: 8), Heading/H2: Font(family: "Poppins", style: Bold, size: 44, weight: 700, lineHeight: 52, letterSpacing: -1), Body/L: Font(family: "Poppins", style: Regular, size: 18, weight: 400, lineHeight: 30, letterSpacing: 0), Label/Tag: Font(family: "Poppins", style: SemiBold, size: 11, weight: 600, lineHeight: 14, letterSpacing: 6), Heading/H4: Font(family: "Poppins", style: SemiBold, size: 20, weight: 600, lineHeight: 28, letterSpacing: 0), Caption: Font(family: "Poppins", style: Regular, size: 13, weight: 400, lineHeight: 20, letterSpacing: 0), Label/Button: Font(family: "Poppins", style: SemiBold, size: 15, weight: 600, lineHeight: 22, letterSpacing: 0).
```

```text
The generated code contains image and SVG URL constants, e.g. const image = `${assetPathPrefix}/<asset file name>`, where assetPathPrefix is declared once at the top of the code and every asset URL interpolates it. These URLs are temporary download sources and expire after 7 days. Download each asset into the project with curl -L, then replace its URL in the generated code with a reference to the downloaded asset. Never use the temporary URLs as runtime image sources.
```
