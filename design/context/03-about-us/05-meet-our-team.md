# Meet our team

- Figma node: `21:1162` (file `tD3pU1vtvSr8akTMJPFLkA`)
- Page: 03 About Us
- Source: Figma MCP `get_design_context` (React + Tailwind reference code, saved verbatim). Treat as a high-fidelity reference, not production code: convert absolute positioning into real layout.
- The temporary `assetPathPrefix` URLs below expire; use the local files in the asset table instead.

## Asset map (code constant -> local file)

| Constant | Figma asset file | Local file (relative to design/) |
|---|---|---|
| `imgAvatarPlaceholder` | `7a171.svg` | `assets/context/03-about-us/05-meet-our-team/imgAvatarPlaceholder.svg` |
| `imgPortraitPlaceholder` | `c4e06.svg` | `assets/context/03-about-us/05-meet-our-team/imgPortraitPlaceholder.svg` |
| `imgGoldCorner` | `64775.svg` | `assets/context/03-about-us/05-meet-our-team/imgGoldCorner.svg` |
| `imgIconSocialLinkedin` | `5c272.svg` | `assets/context/03-about-us/05-meet-our-team/imgIconSocialLinkedin.svg` |
| `imgEllipse` | `f1f80.svg` | `assets/context/03-about-us/05-meet-our-team/imgEllipse.svg` |

## Reference code

