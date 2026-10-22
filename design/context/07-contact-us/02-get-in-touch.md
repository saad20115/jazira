# Get in touch

- Figma node: `23:1378` (file `tD3pU1vtvSr8akTMJPFLkA`)
- Page: 07 Contact Us
- Source: Figma MCP `get_design_context` (React + Tailwind reference code, saved verbatim). Treat as a high-fidelity reference, not production code: convert absolute positioning into real layout.
- The temporary `assetPathPrefix` URLs below expire; use the local files in the asset table instead.

## Asset map (code constant -> local file)

| Constant | Figma asset file | Local file (relative to design/) |
|---|---|---|
| `imgArrow` | `7d578.svg` | `assets/context/07-contact-us/02-get-in-touch/imgArrow.svg` |
| `imgIconChevronDown` | `63984.svg` | `assets/context/07-contact-us/02-get-in-touch/imgIconChevronDown.svg` |
| `imgIconCheck` | `b8a58.svg` | `assets/context/07-contact-us/02-get-in-touch/imgIconCheck.svg` |
| `imgIconUpload` | `e6e24.svg` | `assets/context/07-contact-us/02-get-in-touch/imgIconUpload.svg` |
| `imgEllipse` | `f1f80.svg` | `assets/context/07-contact-us/02-get-in-touch/imgEllipse.svg` |
| `imgFrame` | `2adfc.svg` | `assets/context/07-contact-us/02-get-in-touch/imgFrame.svg` |
| `imgIconSocialWhatsapp` | `34597.svg` | `assets/context/07-contact-us/02-get-in-touch/imgIconSocialWhatsapp.svg` |
| `imgFrame1` | `59c26.svg` | `assets/context/07-contact-us/02-get-in-touch/imgFrame1.svg` |
| `imgFrame2` | `73478.svg` | `assets/context/07-contact-us/02-get-in-touch/imgFrame2.svg` |
| `imgFrame3` | `d1001.svg` | `assets/context/07-contact-us/02-get-in-touch/imgFrame3.svg` |

## Reference code

