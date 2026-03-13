-- ROLES
CREATE TABLE IF NOT EXISTS roles (
  id SERIAL PRIMARY KEY,
  name VARCHAR(50) UNIQUE NOT NULL,
  permissions JSONB DEFAULT '{}',
  created_at TIMESTAMP DEFAULT NOW()
);

-- USERS
CREATE TABLE IF NOT EXISTS users (
  id SERIAL PRIMARY KEY,
  email VARCHAR(255) UNIQUE NOT NULL,
  password VARCHAR(255) NOT NULL,
  role_id INTEGER REFERENCES roles(id),
  first_name VARCHAR(100) NOT NULL,
  last_name VARCHAR(100) NOT NULL,
  phone VARCHAR(20),
  class_name VARCHAR(50),
  profile_photo VARCHAR(500),
  is_active BOOLEAN DEFAULT true,
  last_login TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- ACADEMIC YEARS
CREATE TABLE IF NOT EXISTS academic_years (
  id SERIAL PRIMARY KEY,
  name VARCHAR(50) NOT NULL,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  is_current BOOLEAN DEFAULT false,
  created_at TIMESTAMP DEFAULT NOW()
);

-- CLASSES
CREATE TABLE IF NOT EXISTS classes (
  id SERIAL PRIMARY KEY,
  name VARCHAR(50) NOT NULL,
  section VARCHAR(10),
  academic_year_id INTEGER REFERENCES academic_years(id),
  class_teacher_id INTEGER REFERENCES users(id),
  capacity INTEGER DEFAULT 40,
  created_at TIMESTAMP DEFAULT NOW()
);

-- SUBJECTS
CREATE TABLE IF NOT EXISTS subjects (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  code VARCHAR(20) UNIQUE NOT NULL,
  class_id INTEGER REFERENCES classes(id),
  teacher_id INTEGER REFERENCES users(id),
  created_at TIMESTAMP DEFAULT NOW()
);

-- STUDENTS
CREATE TABLE IF NOT EXISTS students (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id),
  admission_number VARCHAR(50) UNIQUE NOT NULL,
  class_id INTEGER REFERENCES classes(id),
  date_of_birth DATE,
  gender VARCHAR(10),
  address TEXT,
  blood_group VARCHAR(5),
  emergency_contact VARCHAR(20),
  admission_date DATE DEFAULT CURRENT_DATE,
  created_at TIMESTAMP DEFAULT NOW()
);

-- PARENTS
CREATE TABLE IF NOT EXISTS parents (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id),
  student_id INTEGER REFERENCES students(id),
  relation VARCHAR(20),
  occupation VARCHAR(100),
  created_at TIMESTAMP DEFAULT NOW()
);

-- ATTENDANCE
CREATE TABLE IF NOT EXISTS attendance (
  id SERIAL PRIMARY KEY,
  student_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  teacher_id INTEGER REFERENCES users(id),
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  status VARCHAR(20) DEFAULT 'present',
  class_id INTEGER,
  subject VARCHAR(100) DEFAULT 'General',
  created_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(student_id, date, subject)
);

-- TIMETABLE
CREATE TABLE IF NOT EXISTS timetable (
  id SERIAL PRIMARY KEY,
  class_id INTEGER REFERENCES classes(id),
  subject_id INTEGER REFERENCES subjects(id),
  teacher_id INTEGER REFERENCES users(id),
  day_of_week INTEGER CHECK (day_of_week BETWEEN 0 AND 6),
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  room VARCHAR(50),
  created_at TIMESTAMP DEFAULT NOW()
);

-- ASSIGNMENTS
CREATE TABLE IF NOT EXISTS assignments (
  id SERIAL PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  subject_id INTEGER REFERENCES subjects(id),
  class_id INTEGER REFERENCES classes(id),
  teacher_id INTEGER REFERENCES users(id),
  due_date TIMESTAMP NOT NULL,
  max_marks INTEGER DEFAULT 100,
  attachment_url VARCHAR(500),
  created_at TIMESTAMP DEFAULT NOW()
);

