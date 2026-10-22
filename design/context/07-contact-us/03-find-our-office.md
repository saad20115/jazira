# Find our office

- Figma node: `23:1441` (file `tD3pU1vtvSr8akTMJPFLkA`)
- Page: 07 Contact Us
- Source: Figma MCP `get_design_context` (React + Tailwind reference code, saved verbatim). Treat as a high-fidelity reference, not production code: convert absolute positioning into real layout.
- The temporary `assetPathPrefix` URLs below expire; use the local files in the asset table instead.

## Asset map (code constant -> local file)

| Constant | Figma asset file | Local file (relative to design/) |
|---|---|---|
| `imgArrow` | `eb39c.svg` | `assets/context/07-contact-us/03-find-our-office/imgArrow.svg` |
| `imgEllipse` | `f1f80.svg` | `assets/context/07-contact-us/03-find-our-office/imgEllipse.svg` |
| `imgFindOurOffice` | `fb7bc.png` | `assets/images/hero-city.png` (shared image) |
| `imgFrame` | `1bd0c.svg` | `assets/context/07-contact-us/03-find-our-office/imgFrame.svg` |
| `imgFrame1` | `bc17f.svg` | `assets/context/07-contact-us/03-find-our-office/imgFrame1.svg` |
| `imgFrame2` | `46a2c.svg` | `assets/context/07-contact-us/03-find-our-office/imgFrame2.svg` |

## Reference code

