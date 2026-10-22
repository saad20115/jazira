# Footer

- Figma node: `13:490` (file `tD3pU1vtvSr8akTMJPFLkA`)
- Page: Design System
- Source: Figma MCP `get_design_context` (React + Tailwind reference code, saved verbatim). Treat as a high-fidelity reference, not production code: convert absolute positioning into real layout.
- The temporary `assetPathPrefix` URLs below expire; use the local files in the asset table instead.

## Asset map (code constant -> local file)

| Constant | Figma asset file | Local file (relative to design/) |
|---|---|---|
| `imgArrow` | `eb39c.svg` | `assets/context/components/footer/imgArrow.svg` |
| `imgIconSocialWhatsapp` | `baff5.svg` | `assets/context/components/footer/imgIconSocialWhatsapp.svg` |
| `imgIconSocialFacebook` | `a8252.svg` | `assets/context/components/footer/imgIconSocialFacebook.svg` |
| `imgIconSocialInstagram` | `88dd1.svg` | `assets/context/components/footer/imgIconSocialInstagram.svg` |
| `imgIconSocialX` | `88eb0.svg` | `assets/context/components/footer/imgIconSocialX.svg` |
| `imgIconSocialLinkedin` | `ee02b.svg` | `assets/context/components/footer/imgIconSocialLinkedin.svg` |
| `imgSymbol` | `3271c.svg` | `assets/context/components/footer/imgSymbol.svg` |
| `imgWordmark` | `121ab.svg` | `assets/context/components/footer/imgWordmark.svg` |
| `imgTaglineEn` | `dd42a.svg` | `assets/context/components/footer/imgTaglineEn.svg` |
| `imgTaglineAr` | `aef0c.svg` | `assets/context/components/footer/imgTaglineAr.svg` |
| `imgEllipse` | `ecc4b.svg` | `assets/context/components/footer/imgEllipse.svg` |
| `imgFrame` | `96c9d.svg` | `assets/context/components/footer/imgFrame.svg` |
| `imgFrame1` | `97f92.svg` | `assets/context/components/footer/imgFrame1.svg` |
| `imgFrame2` | `b937c.svg` | `assets/context/components/footer/imgFrame2.svg` |
| `imgIconSocialWhatsapp1` | `491c8.svg` | `assets/context/components/footer/imgIconSocialWhatsapp1.svg` |

## Reference code