-- ASSIGNMENT SUBMISSIONS
CREATE TABLE IF NOT EXISTS assignment_submissions (
  id SERIAL PRIMARY KEY,
  assignment_id INTEGER REFERENCES assignments(id) ON DELETE CASCADE,
  student_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  file_path VARCHAR(500),
  original_filename VARCHAR(255),
  text_content TEXT,
  submitted_at TIMESTAMP DEFAULT NOW(),
  is_late BOOLEAN DEFAULT FALSE,
  status VARCHAR(50) DEFAULT 'submitted',
  grade DECIMAL(5,2),
  feedback TEXT,
  graded_at TIMESTAMP,
  UNIQUE(assignment_id, student_id)
);

-- EXAMS
CREATE TABLE IF NOT EXISTS exams (
  id SERIAL PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  exam_type VARCHAR(50),
  subject_id INTEGER REFERENCES subjects(id),
  class_id INTEGER REFERENCES classes(id),
  exam_date DATE NOT NULL,
  start_time TIME,
  duration_minutes INTEGER,
  total_marks INTEGER DEFAULT 100,
  passing_marks INTEGER DEFAULT 33,
  created_by INTEGER REFERENCES users(id),
  created_at TIMESTAMP DEFAULT NOW()
);

-- EXAM RESULTS
CREATE TABLE IF NOT EXISTS exam_results (
  id SERIAL PRIMARY KEY,
  exam_id INTEGER REFERENCES exams(id),
  student_id INTEGER REFERENCES students(id),
  marks_obtained DECIMAL(5,2),
  grade VARCHAR(5),
  remarks TEXT,
  entered_by INTEGER REFERENCES users(id),
  created_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(exam_id, student_id)
);

-- FEES
CREATE TABLE IF NOT EXISTS fee_types (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  amount DECIMAL(10,2) NOT NULL,
  frequency VARCHAR(20),
  class_id INTEGER REFERENCES classes(id),
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS fee_payments (
  id SERIAL PRIMARY KEY,
  student_id INTEGER REFERENCES students(id),
  fee_type_id INTEGER REFERENCES fee_types(id),
  amount_paid DECIMAL(10,2) NOT NULL,
  payment_date DATE DEFAULT CURRENT_DATE,
  payment_method VARCHAR(50),
  transaction_id VARCHAR(100),
  receipt_number VARCHAR(50) UNIQUE,
  remarks TEXT,
  recorded_by INTEGER REFERENCES users(id),
  due_date DATE,
  status VARCHAR(20) DEFAULT 'paid',
  created_at TIMESTAMP DEFAULT NOW()
);

-- MESSAGING
CREATE TABLE IF NOT EXISTS messages (
  id SERIAL PRIMARY KEY,
  sender_id INTEGER REFERENCES users(id),
  receiver_id INTEGER REFERENCES users(id),
  group_id INTEGER,
  subject VARCHAR(255),
  body TEXT NOT NULL,
  is_read BOOLEAN DEFAULT false,
  read_at TIMESTAMP,
  attachment_url VARCHAR(500),
  created_at TIMESTAMP DEFAULT NOW()
);

-- NOTIFICATIONS
CREATE TABLE IF NOT EXISTS notifications (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id),
  title VARCHAR(255) NOT NULL,
  body TEXT NOT NULL,
  type VARCHAR(50),
  is_read BOOLEAN DEFAULT false,
  link VARCHAR(500),
  created_at TIMESTAMP DEFAULT NOW()
);

-- LESSON PLANS
CREATE TABLE IF NOT EXISTS lesson_plans (
  id SERIAL PRIMARY KEY,
  teacher_id INTEGER REFERENCES users(id),
  subject_id INTEGER REFERENCES subjects(id),
  class_id INTEGER REFERENCES classes(id),
  title VARCHAR(255) NOT NULL,
  objectives TEXT,
  content TEXT,
  resources TEXT,
  date DATE,
  duration_minutes INTEGER,
  created_at TIMESTAMP DEFAULT NOW()
);

-- EVENTS & CALENDAR
CREATE TABLE IF NOT EXISTS events (
  id SERIAL PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  event_type VARCHAR(50),
  start_date TIMESTAMP NOT NULL,
  end_date TIMESTAMP,
  is_holiday BOOLEAN DEFAULT false,
  created_by INTEGER REFERENCES users(id),
  audience VARCHAR(20) DEFAULT 'all',
  created_at TIMESTAMP DEFAULT NOW()
);

