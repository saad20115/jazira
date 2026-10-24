### 1. Normalizations Applied (`raw` → `normalized`, row numbers)

| # | Category | Field | Raw Value | Normalized Value | Reason | Row Numbers |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| 1 | `description-case` | `description` | `EMT CONDUIT` | `EMT Conduit` | Title Case normalization per Services table (157:3293) | 1 |
| 2 | `brand-typo` | `brandRaw` | `AL ROUF` | `Al Rouf` | Spec typo map (AL ROUF→Al Rouf) | 1 |
| 3 | `country` | `originRaw` | `Saudi arabia` | `Saudi Arabia / المملكة العربية السعودية` | Country name normalization & Arabic translation | 1, 28 |
| 4 | `brand-typo` | `brandRaw` | `ALROUF` | `Al Rouf` | Spec typo map (ALROUF→Al Rouf) | 2 |
| 5 | `brand-case-whitespace` | `brandRaw` | `ALFANAR` | `Alfanar` | Case & whitespace normalization | 2, 3 |
| 6 | `description-case` | `description` | `ELECTRICAL STEEL BOX` | `Electrical Steel Box` | Title Case normalization per Services table (157:3293) | 3 |
| 7 | `description-case` | `description` | `PVC ELECTRIC CONDUIT` | `PVC Electric Conduit` | Title Case normalization per Services table (157:3293) | 4 |
| 8 | `description-case` | `description` | `CABLE TRAY` | `Cable Tray` | Title Case normalization per Services table (157:3293) | 5 |
| 9 | `brand-case-whitespace` | `brandRaw` | `united technology group` | `United Technology Group` | Case & whitespace normalization | 5, 6 |
| 10 | `description-case` | `description` | `Cable trunk` | `Cable Trunk` | Title Case normalization per Services table (157:3293) | 6 |
| 11 | `description-typo` | `description` | `ELECTRIC CABELS` | `Electric Cables` | Spec typo map (CABELS→Cables) + Title Case | 7 |
| 12 | `brand-case-whitespace` | `brandRaw` | `JEDDAH cables` | `Jeddah Cables` | Case & whitespace normalization | 7 |
| 13 | `brand-case-whitespace` | `brandRaw` | `BAHRA Cables` | `Bahra Cables` | Case & whitespace normalization | 7 |
| 14 | `description-case` | `description` | `WIRES` | `Wires` | Title Case normalization per Services table (157:3293) | 8 |
| 15 | `brand-case-whitespace` | `brandRaw` | `Bahra cables` | `Bahra Cables` | Case & whitespace normalization | 8 |
| 16 | `description-case` | `description` | `FIRE ALARM CABLES` | `Fire Alarm Cables` | Title Case normalization per Services table (157:3293) | 9 |
| 17 | `description-case` | `description` | `FLOOR BOX DATA CABLE` | `Floor Box Data Cable` | Title Case normalization per Services table (157:3293) | 10 |
| 18 | `brand-case-whitespace` | `brandRaw` | `BELDEN` | `Belden` | Case & whitespace normalization | 10 |
| 19 | `brand-case-whitespace` | `brandRaw` | `commscope` | `CommScope` | Case & whitespace normalization | 10 |
| 20 | `country` | `originRaw` | `SAUDI ARABIA` | `Saudi Arabia / المملكة العربية السعودية` | Country name normalization & Arabic translation | 10, 56 |
| 21 | `description-case` | `description` | `GROUNDING AND EARTHING` | `Grounding and Earthing` | Title Case normalization per Services table (157:3293) | 11 |
| 22 | `description-case` | `description` | `WIRING DEVICES` | `Wiring Devices` | Title Case normalization per Services table (157:3293) | 12 |
| 23 | `brand-case-whitespace` | `brandRaw` | `ULTRA LIGHT` | `Ultra Light` | Case & whitespace normalization | 12, 14, 16, 17, 18 |
| 24 | `description-case` | `description` | `DISCONNECTED SWITCH` | `Disconnected Switch` | Title Case normalization per Services table (157:3293) | 13 |
| 25 | `brand-case-whitespace` | `brandRaw` | `LEGRAND` | `Legrand` | Case & whitespace normalization | 13 |
| 26 | `description-case` | `description` | `FLOOR BOX` | `Floor Box` | Title Case normalization per Services table (157:3293) | 14 |
| 27 | `brand-case-whitespace` | `brandRaw` | `SIERA` | `Siera` | Case & whitespace normalization | 14, 16, 18 |
| 28 | `description-case` | `description` | `emergency lighting battery` | `Emergency Lighting Battery` | Title Case normalization per Services table (157:3293) | 15 |
| 29 | `brand-case-whitespace` | `brandRaw` | `tridonic` | `Tridonic` | Case & whitespace normalization | 15 |
| 30 | `description-case` | `description` | `LIGHTING` | `Lighting` | Title Case normalization per Services table (157:3293) | 16, 18 |
| 31 | `description-case` | `description` | `OUTDOOR LIGHTING` | `Outdoor Lighting` | Title Case normalization per Services table (157:3293) | 17 |
| 32 | `description-case` | `description` | `FIRE ALARM SYSTEM` | `Fire Alarm System` | Title Case normalization per Services table (157:3293) | 19 |
| 33 | `brand-case-whitespace` | `brandRaw` | `COOPER` | `Cooper` | Case & whitespace normalization | 19 |
| 34 | `country` | `originRaw` | `United States (brand; now Eaton)` | `United States / الولايات المتحدة` | Country name normalization & Arabic translation | 19 |
| 35 | `brand-case-whitespace` | `brandRaw` | `AVANGER` | `Avanger` | Case & whitespace normalization | 19 |
| 36 | `description-case` | `description` | `PANEL BOARD` | `Panel Board` | Title Case normalization per Services table (157:3293) | 20 |
| 37 | `brand-case-whitespace` | `brandRaw` | `EFFECTIVE POWER - ASSTTE` | `Effective Power - ASSTTE` | Case & whitespace normalization | 20 |
| 38 | `description-case` | `description` | `FIREPIPES` | `Firepipes` | Title Case normalization per Services table (157:3293) | 21 |
| 39 | `brand-case-whitespace` | `brandRaw` | `ALJAZIRAH (OMAN-SAUDI)` | `Aljazirah (Oman-Saudi)` | Case & whitespace normalization | 21 |
| 40 | `description-case` | `description` | `GALVANIZED PIPE` | `Galvanized Pipe` | Title Case normalization per Services table (157:3293) | 22 |
| 41 | `brand-case-whitespace` | `brandRaw` | `ALJAZERA` | `Aljazera` | Case & whitespace normalization | 22 |
| 42 | `description-case` | `description` | `GROOVED FITTING` | `Grooved Fitting` | Title Case normalization per Services table (157:3293) | 23 |
| 43 | `description-case` | `description` | `THREADED FITTING` | `Threaded Fitting` | Title Case normalization per Services table (157:3293) | 24 |
| 44 | `brand-case-whitespace` | `brandRaw` | `JIHANZI -UL/FM` | `Jihanzi - UL/FM` | Case & whitespace normalization | 24 |
| 45 | `description-case` | `description` | `Lined Split clamp & Clevis Hanger` | `Lined Split Clamp & Clevis Hanger` | Title Case normalization per Services table (157:3293) | 25 |
| 46 | `description-case` | `description` | `ZCV FOR FIRE` | `ZCV for Fire` | Title Case normalization per Services table (157:3293) | 26 |
| 47 | `brand-case-whitespace` | `brandRaw` | `SHANDONG LEDE MACHINERY` | `Shandong Lede Machinery` | Case & whitespace normalization | 26 |
| 48 | `description-case` | `description` | `TEMPER SWITCH` | `Temper Switch` | Title Case normalization per Services table (157:3293) | 27 |
| 49 | `brand-typo` | `brandRaw` | `SEFEECO` | `SEFECO` | Spec typo map (SEFEECO→SEFECO) | 28 |
| 50 | `description-typo` | `description` | `Pressure Gauage` | `Pressure Gauge` | Spec typo map (GAUAGE→Gauge) + Title Case | 30 |
| 51 | `description-case` | `description` | `FIRE PIPES PAINTS` | `Fire Pipes Paints` | Title Case normalization per Services table (157:3293) | 31 |
| 52 | `brand-case-whitespace` | `brandRaw` | `JAZEERA (PRIMER)` | `Jazeera (Primer)` | Case & whitespace normalization | 31 |
| 53 | `country` | `originRaw` | `Saudi arbia` | `Saudi Arabia / المملكة العربية السعودية` | Country name normalization & Arabic translation | 31 |
| 54 | `brand-product-note` | `brandRaw` | `HEMPEL (COATING)` | `Hempel` | Parenthetical product note "(COATING)" stripped from brand name and kept on material #31 notes (docs/02-content-model.md) | 31 |
| 55 | `description-case` | `description` | `FIRE PUMP` | `Fire Pump` | Title Case normalization per Services table (157:3293) | 32 |
| 56 | `brand-case-whitespace` | `brandRaw` | `BRISTOL` | `Bristol` | Case & whitespace normalization | 32 |
| 57 | `description-case` | `description` | `FIRE HOSE CABINET STEEL` | `Fire Hose Cabinet Steel` | Title Case normalization per Services table (157:3293) | 33 |
| 58 | `description-typo` | `description` | `FIRE EXTENGUISHER` | `Fire Extinguisher` | Spec typo map (EXTENGUISHER→Extinguisher) + Title Case | 34 |
| 59 | `description-case` | `description` | `NOVEC` | `Novec` | Title Case normalization per Services table (157:3293) | 35 |
| 60 | `brand-case-whitespace` | `brandRaw` | `HI-TECH` | `Hi-Tech` | Case & whitespace normalization | 35 |
| 61 | `brand-case-whitespace` | `brandRaw` | `look` | `Look` | Case & whitespace normalization | 35 |
| 62 | `country` | `originRaw` | `united kingdom` | `United Kingdom / المملكة المتحدة` | Country name normalization & Arabic translation | 35 |
| 63 | `description-case` | `description` | `AEROSOL` | `Aerosol` | Title Case normalization per Services table (157:3293) | 36 |
| 64 | `brand-case-whitespace` | `brandRaw` | `fire pro` | `Fire Pro` | Case & whitespace normalization | 36 |
| 65 | `description-case` | `description` | `PPR PIPE` | `PPR Pipe` | Title Case normalization per Services table (157:3293) | 37 |
| 66 | `brand-case-whitespace` | `brandRaw` | `TAHWEEL` | `Tahweel` | Case & whitespace normalization | 37, 38, 43, 44, 45, 46 |
| 67 | `description-case` | `description` | `FITTINGS` | `Fittings` | Title Case normalization per Services table (157:3293) | 38 |
| 68 | `description-case` | `description` | `PLUMBING VALVES` | `Plumbing Valves` | Title Case normalization per Services table (157:3293) | 39 |
| 69 | `brand-case-whitespace` | `brandRaw` | `tahweeL` | `Tahweel` | Case & whitespace normalization | 39 |
| 70 | `description-case` | `description` | `WATER HAMMER ARRESTOR` | `Water Hammer Arrestor` | Title Case normalization per Services table (157:3293) | 40 |
| 71 | `brand-case-whitespace` | `brandRaw` | `watts` | `Watts` | Case & whitespace normalization | 40 |
| 72 | `description-case` | `description` | `HOSE BIBs` | `Hose Bibs` | Title Case normalization per Services table (157:3293) | 41 |
| 73 | `brand-case-whitespace` | `brandRaw` | `WATTS` | `Watts` | Case & whitespace normalization | 41 |
| 74 | `description-case` | `description` | `PLUMBING INSULATION` | `Plumbing Insulation` | Title Case normalization per Services table (157:3293) | 42 |
| 75 | `brand-case-whitespace` | `brandRaw` | `AEROFOAM` | `Aerofoam` | Case & whitespace normalization | 42 |
| 76 | `brand-typo` | `brandRaw` | `arma flex` | `Armaflex` | Spec typo map (ARMA FLEX→Armaflex) | 42 |
| 77 | `description-case` | `description` | `WASTE PIPE` | `Waste Pipe` | Title Case normalization per Services table (157:3293) | 43 |
| 78 | `description-case` | `description` | `AC DRAIN PIPES` | `AC Drain Pipes` | Title Case normalization per Services table (157:3293) | 44 |
| 79 | `brand-case-whitespace` | `brandRaw` | `GULF PIPES` | `Gulf Pipes` | Case & whitespace normalization | 44 |
| 80 | `description-case` | `description` | `drain,waste pipe` | `Drain, Waste Pipe` | Title Case normalization per Services table (157:3293) | 45 |
| 81 | `description-case` | `description` | `WASTE PIPES` | `Waste Pipes` | Title Case normalization per Services table (157:3293) | 46 |
| 82 | `brand-case-whitespace` | `brandRaw` | `NEPRO PLAST` | `Nepro Plast` | Case & whitespace normalization | 46 |
| 83 | `description-case` | `description` | `FLUSH TANK FOR WC` | `Flush Tank for WC` | Title Case normalization per Services table (157:3293) | 47 |
| 84 | `brand-case-whitespace` | `brandRaw` | `GROHE` | `Grohe` | Case & whitespace normalization | 47 |
| 85 | `brand-typo` | `brandRaw` | `GEBRIT` | `Geberit` | Spec typo map (GEBRIT→Geberit) | 47 |
| 86 | `description-case` | `description` | `WATER TANK` | `Water Tank` | Title Case normalization per Services table (157:3293) | 48 |
| 87 | `description-case` | `description` | `WATER HEATER` | `Water Heater` | Title Case normalization per Services table (157:3293) | 49 |
| 88 | `brand-case-whitespace` | `brandRaw` | `ARISTON` | `Ariston` | Case & whitespace normalization | 49 |
| 89 | `brand-typo` | `brandRaw` | `SAUDI CERMICS` | `Saudi Ceramics` | Spec typo map (SAUDI CERMICS→Saudi Ceramics) | 49 |
| 90 | `description-case` | `description` | `BOOSTER PUMP` | `Booster Pump` | Title Case normalization per Services table (157:3293) | 50 |
| 91 | `brand-typo` | `brandRaw` | `Peddrolla` | `Pedrollo` | Spec typo map (PEDDROLLA→Pedrollo) | 50 |
| 92 | `brand-case-whitespace` | `brandRaw` | `WATER horse` | `Water Horse` | Case & whitespace normalization | 50 |
| 93 | `description-case` | `description` | `DUCT SHEET` | `Duct Sheet` | Title Case normalization per Services table (157:3293) | 51 |
| 94 | `description-case` | `description` | `DUCT INSULATION` | `Duct Insulation` | Title Case normalization per Services table (157:3293) | 52 |
| 95 | `description-case` | `description` | `DX PIPE` | `DX Pipe` | Title Case normalization per Services table (157:3293) | 53 |
| 96 | `brand-case-whitespace` | `brandRaw` | `LUVATA` | `Luvata` | Case & whitespace normalization | 53 |
| 97 | `country` | `originRaw` | `ITALY` | `Italy / إيطاليا` | Country name normalization & Arabic translation | 53 |
| 98 | `brand-case-whitespace` | `brandRaw` | `CAMLEE` | `Camlee` | Case & whitespace normalization | 53 |
| 99 | `country` | `originRaw` | `CHINA` | `China / الصين` | Country name normalization & Arabic translation | 53 |
| 100 | `description-case` | `description` | `OUT LET GRILL` | `Out Let Grill` | Title Case normalization per Services table (157:3293) | 54 |
| 101 | `brand-case-whitespace` | `brandRaw` | `AL-NASSERIAH` | `Al-Nasseriah` | Case & whitespace normalization | 54 |
| 102 | `description-case` | `description` | `AC UNITS` | `AC Units` | Title Case normalization per Services table (157:3293) | 55 |
| 103 | `brand-typo` | `brandRaw` | `zamil` | `Zamil` | Spec typo map (ZAMIL→Zamil) | 55 |
| 104 | `country` | `originRaw` | `saudi arabia` | `Saudi Arabia / المملكة العربية السعودية` | Country name normalization & Arabic translation | 55 |
| 105 | `description-case` | `description` | `FAN` | `Fan` | Title Case normalization per Services table (157:3293) | 56 |
| 106 | `brand-case-whitespace` | `brandRaw` | `SYSTEM AIR` | `System Air` | Case & whitespace normalization | 56 |
| 107 | `brand-case-whitespace` | `brandRaw` | `BLACK HORSE` | `Black Horse` | Case & whitespace normalization | 56 |
| 108 | `description-case` | `description` | `ELEVATORS` | `Elevators` | Title Case normalization per Services table (157:3293) | 57 |
| 109 | `brand-case-whitespace` | `brandRaw` | `ALDURRAH-fuji` | `Aldurrah-Fuji` | Case & whitespace normalization | 57 |
| 110 | `brand-case-whitespace` | `brandRaw` | `Arabian Cement co.` | `Arabian Cement Co.` | Case & whitespace normalization | 59 |
| 111 | `brand-case-whitespace` | `brandRaw` | `Al-rajhi Steel` | `Al-Rajhi Steel` | Case & whitespace normalization | 60 |
| 112 | `description-case` | `description` | `Concrete masonry units` | `Concrete Masonry Units` | Title Case normalization per Services table (157:3293) | 63 |
| 113 | `brand-case-whitespace` | `brandRaw` | `Saudi Ready mix -block` | `Saudi Ready Mix - Block` | Case & whitespace normalization | 63 |
| 114 | `brand-case-whitespace` | `brandRaw` | `Jeddah block factory` | `Jeddah Block Factory` | Case & whitespace normalization | 63 |
| 115 | `brand-case-whitespace` | `brandRaw` | `Saudi anfal` | `Saudi Anfal` | Case & whitespace normalization | 64 |
| 116 | `brand-case-whitespace` | `brandRaw` | `Al-dorais Doors Factory` | `Al-Dorais Doors Factory` | Case & whitespace normalization | 64 |
| 117 | `description-case` | `description` | `Aluminium systems` | `Aluminium Systems` | Title Case normalization per Services table (157:3293) | 65 |
| 118 | `brand-case-whitespace` | `brandRaw` | `AL-Tahweel Aluminium` | `Al-Tahweel Aluminium` | Case & whitespace normalization | 65 |
| 119 | `brand-case-whitespace` | `brandRaw` | `OBEIKAN GLASS` | `Obeikan Glass` | Case & whitespace normalization | 66 |
| 120 | `description-case` | `description` | `Plaster additives` | `Plaster Additives` | Title Case normalization per Services table (157:3293) | 68 |
| 121 | `brand-typo` | `brandRaw` | `Saudi cermics` | `Saudi Ceramics` | Spec typo map (SAUDI CERMICS→Saudi Ceramics) | 69 |
| 122 | `brand-case-whitespace` | `brandRaw` | `Al-mulhem Marble` | `Al-Mulhem Marble` | Case & whitespace normalization | 70 |
| 123 | `figma-partner-display-mapping` | `brandRaw` | `Figma "Eaton Cooper" ↔ raw "COOPER"` | `Cooper` | Figma Trusted Partners (18:579) displays "Eaton Cooper"; raw row 19 has brandRaw="COOPER" and originRaw="COOPER: United States (brand; now Eaton)". Seeded brand name stays raw/normalized "Cooper" — confirm display name with client. | 19 |
| 124 | `figma-partner-display-mapping` | `brandRaw` | `Figma "Systemair" ↔ raw "SYSTEM AIR"` | `System Air` | Figma Trusted Partners (18:579) displays single-word "Systemair"; raw row 56 has two-word "SYSTEM AIR". Seeded brand name stays raw/normalized "System Air" — confirm display name with client. | 56 |
| 125 | `figma-partner-display-mapping` | `brandRaw` | `Figma "Hempel" ↔ raw "HEMPEL (COATING)"` | `Hempel` | Raw row 31 has parenthetical product note "HEMPEL (COATING)"; normalized to brand "Hempel" (matching Figma 18:579) and product note kept on material #31 notes — confirm with client. | 31 |
| 126 | `figma-partner-display-mapping` | `brandRaw` | `Figma "Al Rajhi Steel" ↔ raw "Al-rajhi Steel"` | `Al-Rajhi Steel` | Figma Trusted Partners (18:579) displays unhyphenated "Al Rajhi Steel"; raw row 60 has hyphenated "Al-rajhi Steel". Seeded brand name stays raw/normalized "Al-Rajhi Steel" — confirm display name with client. | 60 |

