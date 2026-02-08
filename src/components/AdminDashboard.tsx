import React, { useState, useEffect } from 'react';
import GoogleMap from './GoogleMap';
import { ImageWithFallback } from './ImageWithFallback';
import ImageCarousel from './ImageCarousel';
import NotificationSystem from './NotificationSystem';
import supabase from '../lib/supabase';
import { Line, Bar, Pie } from 'react-chartjs-2';
import Chart from 'chart.js/auto';
import ChartDataLabels from 'chartjs-plugin-datalabels';
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
// @ts-ignore
import 'jspdf-autotable';
import ReportGeneration from './ReportGeneration';

// Extend jsPDF type to include autoTable
declare module 'jspdf' {
  interface jsPDF {
    autoTable(options: any): jsPDF;
  }
}

Chart.register(ChartDataLabels);

interface AdminStats {
  totalClients: number;
  totalOwners: number;
  totalProperties: number;
  totalBookings: number;
  pendingBookings: number;
  approvedBookings: number;
  totalRevenue: number;
  activeProperties: number;
  inactiveProperties: number;
  totalReviews: number;
  averageRating: number;
}

interface User {
  id: string;
  name: string;
  email: string;
  role: 'client' | 'owner' | 'admin';
  status: 'active' | 'inactive';
  is_verified: boolean;
  createdAt: string;
}

interface Property {
  id: string;
  title: string;
  owner: string;
  location: string;
  price: number;
  status: 'available' | 'full' | 'pending';
  createdAt: string;
  rating: number;
  totalReviews: number;
  isFeatured: boolean;
  isVerified: boolean;
  ownerEmail: string;
  coordinates: { lat: number; lng: number };
  images?: string[];
  amenities?: string[];
  description?: string;
  businessPermitUrl?: string;
}

interface Booking {
  id: string;
  clientName: string;
  propertyTitle: string;
  ownerName: string;
  status: 'pending' | 'approved' | 'rejected';
  createdAt: string;
  totalAmount: number;
  checkInDate: string;
  checkOutDate: string;
  paymentStatus: string;
}

interface Review {
  id: string;
  propertyId: string;
  propertyTitle: string;
  clientName: string;
  clientEmail: string;
  rating: number;
  reviewText: string;
  isVerified: boolean;
  createdAt: string;
}

interface Notification {
  id: string;
  recipientEmail: string;
  title: string;
  body: string;
  type: string;
  readAt: string | null;
  createdAt: string;
}

interface AdminDashboardProps {
  onBack: () => void;
}

