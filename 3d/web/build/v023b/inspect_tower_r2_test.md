
 OVERVIEW
 ────────────────────────────────────────────
| key                | value                                                   |
| ---                | ---                                                     |
| version            | 2.0                                                     |
| generator          | Khronos glTF Blender I/O v5.2.41                        |
| extensionsUsed     | KHR_materials_emissive_strength, KHR_materials_variants |
| extensionsRequired | none                                                    |



 SCENES
 ────────────────────────────────────────────
| #   | name  | rootName  | bboxMin                              | bboxMax                      | renderVertexCount¹ | uploadVertexCount | uploadNaiveVertexCount |
| --- | ---   | ---       | ---                                  | ---                          | ---                | ---               | ---                    |
| 0   | Scene | ARCH_core | -2598.41626, -451.48523, -2598.41626 | 2598.41626, 2600, 2598.41626 | ٣٢٬٥١٤             | ٢١٬٠٥٤            | ٢١٬٠٥٤                 |

¹ Expected number of vertices processed by the vertex shader for one render
  pass, without considering the vertex cache.

² Expected number of vertices uploaded to GPU, assuming each Accessor
  is uploaded only once. Actual number uploaded may be higher, 
  dependent on the implementation and vertex buffer layout.

³ Expected number of vertices uploaded to GPU, assuming each Primitive
  is uploaded once, duplicating vertex attributes shared among Primitives.



 MESHES
 ────────────────────────────────────────────
