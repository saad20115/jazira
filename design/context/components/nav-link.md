# Nav Link

- Figma node: `12:66` (file `tD3pU1vtvSr8akTMJPFLkA`)
- Page: Design System
- Source: Figma MCP `get_design_context` (React + Tailwind reference code, saved verbatim). Treat as a high-fidelity reference, not production code: convert absolute positioning into real layout.
- The temporary `assetPathPrefix` URLs below expire; use the local files in the asset table instead.

## Reference code

```jsx
type NavLinkProps = {
  className?: string;
  label?: string;
  state?: "Default" | "Hover" | "Active";
  theme?: "Light" | "Dark";
};

export default function NavLink({ className, label = "Home", state = "Default", theme = "Light" }: NavLinkProps) {
  const isDarkAndActive = theme === "Dark" && state === "Active";
  const isDarkAndDefault = theme === "Dark" && state === "Default";
  const isDarkAndHover = theme === "Dark" && state === "Hover";
  const isLightAndActive = theme === "Light" && state === "Active";
  const isLightAndHover = theme === "Light" && state === "Hover";
  const isLightAndIsDefaultOrHover = theme === "Light" && ["Default", "Hover"].includes(state);
  return (
    <div className={className || "content-stretch flex flex-col gap-[6px] items-center pt-[6px] relative"} id={isDarkAndActive ? "node-12_63" : isDarkAndHover ? "node-12_60" : isDarkAndDefault ? "node-12_57" : isLightAndActive ? "node-12_54" : isLightAndHover ? "node-12_51" : "node-12_48"}>
      {isLightAndIsDefaultOrHover && (
        <>
          <p className="[word-break:break-word] font-['Poppins:Medium'] leading-[22px] not-italic relative shrink-0 text-[15px] text-[color:var(--navy\/950,#011025)] whitespace-nowrap" data-node-id="12:49">
            {label}
          </p>
          <div className={`${String.raw`bg-[var(--gold\/500,#dfa82a)] h-[2px] relative rounded-[1px] shrink-0 `}${isLightAndHover ? "w-full" : "w-[0.01px]"}`} id={isLightAndHover ? "node-12_53" : "node-12_50"} data-name="Underline" />
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
      {isDarkAndHover && (
        <>
          <p className="[word-break:break-word] font-['Poppins:Medium'] leading-[22px] not-italic relative shrink-0 text-[15px] text-[color:var(--white,white)] whitespace-nowrap" data-node-id="12:61">
            {label}
          </p>
          <div className="bg-[var(--gold\/500,#dfa82a)] h-[2px] relative rounded-[1px] shrink-0 w-full" data-node-id="12:62" data-name="Underline" />
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
These styles are contained in the design: Label/Nav: Font(family: "Poppins", style: Medium, size: 15, weight: 500, lineHeight: 22, letterSpacing: 0), Label/Button: Font(family: "Poppins", style: SemiBold, size: 15, weight: 600, lineHeight: 22, letterSpacing: 0).
```

```text
The generated code contains image and SVG URL constants, e.g. const image = `${assetPathPrefix}/<asset file name>`, where assetPathPrefix is declared once at the top of the code and every asset URL interpolates it. These URLs are temporary download sources and expire after 7 days. Download each asset into the project with curl -L, then replace its URL in the generated code with a reference to the downloaded asset. Never use the temporary URLs as runtime image sources.
```
