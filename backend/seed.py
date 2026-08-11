"""
Seed do banco de dados do Time Trackerígena.

Popula o banco com dados realistas de demonstração:
  - 1 usuário demo (já ativo)
  - 3 categorias: Freelas, Loco, Pessoal
  - 6 projetos distribuídos entre as categorias
  - 12 tasks com taxas e cores variadas
  - ~40 time entries distribuídas nos últimos 60 dias

Uso:
    python seed.py             # insere dados (pula se já existir o usuário demo)
    python seed.py --reset     # apaga tudo e recria
"""

import argparse
import os
import sys
from datetime import datetime, timedelta
import random

# Garante que a pasta backend está no path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

import bcrypt as _bcrypt

from utils.database import Base, SessionLocal, engine
from models.user import User
from models.category import Category
from models.project import Project, ProjectDeadlineHistory
from models.task import Task
from models.time_entry import TimeEntry


# ──────────────────────────────────────────────────
# Dados de demonstração
# ──────────────────────────────────────────────────

DEMO_USER = {
    "username": "demo",
    "email": "demo@timetracker.dev",
    "password": "Demo@1234",
    "full_name": "Usuário Demo",
    "country": "Brasil",
    "is_active": True,
}

CATEGORIES = ["Freelas", "Loco", "Pessoal"]

# (name, category, deadline, status, notes)
PROJECTS = [
    ("Site E-commerce",   "Freelas", "2026-09-15", "em_andamento",        "Loja para cliente do setor de moda."),
    ("App Mobile Saúde",  "Freelas", "2026-10-01", "urgente",              "MVP para captação de investidores."),
    ("Dashboard Analytics","Freelas","2026-08-30", "em_revisao",           "Revisão de UX com cliente."),
    ("Portal Interno",    "Loco",    "2026-11-20", "em_andamento",         "Ferramenta interna de gestão."),
    ("Redesign UI",       "Loco",    "2026-09-05", "aguardando_cliente",   "Aguardando aprovação de mockups."),
    ("Curso React",       "Pessoal", None,         "em_andamento",         "Aprender React 19 e ecosystem moderno."),
]

# (name, project_index, color, hourly_rate, currency, budgeted_hours, is_billed)
TASKS = [
    ("Desenvolvimento Backend",  0, "#6366f1", 80.0,  "EUR", 40.0,  False),
    ("Frontend React",           0, "#10b981", 70.0,  "EUR", 30.0,  True),
    ("Integração de Pagamentos", 0, "#f59e0b", 90.0,  "EUR", 10.0,  False),
    ("Telas de Onboarding",      1, "#ec4899", 75.0,  "BRL", 20.0,  False),
    ("API REST",                 1, "#3b82f6", 85.0,  "BRL", 35.0,  False),
    ("Componentes de Gráficos",  2, "#8b5cf6", 65.0,  "EUR", 25.0,  True),
    ("Autenticação SSO",         2, "#06b6d4", 95.0,  "EUR", 8.0,   False),
    ("Módulo de Relatórios",     3, "#f97316", 60.0,  "BRL", 50.0,  False),
    ("Design System",            4, "#14b8a6", 55.0,  "EUR", 30.0,  False),
    ("Prototipação Figma",       4, "#a855f7", 50.0,  "EUR", 15.0,  True),
    ("Módulo 1 – Fundamentos",   5, "#22c55e",  0.0,  "BRL", None,  False),
    ("Módulo 2 – Hooks",         5, "#eab308",  0.0,  "BRL", None,  False),
]

# Notas aleatórias para time entries
NOTES_POOL = [
    "Reunião de alinhamento com cliente",
    "Implementação concluída",
    "Code review",
    "Correção de bugs",
    "Testes unitários",
    "Deploy em staging",
    "Documentação",
    "Refatoração de código",
    "Integração com API externa",
    "Pair programming",
    None,
    None,
]


def generate_time_entries(task_id: int, count: int, base_date: datetime) -> list[TimeEntry]:
    """Gera `count` time entries espalhadas nos últimos 60 dias a partir de base_date."""
    entries = []
    for _ in range(count):
        days_ago = random.randint(0, 60)
        hour_start = random.randint(8, 18)
        minute_start = random.choice([0, 15, 30, 45])
        duration_min = random.choice([30, 45, 60, 90, 120, 150, 180])

        start = base_date - timedelta(days=days_ago, hours=24 - hour_start, minutes=60 - minute_start)
        end = start + timedelta(minutes=duration_min)

        entries.append(TimeEntry(
            task_id=task_id,
            start_time=start,
            end_time=end,
            duration_seconds=duration_min * 60,
            notes=random.choice(NOTES_POOL),
        ))
    return entries


