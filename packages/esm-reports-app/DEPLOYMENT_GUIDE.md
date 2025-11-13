# ESM Reports App - Deployment Guide

## Building for Production

### 1. Build the Package

```bash
cd c:\Users\i7\openmrs_projects\openmrs-esm-admin-tools
yarn turbo build --filter=@openmrs/esm-reports-app
```

The built files will be in: `packages/esm-reports-app/dist/`

---

## Deployment Options

### **Option A: Deploy to O3 Distro (Recommended)**

#### Step 1: Copy Built Files

Copy the entire `dist` folder to your O3 distribution:

```powershell
# Windows PowerShell
Copy-Item -Path "packages\esm-reports-app\dist\*" -Destination "C:\path\to\your\distro\frontend\@openmrs\esm-reports-app" -Recurse -Force
```

```bash
# Linux/Mac
cp -r packages/esm-reports-app/dist/* /path/to/your/distro/frontend/@openmrs/esm-reports-app/
```

#### Step 2: Update Import Map

Edit your distro's `frontend/import-map.json`:

```json
{
  "imports": {
    "@openmrs/esm-reports-app": "/openmrs/spa/@openmrs/esm-reports-app/openmrs-esm-reports-app.js"
  }
}
```

#### Step 3: Configure Backend API URL

**IMPORTANT**: The esm-reports-app uses **relative URLs** for all API calls, so it automatically connects to whatever backend your O3 instance is configured to use. You don't need to hard-code any URLs in the app itself.

Configure your O3 distro's backend URL in one of these ways:

**Option 1: Via distro's spa-build-config.json**

```json
{
  "apiUrl": "https://your-backend-server.com",
  "spaPath": "/openmrs/spa",
  "pageTitle": "OpenMRS",
  "supportOffline": false
}
```

**Option 2: Via environment variable**

```bash
export OMRS_API_URL=https://your-backend-server.com
```

**Option 3: Via Docker environment**

```yaml
environment:
  - OMRS_API_URL=https://your-backend-server.com
```

**Note**: The `spa-build-config.json` in the source code is only for local development (e.g., `yarn start --backend http://localhost:8086`). In production, use your distro's configuration.

---

### **Option B: Use Existing O3 Distro with Override**

If you already have an O3 distro running, you can override the reports app module:

1. **Access your O3 instance** in browser
2. **Open Developer Console** (F12)
3. **Click Import Map Overrides** button (bottom right)
4. **Add override**:
   - Module name: `@openmrs/esm-reports-app`
   - URL: Point to your built files or development server

---

## Adding Left Sidebar Link

To add the Reports link to the left navigation sidebar:

### Method 1: Via Configuration File

Edit your distro's configuration file (e.g., `config.json` or in your distro's configuration):

```json
{
  "@openmrs/esm-primary-navigation-app": {
    "externalRefLinks": {
      "reports": {
        "title": "Reports",
        "path": "/openmrs/spa/reports",
        "slot": "reports-dashboard-slot"
      }
    }
  }
}
```

### Method 2: Via App Menu Extension (Recommended)

The reports app should automatically appear in the System Administration menu. To add it to the main sidebar:

**Create/Update**: `frontend/config.json`

```json
{
  "@openmrs/esm-primary-navigation-app": {
    "logo": {
      "src": "your-logo.png",
      "alt": "Logo"
    },
    "navMenu": {
      "items": [
        {
          "label": "Home",
          "to": "${openmrsSpaBase}/home"
        },
        {
          "label": "Reports",
          "to": "${openmrsSpaBase}/reports",
          "icon": "ReportIcon"
        },
        {
          "label": "System Administration",
          "to": "${openmrsSpaBase}/system-administration"
        }
      ]
    }
  }
}
```

### Method 3: Via Dashboard Extension

The app is already configured to show in System Administration. Access it via:

**Navigation**: `Home → System Administration → Reports`

Or directly at: `http://localhost:8086/openmrs/spa/reports`

---

## Backend Configuration

### Required Backend Modules

Ensure these modules are installed on your OpenMRS backend:

1. **reporting** (version 1.27.0+)
2. **reportingrest** (version 1.15.0+)
3. **webservices.rest** (version 2.24.0+)
4. **nmrsreports** (your custom module with REST endpoints)

### Verify Backend Setup

Test the REST endpoints:

```bash
# Test NMRS categories
curl -u admin:Admin123 http://localhost:8086/openmrs/ws/rest/v1/nmrsreports/categories

# Test report definitions
curl -u admin:Admin123 http://localhost:8086/openmrs/ws/rest/v1/reportingrest/reportDefinition

# Test metadata
curl -u admin:Admin123 http://localhost:8086/openmrs/ws/rest/v1/nmrsreports/metadata
```

---

## Post-Deployment Verification

### 1. Access the Reports App

Navigate to: `http://localhost:8086/openmrs/spa/reports`

### 2. Test Key Features

- ✅ Category filter dropdown shows: Monitoring, Data Quality, Biometric, Other
- ✅ Reports list filters correctly by category
- ✅ "Reports Webview" tab loads and shows category filter
- ✅ Can select report, set parameters, and fetch results
- ✅ "Run reports" modal opens and shows output format options

### 3. Troubleshooting

**Issue**: Reports app not showing in menu

- **Solution**: Check import map configuration
- **Verify**: View page source and search for `@openmrs/esm-reports-app` in import map

**Issue**: API calls failing

- **Solution**: Check backend URL configuration
- **Verify**: Open browser DevTools → Network tab → Check API request URLs

**Issue**: Output format dropdown blank

- **Solution**: Ensure `reportingrest` module is installed and started
- **Verify**: Test `/ws/rest/v1/reportingrest/reportDesign` endpoint

---

## Production Deployment Checklist

- [ ] Built files copied to distro
- [ ] Import map updated
- [ ] Backend API URL configured
- [ ] Backend modules installed (reporting, reportingrest, nmrsreports)
- [ ] Navigation link added (if desired)
- [ ] Tested all features work
- [ ] Browser cache cleared
- [ ] Verified on target environment

---

## Configuration Summary

### Files Modified/Created:

1. **frontend/import-map.json** - Module registration
2. **frontend/config.json** or **spa-build-config.json** - Backend API URL
3. **frontend/@openmrs/esm-reports-app/** - Deployed app files
4. **Backend: nmrsreports-1.0.6.6-SNAPSHOT.omod** - Custom REST endpoints

### Backend REST Endpoints Added:

- `GET /ws/rest/v1/nmrsreports/categories` - All reports grouped by category
- `GET /ws/rest/v1/nmrsreports/category?type={type}` - Filtered reports
- `GET /ws/rest/v1/nmrsreports/metadata` - Module metadata

---

## Support

For issues or questions:

- Check OpenMRS documentation: https://wiki.openmrs.org
- OpenMRS Talk: https://talk.openmrs.org
- GitHub Issues: https://github.com/openmrs/openmrs-esm-admin-tools/issues
