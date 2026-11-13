CREATE TABLE users (
  id uuid primary key default gen_random_uuid(),
  full_name text not null,
  email text unique not null,
  role text not null check (role in ('Admin','Energy Manager','Zone Manager','Viewer')),
  status text default 'Active' check (status in ('Active','Inactive')),
  last_login timestamptz default now(),
  created_at timestamptz default now()
);

-- Seed with literal existing mock users
INSERT INTO users (full_name, email, role, status) VALUES 
('Alice Admin', 'alice@clinergy.com', 'Admin', 'Active'),
('Bob Energy', 'bob@clinergy.com', 'Energy Manager', 'Active'),
('Charlie Zone', 'charlie@hospital.org', 'Zone Manager', 'Active'),
('Diana Viewer', 'diana@external.org', 'Viewer', 'Inactive');
