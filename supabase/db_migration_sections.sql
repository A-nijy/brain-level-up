-- 1. Create library_sections table
CREATE TABLE IF NOT EXISTS public.library_sections (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    library_id UUID NOT NULL REFERENCES public.libraries(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    display_order INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Add section_id to items table
ALTER TABLE public.items ADD COLUMN IF NOT EXISTS section_id UUID REFERENCES public.library_sections(id) ON DELETE CASCADE;

-- 3. Create shared_sections table
CREATE TABLE IF NOT EXISTS public.shared_sections (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    shared_library_id UUID NOT NULL REFERENCES public.shared_libraries(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    display_order INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. Add shared_section_id to shared_items table
ALTER TABLE public.shared_items ADD COLUMN IF NOT EXISTS shared_section_id UUID REFERENCES public.shared_sections(id) ON DELETE CASCADE;

-- 5. Data Migration: Create "Default" sections for existing libraries
DO $$
DECLARE
    lib_row RECORD;
    new_section_id UUID;
BEGIN
    -- For user libraries
    FOR lib_row IN SELECT id FROM public.libraries LOOP
        -- Check if a '기본' section already exists for this library (to avoid duplicate runs)
        IF NOT EXISTS (SELECT 1 FROM public.library_sections WHERE library_id = lib_row.id AND title = '기본') THEN
            INSERT INTO public.library_sections (library_id, title, display_order)
            VALUES (lib_row.id, '기본', 0)
            RETURNING id INTO new_section_id;

            UPDATE public.items
            SET section_id = new_section_id
            WHERE library_id = lib_row.id AND section_id IS NULL;
        END IF;
    END LOOP;

    -- For shared libraries
    FOR lib_row IN SELECT id FROM public.shared_libraries LOOP
        -- Check if a '기본' section already exists for this library
        IF NOT EXISTS (SELECT 1 FROM public.shared_sections WHERE shared_library_id = lib_row.id AND title = '기본') THEN
            INSERT INTO public.shared_sections (shared_library_id, title, display_order)
            VALUES (lib_row.id, '기본', 0)
            RETURNING id INTO new_section_id;

            UPDATE public.shared_items
            SET shared_section_id = new_section_id
            WHERE shared_library_id = lib_row.id AND shared_section_id IS NULL;
        END IF;
    END LOOP;
END $$;

-- 6. Enable RLS for new tables
ALTER TABLE public.library_sections ENABLE ROW LEVEL SECURITY;

-- 7. Add RLS policies for library_sections
-- Drop existing if exists to avoid error on rerun
DROP POLICY IF EXISTS "Users can manage sections of their own libraries" ON public.library_sections;
CREATE POLICY "Users can manage sections of their own libraries" 
ON public.library_sections
FOR ALL 
USING (
    EXISTS (
        SELECT 1 FROM public.libraries 
        WHERE id = library_sections.library_id 
        AND user_id = auth.uid()
    )
);

-- shared_sections are public for reading
ALTER TABLE public.shared_sections ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public can read shared sections" ON public.shared_sections;
CREATE POLICY "Public can read shared sections" ON public.shared_sections FOR SELECT USING (true);