export default function AdminDashboard({ onBack }: AdminDashboardProps) {
  const [activeTab, setActiveTab] = useState<'overview' | 'users' | 'properties' | 'bookings' | 'reviews' | 'notifications' | 'maps' | 'analytics'>('overview');
  const [profileOpen, setProfileOpen] = useState(false);
  const [reportDropdownOpen, setReportDropdownOpen] = useState(false);
  const [showReportGeneration, setShowReportGeneration] = useState(false);
  const [adminEmail, setAdminEmail] = useState<string>('');
  const [adminRole, setAdminRole] = useState<string>('');
  const [authorized, setAuthorized] = useState<boolean>(true);
  const [showNotifications, setShowNotifications] = useState(false);

  const [stats, setStats] = useState<AdminStats>({
    totalClients: 0,
    totalOwners: 0,
    totalProperties: 0,
    totalBookings: 0,
    pendingBookings: 0,
    approvedBookings: 0,
    totalRevenue: 0,
    activeProperties: 0,
    inactiveProperties: 0,
    totalReviews: 0,
    averageRating: 0
  });

  const [users, setUsers] = useState<User[]>([]);
  const [properties, setProperties] = useState<Property[]>([]);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [dailyRegistrations, setDailyRegistrations] = useState<{ date: string; count: number }[]>([]);
  const [user, setUser] = useState<any>(null);
  const [bookingStatusCounts, setBookingStatusCounts] = useState<{ pending: number; approved: number; rejected: number }>({ pending: 0, approved: 0, rejected: 0 });
  const [mapSelectedProperty, setMapSelectedProperty] = useState<Property | null>(null);
  const [showPropertyDetails, setShowPropertyDetails] = useState<Property | null>(null);
  
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
  

  
  // Landlord Analytics State
  const [landlordAnalytics, setLandlordAnalytics] = useState<any[]>([]);
  const [loadingAnalytics, setLoadingAnalytics] = useState(false);
  const [showAllPropertiesAnalytics, setShowAllPropertiesAnalytics] = useState(false);
  const [selectedAnalyticsProperty, setSelectedAnalyticsProperty] = useState<any>(null);

  const handleLogout = async () => {
    const confirmed = window.confirm('Are you sure you want to log out?');
    if (!confirmed) return;
    try {
      await supabase.auth.signOut();
    } catch (error) {
      console.error('Failed to sign out admin', error);
    }
    onBack();
  };

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
    const loadAdmin = async () => {
      try {
        const override = typeof window !== 'undefined' ? window.localStorage.getItem('loginAs') : null;
        const emailOverride = typeof window !== 'undefined' ? window.localStorage.getItem('adminEmailOverride') : null;

        if (override === 'admin') {
          setAdminEmail(emailOverride || 'admin@example.com');
          setAdminRole('admin');
          setAuthorized(true);
          return;
        }

        const { data: userData } = await supabase.auth.getUser();
        setUser(userData?.user);
        if (userData?.user?.email) setAdminEmail(userData.user.email);
        if (userData?.user?.id) {
          const { data: profile } = await supabase
            .from('app_users')
            .select('role')
            .eq('user_id', userData.user.id)
            .single();
          const role = (profile as any)?.role || '';
          if (role) setAdminRole(role);
        }
        setAuthorized(true);
      } catch (e) {
        setAuthorized(true);
      }
    };
    loadAdmin();
  }, [onBack]);

  React.useEffect(() => {
    const loadStats = async () => {
      try {
        // total clients (from app_users)
        const { count: clientsCount } = await supabase
          .from('app_users')
          .select('*', { count: 'exact', head: true })
          .eq('role', 'client');

        // total owners (from app_users)
        const { count: ownersCount } = await supabase
          .from('app_users')
          .select('*', { count: 'exact', head: true })
          .eq('role', 'owner');

        // total properties
        const { count: propertiesCount } = await supabase
          .from('properties')
          .select('*', { count: 'exact', head: true });

        // bookings total
        const { count: bookingsCount } = await supabase
          .from('bookings')
          .select('*', { count: 'exact', head: true });

        // pending bookings
        const { count: pendingCount } = await supabase
          .from('bookings')
          .select('*', { count: 'exact', head: true })
          .eq('status', 'pending');

        // approved bookings
        const { count: approvedCount } = await supabase
          .from('bookings')
          .select('*', { count: 'exact', head: true })
          .eq('status', 'approved');

        // active properties
        const { count: activePropertiesCount } = await supabase
          .from('properties')
          .select('*', { count: 'exact', head: true })
          .eq('status', 'available');

        // inactive properties (status = 'full')
        const { count: inactivePropertiesCount } = await supabase
          .from('properties')
          .select('*', { count: 'exact', head: true })
          .eq('status', 'full');

        // total reviews
        const { count: reviewsCount } = await supabase
          .from('reviews')
          .select('*', { count: 'exact', head: true });

        // total revenue
        const { data: revenueData } = await supabase
          .from('bookings')
          .select('total_amount, property_id, boarding_house_id, room_id, bed_id')
          .eq('status', 'approved');

        // Fetch properties prices for fallback
        const propertyIds = revenueData?.map((b: any) => b.property_id || b.boarding_house_id).filter(Boolean) || [];
        const roomIds = revenueData?.map((b: any) => b.room_id).filter(Boolean) || [];
        const bedIds = revenueData?.map((b: any) => b.bed_id).filter(Boolean) || [];

        let propertyPrices: Record<string, number> = {};
        let roomPrices: Record<string, number> = {};
        let bedPrices: Record<string, number> = {};
        
        if (propertyIds.length > 0) {
          const { data: prices } = await supabase
            .from('properties')
            .select('id, price')
            .in('id', propertyIds);
            
          (prices || []).forEach((p: any) => {
            propertyPrices[p.id] = Number(p.price) || 0;
          });
        }

        if (roomIds.length > 0) {
          const { data: rPrices } = await supabase
            .from('rooms')
            .select('id, price_per_bed') // Assuming price_per_bed is the price field
            .in('id', roomIds);
            
          (rPrices || []).forEach((r: any) => {
            roomPrices[r.id] = Number(r.price_per_bed) || 0;
          });
        }

        if (bedIds.length > 0) {
          const { data: bPrices } = await supabase
            .from('beds')
            .select('id, price')
            .in('id', bedIds);
            
          (bPrices || []).forEach((b: any) => {
            bedPrices[b.id] = Number(b.price) || 0;
          });
        }

        const totalRevenue = revenueData?.reduce((sum, booking: any) => {
          let amount = Number(booking.total_amount);
          
          // Fallback logic if total_amount is missing or 0
          if (!amount) {
            if (booking.bed_id && bedPrices[booking.bed_id]) {
              amount = bedPrices[booking.bed_id];
            } else if (booking.room_id && roomPrices[booking.room_id]) {
              amount = roomPrices[booking.room_id];
            } else {
              const propId = booking.property_id || booking.boarding_house_id;
              if (propId) {
                amount = propertyPrices[propId] || 0;
              }
            }
          }
          return sum + (Number.isFinite(amount) ? amount : 0);
        }, 0) || 0;

        // average rating
        const { data: ratingData } = await supabase
          .from('properties')
          .select('rating')
          .not('rating', 'is', null);

        const averageRating = ratingData && ratingData.length > 0 
          ? ratingData.reduce((sum, prop) => sum + (prop.rating || 0), 0) / ratingData.length 
          : 0;

        setStats({
          totalClients: clientsCount || 0,
          totalOwners: ownersCount || 0,
          totalProperties: propertiesCount || 0,
          totalBookings: bookingsCount || 0,
          pendingBookings: pendingCount || 0,
          approvedBookings: approvedCount || 0,
          totalRevenue,
          activeProperties: activePropertiesCount || 0,
          inactiveProperties: inactivePropertiesCount || 0,
          totalReviews: reviewsCount || 0,
          averageRating
        });

        // Daily registrations (last 14 days)
        const { data: regData } = await supabase
          .from('app_users')
          .select('created_at')
          .gte('created_at', new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString())
          .order('created_at', { ascending: true });
        const byDay = new Map<string, number>();
        (regData || []).forEach((r: any) => {
          const d = new Date(r.created_at);
          const key = `${d.getFullYear()}-${(d.getMonth() + 1).toString().padStart(2, '0')}-${d.getDate().toString().padStart(2, '0')}`;
          byDay.set(key, (byDay.get(key) || 0) + 1);
        });
        const days: { date: string; count: number }[] = [];
        for (let i = 13; i >= 0; i--) {
          const d = new Date(Date.now() - i * 24 * 60 * 60 * 1000);
          const key = `${d.getFullYear()}-${(d.getMonth() + 1).toString().padStart(2, '0')}-${d.getDate().toString().padStart(2, '0')}`;
          days.push({ date: key, count: byDay.get(key) || 0 });
        }
        setDailyRegistrations(days);

        // Booking status counts
        const [{ count: pCnt }, { count: aCnt }, { count: rCnt }] = await Promise.all([
          supabase.from('bookings').select('*', { count: 'exact', head: true }).eq('status', 'pending'),
          supabase.from('bookings').select('*', { count: 'exact', head: true }).eq('status', 'approved'),
          supabase.from('bookings').select('*', { count: 'exact', head: true }).eq('status', 'rejected'),
        ]);
        setBookingStatusCounts({ pending: pCnt || 0, approved: aCnt || 0, rejected: rCnt || 0 });
      } catch (e) {
        console.error('Failed to load admin stats', e);
      }
    };
    loadStats();
  }, []);

  React.useEffect(() => {
    const loadLists = async () => {
      try {
        console.log('=== LOADING ADMIN DATA ===');
        
        // Users from app_users
        console.log('Loading users from app_users...');
        const { data: usersData, error: usersErr } = await supabase
          .from('app_users')
          .select('id:user_id, email, full_name, role, is_verified, created_at')
          .order('created_at', { ascending: false });
        if (usersErr) {
          console.error('Error loading users:', usersErr);
          throw usersErr;
        }
        console.log('Users from app_users:', usersData?.length || 0, 'users');
        const fromAppUsers: User[] = (usersData || []).map((u: any) => ({
          id: u.id || u.user_id || u.email,
          name: u.full_name || u.email,
          email: u.email,
          role: (u.role as 'client' | 'owner' | 'admin') || 'client',
          status: 'active',
          is_verified: u.is_verified || false,
          createdAt: u.created_at
        }));

        // Users from profiles (owner/client only)
        let fromProfiles: User[] = [];
        try {
          const { data: profilesData } = await supabase
            .from('profiles')
            .select('id, email, role, created_at')
            .order('created_at', { ascending: false });
          fromProfiles = (profilesData || []).map((p: any) => ({
            id: p.id || p.email,
            name: p.email,
            email: p.email,
            role: (p.role as 'client' | 'owner') || 'client',
            status: 'active',
            is_verified: false,
            createdAt: p.created_at
          }));
        } catch {
          // profiles table may not exist; ignore
        }

        // Merge by email (prefer app_users for admin/full_name)
        const emailToUser = new Map<string, User>();
        for (const u of fromProfiles) {
          if (u.email) emailToUser.set(u.email, u);
        }
        for (const u of fromAppUsers) {
          if (u.email) emailToUser.set(u.email, u);
        }
        const mergedUsers = Array.from(emailToUser.values())
          .sort((a, b) => (a.createdAt || '').localeCompare(b.createdAt || '')).reverse();

        setUsers(mergedUsers);

        // Properties
        console.log('Loading properties...');
        const { data: propsData, error: propsErr } = await supabase
          .from('properties')
          .select('*')
          .order('created_at', { ascending: false });
        if (propsErr) {
          console.error('Error loading properties:', propsErr);
          throw propsErr;
        }
        console.log('Properties loaded:', propsData?.length || 0, 'properties');
        const mappedProps: Property[] = (propsData || []).map((p: any) => {
          const lat = Number(p.lat);
          const lng = Number(p.lng);
          const hasCoords = !Number.isNaN(lat) && !Number.isNaN(lng) && (lat !== 0 || lng !== 0);
          const coordinates = hasCoords ? { lat, lng } : { lat: 11.7778, lng: 124.8847 };
          return {
          id: p.id,
          title: p.title || '',
          owner: p.owner_name || 'Landlord',
          location: p.location || '',
          price: Number(p.price) || 0,
          status: p.status as 'available' | 'full' | 'pending',
          createdAt: p.created_at,
          rating: Number(p.rating) || 0,
          totalReviews: Number(p.total_reviews) || 0,
          isFeatured: Boolean(p.is_featured),
          isVerified: Boolean(p.is_verified),
          ownerEmail: p.owner_email || '',
          coordinates,
          amenities: Array.isArray(p.amenities) ? p.amenities : [],
          images: Array.isArray(p.images) ? p.images : (p.images ? [p.images] : []),
          businessPermitUrl: p.business_permit_url || null
        };
        });
        setProperties(mappedProps);

        // Bookings
        console.log('Loading bookings...');
        const { data: bookingsData, error: bookingsErr } = await supabase
          .from('bookings')
          .select('id, property_id, client_name, status, created_at')
          .order('created_at', { ascending: false });
        if (bookingsErr) {
          console.error('Error loading bookings:', bookingsErr);
          throw bookingsErr;
        }
        console.log('Bookings loaded:', bookingsData?.length || 0, 'bookings');
        const propMap = new Map(mappedProps.map(p => [p.id, p]));
        const mappedBookings: Booking[] = (bookingsData || []).map((b: any) => {
          const prop = propMap.get(b.property_id);
          return {
            id: b.id,
            clientName: b.client_name,
            propertyTitle: prop?.title || b.property_id,
            ownerName: prop?.owner || 'Landlord',
            status: (b.status as 'pending' | 'approved' | 'rejected') || 'pending',
            createdAt: b.created_at
          } as Booking;
        });
        setBookings(mappedBookings);

        // Reviews
        console.log('Loading reviews...');
        const { data: reviewsData, error: reviewsErr } = await supabase
          .from('reviews')
          .select('*')
          .order('created_at', { ascending: false });
        if (reviewsErr) {
          console.error('Error loading reviews:', reviewsErr);
        } else {
          console.log('Reviews loaded:', reviewsData?.length || 0, 'reviews');
          const mappedReviews: Review[] = (reviewsData || []).map((r: any) => ({
            id: r.id,
            propertyId: r.property_id || '',
            propertyTitle: r.property_title || 'Unknown Property',
            clientName: r.client_name || 'Anonymous',
            clientEmail: r.client_email || '',
            rating: r.rating || 0,
            reviewText: r.review_text || '',
            isVerified: r.is_verified || false,
            createdAt: r.created_at
          }));
          setReviews(mappedReviews);
        }

        console.log('=== DATA LOADING COMPLETE ===');
        console.log('Final counts:', {
          users: mergedUsers.length,
          properties: mappedProps.length,
          bookings: mappedBookings.length,
          reviews: reviewsData?.length || 0
        });
      } catch (e) {
        console.error('Failed to load admin lists', e);
      }
    };
    loadLists();
  }, []);

  const handleUserStatusChange = async (userId: string, newStatus: 'active' | 'inactive') => {
    try {
      // Update user status in the backend
      const { error } = await supabase
        .from('app_users')
        .update({ status: newStatus })
        .eq('user_id', userId);
      
      if (error) throw error;
      
      // Log admin action
      await supabase.rpc('log_admin_action', {
        admin_email_param: adminEmail,
        action_type_param: `user_${newStatus}`,
        target_type_param: 'user',
        target_id_param: userId,
        action_details_param: { newStatus }
      });
      
      // Update local state
      setUsers(users.map(user => 
        user.id === userId ? { ...user, status: newStatus } : user
      ));
      
      alert(`User status updated to ${newStatus}`);
    } catch (error) {
      console.error('Failed to update user status:', error);
      alert('Failed to update user status');
    }
  };

  const handleUserVerificationChange = async (userId: string, isVerified: boolean) => {
    try {
      // Update user verification status in the backend
      const { error } = await supabase
        .from('app_users')
        .update({ is_verified: isVerified })
        .eq('user_id', userId);
      
      if (error) throw error;
      
      // Log admin action
      await supabase
        .from('admin_actions')
        .insert({
          admin_id_param: adminEmail,
          action_type_param: 'user_verification',
          target_id_param: userId,
          action_details_param: { isVerified }
        });
      
      // Update local state
      setUsers(users.map(user => 
        user.id === userId ? { ...user, is_verified: isVerified } : user
      ));
      
      alert(`User verification status updated to ${isVerified ? 'Verified' : 'Unverified'}`);
    } catch (error) {
      console.error('Failed to update user verification status:', error);
      alert('Failed to update user verification status');
    }
  };

  // Temporary function to set property to pending status for testing
  const setPropertyToPending = async (propertyId: string) => {
    try {
      const property = properties.find(p => p.id === propertyId);
      if (!property) return;
      
      // Try to update property status to pending
      const { error } = await supabase
        .from('properties')
        .update({ 
          status: 'pending'
        })
        .eq('id', propertyId);
      
      if (error) {
        console.error('Cannot set to pending - database constraint issue:', error);
        alert('Cannot set status to "pending" due to database constraint. Please run the SQL fix first.');
        return;
      }
      
      // Update local state
      setProperties(properties.map(prop => 
        prop.id === propertyId ? { ...prop, status: 'pending' } : prop
      ));
      
      alert('Property status set to pending for testing');
    } catch (error) {
      console.error('Failed to set property to pending:', error);
      alert('Failed to set property status');
    }
  };

  const handlePropertyVerification = async (propertyId: string, action: 'approve' | 'reject') => {
    try {
      const property = properties.find(p => p.id === propertyId);
      if (!property) return;
      
      // Update property status and verification in the backend
      // Use 'full' for rejected properties instead of 'rejected' to avoid constraint violation
      const newStatus = action === 'approve' ? 'available' : 'full';
      const { error } = await supabase
        .from('properties')
        .update({ 
          status: newStatus,
          is_verified: action === 'approve' 
        })
        .eq('id', propertyId);
      
      if (error) throw error;
      
      // Log admin action (non-blocking - don't fail if RPC function doesn't exist)
      try {
        await supabase.rpc('log_admin_action', {
          admin_email_param: adminEmail,
          action_type_param: `property_${action}`,
          target_type_param: 'property',
          target_id_param: propertyId,
          action_details_param: { action, propertyTitle: property.title }
        });
      } catch (logError) {
        console.warn('Failed to log admin action (RPC function may not exist):', logError);
        // Continue even if logging fails
      }
      
      // Send notification to owner (non-blocking - don't fail if RPC function doesn't exist)
      try {
        await supabase.rpc('send_notification', {
          recipient_email_param: property.ownerEmail,
          title_param: `Property ${action === 'approve' ? 'Approved' : 'Rejected'}`,
          body_param: `Your property "${property.title}" has been ${action === 'approve' ? 'approved and is now visible to tenants' : 'rejected by the admin'}.`,
          notification_type_param: 'property_verification',
          priority_param: 'high'
        });
      } catch (notificationError) {
        console.warn('Failed to send notification (RPC function may not exist):', notificationError);
        // Continue even if notification fails
      }
      
      // Update local state
      setProperties(properties.map(prop => 
        prop.id === propertyId ? { 
          ...prop, 
          status: action === 'approve' ? 'available' : 'full',
          isVerified: action === 'approve'
        } : prop
      ));
      
      alert(`Property ${action === 'approve' ? 'approved' : 'rejected'}. Landlord has been notified.`);
    } catch (error) {
      console.error('Failed to verify property:', error);
      alert('Failed to verify property');
    }
  };

  const handlePropertyStatusChange = async (propertyId: string, newStatus: 'available' | 'full') => {
    try {
      const property = properties.find(p => p.id === propertyId);
      if (!property) return;
      
      // Update property status in the backend
      const { error } = await supabase
        .from('properties')
        .update({ status: newStatus })
        .eq('id', propertyId);
      
      if (error) throw error;
      
      // Log admin action (non-blocking - don't fail if RPC function doesn't exist)
      try {
        await supabase.rpc('log_admin_action', {
          admin_email_param: adminEmail,
          action_type_param: `property_${newStatus}`,
          target_type_param: 'property',
          target_id_param: propertyId,
          action_details_param: { newStatus, propertyTitle: property.title }
        });
      } catch (logError) {
        console.warn('Failed to log admin action (RPC function may not exist):', logError);
        // Continue even if logging fails
      }
      
      // Send notification to owner (non-blocking - don't fail if RPC function doesn't exist)
      try {
        await supabase.rpc('send_notification', {
          recipient_email_param: property.ownerEmail,
          title_param: `Property ${newStatus === 'available' ? 'Available' : 'Full'}`,
          body_param: `Your property "${property.title}" has been ${newStatus === 'available' ? 'made available' : 'marked as full'} by the admin.`,
          notification_type_param: 'property_status_change',
          priority_param: 'high'
        });
      } catch (notificationError) {
        console.warn('Failed to send notification (RPC function may not exist):', notificationError);
        // Continue even if notification fails
      }
      
      // Update local state
      setProperties(properties.map(prop => 
        prop.id === propertyId ? { ...prop, status: newStatus } : prop
      ));
      
      alert(`Property status updated to ${newStatus}. Landlord has been notified.`);
    } catch (error) {
      console.error('Failed to update property status:', error);
      alert('Failed to update property status');
    }
  };

  const handleFeatureProperty = async (propertyId: string, isFeatured: boolean) => {
    try {
      const property = properties.find(p => p.id === propertyId);
      if (!property) {
        alert('Property not found');
        return;
      }
      
      // Update property featured status
      const { error, data } = await supabase
        .from('properties')
        .update({ is_featured: isFeatured })
        .eq('id', propertyId)
        .select();
      
      if (error) {
        console.error('Database update error:', error);
        throw new Error(error.message || 'Failed to update property in database');
      }
      
      // Update local state immediately
      setProperties(properties.map(prop => 
        prop.id === propertyId ? { ...prop, isFeatured } : prop
      ));
      
      // Log admin action (non-blocking - don't fail if logging fails)
      try {
        await supabase.rpc('log_admin_action', {
          admin_email_param: adminEmail,
          action_type_param: `property_${isFeatured ? 'feature' : 'unfeature'}`,
          target_type_param: 'property',
          target_id_param: propertyId,
          action_details_param: { isFeatured, propertyTitle: property.title }
        });
      } catch (logError) {
        console.warn('Failed to log admin action (non-critical):', logError);
        // Continue even if logging fails
      }
      
      alert(`Property ${isFeatured ? 'featured' : 'unfeatured'} successfully`);
    } catch (error: any) {
      console.error('Failed to update property feature status:', error);
      const errorMessage = error?.message || error?.toString() || 'Unknown error';
      alert(`Failed to update property feature status: ${errorMessage}`);
      
      // Refresh properties to get latest state from database
      try {
        const { data: propsData } = await supabase
          .from('properties')
          .select('*')
          .order('created_at', { ascending: false });
        
        if (propsData) {
          const mappedProps: Property[] = (propsData || []).map((p: any) => {
            const lat = Number(p.lat);
            const lng = Number(p.lng);
            const hasCoords = !Number.isNaN(lat) && !Number.isNaN(lng) && (lat !== 0 || lng !== 0);
            const coordinates = hasCoords ? { lat, lng } : { lat: 11.7778, lng: 124.8847 };
            return {
              id: p.id,
              title: p.title || '',
              owner: p.owner_name || 'Landlord',
              location: p.location || '',
              price: Number(p.price) || 0,
              status: p.status as 'available' | 'full' | 'pending',
              createdAt: p.created_at,
              rating: Number(p.rating) || 0,
              totalReviews: Number(p.total_reviews) || 0,
              isFeatured: Boolean(p.is_featured),
              isVerified: Boolean(p.is_verified),
              ownerEmail: p.owner_email || '',
              coordinates,
              images: Array.isArray(p.images) ? p.images : [],
              amenities: Array.isArray(p.amenities) ? p.amenities : [],
              businessPermitUrl: p.business_permit_url || null
            };
          });
          setProperties(mappedProps);
        }
      } catch (refreshError) {
        console.error('Failed to refresh properties:', refreshError);
      }
    }
  };

  const loadReviews = async () => {
    try {
      const { data: reviewsData, error } = await supabase
        .from('reviews')
        .select(`
          id,
          property_id,
          client_name,
          client_email,
          rating,
          review_text,
          is_verified,
          created_at,
          properties!inner(title)
        `)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      
      const mappedReviews: Review[] = (reviewsData || []).map((r: any) => ({
        id: r.id,
        propertyId: r.property_id,
        propertyTitle: r.properties?.title || 'Unknown Property',
        clientName: r.client_name,
        clientEmail: r.client_email,
        rating: r.rating,
        reviewText: r.review_text,
        isVerified: r.is_verified,
        createdAt: r.created_at
      }));
      
      setReviews(mappedReviews);
    } catch (error) {
      console.error('Failed to load reviews:', error);
    }
  };

  const loadNotifications = async () => {
    try {
      const { data: notificationsData, error } = await supabase
        .from('notifications')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(50);
      
      if (error) throw error;
      
      setNotifications(notificationsData || []);
    } catch (error) {
      console.error('Failed to load notifications:', error);
    }
  };

  const verifyReview = async (reviewId: string, isVerified: boolean) => {
    try {
      const { error } = await supabase
        .from('reviews')
        .update({ is_verified: isVerified })
        .eq('id', reviewId);
      
      if (error) throw error;
      
      // Log admin action
      await supabase.rpc('log_admin_action', {
        admin_email_param: adminEmail,
        action_type_param: `review_${isVerified ? 'verify' : 'unverify'}`,
        target_type_param: 'review',
        target_id_param: reviewId,
        action_details_param: { isVerified }
      });
      
      // Update local state
      setReviews(reviews.map(review => 
        review.id === reviewId ? { ...review, isVerified } : review
      ));
      
      alert(`Review ${isVerified ? 'verified' : 'unverified'} successfully`);
    } catch (error) {
      console.error('Failed to update review verification:', error);
      alert('Failed to update review verification');
    }
  };

  const verifyLandlord = async (landlordId: string, isVerified: boolean) => {
    try {
      const { error } = await supabase
        .from('landlord_profiles')
        .update({ 
          is_verified: isVerified,
          verification_status: isVerified ? 'approved' : 'rejected'
        })
        .eq('id', landlordId);
      
      if (error) throw error;
      
      // Log admin action
      await supabase.rpc('log_admin_action', {
        admin_email_param: adminEmail,
        action_type_param: `landlord_${isVerified ? 'approve' : 'reject'}`,
        target_type_param: 'landlord',
        target_id_param: landlordId,
        action_details_param: { isVerified }
      });
      
      // Refresh landlord analytics
      loadLandlordAnalytics();
      
      alert(`Landlord ${isVerified ? 'approved' : 'rejected'} successfully`);
    } catch (error) {
      console.error('Failed to verify landlord:', error);
      alert('Failed to update landlord verification');
    }
  };

  const deleteReview = async (reviewId: string) => {
    const confirmed = window.confirm('Are you sure you want to delete this review? This action cannot be undone.');
    if (!confirmed) return;
    
    try {
      const { error } = await supabase
        .from('reviews')
        .delete()
        .eq('id', reviewId);
      
      if (error) throw error;
      
      // Log admin action
      try {
        await supabase.rpc('log_admin_action', {
          admin_email_param: adminEmail,
          action_type_param: 'review_delete',
          target_type_param: 'review',
          target_id_param: reviewId,
          action_details_param: { deleted: true }
        });
      } catch (logError) {
        console.warn('Failed to log admin action (non-critical):', logError);
      }
      
      // Remove from local state
      setReviews(reviews.filter(review => review.id !== reviewId));
      
      // Reload reviews to ensure stats are updated
      await loadReviews();
      
      alert('Review deleted successfully');
    } catch (error) {
      console.error('Failed to delete review:', error);
      alert('Failed to delete review');
    }
  };


  // Test XLSX functionality
  const testXLSX = () => {
    try {
      console.log('Testing XLSX library...');
      console.log('XLSX object:', XLSX);
      console.log('XLSX.utils:', XLSX.utils);
      console.log('XLSX.writeFile:', XLSX.writeFile);
      
      // Create a simple test workbook
      const testWorkbook = XLSX.utils.book_new();
      const testData = [['Test', 'Data'], ['Hello', 'World']];
      const testSheet = XLSX.utils.aoa_to_sheet(testData);
      XLSX.utils.book_append_sheet(testWorkbook, testSheet, 'Test');
      
      // Try to write a test file
      XLSX.writeFile(testWorkbook, 'test.xlsx');
      console.log('XLSX test successful!');
      return true;
    } catch (error) {
      console.error('XLSX test failed:', error);
      return false;
    }
  };

  // CSV Fallback function
  const generateCSVReport = (reportType: string, currentDate: string) => {
    try {
      let csvContent = '';
      let fileName = '';
      
      if (reportType === 'overview' || reportType === 'all') {
        csvContent = 'Metric,Value\n';
        csvContent += `Total Tenants,${stats.totalClients}\n`;
        csvContent += `Total Landlords,${stats.totalOwners}\n`;
        csvContent += `Total Properties,${stats.totalProperties}\n`;
        csvContent += `Total Bookings,${stats.totalBookings}\n`;
        fileName = `boardinghub_overview_${currentDate}.csv`;
      } else if (reportType === 'users') {
        csvContent = 'ID,Name,Email,Role,Status,Created At\n';
        (users || []).forEach(user => {
          const displayRole = user?.role === 'client' ? 'Tenant' : user?.role === 'owner' ? 'Landlord' : user?.role || '';
          csvContent += `${user?.id || ''},${user?.name || ''},${user?.email || ''},${displayRole},${user?.status || ''},${user?.createdAt ? new Date(user.createdAt).toLocaleDateString() : ''}\n`;
        });
        fileName = `boardinghub_users_${currentDate}.csv`;
      } else if (reportType === 'properties') {
        csvContent = 'ID,Title,Landlord,Location,Price,Status,Rating,Total Reviews,Featured,Created At\n';
        (properties || []).forEach(property => {
          csvContent += `${property?.id || ''},${property?.title || ''},${property?.owner || ''},${property?.location || ''},₱${(property?.price || 0).toLocaleString()},${property?.status || ''},${(property?.rating || 0).toFixed(2)},${property?.totalReviews || 0},${property?.isFeatured ? 'Yes' : 'No'},${property?.createdAt ? new Date(property.createdAt).toLocaleDateString() : ''}\n`;
        });
        fileName = `boardinghub_properties_${currentDate}.csv`;
      }
      
      // Download CSV
      const blob = new Blob([csvContent], { type: 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = fileName;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
      
      alert(`CSV report generated successfully: ${fileName}`);
    } catch (error) {
      console.error('CSV generation failed:', error);
      alert('Both Excel and CSV generation failed. Please check the console for details.');
    }
  };

  // Load Landlord Analytics
  const loadLandlordAnalytics = async () => {
    setLoadingAnalytics(true);
    try {
      // Fetch landlords with their properties and bookings
      const { data: landlords, error: landlordsError } = await supabase
        .from('landlord_profiles')
        .select('id, full_name, email, phone, is_verified, verification_status, created_at')
        .order('full_name');

      if (landlordsError) throw landlordsError;

      // For each landlord, get their properties and bookings
      const analyticsData = await Promise.all(
        (landlords || []).map(async (landlord: any) => {
          // Get properties for this landlord
          const { data: propertiesData } = await supabase
            .from('properties')
            .select('id, title, status, owner_email')
            .eq('owner_email', landlord.email);

          const propertyIds = (propertiesData || []).map(p => p.id);

          // Get all bookings for these properties
          let bookingsQuery = supabase
            .from('bookings')
            .select(`
              id,
              full_name,
              tenant_email,
              status,
              total_amount,
              room_id,
              bed_id,
              property_id,
              boarding_house_id,
              created_at
            `);
          
          // Filter by property_id or boarding_house_id
          let bookingsData: any[] = [];
          if (propertyIds.length > 0) {
            const { data, error } = await bookingsQuery.or(`property_id.in.(${propertyIds.join(',')}),boarding_house_id.in.(${propertyIds.join(',')})`);
            if (!error && data) {
              bookingsData = data;
            }
          }

          const approvedBookings = (bookingsData || []).filter(b => b.status === 'approved');
          const allBookings = bookingsData || [];

          // Count unique tenants
          const uniqueTenants = new Set(allBookings.map(b => b.tenant_email || b.full_name));
          
          // Count booked rooms and beds
          const bookedRooms = new Set(approvedBookings.map(b => b.room_id).filter(Boolean));
          const bookedBeds = new Set(approvedBookings.map(b => b.bed_id).filter(Boolean));

          // Calculate total revenue
          const totalRevenue = approvedBookings.reduce((sum, b) => sum + (Number(b.total_amount) || 0), 0);

          // Calculate stats for each property
          const propertiesWithStats = (propertiesData || []).map(property => {
            const propertyBookings = (bookingsData || []).filter(b => 
              b.property_id === property.id || b.boarding_house_id === property.id
            );
            const approvedPropertyBookings = propertyBookings.filter(b => b.status === 'approved');
            const revenue = approvedPropertyBookings.reduce((sum, b) => sum + (Number(b.total_amount) || 0), 0);
            
            // Get unique tenants for this property
            const propertyTenants = Array.from(new Set(propertyBookings.map(b => b.tenant_email || b.full_name)))
              .map(email => {
                const tenantBookings = propertyBookings.filter(b => (b.tenant_email || b.full_name) === email);
                return {
                  email,
                  name: tenantBookings[0]?.full_name || email,
                  bookingsCount: tenantBookings.length,
                  approvedBookings: tenantBookings.filter(b => b.status === 'approved').length,
                  totalSpent: tenantBookings
                    .filter(b => b.status === 'approved')
                    .reduce((sum, b) => sum + (Number(b.total_amount) || 0), 0)
                };
              });

            return {
              ...property,
              totalBookings: propertyBookings.length,
              approvedBookings: approvedPropertyBookings.length,
              revenue,
              tenants: propertyTenants
            };
          });

          // Sort properties by approved bookings count (descending)
          propertiesWithStats.sort((a, b) => b.approvedBookings - a.approvedBookings);

          return {
            landlordId: landlord.id,
            landlordName: landlord.full_name,
            landlordEmail: landlord.email,
            landlordPhone: landlord.phone || 'N/A',
            isVerified: landlord.is_verified,
            verificationStatus: landlord.verification_status,
            propertiesCount: propertiesData?.length || 0,
            properties: propertiesWithStats,
            totalTenants: uniqueTenants.size,
            tenants: Array.from(uniqueTenants).map(email => {
              const tenantBookings = allBookings.filter(b => (b.tenant_email || b.full_name) === email);
              return {
                email,
                name: tenantBookings[0]?.full_name || email,
                bookingsCount: tenantBookings.length,
                approvedBookings: tenantBookings.filter(b => b.status === 'approved').length
              };
            }),
            totalBookings: allBookings.length,
            approvedBookings: approvedBookings.length,
            bookedRooms: bookedRooms.size,
            bookedBeds: bookedBeds.size,
            totalRevenue,
            bookings: allBookings
          };
        })
      );

      setLandlordAnalytics(analyticsData);
    } catch (error) {
      console.error('Error loading landlord analytics:', error);
      alert('Failed to load landlord analytics. Please try again.');
    } finally {
      setLoadingAnalytics(false);
    }
  };

  // Report Generation Functions
  const generateExcelReport = async (reportType: 'overview' | 'users' | 'properties' | 'bookings' | 'reviews' | 'all') => {
    try {
      console.log('Starting report generation for type:', reportType);
      
      
      console.log('Available data:', { 
        users: users?.length || 0, 
        properties: properties?.length || 0, 
        bookings: bookings?.length || 0, 
        reviews: reviews?.length || 0 
      });
      
      // Test XLSX first
      if (!testXLSX()) {
        throw new Error('XLSX library test failed');
      }
      
      const workbook = XLSX.utils.book_new();
      const currentDate = new Date().toISOString().split('T')[0];
      
      if (reportType === 'overview' || reportType === 'all') {
        // Overview Report
        const overviewData = [
          ['Metric', 'Value'],
          ['Total Tenants', stats.totalClients],
          ['Total Landlords', stats.totalOwners],
          ['Total Properties', stats.totalProperties],
          ['Total Bookings', stats.totalBookings],
          ['Pending Bookings', stats.pendingBookings],
          ['Approved Bookings', stats.approvedBookings],
          ['Active Properties', stats.activeProperties],
          ['Inactive Properties', stats.inactiveProperties],
          ['Total Reviews', stats.totalReviews],
          ['Average Rating', (stats.averageRating || 0).toFixed(2)],
          ['Report Generated', new Date().toLocaleString()]
        ];
        
        const overviewSheet = XLSX.utils.aoa_to_sheet(overviewData);
        XLSX.utils.book_append_sheet(workbook, overviewSheet, 'Overview');
      }
      
      if (reportType === 'users' || reportType === 'all') {
        // Users Report
        const usersData = [
          ['ID', 'Name', 'Email', 'Role', 'Status', 'Created At']
        ];
        
        (users || []).forEach(user => {
          const displayRole = user?.role === 'client' ? 'Tenant' : user?.role === 'owner' ? 'Landlord' : user?.role || '';
          usersData.push([
            user?.id || '',
            user?.name || '',
            user?.email || '',
            displayRole,
            user?.status || '',
            user?.createdAt ? new Date(user.createdAt).toLocaleDateString() : ''
          ]);
        });
        
        const usersSheet = XLSX.utils.aoa_to_sheet(usersData);
        XLSX.utils.book_append_sheet(workbook, usersSheet, 'Users');
      }
      
      if (reportType === 'properties' || reportType === 'all') {
        // Properties Report
        const propertiesData = [
          ['ID', 'Title', 'Landlord', 'Location', 'Price', 'Status', 'Rating', 'Total Reviews', 'Featured', 'Created At']
        ];
        
        (properties || []).forEach(property => {
          propertiesData.push([
            property?.id || '',
            property?.title || '',
            property?.owner || '',
            property?.location || '',
            `₱${(property?.price || 0).toLocaleString()}`,
            property?.status || '',
            (property?.rating || 0).toFixed(2),
            (property?.totalReviews || 0).toString(),
            property?.isFeatured ? 'Yes' : 'No',
            property?.createdAt ? new Date(property.createdAt).toLocaleDateString() : ''
          ]);
        });
        
        const propertiesSheet = XLSX.utils.aoa_to_sheet(propertiesData);
        XLSX.utils.book_append_sheet(workbook, propertiesSheet, 'Properties');
      }
      
      if (reportType === 'bookings' || reportType === 'all') {
        // Bookings Report
        const bookingsData = [
          ['ID', 'Client Name', 'Property Title', 'Check In', 'Check Out', 'Total Amount', 'Status', 'Created At']
        ];
        
        (bookings || []).forEach(booking => {
          bookingsData.push([
            booking?.id || '',
            booking?.clientName || '',
            booking?.propertyTitle || '',
            booking?.checkInDate || '',
            booking?.checkOutDate || '',
            `₱${(booking?.totalAmount || 0).toLocaleString()}`,
            booking?.status || '',
            booking?.createdAt ? new Date(booking.createdAt).toLocaleDateString() : ''
          ]);
        });
        
        const bookingsSheet = XLSX.utils.aoa_to_sheet(bookingsData);
        XLSX.utils.book_append_sheet(workbook, bookingsSheet, 'Bookings');
      }
      
      if (reportType === 'reviews' || reportType === 'all') {
        // Reviews Report
        const reviewsData = [
          ['ID', 'Property Title', 'Client Name', 'Client Email', 'Rating', 'Review Text', 'Verified', 'Created At']
        ];
        
        (reviews || []).forEach(review => {
          reviewsData.push([
            review?.id || '',
            review?.propertyTitle || '',
            review?.clientName || '',
            review?.clientEmail || '',
            (review?.rating || 0).toString(),
            review?.reviewText || '',
            review?.isVerified ? 'Yes' : 'No',
            review?.createdAt ? new Date(review.createdAt).toLocaleDateString() : ''
          ]);
        });
        
        const reviewsSheet = XLSX.utils.aoa_to_sheet(reviewsData);
        XLSX.utils.book_append_sheet(workbook, reviewsSheet, 'Reviews');
      }
      
      // Check if XLSX is available
      if (typeof XLSX === 'undefined' || !XLSX.writeFile) {
        throw new Error('XLSX library not properly loaded');
      }
      
      // Generate and download the file
      const fileName = `boardinghub_report_${reportType}_${currentDate}.xlsx`;
      console.log('Attempting to write file:', fileName);
      
      try {
        XLSX.writeFile(workbook, fileName);
        console.log('File written successfully');
      } catch (writeError) {
        console.error('XLSX writeFile failed:', writeError);
        // Fallback to CSV if Excel fails
        console.log('Attempting CSV fallback...');
        generateCSVReport(reportType, currentDate);
        return;
      }
      
      // Log admin action
      try {
        await supabase.rpc('log_admin_action', {
          admin_email_param: adminEmail,
          action_type_param: 'generate_report',
          target_type_param: 'report',
          target_id_param: reportType,
          action_details_param: { reportType, fileName }
        });
      } catch (logError) {
        console.warn('Failed to log admin action:', logError);
      }
      
      alert(`Report generated successfully: ${fileName}`);
    } catch (error) {
      console.error('Failed to generate report:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      const errorStack = error instanceof Error ? error.stack : 'No stack trace available';
      
      console.error('Error details:', {
        message: errorMessage,
        stack: errorStack,
        reportType,
        dataAvailable: {
          users: users?.length || 0,
          properties: properties?.length || 0,
          bookings: bookings?.length || 0,
          reviews: reviews?.length || 0
        }
      });
      alert(`Failed to generate report: ${errorMessage}`);
    }
  };

  const generatePDFReport = async (reportType: 'overview' | 'users' | 'properties' | 'bookings' | 'reviews' | 'all') => {
    try {
      const doc = new jsPDF();
      const currentDate = new Date().toISOString().split('T')[0];
      let startY = 20;
      
      // Add title
      doc.setFontSize(18);
      doc.text('BoardingHub Admin Report', 14, 15);
      
      // Add report type and date
      doc.setFontSize(12);
      const reportTypeLabel = reportType === 'all' ? 'Complete Report' : 
                             reportType === 'users' ? 'Users Report' :
                             reportType === 'properties' ? 'Properties Report' :
                             reportType === 'bookings' ? 'Bookings Report' :
                             reportType === 'reviews' ? 'Reviews Report' : 'Overview Report';
      doc.text(reportTypeLabel, 14, 22);
      doc.setFontSize(10);
      doc.text(`Generated: ${new Date().toLocaleString()}`, 14, 28);
      startY = 35;

      if (reportType === 'overview' || reportType === 'all') {
        // Overview Report
        const overviewData = [
          ['Metric', 'Value'],
          ['Total Tenants', stats.totalClients.toString()],
          ['Total Landlords', stats.totalOwners.toString()],
          ['Total Properties', stats.totalProperties.toString()],
          ['Total Bookings', stats.totalBookings.toString()],
          ['Pending Bookings', stats.pendingBookings.toString()],
          ['Approved Bookings', stats.approvedBookings.toString()],
          ['Active Properties', stats.activeProperties.toString()],
          ['Inactive Properties', stats.inactiveProperties.toString()],
          ['Total Reviews', stats.totalReviews.toString()],
          ['Average Rating', (stats.averageRating || 0).toFixed(2)]
        ];

        (doc as any).autoTable({
          head: [overviewData[0]],
          body: overviewData.slice(1),
          startY: startY,
          styles: { fontSize: 9 },
          headStyles: { fillColor: [66, 139, 202] }
        });
        startY = (doc as any).lastAutoTable.finalY + 15;
      }

      if (reportType === 'users' || reportType === 'all') {
        if (reportType === 'all' && startY > 250) {
          doc.addPage();
          startY = 20;
        }
        
        const usersData = (users || []).map(user => {
          const displayRole = user?.role === 'client' ? 'Tenant' : user?.role === 'owner' ? 'Landlord' : user?.role || '';
          return [
            user?.id || '',
            user?.name || '',
            user?.email || '',
            displayRole,
            user?.status || '',
            user?.createdAt ? new Date(user.createdAt).toLocaleDateString() : ''
          ];
        });

        (doc as any).autoTable({
          head: [['ID', 'Name', 'Email', 'Role', 'Status', 'Created At']],
          body: usersData,
          startY: startY,
          styles: { fontSize: 8 },
          headStyles: { fillColor: [66, 139, 202] },
          columnStyles: {
            0: { cellWidth: 30 },
            1: { cellWidth: 40 },
            2: { cellWidth: 50 },
            3: { cellWidth: 25 },
            4: { cellWidth: 20 },
            5: { cellWidth: 30 }
          }
        });
        startY = (doc as any).lastAutoTable.finalY + 15;
      }

      if (reportType === 'properties' || reportType === 'all') {
        if (reportType === 'all' && startY > 250) {
          doc.addPage();
          startY = 20;
        }
        
        const propertiesData = (properties || []).map(property => [
          property?.id || '',
          property?.title || '',
          property?.owner || '',
          property?.location || '',
          `₱${(property?.price || 0).toLocaleString()}`,
          property?.status || '',
          (property?.rating || 0).toFixed(2),
          (property?.totalReviews || 0).toString(),
          property?.isFeatured ? 'Yes' : 'No',
          property?.createdAt ? new Date(property.createdAt).toLocaleDateString() : ''
        ]);

        (doc as any).autoTable({
          head: [['ID', 'Title', 'Landlord', 'Location', 'Price', 'Status', 'Rating', 'Reviews', 'Featured', 'Created At']],
          body: propertiesData,
          startY: startY,
          styles: { fontSize: 7 },
          headStyles: { fillColor: [66, 139, 202] },
          columnStyles: {
            0: { cellWidth: 25 },
            1: { cellWidth: 35 },
            2: { cellWidth: 30 },
            3: { cellWidth: 30 },
            4: { cellWidth: 25 },
            5: { cellWidth: 20 },
            6: { cellWidth: 15 },
            7: { cellWidth: 15 },
            8: { cellWidth: 15 },
            9: { cellWidth: 25 }
          }
        });
        startY = (doc as any).lastAutoTable.finalY + 15;
      }

      if (reportType === 'bookings' || reportType === 'all') {
        if (reportType === 'all' && startY > 250) {
          doc.addPage();
          startY = 20;
        }
        
        const bookingsData = (bookings || []).map(booking => [
          booking?.id || '',
          booking?.clientName || '',
          booking?.propertyTitle || '',
          booking?.checkInDate || '',
          booking?.checkOutDate || '',
          `₱${(booking?.totalAmount || 0).toLocaleString()}`,
          booking?.status || '',
          booking?.createdAt ? new Date(booking.createdAt).toLocaleDateString() : ''
        ]);

        (doc as any).autoTable({
          head: [['ID', 'Client Name', 'Property Title', 'Check In', 'Check Out', 'Total Amount', 'Status', 'Created At']],
          body: bookingsData,
          startY: startY,
          styles: { fontSize: 8 },
          headStyles: { fillColor: [66, 139, 202] },
          columnStyles: {
            0: { cellWidth: 30 },
            1: { cellWidth: 35 },
            2: { cellWidth: 40 },
            3: { cellWidth: 30 },
            4: { cellWidth: 30 },
            5: { cellWidth: 30 },
            6: { cellWidth: 25 },
            7: { cellWidth: 30 }
          }
        });
        startY = (doc as any).lastAutoTable.finalY + 15;
      }

      if (reportType === 'reviews' || reportType === 'all') {
        if (reportType === 'all' && startY > 250) {
          doc.addPage();
          startY = 20;
        }
        
        const reviewsData = (reviews || []).map(review => [
          review?.id || '',
          review?.propertyTitle || '',
          review?.clientName || '',
          review?.clientEmail || '',
          (review?.rating || 0).toString(),
          (review?.reviewText || '').substring(0, 50) + (review?.reviewText?.length > 50 ? '...' : ''),
          review?.isVerified ? 'Yes' : 'No',
          review?.createdAt ? new Date(review.createdAt).toLocaleDateString() : ''
        ]);

        (doc as any).autoTable({
          head: [['ID', 'Property Title', 'Client Name', 'Client Email', 'Rating', 'Review Text', 'Verified', 'Created At']],
          body: reviewsData,
          startY: startY,
          styles: { fontSize: 7 },
          headStyles: { fillColor: [66, 139, 202] },
          columnStyles: {
            0: { cellWidth: 25 },
            1: { cellWidth: 35 },
            2: { cellWidth: 30 },
            3: { cellWidth: 40 },
            4: { cellWidth: 15 },
            5: { cellWidth: 40 },
            6: { cellWidth: 20 },
            7: { cellWidth: 25 }
          }
        });
      }

      // Save the PDF
      const fileName = `boardinghub_report_${reportType}_${currentDate}.pdf`;
      doc.save(fileName);

      // Log admin action
      try {
        await supabase.rpc('log_admin_action', {
          admin_email_param: adminEmail,
          action_type_param: 'generate_report',
          target_type_param: 'report',
          target_id_param: reportType,
          action_details_param: { reportType, fileName, format: 'PDF' }
        });
      } catch (logError) {
        console.warn('Failed to log admin action:', logError);
      }

      alert(`PDF report generated successfully: ${fileName}`);
    } catch (error) {
      console.error('Failed to generate PDF report:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      alert(`Failed to generate PDF report: ${errorMessage}`);
    }
  };

  if (!authorized) {
    return null;
  }

  return (
    <div className="min-h-screen w-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 overflow-y-auto">
        {/* Report Generation Modal */}
        {showReportGeneration && (
          <ReportGeneration onClose={() => setShowReportGeneration(false)} />
        )}

        {/* Header */}
        <div className="backdrop-blur-xl bg-white/70 rounded-3xl shadow-2xl border border-white/30 p-3 sm:p-4 md:p-6 mb-3 sm:mb-4 md:mb-6 sticky top-0 z-40">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-4">
            <div className="text-left">
              <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-gray-900 mb-1 sm:mb-2">
                Admin Dashboard
              </h1>
              <p className="text-gray-600 font-medium text-xs sm:text-sm md:text-base">
                System overview and management
              </p>
              {/* Signed-in details removed as requested */}
            </div>
            <div className="flex flex-wrap items-center gap-2 sm:gap-4 w-full sm:w-auto">
              <NotificationSystem userEmail={user?.email || ''} userRole="admin" />
              

      {/* Generate Report Dropdown */}
      <div className="relative">
        <button 
          onClick={() => setReportDropdownOpen(!reportDropdownOpen)} 
          className="backdrop-blur-md bg-blue-100/70 text-blue-700 px-4 py-2 rounded-xl hover:bg-blue-200/80 transition-all duration-200 flex items-center space-x-2 border border-blue-200/30 shadow-sm"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          <span className="font-medium">Generate Report</span>
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </button>
                
                {reportDropdownOpen && (
                  <div className="absolute right-0 mt-2 w-56 backdrop-blur-xl bg-white/80 rounded-2xl shadow-2xl border border-white/30 py-2 z-50">
                    <button 
                      onClick={() => { setShowReportGeneration(true); setReportDropdownOpen(false); }} 
                      className="w-full text-left px-4 py-2 hover:bg-blue-50/50 backdrop-blur-sm flex items-center space-x-2 border-b border-white/20 mb-1"
                    >
                      <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                      <span className="font-semibold text-blue-700">Advanced Report Generator</span>
                    </button>
                    <div className="px-2 py-1 text-xs text-gray-500 border-b border-white/20 mb-1">Quick Reports (Excel):</div>
                    <button 
                      onClick={() => { generateExcelReport('users'); setReportDropdownOpen(false); }} 
                      className="w-full text-left px-4 py-2 hover:bg-white/40 backdrop-blur-sm transition-colors flex items-center space-x-2"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
                      </svg>
                      <span>Users Report (Excel)</span>
                    </button>
                    <button 
                      onClick={() => { generateExcelReport('properties'); setReportDropdownOpen(false); }} 
                      className="w-full text-left px-4 py-2 hover:bg-white/40 backdrop-blur-sm transition-colors flex items-center space-x-2"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                      </svg>
                      <span>Properties Report (Excel)</span>
                    </button>
                    <button 
                      onClick={() => { generateExcelReport('bookings'); setReportDropdownOpen(false); }} 
                      className="w-full text-left px-4 py-2 hover:bg-white/40 backdrop-blur-sm transition-colors flex items-center space-x-2"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                      <span>Bookings Report (Excel)</span>
                    </button>
                    <button 
                      onClick={() => { generateExcelReport('reviews'); setReportDropdownOpen(false); }} 
                      className="w-full text-left px-4 py-2 hover:bg-white/40 backdrop-blur-sm transition-colors flex items-center space-x-2"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
                      </svg>
                      <span>Reviews Report (Excel)</span>
                    </button>
                    <hr className="my-1" />
                    <button 
                      onClick={() => { generateExcelReport('all'); setReportDropdownOpen(false); }} 
                      className="w-full text-left px-4 py-2 hover:bg-gray-50 flex items-center space-x-2 text-green-600 font-semibold"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <span>Complete Report - Excel (All Data)</span>
                    </button>
                    <hr className="my-2" />
                    <div className="px-2 py-1 text-xs text-gray-500 border-b border-white/20 mb-1">Quick Reports (PDF):</div>
                    <button 
                      onClick={() => { generatePDFReport('users'); setReportDropdownOpen(false); }} 
                      className="w-full text-left px-4 py-2 hover:bg-white/40 backdrop-blur-sm transition-colors flex items-center space-x-2"
                    >
                      <svg className="w-4 h-4 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                      </svg>
                      <span>Users Report (PDF)</span>
                    </button>
                    <button 
                      onClick={() => { generatePDFReport('properties'); setReportDropdownOpen(false); }} 
                      className="w-full text-left px-4 py-2 hover:bg-white/40 backdrop-blur-sm transition-colors flex items-center space-x-2"
                    >
                      <svg className="w-4 h-4 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                      </svg>
                      <span>Properties Report (PDF)</span>
                    </button>
                    <button 
                      onClick={() => { generatePDFReport('bookings'); setReportDropdownOpen(false); }} 
                      className="w-full text-left px-4 py-2 hover:bg-white/40 backdrop-blur-sm transition-colors flex items-center space-x-2"
                    >
                      <svg className="w-4 h-4 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                      </svg>
                      <span>Bookings Report (PDF)</span>
                    </button>
                    <button 
                      onClick={() => { generatePDFReport('reviews'); setReportDropdownOpen(false); }} 
                      className="w-full text-left px-4 py-2 hover:bg-white/40 backdrop-blur-sm transition-colors flex items-center space-x-2"
                    >
                      <svg className="w-4 h-4 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                      </svg>
                      <span>Reviews Report (PDF)</span>
                    </button>
                    <hr className="my-1" />
                    <button 
                      onClick={() => { generatePDFReport('all'); setReportDropdownOpen(false); }} 
                      className="w-full text-left px-4 py-2 hover:bg-gray-50 flex items-center space-x-2 text-red-600 font-semibold"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <span>Complete Report - PDF (All Data)</span>
                    </button>
                  </div>
                )}
              </div>
              
              <button onClick={() => setProfileOpen(!profileOpen)} className="backdrop-blur-md bg-primary-100/70 text-primary-700 px-4 py-2 rounded-xl hover:bg-primary-200/80 transition-all duration-200 flex items-center space-x-2 border border-primary-200/30 shadow-sm">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              </button>
              {profileOpen && (
                <div className="absolute right-0 mt-2 w-48 backdrop-blur-xl bg-white/80 rounded-2xl shadow-2xl border border-white/30 py-2 z-50">
                  <button onClick={handleLogout} className="w-full text-left px-4 py-3 hover:bg-white/40 backdrop-blur-sm transition-colors text-red-600 flex items-center space-x-3">
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
        <div className="backdrop-blur-xl bg-white/70 rounded-3xl shadow-2xl border border-white/30 p-1 sm:p-2 mb-3 sm:mb-4 md:mb-6">
          <div className="flex flex-wrap gap-1">
            <button
              onClick={() => setActiveTab('overview')}
              className={`px-2 sm:px-3 md:px-6 py-2 sm:py-3 md:py-4 font-semibold rounded-lg sm:rounded-xl transition-all duration-200 text-xs sm:text-sm md:text-base ${
                activeTab === 'overview'
                  ? 'bg-primary-600 text-white shadow-lg'
                  : 'text-gray-600 hover:text-gray-800 hover:bg-white/40 backdrop-blur-sm'
              }`}
            >
              <span className="flex items-center space-x-1 sm:space-x-2">
                <svg className="w-3 h-3 sm:w-4 sm:h-4 md:w-5 md:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
                <span className="hidden sm:inline">Overview</span>
                <span className="sm:hidden">Overview</span>
              </span>
            </button>
            <button
              onClick={() => setActiveTab('users')}
              className={`px-2 sm:px-3 md:px-6 py-2 sm:py-3 md:py-4 font-semibold rounded-lg sm:rounded-xl transition-all duration-200 text-xs sm:text-sm md:text-base ${
                activeTab === 'users'
                  ? 'bg-primary-600 text-white shadow-lg'
                  : 'text-gray-600 hover:text-gray-800 hover:bg-white/40 backdrop-blur-sm'
              }`}
            >
              <span className="flex items-center space-x-1 sm:space-x-2">
                <svg className="w-3 h-3 sm:w-4 sm:h-4 md:w-5 md:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
                </svg>
                <span className="hidden lg:inline">Tenants & Landlords</span>
                <span className="hidden sm:inline lg:hidden">Users</span>
                <span className="sm:hidden">Users</span>
                <span className="hidden md:inline">({users.length})</span>
              </span>
            </button>
            <button
              onClick={() => setActiveTab('properties')}
              className={`px-2 sm:px-3 md:px-6 py-2 sm:py-3 md:py-4 font-semibold rounded-lg sm:rounded-xl transition-all duration-200 text-xs sm:text-sm md:text-base ${
                activeTab === 'properties'
                  ? 'bg-primary-600 text-white shadow-lg'
                  : 'text-gray-600 hover:text-gray-800 hover:bg-white/40 backdrop-blur-sm'
              }`}
            >
              <span className="flex items-center space-x-1 sm:space-x-2">
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
              className={`px-2 sm:px-3 md:px-6 py-2 sm:py-3 md:py-4 font-semibold rounded-lg sm:rounded-xl transition-all duration-200 text-xs sm:text-sm md:text-base ${
                activeTab === 'bookings'
                  ? 'bg-primary-600 text-white shadow-lg'
                  : 'text-gray-600 hover:text-gray-800 hover:bg-white/40 backdrop-blur-sm'
              }`}
            >
              <span className="flex items-center space-x-1 sm:space-x-2">
                <svg className="w-3 h-3 sm:w-4 sm:h-4 md:w-5 md:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                <span className="hidden sm:inline">Bookings</span>
                <span className="sm:hidden">Books</span>
                <span className="hidden md:inline">({bookings.length})</span>
              </span>
            </button>
            <button
              onClick={() => { setActiveTab('reviews'); loadReviews(); }}
              className={`px-2 sm:px-3 md:px-6 py-2 sm:py-3 md:py-4 font-semibold rounded-lg sm:rounded-xl transition-all duration-200 text-xs sm:text-sm md:text-base ${
                activeTab === 'reviews'
                  ? 'bg-primary-600 text-white shadow-lg'
                  : 'text-gray-600 hover:text-gray-800 hover:bg-white/40 backdrop-blur-sm'
              }`}
            >
              <span className="flex items-center space-x-1 sm:space-x-2">
                <svg className="w-3 h-3 sm:w-4 sm:h-4 md:w-5 md:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
                </svg>
                <span className="hidden sm:inline">Reviews</span>
                <span className="sm:hidden">Reviews</span>
                <span className="hidden md:inline">({reviews.length})</span>
              </span>
            </button>
            <button
              onClick={() => { setActiveTab('notifications'); loadNotifications(); }}
              className={`px-2 sm:px-3 md:px-6 py-2 sm:py-3 md:py-4 font-semibold rounded-lg sm:rounded-xl transition-all duration-200 text-xs sm:text-sm md:text-base ${
                activeTab === 'notifications'
                  ? 'bg-primary-600 text-white shadow-lg'
                  : 'text-gray-600 hover:text-gray-800 hover:bg-white/40 backdrop-blur-sm'
              }`}
            >
              <span className="flex items-center space-x-1 sm:space-x-2">
                <svg className="w-3 h-3 sm:w-4 sm:h-4 md:w-5 md:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2 2 0 0118 14.158V11a6 6 0 10-12 0v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                </svg>
                <span className="hidden sm:inline">Notifications</span>
                <span className="sm:hidden">Notifs</span>
                <span className="hidden md:inline">({notifications.length})</span>
              </span>
            </button>
            <button
              onClick={() => setActiveTab('maps')}
              className={`px-2 sm:px-3 md:px-6 py-2 sm:py-3 md:py-4 font-semibold rounded-lg sm:rounded-xl transition-all duration-200 text-xs sm:text-sm md:text-base ${
                activeTab === 'maps'
                  ? 'bg-primary-600 text-white shadow-lg'
                  : 'text-gray-600 hover:text-gray-800 hover:bg-white/40 backdrop-blur-sm'
              }`}
            >
              <span className="flex items-center space-x-1 sm:space-x-2">
                <svg className="w-3 h-3 sm:w-4 sm:h-4 md:w-5 md:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
                </svg>
                <span>Maps</span>
              </span>
            </button>
            <button
              onClick={() => { setActiveTab('analytics'); loadLandlordAnalytics(); }}
              className={`px-2 sm:px-3 md:px-6 py-2 sm:py-3 md:py-4 font-semibold rounded-lg sm:rounded-xl transition-all duration-200 text-xs sm:text-sm md:text-base ${
                activeTab === 'analytics'
                  ? 'bg-primary-600 text-white shadow-lg'
                  : 'text-gray-600 hover:text-gray-800 hover:bg-white/40 backdrop-blur-sm'
              }`}
            >
              <span className="flex items-center space-x-1 sm:space-x-2">
                <svg className="w-3 h-3 sm:w-4 sm:h-4 md:w-5 md:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
                <span className="hidden sm:inline">Analytics</span>
                <span className="sm:hidden">Analytics</span>
              </span>
            </button>
          </div>
        </div>

        {/* Overview Tab */}
        {activeTab === 'overview' && (
          <div>
            <div className="backdrop-blur-xl bg-white/70 rounded-3xl shadow-2xl border border-white/30 p-6 mb-6">
              <h2 className="text-2xl font-bold text-gray-900 mb-2 drop-shadow-sm">System Overview</h2>
              <p className="text-gray-600">Real-time statistics and system performance metrics</p>
            </div>
            
            {/* Stats Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-3 sm:gap-4 md:gap-6 mb-4 sm:mb-6">
              <div className="backdrop-blur-md bg-gradient-to-br from-primary-50/80 to-primary-100/80 rounded-3xl p-6 text-center border border-primary-200/50 hover:shadow-2xl transition-all duration-300">
                <div className="w-12 h-12 bg-primary-600 rounded-full flex items-center justify-center mx-auto mb-3">
                  <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
                  </svg>
                </div>
                <div className="text-3xl font-bold text-primary-600 mb-1">{stats.totalClients}</div>
                <div className="text-sm font-semibold text-primary-800">Total Tenants</div>
              </div>
              <div className="bg-gradient-to-br from-primary-50 to-primary-100 rounded-2xl p-6 text-center border border-primary-200 hover:shadow-lg transition-shadow duration-300">
                <div className="w-12 h-12 bg-primary-600 rounded-full flex items-center justify-center mx-auto mb-3">
                  <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                  </svg>
                </div>
                <div className="text-3xl font-bold text-primary-600 mb-1">{stats.totalOwners}</div>
                <div className="text-sm font-semibold text-primary-800">Total Landlords</div>
              </div>
              <div className="bg-gradient-to-br from-primary-50 to-primary-100 rounded-2xl p-6 text-center border border-primary-200 hover:shadow-lg transition-shadow duration-300">
                <div className="w-12 h-12 bg-primary-600 rounded-full flex items-center justify-center mx-auto mb-3">
                  <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                </div>
                <div className="text-3xl font-bold text-primary-600 mb-1">{stats.totalProperties}</div>
                <div className="text-sm font-semibold text-primary-800">Total Properties</div>
              </div>
              <div className="bg-gradient-to-br from-primary-50 to-primary-100 rounded-2xl p-6 text-center border border-primary-200 hover:shadow-lg transition-shadow duration-300">
                <div className="w-12 h-12 bg-primary-600 rounded-full flex items-center justify-center mx-auto mb-3">
                  <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                </div>
                <div className="text-3xl font-bold text-primary-600 mb-1">{stats.totalBookings}</div>
                <div className="text-sm font-semibold text-primary-800">Total Bookings</div>
              </div>
              <div className="bg-gradient-to-br from-orange-50 to-orange-100 rounded-2xl p-6 text-center border border-orange-200 hover:shadow-lg transition-shadow duration-300">
                <div className="w-12 h-12 bg-orange-600 rounded-full flex items-center justify-center mx-auto mb-3">
                  <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div className="text-3xl font-bold text-orange-600 mb-1">{stats.pendingBookings}</div>
                <div className="text-sm font-semibold text-orange-800">Pending</div>
              </div>
              <div className="bg-gradient-to-br from-primary-50 to-primary-100 rounded-2xl p-6 text-center border border-primary-200 hover:shadow-lg transition-shadow duration-300">
                <div className="w-12 h-12 bg-primary-600 rounded-full flex items-center justify-center mx-auto mb-3">
                  <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <div className="text-3xl font-bold text-primary-600 mb-1">{stats.approvedBookings}</div>
                <div className="text-sm font-semibold text-primary-800">Approved</div>
              </div>
              <div className="bg-gradient-to-br from-primary-50 to-primary-100 rounded-2xl p-6 text-center border border-primary-200 hover:shadow-lg transition-shadow duration-300">
                <div className="w-12 h-12 bg-primary-600 rounded-full flex items-center justify-center mx-auto mb-3">
                  <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div className="text-3xl font-bold text-indigo-600 mb-1">₱{stats.totalRevenue.toLocaleString()}</div>
                <div className="text-sm font-semibold text-indigo-800">Total Sales</div>
              </div>
              <div className="bg-gradient-to-br from-primary-50 to-primary-100 rounded-2xl p-6 text-center border border-primary-200 hover:shadow-lg transition-shadow duration-300">
                <div className="w-12 h-12 bg-primary-600 rounded-full flex items-center justify-center mx-auto mb-3">
                  <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
                  </svg>
                </div>
                <div className="text-3xl font-bold text-primary-600 mb-1">{stats.averageRating.toFixed(1)}</div>
                <div className="text-sm font-semibold text-primary-800">Avg Rating</div>
              </div>
            </div>

            {/* Analytics */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="backdrop-blur-xl bg-white/70 rounded-3xl shadow-2xl border border-white/30 p-6">
                <h3 className="text-xl font-bold text-gray-900 mb-6 drop-shadow-sm">Daily Registrations (14 days)</h3>
                <div className="h-64">
                  <Line
                    data={{
                      labels: dailyRegistrations.map(d => d.date.slice(5)),
                      datasets: [{
                        label: 'Registrations',
                        data: dailyRegistrations.map(d => d.count),
                        borderColor: 'rgba(37,99,235,1)',
                        backgroundColor: 'rgba(37,99,235,0.25)',
                        fill: true,
                        tension: 0.35,
                      }]
                    }}
                    options={{ plugins: { legend: { display: false } }, responsive: true, maintainAspectRatio: false }}
                  />
                </div>
              </div>

              <div className="backdrop-blur-xl bg-white/70 rounded-3xl shadow-2xl border border-white/30 p-6">
                <h3 className="text-xl font-bold text-gray-900 mb-6 drop-shadow-sm">Bookings by Status</h3>
                <div className="h-64">
                  <Bar
                    data={{
                      labels: ['Pending','Approved','Rejected'],
                      datasets: [{
                        label: 'Bookings',
                        data: [bookingStatusCounts.pending, bookingStatusCounts.approved, bookingStatusCounts.rejected],
                        backgroundColor: ['#f59e0b','#10b981','#ef4444'],
                        borderColor: ['#b45309','#047857','#b91c1c'],
                        borderWidth: 1,
                      }]
                    }}
                    options={{ plugins: { legend: { display: false } }, responsive: true, maintainAspectRatio: false }}
                  />
                </div>
              </div>
            </div>

            <div className="backdrop-blur-xl bg-white/70 rounded-3xl shadow-2xl border border-white/30 p-6 mt-6">
              <h3 className="text-xl font-bold text-gray-900 mb-2 drop-shadow-sm">Users by Role</h3>
              <p className="text-sm text-gray-600 mb-4">Distribution of registered users</p>
              <div className="h-64 max-w-xl mx-auto">
                <Pie
                  data={{
                    labels: ['Tenants','Landlords'],
                    datasets: [{
                      data: [stats.totalClients, stats.totalOwners],
                      backgroundColor: ['#3b82f6','#10b981'],
                      borderColor: ['#1d4ed8','#047857'],
                      borderWidth: 1,
                    }]
                  }}
                  options={{
                    plugins: {
                      legend: { display: false },
                      datalabels: {
                        color: '#fff',
                        font: { weight: 'bold' as const },
                        formatter: (value: number, ctx: any) => {
                          const data = ctx.chart.data.datasets[0].data as number[];
                          const total = data.reduce((a, b) => a + b, 0) || 1;
                          const pct = Math.round((value / total) * 100);
                          return `${pct}%`;
                        },
                      },
                    },
                    responsive: true,
                    maintainAspectRatio: false,
                  }}
                />
              </div>
              {(() => {
                const total = (stats.totalClients || 0) + (stats.totalOwners || 0);
                const cPct = total ? Math.round((stats.totalClients / total) * 100) : 0;
                const oPct = total ? Math.round((stats.totalOwners / total) * 100) : 0;
                return (
                  <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-3 max-w-xl mx-auto">
                    <div className="flex items-center justify-between backdrop-blur-md bg-blue-50/70 border border-blue-200/50 rounded-xl px-3 py-2">
                      <div className="flex items-center gap-2">
                        <span className="inline-block w-3 h-3 rounded-sm bg-blue-500"></span>
                        <span className="text-sm font-semibold text-blue-800">Tenants</span>
                      </div>
                      <div className="text-sm font-bold text-blue-700">{cPct}% <span className="text-blue-500 font-medium">({stats.totalClients})</span></div>
                    </div>
                    <div className="flex items-center justify-between backdrop-blur-md bg-emerald-50/70 border border-emerald-200/50 rounded-xl px-3 py-2">
                      <div className="flex items-center gap-2">
                        <span className="inline-block w-3 h-3 rounded-sm bg-emerald-500"></span>
                        <span className="text-sm font-semibold text-emerald-800">Landlords</span>
                      </div>
                      <div className="text-sm font-bold text-emerald-700">{oPct}% <span className="text-emerald-500 font-medium">({stats.totalOwners})</span></div>
                    </div>
                  </div>
                );
              })()}
            </div>
          </div>
        )}

        {/* Users Tab */}
        {activeTab === 'users' && (
          <div>
            <div className="backdrop-blur-xl bg-white/70 rounded-3xl shadow-2xl border border-white/30 p-6 mb-6">
              <h2 className="text-2xl font-bold text-gray-900 mb-2 drop-shadow-sm">User Management</h2>
              <p className="text-gray-600">Manage user accounts and permissions</p>
            </div>
            <div className="backdrop-blur-xl bg-white/70 rounded-3xl shadow-2xl border border-white/30 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full min-w-[640px]">
                  <thead className="backdrop-blur-md bg-white/50">
                    <tr>
                      <th className="px-3 sm:px-4 md:px-6 py-3 sm:py-4 text-left text-[10px] sm:text-xs font-semibold text-gray-600 uppercase tracking-wider">Name</th>
                      <th className="px-3 sm:px-4 md:px-6 py-3 sm:py-4 text-left text-[10px] sm:text-xs font-semibold text-gray-600 uppercase tracking-wider">Email</th>
                      <th className="px-3 sm:px-4 md:px-6 py-3 sm:py-4 text-left text-[10px] sm:text-xs font-semibold text-gray-600 uppercase tracking-wider">Role</th>
                      <th className="px-3 sm:px-4 md:px-6 py-3 sm:py-4 text-left text-[10px] sm:text-xs font-semibold text-gray-600 uppercase tracking-wider">Status</th>
                      <th className="px-3 sm:px-4 md:px-6 py-3 sm:py-4 text-left text-[10px] sm:text-xs font-semibold text-gray-600 uppercase tracking-wider">Verified</th>
                      <th className="px-3 sm:px-4 md:px-6 py-3 sm:py-4 text-left text-[10px] sm:text-xs font-semibold text-gray-600 uppercase tracking-wider hidden md:table-cell">Created</th>
                      <th className="px-3 sm:px-4 md:px-6 py-3 sm:py-4 text-left text-[10px] sm:text-xs font-semibold text-gray-600 uppercase tracking-wider">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {users.map((user) => (
                      <tr key={user.id} className="hover:bg-white/40 backdrop-blur-sm transition-colors duration-200">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center mr-3">
                              <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                              </svg>
                            </div>
                            <div className="font-semibold text-gray-900">{user.name}</div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-gray-600">{user.email}</td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                            user.role === 'client' ? 'bg-blue-100 text-blue-800' :
                            user.role === 'owner' ? 'bg-green-100 text-green-800' :
                            'bg-purple-100 text-purple-800'
                          }`}>
                            {user.role === 'client' ? 'Tenant' : user.role === 'owner' ? 'Landlord' : user.role}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                            user.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                          }`}>
                            {user.status}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                            user.is_verified ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                          }`}>
                            {user.is_verified ? 'Verified' : 'Unverified'}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-gray-600">{user.createdAt}</td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex flex-col gap-2">
                            <button
                              onClick={() => handleUserStatusChange(user.id, user.status === 'active' ? 'inactive' : 'active')}
                              className={`px-4 py-2 rounded-lg text-xs font-semibold transition-all duration-200 ${
                                user.status === 'active' 
                                  ? 'bg-red-100 text-red-800 hover:bg-red-200' 
                                  : 'bg-green-100 text-green-800 hover:bg-green-200'
                              }`}
                            >
                              {user.status === 'active' ? 'Deactivate' : 'Activate'}
                            </button>
                            <button
                              onClick={() => handleUserVerificationChange(user.id, !user.is_verified)}
                              className={`px-4 py-2 rounded-lg text-xs font-semibold transition-all duration-200 ${
                                user.is_verified 
                                  ? 'bg-yellow-100 text-yellow-800 hover:bg-yellow-200' 
                                  : 'bg-blue-100 text-blue-800 hover:bg-blue-200'
                              }`}
                            >
                              {user.is_verified ? 'Unverify' : 'Verify'}
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* Properties Tab */}
        {activeTab === 'properties' && (
          <div>
            <div className="backdrop-blur-xl bg-white/70 rounded-3xl shadow-2xl border border-white/30 p-6 mb-6">
              <h2 className="text-2xl font-bold text-gray-900 mb-2 drop-shadow-sm">Property Management</h2>
              <p className="text-gray-600">Monitor and manage all property listings</p>
            </div>
            <div className="backdrop-blur-xl bg-white/70 rounded-3xl shadow-2xl border border-white/30 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full min-w-[800px]">
                  <thead className="backdrop-blur-md bg-white/50">
                    <tr>
                      <th className="px-3 sm:px-4 md:px-6 py-3 sm:py-4 text-left text-[10px] sm:text-xs font-semibold text-gray-600 uppercase tracking-wider">Title</th>
                      <th className="px-3 sm:px-4 md:px-6 py-3 sm:py-4 text-left text-[10px] sm:text-xs font-semibold text-gray-600 uppercase tracking-wider hidden lg:table-cell">Landlord</th>
                      <th className="px-3 sm:px-4 md:px-6 py-3 sm:py-4 text-left text-[10px] sm:text-xs font-semibold text-gray-600 uppercase tracking-wider hidden md:table-cell">Location</th>
                      <th className="px-3 sm:px-4 md:px-6 py-3 sm:py-4 text-left text-[10px] sm:text-xs font-semibold text-gray-600 uppercase tracking-wider">Price</th>
                      <th className="px-3 sm:px-4 md:px-6 py-3 sm:py-4 text-left text-[10px] sm:text-xs font-semibold text-gray-600 uppercase tracking-wider hidden lg:table-cell">Rating</th>
                      <th className="px-3 sm:px-4 md:px-6 py-3 sm:py-4 text-left text-[10px] sm:text-xs font-semibold text-gray-600 uppercase tracking-wider">Status</th>
                      <th className="px-3 sm:px-4 md:px-6 py-3 sm:py-4 text-left text-[10px] sm:text-xs font-semibold text-gray-600 uppercase tracking-wider hidden xl:table-cell">Featured</th>
                      <th className="px-3 sm:px-4 md:px-6 py-3 sm:py-4 text-left text-[10px] sm:text-xs font-semibold text-gray-600 uppercase tracking-wider hidden xl:table-cell">Created</th>
                      <th className="px-3 sm:px-4 md:px-6 py-3 sm:py-4 text-left text-[10px] sm:text-xs font-semibold text-gray-600 uppercase tracking-wider">Permit</th>
                      <th className="px-3 sm:px-4 md:px-6 py-3 sm:py-4 text-left text-[10px] sm:text-xs font-semibold text-gray-600 uppercase tracking-wider">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {properties.map((property) => (
                      <tr key={property.id} className="hover:bg-gray-50 transition-colors duration-200">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center mr-3">
                              <svg className="w-5 h-5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                              </svg>
                            </div>
                            <div className="font-semibold text-gray-900">{property.title}</div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-gray-600">{property.owner}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-gray-600">{property.location}</td>
                        <td className="px-6 py-4 whitespace-nowrap font-semibold text-gray-900">₱{property.price.toLocaleString()}</td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            {[...Array(5)].map((_, i) => (
                              <svg
                                key={i}
                                className={`w-3 h-3 ${i < Math.floor(property.rating) ? 'text-yellow-400' : 'text-gray-300'}`}
                                fill="currentColor"
                                viewBox="0 0 20 20"
                              >
                                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                              </svg>
                            ))}
                            <span className="ml-1 text-xs text-gray-600">({property.totalReviews})</span>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                            property.status === 'available' ? 'bg-green-100 text-green-800' : 
                            property.status === 'pending' ? 'bg-yellow-100 text-yellow-800' : 
                            'bg-red-100 text-red-800'
                          }`}>
                            {property.status === 'available' ? 'Available' : property.status === 'pending' ? 'Pending' : 'Full'}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                            property.isFeatured ? 'bg-yellow-100 text-yellow-800' : 'bg-gray-100 text-gray-800'
                          }`}>
                            {property.isFeatured ? 'Featured' : 'Regular'}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-gray-600">{property.createdAt}</td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {property.businessPermitUrl ? (
                            <button
                              onClick={() => window.open(property.businessPermitUrl, '_blank')}
                              className="text-blue-600 hover:text-blue-800 text-xs font-semibold underline"
                            >
                              View Permit
                            </button>
                          ) : (
                            <span className="text-gray-400 text-xs">No Permit</span>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex space-x-2">
                            <button
                              onClick={() => setShowPropertyDetails(property)}
                              className="px-3 py-1 rounded-lg text-xs font-semibold transition-all duration-200 bg-blue-100 text-blue-800 hover:bg-blue-200"
                            >
                              View Details
                            </button>
                            {property.status === 'pending' && (
                              <>
                                <button
                                  onClick={() => handlePropertyVerification(property.id, 'approve')}
                                  className="px-3 py-1 rounded-lg text-xs font-semibold transition-all duration-200 bg-green-100 text-green-800 hover:bg-green-200"
                                >
                                  Approve
                                </button>
                                <button
                                  onClick={() => handlePropertyVerification(property.id, 'reject')}
                                  className="px-3 py-1 rounded-lg text-xs font-semibold transition-all duration-200 bg-red-100 text-red-800 hover:bg-red-200"
                                >
                                  Reject
                                </button>
                              </>
                            )}
                            {/* Temporary button for testing - remove after SQL fix */}
                            {property.status !== 'pending' && (
                              <button
                                onClick={() => setPropertyToPending(property.id)}
                                className="px-3 py-1 rounded-lg text-xs font-semibold transition-all duration-200 bg-yellow-100 text-yellow-800 hover:bg-yellow-200"
                              >
                                Set to Pending
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* Bookings Tab */}
        {activeTab === 'bookings' && (
          <div>
            <div className="backdrop-blur-xl bg-white/70 rounded-3xl shadow-2xl border border-white/30 p-6 mb-6">
              <h2 className="text-2xl font-bold text-gray-900 mb-2 drop-shadow-sm">Booking Management</h2>
              <p className="text-gray-600">Track and monitor all booking requests</p>
            </div>
            <div className="backdrop-blur-xl bg-white/70 rounded-3xl shadow-2xl border border-white/30 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full min-w-[600px]">
                  <thead className="backdrop-blur-md bg-white/50">
                    <tr>
                      <th className="px-3 sm:px-4 md:px-6 py-3 sm:py-4 text-left text-[10px] sm:text-xs font-semibold text-gray-600 uppercase tracking-wider">Tenant</th>
                      <th className="px-3 sm:px-4 md:px-6 py-3 sm:py-4 text-left text-[10px] sm:text-xs font-semibold text-gray-600 uppercase tracking-wider">Property</th>
                      <th className="px-3 sm:px-4 md:px-6 py-3 sm:py-4 text-left text-[10px] sm:text-xs font-semibold text-gray-600 uppercase tracking-wider hidden md:table-cell">Landlord</th>
                      <th className="px-3 sm:px-4 md:px-6 py-3 sm:py-4 text-left text-[10px] sm:text-xs font-semibold text-gray-600 uppercase tracking-wider">Status</th>
                      <th className="px-3 sm:px-4 md:px-6 py-3 sm:py-4 text-left text-[10px] sm:text-xs font-semibold text-gray-600 uppercase tracking-wider hidden lg:table-cell">Created</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {bookings.map((booking) => (
                      <tr key={booking.id} className="hover:bg-gray-50 transition-colors duration-200">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <div className="w-10 h-10 bg-yellow-100 rounded-full flex items-center justify-center mr-3">
                              <svg className="w-5 h-5 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                              </svg>
                            </div>
                            <div className="font-semibold text-gray-900">{booking.clientName}</div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-gray-600">{booking.propertyTitle}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-gray-600">{booking.ownerName}</td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                            booking.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                            booking.status === 'approved' ? 'bg-green-100 text-green-800' :
                            'bg-red-100 text-red-800'
                          }`}>
                            {booking.status}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-gray-600">{booking.createdAt}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* Reviews Tab */}
        {activeTab === 'reviews' && (
          <div>
            <div className="backdrop-blur-xl bg-white/70 rounded-3xl shadow-2xl border border-white/30 p-6 mb-6">
              <h2 className="text-2xl font-bold text-gray-900 mb-2 drop-shadow-sm">Review Management</h2>
              <p className="text-gray-600">Monitor and moderate property reviews and ratings</p>
            </div>
            <div className="backdrop-blur-xl bg-white/70 rounded-3xl shadow-2xl border border-white/30 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full min-w-[700px]">
                  <thead className="backdrop-blur-md bg-white/50">
                    <tr>
                      <th className="px-3 sm:px-4 md:px-6 py-3 sm:py-4 text-left text-[10px] sm:text-xs font-semibold text-gray-600 uppercase tracking-wider">Property</th>
                      <th className="px-3 sm:px-4 md:px-6 py-3 sm:py-4 text-left text-[10px] sm:text-xs font-semibold text-gray-600 uppercase tracking-wider">Client</th>
                      <th className="px-3 sm:px-4 md:px-6 py-3 sm:py-4 text-left text-[10px] sm:text-xs font-semibold text-gray-600 uppercase tracking-wider">Rating</th>
                      <th className="px-3 sm:px-4 md:px-6 py-3 sm:py-4 text-left text-[10px] sm:text-xs font-semibold text-gray-600 uppercase tracking-wider hidden md:table-cell">Review</th>
                      <th className="px-3 sm:px-4 md:px-6 py-3 sm:py-4 text-left text-[10px] sm:text-xs font-semibold text-gray-600 uppercase tracking-wider">Status</th>
                      <th className="px-3 sm:px-4 md:px-6 py-3 sm:py-4 text-left text-[10px] sm:text-xs font-semibold text-gray-600 uppercase tracking-wider hidden lg:table-cell">Created</th>
                      <th className="px-3 sm:px-4 md:px-6 py-3 sm:py-4 text-left text-[10px] sm:text-xs font-semibold text-gray-600 uppercase tracking-wider">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {reviews.map((review) => (
                      <tr key={review.id} className="hover:bg-gray-50 transition-colors duration-200">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="font-semibold text-gray-900">{review.propertyTitle}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div>
                            <div className="font-semibold text-gray-900">{review.clientName}</div>
                            <div className="text-sm text-gray-600">{review.clientEmail}</div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            {[...Array(5)].map((_, i) => (
                              <svg
                                key={i}
                                className={`w-4 h-4 ${i < review.rating ? 'text-yellow-400' : 'text-gray-300'}`}
                                fill="currentColor"
                                viewBox="0 0 20 20"
                              >
                                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                              </svg>
                            ))}
                            <span className="ml-2 text-sm font-medium text-gray-900">{review.rating}/5</span>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="text-sm text-gray-900 max-w-xs truncate">{review.reviewText}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                            review.isVerified ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                          }`}>
                            {review.isVerified ? 'Verified' : 'Pending'}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-gray-600">{review.createdAt}</td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex space-x-2">
                            <button
                              onClick={() => verifyReview(review.id, !review.isVerified)}
                              className={`px-4 py-2 rounded-lg text-xs font-semibold transition-all duration-200 ${
                                review.isVerified 
                                  ? 'bg-yellow-100 text-yellow-800 hover:bg-yellow-200' 
                                  : 'bg-green-100 text-green-800 hover:bg-green-200'
                              }`}
                            >
                              {review.isVerified ? 'Unverify' : 'Verify'}
                            </button>
                            <button
                              onClick={() => deleteReview(review.id)}
                              className="px-4 py-2 rounded-lg text-xs font-semibold transition-all duration-200 bg-red-100 text-red-800 hover:bg-red-200"
                            >
                              Delete
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* Notifications Tab */}
        {activeTab === 'notifications' && (
          <div>
            <div className="backdrop-blur-xl bg-white/70 rounded-3xl shadow-2xl border border-white/30 p-6 mb-6">
              <h2 className="text-2xl font-bold text-gray-900 mb-2 drop-shadow-sm">System Notifications</h2>
              <p className="text-gray-600">Monitor all system notifications and alerts</p>
            </div>
            <div className="space-y-4">
              {notifications.map((notification) => (
                <div key={notification.id} className="backdrop-blur-xl bg-white/70 rounded-3xl shadow-2xl border border-white/30 p-6 hover:shadow-3xl hover:bg-white/80 transition-all duration-300">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3 mb-2">
                        <h3 className="font-bold text-lg text-gray-900">{notification.title}</h3>
                        <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                          notification.type === 'property_status_change' ? 'bg-red-100 text-red-800' :
                          notification.type === 'booking_approved' ? 'bg-green-100 text-green-800' :
                          notification.type === 'review_posted' ? 'bg-blue-100 text-blue-800' :
                          'bg-gray-100 text-gray-800'
                        }`}>
                          {notification.type.replace('_', ' ')}
                        </span>
                      </div>
                      <p className="text-gray-700 mb-3">{notification.body}</p>
                      <div className="flex items-center space-x-4 text-sm text-gray-500">
                        <span>To: {notification.recipientEmail}</span>
                        <span>•</span>
                        <span>{notification.createdAt}</span>
                        {notification.readAt && (
                          <>
                            <span>•</span>
                            <span className="text-green-600">Read</span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Analytics Tab - Landlord Data & Sales */}
        {activeTab === 'analytics' && (
          <div>
            <div className="backdrop-blur-xl bg-white/70 rounded-3xl shadow-2xl border border-white/30 p-6 mb-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <div>
                <h2 className="text-2xl font-bold text-gray-900 mb-2 drop-shadow-sm">Landlord Analytics Dashboard</h2>
                <p className="text-gray-600">View and manage landlord data including tenant bookings and sales metrics</p>
              </div>
              <button
                onClick={() => setShowAllPropertiesAnalytics(true)}
                className="bg-purple-600 text-white px-6 py-3 rounded-xl font-semibold hover:bg-purple-700 transition-colors shadow-lg hover:shadow-xl"
              >
                View All Ranked Properties
              </button>
            </div>

            {loadingAnalytics ? (
              <div className="text-center py-12">
                <div className="text-gray-600">Loading analytics data...</div>
              </div>
            ) : landlordAnalytics.length === 0 ? (
              <div className="text-center py-12">
                <div className="text-gray-600">No landlord data available. Click "Refresh" to load analytics.</div>
                <button
                  onClick={loadLandlordAnalytics}
                  className="mt-4 bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700"
                >
                  Refresh Analytics
                </button>
              </div>
            ) : (
              <div className="space-y-6">
                {landlordAnalytics.map((landlord: any) => (
                  <div key={landlord.landlordId} className="backdrop-blur-xl bg-white/70 rounded-3xl shadow-2xl border border-white/30 p-6 hover:shadow-3xl transition-all duration-300">
                    {/* Landlord Header */}
                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-6 pb-4 border-b border-white/20">
                      <div>
                        <h3 className="text-xl font-bold text-gray-900 mb-1">{landlord.landlordName}</h3>
                        <div className="flex flex-wrap items-center gap-4 text-sm text-gray-600">
                          <span>📧 {landlord.landlordEmail}</span>
                          <span>📞 {landlord.landlordPhone}</span>
                          <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                            landlord.isVerified ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                          }`}>
                            {landlord.isVerified ? '✓ Verified' : 'Pending Verification'}
                          </span>
                        </div>
                      </div>
                      <div className="mt-4 sm:mt-0 text-right">
                        <div className="text-2xl font-bold text-blue-600">₱{landlord.totalRevenue.toLocaleString()}</div>
                        <div className="text-sm text-gray-600">Total Sales</div>
                        {!landlord.isVerified && (
                          <div className="flex gap-2 mt-2 justify-end">
                            <button 
                              onClick={() => verifyLandlord(landlord.landlordId, true)}
                              className="bg-green-600 text-white px-3 py-1 rounded text-xs font-semibold hover:bg-green-700 whitespace-nowrap"
                            >
                              Approve Landlord
                            </button>
                            <button 
                              onClick={() => verifyLandlord(landlord.landlordId, false)}
                              className="bg-red-600 text-white px-3 py-1 rounded text-xs font-semibold hover:bg-red-700 whitespace-nowrap"
                            >
                              Reject Landlord
                            </button>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Stats Grid */}
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
                      <div className="backdrop-blur-md bg-blue-50/70 rounded-xl p-4 border border-blue-200/50">
                        <div className="text-2xl font-bold text-blue-600">{landlord.propertiesCount}</div>
                        <div className="text-sm font-semibold text-blue-800">Properties</div>
                      </div>
                      <div className="backdrop-blur-md bg-green-50/70 rounded-xl p-4 border border-green-200/50">
                        <div className="text-2xl font-bold text-green-600">{landlord.totalTenants}</div>
                        <div className="text-sm font-semibold text-green-800">Total Tenants</div>
                      </div>
                      <div className="backdrop-blur-md bg-purple-50/70 rounded-xl p-4 border border-purple-200/50">
                        <div className="text-2xl font-bold text-purple-600">{landlord.bookedRooms}</div>
                        <div className="text-sm font-semibold text-purple-800">Booked Rooms</div>
                      </div>
                      <div className="backdrop-blur-md bg-orange-50/70 rounded-xl p-4 border border-orange-200/50">
                        <div className="text-2xl font-bold text-orange-600">{landlord.bookedBeds}</div>
                        <div className="text-sm font-semibold text-orange-800">Booked Beds</div>
                      </div>
                    </div>

                    {/* Tenants List */}
                    <div className="mb-6">
                      <h4 className="text-lg font-bold text-gray-900 mb-4">Tenants ({landlord.totalTenants})</h4>
                      <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                          <thead className="backdrop-blur-md bg-white/50">
                            <tr>
                              <th className="px-4 py-3 text-left font-semibold text-gray-700">Name</th>
                              <th className="px-4 py-3 text-left font-semibold text-gray-700">Email</th>
                              <th className="px-4 py-3 text-left font-semibold text-gray-700">Total Bookings</th>
                              <th className="px-4 py-3 text-left font-semibold text-gray-700">Approved</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-white/20">
                            {landlord.tenants.map((tenant: any, idx: number) => (
                              <tr key={idx} className="hover:bg-white/40 backdrop-blur-sm">
                                <td className="px-4 py-3 text-gray-900">{tenant.name}</td>
                                <td className="px-4 py-3 text-gray-600">{tenant.email}</td>
                                <td className="px-4 py-3 text-gray-700">{tenant.bookingsCount}</td>
                                <td className="px-4 py-3">
                                  <span className="px-2 py-1 rounded-full text-xs font-semibold bg-green-100 text-green-800">
                                    {tenant.approvedBookings}
                                  </span>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>

                    {/* Properties List */}
                    {landlord.properties.length > 0 && (
                      <div>
                        <h4 className="text-lg font-bold text-gray-900 mb-4">Properties ({landlord.propertiesCount})</h4>
                        <div className="space-y-2">
                          {landlord.properties.map((property: any) => (
                            <div key={property.id} className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-4 backdrop-blur-md bg-white/50 rounded-xl border border-white/20 hover:bg-white/60 transition-colors gap-4">
                              <div className="flex items-start gap-4 flex-1">
                                {property.images && property.images[0] && (
                                  <img 
                                    src={property.images[0]} 
                                    alt={property.title}
                                    className="w-16 h-16 object-cover rounded-lg flex-shrink-0"
                                  />
                                )}
                                <div className="flex-1">
                                  <div className="flex items-center gap-3 mb-1">
                                    <span className="font-bold text-gray-900">{property.title}</span>
                                    <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${
                                      property.status === 'available' ? 'bg-green-100 text-green-800' :
                                      property.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                                      'bg-red-100 text-red-800'
                                    }`}>
                                      {property.status}
                                    </span>
                                  </div>
                                  <div className="flex items-center gap-4 text-sm text-gray-600">
                                    <span>{property.approvedBookings} Approved Bookings</span>
                                    <span>•</span>
                                    <span className="font-semibold text-green-600">₱{(property.revenue || 0).toLocaleString()} Revenue</span>
                                  </div>
                                </div>
                              </div>
                              <div className="flex flex-col sm:flex-row gap-2 items-end">
                                <button
                                  onClick={() => setSelectedAnalyticsProperty(property)}
                                  className="text-blue-600 hover:text-blue-800 text-sm font-semibold underline whitespace-nowrap"
                                >
                                  View Tenants & Sales
                                </button>
                                {property.business_permit_url && (
                                  <button
                                    onClick={() => window.open(property.business_permit_url, '_blank')}
                                    className="text-green-600 hover:text-green-800 text-sm font-semibold underline whitespace-nowrap"
                                  >
                                    View Permit
                                  </button>
                                )}
                                {property.status === 'pending' && (
                                  <div className="flex gap-1">
                                    <button 
                                      onClick={() => handlePropertyVerification(property.id, 'approve')}
                                      className="bg-green-600 text-white px-2 py-1 rounded text-xs font-semibold hover:bg-green-700 whitespace-nowrap"
                                    >
                                      Approve BH
                                    </button>
                                    <button 
                                      onClick={() => handlePropertyVerification(property.id, 'reject')}
                                      className="bg-red-600 text-white px-2 py-1 rounded text-xs font-semibold hover:bg-red-700 whitespace-nowrap"
                                    >
                                      Reject BH
                                    </button>
                                  </div>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Maps Tab */}
        {activeTab === 'maps' && (
          <div>
            <div className="backdrop-blur-xl bg-white/70 rounded-3xl shadow-2xl border border-white/30 p-6 mb-6">
              <h2 className="text-2xl font-bold text-gray-900 mb-2 drop-shadow-sm">Property Locations</h2>
              <p className="text-gray-600">View all properties on an interactive map</p>
            </div>
            <div className="backdrop-blur-xl bg-white/70 rounded-3xl shadow-2xl border border-white/30 overflow-hidden">
              <div className="h-96 flex flex-col lg:flex-row">
                <div className="flex-1 relative">
                  <GoogleMap
                    center={{ lat: 11.7778, lng: 124.8847 }}
                    zoom={12}
                    satellite={true}
                    preferLeaflet={true}
                    markers={properties.map(property => ({
                      position: property.coordinates,
                      title: property.title,
                      info: `${property.location} - ₱${property.price.toLocaleString()}/month`,
                      iconUrl: property.images && property.images[0] ? property.images[0] : undefined
                    }))}
                    onMarkerClick={(index) => {
                      const property = properties[index];
                      setMapSelectedProperty(property || null);
                    }}
                    className="h-full w-full"
                  />
                </div>
                <div className="w-full lg:w-[26rem] border-t lg:border-t-0 lg:border-l border-white/20 backdrop-blur-xl bg-white/70">
                  {mapSelectedProperty ? (
                    <div className="h-full flex flex-col">
                      <div className="flex items-start justify-between p-4 border-b border-white/20">
                        <div>
                          <h3 className="text-lg font-semibold text-gray-900 leading-tight">{mapSelectedProperty.title}</h3>
                          <p className="text-sm text-gray-500">{mapSelectedProperty.location}</p>
                        </div>
                        <button
                          onClick={() => setMapSelectedProperty(null)}
                          className="text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full p-1 transition-colors"
                          aria-label="Close property details"
                        >
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        </button>
                      </div>
                      <div className="p-4 space-y-3 overflow-y-auto">
                        <div className="rounded-xl overflow-hidden border border-gray-200">
                          {mapSelectedProperty.images && mapSelectedProperty.images.length > 0 ? (
                            <ImageCarousel
                              images={mapSelectedProperty.images}
                              alt={mapSelectedProperty.title}
                              className="w-full"
                              bucket="property-images"
                            />
                          ) : (
                            <div className="w-full h-40 flex items-center justify-center text-gray-400 text-sm bg-gray-50">
                              No image available
                            </div>
                          )}
                        </div>

                        <div>
                          <h4 className="text-sm font-semibold text-gray-700 mb-1">Status</h4>
                          <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold ${
                            mapSelectedProperty.status === 'available'
                              ? 'bg-green-100 text-green-700'
                              : mapSelectedProperty.status === 'pending' ? 'bg-yellow-100 text-yellow-700'
                              : 'bg-red-100 text-red-700'
                          }`}>
                            {mapSelectedProperty.status === 'available' ? 'Available' : mapSelectedProperty.status === 'pending' ? 'Pending' : 'Full'}
                          </span>
                        </div>

                        <div>
                          <h4 className="text-sm font-semibold text-gray-700 mb-1">Monthly Rate</h4>
                          <p className="text-base font-bold text-blue-600">
                            ₱{mapSelectedProperty.price.toLocaleString()}
                          </p>
                        </div>

                        {mapSelectedProperty.amenities && mapSelectedProperty.amenities.length > 0 && (
                          <div>
                            <h4 className="text-sm font-semibold text-gray-700 mb-2">Amenities</h4>
                            <div className="flex flex-wrap gap-2">
                              {mapSelectedProperty.amenities.slice(0, 8).map((amenity: string, idx: number) => (
                                <span
                                  key={`${mapSelectedProperty.id}-amenity-${idx}`}
                                  className="px-3 py-1 rounded-full bg-gray-100 text-gray-700 text-xs font-medium"
                                >
                                  {amenity}
                                </span>
                              ))}
                              {mapSelectedProperty.amenities.length > 8 && (
                                <span className="px-3 py-1 rounded-full bg-gray-100 text-gray-500 text-xs font-medium">
                                  +{mapSelectedProperty.amenities.length - 8} more
                                </span>
                              )}
                            </div>
                          </div>
                        )}

                        <button
                          onClick={() => {
                            setActiveTab('properties');
                            setMapSelectedProperty(null);
                          }}
                          className="w-full bg-blue-600 text-white text-sm font-semibold py-2.5 rounded-xl hover:bg-blue-700 transition-colors"
                        >
                          View in Properties table
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="h-full flex items-center justify-center text-center p-6 text-gray-500 text-sm">
                      Select a property marker to view details here.
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

      {/* Property Details Modal */}
      {showPropertyDetails && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl">
            <div className="sticky top-0 bg-white border-b border-gray-200 p-6 flex justify-between items-center z-10">
              <h2 className="text-2xl font-bold text-gray-900">{showPropertyDetails.title}</h2>
              <button
                onClick={() => {
                  setShowPropertyDetails(null);
                  setRooms([]);
                  setBeds([]);
                  setPropertyPermit(null);
                }}
                className="text-gray-500 hover:text-gray-700 text-2xl font-bold"
              >
                ×
              </button>
            </div>

            <div className="p-6 space-y-6">
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

              {/* Description */}
              <div>
                <h3 className="font-semibold text-lg mb-2">Description</h3>
                <p className="text-gray-600">{showPropertyDetails.description || 'No description available'}</p>
              </div>

              {/* Location */}
              <div>
                <h3 className="font-semibold text-lg mb-2">Location</h3>
                <p className="text-gray-600">{showPropertyDetails.location}</p>
                {showPropertyDetails.coordinates && (
                  <div className="mt-2">
                    <GoogleMap
                      center={showPropertyDetails.coordinates}
                      zoom={15}
                      satellite={true}
                      preferLeaflet={true}
                      markers={[{
                        position: showPropertyDetails.coordinates,
                        title: showPropertyDetails.title
                      }]}
                      className="h-64 w-full rounded-lg"
                    />
                  </div>
                )}
              </div>

              {/* Amenities */}
              {showPropertyDetails.amenities && showPropertyDetails.amenities.length > 0 && (
                <div>
                  <h3 className="font-semibold text-lg mb-2">Amenities</h3>
                  <div className="flex flex-wrap gap-2">
                    {showPropertyDetails.amenities.map((amenity, index) => (
                      <span
                        key={index}
                        className="bg-purple-100 text-purple-800 px-3 py-1 rounded-full text-sm"
                      >
                        {amenity}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Rooms Management */}
              <div className="border-t pt-4">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="font-semibold text-lg">Rooms</h3>
                </div>
                <div className="space-y-2">
                  {rooms.length > 0 ? (
                    rooms.map((room: any) => (
                      <div key={room.id} className="bg-gray-50 p-3 rounded-lg">
                        <div>
                          <p className="font-semibold">Room {room.room_number} - {room.room_name || 'Unnamed'}</p>
                          <p className="text-sm text-gray-600">Max Beds: {room.max_beds} | Price per Bed: ₱{room.price_per_bed || 0}</p>
                          <p className="text-xs text-gray-500">Status: {room.status}</p>
                        </div>
                      </div>
                    ))
                  ) : (
                    <p className="text-gray-500 text-sm">No rooms added yet.</p>
                  )}
                </div>
              </div>

              {/* Permits Section */}
              <div className="border-t pt-4">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="font-semibold text-lg">Business Permit</h3>
                </div>
                {propertyPermit && (
                  <div className="bg-gray-50 p-3 rounded-lg">
                    <a href={propertyPermit} target="_blank" rel="noopener noreferrer" className="text-purple-600 hover:text-purple-700 text-sm font-semibold">
                      View Business Permit →
                    </a>
                  </div>
                )}
              </div>

              {/* Price and Status */}
              <div className="flex justify-between items-center pt-4 border-t">
                <div>
                  <p className="text-2xl font-bold text-purple-600">
                    ₱{showPropertyDetails.price.toLocaleString()}/month
                  </p>
                  <p className="text-sm text-gray-500">
                    Status: {showPropertyDetails.status}
                  </p>
                </div>
                {showPropertyDetails.status === 'pending' && (
                  <div className="flex gap-2">
                    <button
                      onClick={() => handlePropertyVerification(showPropertyDetails.id, 'approve')}
                      className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg font-semibold transition-colors"
                    >
                      Approve
                    </button>
                    <button
                      onClick={() => handlePropertyVerification(showPropertyDetails.id, 'reject')}
                      className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg font-semibold transition-colors"
                    >
                      Reject
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Add Room, Add Bed, Permits, and Report Modals - Same structure as OwnerDashboard but with purple theme */}
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
                <input type="text" value={newRoom.room_number} onChange={(e) => setNewRoom({ ...newRoom, room_number: e.target.value })} className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500" placeholder="e.g., 101" required />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Room Name</label>
                <input type="text" value={newRoom.room_name} onChange={(e) => setNewRoom({ ...newRoom, room_name: e.target.value })} className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500" placeholder="e.g., Master Bedroom" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Max Beds *</label>
                  <input type="number" value={newRoom.max_beds} onChange={(e) => setNewRoom({ ...newRoom, max_beds: e.target.value })} className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500" placeholder="2" min="1" required />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Price per Bed (₱) *</label>
                  <input type="number" value={newRoom.price_per_bed} onChange={(e) => setNewRoom({ ...newRoom, price_per_bed: e.target.value })} className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500" placeholder="5000" min="0" required />
                </div>
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Status</label>
                <select value={newRoom.status} onChange={(e) => setNewRoom({ ...newRoom, status: e.target.value })} className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500">
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
                    const { data: roomsData } = await supabase.from('rooms').select('*').eq('boarding_house_id', showPropertyDetails.id).order('room_number', { ascending: true });
                    setRooms(roomsData || []);
                    setShowAddRoom(false);
                    setNewRoom({ room_number: '', room_name: '', max_beds: '', price_per_bed: '', status: 'available' });
                  } catch (error: any) {
                    console.error('Failed to add room:', error);
                    alert(`Failed to add room: ${error.message || 'Unknown error'}`);
                  }
                }} className="flex-1 bg-purple-600 text-white px-4 py-3 rounded-xl font-semibold hover:bg-purple-700">Add Room</button>
              </div>
            </div>
          </div>
        </div>
      )}



      {/* All Ranked Properties Modal */}
      {showAllPropertiesAnalytics && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto shadow-2xl">
            <div className="sticky top-0 bg-white border-b border-gray-200 p-6 flex justify-between items-center z-10">
              <h2 className="text-2xl font-bold text-gray-900">Top Ranked Properties</h2>
              <button onClick={() => setShowAllPropertiesAnalytics(false)} className="text-gray-500 hover:text-gray-700 text-2xl font-bold">×</button>
            </div>
            <div className="p-6">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-3 text-left font-semibold text-gray-700">Rank</th>
                      <th className="px-4 py-3 text-left font-semibold text-gray-700">Property</th>
                      <th className="px-4 py-3 text-left font-semibold text-gray-700">Landlord</th>
                      <th className="px-4 py-3 text-left font-semibold text-gray-700">Approved Bookings</th>
                      <th className="px-4 py-3 text-left font-semibold text-gray-700">Total Sales</th>
                      <th className="px-4 py-3 text-left font-semibold text-gray-700">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {landlordAnalytics
                      .flatMap((l: any) => l.properties.map((p: any) => ({ ...p, landlordName: l.landlordName })))
                      .sort((a: any, b: any) => b.approvedBookings - a.approvedBookings)
                      .map((property: any, idx: number) => (
                        <tr key={property.id} className="hover:bg-gray-50">
                          <td className="px-4 py-3 font-bold text-gray-900">#{idx + 1}</td>
                          <td className="px-4 py-3 font-medium text-gray-900">{property.title}</td>
                          <td className="px-4 py-3 text-gray-600">{property.landlordName}</td>
                          <td className="px-4 py-3 text-gray-900">{property.approvedBookings}</td>
                          <td className="px-4 py-3 font-semibold text-green-600">₱{(property.revenue || 0).toLocaleString()}</td>
                          <td className="px-4 py-3">
                            <button
                              onClick={() => {
                                setShowAllPropertiesAnalytics(false);
                                setSelectedAnalyticsProperty(property);
                              }}
                              className="text-blue-600 hover:text-blue-800 font-semibold hover:underline"
                            >
                              View Details
                            </button>
                          </td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Property Analytics Details Modal */}
      {selectedAnalyticsProperty && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto shadow-2xl">
            <div className="sticky top-0 bg-white border-b border-gray-200 p-6 flex justify-between items-center z-10">
              <div>
                <h2 className="text-2xl font-bold text-gray-900">{selectedAnalyticsProperty.title}</h2>
                <p className="text-gray-600 text-sm">Property Analytics & Tenant Data</p>
              </div>
              <button onClick={() => setSelectedAnalyticsProperty(null)} className="text-gray-500 hover:text-gray-700 text-2xl font-bold">×</button>
            </div>
            <div className="p-6 space-y-6">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <div className="bg-blue-50 p-4 rounded-xl border border-blue-100">
                  <div className="text-2xl font-bold text-blue-600">{selectedAnalyticsProperty.totalBookings}</div>
                  <div className="text-xs font-semibold text-blue-800 uppercase">Total Bookings</div>
                </div>
                <div className="bg-green-50 p-4 rounded-xl border border-green-100">
                  <div className="text-2xl font-bold text-green-600">{selectedAnalyticsProperty.approvedBookings}</div>
                  <div className="text-xs font-semibold text-green-800 uppercase">Approved</div>
                </div>
                <div className="bg-purple-50 p-4 rounded-xl border border-purple-100">
                  <div className="text-2xl font-bold text-purple-600">{selectedAnalyticsProperty.tenants?.length || 0}</div>
                  <div className="text-xs font-semibold text-purple-800 uppercase">Unique Tenants</div>
                </div>
                <div className="bg-orange-50 p-4 rounded-xl border border-orange-100">
                  <div className="text-2xl font-bold text-orange-600">₱{(selectedAnalyticsProperty.revenue || 0).toLocaleString()}</div>
                  <div className="text-xs font-semibold text-orange-800 uppercase">Total Sales</div>
                </div>
              </div>

              <div>
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-lg font-bold text-gray-900">Tenant History</h3>
                  <button 
                    onClick={() => {
                      const headers = ['Name', 'Email', 'Bookings', 'Approved', 'Total Spent'];
                      const rows = (selectedAnalyticsProperty.tenants || []).map((t: any) => [
                        t.name,
                        t.email,
                        t.bookingsCount,
                        t.approvedBookings,
                        t.totalSpent
                      ]);
                      
                      let csvContent = "data:text/csv;charset=utf-8," 
                        + headers.join(",") + "\n" 
                        + rows.map((e: any[]) => e.join(",")).join("\n");
                        
                      const encodedUri = encodeURI(csvContent);
                      const link = document.createElement("a");
                      link.setAttribute("href", encodedUri);
                      link.setAttribute("download", `${selectedAnalyticsProperty.title}_tenants.csv`);
                      document.body.appendChild(link);
                      link.click();
                      document.body.removeChild(link);
                    }}
                    className="text-sm bg-gray-100 hover:bg-gray-200 text-gray-700 px-3 py-1.5 rounded-lg font-medium transition-colors"
                  >
                    Download CSV
                  </button>
                </div>
                <div className="overflow-x-auto border border-gray-200 rounded-xl">
                  <table className="w-full text-sm">
                    <thead className="bg-gray-50 border-b border-gray-200">
                      <tr>
                        <th className="px-4 py-3 text-left font-semibold text-gray-700">Name</th>
                        <th className="px-4 py-3 text-left font-semibold text-gray-700">Email</th>
                        <th className="px-4 py-3 text-left font-semibold text-gray-700">Bookings</th>
                        <th className="px-4 py-3 text-left font-semibold text-gray-700">Spent</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {(selectedAnalyticsProperty.tenants || []).length > 0 ? (
                        (selectedAnalyticsProperty.tenants || []).map((tenant: any, idx: number) => (
                          <tr key={idx} className="hover:bg-gray-50">
                            <td className="px-4 py-3 font-medium text-gray-900">{tenant.name}</td>
                            <td className="px-4 py-3 text-gray-600">{tenant.email}</td>
                            <td className="px-4 py-3 text-gray-700">
                              {tenant.bookingsCount} <span className="text-xs text-gray-400">({tenant.approvedBookings} approved)</span>
                            </td>
                            <td className="px-4 py-3 font-medium text-green-600">₱{(tenant.totalSpent || 0).toLocaleString()}</td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan={4} className="px-4 py-8 text-center text-gray-500">
                            No tenant history available.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