### 2. Figma ↔ Raw Partner Display Name Mappings (`R-5`, `design/copy/01-home.md` `18:579`)

| Marquee Order | Figma Partner Display Name (`18:579`) | Raw Value (`seed/materials.raw.json`) | Seeded `brands.name` | Row Numbers | Client Confirmation Needed |
| :--- | :--- | :--- | :--- | :--- | :--- |
| 6 | `Eaton Cooper` | `COOPER` | `Cooper` | 19 | Figma Trusted Partners (18:579) displays "Eaton Cooper"; raw row 19 has brandRaw="COOPER" and originRaw="COOPER: United States (brand; now Eaton)". Seeded brand name stays raw/normalized "Cooper" — confirm display name with client. |
| 13 | `Systemair` | `SYSTEM AIR` | `System Air` | 56 | Figma Trusted Partners (18:579) displays single-word "Systemair"; raw row 56 has two-word "SYSTEM AIR". Seeded brand name stays raw/normalized "System Air" — confirm display name with client. |
| 14 | `Hempel` | `HEMPEL (COATING)` | `Hempel` | 31 | Raw row 31 has parenthetical product note "HEMPEL (COATING)"; normalized to brand "Hempel" (matching Figma 18:579) and product note kept on material #31 notes — confirm with client. |
| 19 | `Al Rajhi Steel` | `Al-rajhi Steel` | `Al-Rajhi Steel` | 60 | Figma Trusted Partners (18:579) displays unhyphenated "Al Rajhi Steel"; raw row 60 has hyphenated "Al-rajhi Steel". Seeded brand name stays raw/normalized "Al-Rajhi Steel" — confirm display name with client. |