```jsx
const assetPathPrefix = "https://www.figma.com/api/mcp/asset/af1a550f-9857-4c34-a76d-f5ebd1ff2fcc";
const imgAvatarPlaceholder = `${assetPathPrefix}/7a171.svg`;
const imgPortraitPlaceholder = `${assetPathPrefix}/c4e06.svg`;
const imgGoldCorner = `${assetPathPrefix}/64775.svg`;
const imgIconSocialLinkedin = `${assetPathPrefix}/5c272.svg`;
const imgEllipse = `${assetPathPrefix}/f1f80.svg`;

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

function TeamMember({ className, name = "Full Name", role = "Role" }: TeamMemberProps) {
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

type TeamMarqueeProps = {
  className?: string;
  position?: "A";
};

function TeamMarquee({ className, position = "A" }: TeamMarqueeProps) {
  return (
    <div className={className || "h-[198px] overflow-clip relative w-[1160px]"} data-node-id="151:378">
      <div className="absolute content-stretch flex gap-[16px] items-start left-0 overflow-clip top-[6px]" data-node-id="151:379" data-name="Row 1">
        <TeamMember className="bg-[var(--white,white)] border border-[var(--border,#e3e7ee)] border-solid content-stretch drop-shadow-[0px_6px_8px_rgba(1,16,37,0.04)] flex gap-[14px] items-center pl-[14px] pr-[18px] py-[14px] relative rounded-[16px] shrink-0 w-[270px]" role="Project Manager" />
        <TeamMember className="bg-[var(--white,white)] border border-[var(--border,#e3e7ee)] border-solid content-stretch drop-shadow-[0px_6px_8px_rgba(1,16,37,0.04)] flex gap-[14px] items-center pl-[14px] pr-[18px] py-[14px] relative rounded-[16px] shrink-0 w-[270px]" role="Engineering Manager" />
        <TeamMember className="bg-[var(--white,white)] border border-[var(--border,#e3e7ee)] border-solid content-stretch drop-shadow-[0px_6px_8px_rgba(1,16,37,0.04)] flex gap-[14px] items-center pl-[14px] pr-[18px] py-[14px] relative rounded-[16px] shrink-0 w-[270px]" role="Design Manager" />
        <TeamMember className="bg-[var(--white,white)] border border-[var(--border,#e3e7ee)] border-solid content-stretch drop-shadow-[0px_6px_8px_rgba(1,16,37,0.04)] flex gap-[14px] items-center pl-[14px] pr-[18px] py-[14px] relative rounded-[16px] shrink-0 w-[270px]" role="QA/QC Manager" />
        <TeamMember className="bg-[var(--white,white)] border border-[var(--border,#e3e7ee)] border-solid content-stretch drop-shadow-[0px_6px_8px_rgba(1,16,37,0.04)] flex gap-[14px] items-center pl-[14px] pr-[18px] py-[14px] relative rounded-[16px] shrink-0 w-[270px]" role="HSE Manager" />
        <TeamMember className="bg-[var(--white,white)] border border-[var(--border,#e3e7ee)] border-solid content-stretch drop-shadow-[0px_6px_8px_rgba(1,16,37,0.04)] flex gap-[14px] items-center pl-[14px] pr-[18px] py-[14px] relative rounded-[16px] shrink-0 w-[270px]" role="Procurement Manager" />
        <TeamMember className="bg-[var(--white,white)] border border-[var(--border,#e3e7ee)] border-solid content-stretch drop-shadow-[0px_6px_8px_rgba(1,16,37,0.04)] flex gap-[14px] items-center pl-[14px] pr-[18px] py-[14px] relative rounded-[16px] shrink-0 w-[270px]" role="Construction Manager" />
        <TeamMember className="bg-[var(--white,white)] border border-[var(--border,#e3e7ee)] border-solid content-stretch drop-shadow-[0px_6px_8px_rgba(1,16,37,0.04)] flex gap-[14px] items-center pl-[14px] pr-[18px] py-[14px] relative rounded-[16px] shrink-0 w-[270px]" role="Site Manager" />
        <TeamMember className="bg-[var(--white,white)] border border-[var(--border,#e3e7ee)] border-solid content-stretch drop-shadow-[0px_6px_8px_rgba(1,16,37,0.04)] flex gap-[14px] items-center pl-[14px] pr-[18px] py-[14px] relative rounded-[16px] shrink-0 w-[270px]" role="Project Manager" />
        <TeamMember className="bg-[var(--white,white)] border border-[var(--border,#e3e7ee)] border-solid content-stretch drop-shadow-[0px_6px_8px_rgba(1,16,37,0.04)] flex gap-[14px] items-center pl-[14px] pr-[18px] py-[14px] relative rounded-[16px] shrink-0 w-[270px]" role="Engineering Manager" />
        <TeamMember className="bg-[var(--white,white)] border border-[var(--border,#e3e7ee)] border-solid content-stretch drop-shadow-[0px_6px_8px_rgba(1,16,37,0.04)] flex gap-[14px] items-center pl-[14px] pr-[18px] py-[14px] relative rounded-[16px] shrink-0 w-[270px]" role="Design Manager" />
        <TeamMember className="bg-[var(--white,white)] border border-[var(--border,#e3e7ee)] border-solid content-stretch drop-shadow-[0px_6px_8px_rgba(1,16,37,0.04)] flex gap-[14px] items-center pl-[14px] pr-[18px] py-[14px] relative rounded-[16px] shrink-0 w-[270px]" role="QA/QC Manager" />
        <TeamMember className="bg-[var(--white,white)] border border-[var(--border,#e3e7ee)] border-solid content-stretch drop-shadow-[0px_6px_8px_rgba(1,16,37,0.04)] flex gap-[14px] items-center pl-[14px] pr-[18px] py-[14px] relative rounded-[16px] shrink-0 w-[270px]" role="HSE Manager" />
        <TeamMember className="bg-[var(--white,white)] border border-[var(--border,#e3e7ee)] border-solid content-stretch drop-shadow-[0px_6px_8px_rgba(1,16,37,0.04)] flex gap-[14px] items-center pl-[14px] pr-[18px] py-[14px] relative rounded-[16px] shrink-0 w-[270px]" role="Procurement Manager" />
        <TeamMember className="bg-[var(--white,white)] border border-[var(--border,#e3e7ee)] border-solid content-stretch drop-shadow-[0px_6px_8px_rgba(1,16,37,0.04)] flex gap-[14px] items-center pl-[14px] pr-[18px] py-[14px] relative rounded-[16px] shrink-0 w-[270px]" role="Construction Manager" />
        <TeamMember className="bg-[var(--white,white)] border border-[var(--border,#e3e7ee)] border-solid content-stretch drop-shadow-[0px_6px_8px_rgba(1,16,37,0.04)] flex gap-[14px] items-center pl-[14px] pr-[18px] py-[14px] relative rounded-[16px] shrink-0 w-[270px]" role="Site Manager" />
      </div>
      <div className="absolute content-stretch flex gap-[16px] items-start left-[-2288px] overflow-clip top-[104px]" data-node-id="151:524" data-name="Row 2">
        <TeamMember className="bg-[var(--white,white)] border border-[var(--border,#e3e7ee)] border-solid content-stretch drop-shadow-[0px_6px_8px_rgba(1,16,37,0.04)] flex gap-[14px] items-center pl-[14px] pr-[18px] py-[14px] relative rounded-[16px] shrink-0 w-[270px]" role="Project Engineer" />
        <TeamMember className="bg-[var(--white,white)] border border-[var(--border,#e3e7ee)] border-solid content-stretch drop-shadow-[0px_6px_8px_rgba(1,16,37,0.04)] flex gap-[14px] items-center pl-[14px] pr-[18px] py-[14px] relative rounded-[16px] shrink-0 w-[270px]" role="Site Engineer" />
        <TeamMember className="bg-[var(--white,white)] border border-[var(--border,#e3e7ee)] border-solid content-stretch drop-shadow-[0px_6px_8px_rgba(1,16,37,0.04)] flex gap-[14px] items-center pl-[14px] pr-[18px] py-[14px] relative rounded-[16px] shrink-0 w-[270px]" role="Mechanical Engineer" />
        <TeamMember className="bg-[var(--white,white)] border border-[var(--border,#e3e7ee)] border-solid content-stretch drop-shadow-[0px_6px_8px_rgba(1,16,37,0.04)] flex gap-[14px] items-center pl-[14px] pr-[18px] py-[14px] relative rounded-[16px] shrink-0 w-[270px]" role="Electrical Engineer" />
        <TeamMember className="bg-[var(--white,white)] border border-[var(--border,#e3e7ee)] border-solid content-stretch drop-shadow-[0px_6px_8px_rgba(1,16,37,0.04)] flex gap-[14px] items-center pl-[14px] pr-[18px] py-[14px] relative rounded-[16px] shrink-0 w-[270px]" role="Planning Engineer" />
        <TeamMember className="bg-[var(--white,white)] border border-[var(--border,#e3e7ee)] border-solid content-stretch drop-shadow-[0px_6px_8px_rgba(1,16,37,0.04)] flex gap-[14px] items-center pl-[14px] pr-[18px] py-[14px] relative rounded-[16px] shrink-0 w-[270px]" role="Quantity Surveyor" />
        <TeamMember className="bg-[var(--white,white)] border border-[var(--border,#e3e7ee)] border-solid content-stretch drop-shadow-[0px_6px_8px_rgba(1,16,37,0.04)] flex gap-[14px] items-center pl-[14px] pr-[18px] py-[14px] relative rounded-[16px] shrink-0 w-[270px]" role="Safety Officer" />
        <TeamMember className="bg-[var(--white,white)] border border-[var(--border,#e3e7ee)] border-solid content-stretch drop-shadow-[0px_6px_8px_rgba(1,16,37,0.04)] flex gap-[14px] items-center pl-[14px] pr-[18px] py-[14px] relative rounded-[16px] shrink-0 w-[270px]" role="MEP Supervisor" />
        <TeamMember className="bg-[var(--white,white)] border border-[var(--border,#e3e7ee)] border-solid content-stretch drop-shadow-[0px_6px_8px_rgba(1,16,37,0.04)] flex gap-[14px] items-center pl-[14px] pr-[18px] py-[14px] relative rounded-[16px] shrink-0 w-[270px]" role="Project Engineer" />
        <TeamMember className="bg-[var(--white,white)] border border-[var(--border,#e3e7ee)] border-solid content-stretch drop-shadow-[0px_6px_8px_rgba(1,16,37,0.04)] flex gap-[14px] items-center pl-[14px] pr-[18px] py-[14px] relative rounded-[16px] shrink-0 w-[270px]" role="Site Engineer" />
        <TeamMember className="bg-[var(--white,white)] border border-[var(--border,#e3e7ee)] border-solid content-stretch drop-shadow-[0px_6px_8px_rgba(1,16,37,0.04)] flex gap-[14px] items-center pl-[14px] pr-[18px] py-[14px] relative rounded-[16px] shrink-0 w-[270px]" role="Mechanical Engineer" />
        <TeamMember className="bg-[var(--white,white)] border border-[var(--border,#e3e7ee)] border-solid content-stretch drop-shadow-[0px_6px_8px_rgba(1,16,37,0.04)] flex gap-[14px] items-center pl-[14px] pr-[18px] py-[14px] relative rounded-[16px] shrink-0 w-[270px]" role="Electrical Engineer" />
        <TeamMember className="bg-[var(--white,white)] border border-[var(--border,#e3e7ee)] border-solid content-stretch drop-shadow-[0px_6px_8px_rgba(1,16,37,0.04)] flex gap-[14px] items-center pl-[14px] pr-[18px] py-[14px] relative rounded-[16px] shrink-0 w-[270px]" role="Planning Engineer" />
        <TeamMember className="bg-[var(--white,white)] border border-[var(--border,#e3e7ee)] border-solid content-stretch drop-shadow-[0px_6px_8px_rgba(1,16,37,0.04)] flex gap-[14px] items-center pl-[14px] pr-[18px] py-[14px] relative rounded-[16px] shrink-0 w-[270px]" role="Quantity Surveyor" />
        <TeamMember className="bg-[var(--white,white)] border border-[var(--border,#e3e7ee)] border-solid content-stretch drop-shadow-[0px_6px_8px_rgba(1,16,37,0.04)] flex gap-[14px] items-center pl-[14px] pr-[18px] py-[14px] relative rounded-[16px] shrink-0 w-[270px]" role="Safety Officer" />
        <TeamMember className="bg-[var(--white,white)] border border-[var(--border,#e3e7ee)] border-solid content-stretch drop-shadow-[0px_6px_8px_rgba(1,16,37,0.04)] flex gap-[14px] items-center pl-[14px] pr-[18px] py-[14px] relative rounded-[16px] shrink-0 w-[270px]" role="MEP Supervisor" />
      </div>
      <div className="absolute bg-gradient-to-r bottom-0 from-[#f6f8fb] left-0 to-[rgba(246,248,251,0)] top-0 w-[120px]" data-node-id="151:669" data-name="Fade left" />
      <div className="absolute bg-gradient-to-l bottom-0 from-[#f6f8fb] right-0 to-[rgba(246,248,251,0)] top-0 w-[120px]" data-node-id="151:670" data-name="Fade right" />
    </div>
  );
}

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
  state?: "Default";
};

function TeamCard({ className, name = "Full Name", role = "ROLE / POSITION", state = "Default" }: TeamCardProps) {
  return (
    <div className={className || "bg-[var(--navy\\/950,#011025)] border border-[rgba(255,255,255,0.08)] border-solid h-[340px] overflow-clip relative rounded-[18px] shadow-[0px_14px_32px_0px_rgba(1,16,37,0.12)] w-[264px]"} data-node-id="150:323">
      <div className="absolute h-[340px] left-[-1px] top-[-1px] w-[264px]" data-node-id="154:895" data-name="Content">
        <PortraitPlaceholder className="absolute h-[340px] left-0 overflow-clip top-0 w-[264px]" />
        <div className="absolute bg-gradient-to-b from-[rgba(1,16,37,0)] h-[200px] left-0 to-[rgba(1,16,37,0.98)] top-[140px] via-[55%] via-[rgba(1,16,37,0.82)] w-[264px]" data-node-id="154:901" data-name="Gradient" />
        <div className="absolute left-[16px] size-[34px] top-[16px]" data-node-id="154:902" data-name="Gold corner">
          <img alt="" className="absolute block inset-0 max-w-none size-full" src={imgGoldCorner} />
        </div>
        <p className="[word-break:break-word] absolute font-['Poppins:SemiBold'] leading-[28px] left-[24px] not-italic text-[20px] text-[color:var(--white,white)] top-[248px] w-[216px]" data-node-id="154:905">
          {name}
        </p>
        <p className="[word-break:break-word] absolute font-['Poppins:SemiBold'] leading-[16px] left-[24px] not-italic text-[12px] text-[color:var(--gold\/500,#dfa82a)] top-[280px] tracking-[1.2px] uppercase w-[216px]" data-node-id="154:906">
          {role}
        </p>
        <div className="absolute bg-[var(--gold\/500,#dfa82a)] h-[2px] left-[24px] rounded-[1px] top-[310px] w-[32px]" data-node-id="154:907" data-name="Gold line" />
        <div className="absolute bg-[rgba(255,255,255,0.14)] border border-[rgba(255,255,255,0.3)] border-solid content-stretch flex items-start left-[214px] opacity-0 overflow-clip p-[9px] rounded-[100px] top-[4px]" data-node-id="154:908" data-name="LinkedIn">
          <div className="relative shrink-0 size-[16px]" data-node-id="154:909" data-name="Icon/social/linkedin">
            <img alt="" className="absolute block inset-0 max-w-none size-full" src={imgIconSocialLinkedin} />
          </div>
        </div>
      </div>
    </div>
  );
}

type EyebrowProps = {
  className?: string;
  label?: string;
  tone?: "Light";
};

function Eyebrow({ className, label = "What we do", tone = "Light" }: EyebrowProps) {
  return (
    <div className={className || "bg-[var(--gold\\/50,#fbf4e3)] border border-[rgba(239,203,118,0.6)] border-solid content-stretch flex gap-[8px] items-center px-[14px] py-[6px] relative rounded-[100px]"} data-node-id="12:41">
      <div className="relative shrink-0 size-[6px]" data-node-id="12:42" data-name="Ellipse">
        <img alt="" className="absolute block inset-0 max-w-none size-full" src={imgEllipse} />
      </div>
      <p className="[word-break:break-word] font-['Poppins:SemiBold'] leading-[16px] not-italic relative shrink-0 text-[12px] text-[color:var(--gold\/600,#c38f1c)] tracking-[0.96px] uppercase whitespace-nowrap" data-node-id="12:43">
        {label}
      </p>
    </div>
  );
}

export default function MeetOurTeam() {
  return (
    <div className="bg-[var(--surface,#f6f8fb)] content-stretch flex flex-col items-start pb-[78px] pt-[72px] px-[140px] relative size-full" data-node-id="21:1162" data-name="Meet our team">
      <div className="content-stretch flex gap-[80px] items-end overflow-clip pb-[56px] relative shrink-0 w-full" data-node-id="145:2156" data-name="Section head">
        <div className="content-stretch flex flex-[1_0_0] flex-col gap-[16px] items-start min-w-px overflow-clip relative" data-node-id="145:2157" data-name="Title">
          <Eyebrow className="bg-[var(--gold\/50,#fbf4e3)] border border-[rgba(239,203,118,0.6)] border-solid content-stretch flex gap-[8px] items-center px-[14px] py-[6px] relative rounded-[100px] shrink-0" label="Our team" />
          <p className="[word-break:break-word] font-['Poppins:Bold'] leading-[0] not-italic relative shrink-0 text-[44px] text-[color:var(--navy\/950,#011025)] tracking-[-0.44px] whitespace-nowrap" data-node-id="145:2161">
            <span className="leading-[52px]">{`Meet Our `}</span>
            <span className="leading-[52px] text-[#dfa82a]">Team</span>
          </p>
          <p className="[word-break:break-word] font-['Poppins:Regular'] leading-[30px] min-w-full not-italic relative shrink-0 text-[18px] text-[color:var(--navy\/950,#011025)] w-[min-content]" data-node-id="145:2162">
            A solid base of skilled engineers, an effective management team, and a dedicated labor force support our growth.
          </p>
        </div>
        <p className="[word-break:break-word] font-['Poppins:Regular'] leading-[26px] not-italic relative shrink-0 text-[16px] text-[color:var(--text\/body,#5b6475)] w-[470px]" data-node-id="145:2163">{`In today's dynamic marketplace, Al Jazira needs people who are innovative, passionate about the business, and who make a difference every day. Our team structure ensures clear accountability and efficient project delivery across all levels.`}</p>
      </div>
      <div className="content-stretch flex flex-col gap-[24px] items-center overflow-clip relative shrink-0 w-full" data-node-id="151:2797" data-name="Leadership">
        <div className="content-stretch flex gap-[24px] items-start overflow-clip relative shrink-0" data-node-id="151:2798" data-name="Row 1">
          <TeamCard className="bg-[var(--navy\/950,#011025)] border border-[rgba(255,255,255,0.08)] border-solid h-[340px] overflow-clip relative rounded-[18px] shadow-[0px_14px_32px_0px_rgba(1,16,37,0.12)] shrink-0 w-[264px]" role="Chairman" />
          <TeamCard className="bg-[var(--navy\/950,#011025)] border border-[rgba(255,255,255,0.08)] border-solid h-[340px] overflow-clip relative rounded-[18px] shadow-[0px_14px_32px_0px_rgba(1,16,37,0.12)] shrink-0 w-[264px]" role="Chief Executive Officer" />
        </div>
        <div className="content-stretch flex gap-[24px] items-start overflow-clip relative shrink-0" data-node-id="151:2877" data-name="Row 2">
          <div className="content-stretch flex flex-col items-start overflow-clip pt-[64px] relative shrink-0" data-node-id="151:2917" data-name="Offset">
            <TeamCard className="bg-[var(--navy\/950,#011025)] border border-[rgba(255,255,255,0.08)] border-solid h-[340px] overflow-clip relative rounded-[18px] shadow-[0px_14px_32px_0px_rgba(1,16,37,0.12)] shrink-0 w-[264px]" role="Commercial Director" />
          </div>
          <div className="content-stretch flex flex-col items-start overflow-clip relative shrink-0" data-node-id="151:2957" data-name="Offset">
            <TeamCard className="bg-[var(--navy\/950,#011025)] border border-[rgba(255,255,255,0.08)] border-solid h-[340px] overflow-clip relative rounded-[18px] shadow-[0px_14px_32px_0px_rgba(1,16,37,0.12)] shrink-0 w-[264px]" role="Engineering Manager" />
          </div>
          <div className="content-stretch flex flex-col items-start overflow-clip pt-[64px] relative shrink-0" data-node-id="151:2997" data-name="Offset">
            <TeamCard className="bg-[var(--navy\/950,#011025)] border border-[rgba(255,255,255,0.08)] border-solid h-[340px] overflow-clip relative rounded-[18px] shadow-[0px_14px_32px_0px_rgba(1,16,37,0.12)] shrink-0 w-[264px]" role="Project Manager" />
          </div>
        </div>
      </div>
      <div className="content-stretch flex flex-col gap-[28px] items-start overflow-clip pt-[72px] relative shrink-0 w-full" data-node-id="151:2998" data-name="Wider team">
        <div className="content-stretch flex items-end overflow-clip relative shrink-0 w-full" data-node-id="151:2999" data-name="Header">
          <div className="[word-break:break-word] content-stretch flex flex-[1_0_0] flex-col gap-[8px] items-start min-w-px not-italic overflow-clip relative whitespace-nowrap" data-node-id="151:3000" data-name="Text">
            <p className="font-['Poppins:Bold'] leading-[36px] relative shrink-0 text-[28px] text-[color:var(--navy\/950,#011025)] tracking-[-0.112px]" data-node-id="151:3001">
              The people behind every project
            </p>
            <p className="font-['Poppins:Regular'] leading-[26px] relative shrink-0 text-[16px] text-[color:var(--text\/body,#5b6475)]" data-node-id="151:3002">
              Engineers, supervisors and specialists from our in-house team.
            </p>
          </div>
        </div>
        <TeamMarquee className="h-[198px] overflow-clip relative shrink-0 w-full" />
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
These styles are contained in the design: Label/Eyebrow: Font(family: "Poppins", style: SemiBold, size: 12, weight: 600, lineHeight: 16, letterSpacing: 8), Heading/H2: Font(family: "Poppins", style: Bold, size: 44, weight: 700, lineHeight: 52, letterSpacing: -1), Body/L: Font(family: "Poppins", style: Regular, size: 18, weight: 400, lineHeight: 30, letterSpacing: 0), Body/M: Font(family: "Poppins", style: Regular, size: 16, weight: 400, lineHeight: 26, letterSpacing: 0), Heading/H4: Font(family: "Poppins", style: SemiBold, size: 20, weight: 600, lineHeight: 28, letterSpacing: 0), Label/Caps: Font(family: "Poppins", style: SemiBold, size: 12, weight: 600, lineHeight: 16, letterSpacing: 10), Heading/H3: Font(family: "Poppins", style: Bold, size: 28, weight: 700, lineHeight: 36, letterSpacing: -0.4000000059604645), Body/M Strong: Font(family: "Poppins", style: SemiBold, size: 16, weight: 600, lineHeight: 26, letterSpacing: 0), Caption: Font(family: "Poppins", style: Regular, size: 13, weight: 400, lineHeight: 20, letterSpacing: 0).
```

```text
Component descriptions: The following components have usage descriptions or documentation links defined in Figma. These descriptions provide important context about the intended usage, best practices, and any constraints for each component. Follow these guidelines when implementing or using these components.

## Team Card
**Node ID:** 150:596

Leadership card (portrait). Name, role and portrait come from the dashboard (Team → Leadership). Build: cards fade up 28px with a 120ms stagger as the section enters the viewport; on hover the portrait zooms 6%, the gold line extends and the LinkedIn button slides in. Prototype: hover is live; Enter 1–5 hold the reveal timing.

## Portrait / Placeholder
**Node ID:** 154:890

Replace the image fill of “Photo (from dashboard)” with the portrait (4:5, min 800×1000).

## Team Marquee
**Node ID:** 151:964

Moving strip for the wider team. Content comes from the dashboard (Team → Staff, any number of entries). Build: row 1 scrolls left, row 2 scrolls right, ~40px/s, pauses on hover; the list is rendered twice for a seamless loop.

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