| #   | name                       | mode      | meshPrimitives | glPrimitives | vertices | indices | attributes                                               | instances | size¹     |
| --- | ---                        | ---       | ---            | ---          | ---      | ---     | ---                                                      | ---       | ---       |
| 0   | CORE_core                  | TRIANGLES | ١              | ٢٤           | ٤٨       | u16     | NORMAL:f32, POSITION:f32, TEXCOORD_0:f32                 | ١         | 1.68 KB   |
| 1   | CORE_slab_GF               | TRIANGLES | ١              | ٢٠           | ٣٦       | u16     | NORMAL:f32, POSITION:f32, TEXCOORD_0:f32                 | ١         | 1.27 KB   |
| 2   | CORE_slab_L01              | TRIANGLES | ١              | ٢٠           | ٣٦       | u16     | NORMAL:f32, POSITION:f32, TEXCOORD_0:f32                 | ١         | 1.27 KB   |
| 3   | CORE_slab_L02              | TRIANGLES | ١              | ٢٠           | ٣٦       | u16     | NORMAL:f32, POSITION:f32, TEXCOORD_0:f32                 | ١         | 1.27 KB   |
| 4   | CORE_slab_L03              | TRIANGLES | ١              | ٢٠           | ٣٦       | u16     | NORMAL:f32, POSITION:f32, TEXCOORD_0:f32                 | ١         | 1.27 KB   |
| 5   | CORE_slab_L04              | TRIANGLES | ١              | ٢٠           | ٣٦       | u16     | NORMAL:f32, POSITION:f32, TEXCOORD_0:f32                 | ١         | 1.27 KB   |
| 6   | CORE_slab_L05              | TRIANGLES | ١              | ٢٠           | ٣٦       | u16     | NORMAL:f32, POSITION:f32, TEXCOORD_0:f32                 | ١         | 1.27 KB   |
| 7   | CORE_slab_L06              | TRIANGLES | ١              | ٢٠           | ٣٦       | u16     | NORMAL:f32, POSITION:f32, TEXCOORD_0:f32                 | ١         | 1.27 KB   |
| 8   | CORE_slab_L07              | TRIANGLES | ١              | ٢٠           | ٣٦       | u16     | NORMAL:f32, POSITION:f32, TEXCOORD_0:f32                 | ١         | 1.27 KB   |
| 9   | CORE_slab_L08              | TRIANGLES | ١              | ٢٠           | ٣٦       | u16     | NORMAL:f32, POSITION:f32, TEXCOORD_0:f32                 | ١         | 1.27 KB   |
| 10  | CORE_slab_L09              | TRIANGLES | ١              | ٢٠           | ٣٦       | u16     | NORMAL:f32, POSITION:f32, TEXCOORD_0:f32                 | ١         | 1.27 KB   |
| 11  | CORE_slab_L10              | TRIANGLES | ١              | ٢٠           | ٣٦       | u16     | NORMAL:f32, POSITION:f32, TEXCOORD_0:f32                 | ١         | 1.27 KB   |
| 12  | CORE_slab_L11              | TRIANGLES | ١              | ٢٠           | ٣٦       | u16     | NORMAL:f32, POSITION:f32, TEXCOORD_0:f32                 | ١         | 1.27 KB   |
| 13  | CORE_slab_L12              | TRIANGLES | ١              | ٢٠           | ٣٦       | u16     | NORMAL:f32, POSITION:f32, TEXCOORD_0:f32                 | ١         | 1.27 KB   |
| 14  | CORE_slab_L13              | TRIANGLES | ١              | ٢٠           | ٣٦       | u16     | NORMAL:f32, POSITION:f32, TEXCOORD_0:f32                 | ١         | 1.27 KB   |
| 15  | CORE_slab_L14              | TRIANGLES | ١              | ٢٠           | ٣٦       | u16     | NORMAL:f32, POSITION:f32, TEXCOORD_0:f32                 | ١         | 1.27 KB   |
| 16  | CORE_slab_L15              | TRIANGLES | ١              | ٢٠           | ٣٦       | u16     | NORMAL:f32, POSITION:f32, TEXCOORD_0:f32                 | ١         | 1.27 KB   |
| 17  | CORE_slab_L16              | TRIANGLES | ١              | ٢٠           | ٣٦       | u16     | NORMAL:f32, POSITION:f32, TEXCOORD_0:f32                 | ١         | 1.27 KB   |
| 18  | CORE_slab_L17              | TRIANGLES | ١              | ٢٠           | ٣٦       | u16     | NORMAL:f32, POSITION:f32, TEXCOORD_0:f32                 | ١         | 1.27 KB   |
| 19  | CORE_slab_L18              | TRIANGLES | ١              | ٢٠           | ٣٦       | u16     | NORMAL:f32, POSITION:f32, TEXCOORD_0:f32                 | ١         | 1.27 KB   |
| 20  | CORE_slab_L19              | TRIANGLES | ١              | ٢٠           | ٣٦       | u16     | NORMAL:f32, POSITION:f32, TEXCOORD_0:f32                 | ١         | 1.27 KB   |
| 21  | CORE_slab_L20              | TRIANGLES | ١              | ٣٦           | ٦٠       | u16     | NORMAL:f32, POSITION:f32, TEXCOORD_0:f32                 | ١         | 2.14 KB   |
| 22  | CORE_slab_L21              | TRIANGLES | ١              | ٣٦           | ٦٠       | u16     | NORMAL:f32, POSITION:f32, TEXCOORD_0:f32                 | ١         | 2.14 KB   |
| 23  | CORE_slab_L22              | TRIANGLES | ١              | ٣٦           | ٦٠       | u16     | NORMAL:f32, POSITION:f32, TEXCOORD_0:f32                 | ١         | 2.14 KB   |
| 24  | CORE_slab_RF               | TRIANGLES | ١              | ٢٠           | ٣٦       | u16     | NORMAL:f32, POSITION:f32, TEXCOORD_0:f32                 | ١         | 1.27 KB   |
| 25  | FAC_crown_light            | TRIANGLES | ١              | ٤٨           | ٩٦       | u16     | NORMAL:f32, POSITION:f32, TEXCOORD_0:f32                 | ١         | 3.36 KB   |
| 26  | FAC_crownband              | TRIANGLES | ١              | ٤٨           | ٩٦       | u16     | NORMAL:f32, POSITION:f32, TEXCOORD_0:f32                 | ١         | 3.36 KB   |
| 27  | FAC_cw_E                   | TRIANGLES | ١              | ١٠           | ٢٠       | u16     | NORMAL:f32, POSITION:f32, TEXCOORD_0:f32, TEXCOORD_1:f32 | ١         | 860 Bytes |
| 28  | FAC_cw_N                   | TRIANGLES | ١              | ٦            | ١٢       | u16     | NORMAL:f32, POSITION:f32, TEXCOORD_0:f32, TEXCOORD_1:f32 | ١         | 516 Bytes |
| 29  | FAC_cw_S                   | TRIANGLES | ١              | ٢٠           | ٤٠       | u16     | NORMAL:f32, POSITION:f32, TEXCOORD_0:f32, TEXCOORD_1:f32 | ١         | 1.72 KB   |
| 30  | FAC_cw_W                   | TRIANGLES | ١              | ١٦           | ٣٢       | u16     | NORMAL:f32, POSITION:f32, TEXCOORD_0:f32, TEXCOORD_1:f32 | ١         | 1.38 KB   |
| 31  | FAC_goldfins               | TRIANGLES | ١              | ٤٨           | ٩٦       | u16     | NORMAL:f32, POSITION:f32, TEXCOORD_0:f32                 | ١         | 3.36 KB   |
| 32  | FAC_mullions               | TRIANGLES | ١              | ١٬١١٠        | ٢٬٢٢٠    | u16     | NORMAL:f32, POSITION:f32, TEXCOORD_0:f32                 | ١         | 77.7 KB   |
| 33  | FAC_podium_glass           | TRIANGLES | ١              | ٦            | ١٢       | u16     | NORMAL:f32, POSITION:f32, TEXCOORD_0:f32, TEXCOORD_1:f32 | ١         | 516 Bytes |
| 34  | POD_canopies               | TRIANGLES | ١              | ٢٤           | ٤٨       | u16     | NORMAL:f32, POSITION:f32, TEXCOORD_0:f32                 | ١         | 1.68 KB   |
| 35  | POD_plinth                 | TRIANGLES | ١              | ١٢           | ٢٤       | u16     | NORMAL:f32, POSITION:f32, TEXCOORD_0:f32                 | ١         | 840 Bytes |
| 36  | POD_roof_frame             | TRIANGLES | ١              | ٧٢           | ١٤٤      | u16     | NORMAL:f32, POSITION:f32, TEXCOORD_0:f32                 | ١         | 5.04 KB   |
| 37  | CTX_blocks                 | TRIANGLES | ١              | ١٬٩٢٠        | ٣٬٨٤٠    | u16     | NORMAL:f32, POSITION:f32, TEXCOORD_0:f32, TEXCOORD_1:f32 | ١         | 165.12 KB |
| 38  | CTX_skydome                | TRIANGLES | ١              | ٥٧٦          | ١٬١٥٢    | u16     | NORMAL:f32, POSITION:f32, TEXCOORD_0:f32                 | ١         | 40.32 KB  |
| 39  | SITE_ground                | TRIANGLES | ١              | ٤٦           | ٤٨       | u16     | NORMAL:f32, POSITION:f32, TEXCOORD_0:f32                 | ١         | 1.81 KB   |
| 40  | SITE_lamp_heads            | TRIANGLES | ١              | ١٢٠          | ٢٤٠      | u16     | NORMAL:f32, POSITION:f32, TEXCOORD_0:f32                 | ١         | 8.4 KB    |
| 41  | SITE_lamp_poles            | TRIANGLES | ١              | ١٢٠          | ٢٤٠      | u16     | NORMAL:f32, POSITION:f32, TEXCOORD_0:f32                 | ١         | 8.4 KB    |
| 42  | SITE_palm_fronds           | TRIANGLES | ١              | ١٠٢          | ٣٠٦      | u16     | NORMAL:f32, POSITION:f32, TEXCOORD_0:f32                 | ١         | 10.4 KB   |
| 43  | SITE_palm_trunks           | TRIANGLES | ١              | ٢٠٤          | ٤٠٨      | u16     | NORMAL:f32, POSITION:f32, TEXCOORD_0:f32                 | ١         | 14.28 KB  |
| 44  | SITE_planting              | TRIANGLES | ١              | ١٧٦          | ٢٨٨      | u16     | NORMAL:f32, POSITION:f32, TEXCOORD_0:f32                 | ١         | 10.27 KB  |
| 45  | SITE_plaza                 | TRIANGLES | ١              | ١٨٨          | ٢٨٨      | u16     | NORMAL:f32, POSITION:f32, TEXCOORD_0:f32                 | ١         | 10.34 KB  |
| 46  | SITE_roads                 | TRIANGLES | ١              | ١٢٢          | ٢٤٤      | u16     | NORMAL:f32, POSITION:f32                                 | ١         | 6.59 KB   |
| 47  | FIRE_alarm_panel_lobby     | TRIANGLES | ١              | ١٩٢          | ٣٣٦      | u16     | NORMAL:f32, POSITION:f32, TEXCOORD_0:f32                 | ١         | 11.9 KB   |
| 48  | FIRE_floor_mains           | TRIANGLES | ١              | ١٬٧٠٤        | ٣٬٤٠٨    | u16     | NORMAL:f32, POSITION:f32, TEXCOORD_0:f32                 | ١         | 119.28 KB |
| 49  | FIRE_pump_room             | TRIANGLES | ١              | ٣٢٤          | ٥٧٦      | u16     | NORMAL:f32, POSITION:f32, TEXCOORD_0:f32                 | ١         | 20.38 KB  |
| 50  | FIRE_sprinkler_risers      | TRIANGLES | ١              | ٤٠           | ٧٢       | u16     | NORMAL:f32, POSITION:f32, TEXCOORD_0:f32                 | ١         | 2.54 KB   |
| 51  | HVAC_ahus_L22              | TRIANGLES | ١              | ٦٠           | ١٢٠      | u16     | NORMAL:f32, POSITION:f32, TEXCOORD_0:f32                 | ١         | 4.2 KB    |
| 52  | HVAC_duct_risers           | TRIANGLES | ١              | ٢٤           | ٤٨       | u16     | NORMAL:f32, POSITION:f32, TEXCOORD_0:f32                 | ١         | 1.68 KB   |
| 53  | HVAC_fcus_L06_L12_L18      | TRIANGLES | ١              | ٦١٢          | ١٬٢٢٤    | u16     | NORMAL:f32, POSITION:f32, TEXCOORD_0:f32                 | ١         | 42.84 KB  |
| 54  | HVAC_roof_plant            | TRIANGLES | ١              | ٦٣٢          | ١٬٠٨٠    | u16     | NORMAL:f32, POSITION:f32, TEXCOORD_0:f32                 | ١         | 38.35 KB  |
| 55  | PLUMB_gf_tanks_boosters    | TRIANGLES | ١              | ٣٢٤          | ٥٧٦      | u16     | NORMAL:f32, POSITION:f32, TEXCOORD_0:f32                 | ١         | 20.38 KB  |
| 56  | PLUMB_risers_stacks        | TRIANGLES | ١              | ٩٢           | ١٦٨      | u16     | NORMAL:f32, POSITION:f32, TEXCOORD_0:f32                 | ١         | 5.93 KB   |
| 57  | PLUMB_roof_tanks           | TRIANGLES | ١              | ٤٨           | ٩٦       | u16     | NORMAL:f32, POSITION:f32, TEXCOORD_0:f32                 | ١         | 3.36 KB   |
| 58  | POWER_cable_risers_DBs     | TRIANGLES | ١              | ٣٠٠          | ٦٠٠      | u16     | NORMAL:f32, POSITION:f32, TEXCOORD_0:f32                 | ١         | 21 KB     |
| 59  | POWER_floor_lighting       | TRIANGLES | ١              | ٩٦           | ١٩٢      | u16     | NORMAL:f32, POSITION:f32, TEXCOORD_0:f32                 | ١         | 6.72 KB   |
| 60  | POWER_generator            | TRIANGLES | ١              | ٥٢           | ٩٦       | u16     | NORMAL:f32, POSITION:f32, TEXCOORD_0:f32                 | ١         | 3.38 KB   |
| 61  | POWER_mv_room_transformers | TRIANGLES | ١              | ٢٨٨          | ٥٧٦      | u16     | NORMAL:f32, POSITION:f32, TEXCOORD_0:f32                 | ١         | 20.16 KB  |
| 62  | SMART_access_control       | TRIANGLES | ١              | ١٢٠          | ٢٤٠      | u16     | NORMAL:f32, POSITION:f32, TEXCOORD_0:f32                 | ١         | 8.4 KB    |
| 63  | SMART_bms_data_room        | TRIANGLES | ١              | ١٨٠          | ٣٦٠      | u16     | NORMAL:f32, POSITION:f32, TEXCOORD_0:f32                 | ١         | 12.6 KB   |
| 64  | SMART_cctv_entrances       | TRIANGLES | ١              | ١٩٢          | ٣٨٤      | u16     | NORMAL:f32, POSITION:f32, TEXCOORD_0:f32                 | ١         | 13.44 KB  |
| 65  | SMART_elv_riser            | TRIANGLES | ١              | ١٢           | ٢٤       | u16     | NORMAL:f32, POSITION:f32, TEXCOORD_0:f32                 | ١         | 840 Bytes |

