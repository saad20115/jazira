
 OVERVIEW
 ────────────────────────────────────────────
| key                | value                                                                                                                                                                         |
| ---                | ---                                                                                                                                                                           |
| version            | 2.0                                                                                                                                                                           |
| generator          | glTF-Transform v4.5.1                                                                                                                                                         |
| extensionsUsed     | EXT_mesh_gpu_instancing, EXT_meshopt_compression, KHR_materials_clearcoat, KHR_materials_emissive_strength, KHR_materials_variants, KHR_mesh_quantization, KHR_texture_basisu |
| extensionsRequired | EXT_meshopt_compression, KHR_mesh_quantization, KHR_texture_basisu                                                                                                            |



 SCENES
 ────────────────────────────────────────────
| #   | name  | rootName | bboxMin                      | bboxMax                          | renderVertexCount¹ | uploadVertexCount | uploadNaiveVertexCount |
| --- | ---   | ---      | ---                          | ---                              | ---                | ---               | ---                    |
| 0   | Scene | CAMERAS  | -801.20001, -660, -796.09998 | 798.79999, 1096.20734, 803.90002 | ٢٩٩٬٣٥٢            | ٨٩٬٤٠١            | ٨٩٬٥٠١                 |

¹ Expected number of vertices processed by the vertex shader for one render
  pass, without considering the vertex cache.

² Expected number of vertices uploaded to GPU, assuming each Accessor
  is uploaded only once. Actual number uploaded may be higher, 
  dependent on the implementation and vertex buffer layout.

³ Expected number of vertices uploaded to GPU, assuming each Primitive
  is uploaded once, duplicating vertex attributes shared among Primitives.



 MESHES
 ────────────────────────────────────────────
