# maewchat

Realtime chat with Next.js + Supabase

## Quick setup (สรุป)

1. สร้าง GitHub repo ชื่อ: gittisak-go/maewchat
   - ด้วย gh CLI:
     gh repo create gittisak-go/maewchat --public

2. สร้าง Next.js project (ถ้ายังไม่มี)
   npx create-next-app@latest maewchat
   cd maewchat

3. วางไฟล์:
   - maewchat_schema.sql → ใช้ใน Supabase SQL Editor
   - src/lib/supabaseClient.js → วางในโปรเจกต์
   - .env.local → ตั้งค่า env vars ตาม template

4. สร้าง Supabase project:
   - https://app.supabase.com → New Project
   - คัดลอก Project URL และ ANON key

5. ใน Supabase → SQL Editor → วาง `maewchat_schema.sql` แล้ว Run

6. สร้าง Storage bucket ชื่อ `avatars` (public/private ตามต้องการ)

7. รัน local:
   npm install
   npm run dev
   (Next.js มาตรฐานใช้พอร์ต 3000)

8. Deploy to Vercel:
   - เชื่อม repo gittisak-go/maewchat กับ Vercel
   - ใน Vercel Project Settings > Environment Variables ใส่:
     NEXT_PUBLIC_SUPABASE_URL
     NEXT_PUBLIC_SUPABASE_ANON_KEY
     SUPABASE_URL
     SUPABASE_SERVICE_ROLE_KEY (production only, mark as secret)

## Notes / Security
- อย่า commit service_role key ลง repo
- ทดสอบ RLS ให้แนใจว่าไม่มีข้อมูลรั่วไหล
- ใช้ signed URLs ถ้าคุณตั้ง bucket เป็น private

## Next steps I can help with
- สร้างหน้า chat ตัวอย่างและ API routes พร้อม push เป็น commit-ready
- สร้างชุดคำสั่ง SQL ที่แตกเป็นไฟล์ seed / migrate