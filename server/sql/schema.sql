-- Elamora consolidated PostgreSQL schema
-- Generated from production database schema.
-- Data is intentionally excluded.
-- To rebuild a clean database, apply this file first, then seed/migration files as needed.

--
-- PostgreSQL database dump
--

\restrict FknbTPyRemOQSsP50Ai17B5CccRPXPBo9bx1qMSkWFlCc2zvvRC9jcDzFgBjoPm

-- Dumped from database version 17.10 (Debian 17.10-0+deb13u1)
-- Dumped by pg_dump version 17.10 (Debian 17.10-0+deb13u1)

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET transaction_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- Name: public; Type: SCHEMA; Schema: -; Owner: -
--



--
-- Name: SCHEMA public; Type: COMMENT; Schema: -; Owner: -
--

COMMENT ON SCHEMA public IS 'standard public schema';


SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: admins; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.admins (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    email text NOT NULL,
    password_hash text NOT NULL,
    role text DEFAULT 'admin'::text NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: order_items; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.order_items (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    order_id uuid NOT NULL,
    product_id uuid,
    product_name_snapshot text NOT NULL,
    unit_price_cents integer DEFAULT 0 NOT NULL,
    quantity integer DEFAULT 1 NOT NULL,
    color_id uuid,
    color_name_snapshot text,
    color_hex_snapshot text,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: orders; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.orders (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    reference text NOT NULL,
    status text DEFAULT 'pending'::text NOT NULL,
    customer_first_name text NOT NULL,
    customer_last_name text,
    customer_email text NOT NULL,
    customer_phone text,
    delivery_method text,
    delivery_address text,
    custom_name text,
    custom_message text,
    total_cents integer DEFAULT 0 NOT NULL,
    payment_status text DEFAULT 'pending'::text NOT NULL,
    payment_provider text DEFAULT 'bank_transfer'::text NOT NULL,
    payment_reference text,
    tracking_number text,
    tracking_carrier text,
    paid_at timestamp with time zone,
    confirmation_token_hash text,
    internal_notes text,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: order_notifications; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.order_notifications (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    order_id uuid NOT NULL,
    notification_type text NOT NULL,
    recipient_email text NOT NULL,
    status text DEFAULT 'pending'::text NOT NULL,
    provider text DEFAULT 'resend'::text,
    provider_message_id text,
    error_message text,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    sent_at timestamp with time zone
);


--
-- Name: product_categories; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.product_categories (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    code text NOT NULL,
    name text NOT NULL,
    sort_order integer DEFAULT 0 NOT NULL,
    is_active boolean DEFAULT true NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: product_colors; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.product_colors (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    name text NOT NULL,
    hex_code text NOT NULL,
    sort_order integer DEFAULT 0 NOT NULL,
    is_active boolean DEFAULT true NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: products; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.products (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    category_id uuid NOT NULL,
    name text NOT NULL,
    description text,
    price_cents integer DEFAULT 0 NOT NULL,
    image_url text,
    sort_order integer DEFAULT 0 NOT NULL,
    is_active boolean DEFAULT true NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: shop_settings; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.shop_settings (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    shop_name text DEFAULT 'Elamora'::text NOT NULL,
    currency text DEFAULT 'EUR'::text NOT NULL,
    bank_beneficiary text DEFAULT 'Elamora'::text NOT NULL,
    bank_name text DEFAULT 'Elamora'::text NOT NULL,
    bank_iban text DEFAULT ''::text NOT NULL,
    delivery_fee_cents integer DEFAULT 0 NOT NULL,
    opening_hours text,
    confirmation_message text DEFAULT 'Thank you for your order!'::text NOT NULL,
    orders_enabled boolean DEFAULT true NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: admins admins_email_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.admins
    ADD CONSTRAINT admins_email_key UNIQUE (email);


--
-- Name: admins admins_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.admins
    ADD CONSTRAINT admins_pkey PRIMARY KEY (id);


--
-- Name: order_items order_items_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.order_items
    ADD CONSTRAINT order_items_pkey PRIMARY KEY (id);


--
-- Name: order_notifications order_notifications_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.order_notifications
    ADD CONSTRAINT order_notifications_pkey PRIMARY KEY (id);


--
-- Name: order_notifications order_notifications_order_id_notification_type_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.order_notifications
    ADD CONSTRAINT order_notifications_order_id_notification_type_key UNIQUE (order_id, notification_type);


--
-- Name: orders orders_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.orders
    ADD CONSTRAINT orders_pkey PRIMARY KEY (id);


--
-- Name: orders orders_reference_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.orders
    ADD CONSTRAINT orders_reference_key UNIQUE (reference);


--
-- Name: orders_confirmation_token_hash_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX orders_confirmation_token_hash_key ON public.orders USING btree (confirmation_token_hash) WHERE (confirmation_token_hash IS NOT NULL);


--
-- Name: orders_payment_provider_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX orders_payment_provider_idx ON public.orders USING btree (payment_provider);


--
-- Name: orders_payment_status_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX orders_payment_status_idx ON public.orders USING btree (payment_status);


--
-- Name: order_notifications_order_id_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX order_notifications_order_id_idx ON public.order_notifications USING btree (order_id);


--
-- Name: order_notifications_notification_type_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX order_notifications_notification_type_idx ON public.order_notifications USING btree (notification_type);


--
-- Name: order_notifications_status_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX order_notifications_status_idx ON public.order_notifications USING btree (status);


--
-- Name: product_categories product_categories_code_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.product_categories
    ADD CONSTRAINT product_categories_code_key UNIQUE (code);


--
-- Name: product_categories product_categories_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.product_categories
    ADD CONSTRAINT product_categories_pkey PRIMARY KEY (id);


--
-- Name: product_colors product_colors_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.product_colors
    ADD CONSTRAINT product_colors_pkey PRIMARY KEY (id);


--
-- Name: products products_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.products
    ADD CONSTRAINT products_pkey PRIMARY KEY (id);


--
-- Name: shop_settings shop_settings_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.shop_settings
    ADD CONSTRAINT shop_settings_pkey PRIMARY KEY (id);


--
-- Name: order_items order_items_color_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.order_items
    ADD CONSTRAINT order_items_color_id_fkey FOREIGN KEY (color_id) REFERENCES public.product_colors(id);


--
-- Name: order_notifications order_notifications_order_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.order_notifications
    ADD CONSTRAINT order_notifications_order_id_fkey FOREIGN KEY (order_id) REFERENCES public.orders(id) ON DELETE CASCADE;


--
-- Name: order_items order_items_order_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.order_items
    ADD CONSTRAINT order_items_order_id_fkey FOREIGN KEY (order_id) REFERENCES public.orders(id) ON DELETE CASCADE;


--
-- Name: order_items order_items_product_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.order_items
    ADD CONSTRAINT order_items_product_id_fkey FOREIGN KEY (product_id) REFERENCES public.products(id);


--
-- Name: products products_category_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.products
    ADD CONSTRAINT products_category_id_fkey FOREIGN KEY (category_id) REFERENCES public.product_categories(id);


--
-- PostgreSQL database dump complete
--

\unrestrict FknbTPyRemOQSsP50Ai17B5CccRPXPBo9bx1qMSkWFlCc2zvvRC9jcDzFgBjoPm