```jsx
const assetPathPrefix = "https://www.figma.com/api/mcp/asset/2919bec8-4ed9-413d-89d5-8e2c0e0db2d7";
const imgArrow = `${assetPathPrefix}/eb39c.svg`;
const imgIconSocialWhatsapp = `${assetPathPrefix}/baff5.svg`;
const imgIconSocialFacebook = `${assetPathPrefix}/a8252.svg`;
const imgIconSocialInstagram = `${assetPathPrefix}/88dd1.svg`;
const imgIconSocialX = `${assetPathPrefix}/88eb0.svg`;
const imgIconSocialLinkedin = `${assetPathPrefix}/ee02b.svg`;
const imgSymbol = `${assetPathPrefix}/3271c.svg`;
const imgWordmark = `${assetPathPrefix}/121ab.svg`;
const imgTaglineEn = `${assetPathPrefix}/dd42a.svg`;
const imgTaglineAr = `${assetPathPrefix}/aef0c.svg`;
const imgEllipse = `${assetPathPrefix}/ecc4b.svg`;
const imgFrame = `${assetPathPrefix}/96c9d.svg`;
const imgFrame1 = `${assetPathPrefix}/97f92.svg`;
const imgFrame2 = `${assetPathPrefix}/b937c.svg`;
const imgIconSocialWhatsapp1 = `${assetPathPrefix}/491c8.svg`;

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

function IconSocialWhatsapp({ className }: { className?: string }) {
  return (
    <div className={className || "relative size-[20px]"} data-node-id="132:1971" data-name="Icon/social/whatsapp">
      <img alt="" className="absolute block inset-0 max-w-none size-full" src={imgIconSocialWhatsapp} />
    </div>
  );
}

function IconSocialFacebook({ className }: { className?: string }) {
  return (
    <div className={className || "relative size-[20px]"} data-node-id="132:1968" data-name="Icon/social/facebook">
      <img alt="" className="absolute block inset-0 max-w-none size-full" src={imgIconSocialFacebook} />
    </div>
  );
}

function IconSocialInstagram({ className }: { className?: string }) {
  return (
    <div className={className || "relative size-[20px]"} data-node-id="132:1963" data-name="Icon/social/instagram">
      <img alt="" className="absolute block inset-0 max-w-none size-full" src={imgIconSocialInstagram} />
    </div>
  );
}

function IconSocialX({ className }: { className?: string }) {
  return (
    <div className={className || "relative size-[20px]"} data-node-id="132:1959" data-name="Icon/social/x">
      <img alt="" className="absolute block inset-0 max-w-none size-full" src={imgIconSocialX} />
    </div>
  );
}

function IconSocialLinkedin({ className }: { className?: string }) {
  return (
    <div className={className || "relative size-[20px]"} data-node-id="132:1954" data-name="Icon/social/linkedin">
      <img alt="" className="absolute block inset-0 max-w-none size-full" src={imgIconSocialLinkedin} />
    </div>
  );
}

type LogoProps = {
  className?: string;
  color?: "Reversed";
  type?: "Full";
};

function Logo({ className, color = "Reversed", type = "Full" }: LogoProps) {
  return (
    <div className={className || "h-[57.61px] relative w-[199px]"} data-node-id="100:355">
      <div className="absolute inset-[0_71.48%_4.29%_0]" data-node-id="100:357" data-name="Symbol">
        <img alt="" className="absolute block inset-0 max-w-none size-full" src={imgSymbol} />
      </div>
      <div className="absolute inset-[15.03%_0_33.53%_26.46%]" data-node-id="100:360" data-name="Wordmark">
        <img alt="" className="absolute block inset-0 max-w-none size-full" src={imgWordmark} />
      </div>
      <div className="absolute inset-[72.09%_5.43%_19.77%_27.54%]" data-node-id="100:363" data-name="Tagline EN">
        <img alt="" className="absolute block inset-0 max-w-none size-full" src={imgTaglineEn} />
      </div>
      <div className="absolute inset-[83.73%_5.59%_0_27.77%]" data-node-id="100:366" data-name="Tagline AR">
        <img alt="" className="absolute block inset-0 max-w-none size-full" src={imgTaglineAr} />
      </div>
    </div>
  );
}

export default function Footer({ className }: { className?: string }) {
  return (
    <div className={className || "content-stretch flex flex-col gap-[56px] items-start pb-[36px] pt-[88px] px-[140px] relative w-[1440px]"} data-node-id="13:490" style={{ backgroundImage: "url(\"data:image/svg+xml;utf8,<svg viewBox='0 0 1440 503' xmlns='http://www.w3.org/2000/svg' preserveAspectRatio='none'><rect x='0' y='0' height='100%' width='100%' fill='url(%23grad)' opacity='1'/><defs><radialGradient id='grad' gradientUnits='userSpaceOnUse' cx='0' cy='0' r='10' gradientTransform='matrix(72 0 0 25.15 720 251.5)'><stop stop-color='rgba(11,26,51,1)' offset='0'/><stop stop-color='rgba(1,16,37,1)' offset='1'/></radialGradient></defs></svg>\")" }} data-name="Footer">
      <div className="content-stretch flex gap-[48px] items-start relative shrink-0 w-full" data-node-id="13:491" data-name="Columns">
        <div className="content-stretch flex flex-col gap-[22px] items-start relative shrink-0 w-[320px]" data-node-id="13:492" data-name="Frame">
          <Logo className="h-[50px] relative shrink-0 w-[172px]" />
          <p className="[word-break:break-word] font-['Poppins:Regular'] leading-[22px] not-italic opacity-62 relative shrink-0 text-[14px] text-[color:var(--white,white)] w-[300px]" data-node-id="13:495">
            A leading MEP construction company in the Gulf region, delivering world-class mechanical, electrical, and plumbing solutions with over 45 years of experience.
          </p>
          <div className="content-stretch cursor-pointer flex gap-[10px] items-start relative shrink-0" data-node-id="13:496" data-name="Social">
            <a className="bg-[rgba(255,255,255,0.06)] border border-[rgba(255,255,255,0.14)] border-solid content-stretch flex items-start overflow-clip p-[10px] relative rounded-[100px] shrink-0" href="https://www.linkedin.com/" data-node-id="132:1975" target="_blank" data-name="Social / linkedin">
              <IconSocialLinkedin className="relative shrink-0 size-[20px]" />
            </a>
            <a className="bg-[rgba(255,255,255,0.06)] border border-[rgba(255,255,255,0.14)] border-solid content-stretch flex items-start overflow-clip p-[10px] relative rounded-[100px] shrink-0" href="https://x.com/" data-node-id="132:1982" target="_blank" data-name="Social / x">
              <IconSocialX className="relative shrink-0 size-[20px]" />
            </a>
            <a className="bg-[rgba(255,255,255,0.06)] border border-[rgba(255,255,255,0.14)] border-solid content-stretch flex items-start overflow-clip p-[10px] relative rounded-[100px] shrink-0" href="https://www.instagram.com/" data-node-id="132:1988" target="_blank" data-name="Social / instagram">
              <IconSocialInstagram className="relative shrink-0 size-[20px]" />
            </a>
            <a className="bg-[rgba(255,255,255,0.06)] border border-[rgba(255,255,255,0.14)] border-solid content-stretch flex items-start overflow-clip p-[10px] relative rounded-[100px] shrink-0" href="https://www.facebook.com/" data-node-id="132:1995" target="_blank" data-name="Social / facebook">
              <IconSocialFacebook className="relative shrink-0 size-[20px]" />
            </a>
            <a className="bg-[rgba(255,255,255,0.06)] border border-[rgba(255,255,255,0.14)] border-solid content-stretch flex items-start overflow-clip p-[10px] relative rounded-[100px] shrink-0" href="https://wa.me/966573534185" data-node-id="132:2000" target="_blank" data-name="Social / whatsapp">
              <IconSocialWhatsapp className="relative shrink-0 size-[20px]" />
            </a>
          </div>
        </div>
        <div className="content-stretch flex flex-col gap-[14px] items-start relative shrink-0 w-[160px]" data-node-id="13:509" data-name="Frame">
          <p className="[word-break:break-word] font-['Poppins:SemiBold'] leading-[24px] not-italic relative shrink-0 text-[17px] text-[color:var(--white,white)] whitespace-nowrap" data-node-id="13:510">
            Quick Links
          </p>
          <a className="content-stretch cursor-pointer flex gap-[10px] items-center relative shrink-0" data-node-id="13:511" data-name="Frame">
            <div className="relative shrink-0 size-[5px]" data-node-id="13:512" data-name="Ellipse">
              <img alt="" className="absolute block inset-0 max-w-none size-full" src={imgEllipse} />
            </div>
            <p className="[word-break:break-word] font-['Poppins:Regular'] leading-[22px] not-italic opacity-68 relative shrink-0 text-[14px] text-[color:var(--white,white)] text-left whitespace-nowrap" data-node-id="13:513">
              Home
            </p>
          </a>
          <a className="content-stretch cursor-pointer flex gap-[10px] items-center relative shrink-0" data-node-id="13:515" data-name="Frame">
            <div className="relative shrink-0 size-[5px]" data-node-id="13:516" data-name="Ellipse">
              <img alt="" className="absolute block inset-0 max-w-none size-full" src={imgEllipse} />
            </div>
            <p className="[word-break:break-word] font-['Poppins:Regular'] leading-[22px] not-italic opacity-68 relative shrink-0 text-[14px] text-[color:var(--white,white)] text-left whitespace-nowrap" data-node-id="13:517">
              Services
            </p>
          </a>
          <a className="content-stretch cursor-pointer flex gap-[10px] items-center relative shrink-0" data-node-id="13:519" data-name="Frame">
            <div className="relative shrink-0 size-[5px]" data-node-id="13:520" data-name="Ellipse">
              <img alt="" className="absolute block inset-0 max-w-none size-full" src={imgEllipse} />
            </div>
            <p className="[word-break:break-word] font-['Poppins:Regular'] leading-[22px] not-italic opacity-68 relative shrink-0 text-[14px] text-[color:var(--white,white)] text-left whitespace-nowrap" data-node-id="13:521">
              About Us
            </p>
          </a>
          <a className="content-stretch cursor-pointer flex gap-[10px] items-center relative shrink-0" data-node-id="13:523" data-name="Frame">
            <div className="relative shrink-0 size-[5px]" data-node-id="13:524" data-name="Ellipse">
              <img alt="" className="absolute block inset-0 max-w-none size-full" src={imgEllipse} />
            </div>
            <p className="[word-break:break-word] font-['Poppins:Regular'] leading-[22px] not-italic opacity-68 relative shrink-0 text-[14px] text-[color:var(--white,white)] text-left whitespace-nowrap" data-node-id="13:525">
              Projects
            </p>
          </a>
          <a className="content-stretch cursor-pointer flex gap-[10px] items-center relative shrink-0" data-node-id="13:531" data-name="Frame">
            <div className="relative shrink-0 size-[5px]" data-node-id="13:532" data-name="Ellipse">
              <img alt="" className="absolute block inset-0 max-w-none size-full" src={imgEllipse} />
            </div>
            <p className="[word-break:break-word] font-['Poppins:Regular'] leading-[22px] not-italic opacity-68 relative shrink-0 text-[14px] text-[color:var(--white,white)] text-left whitespace-nowrap" data-node-id="13:533">
              Contact Us
            </p>
          </a>
        </div>
        <div className="content-stretch flex flex-[1_0_0] flex-col gap-[16px] items-start min-w-px relative" data-node-id="13:553" data-name="Frame">
          <p className="[word-break:break-word] font-['Poppins:SemiBold'] leading-[24px] not-italic relative shrink-0 text-[17px] text-[color:var(--white,white)] whitespace-nowrap" data-node-id="13:554">
            Contact Info
          </p>
          <div className="content-stretch flex gap-[12px] items-start relative shrink-0 w-full" data-node-id="13:555" data-name="Frame">
            <div className="relative shrink-0 size-[18px]" data-node-id="13:556" data-name="Frame">
              <img alt="" className="absolute block inset-0 max-w-none size-full" src={imgFrame} />
            </div>
            <a className="[word-break:break-word] block cursor-pointer flex-[1_0_0] font-['Poppins:Regular'] leading-[22px] min-w-px not-italic opacity-68 relative text-[14px] text-[color:var(--white,white)]" href="tel:+966573534185" data-node-id="13:558" target="_blank">
              +966 57 353 4185
            </a>
          </div>
          <div className="content-stretch flex gap-[12px] items-start relative shrink-0 w-full" data-node-id="13:559" data-name="Frame">
            <div className="relative shrink-0 size-[18px]" data-node-id="13:560" data-name="Frame">
              <img alt="" className="absolute block inset-0 max-w-none size-full" src={imgFrame1} />
            </div>
            <a className="[word-break:break-word] block cursor-pointer flex-[1_0_0] font-['Poppins:Regular'] leading-[22px] min-w-px not-italic opacity-68 relative text-[14px] text-[color:var(--white,white)]" href="mailto:info@aljazira.co" data-node-id="13:562" target="_blank">
              info@aljazira.co
            </a>
          </div>
          <div className="content-stretch flex gap-[12px] items-start relative shrink-0 w-full" data-node-id="13:563" data-name="Frame">
            <div className="relative shrink-0 size-[18px]" data-node-id="13:564" data-name="Frame">
              <img alt="" className="absolute block inset-0 max-w-none size-full" src={imgFrame2} />
            </div>
            <p className="[word-break:break-word] flex-[1_0_0] font-['Poppins:Regular'] leading-[22px] min-w-px not-italic opacity-68 relative text-[14px] text-[color:var(--white,white)]" data-node-id="13:566">
              7676 Bathaa Quraish, Makkah Al-Mukarramah, KSA
            </p>
          </div>
        </div>
        <div className="bg-[rgba(255,255,255,0.04)] border border-[rgba(255,255,255,0.1)] border-solid content-stretch flex flex-col gap-[12px] items-start overflow-clip p-[22px] relative rounded-[16px] shrink-0 w-[280px]" data-node-id="114:296" data-name="Footer CTA">
          <p className="[word-break:break-word] font-['Poppins:SemiBold'] leading-[24px] not-italic relative shrink-0 text-[17px] text-[color:var(--white,white)] whitespace-nowrap" data-node-id="114:297">
            Have a project in mind?
          </p>
          <p className="[word-break:break-word] font-['Poppins:Regular'] leading-[22px] min-w-full not-italic opacity-62 relative shrink-0 text-[14px] text-[color:var(--white,white)] w-[min-content]" data-node-id="114:298">
            Send us your drawings or BOQ and our engineers will get back to you within one working day.
          </p>
          <Button className="bg-[var(--gold\/500,#dfa82a)] content-stretch drop-shadow-[0px_8px_10px_rgba(223,168,42,0.35)] flex gap-[10px] items-center justify-center pl-[26px] pr-[24px] py-[14px] relative rounded-[8px] shrink-0 w-full" />
          <a className="content-stretch cursor-pointer flex gap-[8px] items-center relative shrink-0" href="https://wa.me/966573534185" data-node-id="114:303" target="_blank" data-name="WhatsApp link">
            <div className="relative shrink-0 size-[18px]" data-node-id="132:2162" data-name="Icon/social/whatsapp">
              <img alt="" className="absolute block inset-0 max-w-none size-full" src={imgIconSocialWhatsapp1} />
            </div>
            <p className="[word-break:break-word] font-['Poppins:Regular'] leading-[22px] not-italic opacity-62 relative shrink-0 text-[14px] text-left text-white whitespace-nowrap" data-node-id="114:306">
              Chat on WhatsApp
            </p>
          </a>
        </div>
      </div>
      <div className="bg-[rgba(255,255,255,0.1)] h-px relative shrink-0 w-full" data-node-id="13:567" data-name="Rectangle" />
      <div className="content-stretch flex items-start justify-between relative shrink-0 w-full" data-node-id="13:568" data-name="Frame">
        <p className="[word-break:break-word] font-['Poppins:Regular'] leading-[22px] not-italic opacity-50 relative shrink-0 text-[14px] text-[color:var(--white,white)] whitespace-nowrap" data-node-id="13:569">
          © 2026 Al Jazira for Imdad Smart Company. All rights reserved.
        </p>
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
These styles are contained in the design: Body/S: Font(family: "Poppins", style: Regular, size: 14, weight: 400, lineHeight: 22, letterSpacing: 0), Heading/H5: Font(family: "Poppins", style: SemiBold, size: 17, weight: 600, lineHeight: 24, letterSpacing: 0), Label/Button: Font(family: "Poppins", style: SemiBold, size: 15, weight: 600, lineHeight: 22, letterSpacing: 0).
```

```text
Component descriptions: The following components have usage descriptions or documentation links defined in Figma. These descriptions provide important context about the intended usage, best practices, and any constraints for each component. Follow these guidelines when implementing or using these components.

## Logo
**Node ID:** 100:515

ALJAZIRA for IMDAD Smart Company — official logo (vector, from the identity PDF). Primary/Dark/Navy for light backgrounds; Reversed/White for dark backgrounds. Compact drops the EN/AR taglines for small sizes; Icon is the symbol only.
```

```text
The generated code contains image and SVG URL constants, e.g. const image = `${assetPathPrefix}/<asset file name>`, where assetPathPrefix is declared once at the top of the code and every asset URL interpolates it. These URLs are temporary download sources and expire after 7 days. Download each asset into the project with curl -L, then replace its URL in the generated code with a reference to the downloaded asset. Never use the temporary URLs as runtime image sources.
```
