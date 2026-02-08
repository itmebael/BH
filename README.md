# 🏠 BoardingHub

A modern, user-friendly boarding house booking platform built with React, TypeScript, and Tailwind CSS. BoardingHub features a clean, glassmorphism-inspired UI with card-based layouts, smooth animations, and responsive design to ensure transparency, efficient management, and a smooth experience for tenants, landlords, and administrators.

## 🎨 Design Philosophy

BoardingHub is designed with a modern, glassmorphism-inspired aesthetic featuring:
- **Glassmorphism UI**: Clean, translucent card-based layouts with backdrop blur effects
- **Card-Based Layouts**: Intuitive, organized information presentation
- **Smooth Animations**: Seamless transitions and micro-interactions throughout the platform
- **Responsive Design**: Fully optimized for desktop, tablet, and mobile devices
- **Modern Aesthetics**: Contemporary design language that prioritizes user experience

## ✨ Features

### 👤 Tenant Features

#### Booking & Reviews
- **Conditional Review Submission**: Tenants can only submit reviews if their booking request has been approved by the landlord
- **Smart Listing Priority**: Boarding houses that are most frequently booked appear with higher priority in suggested listings

#### Booking Form
During booking, tenants must complete a comprehensive form containing:
- **Full Name**: Complete legal name
- **Address**: Barangay and Municipality/City
- **Gender**: Gender identification
- **Age**: Age verification
- **Citizenship**: Filipino or Foreigner selection
- **Occupation Status**: Student or Worker selection

#### Room & Bed Selection
- **Specific Room Selection**: Tenants can choose a specific room from available options
- **Bed Space Selection**: Tenants can select individual bed spaces within rooms
- **Bed Availability Indicators**:
  - 🟢 **Green** – Available bed space
  - 🔴 **Red** – Occupied bed space

### 🏘️ Landlord Features

#### Profile Management
- **Landlord Profile Creation**: Complete landlord profile setup
- **Boarding House Profile Creation**: Detailed property profile with all necessary information

#### Image Management
- **Multiple Image Uploads**: Upload multiple images of the boarding house
- **Swipeable Carousel**: Images displayed in an interactive, swipeable carousel
- **Image Categories**:
  - **Comfort Rooms (CR)**: Bathroom and comfort room images
  - **Available Rooms**: Room images showcasing available spaces

#### Room & Bed Management
- **Flexible Bed Configuration**: Each room may contain:
  - Single beds
  - Double-deck beds
- **Double-Deck Bed Handling**:
  - Upper and lower decks are treated as separate bookable bed spaces
  - Each deck can be independently booked
- **Bed Space Indicators**:
  - 🟢 **Green** for available bed spaces
  - 🔴 **Red** for occupied bed spaces
- **Customizable Bed Count**: Landlords can define how many beds exist per room (e.g., 4 beds)

#### Verification
- **Permit Upload**: Landlords must upload valid business or boarding house permits for verification
- **Admin Verification**: Permits are reviewed by administrators before approval

### 👨‍💼 Admin Features

#### Analytics Dashboard
The Analytics Dashboard provides comprehensive insights:
- **Landlord Data Management**: View and manage all landlord accounts and profiles
- **Tenant Booking Overview**: View tenant bookings per property with detailed information
- **Tenant Information**: Access tenant names and complete booking details
- **Sales Monitoring**: Monitor landlord sales, including:
  - Booked rooms statistics
  - Bed space occupancy rates
  - Revenue tracking

#### Report Generation Module
Advanced reporting capabilities with:
- **Data Preview**: Preview data before downloading to ensure accuracy
- **Advanced Filtering**:
  - Filter by boarding house
  - Filter by date range
- **Export Options**: Export filtered or complete datasets in various formats

### 🔐 Additional Platform Features

- **Welcome Screen**: Beautiful splash screen with rental building illustration
- **Role Selection**: Choose between Tenant, Landlord, and Admin roles
- **User Authentication**: Secure login and registration with form validation
- **Role-based Access Control**: Different dashboards for each user type
- **Google Maps Integration**: Satellite view with property markers
- **Property Management**: Add, edit, and manage boarding house listings
- **Messaging System**: Communication between tenants and landlords
- **TypeScript**: Full type safety and better development experience

