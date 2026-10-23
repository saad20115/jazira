import { type MigrateDownArgs, type MigrateUpArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TYPE "public"."enum_site_settings_social_platform" AS ENUM('linkedin', 'x', 'instagram', 'facebook', 'youtube', 'tiktok', 'snapchat', 'whatsapp');
  CREATE TYPE "public"."enum_link_type" AS ENUM('internal', 'external');
  CREATE TYPE "public"."enum_link_internal_route" AS ENUM('/', '/services', '/about', '/projects', '/contact', '/privacy', 'custom');
  CREATE TYPE "public"."enum_hp_int_sys_disc" AS ENUM('mep', 'hvac', 'fire-fighting', 'plumbing', 'electrical', 'low-current', 'data-center', 'civil');
  CREATE TYPE "public"."enum_hp_int_sys_shot" AS ENUM('hvac', 'fire', 'plumbing', 'power', 'smart');
  CREATE TYPE "public"."enum_home_page_status" AS ENUM('draft', 'published');
  CREATE TYPE "public"."enum__home_page_v_version_status" AS ENUM('draft', 'published');
  CREATE TYPE "public"."enum__home_page_v_published_locale" AS ENUM('ar', 'en');
  CREATE TYPE "public"."enum_services_page_status" AS ENUM('draft', 'published');
  CREATE TYPE "public"."enum__services_page_v_version_status" AS ENUM('draft', 'published');
  CREATE TYPE "public"."enum__services_page_v_published_locale" AS ENUM('ar', 'en');
  CREATE TYPE "public"."enum_about_page_status" AS ENUM('draft', 'published');
  CREATE TYPE "public"."enum__about_page_v_version_status" AS ENUM('draft', 'published');
  CREATE TYPE "public"."enum__about_page_v_published_locale" AS ENUM('ar', 'en');
  CREATE TYPE "public"."enum_projects_page_status" AS ENUM('draft', 'published');
  CREATE TYPE "public"."enum__projects_page_v_version_status" AS ENUM('draft', 'published');
  CREATE TYPE "public"."enum__projects_page_v_published_locale" AS ENUM('ar', 'en');
  CREATE TYPE "public"."enum_contact_page_status" AS ENUM('draft', 'published');
  CREATE TYPE "public"."enum__contact_page_v_version_status" AS ENUM('draft', 'published');
  CREATE TYPE "public"."enum__contact_page_v_published_locale" AS ENUM('ar', 'en');
  CREATE TYPE "public"."enum_privacy_page_status" AS ENUM('draft', 'published');
  CREATE TYPE "public"."enum__privacy_page_v_version_status" AS ENUM('draft', 'published');
  CREATE TYPE "public"."enum__privacy_page_v_published_locale" AS ENUM('ar', 'en');
  CREATE TABLE "site_socials" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"platform" "enum_site_settings_social_platform" NOT NULL,
  	"url" varchar NOT NULL
  );
  
  CREATE TABLE "site_settings" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"email" varchar DEFAULT 'info@aljazira.co' NOT NULL,
  	"phone" varchar DEFAULT '+966 57 353 4185' NOT NULL,
  	"whatsapp" varchar DEFAULT '966573534185' NOT NULL,
  	"map_url" varchar,
  	"office_map_image_id" integer,
  	"office_map_url" varchar,
  	"default_seo_image_id" integer,
  	"updated_at" timestamp(3) with time zone,
  	"created_at" timestamp(3) with time zone
  );
  
  CREATE TABLE "site_settings_locales" (
  	"company_name" varchar DEFAULT 'Al Jazira for Imdad Smart Co.' NOT NULL,
  	"tagline" varchar,
  	"whatsapp_label" varchar,
  	"address" varchar,
  	"working_hours" varchar,
  	"office_title" varchar,
  	"office_address" varchar,
  	"footer_text" varchar,
  	"copyright" varchar,
  	"default_seo_title" varchar,
  	"default_seo_description" varchar,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" integer NOT NULL
  );
  
  CREATE TABLE "nav_header" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"link_type" "enum_link_type" DEFAULT 'internal' NOT NULL,
  	"link_internal_route" "enum_link_internal_route" DEFAULT '/',
  	"link_internal_path" varchar,
  	"link_url" varchar,
  	"link_new_tab" boolean DEFAULT false
  );
  
  CREATE TABLE "nav_header_locales" (
  	"label" varchar NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" varchar NOT NULL
  );
  
  CREATE TABLE "nav_ft_links" (
  	"_order" integer NOT NULL,
  	"_parent_id" varchar NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"link_type" "enum_link_type" DEFAULT 'internal' NOT NULL,
  	"link_internal_route" "enum_link_internal_route" DEFAULT '/',
  	"link_internal_path" varchar,
  	"link_url" varchar,
  	"link_new_tab" boolean DEFAULT false
  );
  
  CREATE TABLE "nav_ft_links_locales" (
  	"label" varchar NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" varchar NOT NULL
  );
  
  CREATE TABLE "nav_footer" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL
  );
  
  CREATE TABLE "nav_footer_locales" (
  	"title" varchar NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" varchar NOT NULL
  );
  
  CREATE TABLE "navigation" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"header_cta_link_type" "enum_link_type" DEFAULT 'internal',
  	"header_cta_link_internal_route" "enum_link_internal_route" DEFAULT '/',
  	"header_cta_link_internal_path" varchar,
  	"header_cta_link_url" varchar,
  	"header_cta_link_new_tab" boolean DEFAULT false,
  	"footer_cta_button_link_type" "enum_link_type" DEFAULT 'internal',
  	"footer_cta_button_link_internal_route" "enum_link_internal_route" DEFAULT '/',
  	"footer_cta_button_link_internal_path" varchar,
  	"footer_cta_button_link_url" varchar,
  	"footer_cta_button_link_new_tab" boolean DEFAULT false,
  	"updated_at" timestamp(3) with time zone,
  	"created_at" timestamp(3) with time zone
  );
  
  CREATE TABLE "navigation_locales" (
  	"header_cta_label" varchar,
  	"footer_cta_title" varchar,
  	"footer_cta_text" varchar,
  	"footer_cta_button_label" varchar,
  	"footer_cta_whatsapp_label" varchar,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" integer NOT NULL
  );
  
  CREATE TABLE "navigation_rels" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"order" integer,
  	"parent_id" integer NOT NULL,
  	"path" varchar NOT NULL,
  	"services_id" integer,
  	"projects_id" integer
  );
  
  CREATE TABLE "hp_int_sys_disc" (
  	"order" integer NOT NULL,
  	"parent_id" varchar NOT NULL,
  	"value" "enum_hp_int_sys_disc",
  	"id" serial PRIMARY KEY NOT NULL
  );
  
  CREATE TABLE "hp_int_sys" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"shot" "enum_hp_int_sys_shot"
  );
  
  CREATE TABLE "hp_int_sys_locales" (
  	"title" varchar,
  	"text" varchar,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" varchar NOT NULL
  );
  
  CREATE TABLE "home_page" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"hero_enabled" boolean DEFAULT true,
  	"hero_background_id" integer,
  	"hero_background_video_id" integer,
  	"hero_primary_cta_link_type" "enum_link_type" DEFAULT 'internal',
  	"hero_primary_cta_link_internal_route" "enum_link_internal_route" DEFAULT '/',
  	"hero_primary_cta_link_internal_path" varchar,
  	"hero_primary_cta_link_url" varchar,
  	"hero_primary_cta_link_new_tab" boolean DEFAULT false,
  	"hero_secondary_cta_link_type" "enum_link_type" DEFAULT 'internal',
  	"hero_secondary_cta_link_internal_route" "enum_link_internal_route" DEFAULT '/',
  	"hero_secondary_cta_link_internal_path" varchar,
  	"hero_secondary_cta_link_url" varchar,
  	"hero_secondary_cta_link_new_tab" boolean DEFAULT false,
  	"who_we_are_enabled" boolean DEFAULT true,
  	"who_we_are_badge_stat_id" integer,
  	"who_we_are_button_link_type" "enum_link_type" DEFAULT 'internal',
  	"who_we_are_button_link_internal_route" "enum_link_internal_route" DEFAULT '/',
  	"who_we_are_button_link_internal_path" varchar,
  	"who_we_are_button_link_url" varchar,
  	"who_we_are_button_link_new_tab" boolean DEFAULT false,
  	"who_we_are_image_id" integer,
  	"core_services_enabled" boolean DEFAULT true,
  	"core_services_button_link_type" "enum_link_type" DEFAULT 'internal',
  	"core_services_button_link_internal_route" "enum_link_internal_route" DEFAULT '/',
  	"core_services_button_link_internal_path" varchar,
  	"core_services_button_link_url" varchar,
  	"core_services_button_link_new_tab" boolean DEFAULT false,
  	"interactive_systems_enabled" boolean DEFAULT true,
  	"interactive_systems_hero_image_id" integer,
  	"stats_section_enabled" boolean DEFAULT true,
  	"featured_projects_enabled" boolean DEFAULT true,
  	"featured_projects_button_link_type" "enum_link_type" DEFAULT 'internal',
  	"featured_projects_button_link_internal_route" "enum_link_internal_route" DEFAULT '/',
  	"featured_projects_button_link_internal_path" varchar,
  	"featured_projects_button_link_url" varchar,
  	"featured_projects_button_link_new_tab" boolean DEFAULT false,
  	"partners_enabled" boolean DEFAULT true,
  	"cta_enabled" boolean DEFAULT true,
  	"cta_button_link_type" "enum_link_type" DEFAULT 'internal',
  	"cta_button_link_internal_route" "enum_link_internal_route" DEFAULT '/',
  	"cta_button_link_internal_path" varchar,
  	"cta_button_link_url" varchar,
  	"cta_button_link_new_tab" boolean DEFAULT false,
  	"cta_secondary_button_link_type" "enum_link_type" DEFAULT 'internal',
  	"cta_secondary_button_link_internal_route" "enum_link_internal_route" DEFAULT '/',
  	"cta_secondary_button_link_internal_path" varchar,
  	"cta_secondary_button_link_url" varchar,
  	"cta_secondary_button_link_new_tab" boolean DEFAULT false,
  	"cta_background_image_id" integer,
  	"_status" "enum_home_page_status" DEFAULT 'draft',
  	"updated_at" timestamp(3) with time zone,
  	"created_at" timestamp(3) with time zone
  );
  
  CREATE TABLE "home_page_locales" (
  	"hero_eyebrow" varchar,
  	"hero_title" varchar,
  	"hero_subtitle" varchar,
  	"hero_primary_cta_label" varchar,
  	"hero_secondary_cta_label" varchar,
  	"who_we_are_eyebrow" varchar,
  	"who_we_are_title" varchar,
  	"who_we_are_text" jsonb,
  	"who_we_are_button_label" varchar,
  	"core_services_eyebrow" varchar,
  	"core_services_title" varchar,
  	"core_services_intro" varchar,
  	"core_services_button_label" varchar,
  	"interactive_systems_eyebrow" varchar,
  	"interactive_systems_title" varchar,
  	"interactive_systems_intro" varchar,
  	"interactive_systems_related_projects_label" varchar,
  	"interactive_systems_live_model_label" varchar,
  	"stats_section_title" varchar,
  	"stats_section_text" varchar,
  	"featured_projects_eyebrow" varchar,
  	"featured_projects_title" varchar,
  	"featured_projects_intro" varchar,
  	"featured_projects_button_label" varchar,
  	"partners_eyebrow" varchar,
  	"partners_title" varchar,
  	"partners_intro" varchar,
  	"cta_title" varchar,
  	"cta_text" varchar,
  	"cta_button_label" varchar,
  	"cta_secondary_button_label" varchar,
  	"meta_title" varchar,
  	"meta_description" varchar,
  	"meta_image_id" integer,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" integer NOT NULL
  );
  
  CREATE TABLE "home_page_rels" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"order" integer,
  	"parent_id" integer NOT NULL,
  	"path" varchar NOT NULL,
  	"services_id" integer,
  	"projects_id" integer,
  	"stats_id" integer
  );
  
  CREATE TABLE "_hp_int_sys_disc_v" (
  	"order" integer NOT NULL,
  	"parent_id" integer NOT NULL,
  	"value" "enum_hp_int_sys_disc",
  	"id" serial PRIMARY KEY NOT NULL
  );
  
  CREATE TABLE "_hp_int_sys_v" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"shot" "enum_hp_int_sys_shot",
  	"_uuid" varchar
  );
  
  CREATE TABLE "_hp_int_sys_v_locales" (
  	"title" varchar,
  	"text" varchar,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" integer NOT NULL
  );
  
  CREATE TABLE "_home_page_v" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"version_hero_enabled" boolean DEFAULT true,
  	"version_hero_background_id" integer,
  	"version_hero_background_video_id" integer,
  	"version_hero_primary_cta_link_type" "enum_link_type" DEFAULT 'internal',
  	"version_hero_primary_cta_link_internal_route" "enum_link_internal_route" DEFAULT '/',
  	"version_hero_primary_cta_link_internal_path" varchar,
  	"version_hero_primary_cta_link_url" varchar,
  	"version_hero_primary_cta_link_new_tab" boolean DEFAULT false,
  	"version_hero_secondary_cta_link_type" "enum_link_type" DEFAULT 'internal',
  	"version_hero_secondary_cta_link_internal_route" "enum_link_internal_route" DEFAULT '/',
  	"version_hero_secondary_cta_link_internal_path" varchar,
  	"version_hero_secondary_cta_link_url" varchar,
  	"version_hero_secondary_cta_link_new_tab" boolean DEFAULT false,
  	"version_who_we_are_enabled" boolean DEFAULT true,
  	"version_who_we_are_badge_stat_id" integer,
  	"version_who_we_are_button_link_type" "enum_link_type" DEFAULT 'internal',
  	"version_who_we_are_button_link_internal_route" "enum_link_internal_route" DEFAULT '/',
  	"version_who_we_are_button_link_internal_path" varchar,
  	"version_who_we_are_button_link_url" varchar,
  	"version_who_we_are_button_link_new_tab" boolean DEFAULT false,
  	"version_who_we_are_image_id" integer,
  	"version_core_services_enabled" boolean DEFAULT true,
  	"version_core_services_button_link_type" "enum_link_type" DEFAULT 'internal',
  	"version_core_services_button_link_internal_route" "enum_link_internal_route" DEFAULT '/',
  	"version_core_services_button_link_internal_path" varchar,
  	"version_core_services_button_link_url" varchar,
  	"version_core_services_button_link_new_tab" boolean DEFAULT false,
  	"version_interactive_systems_enabled" boolean DEFAULT true,
  	"version_interactive_systems_hero_image_id" integer,
  	"version_stats_section_enabled" boolean DEFAULT true,
  	"version_featured_projects_enabled" boolean DEFAULT true,
  	"version_featured_projects_button_link_type" "enum_link_type" DEFAULT 'internal',
  	"version_featured_projects_button_link_internal_route" "enum_link_internal_route" DEFAULT '/',
  	"version_featured_projects_button_link_internal_path" varchar,
  	"version_featured_projects_button_link_url" varchar,
  	"version_featured_projects_button_link_new_tab" boolean DEFAULT false,
  	"version_partners_enabled" boolean DEFAULT true,
  	"version_cta_enabled" boolean DEFAULT true,
  	"version_cta_button_link_type" "enum_link_type" DEFAULT 'internal',
  	"version_cta_button_link_internal_route" "enum_link_internal_route" DEFAULT '/',
  	"version_cta_button_link_internal_path" varchar,
  	"version_cta_button_link_url" varchar,
  	"version_cta_button_link_new_tab" boolean DEFAULT false,
  	"version_cta_secondary_button_link_type" "enum_link_type" DEFAULT 'internal',
  	"version_cta_secondary_button_link_internal_route" "enum_link_internal_route" DEFAULT '/',
  	"version_cta_secondary_button_link_internal_path" varchar,
  	"version_cta_secondary_button_link_url" varchar,
  	"version_cta_secondary_button_link_new_tab" boolean DEFAULT false,
  	"version_cta_background_image_id" integer,
  	"version__status" "enum__home_page_v_version_status" DEFAULT 'draft',
  	"version_updated_at" timestamp(3) with time zone,
  	"version_created_at" timestamp(3) with time zone,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"snapshot" boolean,
  	"published_locale" "enum__home_page_v_published_locale",
  	"latest" boolean,
  	"autosave" boolean
  );
  
  CREATE TABLE "_home_page_v_locales" (
  	"version_hero_eyebrow" varchar,
  	"version_hero_title" varchar,
  	"version_hero_subtitle" varchar,
  	"version_hero_primary_cta_label" varchar,
  	"version_hero_secondary_cta_label" varchar,
  	"version_who_we_are_eyebrow" varchar,
  	"version_who_we_are_title" varchar,
  	"version_who_we_are_text" jsonb,
  	"version_who_we_are_button_label" varchar,
  	"version_core_services_eyebrow" varchar,
  	"version_core_services_title" varchar,
  	"version_core_services_intro" varchar,
  	"version_core_services_button_label" varchar,
  	"version_interactive_systems_eyebrow" varchar,
  	"version_interactive_systems_title" varchar,
  	"version_interactive_systems_intro" varchar,
  	"version_interactive_systems_related_projects_label" varchar,
  	"version_interactive_systems_live_model_label" varchar,
  	"version_stats_section_title" varchar,
  	"version_stats_section_text" varchar,
  	"version_featured_projects_eyebrow" varchar,
  	"version_featured_projects_title" varchar,
  	"version_featured_projects_intro" varchar,
  	"version_featured_projects_button_label" varchar,
  	"version_partners_eyebrow" varchar,
  	"version_partners_title" varchar,
  	"version_partners_intro" varchar,
  	"version_cta_title" varchar,
  	"version_cta_text" varchar,
  	"version_cta_button_label" varchar,
  	"version_cta_secondary_button_label" varchar,
  	"version_meta_title" varchar,
  	"version_meta_description" varchar,
  	"version_meta_image_id" integer,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" integer NOT NULL
  );
  
  CREATE TABLE "_home_page_v_rels" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"order" integer,
  	"parent_id" integer NOT NULL,
  	"path" varchar NOT NULL,
  	"services_id" integer,
  	"projects_id" integer,
  	"stats_id" integer
  );
  
  CREATE TABLE "sp_proc_steps" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL
  );
  
  CREATE TABLE "sp_proc_steps_locales" (
  	"title" varchar,
  	"text" varchar,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" varchar NOT NULL
  );
  
  CREATE TABLE "services_page" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"page_header_enabled" boolean DEFAULT true,
  	"page_header_image_id" integer,
  	"services_intro_enabled" boolean DEFAULT true,
  	"specialist_enabled" boolean DEFAULT true,
  	"materials_enabled" boolean DEFAULT true,
  	"process_enabled" boolean DEFAULT true,
  	"cta_enabled" boolean DEFAULT true,
  	"cta_button_link_type" "enum_link_type" DEFAULT 'internal',
  	"cta_button_link_internal_route" "enum_link_internal_route" DEFAULT '/',
  	"cta_button_link_internal_path" varchar,
  	"cta_button_link_url" varchar,
  	"cta_button_link_new_tab" boolean DEFAULT false,
  	"cta_secondary_button_link_type" "enum_link_type" DEFAULT 'internal',
  	"cta_secondary_button_link_internal_route" "enum_link_internal_route" DEFAULT '/',
  	"cta_secondary_button_link_internal_path" varchar,
  	"cta_secondary_button_link_url" varchar,
  	"cta_secondary_button_link_new_tab" boolean DEFAULT false,
  	"cta_background_image_id" integer,
  	"_status" "enum_services_page_status" DEFAULT 'draft',
  	"updated_at" timestamp(3) with time zone,
  	"created_at" timestamp(3) with time zone
  );
  
  CREATE TABLE "services_page_locales" (
  	"page_header_title" varchar,
  	"page_header_subtitle" varchar,
  	"services_intro_eyebrow" varchar,
  	"services_intro_title" varchar,
  	"services_intro_intro" varchar,
  	"specialist_eyebrow" varchar,
  	"specialist_title" varchar,
  	"specialist_intro" varchar,
  	"materials_eyebrow" varchar,
  	"materials_title" varchar,
  	"materials_intro" varchar,
  	"process_eyebrow" varchar,
  	"process_title" varchar,
  	"process_intro" varchar,
  	"cta_title" varchar,
  	"cta_text" varchar,
  	"cta_button_label" varchar,
  	"cta_secondary_button_label" varchar,
  	"meta_title" varchar,
  	"meta_description" varchar,
  	"meta_image_id" integer,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" integer NOT NULL
  );
  
  CREATE TABLE "services_page_rels" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"order" integer,
  	"parent_id" integer NOT NULL,
  	"path" varchar NOT NULL,
  	"services_id" integer,
  	"projects_id" integer
  );
  
  CREATE TABLE "_sp_proc_steps_v" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_uuid" varchar
  );
  
  CREATE TABLE "_sp_proc_steps_v_locales" (
  	"title" varchar,
  	"text" varchar,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" integer NOT NULL
  );
  
  CREATE TABLE "_services_page_v" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"version_page_header_enabled" boolean DEFAULT true,
  	"version_page_header_image_id" integer,
  	"version_services_intro_enabled" boolean DEFAULT true,
  	"version_specialist_enabled" boolean DEFAULT true,
  	"version_materials_enabled" boolean DEFAULT true,
  	"version_process_enabled" boolean DEFAULT true,
  	"version_cta_enabled" boolean DEFAULT true,
  	"version_cta_button_link_type" "enum_link_type" DEFAULT 'internal',
  	"version_cta_button_link_internal_route" "enum_link_internal_route" DEFAULT '/',
  	"version_cta_button_link_internal_path" varchar,
  	"version_cta_button_link_url" varchar,
  	"version_cta_button_link_new_tab" boolean DEFAULT false,
  	"version_cta_secondary_button_link_type" "enum_link_type" DEFAULT 'internal',
  	"version_cta_secondary_button_link_internal_route" "enum_link_internal_route" DEFAULT '/',
  	"version_cta_secondary_button_link_internal_path" varchar,
  	"version_cta_secondary_button_link_url" varchar,
  	"version_cta_secondary_button_link_new_tab" boolean DEFAULT false,
  	"version_cta_background_image_id" integer,
  	"version__status" "enum__services_page_v_version_status" DEFAULT 'draft',
  	"version_updated_at" timestamp(3) with time zone,
  	"version_created_at" timestamp(3) with time zone,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"snapshot" boolean,
  	"published_locale" "enum__services_page_v_published_locale",
  	"latest" boolean,
  	"autosave" boolean
  );
  
  CREATE TABLE "_services_page_v_locales" (
  	"version_page_header_title" varchar,
  	"version_page_header_subtitle" varchar,
  	"version_services_intro_eyebrow" varchar,
  	"version_services_intro_title" varchar,
  	"version_services_intro_intro" varchar,
  	"version_specialist_eyebrow" varchar,
  	"version_specialist_title" varchar,
  	"version_specialist_intro" varchar,
  	"version_materials_eyebrow" varchar,
  	"version_materials_title" varchar,
  	"version_materials_intro" varchar,
  	"version_process_eyebrow" varchar,
  	"version_process_title" varchar,
  	"version_process_intro" varchar,
  	"version_cta_title" varchar,
  	"version_cta_text" varchar,
  	"version_cta_button_label" varchar,
  	"version_cta_secondary_button_label" varchar,
  	"version_meta_title" varchar,
  	"version_meta_description" varchar,
  	"version_meta_image_id" integer,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" integer NOT NULL
  );
  
  CREATE TABLE "_services_page_v_rels" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"order" integer,
  	"parent_id" integer NOT NULL,
  	"path" varchar NOT NULL,
  	"services_id" integer,
  	"projects_id" integer
  );
  
  CREATE TABLE "ap_str_items" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL
  );
  
  CREATE TABLE "ap_str_items_locales" (
  	"title" varchar,
  	"text" varchar,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" varchar NOT NULL
  );
  
  CREATE TABLE "ap_miss_pil" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL
  );
  
  CREATE TABLE "ap_miss_pil_locales" (
  	"title" varchar,
  	"text" varchar,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" varchar NOT NULL
  );
  
  CREATE TABLE "ap_vis_pil" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL
  );
  
  CREATE TABLE "ap_vis_pil_locales" (
  	"title" varchar,
  	"text" varchar,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" varchar NOT NULL
  );
  
  CREATE TABLE "about_page" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"page_header_enabled" boolean DEFAULT true,
  	"page_header_image_id" integer,
  	"story_enabled" boolean DEFAULT true,
  	"story_badge_stat_id" integer,
  	"story_image_id" integer,
  	"strengths_enabled" boolean DEFAULT true,
  	"mission_vision_enabled" boolean DEFAULT true,
  	"mission_vision_mission_image_id" integer,
  	"mission_vision_vision_image_id" integer,
  	"mission_vision_image_id" integer,
  	"team_enabled" boolean DEFAULT true,
  	"_status" "enum_about_page_status" DEFAULT 'draft',
  	"updated_at" timestamp(3) with time zone,
  	"created_at" timestamp(3) with time zone
  );
  
  CREATE TABLE "about_page_locales" (
  	"page_header_title" varchar,
  	"page_header_subtitle" varchar,
  	"story_eyebrow" varchar,
  	"story_title" varchar,
  	"story_text" jsonb,
  	"story_quote" varchar,
  	"story_quote_author" varchar,
  	"strengths_eyebrow" varchar,
  	"strengths_title" varchar,
  	"strengths_intro" varchar,
  	"mission_vision_eyebrow" varchar,
  	"mission_vision_title" varchar,
  	"mission_vision_intro" varchar,
  	"mission_vision_mission_eyebrow" varchar,
  	"mission_vision_mission_title" varchar,
  	"mission_vision_mission_text" varchar,
  	"mission_vision_vision_eyebrow" varchar,
  	"mission_vision_vision_title" varchar,
  	"mission_vision_vision_text" varchar,
  	"team_eyebrow" varchar,
  	"team_title" varchar,
  	"team_intro" varchar,
  	"team_staff_title" varchar,
  	"team_staff_text" varchar,
  	"meta_title" varchar,
  	"meta_description" varchar,
  	"meta_image_id" integer,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" integer NOT NULL
  );
  
  CREATE TABLE "_ap_str_items_v" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_uuid" varchar
  );
  
  CREATE TABLE "_ap_str_items_v_locales" (
  	"title" varchar,
  	"text" varchar,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" integer NOT NULL
  );
  
  CREATE TABLE "_ap_miss_pil_v" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_uuid" varchar
  );
  
  CREATE TABLE "_ap_miss_pil_v_locales" (
  	"title" varchar,
  	"text" varchar,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" integer NOT NULL
  );
  
  CREATE TABLE "_ap_vis_pil_v" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_uuid" varchar
  );
  
  CREATE TABLE "_ap_vis_pil_v_locales" (
  	"title" varchar,
  	"text" varchar,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" integer NOT NULL
  );
  
  CREATE TABLE "_about_page_v" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"version_page_header_enabled" boolean DEFAULT true,
  	"version_page_header_image_id" integer,
  	"version_story_enabled" boolean DEFAULT true,
  	"version_story_badge_stat_id" integer,
  	"version_story_image_id" integer,
  	"version_strengths_enabled" boolean DEFAULT true,
  	"version_mission_vision_enabled" boolean DEFAULT true,
  	"version_mission_vision_mission_image_id" integer,
  	"version_mission_vision_vision_image_id" integer,
  	"version_mission_vision_image_id" integer,
  	"version_team_enabled" boolean DEFAULT true,
  	"version__status" "enum__about_page_v_version_status" DEFAULT 'draft',
  	"version_updated_at" timestamp(3) with time zone,
  	"version_created_at" timestamp(3) with time zone,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"snapshot" boolean,
  	"published_locale" "enum__about_page_v_published_locale",
  	"latest" boolean,
  	"autosave" boolean
  );
  
  CREATE TABLE "_about_page_v_locales" (
  	"version_page_header_title" varchar,
  	"version_page_header_subtitle" varchar,
  	"version_story_eyebrow" varchar,
  	"version_story_title" varchar,
  	"version_story_text" jsonb,
  	"version_story_quote" varchar,
  	"version_story_quote_author" varchar,
  	"version_strengths_eyebrow" varchar,
  	"version_strengths_title" varchar,
  	"version_strengths_intro" varchar,
  	"version_mission_vision_eyebrow" varchar,
  	"version_mission_vision_title" varchar,
  	"version_mission_vision_intro" varchar,
  	"version_mission_vision_mission_eyebrow" varchar,
  	"version_mission_vision_mission_title" varchar,
  	"version_mission_vision_mission_text" varchar,
  	"version_mission_vision_vision_eyebrow" varchar,
  	"version_mission_vision_vision_title" varchar,
  	"version_mission_vision_vision_text" varchar,
  	"version_team_eyebrow" varchar,
  	"version_team_title" varchar,
  	"version_team_intro" varchar,
  	"version_team_staff_title" varchar,
  	"version_team_staff_text" varchar,
  	"version_meta_title" varchar,
  	"version_meta_description" varchar,
  	"version_meta_image_id" integer,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" integer NOT NULL
  );
  
  CREATE TABLE "projects_page" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"page_header_enabled" boolean DEFAULT true,
  	"page_header_image_id" integer,
  	"impact_enabled" boolean DEFAULT true,
  	"portfolio_enabled" boolean DEFAULT true,
  	"portfolio_badge_stat_id" integer,
  	"portfolio_image_id" integer,
  	"cta_enabled" boolean DEFAULT true,
  	"cta_button_link_type" "enum_link_type" DEFAULT 'internal',
  	"cta_button_link_internal_route" "enum_link_internal_route" DEFAULT '/',
  	"cta_button_link_internal_path" varchar,
  	"cta_button_link_url" varchar,
  	"cta_button_link_new_tab" boolean DEFAULT false,
  	"cta_secondary_button_link_type" "enum_link_type" DEFAULT 'internal',
  	"cta_secondary_button_link_internal_route" "enum_link_internal_route" DEFAULT '/',
  	"cta_secondary_button_link_internal_path" varchar,
  	"cta_secondary_button_link_url" varchar,
  	"cta_secondary_button_link_new_tab" boolean DEFAULT false,
  	"cta_background_image_id" integer,
  	"_status" "enum_projects_page_status" DEFAULT 'draft',
  	"updated_at" timestamp(3) with time zone,
  	"created_at" timestamp(3) with time zone
  );
  
  CREATE TABLE "projects_page_locales" (
  	"page_header_title" varchar,
  	"page_header_subtitle" varchar,
  	"impact_title" varchar,
  	"impact_text" varchar,
  	"portfolio_eyebrow" varchar,
  	"portfolio_title" varchar,
  	"portfolio_text" jsonb,
  	"portfolio_quote" varchar,
  	"portfolio_quote_author" varchar,
  	"cta_title" varchar,
  	"cta_text" varchar,
  	"cta_button_label" varchar,
  	"cta_secondary_button_label" varchar,
  	"meta_title" varchar,
  	"meta_description" varchar,
  	"meta_image_id" integer,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" integer NOT NULL
  );
  
  CREATE TABLE "projects_page_rels" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"order" integer,
  	"parent_id" integer NOT NULL,
  	"path" varchar NOT NULL,
  	"stats_id" integer,
  	"services_id" integer,
  	"projects_id" integer
  );
  
  CREATE TABLE "_projects_page_v" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"version_page_header_enabled" boolean DEFAULT true,
  	"version_page_header_image_id" integer,
  	"version_impact_enabled" boolean DEFAULT true,
  	"version_portfolio_enabled" boolean DEFAULT true,
  	"version_portfolio_badge_stat_id" integer,
  	"version_portfolio_image_id" integer,
  	"version_cta_enabled" boolean DEFAULT true,
  	"version_cta_button_link_type" "enum_link_type" DEFAULT 'internal',
  	"version_cta_button_link_internal_route" "enum_link_internal_route" DEFAULT '/',
  	"version_cta_button_link_internal_path" varchar,
  	"version_cta_button_link_url" varchar,
  	"version_cta_button_link_new_tab" boolean DEFAULT false,
  	"version_cta_secondary_button_link_type" "enum_link_type" DEFAULT 'internal',
  	"version_cta_secondary_button_link_internal_route" "enum_link_internal_route" DEFAULT '/',
  	"version_cta_secondary_button_link_internal_path" varchar,
  	"version_cta_secondary_button_link_url" varchar,
  	"version_cta_secondary_button_link_new_tab" boolean DEFAULT false,
  	"version_cta_background_image_id" integer,
  	"version__status" "enum__projects_page_v_version_status" DEFAULT 'draft',
  	"version_updated_at" timestamp(3) with time zone,
  	"version_created_at" timestamp(3) with time zone,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"snapshot" boolean,
  	"published_locale" "enum__projects_page_v_published_locale",
  	"latest" boolean,
  	"autosave" boolean
  );
  
  CREATE TABLE "_projects_page_v_locales" (
  	"version_page_header_title" varchar,
  	"version_page_header_subtitle" varchar,
  	"version_impact_title" varchar,
  	"version_impact_text" varchar,
  	"version_portfolio_eyebrow" varchar,
  	"version_portfolio_title" varchar,
  	"version_portfolio_text" jsonb,
  	"version_portfolio_quote" varchar,
  	"version_portfolio_quote_author" varchar,
  	"version_cta_title" varchar,
  	"version_cta_text" varchar,
  	"version_cta_button_label" varchar,
  	"version_cta_secondary_button_label" varchar,
  	"version_meta_title" varchar,
  	"version_meta_description" varchar,
  	"version_meta_image_id" integer,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" integer NOT NULL
  );
  
  CREATE TABLE "_projects_page_v_rels" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"order" integer,
  	"parent_id" integer NOT NULL,
  	"path" varchar NOT NULL,
  	"stats_id" integer,
  	"services_id" integer,
  	"projects_id" integer
  );
  
  CREATE TABLE "contact_page" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"page_header_enabled" boolean DEFAULT true,
  	"page_header_image_id" integer,
  	"get_in_touch_enabled" boolean DEFAULT true,
  	"find_office_enabled" boolean DEFAULT true,
  	"_status" "enum_contact_page_status" DEFAULT 'draft',
  	"updated_at" timestamp(3) with time zone,
  	"created_at" timestamp(3) with time zone
  );
  
  CREATE TABLE "contact_page_locales" (
  	"page_header_title" varchar,
  	"page_header_subtitle" varchar,
  	"get_in_touch_eyebrow" varchar,
  	"get_in_touch_title" varchar,
  	"get_in_touch_intro" varchar,
  	"find_office_eyebrow" varchar,
  	"find_office_title" varchar,
  	"find_office_intro" varchar,
  	"meta_title" varchar,
  	"meta_description" varchar,
  	"meta_image_id" integer,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" integer NOT NULL
  );
  
  CREATE TABLE "_contact_page_v" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"version_page_header_enabled" boolean DEFAULT true,
  	"version_page_header_image_id" integer,
  	"version_get_in_touch_enabled" boolean DEFAULT true,
  	"version_find_office_enabled" boolean DEFAULT true,
  	"version__status" "enum__contact_page_v_version_status" DEFAULT 'draft',
  	"version_updated_at" timestamp(3) with time zone,
  	"version_created_at" timestamp(3) with time zone,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"snapshot" boolean,
  	"published_locale" "enum__contact_page_v_published_locale",
  	"latest" boolean,
  	"autosave" boolean
  );
  
  CREATE TABLE "_contact_page_v_locales" (
  	"version_page_header_title" varchar,
  	"version_page_header_subtitle" varchar,
  	"version_get_in_touch_eyebrow" varchar,
  	"version_get_in_touch_title" varchar,
  	"version_get_in_touch_intro" varchar,
  	"version_find_office_eyebrow" varchar,
  	"version_find_office_title" varchar,
  	"version_find_office_intro" varchar,
  	"version_meta_title" varchar,
  	"version_meta_description" varchar,
  	"version_meta_image_id" integer,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" integer NOT NULL
  );
  
  CREATE TABLE "privacy_page" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"page_header_enabled" boolean DEFAULT true,
  	"page_header_image_id" integer,
  	"enabled" boolean DEFAULT true,
  	"_status" "enum_privacy_page_status" DEFAULT 'draft',
  	"updated_at" timestamp(3) with time zone,
  	"created_at" timestamp(3) with time zone
  );
  
  CREATE TABLE "privacy_page_locales" (
  	"page_header_title" varchar,
  	"page_header_subtitle" varchar,
  	"body" jsonb,
  	"meta_title" varchar,
  	"meta_description" varchar,
  	"meta_image_id" integer,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" integer NOT NULL
  );
  
  CREATE TABLE "privacy_page_rels" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"order" integer,
  	"parent_id" integer NOT NULL,
  	"path" varchar NOT NULL,
  	"media_id" integer
  );
  
  CREATE TABLE "_privacy_page_v" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"version_page_header_enabled" boolean DEFAULT true,
  	"version_page_header_image_id" integer,
  	"version_enabled" boolean DEFAULT true,
  	"version__status" "enum__privacy_page_v_version_status" DEFAULT 'draft',
  	"version_updated_at" timestamp(3) with time zone,
  	"version_created_at" timestamp(3) with time zone,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"snapshot" boolean,
  	"published_locale" "enum__privacy_page_v_published_locale",
  	"latest" boolean,
  	"autosave" boolean
  );
  
  CREATE TABLE "_privacy_page_v_locales" (
  	"version_page_header_title" varchar,
  	"version_page_header_subtitle" varchar,
  	"version_body" jsonb,
  	"version_meta_title" varchar,
  	"version_meta_description" varchar,
  	"version_meta_image_id" integer,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" integer NOT NULL
  );
  
  CREATE TABLE "_privacy_page_v_rels" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"order" integer,
  	"parent_id" integer NOT NULL,
  	"path" varchar NOT NULL,
  	"media_id" integer
  );
  
  ALTER TABLE "site_socials" ADD CONSTRAINT "site_socials_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."site_settings"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "site_settings" ADD CONSTRAINT "site_settings_office_map_image_id_media_id_fk" FOREIGN KEY ("office_map_image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "site_settings" ADD CONSTRAINT "site_settings_default_seo_image_id_media_id_fk" FOREIGN KEY ("default_seo_image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "site_settings_locales" ADD CONSTRAINT "site_settings_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."site_settings"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "nav_header" ADD CONSTRAINT "nav_header_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."navigation"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "nav_header_locales" ADD CONSTRAINT "nav_header_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."nav_header"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "nav_ft_links" ADD CONSTRAINT "nav_ft_links_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."nav_footer"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "nav_ft_links_locales" ADD CONSTRAINT "nav_ft_links_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."nav_ft_links"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "nav_footer" ADD CONSTRAINT "nav_footer_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."navigation"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "nav_footer_locales" ADD CONSTRAINT "nav_footer_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."nav_footer"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "navigation_locales" ADD CONSTRAINT "navigation_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."navigation"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "navigation_rels" ADD CONSTRAINT "navigation_rels_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."navigation"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "navigation_rels" ADD CONSTRAINT "navigation_rels_services_fk" FOREIGN KEY ("services_id") REFERENCES "public"."services"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "navigation_rels" ADD CONSTRAINT "navigation_rels_projects_fk" FOREIGN KEY ("projects_id") REFERENCES "public"."projects"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "hp_int_sys_disc" ADD CONSTRAINT "hp_int_sys_disc_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."hp_int_sys"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "hp_int_sys" ADD CONSTRAINT "hp_int_sys_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."home_page"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "hp_int_sys_locales" ADD CONSTRAINT "hp_int_sys_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."hp_int_sys"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "home_page" ADD CONSTRAINT "home_page_hero_background_id_media_id_fk" FOREIGN KEY ("hero_background_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "home_page" ADD CONSTRAINT "home_page_hero_background_video_id_videos_id_fk" FOREIGN KEY ("hero_background_video_id") REFERENCES "public"."videos"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "home_page" ADD CONSTRAINT "home_page_who_we_are_badge_stat_id_stats_id_fk" FOREIGN KEY ("who_we_are_badge_stat_id") REFERENCES "public"."stats"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "home_page" ADD CONSTRAINT "home_page_who_we_are_image_id_media_id_fk" FOREIGN KEY ("who_we_are_image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "home_page" ADD CONSTRAINT "home_page_interactive_systems_hero_image_id_media_id_fk" FOREIGN KEY ("interactive_systems_hero_image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "home_page" ADD CONSTRAINT "home_page_cta_background_image_id_media_id_fk" FOREIGN KEY ("cta_background_image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "home_page_locales" ADD CONSTRAINT "home_page_locales_meta_image_id_media_id_fk" FOREIGN KEY ("meta_image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "home_page_locales" ADD CONSTRAINT "home_page_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."home_page"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "home_page_rels" ADD CONSTRAINT "home_page_rels_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."home_page"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "home_page_rels" ADD CONSTRAINT "home_page_rels_services_fk" FOREIGN KEY ("services_id") REFERENCES "public"."services"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "home_page_rels" ADD CONSTRAINT "home_page_rels_projects_fk" FOREIGN KEY ("projects_id") REFERENCES "public"."projects"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "home_page_rels" ADD CONSTRAINT "home_page_rels_stats_fk" FOREIGN KEY ("stats_id") REFERENCES "public"."stats"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_hp_int_sys_disc_v" ADD CONSTRAINT "_hp_int_sys_disc_v_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."_hp_int_sys_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_hp_int_sys_v" ADD CONSTRAINT "_hp_int_sys_v_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_home_page_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_hp_int_sys_v_locales" ADD CONSTRAINT "_hp_int_sys_v_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_hp_int_sys_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_home_page_v" ADD CONSTRAINT "_home_page_v_version_hero_background_id_media_id_fk" FOREIGN KEY ("version_hero_background_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_home_page_v" ADD CONSTRAINT "_home_page_v_version_hero_background_video_id_videos_id_fk" FOREIGN KEY ("version_hero_background_video_id") REFERENCES "public"."videos"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_home_page_v" ADD CONSTRAINT "_home_page_v_version_who_we_are_badge_stat_id_stats_id_fk" FOREIGN KEY ("version_who_we_are_badge_stat_id") REFERENCES "public"."stats"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_home_page_v" ADD CONSTRAINT "_home_page_v_version_who_we_are_image_id_media_id_fk" FOREIGN KEY ("version_who_we_are_image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_home_page_v" ADD CONSTRAINT "_home_page_v_version_interactive_systems_hero_image_id_media_id_fk" FOREIGN KEY ("version_interactive_systems_hero_image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_home_page_v" ADD CONSTRAINT "_home_page_v_version_cta_background_image_id_media_id_fk" FOREIGN KEY ("version_cta_background_image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_home_page_v_locales" ADD CONSTRAINT "_home_page_v_locales_version_meta_image_id_media_id_fk" FOREIGN KEY ("version_meta_image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_home_page_v_locales" ADD CONSTRAINT "_home_page_v_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_home_page_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_home_page_v_rels" ADD CONSTRAINT "_home_page_v_rels_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."_home_page_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_home_page_v_rels" ADD CONSTRAINT "_home_page_v_rels_services_fk" FOREIGN KEY ("services_id") REFERENCES "public"."services"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_home_page_v_rels" ADD CONSTRAINT "_home_page_v_rels_projects_fk" FOREIGN KEY ("projects_id") REFERENCES "public"."projects"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_home_page_v_rels" ADD CONSTRAINT "_home_page_v_rels_stats_fk" FOREIGN KEY ("stats_id") REFERENCES "public"."stats"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "sp_proc_steps" ADD CONSTRAINT "sp_proc_steps_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."services_page"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "sp_proc_steps_locales" ADD CONSTRAINT "sp_proc_steps_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."sp_proc_steps"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "services_page" ADD CONSTRAINT "services_page_page_header_image_id_media_id_fk" FOREIGN KEY ("page_header_image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "services_page" ADD CONSTRAINT "services_page_cta_background_image_id_media_id_fk" FOREIGN KEY ("cta_background_image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "services_page_locales" ADD CONSTRAINT "services_page_locales_meta_image_id_media_id_fk" FOREIGN KEY ("meta_image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "services_page_locales" ADD CONSTRAINT "services_page_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."services_page"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "services_page_rels" ADD CONSTRAINT "services_page_rels_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."services_page"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "services_page_rels" ADD CONSTRAINT "services_page_rels_services_fk" FOREIGN KEY ("services_id") REFERENCES "public"."services"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "services_page_rels" ADD CONSTRAINT "services_page_rels_projects_fk" FOREIGN KEY ("projects_id") REFERENCES "public"."projects"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_sp_proc_steps_v" ADD CONSTRAINT "_sp_proc_steps_v_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_services_page_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_sp_proc_steps_v_locales" ADD CONSTRAINT "_sp_proc_steps_v_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_sp_proc_steps_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_services_page_v" ADD CONSTRAINT "_services_page_v_version_page_header_image_id_media_id_fk" FOREIGN KEY ("version_page_header_image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_services_page_v" ADD CONSTRAINT "_services_page_v_version_cta_background_image_id_media_id_fk" FOREIGN KEY ("version_cta_background_image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_services_page_v_locales" ADD CONSTRAINT "_services_page_v_locales_version_meta_image_id_media_id_fk" FOREIGN KEY ("version_meta_image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_services_page_v_locales" ADD CONSTRAINT "_services_page_v_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_services_page_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_services_page_v_rels" ADD CONSTRAINT "_services_page_v_rels_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."_services_page_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_services_page_v_rels" ADD CONSTRAINT "_services_page_v_rels_services_fk" FOREIGN KEY ("services_id") REFERENCES "public"."services"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_services_page_v_rels" ADD CONSTRAINT "_services_page_v_rels_projects_fk" FOREIGN KEY ("projects_id") REFERENCES "public"."projects"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "ap_str_items" ADD CONSTRAINT "ap_str_items_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."about_page"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "ap_str_items_locales" ADD CONSTRAINT "ap_str_items_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."ap_str_items"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "ap_miss_pil" ADD CONSTRAINT "ap_miss_pil_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."about_page"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "ap_miss_pil_locales" ADD CONSTRAINT "ap_miss_pil_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."ap_miss_pil"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "ap_vis_pil" ADD CONSTRAINT "ap_vis_pil_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."about_page"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "ap_vis_pil_locales" ADD CONSTRAINT "ap_vis_pil_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."ap_vis_pil"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "about_page" ADD CONSTRAINT "about_page_page_header_image_id_media_id_fk" FOREIGN KEY ("page_header_image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "about_page" ADD CONSTRAINT "about_page_story_badge_stat_id_stats_id_fk" FOREIGN KEY ("story_badge_stat_id") REFERENCES "public"."stats"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "about_page" ADD CONSTRAINT "about_page_story_image_id_media_id_fk" FOREIGN KEY ("story_image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "about_page" ADD CONSTRAINT "about_page_mission_vision_mission_image_id_media_id_fk" FOREIGN KEY ("mission_vision_mission_image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "about_page" ADD CONSTRAINT "about_page_mission_vision_vision_image_id_media_id_fk" FOREIGN KEY ("mission_vision_vision_image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "about_page" ADD CONSTRAINT "about_page_mission_vision_image_id_media_id_fk" FOREIGN KEY ("mission_vision_image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "about_page_locales" ADD CONSTRAINT "about_page_locales_meta_image_id_media_id_fk" FOREIGN KEY ("meta_image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "about_page_locales" ADD CONSTRAINT "about_page_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."about_page"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_ap_str_items_v" ADD CONSTRAINT "_ap_str_items_v_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_about_page_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_ap_str_items_v_locales" ADD CONSTRAINT "_ap_str_items_v_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_ap_str_items_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_ap_miss_pil_v" ADD CONSTRAINT "_ap_miss_pil_v_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_about_page_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_ap_miss_pil_v_locales" ADD CONSTRAINT "_ap_miss_pil_v_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_ap_miss_pil_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_ap_vis_pil_v" ADD CONSTRAINT "_ap_vis_pil_v_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_about_page_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_ap_vis_pil_v_locales" ADD CONSTRAINT "_ap_vis_pil_v_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_ap_vis_pil_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_about_page_v" ADD CONSTRAINT "_about_page_v_version_page_header_image_id_media_id_fk" FOREIGN KEY ("version_page_header_image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_about_page_v" ADD CONSTRAINT "_about_page_v_version_story_badge_stat_id_stats_id_fk" FOREIGN KEY ("version_story_badge_stat_id") REFERENCES "public"."stats"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_about_page_v" ADD CONSTRAINT "_about_page_v_version_story_image_id_media_id_fk" FOREIGN KEY ("version_story_image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_about_page_v" ADD CONSTRAINT "_about_page_v_version_mission_vision_mission_image_id_media_id_fk" FOREIGN KEY ("version_mission_vision_mission_image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_about_page_v" ADD CONSTRAINT "_about_page_v_version_mission_vision_vision_image_id_media_id_fk" FOREIGN KEY ("version_mission_vision_vision_image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_about_page_v" ADD CONSTRAINT "_about_page_v_version_mission_vision_image_id_media_id_fk" FOREIGN KEY ("version_mission_vision_image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_about_page_v_locales" ADD CONSTRAINT "_about_page_v_locales_version_meta_image_id_media_id_fk" FOREIGN KEY ("version_meta_image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_about_page_v_locales" ADD CONSTRAINT "_about_page_v_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_about_page_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "projects_page" ADD CONSTRAINT "projects_page_page_header_image_id_media_id_fk" FOREIGN KEY ("page_header_image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "projects_page" ADD CONSTRAINT "projects_page_portfolio_badge_stat_id_stats_id_fk" FOREIGN KEY ("portfolio_badge_stat_id") REFERENCES "public"."stats"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "projects_page" ADD CONSTRAINT "projects_page_portfolio_image_id_media_id_fk" FOREIGN KEY ("portfolio_image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "projects_page" ADD CONSTRAINT "projects_page_cta_background_image_id_media_id_fk" FOREIGN KEY ("cta_background_image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "projects_page_locales" ADD CONSTRAINT "projects_page_locales_meta_image_id_media_id_fk" FOREIGN KEY ("meta_image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "projects_page_locales" ADD CONSTRAINT "projects_page_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."projects_page"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "projects_page_rels" ADD CONSTRAINT "projects_page_rels_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."projects_page"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "projects_page_rels" ADD CONSTRAINT "projects_page_rels_stats_fk" FOREIGN KEY ("stats_id") REFERENCES "public"."stats"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "projects_page_rels" ADD CONSTRAINT "projects_page_rels_services_fk" FOREIGN KEY ("services_id") REFERENCES "public"."services"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "projects_page_rels" ADD CONSTRAINT "projects_page_rels_projects_fk" FOREIGN KEY ("projects_id") REFERENCES "public"."projects"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_projects_page_v" ADD CONSTRAINT "_projects_page_v_version_page_header_image_id_media_id_fk" FOREIGN KEY ("version_page_header_image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_projects_page_v" ADD CONSTRAINT "_projects_page_v_version_portfolio_badge_stat_id_stats_id_fk" FOREIGN KEY ("version_portfolio_badge_stat_id") REFERENCES "public"."stats"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_projects_page_v" ADD CONSTRAINT "_projects_page_v_version_portfolio_image_id_media_id_fk" FOREIGN KEY ("version_portfolio_image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_projects_page_v" ADD CONSTRAINT "_projects_page_v_version_cta_background_image_id_media_id_fk" FOREIGN KEY ("version_cta_background_image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_projects_page_v_locales" ADD CONSTRAINT "_projects_page_v_locales_version_meta_image_id_media_id_fk" FOREIGN KEY ("version_meta_image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_projects_page_v_locales" ADD CONSTRAINT "_projects_page_v_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_projects_page_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_projects_page_v_rels" ADD CONSTRAINT "_projects_page_v_rels_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."_projects_page_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_projects_page_v_rels" ADD CONSTRAINT "_projects_page_v_rels_stats_fk" FOREIGN KEY ("stats_id") REFERENCES "public"."stats"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_projects_page_v_rels" ADD CONSTRAINT "_projects_page_v_rels_services_fk" FOREIGN KEY ("services_id") REFERENCES "public"."services"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_projects_page_v_rels" ADD CONSTRAINT "_projects_page_v_rels_projects_fk" FOREIGN KEY ("projects_id") REFERENCES "public"."projects"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "contact_page" ADD CONSTRAINT "contact_page_page_header_image_id_media_id_fk" FOREIGN KEY ("page_header_image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "contact_page_locales" ADD CONSTRAINT "contact_page_locales_meta_image_id_media_id_fk" FOREIGN KEY ("meta_image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "contact_page_locales" ADD CONSTRAINT "contact_page_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."contact_page"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_contact_page_v" ADD CONSTRAINT "_contact_page_v_version_page_header_image_id_media_id_fk" FOREIGN KEY ("version_page_header_image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_contact_page_v_locales" ADD CONSTRAINT "_contact_page_v_locales_version_meta_image_id_media_id_fk" FOREIGN KEY ("version_meta_image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_contact_page_v_locales" ADD CONSTRAINT "_contact_page_v_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_contact_page_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "privacy_page" ADD CONSTRAINT "privacy_page_page_header_image_id_media_id_fk" FOREIGN KEY ("page_header_image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "privacy_page_locales" ADD CONSTRAINT "privacy_page_locales_meta_image_id_media_id_fk" FOREIGN KEY ("meta_image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "privacy_page_locales" ADD CONSTRAINT "privacy_page_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."privacy_page"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "privacy_page_rels" ADD CONSTRAINT "privacy_page_rels_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."privacy_page"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "privacy_page_rels" ADD CONSTRAINT "privacy_page_rels_media_fk" FOREIGN KEY ("media_id") REFERENCES "public"."media"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_privacy_page_v" ADD CONSTRAINT "_privacy_page_v_version_page_header_image_id_media_id_fk" FOREIGN KEY ("version_page_header_image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_privacy_page_v_locales" ADD CONSTRAINT "_privacy_page_v_locales_version_meta_image_id_media_id_fk" FOREIGN KEY ("version_meta_image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_privacy_page_v_locales" ADD CONSTRAINT "_privacy_page_v_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_privacy_page_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_privacy_page_v_rels" ADD CONSTRAINT "_privacy_page_v_rels_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."_privacy_page_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_privacy_page_v_rels" ADD CONSTRAINT "_privacy_page_v_rels_media_fk" FOREIGN KEY ("media_id") REFERENCES "public"."media"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX "site_socials_order_idx" ON "site_socials" USING btree ("_order");
  CREATE INDEX "site_socials_parent_id_idx" ON "site_socials" USING btree ("_parent_id");
  CREATE INDEX "site_settings_office_office_map_image_idx" ON "site_settings" USING btree ("office_map_image_id");
  CREATE INDEX "site_settings_default_seo_default_seo_image_idx" ON "site_settings" USING btree ("default_seo_image_id");
  CREATE UNIQUE INDEX "site_settings_locales_locale_parent_id_unique" ON "site_settings_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "site_settings_locales_parent_id_idx" ON "site_settings_locales" USING btree ("_parent_id");
  CREATE INDEX "nav_header_order_idx" ON "nav_header" USING btree ("_order");
  CREATE INDEX "nav_header_parent_id_idx" ON "nav_header" USING btree ("_parent_id");
  CREATE UNIQUE INDEX "nav_header_locales_locale_parent_id_unique" ON "nav_header_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "nav_header_locales_parent_id_idx" ON "nav_header_locales" USING btree ("_parent_id");
  CREATE INDEX "nav_ft_links_order_idx" ON "nav_ft_links" USING btree ("_order");
  CREATE INDEX "nav_ft_links_parent_id_idx" ON "nav_ft_links" USING btree ("_parent_id");
  CREATE UNIQUE INDEX "nav_ft_links_locales_locale_parent_id_unique" ON "nav_ft_links_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "nav_ft_links_locales_parent_id_idx" ON "nav_ft_links_locales" USING btree ("_parent_id");
  CREATE INDEX "nav_footer_order_idx" ON "nav_footer" USING btree ("_order");
  CREATE INDEX "nav_footer_parent_id_idx" ON "nav_footer" USING btree ("_parent_id");
  CREATE UNIQUE INDEX "nav_footer_locales_locale_parent_id_unique" ON "nav_footer_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "nav_footer_locales_parent_id_idx" ON "nav_footer_locales" USING btree ("_parent_id");
  CREATE UNIQUE INDEX "navigation_locales_locale_parent_id_unique" ON "navigation_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "navigation_locales_parent_id_idx" ON "navigation_locales" USING btree ("_parent_id");
  CREATE INDEX "navigation_rels_order_idx" ON "navigation_rels" USING btree ("order");
  CREATE INDEX "navigation_rels_parent_idx" ON "navigation_rels" USING btree ("parent_id");
  CREATE INDEX "navigation_rels_path_idx" ON "navigation_rels" USING btree ("path");
  CREATE INDEX "navigation_rels_services_id_idx" ON "navigation_rels" USING btree ("services_id");
  CREATE INDEX "navigation_rels_projects_id_idx" ON "navigation_rels" USING btree ("projects_id");
  CREATE INDEX "hp_int_sys_disc_order_idx" ON "hp_int_sys_disc" USING btree ("order");
  CREATE INDEX "hp_int_sys_disc_parent_idx" ON "hp_int_sys_disc" USING btree ("parent_id");
  CREATE INDEX "hp_int_sys_order_idx" ON "hp_int_sys" USING btree ("_order");
  CREATE INDEX "hp_int_sys_parent_id_idx" ON "hp_int_sys" USING btree ("_parent_id");
  CREATE UNIQUE INDEX "hp_int_sys_locales_locale_parent_id_unique" ON "hp_int_sys_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "hp_int_sys_locales_parent_id_idx" ON "hp_int_sys_locales" USING btree ("_parent_id");
  CREATE INDEX "home_page_hero_hero_background_idx" ON "home_page" USING btree ("hero_background_id");
  CREATE INDEX "home_page_hero_hero_background_video_idx" ON "home_page" USING btree ("hero_background_video_id");
  CREATE INDEX "home_page_who_we_are_who_we_are_badge_stat_idx" ON "home_page" USING btree ("who_we_are_badge_stat_id");
  CREATE INDEX "home_page_who_we_are_who_we_are_image_idx" ON "home_page" USING btree ("who_we_are_image_id");
  CREATE INDEX "home_page_interactive_systems_interactive_systems_hero_i_idx" ON "home_page" USING btree ("interactive_systems_hero_image_id");
  CREATE INDEX "home_page_cta_cta_background_image_idx" ON "home_page" USING btree ("cta_background_image_id");
  CREATE INDEX "home_page__status_idx" ON "home_page" USING btree ("_status");
  CREATE INDEX "home_page_meta_meta_image_idx" ON "home_page_locales" USING btree ("meta_image_id","_locale");
  CREATE UNIQUE INDEX "home_page_locales_locale_parent_id_unique" ON "home_page_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "home_page_locales_parent_id_idx" ON "home_page_locales" USING btree ("_parent_id");
  CREATE INDEX "home_page_rels_order_idx" ON "home_page_rels" USING btree ("order");
  CREATE INDEX "home_page_rels_parent_idx" ON "home_page_rels" USING btree ("parent_id");
  CREATE INDEX "home_page_rels_path_idx" ON "home_page_rels" USING btree ("path");
  CREATE INDEX "home_page_rels_services_id_idx" ON "home_page_rels" USING btree ("services_id");
  CREATE INDEX "home_page_rels_projects_id_idx" ON "home_page_rels" USING btree ("projects_id");
  CREATE INDEX "home_page_rels_stats_id_idx" ON "home_page_rels" USING btree ("stats_id");
  CREATE INDEX "_hp_int_sys_disc_v_order_idx" ON "_hp_int_sys_disc_v" USING btree ("order");
  CREATE INDEX "_hp_int_sys_disc_v_parent_idx" ON "_hp_int_sys_disc_v" USING btree ("parent_id");
  CREATE INDEX "_hp_int_sys_v_order_idx" ON "_hp_int_sys_v" USING btree ("_order");
  CREATE INDEX "_hp_int_sys_v_parent_id_idx" ON "_hp_int_sys_v" USING btree ("_parent_id");
  CREATE UNIQUE INDEX "_hp_int_sys_v_locales_locale_parent_id_unique" ON "_hp_int_sys_v_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "_hp_int_sys_v_locales_parent_id_idx" ON "_hp_int_sys_v_locales" USING btree ("_parent_id");
  CREATE INDEX "_home_page_v_version_hero_version_hero_background_idx" ON "_home_page_v" USING btree ("version_hero_background_id");
  CREATE INDEX "_home_page_v_version_hero_version_hero_background_video_idx" ON "_home_page_v" USING btree ("version_hero_background_video_id");
  CREATE INDEX "_home_page_v_version_who_we_are_version_who_we_are_badge_idx" ON "_home_page_v" USING btree ("version_who_we_are_badge_stat_id");
  CREATE INDEX "_home_page_v_version_who_we_are_version_who_we_are_image_idx" ON "_home_page_v" USING btree ("version_who_we_are_image_id");
  CREATE INDEX "_home_page_v_version_interactive_systems_version_interac_idx" ON "_home_page_v" USING btree ("version_interactive_systems_hero_image_id");
  CREATE INDEX "_home_page_v_version_cta_version_cta_background_image_idx" ON "_home_page_v" USING btree ("version_cta_background_image_id");
  CREATE INDEX "_home_page_v_version_version__status_idx" ON "_home_page_v" USING btree ("version__status");
  CREATE INDEX "_home_page_v_created_at_idx" ON "_home_page_v" USING btree ("created_at");
  CREATE INDEX "_home_page_v_updated_at_idx" ON "_home_page_v" USING btree ("updated_at");
  CREATE INDEX "_home_page_v_snapshot_idx" ON "_home_page_v" USING btree ("snapshot");
  CREATE INDEX "_home_page_v_published_locale_idx" ON "_home_page_v" USING btree ("published_locale");
  CREATE INDEX "_home_page_v_latest_idx" ON "_home_page_v" USING btree ("latest");
  CREATE INDEX "_home_page_v_autosave_idx" ON "_home_page_v" USING btree ("autosave");
  CREATE INDEX "_home_page_v_version_meta_version_meta_image_idx" ON "_home_page_v_locales" USING btree ("version_meta_image_id","_locale");
  CREATE UNIQUE INDEX "_home_page_v_locales_locale_parent_id_unique" ON "_home_page_v_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "_home_page_v_locales_parent_id_idx" ON "_home_page_v_locales" USING btree ("_parent_id");
  CREATE INDEX "_home_page_v_rels_order_idx" ON "_home_page_v_rels" USING btree ("order");
  CREATE INDEX "_home_page_v_rels_parent_idx" ON "_home_page_v_rels" USING btree ("parent_id");
  CREATE INDEX "_home_page_v_rels_path_idx" ON "_home_page_v_rels" USING btree ("path");
  CREATE INDEX "_home_page_v_rels_services_id_idx" ON "_home_page_v_rels" USING btree ("services_id");
  CREATE INDEX "_home_page_v_rels_projects_id_idx" ON "_home_page_v_rels" USING btree ("projects_id");
  CREATE INDEX "_home_page_v_rels_stats_id_idx" ON "_home_page_v_rels" USING btree ("stats_id");
  CREATE INDEX "sp_proc_steps_order_idx" ON "sp_proc_steps" USING btree ("_order");
  CREATE INDEX "sp_proc_steps_parent_id_idx" ON "sp_proc_steps" USING btree ("_parent_id");
  CREATE UNIQUE INDEX "sp_proc_steps_locales_locale_parent_id_unique" ON "sp_proc_steps_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "sp_proc_steps_locales_parent_id_idx" ON "sp_proc_steps_locales" USING btree ("_parent_id");
  CREATE INDEX "services_page_page_header_page_header_image_idx" ON "services_page" USING btree ("page_header_image_id");
  CREATE INDEX "services_page_cta_cta_background_image_idx" ON "services_page" USING btree ("cta_background_image_id");
  CREATE INDEX "services_page__status_idx" ON "services_page" USING btree ("_status");
  CREATE INDEX "services_page_meta_meta_image_idx" ON "services_page_locales" USING btree ("meta_image_id","_locale");
  CREATE UNIQUE INDEX "services_page_locales_locale_parent_id_unique" ON "services_page_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "services_page_locales_parent_id_idx" ON "services_page_locales" USING btree ("_parent_id");
  CREATE INDEX "services_page_rels_order_idx" ON "services_page_rels" USING btree ("order");
  CREATE INDEX "services_page_rels_parent_idx" ON "services_page_rels" USING btree ("parent_id");
  CREATE INDEX "services_page_rels_path_idx" ON "services_page_rels" USING btree ("path");
  CREATE INDEX "services_page_rels_services_id_idx" ON "services_page_rels" USING btree ("services_id");
  CREATE INDEX "services_page_rels_projects_id_idx" ON "services_page_rels" USING btree ("projects_id");
  CREATE INDEX "_sp_proc_steps_v_order_idx" ON "_sp_proc_steps_v" USING btree ("_order");
  CREATE INDEX "_sp_proc_steps_v_parent_id_idx" ON "_sp_proc_steps_v" USING btree ("_parent_id");
  CREATE UNIQUE INDEX "_sp_proc_steps_v_locales_locale_parent_id_unique" ON "_sp_proc_steps_v_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "_sp_proc_steps_v_locales_parent_id_idx" ON "_sp_proc_steps_v_locales" USING btree ("_parent_id");
  CREATE INDEX "_services_page_v_version_page_header_version_page_header_idx" ON "_services_page_v" USING btree ("version_page_header_image_id");
  CREATE INDEX "_services_page_v_version_cta_version_cta_background_imag_idx" ON "_services_page_v" USING btree ("version_cta_background_image_id");
  CREATE INDEX "_services_page_v_version_version__status_idx" ON "_services_page_v" USING btree ("version__status");
  CREATE INDEX "_services_page_v_created_at_idx" ON "_services_page_v" USING btree ("created_at");
  CREATE INDEX "_services_page_v_updated_at_idx" ON "_services_page_v" USING btree ("updated_at");
  CREATE INDEX "_services_page_v_snapshot_idx" ON "_services_page_v" USING btree ("snapshot");
  CREATE INDEX "_services_page_v_published_locale_idx" ON "_services_page_v" USING btree ("published_locale");
  CREATE INDEX "_services_page_v_latest_idx" ON "_services_page_v" USING btree ("latest");
  CREATE INDEX "_services_page_v_autosave_idx" ON "_services_page_v" USING btree ("autosave");
  CREATE INDEX "_services_page_v_version_meta_version_meta_image_idx" ON "_services_page_v_locales" USING btree ("version_meta_image_id","_locale");
  CREATE UNIQUE INDEX "_services_page_v_locales_locale_parent_id_unique" ON "_services_page_v_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "_services_page_v_locales_parent_id_idx" ON "_services_page_v_locales" USING btree ("_parent_id");
  CREATE INDEX "_services_page_v_rels_order_idx" ON "_services_page_v_rels" USING btree ("order");
  CREATE INDEX "_services_page_v_rels_parent_idx" ON "_services_page_v_rels" USING btree ("parent_id");
  CREATE INDEX "_services_page_v_rels_path_idx" ON "_services_page_v_rels" USING btree ("path");
  CREATE INDEX "_services_page_v_rels_services_id_idx" ON "_services_page_v_rels" USING btree ("services_id");
  CREATE INDEX "_services_page_v_rels_projects_id_idx" ON "_services_page_v_rels" USING btree ("projects_id");
  CREATE INDEX "ap_str_items_order_idx" ON "ap_str_items" USING btree ("_order");
  CREATE INDEX "ap_str_items_parent_id_idx" ON "ap_str_items" USING btree ("_parent_id");
  CREATE UNIQUE INDEX "ap_str_items_locales_locale_parent_id_unique" ON "ap_str_items_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "ap_str_items_locales_parent_id_idx" ON "ap_str_items_locales" USING btree ("_parent_id");
  CREATE INDEX "ap_miss_pil_order_idx" ON "ap_miss_pil" USING btree ("_order");
  CREATE INDEX "ap_miss_pil_parent_id_idx" ON "ap_miss_pil" USING btree ("_parent_id");
  CREATE UNIQUE INDEX "ap_miss_pil_locales_locale_parent_id_unique" ON "ap_miss_pil_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "ap_miss_pil_locales_parent_id_idx" ON "ap_miss_pil_locales" USING btree ("_parent_id");
  CREATE INDEX "ap_vis_pil_order_idx" ON "ap_vis_pil" USING btree ("_order");
  CREATE INDEX "ap_vis_pil_parent_id_idx" ON "ap_vis_pil" USING btree ("_parent_id");
  CREATE UNIQUE INDEX "ap_vis_pil_locales_locale_parent_id_unique" ON "ap_vis_pil_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "ap_vis_pil_locales_parent_id_idx" ON "ap_vis_pil_locales" USING btree ("_parent_id");
  CREATE INDEX "about_page_page_header_page_header_image_idx" ON "about_page" USING btree ("page_header_image_id");
  CREATE INDEX "about_page_story_story_badge_stat_idx" ON "about_page" USING btree ("story_badge_stat_id");
  CREATE INDEX "about_page_story_story_image_idx" ON "about_page" USING btree ("story_image_id");
  CREATE INDEX "about_page_mission_vision_mission_mission_vision_mission_idx" ON "about_page" USING btree ("mission_vision_mission_image_id");
  CREATE INDEX "about_page_mission_vision_vision_mission_vision_vision_i_idx" ON "about_page" USING btree ("mission_vision_vision_image_id");
  CREATE INDEX "about_page_mission_vision_mission_vision_image_idx" ON "about_page" USING btree ("mission_vision_image_id");
  CREATE INDEX "about_page__status_idx" ON "about_page" USING btree ("_status");
  CREATE INDEX "about_page_meta_meta_image_idx" ON "about_page_locales" USING btree ("meta_image_id","_locale");
  CREATE UNIQUE INDEX "about_page_locales_locale_parent_id_unique" ON "about_page_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "about_page_locales_parent_id_idx" ON "about_page_locales" USING btree ("_parent_id");
  CREATE INDEX "_ap_str_items_v_order_idx" ON "_ap_str_items_v" USING btree ("_order");
  CREATE INDEX "_ap_str_items_v_parent_id_idx" ON "_ap_str_items_v" USING btree ("_parent_id");
  CREATE UNIQUE INDEX "_ap_str_items_v_locales_locale_parent_id_unique" ON "_ap_str_items_v_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "_ap_str_items_v_locales_parent_id_idx" ON "_ap_str_items_v_locales" USING btree ("_parent_id");
  CREATE INDEX "_ap_miss_pil_v_order_idx" ON "_ap_miss_pil_v" USING btree ("_order");
  CREATE INDEX "_ap_miss_pil_v_parent_id_idx" ON "_ap_miss_pil_v" USING btree ("_parent_id");
  CREATE UNIQUE INDEX "_ap_miss_pil_v_locales_locale_parent_id_unique" ON "_ap_miss_pil_v_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "_ap_miss_pil_v_locales_parent_id_idx" ON "_ap_miss_pil_v_locales" USING btree ("_parent_id");
  CREATE INDEX "_ap_vis_pil_v_order_idx" ON "_ap_vis_pil_v" USING btree ("_order");
  CREATE INDEX "_ap_vis_pil_v_parent_id_idx" ON "_ap_vis_pil_v" USING btree ("_parent_id");
  CREATE UNIQUE INDEX "_ap_vis_pil_v_locales_locale_parent_id_unique" ON "_ap_vis_pil_v_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "_ap_vis_pil_v_locales_parent_id_idx" ON "_ap_vis_pil_v_locales" USING btree ("_parent_id");
  CREATE INDEX "_about_page_v_version_page_header_version_page_header_im_idx" ON "_about_page_v" USING btree ("version_page_header_image_id");
  CREATE INDEX "_about_page_v_version_story_version_story_badge_stat_idx" ON "_about_page_v" USING btree ("version_story_badge_stat_id");
  CREATE INDEX "_about_page_v_version_story_version_story_image_idx" ON "_about_page_v" USING btree ("version_story_image_id");
  CREATE INDEX "_about_page_v_version_mission_vision_mission_version_mis_idx" ON "_about_page_v" USING btree ("version_mission_vision_mission_image_id");
  CREATE INDEX "_about_page_v_version_mission_vision_vision_version_miss_idx" ON "_about_page_v" USING btree ("version_mission_vision_vision_image_id");
  CREATE INDEX "_about_page_v_version_mission_vision_version_mission_vis_idx" ON "_about_page_v" USING btree ("version_mission_vision_image_id");
  CREATE INDEX "_about_page_v_version_version__status_idx" ON "_about_page_v" USING btree ("version__status");
  CREATE INDEX "_about_page_v_created_at_idx" ON "_about_page_v" USING btree ("created_at");
  CREATE INDEX "_about_page_v_updated_at_idx" ON "_about_page_v" USING btree ("updated_at");
  CREATE INDEX "_about_page_v_snapshot_idx" ON "_about_page_v" USING btree ("snapshot");
  CREATE INDEX "_about_page_v_published_locale_idx" ON "_about_page_v" USING btree ("published_locale");
  CREATE INDEX "_about_page_v_latest_idx" ON "_about_page_v" USING btree ("latest");
  CREATE INDEX "_about_page_v_autosave_idx" ON "_about_page_v" USING btree ("autosave");
  CREATE INDEX "_about_page_v_version_meta_version_meta_image_idx" ON "_about_page_v_locales" USING btree ("version_meta_image_id","_locale");
  CREATE UNIQUE INDEX "_about_page_v_locales_locale_parent_id_unique" ON "_about_page_v_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "_about_page_v_locales_parent_id_idx" ON "_about_page_v_locales" USING btree ("_parent_id");
  CREATE INDEX "projects_page_page_header_page_header_image_idx" ON "projects_page" USING btree ("page_header_image_id");
  CREATE INDEX "projects_page_portfolio_portfolio_badge_stat_idx" ON "projects_page" USING btree ("portfolio_badge_stat_id");
  CREATE INDEX "projects_page_portfolio_portfolio_image_idx" ON "projects_page" USING btree ("portfolio_image_id");
  CREATE INDEX "projects_page_cta_cta_background_image_idx" ON "projects_page" USING btree ("cta_background_image_id");
  CREATE INDEX "projects_page__status_idx" ON "projects_page" USING btree ("_status");
  CREATE INDEX "projects_page_meta_meta_image_idx" ON "projects_page_locales" USING btree ("meta_image_id","_locale");
  CREATE UNIQUE INDEX "projects_page_locales_locale_parent_id_unique" ON "projects_page_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "projects_page_locales_parent_id_idx" ON "projects_page_locales" USING btree ("_parent_id");
  CREATE INDEX "projects_page_rels_order_idx" ON "projects_page_rels" USING btree ("order");
  CREATE INDEX "projects_page_rels_parent_idx" ON "projects_page_rels" USING btree ("parent_id");
  CREATE INDEX "projects_page_rels_path_idx" ON "projects_page_rels" USING btree ("path");
  CREATE INDEX "projects_page_rels_stats_id_idx" ON "projects_page_rels" USING btree ("stats_id");
  CREATE INDEX "projects_page_rels_services_id_idx" ON "projects_page_rels" USING btree ("services_id");
  CREATE INDEX "projects_page_rels_projects_id_idx" ON "projects_page_rels" USING btree ("projects_id");
  CREATE INDEX "_projects_page_v_version_page_header_version_page_header_idx" ON "_projects_page_v" USING btree ("version_page_header_image_id");
  CREATE INDEX "_projects_page_v_version_portfolio_version_portfolio_bad_idx" ON "_projects_page_v" USING btree ("version_portfolio_badge_stat_id");
  CREATE INDEX "_projects_page_v_version_portfolio_version_portfolio_ima_idx" ON "_projects_page_v" USING btree ("version_portfolio_image_id");
  CREATE INDEX "_projects_page_v_version_cta_version_cta_background_imag_idx" ON "_projects_page_v" USING btree ("version_cta_background_image_id");
  CREATE INDEX "_projects_page_v_version_version__status_idx" ON "_projects_page_v" USING btree ("version__status");
  CREATE INDEX "_projects_page_v_created_at_idx" ON "_projects_page_v" USING btree ("created_at");
  CREATE INDEX "_projects_page_v_updated_at_idx" ON "_projects_page_v" USING btree ("updated_at");
  CREATE INDEX "_projects_page_v_snapshot_idx" ON "_projects_page_v" USING btree ("snapshot");
  CREATE INDEX "_projects_page_v_published_locale_idx" ON "_projects_page_v" USING btree ("published_locale");
  CREATE INDEX "_projects_page_v_latest_idx" ON "_projects_page_v" USING btree ("latest");
  CREATE INDEX "_projects_page_v_autosave_idx" ON "_projects_page_v" USING btree ("autosave");
  CREATE INDEX "_projects_page_v_version_meta_version_meta_image_idx" ON "_projects_page_v_locales" USING btree ("version_meta_image_id","_locale");
  CREATE UNIQUE INDEX "_projects_page_v_locales_locale_parent_id_unique" ON "_projects_page_v_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "_projects_page_v_locales_parent_id_idx" ON "_projects_page_v_locales" USING btree ("_parent_id");
  CREATE INDEX "_projects_page_v_rels_order_idx" ON "_projects_page_v_rels" USING btree ("order");
  CREATE INDEX "_projects_page_v_rels_parent_idx" ON "_projects_page_v_rels" USING btree ("parent_id");
  CREATE INDEX "_projects_page_v_rels_path_idx" ON "_projects_page_v_rels" USING btree ("path");
  CREATE INDEX "_projects_page_v_rels_stats_id_idx" ON "_projects_page_v_rels" USING btree ("stats_id");
  CREATE INDEX "_projects_page_v_rels_services_id_idx" ON "_projects_page_v_rels" USING btree ("services_id");
  CREATE INDEX "_projects_page_v_rels_projects_id_idx" ON "_projects_page_v_rels" USING btree ("projects_id");
  CREATE INDEX "contact_page_page_header_page_header_image_idx" ON "contact_page" USING btree ("page_header_image_id");
  CREATE INDEX "contact_page__status_idx" ON "contact_page" USING btree ("_status");
  CREATE INDEX "contact_page_meta_meta_image_idx" ON "contact_page_locales" USING btree ("meta_image_id","_locale");
  CREATE UNIQUE INDEX "contact_page_locales_locale_parent_id_unique" ON "contact_page_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "contact_page_locales_parent_id_idx" ON "contact_page_locales" USING btree ("_parent_id");
  CREATE INDEX "_contact_page_v_version_page_header_version_page_header__idx" ON "_contact_page_v" USING btree ("version_page_header_image_id");
  CREATE INDEX "_contact_page_v_version_version__status_idx" ON "_contact_page_v" USING btree ("version__status");
  CREATE INDEX "_contact_page_v_created_at_idx" ON "_contact_page_v" USING btree ("created_at");
  CREATE INDEX "_contact_page_v_updated_at_idx" ON "_contact_page_v" USING btree ("updated_at");
  CREATE INDEX "_contact_page_v_snapshot_idx" ON "_contact_page_v" USING btree ("snapshot");
  CREATE INDEX "_contact_page_v_published_locale_idx" ON "_contact_page_v" USING btree ("published_locale");
  CREATE INDEX "_contact_page_v_latest_idx" ON "_contact_page_v" USING btree ("latest");
  CREATE INDEX "_contact_page_v_autosave_idx" ON "_contact_page_v" USING btree ("autosave");
  CREATE INDEX "_contact_page_v_version_meta_version_meta_image_idx" ON "_contact_page_v_locales" USING btree ("version_meta_image_id","_locale");
  CREATE UNIQUE INDEX "_contact_page_v_locales_locale_parent_id_unique" ON "_contact_page_v_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "_contact_page_v_locales_parent_id_idx" ON "_contact_page_v_locales" USING btree ("_parent_id");
  CREATE INDEX "privacy_page_page_header_page_header_image_idx" ON "privacy_page" USING btree ("page_header_image_id");
  CREATE INDEX "privacy_page__status_idx" ON "privacy_page" USING btree ("_status");
  CREATE INDEX "privacy_page_meta_meta_image_idx" ON "privacy_page_locales" USING btree ("meta_image_id","_locale");
  CREATE UNIQUE INDEX "privacy_page_locales_locale_parent_id_unique" ON "privacy_page_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "privacy_page_locales_parent_id_idx" ON "privacy_page_locales" USING btree ("_parent_id");
  CREATE INDEX "privacy_page_rels_order_idx" ON "privacy_page_rels" USING btree ("order");
  CREATE INDEX "privacy_page_rels_parent_idx" ON "privacy_page_rels" USING btree ("parent_id");
  CREATE INDEX "privacy_page_rels_path_idx" ON "privacy_page_rels" USING btree ("path");
  CREATE INDEX "privacy_page_rels_media_id_idx" ON "privacy_page_rels" USING btree ("media_id");
  CREATE INDEX "_privacy_page_v_version_page_header_version_page_header__idx" ON "_privacy_page_v" USING btree ("version_page_header_image_id");
  CREATE INDEX "_privacy_page_v_version_version__status_idx" ON "_privacy_page_v" USING btree ("version__status");
  CREATE INDEX "_privacy_page_v_created_at_idx" ON "_privacy_page_v" USING btree ("created_at");
  CREATE INDEX "_privacy_page_v_updated_at_idx" ON "_privacy_page_v" USING btree ("updated_at");
  CREATE INDEX "_privacy_page_v_snapshot_idx" ON "_privacy_page_v" USING btree ("snapshot");
  CREATE INDEX "_privacy_page_v_published_locale_idx" ON "_privacy_page_v" USING btree ("published_locale");
  CREATE INDEX "_privacy_page_v_latest_idx" ON "_privacy_page_v" USING btree ("latest");
  CREATE INDEX "_privacy_page_v_autosave_idx" ON "_privacy_page_v" USING btree ("autosave");
  CREATE INDEX "_privacy_page_v_version_meta_version_meta_image_idx" ON "_privacy_page_v_locales" USING btree ("version_meta_image_id","_locale");
  CREATE UNIQUE INDEX "_privacy_page_v_locales_locale_parent_id_unique" ON "_privacy_page_v_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "_privacy_page_v_locales_parent_id_idx" ON "_privacy_page_v_locales" USING btree ("_parent_id");
  CREATE INDEX "_privacy_page_v_rels_order_idx" ON "_privacy_page_v_rels" USING btree ("order");
  CREATE INDEX "_privacy_page_v_rels_parent_idx" ON "_privacy_page_v_rels" USING btree ("parent_id");
  CREATE INDEX "_privacy_page_v_rels_path_idx" ON "_privacy_page_v_rels" USING btree ("path");
  CREATE INDEX "_privacy_page_v_rels_media_id_idx" ON "_privacy_page_v_rels" USING btree ("media_id");`)
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   DROP TABLE "site_socials" CASCADE;
  DROP TABLE "site_settings" CASCADE;
  DROP TABLE "site_settings_locales" CASCADE;
  DROP TABLE "nav_header" CASCADE;
  DROP TABLE "nav_header_locales" CASCADE;
  DROP TABLE "nav_ft_links" CASCADE;
  DROP TABLE "nav_ft_links_locales" CASCADE;
  DROP TABLE "nav_footer" CASCADE;
  DROP TABLE "nav_footer_locales" CASCADE;
  DROP TABLE "navigation" CASCADE;
  DROP TABLE "navigation_locales" CASCADE;
  DROP TABLE "navigation_rels" CASCADE;
  DROP TABLE "hp_int_sys_disc" CASCADE;
  DROP TABLE "hp_int_sys" CASCADE;
  DROP TABLE "hp_int_sys_locales" CASCADE;
  DROP TABLE "home_page" CASCADE;
  DROP TABLE "home_page_locales" CASCADE;
  DROP TABLE "home_page_rels" CASCADE;
  DROP TABLE "_hp_int_sys_disc_v" CASCADE;
  DROP TABLE "_hp_int_sys_v" CASCADE;
  DROP TABLE "_hp_int_sys_v_locales" CASCADE;
  DROP TABLE "_home_page_v" CASCADE;
  DROP TABLE "_home_page_v_locales" CASCADE;
  DROP TABLE "_home_page_v_rels" CASCADE;
  DROP TABLE "sp_proc_steps" CASCADE;
  DROP TABLE "sp_proc_steps_locales" CASCADE;
  DROP TABLE "services_page" CASCADE;
  DROP TABLE "services_page_locales" CASCADE;
  DROP TABLE "services_page_rels" CASCADE;
  DROP TABLE "_sp_proc_steps_v" CASCADE;
  DROP TABLE "_sp_proc_steps_v_locales" CASCADE;
  DROP TABLE "_services_page_v" CASCADE;
  DROP TABLE "_services_page_v_locales" CASCADE;
  DROP TABLE "_services_page_v_rels" CASCADE;
  DROP TABLE "ap_str_items" CASCADE;
  DROP TABLE "ap_str_items_locales" CASCADE;
  DROP TABLE "ap_miss_pil" CASCADE;
  DROP TABLE "ap_miss_pil_locales" CASCADE;
  DROP TABLE "ap_vis_pil" CASCADE;
  DROP TABLE "ap_vis_pil_locales" CASCADE;
  DROP TABLE "about_page" CASCADE;
  DROP TABLE "about_page_locales" CASCADE;
  DROP TABLE "_ap_str_items_v" CASCADE;
  DROP TABLE "_ap_str_items_v_locales" CASCADE;
  DROP TABLE "_ap_miss_pil_v" CASCADE;
  DROP TABLE "_ap_miss_pil_v_locales" CASCADE;
  DROP TABLE "_ap_vis_pil_v" CASCADE;
  DROP TABLE "_ap_vis_pil_v_locales" CASCADE;
  DROP TABLE "_about_page_v" CASCADE;
  DROP TABLE "_about_page_v_locales" CASCADE;
  DROP TABLE "projects_page" CASCADE;
  DROP TABLE "projects_page_locales" CASCADE;
  DROP TABLE "projects_page_rels" CASCADE;
  DROP TABLE "_projects_page_v" CASCADE;
  DROP TABLE "_projects_page_v_locales" CASCADE;
  DROP TABLE "_projects_page_v_rels" CASCADE;
  DROP TABLE "contact_page" CASCADE;
  DROP TABLE "contact_page_locales" CASCADE;
  DROP TABLE "_contact_page_v" CASCADE;
  DROP TABLE "_contact_page_v_locales" CASCADE;
  DROP TABLE "privacy_page" CASCADE;
  DROP TABLE "privacy_page_locales" CASCADE;
  DROP TABLE "privacy_page_rels" CASCADE;
  DROP TABLE "_privacy_page_v" CASCADE;
  DROP TABLE "_privacy_page_v_locales" CASCADE;
  DROP TABLE "_privacy_page_v_rels" CASCADE;
  DROP TYPE "public"."enum_site_settings_social_platform";
  DROP TYPE "public"."enum_link_type";
  DROP TYPE "public"."enum_link_internal_route";
  DROP TYPE "public"."enum_hp_int_sys_disc";
  DROP TYPE "public"."enum_hp_int_sys_shot";
  DROP TYPE "public"."enum_home_page_status";
  DROP TYPE "public"."enum__home_page_v_version_status";
  DROP TYPE "public"."enum__home_page_v_published_locale";
  DROP TYPE "public"."enum_services_page_status";
  DROP TYPE "public"."enum__services_page_v_version_status";
  DROP TYPE "public"."enum__services_page_v_published_locale";
  DROP TYPE "public"."enum_about_page_status";
  DROP TYPE "public"."enum__about_page_v_version_status";
  DROP TYPE "public"."enum__about_page_v_published_locale";
  DROP TYPE "public"."enum_projects_page_status";
  DROP TYPE "public"."enum__projects_page_v_version_status";
  DROP TYPE "public"."enum__projects_page_v_published_locale";
  DROP TYPE "public"."enum_contact_page_status";
  DROP TYPE "public"."enum__contact_page_v_version_status";
  DROP TYPE "public"."enum__contact_page_v_published_locale";
  DROP TYPE "public"."enum_privacy_page_status";
  DROP TYPE "public"."enum__privacy_page_v_version_status";
  DROP TYPE "public"."enum__privacy_page_v_published_locale";`)
}
