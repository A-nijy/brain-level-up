-- 1. profiles 테이블: auth.users 삭제 시 자동 삭제 설정
ALTER TABLE public.profiles 
DROP CONSTRAINT IF EXISTS profiles_id_fkey,
ADD CONSTRAINT profiles_id_fkey 
    FOREIGN KEY (id) 
    REFERENCES auth.users(id) 
    ON DELETE CASCADE;

-- 2. libraries 테이블: profiles 삭제 시 자동 삭제 설정
ALTER TABLE public.libraries 
DROP CONSTRAINT IF EXISTS libraries_user_id_fkey,
ADD CONSTRAINT libraries_user_id_fkey 
    FOREIGN KEY (user_id) 
    REFERENCES public.profiles(id) 
    ON DELETE CASCADE;

-- 3. shared_libraries 테이블: 작성자 회원 탈퇴 시 작성자 정보를 NULL로 변경 (데이터 보존)
ALTER TABLE public.shared_libraries
DROP CONSTRAINT IF EXISTS shared_libraries_created_by_fkey,
ADD CONSTRAINT shared_libraries_created_by_fkey
    FOREIGN KEY (created_by)
    REFERENCES public.profiles(id)
    ON DELETE SET NULL;

-- 4. [보안 고도화] 회원 본인이 직접 auth.users 계정을 지울 수 있는 함수 (RPC)
-- Supabase Client SDK는 보안상 auth.users를 직접 지울 수 없으므로, 이 함수를 사용합니다.
CREATE OR REPLACE FUNCTION public.delete_user_account()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER -- 선언자 권한으로 실행 (auth.users 삭제 권한 부여)
SET search_path = public, auth
AS $$
BEGIN
  -- 현재 로그인한 사용자의 ID와 일치하는 계정만 삭제 (보안 장치)
  DELETE FROM auth.users WHERE id = auth.uid();
END;
$$;

-- 함수에 대한 접근 시큐리티 설정
REVOKE ALL ON FUNCTION public.delete_user_account() FROM public;
GRANT EXECUTE ON FUNCTION public.delete_user_account() TO authenticated;
