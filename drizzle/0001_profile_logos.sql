ALTER TABLE customers ADD COLUMN IF NOT EXISTS business_start_year smallint;
ALTER TABLE customers ADD COLUMN IF NOT EXISTS employee_range varchar(40);
ALTER TABLE customers ADD COLUMN IF NOT EXISTS monthly_revenue varchar(40);
ALTER TABLE customers ADD COLUMN IF NOT EXISTS owner_role varchar(40);

UPDATE payment_methods SET logo_url = v.url
FROM (VALUES
  ('BCA', 'https://4jgsaomzelkwriht.public.blob.vercel-storage.com/bca9-IbKNyHu93Cn6SG23ej52n4WGSr9Q8i.jpg'),
  ('MANDIRI', 'https://4jgsaomzelkwriht.public.blob.vercel-storage.com/mandiri-OiJcNXAXphLUz93kRkHBT0cDlelKq4.png'),
  ('LINKAJA', 'https://4jgsaomzelkwriht.public.blob.vercel-storage.com/linkaja-logo-MQ0RdHT13BwF96O54LxltoM7rNK6JY.png'),
  ('BRI', 'https://4jgsaomzelkwriht.public.blob.vercel-storage.com/bri-PAGx45zIqEWTHhyJvBkbAXZouRYTfG.png'),
  ('BNI', 'https://4jgsaomzelkwriht.public.blob.vercel-storage.com/bni-YU2aAc67bEdD0QHeYCWqhRRmpAErd0.png'),
  ('BJB', 'https://4jgsaomzelkwriht.public.blob.vercel-storage.com/logo-bjb-5JyA52cVlLlt5wzrqmnqi012PX7CYu.png'),
  ('BNC', 'https://4jgsaomzelkwriht.public.blob.vercel-storage.com/HematpayBNC-VxizZScZEL7HoFAGGe3R7XTkUTmDry.webp'),
  ('CIMB', 'https://4jgsaomzelkwriht.public.blob.vercel-storage.com/cimb-XgzzZPNYCj1lEgpL4qWDouCLTUwA4M.png'),
  ('MUAMALAT', 'https://4jgsaomzelkwriht.public.blob.vercel-storage.com/muamalat-cYrxxhIFBpQYR2IIGIkIWV3KMsjDTP.png'),
  ('PERMATA', 'https://4jgsaomzelkwriht.public.blob.vercel-storage.com/permata-0IaHmiPhtQlQLBmBp1vtp6nmfwosK2.jpg'),
  ('ALFAMART', 'https://4jgsaomzelkwriht.public.blob.vercel-storage.com/alfamart-4jhk2YjGeoyKo8WEpjSrRNIB4Do5SL.png'),
  ('INDOMARET', 'https://4jgsaomzelkwriht.public.blob.vercel-storage.com/indomaret-6LTpkKX31ZqjHTVsiHwVow3jExN1ND.png'),
  ('BCA_MANUAL', 'https://4jgsaomzelkwriht.public.blob.vercel-storage.com/bca9-Zi5EfD9vPgoDPwdsjIORMaXIj7mSoB.jpg'),
  ('MANDIRI_MANUAL', 'https://4jgsaomzelkwriht.public.blob.vercel-storage.com/mandiri-qHIfJdlwKGHQU020btV9Yhr0iUwo4G.png'),
  ('GOPAY', '/payments/gopay.svg'),
  ('SHOPEEPAY', '/payments/shopeepay.svg'),
  ('DANA', '/payments/dana.svg')
) AS v(code, url)
WHERE payment_methods.code = v.code;
