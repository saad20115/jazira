# Team Member

- Figma node: `150:603` (file `tD3pU1vtvSr8akTMJPFLkA`)
- Page: Design System
- Source: Figma MCP `get_design_context` (React + Tailwind reference code, saved verbatim). Treat as a high-fidelity reference, not production code: convert absolute positioning into real layout.
- The temporary `assetPathPrefix` URLs below expire; use the local files in the asset table instead.

## Asset map (code constant -> local file)

| Constant | Figma asset file | Local file (relative to design/) |
|---|---|---|
| `imgAvatarPlaceholder` | `7a171.svg` | `assets/context/components/team-member/imgAvatarPlaceholder.svg` |

## Reference code

```jsx
const assetPathPrefix = "https://www.figma.com/api/mcp/asset/0f7249b4-7b1f-47f5-a683-2794d4bfa7d1";
const imgAvatarPlaceholder = `${assetPathPrefix}/7a171.svg`;

function AvatarPlaceholder({ className }: { className?: string }) {
  return (
    <div className={className || "relative size-[120px]"} data-node-id="150:318" data-name="Avatar / Placeholder">
      <img alt="" className="absolute block inset-0 max-w-none size-full" src={imgAvatarPlaceholder} />
    </div>
  );
}

type TeamMemberProps = {
  className?: string;
  name?: string;
  role?: string;
};

export default function TeamMember({ className, name = "Full Name", role = "Role" }: TeamMemberProps) {
  return (
    <div className={className || "bg-[var(--white,white)] border border-[var(--border,#e3e7ee)] border-solid content-stretch drop-shadow-[0px_6px_8px_rgba(1,16,37,0.04)] flex gap-[14px] items-center pl-[14px] pr-[18px] py-[14px] relative rounded-[16px] w-[270px]"} data-node-id="150:603" data-name="Team Member">
      <AvatarPlaceholder className="relative shrink-0 size-[52px]" />
      <div className="[word-break:break-word] content-stretch flex flex-[1_0_0] flex-col gap-[2px] items-start min-w-px not-italic overflow-clip relative" data-node-id="150:609" data-name="Text">
        <p className="font-['Poppins:SemiBold'] leading-[26px] relative shrink-0 text-[16px] text-[color:var(--navy\/950,#011025)] w-full" data-node-id="150:610">
          {name}
        </p>
        <p className="font-['Poppins:Regular'] leading-[20px] relative shrink-0 text-[13px] text-[color:var(--text\/body,#5b6475)] w-full" data-node-id="150:611">
          {role}
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
These styles are contained in the design: Body/M Strong: Font(family: "Poppins", style: SemiBold, size: 16, weight: 600, lineHeight: 26, letterSpacing: 0), Caption: Font(family: "Poppins", style: Regular, size: 13, weight: 400, lineHeight: 20, letterSpacing: 0).
```

```text
Component descriptions: The following components have usage descriptions or documentation links defined in Figma. These descriptions provide important context about the intended usage, best practices, and any constraints for each component. Follow these guidelines when implementing or using these components.

## Team Member
**Node ID:** 150:603

Wider-team member shown in the moving strip. All entries come from the dashboard (Team → Staff); the strip repeats the list to loop seamlessly.

## Avatar / Placeholder
**Node ID:** 150:318

Replace “Photo (from dashboard)” image fill with the team member photo. Square crop, at least 400×400.
```

```text
The generated code contains image and SVG URL constants, e.g. const image = `${assetPathPrefix}/<asset file name>`, where assetPathPrefix is declared once at the top of the code and every asset URL interpolates it. These URLs are temporary download sources and expire after 7 days. Download each asset into the project with curl -L, then replace its URL in the generated code with a reference to the downloaded asset. Never use the temporary URLs as runtime image sources.
```
