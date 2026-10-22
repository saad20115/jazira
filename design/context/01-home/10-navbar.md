# Navbar

- Figma node: `18:749` (file `tD3pU1vtvSr8akTMJPFLkA`)
- Page: 01 Home
- Source: Figma MCP `get_design_context` (React + Tailwind reference code, saved verbatim). Treat as a high-fidelity reference, not production code: convert absolute positioning into real layout.
- The temporary `assetPathPrefix` URLs below expire; use the local files in the asset table instead.

## Asset map (code constant -> local file)

| Constant | Figma asset file | Local file (relative to design/) |
|---|---|---|
| `imgSymbol` | `9a550.svg` | `assets/context/01-home/10-navbar/imgSymbol.svg` |
| `imgWordmark` | `e4fa1.svg` | `assets/context/01-home/10-navbar/imgWordmark.svg` |
| `imgTaglineEn` | `e1fc9.svg` | `assets/context/01-home/10-navbar/imgTaglineEn.svg` |
| `imgTaglineAr` | `98d28.svg` | `assets/context/01-home/10-navbar/imgTaglineAr.svg` |
| `imgArrow` | `eb39c.svg` | `assets/context/01-home/10-navbar/imgArrow.svg` |

## Reference code

```jsx
const assetPathPrefix = "https://www.figma.com/api/mcp/asset/bda8cc2d-cdfd-4909-92ce-542bb21df85f";
const imgSymbol = `${assetPathPrefix}/9a550.svg`;
const imgWordmark = `${assetPathPrefix}/e4fa1.svg`;
const imgTaglineEn = `${assetPathPrefix}/e1fc9.svg`;
const imgTaglineAr = `${assetPathPrefix}/98d28.svg`;
const imgArrow = `${assetPathPrefix}/eb39c.svg`;

type NavLinkProps = {
  className?: string;
  label?: string;
  state?: "Default" | "Active";
  theme?: "Light";
};

function NavLink({ className, label = "Home", state = "Default", theme = "Light" }: NavLinkProps) {
  const isLightAndActive = theme === "Light" && state === "Active";
  const isLightAndDefault = theme === "Light" && state === "Default";
  return (
    <div className={className || "content-stretch flex flex-col gap-[6px] items-center pt-[6px] relative"} id={isLightAndActive ? "node-12_54" : "node-12_48"}>
      {isLightAndDefault && (
        <>
          <p className="[word-break:break-word] font-['Poppins:Medium'] leading-[22px] not-italic relative shrink-0 text-[15px] text-[color:var(--navy\/950,#011025)] whitespace-nowrap" data-node-id="12:49">
            {label}
          </p>
          <div className="bg-[var(--gold\/500,#dfa82a)] h-[2px] relative rounded-[1px] shrink-0 w-[0.01px]" data-node-id="12:50" data-name="Underline" />
        </>
      )}
      {isLightAndActive && (
        <>
          <p className="[word-break:break-word] font-['Poppins:SemiBold'] leading-[22px] not-italic relative shrink-0 text-[15px] text-[color:var(--navy\/950,#011025)] whitespace-nowrap" data-node-id="12:55">
            {label}
          </p>
          <div className="bg-[var(--gold\/500,#dfa82a)] h-[2px] relative rounded-[1px] shrink-0 w-full" data-node-id="12:56" data-name="Underline" />
        </>
      )}
    </div>
  );
}

type LogoProps = {
  className?: string;
  color?: "Primary";
  type?: "Full";
};

function Logo({ className, color = "Primary", type = "Full" }: LogoProps) {
  return (
    <div className={className || "h-[57.61px] relative w-[199px]"} data-node-id="12:2">
      <div className="absolute inset-[0_71.48%_4.29%_0]" data-node-id="96:200" data-name="Symbol">
        <img alt="" className="absolute block inset-0 max-w-none size-full" src={imgSymbol} />
      </div>
      <div className="absolute inset-[15.03%_0_33.53%_26.46%]" data-node-id="96:203" data-name="Wordmark">
        <img alt="" className="absolute block inset-0 max-w-none size-full" src={imgWordmark} />
      </div>
      <div className="absolute inset-[72.09%_5.43%_19.77%_27.54%]" data-node-id="96:206" data-name="Tagline EN">
        <img alt="" className="absolute block inset-0 max-w-none size-full" src={imgTaglineEn} />
      </div>
      <div className="absolute inset-[83.73%_5.59%_0_27.77%]" data-node-id="96:209" data-name="Tagline AR">
        <img alt="" className="absolute block inset-0 max-w-none size-full" src={imgTaglineAr} />
      </div>
    </div>
  );
}

export default function Navbar() {
  return (
    <div className="backdrop-blur-[7px] bg-[rgba(255,255,255,0.94)] content-stretch drop-shadow-[0px_2px_8px_rgba(1,16,37,0.06)] flex items-center justify-between px-[140px] py-[12px] relative size-full" data-node-id="18:749" data-name="Navbar">
      <Logo className="h-[50px] relative shrink-0 w-[172px]" />
      <div className="content-stretch flex gap-[30px] items-start relative shrink-0" data-node-id="I18:749;13:12" data-name="Links">
        <NavLink className="content-stretch flex flex-col gap-[6px] items-center pt-[6px] relative shrink-0" state="Active" />
        <NavLink className="content-stretch cursor-pointer flex flex-col gap-[6px] items-center pt-[6px] relative shrink-0" label="Services" />
        <NavLink className="content-stretch cursor-pointer flex flex-col gap-[6px] items-center pt-[6px] relative shrink-0" label="About Us" />
        <NavLink className="content-stretch cursor-pointer flex flex-col gap-[6px] items-center pt-[6px] relative shrink-0" label="Projects" />
        <NavLink className="content-stretch cursor-pointer flex flex-col gap-[6px] items-center pt-[6px] relative shrink-0" label="Contact Us" />
      </div>
      <a className="bg-[var(--gold\/500,#dfa82a)] content-stretch cursor-pointer drop-shadow-[0px_8px_10px_rgba(223,168,42,0.35)] flex gap-[10px] items-center justify-center pl-[26px] pr-[24px] py-[11px] relative rounded-[8px] shrink-0" data-node-id="I18:749;13:42" data-name="Button">
        <p className="[word-break:break-word] font-['Poppins:SemiBold'] leading-[22px] not-italic relative shrink-0 text-[15px] text-[color:var(--navy\/950,#011025)] text-left whitespace-nowrap" data-node-id="I18:749;13:42;12:5">
          Get a Quote
        </p>
        <div className="relative shrink-0 size-[18px]" data-node-id="I18:749;13:42;12:6" data-name="Arrow">
          <img alt="" className="absolute block inset-0 max-w-none size-full" src={imgArrow} />
        </div>
      </a>
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
These styles are contained in the design: Label/Button: Font(family: "Poppins", style: SemiBold, size: 15, weight: 600, lineHeight: 22, letterSpacing: 0), Label/Nav: Font(family: "Poppins", style: Medium, size: 15, weight: 500, lineHeight: 22, letterSpacing: 0).
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