```jsx
const assetPathPrefix = "https://www.figma.com/api/mcp/asset/d3acdb42-e22f-4094-9715-3c7256925c38";
const imgArrow = `${assetPathPrefix}/7d578.svg`;
const imgIconChevronDown = `${assetPathPrefix}/63984.svg`;
const imgIconCheck = `${assetPathPrefix}/b8a58.svg`;
const imgIconUpload = `${assetPathPrefix}/e6e24.svg`;
const imgEllipse = `${assetPathPrefix}/f1f80.svg`;
const imgFrame = `${assetPathPrefix}/2adfc.svg`;
const imgIconSocialWhatsapp = `${assetPathPrefix}/34597.svg`;
const imgFrame1 = `${assetPathPrefix}/59c26.svg`;
const imgFrame2 = `${assetPathPrefix}/73478.svg`;
const imgFrame3 = `${assetPathPrefix}/d1001.svg`;

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

type QuoteFormProps = {
  className?: string;
  step?: "1";
};

function QuoteForm({ className, step = "1" }: QuoteFormProps) {
  return (
    <div className={className || "bg-[var(--white,white)] border border-[var(--border,#e3e7ee)] border-solid content-stretch drop-shadow-[0px_20px_25px_rgba(1,16,37,0.08)] flex flex-col gap-[20px] items-start p-[32px] relative rounded-[20px] w-[520px]"} data-node-id="103:279">
      <div className="content-stretch flex gap-[8px] items-start overflow-clip relative shrink-0 w-full" data-node-id="103:280" data-name="Progress">
        <div className="bg-[var(--gold\/500,#dfa82a)] flex-[1_0_0] h-[4px] min-w-px relative rounded-[4px]" data-node-id="103:281" data-name="Step 1" />
        <div className="bg-[var(--border,#e3e7ee)] flex-[1_0_0] h-[4px] min-w-px relative rounded-[4px]" data-node-id="103:282" data-name="Step 2" />
        <div className="bg-[var(--border,#e3e7ee)] flex-[1_0_0] h-[4px] min-w-px relative rounded-[4px]" data-node-id="103:283" data-name="Step 3" />
      </div>
      <div className="[word-break:break-word] content-stretch flex flex-col font-['Poppins:SemiBold'] gap-[4px] items-start not-italic overflow-clip relative shrink-0 w-full whitespace-nowrap" data-node-id="103:284" data-name="Header">
        <p className="leading-[16px] relative shrink-0 text-[12px] text-[color:var(--gold\/600,#c38f1c)] tracking-[1.2px] uppercase" data-node-id="103:285">
          STEP 1 OF 3
        </p>
        <p className="leading-[28px] relative shrink-0 text-[20px] text-[color:var(--navy\/950,#011025)]" data-node-id="103:286">
          Your project
        </p>
      </div>
      <div className="content-stretch flex gap-[12px] items-start overflow-clip relative shrink-0 w-full" data-node-id="103:299" data-name="Type & stage">
        <div className="content-stretch flex flex-[1_0_0] flex-col gap-[6px] items-start min-w-px overflow-clip relative" data-node-id="103:287" data-name="Field / Project type">
          <p className="[word-break:break-word] font-['Poppins:SemiBold'] leading-[16px] not-italic relative shrink-0 text-[12px] text-[color:var(--text\/muted,#8a93a3)] tracking-[1.2px] uppercase whitespace-nowrap" data-node-id="103:288">
            Project type
          </p>
          <div className="bg-[var(--surface,#f6f8fb)] border border-[var(--border,#e3e7ee)] border-solid content-stretch flex gap-[8px] items-center overflow-clip px-[14px] py-[12px] relative rounded-[10px] shrink-0 w-full" data-node-id="103:289" data-name="Input">
            <p className="[word-break:break-word] flex-[1_0_0] font-['Poppins:Regular'] leading-[22px] min-w-px not-italic relative text-[14px] text-[color:var(--navy\/950,#011025)]" data-node-id="103:290">
              Hotel / Tower
            </p>
            <div className="relative shrink-0 size-[16px]" data-node-id="103:291" data-name="icon/chevron-down">
              <img alt="" className="absolute block inset-0 max-w-none size-full" src={imgIconChevronDown} />
            </div>
          </div>
        </div>
        <div className="content-stretch flex flex-[1_0_0] flex-col gap-[6px] items-start min-w-px overflow-clip relative" data-node-id="103:293" data-name="Field / Project stage">
          <p className="[word-break:break-word] font-['Poppins:SemiBold'] leading-[16px] not-italic relative shrink-0 text-[12px] text-[color:var(--text\/muted,#8a93a3)] tracking-[1.2px] uppercase whitespace-nowrap" data-node-id="103:294">
            Project stage
          </p>
          <div className="bg-[var(--surface,#f6f8fb)] border border-[var(--border,#e3e7ee)] border-solid content-stretch flex gap-[8px] items-center overflow-clip px-[14px] py-[12px] relative rounded-[10px] shrink-0 w-full" data-node-id="103:295" data-name="Input">
            <p className="[word-break:break-word] flex-[1_0_0] font-['Poppins:Regular'] leading-[22px] min-w-px not-italic relative text-[14px] text-[color:var(--navy\/950,#011025)]" data-node-id="103:296">
              Design stage
            </p>
            <div className="relative shrink-0 size-[16px]" data-node-id="103:297" data-name="icon/chevron-down">
              <img alt="" className="absolute block inset-0 max-w-none size-full" src={imgIconChevronDown} />
            </div>
          </div>
        </div>
      </div>
      <div className="content-stretch flex flex-col gap-[8px] items-start overflow-clip relative shrink-0 w-full" data-node-id="103:300" data-name="Field / Services needed">
        <p className="[word-break:break-word] font-['Poppins:SemiBold'] leading-[16px] not-italic relative shrink-0 text-[12px] text-[color:var(--text\/muted,#8a93a3)] tracking-[1.2px] uppercase whitespace-nowrap" data-node-id="103:301">
          Services needed
        </p>
        <div className="content-start flex flex-wrap gap-[8px] items-start overflow-clip relative shrink-0 w-full" data-node-id="103:302" data-name="Chips">
          <div className="bg-[var(--gold\/50,#fbf4e3)] border border-[var(--gold\/300,#efcb76)] border-solid content-stretch flex gap-[6px] items-center overflow-clip px-[14px] py-[7px] relative rounded-[100px] shrink-0" data-node-id="103:303" data-name="Chip / HVAC (selected)">
            <div className="relative shrink-0 size-[14px]" data-node-id="132:2166" data-name="icon/check">
              <img alt="" className="absolute block inset-0 max-w-none size-full" src={imgIconCheck} />
            </div>
            <p className="[word-break:break-word] font-['Poppins:Regular'] leading-[22px] not-italic relative shrink-0 text-[14px] text-[color:var(--navy\/950,#011025)] whitespace-nowrap" data-node-id="103:304">
              HVAC
            </p>
          </div>
          <div className="bg-[var(--gold\/50,#fbf4e3)] border border-[var(--gold\/300,#efcb76)] border-solid content-stretch flex gap-[6px] items-center overflow-clip px-[14px] py-[7px] relative rounded-[100px] shrink-0" data-node-id="103:305" data-name="Chip / Fire Fighting (selected)">
            <div className="relative shrink-0 size-[14px]" data-node-id="132:2168" data-name="icon/check">
              <img alt="" className="absolute block inset-0 max-w-none size-full" src={imgIconCheck} />
            </div>
            <p className="[word-break:break-word] font-['Poppins:Regular'] leading-[22px] not-italic relative shrink-0 text-[14px] text-[color:var(--navy\/950,#011025)] whitespace-nowrap" data-node-id="103:306">
              Fire Fighting
            </p>
          </div>
          <div className="bg-[var(--white,white)] border border-[var(--border,#e3e7ee)] border-solid content-stretch flex items-center overflow-clip px-[14px] py-[7px] relative rounded-[100px] shrink-0" data-node-id="103:307" data-name="Chip / Plumbing">
            <p className="[word-break:break-word] font-['Poppins:Regular'] leading-[22px] not-italic relative shrink-0 text-[14px] text-[color:var(--text\/body,#5b6475)] whitespace-nowrap" data-node-id="103:308">
              Plumbing
            </p>
          </div>
          <div className="bg-[var(--white,white)] border border-[var(--border,#e3e7ee)] border-solid content-stretch flex items-center overflow-clip px-[14px] py-[7px] relative rounded-[100px] shrink-0" data-node-id="103:309" data-name="Chip / Electrical">
            <p className="[word-break:break-word] font-['Poppins:Regular'] leading-[22px] not-italic relative shrink-0 text-[14px] text-[color:var(--text\/body,#5b6475)] whitespace-nowrap" data-node-id="103:310">
              Electrical
            </p>
          </div>
          <div className="bg-[var(--white,white)] border border-[var(--border,#e3e7ee)] border-solid content-stretch flex items-center overflow-clip px-[14px] py-[7px] relative rounded-[100px] shrink-0" data-node-id="103:311" data-name="Chip / Low Current">
            <p className="[word-break:break-word] font-['Poppins:Regular'] leading-[22px] not-italic relative shrink-0 text-[14px] text-[color:var(--text\/body,#5b6475)] whitespace-nowrap" data-node-id="103:312">
              Low Current
            </p>
          </div>
          <div className="bg-[var(--white,white)] border border-[var(--border,#e3e7ee)] border-solid content-stretch flex items-center overflow-clip px-[14px] py-[7px] relative rounded-[100px] shrink-0" data-node-id="103:313" data-name="Chip / Smart Systems / BMS">
            <p className="[word-break:break-word] font-['Poppins:Regular'] leading-[22px] not-italic relative shrink-0 text-[14px] text-[color:var(--text\/body,#5b6475)] whitespace-nowrap" data-node-id="103:314">
              Smart Systems / BMS
            </p>
          </div>
          <div className="bg-[var(--white,white)] border border-[var(--border,#e3e7ee)] border-solid content-stretch flex items-center overflow-clip px-[14px] py-[7px] relative rounded-[100px] shrink-0" data-node-id="103:315" data-name="Chip / Supply only">
            <p className="[word-break:break-word] font-['Poppins:Regular'] leading-[22px] not-italic relative shrink-0 text-[14px] text-[color:var(--text\/body,#5b6475)] whitespace-nowrap" data-node-id="103:316">
              Supply only
            </p>
          </div>
        </div>
      </div>
      <div className="content-stretch flex flex-col gap-[6px] items-start overflow-clip relative shrink-0 w-full" data-node-id="103:317" data-name="Field / Project location">
        <p className="[word-break:break-word] font-['Poppins:SemiBold'] leading-[16px] not-italic relative shrink-0 text-[12px] text-[color:var(--text\/muted,#8a93a3)] tracking-[1.2px] uppercase whitespace-nowrap" data-node-id="103:318">
          Project location
        </p>
        <div className="bg-[var(--surface,#f6f8fb)] border border-[var(--border,#e3e7ee)] border-solid content-stretch flex gap-[8px] items-center overflow-clip px-[14px] py-[12px] relative rounded-[10px] shrink-0 w-full" data-node-id="103:319" data-name="Input">
          <p className="[word-break:break-word] flex-[1_0_0] font-['Poppins:Regular'] leading-[22px] min-w-px not-italic relative text-[14px] text-[color:var(--navy\/950,#011025)]" data-node-id="103:320">
            Makkah
          </p>
          <div className="relative shrink-0 size-[16px]" data-node-id="103:321" data-name="icon/chevron-down">
            <img alt="" className="absolute block inset-0 max-w-none size-full" src={imgIconChevronDown} />
          </div>
        </div>
      </div>
      <div className="bg-[var(--surface,#f6f8fb)] border-[1.2px] border-[var(--gold\/300,#efcb76)] border-dashed content-stretch flex gap-[12px] items-center overflow-clip p-[16px] relative rounded-[12px] shrink-0 w-full" data-node-id="103:323" data-name="Upload drawings / BOQ">
        <div className="relative shrink-0 size-[20px]" data-node-id="103:324" data-name="icon/upload">
          <img alt="" className="absolute block inset-0 max-w-none size-full" src={imgIconUpload} />
        </div>
        <div className="[word-break:break-word] content-stretch flex flex-col font-['Poppins:Regular'] gap-[2px] items-start not-italic overflow-clip relative shrink-0 whitespace-nowrap" data-node-id="103:327" data-name="Text">
          <p className="leading-[22px] relative shrink-0 text-[14px] text-[color:var(--navy\/950,#011025)]" data-node-id="103:328">
            Upload drawings or BOQ
          </p>
          <p className="leading-[18px] relative shrink-0 text-[12px] text-[color:var(--text\/muted,#8a93a3)]" data-node-id="103:329">
            PDF, DWG, XLSX · up to 25 MB
          </p>
        </div>
      </div>
      <Button className="bg-[var(--navy\/950,#011025)] content-stretch flex gap-[10px] items-center justify-center pl-[26px] pr-[24px] py-[14px] relative rounded-[8px] shrink-0 w-full" label="Continue to contact details" />
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

export default function GetInTouch() {
  return (
    <div className="bg-[var(--surface,#f6f8fb)] content-stretch flex gap-[48px] items-start pb-[72px] pt-[56px] px-[140px] relative size-full" data-node-id="23:1378" data-name="Get in touch">
      <div className="content-stretch flex flex-[1_0_0] flex-col gap-[16px] items-start min-w-px relative" data-node-id="23:1379" data-name="Frame">
        <Eyebrow className="bg-[var(--gold\/50,#fbf4e3)] border border-[rgba(239,203,118,0.6)] border-solid content-stretch flex gap-[8px] items-center px-[14px] py-[6px] relative rounded-[100px] shrink-0" label="Get In Touch" />
        <p className="[word-break:break-word] font-['Poppins:Bold'] leading-[0] not-italic relative shrink-0 text-[44px] text-[color:var(--navy\/950,#011025)] tracking-[-0.44px] w-[540px]" data-node-id="23:1383">
          <span className="leading-[52px]">{`Let's talk about `}</span>
          <span className="leading-[52px] text-[#dfa82a]">your project</span>
        </p>
        <p className="[word-break:break-word] font-['Poppins:Regular'] leading-[30px] not-italic relative shrink-0 text-[18px] text-[color:var(--text\/body,#5b6475)] w-[540px]" data-node-id="23:1384">
          Request a quote for contracting or supply, ask for brand pricing, or speak directly with an engineer.
        </p>
        <div className="h-[8px] relative shrink-0 w-[10px]" data-node-id="23:1385" data-name="Frame" />
        <div className="content-start cursor-pointer flex flex-wrap gap-[12px] items-start overflow-clip relative shrink-0 w-full" data-node-id="104:1488" data-name="Contact channels">
          <a className="bg-[var(--white,white)] border border-[var(--border,#e3e7ee)] border-solid content-stretch flex gap-[14px] h-[78px] items-center p-[16px] relative rounded-[14px] shrink-0 w-[290px]" href="tel:+966573534185" data-node-id="23:1386" target="_blank" data-name="Channel / Phone">
            <div className="bg-[var(--gold\/50,#fbf4e3)] content-stretch flex items-center justify-center p-[12px] relative rounded-[12px] shrink-0" data-node-id="23:1387" data-name="Frame">
              <div className="relative shrink-0 size-[20px]" data-node-id="23:1388" data-name="Frame">
                <img alt="" className="absolute block inset-0 max-w-none size-full" src={imgFrame} />
              </div>
            </div>
            <div className="[word-break:break-word] content-stretch flex flex-[1_0_0] flex-col gap-[2px] items-start min-w-px not-italic relative text-left" data-node-id="23:1390" data-name="Frame">
              <p className="font-['Poppins:SemiBold'] leading-[16px] relative shrink-0 text-[12px] text-[color:var(--text\/muted,#8a93a3)] tracking-[1.2px] uppercase whitespace-nowrap" data-node-id="23:1391">
                Call us
              </p>
              <div className="font-['Poppins:Medium'] leading-[0] min-w-full relative shrink-0 text-[16px] text-[color:var(--navy\/950,#011025)] w-[min-content]" data-node-id="23:1392" role="link" tabIndex="0">
                <p className="cursor-pointer leading-[26px]">+966 57 353 4185</p>
              </div>
            </div>
          </a>
          <a className="bg-[var(--white,white)] border border-[var(--border,#e3e7ee)] border-solid content-stretch flex gap-[14px] h-[78px] items-center p-[16px] relative rounded-[14px] shrink-0 w-[290px]" href="https://wa.me/966573534185" data-node-id="104:1489" target="_blank" data-name="Channel / WhatsApp">
            <div className="bg-[var(--gold\/50,#fbf4e3)] content-stretch flex items-center justify-center relative rounded-[12px] shrink-0 size-[44px]" data-node-id="104:1490" data-name="Frame">
              <div className="relative shrink-0 size-[20px]" data-node-id="132:2200" data-name="Icon/social/whatsapp">
                <img alt="" className="absolute block inset-0 max-w-none size-full" src={imgIconSocialWhatsapp} />
              </div>
            </div>
            <div className="[word-break:break-word] content-stretch flex flex-[1_0_0] flex-col gap-[2px] items-start min-w-px not-italic relative text-left" data-node-id="104:1493" data-name="Frame">
              <p className="font-['Poppins:SemiBold'] leading-[16px] relative shrink-0 text-[12px] text-[color:var(--text\/muted,#8a93a3)] tracking-[1.2px] uppercase whitespace-nowrap" data-node-id="104:1494">
                WhatsApp
              </p>
              <p className="font-['Poppins:Medium'] leading-[26px] min-w-full relative shrink-0 text-[16px] text-[color:var(--navy\/950,#011025)] w-[min-content]" data-node-id="104:1495">
                Chat with an engineer
              </p>
            </div>
          </a>
          <a className="bg-[var(--white,white)] border border-[var(--border,#e3e7ee)] border-solid content-stretch flex gap-[14px] h-[104px] items-center p-[16px] relative rounded-[14px] shrink-0 w-[290px]" href="mailto:aljazirallilimdad@gmail.com" data-node-id="23:1393" target="_blank" data-name="Channel / Email">
            <div className="bg-[var(--gold\/50,#fbf4e3)] content-stretch flex items-center justify-center p-[12px] relative rounded-[12px] shrink-0" data-node-id="23:1394" data-name="Frame">
              <div className="relative shrink-0 size-[20px]" data-node-id="23:1395" data-name="Frame">
                <img alt="" className="absolute block inset-0 max-w-none size-full" src={imgFrame1} />
              </div>
            </div>
            <div className="[word-break:break-word] content-stretch flex flex-[1_0_0] flex-col gap-[2px] items-start min-w-px not-italic relative text-left" data-node-id="23:1397" data-name="Frame">
              <p className="font-['Poppins:SemiBold'] leading-[16px] relative shrink-0 text-[12px] text-[color:var(--text\/muted,#8a93a3)] tracking-[1.2px] uppercase whitespace-nowrap" data-node-id="23:1398">
                Email
              </p>
              <div className="font-['Poppins:Medium'] leading-[0] min-w-full relative shrink-0 text-[16px] text-[color:var(--navy\/950,#011025)] w-[min-content]" data-node-id="23:1399" role="link" tabIndex="0">
                <p className="cursor-pointer leading-[26px]">info@aljazira.co</p>
              </div>
            </div>
          </a>
          <a className="bg-[var(--white,white)] border border-[var(--border,#e3e7ee)] border-solid content-stretch flex gap-[14px] h-[104px] items-center p-[16px] relative rounded-[14px] shrink-0 w-[290px]" href="https://maps.google.com/?q=21.3635,39.8226" data-node-id="23:1400" target="_blank" data-name="Channel / Address">
            <div className="bg-[var(--gold\/50,#fbf4e3)] content-stretch flex items-center justify-center p-[12px] relative rounded-[12px] shrink-0" data-node-id="23:1401" data-name="Frame">
              <div className="relative shrink-0 size-[20px]" data-node-id="23:1402" data-name="Frame">
                <img alt="" className="absolute block inset-0 max-w-none size-full" src={imgFrame2} />
              </div>
            </div>
            <div className="[word-break:break-word] content-stretch flex flex-[1_0_0] flex-col gap-[2px] items-start min-w-px not-italic relative text-left" data-node-id="23:1404" data-name="Frame">
              <p className="font-['Poppins:SemiBold'] leading-[16px] relative shrink-0 text-[12px] text-[color:var(--text\/muted,#8a93a3)] tracking-[1.2px] uppercase whitespace-nowrap" data-node-id="23:1405">
                Head office
              </p>
              <p className="font-['Poppins:Medium'] leading-[26px] min-w-full relative shrink-0 text-[16px] text-[color:var(--navy\/950,#011025)] w-[min-content]" data-node-id="23:1406">
                7676 Bathaa Quraish, Makkah
              </p>
            </div>
          </a>
        </div>
        <div className="bg-[var(--white,white)] border border-[var(--border,#e3e7ee)] border-solid content-stretch flex gap-[14px] items-center p-[16px] relative rounded-[14px] shrink-0 w-full" data-node-id="23:1407" data-name="Channel / Working Hours">
          <div className="bg-[var(--gold\/50,#fbf4e3)] content-stretch flex items-center justify-center p-[12px] relative rounded-[12px] shrink-0" data-node-id="23:1408" data-name="Frame">
            <div className="relative shrink-0 size-[20px]" data-node-id="23:1409" data-name="Frame">
              <img alt="" className="absolute block inset-0 max-w-none size-full" src={imgFrame3} />
            </div>
          </div>
          <div className="[word-break:break-word] content-stretch flex flex-[1_0_0] flex-col gap-[2px] items-start min-w-px not-italic relative whitespace-nowrap" data-node-id="23:1411" data-name="Frame">
            <p className="font-['Poppins:SemiBold'] leading-[16px] relative shrink-0 text-[12px] text-[color:var(--text\/muted,#8a93a3)] tracking-[1.2px] uppercase" data-node-id="23:1412">
              Working Hours
            </p>
            <p className="font-['Poppins:Medium'] leading-[26px] relative shrink-0 text-[16px] text-[color:var(--navy\/950,#011025)]" data-node-id="23:1413">
              Sunday – Thursday, 8:00 AM – 5:00 PM
            </p>
          </div>
        </div>
      </div>
      <QuoteForm className="bg-[var(--white,white)] border border-[var(--border,#e3e7ee)] border-solid content-stretch drop-shadow-[0px_20px_25px_rgba(1,16,37,0.08)] flex flex-col gap-[20px] items-start p-[32px] relative rounded-[20px] shrink-0 w-[520px]" />
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
These styles are contained in the design: Label/Eyebrow: Font(family: "Poppins", style: SemiBold, size: 12, weight: 600, lineHeight: 16, letterSpacing: 8), Heading/H2: Font(family: "Poppins", style: Bold, size: 44, weight: 700, lineHeight: 52, letterSpacing: -1), Body/L: Font(family: "Poppins", style: Regular, size: 18, weight: 400, lineHeight: 30, letterSpacing: 0), Label/Caps: Font(family: "Poppins", style: SemiBold, size: 12, weight: 600, lineHeight: 16, letterSpacing: 10), Body/M Medium: Font(family: "Poppins", style: Medium, size: 16, weight: 500, lineHeight: 26, letterSpacing: 0), Heading/H4: Font(family: "Poppins", style: SemiBold, size: 20, weight: 600, lineHeight: 28, letterSpacing: 0), Body/S: Font(family: "Poppins", style: Regular, size: 14, weight: 400, lineHeight: 22, letterSpacing: 0), Caption/S: Font(family: "Poppins", style: Regular, size: 12, weight: 400, lineHeight: 18, letterSpacing: 0), Label/Button: Font(family: "Poppins", style: SemiBold, size: 15, weight: 600, lineHeight: 22, letterSpacing: 0).
```

```text
Component descriptions: The following components have usage descriptions or documentation links defined in Figma. These descriptions provide important context about the intended usage, best practices, and any constraints for each component. Follow these guidelines when implementing or using these components.

## Quote Form
**Node ID:** 103:422

Multi-step request-a-quote form. Used only on the Contact page. Step 1 project → Step 2 contact details → Step 3 review & send.
```

```text
The generated code contains image and SVG URL constants, e.g. const image = `${assetPathPrefix}/<asset file name>`, where assetPathPrefix is declared once at the top of the code and every asset URL interpolates it. These URLs are temporary download sources and expire after 7 days. Download each asset into the project with curl -L, then replace its URL in the generated code with a reference to the downloaded asset. Never use the temporary URLs as runtime image sources.
```
