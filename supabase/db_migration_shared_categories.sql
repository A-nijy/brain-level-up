-- 1. 공유 자료실 카테고리 테이블 생성
CREATE TABLE IF NOT EXISTS shared_library_categories (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title TEXT NOT NULL,
    display_order INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. shared_libraries 테이블에 category_id 추가
ALTER TABLE shared_libraries ADD COLUMN IF NOT EXISTS category_id UUID REFERENCES shared_library_categories(id);

-- 3. 기존 카테고리(TEXT) 마이그레이션 로직
DO $$
DECLARE
    cat_record RECORD;
BEGIN
    -- 기존 shared_libraries 에 있는 고유한 카테고리 명칭들을 가져와서 shared_library_categories 에 삽입
    FOR cat_record IN SELECT DISTINCT category FROM shared_libraries WHERE category IS NOT NULL AND category <> '' LOOP
        INSERT INTO shared_library_categories (title)
        VALUES (cat_record.category)
        ON CONFLICT DO NOTHING;
    END LOOP;

    -- shared_libraries 의 category_id 를 생성된 카테고리 ID로 업데이트
    UPDATE shared_libraries sl
    SET category_id = slc.id
    FROM shared_library_categories slc
    WHERE sl.category = slc.title;
END $$;
