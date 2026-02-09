import React, { useState } from 'react';
import GoogleMap from './GoogleMap';
import ImageUpload from './ImageUpload';
import supabase from '../lib/supabase';
import { sendTenantDecisionEmail } from '../lib/email';
import { ImageWithFallback } from './ImageWithFallback';
import ImageCarousel from './ImageCarousel';
import ReportProblem from './ReportProblem';
import { Line, Bar } from 'react-chartjs-2';
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
// @ts-ignore
import 'jspdf-autotable';

// Extend jsPDF type to include autoTable
declare module 'jspdf' {
  interface jsPDF {
    autoTable(options: any): jsPDF;
  }
}

interface Property {
  id: string;
  title: string;
  description: string;
  price: number;
  location: string;
  images: string[];
  amenities: string[];
  coordinates: { lat: number; lng: number };
  status: 'active' | 'inactive' | 'pending';
  isVerified: boolean;
  ownerEmail?: string;
  rating?: number;
  business_permit_url?: string;
}

interface BookingRequest {
  id: string;
  propertyId: string;
  clientName: string;
  clientEmail: string;
  message: string;
  status: 'pending' | 'approved' | 'rejected';
  createdAt: string;
  totalAmount?: number;
  checkInDate?: string;
  checkOutDate?: string;
  phone?: string;
  address?: string;
  barangay?: string;
  municipality_city?: string;
  id_document_url?: string;
  gender?: string;
  age?: string;
  occupation_status?: string;
  citizenship?: string;
  full_name?: string;
  tenant_email?: string;
}

interface OwnerAnalytics {
  totalProperties: number;
  totalBookings: number;
  averageRating: number;
  occupancyRate: number;
  totalRevenue: number;
  averageRevenuePerBooking: number;
  revenueTrends: { date: string; revenue: number }[];
  bookingTrends: { date: string; bookings: number; revenue: number }[];
  propertyPerformance: { propertyId: string; propertyTitle: string; bookings: number; rating: number; revenue: number; averageRevenue: number }[];
  monthlyRevenue: { month: string; revenue: number; bookings: number }[];
  topPerformingProperties: { propertyId: string; propertyTitle: string; revenue: number }[];
  revenueByStatus: { status: string; count: number; revenue: number }[];
}

interface Review {
  id: string;
  propertyId: string;
  clientName: string;
  rating: number;
  reviewText: string;
  createdAt: string;
}

interface OwnerDashboardProps {
  onBack: () => void;
}