### 3. Rows & Brands Flagged for Client Confirmation (`needsClientReview`, incl. Uncertain Description Typos `R-2` & Rows 58–73)

| Row # | System | Category | Raw Input (`description` / `brandRaw` / `originRaw` / `alternativeRaw`) | Seeded Normalized Brands | Client Confirmation Needed |
| :--- | :--- | :--- | :--- | :--- | :--- |
| 11 | `electrical` | `uncertain-brand-spelling-or-split` | `brandRaw="Bahra" \| originRaw="Bahra: Saudi Arabia"` | `Bahra` | Raw brand is "Bahra" (without "Cables"); left as-is and separate from "Bahra Cables" (rows 7, 8) pending client confirmation. |
| 13 | `electrical` | `uncertain-description-typo` | `description="DISCONNECTED SWITCH"` | `Legrand` | Raw English "DISCONNECTED SWITCH" is left as "Disconnected Switch" and translated literally as "مفتاح مفصول"; confirm with client whether "Disconnect Switch" ("مفتاح فصل") was intended. |
| 19 | `electrical` | `uncertain-brand-spelling-or-split` | `brandRaw="COOPER/AVANGER" \| originRaw="COOPER: United States (brand; now Eaton) \| AVANGER: United Kingdom"` | `Cooper`, `Avanger` | originRaw notes "COOPER: United States (brand; now Eaton) \| AVANGER: United Kingdom"; left as "Cooper" (Figma 18:579 displays "Eaton Cooper") and "Avanger" pending client confirmation on display name and "Avenger" spelling. |
| 20 | `electrical` | `uncertain-brand-spelling-or-split` | `brandRaw="EFFECTIVE POWER - ASSTTE" \| originRaw="(EFFECTIVE POWER-ASTTE): Saudi Arabia"` | `Effective Power - ASSTTE` | brandRaw has "EFFECTIVE POWER - ASSTTE" while originRaw has "(EFFECTIVE POWER-ASTTE): Saudi Arabia"; left as "Effective Power - ASSTTE" pending client confirmation on spelling. |
| 21 | `mechanical` | `uncertain-description-typo` | `description="FIREPIPES"` | `Aljazirah (Oman-Saudi)` | Raw English single-word "FIREPIPES" is left as "Firepipes" and translated literally as "مواسير حريق"; confirm with client whether two-word "Fire Pipes" was intended. |
| 21 | `mechanical` | `missing-brand-origin` | `brandRaw="ALJAZIRAH (OMAN-SAUDI)" \| originRaw="ALJAZIRAH (OMAN-SAUDI):"` | `Aljazirah (Oman-Saudi)` | brandRaw is "ALJAZIRAH (OMAN-SAUDI)" and originRaw is "ALJAZIRAH (OMAN-SAUDI):" (empty country after colon); left as-is with empty origin pending client confirmation (compare row 22 "ALJAZERA"). |
| 22 | `mechanical` | `uncertain-brand-spelling-or-split` | `brandRaw="ALJAZERA" \| originRaw="ALJAZERA: Saudi Arabia / Oman"` | `Aljazera` | brandRaw is "ALJAZERA" with originRaw "ALJAZERA: Saudi Arabia / Oman"; left as "Aljazera" pending client confirmation whether rows 21 and 22 are the same manufacturer (Al Jazeera Steel Products Co.). |
| 23 | `mechanical` | `uncertain-brand-spelling-or-split` | `brandRaw="Junt / JTPR UL-FM" \| originRaw="Junt: China \| JTPR: China"` | `Junt`, `JTPR UL-FM` | brandRaw is "Junt / JTPR UL-FM" (includes UL-FM certification suffix on JTPR); left as "Junt" and "JTPR UL-FM" pending client confirmation. |
| 24 | `mechanical` | `uncertain-brand-spelling-or-split` | `brandRaw="JIHANZI -UL/FM" \| originRaw="JIHANZI: China"` | `Jihanzi - UL/FM` | brandRaw is "JIHANZI -UL/FM" (UL/FM certification suffix with slash); kept as single brand "Jihanzi -UL/FM" (China) pending client confirmation. |
| 27 | `mechanical` | `uncertain-description-typo` | `description="TEMPER SWITCH"` | `JMC` | Raw English "TEMPER SWITCH" is left as "Temper Switch" and translated literally as "مفتاح تقسية"; confirm with client whether "Tamper Switch" ("مفتاح مراقبة العبث") was intended. |
| 31 | `mechanical` | `uncertain-brand-spelling-or-split` | `brandRaw="JAZEERA (PRIMER) HEMPEL (COATING)" \| originRaw="JAZEERA (PRIMER):Saudi arbia HEMPEL (COATING): Denmark"` | `Jazeera (Primer)`, `Hempel` | brandRaw is "JAZEERA (PRIMER) HEMPEL (COATING)" and originRaw has two Brand: Country pairs ("JAZEERA (PRIMER):Saudi arbia HEMPEL (COATING): Denmark"); "HEMPEL (COATING)" normalized to brand "Hempel" with product note kept on material #31, and "Jazeera (Primer)" kept pending client confirmation whether to merge with "Jazeera Paints" (row 71). |
| 42 | `mechanical` | `missing-brand-origin` | `brandRaw="AEROFOAM/arma flex" \| originRaw="AEROFOAM: UAE"` | `Aerofoam`, `Armaflex` | originRaw is "AEROFOAM: UAE" without a country for second brand "arma flex" ("Armaflex"); seeded "Armaflex" with empty origin pending client confirmation. |
| 47 | `mechanical` | `missing-brand-origin` | `brandRaw="GROHE/GEBRIT" \| originRaw="GROHE: Germany"` | `Grohe`, `Geberit` | originRaw is "GROHE: Germany" without a country for second brand "GEBRIT" ("Geberit"); seeded "Geberit" with empty origin pending client confirmation. |
| 53 | `mechanical` | `uncertain-brand-spelling-or-split` | `brandRaw="LUVATA-CAMLEE" \| originRaw="LUVATA :ITALY /CAMLEE: CHINA"` | `Luvata`, `Camlee` | brandRaw is "LUVATA-CAMLEE" joined by hyphen while originRaw has two Brand: Country pairs ("LUVATA :ITALY /CAMLEE: CHINA"); split into "Luvata" (Italy) and "Camlee" (China) pending client confirmation. |
| 54 | `mechanical` | `uncertain-description-typo` | `description="OUT LET GRILL"` | `Al-Nasseriah` | Raw English "OUT LET GRILL" is left as "Out Let Grill" and translated literally as "شبكة مخرج"; confirm with client whether "Outlet Grill" / "Outlet Grille" was intended. |
| 56 | `mechanical` | `uncertain-brand-spelling-or-split` | `brandRaw="SYSTEM AIR/BLACK HORSE" \| originRaw="SYSTEM AIR: Sweden \| BLACK HORSE: SAUDI ARABIA"` | `System Air`, `Black Horse` | brandRaw is "SYSTEM AIR/BLACK HORSE"; left as "System Air" (two words) pending client confirmation on display name vs single-word "Systemair" in Figma (18:579). |
| 57 | `mechanical` | `uncertain-brand-spelling-or-split` | `brandRaw="ALDURRAH-fuji" \| originRaw="ALDURRAH: Saudi Arabia"` | `Aldurrah-Fuji` | brandRaw is "ALDURRAH-fuji" with originRaw "ALDURRAH: Saudi Arabia"; kept as "Aldurrah-Fuji" (Saudi Arabia) pending client confirmation whether Fuji is a separate partner brand. |
| 58 | `structural` | `structural-architectural-second-supplier` | `brandRaw="Saudi Ready Mix" \| alternativeRaw="Nesma Concrete Solutions"` | `Saudi Ready Mix`, `Nesma Concrete Solutions` | Row 58 (structural): origin column holds second supplier "Nesma Concrete Solutions" instead of a country — seeded [Saudi Ready Mix, Nesma Concrete Solutions] with empty origin (unless set in rows 1–57). |
| 59 | `structural` | `structural-architectural-second-supplier` | `brandRaw="Arabian Cement co." \| alternativeRaw="Yanbu Cement"` | `Arabian Cement Co.`, `Yanbu Cement` | Row 59 (structural): origin column holds second supplier "Yanbu Cement" instead of a country — seeded [Arabian Cement Co., Yanbu Cement] with empty origin (unless set in rows 1–57). |
| 60 | `structural` | `structural-architectural-second-supplier` | `brandRaw="Al-rajhi Steel" \| alternativeRaw="Al-rajhi Steel"` | `Al-Rajhi Steel` | Row 60 (structural): origin column holds second supplier "Al-rajhi Steel" instead of a country — seeded [Al-Rajhi Steel] with empty origin (unless set in rows 1–57) (both brandRaw and alternativeRaw are "Al-rajhi Steel" — deduplicated to 1 brand link; Figma 18:579 displays "Al Rajhi Steel"). |
| 61 | `structural` | `structural-architectural-second-supplier` | `brandRaw="Bitumat" \| alternativeRaw="Awazel"` | `Bitumat`, `Awazel` | Row 61 (structural): origin column holds second supplier "Awazel" instead of a country — seeded [Bitumat, Awazel] with empty origin (unless set in rows 1–57). |
| 62 | `structural` | `structural-architectural-second-supplier` | `brandRaw="Arnon XPS" \| alternativeRaw=""` | `Arnon XPS` | Row 62 (structural): origin column holds second supplier "(empty)" instead of a country — seeded [Arnon XPS] with empty origin (unless set in rows 1–57). |
| 63 | `structural` | `structural-architectural-second-supplier` | `brandRaw="Saudi Ready mix -block" \| alternativeRaw="Jeddah block factory"` | `Saudi Ready Mix - Block`, `Jeddah Block Factory` | Row 63 (structural): origin column holds second supplier "Jeddah block factory" instead of a country — seeded [Saudi Ready Mix - Block, Jeddah Block Factory] with empty origin (unless set in rows 1–57). |
| 64 | `structural` | `structural-architectural-second-supplier` | `brandRaw="Saudi anfal" \| alternativeRaw="Al-dorais Doors Factory"` | `Saudi Anfal`, `Al-Dorais Doors Factory` | Row 64 (structural): origin column holds second supplier "Al-dorais Doors Factory" instead of a country — seeded [Saudi Anfal, Al-Dorais Doors Factory] with empty origin (unless set in rows 1–57). |
| 65 | `structural` | `structural-architectural-second-supplier` | `brandRaw="ALUPCO" \| alternativeRaw="AL-Tahweel Aluminium"` | `ALUPCO`, `Al-Tahweel Aluminium` | Row 65 (structural): origin column holds second supplier "AL-Tahweel Aluminium" instead of a country — seeded [ALUPCO, Al-Tahweel Aluminium] with empty origin (unless set in rows 1–57). |
| 66 | `architectural` | `structural-architectural-second-supplier` | `brandRaw="OBEIKAN GLASS" \| alternativeRaw=""` | `Obeikan Glass` | Row 66 (architectural): origin column holds second supplier "(empty)" instead of a country — seeded [Obeikan Glass] with empty origin (unless set in rows 1–57). |
| 67 | `architectural` | `structural-architectural-second-supplier` | `brandRaw="Mada Gypsum" \| alternativeRaw=""` | `Mada Gypsum` | Row 67 (architectural): origin column holds second supplier "(empty)" instead of a country — seeded [Mada Gypsum] with empty origin (unless set in rows 1–57). |
| 68 | `architectural` | `structural-architectural-second-supplier` | `brandRaw="Saveto" \| alternativeRaw=""` | `Saveto` | Row 68 (architectural): origin column holds second supplier "(empty)" instead of a country — seeded [Saveto] with empty origin (unless set in rows 1–57). |
| 69 | `architectural` | `structural-architectural-second-supplier` | `brandRaw="Saudi cermics" \| alternativeRaw="Alfanar Cermics"` | `Saudi Ceramics`, `Alfanar Cermics` | Row 69 (architectural): origin column holds second supplier "Alfanar Cermics" instead of a country — seeded [Saudi Ceramics, Alfanar Cermics] with empty origin (unless set in rows 1–57) ("Saudi cermics" normalized via spec map to "Saudi Ceramics"; "Alfanar Cermics" left as-is pending client confirmation). |
| 70 | `architectural` | `structural-architectural-second-supplier` | `brandRaw="Al-mulhem Marble" \| alternativeRaw="Saudi Marble"` | `Al-Mulhem Marble`, `Saudi Marble` | Row 70 (architectural): origin column holds second supplier "Saudi Marble" instead of a country — seeded [Al-Mulhem Marble, Saudi Marble] with empty origin (unless set in rows 1–57). |
| 71 | `architectural` | `structural-architectural-second-supplier` | `brandRaw="Jazeera Paints" \| alternativeRaw="Ritver Paints"` | `Jazeera Paints`, `Ritver Paints` | Row 71 (architectural): origin column holds second supplier "Ritver Paints" instead of a country — seeded [Jazeera Paints, Ritver Paints] with empty origin (unless set in rows 1–57). |
| 72 | `architectural` | `structural-architectural-second-supplier` | `brandRaw="Local Jeddah GRC Factory" \| alternativeRaw=""` | `Local Jeddah GRC Factory` | Row 72 (architectural): origin column holds second supplier "(empty)" instead of a country — seeded [Local Jeddah GRC Factory] with empty origin (unless set in rows 1–57). |
| 73 | `architectural` | `structural-architectural-second-supplier` | `brandRaw="Local Fabrication" \| alternativeRaw=""` | `Local Fabrication` | Row 73 (architectural): origin column holds second supplier "(empty)" instead of a country — seeded [Local Fabrication] with empty origin (unless set in rows 1–57). |

