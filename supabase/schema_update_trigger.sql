-- 1. profiles 테이블에 column 누락 방지 (존재하지 않으면 추가)
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='profiles' AND column_name='role') THEN
        ALTER TABLE public.profiles ADD COLUMN role text default 'user' check (role in ('user', 'admin'));
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='profiles' AND column_name='membership_level') THEN
        ALTER TABLE public.profiles ADD COLUMN membership_level text default 'BASIC' check (membership_level in ('BASIC', 'PREMIUM', 'PRO'));
    END IF;
END $$;

-- 2. 신규 사용자 생성 트리거(Supabase Auth) 로직의 예외 처리 강화
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, email, role, membership_level)
  values (new.id, coalesce(new.email, 'guest@mem-app.com'), 'user', 'BASIC')
  on conflict (id) do nothing;
  
  return new;
exception
  when others then
    -- 테이블이 아직 없거나 제약조건 위반 시에도 auth.users 가입은 성공시키기 위함
    return new;
end;
$$ language plpgsql security definer;
