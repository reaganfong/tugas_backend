# Frontend MVC Architecture

## Structure Overview

The frontend has been reorganized following **MVC (Model-View-Controller)** architecture pattern:

```
frontend/
├── src/
│   ├── assets/
│   │   └── css/
│   │       └── style.css          # Global styles
│   ├── controllers/
│   │   ├── loginController.js
│   │   ├── dashboardAdminController.js
│   │   ├── dashboardDokterController.js
│   │   ├── dashboardPasienController.js
│   │   ├── dashboardAkuntanController.js
│   │   └── dashboardApotekerController.js
│   ├── models/
│   │   └── apiService.js          # API communication layer
│   ├── views/
│   │   ├── index.html             # Login page
│   │   ├── dashboard-admin.html
│   │   ├── dashboard-admin-add.html
│   │   ├── dashboard-admin-view.html
│   │   ├── dashboard-dokter.html
│   │   ├── dashboard-pasien.html
│   │   ├── dashboard-akuntan.html
│   │   └── dashboard-apoteker.html
│   └── js/
│       └── utils.js               # Shared utility functions
```

## Component Responsibilities

### **Models** (`src/models/`)
- **apiService.js**: Centralized API communication
  - Handles all HTTP requests to the backend
  - Provides methods for auth, admin, dokter, akuntan, apoteker, pasien endpoints
  - Single point of contact for backend API

### **Views** (`src/views/`)
- HTML templates for each page
- Contains minimal JavaScript (only script imports)
- Semantic structure without business logic
- Linked to corresponding controllers and assets

### **Controllers** (`src/controllers/`)
- Business logic for each view
- Handles user interactions
- Manages authentication checks
- Updates DOM based on user actions
- Examples:
  - `loginController.js` - Handles login form submission
  - `dashboardAdminController.js` - Manages admin dashboard initialization

### **Assets** (`src/assets/`)
- CSS stylesheets
- Images and static resources
- Global styling for all views

### **Utilities** (`src/js/`)
- **utils.js**: Shared helper functions
  - `checkAuth()` - Verify user authentication
  - `logout()` - Handle logout
  - `showError()` / `showSuccess()` - Display messages
  - `formatCurrency()`, `formatDate()` - Data formatting

## Key Features

### Separation of Concerns
- **Models** handle data/API communication
- **Views** handle presentation/HTML structure
- **Controllers** handle logic/interactions
- **Utils** provide shared functionality

### Centralized API Service
All backend communication goes through `apiService.js`:
```javascript
// Example usage in controllers
const data = await apiService.login(username, pwd, jabatan);
const pasien = await apiService.getPasien();
const dokter = await apiService.getDokter();
```

### Session Management
- Uses `localStorage` to store session (username, jabatan)
- `checkAuth()` verifies authentication before allowing access
- Automatic redirect to login if not authenticated

### Reusable Components
- `utils.js` provides common functions used across all pages
- Easy to add new utilities without duplicating code
- Consistent error/success message handling

## Development Workflow

### Adding a New Page
1. Create HTML view: `src/views/new-page.html`
2. Create controller: `src/controllers/newPageController.js`
3. Import scripts in HTML:
   ```html
   <script src="../models/apiService.js"></script>
   <script src="../js/utils.js"></script>
   <script src="../controllers/newPageController.js"></script>
   ```
4. Use `checkAuth()` to protect the page
5. Use `apiService` methods to communicate with backend

### Adding API Endpoints
1. Update `src/models/apiService.js` with new method
2. Use it in corresponding controller
3. Example:
   ```javascript
   // In apiService.js
   async getNewData() {
       return this.request('/endpoint/path');
   }

   // In controller
   const data = await apiService.getNewData();
   ```

## Backend Integration

The backend (`server.js`) serves the frontend from:
```javascript
app.use(express.static(path.join(__dirname, '../frontend/src')));
```

This means:
- Root path `/` serves `frontend/src/views/index.html`
- CSS path `/assets/css/style.css` works correctly
- All script imports use relative paths from views

## Security Considerations

- ✅ Authentication checks on every protected page
- ✅ Session stored in localStorage (user can clear)
- ✅ Backend validates all API requests with session middleware
- ⚠️ Note: For production, consider using secure cookies instead of localStorage

## File Size & Performance

- Modular structure allows easy code splitting
- Single CSS file reduces HTTP requests
- Single API service class avoids code duplication
- Utils are cached in browser memory

---

**Created**: June 5, 2026  
**Last Updated**: June 5, 2026
