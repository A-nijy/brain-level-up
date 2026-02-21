-- 1. profiles 테이블의 외래키 제약조건 제거 후 ON DELETE CASCADE 추가
ALTER TABLE public.profiles 
DROP CONSTRAINT IF EXISTS profiles_id_fkey,
ADD CONSTRAINT profiles_id_fkey 
    FOREIGN KEY (id) 
    REFERENCES auth.users(id) 
    ON DELETE CASCADE;

-- 2. libraries 테이블의 외래키 제약조건 제거 후 ON DELETE CASCADE 추가
ALTER TABLE public.libraries 
DROP CONSTRAINT IF EXISTS libraries_user_id_fkey,
ADD CONSTRAINT libraries_user_id_fkey 
    FOREIGN KEY (user_id) 
    REFERENCES public.profiles(id) 
    ON DELETE CASCADE;

-- (참고) items 테이블은 이미 schema.sql에 ON DELETE CASCADE가 설정되어 있으므로 추가 조치 불필요
-- 만약 불안하다면 아래 구문 실행 가능
-- ALTER TABLE public.items DROP CONSTRAINT IF EXISTS items_library_id_fkey,
-- ADD CONSTRAINT items_library_id_fkey FOREIGN KEY (library_id) REFERENCES public.libraries(id) ON DELETE CASCADE;
