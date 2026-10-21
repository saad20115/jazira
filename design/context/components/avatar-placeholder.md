# Avatar/Placeholder

- Figma node: `150:318` (file `tD3pU1vtvSr8akTMJPFLkA`)
- Page: Design System
- Source: Figma MCP `get_design_context` (React + Tailwind reference code, saved verbatim). Treat as a high-fidelity reference, not production code: convert absolute positioning into real layout.
- The temporary `assetPathPrefix` URLs below expire; use the local files in the asset table instead.

## Asset map (code constant -> local file)

| Constant | Figma asset file | Local file (relative to design/) |
|---|---|---|
| `imgAvatarPlaceholder` | `7a171.svg` | `assets/context/components/avatar-placeholder/imgAvatarPlaceholder.svg` |

## Reference code

```jsx
const assetPathPrefix = "https://www.figma.com/api/mcp/asset/15eb3e2c-39aa-40aa-9c0e-bbb2c7a6112c";
const imgAvatarPlaceholder = `${assetPathPrefix}/7a171.svg`;

export default function AvatarPlaceholder({ className }: { className?: string }) {
  return (
    <div className={className || "relative size-[120px]"} data-node-id="150:318" data-name="Avatar / Placeholder">
      <img alt="" className="absolute block inset-0 max-w-none size-full" src={imgAvatarPlaceholder} />
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
Component descriptions: The following components have usage descriptions or documentation links defined in Figma. These descriptions provide important context about the intended usage, best practices, and any constraints for each component. Follow these guidelines when implementing or using these components.

## Avatar / Placeholder
**Node ID:** 150:318

Replace “Photo (from dashboard)” image fill with the team member photo. Square crop, at least 400×400.
```

```text
The generated code contains image and SVG URL constants, e.g. const image = `${assetPathPrefix}/<asset file name>`, where assetPathPrefix is declared once at the top of the code and every asset URL interpolates it. These URLs are temporary download sources and expire after 7 days. Download each asset into the project with curl -L, then replace its URL in the generated code with a reference to the downloaded asset. Never use the temporary URLs as runtime image sources.
```
