import sqlite3
import os

db_path = '../database/timetracker.db'

def migrate():
    if not os.path.exists(db_path):
        print(f"Database not found at {db_path}")
        return

    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()

    # Create projects table if it doesn't exist
    cursor.execute('''
    CREATE TABLE IF NOT EXISTS projects (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name VARCHAR(100) NOT NULL,
        category VARCHAR(20) NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
    ''')

    # Check if tasks still has category
    cursor.execute("PRAGMA table_info(tasks)")
    columns = [col[1] for col in cursor.fetchall()]
    if 'category' not in columns:
        print("Migration already applied: 'category' column not found in tasks table.")
        return

    print("Migrating tasks to projects...")
    
    # 1. Ensure default projects exist
    cursor.execute("SELECT id FROM projects WHERE name = 'Default Loco' AND category = 'Loco'")
    if not cursor.fetchone():
        cursor.execute("INSERT INTO projects (name, category) VALUES ('Default Loco', 'Loco')")
    
    cursor.execute("SELECT id FROM projects WHERE name = 'Default Freelas' AND category = 'Freelas'")
    if not cursor.fetchone():
        cursor.execute("INSERT INTO projects (name, category) VALUES ('Default Freelas', 'Freelas')")

    conn.commit()

    # Get project IDs
    cursor.execute("SELECT id FROM projects WHERE name = 'Default Loco'")
    loco_pid = cursor.fetchone()[0]
    cursor.execute("SELECT id FROM projects WHERE name = 'Default Freelas'")
    freelas_pid = cursor.fetchone()[0]

    # Create new tasks table
    cursor.execute('''
    CREATE TABLE tasks_new (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        project_id INTEGER NOT NULL,
        name VARCHAR(100) NOT NULL,
        color VARCHAR(7) DEFAULT '#6366f1',
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        is_active BOOLEAN DEFAULT 1,
        hourly_rate FLOAT DEFAULT 0.0,
        is_billed BOOLEAN DEFAULT 0,
        FOREIGN KEY (project_id) REFERENCES projects(id)
    )
    ''')

    # Copy data
    cursor.execute("SELECT id, name, category, color, created_at, is_active, hourly_rate, is_billed FROM tasks")
    rows = cursor.fetchall()
    
    for row in rows:
        task_id, name, category, color, created_at, is_active, hourly_rate, is_billed = row
        project_id = loco_pid if category == 'Loco' else freelas_pid
        
        # Safely handle missing columns if previous migrations were incomplete
        try:
            hourly_rate = hourly_rate if hourly_rate is not None else 0.0
            is_billed = is_billed if is_billed is not None else 0
        except NameError:
            hourly_rate = 0.0
            is_billed = 0

        cursor.execute('''
            INSERT INTO tasks_new (id, project_id, name, color, created_at, is_active, hourly_rate, is_billed)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        ''', (task_id, project_id, name, color, created_at, is_active, hourly_rate, is_billed))

    # Swap tables
    cursor.execute("DROP TABLE tasks")
    cursor.execute("ALTER TABLE tasks_new RENAME TO tasks")

    conn.commit()
    conn.close()
    print("Migration successful.")

if __name__ == "__main__":
    migrate()
