# Team Card

- Figma node: `150:596` (file `tD3pU1vtvSr8akTMJPFLkA`)
- Page: Design System
- Source: Figma MCP `get_design_context` (React + Tailwind reference code, saved verbatim). Treat as a high-fidelity reference, not production code: convert absolute positioning into real layout.
- The temporary `assetPathPrefix` URLs below expire; use the local files in the asset table instead.

## Asset map (code constant -> local file)

| Constant | Figma asset file | Local file (relative to design/) |
|---|---|---|
| `imgPortraitPlaceholder` | `c4e06.svg` | `assets/context/components/team-card/imgPortraitPlaceholder.svg` |
| `imgGoldCorner` | `64775.svg` | `assets/context/components/team-card/imgGoldCorner.svg` |
| `imgIconSocialLinkedin` | `5c272.svg` | `assets/context/components/team-card/imgIconSocialLinkedin.svg` |
| `imgGoldCorner1` | `28dfc.svg` | `assets/context/components/team-card/imgGoldCorner1.svg` |

## Reference code

```jsx
const assetPathPrefix = "https://www.figma.com/api/mcp/asset/0fea48f5-f036-4dff-9f07-2ee13329a276";
const imgPortraitPlaceholder = `${assetPathPrefix}/c4e06.svg`;
const imgGoldCorner = `${assetPathPrefix}/64775.svg`;
const imgIconSocialLinkedin = `${assetPathPrefix}/5c272.svg`;
const imgGoldCorner1 = `${assetPathPrefix}/28dfc.svg`;

function PortraitPlaceholder({ className }: { className?: string }) {
  return (
    <div className={className || "h-[340px] overflow-clip relative w-[264px]"} data-node-id="154:890" data-name="Portrait / Placeholder">
      <div className="absolute bg-gradient-to-b from-[#002854] inset-0 to-[#011025]" data-node-id="154:891" data-name="Photo (from dashboard)" />
      <img alt="" className="absolute block inset-0 max-w-none size-full" src={imgPortraitPlaceholder} />
    </div>
  );
}

type TeamCardProps = {
  className?: string;
  name?: string;
  role?: string;
  state?: "Default" | "Hover" | "Enter 1" | "Enter 2" | "Enter 3" | "Enter 4" | "Enter 5";
};

export default function TeamCard({ className, name = "Full Name", role = "ROLE / POSITION", state = "Default" }: TeamCardProps) {
  const isEnter1 = state === "Enter 1";
  const isEnter2 = state === "Enter 2";
  const isEnter3 = state === "Enter 3";
  const isEnter4 = state === "Enter 4";
  const isEnter5 = state === "Enter 5";
  const isHover = state === "Hover";
  return (
    <div className={className || `${String.raw`bg-[var(--navy\/950,#011025)] border border-solid h-[340px] overflow-clip relative rounded-[18px] w-[264px] `}${isHover ? String.raw`border-[var(--gold\/500,#dfa82a)] shadow-[0px_26px_48px_0px_rgba(1,16,37,0.28)]` : "border-[rgba(255,255,255,0.08)] shadow-[0px_14px_32px_0px_rgba(1,16,37,0.12)]"}`} id={isEnter5 ? "node-150_527" : isEnter4 ? "node-150_493" : isEnter3 ? "node-150_459" : isEnter2 ? "node-150_425" : isEnter1 ? "node-150_391" : isHover ? "node-150_357" : "node-150_323"}>
      <div className={`absolute h-[340px] left-[-1px] w-[264px] ${["Enter 1", "Enter 2", "Enter 3", "Enter 4", "Enter 5"].includes(state) ? "opacity-0 top-[27px]" : "top-[-1px]"}`} id={isEnter5 ? "node-154_1009" : isEnter4 ? "node-154_990" : isEnter3 ? "node-154_971" : isEnter2 ? "node-154_952" : isEnter1 ? "node-154_933" : isHover ? "node-154_914" : "node-154_895"} data-name="Content">
        <PortraitPlaceholder className={`absolute overflow-clip ${isHover ? "h-[360.4px] left-[-7.92px] top-[-10.2px] w-[279.84px]" : "h-[340px] left-0 top-0 w-[264px]"}`} />
        <div className={`absolute bg-gradient-to-b from-[rgba(1,16,37,0)] h-[200px] left-0 to-[rgba(1,16,37,0.98)] top-[140px] via-[55%] w-[264px] ${isHover ? "via-[rgba(1,16,37,0.9)]" : "via-[rgba(1,16,37,0.82)]"}`} id={isEnter5 ? "node-154_1015" : isEnter4 ? "node-154_996" : isEnter3 ? "node-154_977" : isEnter2 ? "node-154_958" : isEnter1 ? "node-154_939" : isHover ? "node-154_920" : "node-154_901"} data-name="Gradient" />
        <div className="absolute left-[16px] size-[34px] top-[16px]" id={isEnter5 ? "node-154_1016" : isEnter4 ? "node-154_997" : isEnter3 ? "node-154_978" : isEnter2 ? "node-154_959" : isEnter1 ? "node-154_940" : isHover ? "node-154_921" : "node-154_902"} data-name="Gold corner">
          <img alt="" className="absolute block inset-0 max-w-none size-full" src={isHover ? imgGoldCorner1 : imgGoldCorner} />
        </div>
        <p className="[word-break:break-word] absolute font-['Poppins:SemiBold'] leading-[28px] left-[24px] not-italic text-[20px] text-[color:var(--white,white)] top-[248px] w-[216px]" data-node-id="154:905">
          {name}
        </p>
        <p className="[word-break:break-word] absolute font-['Poppins:SemiBold'] leading-[16px] left-[24px] not-italic text-[12px] text-[color:var(--gold\/500,#dfa82a)] top-[280px] tracking-[1.2px] uppercase w-[216px]" data-node-id="154:906">
          {role}
        </p>
        <div className={`${String.raw`absolute bg-[var(--gold\/500,#dfa82a)] h-[2px] left-[24px] rounded-[1px] top-[310px] `}${isHover ? "w-[216px]" : "w-[32px]"}`} id={isEnter5 ? "node-154_1021" : isEnter4 ? "node-154_1002" : isEnter3 ? "node-154_983" : isEnter2 ? "node-154_964" : isEnter1 ? "node-154_945" : isHover ? "node-154_926" : "node-154_907"} data-name="Gold line" />
        <div className={`absolute bg-[rgba(255,255,255,0.14)] border border-[rgba(255,255,255,0.3)] border-solid content-stretch flex items-start left-[214px] overflow-clip p-[9px] rounded-[100px] ${isHover ? "top-[16px]" : "opacity-0 top-[4px]"}`} id={isEnter5 ? "node-154_1022" : isEnter4 ? "node-154_1003" : isEnter3 ? "node-154_984" : isEnter2 ? "node-154_965" : isEnter1 ? "node-154_946" : isHover ? "node-154_927" : "node-154_908"} data-name="LinkedIn">
          <div className="relative shrink-0 size-[16px]" id={isEnter5 ? "node-154_1023" : isEnter4 ? "node-154_1004" : isEnter3 ? "node-154_985" : isEnter2 ? "node-154_966" : isEnter1 ? "node-154_947" : isHover ? "node-154_928" : "node-154_909"} data-name="Icon/social/linkedin">
            <img alt="" className="absolute block inset-0 max-w-none size-full" src={imgIconSocialLinkedin} />
          </div>
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
These styles are contained in the design: Heading/H4: Font(family: "Poppins", style: SemiBold, size: 20, weight: 600, lineHeight: 28, letterSpacing: 0), Label/Caps: Font(family: "Poppins", style: SemiBold, size: 12, weight: 600, lineHeight: 16, letterSpacing: 10).
```

```text
Component descriptions: The following components have usage descriptions or documentation links defined in Figma. These descriptions provide important context about the intended usage, best practices, and any constraints for each component. Follow these guidelines when implementing or using these components.

## Team Card
**Node ID:** 150:596

Leadership card (portrait). Name, role and portrait come from the dashboard (Team → Leadership). Build: cards fade up 28px with a 120ms stagger as the section enters the viewport; on hover the portrait zooms 6%, the gold line extends and the LinkedIn button slides in. Prototype: hover is live; Enter 1–5 hold the reveal timing.

## Portrait / Placeholder
**Node ID:** 154:890

Replace the image fill of “Photo (from dashboard)” with the portrait (4:5, min 800×1000).
```

```text
The generated code contains image and SVG URL constants, e.g. const image = `${assetPathPrefix}/<asset file name>`, where assetPathPrefix is declared once at the top of the code and every asset URL interpolates it. These URLs are temporary download sources and expire after 7 days. Download each asset into the project with curl -L, then replace its URL in the generated code with a reference to the downloaded asset. Never use the temporary URLs as runtime image sources.
```