## 🚀 Getting Started

### Prerequisites

- Node.js (version 14 or higher)
- npm or yarn
- Google Maps API Key

### Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd boardinghub
```

2. Install dependencies:
```bash
npm install
```

3. Set up Google Maps API:
   - Go to [Google Cloud Console](https://console.cloud.google.com/google/maps-apis)
   - Create a new project or select an existing one
   - Enable the following APIs:
     - Maps JavaScript API
     - Places API
     - Geocoding API
   - Create credentials (API Key)
   - Create a `.env` file in the root directory:
   ```
   REACT_APP_GOOGLE_MAPS_API_KEY=your_google_maps_api_key_here
   ```

4. Set up the database:
   - Ensure you have PostgreSQL installed and running
   - Create a new database for BoardingHub
   - Run the complete database schema:
   ```bash
   psql -U your_username -d boardinghub -f boardinghub_complete_schema.sql
   ```
   - Or if using Supabase, execute the SQL file in the Supabase SQL Editor
   - The schema includes all tables, indexes, triggers, views, and RLS policies needed for the platform

5. Start the development server:
```bash
npm start
```

6. Open [http://localhost:3000](http://localhost:3000) in your browser.

## 🏗️ Project Structure

```
boardinghub/
├── public/
│   └── index.html
├── src/
│   ├── index.css
│   └── index.tsx
├── components/
│   ├── WelcomeScreen.tsx
│   ├── RoleSelectionScreen.tsx
│   ├── LoginScreen.tsx
│   ├── CreateAccountScreen.tsx
│   ├── ClientDashboard.tsx
│   ├── OwnerDashboard.tsx
│   ├── AdminDashboard.tsx
│   ├── GoogleMap.tsx
│   └── ImageUpload.tsx
├── App.tsx
├── package.json
├── tailwind.config.js
├── postcss.config.js
├── boardinghub_complete_schema.sql
└── README.md
```

## 🗄️ Database Schema

The complete database schema is defined in `boardinghub_complete_schema.sql`. The schema includes:

### Core Tables

- **`user_roles`**: User authentication and role management (tenant, landlord, admin)
- **`landlord_profiles`**: Landlord profile information and verification status
- **`boarding_houses`**: Boarding house listings with location, pricing, and status
- **`landlord_permits`**: Business and boarding house permit uploads and verification
- **`rooms`**: Room definitions within boarding houses
- **`beds`**: Individual bed spaces (supports single and double-deck beds with upper/lower decks)
- **`property_images`**: Categorized images (Comfort Rooms, Available Rooms, etc.)
- **`tenant_profiles`**: Tenant profile information
- **`bookings`**: Booking requests with complete form data (Full Name, Address, Gender, Age, Citizenship, Occupation Status)
- **`reviews`**: Reviews (only allowed after booking approval)
- **`booking_analytics`**: Analytics data for priority listing and reporting
- **`admin_reports`**: Report generation tracking

### Key Features

- **Priority Listing**: Boarding houses are prioritized by `total_bookings` count (most frequently booked appear first)
- **Bed Availability**: Status indicators (🟢 Available, 🔴 Occupied) tracked in `beds.status`
- **Double-Deck Beds**: Upper and lower decks stored as separate bed records with `parent_bed_id` linking
- **Review Constraint**: Reviews can only be submitted for approved bookings (enforced via trigger)
- **Image Categories**: Images categorized as 'comfort_room', 'available_room', 'common_area', 'exterior', or 'other'
- **Comprehensive Indexes**: Optimized indexes for performance on all key queries
- **Row Level Security**: RLS policies for data security and access control
- **Automated Triggers**: Triggers for updating ratings, bed status, room occupancy, and timestamps

### Views

- **`boarding_houses_priority`**: Boarding houses sorted by booking frequency and rating
- **`available_beds_view`**: Available beds with status indicators
- **`admin_dashboard_analytics`**: Comprehensive analytics for admin dashboard
- **`landlord_sales_report`**: Sales and booking statistics per landlord
- **`tenant_booking_details`**: Complete tenant booking information for admin access

See `boardinghub_complete_schema.sql` for the complete schema definition with all constraints, triggers, and policies.

## 🎨 Design System

### Colors
- **Primary Blue**: #007BFF
- **Secondary Blue**: #0056b3
- **Gray Scale**: 50-900 range
- **White**: #FFFFFF

### Typography
- **Font Family**: Poppins (300, 400, 500, 600, 700 weights)
- **Headings**: Bold, large text for titles
- **Body**: Regular weight for content

### Components
- **Cards**: Rounded corners with shadows
- **Buttons**: Blue primary, gray secondary
- **Forms**: Clean input fields with focus states
- **Navigation**: Back buttons and smooth transitions

## 📱 Screen Flow

1. **Welcome Screen** → Start button
2. **Role Selection** → Choose Client/Owner/Admin
3. **Login Screen** → Sign in or create account
4. **Create Account** → Registration form
5. **Dashboard** → Role-specific interface:
   - **Client Dashboard**: Browse properties, view maps, send booking requests
   - **Owner Dashboard**: Manage properties, handle bookings, upload images
   - **Admin Dashboard**: System overview, user management, analytics

## 🛠️ Built With

- **React 18** - Modern React with hooks
- **TypeScript** - Type-safe JavaScript
- **Tailwind CSS** - Utility-first CSS framework
- **PostCSS** - CSS processing
- **Google Maps API** - Interactive maps with satellite view
- **React Google Maps API** - React integration for Google Maps

## 📦 Available Scripts

- `npm start` - Start development server
- `npm run build` - Build for production
- `npm test` - Run tests
- `npm run eject` - Eject from Create React App

## 🌟 Key Components

### WelcomeScreen
- Initial splash screen
- Rental building illustration
- Call-to-action button

### RoleSelectionScreen
- User type selection (Client, Owner, Admin)
- Clear role descriptions
- Navigation back to welcome

### LoginScreen
- Username/password fields
- Social login options
- Links to registration

### CreateAccountScreen
- Complete registration form
- User category selection (for clients)
- Terms and privacy policy

### ClientDashboard
- Property browsing with search
- Google Maps integration with satellite view
- Booking request system
- Property details modal

### OwnerDashboard
- Property management (add, edit, delete)
- Image upload functionality
- Booking request handling
- Google Maps for property location

### AdminDashboard
- System overview with statistics
- User management (activate/deactivate)
- Property management
- Booking monitoring

### GoogleMap
- Interactive maps with satellite/road view toggle
- Click-to-set location functionality
- Property markers with info windows
- Responsive design

### ImageUpload
- Multiple image upload (up to 5 images)
- Image preview with remove functionality
- File validation (type and size)
- Drag and drop interface

## 🔧 Customization

### Adding New Screens
1. Create component in `components/` directory
2. Add to App.tsx routing
3. Update TypeScript types
4. Style with Tailwind classes

### Modifying Colors
Update `tailwind.config.js` with your color palette:
```javascript
colors: {
  primary: '#your-color',
  secondary: '#your-color',
}
```

### Changing Fonts
Update `src/index.css` with your preferred font family.

## 📄 License

This project is licensed under the MIT License.

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## 🎯 Platform Goal

BoardingHub aims to ensure **transparency**, **efficient management**, and a **smooth, modern experience** for tenants, landlords, and administrators. The platform provides:

- **Transparency**: Clear availability indicators, verified landlord permits, and comprehensive property information
- **Efficient Management**: Streamlined booking processes, automated priority listings, and comprehensive admin tools
- **Modern Experience**: Glassmorphism UI, smooth animations, and responsive design across all devices

## 📞 Support

For support and questions, please open an issue in the repository.

---

**BoardingHub** - Making finding your perfect home easier than ever! 🏠✨




