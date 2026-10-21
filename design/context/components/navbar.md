# Navbar

- Figma node: `13:489` (file `tD3pU1vtvSr8akTMJPFLkA`)
- Page: Design System
- Source: Figma MCP `get_design_context` (React + Tailwind reference code, saved verbatim). Treat as a high-fidelity reference, not production code: convert absolute positioning into real layout.
- The temporary `assetPathPrefix` URLs below expire; use the local files in the asset table instead.

## Asset map (code constant -> local file)

| Constant | Figma asset file | Local file (relative to design/) |
|---|---|---|
| `imgSymbol` | `9a550.svg` | `assets/context/components/navbar/imgSymbol.svg` |
| `imgWordmark` | `e4fa1.svg` | `assets/context/components/navbar/imgWordmark.svg` |
| `imgTaglineEn` | `e1fc9.svg` | `assets/context/components/navbar/imgTaglineEn.svg` |
| `imgTaglineAr` | `98d28.svg` | `assets/context/components/navbar/imgTaglineAr.svg` |
| `imgArrow` | `eb39c.svg` | `assets/context/components/navbar/imgArrow.svg` |
| `imgArrow1` | `7d578.svg` | `assets/context/components/navbar/imgArrow1.svg` |

## Reference code

```jsx
const assetPathPrefix = "https://www.figma.com/api/mcp/asset/38685b1f-9f94-45c8-b118-5acf5eddb7a3";
const imgSymbol = `${assetPathPrefix}/9a550.svg`;
const imgWordmark = `${assetPathPrefix}/e4fa1.svg`;
const imgTaglineEn = `${assetPathPrefix}/e1fc9.svg`;
const imgTaglineAr = `${assetPathPrefix}/98d28.svg`;
const imgArrow = `${assetPathPrefix}/eb39c.svg`;
const imgArrow1 = `${assetPathPrefix}/7d578.svg`;

type NavLinkProps = {
  className?: string;
  label?: string;
  state?: "Default" | "Active";
  theme?: "Light" | "Dark";
};

function NavLink({ className, label = "Home", state = "Default", theme = "Light" }: NavLinkProps) {
  const isDarkAndActive = theme === "Dark" && state === "Active";
  const isDarkAndDefault = theme === "Dark" && state === "Default";
  const isLightAndActive = theme === "Light" && state === "Active";
  const isLightAndDefault = theme === "Light" && state === "Default";
  return (
    <div className={className || "content-stretch flex flex-col gap-[6px] items-center pt-[6px] relative"} id={isDarkAndActive ? "node-12_63" : isDarkAndDefault ? "node-12_57" : isLightAndActive ? "node-12_54" : "node-12_48"}>
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
      {isDarkAndDefault && (
        <>
          <p className="[word-break:break-word] font-['Poppins:Medium'] leading-[22px] not-italic opacity-82 relative shrink-0 text-[15px] text-white whitespace-nowrap" data-node-id="12:58">
            {label}
          </p>
          <div className="bg-[var(--gold\/500,#dfa82a)] h-[2px] relative rounded-[1px] shrink-0 w-[0.01px]" data-node-id="12:59" data-name="Underline" />
        </>
      )}
      {isDarkAndActive && (
        <>
          <p className="[word-break:break-word] font-['Poppins:SemiBold'] leading-[22px] not-italic relative shrink-0 text-[15px] text-[color:var(--white,white)] whitespace-nowrap" data-node-id="12:64">
            {label}
          </p>
          <div className="bg-[var(--gold\/500,#dfa82a)] h-[2px] relative rounded-[1px] shrink-0 w-full" data-node-id="12:65" data-name="Underline" />
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

type NavbarProps = {
  className?: string;
  page?: "Home" | "Services" | "About Us" | "Projects" | "Contact Us";
  theme?: "Light" | "Dark";
};

export default function Navbar({ className, page = "Home", theme = "Light" }: NavbarProps) {
  const isDark = theme === "Dark";
  const isDarkAndAboutUs = theme === "Dark" && page === "About Us";
  const isDarkAndContactUs = theme === "Dark" && page === "Contact Us";
  const isDarkAndHome = theme === "Dark" && page === "Home";
  const isDarkAndProjects = theme === "Dark" && page === "Projects";
  const isDarkAndServices = theme === "Dark" && page === "Services";
  const isLightAndAboutUs = theme === "Light" && page === "About Us";
  const isLightAndContactUs = theme === "Light" && page === "Contact Us";
  const isLightAndProjects = theme === "Light" && page === "Projects";
  const isLightAndServices = theme === "Light" && page === "Services";
  return (
    <div className={className || `content-stretch flex h-[80px] items-center justify-between px-[140px] py-[12px] relative w-[1440px] ${isDark ? "border-[rgba(255,255,255,0.08)] border-b border-solid" : "backdrop-blur-[7px] bg-[rgba(255,255,255,0.94)] drop-shadow-[0px_2px_8px_rgba(1,16,37,0.06)]"}`} id={isDarkAndContactUs ? "node-13_449" : isDarkAndProjects ? "node-13_369" : isDarkAndAboutUs ? "node-13_329" : isDarkAndServices ? "node-13_289" : isDarkAndHome ? "node-13_249" : isLightAndContactUs ? "node-13_209" : isLightAndProjects ? "node-13_129" : isLightAndAboutUs ? "node-13_89" : isLightAndServices ? "node-13_49" : "node-13_9"}>
      <Logo className="block h-[50px] relative shrink-0 w-[172px]" />
      <div className="content-stretch flex gap-[30px] items-start relative shrink-0" id={isDarkAndContactUs ? "node-13_452" : isDarkAndProjects ? "node-13_372" : isDarkAndAboutUs ? "node-13_332" : isDarkAndServices ? "node-13_292" : isDarkAndHome ? "node-13_252" : isLightAndContactUs ? "node-13_212" : isLightAndProjects ? "node-13_132" : isLightAndAboutUs ? "node-13_92" : isLightAndServices ? "node-13_52" : "node-13_12"} data-name="Links">
        <NavLink className="content-stretch flex flex-col gap-[6px] items-center pt-[6px] relative shrink-0" state={page === "Home" ? "Active" : undefined} theme={isDark ? "Dark" : undefined} />
        <NavLink className="content-stretch flex flex-col gap-[6px] items-center pt-[6px] relative shrink-0" label="Services" state={page === "Services" ? "Active" : undefined} theme={isDark ? "Dark" : undefined} />
        <NavLink className="content-stretch flex flex-col gap-[6px] items-center pt-[6px] relative shrink-0" label="About Us" state={page === "About Us" ? "Active" : undefined} theme={isDark ? "Dark" : undefined} />
        <NavLink className="content-stretch flex flex-col gap-[6px] items-center pt-[6px] relative shrink-0" label="Projects" state={page === "Projects" ? "Active" : undefined} theme={isDark ? "Dark" : undefined} />
        <NavLink className="content-stretch flex flex-col gap-[6px] items-center pt-[6px] relative shrink-0" label="Contact Us" state={page === "Contact Us" ? "Active" : undefined} theme={isDark ? "Dark" : undefined} />
      </div>
      <a className={`content-stretch flex gap-[10px] items-center justify-center pl-[26px] pr-[24px] py-[11px] relative rounded-[8px] shrink-0 ${isDark ? "bg-[rgba(255,255,255,0.08)] border border-[rgba(255,255,255,0.28)] border-solid" : String.raw`bg-[var(--gold\/500,#dfa82a)] drop-shadow-[0px_8px_10px_rgba(223,168,42,0.35)]`}`} id={isDarkAndContactUs ? "node-13_482" : isDarkAndProjects ? "node-13_402" : isDarkAndAboutUs ? "node-13_362" : isDarkAndServices ? "node-13_322" : isDarkAndHome ? "node-13_282" : isLightAndContactUs ? "node-13_242" : isLightAndProjects ? "node-13_162" : isLightAndAboutUs ? "node-13_122" : isLightAndServices ? "node-13_82" : "node-13_42"} data-name="Button">
        <p className={`[word-break:break-word] font-["Poppins:SemiBold"] leading-[22px] not-italic relative shrink-0 text-[15px] text-left whitespace-nowrap ${isDark ? "text-[color:var(--white,white)]" : String.raw`text-[color:var(--navy\/950,#011025)]`}`} id={isDarkAndContactUs ? "node-I13_482-12_21" : isDarkAndProjects ? "node-I13_402-12_21" : isDarkAndAboutUs ? "node-I13_362-12_21" : isDarkAndServices ? "node-I13_322-12_21" : isDarkAndHome ? "node-I13_282-12_21" : isLightAndContactUs ? "node-I13_242-12_5" : isLightAndProjects ? "node-I13_162-12_5" : isLightAndAboutUs ? "node-I13_122-12_5" : isLightAndServices ? "node-I13_82-12_5" : "node-I13_42-12_5"}>
          Get a Quote
        </p>
        <div className="relative shrink-0 size-[18px]" id={isDarkAndContactUs ? "node-I13_482-12_22" : isDarkAndProjects ? "node-I13_402-12_22" : isDarkAndAboutUs ? "node-I13_362-12_22" : isDarkAndServices ? "node-I13_322-12_22" : isDarkAndHome ? "node-I13_282-12_22" : isLightAndContactUs ? "node-I13_242-12_6" : isLightAndProjects ? "node-I13_162-12_6" : isLightAndAboutUs ? "node-I13_122-12_6" : isLightAndServices ? "node-I13_82-12_6" : "node-I13_42-12_6"} data-name="Arrow">
          <img alt="" className="absolute block inset-0 max-w-none size-full" src={isDark ? imgArrow1 : imgArrow} />
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
