# MedPortal - Medical Portal System

> A full-stack healthcare platform with role-based access control (RBAC), subscription management, and comprehensive medical record handling.

[![Live Demo](https://img.shields.io/badge/Live-Demo-blue)](https://technical-assessment-pmhelp-oluwafu-lemon.vercel.app)
[![API Status](https://img.shields.io/badge/API-Online-success)](https://pmhelp-epegcmf5cmg2gmdd.southafricanorth-01.azurewebsites.net)

---

## 📋 Table of Contents

- [Overview](#overview)
- [Tech Stack](#tech-stack)
- [Features](#features)
- [Architecture](#architecture)
- [Getting Started](#getting-started)
- [API Documentation](#api-documentation)
- [Deployment](#deployment)
- [Test Credentials](#test-credentials)
- [Project Structure](#project-structure)
- [Design Decisions](#design-decisions)
- [Future Enhancements](#future-enhancements)

---

## 🎯 Overview

MedPortal is a comprehensive healthcare management system that provides role-specific functionality for three user types:

- **Patients**: Book appointments, view medical records, manage subscriptions
- **Doctors**: Manage availability, access patient records, add medical notes, view practice analytics
- **Admins**: Manage users, view system analytics, control subscription plans

The system implements subscription-based rate limiting, ensuring that users have access to features based on their subscription tier (Free, Basic, Premium).

---

## 🛠 Tech Stack

### Backend
- **Framework**: Django 5.1.7 with Django REST Framework
- **Authentication**: JWT (Simple JWT)
- **Database**: SQLite (Development) / PostgreSQL (Production-ready)
- **API Documentation**: Django REST Framework Browsable API
- **Hosting**: Azure Web Apps
- **CORS**: django-cors-headers

### Frontend
- **Framework**: React 19.1.1
- **Build Tool**: Vite 7.1.7
- **Routing**: React Router DOM 6.26.0
- **HTTP Client**: Axios 1.12.2
- **UI Components**: Lucide React (icons)
- **Charts**: Recharts 3.2.1
- **Forms**: React Hook Form 7.63.0
- **Styling**: Modular CSS
- **Hosting**: Vercel

### DevOps
- **CI/CD**: GitHub Actions
- **Version Control**: Git/GitHub
- **Deployment**: Automated via GitHub Actions

---

## ✨ Features

### 🔐 Authentication & Authorization
- JWT-based authentication
- Role-based access control (RBAC)
- Secure password hashing
- Token refresh mechanism
- Protected routes based on user roles

### 👤 Patient Features
- User registration and login
- View medical records and appointment history
- Book appointments with available doctors
- Subscription management (Free, Basic, Premium)
- Subscription-based appointment limits
- Upgrade/downgrade subscription tiers

### 👨‍⚕️ Doctor Features
- Manage availability schedules
- View scheduled appointments
- Access patient medical records
- Add medical notes to patient records
- Practice analytics dashboard:
  - Total patients attended
  - Number of sessions
  - Hours spent with patients
  - Appointment trends

### 🔧 Admin Features
- User management (view, edit, delete, create)
- System-wide analytics:
  - Total appointments
  - Active users by role
  - Revenue metrics
  - Subscription distribution
- Subscription plan management:
  - Create/edit/delete plans
  - Set pricing and limits
  - Apply discounts
- View all appointments and bookings

### 💳 Subscription Tiers

#### Free Tier
- 2 appointments per month
- Basic medical record access
- Standard support

#### Basic Tier ($9.99/month)
- 5 appointments per month
- Priority booking
- Email reminders
- Telehealth appointments

#### Premium Tier ($19.99/month)
- Unlimited appointments
- Advanced medical history analytics
- 24/7 support
- Family account sharing

---

## 🏗 Architecture

### Database Schema

```
Users
├── id (PK)
├── username
├── email
├── password (hashed)
├── role (patient/doctor/admin)
├── first_name
├── last_name
└── date_joined

Subscriptions (Plans)
├── id (PK)
├── name
├── code (free/basic/premium)
├── price
├── appointment_limit
└── features (JSON)

UserSubscriptions
├── id (PK)
├── user_id (FK)
├── plan_id (FK)
├── start_date
├── end_date
├── status
└── appointments_used

Appointments
├── id (PK)
├── patient_id (FK)
├── doctor_id (FK)
├── appointment_date
├── start_time
├── end_time
├── status
├── notes
└── created_at

MedicalRecords
├── id (PK)
├── patient_id (FK)
├── doctor_id (FK)
├── appointment_id (FK)
├── diagnosis
├── prescription
├── notes
└── created_at
```

### API Architecture

The backend follows RESTful principles with the following endpoint structure:

- **Authentication**: `/api/auth/*`
- **Subscriptions**: `/api/subscriptions/*`
- **Appointments**: `/api/appointments/*`
- **Medical Records**: `/api/medical-records/*`
- **Analytics**: `/api/analytics/*`
- **Admin**: `/api/admin/*`

---

## 🚀 Getting Started

### Prerequisites

- Python 3.12+
- Node.js 18+
- npm or yarn
- Git

### Backend Setup

1. **Clone the repository**
```bash
git clone https://github.com/yourusername/technical-assessment-pmhelp-funbi.git
cd technical-assessment-pmhelp-funbi/medportalbackend
```

2. **Create virtual environment**
```bash
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
```

3. **Install dependencies**
```bash
pip install -r requirements.txt
```

4. **Environment variables**
Create a `.env` file in the backend root:
```env
DJANGO_SECRET_KEY=your-secret-key-here
DEBUG=True
ALLOWED_HOSTS=localhost,127.0.0.1
DATABASE_URL=sqlite:///db.sqlite3
```

5. **Run migrations**
```bash
python manage.py makemigrations
python manage.py migrate
```

6. **Create superuser (optional)**
```bash
python manage.py createsuperuser
```

7. **Seed initial data**
```bash
python manage.py seed_data  # Custom management command for demo data
```

8. **Run development server**
```bash
python manage.py runserver
```

Backend will be available at `http://localhost:8000`

### Frontend Setup

1. **Navigate to frontend directory**
```bash
cd medportal-frontend-clean
```

2. **Install dependencies**
```bash
npm install
```

3. **Environment configuration**
The API URL is hardcoded in `src/services/api.js`. For local development, update to:
```javascript
const BASE_URL = 'http://localhost:8000';
```

4. **Run development server**
```bash
npm run dev
```

Frontend will be available at `http://localhost:5173`

### Building for Production

**Frontend:**
```bash
npm run build
```

**Backend:**
```bash
python manage.py collectstatic --noinput
```

---

## 📚 API Documentation

### Authentication Endpoints

#### Register User
```http
POST /api/auth/register/
Content-Type: application/json

{
  "username": "johndoe",
  "email": "john@example.com",
  "password": "securepass123",
  "role": "patient",
  "first_name": "John",
  "last_name": "Doe"
}
```

#### Login
```http
POST /api/auth/login/
Content-Type: application/json

{
  "username": "johndoe",
  "password": "securepass123"
}

Response:
{
  "access": "eyJ0eXAiOiJKV1QiLCJhbGc...",
  "refresh": "eyJ0eXAiOiJKV1QiLCJhbGc..."
}
```

#### Get Current User
```http
GET /api/auth/me/
Authorization: Bearer <access_token>
```

### Patient Endpoints

#### Get My Appointments
```http
GET /api/appointments/my/
Authorization: Bearer <access_token>
```

#### Book Appointment
```http
POST /api/appointments/my/
Authorization: Bearer <access_token>

{
  "doctor_id": 2,
  "appointment_date": "2025-09-30",
  "start_time": "10:00:00",
  "end_time": "10:30:00"
}
```

#### Get My Medical Records
```http
GET /api/medical-records/my/
Authorization: Bearer <access_token>
```

#### Get Current Subscription
```http
GET /api/subscriptions/current/
Authorization: Bearer <access_token>
```

#### Upgrade Subscription
```http
POST /api/subscriptions/upgrade/
Authorization: Bearer <access_token>

{
  "plan": "premium"
}
```

### Doctor Endpoints

#### Get Doctor Appointments
```http
GET /api/appointments/
Authorization: Bearer <access_token>
```

#### Get Patient Records
```http
GET /api/patients/{patient_id}/records/
Authorization: Bearer <access_token>
```

#### Add Medical Note
```http
POST /api/patients/{patient_id}/records/
Authorization: Bearer <access_token>

{
  "appointment_id": 5,
  "diagnosis": "Common cold",
  "prescription": "Rest and fluids",
  "notes": "Patient recovering well"
}
```

#### Get Practice Analytics
```http
GET /api/analytics/practice/
Authorization: Bearer <access_token>
```

### Admin Endpoints

#### Get All Users
```http
GET /api/admin/users/
Authorization: Bearer <access_token>

Query Params:
- limit: number (default: 20)
- offset: number (default: 0)
- search: string
- role: string (patient/doctor/admin)
```

#### Get System Analytics
```http
GET /api/admin/analytics/
Authorization: Bearer <access_token>
```

#### Manage User Subscription
```http
POST /api/admin/users/{user_id}/subscription/
Authorization: Bearer <access_token>

{
  "plan": "premium"
}
```

#### Get Subscription Plans
```http
GET /api/admin/subscription-plans/
Authorization: Bearer <access_token>
```

---

## 🌐 Deployment

### Backend Deployment (Azure Web Apps)

The backend is deployed to Azure Web Apps using GitHub Actions for CI/CD.

**Live Backend URL**: `https://pmhelp-epegcmf5cmg2gmdd.southafricanorth-01.azurewebsites.net`

**Deployment Configuration:**
- Automatic deployment on push to `main` branch
- Python 3.12 runtime
- SQLite database (can be upgraded to Azure PostgreSQL)

### Frontend Deployment (Vercel)

The frontend is deployed to Vercel with automatic deployments.

**Live Frontend URL**: `https://technical-assessment-pmhelp-oluwafu-lemon.vercel.app`

**Deployment Configuration:**
- Build command: `npm run build`
- Output directory: `dist`
- Framework preset: Vite

### Environment Variables

**Backend (Azure):**
- `DJANGO_SECRET_KEY`: Django secret key
- `DEBUG`: Set to `False` in production
- `ALLOWED_HOSTS`: Comma-separated list of allowed hosts
- `CSRF_TRUSTED_ORIGINS`: Trusted origins for CSRF

**Frontend (Vercel):**
- API URL is hardcoded in `src/services/api.js`

---

## 🔑 Test Credentials

Use these credentials to test the application:

### Admin Account
```
Username: admin
Password: Timi1997april11
```

### Doctor Account
```
Username: sbnuf
Password: Timi1997april11
```

### Patient Accounts

**Free Tier Patient:**
```
Username: remi
Password: Timi1997april11
```

---

## 📁 Project Structure

```
technical-assessment-pmhelp-funbi/
├── medportalbackend/                 # Django Backend
│   ├── accounts/                     # User authentication & management
│   │   ├── models.py                # Custom User model
│   │   ├── serializers.py           # User serializers
│   │   ├── views.py                 # Auth views
│   │   ├── permissions.py           # Custom permissions
│   │   └── admin_views.py           # Admin management views
│   ├── subscriptions/                # Subscription management
│   │   ├── models.py                # Subscription & UserSubscription models
│   │   ├── services.py              # Business logic
│   │   └── views.py                 # Subscription endpoints
│   ├── appointments/                 # Appointment system
│   │   ├── models.py                # Appointment model
│   │   ├── serializers.py           # Appointment serializers
│   │   └── views.py                 # Appointment endpoints
│   ├── records/                      # Medical records
│   │   ├── models.py                # MedicalRecord model
│   │   └── views.py                 # Record endpoints
│   ├── analytics/                    # Analytics module
│   │   └── views.py                 # Analytics endpoints
│   ├── medportal/                    # Project settings
│   │   ├── settings.py              # Django configuration
│   │   ├── urls.py                  # URL routing
│   │   └── wsgi.py                  # WSGI config
│   ├── manage.py                     # Django management script
│   └── requirements.txt              # Python dependencies
│
├── medportal-frontend-clean/         # React Frontend
│   ├── src/
│   │   ├── components/              # Reusable components
│   │   │   ├── common/              # Common components
│   │   │   ├── admin/               # Admin components
│   │   │   ├── doctor/              # Doctor components
│   │   │   └── patient/             # Patient components
│   │   ├── pages/                   # Page components
│   │   │   ├── auth/                # Login & Register
│   │   │   ├── dashboard/           # Role-based dashboards
│   │   │   ├── admin/               # Admin pages
│   │   │   ├── doctor/              # Doctor pages
│   │   │   └── patient/             # Patient pages
│   │   ├── contexts/                # React contexts
│   │   │   └── AuthContext.jsx     # Authentication state
│   │   ├── services/                # API services
│   │   │   └── api.js              # Axios configuration & API calls
│   │   ├── App.jsx                  # Main app component
│   │   └── main.jsx                # Entry point
│   ├── package.json                 # Node dependencies
│   └── vite.config.js              # Vite configuration
│
├── .github/
│   └── workflows/
│       └── main_pmhelp.yml         # Azure deployment workflow
│
└── README.md                        # This file
```

---

## 💡 Design Decisions

### 1. **Role-Based Access Control (RBAC)**
- Implemented custom permissions in Django (`IsPatient`, `IsDoctor`, `IsAdmin`)
- Frontend routes protected with role-checking logic
- Backend endpoints secured at the view level

### 2. **Subscription Management**
- **Appointment Limiting**: Enforced at the backend using `UserSubscription.appointments_used` counter
- **Subscription Upgrades**: Instant activation with simulated payment
- **Rate Limiting**: Subscription-aware checks before appointment booking

### 3. **State Management**
- Used React Context API for authentication state
- Local storage for JWT token persistence
- Automatic token refresh on API 401 responses

### 4. **API Design**
- RESTful conventions with trailing slashes
- JWT Bearer authentication
- Consistent error responses
- Pagination for list endpoints

### 5. **Security**
- HTTPS enforced in production
- CORS properly configured
- JWT token expiration (3 hours access, 7 days refresh)
- Password hashing with Django's built-in methods
- CSRF protection enabled

### 6. **UI/UX**
- Modular CSS for component styling
- Responsive design principles
- Loading states and error boundaries
- Role-specific navigation
- Consistent color scheme and branding

### 7. **Code Organization**
- Django apps separated by domain (accounts, subscriptions, appointments, etc.)
- Frontend components organized by feature and role
- Service layer for business logic
- Serializers for data validation and transformation

---

## 🔄 API Rate Limiting Implementation

### Subscription-Based Limits

The system implements appointment booking limits based on subscription tiers:

```python
# In appointments/views.py
def check_appointment_limit(user):
    subscription = UserSubscription.objects.get(user=user)
    plan = subscription.plan
    
    if subscription.appointments_used >= plan.appointment_limit:
        raise ValidationError("Appointment limit reached for your plan")
    
    subscription.appointments_used += 1
    subscription.save()
```

**Limits by Tier:**
- Free: 2 appointments/month
- Basic: 5 appointments/month
- Premium: Unlimited appointments

### Future Rate Limiting Enhancements
- IP-based rate limiting using Django Ratelimit
- API key throttling for third-party integrations
- Redis-based distributed rate limiting

---

## 🧪 Testing

### Backend Testing
```bash
test.http
```



**Note**: Unit tests are implemented for critical business logic including:
- Subscription validation
- Appointment booking limits
- User authentication
- Permission checks

---

## 🐛 Known Issues & Limitations

1. **Payment Integration**: Currently using simulated payments. Future: Integrate Stripe/PayPal
2. **Email Notifications**: Not implemented. Future: Add email service for appointment reminders
3. **Real-time Updates**: No WebSocket implementation. Future: Add real-time appointment updates
4. **File Uploads**: Medical documents upload not implemented
5. **Mobile App**: Web-only. Future: React Native mobile app
6. **Logout**: When you logout of an account you have to go the the home page so that you would have error or unauthorized page cause you have actually not fully logged out

---

## 🚀 Future Enhancements

### Short-term
- [ ] Email notification system
- [ ] PDF export for medical records
- [ ] Advanced search and filtering
- [ ] Bulk user operations for admin
- [ ] Calendar view for appointments

### Long-term
- [ ] Telemedicine video integration
- [ ] AI-powered diagnosis suggestions
- [ ] Multi-language support
- [ ] Mobile applications (iOS/Android)
- [ ] Pharmacy integration
- [ ] Insurance claims processing
- [ ] Health metrics tracking
- [ ] Family account management

---

## 📝 Assumptions Made

1. **Payment Processing**: Simulated payment flow is acceptable for MVP
2. **Time Zones**: All times stored in Africa/Lagos timezone
3. **Appointment Duration**: Standard 30-minute slots
4. **Doctor Availability**: Manual management by doctors (no auto-scheduling)
5. **Medical Records**: Text-based notes only (no file attachments in MVP)
6. **Data Privacy**: Assuming HIPAA/GDPR compliance handled at infrastructure level
7. **Subscription Renewal**: Manual renewal process (no auto-billing)

---

## 🤝 Contributing

This project was built as a technical assessment. For collaboration or questions:

**Contact**: [oluwafunbi.onaeko@gmail.com]
**GitHub**: [(https://github.com/ouujay)]
**LinkedIn**: [(https://www.linkedin.com/in/funbi-onaeko-91a500252/)]

---

## 📄 License

This project is submitted as part of a technical assessment for PMhelp.

---

## 🙏 Acknowledgments

- PMhelp Team for the opportunity
- Django & React communities for excellent documentation
- Azure and Vercel for hosting services

---

## 📞 Support

For technical issues or questions about the implementation:

1. Check the API documentation above
2. Review the test credentials
3. Inspect browser console for frontend errors
4. Check Django server logs for backend errors

**Deployment Issues**: Verify environment variables and CORS settings
**Authentication Issues**: Clear browser cache and localStorage
**API Errors**: Check network tab for detailed error responses

---

**Built with ❤️ by Funbi for PMhelp Technical Assessment**

*Last Updated: September 27, 2025*
