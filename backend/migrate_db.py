import sqlite3
import os

DB_PATH = os.path.join("database", "time_tracker.db")

def migrate():
    # If using absolute path is needed:
    db_file = os.path.abspath(DB_PATH)
    if not os.path.exists(db_file):
        print("Database not found at", db_file)
        return

    conn = sqlite3.connect(db_file)
    cursor = conn.cursor()

    def column_exists(table, column):
        cursor.execute(f"PRAGMA table_info({table})")
        columns = [row[1] for row in cursor.fetchall()]
        return column in columns

    try:
        if not column_exists("projects", "deadline_notified"):
            cursor.execute("ALTER TABLE projects ADD COLUMN deadline_notified BOOLEAN DEFAULT 0")
            print("Added deadline_notified to projects")
            
        if not column_exists("tasks", "deadline"):
            cursor.execute("ALTER TABLE tasks ADD COLUMN deadline VARCHAR(10)")
            cursor.execute("ALTER TABLE tasks ADD COLUMN status VARCHAR(30) DEFAULT 'em_andamento'")
            cursor.execute("ALTER TABLE tasks ADD COLUMN notes TEXT")
            cursor.execute("ALTER TABLE tasks ADD COLUMN deadline_notified BOOLEAN DEFAULT 0")
            print("Added deadline fields to tasks")
        
        # Create table task_deadline_history
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS task_deadline_history (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                task_id INTEGER NOT NULL,
                old_deadline VARCHAR(10),
                new_deadline VARCHAR(10),
                changed_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY(task_id) REFERENCES tasks(id)
            )
        """)
        print("Created task_deadline_history table")

        conn.commit()
        print("Migration successful.")
    except Exception as e:
        print("Error during migration:", e)
        conn.rollback()
    finally:
        conn.close()

if __name__ == "__main__":
    migrate()