```jsx
const assetPathPrefix = "https://www.figma.com/api/mcp/asset/8d2675a9-200e-4f04-a5a6-e71ab7747fd1";
const imgArrow = `${assetPathPrefix}/eb39c.svg`;
const imgEllipse = `${assetPathPrefix}/f1f80.svg`;
const imgFindOurOffice = `${assetPathPrefix}/fb7bc.png`;
const imgFrame = `${assetPathPrefix}/1bd0c.svg`;
const imgFrame1 = `${assetPathPrefix}/bc17f.svg`;
const imgFrame2 = `${assetPathPrefix}/46a2c.svg`;

type ButtonProps = {
  className?: string;
  label?: string;
  showArrow?: boolean;
  state?: "Default";
  variant?: "Gold";
};

function Button({ className, label = "Get a Quote", showArrow = true, state = "Default", variant = "Gold" }: ButtonProps) {
  return (
    <div className={className || "bg-[var(--gold\\/500,#dfa82a)] content-stretch drop-shadow-[0px_8px_10px_rgba(223,168,42,0.35)] flex gap-[10px] items-center justify-center pl-[26px] pr-[24px] py-[14px] relative rounded-[8px]"} data-node-id="12:4">
      <p className="[word-break:break-word] font-['Poppins:SemiBold'] leading-[22px] not-italic relative shrink-0 text-[15px] text-[color:var(--navy\/950,#011025)] whitespace-nowrap" data-node-id="12:5">
        {label}
      </p>
      {showArrow && (
        <div className="relative shrink-0 size-[18px]" data-node-id="12:6" data-name="Arrow">
          <img alt="" className="absolute block inset-0 max-w-none size-full" src={imgArrow} />
        </div>
      )}
    </div>
  );
}

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

export default function FindOurOffice() {
  return (
    <div className="bg-[var(--navy\/950,#011025)] content-stretch flex flex-col gap-[44px] items-center px-[140px] py-[72px] relative size-full" data-node-id="23:1441" data-name="Find our office">
      <img alt="" className="absolute inset-0 max-w-none object-cover pointer-events-none size-full" src={imgFindOurOffice} />
      <div className="absolute bg-gradient-to-b from-[rgba(1,16,37,0.9)] inset-0 to-[rgba(1,16,37,0.94)]" data-node-id="23:1496" data-name="Overlay" />
      <div className="content-stretch flex flex-col gap-[16px] items-center relative shrink-0" data-node-id="23:1442" data-name="Frame">
        <Eyebrow className="bg-[rgba(255,255,255,0.08)] border border-[rgba(255,255,255,0.16)] border-solid content-stretch flex gap-[8px] items-center px-[14px] py-[6px] relative rounded-[100px] shrink-0" label="Our Location" />
        <p className="[word-break:break-word] font-['Poppins:Bold'] leading-[0] not-italic relative shrink-0 text-[44px] text-[color:var(--white,white)] tracking-[-0.44px] whitespace-nowrap" data-node-id="23:1446">
          <span className="leading-[52px]">{`Find `}</span>
          <span className="leading-[52px] text-[#dfa82a]">Our Office</span>
        </p>
        <p className="[word-break:break-word] font-['Poppins:Regular'] leading-[30px] not-italic opacity-70 relative shrink-0 text-[18px] text-[color:var(--white,white)] whitespace-nowrap" data-node-id="23:1447">{`Visit us in Makkah Al Mokaramah, KSA — we'd love to meet you in person.`}</p>
        <div className="bg-gradient-to-r from-[#dfa82a] h-[3px] relative rounded-[2px] shrink-0 to-[#efcb76] w-[52px]" data-node-id="23:1448" data-name="Divider" />
      </div>
      <div className="bg-[#e8ebed] h-[420px] overflow-clip relative rounded-[20px] shrink-0 w-full" data-node-id="23:1449" data-name="Map (Google Maps embed in build)">
        <div className="absolute flex h-[578.567px] items-center justify-center left-[-120px] top-[-649.43px] w-[1283.031px]" data-node-id="23:1450">
          <div className="-rotate-24 flex-none">
            <div className="bg-white h-[10px] relative w-[1400px]" data-name="Rectangle" />
          </div>
        </div>
        <div className="absolute flex h-[436.428px] items-center justify-center left-[-121.24px] top-[-40px] w-[1332.715px]" data-node-id="23:1451">
          <div className="flex-none rotate-18">
            <div className="bg-white h-[4px] relative w-[1400px]" data-name="Rectangle" />
          </div>
        </div>
        <div className="absolute flex h-[573.085px] items-center justify-center left-[-120px] top-[-569.43px] w-[1280.591px]" data-node-id="23:1452">
          <div className="-rotate-24 flex-none">
            <div className="bg-white h-[4px] relative w-[1400px]" data-name="Rectangle" />
          </div>
        </div>
        <div className="absolute flex h-[436.428px] items-center justify-center left-[-121.24px] top-[40px] w-[1332.715px]" data-node-id="23:1453">
          <div className="flex-none rotate-18">
            <div className="bg-white h-[4px] relative w-[1400px]" data-name="Rectangle" />
          </div>
        </div>
        <div className="absolute flex h-[578.567px] items-center justify-center left-[-120px] top-[-489.43px] w-[1283.031px]" data-node-id="23:1454">
          <div className="-rotate-24 flex-none">
            <div className="bg-white h-[10px] relative w-[1400px]" data-name="Rectangle" />
          </div>
        </div>
        <div className="absolute flex h-[436.428px] items-center justify-center left-[-121.24px] top-[120px] w-[1332.715px]" data-node-id="23:1455">
          <div className="flex-none rotate-18">
            <div className="bg-white h-[4px] relative w-[1400px]" data-name="Rectangle" />
          </div>
        </div>
        <div className="absolute flex h-[573.085px] items-center justify-center left-[-120px] top-[-409.43px] w-[1280.591px]" data-node-id="23:1456">
          <div className="-rotate-24 flex-none">
            <div className="bg-white h-[4px] relative w-[1400px]" data-name="Rectangle" />
          </div>
        </div>
        <div className="absolute flex h-[436.428px] items-center justify-center left-[-121.24px] top-[200px] w-[1332.715px]" data-node-id="23:1457">
          <div className="flex-none rotate-18">
            <div className="bg-white h-[4px] relative w-[1400px]" data-name="Rectangle" />
          </div>
        </div>
        <div className="absolute flex h-[578.567px] items-center justify-center left-[-120px] top-[-329.43px] w-[1283.031px]" data-node-id="23:1458">
          <div className="-rotate-24 flex-none">
            <div className="bg-white h-[10px] relative w-[1400px]" data-name="Rectangle" />
          </div>
        </div>
        <div className="absolute flex h-[436.428px] items-center justify-center left-[-121.24px] top-[280px] w-[1332.715px]" data-node-id="23:1459">
          <div className="flex-none rotate-18">
            <div className="bg-white h-[4px] relative w-[1400px]" data-name="Rectangle" />
          </div>
        </div>
        <div className="absolute flex h-[573.085px] items-center justify-center left-[-120px] top-[-249.43px] w-[1280.591px]" data-node-id="23:1460">
          <div className="-rotate-24 flex-none">
            <div className="bg-white h-[4px] relative w-[1400px]" data-name="Rectangle" />
          </div>
        </div>
        <div className="absolute flex h-[436.428px] items-center justify-center left-[-121.24px] top-[360px] w-[1332.715px]" data-node-id="23:1461">
          <div className="flex-none rotate-18">
            <div className="bg-white h-[4px] relative w-[1400px]" data-name="Rectangle" />
          </div>
        </div>
        <div className="absolute flex h-[578.567px] items-center justify-center left-[-120px] top-[-169.43px] w-[1283.031px]" data-node-id="23:1462">
          <div className="-rotate-24 flex-none">
            <div className="bg-white h-[10px] relative w-[1400px]" data-name="Rectangle" />
          </div>
        </div>
        <div className="absolute flex h-[436.428px] items-center justify-center left-[-121.24px] top-[440px] w-[1332.715px]" data-node-id="23:1463">
          <div className="flex-none rotate-18">
            <div className="bg-white h-[4px] relative w-[1400px]" data-name="Rectangle" />
          </div>
        </div>
        <div className="absolute bg-[#d9e0d6] h-[120px] left-[600px] rounded-[8px] top-[60px] w-[180px]" data-node-id="23:1464" data-name="Rectangle" />
        <div className="absolute bg-[#d9e0d6] h-[140px] left-[820px] rounded-[8px] top-[240px] w-[220px]" data-node-id="23:1465" data-name="Rectangle" />
        <div className="absolute bg-[#d9e0d6] h-[100px] left-[320px] rounded-[8px] top-[280px] w-[160px]" data-node-id="23:1466" data-name="Rectangle" />
        <div className="absolute bg-[#d9e0d6] h-[120px] left-[980px] rounded-[8px] top-[40px] w-[140px]" data-node-id="23:1467" data-name="Rectangle" />
        <div className="absolute left-[700px] size-[64px] top-[170px]" data-node-id="23:1468" data-name="Frame">
          <img alt="" className="absolute block inset-0 max-w-none size-full" src={imgFrame} />
        </div>
        <a className="absolute bg-[var(--white,white)] content-stretch cursor-pointer drop-shadow-[0px_4px_5px_rgba(1,16,37,0.12)] flex gap-[6px] items-center left-[16px] px-[12px] py-[8px] rounded-[8px] top-[16px]" href="https://maps.google.com/?q=21.3635,39.8226" data-node-id="23:1472" target="_blank" data-name="Frame">
          <p className="[word-break:break-word] font-['Poppins:Regular'] leading-[22px] not-italic relative shrink-0 text-[14px] text-[color:var(--navy\/800,#002854)] text-left whitespace-nowrap" data-node-id="23:1473">
            Open in Maps
          </p>
          <div className="relative shrink-0 size-[14px]" data-node-id="23:1474" data-name="Frame">
            <img alt="" className="absolute block inset-0 max-w-none size-full" src={imgFrame1} />
          </div>
        </a>
        <div className="absolute bg-[var(--white,white)] content-stretch drop-shadow-[0px_16px_20px_rgba(1,16,37,0.2)] flex flex-col gap-[14px] items-start left-[32px] p-[22px] rounded-[16px] top-[80px] w-[280px]" data-node-id="23:1476" data-name="Office card">
          <div className="content-stretch flex gap-[10px] items-center relative shrink-0" data-node-id="23:1477" data-name="Frame">
            <div className="bg-[var(--gold\/500,#dfa82a)] content-stretch flex items-center justify-center p-[12px] relative rounded-[12px] shrink-0" data-node-id="23:1478" data-name="Frame">
              <div className="relative shrink-0 size-[20px]" data-node-id="23:1479" data-name="Frame">
                <img alt="" className="absolute block inset-0 max-w-none size-full" src={imgFrame2} />
              </div>
            </div>
            <p className="[word-break:break-word] font-['Poppins:SemiBold'] leading-[24px] not-italic relative shrink-0 text-[17px] text-[color:var(--navy\/950,#011025)] whitespace-nowrap" data-node-id="23:1481">
              Office Location
            </p>
          </div>
          <div className="[word-break:break-word] content-stretch flex flex-col gap-[2px] items-start not-italic relative shrink-0 w-full" data-node-id="23:1482" data-name="Frame">
            <p className="font-['Poppins:SemiBold'] leading-[16px] relative shrink-0 text-[12px] text-[color:var(--text\/muted,#8a93a3)] tracking-[1.2px] uppercase whitespace-nowrap" data-node-id="23:1483">
              Address
            </p>
            <p className="font-['Poppins:Regular'] leading-[22px] min-w-full relative shrink-0 text-[14px] text-[color:var(--navy\/950,#011025)] w-[min-content]" data-node-id="23:1484">
              7676 Bathaa Quraish, Makkah Al-Mukarramah, KSA
            </p>
          </div>
          <div className="[word-break:break-word] content-stretch flex flex-col gap-[2px] items-start not-italic relative shrink-0 w-full" data-node-id="23:1485" data-name="Frame">
            <p className="font-['Poppins:SemiBold'] leading-[16px] relative shrink-0 text-[12px] text-[color:var(--text\/muted,#8a93a3)] tracking-[1.2px] uppercase whitespace-nowrap" data-node-id="23:1486">
              Phone
            </p>
            <p className="font-['Poppins:Regular'] leading-[22px] min-w-full relative shrink-0 text-[14px] text-[color:var(--navy\/950,#011025)] w-[min-content]" data-node-id="23:1487">
              +966 57 353 4185
            </p>
          </div>
          <div className="[word-break:break-word] content-stretch flex flex-col gap-[2px] items-start not-italic relative shrink-0 w-full" data-node-id="23:1488" data-name="Frame">
            <p className="font-['Poppins:SemiBold'] leading-[16px] relative shrink-0 text-[12px] text-[color:var(--text\/muted,#8a93a3)] tracking-[1.2px] uppercase whitespace-nowrap" data-node-id="23:1489">
              Email
            </p>
            <p className="font-['Poppins:Regular'] leading-[22px] min-w-full relative shrink-0 text-[14px] text-[color:var(--navy\/950,#011025)] w-[min-content]" data-node-id="23:1490">
              info@aljazira.co
            </p>
          </div>
          <Button className="bg-[var(--gold\/500,#dfa82a)] content-stretch cursor-pointer drop-shadow-[0px_8px_10px_rgba(223,168,42,0.35)] flex gap-[10px] items-center justify-center pl-[26px] pr-[24px] py-[14px] relative rounded-[8px] shrink-0 w-full" label="Get Directions" />
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
These styles are contained in the design: Label/Eyebrow: Font(family: "Poppins", style: SemiBold, size: 12, weight: 600, lineHeight: 16, letterSpacing: 8), Heading/H2: Font(family: "Poppins", style: Bold, size: 44, weight: 700, lineHeight: 52, letterSpacing: -1), Body/L: Font(family: "Poppins", style: Regular, size: 18, weight: 400, lineHeight: 30, letterSpacing: 0), Body/S: Font(family: "Poppins", style: Regular, size: 14, weight: 400, lineHeight: 22, letterSpacing: 0), Heading/H5: Font(family: "Poppins", style: SemiBold, size: 17, weight: 600, lineHeight: 24, letterSpacing: 0), Label/Caps: Font(family: "Poppins", style: SemiBold, size: 12, weight: 600, lineHeight: 16, letterSpacing: 10), Label/Button: Font(family: "Poppins", style: SemiBold, size: 15, weight: 600, lineHeight: 22, letterSpacing: 0).
```

```text
The generated code contains image and SVG URL constants, e.g. const image = `${assetPathPrefix}/<asset file name>`, where assetPathPrefix is declared once at the top of the code and every asset URL interpolates it. These URLs are temporary download sources and expire after 7 days. Download each asset into the project with curl -L, then replace its URL in the generated code with a reference to the downloaded asset. Never use the temporary URLs as runtime image sources.
```
