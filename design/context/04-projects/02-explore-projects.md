# Explore projects

- Figma node: `19:568` (file `tD3pU1vtvSr8akTMJPFLkA`)
- Page: 04 Projects
- Source: Figma MCP `get_design_context` (React + Tailwind reference code, saved verbatim). Treat as a high-fidelity reference, not production code: convert absolute positioning into real layout.
- The temporary `assetPathPrefix` URLs below expire; use the local files in the asset table instead.

## Asset map (code constant -> local file)

| Constant | Figma asset file | Local file (relative to design/) |
|---|---|---|
| `imgImage` | `0ee6d.png` | `assets/images/svc-smart.png` (shared image) |
| `imgImage1` | `7cda0.png` | `assets/images/about-team.png` (shared image) |
| `imgImage2` | `c663e.png` | `assets/images/proj-tower.png` (shared image) |
| `imgImage3` | `efac6.png` | `assets/images/svc-mep.png` (shared image) |
| `imgImage4` | `fac6f.png` | `assets/images/svc-fire.png` (shared image) |
| `imgFrame` | `f349a.svg` | `assets/context/04-projects/02-explore-projects/imgFrame.svg` |
| `imgEllipse` | `d67b3.svg` | `assets/context/04-projects/02-explore-projects/imgEllipse.svg` |

## Reference code