⁴ size estimates GPU memory required by a mesh, in isolation. If accessors are
  shared by other mesh primitives, but the meshes themselves are not reused, then
  the sum of all mesh sizes will overestimate the asset's total size. See "dedup".



 MATERIALS
 ────────────────────────────────────────────
| #   | name                   | instances | textures                                            | alphaMode | doubleSided |
| --- | ---                    | ---       | ---                                                 | ---       | ---         |
| 0   | MAT_concrete           | ٢٥        | occlusionTexture                                    | BLEND     | ✓           |
| 1   | MAT_crown_light        | ١         | occlusionTexture                                    | BLEND     |             |
| 2   | MAT_crown_glass        | ١         | occlusionTexture                                    | BLEND     |             |
| 3   | MAT_glass_cw           | ٤         | emissiveTexture, occlusionTexture                   | BLEND     | ✓           |
| 4   | MAT_gold_fin           | ١         | occlusionTexture                                    | BLEND     |             |
| 5   | MAT_mullion            | ١         | occlusionTexture                                    | BLEND     |             |
| 6   | MAT_podium_glass       | ١         | emissiveTexture, occlusionTexture                   | BLEND     | ✓           |
| 7   | MAT_gold_podium        | ٢         | occlusionTexture                                    | OPAQUE    |             |
| 8   | MAT_stone              | ١         | occlusionTexture                                    | OPAQUE    |             |
| 9   | MAT_city               | ١         | baseColorTexture, emissiveTexture, occlusionTexture | OPAQUE    |             |
| 10  | MAT_sky                | ١         | emissiveTexture                                     | OPAQUE    |             |
| 11  | MAT_ground             | ١         | emissiveTexture                                     | OPAQUE    |             |
| 12  | MAT_lamp_head          | ١         | occlusionTexture                                    | OPAQUE    |             |
| 13  | MAT_lamp_pole          | ١         | occlusionTexture                                    | OPAQUE    |             |
| 14  | MAT_palm_frond         | ١         | occlusionTexture                                    | OPAQUE    | ✓           |
| 15  | MAT_palm_trunk         | ١         | occlusionTexture                                    | OPAQUE    |             |
| 16  | MAT_planting           | ١         | occlusionTexture                                    | OPAQUE    |             |
| 17  | MAT_paving             | ١         | occlusionTexture                                    | OPAQUE    |             |
| 18  | MAT_asphalt            | ١         |                                                     | OPAQUE    |             |
| 19  | MAT_fire_highlight     | ٤         |                                                     | OPAQUE    |             |
| 20  | MAT_fire_metal         | ٤         | occlusionTexture                                    | OPAQUE    |             |
| 21  | MAT_hvac_highlight     | ٤         |                                                     | OPAQUE    |             |
| 22  | MAT_hvac_metal         | ٤         | occlusionTexture                                    | OPAQUE    |             |
| 23  | MAT_plumbing_highlight | ٣         |                                                     | OPAQUE    |             |
| 24  | MAT_plumbing_metal     | ٣         | occlusionTexture                                    | OPAQUE    |             |
| 25  | MAT_power_highlight    | ٤         |                                                     | OPAQUE    |             |
| 26  | MAT_power_metal        | ٤         | occlusionTexture                                    | OPAQUE    |             |
| 27  | MAT_smart_highlight    | ٤         |                                                     | OPAQUE    |             |
| 28  | MAT_smart_metal        | ٤         | occlusionTexture                                    | OPAQUE    |             |



 TEXTURES
 ────────────────────────────────────────────
