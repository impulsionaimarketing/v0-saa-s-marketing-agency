-- Add modules_access column to users table
-- This column stores which modules/pages each user can access

ALTER TABLE users 
ADD COLUMN IF NOT EXISTS modules_access TEXT[] DEFAULT ARRAY[
  'dashboard',
  'clientes', 
  'colaboradores',
  'demandas',
  'producao',
  'trafego',
  'cobrancas',
  'alertas',
  'configuracoes'
];

-- Update existing users to have all access by default
UPDATE users 
SET modules_access = ARRAY[
  'dashboard',
  'clientes', 
  'colaboradores',
  'demandas',
  'producao',
  'trafego',
  'cobrancas',
  'alertas',
  'configuracoes'
]
WHERE modules_access IS NULL;

-- Set restricted access for Vitor (only modules he needs)
UPDATE users 
SET modules_access = ARRAY[
  'dashboard',
  'demandas',
  'producao'
]
WHERE email = 'vitor@impulsionaimarketing.com.br';

COMMENT ON COLUMN users.modules_access IS 'Array of module names that the user has permission to access';
