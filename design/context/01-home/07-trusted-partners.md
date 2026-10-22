# Trusted partners

- Figma node: `18:579` (file `tD3pU1vtvSr8akTMJPFLkA`)
- Page: 01 Home
- Source: Figma MCP `get_design_context` (React + Tailwind reference code, saved verbatim). Treat as a high-fidelity reference, not production code: convert absolute positioning into real layout.
- The temporary `assetPathPrefix` URLs below expire; use the local files in the asset table instead.

## Asset map (code constant -> local file)

| Constant | Figma asset file | Local file (relative to design/) |
|---|---|---|
| `imgEllipse` | `f1f80.svg` | `assets/context/01-home/07-trusted-partners/imgEllipse.svg` |

## Reference code

```jsx
const assetPathPrefix = "https://www.figma.com/api/mcp/asset/cf52e82e-116c-4aef-95b6-56683fb4f4d9";
const imgEllipse = `${assetPathPrefix}/f1f80.svg`;

type BrandTileProps = {
  className?: string;
  brand?: string;
  origin?: string;
};

function BrandTile({ className, brand = "Brand", origin = "Country" }: BrandTileProps) {
  return (
    <div className={className || "[word-break:break-word] bg-[var(--white,white)] border border-[var(--border,#e3e7ee)] border-solid content-stretch drop-shadow-[0px_6px_8px_rgba(1,16,37,0.04)] flex flex-col gap-[2px] h-[76px] items-center justify-center not-italic relative rounded-[14px] text-center w-[200px] whitespace-nowrap"} data-node-id="156:890" data-name="Brand Tile">
      <p className="font-['Poppins:SemiBold'] leading-[24px] relative shrink-0 text-[17px] text-[color:var(--navy\/950,#011025)]" data-node-id="156:891">
        {brand}
      </p>
      <p className="font-['Poppins:Regular'] leading-[18px] relative shrink-0 text-[12px] text-[color:var(--text\/muted,#8a93a3)]" data-node-id="156:892">
        {origin}
      </p>
    </div>
  );
}

type LogoMarqueeProps = {
  className?: string;
  position?: "A";
};

function LogoMarquee({ className, position = "A" }: LogoMarqueeProps) {
  return (
    <div className={className || "h-[196px] overflow-clip relative w-[1440px]"} data-node-id="18:430">
      <div className="[word-break:break-word] absolute content-stretch flex gap-[24px] items-start left-0 not-italic text-center top-[12px] whitespace-nowrap" data-node-id="18:431" data-name="Row 1">
        <div className="content-stretch flex gap-[24px] items-start relative shrink-0" data-node-id="18:432" data-name="Track">
          <BrandTile brand="Alfanar" className="bg-[var(--white,white)] border border-[var(--border,#e3e7ee)] border-solid content-stretch drop-shadow-[0px_6px_8px_rgba(1,16,37,0.04)] flex flex-col gap-[2px] h-[76px] items-center justify-center relative rounded-[14px] shrink-0 w-[200px]" origin="Saudi Arabia" />
          <BrandTile brand="Legrand" className="bg-[var(--white,white)] border border-[var(--border,#e3e7ee)] border-solid content-stretch drop-shadow-[0px_6px_8px_rgba(1,16,37,0.04)] flex flex-col gap-[2px] h-[76px] items-center justify-center relative rounded-[14px] shrink-0 w-[200px]" origin="France" />
          <BrandTile brand="Belden" className="bg-[var(--white,white)] border border-[var(--border,#e3e7ee)] border-solid content-stretch drop-shadow-[0px_6px_8px_rgba(1,16,37,0.04)] flex flex-col gap-[2px] h-[76px] items-center justify-center relative rounded-[14px] shrink-0 w-[200px]" origin="USA" />
          <BrandTile brand="CommScope" className="bg-[var(--white,white)] border border-[var(--border,#e3e7ee)] border-solid content-stretch drop-shadow-[0px_6px_8px_rgba(1,16,37,0.04)] flex flex-col gap-[2px] h-[76px] items-center justify-center relative rounded-[14px] shrink-0 w-[200px]" origin="USA" />
          <BrandTile brand="Tridonic" className="bg-[var(--white,white)] border border-[var(--border,#e3e7ee)] border-solid content-stretch drop-shadow-[0px_6px_8px_rgba(1,16,37,0.04)] flex flex-col gap-[2px] h-[76px] items-center justify-center relative rounded-[14px] shrink-0 w-[200px]" origin="Austria" />
          <BrandTile brand="Eaton Cooper" className="bg-[var(--white,white)] border border-[var(--border,#e3e7ee)] border-solid content-stretch drop-shadow-[0px_6px_8px_rgba(1,16,37,0.04)] flex flex-col gap-[2px] h-[76px] items-center justify-center relative rounded-[14px] shrink-0 w-[200px]" origin="USA" />
          <BrandTile brand="Tyco" className="bg-[var(--white,white)] border border-[var(--border,#e3e7ee)] border-solid content-stretch drop-shadow-[0px_6px_8px_rgba(1,16,37,0.04)] flex flex-col gap-[2px] h-[76px] items-center justify-center relative rounded-[14px] shrink-0 w-[200px]" origin="USA" />
          <BrandTile brand="Grohe" className="bg-[var(--white,white)] border border-[var(--border,#e3e7ee)] border-solid content-stretch drop-shadow-[0px_6px_8px_rgba(1,16,37,0.04)] flex flex-col gap-[2px] h-[76px] items-center justify-center relative rounded-[14px] shrink-0 w-[200px]" origin="Germany" />
          <BrandTile brand="Ariston" className="bg-[var(--white,white)] border border-[var(--border,#e3e7ee)] border-solid content-stretch drop-shadow-[0px_6px_8px_rgba(1,16,37,0.04)] flex flex-col gap-[2px] h-[76px] items-center justify-center relative rounded-[14px] shrink-0 w-[200px]" origin="Italy" />
          <BrandTile brand="Watts" className="bg-[var(--white,white)] border border-[var(--border,#e3e7ee)] border-solid content-stretch drop-shadow-[0px_6px_8px_rgba(1,16,37,0.04)] flex flex-col gap-[2px] h-[76px] items-center justify-center relative rounded-[14px] shrink-0 w-[200px]" origin="USA" />
        </div>
        <div className="content-stretch flex gap-[24px] items-start relative shrink-0" data-node-id="18:449" data-name="Track">
          <BrandTile brand="Alfanar" className="bg-[var(--white,white)] border border-[var(--border,#e3e7ee)] border-solid content-stretch drop-shadow-[0px_6px_8px_rgba(1,16,37,0.04)] flex flex-col gap-[2px] h-[76px] items-center justify-center relative rounded-[14px] shrink-0 w-[200px]" origin="Saudi Arabia" />
          <BrandTile brand="Legrand" className="bg-[var(--white,white)] border border-[var(--border,#e3e7ee)] border-solid content-stretch drop-shadow-[0px_6px_8px_rgba(1,16,37,0.04)] flex flex-col gap-[2px] h-[76px] items-center justify-center relative rounded-[14px] shrink-0 w-[200px]" origin="France" />
          <BrandTile brand="Belden" className="bg-[var(--white,white)] border border-[var(--border,#e3e7ee)] border-solid content-stretch drop-shadow-[0px_6px_8px_rgba(1,16,37,0.04)] flex flex-col gap-[2px] h-[76px] items-center justify-center relative rounded-[14px] shrink-0 w-[200px]" origin="USA" />
          <BrandTile brand="CommScope" className="bg-[var(--white,white)] border border-[var(--border,#e3e7ee)] border-solid content-stretch drop-shadow-[0px_6px_8px_rgba(1,16,37,0.04)] flex flex-col gap-[2px] h-[76px] items-center justify-center relative rounded-[14px] shrink-0 w-[200px]" origin="USA" />
          <BrandTile brand="Tridonic" className="bg-[var(--white,white)] border border-[var(--border,#e3e7ee)] border-solid content-stretch drop-shadow-[0px_6px_8px_rgba(1,16,37,0.04)] flex flex-col gap-[2px] h-[76px] items-center justify-center relative rounded-[14px] shrink-0 w-[200px]" origin="Austria" />
          <BrandTile brand="Eaton Cooper" className="bg-[var(--white,white)] border border-[var(--border,#e3e7ee)] border-solid content-stretch drop-shadow-[0px_6px_8px_rgba(1,16,37,0.04)] flex flex-col gap-[2px] h-[76px] items-center justify-center relative rounded-[14px] shrink-0 w-[200px]" origin="USA" />
          <BrandTile brand="Tyco" className="bg-[var(--white,white)] border border-[var(--border,#e3e7ee)] border-solid content-stretch drop-shadow-[0px_6px_8px_rgba(1,16,37,0.04)] flex flex-col gap-[2px] h-[76px] items-center justify-center relative rounded-[14px] shrink-0 w-[200px]" origin="USA" />
          <BrandTile brand="Grohe" className="bg-[var(--white,white)] border border-[var(--border,#e3e7ee)] border-solid content-stretch drop-shadow-[0px_6px_8px_rgba(1,16,37,0.04)] flex flex-col gap-[2px] h-[76px] items-center justify-center relative rounded-[14px] shrink-0 w-[200px]" origin="Germany" />
          <BrandTile brand="Ariston" className="bg-[var(--white,white)] border border-[var(--border,#e3e7ee)] border-solid content-stretch drop-shadow-[0px_6px_8px_rgba(1,16,37,0.04)] flex flex-col gap-[2px] h-[76px] items-center justify-center relative rounded-[14px] shrink-0 w-[200px]" origin="Italy" />
          <BrandTile brand="Watts" className="bg-[var(--white,white)] border border-[var(--border,#e3e7ee)] border-solid content-stretch drop-shadow-[0px_6px_8px_rgba(1,16,37,0.04)] flex flex-col gap-[2px] h-[76px] items-center justify-center relative rounded-[14px] shrink-0 w-[200px]" origin="USA" />
        </div>
      </div>
      <div className="[word-break:break-word] absolute content-stretch flex gap-[24px] items-start left-[-2240px] not-italic text-center top-[108px] whitespace-nowrap" data-node-id="18:466" data-name="Row 2">
        <div className="content-stretch flex gap-[24px] items-start relative shrink-0" data-node-id="18:467" data-name="Track">
          <BrandTile brand="Zamil" className="bg-[var(--white,white)] border border-[var(--border,#e3e7ee)] border-solid content-stretch drop-shadow-[0px_6px_8px_rgba(1,16,37,0.04)] flex flex-col gap-[2px] h-[76px] items-center justify-center relative rounded-[14px] shrink-0 w-[200px]" origin="Saudi Arabia" />
          <BrandTile brand="SKM" className="bg-[var(--white,white)] border border-[var(--border,#e3e7ee)] border-solid content-stretch drop-shadow-[0px_6px_8px_rgba(1,16,37,0.04)] flex flex-col gap-[2px] h-[76px] items-center justify-center relative rounded-[14px] shrink-0 w-[200px]" origin="UAE" />
          <BrandTile brand="Systemair" className="bg-[var(--white,white)] border border-[var(--border,#e3e7ee)] border-solid content-stretch drop-shadow-[0px_6px_8px_rgba(1,16,37,0.04)] flex flex-col gap-[2px] h-[76px] items-center justify-center relative rounded-[14px] shrink-0 w-[200px]" origin="Sweden" />
          <BrandTile brand="Hempel" className="bg-[var(--white,white)] border border-[var(--border,#e3e7ee)] border-solid content-stretch drop-shadow-[0px_6px_8px_rgba(1,16,37,0.04)] flex flex-col gap-[2px] h-[76px] items-center justify-center relative rounded-[14px] shrink-0 w-[200px]" origin="Denmark" />
          <BrandTile brand="Jazeera Paints" className="bg-[var(--white,white)] border border-[var(--border,#e3e7ee)] border-solid content-stretch drop-shadow-[0px_6px_8px_rgba(1,16,37,0.04)] flex flex-col gap-[2px] h-[76px] items-center justify-center relative rounded-[14px] shrink-0 w-[200px]" origin="Saudi Arabia" />
          <BrandTile brand="Saudi Ceramics" className="bg-[var(--white,white)] border border-[var(--border,#e3e7ee)] border-solid content-stretch drop-shadow-[0px_6px_8px_rgba(1,16,37,0.04)] flex flex-col gap-[2px] h-[76px] items-center justify-center relative rounded-[14px] shrink-0 w-[200px]" origin="Saudi Arabia" />
          <BrandTile brand="Tahweel" className="bg-[var(--white,white)] border border-[var(--border,#e3e7ee)] border-solid content-stretch drop-shadow-[0px_6px_8px_rgba(1,16,37,0.04)] flex flex-col gap-[2px] h-[76px] items-center justify-center relative rounded-[14px] shrink-0 w-[200px]" origin="Saudi Arabia" />
          <BrandTile brand="Bahra Cables" className="bg-[var(--white,white)] border border-[var(--border,#e3e7ee)] border-solid content-stretch drop-shadow-[0px_6px_8px_rgba(1,16,37,0.04)] flex flex-col gap-[2px] h-[76px] items-center justify-center relative rounded-[14px] shrink-0 w-[200px]" origin="Saudi Arabia" />
          <BrandTile brand="Al Rajhi Steel" className="bg-[var(--white,white)] border border-[var(--border,#e3e7ee)] border-solid content-stretch drop-shadow-[0px_6px_8px_rgba(1,16,37,0.04)] flex flex-col gap-[2px] h-[76px] items-center justify-center relative rounded-[14px] shrink-0 w-[200px]" origin="Saudi Arabia" />
          <BrandTile brand="Obeikan Glass" className="bg-[var(--white,white)] border border-[var(--border,#e3e7ee)] border-solid content-stretch drop-shadow-[0px_6px_8px_rgba(1,16,37,0.04)] flex flex-col gap-[2px] h-[76px] items-center justify-center relative rounded-[14px] shrink-0 w-[200px]" origin="Saudi Arabia" />
        </div>
        <div className="content-stretch flex gap-[24px] items-start relative shrink-0" data-node-id="18:484" data-name="Track">
          <BrandTile brand="Zamil" className="bg-[var(--white,white)] border border-[var(--border,#e3e7ee)] border-solid content-stretch drop-shadow-[0px_6px_8px_rgba(1,16,37,0.04)] flex flex-col gap-[2px] h-[76px] items-center justify-center relative rounded-[14px] shrink-0 w-[200px]" origin="Saudi Arabia" />
          <BrandTile brand="SKM" className="bg-[var(--white,white)] border border-[var(--border,#e3e7ee)] border-solid content-stretch drop-shadow-[0px_6px_8px_rgba(1,16,37,0.04)] flex flex-col gap-[2px] h-[76px] items-center justify-center relative rounded-[14px] shrink-0 w-[200px]" origin="UAE" />
          <BrandTile brand="Systemair" className="bg-[var(--white,white)] border border-[var(--border,#e3e7ee)] border-solid content-stretch drop-shadow-[0px_6px_8px_rgba(1,16,37,0.04)] flex flex-col gap-[2px] h-[76px] items-center justify-center relative rounded-[14px] shrink-0 w-[200px]" origin="Sweden" />
          <BrandTile brand="Hempel" className="bg-[var(--white,white)] border border-[var(--border,#e3e7ee)] border-solid content-stretch drop-shadow-[0px_6px_8px_rgba(1,16,37,0.04)] flex flex-col gap-[2px] h-[76px] items-center justify-center relative rounded-[14px] shrink-0 w-[200px]" origin="Denmark" />
          <BrandTile brand="Jazeera Paints" className="bg-[var(--white,white)] border border-[var(--border,#e3e7ee)] border-solid content-stretch drop-shadow-[0px_6px_8px_rgba(1,16,37,0.04)] flex flex-col gap-[2px] h-[76px] items-center justify-center relative rounded-[14px] shrink-0 w-[200px]" origin="Saudi Arabia" />
          <BrandTile brand="Saudi Ceramics" className="bg-[var(--white,white)] border border-[var(--border,#e3e7ee)] border-solid content-stretch drop-shadow-[0px_6px_8px_rgba(1,16,37,0.04)] flex flex-col gap-[2px] h-[76px] items-center justify-center relative rounded-[14px] shrink-0 w-[200px]" origin="Saudi Arabia" />
          <BrandTile brand="Tahweel" className="bg-[var(--white,white)] border border-[var(--border,#e3e7ee)] border-solid content-stretch drop-shadow-[0px_6px_8px_rgba(1,16,37,0.04)] flex flex-col gap-[2px] h-[76px] items-center justify-center relative rounded-[14px] shrink-0 w-[200px]" origin="Saudi Arabia" />
          <BrandTile brand="Bahra Cables" className="bg-[var(--white,white)] border border-[var(--border,#e3e7ee)] border-solid content-stretch drop-shadow-[0px_6px_8px_rgba(1,16,37,0.04)] flex flex-col gap-[2px] h-[76px] items-center justify-center relative rounded-[14px] shrink-0 w-[200px]" origin="Saudi Arabia" />
          <BrandTile brand="Al Rajhi Steel" className="bg-[var(--white,white)] border border-[var(--border,#e3e7ee)] border-solid content-stretch drop-shadow-[0px_6px_8px_rgba(1,16,37,0.04)] flex flex-col gap-[2px] h-[76px] items-center justify-center relative rounded-[14px] shrink-0 w-[200px]" origin="Saudi Arabia" />
          <BrandTile brand="Obeikan Glass" className="bg-[var(--white,white)] border border-[var(--border,#e3e7ee)] border-solid content-stretch drop-shadow-[0px_6px_8px_rgba(1,16,37,0.04)] flex flex-col gap-[2px] h-[76px] items-center justify-center relative rounded-[14px] shrink-0 w-[200px]" origin="Saudi Arabia" />
        </div>
      </div>
      <div className="absolute bg-gradient-to-r from-[#f6f8fb] h-[196px] left-0 to-[rgba(246,248,251,0)] top-0 w-[120px]" data-node-id="18:501" data-name="Rectangle" />
      <div className="absolute bg-gradient-to-r from-[rgba(246,248,251,0)] h-[196px] left-[1320px] to-[#f6f8fb] top-0 w-[120px]" data-node-id="18:502" data-name="Rectangle" />
    </div>
  );
}

export default function TrustedPartners() {
  return (
    <div className="bg-[var(--surface,#f6f8fb)] content-stretch flex flex-col gap-[40px] items-center pb-[65px] pt-[72px] relative size-full" data-node-id="18:579" data-name="Trusted partners">
      <div className="content-stretch flex flex-col gap-[16px] items-center relative shrink-0" data-node-id="18:580" data-name="Section head">
        <div className="bg-[var(--gold\/50,#fbf4e3)] border border-[rgba(239,203,118,0.6)] border-solid content-stretch flex gap-[8px] items-center px-[14px] py-[6px] relative rounded-[100px] shrink-0" data-node-id="18:581" data-name="Eyebrow">
          <div className="relative shrink-0 size-[6px]" data-node-id="I18:581;12:42" data-name="Ellipse">
            <img alt="" className="absolute block inset-0 max-w-none size-full" src={imgEllipse} />
          </div>
          <p className="[word-break:break-word] font-['Poppins:SemiBold'] leading-[16px] not-italic relative shrink-0 text-[12px] text-[color:var(--gold\/600,#c38f1c)] tracking-[0.96px] uppercase whitespace-nowrap" data-node-id="I18:581;12:43">
            Trusted Partners
          </p>
        </div>
        <p className="[word-break:break-word] font-['Poppins:Bold'] leading-[52px] not-italic relative shrink-0 text-[44px] text-[color:var(--navy\/950,#011025)] text-center tracking-[-0.44px] whitespace-nowrap" data-node-id="18:584">
          Trusted Partners
        </p>
        <p className="[word-break:break-word] font-['Poppins:Regular'] leading-[30px] not-italic relative shrink-0 text-[18px] text-[color:var(--text\/body,#5b6475)] text-center w-[620px]" data-node-id="18:585">
          We collaborate with world-leading brands to deliver the highest quality solutions.
        </p>
      </div>
      <LogoMarquee className="h-[196px] overflow-clip relative shrink-0 w-full" />
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
These styles are contained in the design: Label/Eyebrow: Font(family: "Poppins", style: SemiBold, size: 12, weight: 600, lineHeight: 16, letterSpacing: 8), Heading/H2: Font(family: "Poppins", style: Bold, size: 44, weight: 700, lineHeight: 52, letterSpacing: -1), Body/L: Font(family: "Poppins", style: Regular, size: 18, weight: 400, lineHeight: 30, letterSpacing: 0), Heading/H5: Font(family: "Poppins", style: SemiBold, size: 17, weight: 600, lineHeight: 24, letterSpacing: 0), Caption/S: Font(family: "Poppins", style: Regular, size: 12, weight: 400, lineHeight: 18, letterSpacing: 0).
```

```text
Component descriptions: The following components have usage descriptions or documentation links defined in Figma. These descriptions provide important context about the intended usage, best practices, and any constraints for each component. Follow these guidelines when implementing or using these components.

## Brand Tile
**Node ID:** 156:890

Brand wordmark tile. Replace with the official logo file from the dashboard (Brands) when available; keep the same 200×76 slot.
```

```text
The generated code contains image and SVG URL constants, e.g. const image = `${assetPathPrefix}/<asset file name>`, where assetPathPrefix is declared once at the top of the code and every asset URL interpolates it. These URLs are temporary download sources and expire after 7 days. Download each asset into the project with curl -L, then replace its URL in the generated code with a reference to the downloaded asset. Never use the temporary URLs as runtime image sources.
```