| #   | name              | uri | slots            | instances | mimeType   | compression | resolution | size      | gpuSize⁵  |
| --- | ---               | --- | ---              | ---       | ---        | ---         | ---        | ---       | ---       |
| 0   | LM_arch           |     | occlusionTexture | ٩         | image/jpeg |             | 2048x2048  | 576.93 KB | 22.37 MB  |
| 1   | tex_cw_emit       |     | emissiveTexture  | ١         | image/jpeg |             | 2048x1536  | 386.03 KB | 16.78 MB  |
| 2   | tex_podium_emit   |     | emissiveTexture  | ١         | image/jpeg |             | 1024x384   | 47.97 KB  | 2.1 MB    |
| 3   | tex_city_emit     |     | emissiveTexture  | ١         | image/jpeg |             | 512x512    | 10.4 KB   | 1.4 MB    |
| 4   | LM_context        |     | occlusionTexture | ١         | image/jpeg |             | 1024x1024  | 256.52 KB | 5.59 MB   |
| 5   | tex_city_base     |     | baseColorTexture | ١         | image/jpeg |             | 512x512    | 16.92 KB  | 1.4 MB    |
| 6   | tex_sky           |     | emissiveTexture  | ١         | image/jpeg |             | 512x256    | 4.58 KB   | 699.05 KB |
| 7   | tex_ground_lights |     | emissiveTexture  | ١         | image/jpeg |             | 1024x1024  | 89.02 KB  | 5.59 MB   |
| 8   | LM_site           |     | occlusionTexture | ٦         | image/jpeg |             | 1024x1024  | 127.54 KB | 5.59 MB   |
| 9   | LM_systems        |     | occlusionTexture | ٥         | image/jpeg |             | 1024x1024  | 261.65 KB | 5.59 MB   |

⁵ gpuSize estimates minimum VRAM memory allocation. Older devices may require
  additional memory for GPU compression formats.



 ANIMATIONS
 ────────────────────────────────────────────
No animations found.