| #   | name             | mode      | meshPrimitives | glPrimitives | vertices | indices | attributes                                                                   | instances | size¹     |
| --- | ---              | ---       | ---            | ---          | ---      | ---     | ---                                                                          | ---       | ---       |
| 0   | MAQ_glow_dusk    | TRIANGLES | ١              | ٢٬٣٠٤        | ٤٬٦٠٨    | u16     | NORMAL:i16_norm, POSITION:i16_norm, TEXCOORD_0:u16_norm                      | ١         | 87.55 KB  |
| 1   | MAQ_room         | TRIANGLES | ١              | ١٠٬١١٢       | ٥٬٧٢٨    | u16     | NORMAL:i16_norm, POSITION:i16_norm, TEXCOORD_0:u16_norm                      | ١         | 152.32 KB |
| 2   | MAQ_softbox_fill | TRIANGLES | ١              | ٢٢           | ٢٤       | u16     | NORMAL:i16_norm, POSITION:i16_norm                                           | ١         | 420 Bytes |
| 3   | MAQ_softbox_key  | TRIANGLES | ١              | ٢٢           | ٢٤       | u16     | NORMAL:i16_norm, POSITION:i16_norm                                           | ١         | 420 Bytes |
| 4   | MAQ_softbox_sky  | TRIANGLES | ١              | ٢٢           | ٢٤       | u16     | NORMAL:i16_norm, POSITION:i16_norm                                           | ١         | 420 Bytes |
| 5   | CORE_core        | TRIANGLES | ١              | ٦٩٦          | ١٬١٣٦    | u16     | NORMAL:i16_norm, POSITION:i16_norm, TEXCOORD_0:u16_norm                      | ١         | 22.35 KB  |
| 6   | CORE_plantpads   | TRIANGLES | ١              | ٤٨           | ٩٦       | u16     | NORMAL:i16_norm, POSITION:i16_norm, TEXCOORD_0:u16_norm                      | ١         | 1.82 KB   |
| 7   | CORE_slab_GF     | TRIANGLES | ١              | ٣٢           | ٥٢       | u16     | NORMAL:i16_norm, POSITION:i16_norm, TEXCOORD_0:u16_norm                      | ١         | 1.02 KB   |
| 8   | CORE_slab_L01    | TRIANGLES | ١              | ٣٢           | ٥٢       | u16     | NORMAL:i16_norm, POSITION:i16_norm, TEXCOORD_0:u16_norm                      | ١         | 1.02 KB   |
| 9   | CORE_slab_L22    | TRIANGLES | ١              | ٤٠           | ٦٤       | u16     | NORMAL:i16_norm, POSITION:i16_norm, TEXCOORD_0:u16_norm                      | ١         | 1.26 KB   |
| 10  | CORE_slab_RF     | TRIANGLES | ١              | ٤٠           | ٦٤       | u16     | NORMAL:i16_norm, POSITION:i16_norm, TEXCOORD_0:u16_norm                      | ١         | 1.26 KB   |
| 11  | FAC_crown_light  | TRIANGLES | ١              | ٢٦٨          | ٥٣٦      | u16     | NORMAL:i16_norm, POSITION:i16_norm, TEXCOORD_0:u16_norm, TEXCOORD_1:u16_norm | ١         | 12.33 KB  |
| 12  | FAC_cw_E         | TRIANGLES | ١              | ٢٨           | ٥٦       | u16     | NORMAL:i16_norm, POSITION:i16_norm, TEXCOORD_0:u16_norm, TEXCOORD_1:u16_norm | ١         | 1.29 KB   |
| 13  | FAC_cw_N         | TRIANGLES | ١              | ٢٨           | ٥٦       | u16     | NORMAL:i16_norm, POSITION:i16_norm, TEXCOORD_0:f32, TEXCOORD_1:u16_norm      | ١         | 1.51 KB   |
| 14  | FAC_cw_S         | TRIANGLES | ١              | ١٢           | ٢٤       | u16     | NORMAL:i16_norm, POSITION:i16_norm, TEXCOORD_0:f32, TEXCOORD_1:u16_norm      | ١         | 648 Bytes |
| 15  | FAC_cw_terrace   | TRIANGLES | ١              | ٢٠           | ٤٠       | u16     | NORMAL:i16_norm, POSITION:i16_norm, TEXCOORD_0:f32, TEXCOORD_1:u16_norm      | ١         | 1.08 KB   |
| 16  | FAC_cw_W         | TRIANGLES | ١              | ١٢           | ٢٤       | u16     | NORMAL:i16_norm, POSITION:i16_norm, TEXCOORD_0:f32, TEXCOORD_1:u16_norm      | ١         | 648 Bytes |
| 17  | FAC_cw_wing      | TRIANGLES | ١              | ٣٦           | ٧٢       | u16     | NORMAL:i16_norm, POSITION:i16_norm, TEXCOORD_0:f32, TEXCOORD_1:u16_norm      | ١         | 1.94 KB   |
| 18  | FAC_goldfins     | TRIANGLES | ١              | ٢١٦          | ٤٣٢      | u16     | NORMAL:i16_norm, POSITION:i16_norm, TEXCOORD_0:f32, TEXCOORD_1:f32           | ١         | 13.39 KB  |
| 19  | FAC_mullions     | TRIANGLES | ١              | ٧٬٢٦٠        | ١٤٬٥٢٠   | u16     | COLOR_0:u8_norm, NORMAL:i16_norm, POSITION:i16_norm, TEXCOORD_0:u16_norm     | ١         | 319.44 KB |
| 20  | FAC_podium_glass | TRIANGLES | ١              | ٤            | ٨        | u16     | NORMAL:i16_norm, POSITION:i16_norm, TEXCOORD_0:f32, TEXCOORD_1:u16_norm      | ١         | 216 Bytes |
| 21  | POD_canopies     | TRIANGLES | ١              | ٢٤           | ٤٨       | u16     | NORMAL:i16_norm, POSITION:i16_norm, TEXCOORD_0:u16_norm                      | ١         | 912 Bytes |
| 22  | POD_fascia       | TRIANGLES | ١              | ٤٨           | ٩٦       | u16     | NORMAL:i16_norm, POSITION:i16_norm, TEXCOORD_0:f32, TEXCOORD_1:u16_norm      | ١         | 2.59 KB   |
| 23  | POD_plinth       | TRIANGLES | ١              | ١٢           | ٢٤       | u16     | NORMAL:i16_norm, POSITION:i16_norm, TEXCOORD_0:u16_norm                      | ١         | 456 Bytes |
| 24  | MAQ_plinth       | TRIANGLES | ٢              | ٧٩٨          | ٦٤٣      | u16     | NORMAL:i16_norm, POSITION:i16_norm, TEXCOORD_0:u16_norm                      | ١         | 15.08 KB  |
| 25  | MAQ_rim          | TRIANGLES | ١              | ٩٦٠          | ١٬٦٠٢    | u16     | NORMAL:i16_norm, POSITION:i16_norm, TEXCOORD_0:u16_norm                      | ١         | 31.39 KB  |
| 26  | VEG_bollard      | TRIANGLES | ١              | ٢٨           | ٤٨       | u16     | NORMAL:i16_norm, POSITION:i16_norm                                           | ١         | 744 Bytes |
| 27  | VEG_bollard_head | TRIANGLES | ١              | ٢٨           | ٤٨       | u16     | NORMAL:i16_norm, POSITION:i16_norm                                           | ١         | 744 Bytes |
| 28  | VEG_lamp_head    | TRIANGLES | ١              | ١٢           | ٢٤       | u16     | NORMAL:i16_norm, POSITION:i16_norm                                           | ١         | 360 Bytes |
| 29  | VEG_lamp_pole    | TRIANGLES | ١              | ٣٢           | ٦٠       | u16     | NORMAL:i16_norm, POSITION:i16_norm                                           | ١         | 912 Bytes |
| 30  | VEG_palmA        | TRIANGLES | ١              | ٦١٦          | ١٬٢٣٢    | u16     | NORMAL:i16_norm, POSITION:i16_norm, TEXCOORD_0:u16_norm                      | ١         | 23.41 KB  |
| 31  | VEG_palmB        | TRIANGLES | ١              | ٥٤٤          | ١٬٠٨٨    | u16     | NORMAL:i16_norm, POSITION:i16_norm, TEXCOORD_0:u16_norm                      | ١         | 20.67 KB  |
| 32  | VEG_palmD        | TRIANGLES | ١              | ٦٦٤          | ١٬٣٢٨    | u16     | NORMAL:i16_norm, POSITION:i16_norm, TEXCOORD_0:u16_norm                      | ١         | 25.23 KB  |
| 33  | VEG_treeC        | TRIANGLES | ١              | ١٨٠          | ٥١٦      | u16     | NORMAL:i16_norm, POSITION:i16_norm, TEXCOORD_0:u16_norm                      | ١         | 9.34 KB   |
| 34  | SITE_planting    | TRIANGLES | ١              | ١٬٠٦٨        | ١٬٦٦٨    | u16     | NORMAL:i16_norm, POSITION:i16_norm, TEXCOORD_0:u16_norm                      | ١         | 33.1 KB   |
| 35  | SITE_plaza       | TRIANGLES | ١              | ١٨٨          | ٢٨٨      | u16     | NORMAL:i16_norm, POSITION:i16_norm, TEXCOORD_0:u16_norm                      | ١         | 5.74 KB   |
| 36  | SITE_roads       | TRIANGLES | ١              | ١٤٤          | ٢٨٨      | u16     | COLOR_0:u8_norm, NORMAL:i16_norm, POSITION:i16_norm                          | ١         | 5.47 KB   |
| 37  | FIRE_equipment   | TRIANGLES | ١              | ٧٬٠١٦        | ١٣٬٠٣٦   | u16     | COLOR_0:u8_norm, NORMAL:i16_norm, POSITION:i16_norm, TEXCOORD_0:u16_norm     | ١         | 289.78 KB |
| 38  | FIRE_glow        | TRIANGLES | ١              | ٣٦٠          | ٧٢٠      | u16     | NORMAL:i16_norm, POSITION:i16_norm, TEXCOORD_0:u16_norm, TEXCOORD_1:u16_norm | ١         | 16.56 KB  |
| 39  | HVAC_equipment   | TRIANGLES | ١              | ٦٬٧١٦        | ١٢٬٨١٦   | u16     | COLOR_0:u8_norm, NORMAL:i16_norm, POSITION:i16_norm, TEXCOORD_0:u16_norm     | ١         | 283.8 KB  |
| 40  | HVAC_fans        | TRIANGLES | ١              | ١٩٦          | ٢٢٤      | u16     | NORMAL:i16_norm, POSITION:i16_norm, TEXCOORD_0:u16_norm, TEXCOORD_1:u16_norm | ١         | 5.66 KB   |
| 41  | HVAC_glow        | TRIANGLES | ١              | ٢٤٠          | ٤٨٠      | u16     | NORMAL:i16_norm, POSITION:i16_norm, TEXCOORD_0:u16_norm, TEXCOORD_1:u16_norm | ١         | 11.04 KB  |
| 42  | PLUMB_equipment  | TRIANGLES | ١              | ٤٬٥٥٢        | ٨٬٣١٢    | u16     | COLOR_0:u8_norm, NORMAL:i16_norm, POSITION:i16_norm, TEXCOORD_0:u16_norm     | ١         | 185.24 KB |
| 43  | PLUMB_glow       | TRIANGLES | ١              | ١٠٨          | ٢١٦      | u16     | NORMAL:i16_norm, POSITION:i16_norm, TEXCOORD_0:u16_norm, TEXCOORD_1:u16_norm | ١         | 4.97 KB   |
| 44  | POWER_equipment  | TRIANGLES | ١              | ٤٬٣٦٠        | ٨٬٦٦٤    | u16     | COLOR_0:u8_norm, NORMAL:i16_norm, POSITION:i16_norm, TEXCOORD_0:u16_norm     | ١         | 190.78 KB |
| 45  | POWER_glow       | TRIANGLES | ١              | ٤٤٤          | ٨٨٨      | u16     | NORMAL:i16_norm, POSITION:i16_norm, TEXCOORD_0:u16_norm, TEXCOORD_1:u16_norm | ١         | 20.42 KB  |
| 46  | SMART_equipment  | TRIANGLES | ١              | ٣٬١١٢        | ٦٬٠٦٤    | u16     | COLOR_0:u8_norm, NORMAL:i16_norm, POSITION:i16_norm, TEXCOORD_0:u16_norm     | ١         | 133.89 KB |
| 47  | SMART_glow       | TRIANGLES | ١              | ٧٢٠          | ١٬٤٤٠    | u16     | NORMAL:i16_norm, POSITION:i16_norm, TEXCOORD_0:u16_norm, TEXCOORD_1:u16_norm | ١         | 33.12 KB  |

