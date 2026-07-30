# Time Trackerígena

Aplicativo para acompanhamento de tempo, com frontend em React/Vite e API em Flask.

## Desenvolvimento local

### Backend

```powershell
.\backend\venv\Scripts\Activate.ps1
flask run --debug
```

A API é iniciada em `http://127.0.0.1:8000` e usa, no desenvolvimento, o banco SQLite local em `database/timetracker.db`.

### Frontend

```powershell
cd frontend
npm run dev
```