export default function OwnerDashboard({ onBack }: OwnerDashboardProps) {
  const [activeTab, setActiveTab] = useState<'properties' | 'bookings' | 'analytics'>('properties');
  const [showAddProperty, setShowAddProperty] = useState(false);
  const [showPropertyDetails, setShowPropertyDetails] = useState<Property | null>(null);
  const [profileOpen, setProfileOpen] = useState(false);
  const [showNotif, setShowNotif] = useState(false);
  const [showViewProfile, setShowViewProfile] = useState(false);
  const [showEditProfile, setShowEditProfile] = useState(false);
  const [user, setUser] = useState<any>(null);
  
  // Profile states
  const [profileData, setProfileData] = useState({
    full_name: '',
    email: '',
    phone: '',
    address: '',
    barangay: '',
    city: '',
    profile_image_url: ''
  });
  const [viewProfileData, setViewProfileData] = useState<{
    full_name: string;
    email: string;
    phone: string;
    address: string;
    barangay: string;
    city: string;
    profile_image_url: string | null;
  }>({
    full_name: '',
    email: '',
    phone: '',
    address: '',
    barangay: '',
    city: '',
    profile_image_url: null
  });
  const [profileImageFile, setProfileImageFile] = useState<File | null>(null);
  const [profileImagePreview, setProfileImagePreview] = useState<string | null>(null);
  const [savingProfile, setSavingProfile] = useState(false);
  const [editingProperty, setEditingProperty] = useState<Property | null>(null);

  // Chat state
  const [chatOpen, setChatOpen] = useState(false);
  const [chatLoading, setChatLoading] = useState(false);
  const [chatMessages, setChatMessages] = useState<{ id: string; sender_email: string; content: string; created_at: string; }[]>([]);
  const [chatInput, setChatInput] = useState('');
  const [activeConversation, setActiveConversation] = useState<{ id: string; property_id: string; owner_email: string; client_email: string } | null>(null);
  const [chatChannel, setChatChannel] = useState<any>(null);
  const messagesEndRef = React.useRef<HTMLDivElement | null>(null);

  const scrollMessagesToBottom = () => {
    try {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    } catch {}
  };
  
  // Form states for adding property
  const [newProperty, setNewProperty] = useState({
    title: '',
    description: '',
    price: '',
    location: 'Catbalogan City, Samar',
    amenities: [] as string[],
    coordinates: { lat: 11.7778, lng: 124.8847 },
    images: [] as File[]
  });

  // Replace mock data with live state
  const [properties, setProperties] = useState<Property[]>([]);

  const [bookings, setBookings] = useState<BookingRequest[]>([]);
  const [ownerEmail, setOwnerEmail] = useState<string>('');
  const [notifications, setNotifications] = useState<any[]>([]);
  const [isAddingProperty, setIsAddingProperty] = useState(false);
  const [showScrollTop, setShowScrollTop] = useState(false);
  const [analytics, setAnalytics] = useState<OwnerAnalytics>({
    totalProperties: 0,
    totalBookings: 0,
    averageRating: 0,
    occupancyRate: 0,
    totalRevenue: 0,
    averageRevenuePerBooking: 0,
    revenueTrends: [],
    bookingTrends: [],
    propertyPerformance: [],
    monthlyRevenue: [],
    topPerformingProperties: [],
    revenueByStatus: []
  });
  const [reviews, setReviews] = useState<Review[]>([]);
  const [customAmenity, setCustomAmenity] = useState('');
  const [editCustomAmenity, setEditCustomAmenity] = useState('');
  const [selectedMonth, setSelectedMonth] = useState<string>('all');
  const [showAllTenantsModal, setShowAllTenantsModal] = useState(false);
  const [selectedTenant, setSelectedTenant] = useState<any>(null);
  const [showTenantModal, setShowTenantModal] = useState(false);
  
  // Rooms and Beds management
  const [rooms, setRooms] = useState<any[]>([]);
  const [beds, setBeds] = useState<any[]>([]);
  const [showAddRoom, setShowAddRoom] = useState(false);
  const [showAddBed, setShowAddBed] = useState(false);
  const [selectedRoomForBed, setSelectedRoomForBed] = useState<string>('');
  const [newRoom, setNewRoom] = useState({
    room_number: '',
    room_name: '',
    max_beds: '',
    price_per_bed: '',
    status: 'available'
  });
  const [newBed, setNewBed] = useState({
    bed_number: '',
    bed_type: 'single',
    deck_position: 'lower',
    status: 'available',
    price: ''
  });
  
  // Permits
  const [showPermits, setShowPermits] = useState(false);
  const [permitFile, setPermitFile] = useState<File | null>(null);
  const [permitPreview, setPermitPreview] = useState<string | null>(null);
  const [propertyPermit, setPropertyPermit] = useState<string | null>(null);
  
  // Report
  const [showReportProblem, setShowReportProblem] = useState(false);

  // Load rooms and permit when property details modal opens
  React.useEffect(() => {
    if (showPropertyDetails) {
      const loadPropertyData = async () => {
        try {
          // Load rooms
          const { data: roomsData } = await supabase
            .from('rooms')
            .select('*')
            .eq('boarding_house_id', showPropertyDetails.id)
            .order('room_number', { ascending: true });
          setRooms(roomsData || []);
          
          // Load permit
          const { data: permitData } = await supabase
            .from('properties')
            .select('business_permit_url')
            .eq('id', showPropertyDetails.id)
            .single();
          setPropertyPermit(permitData?.business_permit_url || null);
        } catch (error) {
          console.error('Failed to load property data:', error);
        }
      };
      loadPropertyData();
    } else {
      setRooms([]);
      setBeds([]);
      setPropertyPermit(null);
    }
  }, [showPropertyDetails?.id]);

  React.useEffect(() => {
    const loadData = async () => {
      try {
        // Get current user email first
        const { data: userData } = await supabase.auth.getUser();
        const currentUserEmail = userData?.user?.email || '';
        setUser(userData?.user);
        
        // Resolve owner email: current user first, then localStorage, then from properties
        let email = currentUserEmail;
        if (!email) {
          try { email = window.localStorage.getItem('ownerEmail') || ''; } catch {}
        }
        
        setOwnerEmail(email);

        if (!email) {
          console.warn('No owner email found - cannot load owner-specific data');
          setProperties([]);
          setBookings([]);
          setNotifications([]);
          return;
        }

        // Load only properties owned by this user
        const { data: props, error: propsErr } = await supabase
          .from('properties')
          .select('id, title, description, price, location, images, amenities, lat, lng, status, created_at, owner_email, rating, total_reviews, business_permit_url')
          .eq('owner_email', email)
          .order('created_at', { ascending: false });
        if (propsErr) throw propsErr;
        const mappedProps: Property[] = (props || []).map((p: any) => ({
          id: p.id,
          title: p.title || '',
          description: p.description || '',
          price: Number(p.price) || 0,
          location: p.location || '',
          images: (Array.isArray(p.images) ? p.images : (p.images ? [p.images] : []))
            .filter((path: any) => path && String(path).trim() !== '')
            .map((path: any) => {
              const str = String(path || '');
              if (!str) return str;
              if (/^https?:\/\//i.test(str)) return str;
              const res = supabase.storage.from('property-images').getPublicUrl(str);
              return res.data?.publicUrl || str;
            }),
          amenities: Array.isArray(p.amenities) ? p.amenities : [],
          coordinates: { lat: p.lat, lng: p.lng },
          status: (p.status === 'available' ? 'active' : p.status === 'pending' ? 'pending' : 'inactive'),
          ownerEmail: p.owner_email || '',
          rating: Number(p.rating) || 0,
          isVerified: Boolean(p.is_verified),
          business_permit_url: p.business_permit_url || null
        }));
        setProperties(mappedProps);

        // Load only bookings for properties owned by this user
        const propertyIds = mappedProps.map(p => p.id);
        let mappedBookings: BookingRequest[] = [];
        if (propertyIds.length > 0) {
          const { data: books, error: booksErr } = await supabase
            .from('bookings')
            .select('id, property_id, client_name, client_email, message, status, created_at, total_amount')
            .in('property_id', propertyIds)
            .order('created_at', { ascending: false });
          if (booksErr) throw booksErr;
          mappedBookings = (books || []).map((b: any) => ({
            id: b.id,
            propertyId: b.property_id,
            clientName: b.client_name,
            clientEmail: b.client_email,
            message: b.message,
            status: b.status as 'pending' | 'approved' | 'rejected',
            createdAt: b.created_at,
            totalAmount: b.total_amount || 0
          }));
        }
        setBookings(mappedBookings);

        // Load only notifications for this owner
        const { data: notifs, error: notifErr } = await supabase
          .from('notifications')
          .select('id, recipient_email, booking_id, property_id, type, title, body, read_at, created_at')
          .eq('recipient_email', email)
          .order('created_at', { ascending: false });
        if (notifErr) throw notifErr;
        setNotifications(notifs || []);

        // Load reviews for owner's properties
        const { data: reviewsData, error: reviewsErr } = await supabase
          .from('reviews')
          .select(`
            id,
            property_id,
            client_name,
            rating,
            review_text,
            created_at,
            properties!inner(title, owner_email)
          `)
          .eq('properties.owner_email', email)
          .eq('is_verified', true)
          .order('created_at', { ascending: false });
        if (reviewsErr) throw reviewsErr;
        const mappedReviews: Review[] = (reviewsData || []).map((r: any) => ({
          id: r.id,
          propertyId: r.property_id,
          clientName: r.client_name,
          rating: r.rating,
          reviewText: r.review_text,
          createdAt: r.created_at
        }));
        setReviews(mappedReviews);
      } catch (e) {
        console.error('Failed to load owner data', e);
      }
    };
    loadData();
  }, []);

  // Load analytics data
  React.useEffect(() => {
    const loadAnalytics = async () => {
      if (!ownerEmail) return;
      
      try {
        // Get property IDs for this owner
        const propertyIds = properties.map(p => p.id);
        if (propertyIds.length === 0) return;

        // Filter bookings by month if selected
        let filteredBookingsForStats = bookings;
        if (selectedMonth !== 'all') {
          const [year, month] = selectedMonth.split('-');
          const startDate = `${year}-${month}-01`;
          const endDate = `${year}-${month}-${new Date(parseInt(year), parseInt(month), 0).getDate()}`;
          filteredBookingsForStats = bookings.filter(b => {
            const bookingDate = b.createdAt.split('T')[0];
            return bookingDate >= startDate && bookingDate <= endDate;
          });
        }

        // Calculate basic stats
        const totalProperties = properties.length;
        const totalBookings = filteredBookingsForStats.length;
        
        // Calculate average rating - use reviews if property rating is missing
        let totalRatingSum = 0;
        let propertiesWithRatings = 0;
        properties.forEach(property => {
          const propertyReviews = reviews.filter(r => r.propertyId === property.id);
          let propertyRating = property.rating || 0;
          
          // If property rating is 0 or missing, calculate from reviews
          if ((!propertyRating || propertyRating === 0) && propertyReviews.length > 0) {
            const totalRating = propertyReviews.reduce((sum, r) => sum + (r.rating || 0), 0);
            propertyRating = totalRating / propertyReviews.length;
          }
          
          if (propertyRating > 0) {
            totalRatingSum += propertyRating;
            propertiesWithRatings++;
          }
        });
        
        const averageRating = propertiesWithRatings > 0 
          ? totalRatingSum / propertiesWithRatings 
          : 0;

        // Calculate occupancy rate (simplified)
        const approvedBookings = filteredBookingsForStats.filter(b => b.status === 'approved').length;
        const occupancyRate = totalProperties > 0 ? (approvedBookings / totalProperties) * 100 : 0;

        // Calculate total revenue from approved bookings
        const totalRevenue = filteredBookingsForStats
          .filter(b => b.status === 'approved')
          .reduce((sum, booking) => sum + (booking.totalAmount || 0), 0);

        // Booking trends (filtered by month if selected)
        const bookingTrends = [];
        let filteredBookings = bookings;
        if (selectedMonth !== 'all') {
          const [year, month] = selectedMonth.split('-');
          const startDate = `${year}-${month}-01`;
          const endDate = `${year}-${month}-${new Date(parseInt(year), parseInt(month), 0).getDate()}`;
          filteredBookings = bookings.filter(b => {
            const bookingDate = b.createdAt.split('T')[0];
            return bookingDate >= startDate && bookingDate <= endDate;
          });
        }
        
        // Get date range for trends
        const daysToShow = selectedMonth !== 'all' ? new Date(parseInt(selectedMonth.split('-')[0]), parseInt(selectedMonth.split('-')[1]), 0).getDate() : 30;
        for (let i = daysToShow - 1; i >= 0; i--) {
          const date = new Date();
          if (selectedMonth !== 'all') {
            const [year, month] = selectedMonth.split('-');
            date.setFullYear(parseInt(year), parseInt(month) - 1, daysToShow - i);
          } else {
          date.setDate(date.getDate() - i);
          }
          const dateKey = date.toISOString().slice(0, 10);
          const dayBookings = filteredBookings.filter(b => b.createdAt.startsWith(dateKey));
          const dayRevenue = dayBookings
            .filter(b => b.status === 'approved')
            .reduce((sum, booking) => sum + (booking.totalAmount || 0), 0);
          bookingTrends.push({ 
            date: dateKey, 
            bookings: dayBookings.length,
            revenue: dayRevenue 
          });
        }

        // Property performance
        const propertyPerformance = properties.map(property => {
          const propertyBookings = filteredBookingsForStats.filter(b => b.propertyId === property.id);
          const propertyReviews = reviews.filter(r => r.propertyId === property.id);
          
          // Calculate rating from reviews if property rating is missing or 0
          let calculatedRating = property.rating || 0;
          if ((!calculatedRating || calculatedRating === 0) && propertyReviews.length > 0) {
            const totalRating = propertyReviews.reduce((sum, r) => sum + (r.rating || 0), 0);
            calculatedRating = totalRating / propertyReviews.length;
          }
          
          // Calculate revenue from approved bookings for this property
          const propertyRevenue = propertyBookings
            .filter(b => b.status === 'approved')
            .reduce((sum, booking) => sum + (booking.totalAmount || 0), 0);
          
          return {
            propertyId: property.id,
            propertyTitle: property.title,
            bookings: propertyBookings.length,
            rating: calculatedRating,
            revenue: propertyRevenue,
            averageRevenue: propertyBookings.length > 0 ? propertyRevenue / propertyBookings.length : 0
          };
        });

        // Calculate sales metrics
        const approvedBookingsArray = filteredBookingsForStats.filter(b => b.status === 'approved');
        const averageRevenuePerBooking = approvedBookingsArray.length > 0 
          ? totalRevenue / approvedBookingsArray.length 
          : 0;

        // Calculate revenue trends
        const revenueTrends = bookingTrends.map(trend => ({
          date: trend.date,
          revenue: trend.revenue
        }));

        // Calculate monthly revenue (last 6 months)
        const monthlyRevenue = [];
        for (let i = 5; i >= 0; i--) {
          const date = new Date();
          date.setMonth(date.getMonth() - i);
          const monthKey = date.toISOString().slice(0, 7);
          
          const monthBookings = bookings.filter(b => {
            const bookingDate = b.createdAt.slice(0, 7);
            return bookingDate === monthKey;
          });
          
          const monthRevenue = monthBookings
            .filter(b => b.status === 'approved')
            .reduce((sum, booking) => sum + (booking.totalAmount || 0), 0);
          
          monthlyRevenue.push({
            month: monthKey,
            revenue: monthRevenue,
            bookings: monthBookings.length
          });
        }

        // Top performing properties by revenue
        const topPerformingProperties = [...propertyPerformance]
          .sort((a, b) => b.revenue - a.revenue)
          .slice(0, 5)
          .map(p => ({
            propertyId: p.propertyId,
            propertyTitle: p.propertyTitle,
            revenue: p.revenue
          }));

        // Revenue by booking status
        const revenueByStatus = [
          { status: 'approved', count: filteredBookingsForStats.filter(b => b.status === 'approved').length, revenue: totalRevenue },
          { status: 'pending', count: filteredBookingsForStats.filter(b => b.status === 'pending').length, revenue: 0 },
          { status: 'rejected', count: filteredBookingsForStats.filter(b => b.status === 'rejected').length, revenue: 0 }
        ];

        setAnalytics({
          totalProperties,
          totalBookings,
          averageRating,
          occupancyRate,
          totalRevenue,
          averageRevenuePerBooking,
          revenueTrends,
          bookingTrends,
          propertyPerformance,
          monthlyRevenue,
          topPerformingProperties,
          revenueByStatus
        });
      } catch (e) {
        console.error('Failed to load analytics', e);
      }
    };
    loadAnalytics();
  }, [ownerEmail, properties, bookings, selectedMonth]);

  React.useEffect(() => {
    // Guard: only allow landlord role
    const enforceLandlordRole = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
          alert('Access denied: Please login first.');
          onBack();
          return;
        }

        const metaRole = (user.user_metadata?.role === 'owner' ? 'owner' : 'client') as 'owner' | 'client';

        const { data: appUser, error: appUserError, status } = await supabase
          .from('app_users')
          .select('role')
          .eq('user_id', user.id)
          .maybeSingle();

        if (!appUser && (status === 406 || appUserError?.code === 'PGRST116' || !appUserError)) {
          if (metaRole !== 'owner') {
            alert('Access denied: landlord role required.');
            onBack();
            return;
          }

          const { error: insertError } = await supabase
            .from('app_users')
            .insert({
              user_id: user.id,
              email: user.email,
              full_name: user.user_metadata?.full_name || user.email?.split('@')[0] || 'User',
              role: 'owner'
            });

          if (insertError) {
            console.warn('Failed to create app_users row for owner:', insertError);
          }
        }

        const effectiveRole = appUser?.role || metaRole;
        if (effectiveRole !== 'owner') {
          alert('Access denied: landlord role required.');
          onBack();
          return;
        }
      } catch (e: any) {
        console.error('Role validation failed', e);
        alert('Access denied: landlord role required.');
        onBack();
        return;
      }
    };
    enforceLandlordRole();
  }, [onBack]);

  // Handle scroll to show/hide scroll-to-top button
  React.useEffect(() => {
    const handleScroll = () => {
      const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
      setShowScrollTop(scrollTop > 300);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const scrollToTop = () => {
    window.scrollTo({
      top: 0,
      behavior: 'smooth'
    });
  };

  const handleDeleteProperty = async (propertyId: string) => {
    if (window.confirm('Are you sure you want to delete this property?')) {
        try {
            const { error } = await supabase
                .from('properties')
                .delete()
                .eq('id', propertyId);

            if (error) {
                throw error;
            }

            setProperties(properties.filter(p => p.id !== propertyId));
            setShowPropertyDetails(null);
            alert('Property deleted successfully!');
        } catch (error) {
            console.error('Error deleting property:', error);
            alert('Failed to delete property');
        }
    }
  };

  const handleUpdateProperty = async () => {
    if (editingProperty) {
        try {
            const { error } = await supabase
                .from('properties')
                .update({
                    title: editingProperty.title,
                    description: editingProperty.description,
                    price: editingProperty.price,
                    location: editingProperty.location,
                    amenities: editingProperty.amenities,
                })
                .eq('id', editingProperty.id);

            if (error) {
                throw error;
            }

            setProperties(properties.map(p => p.id === editingProperty.id ? editingProperty : p));
            setEditingProperty(null);
            setShowPropertyDetails(editingProperty);
            alert('Property updated successfully!');
        } catch (error) {
            console.error('Error updating property:', error);
            alert('Failed to update property');
        }
    }
  };

  const handleAddProperty = async () => {
    // Validate required fields
    if (!newProperty.title || !newProperty.description || !newProperty.price || !newProperty.location) {
      alert('Please fill in all required fields: Title, Description, Price, and Location');
      return;
    }

    // Validate coordinates
    if (!newProperty.coordinates || 
        !newProperty.coordinates.lat || 
        !newProperty.coordinates.lng || 
        newProperty.coordinates.lat === 0 || 
        newProperty.coordinates.lng === 0 ||
        isNaN(newProperty.coordinates.lat) ||
        isNaN(newProperty.coordinates.lng)) {
      alert('Please click on the map to set the property location. Coordinates are required.');
      return;
    }

    // Validate owner email
    if (!ownerEmail) {
      alert('Owner email is missing. Please log out and log back in.');
      return;
    }

      setIsAddingProperty(true);
      try {
        // Upload images to Supabase storage
        const uploadedImagePaths: string[] = [];
        
        for (let i = 0; i < newProperty.images.length; i++) {
          const file = newProperty.images[i];
          const fileExt = file.name.split('.').pop();
          const fileName = `${Date.now()}-${i}.${fileExt}`;
          const filePath = `properties/${fileName}`;
          
          const { error: uploadError } = await supabase.storage
            .from('property-images')
            .upload(filePath, file);
          
          if (uploadError) {
            console.error('Error uploading image:', uploadError);
          alert(`Failed to upload image: ${file.name}\nError: ${uploadError.message}`);
            setIsAddingProperty(false);
            return;
          }
          
          uploadedImagePaths.push(filePath);
        }

      // Validate price is a valid number
      const priceValue = parseInt(newProperty.price);
      if (isNaN(priceValue) || priceValue <= 0) {
        alert('Please enter a valid price (must be a positive number)');
        setIsAddingProperty(false);
        return;
      }

      console.log('Creating property with data:', {
        title: newProperty.title,
        description: newProperty.description,
        price: priceValue,
        location: newProperty.location,
        lat: newProperty.coordinates.lat,
        lng: newProperty.coordinates.lng,
        owner_email: ownerEmail,
        images: uploadedImagePaths,
        amenities: newProperty.amenities
      });

        // Create property in database according to the exact schema
        const { data: propertyData, error: insertError } = await supabase
          .from('properties')
          .insert([{
          title: newProperty.title.trim(),
          description: newProperty.description.trim(),
          price: priceValue,
          location: newProperty.location.trim(),
            images: uploadedImagePaths.length > 0 ? uploadedImagePaths : [],
            amenities: newProperty.amenities.length > 0 ? newProperty.amenities : [],
            lat: newProperty.coordinates.lat,
            lng: newProperty.coordinates.lng,
          status: 'available', // Changed from 'pending' to match database constraint
            owner_email: ownerEmail
          }])
          .select()
          .single();

        if (insertError) {
          console.error('Error creating property:', insertError);
        console.error('Error details:', {
          message: insertError.message,
          details: insertError.details,
          hint: insertError.hint,
          code: insertError.code
        });
        
        // Show detailed error message
        let errorMessage = 'Failed to create property';
        if (insertError.message) {
          errorMessage += `: ${insertError.message}`;
        }
        if (insertError.hint) {
          errorMessage += `\n\nHint: ${insertError.hint}`;
        }
        if (insertError.code === '42501') {
          errorMessage += '\n\nThis might be a permissions issue. Please check your database policies.';
        }
        
        alert(errorMessage);
        setIsAddingProperty(false);
          return;
        }

        // Add to local state
        const property: Property = {
          id: propertyData.id,
          title: propertyData.title,
          description: propertyData.description,
          price: propertyData.price,
          location: propertyData.location,
          images: uploadedImagePaths.map(path => {
            const res = supabase.storage.from('property-images').getPublicUrl(path);
            return res.data?.publicUrl || path;
          }),
          amenities: propertyData.amenities,
          coordinates: { lat: propertyData.lat, lng: propertyData.lng },
          status: propertyData.status === 'available' ? 'active' : propertyData.status === 'full' ? 'inactive' : 'active',
          isVerified: Boolean(propertyData.is_verified),
          ownerEmail: propertyData.owner_email
        };
        
        setProperties([property, ...properties]);
        setNewProperty({
          title: '',
          description: '',
          price: '',
          location: '',
          amenities: [],
          coordinates: { lat: 0, lng: 0 },
          images: []
        });
        setShowAddProperty(false);
        
        alert('Property added successfully! It is now visible to tenants.');
      } catch (error: any) {
        console.error('Error adding property:', error);
        const errorMessage = error?.message || error?.toString() || 'Unknown error occurred';
        alert(`Failed to add property: ${errorMessage}`);
      } finally {
        setIsAddingProperty(false);
    }
  };

  const handleBookingAction = async (bookingId: string, action: 'approve' | 'reject') => {
    try {
      const newStatus = action === 'approve' ? 'approved' : 'rejected';
      
      // Update booking status in database
      const { error: updateError } = await supabase
        .from('bookings')
        .update({ status: newStatus })
        .eq('id', bookingId);
      
      if (updateError) {
        console.error('Error updating booking status:', updateError);
        alert('Failed to update booking status');
        return;
      }
      
      // Update local state
      setBookings(bookings.map((booking) => (
        booking.id === bookingId 
          ? { ...booking, status: newStatus as 'approved' | 'rejected' }
          : booking
      )));
      
      try {
        const booking = bookings.find(b => b.id === bookingId);
        const property = booking ? properties.find(p => p.id === booking.propertyId) : null;
        const toEmail = (booking?.clientEmail || '').trim();
        if (booking && toEmail) {
           console.log(`Sending decision email to ${booking.clientEmail} for booking ${bookingId}`);
           const emailResult = await sendTenantDecisionEmail({
            toEmail,
            clientName: booking.clientName,
            propertyTitle: property?.title,
            decision: newStatus === 'approved' ? 'approved' : 'rejected',
            ownerName: user?.user_metadata?.full_name || 'Landlord',
           });

          if (!emailResult.success) {
            alert(`Status updated, but email failed to send: ${emailResult.error?.text || 'Unknown error'}`);
          }
        } else {
          console.warn('Cannot send email: Booking or client email missing', { booking });
        }
      } catch (emailErr) {
        console.error('Failed to send tenant decision email:', emailErr);
      }

      // Show success message
      alert(`Booking ${action}d successfully!`);
    } catch (error) {
      console.error('Error handling booking action:', error);
      alert('Failed to update booking status');
    }
  };

  const toggleAmenity = (amenity: string) => {
    setNewProperty(prev => ({
      ...prev,
      amenities: prev.amenities.includes(amenity)
        ? prev.amenities.filter(a => a !== amenity)
        : [...prev.amenities, amenity]
    }));
  };

  const addCustomAmenity = () => {
    const trimmedAmenity = customAmenity.trim();
    if (trimmedAmenity && !newProperty.amenities.includes(trimmedAmenity)) {
      setNewProperty(prev => ({
        ...prev,
        amenities: [...prev.amenities, trimmedAmenity]
      }));
      setCustomAmenity('');
    }
  };

  const removeAmenity = (amenity: string) => {
    setNewProperty(prev => ({
      ...prev,
      amenities: prev.amenities.filter(a => a !== amenity)
    }));
  };

  const addEditCustomAmenity = () => {
    const trimmedAmenity = editCustomAmenity.trim();
    if (trimmedAmenity && editingProperty && !editingProperty.amenities.includes(trimmedAmenity)) {
      setEditingProperty({
        ...editingProperty,
        amenities: [...editingProperty.amenities, trimmedAmenity]
      });
      setEditCustomAmenity('');
    }
  };

  const removeEditAmenity = (amenity: string) => {
    if (editingProperty) {
      setEditingProperty({
        ...editingProperty,
        amenities: editingProperty.amenities.filter(a => a !== amenity)
      });
    }
  };

  // Export functions
  const exportAnalyticsToExcel = () => {
    try {
      const workbook = XLSX.utils.book_new();
      const currentDate = new Date().toISOString().split('T')[0];
      const filterInfo = selectedMonth !== 'all' ? ` (Filtered: ${selectedMonth})` : '';

      // Analytics Summary Sheet
      const summaryData = [
        ['Metric', 'Value'],
        ['Total Properties', analytics.totalProperties],
        ['Total Bookings', analytics.totalBookings],
        ['Average Rating', analytics.averageRating.toFixed(2)],
        ['Occupancy Rate', `${analytics.occupancyRate.toFixed(2)}%`],
        ['Time Period', selectedMonth !== 'all' ? selectedMonth : 'All Months'],
        ['Report Generated', new Date().toLocaleString()]
      ];
      const summarySheet = XLSX.utils.aoa_to_sheet(summaryData);
      XLSX.utils.book_append_sheet(workbook, summarySheet, 'Summary');

      // Booking Trends Sheet
      const trendsData = [
        ['Date', 'Bookings'],
        ...analytics.bookingTrends.map(t => [t.date, t.bookings])
      ];
      const trendsSheet = XLSX.utils.aoa_to_sheet(trendsData);
      XLSX.utils.book_append_sheet(workbook, trendsSheet, 'Booking Trends');

      // Property Performance Sheet
      const performanceData = [
        ['Property', 'Bookings', 'Rating'],
        ...analytics.propertyPerformance.map(p => [p.propertyTitle, p.bookings, p.rating.toFixed(2)])
      ];
      const performanceSheet = XLSX.utils.aoa_to_sheet(performanceData);
      XLSX.utils.book_append_sheet(workbook, performanceSheet, 'Property Performance');

      const fileName = `analytics_report_${currentDate}${selectedMonth !== 'all' ? `_${selectedMonth}` : ''}.xlsx`;
      XLSX.writeFile(workbook, fileName);
      alert(`Analytics report exported successfully${filterInfo}: ${fileName}`);
    } catch (error) {
      console.error('Failed to export analytics:', error);
      alert('Failed to export analytics report');
    }
  };

  const exportTenantDataToExcel = () => {
    try {
      const workbook = XLSX.utils.book_new();
      const currentDate = new Date().toISOString().split('T')[0];

      // Get unique tenants from bookings
      const tenantMap = new Map();
      bookings.forEach(booking => {
        const tenantEmail = booking.clientEmail || booking.tenant_email || '';
        if (tenantEmail && !tenantMap.has(tenantEmail)) {
          tenantMap.set(tenantEmail, {
            name: booking.clientName || booking.full_name || 'N/A',
            email: tenantEmail,
            phone: booking.phone || 'N/A',
            address: booking.address || 'N/A',
            barangay: booking.barangay || 'N/A',
            city: booking.municipality_city || 'N/A',
            gender: booking.gender || 'N/A',
            age: booking.age || 'N/A',
            citizenship: booking.citizenship || 'N/A',
            occupation: booking.occupation_status || 'N/A',
            totalBookings: 1,
            totalSpent: booking.totalAmount || 0
          });
        } else if (tenantMap.has(tenantEmail)) {
          const tenant = tenantMap.get(tenantEmail);
          tenant.totalBookings += 1;
          tenant.totalSpent += booking.totalAmount || 0;
        }
      });

      const tenants = Array.from(tenantMap.values());

      // Tenant Details Sheet
      const tenantData = [
        ['Name', 'Email', 'Phone', 'Address', 'Barangay', 'City', 'Gender', 'Age', 'Citizenship', 'Occupation', 'Total Bookings', 'Total Spent'],
        ...tenants.map(tenant => [
          tenant.name,
          tenant.email,
          tenant.phone,
          tenant.address,
          tenant.barangay,
          tenant.city,
          tenant.gender,
          tenant.age,
          tenant.citizenship,
          tenant.occupation,
          tenant.totalBookings,
          tenant.totalSpent
        ])
      ];
      const tenantSheet = XLSX.utils.aoa_to_sheet(tenantData);
      XLSX.utils.book_append_sheet(workbook, tenantSheet, 'Tenant Details');

      // Booking Details Sheet
      const bookingData = [
        ['Tenant Name', 'Tenant Email', 'Property', 'Check-in Date', 'Check-out Date', 'Status', 'Total Amount', 'Booking Date'],
        ...bookings.map(booking => [
          booking.clientName || booking.full_name || 'N/A',
          booking.clientEmail || booking.tenant_email || 'N/A',
          properties.find(p => p.id === booking.propertyId)?.title || 'N/A',
          booking.checkInDate || 'N/A',
          booking.checkOutDate || 'N/A',
          booking.status,
          booking.totalAmount || 0,
          booking.createdAt
        ])
      ];
      const bookingSheet = XLSX.utils.aoa_to_sheet(bookingData);
      XLSX.utils.book_append_sheet(workbook, bookingSheet, 'Booking Details');

      const fileName = `tenant_data_${currentDate}.xlsx`;
      XLSX.writeFile(workbook, fileName);
      alert(`Tenant data exported successfully: ${fileName}`);
    } catch (error) {
      console.error('Failed to export tenant data:', error);
      alert('Failed to export tenant data');
    }
  };

  const exportAnalyticsToPDF = () => {
    try {
      const doc = new jsPDF('landscape');
      let startY = 20;

      // Title
      doc.setFontSize(18);
      doc.setFont('helvetica', 'bold');
      doc.text('Analytics Dashboard Report', 14, 15);
      
      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      doc.text(`Generated: ${new Date().toLocaleString()}`, 14, 22);
      startY = 30;

      // Summary Table
      const summaryData = [
        ['Metric', 'Value'],
        ['Total Properties', analytics.totalProperties.toString()],
        ['Total Bookings', analytics.totalBookings.toString()],
        ['Average Rating', analytics.averageRating.toFixed(2)],
        ['Occupancy Rate', `${analytics.occupancyRate.toFixed(2)}%`]
      ];

      (doc as any).autoTable({
        head: [summaryData[0]],
        body: summaryData.slice(1),
        startY: startY,
        styles: { fontSize: 10 },
        headStyles: { fillColor: [66, 139, 202] }
      });
      startY = (doc as any).lastAutoTable.finalY + 15;

      // Booking Trends Table
      if (startY > 150) {
        doc.addPage();
        startY = 20;
      }

      const trendsData = analytics.bookingTrends.map(t => [t.date, t.bookings.toString()]);

      (doc as any).autoTable({
        head: [['Date', 'Bookings']],
        body: trendsData,
        startY: startY,
        styles: { fontSize: 9 },
        headStyles: { fillColor: [66, 139, 202] }
      });
      startY = (doc as any).lastAutoTable.finalY + 15;

      // Property Performance Table
      if (startY > 150) {
        doc.addPage();
        startY = 20;
      }

      const performanceData = analytics.propertyPerformance.map(p => [
        p.propertyTitle,
        p.bookings.toString(),
        p.rating.toFixed(2)
      ]);

      (doc as any).autoTable({
        head: [['Property', 'Bookings', 'Rating']],
        body: performanceData,
        startY: startY,
        styles: { fontSize: 9 },
        headStyles: { fillColor: [66, 139, 202] }
      });

      const fileName = `analytics_report_${new Date().toISOString().split('T')[0]}.pdf`;
      doc.save(fileName);
      alert(`Analytics PDF report exported successfully: ${fileName}`);
    } catch (error) {
      console.error('Failed to export analytics PDF:', error);
      alert('Failed to export analytics PDF report');
    }
  };

  const exportAnalyticsToCSV = () => {
    try {
      const currentDate = new Date().toISOString().split('T')[0];
      const filterInfo = selectedMonth !== 'all' ? `_${selectedMonth}` : '';
      
      // Create CSV content for each section
      let csvContent = '';
      
      // Summary section
      csvContent += 'ANALYTICS SUMMARY\n\n';
      csvContent += 'Metric,Value\n';
      csvContent += `Total Properties,${analytics.totalProperties}\n`;
      csvContent += `Total Bookings,${analytics.totalBookings}\n`;
      csvContent += `Average Rating,${analytics.averageRating.toFixed(2)}\n`;
      csvContent += `Occupancy Rate,${analytics.occupancyRate.toFixed(2)}%\n`;
      csvContent += `Time Period,${selectedMonth !== 'all' ? selectedMonth : 'All Months'}\n`;
      csvContent += `Report Generated,${new Date().toLocaleString()}\n\n`;
      
      // Booking Trends section
      csvContent += 'BOOKING TRENDS\n\n';
      csvContent += 'Date,Bookings\n';
      analytics.bookingTrends.forEach(trend => {
        csvContent += `${trend.date},${trend.bookings}\n`;
      });
      csvContent += '\n';
      
      // Property Performance section
      csvContent += 'PROPERTY PERFORMANCE\n\n';
      csvContent += 'Property,Bookings,Rating\n';
      analytics.propertyPerformance.forEach(property => {
        csvContent += `"${property.propertyTitle.replace(/"/g, '""')}",${property.bookings},${property.rating.toFixed(2)}\n`;
      });
      
      // Create download link
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', `analytics_report_${currentDate}${filterInfo}.csv`);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      alert(`Analytics CSV report exported successfully${selectedMonth !== 'all' ? ' (Filtered: ' + selectedMonth + ')' : ''}: analytics_report_${currentDate}${filterInfo}.csv`);
    } catch (error) {
      console.error('Failed to export analytics CSV:', error);
      alert('Failed to export analytics CSV report');
    }
  };

  const exportBookingsToExcel = async () => {
    try {
      const workbook = XLSX.utils.book_new();
      const currentDate = new Date().toISOString().split('T')[0];

      // Get bed status for each booking
      const bookingsWithBedStatus = await Promise.all(bookings.map(async (b) => {
        const { data: bedData } = await supabase
          .from('beds')
          .select('status')
          .eq('booking_id', b.id)
          .single();
        return { ...b, bedStatus: bedData?.status || 'N/A' };
      }));

      const bookingsData = [
        ['ID', 'Client Name', 'Client Email', 'Property', 'Status', 'Bed Status', 'Total Amount', 'Check In', 'Check Out', 'Created At'],
        ...bookingsWithBedStatus.map(b => [
          b.id,
          b.clientName,
          b.clientEmail,
          properties.find(p => p.id === b.propertyId)?.title || 'N/A',
          b.status,
          b.bedStatus,
          b.totalAmount ? `₱${b.totalAmount.toLocaleString()}` : 'N/A',
          b.checkInDate || 'N/A',
          b.checkOutDate || 'N/A',
          b.createdAt
        ])
      ];

      const sheet = XLSX.utils.aoa_to_sheet(bookingsData);
      XLSX.utils.book_append_sheet(workbook, sheet, 'Bookings');

      const fileName = `bookings_report_${currentDate}.xlsx`;
      XLSX.writeFile(workbook, fileName);
      alert(`Bookings report exported successfully: ${fileName}`);
    } catch (error) {
      console.error('Failed to export bookings:', error);
      alert('Failed to export bookings report');
    }
  };

  const exportBookingsToPDF = async () => {
    try {
      const doc = new jsPDF('landscape');
      let startY = 20;

      // Title
      doc.setFontSize(18);
      doc.setFont('helvetica', 'bold');
      doc.text('Bookings Report', 14, 15);
      
      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      doc.text(`Generated: ${new Date().toLocaleString()}`, 14, 22);
      startY = 30;

      // Get bed status for each booking
      const bookingsWithBedStatus = await Promise.all(bookings.map(async (b) => {
        const { data: bedData } = await supabase
          .from('beds')
          .select('status')
          .eq('booking_id', b.id)
          .single();
        return { ...b, bedStatus: bedData?.status || 'N/A' };
      }));

      const bookingsData = bookingsWithBedStatus.map(b => [
        b.id.substring(0, 8) + '...',
        b.clientName,
        b.clientEmail,
        (properties.find(p => p.id === b.propertyId)?.title || 'N/A').substring(0, 30),
        b.status,
        b.bedStatus,
        b.totalAmount ? `₱${b.totalAmount.toLocaleString()}` : 'N/A',
        b.checkInDate || 'N/A',
        b.checkOutDate || 'N/A',
        b.createdAt ? new Date(b.createdAt).toLocaleDateString() : 'N/A'
      ]);

      (doc as any).autoTable({
        head: [['ID', 'Client Name', 'Email', 'Property', 'Status', 'Bed Status', 'Amount', 'Check In', 'Check Out', 'Created']],
        body: bookingsData,
        startY: startY,
        styles: { fontSize: 8 },
        headStyles: { fillColor: [66, 139, 202] },
        columnStyles: {
          0: { cellWidth: 30 },
          1: { cellWidth: 40 },
          2: { cellWidth: 50 },
          3: { cellWidth: 50 },
          4: { cellWidth: 25 },
          5: { cellWidth: 35 },
          6: { cellWidth: 30 },
          7: { cellWidth: 30 },
          8: { cellWidth: 30 }
        }
      });

      const fileName = `bookings_report_${new Date().toISOString().split('T')[0]}.pdf`;
      doc.save(fileName);
      alert(`Bookings PDF report exported successfully: ${fileName}`);
    } catch (error) {
      console.error('Failed to export bookings PDF:', error);
      alert('Failed to export bookings PDF report');
    }
  };

  const handleLogout = async () => {
    const confirmed = window.confirm('Are you sure you want to log out?');
    if (!confirmed) return;
    try {
      await supabase.auth.signOut();
    } catch (error) {
      console.error('Failed to sign out landlord', error);
    }
    onBack();
  };

  const openChatForBooking = async (booking: BookingRequest) => {
    try {
      let prop = properties.find(p => p.id === booking.propertyId);
      let ownerEmail = prop?.ownerEmail || '';
      if (!ownerEmail) {
        const saved = typeof window !== 'undefined' ? window.localStorage.getItem('ownerEmail') || '' : '';
        if (saved && saved.includes('@')) {
          ownerEmail = saved;
          const { error: updErrSaved } = await supabase
            .from('properties')
            .update({ owner_email: ownerEmail })
            .eq('id', booking.propertyId);
          if (updErrSaved) throw updErrSaved;
          setProperties(prev => prev.map(p => p.id === booking.propertyId ? { ...p, ownerEmail } : p));
        } else {
          const entered = window.prompt('Enter your email to enable chat with clients:');
          const trimmed = (entered || '').trim();
          if (!trimmed || !trimmed.includes('@')) {
            alert('Valid email is required for chat.');
            return;
          }
          try { window.localStorage.setItem('ownerEmail', trimmed); } catch {}
          const { error: updErr } = await supabase
            .from('properties')
            .update({ owner_email: trimmed })
            .eq('id', booking.propertyId);
          if (updErr) throw updErr;
          setProperties(prev => prev.map(p => p.id === booking.propertyId ? { ...p, ownerEmail: trimmed } : p));
          ownerEmail = trimmed;
        }
        // refresh prop reference
        prop = properties.find(p => p.id === booking.propertyId);
      }
      // Ensure conversation exists
      const { data: existing, error: selErr } = await supabase
        .from('conversations')
        .select('*')
        .eq('property_id', booking.propertyId)
        .eq('owner_email', ownerEmail)
        .eq('client_email', booking.clientEmail)
        .limit(1);
      if (selErr) throw selErr;
      let conversation = existing && existing[0];
      if (!conversation) {
        const { data: created, error: insErr } = await supabase
          .from('conversations')
          .insert([{ property_id: booking.propertyId, owner_email: ownerEmail, client_email: booking.clientEmail }])
          .select('*')
          .single();
        if (insErr) throw insErr;
        conversation = created;
      }
      setActiveConversation(conversation);
      setChatOpen(true);
      // Load messages
      setChatLoading(true);
      const { data: msgs, error: msgErr } = await supabase
        .from('messages')
        .select('id, conversation_id, sender_email, content, created_at')
        .eq('conversation_id', conversation.id)
        .order('created_at', { ascending: true });
      if (msgErr) throw msgErr;
      setChatMessages(msgs || []);
      setTimeout(scrollMessagesToBottom, 0);

      // Realtime subscribe for new messages in this conversation
      if (chatChannel) {
        try { chatChannel.unsubscribe(); } catch {}
        setChatChannel(null);
      }
      const channel = supabase
        .channel(`messages-${conversation.id}`)
        .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'messages', filter: `conversation_id=eq.${conversation.id}` }, (payload: any) => {
          setChatMessages(prev => {
            const next = [...prev, payload.new as any];
            return next;
          });
          setTimeout(scrollMessagesToBottom, 0);
        })
        .subscribe();
      setChatChannel(channel);
    } catch (e) {
      console.error('Open chat failed', e);
      alert('Failed to open chat');
    } finally {
      setChatLoading(false);
    }
  };

  const sendChatMessage = async () => {
    if (!activeConversation) return;
    const content = chatInput.trim();
    if (!content) return;
    try {
      const { error } = await supabase
        .from('messages')
        .insert([{ 
          conversation_id: activeConversation.id, 
          sender_email: activeConversation.owner_email, 
          content 
        }]);
      
      if (error) {
        console.error('Send message failed', error);
        alert('Failed to send message');
        return;
      }
      
      setChatInput('');
      // Rely on realtime to append; optionally refresh as fallback
      const { data: msgs } = await supabase
        .from('messages')
        .select('id, conversation_id, sender_email, content, created_at')
        .eq('conversation_id', activeConversation.id)
        .order('created_at', { ascending: true });
      setChatMessages(msgs || []);
      setTimeout(scrollMessagesToBottom, 0);
    } catch (e) {
      console.error('Send message failed', e);
      alert('Failed to send message');
    }
  };

  const closeChat = () => {
    setChatOpen(false);
    if (chatChannel) {
      try { chatChannel.unsubscribe(); } catch {}
      setChatChannel(null);
    }
  };

  const openChatByPropertyId = async (propertyId: string) => {
    try {
      if (!ownerEmail) {
        alert('Owner email not set.');
        return;
      }
      
      // Verify the property belongs to this owner
      const property = properties.find(p => p.id === propertyId);
      if (!property || property.ownerEmail !== ownerEmail) {
        alert('You can only access chats for your own properties.');
        return;
      }
      
      const { data: convs, error: convErr } = await supabase
        .from('conversations')
        .select('*')
        .eq('property_id', propertyId)
        .eq('owner_email', ownerEmail)
        .order('created_at', { ascending: false })
        .limit(1);
      if (convErr) throw convErr;
      const conversation = convs && convs[0];
      if (!conversation) {
        alert('No chat for this property yet.');
        return;
      }
      setActiveConversation(conversation);
      setChatOpen(true);
      setChatLoading(true);
      const { data: msgs, error: msgErr } = await supabase
        .from('messages')
        .select('id, conversation_id, sender_email, content, created_at')
        .eq('conversation_id', conversation.id)
        .order('created_at', { ascending: true });
      if (msgErr) throw msgErr;
      setChatMessages(msgs || []);
      setTimeout(scrollMessagesToBottom, 0);
      if (chatChannel) { try { chatChannel.unsubscribe(); } catch {}; setChatChannel(null); }
      const channel = supabase
        .channel(`messages-${conversation.id}`)
        .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'messages', filter: `conversation_id=eq.${conversation.id}` }, (payload: any) => {
          setChatMessages(prev => [...prev, payload.new as any]);
          setTimeout(scrollMessagesToBottom, 0);
        })
        .subscribe();
      setChatChannel(channel);
    } catch (e) {
      console.error('Open chat by property failed', e);
      alert('Failed to open chat');
    } finally {
      setChatLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-screen bg-white overflow-y-auto">
      {/* Top Orange Bar */}
      <div className="w-full h-2 bg-gradient-to-r from-orange-500 via-orange-600 to-orange-700"></div>
      <div className="p-2 sm:p-4">
        {/* Header */}
        <div className="bg-white rounded-xl sm:rounded-2xl shadow-lg border border-gray-100 p-3 sm:p-4 md:p-6 mb-3 sm:mb-4 md:mb-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4">
            <div className="text-left">
              <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-gray-900 mb-1 sm:mb-2">
                Landlord Dashboard
              </h1>
              <p className="text-gray-600 font-medium text-xs sm:text-sm md:text-base">
                Manage your properties and booking requests
              </p>
            </div>
            <div className="relative flex flex-wrap items-center gap-2 sm:gap-3">
              <button onClick={() => setShowNotif(!showNotif)} className="relative bg-orange-100 text-orange-700 px-3 py-2 rounded-lg hover:bg-orange-200 transition-colors duration-200 flex items-center space-x-2">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2 2 0 0118 14.158V11a6 6 0 10-12 0v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                </svg>
                {(() => {
                  const unreadCount = notifications.filter(n => !n.read_at).length;
                  return unreadCount > 0 ? (
                    <span className="absolute -top-2 -right-2 bg-red-600 text-white text-xs font-bold px-2 py-0.5 rounded-full">
                      {unreadCount}
                    </span>
                  ) : null;
                })()}
              </button>
              {showNotif && (
                <div className="absolute right-0 top-12 w-[calc(100vw-2rem)] sm:w-96 max-w-sm bg-white rounded-xl shadow-lg border border-gray-100 z-50">
                  <div className="p-2 sm:p-3 border-b font-semibold text-sm sm:text-base flex items-center justify-between">
                    <span>Notifications</span>
                      <button
                        onClick={async () => {
                          if (!ownerEmail) return;
                          try {
                            const unreadNotifications = notifications.filter(n => !n.read_at);
                            if (unreadNotifications.length === 0) return;
                            
                            const { error } = await supabase
                              .from('notifications')
                              .update({ read_at: new Date().toISOString() })
                              .eq('recipient_email', ownerEmail)
                              .is('read_at', null);
                          
                            if (error) {
                              console.error('Mark read failed', error);
                              return;
                            }
                          
                            // Update local state - mark all unread as read (badge will disappear automatically)
                            const readTimestamp = new Date().toISOString();
                            setNotifications(prev => prev.map(n => 
                              !n.read_at ? { ...n, read_at: readTimestamp } : n
                            ));
                          } catch (e) {
                            console.error('Mark read failed', e);
                          }
                        }}
                        className="text-xs text-orange-600 hover:text-orange-700"
                      >Mark all read</button>
                  </div>
                  <div className="max-h-96 overflow-y-auto">
                    {notifications.length === 0 && (
                      <div className="p-4 text-sm text-gray-600">No notifications</div>
                    )}
                    {notifications.slice(0, 20).map((n) => (
                      <div key={n.id} className={`p-3 hover:bg-gray-50 border-b last:border-b-0 ${!n.read_at ? 'bg-blue-50/50' : ''}`}>
                        <div className="text-sm font-semibold text-gray-900">{n.title}</div>
                        <div className="text-xs text-gray-600 mt-0.5">{n.body}</div>
                        <div className="text-[10px] text-gray-500 mt-1">{new Date(n.created_at).toLocaleString()}</div>
                        {(n.type === 'booking_approved' || n.type === 'chat_message') && (
                          <div className="mt-2">
                            <button
                              onClick={() => openChatByPropertyId(n.property_id)}
                              className="text-xs text-blue-600 hover:text-blue-700 font-semibold"
                            >Open Chat</button>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                  <div className="p-3 border-t">
                    <button onClick={() => { setActiveTab('bookings'); setShowNotif(false); }} className="w-full text-center text-orange-600 font-semibold hover:text-orange-700">Manage bookings</button>
                  </div>
                </div>
              )}
              <button onClick={() => setProfileOpen(!profileOpen)} className="bg-purple-100 text-purple-700 p-2 rounded-lg hover:bg-purple-200 transition-colors duration-200 flex items-center justify-center">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              </button>
              {profileOpen && (
                <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-100 py-2 z-50">
                  <button 
                    onClick={async () => {
                      setProfileOpen(false);
                      // Load profile data for viewing
                      try {
                        const email = ownerEmail || user?.email;
                        if (!email) {
                          alert('Email not found');
                          return;
                        }

                        // Try to load from landlord_profiles
                        const { data: landlordProfile } = await supabase
                          .from('landlord_profiles')
                          .select('*')
                          .eq('email', email)
                          .single();

                        // Try to load from app_users
                        const { data: appUser } = await supabase
                          .from('app_users')
                          .select('*')
                          .eq('email', email)
                          .single();

                        const profile = landlordProfile || appUser;
                        setViewProfileData({
                          full_name: profile?.full_name || user?.user_metadata?.full_name || 'N/A',
                          email: email,
                          phone: profile?.phone || 'N/A',
                          address: profile?.address || 'N/A',
                          barangay: profile?.barangay || 'N/A',
                          city: profile?.city || 'N/A',
                          profile_image_url: profile?.profile_image_url || null
                        });
                        setShowViewProfile(true);
                      } catch (error) {
                        console.error('Failed to load profile:', error);
                        const email = ownerEmail || user?.email || '';
                        setViewProfileData({
                          full_name: user?.user_metadata?.full_name || 'N/A',
                          email: email,
                          phone: 'N/A',
                          address: 'N/A',
                          barangay: 'N/A',
                          city: 'N/A',
                          profile_image_url: null
                        });
                        setShowViewProfile(true);
                      }
                    }}
                    className="w-full text-left px-4 py-3 hover:bg-gray-50 flex items-center space-x-3"
                  >
                    <svg className="w-5 h-5 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                    <span className="text-gray-700 font-medium">View Profile</span>
                  </button>

                  <button
                    onClick={async () => {
                      setProfileOpen(false);
                      // Load profile data for editing
                      try {
                        const email = ownerEmail || user?.email;
                        if (!email) {
                          alert('Email not found');
                          return;
                        }

                        // Try to load from landlord_profiles
                        const { data: landlordProfile } = await supabase
                          .from('landlord_profiles')
                          .select('*')
                          .eq('email', email)
                          .single();

                        // Try to load from app_users
                        const { data: appUser } = await supabase
                          .from('app_users')
                          .select('*')
                          .eq('email', email)
                          .single();

                        const profile = landlordProfile || appUser;
                        setProfileData({
                          full_name: profile?.full_name || user?.user_metadata?.full_name || '',
                          email: email,
                          phone: profile?.phone || '',
                          address: profile?.address || '',
                          barangay: profile?.barangay || '',
                          city: profile?.city || '',
                          profile_image_url: profile?.profile_image_url || ''
                        });
                        setProfileImagePreview(profile?.profile_image_url || null);
                        setShowEditProfile(true);
                      } catch (error) {
                        console.error('Failed to load profile:', error);
                        setProfileData({
                          full_name: user?.user_metadata?.full_name || '',
                          email: ownerEmail || user?.email || '',
                          phone: '',
                          address: '',
                          barangay: '',
                          city: '',
                          profile_image_url: ''
                        });
                        setShowEditProfile(true);
                      }
                    }}
                    className="w-full text-left px-4 py-3 hover:bg-gray-50 flex items-center space-x-3"
                  >
                    <svg className="w-5 h-5 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                    </svg>
                    <span className="text-gray-700 font-medium">Edit Profile</span>
                  </button>


                  <button onClick={handleLogout} className="w-full text-left px-4 py-3 hover:bg-gray-50 flex items-center space-x-3 text-red-600">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                    </svg>
                    <span className="font-medium">Logout</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="bg-white rounded-xl sm:rounded-2xl shadow-lg border border-gray-100 p-1 sm:p-2 mb-3 sm:mb-4 md:mb-6">
          <div className="flex flex-wrap gap-1">
            <button
              onClick={() => setActiveTab('properties')}
              className={`flex-1 min-w-[120px] px-2 sm:px-3 md:px-6 py-2 sm:py-3 md:py-4 font-semibold rounded-lg sm:rounded-xl transition-all duration-200 text-xs sm:text-sm md:text-base ${
                activeTab === 'properties'
                  ? 'bg-orange-600 text-white shadow-lg'
                  : 'text-gray-600 hover:text-gray-800 hover:bg-gray-50'
              }`}
            >
              <span className="flex items-center justify-center space-x-1 sm:space-x-2">
                <svg className="w-3 h-3 sm:w-4 sm:h-4 md:w-5 md:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                <span className="hidden sm:inline">Properties</span>
                <span className="sm:hidden">Props</span>
                <span className="hidden md:inline">({properties.length})</span>
              </span>
            </button>
            <button
              onClick={() => setActiveTab('bookings')}
              className={`flex-1 min-w-[120px] px-2 sm:px-3 md:px-6 py-2 sm:py-3 md:py-4 font-semibold rounded-lg sm:rounded-xl transition-all duration-200 text-xs sm:text-sm md:text-base ${
                activeTab === 'bookings'
                  ? 'bg-orange-600 text-white shadow-lg'
                  : 'text-gray-600 hover:text-gray-800 hover:bg-gray-50'
              }`}
            >
              <span className="flex items-center justify-center space-x-1 sm:space-x-2">
                <svg className="w-3 h-3 sm:w-4 sm:h-4 md:w-5 md:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                <span className="hidden sm:inline">Bookings</span>
                <span className="sm:hidden">Books</span>
                <span className="hidden md:inline">({bookings.filter(b => b.status === 'pending').length})</span>
              </span>
            </button>
            <button
              onClick={() => setActiveTab('analytics')}
              className={`flex-1 min-w-[120px] px-2 sm:px-3 md:px-6 py-2 sm:py-3 md:py-4 font-semibold rounded-lg sm:rounded-xl transition-all duration-200 text-xs sm:text-sm md:text-base ${
                activeTab === 'analytics'
                  ? 'bg-orange-600 text-white shadow-lg'
                  : 'text-gray-600 hover:text-gray-800 hover:bg-gray-50'
              }`}
            >
              <span className="flex items-center justify-center space-x-1 sm:space-x-2">
                <svg className="w-3 h-3 sm:w-4 sm:h-4 md:w-5 md:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
                <span className="text-sm sm:text-base">Analytics</span>
              </span>
            </button>
          </div>
        </div>

        {/* Properties Tab */}
        {activeTab === 'properties' && (
          <div>
            <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6 mb-6">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                  <h2 className="text-2xl font-bold text-gray-900 mb-2">My Properties</h2>
                  <p className="text-gray-600">Manage and monitor your property listings</p>
                </div>
                <button
                  onClick={() => setShowAddProperty(true)}
                  className="bg-gradient-to-r from-orange-600 to-orange-700 text-white px-6 py-3 rounded-xl hover:from-orange-700 hover:to-orange-800 transition-all duration-200 font-semibold shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 flex items-center space-x-2"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                  </svg>
                  <span>Add New Property</span>
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6">
              {properties.map((property) => (
                <div
                  key={property.id}
                  className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden hover:shadow-xl transition-all duration-300 cursor-pointer transform hover:-translate-y-1"
                  onClick={() => setShowPropertyDetails(property)}
                >
                  <div className="h-56 bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center relative overflow-hidden">
                    {property.images && property.images[0] ? (
                      <ImageWithFallback src={property.images[0]} alt={property.title} className="absolute inset-0 w-full h-full object-cover" data-sb-bucket="property-images" data-sb-path={property.images[0]} />
                    ) : (
                    <div className="text-center z-10">
                      <svg className="w-12 h-12 text-gray-400 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                      <span className="text-gray-500 font-medium">Property Image</span>
                    </div>
                    )}
                  </div>
                  <div className="p-6">
                    <div className="flex items-start justify-between mb-3">
                      <h3 className="font-bold text-xl text-gray-900 leading-tight">{property.title}</h3>
                      <div className="flex flex-col items-end gap-1">
                        <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                          property.status === 'active' 
                            ? 'bg-orange-100 text-orange-800' 
                            : property.status === 'pending'
                            ? 'bg-yellow-100 text-yellow-800'
                            : 'bg-gray-100 text-gray-800'
                        }`}>
                          {property.status === 'active' ? 'Active' : property.status === 'pending' ? 'Pending Verification' : 'Inactive'}
                        </span>
                        {property.isVerified && (
                          <span className="px-2 py-1 rounded-full text-xs font-semibold bg-green-100 text-green-800 flex items-center gap-1">
                            <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                            </svg>
                            Verified
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center text-gray-600 mb-3">
                      <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                      <span className="text-sm font-medium">{property.location}</span>
                    </div>
                    <div className="flex items-center justify-between mb-4">
                      <div>
                        <span className="text-2xl font-bold text-orange-600">₱{property.price.toLocaleString()}</span>
                        <span className="text-gray-600 font-medium">/month</span>
                      </div>
                      <div className="text-right">
                        <p className="text-sm text-gray-500">Booking Requests</p>
                        <p className="font-bold text-gray-900">{bookings.filter(b => b.propertyId === property.id).length}</p>
                      </div>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {property.amenities.slice(0, 2).map((amenity, index) => (
                        <span
                          key={index}
                          className="bg-gray-100 text-gray-700 text-xs font-medium px-3 py-1 rounded-full"
                        >
                          {amenity}
                        </span>
                      ))}
                      {property.amenities.length > 2 && (
                        <span className="bg-gray-100 text-gray-700 text-xs font-medium px-3 py-1 rounded-full">
                          +{property.amenities.length - 2} more
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
        </div>
      )}

        {/* Bookings Tab */}
        {activeTab === 'bookings' && (
          <div>
            <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6 mb-6">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-2">
                <div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Booking Requests</h2>
              <p className="text-gray-600">Review and manage incoming booking requests</p>
                </div>
                {bookings.length > 0 && (
                  <div className="flex gap-3">
                    <button
                      onClick={exportBookingsToExcel}
                      className="bg-gradient-to-r from-orange-600 to-orange-700 text-white px-4 py-2 rounded-xl hover:from-orange-700 hover:to-orange-800 transition-all font-semibold shadow-lg hover:shadow-xl flex items-center gap-2"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                      Export Excel
                    </button>
                    <button
                      onClick={exportBookingsToPDF}
                      className="bg-gradient-to-r from-red-600 to-red-700 text-white px-4 py-2 rounded-xl hover:from-red-700 hover:to-red-800 transition-all font-semibold shadow-lg hover:shadow-xl flex items-center gap-2"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                      </svg>
                      Export PDF
                    </button>
                  </div>
                )}
              </div>
            </div>
            <div className="space-y-6">
              {bookings.map((booking) => (
                <div key={booking.id} className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6 hover:shadow-xl transition-shadow duration-300">
                  <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center mb-6 gap-4">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3 mb-2">
                        <button
                          onClick={async () => {
                            try {
                              const tenantEmail = booking.clientEmail || booking.tenant_email;
                              
                              // Fetch tenant information from multiple sources
                              const [userProfileResult, appUserResult, bookingDataResult] = await Promise.all([
                                // Try user_profiles table
                                supabase
                                  .from('user_profiles')
                                  .select('phone, address, barangay, city, profile_image_url, id_document_url')
                                  .eq('user_email', tenantEmail)
                                  .single(),
                                // Try app_users table
                                supabase
                                  .from('app_users')
                                  .select('phone, address, barangay, city, profile_image_url, id_document_url')
                                  .eq('email', tenantEmail)
                                  .single(),
                                // Get full booking data
                                supabase
                                  .from('bookings')
                                  .select('*')
                                  .eq('id', booking.id)
                                  .single()
                              ]);

                              // Extract data (ignore errors if tables don't exist or no data)
                              const userProfile = userProfileResult.data;
                              const appUser = appUserResult.data;
                              const bookingData = bookingDataResult.data || booking;

                              // Get tenant data from booking or user profiles
                              const tenantInfo = {
                                name: booking.clientName || booking.full_name || bookingData?.full_name || 'N/A',
                                email: tenantEmail,
                                phone: userProfile?.phone || appUser?.phone || bookingData?.phone || booking.phone || 'N/A',
                                address: userProfile?.address || appUser?.address || bookingData?.address || booking.address || 'N/A',
                                barangay: userProfile?.barangay || appUser?.barangay || bookingData?.barangay || booking.barangay || 'N/A',
                                city: userProfile?.city || appUser?.city || bookingData?.municipality_city || booking.municipality_city || 'N/A',
                                profileImage: userProfile?.profile_image_url || appUser?.profile_image_url || bookingData?.profile_image_url || null,
                                idDocument: userProfile?.id_document_url || appUser?.id_document_url || bookingData?.id_document_url || booking.id_document_url || null,
                                bookingId: booking.id,
                                userId: tenantEmail,
                                gender: bookingData?.gender || booking.gender || 'N/A',
                                age: bookingData?.age || booking.age || 'N/A',
                                occupation: bookingData?.occupation_status || booking.occupation_status || 'N/A',
                                citizenship: bookingData?.citizenship || booking.citizenship || 'N/A'
                              };

                              setSelectedTenant(tenantInfo);
                              setShowTenantModal(true);
                            } catch (error) {
                              console.error('Failed to load tenant info:', error);
                              // Still show modal with available booking data
                              const tenantInfo = {
                                name: booking.clientName || booking.full_name || 'N/A',
                                email: booking.clientEmail || booking.tenant_email || 'N/A',
                                phone: booking.phone || 'N/A',
                                address: booking.address || 'N/A',
                                barangay: booking.barangay || 'N/A',
                                city: booking.municipality_city || 'N/A',
                                profileImage: null,
                                idDocument: booking.id_document_url || null,
                                bookingId: booking.id,
                                userId: booking.clientEmail || booking.tenant_email || 'N/A',
                                gender: booking.gender || 'N/A',
                                age: booking.age || 'N/A',
                                occupation: booking.occupation_status || 'N/A',
                                citizenship: booking.citizenship || 'N/A'
                              };
                              setSelectedTenant(tenantInfo);
                              setShowTenantModal(true);
                            }
                          }}
                          className="w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center hover:bg-orange-200 transition-colors cursor-pointer"
                        >
                          <svg className="w-6 h-6 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                          </svg>
                        </button>
                        <div>
                          <h3 className="font-bold text-xl text-gray-900">{booking.clientName}</h3>
                          <p className="text-gray-600 font-medium">{booking.clientEmail}</p>
                        </div>
                      </div>
                      <p className="text-sm text-gray-500 flex items-center">
                        <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                        {booking.createdAt}
                      </p>
                    </div>
                    <span className={`px-4 py-2 rounded-full text-sm font-semibold ${
                      booking.status === 'pending' 
                        ? 'bg-yellow-100 text-yellow-800'
                        : booking.status === 'approved'
                        ? 'bg-orange-100 text-orange-800'
                        : 'bg-red-100 text-red-800'
                    }`}>
                      {booking.status.toUpperCase()}
                    </span>
                  </div>
                  
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
                    <div>
                      <h4 className="font-bold text-gray-900 mb-2 flex items-center">
                        <svg className="w-4 h-4 mr-2 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                        </svg>
                        Property
                      </h4>
                      <p className="text-gray-700 font-medium">
                        {properties.find(p => p.id === booking.propertyId)?.title}
                      </p>
                    </div>


                  </div>

                  {booking.status === 'pending' && (
                    <div className="flex gap-4 pt-4 border-t border-gray-200">
                      <button
                        onClick={() => handleBookingAction(booking.id, 'approve')}
                        className="flex-1 bg-gradient-to-r from-green-600 to-green-700 text-white py-3 rounded-xl hover:from-green-700 hover:to-green-800 transition-all duration-200 font-semibold shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 flex items-center justify-center space-x-2"
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                        <span>Approve</span>
                      </button>
                      <button
                        onClick={() => handleBookingAction(booking.id, 'reject')}
                        className="flex-1 bg-gradient-to-r from-red-600 to-red-700 text-white py-3 rounded-xl hover:from-red-700 hover:to-red-800 transition-all duration-200 font-semibold shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 flex items-center justify-center space-x-2"
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                        <span>Reject</span>
                      </button>
                    </div>
                  )}
                  {booking.status === 'approved' && (
                    <div className="flex gap-4 pt-4 border-t border-gray-200">
                      <button
                        onClick={() => openChatForBooking(booking)}
                        className="flex-1 glass-button py-3 rounded-xl transition-all duration-200 font-semibold"
                      >
                        Open Chat
                      </button>
                      <button
                        onClick={async () => {
                          try {
                            // Find the bed associated with this booking
                            const { data: bedData } = await supabase
                              .from('beds')
                              .select('id, status')
                              .eq('booking_id', booking.id)
                              .single();
                            
                            if (bedData) {
                              const { error } = await supabase
                                .from('beds')
                                .update({ status: 'available', booking_id: null })
                                .eq('id', bedData.id);
                              
                              if (error) throw error;
                              alert('Bed freed successfully!');
                              // Reload bookings
                              window.location.reload();
                            } else {
                              alert('No bed associated with this booking.');
                            }
                          } catch (error) {
                            console.error('Failed to free bed:', error);
                            alert('Failed to free bed');
                          }
                        }}
                        className="flex-1 bg-gradient-to-r from-blue-600 to-blue-700 text-white py-3 rounded-xl hover:from-blue-700 hover:to-blue-800 transition-all duration-200 font-semibold shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 flex items-center justify-center space-x-2"
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                        </svg>
                        <span>Free Bed</span>
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Analytics Tab */}
        {activeTab === 'analytics' && (
          <div>
            <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6 mb-6">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-4">
                <div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Analytics Dashboard</h2>
              <p className="text-gray-600">Track your property performance and business metrics</p>
                </div>
                <div className="flex flex-col sm:flex-row gap-3">
                  <select
                    value={selectedMonth}
                    onChange={(e) => setSelectedMonth(e.target.value)}
                    className="px-4 py-2 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500 text-sm"
                  >
                    <option value="all">All Months</option>
                    {Array.from({ length: 12 }, (_, i) => {
                      const date = new Date();
                      date.setMonth(date.getMonth() - i);
                      const monthValue = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
                      const monthLabel = date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
                      return <option key={monthValue} value={monthValue}>{monthLabel}</option>;
                    })}
                  </select>
                </div>
              </div>
              <div className="flex flex-col sm:flex-row justify-end items-start sm:items-center gap-3 mb-2">
                <div className="flex gap-3">
                  <button
                    onClick={exportAnalyticsToExcel}
                    className="bg-gradient-to-r from-orange-600 to-orange-700 text-white px-4 py-2 rounded-xl hover:from-orange-700 hover:to-orange-800 transition-all font-semibold shadow-lg hover:shadow-xl flex items-center gap-2"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    Export Excel
                  </button>
                  <button
                    onClick={exportAnalyticsToPDF}
                    className="bg-gradient-to-r from-red-600 to-red-700 text-white px-4 py-2 rounded-xl hover:from-red-700 hover:to-red-800 transition-all font-semibold shadow-lg hover:shadow-xl flex items-center gap-2"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                    </svg>
                    Export PDF
                  </button>
                  <button
                    onClick={exportTenantDataToExcel}
                    className="bg-gradient-to-r from-green-600 to-green-700 text-white px-4 py-2 rounded-xl hover:from-green-700 hover:to-green-800 transition-all font-semibold shadow-lg hover:shadow-xl flex items-center gap-2"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                    Export Tenant Data
                  </button>
                  <button
                    onClick={exportAnalyticsToCSV}
                    className="bg-gradient-to-r from-blue-600 to-blue-700 text-white px-4 py-2 rounded-xl hover:from-blue-700 hover:to-blue-800 transition-all font-semibold shadow-lg hover:shadow-xl flex items-center gap-2"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 17v-2a2 2 0 012-2h2m4 0h6M7 9V7a2 2 0 012-2h2m4 0h2a2 2 0 012 2v2m0 4v2a2 2 0 01-2 2h-2M7 13h4" />
                    </svg>
                    Export CSV
                  </button>
                </div>
              </div>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4 md:gap-6 mb-4 sm:mb-6">
              <div className="bg-gradient-to-br from-orange-50 to-orange-100 rounded-2xl p-6 text-center border border-orange-200">
                <div className="w-12 h-12 bg-orange-600 rounded-full flex items-center justify-center mx-auto mb-3">
                  <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0118.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                  </svg>
                </div>
                <div className="text-3xl font-bold text-orange-600 mb-1">{analytics.totalProperties}</div>
                <div className="text-sm font-semibold text-orange-800">Properties</div>
              </div>
              <div className="bg-gradient-to-br from-orange-50 to-orange-100 rounded-2xl p-6 text-center border border-orange-200">
                <div className="w-12 h-12 bg-orange-600 rounded-full flex items-center justify-center mx-auto mb-3">
                  <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                </div>
                <div className="text-3xl font-bold text-orange-600 mb-1">{analytics.totalBookings}</div>
                <div className="text-sm font-semibold text-orange-800">Total Bookings</div>
              </div>
              <div className="bg-gradient-to-br from-yellow-50 to-yellow-100 rounded-2xl p-6 text-center border border-yellow-200">
                <div className="w-12 h-12 bg-yellow-600 rounded-full flex items-center justify-center mx-auto mb-3">
                  <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
                  </svg>
                </div>
                <div className="text-3xl font-bold text-yellow-600 mb-1">{analytics.averageRating.toFixed(1)}</div>
                <div className="text-sm font-semibold text-yellow-800">Avg Rating</div>
              </div>

            </div>

            {/* Sales Metrics Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4 md:gap-6 mb-4 sm:mb-6">
              <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-2xl p-6 text-center border border-blue-200">
                <div className="w-12 h-12 bg-blue-600 rounded-full flex items-center justify-center mx-auto mb-3">
                  <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                  </svg>
                </div>
                <div className="text-3xl font-bold text-blue-600 mb-1">₱{analytics.totalRevenue.toLocaleString()}</div>
                <div className="text-sm font-semibold text-blue-800">Sales</div>
              </div>
              <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-2xl p-6 text-center border border-purple-200">
                <div className="w-12 h-12 bg-purple-600 rounded-full flex items-center justify-center mx-auto mb-3">
                  <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                  </svg>
                </div>
                <div className="text-3xl font-bold text-purple-600 mb-1">{analytics.revenueByStatus.find(s => s.status === 'approved')?.count || 0}</div>
                <div className="text-sm font-semibold text-purple-800">Approved Bookings</div>
              </div>
              <div className="bg-gradient-to-br from-indigo-50 to-indigo-100 rounded-2xl p-6 text-center border border-indigo-200">
                <div className="w-12 h-12 bg-indigo-600 rounded-full flex items-center justify-center mx-auto mb-3">
                  <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                  </svg>
                </div>
                <div className="text-3xl font-bold text-indigo-600 mb-1">{analytics.revenueByStatus.find(s => s.status === 'pending')?.count || 0}</div>
                <div className="text-sm font-semibold text-indigo-800">Pending Bookings</div>
              </div>
              <div className="bg-gradient-to-br from-pink-50 to-pink-100 rounded-2xl p-6 text-center border border-pink-200">
                <div className="w-12 h-12 bg-pink-600 rounded-full flex items-center justify-center mx-auto mb-3">
                  <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </div>
                <div className="text-3xl font-bold text-pink-600 mb-1">{analytics.revenueByStatus.find(s => s.status === 'rejected')?.count || 0}</div>
                <div className="text-sm font-semibold text-pink-800">Rejected Bookings</div>
              </div>
            </div>

            {/* Charts */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
              <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6">
                <h3 className="text-xl font-bold text-gray-900 mb-6">Booking Trends (30 days)</h3>
                <div className="h-64">
                  <Bar
                    data={{
                      labels: analytics.bookingTrends.map(t => t.date.slice(5)),
                      datasets: [{
                        label: 'Bookings',
                        data: analytics.bookingTrends.map(t => t.bookings),
                        backgroundColor: 'rgba(59,130,246,0.8)',
                        borderColor: 'rgba(59,130,246,1)',
                        borderWidth: 1,
                      }]
                    }}
                    options={{ 
                      plugins: { legend: { display: false } }, 
                      responsive: true, 
                      maintainAspectRatio: false,
                      scales: {
                        y: {
                          beginAtZero: true,
                          ticks: {
                            stepSize: 1
                          }
                        }
                      }
                    }}
                  />
                </div>
              </div>

              <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6">
                <h3 className="text-xl font-bold text-gray-900 mb-6">Revenue Trends (30 days)</h3>
                <div className="h-64">
                  <Line
                    data={{
                      labels: analytics.revenueTrends.map(t => t.date.slice(5)),
                      datasets: [{
                        label: 'Revenue',
                        data: analytics.revenueTrends.map(t => t.revenue),
                        backgroundColor: 'rgba(34,197,94,0.2)',
                        borderColor: 'rgba(34,197,94,1)',
                        borderWidth: 2,
                        fill: true,
                        tension: 0.4,
                      }]
                    }}
                    options={{ 
                      plugins: { legend: { display: false } }, 
                      responsive: true, 
                      maintainAspectRatio: false,
                      scales: {
                        y: {
                          beginAtZero: true,
                          ticks: {
                            callback: function(value: any) {
                              return '₱' + value.toLocaleString();
                            }
                          }
                        }
                      }
                    }}
                  />
                </div>
              </div>

              <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6">
                <h3 className="text-xl font-bold text-gray-900 mb-6">Monthly Revenue (Last 6 Months)</h3>
                <div className="h-64">
                  <Bar
                    data={{
                      labels: analytics.monthlyRevenue.map(m => {
                        const [year, month] = m.month.split('-');
                        return new Date(parseInt(year), parseInt(month) - 1).toLocaleDateString('en-US', { month: 'short', year: '2-digit' });
                      }),
                      datasets: [{
                        label: 'Revenue',
                        data: analytics.monthlyRevenue.map(m => m.revenue),
                        backgroundColor: 'rgba(139,92,246,0.8)',
                        borderColor: 'rgba(139,92,246,1)',
                        borderWidth: 1,
                      }]
                    }}
                    options={{ 
                      plugins: { legend: { display: false } }, 
                      responsive: true, 
                      maintainAspectRatio: false,
                      scales: {
                        y: {
                          beginAtZero: true,
                          ticks: {
                            callback: function(value: any) {
                              return '₱' + value.toLocaleString();
                            }
                          }
                        }
                      }
                    }}
                  />
                </div>
              </div>

              <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6">
                <h3 className="text-xl font-bold text-gray-900 mb-6">Top Performing Properties</h3>
                <div className="h-64">
                  <Bar
                    data={{
                      labels: analytics.topPerformingProperties.map(p => 
                        p.propertyTitle.length > 15 ? p.propertyTitle.substring(0, 15) + '...' : p.propertyTitle
                      ),
                      datasets: [{
                        label: 'Revenue',
                        data: analytics.topPerformingProperties.map(p => p.revenue),
                        backgroundColor: 'rgba(234,179,8,0.8)',
                        borderColor: 'rgba(234,179,8,1)',
                        borderWidth: 1,
                      }]
                    }}
                    options={{ 
                      plugins: { legend: { display: false } }, 
                      responsive: true, 
                      maintainAspectRatio: false,
                      scales: {
                        y: {
                          beginAtZero: true,
                          ticks: {
                            callback: function(value: any) {
                              return '₱' + value.toLocaleString();
                            }
                          }
                        }
                      }
                    }}
                  />
                </div>
              </div>
            </div>

            {/* Property Performance */}
            <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6">
              <h3 className="text-xl font-bold text-gray-900 mb-6">Property Performance</h3>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Property</th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Bookings</th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Rating</th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Permit</th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Reviews & Comments</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {analytics.propertyPerformance.map((property) => {
                      const propertyReviews = reviews.filter(r => r.propertyId === property.propertyId);
                      return (
                        <tr key={property.propertyId} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center gap-3">
                              {(() => {
                                const fullProperty = properties.find(p => p.id === property.propertyId);
                                return fullProperty?.images?.[0] ? (
                                  <img 
                                    src={fullProperty.images[0]} 
                                    alt={property.propertyTitle}
                                    className="w-10 h-10 object-cover rounded-lg flex-shrink-0"
                                  />
                                ) : (
                                  <div className="w-10 h-10 bg-gray-200 rounded-lg flex items-center justify-center">
                                    <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                                    </svg>
                                  </div>
                                );
                              })()}
                              <span className="font-semibold text-gray-900">{property.propertyTitle}</span>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-gray-600">{property.bookings}</td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            {(() => {
                              const ratingValue = property.rating || 0;
                              if (ratingValue > 0) {
                                return (
                                  <div className="flex items-center">
                                    {[...Array(5)].map((_, i) => (
                                      <svg
                                        key={i}
                                        className={`w-4 h-4 ${i < Math.floor(ratingValue) ? 'text-yellow-400' : 'text-gray-300'}`}
                                        fill="currentColor"
                                        viewBox="0 0 20 20"
                                      >
                                        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                                      </svg>
                                    ))}
                                    <span className="ml-2 text-sm text-gray-600 font-medium">{ratingValue.toFixed(1)}</span>
                                  </div>
                                );
                              } else {
                                return (
                                  <div className="flex items-center text-gray-400">
                                    <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
                                    </svg>
                                    <span className="text-sm">No rating yet</span>
                                  </div>
                                );
                              }
                            })()}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            {(() => {
                              const fullProperty = properties.find(p => p.id === property.propertyId);
                              return fullProperty?.business_permit_url ? (
                                <button
                                  onClick={() => window.open(fullProperty.business_permit_url, '_blank')}
                                  className="text-blue-600 hover:text-blue-800 text-xs font-semibold underline"
                                >
                                  View Permit
                                </button>
                              ) : (
                                <span className="text-gray-400 text-xs">No Permit</span>
                              );
                            })()}
                          </td>
                          <td className="px-6 py-4">
                            {propertyReviews.length > 0 ? (
                              <div className="max-w-md">
                                <div className="text-sm text-gray-600 mb-2">{propertyReviews.length} review{propertyReviews.length !== 1 ? 's' : ''}</div>
                                <div className="space-y-2 max-h-32 overflow-y-auto">
                                  {propertyReviews.map((review) => (
                                    <div key={review.id} className="bg-gray-50 rounded-lg p-3 border border-gray-200">
                                      <div className="flex items-center justify-between mb-1">
                                        <span className="text-sm font-semibold text-gray-900">{review.clientName}</span>
                                        <div className="flex items-center">
                                          {[...Array(5)].map((_, i) => (
                                            <svg
                                              key={i}
                                              className={`w-3 h-3 ${i < review.rating ? 'text-yellow-400' : 'text-gray-300'}`}
                                              fill="currentColor"
                                              viewBox="0 0 20 20"
                                            >
                                              <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                                            </svg>
                                          ))}
                                        </div>
                                      </div>
                                      <p className="text-xs text-gray-700 mt-1">{review.reviewText}</p>
                                      <p className="text-[10px] text-gray-500 mt-1">{new Date(review.createdAt).toLocaleDateString()}</p>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            ) : (
                              <span className="text-sm text-gray-400">No reviews yet</span>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}


      {/* Add Property Modal */}
      {showAddProperty && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-3 sm:p-4 z-50">
          <div className="bg-white rounded-xl sm:rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-4 sm:p-6">
              <div className="flex justify-between items-start mb-4">
                <h2 className="text-2xl font-bold">Add New Property</h2>
                <button
                  onClick={() => {
                    setShowAddProperty(false);
                    // Reset form when closing
                    setNewProperty({
                      title: '',
                      description: '',
                      price: '',
                      location: 'Catbalogan City, Samar',
                      amenities: [],
                      coordinates: { lat: 11.7778, lng: 124.8847 },
                      images: []
                    });
                  }}
                  className="text-gray-500 hover:text-gray-700"
                >
                  ✕
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Property Title
                  </label>
                  <input
                    type="text"
                    value={newProperty.title}
                    onChange={(e) => setNewProperty(prev => ({ ...prev, title: e.target.value }))}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500"
                    placeholder="Enter property title"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Description
                  </label>
                  <textarea
                    value={newProperty.description}
                    onChange={(e) => setNewProperty(prev => ({ ...prev, description: e.target.value }))}
                    className="w-full h-24 px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500"
                    placeholder="Describe your property"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Monthly Rent (₱)
                    </label>
                    <input
                      type="number"
                      value={newProperty.price}
                      onChange={(e) => setNewProperty(prev => ({ ...prev, price: e.target.value }))}
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500"
                      placeholder="15000"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Location
                    </label>
                    <input
                      type="text"
                      value={newProperty.location}
                      onChange={(e) => setNewProperty(prev => ({ ...prev, location: e.target.value }))}
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500"
                      placeholder="Catbalogan City, Samar"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Amenities
                  </label>
                  
                  {/* Predefined Amenities */}
                  <div className="mb-4">
                    <p className="text-sm text-gray-600 mb-2">Select from common amenities:</p>
                    <div className="grid grid-cols-2 gap-2">
                      {['Gas', 'Electricity', 'Water', 'Parking Area', 'Wi-Fi', 'Laundry Area'].map((amenity) => (
                        <label key={amenity} className="flex items-center space-x-2">
                          <input
                            type="checkbox"
                            checked={newProperty.amenities.includes(amenity)}
                            onChange={() => toggleAmenity(amenity)}
                            className="text-blue-600 focus:ring-orange-500"
                          />
                          <span className="text-sm text-gray-700">{amenity}</span>
                        </label>
                      ))}
                    </div>
                  </div>

                  {/* Custom Amenities */}
                  <div className="mb-4">
                    <p className="text-sm text-gray-600 mb-2">Add custom amenities:</p>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={customAmenity}
                        onChange={(e) => setCustomAmenity(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            e.preventDefault();
                            addCustomAmenity();
                          }
                        }}
                        className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 text-sm"
                        placeholder="Enter custom amenity (e.g., Swimming Pool, Gym, Garden)"
                      />
                      <button
                        type="button"
                        onClick={addCustomAmenity}
                        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
                      >
                        Add
                      </button>
                    </div>
                  </div>

                  {/* Selected Amenities Display */}
                  {newProperty.amenities.length > 0 && (
                    <div>
                      <p className="text-sm text-gray-600 mb-2">Selected amenities:</p>
                      <div className="flex flex-wrap gap-2">
                        {newProperty.amenities.map((amenity, index) => (
                          <span
                            key={index}
                            className="inline-flex items-center gap-1 px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm"
                          >
                            {amenity}
                            <button
                              type="button"
                              onClick={() => removeAmenity(amenity)}
                              className="ml-1 text-blue-600 hover:text-blue-800"
                            >
                              ×
                            </button>
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Property Images
                  </label>
                    <ImageUpload
                    onImagesChange={(images) => setNewProperty(prev => ({ ...prev, images }))}
                      maxImages={5}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Location on Map
                  </label>
                  <div className="relative">
                  <GoogleMap
                    center={newProperty.coordinates || { lat: 11.7778, lng: 124.8847 }}
                    zoom={14}
                    satellite={true}
                    preferLeaflet={true}
                    markers={[{
                      position: newProperty.coordinates || { lat: 11.7778, lng: 124.8847 },
                      title: newProperty.title || 'New Property'
                    }]}
                    onMapClick={(lat, lng) => {
                      console.log('Map clicked at:', lat, lng);
                      setNewProperty(prev => ({ ...prev, coordinates: { lat, lng } }));
                    }}
                    className="h-64 w-full rounded-lg"
                  />
                    <div className="absolute top-2 left-2 bg-blue-600 text-white px-3 py-1.5 rounded-lg shadow-lg text-xs font-semibold z-10">
                      📍 Click on map to set location
                    </div>
                  </div>
                  <p className="text-sm text-gray-500 mt-2">
                    Click anywhere on the map above to set the exact location of your property
                  </p>

                  <div className="mt-3 grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-1">Latitude</label>
                      <input
                        type="number"
                        step="any"
                        value={newProperty.coordinates.lat}
                        onChange={(e) => {
                          const lat = parseFloat(e.target.value);
                          if (!Number.isNaN(lat)) {
                            setNewProperty(prev => ({ ...prev, coordinates: { lat, lng: prev.coordinates.lng } }));
                          }
                        }}
                        className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500"
                        placeholder="Latitude"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-1">Longitude</label>
                      <input
                        type="number"
                        step="any"
                        value={newProperty.coordinates.lng}
                        onChange={(e) => {
                          const lng = parseFloat(e.target.value);
                          if (!Number.isNaN(lng)) {
                            setNewProperty(prev => ({ ...prev, coordinates: { lat: prev.coordinates.lat, lng } }));
                          }
                        }}
                        className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500"
                        placeholder="Longitude"
                      />
                    </div>
                  </div>
                  <p className="text-xs text-gray-500 mt-2">Selected: {newProperty.coordinates.lat.toFixed(6)}, {newProperty.coordinates.lng.toFixed(6)}</p>
                </div>

                <div className="flex gap-3 pt-4">
                  <button
                    onClick={() => setShowAddProperty(false)}
                    className="flex-1 bg-gray-200 text-gray-800 py-3 rounded-xl hover:bg-gray-300 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleAddProperty}
                    disabled={isAddingProperty}
                    className={`flex-1 py-3 rounded-xl transition-colors flex items-center justify-center ${
                      isAddingProperty 
                        ? 'bg-gray-400 text-gray-200 cursor-not-allowed' 
                        : 'bg-blue-600 text-white hover:bg-blue-700'
                    }`}
                  >
                    {isAddingProperty ? (
                      <>
                        <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        Adding Property...
                      </>
                    ) : (
                      'Add Property'
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Property Details Modal */}
      {showPropertyDetails && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-3 sm:p-4 z-50">
          <div className="bg-white rounded-xl sm:rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-4 sm:p-6">
              <div className="flex justify-between items-start mb-4">
                <h2 className="text-2xl font-bold">{showPropertyDetails.title}</h2>
                <button
                  onClick={async () => {
                    setShowPropertyDetails(null);
                    setRooms([]);
                    setBeds([]);
                    setPropertyPermit(null);
                  }}
                  className="text-gray-500 hover:text-gray-700"
                >
                  ✕
                </button>
              </div>

              <div className="space-y-4">
                {/* Image Carousel */}
                <div className="h-64 sm:h-80 md:h-96">
                  {showPropertyDetails.images && showPropertyDetails.images.length > 0 ? (
                    <ImageCarousel 
                      images={showPropertyDetails.images} 
                      alt={showPropertyDetails.title}
                      bucket="property-images"
                      showThumbnails={true}
                    />
                  ) : (
                    <div className="h-full bg-gray-200 rounded-lg flex items-center justify-center">
                      <span className="text-gray-500">No images available</span>
                    </div>
                  )}
                </div>

                <div>
                  <h3 className="font-semibold text-lg mb-2">Description</h3>
                  <p className="text-gray-600">{showPropertyDetails.description}</p>
                </div>

                <div>
                  <h3 className="font-semibold text-lg mb-2">Location</h3>
                  <p className="text-gray-600">{showPropertyDetails.location}</p>
                  <div className="mt-2">
                    <GoogleMap
                      center={showPropertyDetails.coordinates || { lat: 11.7778, lng: 124.8847 }}
                      zoom={15}
                      satellite={true}
                      preferLeaflet={true}
                      markers={[{
                        position: showPropertyDetails.coordinates || { lat: 11.7778, lng: 124.8847 },
                        title: showPropertyDetails.title,
                        info: showPropertyDetails.description
                      }]}
                      className="h-64 w-full rounded-lg"
                    />
                  </div>
                </div>

                <div>
                  <h3 className="font-semibold text-lg mb-2">Amenities</h3>
                  <div className="flex flex-wrap gap-2">
                    {showPropertyDetails.amenities.map((amenity, index) => (
                      <span
                        key={index}
                        className="bg-orange-100 text-orange-800 px-3 py-1 rounded-full text-sm"
                      >
                        {amenity}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Rooms Management */}
                <div className="border-t pt-4">
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="font-semibold text-lg">Rooms</h3>
                    <button
                      onClick={async () => {
                        // Load existing rooms
                        try {
                          const { data: roomsData } = await supabase
                            .from('rooms')
                            .select('*')
                            .eq('boarding_house_id', showPropertyDetails.id)
                            .order('room_number', { ascending: true });
                          setRooms(roomsData || []);
                        } catch (error) {
                          console.error('Failed to load rooms:', error);
                          setRooms([]);
                        }
                        setShowAddRoom(true);
                      }}
                      className="glass-button px-4 py-2 rounded-lg text-sm font-semibold"
                    >
                      + Add Room
                    </button>
                            </div>
                  <div className="space-y-2">
                    {rooms.length > 0 ? (
                      rooms.map((room: any) => (
                        <div key={room.id} className="bg-gray-50 p-3 rounded-lg flex justify-between items-center">
                            <div>
                            <p className="font-semibold">Room {room.room_number} - {room.room_name || 'Unnamed'}</p>
                            <p className="text-sm text-gray-600">Max Beds: {room.max_beds} | Price per Bed: ₱{room.price_per_bed || 0}</p>
                            <p className="text-xs text-gray-500">Status: {room.status}</p>
                          </div>
                          <button
                            onClick={async () => {
                              setSelectedRoomForBed(room.id);
                              try {
                                const { data: bedsData } = await supabase
                                  .from('beds')
                                  .select('*')
                                  .eq('room_id', room.id)
                                  .order('bed_number', { ascending: true });
                                setBeds(bedsData || []);
                              } catch (error) {
                                console.error('Failed to load beds:', error);
                                setBeds([]);
                              }
                              setShowAddBed(true);
                            }}
                            className="text-orange-600 hover:text-orange-700 text-sm font-semibold"
                          >
                            Manage Beds
                          </button>
                                      </div>
                      ))
                    ) : (
                      <p className="text-gray-500 text-sm">No rooms added yet. Click "Add Room" to get started.</p>
                          )}
                        </div>
                    </div>

                {/* Permits Section */}
                <div className="border-t pt-4">
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="font-semibold text-lg">Business Permit</h3>
                    <button
                      onClick={async () => {
                        try {
                          const { data: permitData } = await supabase
                            .from('properties')
                            .select('business_permit_url')
                            .eq('id', showPropertyDetails.id)
                            .single();
                          setPropertyPermit(permitData?.business_permit_url || null);
                        } catch (error) {
                          console.error('Failed to load permit:', error);
                        }
                        setShowPermits(true);
                      }}
                      className="glass-button px-4 py-2 rounded-lg text-sm font-semibold"
                    >
                      {propertyPermit ? 'View/Update Permit' : 'Upload Permit'}
                    </button>
                  </div>
                  {propertyPermit && (
                    <div className="bg-gray-50 p-3 rounded-lg">
                      <a href={propertyPermit} target="_blank" rel="noopener noreferrer" className="text-orange-600 hover:text-orange-700 text-sm font-semibold">
                        View Business Permit →
                      </a>
                    </div>
                  )}
                </div>

                <div className="flex justify-between items-center pt-4 border-t">
                  <div>
                    <p className="text-2xl font-bold text-orange-600">
                      ₱{showPropertyDetails.price.toLocaleString()}/month
                    </p>
                    <p className="text-sm text-gray-500">
                      Status: {showPropertyDetails.status}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <button onClick={() => setEditingProperty(showPropertyDetails)} className="glass-button px-4 py-2 rounded-lg font-semibold">
                      Edit
                    </button>
                    <button onClick={() => handleDeleteProperty(showPropertyDetails.id)} className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors font-semibold">
                      Delete
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Add Room Modal */}
      {showAddRoom && showPropertyDetails && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-md w-full p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-2xl font-bold text-gray-900">Add Room</h2>
              <button onClick={() => { setShowAddRoom(false); setNewRoom({ room_number: '', room_name: '', max_beds: '', price_per_bed: '', status: 'available' }); }} className="text-gray-500 hover:text-gray-700 text-2xl font-bold">×</button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Room Number *</label>
                <input type="text" value={newRoom.room_number} onChange={(e) => setNewRoom({ ...newRoom, room_number: e.target.value })} className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500" placeholder="e.g., 101" required />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Room Name</label>
                <input type="text" value={newRoom.room_name} onChange={(e) => setNewRoom({ ...newRoom, room_name: e.target.value })} className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500" placeholder="e.g., Master Bedroom" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Max Beds *</label>
                  <input type="number" value={newRoom.max_beds} onChange={(e) => setNewRoom({ ...newRoom, max_beds: e.target.value })} className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500" placeholder="2" min="1" required />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Price per Bed (₱) *</label>
                  <input type="number" value={newRoom.price_per_bed} onChange={(e) => setNewRoom({ ...newRoom, price_per_bed: e.target.value })} className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500" placeholder="5000" min="0" required />
                </div>
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Status</label>
                <select value={newRoom.status} onChange={(e) => setNewRoom({ ...newRoom, status: e.target.value })} className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500">
                  <option value="available">Available</option>
                  <option value="full">Full</option>
                  <option value="maintenance">Maintenance</option>
                </select>
              </div>
              <div className="flex gap-3 pt-4">
                <button onClick={() => { setShowAddRoom(false); setNewRoom({ room_number: '', room_name: '', max_beds: '', price_per_bed: '', status: 'available' }); }} className="flex-1 px-4 py-3 bg-gray-200 text-gray-800 rounded-xl hover:bg-gray-300 transition-colors font-semibold">Cancel</button>
                <button onClick={async () => {
                  if (!newRoom.room_number || !newRoom.max_beds || !newRoom.price_per_bed) {
                    alert('Please fill in all required fields');
                    return;
                  }
                  try {
                    const { error } = await supabase.from('rooms').insert([{
                      boarding_house_id: showPropertyDetails.id,
                      room_number: newRoom.room_number,
                      room_name: newRoom.room_name || null,
                      max_beds: parseInt(newRoom.max_beds),
                      price_per_bed: parseFloat(newRoom.price_per_bed),
                      status: newRoom.status,
                      current_occupancy: 0
                    }]);
                    if (error) throw error;
                    alert('Room added successfully!');
                    // Reload rooms
                    const { data: roomsData } = await supabase.from('rooms').select('*').eq('boarding_house_id', showPropertyDetails.id).order('room_number', { ascending: true });
                    setRooms(roomsData || []);
                    setShowAddRoom(false);
                    setNewRoom({ room_number: '', room_name: '', max_beds: '', price_per_bed: '', status: 'available' });
                  } catch (error: any) {
                    console.error('Failed to add room:', error);
                    alert(`Failed to add room: ${error.message || 'Unknown error'}`);
                  }
                }} className="flex-1 glass-button px-4 py-3 rounded-xl font-semibold">Add Room</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Add Bed Modal */}
      {showAddBed && selectedRoomForBed && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-2xl font-bold text-gray-900">Manage Beds</h2>
              <button onClick={() => { setShowAddBed(false); setSelectedRoomForBed(''); setNewBed({ bed_number: '', bed_type: 'single', deck_position: 'lower', status: 'available', price: '' }); }} className="text-gray-500 hover:text-gray-700 text-2xl font-bold">×</button>
            </div>
            
            {/* Existing Beds */}
            <div className="mb-6">
              <h3 className="font-semibold text-lg mb-3">Existing Beds</h3>
              {beds.length > 0 ? (
                <div className="space-y-2">
                  {beds.map((bed: any) => (
                    <div key={bed.id} className="bg-gray-50 p-3 rounded-lg flex justify-between items-center">
                      <div>
                        <p className="font-semibold">Bed {bed.bed_number} - {bed.bed_type} ({bed.deck_position})</p>
                        <p className="text-sm text-gray-600">Status: {bed.status} | Price: ₱{bed.price || 0}</p>
                      </div>
                      <button onClick={async () => {
                        if (confirm('Are you sure you want to delete this bed?')) {
                          try {
                            const { error } = await supabase.from('beds').delete().eq('id', bed.id);
                            if (error) throw error;
                            const { data: bedsData } = await supabase.from('beds').select('*').eq('room_id', selectedRoomForBed).order('bed_number', { ascending: true });
                            setBeds(bedsData || []);
                          } catch (error: any) {
                            alert(`Failed to delete bed: ${error.message}`);
                          }
                        }
                      }} className="text-red-600 hover:text-red-700 text-sm font-semibold">Delete</button>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500 text-sm">No beds added yet.</p>
              )}
            </div>

            {/* Add New Bed Form */}
            <div className="border-t pt-4">
              <h3 className="font-semibold text-lg mb-4">Add New Bed</h3>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Bed Number *</label>
                    <input type="text" value={newBed.bed_number} onChange={(e) => setNewBed({ ...newBed, bed_number: e.target.value })} className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500" placeholder="e.g., 1" required />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Bed Type *</label>
                    <select value={newBed.bed_type} onChange={(e) => setNewBed({ ...newBed, bed_type: e.target.value })} className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500">
                      <option value="single">Single</option>
                      <option value="double">Double</option>
                      <option value="bunk">Bunk</option>
                    </select>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Deck Position</label>
                    <select value={newBed.deck_position} onChange={(e) => setNewBed({ ...newBed, deck_position: e.target.value })} className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500">
                      <option value="lower">Lower</option>
                      <option value="upper">Upper</option>
                      <option value="single">Single</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Price (₱)</label>
                    <input type="number" value={newBed.price} onChange={(e) => setNewBed({ ...newBed, price: e.target.value })} className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500" placeholder="5000" min="0" />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Status</label>
                  <select value={newBed.status} onChange={(e) => setNewBed({ ...newBed, status: e.target.value })} className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500">
                    <option value="available">Available</option>
                    <option value="occupied">Occupied</option>
                    <option value="maintenance">Maintenance</option>
                  </select>
                </div>
                <div className="flex gap-3 pt-4">
                  <button onClick={() => { setShowAddBed(false); setSelectedRoomForBed(''); setNewBed({ bed_number: '', bed_type: 'single', deck_position: 'lower', status: 'available', price: '' }); }} className="flex-1 px-4 py-3 bg-gray-200 text-gray-800 rounded-xl hover:bg-gray-300 transition-colors font-semibold">Cancel</button>
                  <button onClick={async () => {
                    if (!newBed.bed_number) {
                      alert('Please fill in bed number');
                      return;
                    }
                    try {
                      const { error } = await supabase.from('beds').insert([{
                        room_id: selectedRoomForBed,
                        bed_number: newBed.bed_number,
                        bed_type: newBed.bed_type,
                        deck_position: newBed.deck_position,
                        status: newBed.status,
                        price: newBed.price ? parseFloat(newBed.price) : null
                      }]);
                      if (error) throw error;
                      alert('Bed added successfully!');
                      const { data: bedsData } = await supabase.from('beds').select('*').eq('room_id', selectedRoomForBed).order('bed_number', { ascending: true });
                      setBeds(bedsData || []);
                      setNewBed({ bed_number: '', bed_type: 'single', deck_position: 'lower', status: 'available', price: '' });
                    } catch (error: any) {
                      console.error('Failed to add bed:', error);
                      alert(`Failed to add bed: ${error.message || 'Unknown error'}`);
                    }
                  }} className="flex-1 glass-button px-4 py-3 rounded-xl font-semibold">Add Bed</button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Permits Modal */}
      {showPermits && showPropertyDetails && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-2xl w-full p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-2xl font-bold text-gray-900">Business Permit</h2>
              <button onClick={() => { setShowPermits(false); setPermitFile(null); setPermitPreview(null); }} className="text-gray-500 hover:text-gray-700 text-2xl font-bold">×</button>
            </div>
            <div className="space-y-4">
              {propertyPermit && (
                <div className="mb-4">
                  <h3 className="font-semibold mb-2">Current Permit</h3>
                  <a href={propertyPermit} target="_blank" rel="noopener noreferrer" className="block">
                    <ImageWithFallback src={propertyPermit} alt="Business Permit" className="w-full h-auto rounded-lg border-2 border-gray-200" />
                  </a>
                </div>
              )}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Upload Business Permit</label>
                <input type="file" accept="image/*,.pdf" onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) {
                    if (file.size > 10 * 1024 * 1024) {
                      alert('File size must be less than 10MB');
                      return;
                    }
                    setPermitFile(file);
                    if (file.type.startsWith('image/')) {
                      const reader = new FileReader();
                      reader.onloadend = () => {
                        setPermitPreview(reader.result as string);
                      };
                      reader.readAsDataURL(file);
                    } else {
                      setPermitPreview(null);
                    }
                  }
                }} className="hidden" id="permit-upload" />
                <label htmlFor="permit-upload" className="glass-button px-6 py-3 rounded-xl cursor-pointer inline-block text-sm font-semibold">
                  {permitFile ? 'Change File' : 'Choose File'}
                </label>
                {permitFile && <p className="text-sm text-gray-600 mt-2">{permitFile.name}</p>}
              </div>
              {permitPreview && (
                <div>
                  <h3 className="font-semibold mb-2">Preview</h3>
                  <ImageWithFallback src={permitPreview} alt="Permit Preview" className="w-full h-auto rounded-lg border-2 border-gray-200" />
                </div>
              )}
              <div className="flex gap-3 pt-4">
                <button onClick={() => { setShowPermits(false); setPermitFile(null); setPermitPreview(null); }} className="flex-1 px-4 py-3 bg-gray-200 text-gray-800 rounded-xl hover:bg-gray-300 transition-colors font-semibold">Cancel</button>
                <button onClick={async () => {
                  if (!permitFile) {
                    alert('Please select a file to upload');
                    return;
                  }
                  try {
                    const fileExt = permitFile.name.split('.').pop();
                    const fileName = `permit-${showPropertyDetails.id}.${fileExt}`;
                    const filePath = `permits/${fileName}`;
                    
                    const { error: uploadError } = await supabase.storage
                      .from('property-images')
                      .upload(filePath, permitFile, { cacheControl: '3600', upsert: true });
                    
                    if (uploadError) throw uploadError;
                    
                    const { data: { publicUrl } } = supabase.storage
                      .from('property-images')
                      .getPublicUrl(filePath);
                    
                    const { error: updateError } = await supabase
                      .from('properties')
                      .update({ business_permit_url: publicUrl })
                      .eq('id', showPropertyDetails.id);
                    
                    if (updateError) throw updateError;
                    
                    alert('Permit uploaded successfully!');
                    setPropertyPermit(publicUrl);
                    setShowPermits(false);
                    setPermitFile(null);
                    setPermitPreview(null);
                  } catch (error: any) {
                    console.error('Failed to upload permit:', error);
                    alert(`Failed to upload permit: ${error.message || 'Unknown error'}`);
                  }
                }} className="flex-1 glass-button px-4 py-3 rounded-xl font-semibold">Upload Permit</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Edit Property Modal */}
      {editingProperty && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-3 sm:p-4 z-50">
            <div className="bg-white rounded-xl sm:rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
                <div className="p-4 sm:p-6">
                    <div className="flex justify-between items-start mb-4">
                        <h2 className="text-2xl font-bold">Edit Property</h2>
                        <button
                            onClick={() => setEditingProperty(null)}
                            className="text-gray-500 hover:text-gray-700"
                        >
                            ✕
                        </button>
                    </div>

                    <div className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Property Title
                            </label>
                            <input
                                type="text"
                                value={editingProperty.title}
                                onChange={(e) => setEditingProperty({ ...editingProperty, title: e.target.value })}
                                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500"
                                placeholder="Enter property title"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Description
                            </label>
                            <textarea
                                value={editingProperty.description}
                                onChange={(e) => setEditingProperty({ ...editingProperty, description: e.target.value })}
                                className="w-full h-24 px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500"
                                placeholder="Describe your property"
                            />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Monthly Rent (₱)
                                </label>
                                <input
                                    type="number"
                                    value={editingProperty.price}
                                    onChange={(e) => setEditingProperty({ ...editingProperty, price: parseInt(e.target.value) })}
                                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500"
                                    placeholder="15000"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Location
                                </label>
                                <input
                                    type="text"
                                    value={editingProperty.location}
                                    onChange={(e) => setEditingProperty({ ...editingProperty, location: e.target.value })}
                                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500"
                                    placeholder="Catbalogan City, Samar"
                                />
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Amenities
                            </label>
                            
                            {/* Predefined Amenities */}
                            <div className="mb-4">
                                <p className="text-sm text-gray-600 mb-2">Select from common amenities:</p>
                                <div className="grid grid-cols-2 gap-2">
                                    {['Gas', 'Electricity', 'Water', 'Parking Area', 'Wi-Fi', 'Laundry Area'].map((amenity) => (
                                        <label key={amenity} className="flex items-center space-x-2">
                                            <input
                                                type="checkbox"
                                                checked={editingProperty.amenities.includes(amenity)}
                                                onChange={() => {
                                                    const updatedAmenities = editingProperty.amenities.includes(amenity)
                                                        ? editingProperty.amenities.filter(a => a !== amenity)
                                                        : [...editingProperty.amenities, amenity];
                                                    setEditingProperty({ ...editingProperty, amenities: updatedAmenities });
                                                }}
                                                className="text-blue-600 focus:ring-orange-500"
                                            />
                                            <span className="text-sm text-gray-700">{amenity}</span>
                                        </label>
                                    ))}
                                </div>
                            </div>

                            {/* Custom Amenities */}
                            <div className="mb-4">
                                <p className="text-sm text-gray-600 mb-2">Add custom amenities:</p>
                                <div className="flex gap-2">
                                    <input
                                        type="text"
                                        value={editCustomAmenity}
                                        onChange={(e) => setEditCustomAmenity(e.target.value)}
                                        onKeyDown={(e) => {
                                            if (e.key === 'Enter') {
                                                e.preventDefault();
                                                addEditCustomAmenity();
                                            }
                                        }}
                                        className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 text-sm"
                                        placeholder="Enter custom amenity (e.g., Swimming Pool, Gym, Garden)"
                                    />
                                    <button
                                        type="button"
                                        onClick={addEditCustomAmenity}
                                        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
                                    >
                                        Add
                                    </button>
                                </div>
                            </div>

                            {/* Selected Amenities Display */}
                            {editingProperty.amenities.length > 0 && (
                                <div>
                                    <p className="text-sm text-gray-600 mb-2">Selected amenities:</p>
                                    <div className="flex flex-wrap gap-2">
                                        {editingProperty.amenities.map((amenity, index) => (
                                            <span
                                                key={index}
                                                className="inline-flex items-center gap-1 px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm"
                                            >
                                                {amenity}
                                                <button
                                                    type="button"
                                                    onClick={() => removeEditAmenity(amenity)}
                                                    className="ml-1 text-blue-600 hover:text-blue-800"
                                                >
                                                    ×
                                                </button>
                                            </span>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>

                        <div className="flex gap-3 pt-4">
                            <button
                                onClick={() => setEditingProperty(null)}
                                className="flex-1 bg-gray-200 text-gray-800 py-3 rounded-xl hover:bg-gray-300 transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleUpdateProperty}
                                className="flex-1 py-3 rounded-xl transition-colors bg-blue-600 text-white hover:bg-blue-700"
                            >
                                Update Property
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
      )}
      {chatOpen && activeConversation && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-0 sm:p-4 z-50">
          <div className="bg-white rounded-none sm:rounded-2xl max-w-2xl w-full h-full sm:h-auto sm:max-h-[90vh] overflow-hidden flex flex-col">
            <div className="p-4 border-b flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-blue-600 text-white flex items-center justify-center font-semibold">
                  {(activeConversation.client_email || 'U').charAt(0).toUpperCase()}
                </div>
                <div>
                  <h3 className="text-lg font-bold text-gray-900">{activeConversation.client_email}</h3>
                  <p className="text-xs text-gray-500">Property: {properties.find(p => p.id === activeConversation.property_id)?.title || activeConversation.property_id}</p>
                </div>
              </div>
              <button onClick={closeChat} className="text-gray-500 hover:text-gray-700">✕</button>
            </div>
            <div className="p-4 space-y-3 overflow-y-auto" style={{ height: '50vh' }}>
              {chatLoading ? (
                <div className="text-gray-500">Loading messages...</div>
              ) : (
                chatMessages.map((m) => (
                  <div key={m.id} className={`flex ${m.sender_email === activeConversation.owner_email ? 'justify-end' : 'justify-start'} items-end gap-2`}>
                    {m.sender_email !== activeConversation.owner_email && (
                      <div className="w-7 h-7 rounded-full bg-gray-300 text-gray-700 flex items-center justify-center text-xs font-semibold">
                        {(activeConversation.client_email || 'U').charAt(0).toUpperCase()}
                      </div>
                    )}
                    <div className={`${m.sender_email === activeConversation.owner_email ? 'bg-blue-600 text-white rounded-2xl rounded-br-sm' : 'bg-gray-100 text-gray-900 rounded-2xl rounded-bl-sm'} px-4 py-2 max-w-[75%] shadow-sm` }>
                      <div className="text-sm whitespace-pre-wrap leading-relaxed">{m.content}</div>
                      <div className={`text-[10px] mt-1 ${m.sender_email === activeConversation.owner_email ? 'text-blue-100' : 'text-gray-500'}`}>{new Date(m.created_at).toLocaleString()}</div>
                    </div>
                    {m.sender_email === activeConversation.owner_email && (
                      <div className="w-7 h-7 rounded-full bg-blue-600 text-white flex items-center justify-center text-xs font-semibold">
                        {(activeConversation.owner_email || 'O').charAt(0).toUpperCase()}
                      </div>
                    )}
                  </div>
                ))
              )}
              <div ref={messagesEndRef} />
            </div>
            <div className="p-4 border-t flex items-center gap-2 bg-gray-50">
              <input
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); sendChatMessage(); } }}
                placeholder="Type a message..."
                className="flex-1 px-4 py-3 border border-gray-300 rounded-full focus:outline-none focus:ring-2 focus:ring-orange-500 bg-white"
              />
              <button onClick={sendChatMessage} className="bg-blue-600 text-white px-5 py-3 rounded-full hover:bg-blue-700">Send</button>
            </div>
          </div>
        </div>
      )}

      {/* Scroll to Top Button */}
      {showScrollTop && (
        <button
          onClick={scrollToTop}
          className="fixed bottom-6 right-6 bg-orange-600 text-white p-3 rounded-full shadow-lg hover:bg-orange-700 transition-all duration-200 z-40"
          title="Scroll to top"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 10l7-7m0 0l7 7m-7-7v18" />
          </svg>
        </button>
      )}

      {/* Tenant Information Modal */}
      {showTenantModal && selectedTenant && (
        <div className="fixed inset-0 bg-black bg-opacity-60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl">
            <div className="sticky top-0 bg-white border-b border-gray-200 p-6 flex justify-between items-center z-10">
              <h2 className="text-2xl font-bold text-gray-900">Tenant Information</h2>
              <button
                onClick={() => {
                  setShowTenantModal(false);
                  setSelectedTenant(null);
                }}
                className="text-gray-500 hover:text-gray-700 text-2xl font-bold"
              >
                ×
              </button>
            </div>

            <div className="p-6 space-y-6">
              {/* Profile Image */}
              <div className="flex justify-center">
                <div className="w-40 h-40 rounded-full overflow-hidden border-4 border-orange-200 shadow-lg bg-gray-100 flex items-center justify-center">
                  {selectedTenant.profileImage ? (
                    <ImageWithFallback
                      src={selectedTenant.profileImage}
                      alt={selectedTenant.name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-orange-100 to-orange-200">
                      <svg className="w-20 h-20 text-orange-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                      </svg>
                    </div>
                  )}
                </div>
              </div>

              {/* Personal Information */}
              <div className="bg-gray-50 rounded-xl p-6 space-y-4">
                <h3 className="text-xl font-bold text-gray-900 mb-4">Personal Information</h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-semibold text-gray-600">Full Name</label>
                    <p className="text-gray-900 font-medium mt-1">{selectedTenant.name}</p>
                  </div>
                  
                  <div>
                    <label className="text-sm font-semibold text-gray-600">Email</label>
                    <p className="text-gray-900 font-medium mt-1">{selectedTenant.email}</p>
                  </div>

                  <div>
                    <label className="text-sm font-semibold text-gray-600">Phone Number</label>
                    <p className="text-gray-900 font-medium mt-1">{selectedTenant.phone}</p>
                  </div>

                  <div>
                    <label className="text-sm font-semibold text-gray-600">Gender</label>
                    <p className="text-gray-900 font-medium mt-1">{selectedTenant.gender}</p>
                  </div>

                  <div>
                    <label className="text-sm font-semibold text-gray-600">Age</label>
                    <p className="text-gray-900 font-medium mt-1">{selectedTenant.age}</p>
                  </div>

                  <div>
                    <label className="text-sm font-semibold text-gray-600">Occupation</label>
                    <p className="text-gray-900 font-medium mt-1">{selectedTenant.occupation}</p>
                  </div>

                  <div>
                    <label className="text-sm font-semibold text-gray-600">Citizenship</label>
                    <p className="text-gray-900 font-medium mt-1">{selectedTenant.citizenship}</p>
                  </div>
                </div>

                {/* Address */}
                <div className="mt-4">
                  <label className="text-sm font-semibold text-gray-600">Address</label>
                  <p className="text-gray-900 font-medium mt-1">
                    {selectedTenant.address !== 'N/A' ? selectedTenant.address : ''}
                    {selectedTenant.barangay !== 'N/A' ? `, ${selectedTenant.barangay}` : ''}
                    {selectedTenant.city !== 'N/A' ? `, ${selectedTenant.city}` : ''}
                    {selectedTenant.address === 'N/A' && selectedTenant.barangay === 'N/A' && selectedTenant.city === 'N/A' ? 'N/A' : ''}
                  </p>
                </div>
              </div>

              {/* Booking Information */}
              <div className="bg-gray-50 rounded-xl p-6 space-y-4">
                <h3 className="text-xl font-bold text-gray-900 mb-4">Booking Information</h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-semibold text-gray-600">Booking ID</label>
                    <p className="text-gray-900 font-medium mt-1 font-mono text-sm">{selectedTenant.bookingId}</p>
                  </div>

                  <div>
                    <label className="text-sm font-semibold text-gray-600">User ID</label>
                    <p className="text-gray-900 font-medium mt-1 font-mono text-sm">{selectedTenant.userId}</p>
                  </div>
                </div>
              </div>

              {/* ID Document */}
              <div className="bg-gray-50 rounded-xl p-6">
                <h3 className="text-xl font-bold text-gray-900 mb-4">ID Document</h3>
                {selectedTenant.idDocument ? (
                  <>
                    <div className="flex justify-center">
                      <a
                        href={selectedTenant.idDocument}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="block max-w-md"
                      >
                        <ImageWithFallback
                          src={selectedTenant.idDocument}
                          alt="ID Document"
                          className="w-full h-auto rounded-lg shadow-lg border-2 border-gray-200 hover:border-orange-400 transition-colors cursor-pointer"
                        />
                      </a>
                    </div>
                    <p className="text-xs text-gray-500 text-center mt-2">Click to view full size</p>
                  </>
                ) : (
                  <div className="flex flex-col items-center justify-center py-8">
                    <svg className="w-16 h-16 text-gray-300 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    <p className="text-gray-500 font-medium">No ID document uploaded</p>
                    <p className="text-xs text-gray-400 mt-1">ID document not available for this tenant</p>
                  </div>
                )}
              </div>
            </div>

            <div className="sticky bottom-0 bg-white border-t border-gray-200 p-6 flex justify-end">
              <button
                onClick={() => {
                  setShowTenantModal(false);
                  setSelectedTenant(null);
                }}
                className="glass-button px-6 py-3 rounded-xl font-semibold"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* View Profile Modal */}
      {showViewProfile && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl">
            <div className="sticky top-0 bg-white border-b border-gray-200 p-6 flex justify-between items-center z-10">
              <h2 className="text-2xl font-bold text-gray-900">My Profile</h2>
              <button
                onClick={() => setShowViewProfile(false)}
                className="text-gray-500 hover:text-gray-700 text-2xl font-bold"
              >
                ×
              </button>
            </div>

            <div className="p-6 space-y-6">
              {/* Profile Image */}
              <div className="flex justify-center">
                <div className="w-40 h-40 rounded-full overflow-hidden border-4 border-orange-200 shadow-lg bg-gray-100 flex items-center justify-center">
                  {viewProfileData.profile_image_url ? (
                    <ImageWithFallback
                      src={viewProfileData.profile_image_url}
                      alt={viewProfileData.full_name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-orange-100 to-orange-200">
                      <svg className="w-20 h-20 text-orange-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                      </svg>
                    </div>
                  )}
                </div>
              </div>

              {/* Personal Information */}
              <div className="bg-gray-50 rounded-xl p-6 space-y-4">
                <h3 className="text-xl font-bold text-gray-900 mb-4">Personal Information</h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-semibold text-gray-600">Full Name</label>
                    <p className="text-gray-900 font-medium mt-1">{viewProfileData.full_name}</p>
                  </div>
                  
                  <div>
                    <label className="text-sm font-semibold text-gray-600">Email</label>
                    <p className="text-gray-900 font-medium mt-1">{viewProfileData.email}</p>
                  </div>

                  <div>
                    <label className="text-sm font-semibold text-gray-600">Phone Number</label>
                    <p className="text-gray-900 font-medium mt-1">{viewProfileData.phone}</p>
                  </div>
                </div>

                {/* Address */}
                <div className="mt-4">
                  <label className="text-sm font-semibold text-gray-600">Address</label>
                  <p className="text-gray-900 font-medium mt-1">
                    {viewProfileData.address !== 'N/A' ? viewProfileData.address : ''}
                    {viewProfileData.barangay !== 'N/A' ? `, ${viewProfileData.barangay}` : ''}
                    {viewProfileData.city !== 'N/A' ? `, ${viewProfileData.city}` : ''}
                    {viewProfileData.address === 'N/A' && viewProfileData.barangay === 'N/A' && viewProfileData.city === 'N/A' ? 'N/A' : ''}
                  </p>
                </div>
              </div>
            </div>

            <div className="sticky bottom-0 bg-white border-t border-gray-200 p-6 flex justify-end gap-3">
              <button
                onClick={() => setShowViewProfile(false)}
                className="px-6 py-3 bg-gray-200 text-gray-800 rounded-xl hover:bg-gray-300 transition-colors font-semibold"
              >
                Close
              </button>
              <button
                onClick={async () => {
                  setShowViewProfile(false);
                  // Load profile data for editing
                  try {
                    const email = ownerEmail || user?.email;
                    if (!email) {
                      alert('Email not found');
                      return;
                    }

                    const { data: landlordProfile } = await supabase
                      .from('landlord_profiles')
                      .select('*')
                      .eq('email', email)
                      .single();

                    const { data: appUser } = await supabase
                      .from('app_users')
                      .select('*')
                      .eq('email', email)
                      .single();

                    const profile = landlordProfile || appUser;
                    setProfileData({
                      full_name: profile?.full_name || user?.user_metadata?.full_name || '',
                      email: email,
                      phone: profile?.phone || '',
                      address: profile?.address || '',
                      barangay: profile?.barangay || '',
                      city: profile?.city || '',
                      profile_image_url: profile?.profile_image_url || ''
                    });
                    setProfileImagePreview(profile?.profile_image_url || null);
                    setShowEditProfile(true);
                  } catch (error) {
                    console.error('Failed to load profile:', error);
                    setProfileData({
                      full_name: user?.user_metadata?.full_name || '',
                      email: ownerEmail || user?.email || '',
                      phone: '',
                      address: '',
                      barangay: '',
                      city: '',
                      profile_image_url: ''
                    });
                    setShowEditProfile(true);
                  }
                }}
                className="glass-button px-6 py-3 rounded-xl font-semibold"
              >
                Edit Profile
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Profile Modal */}
      {showEditProfile && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl">
            <div className="sticky top-0 bg-white border-b border-gray-200 p-6 flex justify-between items-center z-10">
              <h2 className="text-2xl font-bold text-gray-900">Edit Profile</h2>
              <button
                onClick={() => {
                  setShowEditProfile(false);
                  setProfileImageFile(null);
                  setProfileImagePreview(null);
                }}
                className="text-gray-500 hover:text-gray-700 text-2xl font-bold"
              >
                ×
              </button>
            </div>

            <div className="p-6 space-y-6">
              {/* Profile Image */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-4 text-center">Profile Picture</label>
                <div className="flex flex-col items-center space-y-4">
                  <div className="w-40 h-40 rounded-full overflow-hidden border-4 border-orange-200 shadow-lg bg-gray-100 flex items-center justify-center">
                    {profileImagePreview ? (
                      <ImageWithFallback
                        src={profileImagePreview}
                        alt="Profile"
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-orange-100 to-orange-200">
                        <svg className="w-20 h-20 text-orange-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                        </svg>
                      </div>
                    )}
                  </div>
                  <div className="text-center">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          if (file.size > 5 * 1024 * 1024) {
                            alert('Image size must be less than 5MB');
                            return;
                          }
                          setProfileImageFile(file);
                          const reader = new FileReader();
                          reader.onloadend = () => {
                            setProfileImagePreview(reader.result as string);
                          };
                          reader.readAsDataURL(file);
                        }
                      }}
                      className="hidden"
                      id="profile-image-upload-landlord"
                    />
                    <label
                      htmlFor="profile-image-upload-landlord"
                      className="bg-orange-500 hover:bg-orange-600 text-white px-6 py-3 rounded-xl cursor-pointer inline-block text-sm font-semibold transition-colors shadow-md"
                    >
                      {profileImagePreview ? 'Change Photo' : 'Upload Photo'}
                    </label>
                    {profileImageFile && (
                      <div className="mt-2 text-green-600 text-sm font-medium flex items-center justify-center">
                        <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                        ✓ ready to upload
                      </div>
                    )}
                    <p className="text-xs text-gray-500 mt-2">Max 5MB, Image files only</p>
                  </div>
                </div>
              </div>

              {/* Full Name */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Full Name</label>
                <input
                  type="text"
                  value={profileData.full_name}
                  onChange={(e) => setProfileData({ ...profileData, full_name: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500"
                  placeholder="Enter your full name"
                />
              </div>

              {/* Phone */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Phone Number</label>
                <input
                  type="tel"
                  value={profileData.phone}
                  onChange={(e) => setProfileData({ ...profileData, phone: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500"
                  placeholder="Enter your phone number"
                />
              </div>

              {/* Address */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Street Address</label>
                <input
                  type="text"
                  value={profileData.address}
                  onChange={(e) => setProfileData({ ...profileData, address: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500"
                  placeholder="Enter your street address"
                />
              </div>

              {/* Barangay */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Barangay</label>
                <input
                  type="text"
                  value={profileData.barangay}
                  onChange={(e) => setProfileData({ ...profileData, barangay: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500"
                  placeholder="Enter your barangay"
                />
              </div>

              {/* City */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">City</label>
                <input
                  type="text"
                  value={profileData.city}
                  onChange={(e) => setProfileData({ ...profileData, city: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500"
                  placeholder="Enter your city"
                />
              </div>
            </div>

            <div className="sticky bottom-0 bg-white border-t border-gray-200 p-6 flex justify-end gap-3">
              <button
                onClick={() => {
                  setShowEditProfile(false);
                  setProfileImageFile(null);
                  setProfileImagePreview(null);
                }}
                className="px-6 py-3 bg-gray-200 text-gray-800 rounded-xl hover:bg-gray-300 transition-colors font-semibold"
              >
                Cancel
              </button>
              <button
                onClick={async () => {
                  try {
                    setSavingProfile(true);
                    const email = ownerEmail || user?.email;
                    if (!email) {
                      alert('Email not found');
                      setSavingProfile(false);
                      return;
                    }

                    let profileImageUrl = profileData.profile_image_url;

                    // Upload profile image if new file selected
                    if (profileImageFile) {
                      try {
                        const fileExt = profileImageFile.name.split('.').pop();
                        const userId = user?.id || email.replace(/[^a-zA-Z0-9]/g, '_');
                        const timestamp = Date.now();
                        const fileName = `profile-${userId}-${timestamp}`;
                        const filePath = `profile-images/${fileName}.${fileExt}`;

                        console.log('Attempting to upload profile image to:', filePath);
                        
                        let bucket = 'tenant-verification';
                        const { error: error1 } = await supabase.storage
                          .from('tenant-verification')
                          .upload(filePath, profileImageFile, {
                            cacheControl: '3600',
                            upsert: true
                          });

                        if (error1) {
                          bucket = 'profile-images';
                          const { error: error2 } = await supabase.storage
                            .from('profile-images')
                            .upload(filePath, profileImageFile, {
                              cacheControl: '3600',
                              upsert: true
                            });
                          if (error2) throw error2;
                        }

                        const { data: { publicUrl } } = supabase.storage
                          .from(bucket)
                          .getPublicUrl(filePath);

                        profileImageUrl = publicUrl;
                      } catch (uploadErr: any) {
                        console.error('Image upload failed:', uploadErr);
                        alert(`Could not upload profile image: ${uploadErr.message || 'Unknown error'}. The profile will be saved without the image.`);
                      }
                    }

                    // Update landlord_profiles table
                    let profileError = null;
                    try {
                      const upsertData: any = {
                        email: email,
                        full_name: profileData.full_name,
                        phone: profileData.phone || null,
                        address: profileData.address || null,
                        profile_image_url: profileImageUrl || null,
                        updated_at: new Date().toISOString()
                      };
                      
                      // Add user_id if available to support creating new profile rows
                      if (user?.id) {
                        upsertData.user_id = user.id;
                      }

                      const { error } = await supabase
                        .from('landlord_profiles')
                        .upsert(upsertData, {
                          onConflict: 'email'
                        });
                      if (error) {
                        console.error('landlord_profiles update error:', error);
                        profileError = error;
                      }
                    } catch (err: any) {
                      console.warn('landlord_profiles update failed:', err);
                      profileError = err;
                    }

                    let appUserError = null;
                    try {
                      const { data: existingAppUser } = await supabase
                        .from('app_users')
                        .select('user_id')
                        .eq('email', email)
                        .maybeSingle();

                      if (!existingAppUser) {
                        if (!user?.id) {
                          throw new Error('Missing user id for app_users insert');
                        }
                        const { error: insertError } = await supabase
                          .from('app_users')
                          .insert({
                            user_id: user.id,
                            email: email,
                            full_name: profileData.full_name,
                            role: 'owner',
                            phone: profileData.phone || null,
                            address: profileData.address || null,
                            barangay: profileData.barangay || null,
                            city: profileData.city || null,
                            profile_image_url: profileImageUrl || null
                          });
                        if (insertError) {
                          throw insertError;
                        }
                      }

                      const { error } = await supabase
                        .from('app_users')
                        .update({
                          full_name: profileData.full_name,
                          phone: profileData.phone || null,
                          address: profileData.address || null,
                          barangay: profileData.barangay || null,
                          city: profileData.city || null,
                          profile_image_url: profileImageUrl || null
                        })
                        .eq('email', email);
                      appUserError = error;
                    } catch (err: any) {
                      console.warn('app_users update failed:', err);
                      appUserError = err;
                    }

                    // Critical: If landlord_profiles failed, we must report it because View Profile relies on it.
                    if (profileError) {
                      throw new Error(`Failed to update landlord profile: ${profileError.message || 'Unknown error'}`);
                    }

                    if (appUserError) {
                      console.warn('App user update failed, but landlord profile saved:', appUserError);
                      // We might choose not to throw here if landlord_profiles succeeded, 
                      // but it's better to be consistent.
                    }

                    alert('Profile updated successfully!');
                    setShowEditProfile(false);
                    setProfileImageFile(null);
                    // Update profile data with the new image URL
                    setProfileData(prev => ({
                      ...prev,
                      profile_image_url: profileImageUrl
                    }));
                  } catch (error: any) {
                    console.error('Failed to save profile:', error);
                    alert(`Failed to save profile: ${error.message || 'Please try again.'}`);
                  } finally {
                    setSavingProfile(false);
                  }
                }}
                disabled={savingProfile}
                className="glass-button px-6 py-3 rounded-xl font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {savingProfile ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Report Problem Modal */}
      {showReportProblem && user && (
        <ReportProblem
          userEmail={ownerEmail || user?.email || ''}
          userId={user?.id || ''}
          userType="owner"
          onClose={() => setShowReportProblem(false)}
        />
      )}
      </div>
    </div>
  );
}