⁴ size estimates GPU memory required by a mesh, in isolation. If accessors are
  shared by other mesh primitives, but the meshes themselves are not reused, then
  the sum of all mesh sizes will overestimate the asset's total size. See "dedup".



 MATERIALS
 ────────────────────────────────────────────
| #   | name                   | instances | textures                                                    | alphaMode | doubleSided |
| --- | ---                    | ---       | ---                                                         | ---       | ---         |
| 0   | MAT_sky_env            | ١         | emissiveTexture                                             | OPAQUE    | ✓           |
| 1   | MAT_room               | ١         | emissiveTexture                                             | OPAQUE    | ✓           |
| 2   | MAT_softbox            | ٣         |                                                             | OPAQUE    | ✓           |
| 3   | MAT_concrete           | ٢         | occlusionTexture                                            | BLEND     | ✓           |
| 4   | MAT_concrete_floor     | ٤         | emissiveTexture, occlusionTexture                           | BLEND     | ✓           |
| 5   | MAT_crown_light        | ١         | emissiveTexture, occlusionTexture                           | BLEND     | ✓           |
| 6   | MAT_glass_side         | ١         | emissiveTexture, occlusionTexture, metallicRoughnessTexture | BLEND     | ✓           |
| 7   | MAT_glass_cw           | ٣         | emissiveTexture, occlusionTexture, metallicRoughnessTexture | BLEND     | ✓           |
| 8   | MAT_glass_terrace      | ١         | emissiveTexture, occlusionTexture, metallicRoughnessTexture | BLEND     | ✓           |
| 9   | MAT_glass_wing         | ١         | emissiveTexture, occlusionTexture, metallicRoughnessTexture | BLEND     | ✓           |
| 10  | MAT_gold_fin           | ٢         | emissiveTexture, occlusionTexture                           | BLEND     | ✓           |
| 11  | MAT_mullion            | ١         | occlusionTexture                                            | BLEND     |             |
| 12  | MAT_podium_glass       | ١         | emissiveTexture, occlusionTexture                           | BLEND     | ✓           |
| 13  | MAT_bronze             | ١         | emissiveTexture, occlusionTexture                           | OPAQUE    |             |
| 14  | MAT_stone              | ١         | emissiveTexture, occlusionTexture                           | OPAQUE    |             |
| 15  | MAT_plinth_top         | ١         | emissiveTexture                                             | OPAQUE    | ✓           |
| 16  | MAT_plinth_side        | ٢         | emissiveTexture                                             | OPAQUE    | ✓           |
| 17  | MAT_lamp_pole          | ٢         |                                                             | OPAQUE    |             |
| 18  | MAT_lamp_head          | ٢         |                                                             | OPAQUE    |             |
| 19  | MAT_vegetation         | ٤         | baseColorTexture                                            | MASK      | ✓           |
| 20  | MAT_planting           | ١         | emissiveTexture, occlusionTexture                           | OPAQUE    |             |
| 21  | MAT_paving             | ١         | emissiveTexture, occlusionTexture                           | OPAQUE    |             |
| 22  | MAT_asphalt            | ١         |                                                             | BLEND     |             |
| 23  | MAT_fire_highlight     | ١         | emissiveTexture                                             | OPAQUE    |             |
| 24  | MAT_fire_metal         | ١         | occlusionTexture                                            | OPAQUE    |             |
| 25  | MAT_fire_glow          | ١         | emissiveTexture, occlusionTexture                           | OPAQUE    |             |
| 26  | MAT_hvac_highlight     | ١         | emissiveTexture                                             | OPAQUE    |             |
| 27  | MAT_hvac_metal         | ١         | occlusionTexture                                            | OPAQUE    |             |
| 28  | MAT_hvac_fans          | ١         | baseColorTexture, occlusionTexture                          | MASK      |             |
| 29  | MAT_hvac_glow          | ١         | emissiveTexture, occlusionTexture                           | OPAQUE    |             |
| 30  | MAT_plumbing_highlight | ١         | emissiveTexture                                             | OPAQUE    |             |
| 31  | MAT_plumbing_metal     | ١         | occlusionTexture                                            | OPAQUE    |             |
| 32  | MAT_plumbing_glow      | ١         | emissiveTexture, occlusionTexture                           | OPAQUE    |             |
| 33  | MAT_power_highlight    | ١         | emissiveTexture                                             | OPAQUE    |             |
| 34  | MAT_power_metal        | ١         | occlusionTexture                                            | OPAQUE    |             |
| 35  | MAT_power_glow         | ١         | emissiveTexture, occlusionTexture                           | OPAQUE    |             |
| 36  | MAT_smart_highlight    | ١         | emissiveTexture                                             | OPAQUE    |             |
| 37  | MAT_smart_metal        | ١         | occlusionTexture                                            | OPAQUE    |             |
| 38  | MAT_smart_glow         | ١         | emissiveTexture, occlusionTexture                           | OPAQUE    |             |



 TEXTURES
 ────────────────────────────────────────────
