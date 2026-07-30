# API Time Trackerígena

O backend local do projeto Time Trackerígena é construído com Flask e SQLAlchemy.

## Estrutura de Pastas

- `controllers/`: Lida com requisições e respostas HTTP (transforma JSON em objetos e vice-versa).
- `models/`: Definições das tabelas do banco de dados (SQLAlchemy).
- `repositories/`: Camada de acesso a banco de dados (CRUD).
- `routes/`: Declaração dos endpoints (Blueprints).
- `schemas/`: Serilização, desserialização e validação (Marshmallow).
- `services/`: Regras de negócio e orquestração dos repositórios.
- `utils/`: Configurações de respostas e database.

## Rotas Principais

### Projetos (`/api/projects`)
- `GET /` - Lista projetos (aceita query `?category=Loco` ou `Freelas`)
- `POST /` - Cria projeto (body: `{name, category}`)
- `PUT /<id>` - Atualiza projeto
- `DELETE /<id>` - Remove projeto

### Tarefas (`/api/tasks`)
- `GET /` - Lista tarefas (aceita query `?category=Loco` ou `project_id=1`)
- `POST /` - Cria tarefa (body: `{project_id, name, color, hourly_rate, is_billed}`)
- `PUT /<id>` - Atualiza tarefa
- `DELETE /<id>` - Remove tarefa

### Entradas de Tempo (`/api/time-entries`)
- `GET /` - Lista entradas (aceita limit, category, task_id)
- `POST /` - Cria entrada (body: `{task_id, start_time, duration_seconds, notes}`)
- `GET /stats` - Retorna agregados por categoria, tarefa e dias da semana.
