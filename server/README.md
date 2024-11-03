# Email Platform

En moderne email platform bygget med React, Node.js og TypeScript.

## 🚀 Features

- ✉️ Email kampagne håndtering
- 📊 Detaljeret statistik og tracking
- 👥 Subscriber liste administration
- 📱 Responsivt design
- 🌙 Mørk/lys tema
- 🔒 Sikker authentication
- 📈 Real-time analytics

## 🛠️ Tech Stack

### Frontend
- React
- TypeScript
- Vite
- TailwindCSS
- shadcn/ui
- React Query
- React Hook Form
- Zod

### Backend
- Node.js
- Express
- TypeScript
- MongoDB
- JWT Authentication
- AWS S3

## 📦 Installation

1. Klon repositoriet:
```bash
git clone https://github.com/username/email-platform.git
```

2. Installer dependencies for både frontend og backend:
```bash
# Frontend
cd client
npm install

# Backend
cd ../server
npm install
```

3. Opret .env filer baseret på .env.example i både client og server mapperne.

4. Start udviklings serverne:
```bash
# Frontend (fra client mappen)
npm run dev

# Backend (fra server mappen)
npm run dev
```

## 🌐 Environment Variabler

### Frontend (.env)
```
VITE_API_URL=http://localhost:3000
```

### Backend (.env)
Se .env.example filen for nødvendige variabler.

## 📝 API Documentation

API dokumentation er tilgængelig på `/api-docs` når serveren kører.

## 🧪 Testing

Kør tests med følgende kommandoer:

```bash
# Frontend tests
cd client
npm run test

# Backend tests
cd server
npm run test
```

## 📄 License

Dette projekt er licenseret under MIT licensen - se [LICENSE](LICENSE) filen for detaljer.

## 👥 Contributing

1. Fork projektet
2. Opret din feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit dine ændringer (`git commit -m 'Add some AmazingFeature'`)
4. Push til branchen (`git push origin feature/AmazingFeature`)
5. Åbn en Pull Request

## 🤝 Support

Hvis du har spørgsmål eller støder på problemer, så åbn venligst et issue i GitHub repository'et.