def run_seed(reset: bool = False):
    """Executa o seed completo."""

    # Cria tabelas se não existirem
    Base.metadata.create_all(bind=engine)

    db = SessionLocal()
    try:
        # ── Reset ───────────────────────────────────────────────────────────
        if reset:
            print("[RESET] Apagando dados existentes...")
            db.query(TimeEntry).delete()
            db.query(Task).delete()
            db.query(ProjectDeadlineHistory).delete()
            db.query(Project).delete()
            db.query(Category).delete()
            db.query(User).filter(User.username == DEMO_USER["username"]).delete()
            db.commit()
            print("[OK] Dados apagados.\n")

        # ── Usuário ─────────────────────────────────────────────────────────
        existing_user = db.query(User).filter(User.username == DEMO_USER["username"]).first()
        if existing_user:
            print(f"[INFO] Usuario '{DEMO_USER['username']}' ja existe. Use --reset para recriar.")
            return

        print(f"[+] Criando usuario '{DEMO_USER['username']}'...")
        user = User(
            username=DEMO_USER["username"],
            email=DEMO_USER["email"],
            password_hash=_bcrypt.hashpw(DEMO_USER["password"].encode("utf-8"), _bcrypt.gensalt()).decode("utf-8"),
            full_name=DEMO_USER["full_name"],
            country=DEMO_USER["country"],
            is_active=DEMO_USER["is_active"],
        )
        db.add(user)
        db.flush()  # obtém user.id

        # ── Categorias ───────────────────────────────────────────────────────
        print("[+] Criando categorias...")
        category_map: dict[str, Category] = {}
        for cat_name in CATEGORIES:
            existing = db.query(Category).filter(Category.name == cat_name).first()
            if existing:
                category_map[cat_name] = existing
            else:
                cat = Category(name=cat_name)
                db.add(cat)
                db.flush()
                category_map[cat_name] = cat
                print(f"   + {cat_name}")

        # ── Projetos ─────────────────────────────────────────────────────────
        print("[+] Criando projetos...")
        project_list: list[Project] = []
        for p_name, p_cat, p_deadline, p_status, p_notes in PROJECTS:
            proj = Project(
                user_id=user.id,
                name=p_name,
                category=p_cat,
                deadline=p_deadline,
                status=p_status,
                notes=p_notes,
            )
            db.add(proj)
            db.flush()
            project_list.append(proj)
            print(f"   + [{p_cat}] {p_name}")

        # ── Tasks ────────────────────────────────────────────────────────────
        print("[+] Criando tasks...")
        task_list: list[Task] = []
        for t_name, p_idx, t_color, t_rate, t_curr, t_bh, t_billed in TASKS:
            task = Task(
                project_id=project_list[p_idx].id,
                name=t_name,
                color=t_color,
                hourly_rate=t_rate,
                currency=t_curr,
                budgeted_hours=t_bh,
                is_billed=t_billed,
            )
            db.add(task)
            db.flush()
            task_list.append(task)
            print(f"   + {t_name}")

        # ── Time Entries ─────────────────────────────────────────────────────
        print("[+] Gerando time entries...")
        base_date = datetime.utcnow()
        total_entries = 0
        for task in task_list:
            count = random.randint(2, 6)
            entries = generate_time_entries(task.id, count, base_date)
            for entry in entries:
                db.add(entry)
            total_entries += count

        db.commit()
        print(f"\n[OK] Seed concluido com sucesso!")
        print(f"   Usuario  : {DEMO_USER['username']} ou {DEMO_USER['email']}")
        print(f"   Senha    : {DEMO_USER['password']}")
        print(f"   Categorias : {len(CATEGORIES)}")
        print(f"   Projetos   : {len(project_list)}")
        print(f"   Tasks      : {len(task_list)}")
        print(f"   Time entries: ~{total_entries}")

    except Exception as exc:
        db.rollback()
        print(f"\n[ERRO] Erro durante o seed: {exc}")
        raise
    finally:
        db.close()


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Seed do banco de dados Time Trackerígena")
    parser.add_argument("--reset", action="store_true", help="Apaga dados existentes antes de inserir")
    args = parser.parse_args()

    run_seed(reset=args.reset)