### 4. Drafted Arabic Material Descriptions (All 73 Rows — Literal Translations `R-3` & Review Notes `R-2`)

| Item # | System | Raw English (`seed/materials.raw.json`) | Normalized English (`description` en) | Drafted Arabic (`description` ar — `needsClientReview`) | Review Note (`R-2` / `R-5`) | Linked Normalized Brands |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| 1 | `electrical` | `EMT CONDUIT` | EMT Conduit | مواسير EMT | — | `Al Rouf` |
| 2 | `electrical` | `Electric Box` | Electric Box | علبة كهربائية | — | `Al Rouf`, `Alfanar` |
| 3 | `electrical` | `ELECTRICAL STEEL BOX` | Electrical Steel Box | علبة كهربائية فولاذية | — | `Alfanar` |
| 4 | `electrical` | `PVC ELECTRIC CONDUIT` | PVC Electric Conduit | مواسير كهربائية PVC | — | `EGA` |
| 5 | `electrical` | `CABLE TRAY` | Cable Tray | حامل كابلات | — | `United Technology Group` |
| 6 | `electrical` | `Cable trunk` | Cable Trunk | مجرى كابلات | — | `United Technology Group` |
| 7 | `electrical` | `ELECTRIC CABELS` | Electric Cables | كابلات كهربائية | — | `Jeddah Cables`, `Bahra Cables` |
| 8 | `electrical` | `WIRES` | Wires | أسلاك | — | `Bahra Cables` |
| 9 | `electrical` | `FIRE ALARM CABLES` | Fire Alarm Cables | كابلات إنذار الحريق | — | `MESC` |
| 10 | `electrical` | `FLOOR BOX DATA CABLE` | Floor Box Data Cable | كابل بيانات لعلبة الأرضية | — | `Belden`, `CommScope`, `MESC` |
| 11 | `electrical` | `GROUNDING AND EARTHING` | Grounding and Earthing | التأريض والاتصال الأرضي | — | `Bahra` |
| 12 | `electrical` | `WIRING DEVICES` | Wiring Devices | أدوات التوصيل الكهربائي | — | `Ultra Light` |
| 13 | `electrical` | `DISCONNECTED SWITCH` | Disconnected Switch | مفتاح مفصول | Client review needed: raw description is "DISCONNECTED SWITCH" (translated literally to Arabic "مفتاح مفصول") — confirm whether "Disconnect Switch" was intended. | `Legrand` |
| 14 | `electrical` | `FLOOR BOX` | Floor Box | علبة أرضية | — | `Ultra Light`, `Siera` |
| 15 | `electrical` | `emergency lighting battery` | Emergency Lighting Battery | بطارية إنارة الطوارئ | — | `Tridonic`, `Siera` |
| 16 | `electrical` | `LIGHTING` | Lighting | إنارة | — | `Ultra Light`, `Siera` |
| 17 | `electrical` | `OUTDOOR LIGHTING` | Outdoor Lighting | إنارة خارجية | — | `Ultra Light` |
| 18 | `electrical` | `LIGHTING` | Lighting | إنارة | — | `Ultra Light`, `Siera` |
| 19 | `electrical` | `FIRE ALARM SYSTEM` | Fire Alarm System | نظام إنذار الحريق | — | `Cooper`, `Avanger` |
| 20 | `electrical` | `PANEL BOARD` | Panel Board | لوحة توزيع | — | `Effective Power - ASSTTE` |
| 21 | `mechanical` | `FIREPIPES` | Firepipes | مواسير حريق | Client review needed: raw description is single-word "FIREPIPES" (translated literally to Arabic "مواسير حريق") — confirm whether "Fire Pipes" was intended. | `Aljazirah (Oman-Saudi)` |
| 22 | `mechanical` | `GALVANIZED PIPE` | Galvanized Pipe | مواسير مجلفنة | — | `Aljazera` |
| 23 | `mechanical` | `GROOVED FITTING` | Grooved Fitting | قطع اتصال مخددة | — | `Junt`, `JTPR UL-FM` |
| 24 | `mechanical` | `THREADED FITTING` | Threaded Fitting | قطع اتصال مسننة | — | `Jihanzi - UL/FM` |
| 25 | `mechanical` | `Lined Split clamp & Clevis Hanger` | Lined Split Clamp & Clevis Hanger | مربط مشطور مبطن وعلاقة كليفس | — | `Karishma Steel` |
| 26 | `mechanical` | `ZCV FOR FIRE` | ZCV for Fire | صمام ZCV للحريق | — | `Shandong Lede Machinery` |
| 27 | `mechanical` | `TEMPER SWITCH` | Temper Switch | مفتاح تقسية | Client review needed: raw description is "TEMPER SWITCH" (translated literally to Arabic "مفتاح تقسية") — confirm whether "Tamper Switch" was intended. | `JMC` |
| 28 | `mechanical` | `Test & Drain Valve` | Test & Drain Valve | صمام اختبار وتصريف | — | `Giacomini`, `SEFECO` |
| 29 | `mechanical` | `Flow Switch` | Flow Switch | مفتاح تدفق | — | `JMC` |
| 30 | `mechanical` | `Pressure Gauage` | Pressure Gauge | مقياس ضغط | — | `Tyco`, `Ashcroft` |
| 31 | `mechanical` | `FIRE PIPES PAINTS` | Fire Pipes Paints | دهانات مواسير الحريق | Product notes from brand cell: Hempel (Coating); Jazeera (Primer). | `Jazeera (Primer)`, `Hempel` |
| 32 | `mechanical` | `FIRE PUMP` | Fire Pump | مضخة حريق | — | `Bristol` |
| 33 | `mechanical` | `FIRE HOSE CABINET STEEL` | Fire Hose Cabinet Steel | صندوق خرطوم حريق فولاذي | — | `SEFECO` |
| 34 | `mechanical` | `FIRE EXTENGUISHER` | Fire Extinguisher | طفاية حريق | — | `SEFECO` |
| 35 | `mechanical` | `NOVEC` | Novec | نوفيك (NOVEC) | — | `Hi-Tech`, `Look`, `SRI` |
| 36 | `mechanical` | `AEROSOL` | Aerosol | أيروسول (Aerosol) | — | `Fire Pro` |
| 37 | `mechanical` | `PPR PIPE` | PPR Pipe | مواسير PPR | — | `Tahweel` |
| 38 | `mechanical` | `FITTINGS` | Fittings | قطع اتصال (وصلات) | — | `Tahweel` |
| 39 | `mechanical` | `PLUMBING VALVES` | Plumbing Valves | صمامات سباكة | — | `Tahweel` |
| 40 | `mechanical` | `WATER HAMMER ARRESTOR` | Water Hammer Arrestor | مانع المطرقة المائية | — | `Watts` |
| 41 | `mechanical` | `HOSE BIBs` | Hose Bibs | حنفيات خراطيم | — | `Watts` |
| 42 | `mechanical` | `PLUMBING INSULATION` | Plumbing Insulation | عزل السباكة | — | `Aerofoam`, `Armaflex` |
| 43 | `mechanical` | `WASTE PIPE` | Waste Pipe | ماسورة صرف | — | `Tahweel` |
| 44 | `mechanical` | `AC DRAIN PIPES` | AC Drain Pipes | مواسير صرف التكييف | — | `Gulf Pipes`, `Tahweel` |
| 45 | `mechanical` | `drain,waste pipe` | Drain, Waste Pipe | ماسورة تصريف وصرف | — | `Tahweel` |
| 46 | `mechanical` | `WASTE PIPES` | Waste Pipes | مواسير صرف | — | `Nepro Plast`, `Tahweel` |
| 47 | `mechanical` | `FLUSH TANK FOR WC` | Flush Tank for WC | خزان طرد للمرحاض (WC) | — | `Grohe`, `Geberit` |
| 48 | `mechanical` | `WATER TANK` | Water Tank | خزان مياه | — | `Al-Muhaidb National` |
| 49 | `mechanical` | `WATER HEATER` | Water Heater | سخان مياه | — | `Ariston`, `Saudi Ceramics` |
| 50 | `mechanical` | `BOOSTER PUMP` | Booster Pump | مضخة تقوية | — | `Pedrollo`, `LEO`, `Water Horse` |
| 51 | `mechanical` | `DUCT SHEET` | Duct Sheet | صاج مجاري الهواء | — | `Local Fabrication` |
| 52 | `mechanical` | `DUCT INSULATION` | Duct Insulation | عزل مجاري الهواء | — | `AFICO` |
| 53 | `mechanical` | `DX PIPE` | DX Pipe | مواسير DX | — | `Luvata`, `Camlee` |
| 54 | `mechanical` | `OUT LET GRILL` | Out Let Grill | شبكة مخرج | Client review needed: raw description is "OUT LET GRILL" (translated literally to Arabic "شبكة مخرج") — confirm whether "Outlet Grill" / "Outlet Grille" was intended. | `Al-Nasseriah` |
| 55 | `mechanical` | `AC UNITS` | AC Units | وحدات تكييف | — | `SKM`, `Zamil` |
| 56 | `mechanical` | `FAN` | Fan | مروحة | — | `System Air`, `Black Horse` |
| 57 | `mechanical` | `ELEVATORS` | Elevators | مصاعد | — | `Aldurrah-Fuji` |
| 58 | `structural` | `Ready Mix Concrete` | Ready Mix Concrete | خرسانة جاهزة | — | `Saudi Ready Mix`, `Nesma Concrete Solutions` |
| 59 | `structural` | `Cement` | Cement | أسمنت | — | `Arabian Cement Co.`, `Yanbu Cement` |
| 60 | `structural` | `Reinforcing Steel Bars` | Reinforcing Steel Bars | قضبان حديد التسليح | — | `Al-Rajhi Steel` |
| 61 | `structural` | `Waterproofing Membranes` | Waterproofing Membranes | أغشية العزل المائي | — | `Bitumat`, `Awazel` |
| 62 | `structural` | `Roof Thermal Insulation` | Roof Thermal Insulation | العزل الحراري للأسطح | — | `Arnon XPS` |
| 63 | `structural` | `Concrete masonry units` | Concrete Masonry Units | وحدات البناء الخرسانية | — | `Saudi Ready Mix - Block`, `Jeddah Block Factory` |
| 64 | `structural` | `Wooden Doors & Frames` | Wooden Doors & Frames | أبواب وإطارات خشبية | — | `Saudi Anfal`, `Al-Dorais Doors Factory` |
| 65 | `structural` | `Aluminium systems` | Aluminium Systems | أنظمة الألمنيوم | — | `ALUPCO`, `Al-Tahweel Aluminium` |
| 66 | `architectural` | `Glass` | Glass | زجاج | — | `Obeikan Glass` |
| 67 | `architectural` | `Gypsum Board` | Gypsum Board | ألواح جبس | — | `Mada Gypsum` |
| 68 | `architectural` | `Plaster additives` | Plaster Additives | إضافات اللياسة | — | `Saveto` |
| 69 | `architectural` | `Porcelain` | Porcelain | بورسلين | — | `Saudi Ceramics`, `Alfanar Cermics` |
| 70 | `architectural` | `Marble` | Marble | رخام | — | `Al-Mulhem Marble`, `Saudi Marble` |
| 71 | `architectural` | `Paints` | Paints | دهانات | — | `Jazeera Paints`, `Ritver Paints` |
| 72 | `architectural` | `GRC Cladding` | GRC Cladding | تكسية GRC | — | `Local Jeddah GRC Factory` |
| 73 | `architectural` | `Wrought Iron Balustrade` | Wrought Iron Balustrade | درابزين حديد مشغول | — | `Local Fabrication` |
