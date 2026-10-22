# Project Card

- Figma node: `15:269` (file `tD3pU1vtvSr8akTMJPFLkA`)
- Page: Design System
- Source: Figma MCP `get_design_context` (React + Tailwind reference code, saved verbatim). Treat as a high-fidelity reference, not production code: convert absolute positioning into real layout.
- The temporary `assetPathPrefix` URLs below expire; use the local files in the asset table instead.

## Asset map (code constant -> local file)

| Constant | Figma asset file | Local file (relative to design/) |
|---|---|---|
| `imgImage` | `c663e.png` | `assets/images/proj-tower.png` (shared image) |
| `imgFrame` | `f349a.svg` | `assets/context/components/project-card/imgFrame.svg` |
| `imgFrame1` | `2c49f.svg` | `assets/context/components/project-card/imgFrame1.svg` |
| `imgEllipse` | `d67b3.svg` | `assets/context/components/project-card/imgEllipse.svg` |

## Reference code

```jsx
const assetPathPrefix = "https://www.figma.com/api/mcp/asset/184743f6-23e2-480e-a1bd-762b785a3c20";
const imgImage = `${assetPathPrefix}/c663e.png`;
const imgFrame = `${assetPathPrefix}/f349a.svg`;
const imgFrame1 = `${assetPathPrefix}/2c49f.svg`;
const imgEllipse = `${assetPathPrefix}/d67b3.svg`;

type ProjectCardProps = {
  className?: string;
  category?: string;
  location?: string;
  state?: "Default" | "Hover";
  status?: "Completed" | "In Progress";
  title?: string;
};

export default function ProjectCard({ className, category = "FULL MEP WORKS", location = "Makkah, KSA", state = "Default", status = "Completed", title = "Project title" }: ProjectCardProps) {
  const isCompletedAndHover = status === "Completed" && state === "Hover";
  const isHover = state === "Hover";
  const isInProgress = status === "In Progress";
  const isInProgressAndDefault = status === "In Progress" && state === "Default";
  const isInProgressAndHover = status === "In Progress" && state === "Hover";
  return (
    <div className={className || `${String.raw`bg-[var(--navy\/900,#0b1a33)] content-stretch flex flex-col h-[280px] items-start justify-end overflow-clip pb-[18px] pt-[16px] px-[22px] relative rounded-[18px] w-[370px] `}${isHover ? "shadow-[0px_24px_48px_0px_rgba(1,16,37,0.28)]" : "shadow-[0px_10px_28px_0px_rgba(1,16,37,0.12)]"}`} id={isInProgressAndHover ? "node-15_250" : isInProgressAndDefault ? "node-15_231" : isCompletedAndHover ? "node-15_213" : "node-15_195"}>
      <div className={`absolute ${isHover ? "h-[299.6px] left-[-12.95px] top-[-9.8px] w-[395.9px]" : "h-[280px] left-0 top-0 w-[370px]"}`} id={isInProgressAndHover ? "node-15_251" : isInProgressAndDefault ? "node-15_232" : isCompletedAndHover ? "node-15_214" : "node-15_196"} data-name="Image">
        <img alt="" className="absolute inset-0 max-w-none object-cover pointer-events-none size-full" src={imgImage} />
      </div>
      <div className={`absolute bg-gradient-to-b h-[280px] left-0 to-[rgba(1,16,37,0.92)] top-0 via-[45%] w-[370px] ${isHover ? "from-[rgba(1,16,37,0.35)] via-[rgba(1,16,37,0.45)]" : "from-[rgba(1,16,37,0.15)] via-[rgba(1,16,37,0.2)]"}`} id={isInProgressAndHover ? "node-15_252" : isInProgressAndDefault ? "node-15_233" : isCompletedAndHover ? "node-15_215" : "node-15_197"} data-name="Overlay" />
      <div className="absolute bg-[rgba(1,16,37,0.55)] border border-[rgba(255,255,255,0.15)] border-solid content-stretch flex items-start left-[16px] px-[10px] py-[5px] rounded-[100px] top-[16px]" id={isInProgressAndHover ? "node-15_253" : isInProgressAndDefault ? "node-15_234" : isCompletedAndHover ? "node-15_216" : "node-15_198"} data-name="Category">
        <p className="[word-break:break-word] font-['Poppins:SemiBold'] leading-[14px] not-italic relative shrink-0 text-[11px] text-[color:var(--white,white)] tracking-[0.66px] whitespace-nowrap" data-node-id="15:199">
          {category}
        </p>
      </div>
      <div className={`absolute border border-solid content-stretch flex items-center px-[10px] py-[5px] right-[16px] rounded-[100px] top-[16px] ${isInProgress ? "bg-[rgba(33,161,107,0.18)] border-[rgba(51,204,128,0.5)] gap-[6px]" : "bg-[rgba(1,16,37,0.55)] border-[rgba(255,255,255,0.15)]"}`} id={isInProgressAndHover ? "node-15_255" : isInProgressAndDefault ? "node-15_236" : isCompletedAndHover ? "node-15_218" : "node-15_200"} data-name="Status">
        {status === "Completed" && (
          <p className="[word-break:break-word] font-['Poppins:SemiBold'] leading-[14px] not-italic relative shrink-0 text-[11px] text-[color:var(--white,white)] tracking-[0.66px] whitespace-nowrap" id={isCompletedAndHover ? "node-15_219" : "node-15_201"}>
            Completed
          </p>
        )}
        {isInProgress && (
          <>
            <div className="relative shrink-0 size-[6px]" id={isInProgressAndHover ? "node-15_256" : "node-15_237"} data-name="Ellipse">
              <img alt="" className="absolute block inset-0 max-w-none size-full" src={imgEllipse} />
            </div>
            <p className="[word-break:break-word] font-['Poppins:SemiBold'] leading-[14px] not-italic relative shrink-0 text-[#73eba6] text-[11px] tracking-[0.66px] whitespace-nowrap" id={isInProgressAndHover ? "node-15_257" : "node-15_238"}>
              In Progress
            </p>
          </>
        )}
      </div>
      <div className="content-stretch flex flex-col gap-[8px] items-start relative shrink-0 w-full" id={isInProgressAndHover ? "node-15_258" : isInProgressAndDefault ? "node-15_239" : isCompletedAndHover ? "node-15_220" : "node-15_202"} data-name="Body">
        <p className="[word-break:break-word] font-['Poppins:SemiBold'] leading-[28px] min-w-full not-italic relative shrink-0 text-[20px] text-[color:var(--white,white)] w-[min-content]" data-node-id="15:203">
          {title}
        </p>
        <div className="content-stretch flex gap-[6px] items-center relative shrink-0" id={isInProgressAndHover ? "node-15_260" : isInProgressAndDefault ? "node-15_241" : isCompletedAndHover ? "node-15_222" : "node-15_204"} data-name="Location">
          <div className="relative shrink-0 size-[14px]" id={isInProgressAndHover ? "node-15_261" : isInProgressAndDefault ? "node-15_242" : isCompletedAndHover ? "node-15_223" : "node-15_205"} data-name="Frame">
            <img alt="" className="absolute block inset-0 max-w-none size-full" src={imgFrame} />
          </div>
          <p className="[word-break:break-word] font-['Poppins:Regular'] leading-[20px] not-italic opacity-80 relative shrink-0 text-[13px] text-white whitespace-nowrap" data-node-id="15:207">
            {location}
          </p>
        </div>
        {isHover && (
          <div className="content-stretch flex gap-[8px] items-center relative shrink-0" id={isInProgressAndHover ? "node-15_264" : "node-15_226"} data-name="View details">
            <p className="[word-break:break-word] font-['Poppins:SemiBold'] leading-[14px] not-italic relative shrink-0 text-[11px] text-[color:var(--gold\/500,#dfa82a)] tracking-[0.66px] whitespace-nowrap" id={isInProgressAndHover ? "node-15_265" : "node-15_227"}>
              VIEW PROJECT
            </p>
            <div className="relative shrink-0 size-[14px]" id={isInProgressAndHover ? "node-15_266" : "node-15_228"} data-name="Frame">
              <img alt="" className="absolute block inset-0 max-w-none size-full" src={imgFrame1} />
            </div>
          </div>
        )}
      </div>
      <div className={`${String.raw`absolute bg-[var(--gold\/500,#dfa82a)] h-[4px] left-0 top-[276px] `}${isHover ? "w-[370px]" : "w-[0.01px]"}`} id={isInProgressAndHover ? "node-15_268" : isInProgressAndDefault ? "node-15_249" : isCompletedAndHover ? "node-15_230" : "node-15_212"} data-name="Gold bar" />
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
These styles are contained in the design: Label/Tag: Font(family: "Poppins", style: SemiBold, size: 11, weight: 600, lineHeight: 14, letterSpacing: 6), Heading/H4: Font(family: "Poppins", style: SemiBold, size: 20, weight: 600, lineHeight: 28, letterSpacing: 0), Caption: Font(family: "Poppins", style: Regular, size: 13, weight: 400, lineHeight: 20, letterSpacing: 0).
```

```text
The generated code contains image and SVG URL constants, e.g. const image = `${assetPathPrefix}/<asset file name>`, where assetPathPrefix is declared once at the top of the code and every asset URL interpolates it. These URLs are temporary download sources and expire after 7 days. Download each asset into the project with curl -L, then replace its URL in the generated code with a reference to the downloaded asset. Never use the temporary URLs as runtime image sources.
```