-- DOCUMENTS
CREATE TABLE IF NOT EXISTS documents (
  id SERIAL PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  category VARCHAR(100),
  file_url VARCHAR(500) NOT NULL,
  uploaded_by INTEGER REFERENCES users(id),
  access_roles JSONB DEFAULT '["all"]',
  created_at TIMESTAMP DEFAULT NOW()
);

-- LEARNING MATERIALS
CREATE TABLE IF NOT EXISTS learning_materials (
  id SERIAL PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  subject_id INTEGER REFERENCES subjects(id),
  class_id INTEGER REFERENCES classes(id),
  file_url VARCHAR(500),
  material_type VARCHAR(20),
  uploaded_by INTEGER REFERENCES users(id),
  created_at TIMESTAMP DEFAULT NOW()
);

-- SURVEYS / FEEDBACK
CREATE TABLE IF NOT EXISTS surveys (
  id SERIAL PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  questions JSONB NOT NULL,
  target_role VARCHAR(50),
  created_by INTEGER REFERENCES users(id),
  deadline DATE,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS survey_responses (
  id SERIAL PRIMARY KEY,
  survey_id INTEGER REFERENCES surveys(id),
  respondent_id INTEGER REFERENCES users(id),
  responses JSONB NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);

-- STAFF / HR
CREATE TABLE IF NOT EXISTS staff (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id),
  employee_id VARCHAR(50) UNIQUE NOT NULL,
  department VARCHAR(100),
  designation VARCHAR(100),
  date_of_joining DATE,
  salary DECIMAL(10,2),
  pan_number VARCHAR(20),
  contract_type VARCHAR(30),
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS leave_applications (
  id SERIAL PRIMARY KEY,
  staff_id INTEGER REFERENCES staff(id),
  leave_type VARCHAR(50),
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  reason TEXT,
  status VARCHAR(20) DEFAULT 'pending',
  approved_by INTEGER REFERENCES users(id),
  created_at TIMESTAMP DEFAULT NOW()
);

-- ADMISSIONS
CREATE TABLE IF NOT EXISTS admissions (
  id SERIAL PRIMARY KEY,
  applicant_name VARCHAR(200) NOT NULL,
  date_of_birth DATE,
  gender VARCHAR(10),
  applying_for_class VARCHAR(50),
  parent_name VARCHAR(200),
  parent_email VARCHAR(255),
  parent_phone VARCHAR(20),
  address TEXT,
  documents JSONB DEFAULT '[]',
  status VARCHAR(30) DEFAULT 'inquiry',
  merit_score DECIMAL(5,2),
  created_at TIMESTAMP DEFAULT NOW()
);

-- ASSETS
CREATE TABLE IF NOT EXISTS assets (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  asset_type VARCHAR(100),
  location VARCHAR(100),
  purchase_date DATE,
  purchase_cost DECIMAL(10,2),
  condition VARCHAR(20),
  assigned_to INTEGER REFERENCES users(id),
  last_maintenance DATE,
  next_maintenance DATE,
  created_at TIMESTAMP DEFAULT NOW()
);

-- ANNOUNCEMENTS
CREATE TABLE IF NOT EXISTS announcements (
  id SERIAL PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  content TEXT NOT NULL,
  target VARCHAR(50) DEFAULT 'all',
  priority VARCHAR(20) DEFAULT 'medium',
  created_by INTEGER REFERENCES users(id),
  created_at TIMESTAMP DEFAULT NOW()
);

-- SEED DEFAULT ROLES
INSERT INTO roles (name, permissions) VALUES
  ('admin', '{"all": true}'),
  ('principal', '{"view_all": true, "manage_staff": true, "view_reports": true}'),
  ('teacher', '{"manage_attendance": true, "manage_assignments": true, "view_students": true}'),
  ('student', '{"view_own": true, "submit_assignments": true}'),
  ('parent', '{"view_child": true, "message_teacher": true}')
ON CONFLICT (name) DO NOTHING;