```jsx
const assetPathPrefix = "https://www.figma.com/api/mcp/asset/85f24050-1ecb-4887-8521-8231456701b8";
const imgImage = `${assetPathPrefix}/0ee6d.png`;
const imgImage1 = `${assetPathPrefix}/7cda0.png`;
const imgImage2 = `${assetPathPrefix}/c663e.png`;
const imgImage3 = `${assetPathPrefix}/efac6.png`;
const imgImage4 = `${assetPathPrefix}/fac6f.png`;
const imgFrame = `${assetPathPrefix}/f349a.svg`;
const imgEllipse = `${assetPathPrefix}/d67b3.svg`;

export default function ExploreProjects() {
  return (
    <div className="bg-[var(--surface,#f6f8fb)] content-stretch flex flex-col gap-[40px] items-center pb-[72px] pt-[56px] px-[140px] relative size-full" data-node-id="19:568" data-name="Explore projects">
      <div className="content-stretch flex gap-[8px] items-center relative shrink-0" data-node-id="19:576" data-name="Filters">
        <div className="bg-[var(--navy\/950,#011025)] content-stretch flex gap-[8px] items-center pl-[16px] pr-[10px] py-[10px] relative rounded-[10px] shrink-0" data-node-id="19:577" data-name="Frame">
          <p className="[word-break:break-word] font-['Poppins:SemiBold'] leading-[22px] not-italic relative shrink-0 text-[14px] text-[color:var(--white,white)] whitespace-nowrap" data-node-id="19:578">
            All Projects
          </p>
          <div className="bg-[rgba(255,255,255,0.16)] content-stretch flex items-start px-[7px] py-[2px] relative rounded-[100px] shrink-0" data-node-id="19:579" data-name="Frame">
            <p className="[word-break:break-word] font-['Poppins:Regular'] leading-[18px] not-italic relative shrink-0 text-[12px] text-[color:var(--white,white)] whitespace-nowrap" data-node-id="19:580">
              25
            </p>
          </div>
        </div>
        <div className="content-stretch flex gap-[8px] items-center pl-[16px] pr-[10px] py-[10px] relative rounded-[10px] shrink-0" data-node-id="19:581" data-name="Frame">
          <p className="[word-break:break-word] font-['Poppins:SemiBold'] leading-[22px] not-italic relative shrink-0 text-[14px] text-[color:var(--text\/body,#5b6475)] whitespace-nowrap" data-node-id="19:582">
            MEP Works
          </p>
          <div className="bg-[var(--border,#e3e7ee)] content-stretch flex items-start px-[7px] py-[2px] relative rounded-[100px] shrink-0" data-node-id="19:583" data-name="Frame">
            <p className="[word-break:break-word] font-['Poppins:Regular'] leading-[18px] not-italic relative shrink-0 text-[12px] text-[color:var(--text\/muted,#8a93a3)] whitespace-nowrap" data-node-id="19:584">
              16
            </p>
          </div>
        </div>
        <div className="content-stretch flex gap-[8px] items-center pl-[16px] pr-[10px] py-[10px] relative rounded-[10px] shrink-0" data-node-id="19:585" data-name="Frame">
          <p className="[word-break:break-word] font-['Poppins:SemiBold'] leading-[22px] not-italic relative shrink-0 text-[14px] text-[color:var(--text\/body,#5b6475)] whitespace-nowrap" data-node-id="19:586">
            Firefighting
          </p>
          <div className="bg-[var(--border,#e3e7ee)] content-stretch flex items-start px-[7px] py-[2px] relative rounded-[100px] shrink-0" data-node-id="19:587" data-name="Frame">
            <p className="[word-break:break-word] font-['Poppins:Regular'] leading-[18px] not-italic relative shrink-0 text-[12px] text-[color:var(--text\/muted,#8a93a3)] whitespace-nowrap" data-node-id="19:588">
              2
            </p>
          </div>
        </div>
        <div className="content-stretch flex gap-[8px] items-center pl-[16px] pr-[10px] py-[10px] relative rounded-[10px] shrink-0" data-node-id="19:589" data-name="Frame">
          <p className="[word-break:break-word] font-['Poppins:SemiBold'] leading-[22px] not-italic relative shrink-0 text-[14px] text-[color:var(--text\/body,#5b6475)] whitespace-nowrap" data-node-id="19:590">
            Low Current
          </p>
          <div className="bg-[var(--border,#e3e7ee)] content-stretch flex items-start px-[7px] py-[2px] relative rounded-[100px] shrink-0" data-node-id="19:591" data-name="Frame">
            <p className="[word-break:break-word] font-['Poppins:Regular'] leading-[18px] not-italic relative shrink-0 text-[12px] text-[color:var(--text\/muted,#8a93a3)] whitespace-nowrap" data-node-id="19:592">
              4
            </p>
          </div>
        </div>
        <div className="content-stretch flex gap-[8px] items-center pl-[16px] pr-[10px] py-[10px] relative rounded-[10px] shrink-0" data-node-id="19:593" data-name="Frame">
          <p className="[word-break:break-word] font-['Poppins:SemiBold'] leading-[22px] not-italic relative shrink-0 text-[14px] text-[color:var(--text\/body,#5b6475)] whitespace-nowrap" data-node-id="19:594">
            Data Center
          </p>
          <div className="bg-[var(--border,#e3e7ee)] content-stretch flex items-start px-[7px] py-[2px] relative rounded-[100px] shrink-0" data-node-id="19:595" data-name="Frame">
            <p className="[word-break:break-word] font-['Poppins:Regular'] leading-[18px] not-italic relative shrink-0 text-[12px] text-[color:var(--text\/muted,#8a93a3)] whitespace-nowrap" data-node-id="19:596">
              1
            </p>
          </div>
        </div>
        <div className="content-stretch flex gap-[8px] items-center pl-[16px] pr-[10px] py-[10px] relative rounded-[10px] shrink-0" data-node-id="19:597" data-name="Frame">
          <p className="[word-break:break-word] font-['Poppins:SemiBold'] leading-[22px] not-italic relative shrink-0 text-[14px] text-[color:var(--text\/body,#5b6475)] whitespace-nowrap" data-node-id="19:598">{`Civil & MEP`}</p>
          <div className="bg-[var(--border,#e3e7ee)] content-stretch flex items-start px-[7px] py-[2px] relative rounded-[100px] shrink-0" data-node-id="19:599" data-name="Frame">
            <p className="[word-break:break-word] font-['Poppins:Regular'] leading-[18px] not-italic relative shrink-0 text-[12px] text-[color:var(--text\/muted,#8a93a3)] whitespace-nowrap" data-node-id="19:600">
              2
            </p>
          </div>
        </div>
      </div>
      <div className="content-start cursor-pointer flex flex-wrap gap-[24px] items-start relative shrink-0 w-full" data-node-id="19:601" data-name="Grid">
        <a className="bg-[var(--navy\/900,#0b1a33)] content-stretch flex flex-col h-[280px] items-start justify-end overflow-clip pb-[18px] pt-[16px] px-[22px] relative rounded-[18px] shadow-[0px_10px_28px_0px_rgba(1,16,37,0.12)] shrink-0 w-[370.66px]" data-node-id="19:602" data-name="Project Card">
          <div className="absolute h-[280px] left-0 top-0 w-[370px]" data-node-id="I19:602;15:196" data-name="Image">
            <img alt="" className="absolute inset-0 max-w-none object-cover pointer-events-none size-full" src={imgImage} />
          </div>
          <div className="absolute bg-gradient-to-b from-[rgba(1,16,37,0.15)] h-[280px] left-0 to-[rgba(1,16,37,0.92)] top-0 via-[45%] via-[rgba(1,16,37,0.2)] w-[370px]" data-node-id="I19:602;15:197" data-name="Overlay" />
          <div className="absolute bg-[rgba(1,16,37,0.55)] border border-[rgba(255,255,255,0.15)] border-solid content-stretch flex items-start left-[16px] px-[10px] py-[5px] rounded-[100px] top-[16px]" data-node-id="I19:602;15:198" data-name="Category">
            <p className="[word-break:break-word] font-['Poppins:SemiBold'] leading-[14px] not-italic relative shrink-0 text-[11px] text-[color:var(--white,white)] text-left tracking-[0.66px] whitespace-nowrap" data-node-id="I19:602;15:199">
              LOW CURRENT SCS
            </p>
          </div>
          <div className="absolute bg-[rgba(1,16,37,0.55)] border border-[rgba(255,255,255,0.15)] border-solid content-stretch flex items-center px-[10px] py-[5px] right-[16px] rounded-[100px] top-[16px]" data-node-id="I19:602;15:200" data-name="Status">
            <p className="[word-break:break-word] font-['Poppins:SemiBold'] leading-[14px] not-italic relative shrink-0 text-[11px] text-[color:var(--white,white)] text-left tracking-[0.66px] whitespace-nowrap" data-node-id="I19:602;15:201">
              Completed
            </p>
          </div>
          <div className="content-stretch flex flex-col gap-[8px] items-start relative shrink-0 w-full" data-node-id="I19:602;15:202" data-name="Body">
            <p className="[word-break:break-word] font-['Poppins:SemiBold'] leading-[28px] min-w-full not-italic relative shrink-0 text-[20px] text-[color:var(--white,white)] text-left w-[min-content]" data-node-id="I19:602;15:203">
              Princess Noura University (PNU)
            </p>
            <div className="content-stretch flex gap-[6px] items-center relative shrink-0" data-node-id="I19:602;15:204" data-name="Location">
              <div className="relative shrink-0 size-[14px]" data-node-id="I19:602;15:205" data-name="Frame">
                <img alt="" className="absolute block inset-0 max-w-none size-full" src={imgFrame} />
              </div>
              <p className="[word-break:break-word] font-['Poppins:Regular'] leading-[20px] not-italic opacity-80 relative shrink-0 text-[13px] text-left text-white whitespace-nowrap" data-node-id="I19:602;15:207">
                Riyadh, KSA
              </p>
            </div>
          </div>
          <div className="absolute bg-[var(--gold\/500,#dfa82a)] h-[4px] left-0 top-[276px] w-[0.01px]" data-node-id="I19:602;15:212" data-name="Gold bar" />
        </a>
        <a className="bg-[var(--navy\/900,#0b1a33)] content-stretch flex flex-col h-[280px] items-start justify-end overflow-clip pb-[18px] pt-[16px] px-[22px] relative rounded-[18px] shadow-[0px_10px_28px_0px_rgba(1,16,37,0.12)] shrink-0 w-[370.66px]" data-node-id="19:620" data-name="Project Card">
          <div className="absolute h-[280px] left-0 top-0 w-[370px]" data-node-id="I19:620;15:196" data-name="Image">
            <img alt="" className="absolute inset-0 max-w-none object-cover pointer-events-none size-full" src={imgImage1} />
          </div>
          <div className="absolute bg-gradient-to-b from-[rgba(1,16,37,0.15)] h-[280px] left-0 to-[rgba(1,16,37,0.92)] top-0 via-[45%] via-[rgba(1,16,37,0.2)] w-[370px]" data-node-id="I19:620;15:197" data-name="Overlay" />
          <div className="absolute bg-[rgba(1,16,37,0.55)] border border-[rgba(255,255,255,0.15)] border-solid content-stretch flex items-start left-[16px] px-[10px] py-[5px] rounded-[100px] top-[16px]" data-node-id="I19:620;15:198" data-name="Category">
            <p className="[word-break:break-word] font-['Poppins:SemiBold'] leading-[14px] not-italic relative shrink-0 text-[11px] text-[color:var(--white,white)] text-left tracking-[0.66px] whitespace-nowrap" data-node-id="I19:620;15:199">
              FULL MEP WORKS
            </p>
          </div>
          <div className="absolute bg-[rgba(1,16,37,0.55)] border border-[rgba(255,255,255,0.15)] border-solid content-stretch flex items-center px-[10px] py-[5px] right-[16px] rounded-[100px] top-[16px]" data-node-id="I19:620;15:200" data-name="Status">
            <p className="[word-break:break-word] font-['Poppins:SemiBold'] leading-[14px] not-italic relative shrink-0 text-[11px] text-[color:var(--white,white)] text-left tracking-[0.66px] whitespace-nowrap" data-node-id="I19:620;15:201">
              Completed
            </p>
          </div>
          <div className="content-stretch flex flex-col gap-[8px] items-start relative shrink-0 w-full" data-node-id="I19:620;15:202" data-name="Body">
            <p className="[word-break:break-word] font-['Poppins:SemiBold'] leading-[28px] min-w-full not-italic relative shrink-0 text-[20px] text-[color:var(--white,white)] text-left w-[min-content]" data-node-id="I19:620;15:203">
              Sofitel Makkah Hotel
            </p>
            <div className="content-stretch flex gap-[6px] items-center relative shrink-0" data-node-id="I19:620;15:204" data-name="Location">
              <div className="relative shrink-0 size-[14px]" data-node-id="I19:620;15:205" data-name="Frame">
                <img alt="" className="absolute block inset-0 max-w-none size-full" src={imgFrame} />
              </div>
              <p className="[word-break:break-word] font-['Poppins:Regular'] leading-[20px] not-italic opacity-80 relative shrink-0 text-[13px] text-left text-white whitespace-nowrap" data-node-id="I19:620;15:207">
                Makkah, KSA
              </p>
            </div>
          </div>
          <div className="absolute bg-[var(--gold\/500,#dfa82a)] h-[4px] left-0 top-[276px] w-[0.01px]" data-node-id="I19:620;15:212" data-name="Gold bar" />
        </a>
        <a className="bg-[var(--navy\/900,#0b1a33)] content-stretch flex flex-col h-[280px] items-start justify-end overflow-clip pb-[18px] pt-[16px] px-[22px] relative rounded-[18px] shadow-[0px_10px_28px_0px_rgba(1,16,37,0.12)] shrink-0 w-[370.66px]" data-node-id="19:638" data-name="Project Card">
          <div className="absolute h-[280px] left-0 top-0 w-[370px]" data-node-id="I19:638;15:232" data-name="Image">
            <img alt="" className="absolute inset-0 max-w-none object-cover pointer-events-none size-full" src={imgImage2} />
          </div>
          <div className="absolute bg-gradient-to-b from-[rgba(1,16,37,0.15)] h-[280px] left-0 to-[rgba(1,16,37,0.92)] top-0 via-[45%] via-[rgba(1,16,37,0.2)] w-[370px]" data-node-id="I19:638;15:233" data-name="Overlay" />
          <div className="absolute bg-[rgba(1,16,37,0.55)] border border-[rgba(255,255,255,0.15)] border-solid content-stretch flex items-start left-[16px] px-[10px] py-[5px] rounded-[100px] top-[16px]" data-node-id="I19:638;15:234" data-name="Category">
            <p className="[word-break:break-word] font-['Poppins:SemiBold'] leading-[14px] not-italic relative shrink-0 text-[11px] text-[color:var(--white,white)] text-left tracking-[0.66px] whitespace-nowrap" data-node-id="I19:638;15:235">
              FULL MEP WORKS
            </p>
          </div>
          <div className="absolute bg-[rgba(33,161,107,0.18)] border border-[rgba(51,204,128,0.5)] border-solid content-stretch flex gap-[6px] items-center px-[10px] py-[5px] right-[16px] rounded-[100px] top-[16px]" data-node-id="I19:638;15:236" data-name="Status">
            <div className="relative shrink-0 size-[6px]" data-node-id="I19:638;15:237" data-name="Ellipse">
              <img alt="" className="absolute block inset-0 max-w-none size-full" src={imgEllipse} />
            </div>
            <p className="[word-break:break-word] font-['Poppins:SemiBold'] leading-[14px] not-italic relative shrink-0 text-[#73eba6] text-[11px] text-left tracking-[0.66px] whitespace-nowrap" data-node-id="I19:638;15:238">
              In Progress
            </p>
          </div>
          <div className="content-stretch flex flex-col gap-[8px] items-start relative shrink-0 w-full" data-node-id="I19:638;15:239" data-name="Body">
            <p className="[word-break:break-word] font-['Poppins:SemiBold'] leading-[28px] min-w-full not-italic relative shrink-0 text-[20px] text-[color:var(--white,white)] text-left w-[min-content]" data-node-id="I19:638;15:240">
              Stella Hotel (32 Floors)
            </p>
            <div className="content-stretch flex gap-[6px] items-center relative shrink-0" data-node-id="I19:638;15:241" data-name="Location">
              <div className="relative shrink-0 size-[14px]" data-node-id="I19:638;15:242" data-name="Frame">
                <img alt="" className="absolute block inset-0 max-w-none size-full" src={imgFrame} />
              </div>
              <p className="[word-break:break-word] font-['Poppins:Regular'] leading-[20px] not-italic opacity-80 relative shrink-0 text-[13px] text-left text-white whitespace-nowrap" data-node-id="I19:638;15:244">
                Dubai, UAE
              </p>
            </div>
          </div>
          <div className="absolute bg-[var(--gold\/500,#dfa82a)] h-[4px] left-0 top-[276px] w-[0.01px]" data-node-id="I19:638;15:249" data-name="Gold bar" />
        </a>
        <a className="bg-[var(--navy\/900,#0b1a33)] content-stretch flex flex-col h-[280px] items-start justify-end overflow-clip pb-[18px] pt-[16px] px-[22px] relative rounded-[18px] shadow-[0px_10px_28px_0px_rgba(1,16,37,0.12)] shrink-0 w-[370.66px]" data-node-id="19:657" data-name="Project Card">
          <div className="absolute h-[280px] left-0 top-0 w-[370px]" data-node-id="I19:657;15:196" data-name="Image">
            <img alt="" className="absolute inset-0 max-w-none object-cover pointer-events-none size-full" src={imgImage} />
          </div>
          <div className="absolute bg-gradient-to-b from-[rgba(1,16,37,0.15)] h-[280px] left-0 to-[rgba(1,16,37,0.92)] top-0 via-[45%] via-[rgba(1,16,37,0.2)] w-[370px]" data-node-id="I19:657;15:197" data-name="Overlay" />
          <div className="absolute bg-[rgba(1,16,37,0.55)] border border-[rgba(255,255,255,0.15)] border-solid content-stretch flex items-start left-[16px] px-[10px] py-[5px] rounded-[100px] top-[16px]" data-node-id="I19:657;15:198" data-name="Category">
            <p className="[word-break:break-word] font-['Poppins:SemiBold'] leading-[14px] not-italic relative shrink-0 text-[11px] text-[color:var(--white,white)] text-left tracking-[0.66px] whitespace-nowrap" data-node-id="I19:657;15:199">
              DATA CENTER MEP
            </p>
          </div>
          <div className="absolute bg-[rgba(1,16,37,0.55)] border border-[rgba(255,255,255,0.15)] border-solid content-stretch flex items-center px-[10px] py-[5px] right-[16px] rounded-[100px] top-[16px]" data-node-id="I19:657;15:200" data-name="Status">
            <p className="[word-break:break-word] font-['Poppins:SemiBold'] leading-[14px] not-italic relative shrink-0 text-[11px] text-[color:var(--white,white)] text-left tracking-[0.66px] whitespace-nowrap" data-node-id="I19:657;15:201">
              Completed
            </p>
          </div>
          <div className="content-stretch flex flex-col gap-[8px] items-start relative shrink-0 w-full" data-node-id="I19:657;15:202" data-name="Body">
            <p className="[word-break:break-word] font-['Poppins:SemiBold'] leading-[28px] min-w-full not-italic relative shrink-0 text-[20px] text-[color:var(--white,white)] text-left w-[min-content]" data-node-id="I19:657;15:203">{`Roads & Transport Authority (RTA)`}</p>
            <div className="content-stretch flex gap-[6px] items-center relative shrink-0" data-node-id="I19:657;15:204" data-name="Location">
              <div className="relative shrink-0 size-[14px]" data-node-id="I19:657;15:205" data-name="Frame">
                <img alt="" className="absolute block inset-0 max-w-none size-full" src={imgFrame} />
              </div>
              <p className="[word-break:break-word] font-['Poppins:Regular'] leading-[20px] not-italic opacity-80 relative shrink-0 text-[13px] text-left text-white whitespace-nowrap" data-node-id="I19:657;15:207">
                Dubai, UAE
              </p>
            </div>
          </div>
          <div className="absolute bg-[var(--gold\/500,#dfa82a)] h-[4px] left-0 top-[276px] w-[0.01px]" data-node-id="I19:657;15:212" data-name="Gold bar" />
        </a>
        <a className="bg-[var(--navy\/900,#0b1a33)] content-stretch flex flex-col h-[280px] items-start justify-end overflow-clip pb-[18px] pt-[16px] px-[22px] relative rounded-[18px] shadow-[0px_10px_28px_0px_rgba(1,16,37,0.12)] shrink-0 w-[370.66px]" data-node-id="19:675" data-name="Project Card">
          <div className="absolute h-[280px] left-0 top-0 w-[370px]" data-node-id="I19:675;15:196" data-name="Image">
            <img alt="" className="absolute inset-0 max-w-none object-cover pointer-events-none size-full" src={imgImage3} />
          </div>
          <div className="absolute bg-gradient-to-b from-[rgba(1,16,37,0.15)] h-[280px] left-0 to-[rgba(1,16,37,0.92)] top-0 via-[45%] via-[rgba(1,16,37,0.2)] w-[370px]" data-node-id="I19:675;15:197" data-name="Overlay" />
          <div className="absolute bg-[rgba(1,16,37,0.55)] border border-[rgba(255,255,255,0.15)] border-solid content-stretch flex items-start left-[16px] px-[10px] py-[5px] rounded-[100px] top-[16px]" data-node-id="I19:675;15:198" data-name="Category">
            <p className="[word-break:break-word] font-['Poppins:SemiBold'] leading-[14px] not-italic relative shrink-0 text-[11px] text-[color:var(--white,white)] text-left tracking-[0.66px] whitespace-nowrap" data-node-id="I19:675;15:199">
              FULL MEP WORKS
            </p>
          </div>
          <div className="absolute bg-[rgba(1,16,37,0.55)] border border-[rgba(255,255,255,0.15)] border-solid content-stretch flex items-center px-[10px] py-[5px] right-[16px] rounded-[100px] top-[16px]" data-node-id="I19:675;15:200" data-name="Status">
            <p className="[word-break:break-word] font-['Poppins:SemiBold'] leading-[14px] not-italic relative shrink-0 text-[11px] text-[color:var(--white,white)] text-left tracking-[0.66px] whitespace-nowrap" data-node-id="I19:675;15:201">
              Completed
            </p>
          </div>
          <div className="content-stretch flex flex-col gap-[8px] items-start relative shrink-0 w-full" data-node-id="I19:675;15:202" data-name="Body">
            <p className="[word-break:break-word] font-['Poppins:SemiBold'] leading-[28px] min-w-full not-italic relative shrink-0 text-[20px] text-[color:var(--white,white)] text-left w-[min-content]" data-node-id="I19:675;15:203">
              King Salman Oasis of Science
            </p>
            <div className="content-stretch flex gap-[6px] items-center relative shrink-0" data-node-id="I19:675;15:204" data-name="Location">
              <div className="relative shrink-0 size-[14px]" data-node-id="I19:675;15:205" data-name="Frame">
                <img alt="" className="absolute block inset-0 max-w-none size-full" src={imgFrame} />
              </div>
              <p className="[word-break:break-word] font-['Poppins:Regular'] leading-[20px] not-italic opacity-80 relative shrink-0 text-[13px] text-left text-white whitespace-nowrap" data-node-id="I19:675;15:207">
                Riyadh, KSA
              </p>
            </div>
          </div>
          <div className="absolute bg-[var(--gold\/500,#dfa82a)] h-[4px] left-0 top-[276px] w-[0.01px]" data-node-id="I19:675;15:212" data-name="Gold bar" />
        </a>
        <a className="bg-[var(--navy\/900,#0b1a33)] content-stretch flex flex-col h-[280px] items-start justify-end overflow-clip pb-[18px] pt-[16px] px-[22px] relative rounded-[18px] shadow-[0px_10px_28px_0px_rgba(1,16,37,0.12)] shrink-0 w-[370.66px]" data-node-id="19:693" data-name="Project Card">
          <div className="absolute h-[280px] left-0 top-0 w-[370px]" data-node-id="I19:693;15:196" data-name="Image">
            <img alt="" className="absolute inset-0 max-w-none object-cover pointer-events-none size-full" src={imgImage1} />
          </div>
          <div className="absolute bg-gradient-to-b from-[rgba(1,16,37,0.15)] h-[280px] left-0 to-[rgba(1,16,37,0.92)] top-0 via-[45%] via-[rgba(1,16,37,0.2)] w-[370px]" data-node-id="I19:693;15:197" data-name="Overlay" />
          <div className="absolute bg-[rgba(1,16,37,0.55)] border border-[rgba(255,255,255,0.15)] border-solid content-stretch flex items-start left-[16px] px-[10px] py-[5px] rounded-[100px] top-[16px]" data-node-id="I19:693;15:198" data-name="Category">
            <p className="[word-break:break-word] font-['Poppins:SemiBold'] leading-[14px] not-italic relative shrink-0 text-[11px] text-[color:var(--white,white)] text-left tracking-[0.66px] whitespace-nowrap" data-node-id="I19:693;15:199">
              FULL MEP WORKS
            </p>
          </div>
          <div className="absolute bg-[rgba(1,16,37,0.55)] border border-[rgba(255,255,255,0.15)] border-solid content-stretch flex items-center px-[10px] py-[5px] right-[16px] rounded-[100px] top-[16px]" data-node-id="I19:693;15:200" data-name="Status">
            <p className="[word-break:break-word] font-['Poppins:SemiBold'] leading-[14px] not-italic relative shrink-0 text-[11px] text-[color:var(--white,white)] text-left tracking-[0.66px] whitespace-nowrap" data-node-id="I19:693;15:201">
              Completed
            </p>
          </div>
          <div className="content-stretch flex flex-col gap-[8px] items-start relative shrink-0 w-full" data-node-id="I19:693;15:202" data-name="Body">
            <p className="[word-break:break-word] font-['Poppins:SemiBold'] leading-[28px] min-w-full not-italic relative shrink-0 text-[20px] text-[color:var(--white,white)] text-left w-[min-content]" data-node-id="I19:693;15:203">
              Al Maqam Towers (A, B, C, D)
            </p>
            <div className="content-stretch flex gap-[6px] items-center relative shrink-0" data-node-id="I19:693;15:204" data-name="Location">
              <div className="relative shrink-0 size-[14px]" data-node-id="I19:693;15:205" data-name="Frame">
                <img alt="" className="absolute block inset-0 max-w-none size-full" src={imgFrame} />
              </div>
              <p className="[word-break:break-word] font-['Poppins:Regular'] leading-[20px] not-italic opacity-80 relative shrink-0 text-[13px] text-left text-white whitespace-nowrap" data-node-id="I19:693;15:207">
                Makkah, KSA
              </p>
            </div>
          </div>
          <div className="absolute bg-[var(--gold\/500,#dfa82a)] h-[4px] left-0 top-[276px] w-[0.01px]" data-node-id="I19:693;15:212" data-name="Gold bar" />
        </a>
        <a className="bg-[var(--navy\/900,#0b1a33)] content-stretch flex flex-col h-[280px] items-start justify-end overflow-clip pb-[18px] pt-[16px] px-[22px] relative rounded-[18px] shadow-[0px_10px_28px_0px_rgba(1,16,37,0.12)] shrink-0 w-[370.66px]" data-node-id="19:711" data-name="Project Card">
          <div className="absolute h-[280px] left-0 top-0 w-[370px]" data-node-id="I19:711;15:196" data-name="Image">
            <img alt="" className="absolute inset-0 max-w-none object-cover pointer-events-none size-full" src={imgImage3} />
          </div>
          <div className="absolute bg-gradient-to-b from-[rgba(1,16,37,0.15)] h-[280px] left-0 to-[rgba(1,16,37,0.92)] top-0 via-[45%] via-[rgba(1,16,37,0.2)] w-[370px]" data-node-id="I19:711;15:197" data-name="Overlay" />
          <div className="absolute bg-[rgba(1,16,37,0.55)] border border-[rgba(255,255,255,0.15)] border-solid content-stretch flex items-start left-[16px] px-[10px] py-[5px] rounded-[100px] top-[16px]" data-node-id="I19:711;15:198" data-name="Category">
            <p className="[word-break:break-word] font-['Poppins:SemiBold'] leading-[14px] not-italic relative shrink-0 text-[11px] text-[color:var(--white,white)] text-left tracking-[0.66px] whitespace-nowrap" data-node-id="I19:711;15:199">
              MEP WORKS
            </p>
          </div>
          <div className="absolute bg-[rgba(1,16,37,0.55)] border border-[rgba(255,255,255,0.15)] border-solid content-stretch flex items-center px-[10px] py-[5px] right-[16px] rounded-[100px] top-[16px]" data-node-id="I19:711;15:200" data-name="Status">
            <p className="[word-break:break-word] font-['Poppins:SemiBold'] leading-[14px] not-italic relative shrink-0 text-[11px] text-[color:var(--white,white)] text-left tracking-[0.66px] whitespace-nowrap" data-node-id="I19:711;15:201">
              Completed
            </p>
          </div>
          <div className="content-stretch flex flex-col gap-[8px] items-start relative shrink-0 w-full" data-node-id="I19:711;15:202" data-name="Body">
            <p className="[word-break:break-word] font-['Poppins:SemiBold'] leading-[28px] min-w-full not-italic relative shrink-0 text-[20px] text-[color:var(--white,white)] text-left w-[min-content]" data-node-id="I19:711;15:203">
              Bank of America (Merrill Lynch)
            </p>
            <div className="content-stretch flex gap-[6px] items-center relative shrink-0" data-node-id="I19:711;15:204" data-name="Location">
              <div className="relative shrink-0 size-[14px]" data-node-id="I19:711;15:205" data-name="Frame">
                <img alt="" className="absolute block inset-0 max-w-none size-full" src={imgFrame} />
              </div>
              <p className="[word-break:break-word] font-['Poppins:Regular'] leading-[20px] not-italic opacity-80 relative shrink-0 text-[13px] text-left text-white whitespace-nowrap" data-node-id="I19:711;15:207">
                Riyadh, KSA
              </p>
            </div>
          </div>
          <div className="absolute bg-[var(--gold\/500,#dfa82a)] h-[4px] left-0 top-[276px] w-[0.01px]" data-node-id="I19:711;15:212" data-name="Gold bar" />
        </a>
        <a className="bg-[var(--navy\/900,#0b1a33)] content-stretch flex flex-col h-[280px] items-start justify-end overflow-clip pb-[18px] pt-[16px] px-[22px] relative rounded-[18px] shadow-[0px_10px_28px_0px_rgba(1,16,37,0.12)] shrink-0 w-[370.66px]" data-node-id="19:729" data-name="Project Card">
          <div className="absolute h-[280px] left-0 top-0 w-[370px]" data-node-id="I19:729;15:196" data-name="Image">
            <img alt="" className="absolute inset-0 max-w-none object-cover pointer-events-none size-full" src={imgImage2} />
          </div>
          <div className="absolute bg-gradient-to-b from-[rgba(1,16,37,0.15)] h-[280px] left-0 to-[rgba(1,16,37,0.92)] top-0 via-[45%] via-[rgba(1,16,37,0.2)] w-[370px]" data-node-id="I19:729;15:197" data-name="Overlay" />
          <div className="absolute bg-[rgba(1,16,37,0.55)] border border-[rgba(255,255,255,0.15)] border-solid content-stretch flex items-start left-[16px] px-[10px] py-[5px] rounded-[100px] top-[16px]" data-node-id="I19:729;15:198" data-name="Category">
            <p className="[word-break:break-word] font-['Poppins:SemiBold'] leading-[14px] not-italic relative shrink-0 text-[11px] text-[color:var(--white,white)] text-left tracking-[0.66px] whitespace-nowrap" data-node-id="I19:729;15:199">
              FULL MEP WORKS
            </p>
          </div>
          <div className="absolute bg-[rgba(1,16,37,0.55)] border border-[rgba(255,255,255,0.15)] border-solid content-stretch flex items-center px-[10px] py-[5px] right-[16px] rounded-[100px] top-[16px]" data-node-id="I19:729;15:200" data-name="Status">
            <p className="[word-break:break-word] font-['Poppins:SemiBold'] leading-[14px] not-italic relative shrink-0 text-[11px] text-[color:var(--white,white)] text-left tracking-[0.66px] whitespace-nowrap" data-node-id="I19:729;15:201">
              Completed
            </p>
          </div>
          <div className="content-stretch flex flex-col gap-[8px] items-start relative shrink-0 w-full" data-node-id="I19:729;15:202" data-name="Body">
            <p className="[word-break:break-word] font-['Poppins:SemiBold'] leading-[28px] min-w-full not-italic relative shrink-0 text-[20px] text-[color:var(--white,white)] text-left w-[min-content]" data-node-id="I19:729;15:203">
              Student Accommodation Tabouk University
            </p>
            <div className="content-stretch flex gap-[6px] items-center relative shrink-0" data-node-id="I19:729;15:204" data-name="Location">
              <div className="relative shrink-0 size-[14px]" data-node-id="I19:729;15:205" data-name="Frame">
                <img alt="" className="absolute block inset-0 max-w-none size-full" src={imgFrame} />
              </div>
              <p className="[word-break:break-word] font-['Poppins:Regular'] leading-[20px] not-italic opacity-80 relative shrink-0 text-[13px] text-left text-white whitespace-nowrap" data-node-id="I19:729;15:207">
                Tabouk, KSA
              </p>
            </div>
          </div>
          <div className="absolute bg-[var(--gold\/500,#dfa82a)] h-[4px] left-0 top-[276px] w-[0.01px]" data-node-id="I19:729;15:212" data-name="Gold bar" />
        </a>
        <a className="bg-[var(--navy\/900,#0b1a33)] content-stretch flex flex-col h-[280px] items-start justify-end overflow-clip pb-[18px] pt-[16px] px-[22px] relative rounded-[18px] shadow-[0px_10px_28px_0px_rgba(1,16,37,0.12)] shrink-0 w-[370.66px]" data-node-id="19:747" data-name="Project Card">
          <div className="absolute h-[280px] left-0 top-0 w-[370px]" data-node-id="I19:747;15:196" data-name="Image">
            <img alt="" className="absolute inset-0 max-w-none object-cover pointer-events-none size-full" src={imgImage4} />
          </div>
          <div className="absolute bg-gradient-to-b from-[rgba(1,16,37,0.15)] h-[280px] left-0 to-[rgba(1,16,37,0.92)] top-0 via-[45%] via-[rgba(1,16,37,0.2)] w-[370px]" data-node-id="I19:747;15:197" data-name="Overlay" />
          <div className="absolute bg-[rgba(1,16,37,0.55)] border border-[rgba(255,255,255,0.15)] border-solid content-stretch flex items-start left-[16px] px-[10px] py-[5px] rounded-[100px] top-[16px]" data-node-id="I19:747;15:198" data-name="Category">
            <p className="[word-break:break-word] font-['Poppins:SemiBold'] leading-[14px] not-italic relative shrink-0 text-[11px] text-[color:var(--white,white)] text-left tracking-[0.66px] whitespace-nowrap" data-node-id="I19:747;15:199">
              FULL MEP WORKS
            </p>
          </div>
          <div className="absolute bg-[rgba(1,16,37,0.55)] border border-[rgba(255,255,255,0.15)] border-solid content-stretch flex items-center px-[10px] py-[5px] right-[16px] rounded-[100px] top-[16px]" data-node-id="I19:747;15:200" data-name="Status">
            <p className="[word-break:break-word] font-['Poppins:SemiBold'] leading-[14px] not-italic relative shrink-0 text-[11px] text-[color:var(--white,white)] text-left tracking-[0.66px] whitespace-nowrap" data-node-id="I19:747;15:201">
              Completed
            </p>
          </div>
          <div className="content-stretch flex flex-col gap-[8px] items-start relative shrink-0 w-full" data-node-id="I19:747;15:202" data-name="Body">
            <p className="[word-break:break-word] font-['Poppins:SemiBold'] leading-[28px] min-w-full not-italic relative shrink-0 text-[20px] text-[color:var(--white,white)] text-left w-[min-content]" data-node-id="I19:747;15:203">
              Medical Science College — Taif University
            </p>
            <div className="content-stretch flex gap-[6px] items-center relative shrink-0" data-node-id="I19:747;15:204" data-name="Location">
              <div className="relative shrink-0 size-[14px]" data-node-id="I19:747;15:205" data-name="Frame">
                <img alt="" className="absolute block inset-0 max-w-none size-full" src={imgFrame} />
              </div>
              <p className="[word-break:break-word] font-['Poppins:Regular'] leading-[20px] not-italic opacity-80 relative shrink-0 text-[13px] text-left text-white whitespace-nowrap" data-node-id="I19:747;15:207">
                Taif, KSA
              </p>
            </div>
          </div>
          <div className="absolute bg-[var(--gold\/500,#dfa82a)] h-[4px] left-0 top-[276px] w-[0.01px]" data-node-id="I19:747;15:212" data-name="Gold bar" />
        </a>
        <a className="bg-[var(--navy\/900,#0b1a33)] content-stretch flex flex-col h-[280px] items-start justify-end overflow-clip pb-[18px] pt-[16px] px-[22px] relative rounded-[18px] shadow-[0px_10px_28px_0px_rgba(1,16,37,0.12)] shrink-0 w-[370.66px]" data-node-id="19:765" data-name="Project Card">
          <div className="absolute h-[280px] left-0 top-0 w-[370px]" data-node-id="I19:765;15:196" data-name="Image">
            <img alt="" className="absolute inset-0 max-w-none object-cover pointer-events-none size-full" src={imgImage} />
          </div>
          <div className="absolute bg-gradient-to-b from-[rgba(1,16,37,0.15)] h-[280px] left-0 to-[rgba(1,16,37,0.92)] top-0 via-[45%] via-[rgba(1,16,37,0.2)] w-[370px]" data-node-id="I19:765;15:197" data-name="Overlay" />
          <div className="absolute bg-[rgba(1,16,37,0.55)] border border-[rgba(255,255,255,0.15)] border-solid content-stretch flex items-start left-[16px] px-[10px] py-[5px] rounded-[100px] top-[16px]" data-node-id="I19:765;15:198" data-name="Category">
            <p className="[word-break:break-word] font-['Poppins:SemiBold'] leading-[14px] not-italic relative shrink-0 text-[11px] text-[color:var(--white,white)] text-left tracking-[0.66px] whitespace-nowrap" data-node-id="I19:765;15:199">{`DATA & LOW CURRENT`}</p>
          </div>
          <div className="absolute bg-[rgba(1,16,37,0.55)] border border-[rgba(255,255,255,0.15)] border-solid content-stretch flex items-center px-[10px] py-[5px] right-[16px] rounded-[100px] top-[16px]" data-node-id="I19:765;15:200" data-name="Status">
            <p className="[word-break:break-word] font-['Poppins:SemiBold'] leading-[14px] not-italic relative shrink-0 text-[11px] text-[color:var(--white,white)] text-left tracking-[0.66px] whitespace-nowrap" data-node-id="I19:765;15:201">
              Completed
            </p>
          </div>
          <div className="content-stretch flex flex-col gap-[8px] items-start relative shrink-0 w-full" data-node-id="I19:765;15:202" data-name="Body">
            <p className="[word-break:break-word] font-['Poppins:SemiBold'] leading-[28px] min-w-full not-italic relative shrink-0 text-[20px] text-[color:var(--white,white)] text-left w-[min-content]" data-node-id="I19:765;15:203">
              Shaqraa University
            </p>
            <div className="content-stretch flex gap-[6px] items-center relative shrink-0" data-node-id="I19:765;15:204" data-name="Location">
              <div className="relative shrink-0 size-[14px]" data-node-id="I19:765;15:205" data-name="Frame">
                <img alt="" className="absolute block inset-0 max-w-none size-full" src={imgFrame} />
              </div>
              <p className="[word-break:break-word] font-['Poppins:Regular'] leading-[20px] not-italic opacity-80 relative shrink-0 text-[13px] text-left text-white whitespace-nowrap" data-node-id="I19:765;15:207">
                Shaqraa, KSA
              </p>
            </div>
          </div>
          <div className="absolute bg-[var(--gold\/500,#dfa82a)] h-[4px] left-0 top-[276px] w-[0.01px]" data-node-id="I19:765;15:212" data-name="Gold bar" />
        </a>
        <a className="bg-[var(--navy\/900,#0b1a33)] content-stretch flex flex-col h-[280px] items-start justify-end overflow-clip pb-[18px] pt-[16px] px-[22px] relative rounded-[18px] shadow-[0px_10px_28px_0px_rgba(1,16,37,0.12)] shrink-0 w-[370.66px]" data-node-id="19:783" data-name="Project Card">
          <div className="absolute h-[280px] left-0 top-0 w-[370px]" data-node-id="I19:783;15:196" data-name="Image">
            <img alt="" className="absolute inset-0 max-w-none object-cover pointer-events-none size-full" src={imgImage1} />
          </div>
          <div className="absolute bg-gradient-to-b from-[rgba(1,16,37,0.15)] h-[280px] left-0 to-[rgba(1,16,37,0.92)] top-0 via-[45%] via-[rgba(1,16,37,0.2)] w-[370px]" data-node-id="I19:783;15:197" data-name="Overlay" />
          <div className="absolute bg-[rgba(1,16,37,0.55)] border border-[rgba(255,255,255,0.15)] border-solid content-stretch flex items-start left-[16px] px-[10px] py-[5px] rounded-[100px] top-[16px]" data-node-id="I19:783;15:198" data-name="Category">
            <p className="[word-break:break-word] font-['Poppins:SemiBold'] leading-[14px] not-italic relative shrink-0 text-[11px] text-[color:var(--white,white)] text-left tracking-[0.66px] whitespace-nowrap" data-node-id="I19:783;15:199">
              FULL MEP WORKS
            </p>
          </div>
          <div className="absolute bg-[rgba(1,16,37,0.55)] border border-[rgba(255,255,255,0.15)] border-solid content-stretch flex items-center px-[10px] py-[5px] right-[16px] rounded-[100px] top-[16px]" data-node-id="I19:783;15:200" data-name="Status">
            <p className="[word-break:break-word] font-['Poppins:SemiBold'] leading-[14px] not-italic relative shrink-0 text-[11px] text-[color:var(--white,white)] text-left tracking-[0.66px] whitespace-nowrap" data-node-id="I19:783;15:201">
              Completed
            </p>
          </div>
          <div className="content-stretch flex flex-col gap-[8px] items-start relative shrink-0 w-full" data-node-id="I19:783;15:202" data-name="Body">
            <p className="[word-break:break-word] font-['Poppins:SemiBold'] leading-[28px] min-w-full not-italic relative shrink-0 text-[20px] text-[color:var(--white,white)] text-left w-[min-content]" data-node-id="I19:783;15:203">
              Police Training Institute
            </p>
            <div className="content-stretch flex gap-[6px] items-center relative shrink-0" data-node-id="I19:783;15:204" data-name="Location">
              <div className="relative shrink-0 size-[14px]" data-node-id="I19:783;15:205" data-name="Frame">
                <img alt="" className="absolute block inset-0 max-w-none size-full" src={imgFrame} />
              </div>
              <p className="[word-break:break-word] font-['Poppins:Regular'] leading-[20px] not-italic opacity-80 relative shrink-0 text-[13px] text-left text-white whitespace-nowrap" data-node-id="I19:783;15:207">
                Qatar
              </p>
            </div>
          </div>
          <div className="absolute bg-[var(--gold\/500,#dfa82a)] h-[4px] left-0 top-[276px] w-[0.01px]" data-node-id="I19:783;15:212" data-name="Gold bar" />
        </a>
        <a className="bg-[var(--navy\/900,#0b1a33)] content-stretch flex flex-col h-[280px] items-start justify-end overflow-clip pb-[18px] pt-[16px] px-[22px] relative rounded-[18px] shadow-[0px_10px_28px_0px_rgba(1,16,37,0.12)] shrink-0 w-[370.66px]" data-node-id="19:801" data-name="Project Card">
          <div className="absolute h-[280px] left-0 top-0 w-[370px]" data-node-id="I19:801;15:196" data-name="Image">
            <img alt="" className="absolute inset-0 max-w-none object-cover pointer-events-none size-full" src={imgImage3} />
          </div>
          <div className="absolute bg-gradient-to-b from-[rgba(1,16,37,0.15)] h-[280px] left-0 to-[rgba(1,16,37,0.92)] top-0 via-[45%] via-[rgba(1,16,37,0.2)] w-[370px]" data-node-id="I19:801;15:197" data-name="Overlay" />
          <div className="absolute bg-[rgba(1,16,37,0.55)] border border-[rgba(255,255,255,0.15)] border-solid content-stretch flex items-start left-[16px] px-[10px] py-[5px] rounded-[100px] top-[16px]" data-node-id="I19:801;15:198" data-name="Category">
            <p className="[word-break:break-word] font-['Poppins:SemiBold'] leading-[14px] not-italic relative shrink-0 text-[11px] text-[color:var(--white,white)] text-left tracking-[0.66px] whitespace-nowrap" data-node-id="I19:801;15:199">
              MEP UPGRADE
            </p>
          </div>
          <div className="absolute bg-[rgba(1,16,37,0.55)] border border-[rgba(255,255,255,0.15)] border-solid content-stretch flex items-center px-[10px] py-[5px] right-[16px] rounded-[100px] top-[16px]" data-node-id="I19:801;15:200" data-name="Status">
            <p className="[word-break:break-word] font-['Poppins:SemiBold'] leading-[14px] not-italic relative shrink-0 text-[11px] text-[color:var(--white,white)] text-left tracking-[0.66px] whitespace-nowrap" data-node-id="I19:801;15:201">
              Completed
            </p>
          </div>
          <div className="content-stretch flex flex-col gap-[8px] items-start relative shrink-0 w-full" data-node-id="I19:801;15:202" data-name="Body">
            <p className="[word-break:break-word] font-['Poppins:SemiBold'] leading-[28px] min-w-full not-italic relative shrink-0 text-[20px] text-[color:var(--white,white)] text-left w-[min-content]" data-node-id="I19:801;15:203">
              Saudi Post (Jeddah)
            </p>
            <div className="content-stretch flex gap-[6px] items-center relative shrink-0" data-node-id="I19:801;15:204" data-name="Location">
              <div className="relative shrink-0 size-[14px]" data-node-id="I19:801;15:205" data-name="Frame">
                <img alt="" className="absolute block inset-0 max-w-none size-full" src={imgFrame} />
              </div>
              <p className="[word-break:break-word] font-['Poppins:Regular'] leading-[20px] not-italic opacity-80 relative shrink-0 text-[13px] text-left text-white whitespace-nowrap" data-node-id="I19:801;15:207">
                Jeddah, KSA
              </p>
            </div>
          </div>
          <div className="absolute bg-[var(--gold\/500,#dfa82a)] h-[4px] left-0 top-[276px] w-[0.01px]" data-node-id="I19:801;15:212" data-name="Gold bar" />
        </a>
        <a className="bg-[var(--navy\/900,#0b1a33)] content-stretch flex flex-col h-[280px] items-start justify-end overflow-clip pb-[18px] pt-[16px] px-[22px] relative rounded-[18px] shadow-[0px_10px_28px_0px_rgba(1,16,37,0.12)] shrink-0 w-[370.66px]" data-node-id="19:819" data-name="Project Card">
          <div className="absolute h-[280px] left-0 top-0 w-[370px]" data-node-id="I19:819;15:232" data-name="Image">
            <img alt="" className="absolute inset-0 max-w-none object-cover pointer-events-none size-full" src={imgImage4} />
          </div>
          <div className="absolute bg-gradient-to-b from-[rgba(1,16,37,0.15)] h-[280px] left-0 to-[rgba(1,16,37,0.92)] top-0 via-[45%] via-[rgba(1,16,37,0.2)] w-[370px]" data-node-id="I19:819;15:233" data-name="Overlay" />
          <div className="absolute bg-[rgba(1,16,37,0.55)] border border-[rgba(255,255,255,0.15)] border-solid content-stretch flex items-start left-[16px] px-[10px] py-[5px] rounded-[100px] top-[16px]" data-node-id="I19:819;15:234" data-name="Category">
            <p className="[word-break:break-word] font-['Poppins:SemiBold'] leading-[14px] not-italic relative shrink-0 text-[11px] text-[color:var(--white,white)] text-left tracking-[0.66px] whitespace-nowrap" data-node-id="I19:819;15:235">
              FIRE ALARM SYSTEM
            </p>
          </div>
          <div className="absolute bg-[rgba(33,161,107,0.18)] border border-[rgba(51,204,128,0.5)] border-solid content-stretch flex gap-[6px] items-center px-[10px] py-[5px] right-[16px] rounded-[100px] top-[16px]" data-node-id="I19:819;15:236" data-name="Status">
            <div className="relative shrink-0 size-[6px]" data-node-id="I19:819;15:237" data-name="Ellipse">
              <img alt="" className="absolute block inset-0 max-w-none size-full" src={imgEllipse} />
            </div>
            <p className="[word-break:break-word] font-['Poppins:SemiBold'] leading-[14px] not-italic relative shrink-0 text-[#73eba6] text-[11px] text-left tracking-[0.66px] whitespace-nowrap" data-node-id="I19:819;15:238">
              In Progress
            </p>
          </div>
          <div className="content-stretch flex flex-col gap-[8px] items-start relative shrink-0 w-full" data-node-id="I19:819;15:239" data-name="Body">
            <p className="[word-break:break-word] font-['Poppins:SemiBold'] leading-[28px] min-w-full not-italic relative shrink-0 text-[20px] text-[color:var(--white,white)] text-left w-[min-content]" data-node-id="I19:819;15:240">
              Al Hada Armed Force Hospital
            </p>
            <div className="content-stretch flex gap-[6px] items-center relative shrink-0" data-node-id="I19:819;15:241" data-name="Location">
              <div className="relative shrink-0 size-[14px]" data-node-id="I19:819;15:242" data-name="Frame">
                <img alt="" className="absolute block inset-0 max-w-none size-full" src={imgFrame} />
              </div>
              <p className="[word-break:break-word] font-['Poppins:Regular'] leading-[20px] not-italic opacity-80 relative shrink-0 text-[13px] text-left text-white whitespace-nowrap" data-node-id="I19:819;15:244">
                Taif, KSA
              </p>
            </div>
          </div>
          <div className="absolute bg-[var(--gold\/500,#dfa82a)] h-[4px] left-0 top-[276px] w-[0.01px]" data-node-id="I19:819;15:249" data-name="Gold bar" />
        </a>
        <a className="bg-[var(--navy\/900,#0b1a33)] content-stretch flex flex-col h-[280px] items-start justify-end overflow-clip pb-[18px] pt-[16px] px-[22px] relative rounded-[18px] shadow-[0px_10px_28px_0px_rgba(1,16,37,0.12)] shrink-0 w-[370.66px]" data-node-id="19:838" data-name="Project Card">
          <div className="absolute h-[280px] left-0 top-0 w-[370px]" data-node-id="I19:838;15:232" data-name="Image">
            <img alt="" className="absolute inset-0 max-w-none object-cover pointer-events-none size-full" src={imgImage4} />
          </div>
          <div className="absolute bg-gradient-to-b from-[rgba(1,16,37,0.15)] h-[280px] left-0 to-[rgba(1,16,37,0.92)] top-0 via-[45%] via-[rgba(1,16,37,0.2)] w-[370px]" data-node-id="I19:838;15:233" data-name="Overlay" />
          <div className="absolute bg-[rgba(1,16,37,0.55)] border border-[rgba(255,255,255,0.15)] border-solid content-stretch flex items-start left-[16px] px-[10px] py-[5px] rounded-[100px] top-[16px]" data-node-id="I19:838;15:234" data-name="Category">
            <p className="[word-break:break-word] font-['Poppins:SemiBold'] leading-[14px] not-italic relative shrink-0 text-[11px] text-[color:var(--white,white)] text-left tracking-[0.66px] whitespace-nowrap" data-node-id="I19:838;15:235">
              FIRE FIGHTING SYSTEMS
            </p>
          </div>
          <div className="absolute bg-[rgba(33,161,107,0.18)] border border-[rgba(51,204,128,0.5)] border-solid content-stretch flex gap-[6px] items-center px-[10px] py-[5px] right-[16px] rounded-[100px] top-[16px]" data-node-id="I19:838;15:236" data-name="Status">
            <div className="relative shrink-0 size-[6px]" data-node-id="I19:838;15:237" data-name="Ellipse">
              <img alt="" className="absolute block inset-0 max-w-none size-full" src={imgEllipse} />
            </div>
            <p className="[word-break:break-word] font-['Poppins:SemiBold'] leading-[14px] not-italic relative shrink-0 text-[#73eba6] text-[11px] text-left tracking-[0.66px] whitespace-nowrap" data-node-id="I19:838;15:238">
              In Progress
            </p>
          </div>
          <div className="content-stretch flex flex-col gap-[8px] items-start relative shrink-0 w-full" data-node-id="I19:838;15:239" data-name="Body">
            <p className="[word-break:break-word] font-['Poppins:SemiBold'] leading-[28px] min-w-full not-italic relative shrink-0 text-[20px] text-[color:var(--white,white)] text-left w-[min-content]" data-node-id="I19:838;15:240">
              Zamzam Health Building 3
            </p>
            <div className="content-stretch flex gap-[6px] items-center relative shrink-0" data-node-id="I19:838;15:241" data-name="Location">
              <div className="relative shrink-0 size-[14px]" data-node-id="I19:838;15:242" data-name="Frame">
                <img alt="" className="absolute block inset-0 max-w-none size-full" src={imgFrame} />
              </div>
              <p className="[word-break:break-word] font-['Poppins:Regular'] leading-[20px] not-italic opacity-80 relative shrink-0 text-[13px] text-left text-white whitespace-nowrap" data-node-id="I19:838;15:244">
                Makkah, KSA
              </p>
            </div>
          </div>
          <div className="absolute bg-[var(--gold\/500,#dfa82a)] h-[4px] left-0 top-[276px] w-[0.01px]" data-node-id="I19:838;15:249" data-name="Gold bar" />
        </a>
        <a className="bg-[var(--navy\/900,#0b1a33)] content-stretch flex flex-col h-[280px] items-start justify-end overflow-clip pb-[18px] pt-[16px] px-[22px] relative rounded-[18px] shadow-[0px_10px_28px_0px_rgba(1,16,37,0.12)] shrink-0 w-[370.66px]" data-node-id="19:857" data-name="Project Card">
          <div className="absolute h-[280px] left-0 top-0 w-[370px]" data-node-id="I19:857;15:196" data-name="Image">
            <img alt="" className="absolute inset-0 max-w-none object-cover pointer-events-none size-full" src={imgImage2} />
          </div>
          <div className="absolute bg-gradient-to-b from-[rgba(1,16,37,0.15)] h-[280px] left-0 to-[rgba(1,16,37,0.92)] top-0 via-[45%] via-[rgba(1,16,37,0.2)] w-[370px]" data-node-id="I19:857;15:197" data-name="Overlay" />
          <div className="absolute bg-[rgba(1,16,37,0.55)] border border-[rgba(255,255,255,0.15)] border-solid content-stretch flex items-start left-[16px] px-[10px] py-[5px] rounded-[100px] top-[16px]" data-node-id="I19:857;15:198" data-name="Category">
            <p className="[word-break:break-word] font-['Poppins:SemiBold'] leading-[14px] not-italic relative shrink-0 text-[11px] text-[color:var(--white,white)] text-left tracking-[0.66px] whitespace-nowrap" data-node-id="I19:857;15:199">
              FULL MEP WORKS
            </p>
          </div>
          <div className="absolute bg-[rgba(1,16,37,0.55)] border border-[rgba(255,255,255,0.15)] border-solid content-stretch flex items-center px-[10px] py-[5px] right-[16px] rounded-[100px] top-[16px]" data-node-id="I19:857;15:200" data-name="Status">
            <p className="[word-break:break-word] font-['Poppins:SemiBold'] leading-[14px] not-italic relative shrink-0 text-[11px] text-[color:var(--white,white)] text-left tracking-[0.66px] whitespace-nowrap" data-node-id="I19:857;15:201">
              Completed
            </p>
          </div>
          <div className="content-stretch flex flex-col gap-[8px] items-start relative shrink-0 w-full" data-node-id="I19:857;15:202" data-name="Body">
            <p className="[word-break:break-word] font-['Poppins:SemiBold'] leading-[28px] min-w-full not-italic relative shrink-0 text-[20px] text-[color:var(--white,white)] text-left w-[min-content]" data-node-id="I19:857;15:203">
              Olayan Golden Hotel
            </p>
            <div className="content-stretch flex gap-[6px] items-center relative shrink-0" data-node-id="I19:857;15:204" data-name="Location">
              <div className="relative shrink-0 size-[14px]" data-node-id="I19:857;15:205" data-name="Frame">
                <img alt="" className="absolute block inset-0 max-w-none size-full" src={imgFrame} />
              </div>
              <p className="[word-break:break-word] font-['Poppins:Regular'] leading-[20px] not-italic opacity-80 relative shrink-0 text-[13px] text-left text-white whitespace-nowrap" data-node-id="I19:857;15:207">
                Makkah, KSA
              </p>
            </div>
          </div>
          <div className="absolute bg-[var(--gold\/500,#dfa82a)] h-[4px] left-0 top-[276px] w-[0.01px]" data-node-id="I19:857;15:212" data-name="Gold bar" />
        </a>
      </div>
      <div className="content-stretch flex gap-[8px] items-start relative shrink-0" data-node-id="19:875" data-name="Pagination">
        <div className="bg-[var(--white,white)] border border-[var(--border,#e3e7ee)] border-solid content-stretch flex items-center justify-center relative rounded-[10px] shrink-0 size-[40px]" data-node-id="19:876" data-name="Frame">
          <p className="[word-break:break-word] font-['Poppins:SemiBold'] leading-[22px] not-italic relative shrink-0 text-[15px] text-[color:var(--text\/body,#5b6475)] whitespace-nowrap" data-node-id="19:877">
            ‹
          </p>
        </div>
        <div className="bg-[var(--gold\/500,#dfa82a)] border border-[var(--border,#e3e7ee)] border-solid content-stretch flex items-center justify-center relative rounded-[10px] shrink-0 size-[40px]" data-node-id="19:878" data-name="Frame">
          <p className="[word-break:break-word] font-['Poppins:SemiBold'] leading-[22px] not-italic relative shrink-0 text-[15px] text-[color:var(--navy\/950,#011025)] whitespace-nowrap" data-node-id="19:879">
            1
          </p>
        </div>
        <div className="bg-[var(--white,white)] border border-[var(--border,#e3e7ee)] border-solid content-stretch flex items-center justify-center relative rounded-[10px] shrink-0 size-[40px]" data-node-id="19:880" data-name="Frame">
          <p className="[word-break:break-word] font-['Poppins:SemiBold'] leading-[22px] not-italic relative shrink-0 text-[15px] text-[color:var(--text\/body,#5b6475)] whitespace-nowrap" data-node-id="19:881">
            2
          </p>
        </div>
        <div className="bg-[var(--white,white)] border border-[var(--border,#e3e7ee)] border-solid content-stretch flex items-center justify-center relative rounded-[10px] shrink-0 size-[40px]" data-node-id="19:882" data-name="Frame">
          <p className="[word-break:break-word] font-['Poppins:SemiBold'] leading-[22px] not-italic relative shrink-0 text-[15px] text-[color:var(--text\/body,#5b6475)] whitespace-nowrap" data-node-id="19:883">
            ›
          </p>
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
These styles are contained in the design: Label/Link: Font(family: "Poppins", style: SemiBold, size: 14, weight: 600, lineHeight: 22, letterSpacing: 0), Caption/S: Font(family: "Poppins", style: Regular, size: 12, weight: 400, lineHeight: 18, letterSpacing: 0), Label/Tag: Font(family: "Poppins", style: SemiBold, size: 11, weight: 600, lineHeight: 14, letterSpacing: 6), Heading/H4: Font(family: "Poppins", style: SemiBold, size: 20, weight: 600, lineHeight: 28, letterSpacing: 0), Caption: Font(family: "Poppins", style: Regular, size: 13, weight: 400, lineHeight: 20, letterSpacing: 0), Label/Button: Font(family: "Poppins", style: SemiBold, size: 15, weight: 600, lineHeight: 22, letterSpacing: 0).
```

```text
The generated code contains image and SVG URL constants, e.g. const image = `${assetPathPrefix}/<asset file name>`, where assetPathPrefix is declared once at the top of the code and every asset URL interpolates it. These URLs are temporary download sources and expire after 7 days. Download each asset into the project with curl -L, then replace its URL in the generated code with a reference to the downloaded asset. Never use the temporary URLs as runtime image sources.
```

```text
[OUTPUT TRUNCATED - exceeded 25000 token limit]

The tool output was truncated. If this MCP server provides pagination or filtering tools, use them to retrieve specific portions of the data. If pagination is not available, inform the user that you are working with truncated output and results may be incomplete.
```
