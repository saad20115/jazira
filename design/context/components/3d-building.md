# 3D Building

- Figma node: `116:1199` (file `tD3pU1vtvSr8akTMJPFLkA`)
- Page: Design System
- Source: Figma MCP `get_design_context` (React + Tailwind reference code, saved verbatim). Treat as a high-fidelity reference, not production code: convert absolute positioning into real layout.
- The temporary `assetPathPrefix` URLs below expire; use the local files in the asset table instead.

## Asset map (code constant -> local file)

| Constant | Figma asset file | Local file (relative to design/) |
|---|---|---|
| `imgAngle0` | `ab33b.png` | `assets/images/tower-render.png` (shared image) |

## Reference code

```jsx
const assetPathPrefix = "https://www.figma.com/api/mcp/asset/4b39e46e-6b22-4ce8-8b15-f3bf4d178304";
const imgAngle0 = `${assetPathPrefix}/ab33b.png`;

type Component3DBuildingProps = {
  className?: string;
  angle?: "0" | "30" | "60" | "90" | "120" | "150" | "180" | "210" | "240" | "270" | "300" | "330";
};

export default function Component3DBuilding({ className, angle = "0" }: Component3DBuildingProps) {
  return (
    <div className={className || "bg-[#030a1a] h-[580px] overflow-clip relative w-[600px]"} id={angle === "330" ? "node-116_1124" : angle === "300" ? "node-116_1049" : angle === "270" ? "node-116_974" : angle === "240" ? "node-116_899" : angle === "210" ? "node-116_824" : angle === "180" ? "node-116_749" : angle === "150" ? "node-116_674" : angle === "120" ? "node-116_599" : angle === "90" ? "node-116_524" : angle === "60" ? "node-116_449" : angle === "30" ? "node-116_374" : "node-116_299"}>
      <img alt="" className="absolute inset-0 max-w-none object-cover pointer-events-none size-full" src={imgAngle0} />
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

## 3D Building
**Node ID:** 116:1199

Turntable of the Al Jazira MEP tower (12 real-time renders, 30° apart). Prototype: auto-rotates, drag to rotate, or use the rotate buttons. Build: use the live Three.js model (scene.js) with orbit controls.
```

```text
The generated code contains image and SVG URL constants, e.g. const image = `${assetPathPrefix}/<asset file name>`, where assetPathPrefix is declared once at the top of the code and every asset URL interpolates it. These URLs are temporary download sources and expire after 7 days. Download each asset into the project with curl -L, then replace its URL in the generated code with a reference to the downloaded asset. Never use the temporary URLs as runtime image sources.
```