| #   | name               | uri | slots                    | instances | mimeType   | compression | resolution | size      | gpuSize⁵   |
| --- | ---                | --- | ---                      | ---       | ---        | ---         | ---        | ---       | ---        |
| 0   | tex_roomlight_sky  |     | emissiveTexture          | ١         | image/ktx2 | UASTC       | 512x256    | 9.37 KB   | 174.8 KB   |
| 1   | tex_roomlight      |     | emissiveTexture          | ١         | image/ktx2 | UASTC       | 512x512    | 155.52 KB | 349.55 KB  |
| 2   | LM_arch            |     | occlusionTexture         | ٩         | image/ktx2 | ETC1S       | 1024x1024  | 250.29 KB | 699.05 KB  |
| 3   | tex_slablight      |     | emissiveTexture          | ١         | image/ktx2 | ETC1S       | 1024x1024  | 16.86 KB  | 699.05 KB  |
| 4   | tex_black          |     | occlusionTexture         | ٥         | image/ktx2 | ETC1S       | 4x4        | 467 Bytes | 10.5 Bytes |
| 5   | tex_glow_palette   |     | emissiveTexture          | ٦         | image/ktx2 | ETC1S       | 128x16     | 954 Bytes | 1.37 KB    |
| 6   | tex_cw_emit_night  |     | emissiveTexture          | ٤         | image/ktx2 | ETC1S       | 2048x1536  | 192.66 KB | 2.1 MB     |
| 7   | tex_cw_mr          |     | metallicRoughnessTexture | ٤         | image/ktx2 | UASTC       | 64x24      | 594 Bytes | 2.13 KB    |
| 8   | tex_pilaster_wash  |     | emissiveTexture          | ١         | image/ktx2 | UASTC       | 8x128      | 1.42 KB   | 1.55 KB    |
| 9   | tex_podium_emit    |     | emissiveTexture          | ١         | image/ktx2 | ETC1S       | 1024x384   | 45.77 KB  | 262.14 KB  |
| 10  | tex_sitelight      |     | emissiveTexture          | ٤         | image/ktx2 | ETC1S       | 1024x1024  | 120.09 KB | 699.05 KB  |
| 11  | tex_plinthlight    |     | emissiveTexture          | ٢         | image/ktx2 | ETC1S       | 1024x1024  | 90.3 KB   | 699.05 KB  |
| 12  | tex_vegetation     |     | baseColorTexture         | ١         | image/ktx2 | ETC1S       | 512x512    | 107.72 KB | 349.52 KB  |
| 13  | tex_sys_shade_lite |     | emissiveTexture          | ٥         | image/ktx2 | ETC1S       | 512x512    | 42.24 KB  | 174.76 KB  |
| 14  | LM_systems_lite    |     | occlusionTexture         | ١١        | image/ktx2 | ETC1S       | 1024x1024  | 131.13 KB | 699.05 KB  |
| 15  | tex_hvac_fans      |     | baseColorTexture         | ١         | image/ktx2 | ETC1S       | 256x256    | 9.9 KB    | 87.38 KB   |

⁵ gpuSize estimates minimum VRAM memory allocation. Older devices may require
  additional memory for GPU compression formats.



 ANIMATIONS
 ────────────────────────────────────────────
No animations found.

