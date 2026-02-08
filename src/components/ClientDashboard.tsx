import React, { useEffect, useState } from 'react';
import GoogleMap from './GoogleMap';
import supabase from '../lib/supabase';
import { sendLandlordBookingEmail } from '../lib/email';
import { ImageWithFallback } from './ImageWithFallback';
import ImageCarousel from './ImageCarousel';
import ReportProblem from './ReportProblem';

interface Property {
  id: string;
  title: string;
  description: string;
  price: number;
  location: string;
  images: string[];
  owner: string;
  amenities: string[];
  coordinates: { lat: number; lng: number };
  isVerified: boolean;
  rating?: number;
  totalReviews?: number;
  isFeatured?: boolean;
  totalBookings?: number;
}

interface Review {
  id: string;
  propertyId: string;
  clientName: string;
  rating: number;
  reviewText: string;
  createdAt: string;
}

interface SearchFilters {
  minPrice: number;
  maxPrice: number;
  minRating: number;
  amenities: string[];
  location: string;
}

interface ClientDashboardProps {
  onBack: () => void;
}

export default function ClientDashboard({ onBack }: ClientDashboardProps) {
  const [searchLocation, setSearchLocation] = useState('');
  const [selectedProperty, setSelectedProperty] = useState<Property | null>(null);
  const [showBookingForm, setShowBookingForm] = useState(false);
  const [bookingMessage, setBookingMessage] = useState('');
  const [bookingName, setBookingName] = useState('');
  const [bookingEmail, setBookingEmail] = useState('');
  // Enhanced booking form fields
  const [bookingFullName, setBookingFullName] = useState('');
  const [bookingAddress, setBookingAddress] = useState('');
  const [bookingBarangay, setBookingBarangay] = useState('');
  const [bookingMunicipalityCity, setBookingMunicipalityCity] = useState('');
  const [bookingGender, setBookingGender] = useState('');
  const [bookingAge, setBookingAge] = useState('');
  const [bookingCitizenship, setBookingCitizenship] = useState('');
  const [bookingOccupationStatus, setBookingOccupationStatus] = useState('');
  const [selectedRoomId, setSelectedRoomId] = useState<string>('');
  const [selectedBedId, setSelectedBedId] = useState<string>('');
  const [availableRooms, setAvailableRooms] = useState<any[]>([]);
  const [availableBeds, setAvailableBeds] = useState<any[]>([]);
  const [loadingBeds, setLoadingBeds] = useState<boolean>(false);
  const [currentLocation, setCurrentLocation] = useState('Catbalogan City, Philippines');
  const [showMenu, setShowMenu] = useState(false);
  const [showMaps, setShowMaps] = useState(false);

  const [infoTab, setInfoTab] = useState<'overview' | 'amenities' | 'photos'>('overview');
  const [showFilters, setShowFilters] = useState(false);
  const [showReviewForm, setShowReviewForm] = useState(false);
  const [showReviewErrorModal, setShowReviewErrorModal] = useState(false);
  const [reviewErrorMessage, setReviewErrorMessage] = useState('');
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewText, setReviewText] = useState('');

  const [properties, setProperties] = useState<Property[]>([]);
  const [filteredProperties, setFilteredProperties] = useState<Property[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [user, setUser] = useState<any>(null);
  const [searchFilters, setSearchFilters] = useState<SearchFilters>({
    minPrice: 0,
    maxPrice: 50000,
    minRating: 0,
    amenities: [],
    location: ''
  });

  // Tenant notifications + chat
  const [clientEmail, setClientEmail] = useState<string>('');
  const [notifications, setNotifications] = useState<any[]>([]);
  const [showNotif, setShowNotif] = useState(false);
  const [showReportProblem, setShowReportProblem] = useState(false);
  
  // Edit Profile
  const [showEditProfile, setShowEditProfile] = useState(false);
  const [showViewProfile, setShowViewProfile] = useState(false);
  const [profileData, setProfileData] = useState({
    full_name: '',
    phone: '',
    address: '',
    barangay: '',
    city: '',
    profile_image_url: '',
    id_document_url: '',
    email: ''
  });
  const [viewProfileData, setViewProfileData] = useState<{
    full_name: string;
    email: string;
    phone: string;
    address: string;
    barangay: string;
    city: string;
    profile_image_url: string | null;
    id_document_url: string | null;
  }>({
    full_name: '',
    email: '',
    phone: '',
    address: '',
    barangay: '',
    city: '',
    profile_image_url: null,
    id_document_url: null
  });

  // Tenant information preview before booking
  const [showBookingPreview, setShowBookingPreview] = useState(false);
  const [bookingPreviewData, setBookingPreviewData] = useState<any>(null);
  const [profileImageFile, setProfileImageFile] = useState<File | null>(null);
  const [profileImagePreview, setProfileImagePreview] = useState<string | null>(null);
  const [idDocumentFile, setIdDocumentFile] = useState<File | null>(null);
  const [idDocumentPreview, setIdDocumentPreview] = useState<string | null>(null);
  const [savingProfile, setSavingProfile] = useState(false);
  
  // My Bookings
  const [myBookings, setMyBookings] = useState<any[]>([]);
  const [loadingBookings, setLoadingBookings] = useState(false);
  const [activeView, setActiveView] = useState<'properties' | 'bookings'>('properties');
  
  // Property Bookings (for selected property)
  const [propertyBookings, setPropertyBookings] = useState<any[]>([]);
  const [loadingPropertyBookings, setLoadingPropertyBookings] = useState(false);



  const [chatOpen, setChatOpen] = useState(false);
  const [chatLoading, setChatLoading] = useState(false);
  const [chatMessages, setChatMessages] = useState<{ id: string; sender_email: string; content: string; created_at: string; }[]>([]);
  const [chatInput, setChatInput] = useState('');
  const [activeConversation, setActiveConversation] = useState<{ id: string; property_id: string; owner_email: string; client_email: string } | null>(null);
  const [chatChannel, setChatChannel] = useState<any>(null);
  const messagesEndRef = React.useRef<HTMLDivElement | null>(null);
  const scrollMessagesToBottom = () => { try { messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }); } catch {} };

  useEffect(() => {
    // Guard: only allow tenant role
    const enforceTenantRole = async () => {
      try {
        // Get current user
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
          alert('Access denied: Please login first.');
          onBack();
          return;
        }
        
        // Check user role directly from app_users table instead of using RPC
        const { data: userData, error: userError } = await supabase
          .from('app_users')
          .select('role')
          .eq('user_id', user.id)
          .single();
        
        if (userError || !userData) {
          console.warn('User not found in app_users, checking metadata:', userError);
          
          // Fallback: check user metadata
          const meta = user.user_metadata || {};
          const userRole = meta.role || 'client';
          
          if (userRole !== 'client') {
            alert('Access denied: Tenant role required.');
            onBack();
          }
          return;
        }
        
        // Check if user has client role
        if (userData.role !== 'client') {
          alert('Access denied: Tenant role required.');
          onBack();
        }
        
      } catch (e: any) {
        console.error('Role validation failed', e);
        // Allow access if validation fails to avoid blocking users
        console.warn('Role validation failed, allowing access for now');
      }
    };
    enforceTenantRole();
  }, [onBack]);

  useEffect(() => {
    // Get current user email and load notifications
    const loadClientMeta = async () => {
      try {
        const { data: userData } = await supabase.auth.getUser();
        const email = userData?.user?.email || '';
        setUser(userData?.user);
        setClientEmail(email);
        if (email) {
          const { data: notifs, error: notifErr } = await supabase
            .from('notifications')
            .select('*')
            .eq('recipient_email', email)
            .order('created_at', { ascending: false });
          if (!notifErr) setNotifications(notifs || []);
        }
      } catch (e) {
        console.error('Load tenant notifications failed', e);
      }
    };
    loadClientMeta();
  }, []);

  // Load user bookings
  const loadMyBookings = async () => {
    if (!clientEmail) return;
    
    setLoadingBookings(true);
    try {
      // Try multiple queries to find bookings by different email fields
      const queries = [
        supabase
          .from('bookings')
          .select('*')
          .eq('client_email', clientEmail),
        supabase
          .from('bookings')
          .select('*')
          .eq('tenant_email', clientEmail),
        supabase
          .from('bookings')
          .select('*')
          .eq('full_name', clientEmail) // Sometimes email might be in full_name field
      ];

      const results = await Promise.all(queries);
      let allBookings: any[] = [];
      const bookingIds = new Set<string>();

      // Combine results and remove duplicates
      results.forEach(({ data, error }) => {
        if (!error && data) {
          data.forEach((booking: any) => {
            if (!bookingIds.has(booking.id)) {
              bookingIds.add(booking.id);
              allBookings.push(booking);
            }
          });
        }
      });

      // Now fetch property, room, and bed details for each booking
      const bookingsWithDetails = await Promise.all(
        allBookings.map(async (booking) => {
          const propertyId = booking.property_id || booking.boarding_house_id;
          let propertyData = null;
          let roomData = null;
          let bedData = null;

          // Fetch property details
          if (propertyId) {
            const { data: propData } = await supabase
              .from('properties')
              .select('id, title, location, price, images')
              .eq('id', propertyId)
              .single();
            propertyData = propData;
          }

          // Fetch room details
          if (booking.room_id) {
            const { data: room } = await supabase
              .from('rooms')
              .select('id, room_number, room_name, max_beds, price_per_bed')
              .eq('id', booking.room_id)
              .single();
            roomData = room;
          }

          // Fetch bed details
          if (booking.bed_id) {
            const { data: bed } = await supabase
              .from('beds')
              .select('id, bed_number, bed_type, deck_position, status, price')
              .eq('id', booking.bed_id)
              .single();
            bedData = bed;
          }
          
          return {
            ...booking,
            properties: propertyData,
            room: roomData,
            bed: bedData
          };
        })
      );

      // Sort by created_at descending
      bookingsWithDetails.sort((a, b) => 
        new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      );

      setMyBookings(bookingsWithDetails);
    } catch (e) {
      console.error('Failed to load bookings:', e);
    } finally {
      setLoadingBookings(false);
    }
  };

  useEffect(() => {
    if (clientEmail) {
      loadMyBookings();
    }
  }, [clientEmail]);

  // Load bookings for selected property
  const loadPropertyBookings = async (propertyId: string) => {
    if (!propertyId) return;
    
    setLoadingPropertyBookings(true);
    try {
      // Fetch all bookings for this property
      const { data: bookingsData, error } = await supabase
        .from('bookings')
        .select(`
          *,
          rooms:room_id (
            id,
            room_number,
            room_name,
            max_beds
          ),
          beds:bed_id (
            id,
            bed_number,
            bed_type,
            deck_position,
            status
          )
        `)
        .or(`property_id.eq.${propertyId},boarding_house_id.eq.${propertyId}`)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error loading property bookings:', error);
      } else {
        setPropertyBookings(bookingsData || []);
      }
    } catch (e) {
      console.error('Failed to load property bookings:', e);
    } finally {
      setLoadingPropertyBookings(false);
    }
  };

  // Load bookings when property is selected
  useEffect(() => {
    if (selectedProperty && !showMaps && !showBookingForm) {
      loadPropertyBookings(selectedProperty.id);
    }
  }, [selectedProperty, showMaps, showBookingForm]);



  useEffect(() => {
    const fetchProperties = async () => {
      try {
        setLoading(true);
        console.log('=== PROPERTIES FETCH DEBUG START ===');
        console.log('Supabase URL:', process.env.REACT_APP_SUPABASE_URL || 'https://jlahqyvpgdntlqfpxvoz.supabase.co');
        console.log('Current user:', await supabase.auth.getUser());
        
        // Test basic connection first
        console.log('Testing basic Supabase connection...');
        const { data: testData, error: testError } = await supabase
          .from('properties')
          .select('count')
          .limit(1);
        
        if (testError) {
          console.error('❌ Basic connection test failed:', testError);
          throw testError;
        }
        console.log('✅ Basic connection test passed');
        
        // Now fetch all properties with detailed logging
        // Priority: Sort by total_bookings DESC (most frequently booked first), then by rating
        console.log('Fetching all properties from database...');
        
        // Try to fetch from properties table with status filter
        let allData: any[] = [];
        let allError: any = null;
        
        // First try with status filter - simplified query without ordering by potentially missing columns
        console.log('Attempting to fetch properties with status = available...');
        const { data: propsWithStatus, error: propsError } = await supabase
          .from('properties')
          .select('*')
          .eq('status', 'available');
        
        if (!propsError && propsWithStatus) {
          allData = propsWithStatus;
          console.log('✅ Fetched properties with status filter:', allData.length);
          // Sort in JavaScript to avoid database column issues
          allData.sort((a, b) => {
            // Sort by total_bookings if available, then rating, then created_at
            const bookingsA = Number(a.total_bookings) || 0;
            const bookingsB = Number(b.total_bookings) || 0;
            if (bookingsB !== bookingsA) return bookingsB - bookingsA;
            
            const ratingA = Number(a.rating) || 0;
            const ratingB = Number(b.rating) || 0;
            if (ratingB !== ratingA) return ratingB - ratingA;
            
            const dateA = new Date(a.created_at || 0).getTime();
            const dateB = new Date(b.created_at || 0).getTime();
            return dateB - dateA;
          });
        } else {
          // Fallback: fetch all and filter in code
          console.log('⚠️ Status filter failed, trying without filter...', propsError);
          const { data: allProps, error: allPropsError } = await supabase
            .from('properties')
            .select('*');
          
          if (allPropsError) {
            console.error('❌ Fallback query also failed:', allPropsError);
            allError = allPropsError;
          } else {
            allData = allProps || [];
            console.log('✅ Fetched all properties (fallback):', allData.length);
            // Sort in JavaScript
            allData.sort((a, b) => {
              const bookingsA = Number(a.total_bookings) || 0;
              const bookingsB = Number(b.total_bookings) || 0;
              if (bookingsB !== bookingsA) return bookingsB - bookingsA;
              
              const ratingA = Number(a.rating) || 0;
              const ratingB = Number(b.rating) || 0;
              if (ratingB !== ratingA) return ratingB - ratingA;
              
              const dateA = new Date(a.created_at || 0).getTime();
              const dateB = new Date(b.created_at || 0).getTime();
              return dateB - dateA;
            });
          }
        }
        
        if (allError) {
          console.error('❌ Error fetching all properties:', allError);
          console.error('Error details:', {
            message: allError.message,
            details: allError.details,
            hint: allError.hint,
            code: allError.code
          });
          
          // If RLS error, try to provide helpful message
          if (allError.code === '42501' || allError.message?.includes('permission') || allError.message?.includes('policy')) {
            console.error('🔒 RLS Policy Error: Properties table may have restrictive policies');
            console.error('💡 Suggestion: Check RLS policies for properties table in Supabase');
            console.error('💡 Run the SQL schema to add: "Everyone can view available properties" policy');
          }
          
          // Don't throw, just set empty array and continue
          setProperties([]);
          setFilteredProperties([]);
          setLoading(false);
          return;
        }
        
        console.log('✅ Database query successful');
        console.log('📊 Total properties in database:', allData?.length || 0);
        console.log('📋 Raw properties data:', allData);
        
        if (!allData || allData.length === 0) {
          console.warn('⚠️ No properties found in database');
          console.log('This could mean:');
          console.log('1. The properties table is empty');
          console.log('2. The table name is incorrect');
          console.log('3. There are permission issues');
          console.log('4. The database schema is not set up');
        }
        
        // Log each property individually
        (allData || []).forEach((prop, index) => {
          console.log(`Property ${index + 1}:`, {
            id: prop.id,
            title: prop.title,
            status: prop.status,
            price: prop.price,
            location: prop.location,
            hasImages: prop.images && prop.images.length > 0,
            amenities: prop.amenities
          });
        });
        
        // Filter for available properties (only show verified/approved properties, not pending)
        const availableProperties = (allData || []).filter((prop) => {
          const status = (prop?.status ? String(prop.status) : '').toLowerCase();
          // Only show available/active/vacant properties (pending properties require admin verification)
          return status === 'available' || status === 'active' || status === 'vacant';
        });
        console.log('🎯 Available properties count:', availableProperties.length);
        console.log('📝 All property statuses:', (allData || []).map(p => ({ 
          id: p.id, 
          title: p.title, 
          status: p.status 
        })));
        
        if (availableProperties.length === 0 && allData && allData.length > 0) {
          console.warn('⚠️ No available properties found, but properties exist');
          console.log('All properties have status:', Array.from(new Set((allData || []).map(p => p.status))));
        }
        
        const toPublicUrl = (path: string) => {
          if (!path) return path;
          if (/^https?:\/\//i.test(path)) return path;
          const res = supabase.storage.from('property-images').getPublicUrl(path);
          return res.data?.publicUrl || path;
        };
        
        // Fetch booking counts for all properties
        const propertyIds = availableProperties.map((p: any) => p.id);
        let bookingCounts: Record<string, number> = {};
        
        if (propertyIds.length > 0) {
          try {
            // Fetch bookings by property_id
            const { data: bookingsByPropertyId } = await supabase
              .from('bookings')
              .select('property_id')
              .in('property_id', propertyIds);
            
            // Fetch bookings by boarding_house_id
            const { data: bookingsByBoardingHouseId } = await supabase
              .from('bookings')
              .select('boarding_house_id')
              .in('boarding_house_id', propertyIds);
            
            // Count bookings by property_id
            if (bookingsByPropertyId) {
              bookingsByPropertyId.forEach((booking: any) => {
                if (booking.property_id) {
                  bookingCounts[booking.property_id] = (bookingCounts[booking.property_id] || 0) + 1;
                }
              });
            }
            
            // Count bookings by boarding_house_id
            if (bookingsByBoardingHouseId) {
              bookingsByBoardingHouseId.forEach((booking: any) => {
                if (booking.boarding_house_id) {
                  bookingCounts[booking.boarding_house_id] = (bookingCounts[booking.boarding_house_id] || 0) + 1;
                }
              });
            }
          } catch (bookingErr) {
            console.warn('Could not fetch booking counts:', bookingErr);
          }
        }

        const mapped: Property[] = availableProperties.map((row: any) => {
          const lat = Number(row.lat);
          const lng = Number(row.lng);
          const hasCoords = !Number.isNaN(lat) && !Number.isNaN(lng) && (lat !== 0 || lng !== 0);
          const coordinates = hasCoords ? { lat, lng } : { lat: 11.7778, lng: 124.8847 };
          const bookingCount = bookingCounts[row.id] || Number(row.total_bookings) || 0;
          return {
          id: row.id,
          title: row.title,
          description: row.description,
          price: row.price,
          location: row.location,
          images: Array.isArray(row.images)
            ? row.images.filter((p: any) => p && String(p).trim() !== '').map((p: any) => toPublicUrl(String(p)))
            : (row.images && String(row.images).trim() !== '' ? [toPublicUrl(String(row.images))] : []),
          owner: 'Landlord', // Generic landlord name - no personal info
          amenities: Array.isArray(row.amenities) ? row.amenities : [],
          coordinates,
          rating: Number(row.rating) || 0,
          totalReviews: Number(row.total_reviews) || 0,
          isFeatured: Boolean(row.is_featured),
          isVerified: Boolean(row.is_verified),
          totalBookings: bookingCount
        };
        });
        
        console.log('🔄 Mapped properties for UI:', mapped);
        console.log('📱 Setting properties state...');
        setProperties(mapped);
        setFilteredProperties(mapped);
        console.log('✅ Properties state updated successfully');
        console.log('=== PROPERTIES FETCH DEBUG END ===');
        
      } catch (err) {
        console.error('❌ CRITICAL ERROR in fetchProperties:', err);
        console.error('Error stack:', err);
        // Set empty arrays on error to prevent undefined issues
        setProperties([]);
        setFilteredProperties([]);
        console.log('🔄 Set empty arrays due to error');
      } finally {
        setLoading(false);
        console.log('🏁 Loading state set to false');
      }
    };
    
    console.log('🚀 Starting fetchProperties...');
    fetchProperties();
  }, []);

  // Load rooms and beds for a property
  const loadRoomsAndBeds = async (propertyId: string) => {
    try {
      // Try to load from boarding_houses schema first, fallback to properties
      const { data: roomsData, error: roomsError } = await supabase
        .from('rooms')
        .select('*')
        .eq('boarding_house_id', propertyId)
        .eq('status', 'available')
        .order('room_number', { ascending: true });

      if (roomsError && roomsError.code !== 'PGRST116') {
        console.error('Error loading rooms:', roomsError);
        return;
      }

      if (roomsData && roomsData.length > 0) {
        setAvailableRooms(roomsData);
        
        // Load beds for the first room by default
        if (roomsData.length > 0) {
          const firstRoomId = roomsData[0].id;
          setSelectedRoomId(firstRoomId);
          await loadBedsForRoom(firstRoomId);
        }
      } else {
        // Fallback: create a default room structure if rooms table doesn't exist
        setAvailableRooms([]);
        setAvailableBeds([]);
      }
    } catch (error) {
      console.error('Failed to load rooms:', error);
      setAvailableRooms([]);
      setAvailableBeds([]);
    }
  };

  const loadBedsForRoom = async (roomId: string) => {
    setLoadingBeds(true);
    setAvailableBeds([]); // Clear previous beds while loading
    try {
      // First, get all beds for this room
      const { data: bedsData, error: bedsError } = await supabase
        .from('beds')
        .select('*')
        .eq('room_id', roomId)
        .order('bed_number', { ascending: true });

      if (bedsError && bedsError.code !== 'PGRST116') {
        console.error('Error loading beds:', bedsError);
        setAvailableBeds([]);
        setLoadingBeds(false);
        return;
      }

      if (bedsData && bedsData.length > 0) {
        // Check which beds are already booked (have approved bookings)
        const bedIds = bedsData.map((bed: any) => bed.id);
        const { data: bookingsData } = await supabase
          .from('bookings')
          .select('bed_id, status')
          .in('bed_id', bedIds)
          .eq('status', 'approved');

        const bookedBedIds = new Set(
          (bookingsData || []).map((b: any) => b.bed_id).filter(Boolean)
        );

        // Filter beds: only show available beds that are not booked
        const availableBedsList = bedsData.filter((bed: any) => {
          // Bed must be available AND not have an approved booking
          return bed.status === 'available' && !bookedBedIds.has(bed.id);
        });

        // Mark beds with their booking status for display
        const bedsWithStatus = bedsData.map((bed: any) => ({
          ...bed,
          isBooked: bookedBedIds.has(bed.id),
          canBook: bed.status === 'available' && !bookedBedIds.has(bed.id)
        }));

        setAvailableBeds(bedsWithStatus);
        
        // Auto-select first available and bookable bed
        const firstAvailableBed = bedsWithStatus.find((bed: any) => bed.canBook);
        if (firstAvailableBed) {
          setSelectedBedId(firstAvailableBed.id);
        } else {
          setSelectedBedId(''); // Clear selection if no beds available
        }
      } else {
        setAvailableBeds([]);
      }
    } catch (error) {
      console.error('Failed to load beds:', error);
      setAvailableBeds([]);
    } finally {
      setLoadingBeds(false);
    }
  };

  const showBookingPreviewModal = () => {
    if (!selectedProperty) return;
    
    // Check if property is verified - prevent booking unverified properties
    if (!selectedProperty.isVerified) {
      alert('This property is not yet verified by BoardingHub. Only verified properties can be booked for your safety and security.');
      return;
    }
    
    // Validate all required fields
    const fullName = bookingFullName.trim() || bookingName.trim();
    const email = bookingEmail.trim();
    const address = bookingAddress.trim();
    const barangay = bookingBarangay.trim();
    const municipalityCity = bookingMunicipalityCity.trim();
    const gender = bookingGender.trim();
    const age = bookingAge.trim();
    const citizenship = bookingCitizenship.trim();
    const occupationStatus = bookingOccupationStatus.trim();
    const message = bookingMessage.trim();

    if (!fullName || !email || !address || !barangay || !municipalityCity || !gender || !age || !citizenship || !occupationStatus) {
      alert('Please fill in all required fields: Full Name, Address, Barangay, Municipality/City, Gender, Age, Citizenship, and Occupation Status.');
      return;
    }

    if (!selectedRoomId || !selectedBedId) {
      alert('Please select a room and bed space.');
      return;
    }

    // Double-check that the selected bed is not occupied
    const selectedBed = availableBeds.find((bed: any) => bed.id === selectedBedId);
    if (!selectedBed || selectedBed.status !== 'available' || selectedBed.isBooked) {
      alert('The selected bed is no longer available. Please select another bed.');
      // Reload beds to refresh availability
      loadBedsForRoom(selectedRoomId);
      return;
    }

    // Get selected room and property details
    const selectedRoom = availableRooms.find((room: any) => room.id === selectedRoomId);
    
    // Prepare preview data
    const previewData = {
      fullName,
      email,
      address,
      barangay,
      municipalityCity,
      gender,
      age,
      citizenship,
      occupationStatus,
      message,
      propertyTitle: selectedProperty.title,
      propertyLocation: selectedProperty.location,
      roomNumber: selectedRoom?.room_number || 'N/A',
      roomName: selectedRoom?.room_name || 'N/A',
      bedNumber: selectedBed?.bed_number || 'N/A',
      bedType: selectedBed?.bed_type || 'N/A',
      price: selectedProperty.price || 0,
      checkInDate: selectedBed?.check_in_date || 'To be confirmed',
      checkOutDate: selectedBed?.check_out_date || 'To be confirmed'
    };

    setBookingPreviewData(previewData);
    setShowBookingPreview(true);
  };

  const handleBookProperty = async () => {
    if (!selectedProperty || !bookingPreviewData) return;
    
    // Extract data from preview
    const {
      fullName,
      email,
      address,
      barangay,
      municipalityCity,
      gender,
      age,
      citizenship,
      occupationStatus,
      message
    } = bookingPreviewData;

    // Get selected bed (re-check availability)
    const selectedBed = availableBeds.find((bed: any) => bed.id === selectedBedId);
    if (!selectedBed || selectedBed.status !== 'available' || selectedBed.isBooked) {
      alert('The selected bed is no longer available. Please select another bed.');
      // Reload beds to refresh availability
      await loadBedsForRoom(selectedRoomId);
      setShowBookingPreview(false);
      return;
    }
    try {
      // Try to insert into new bookings schema with all fields
      const bookingData: any = {
        boarding_house_id: selectedProperty.id,
        property_id: selectedProperty.id, // Fallback for old schema
        tenant_email: email,
        room_id: selectedRoomId,
        bed_id: selectedBedId,
        full_name: fullName,
        address: address,
        barangay: barangay,
        municipality_city: municipalityCity,
        gender: gender,
        age: parseInt(age),
        citizenship: citizenship,
        occupation_status: occupationStatus,
        client_name: fullName, // Fallback for old schema
        client_email: email, // Fallback for old schema
        message: message,
        status: 'pending',
        total_amount: selectedProperty.price || 0
      };

      const { error } = await supabase
        .from('bookings')
        .insert([bookingData]);
      
      if (error) {
        // If error, try with minimal fields for backward compatibility
        console.warn('Full booking insert failed, trying minimal fields:', error);
        const { error: fallbackError } = await supabase
          .from('bookings')
          .insert([
            {
              property_id: selectedProperty.id,
              client_name: fullName,
              client_email: email,
              message: `${message}\n\nAdditional Info:\nAddress: ${address}, ${barangay}, ${municipalityCity}\nGender: ${gender}, Age: ${age}\nCitizenship: ${citizenship}, Occupation: ${occupationStatus}`,
              status: 'pending',
              total_amount: selectedProperty.price || 0
            }
          ]);
        if (fallbackError) throw fallbackError;
      }

      try {
        console.log('Fetching owner email for property:', selectedProperty.id);
        const { data: propMeta, error: propError } = await supabase
          .from('properties')
          .select('owner_email, title')
          .eq('id', selectedProperty.id)
          .single();
        
        if (propError) console.error('Error fetching property owner info:', propError);

        const ownerEmail = (propMeta as any)?.owner_email || '';
        const propertyTitle = (propMeta as any)?.title || selectedProperty.title;
        
        console.log('Owner Email found:', ownerEmail);

        if (ownerEmail && ownerEmail.trim() !== '') {
          console.log(`Attempting to send landlord email to: "${ownerEmail}"`);
          const emailResult = await sendLandlordBookingEmail({
            toEmail: ownerEmail.trim(),
            ownerName: 'Landlord',
            propertyTitle,
            clientName: fullName,
            clientEmail: email,
            message: `Booking Request Details:\n\nFull Name: ${fullName}\nAddress: ${address}, ${barangay}, ${municipalityCity}\nGender: ${gender}\nAge: ${age}\nCitizenship: ${citizenship}\nOccupation Status: ${occupationStatus}\n\nMessage: ${message}`,
          });
          
          if (!emailResult.success) {
            console.error('Email sending failed:', emailResult.error);
            alert(`Booking saved, but email notification failed: ${emailResult.error?.text || 'Unknown error'}`);
          }
        } else {
            console.warn('No owner email found, skipping email notification.');
        }
      } catch (emailErr) {
        console.error('Failed to send landlord booking email:', emailErr);
      }
      alert('Booking request sent successfully!');
      setShowBookingForm(false);
      setBookingMessage('');
      setBookingName('');
      setBookingEmail('');
      setBookingFullName('');
      setBookingAddress('');
      setBookingBarangay('');
      setBookingMunicipalityCity('');
      setBookingGender('');
      setBookingAge('');
      setBookingCitizenship('');
      setBookingOccupationStatus('');
      setSelectedRoomId('');
      setSelectedBedId('');
      setAvailableRooms([]);
      
      // Refresh bookings list
      await loadMyBookings();
      setAvailableBeds([]);
    } catch (err: any) {
      console.error('Booking failed', err);
      alert(`Failed to send booking request: ${err?.message || 'Unknown error'}`);
    }
  };

  const getCurrentLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          const catbaloganLat = 11.7778;
          const catbaloganLng = 124.8847;
          const distance = Math.sqrt(Math.pow(latitude - catbaloganLat, 2) + Math.pow(longitude - catbaloganLng, 2));
          
          if (distance < 0.5) {
            setCurrentLocation('Catbalogan City, Philippines');
          } else {
            setCurrentLocation(`Lat: ${latitude.toFixed(4)}, Lng: ${longitude.toFixed(4)}`);
          }
        },
        (error) => {
          console.error('Error getting location:', error);
          setCurrentLocation('Catbalogan City, Philippines');
        }
      );
    } else {
      setCurrentLocation('Catbalogan City, Philippines');
    }
  };

  const handleLogout = () => {
    if (confirm('Are you sure you want to logout?')) {
      onBack();
    }
  };

  // Search and filter functions
  const applyFilters = () => {
    let filtered = properties;
    console.log('Applying filters:', { searchLocation, searchFilters, totalProperties: properties.length });

    // Location filter (includes title, location, and description)
    if (searchLocation.trim()) {
      filtered = filtered.filter(property =>
        property.location.toLowerCase().includes(searchLocation.toLowerCase()) ||
        property.title.toLowerCase().includes(searchLocation.toLowerCase()) ||
        (property.description && property.description.toLowerCase().includes(searchLocation.toLowerCase()))
      );
    }

    // Price filter
    filtered = filtered.filter(property =>
      property.price >= searchFilters.minPrice && property.price <= searchFilters.maxPrice
    );

    // Rating filter
    if (searchFilters.minRating > 0) {
      filtered = filtered.filter(property =>
        (property.rating || 0) >= searchFilters.minRating
      );
    }

    // Amenities filter - Fixed to handle array properly
    if (searchFilters.amenities.length > 0) {
      filtered = filtered.filter(property => {
        if (!property.amenities || !Array.isArray(property.amenities) || property.amenities.length === 0) {
          return false;
        }
        // Check if property has all selected amenities
        return searchFilters.amenities.every(amenity =>
          property.amenities.some((propAmenity: string) => 
            propAmenity.toLowerCase().trim() === amenity.toLowerCase().trim()
          )
        );
      });
    }

    // Sort by priority: most frequently booked first, then featured, then rating
    filtered.sort((a, b) => {
      // First priority: Most frequently booked (totalBookings)
      const bookingsA = a.totalBookings || 0;
      const bookingsB = b.totalBookings || 0;
      if (bookingsB !== bookingsA) {
        return bookingsB - bookingsA;
      }
      // Second priority: Featured properties
      if (a.isFeatured && !b.isFeatured) return -1;
      if (!a.isFeatured && b.isFeatured) return 1;
      // Third priority: Rating
      return (b.rating || 0) - (a.rating || 0);
    });

    console.log('Filtered results:', filtered.length, 'properties');
    setFilteredProperties(filtered);
  };

  // Load reviews for a property
  const loadReviews = async (propertyId: string) => {
    try {
      const { data: reviewsData, error } = await supabase
        .from('reviews')
        .select('id, client_name, rating, review_text, created_at')
        .eq('property_id', propertyId)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      
      const mappedReviews: Review[] = (reviewsData || []).map((r: any) => ({
        id: r.id,
        propertyId: propertyId,
        clientName: r.client_name,
        rating: r.rating,
        reviewText: r.review_text,
        createdAt: r.created_at
      }));
      
      setReviews(mappedReviews);
      
      // Update selected property rating if reviews exist
      if (mappedReviews.length > 0 && selectedProperty && selectedProperty.id === propertyId) {
        const totalRating = mappedReviews.reduce((sum, r) => sum + (r.rating || 0), 0);
        const averageRating = totalRating / mappedReviews.length;
        setSelectedProperty(prev => prev ? {
          ...prev,
          rating: averageRating,
          totalReviews: mappedReviews.length
        } : null);
      }
    } catch (error) {
      console.error('Failed to load reviews:', error);
    }
  };

  // Test database connection
  const testDatabaseConnection = async () => {
    try {
      console.log('Testing database connection...');
      console.log('Supabase URL:', process.env.REACT_APP_SUPABASE_URL || 'https://jlahqyvpgdntlqfpxvoz.supabase.co');
      console.log('Supabase Key (first 20 chars):', (process.env.REACT_APP_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImpsYWhxeXZwZ2RudGxxZnB4dm96Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTczMzY1MTAsImV4cCI6MjA3MjkxMjUxMH0.UrNCmuMXv9nPI8oXKD79aYzKI8VQnfWvprKIafk9hPg').substring(0, 20) + '...');
      
      // Test 1: Basic connection
      const { data: testData, error: testError } = await supabase
        .from('reviews')
        .select('count')
        .limit(1);
      
      if (testError) {
        console.error('Database connection test failed:', testError);
        console.error('Error details:', {
          message: testError.message,
          details: testError.details,
          hint: testError.hint,
          code: testError.code
        });
        return false;
      }
      
      console.log('Database connection test successful');
      console.log('Test data:', testData);
      
      // Test 2: Check if reviews table exists
      const { data: tableData, error: tableError } = await supabase
        .from('reviews')
        .select('id')
        .limit(1);
      
      if (tableError) {
        console.error('Reviews table access failed:', tableError);
        return false;
      }
      
      console.log('Reviews table access successful');
      return true;
    } catch (error) {
      console.error('Database connection test error:', error);
      return false;
    }
  };

  // Submit review (only allowed after booking approval)
  const submitReview = async () => {
    if (!selectedProperty || !reviewText.trim()) {
      alert('Please provide a review text');
      return;
    }

    // Validate required fields
    const reviewClientEmail = bookingEmail || clientEmail;
    const reviewClientName = bookingFullName || bookingName || 'Anonymous';
    
    if (!reviewClientEmail) {
      alert('Please provide your email address to submit a review');
      return;
    }

    try {
      // Check if user has an approved booking for this property
      console.log('Checking for approved booking...');
      const { data: approvedBookings, error: bookingCheckError } = await supabase
        .from('bookings')
        .select('id, status')
        .eq('property_id', selectedProperty.id)
        .or(`client_email.eq.${reviewClientEmail},tenant_email.eq.${reviewClientEmail}`)
        .eq('status', 'approved')
        .limit(1);

      if (bookingCheckError) {
        console.error('Error checking bookings:', bookingCheckError);
        alert('Unable to verify your booking status. Please try again later or contact support.');
        return;
      }

      if (!approvedBookings || approvedBookings.length === 0) {
        setReviewErrorMessage('You can only submit a review if your booking request has been approved by the landlord. Please wait for your booking to be approved first.');
        setShowReviewErrorModal(true);
        return;
      }

      const approvedBookingId = approvedBookings[0]?.id;

      // Test database connection first
      const connectionOk = await testDatabaseConnection();
      if (!connectionOk) {
        alert('Database connection failed. Please try again later.');
        return;
      }

      console.log('Submitting review with data:', {
        booking_id: approvedBookingId,
        property_id: selectedProperty.id,
        client_name: reviewClientName,
        client_email: reviewClientEmail,
        rating: reviewRating,
        review_text: reviewText.trim(),
        is_verified: true
      });

      // Try to insert with booking_id first (new schema), fallback to property_id (old schema)
      const reviewData: any = {
        property_id: selectedProperty.id,
        boarding_house_id: selectedProperty.id,
        client_name: reviewClientName,
        client_email: reviewClientEmail,
        tenant_email: reviewClientEmail,
        rating: reviewRating,
        review_text: reviewText.trim(),
        is_verified: true
      };

      if (approvedBookingId) {
        reviewData.booking_id = approvedBookingId;
      }

      const { data, error } = await supabase
        .from('reviews')
        .insert([reviewData])
        .select();
      
      if (error) {
        console.error('Supabase error:', error);
        throw error;
      }
      
      console.log('Review submitted successfully:', data);
      
      // Calculate rating manually as fallback (in case database trigger hasn't run yet)
        const { data: allReviews, error: reviewsError } = await supabase
          .from('reviews')
          .select('rating')
        .eq('property_id', selectedProperty.id)
        .eq('is_verified', true);
      
      let calculatedRating = 0;
      let calculatedTotalReviews = 0;
        
        if (!reviewsError && allReviews && allReviews.length > 0) {
          const totalRating = allReviews.reduce((sum, r) => sum + (r.rating || 0), 0);
        calculatedRating = Math.round((totalRating / allReviews.length) * 10) / 10;
        calculatedTotalReviews = allReviews.length;
        console.log('📊 Calculated rating from reviews:', calculatedRating, 'total reviews:', calculatedTotalReviews);
          
        // Update property rating in database (fallback if trigger didn't run)
          await supabase
            .from('properties')
            .update({
            rating: calculatedRating,
            total_reviews: calculatedTotalReviews
            })
            .eq('id', selectedProperty.id);
      }
      
      // Wait a moment for database operations to complete
      await new Promise(resolve => setTimeout(resolve, 300));
      
      // Refresh properties list to get updated ratings from database
      try {
        const { data: allUpdatedProperties, error: refreshError } = await supabase
            .from('properties')
            .select('*')
          .order('created_at', { ascending: false });
          
        if (!refreshError && allUpdatedProperties) {
            const toPublicUrl = (path: string) => {
              if (!path) return path;
              if (/^https?:\/\//i.test(path)) return path;
              const res = supabase.storage.from('property-images').getPublicUrl(path);
              return res.data?.publicUrl || path;
            };
            
          // Filter for available properties (only show verified/approved properties, not pending)
          const availableProperties = (allUpdatedProperties || []).filter((prop: any) => {
              const status = (prop?.status ? String(prop.status) : '').toLowerCase();
              // Only show available/active/vacant properties (pending properties require admin verification)
              return status === 'available' || status === 'active' || status === 'vacant';
            });
            
            const mapped: Property[] = availableProperties.map((row: any) => {
              const lat = Number(row.lat);
              const lng = Number(row.lng);
              const hasCoords = !Number.isNaN(lat) && !Number.isNaN(lng) && (lat !== 0 || lng !== 0);
              const coordinates = hasCoords ? { lat, lng } : { lat: 11.7778, lng: 124.8847 };
            
            // Use calculated rating if database rating is 0 or missing
            let finalRating = Number(row.rating) || 0;
            let finalTotalReviews = Number(row.total_reviews) || 0;
            
            if (row.id === selectedProperty.id && calculatedRating > 0) {
              // For the property we just reviewed, use calculated values if DB values are stale
              if (finalRating === 0 || finalTotalReviews === 0) {
                finalRating = calculatedRating;
                finalTotalReviews = calculatedTotalReviews;
                console.log('🔄 Using calculated rating for property:', row.title, finalRating);
              }
            }
            
              return {
                id: row.id,
                title: row.title,
                description: row.description,
                price: row.price,
                location: row.location,
                images: Array.isArray(row.images)
                  ? row.images.filter((p: any) => p && String(p).trim() !== '').map((p: any) => toPublicUrl(String(p)))
                  : (row.images && String(row.images).trim() !== '' ? [toPublicUrl(String(row.images))] : []),
                owner: 'Landlord',
                amenities: Array.isArray(row.amenities) ? row.amenities : [],
                coordinates,
              rating: finalRating,
              totalReviews: finalTotalReviews,
                isFeatured: Boolean(row.is_featured),
                isVerified: Boolean(row.is_verified)
              };
            });
          
          console.log('🔄 Refreshing properties after review submission');
          console.log('📊 Updated properties with ratings:', mapped.map(p => ({ 
            id: p.id, 
            title: p.title, 
            rating: p.rating, 
            totalReviews: p.totalReviews 
          })));
          
            setProperties(mapped);
          setFilteredProperties(mapped);
          
          // Update selected property with fresh data
          const updatedProperty = mapped.find(p => p.id === selectedProperty.id);
          if (updatedProperty) {
            setSelectedProperty(updatedProperty);
            console.log('✅ Updated selected property rating:', updatedProperty.rating, 'reviews:', updatedProperty.totalReviews);
          }
          
            // Trigger filter update to refresh filtered properties
            setTimeout(() => {
              applyFilters();
            }, 100);
        } else if (refreshError) {
          console.error('❌ Error refreshing properties:', refreshError);
          }
      } catch (refreshError) {
        console.error('Failed to refresh properties:', refreshError);
      }
      
      alert('Review submitted successfully! Your review is now visible.');
      setShowReviewForm(false);
      setReviewText('');
      setReviewRating(5);
      
      // Reload reviews
      loadReviews(selectedProperty.id);
    } catch (error) {
      console.error('Failed to submit review:', error);
      console.error('Error type:', typeof error);
      console.error('Error details:', {
        message: error instanceof Error ? error.message : 'No message',
        stack: error instanceof Error ? error.stack : 'No stack',
        name: error instanceof Error ? error.name : 'No name',
        ...(error instanceof Error && 'cause' in error ? { cause: (error as any).cause } : {})
      });
      
      let errorMessage = 'Unknown error';
      if (error instanceof Error) {
        errorMessage = error.message;
      } else if (typeof error === 'object' && error !== null) {
        errorMessage = JSON.stringify(error);
      }
      
      alert(`Failed to submit review: ${errorMessage}`);
    }
  };

  // Load reviews when property is selected
  useEffect(() => {
    if (selectedProperty && !showMaps && !showBookingForm) {
      loadReviews(selectedProperty.id);
    }
  }, [selectedProperty?.id, showMaps, showBookingForm]);

  // Load rooms and beds when booking form is opened
  useEffect(() => {
    if (showBookingForm && selectedProperty) {
      loadRoomsAndBeds(selectedProperty.id);
    }
  }, [showBookingForm, selectedProperty?.id]);

  // Apply filters when search or filters change
  useEffect(() => {
    applyFilters();
  }, [searchLocation, searchFilters, properties]);

  const openConversation = async (conversation: { id: string; property_id: string; owner_email: string; client_email: string }) => {
    try {
      // Verify this conversation belongs to the current tenant
      if (conversation.client_email !== clientEmail) {
        alert('You can only access your own conversations.');
        return;
      }
      
      setActiveConversation(conversation);
      setChatOpen(true);
      setChatLoading(true);
      const { data: msgs, error: msgErr } = await supabase
        .from('messages')
        .select('*')
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
      console.error('Open conversation failed', e);
      alert('Failed to open chat');
    } finally {
      setChatLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-screen bg-white overflow-y-auto">
        {/* Top Orange Bar */}
        <div className="w-full h-1 bg-gradient-to-r from-primary-500 via-primary-600 to-primary-700"></div>
        
        {/* Location Header - Glassmorphism */}
        <div className="backdrop-blur-xl bg-white/70 border-b border-white/20 px-3 sm:px-6 py-3 sm:py-4 flex-shrink-0 sticky top-0 z-40 shadow-sm">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between w-full gap-3 sm:gap-4">
            <div className="flex items-center space-x-2 sm:space-x-4 w-full sm:w-auto">
              <div className="flex-1 sm:flex-none">
                <p className="text-xs sm:text-sm text-gray-500">Your Location</p>
                <div className="flex items-center space-x-2">
                  <h1 className="text-lg sm:text-xl font-bold text-gray-900 truncate max-w-[50vw] sm:max-w-[60vw]">{currentLocation}</h1>
                  <button
                    onClick={getCurrentLocation}
                    className="text-primary-600 hover:text-primary-700 transition-colors duration-200 flex-shrink-0"
                    title="Get current location"
                  >
                    <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                  </button>
                </div>
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-2 sm:gap-4 w-full sm:w-auto">
              <div className="flex items-center space-x-2 flex-1 sm:flex-none min-w-0">
                <div className="relative flex-1 sm:flex-none sm:w-64">
                  <input
                    type="text"
                    placeholder="Search properties..."
                    value={searchLocation}
                    onChange={(e) => setSearchLocation(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        applyFilters();
                      }
                    }}
                    className="w-full sm:w-64 pl-3 sm:pl-4 pr-8 sm:pr-10 py-2 sm:py-3 backdrop-blur-md bg-white/60 rounded-xl border border-white/30 focus:outline-none focus:ring-2 focus:ring-primary-500/50 focus:border-primary-300/50 text-sm sm:text-base text-gray-900 placeholder-gray-500 shadow-sm"
                  />
                  <svg className="absolute right-2 sm:right-3 top-1/2 transform -translate-y-1/2 w-4 h-4 sm:w-5 sm:h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </div>
                <button
                  onClick={applyFilters}
                  className="glass-button px-3 sm:px-4 py-2 sm:py-3 rounded-xl transition-all duration-200 flex items-center space-x-1 sm:space-x-2 flex-shrink-0 transform hover:-translate-y-0.5"
                >
                  <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                  <span className="hidden sm:inline">Search</span>
                </button>
                {searchLocation && (
                  <button
                    onClick={() => {
                      setSearchLocation('');
                      applyFilters();
                    }}
                    className="backdrop-blur-md bg-white/60 text-gray-700 px-3 sm:px-4 py-2 sm:py-3 rounded-xl hover:bg-white/80 transition-all duration-200 flex items-center space-x-1 sm:space-x-2 flex-shrink-0 border border-white/30 shadow-sm"
                  >
                    <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                    <span className="hidden sm:inline">Clear</span>
                  </button>
                )}
              </div>
              <button
                onClick={() => setShowFilters(!showFilters)}
                className="glass-button px-3 sm:px-4 py-2 sm:py-3 rounded-xl transition-all duration-200 flex items-center space-x-1 sm:space-x-2 flex-shrink-0"
              >
                <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.207A1 1 0 013 6.5V4z" />
                </svg>
                <span className="font-medium text-sm sm:text-base">Filters</span>
              </button>
              
              {/* View Toggle - Properties / My Bookings */}
              <div className="flex items-center gap-2 backdrop-blur-md bg-white/60 rounded-xl p-1 border border-white/30 shadow-sm">
                <button
                  onClick={() => setActiveView('properties')}
                  className={`px-3 sm:px-4 py-2 rounded-lg transition-all duration-200 text-sm font-semibold ${
                    activeView === 'properties'
                      ? 'bg-gradient-to-r from-primary-500 to-primary-600 text-white shadow-md'
                      : 'text-gray-700 hover:bg-white/80'
                  }`}
                >
                  Properties
                </button>
                <button
                  onClick={() => setActiveView('bookings')}
                  className={`px-3 sm:px-4 py-2 rounded-lg transition-all duration-200 text-sm font-semibold relative ${
                    activeView === 'bookings'
                      ? 'bg-primary-600 text-white shadow-md'
                      : 'text-gray-700 hover:bg-white/80'
                  }`}
                >
                  My Bookings
                  {myBookings.length > 0 && (
                    <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full">
                      {myBookings.length}
                    </span>
                  )}
                </button>
              </div>
              {/* Notifications Bell */}
              <div className="relative">
                <button
                  onClick={() => setShowNotif(!showNotif)}
                  className="relative text-gray-600 hover:text-gray-800 transition-colors duration-200 p-1"
                  title="Notifications"
                >
                  <svg className="w-5 h-5 sm:w-6 sm:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2 2 0 0118 14.158V11a6 6 0 10-12 0v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                  </svg>
                  {(() => {
                    const unreadCount = notifications.filter(n => !n.read_at).length;
                    return unreadCount > 0 ? (
                      <span className="absolute -top-1 -right-1 sm:-top-2 sm:-right-2 bg-red-600 text-white text-[10px] sm:text-xs font-bold px-1.5 sm:px-2 py-0.5 rounded-full">
                        {unreadCount}
                      </span>
                    ) : null;
                  })()}
                </button>
                {showNotif && (
                  <div className="absolute right-0 top-10 sm:top-12 w-[calc(100vw-2rem)] sm:w-96 max-w-sm backdrop-blur-xl bg-white/80 rounded-2xl shadow-2xl border border-white/30 py-2 z-50">
                    <div className="px-3 pb-2 pt-1 border-b flex items-center justify-between">
                      <span className="font-semibold">Notifications</span>
                      <button
                        onClick={async () => {
                          if (!clientEmail) return;
                          try {
                            const unreadNotifications = notifications.filter(n => !n.read_at);
                            if (unreadNotifications.length === 0) return;
                            
                            const { error } = await supabase
                              .from('notifications')
                              .update({ read_at: new Date().toISOString() })
                              .eq('recipient_email', clientEmail)
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
                        className="text-xs text-primary-600 hover:text-primary-700"
                      >Mark all read</button>
                    </div>
                    <div className="max-h-96 overflow-y-auto">
                      {notifications.length === 0 && (
                        <div className="p-4 text-sm text-gray-600">No notifications</div>
                      )}
                      {notifications.slice(0, 20).map((n) => (
                        <div key={n.id} className={`px-3 py-2 hover:bg-white/40 backdrop-blur-sm border-b border-white/20 last:border-b-0 transition-colors ${!n.read_at ? 'bg-primary-50/30' : ''}`}>
                          <div className="text-sm font-semibold text-gray-900">{n.title}</div>
                          <div className="text-xs text-gray-600 mt-0.5">{n.body}</div>
                          <div className="text-[10px] text-gray-500 mt-1">{new Date(n.created_at).toLocaleString()}</div>
                          {(n.type === 'booking_approved' || n.type === 'chat_message') && (
                            <div className="mt-2">
                              <button
                                onClick={async () => {
                                  try {
                                    // Only access conversations for this tenant
                                    const { data: convs, error: convErr } = await supabase
                                      .from('conversations')
                                      .select('*')
                                      .eq('property_id', n.property_id)
                                      .eq('client_email', clientEmail)
                                      .order('created_at', { ascending: false })
                                      .limit(1);
                                    if (convErr) throw convErr;
                                    let conversation = convs && convs[0];
                                    if (!conversation) {
                                      // Try to create a conversation - but only if we have the necessary info
                                      // We need to get owner_email from the property, but this should be done securely
                                      const { data: propRow, error: propErr } = await supabase
                                        .from('properties')
                                        .select('owner_email')
                                        .eq('id', n.property_id)
                                        .single();
                                      if (propErr) throw propErr;
                                      const ownerEmail = (propRow as any)?.owner_email || '';
                                      if (!ownerEmail) {
                                        alert('Chat not available yet. Please try again later.');
                                        return;
                                      }
                                      const { data: created, error: insErr } = await supabase
                                        .from('conversations')
                                        .insert([{ property_id: n.property_id, owner_email: ownerEmail, client_email: clientEmail }])
                                        .select('*')
                                        .single();
                                      if (insErr) throw insErr;
                                      conversation = created;
                                    }
                                    
                                    // Verify the conversation belongs to this tenant
                                    if (conversation.client_email !== clientEmail) {
                                      alert('You can only access your own conversations.');
                                      return;
                                    }
                                    
                                    setActiveConversation(conversation);
                                    setChatOpen(true);
                                    setChatLoading(true);
                                    const { data: msgs, error: msgErr } = await supabase
                                      .from('messages')
                                      .select('*')
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
                                    console.error('Open chat (tenant) failed', e);
                                    alert('Failed to open chat');
                                  } finally {
                                    setChatLoading(false);
                                  }
                                }}
                                className="text-xs text-primary-600 hover:text-primary-700 font-semibold"
                              >Open Chat</button>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
              <div className="relative">
                <button 
                  onClick={() => setShowMenu(!showMenu)}
                  className="text-gray-600 hover:text-gray-800 transition-colors duration-200"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                  </svg>
                </button>
                
                {/* Dropdown Menu */}
                {showMenu && (
                  <div className="absolute right-0 top-10 w-48 backdrop-blur-xl bg-white/80 rounded-2xl shadow-2xl border border-white/30 py-2 z-50">
                    <button
                      onClick={async () => {
                        setShowMenu(false);
                        // Load profile data for viewing
                        try {
                          const email = clientEmail || user?.email;
                          if (!email) {
                            alert('Email not found');
                            return;
                          }

                          // Try to load from user_profiles
                          const { data: userProfile } = await supabase
                            .from('user_profiles')
                            .select('*')
                            .eq('user_email', email)
                            .single();

                          // Try to load from app_users
                          const { data: appUser } = await supabase
                            .from('app_users')
                            .select('*')
                            .eq('email', email)
                            .single();

                          const profile = userProfile || appUser;
                          setViewProfileData({
                            full_name: profile?.full_name || user?.user_metadata?.full_name || 'N/A',
                            email: email,
                            phone: profile?.phone || 'N/A',
                            address: profile?.address || 'N/A',
                            barangay: profile?.barangay || 'N/A',
                            city: profile?.city || 'N/A',
                            profile_image_url: profile?.profile_image_url || null,
                            id_document_url: profile?.id_document_url || null
                          });
                          setShowViewProfile(true);
                        } catch (error) {
                          console.error('Failed to load profile:', error);
                          // Still show modal with available data
                          const email = clientEmail || user?.email || '';
                          setViewProfileData({
                            full_name: user?.user_metadata?.full_name || 'N/A',
                            email: email,
                            phone: 'N/A',
                            address: 'N/A',
                            barangay: 'N/A',
                            city: 'N/A',
                            profile_image_url: null,
                            id_document_url: null
                          });
                          setShowViewProfile(true);
                        }
                      }}
                      className="w-full px-4 py-3 text-left hover:bg-gray-50 flex items-center space-x-3"
                    >
                      <svg className="w-5 h-5 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                      </svg>
                      <span className="text-gray-700 font-medium">View Profile</span>
                    </button>

                    <button
                      onClick={async () => {
                        setShowMenu(false);
                        // Load profile data for editing
                        try {
                          const email = clientEmail || user?.email;
                          if (!email) {
                            alert('Email not found');
                            return;
                          }

                          // Try to load from user_profiles
                          const { data: userProfile } = await supabase
                            .from('user_profiles')
                            .select('*')
                            .eq('user_email', email)
                            .single();

                          // Try to load from app_users
                          const { data: appUser } = await supabase
                            .from('app_users')
                            .select('*')
                            .eq('email', email)
                            .single();

                          const profile = userProfile || appUser;
                          setProfileData({
                            full_name: profile?.full_name || user?.user_metadata?.full_name || '',
                            phone: profile?.phone || '',
                            address: profile?.address || '',
                            barangay: profile?.barangay || '',
                            city: profile?.city || '',
                            profile_image_url: profile?.profile_image_url || '',
                            id_document_url: profile?.id_document_url || '',
                            email: user?.email || ''
                          });
                          setProfileImagePreview(profile?.profile_image_url || null);
                          setIdDocumentPreview(profile?.id_document_url || null);
                          setShowEditProfile(true);
                        } catch (error) {
                          console.error('Failed to load profile:', error);
                          // Still show modal with empty/default data
                          setProfileData({
                            full_name: user?.user_metadata?.full_name || '',
                            phone: '',
                            address: '',
                            barangay: '',
                            city: '',
                            profile_image_url: '',
                            id_document_url: '',
                            email: user?.email || ''
                          });
                          setShowEditProfile(true);
                        }
                      }}
                      className="w-full px-4 py-3 text-left hover:bg-gray-50 flex items-center space-x-3"
                    >
                      <svg className="w-5 h-5 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                      </svg>
                      <span className="text-gray-700 font-medium">Edit Profile</span>
                    </button>

                    <button
                      onClick={() => {
                        setShowMaps(true);
                        setShowMenu(false);
                      }}
                      className="w-full px-4 py-3 text-left hover:bg-gray-50 flex items-center space-x-3"
                    >
                      <svg className="w-5 h-5 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
                      </svg>
                      <span className="text-gray-700 font-medium">Maps</span>
                    </button>


                    <button
                      onClick={handleLogout}
                      className="w-full px-4 py-3 text-left hover:bg-red-50 flex items-center space-x-3 text-red-600"
                    >
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
        </div>

        {/* Filters Panel */}
        {showFilters && (
          <div className="backdrop-blur-xl bg-white/70 rounded-3xl shadow-2xl border border-white/30 p-4 sm:p-6 mb-4 sm:mb-6 mx-3 sm:mx-6">
            <h3 className="text-base sm:text-lg font-bold text-gray-900 mb-3 sm:mb-4">Filter Properties</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Min Price (₱)</label>
                <input
                  type="number"
                  value={searchFilters.minPrice}
                  onChange={(e) => setSearchFilters(prev => ({ ...prev, minPrice: Number(e.target.value) }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                  placeholder="0"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Max Price (₱)</label>
                <input
                  type="number"
                  value={searchFilters.maxPrice}
                  onChange={(e) => setSearchFilters(prev => ({ ...prev, maxPrice: Number(e.target.value) }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                  placeholder="50000"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Min Rating</label>
                <select
                  value={searchFilters.minRating}
                  onChange={(e) => setSearchFilters(prev => ({ ...prev, minRating: Number(e.target.value) }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                >
                  <option value={0}>Any Rating</option>
                  <option value={1}>1+ Stars</option>
                  <option value={2}>2+ Stars</option>
                  <option value={3}>3+ Stars</option>
                  <option value={4}>4+ Stars</option>
                  <option value={5}>5 Stars</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Amenities</label>
                <div className="grid grid-cols-2 gap-2">
                  {['WiFi', 'Air Conditioning', 'Private Kitchen', 'Shared Kitchen', 'Laundry', 'Parking', 'Security', 'Gym'].map(amenity => (
                    <label key={amenity} className="flex items-center space-x-2 text-sm">
                      <input
                        type="checkbox"
                        checked={searchFilters.amenities.includes(amenity)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSearchFilters(prev => ({ 
                              ...prev, 
                              amenities: [...prev.amenities, amenity] 
                            }));
                          } else {
                            setSearchFilters(prev => ({ 
                              ...prev, 
                              amenities: prev.amenities.filter(a => a !== amenity) 
                            }));
                          }
                        }}
                        className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                      />
                      <span>{amenity}</span>
                    </label>
                  ))}
                </div>
              </div>
            </div>
            <div className="mt-4 flex justify-end">
              <button
                onClick={() => setSearchFilters({
                  minPrice: 0,
                  maxPrice: 50000,
                  minRating: 0,
                  amenities: [],
                  location: ''
                })}
                className="px-4 py-2 text-gray-600 hover:text-gray-800 font-medium"
              >
                Clear Filters
              </button>
            </div>
          </div>
        )}

        {/* My Bookings Section */}
        {activeView === 'bookings' && (
          <div className="px-3 sm:px-6 py-3 sm:py-4 flex-shrink-0">
            <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-3 sm:mb-4">My Bookings</h2>
            {loadingBookings ? (
              <div className="text-center py-8">
                <div className="text-gray-600">Loading your bookings...</div>
              </div>
            ) : myBookings.length === 0 ? (
              <div className="text-center py-12 backdrop-blur-xl bg-white/70 rounded-3xl shadow-2xl border border-white/30">
                <svg className="w-16 h-16 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
                <p className="text-gray-600 text-lg mb-2">No bookings yet</p>
                <p className="text-gray-500 text-sm">Start browsing properties and make your first booking!</p>
              </div>
            ) : (
              <div className="space-y-4">
                {myBookings.map((booking) => {
                  const property = booking.properties || {};
                  const statusColors = {
                    pending: 'bg-yellow-100 text-yellow-800 border-yellow-300',
                    approved: 'bg-green-100 text-green-800 border-green-300',
                    rejected: 'bg-red-100 text-red-800 border-red-300'
                  };
                  const statusLabels = {
                    pending: 'Pending',
                    approved: 'Approved',
                    rejected: 'Rejected'
                  };
                  
                  return (
                    <div
                      key={booking.id}
                      className="backdrop-blur-xl bg-white/70 rounded-3xl shadow-2xl border border-white/30 p-4 sm:p-6 hover:shadow-3xl transition-all duration-300"
                    >
                      <div className="flex flex-col sm:flex-row gap-4">
                        {/* Property Image */}
                        {property.images && property.images.length > 0 && (
                          <div className="w-full sm:w-48 h-48 sm:h-32 rounded-xl overflow-hidden flex-shrink-0">
                            <img
                              src={Array.isArray(property.images) ? property.images[0] : property.images}
                              alt={property.title || 'Property'}
                              className="w-full h-full object-cover"
                            />
                          </div>
                        )}
                        
                        {/* Booking Details */}
                        <div className="flex-1">
                          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 mb-3">
                            <div>
                              <h3 className="text-lg sm:text-xl font-bold text-gray-900 mb-1">
                                {property.title || 'Property'}
                              </h3>
                              <p className="text-sm text-gray-600 mb-2">{property.location || 'Location not specified'}</p>
                              {booking.check_in_date && booking.check_out_date && (
                                <div className="text-sm text-gray-600">
                                  <span className="font-semibold">Check-in:</span> {new Date(booking.check_in_date).toLocaleDateString()}
                                  {' • '}
                                  <span className="font-semibold">Check-out:</span> {new Date(booking.check_out_date).toLocaleDateString()}
                                </div>
                              )}
                            </div>
                            
                            {/* Status Badge */}
                            <div className="flex items-start gap-3">
                              <span className={`px-4 py-2 rounded-full text-sm font-semibold border-2 ${
                                statusColors[booking.status as keyof typeof statusColors] || statusColors.pending
                              }`}>
                                {statusLabels[booking.status as keyof typeof statusLabels] || booking.status}
                              </span>
                            </div>
                          </div>
                          
                          {/* Booking Info */}
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-3">
                            <div>
                              <p className="text-xs text-gray-500 mb-1">Booking ID</p>
                              <p className="text-sm font-mono text-gray-700">{booking.id.substring(0, 8)}...</p>
                            </div>
                            <div>
                              <p className="text-xs text-gray-500 mb-1">Booking Date</p>
                              <p className="text-sm text-gray-700">{new Date(booking.created_at).toLocaleDateString()}</p>
                            </div>
                            
                            {/* Room Information */}
                            {booking.room && (
                              <div className="bg-primary-50 rounded-lg p-3 border border-primary-200">
                                <p className="text-xs text-gray-500 mb-2 font-semibold">Room Details</p>
                                <div className="flex items-center gap-2 mb-1">
                                  <svg className="w-5 h-5 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                                  </svg>
                                  <p className="text-sm font-bold text-gray-900">
                                    {booking.room.room_name || `Room ${booking.room.room_number}`}
                                  </p>
                                </div>
                                {booking.room.room_number && (
                                  <p className="text-xs text-gray-600">Room Number: {booking.room.room_number}</p>
                                )}
                                {booking.room.max_beds && (
                                  <p className="text-xs text-gray-600">Max Capacity: {booking.room.max_beds} beds</p>
                                )}
                                {booking.room.price_per_bed && (
                                  <p className="text-xs text-primary-600 font-semibold">₱{Number(booking.room.price_per_bed).toLocaleString()}/bed</p>
                                )}
                              </div>
                            )}
                            
                            {/* Bed Information */}
                            {booking.bed && (
                              <div className="bg-purple-50 rounded-lg p-3 border border-purple-200">
                                <p className="text-xs text-gray-500 mb-2 font-semibold">Bed Details</p>
                                <div className="flex items-center gap-2 mb-1">
                                  <svg className="w-5 h-5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                                  </svg>
                                  <p className="text-sm font-bold text-gray-900">
                                    {booking.bed.bed_number}
                                  </p>
                                  {booking.bed.deck_position && (
                                    <span className="text-xs px-2 py-1 bg-purple-200 text-purple-800 rounded-full font-semibold">
                                      {booking.bed.deck_position.toUpperCase()}
                                    </span>
                                  )}
                                </div>
                                <div className="flex flex-wrap items-center gap-2 mt-2">
                                  <span className={`text-xs px-2 py-1 rounded-full font-semibold ${
                                    booking.bed.bed_type === 'single' ? 'bg-primary-100 text-primary-800' :
                                    booking.bed.bed_type === 'double_deck_upper' ? 'bg-green-100 text-green-800' :
                                    booking.bed.bed_type === 'double_deck_lower' ? 'bg-orange-100 text-orange-800' :
                                    'bg-gray-100 text-gray-800'
                                  }`}>
                                    {booking.bed.bed_type === 'single' ? 'Single Bed' :
                                     booking.bed.bed_type === 'double_deck_upper' ? 'Upper Deck' :
                                     booking.bed.bed_type === 'double_deck_lower' ? 'Lower Deck' :
                                     booking.bed.bed_type}
                                  </span>
                                  {booking.bed.status && (
                                    <span className={`text-xs px-2 py-1 rounded-full font-semibold ${
                                      booking.bed.status === 'available' ? 'bg-green-100 text-green-800' :
                                      booking.bed.status === 'occupied' ? 'bg-red-100 text-red-800' :
                                      'bg-yellow-100 text-yellow-800'
                                    }`}>
                                      {booking.bed.status.charAt(0).toUpperCase() + booking.bed.status.slice(1)}
                                    </span>
                                  )}
                                </div>
                                {booking.bed.price && (
                                  <p className="text-xs text-purple-600 font-semibold mt-2">₱{Number(booking.bed.price).toLocaleString()}</p>
                                )}
                              </div>
                            )}
                            
                            {booking.total_amount && (
                              <div>
                                <p className="text-xs text-gray-500 mb-1">Total Amount</p>
                                <p className="text-lg font-bold text-primary-600">₱{Number(booking.total_amount).toLocaleString()}</p>
                              </div>
                            )}
                            {booking.payment_status && (
                              <div>
                                <p className="text-xs text-gray-500 mb-1">Payment Status</p>
                                <p className="text-sm text-gray-700 capitalize">{booking.payment_status}</p>
                              </div>
                            )}
                          </div>
                          
                          {/* Message/Notes */}
                          {booking.message && (
                            <div className="mt-3 p-3 bg-gray-50 rounded-lg">
                              <p className="text-xs text-gray-500 mb-1">Your Message</p>
                              <p className="text-sm text-gray-700">{booking.message}</p>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* Most Booked Section (from database only) */}
        {!showFilters && activeView === 'properties' && (
        <div className="px-3 sm:px-6 py-3 sm:py-4 flex-shrink-0">
          <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-3 sm:mb-4">Most Booked</h2>
          {loading && (
            <div className="text-sm sm:text-base text-gray-600">Loading properties...</div>
          )}
          {!loading && properties.length === 0 && (
            <div className="text-center py-6 sm:py-8">
              <div className="text-gray-500 text-base sm:text-lg mb-2">No properties available</div>
              <div className="text-xs sm:text-sm text-gray-400">Check back later or try adjusting your search filters.</div>
            </div>
          )}
          {!loading && properties.length > 0 && (() => {
            // Sort properties by totalBookings (most booked first), then by rating
            const mostBooked = [...properties].sort((a, b) => {
              const bookingsA = a.totalBookings || 0;
              const bookingsB = b.totalBookings || 0;
              if (bookingsB !== bookingsA) return bookingsB - bookingsA;
              const ratingA = a.rating || 0;
              const ratingB = b.rating || 0;
              return ratingB - ratingA;
            }).slice(0, 3);
            
            return (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
              {mostBooked.map((property) => (
                <div key={property.id} className="backdrop-blur-xl bg-white/70 rounded-3xl shadow-2xl border border-white/30 overflow-hidden hover:shadow-3xl transition-all duration-300">
                  <div className="h-48 relative">
                    {property.images && property.images.length > 0 ? (
                      <ImageCarousel 
                        images={property.images} 
                        alt={property.title}
                        className="absolute inset-0 w-full h-full"
                        bucket="property-images"
                      />
                    ) : (
                      <div className="h-full bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center">
                        <span className="text-gray-500 font-medium">No image</span>
                    </div>
                    )}
                  </div>
                  <div className="p-4">
                    <h3 className="font-bold text-lg text-gray-900 mb-1">{property.title}</h3>
                    <p className="text-gray-600 text-sm mb-2">{property.location}</p>
                    <div className="flex items-center gap-2 mb-2">
                      <div className="flex items-center gap-1 text-sm text-gray-600">
                        <svg className="w-4 h-4 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                        </svg>
                        <span className="font-semibold text-gray-700">{property.totalBookings || 0}</span>
                        <span className="text-gray-500">booking{property.totalBookings !== 1 ? 's' : ''}</span>
                      </div>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-primary-600 font-bold text-lg">₱{property.price.toLocaleString()}</span>
                      <button onClick={() => { setSelectedProperty(property); /* setShowMaps(true); */ }} className="text-primary-600 hover:text-primary-700 text-sm font-semibold">View</button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
            );
          })()}
        </div>
        )}

        {/* New Listings Section */}
        <div className="px-3 sm:px-6 py-3 sm:py-4 flex-1 overflow-y-auto overflow-x-hidden">
          <div className="flex items-center mb-3 sm:mb-4">
            <svg className="w-4 h-4 sm:w-5 sm:h-5 text-primary-600 mr-2 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
            </svg>
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between w-full gap-2 sm:gap-0">
              <h2 className="text-xl sm:text-2xl font-bold text-gray-900">New Listings</h2>
              {searchLocation && (
                <span className="text-xs sm:text-sm text-gray-600">
                  {filteredProperties.length} result{filteredProperties.length !== 1 ? 's' : ''} found
                </span>
              )}
            </div>
          </div>
          <div className="space-y-4 w-full">
            {loading && (
              <div className="text-center text-gray-600">Loading properties...</div>
            )}
            {filteredProperties.map((property, index) => (
              <div
                key={property.id}
                className="backdrop-blur-xl bg-white/70 rounded-3xl shadow-2xl border border-white/30 p-4 hover:shadow-3xl hover:bg-white/80 transition-all duration-300 cursor-pointer transform hover:-translate-y-1"
                onClick={() => { setSelectedProperty(property); /* setShowMaps(true); */ }}
              >
                <div className="flex items-center space-x-4">
                  <div className="w-14 h-14 rounded-xl overflow-hidden bg-gray-100 flex items-center justify-center flex-shrink-0">
                    {property.images && property.images[0] ? (
                      <ImageWithFallback src={property.images[0]} alt={property.title} className="w-full h-full object-cover" data-sb-bucket="property-images" data-sb-path={property.images[0]} />
                    ) : (
                    <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <h3 className="font-bold text-lg text-gray-900 truncate">{property.title}</h3>
                      {property.isVerified ? (
                        <span className="px-2 py-1 rounded-full text-xs font-semibold bg-gradient-to-r from-green-500 to-green-600 text-white flex items-center gap-1 shadow-md">
                          <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                          </svg>
                          BH Verified
                        </span>
                      ) : (
                        <span className="px-2 py-1 rounded-full text-xs font-semibold bg-gradient-to-r from-gray-400 to-gray-500 text-white flex items-center gap-1 shadow-md">
                          <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-13a1 1 0 10-2 0v3.586L7.707 7.293a1 1 0 00-1.414 1.414l3 3a1 1 0 001.414 0l3-3a1 1 0 00-1.414-1.414L11 8.586V5z" clipRule="evenodd" />
                          </svg>
                          Pending Verification
                        </span>
                      )}
                    </div>
                    <p className="text-gray-600 text-sm truncate">{property.location}</p>
                    <div className="mt-2 flex items-center gap-3">
                      <span className="text-primary-600 font-bold text-lg">₱{property.price.toLocaleString()}/month</span>
                      <div className="flex items-center gap-1 text-xs text-gray-600">
                        <svg className="w-3.5 h-3.5 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                        </svg>
                        <span className="font-semibold text-gray-700">{property.totalBookings || 0}</span>
                        <span className="text-gray-500">booking{property.totalBookings !== 1 ? 's' : ''}</span>
                      </div>
                    </div>
                    <div className="mt-3">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedProperty(property);
                        }}
                        className="glass-button px-4 py-2 rounded-lg transition-colors duration-200 text-sm font-medium flex items-center space-x-2"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                        </svg>
                        <span>View</span>
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
            {!loading && filteredProperties.length === 0 && (
              <div className="text-center py-8">
                <div className="text-gray-500 text-lg mb-2">
                  {searchLocation ? 'No properties found matching your search.' : 
                   properties.length === 0 ? 'No properties available at the moment. Please check back later or contact an administrator.' :
                   'No properties found matching your filters.'}
                </div>
                {searchLocation && (
                  <button
                    onClick={() => {
                      setSearchLocation('');
                      applyFilters();
                    }}
                    className="text-primary-600 hover:text-primary-700 font-medium"
                  >
                    Clear search and show all properties
                  </button>
                )}
                {properties.length === 0 && !searchLocation && (
                  <div className="mt-4 text-sm text-gray-400">
                    <p>This could mean:</p>
                    <ul className="list-disc list-inside mt-2 space-y-1">
                      <li>No properties have been added yet</li>
                      <li>All properties are currently unavailable</li>
                      <li>There might be a database connection issue</li>
                    </ul>
                    <p className="mt-2">Check the browser console for more details.</p>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

          {/* Enhanced Booking Form Modal */}
          {showBookingForm && selectedProperty && (
            <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 z-50">
              <div className="backdrop-blur-2xl bg-white/80 rounded-3xl max-w-2xl w-full p-4 sm:p-6 md:p-8 shadow-2xl border border-white/40 max-h-[90vh] overflow-y-auto">
                <div className="text-center mb-6">
                  <div className="w-16 h-16 bg-primary-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <svg className="w-8 h-8 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                  </div>
                  <h3 className="text-2xl font-bold text-gray-900 mb-2">Complete Booking Form</h3>
                  <p className="text-gray-600">
                    Fill in all required information to book <span className="font-semibold text-primary-600">{selectedProperty.title}</span>
                  </p>
                </div>
                
                {/* Personal Information Section */}
                <div className="mb-6">
                  <h4 className="text-lg font-semibold text-gray-900 mb-4 pb-2 border-b">Personal Information</h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="sm:col-span-2">
                      <label className="block text-sm font-semibold text-gray-700 mb-2">Full Name <span className="text-red-500">*</span></label>
                      <input 
                        value={bookingFullName} 
                        onChange={(e) => setBookingFullName(e.target.value)} 
                        placeholder="Juan Dela Cruz" 
                        className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent text-gray-900" 
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">Email <span className="text-red-500">*</span></label>
                      <input 
                        type="email" 
                        value={bookingEmail} 
                        onChange={(e) => setBookingEmail(e.target.value)} 
                        placeholder="juan@email.com" 
                        className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent text-gray-900" 
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">Gender <span className="text-red-500">*</span></label>
                      <select 
                        value={bookingGender} 
                        onChange={(e) => setBookingGender(e.target.value)} 
                        className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent text-gray-900"
                        required
                      >
                        <option value="">Select Gender</option>
                        <option value="Male">Male</option>
                        <option value="Female">Female</option>
                        <option value="Other">Other</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">Age <span className="text-red-500">*</span></label>
                      <input 
                        type="number" 
                        value={bookingAge} 
                        onChange={(e) => setBookingAge(e.target.value)} 
                        placeholder="25" 
                        min="18" 
                        max="100"
                        className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent text-gray-900" 
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">Citizenship <span className="text-red-500">*</span></label>
                      <select 
                        value={bookingCitizenship} 
                        onChange={(e) => setBookingCitizenship(e.target.value)} 
                        className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent text-gray-900"
                        required
                      >
                        <option value="">Select Citizenship</option>
                        <option value="Filipino">Filipino</option>
                        <option value="Foreigner">Foreigner</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">Occupation Status <span className="text-red-500">*</span></label>
                      <select 
                        value={bookingOccupationStatus} 
                        onChange={(e) => setBookingOccupationStatus(e.target.value)} 
                        className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent text-gray-900"
                        required
                      >
                        <option value="">Select Status</option>
                        <option value="Student">Student</option>
                        <option value="Worker">Worker</option>
                      </select>
                    </div>
                  </div>
                </div>

                {/* Address Section */}
                <div className="mb-6">
                  <h4 className="text-lg font-semibold text-gray-900 mb-4 pb-2 border-b">Address Information</h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="sm:col-span-2">
                      <label className="block text-sm font-semibold text-gray-700 mb-2">Address <span className="text-red-500">*</span></label>
                      <input 
                        value={bookingAddress} 
                        onChange={(e) => setBookingAddress(e.target.value)} 
                        placeholder="Street Address" 
                        className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent text-gray-900" 
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">Barangay <span className="text-red-500">*</span></label>
                      <input 
                        value={bookingBarangay} 
                        onChange={(e) => setBookingBarangay(e.target.value)} 
                        placeholder="Barangay Name" 
                        className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent text-gray-900" 
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">Municipality/City <span className="text-red-500">*</span></label>
                      <input 
                        value={bookingMunicipalityCity} 
                        onChange={(e) => setBookingMunicipalityCity(e.target.value)} 
                        placeholder="City or Municipality" 
                        className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent text-gray-900" 
                        required
                      />
                    </div>
                  </div>
                </div>

                {/* Room and Bed Selection - Table Format */}
                <div className="mb-6">
                  <h4 className="text-lg font-semibold text-gray-900 mb-4 pb-2 border-b">Room & Bed Selection <span className="text-red-500">*</span></h4>
                  
                  {availableRooms.length === 0 ? (
                    <div className="w-full px-4 py-3 border border-gray-200 rounded-xl bg-gray-50 text-gray-500 text-center">
                      No rooms available. Please contact the landlord.
                    </div>
                  ) : (
                    <div className="space-y-6">
                      {/* Rooms Table */}
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-3">Select Room</label>
                        <div className="overflow-x-auto border border-gray-200 rounded-xl">
                          <table className="w-full">
                            <thead className="bg-gray-50">
                              <tr>
                                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase">Room</th>
                                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase">Name</th>
                                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase">Available Beds</th>
                                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase">Status</th>
                                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase">Action</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-200">
                              {availableRooms.map((room: any) => (
                                <tr 
                                  key={room.id} 
                                  className={`hover:bg-gray-50 transition-colors ${
                                    selectedRoomId === room.id ? 'bg-primary-50 border-l-4 border-l-primary-600' : ''
                                  }`}
                                >
                                  <td className="px-4 py-3 text-gray-900 font-medium">
                                    {room.room_number}
                                  </td>
                                  <td className="px-4 py-3 text-gray-700">
                                    {room.room_name || `Room ${room.room_number}`}
                                  </td>
                                  <td className="px-4 py-3 text-gray-700">
                                    {room.max_beds - room.current_occupancy} / {room.max_beds}
                                  </td>
                                  <td className="px-4 py-3">
                                    <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                                      room.status === 'available' ? 'bg-green-100 text-green-800' :
                                      room.status === 'full' ? 'bg-red-100 text-red-800' :
                                      'bg-yellow-100 text-yellow-800'
                                    }`}>
                                      {room.status === 'available' ? 'Available' : room.status === 'full' ? 'Full' : 'Maintenance'}
                                    </span>
                                  </td>
                                  <td className="px-4 py-3">
                                    <button
                                      onClick={() => {
                                        setSelectedRoomId(room.id);
                                        loadBedsForRoom(room.id);
                                        setSelectedBedId(''); // Reset bed selection when room changes
                                      }}
                                      className={`px-4 py-2 rounded-lg text-sm font-semibold transition-colors ${
                                        selectedRoomId === room.id
                                          ? 'glass-button'
                                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                      }`}
                                    >
                                      {selectedRoomId === room.id ? 'Selected' : 'Select'}
                                    </button>
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </div>

                      {/* Beds Table - Show when room is selected */}
                      {selectedRoomId && (
                        <div>
                          <label className="block text-sm font-semibold text-gray-700 mb-3">Select Bed Space</label>
                          {loadingBeds ? (
                            <div className="w-full px-4 py-8 border border-gray-200 rounded-xl bg-gray-50 text-center">
                              <div className="flex flex-col items-center justify-center gap-3">
                                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
                                <p className="text-gray-600 font-medium">Loading beds...</p>
                              </div>
                            </div>
                          ) : availableBeds.length > 0 ? (
                            <div className="overflow-x-auto border border-gray-200 rounded-xl">
                              <table className="w-full">
                                <thead className="bg-gray-50">
                                  <tr>
                                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase">Bed Number</th>
                                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase">Bed Type</th>
                                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase">Status</th>
                                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase">Action</th>
                                  </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-200">
                                  {availableBeds.map((bed: any) => {
                                    const canBook = bed.canBook !== false && bed.status === 'available' && !bed.isBooked;
                                    const isSelected = selectedBedId === bed.id;
                                    const isOccupied = bed.status === 'occupied' || bed.isBooked;
                                    
                                    return (
                                      <tr 
                                        key={bed.id}
                                        className={`transition-colors ${
                                          isSelected ? 'bg-primary-50 border-l-4 border-l-primary-600' :
                                          canBook ? 'hover:bg-green-50' : 'opacity-60 bg-gray-50'
                                        }`}
                                      >
                                        <td className="px-4 py-3 text-gray-900 font-medium">
                                          {bed.bed_number}
                                          {isOccupied && (
                                            <span className="ml-2 text-xs text-red-600 font-semibold">(Occupied)</span>
                                          )}
                                        </td>
                                        <td className="px-4 py-3 text-gray-700">
                                          {bed.bed_type ? bed.bed_type.replace(/_/g, ' ').replace(/\b\w/g, (l: string) => l.toUpperCase()) : 'Single'}
                                          {bed.deck_position && ` (${bed.deck_position})`}
                                        </td>
                                        <td className="px-4 py-3">
                                          <div className="flex items-center gap-2">
                                            <span className={`inline-block w-3 h-3 rounded-full ${
                                              canBook ? 'bg-green-500' : 'bg-red-500'
                                            }`}></span>
                                            <span className={`text-sm font-medium ${
                                              canBook ? 'text-green-700' : 'text-red-700'
                                            }`}>
                                              {canBook ? 'Available' : isOccupied ? 'Occupied' : 'Unavailable'}
                                            </span>
                                          </div>
                                        </td>
                                        <td className="px-4 py-3">
                                          <button
                                            onClick={() => {
                                              if (canBook) {
                                                setSelectedBedId(bed.id);
                                              } else {
                                                alert('This bed is already occupied and cannot be booked. Please select an available bed.');
                                              }
                                            }}
                                            disabled={!canBook}
                                            className={`px-4 py-2 rounded-lg text-sm font-semibold transition-colors ${
                                              isSelected
                                                ? 'glass-button'
                                                : canBook
                                                ? 'bg-green-100 text-green-700 hover:bg-green-200'
                                                : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                                            }`}
                                            title={!canBook ? 'This bed is occupied and cannot be booked' : 'Click to select this bed'}
                                          >
                                            {isSelected ? 'Selected' : canBook ? 'Select' : 'Occupied'}
                                          </button>
                                        </td>
                                      </tr>
                                    );
                                  })}
                                </tbody>
                              </table>
                            </div>
                          ) : (
                            <div className="w-full px-4 py-3 border border-gray-200 rounded-xl bg-gray-50 text-gray-500 text-center">
                              No beds available for this room.
                            </div>
                          )}
                        </div>
                      )}

                      {/* Selection Summary */}
                      {selectedRoomId && selectedBedId && (
                        <div className="bg-primary-50 border border-primary-200 rounded-xl p-4">
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="text-sm font-semibold text-primary-900">Selected:</p>
                              <p className="text-sm text-primary-700">
                                {availableRooms.find((r: any) => r.id === selectedRoomId)?.room_name || 
                                 `Room ${availableRooms.find((r: any) => r.id === selectedRoomId)?.room_number}`} - 
                                Bed {availableBeds.find((b: any) => b.id === selectedBedId)?.bed_number}
                              </p>
                            </div>
                            <button
                              onClick={() => {
                                setSelectedRoomId('');
                                setSelectedBedId('');
                                setAvailableBeds([]);
                              }}
                              className="text-sm text-primary-600 hover:text-primary-800 font-medium"
                            >
                              Clear Selection
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* Additional Message */}
                <div className="mb-6">
                  <label className="block text-sm font-semibold text-gray-700 mb-3">Additional Message (Optional)</label>
                  <textarea 
                    value={bookingMessage} 
                    onChange={(e) => setBookingMessage(e.target.value)} 
                    placeholder="Tell the landlord about yourself, your requirements, and why you're interested in this property..." 
                    className="w-full h-32 px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent text-gray-900 placeholder-gray-500 resize-none" 
                  />
                </div>

                {/* Payment Disclaimer */}
                <div className="mb-6 p-4 bg-yellow-50 border border-yellow-200 rounded-xl">
                  <div className="flex items-start space-x-3">
                    <svg className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                    </svg>
                    <div className="flex-1">
                      <p className="text-sm font-semibold text-yellow-900 mb-1">Payment Notice</p>
                      <p className="text-sm text-yellow-800">
                        Please note that payment processing is handled outside of this system. After your booking request is approved, you will need to coordinate payment directly with the landlord through the messaging system or other agreed-upon methods.
                      </p>
                    </div>
                  </div>
                </div>
                
                <div className="flex gap-4">
                  <button 
                    onClick={() => {
                      setShowBookingForm(false);
                      // Reset form
                      setBookingFullName('');
                      setBookingAddress('');
                      setBookingBarangay('');
                      setBookingMunicipalityCity('');
                      setBookingGender('');
                      setBookingAge('');
                      setBookingCitizenship('');
                      setBookingOccupationStatus('');
                      setSelectedRoomId('');
                      setSelectedBedId('');
                      setAvailableRooms([]);
                      setAvailableBeds([]);
                    }} 
                    className="flex-1 bg-gray-100 text-gray-700 py-3 rounded-xl hover:bg-gray-200 transition-colors duration-200 font-semibold"
                  >
                    Cancel
                  </button>
                  <button 
                    onClick={showBookingPreviewModal} 
                    className="flex-1 bg-gradient-to-r from-primary-600 to-primary-700 text-white py-3 rounded-xl hover:from-primary-700 hover:to-primary-800 transition-all duration-200 font-semibold shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
                  >
                    Preview Booking Request
                  </button>
                </div>
              </div>
            </div>
          )}

        {/* Info Modal (no map) */}
        {selectedProperty && !showMaps && !showBookingForm && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 z-50">
            <div className="backdrop-blur-2xl bg-white/80 rounded-3xl max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl border border-white/40">
              <div className="p-4 sm:p-6">
                <div className="flex justify-between items-center mb-4">
                  <h2 className="text-2xl font-bold text-gray-900 truncate pr-4">{selectedProperty.title}</h2>
                  <button onClick={() => setSelectedProperty(null)} className="text-gray-400 hover:text-gray-600 transition-colors duration-200 p-2 hover:bg-gray-100 rounded-full">
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12"/></svg>
                  </button>
                </div>

                <div className="rounded-2xl overflow-hidden border border-gray-200 mb-4">
                  {selectedProperty.images && selectedProperty.images.length > 0 ? (
                    <ImageCarousel 
                      images={selectedProperty.images} 
                      alt={selectedProperty.title}
                      className="w-full"
                      bucket="property-images"
                    />
                  ) : (
                    <div className="w-full h-64 flex items-center justify-center text-gray-400">No image</div>
                  )}
                </div>

                <div className="grid grid-cols-1 gap-4">
                  <div>
                    <h3 className="font-semibold text-gray-900 mb-1">Location</h3>
                    <div className="text-gray-700">{selectedProperty.location}</div>
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900 mb-1">Description</h3>
                    <div className="text-gray-700">{selectedProperty.description}</div>
                  </div>
                  {selectedProperty.amenities?.length > 0 && (
                    <div>
                      <h3 className="font-semibold text-gray-900 mb-2">Amenities</h3>
                      <div className="flex flex-wrap gap-2">
                        {selectedProperty.amenities.map((a, i) => (
                          <span key={i} className="px-3 py-1 bg-gray-100 rounded-lg text-sm text-gray-700">{a}</span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>


                {/* Reviews Section */}
                {reviews.length > 0 && (
                  <div className="mt-6 border-t border-gray-200 pt-6">
                    <h3 className="font-semibold text-gray-900 mb-4">Reviews ({reviews.length})</h3>
                    <div className="space-y-4 max-h-96 overflow-y-auto">
                      {reviews.map((review) => (
                        <div key={review.id} className="bg-gray-50 rounded-xl p-4 border border-gray-200">
                          <div className="flex items-start justify-between mb-2">
                            <div className="flex items-center space-x-2">
                              <span className="font-semibold text-gray-900">{review.clientName}</span>
                              <div className="flex items-center space-x-1">
                                {[1, 2, 3, 4, 5].map((star) => (
                                  <svg
                                    key={star}
                                    className={`w-4 h-4 ${star <= review.rating ? 'text-yellow-400' : 'text-gray-300'}`}
                                    fill="currentColor"
                                    viewBox="0 0 24 24"
                                  >
                                    <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                                  </svg>
                                ))}
                              </div>
                            </div>
                            <span className="text-xs text-gray-500">{new Date(review.createdAt).toLocaleDateString()}</span>
                          </div>
                          {review.reviewText && (
                            <p className="text-sm text-gray-700 mt-2">{review.reviewText}</p>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <div className="flex items-center justify-between mt-6">
                  <div className="flex items-center space-x-4">
                    <div className="text-primary-600 font-bold text-xl">₱{selectedProperty.price.toLocaleString()}</div>
                    {(() => {
                      // Calculate rating from reviews if property rating is not available
                      let displayRating = selectedProperty.rating;
                      let displayTotalReviews = selectedProperty.totalReviews || 0;
                      
                      if (reviews.length > 0 && (!displayRating || displayRating === 0)) {
                        const totalRating = reviews.reduce((sum, r) => sum + (r.rating || 0), 0);
                        displayRating = totalRating / reviews.length;
                        displayTotalReviews = reviews.length;
                      }
                      
                      return displayRating !== undefined && displayRating !== null && displayRating > 0 ? (
                        <div className="flex items-center space-x-1">
                          <svg className="w-5 h-5 text-yellow-400" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                          </svg>
                          <span className="text-gray-700 font-medium">
                            {displayRating.toFixed(1)}
                            {displayTotalReviews > 0 && ` (${displayTotalReviews} ${displayTotalReviews === 1 ? 'review' : 'reviews'})`}
                          </span>
                        </div>
                      ) : (
                        <div className="flex items-center space-x-1">
                          <svg className="w-5 h-5 text-gray-300" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                          </svg>
                          <span className="text-gray-500 font-medium">No rating</span>
                        </div>
                      );
                    })()}
                  </div>
                  <div className="flex space-x-2">
                    <button onClick={() => { setShowBookingForm(true); }} className="glass-button px-5 py-2.5 rounded-xl hover:opacity-90">Book</button>
                    <button onClick={() => { setShowReviewForm(true); loadReviews(selectedProperty.id); }} className="bg-green-600 text-white px-5 py-2.5 rounded-xl hover:bg-green-700">Write Review</button>
                  </div>
                </div>
                </div>
              </div>
            </div>
          )}
        
        {/* Maps Modal */}
        {showMaps && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-0 sm:p-4 z-50">
            <div className="backdrop-blur-2xl bg-white/80 rounded-none sm:rounded-3xl max-w-4xl w-full h-full sm:h-auto sm:max-h-[90vh] overflow-y-auto shadow-2xl border border-white/40">
              <div className="p-4 sm:p-6 relative">
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-2xl font-bold text-gray-900">Property Maps</h2>
                  <button onClick={() => setShowMaps(false)} className="text-gray-400 hover:text-gray-600 transition-colors duration-200 p-2 hover:bg-gray-100 rounded-full">
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12"/></svg>
                  </button>
                </div>
                <div className="grid grid-cols-1 gap-4">
                  <div className="h-96 bg-gray-100 rounded-2xl overflow-hidden relative" style={{ position: 'relative', zIndex: 1, minHeight: '384px' }}>
                <GoogleMap
                      center={(selectedProperty ? selectedProperty.coordinates : ((filteredProperties[0] || properties[0])?.coordinates)) || { lat: 11.7778, lng: 124.8847 }}
                      zoom={15}
                    satellite={true}
                      preferLeaflet={true}
                      markers={(filteredProperties.length ? filteredProperties : properties).map((p) => ({
                        position: p.coordinates,
                        title: p.title,
                        info: p.description,
                        iconUrl: p.images && p.images[0] ? p.images[0] : undefined
                      }))}
                      onMarkerClick={(i) => {
                        const list = filteredProperties.length ? filteredProperties : properties;
                        setSelectedProperty(list[i]);
                      }}
                    className="h-full w-full"
                  />
                  </div>
                </div>

                {selectedProperty && (
                  <div className="absolute inset-0" onClick={() => setSelectedProperty(null)} style={{ zIndex: 2 }}>
                    <div className="absolute inset-0 bg-black/40 z-[900]"></div>
                    <div className="absolute inset-y-0 right-0 z-[1000] w-full sm:w-[28rem] md:w-[32rem] bg-white shadow-2xl border-l border-gray-100 flex flex-col overflow-hidden" onClick={(e) => e.stopPropagation()} style={{ position: 'absolute' }}>
                      <div className="px-4 sm:px-5 pt-3 sm:pt-4">
                        <div className="flex items-center justify-between">
                          <h3 className="text-xl sm:text-2xl font-bold text-gray-900 truncate pr-4">{selectedProperty.title}</h3>
                          <button onClick={() => setSelectedProperty(null)} className="text-gray-400 hover:text-gray-600 p-1 rounded-md hover:bg-gray-100">
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12"/></svg>
                          </button>
                        </div>
                        <div className="mt-3 border-b border-gray-200">
                          <nav className="-mb-px flex gap-4">
                            <button onClick={() => setInfoTab('overview')} className={`px-2 pb-3 text-sm font-semibold ${infoTab==='overview' ? 'border-b-2 border-primary-600 text-primary-600' : 'text-gray-600 hover:text-gray-800'}`}>Overview</button>
                            <button onClick={() => setInfoTab('amenities')} className={`px-2 pb-3 text-sm font-semibold ${infoTab==='amenities' ? 'border-b-2 border-primary-600 text-primary-600' : 'text-gray-600 hover:text-gray-800'}`}>Amenities</button>
                            <button onClick={() => setInfoTab('photos')} className={`px-2 pb-3 text-sm font-semibold ${infoTab==='photos' ? 'border-b-2 border-primary-600 text-primary-600' : 'text-gray-600 hover:text-gray-800'}`}>Photos</button>
                          </nav>
                        </div>
                      </div>

                      <div className="p-5 overflow-y-auto flex-1 min-h-0">
                        {infoTab === 'overview' && (
                          <div>
                            <div className="rounded-xl overflow-hidden border mb-4">
                              {selectedProperty.images && selectedProperty.images.length > 0 ? (
                                <ImageCarousel 
                                  images={selectedProperty.images} 
                                  alt={selectedProperty.title}
                                  className="w-full"
                                  bucket="property-images"
                                  compact={true}
                                  showThumbnails={false}
                                />
                              ) : (
                                <div className="w-full h-48 flex items-center justify-center text-gray-400">No image</div>
                              )}
                            </div>
                            <div className="text-sm text-gray-600 mb-2">{selectedProperty.location}</div>
                            <div className="text-gray-700 mb-6">{selectedProperty.description}</div>
                            <div className="flex items-center justify-between">
                              <div className="text-primary-600 font-bold text-lg">₱{selectedProperty.price.toLocaleString()}</div>
                              <button onClick={() => { setShowMaps(false); setShowBookingForm(true); }} className="glass-button px-4 py-2 rounded-lg hover:opacity-90">Book</button>
                            </div>
                          </div>
                        )}
                        {infoTab === 'amenities' && (
                          <div>
                            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                              {selectedProperty.amenities.map((a, i) => (
                                <span key={i} className="px-3 py-2 bg-gray-100 rounded-lg text-xs sm:text-sm text-gray-700">{a}</span>
                              ))}
                            </div>
                          </div>
                        )}
                        {infoTab === 'photos' && (
                          <div>
                            {selectedProperty.images && selectedProperty.images.length > 0 ? (
                              <ImageCarousel 
                                images={selectedProperty.images} 
                                alt={selectedProperty.title}
                                className="w-full"
                                bucket="property-images"
                                compact={true}
                                showThumbnails={false}
                              />
                            ) : (
                              <div className="w-full h-48 flex items-center justify-center text-gray-400">No images available</div>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
        

        
        {/* Chat Modal */}
        {chatOpen && activeConversation && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-0 sm:p-4 z-50">
            <div className="backdrop-blur-2xl bg-white/80 rounded-none sm:rounded-3xl max-w-2xl w-full h-full sm:h-auto sm:max-h-[90vh] overflow-hidden shadow-2xl border border-white/40 flex flex-col">
              <div className="p-4 border-b flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full glass-button flex items-center justify-center font-semibold">
                    P
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-gray-900">Landlord</h3>
                    <p className="text-xs text-gray-500">Property: {properties.find(p => p.id === activeConversation.property_id)?.title || activeConversation.property_id}</p>
                  </div>
                </div>
                <button onClick={() => { setChatOpen(false); try { chatChannel?.unsubscribe(); } catch {}; setChatChannel(null); }} className="text-gray-500 hover:text-gray-700">✕</button>
              </div>
              <div className="p-4 space-y-3 overflow-y-auto" style={{ height: '50vh' }}>
                {chatLoading ? (
                  <div className="text-gray-500">Loading messages...</div>
                ) : (
                  chatMessages.map((m) => (
                    <div key={m.id} className={`flex ${m.sender_email === activeConversation.client_email ? 'justify-end' : 'justify-start'} items-end gap-2`}>
                      {m.sender_email !== activeConversation.client_email && (
                        <div className="w-7 h-7 rounded-full bg-gray-300 text-gray-700 flex items-center justify-center text-xs font-semibold">
                          P
                        </div>
                      )}
                      <div className={`${m.sender_email === activeConversation.client_email ? 'glass-button rounded-2xl rounded-br-sm' : 'bg-gray-100 text-gray-900 rounded-2xl rounded-bl-sm'} px-4 py-2 max-w-[75%] shadow-sm` }>
                        <div className="text-sm whitespace-pre-wrap leading-relaxed">{m.content}</div>
                        <div className={`text-[10px] mt-1 ${m.sender_email === activeConversation.client_email ? 'text-primary-100' : 'text-gray-500'}`}>{new Date(m.created_at).toLocaleString()}</div>
                      </div>
                      {m.sender_email === activeConversation.client_email && (
                        <div className="w-7 h-7 rounded-full glass-button flex items-center justify-center text-xs font-semibold">
                          {(activeConversation.client_email || 'U').charAt(0).toUpperCase()}
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
                  onKeyDown={async (e) => { if (e.key === 'Enter') { e.preventDefault(); if (!activeConversation) return; const content = chatInput.trim(); if (!content) return; try { const { error } = await supabase.from('messages').insert([{ conversation_id: activeConversation.id, sender_email: activeConversation.client_email, content }]); if (error) throw error; setChatInput(''); } catch (err) { console.error('Send message failed', err); } } }}
                  placeholder="Type a message..."
                  className="flex-1 px-4 py-3 border border-gray-200 rounded-full focus:outline-none focus:ring-2 focus:ring-primary-500 bg-white"
                />
                <button onClick={async () => { if (!activeConversation) return; const content = chatInput.trim(); if (!content) return; try { const { error } = await supabase.from('messages').insert([{ conversation_id: activeConversation.id, sender_email: activeConversation.client_email, content }]); if (error) throw error; setChatInput(''); } catch (err) { console.error('Send message failed', err); } }} className="glass-button px-5 py-3 rounded-full hover:opacity-90">Send</button>
              </div>
            </div>
          </div>
        )}

        {/* Review Form Modal */}
        {showReviewForm && selectedProperty && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 z-50">
            <div className="backdrop-blur-2xl bg-white/80 rounded-3xl max-w-lg w-full shadow-2xl border border-white/40 max-h-[90vh] overflow-y-auto">
              <div className="p-4 sm:p-6">
                <div className="flex justify-between items-center mb-4">
                  <h2 className="text-2xl font-bold text-gray-900">Write a Review</h2>
                  <button onClick={() => { setShowReviewForm(false); setReviewText(''); setReviewRating(5); }} className="text-gray-400 hover:text-gray-600 transition-colors duration-200 p-2 hover:bg-gray-100 rounded-full">
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12"/></svg>
                  </button>
                </div>
                <div className="mb-4">
                  <h3 className="font-semibold text-gray-900 mb-2">{selectedProperty.title}</h3>
                  <p className="text-sm text-gray-600">{selectedProperty.location}</p>
                </div>
                <div className="mb-6">
                  <label className="block text-sm font-medium text-gray-700 mb-2">Rating</label>
                  <div className="flex items-center space-x-2">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        key={star}
                        type="button"
                        onClick={() => setReviewRating(star)}
                        className="focus:outline-none"
                      >
                        <svg
                          className={`w-8 h-8 ${star <= reviewRating ? 'text-yellow-400' : 'text-gray-300'}`}
                          fill="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                        </svg>
                      </button>
                    ))}
                    <span className="ml-2 text-sm text-gray-600">{reviewRating} star{reviewRating !== 1 ? 's' : ''}</span>
                  </div>
                </div>
                <div className="mb-6">
                  <label className="block text-sm font-medium text-gray-700 mb-2">Your Review</label>
                  <textarea
                    value={reviewText}
                    onChange={(e) => setReviewText(e.target.value)}
                    placeholder="Share your experience..."
                    rows={5}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 resize-none"
                  />
                </div>
                <div className="flex space-x-3">
                  <button
                    onClick={() => { setShowReviewForm(false); setReviewText(''); setReviewRating(5); }}
                    className="flex-1 px-4 py-3 border border-gray-300 rounded-xl text-gray-700 hover:bg-gray-50 font-medium"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={submitReview}
                    className="flex-1 px-4 py-3 glass-button rounded-xl hover:opacity-90 font-medium"
                  >
                    Submit Review
                  </button>
                </div>
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

                {/* ID Document */}
                {viewProfileData.id_document_url && (
                  <div className="bg-gray-50 rounded-xl p-6">
                    <h3 className="text-xl font-bold text-gray-900 mb-4">ID Document</h3>
                    <div className="flex justify-center">
                      <a
                        href={viewProfileData.id_document_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="block max-w-md"
                      >
                        <ImageWithFallback
                          src={viewProfileData.id_document_url}
                          alt="ID Document"
                          className="w-full h-auto rounded-lg shadow-lg border-2 border-gray-200 hover:border-orange-400 transition-colors cursor-pointer"
                        />
                      </a>
                    </div>
                    <p className="text-xs text-gray-500 text-center mt-2">Click to view full size</p>
                  </div>
                )}
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
                      const email = clientEmail || user?.email;
                      if (!email) {
                        alert('Email not found');
                        return;
                      }

                      const { data: userProfile } = await supabase
                        .from('user_profiles')
                        .select('*')
                        .eq('user_email', email)
                        .single();

                      const { data: appUser } = await supabase
                        .from('app_users')
                        .select('*')
                        .eq('email', email)
                        .single();

                      const profile = userProfile || appUser;
                      setProfileData({
                        full_name: profile?.full_name || user?.user_metadata?.full_name || '',
                        phone: profile?.phone || '',
                        address: profile?.address || '',
                        barangay: profile?.barangay || '',
                        city: profile?.city || '',
                        profile_image_url: profile?.profile_image_url || '',
                        id_document_url: profile?.id_document_url || '',
                        email: user?.email || ''
                      });
                      setProfileImagePreview(profile?.profile_image_url || null);
                      setIdDocumentPreview(profile?.id_document_url || null);
                      setShowEditProfile(true);
                    } catch (error) {
                      console.error('Failed to load profile:', error);
                      setProfileData({
                        full_name: user?.user_metadata?.full_name || '',
                        phone: '',
                        address: '',
                        barangay: '',
                        city: '',
                        profile_image_url: '',
                        id_document_url: '',
                        email: user?.email || ''
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

        {/* Report Problem Modal */}
        {showReportProblem && user && (
          <ReportProblem
            userEmail={clientEmail || user.email || ''}
            userId={user.id}
            userType="client"
            onClose={() => setShowReportProblem(false)}
          />
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
                        id="profile-image-upload"
                      />
                      <label
                        htmlFor="profile-image-upload"
                        className="glass-button px-6 py-3 rounded-xl cursor-pointer inline-block text-sm font-semibold bg-orange-500 hover:bg-orange-600 text-white"
                      >
                        {profileImagePreview ? 'Change Photo' : 'Upload Photo'}
                      </label>
                      <p className="text-xs text-gray-500 mt-2">Max 5MB, Image files only</p>
                      {profileImageFile && (
                        <p className="text-xs text-green-600 mt-1">✓ Photo ready to upload</p>
                      )}
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

                {/* ID Document */}
                <div className="bg-gray-50 rounded-xl p-6">
                  <h3 className="text-xl font-bold text-gray-900 mb-4">ID Document</h3>
                  
                  {/* Display current ID document or preview */}
                  {(idDocumentPreview || profileData.id_document_url) && (
                    <div className="mb-4">
                      <div className="flex justify-center">
                        <a
                          href={idDocumentPreview || profileData.id_document_url || '#'}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="block max-w-md"
                        >
                          <ImageWithFallback
                            src={idDocumentPreview || profileData.id_document_url || ''}
                            alt="ID Document"
                            className="w-full h-auto rounded-lg shadow-lg border-2 border-gray-200 hover:border-orange-400 transition-colors cursor-pointer"
                          />
                        </a>
                      </div>
                      <p className="text-xs text-gray-500 text-center mt-2">Click to view full size</p>
                    </div>
                  )}

                  {/* Upload ID Document */}
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
                          setIdDocumentFile(file);
                          const reader = new FileReader();
                          reader.onloadend = () => {
                            setIdDocumentPreview(reader.result as string);
                          };
                          reader.readAsDataURL(file);
                        }
                      }}
                      className="hidden"
                      id="id-document-upload"
                    />
                    <label
                      htmlFor="id-document-upload"
                      className="glass-button px-6 py-3 rounded-xl cursor-pointer inline-block text-sm font-semibold bg-blue-500 hover:bg-blue-600 text-white"
                    >
                      {idDocumentPreview || profileData.id_document_url ? 'Change ID Document' : 'Upload ID Document'}
                    </label>
                    <p className="text-xs text-gray-500 mt-2">Max 5MB, Image files only</p>
                    {idDocumentFile && (
                      <p className="text-xs text-green-600 mt-1">✓ ID Document ready to upload</p>
                    )}
                  </div>
                </div>
              </div>

              <div className="sticky bottom-0 bg-white border-t border-gray-200 p-6 flex justify-end gap-3">
                <button
                  onClick={() => {
                    setShowEditProfile(false);
                    setProfileImageFile(null);
                    setProfileImagePreview(null);
                    setIdDocumentFile(null);
                    setIdDocumentPreview(null);
                  }}
                  className="px-6 py-3 bg-gray-200 text-gray-800 rounded-xl hover:bg-gray-300 transition-colors font-semibold"
                >
                  Cancel
                </button>
                <button
                  onClick={async () => {
                    try {
                      setSavingProfile(true);
                      const email = clientEmail || user?.email;
                      if (!email) {
                        alert('Email not found');
                        setSavingProfile(false);
                        return;
                      }

                      let profileImageUrl = profileData.profile_image_url;
                      let idDocumentUrl = profileData.id_document_url;

                      // Upload ID document if new file selected
                      if (idDocumentFile) {
                        try {
                          const fileExt = idDocumentFile.name.split('.').pop();
                          const userId = user?.id || email.replace(/[^a-zA-Z0-9]/g, '_');
                          const fileName = `id-${userId}`;
                          const filePath = `id-documents/${fileName}.${fileExt}`;

                          console.log('Attempting to upload ID document to:', filePath);
                          
                          // Try tenant-verification bucket first
                          let uploadError = null;
                          let uploadPath = filePath;
                          let bucket = 'tenant-verification';
                          
                          const { error: error1 } = await supabase.storage
                            .from('tenant-verification')
                            .upload(filePath, idDocumentFile, {
                              cacheControl: '3600',
                              upsert: true
                            });

                          if (error1) {
                            console.log('tenant-verification upload failed, trying id-documents bucket:', error1);
                            // Try id-documents bucket if it exists
                            bucket = 'id-documents';
                            const { error: error2 } = await supabase.storage
                              .from('id-documents')
                              .upload(filePath, idDocumentFile, {
                                cacheControl: '3600',
                                upsert: true
                              });
                            uploadError = error2;
                            
                            if (error2) {
                              console.error('Both bucket uploads failed:', error2);
                              if (error2.message?.includes('row-level security') || error2.message?.includes('policy')) {
                                throw new Error('Storage access denied. Please check storage bucket policies in Supabase Dashboard → Storage → Policies.');
                              }
                              if (error2.message?.includes('JWT') || error2.message?.includes('auth')) {
                                throw new Error('Authentication error. Please log out and log back in.');
                              }
                              throw error2;
                            }
                          }

                          // Get public URL from the bucket that worked
                          const { data: { publicUrl } } = supabase.storage
                            .from(bucket)
                            .getPublicUrl(uploadPath);

                          console.log('ID document uploaded successfully:', publicUrl);
                          idDocumentUrl = publicUrl;
                        } catch (uploadErr: any) {
                          console.error('ID document upload failed:', uploadErr);
                          const errorMsg = uploadErr.message || 'Unknown error';
                          if (errorMsg.includes('Bucket not found')) {
                            alert('Storage bucket not found. Please ensure "tenant-verification" or "id-documents" bucket exists in Supabase Dashboard → Storage.');
                          } else if (errorMsg.includes('policy') || errorMsg.includes('row-level security')) {
                            alert('Storage access denied. Please check storage bucket policies. Run the SQL script in create_profile_images_bucket.sql to set up policies.');
                          } else {
                            alert(`Could not upload ID document: ${errorMsg}. The profile will be saved without the ID document update.`);
                          }
                          // Continue without ID document - don't block profile save
                        }
                      }

                      // Upload profile image if new file selected
                      if (profileImageFile) {
                        // Check if tenant is verified before allowing upload
                        const { data: userData, error: userError } = await supabase
                          .from('app_users')
                          .select('is_verified')
                          .eq('user_id', user?.id)
                          .maybeSingle();
                        
                        const isVerified = userData?.is_verified || false;
                        
                        if (!isVerified) {
                          alert('Only verified tenants can upload profile images. Your profile will be saved without the image.');
                          // Clear the profile image file to skip upload
                          setProfileImageFile(null);
                          // Skip the upload section but continue with profile save
                        } else {
                          // Only verified tenants reach this point - proceed with upload
                          try {
                            const fileExt = profileImageFile.name.split('.').pop();
                            // Sanitize email for filename - use user ID if available, otherwise email
                            const userId = user?.id || email.replace(/[^a-zA-Z0-9]/g, '_');
                            const timestamp = Date.now();
                            const fileName = `profile-${userId}-${timestamp}`;
                            const filePath = `profile-images/${fileName}.${fileExt}`;

                            console.log('Attempting to upload profile image to:', filePath);
                            
                            // Try tenant-verification bucket first (more likely to exist)
                            let uploadError = null;
                            let uploadPath = filePath;
                            let bucket = 'tenant-verification';
                          
                          const { error: error1, data: data1 } = await supabase.storage
                            .from('tenant-verification')
                            .upload(filePath, profileImageFile, {
                              cacheControl: '3600',
                              upsert: false // Don't upsert, create new file each time
                            });

                          if (error1) {
                            console.log('tenant-verification upload failed, trying profile-images:', error1);
                            // Try profile-images bucket
                            bucket = 'profile-images';
                            const { error: error2 } = await supabase.storage
                              .from('profile-images')
                              .upload(filePath, profileImageFile, {
                                cacheControl: '3600',
                                upsert: false // Don't upsert, create new file each time
                              });
                            uploadError = error2;
                            
                            if (error2) {
                              console.error('Both bucket uploads failed:', error2);
                              // Check if it's a permissions issue
                              if (error2.message?.includes('row-level security') || error2.message?.includes('policy')) {
                                throw new Error('Storage access denied. Please check storage bucket policies in Supabase Dashboard → Storage → Policies.');
                              }
                              if (error2.message?.includes('JWT') || error2.message?.includes('auth')) {
                                throw new Error('Authentication error. Please log out and log back in.');
                              }
                              throw error2;
                            }
                          }

                          // Get public URL from the bucket that worked
                          const { data: { publicUrl } } = supabase.storage
                            .from(bucket)
                            .getPublicUrl(uploadPath);

                          console.log('Profile image uploaded successfully:', publicUrl);
                          profileImageUrl = publicUrl;
                          
                          // Delete old profile images for this user (cleanup)
                          try {
                            const oldFileNamePattern = `profile-${userId}-`;
                            const { data: oldFiles, error: listError } = await supabase.storage
                              .from(bucket)
                              .list('profile-images', {
                                search: oldFileNamePattern
                              });
                            
                            if (!listError && oldFiles) {
                              // Delete all old profile images except the current one
                              const filesToDelete = oldFiles
                                .filter(file => file.name !== fileName + '.' + fileExt)
                                .map(file => `profile-images/${file.name}`);
                              
                              if (filesToDelete.length > 0) {
                                const { error: deleteError } = await supabase.storage
                                  .from(bucket)
                                  .remove(filesToDelete);
                                
                                if (!deleteError) {
                                  console.log(`Deleted ${filesToDelete.length} old profile images`);
                                }
                              }
                            }
                          } catch (cleanupErr) {
                            console.warn('Failed to cleanup old profile images:', cleanupErr);
                            // Non-critical error, continue
                          }
                        } catch (uploadErr: any) {
                          console.error('Image upload failed:', uploadErr);
                          const errorMsg = uploadErr.message || 'Unknown error';
                          // Show specific error message
                          if (errorMsg.includes('Bucket not found')) {
                            alert('Storage bucket not found. Please ensure "tenant-verification" or "profile-images" bucket exists in Supabase Dashboard → Storage.');
                          } else if (errorMsg.includes('policy') || errorMsg.includes('row-level security')) {
                            alert('Storage access denied. Please check storage bucket policies. Run the SQL script in create_profile_images_bucket.sql to set up policies.');
                          } else {
                            alert(`Could not upload profile image: ${errorMsg}. The profile will be saved without the image.`);
                          }
                          // Continue without image - don't block profile save
                        }
                      }
                    }

                      // Update user_profiles table (if it exists)
                      let profileError = null;
                      try {
                        // First check if user_profiles table exists by trying a simple select
                        const { error: checkError } = await supabase
                          .from('user_profiles')
                          .select('user_email')
                          .limit(1);
                        
                        if (!checkError) {
                          // Table exists, proceed with upsert
                          const { error } = await supabase
                            .from('user_profiles')
                            .upsert({
                              user_email: profileData.email || user?.email || '',
                              full_name: profileData.full_name,
                              phone: profileData.phone || null,
                              address: profileData.address || null,
                              barangay: profileData.barangay || null,
                              city: profileData.city || null,
                              profile_image_url: profileImageUrl || null,
                              id_document_url: idDocumentUrl || null,
                              updated_at: new Date().toISOString()
                            }, {
                              onConflict: 'user_email'
                            });
                          profileError = error;
                        } else {
                          // Table doesn't exist or has issues, skip this update
                          console.warn('user_profiles table not available, skipping update');
                          profileError = null; // Treat as success since we'll use app_users
                        }
                      } catch (err: any) {
                        console.warn('user_profiles table may not exist or have different structure:', err);
                        profileError = null; // Don't fail the entire operation
                      }

                      // Update app_users table
                      let appUserError = null;
                      try {
                        const { error } = await supabase
                          .from('app_users')
                          .update({
                            full_name: profileData.full_name,
                            phone: profileData.phone || null,
                            address: profileData.address || null,
                            barangay: profileData.barangay || null,
                            city: profileData.city || null,
                            profile_image_url: profileImageUrl || null,
                            id_document_url: idDocumentUrl || null
                          })
                          .eq('email', profileData.email || user?.email || '');
                        appUserError = error;
                      } catch (err: any) {
                        console.warn('app_users update failed:', err);
                        appUserError = err;
                      }

                      // If both updates failed, show error
                      if (profileError && appUserError) {
                        console.error('Profile error:', profileError);
                        console.error('App user error:', appUserError);
                        throw new Error(profileError.message || appUserError.message || 'Failed to update profile');
                      }

                      // If at least one succeeded, show success
                      if (!profileError || !appUserError) {
                        alert('Profile updated successfully!');
                        setShowEditProfile(false);
                        setProfileImageFile(null);
                        setProfileImagePreview(null);
                        setIdDocumentFile(null);
                        setIdDocumentPreview(null);
                        // Reload profile data - check both tables
                        const emailForReload = clientEmail || user?.email;
                        if (emailForReload) {
                          // First try user_profiles table
                          const { data: updatedProfile } = await supabase
                            .from('user_profiles')
                            .select('*')
                            .eq('user_email', emailForReload)
                            .single();
                          
                          if (updatedProfile) {
                            setProfileData({
                              full_name: updatedProfile.full_name || '',
                              phone: updatedProfile.phone || '',
                              address: updatedProfile.address || '',
                              barangay: updatedProfile.barangay || '',
                              city: updatedProfile.city || '',
                              profile_image_url: updatedProfile.profile_image_url || '',
                              id_document_url: updatedProfile.id_document_url || '',
                              email: user?.email || ''
                            });
                            setProfileImagePreview(updatedProfile.profile_image_url || null);
                            setIdDocumentPreview(updatedProfile.id_document_url || null);
                            setViewProfileData({
                              full_name: updatedProfile.full_name || '',
                              email: user?.email || '',
                              phone: updatedProfile.phone || 'N/A',
                              address: updatedProfile.address || 'N/A',
                              barangay: updatedProfile.barangay || 'N/A',
                              city: updatedProfile.city || 'N/A',
                              profile_image_url: updatedProfile.profile_image_url || null,
                              id_document_url: updatedProfile.id_document_url || null
                            });
                          } else {
                            // If user_profiles doesn't exist or has no data, try app_users
                            const { data: appUserData } = await supabase
                              .from('app_users')
                              .select('full_name, phone, address, barangay, city, profile_image_url, id_document_url')
                              .eq('email', emailForReload)
                              .single();
                            
                            if (appUserData) {
                              setProfileData({
                                full_name: appUserData.full_name || '',
                                phone: appUserData.phone || '',
                                address: appUserData.address || '',
                                barangay: appUserData.barangay || '',
                                city: appUserData.city || '',
                                profile_image_url: appUserData.profile_image_url || '',
                                id_document_url: appUserData.id_document_url || '',
                                email: user?.email || ''
                              });
                              setProfileImagePreview(appUserData.profile_image_url || null);
                              setIdDocumentPreview(appUserData.id_document_url || null);
                              setViewProfileData({
                                full_name: appUserData.full_name || '',
                                email: user?.email || '',
                                phone: appUserData.phone || 'N/A',
                                address: appUserData.address || 'N/A',
                                barangay: appUserData.barangay || 'N/A',
                                city: appUserData.city || 'N/A',
                                profile_image_url: appUserData.profile_image_url || null,
                                id_document_url: appUserData.id_document_url || null
                              });
                            }
                          }
                        }
                      }
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

        {/* Review Error Modal */}
        {showReviewErrorModal && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl">
              <div className="p-6">
                <div className="flex items-center justify-center mb-4">
                  <div className="w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center">
                    <svg className="w-8 h-8 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                    </svg>
                  </div>
                </div>
                <h2 className="text-2xl font-bold text-gray-900 text-center mb-4">Review Submission</h2>
                <p className="text-gray-700 text-center mb-6">{reviewErrorMessage}</p>
                <div className="flex justify-center">
                  <button
                    onClick={() => {
                      setShowReviewErrorModal(false);
                      setReviewErrorMessage('');
                    }}
                    className="glass-button px-8 py-3 rounded-xl font-semibold"
                  >
                    OK
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Booking Preview Modal */}
        {showBookingPreview && bookingPreviewData && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-2xl max-w-2xl w-full shadow-2xl max-h-[90vh] overflow-y-auto">
              <div className="p-6">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-2xl font-bold text-gray-900">Booking Request Preview</h2>
                  <button
                    onClick={() => setShowBookingPreview(false)}
                    className="text-gray-400 hover:text-gray-600 transition-colors"
                  >
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
                
                <div className="space-y-6">
                  {/* Personal Information Section */}
                  <div className="bg-gray-50 rounded-xl p-4">
                    <h3 className="text-lg font-semibold text-gray-900 mb-3">Personal Information</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="text-sm font-medium text-gray-600">Full Name</label>
                        <p className="text-gray-900 font-medium">{bookingPreviewData.fullName}</p>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-gray-600">Email</label>
                        <p className="text-gray-900 font-medium">{bookingPreviewData.email}</p>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-gray-600">Gender</label>
                        <p className="text-gray-900 font-medium">{bookingPreviewData.gender}</p>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-gray-600">Age</label>
                        <p className="text-gray-900 font-medium">{bookingPreviewData.age}</p>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-gray-600">Citizenship</label>
                        <p className="text-gray-900 font-medium">{bookingPreviewData.citizenship}</p>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-gray-600">Occupation</label>
                        <p className="text-gray-900 font-medium">{bookingPreviewData.occupationStatus}</p>
                      </div>
                    </div>
                  </div>

                  {/* Address Information Section */}
                  <div className="bg-gray-50 rounded-xl p-4">
                    <h3 className="text-lg font-semibold text-gray-900 mb-3">Address Information</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="text-sm font-medium text-gray-600">Address</label>
                        <p className="text-gray-900 font-medium">{bookingPreviewData.address}</p>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-gray-600">Barangay</label>
                        <p className="text-gray-900 font-medium">{bookingPreviewData.barangay}</p>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-gray-600">Municipality/City</label>
                        <p className="text-gray-900 font-medium">{bookingPreviewData.municipalityCity}</p>
                      </div>
                    </div>
                  </div>

                  {/* Property & Room Details Section */}
                  <div className="bg-gray-50 rounded-xl p-4">
                    <h3 className="text-lg font-semibold text-gray-900 mb-3">Property & Room Details</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="text-sm font-medium text-gray-600">Property</label>
                        <p className="text-gray-900 font-medium">{bookingPreviewData.propertyTitle}</p>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-gray-600">Location</label>
                        <p className="text-gray-900 font-medium">{bookingPreviewData.propertyLocation}</p>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-gray-600">Room Number</label>
                        <p className="text-gray-900 font-medium">{bookingPreviewData.roomNumber}</p>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-gray-600">Room Name</label>
                        <p className="text-gray-900 font-medium">{bookingPreviewData.roomName}</p>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-gray-600">Bed Number</label>
                        <p className="text-gray-900 font-medium">{bookingPreviewData.bedNumber}</p>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-gray-600">Bed Type</label>
                        <p className="text-gray-900 font-medium">{bookingPreviewData.bedType}</p>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-gray-600">Price</label>
                        <p className="text-gray-900 font-medium">₱{bookingPreviewData.price.toLocaleString()}</p>
                      </div>
                    </div>
                  </div>

                  {/* Message Section */}
                  {bookingPreviewData.message && (
                    <div className="bg-gray-50 rounded-xl p-4">
                      <h3 className="text-lg font-semibold text-gray-900 mb-3">Additional Message</h3>
                      <p className="text-gray-900">{bookingPreviewData.message}</p>
                    </div>
                  )}
                </div>

                <div className="flex gap-4 mt-8">
                  <button
                    onClick={() => setShowBookingPreview(false)}
                    className="flex-1 bg-gray-300 text-gray-700 py-3 rounded-xl hover:bg-gray-400 transition-all duration-200 font-semibold"
                  >
                    Edit Details
                  </button>
                  <button
                    onClick={handleBookProperty}
                    className="flex-1 bg-gradient-to-r from-primary-600 to-primary-700 text-white py-3 rounded-xl hover:from-primary-700 hover:to-primary-800 transition-all duration-200 font-semibold shadow-lg hover:shadow-xl"
                  >
                    Confirm & Submit Booking
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
    </div>
  );
}
