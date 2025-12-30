# How to Run the Frontend (UI)

## Quick Start

### Step 1: Navigate to Frontend Directory
```bash
cd frontend
```

### Step 2: Install Dependencies
```bash
npm install
```

This will install all required packages (React, Tailwind CSS, React Router, etc.)

### Step 3: Create Environment File
Create a `.env` file in the `frontend` directory with:
```env
REACT_APP_API_URL=http://localhost:8000
REACT_APP_SOCKET_URL=http://localhost:8000
```

### Step 4: Start the Development Server
```bash
npm start
```

The app will automatically open in your browser at `http://localhost:3000`

## Important Notes

⚠️ **Make sure the backend is running first!**
- The backend should be running on port 8000
- If backend is on a different port, update `REACT_APP_API_URL` in `.env`

## Troubleshooting

### Port Already in Use?
If port 3000 is already in use, React will ask if you want to use a different port (usually 3001). Press `Y` to confirm.

### Module Not Found Errors?
Delete `node_modules` and `package-lock.json`, then run:
```bash
rm -rf node_modules package-lock.json
npm install
```

### API Connection Errors?
1. Check that backend is running on port 8000
2. Verify `.env` file has correct `REACT_APP_API_URL`
3. Check browser console for specific error messages

## Available Scripts

- `npm start` - Start development server
- `npm build` - Build for production
- `npm test` - Run tests
- `npm eject` - Eject from Create React App (irreversible)

## Development Tips

- Hot reload is enabled - changes will auto-refresh in browser
- Check browser console (F12) for errors
- Check Network tab to see API requests
- Use React DevTools browser extension for debugging

