# Quick Start Guide

## Starting the Application

### Terminal 1 - Backend
```bash
cd backend
npm run dev
```
Backend will start on http://localhost:3000

### Terminal 2 - Frontend
```bash
cd frontend
npm run dev
```
Frontend will start on http://localhost:5173

## First Time Setup

If this is your first time running the project:

```bash
# Backend setup
cd backend
npm install
npm run prisma:migrate
npm run prisma:seed
npm run dev

# In another terminal - Frontend setup
cd frontend
npm install
npm run dev
```

## Access the Application

1. Open your browser to http://localhost:5173
2. Log in with default credentials:
   - **Admin**: admin@parqueo.com / admin123
   - **Student**: student@parqueo.com / student123

## What You Can Do

### As Admin:
- ✅ View dashboard with occupation statistics
- ✅ Add/Edit/Delete vehicles
- ✅ Add/Edit/Delete parking spaces
- ✅ Record vehicle entries and exits
- ✅ View all parking records

### Testing the Flow:

1. **Login** as admin (admin@parqueo.com / admin123)
2. **Dashboard** - See current occupation (should be 0/20)
3. **Vehicles** - One sample vehicle already exists (ABC-1234)
4. **Parking Spaces** - 20 spaces created (A01 to A20)
5. **Entry/Exit** - Record an entry:
   - Click "Record Entry"
   - Select vehicle "ABC-1234"
   - Select any available space (e.g., A01)
   - Submit
6. **Dashboard** - Refresh to see occupation updated to 1/20
7. **Entry/Exit** - Mark exit to free the space

## Stopping the Servers

Press `Ctrl+C` in each terminal window to stop the servers.

## Troubleshooting

**Port already in use:**
- Backend (port 3000): Kill existing process or change PORT in backend/.env
- Frontend (port 5173): Vite will automatically suggest an alternative port

**Database issues:**
```bash
cd backend
rm prisma/dev.db  # Delete existing database
npm run prisma:migrate  # Recreate database
npm run prisma:seed  # Reseed data
```

**Frontend can't connect to backend:**
- Ensure backend is running on http://localhost:3000
- Check browser console for CORS errors
- Verify API_URL in frontend/src/api/client.ts
