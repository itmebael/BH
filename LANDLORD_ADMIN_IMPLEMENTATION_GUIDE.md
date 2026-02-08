# Landlord & Admin Features Implementation Guide

## ✅ Components Created

1. **LandlordProfileForm.tsx** - Landlord profile creation component
2. **RoomBedManagement.tsx** - Room and bed management component
3. **CategorizedImageUpload.tsx** - Image upload with categories (CR, Available Rooms, etc.)
4. **PermitUpload.tsx** - Permit upload component

## 🔧 Integration Steps

### 1. OwnerDashboard Integration

#### A. Landlord Profile Check (✅ Already Added)
- Added check in `useEffect` to verify landlord profile exists
- Shows `LandlordProfileForm` modal if profile doesn't exist

#### B. Enhanced Property Creation Form

Replace the image upload section in the property creation form (around line 1500+) with:

```tsx
{/* Categorized Image Upload */}
<div>
  <label className="block text-sm font-medium text-gray-700 mb-2">
    Property Images (Categorized)
  </label>
  <CategorizedImageUpload
    images={propertyImages}
    onChange={setPropertyImages}
    maxImages={20}
  />
</div>

{/* Room & Bed Management */}
<div className="mt-6">
  <RoomBedManagement
    rooms={propertyRooms}
    onChange={setPropertyRooms}
  />
</div>
```

#### C. Update handleAddProperty Function

Modify the `handleAddProperty` function to:
1. Upload categorized images
2. Create rooms and beds
3. Link images to rooms (for room-specific images)

```tsx
// After uploading images, categorize them
const categorizedImages = propertyImages.map(img => ({
  image_url: uploadedImagePaths[propertyImages.indexOf(img)],
  image_category: img.category,
  room_id: img.roomId || null // If image is for a specific room
}));

// Save categorized images to property_images table
for (const img of categorizedImages) {
  await supabase.from('property_images').insert([{
    boarding_house_id: propertyData.id,
    room_id: img.room_id,
    image_url: img.image_url,
    image_category: img.category
  }]);
}

// Create rooms and beds
for (const room of propertyRooms) {
  const { data: roomData } = await supabase.from('rooms').insert([{
    boarding_house_id: propertyData.id,
    room_number: room.room_number,
    room_name: room.room_name,
    max_beds: room.max_beds,
    price_per_bed: room.price_per_bed
  }]).select().single();

  // Create beds for this room
  for (const bed of room.beds) {
    await supabase.from('beds').insert([{
      room_id: roomData.id,
      bed_number: bed.bed_number,
      bed_type: bed.bed_type,
      parent_bed_id: bed.parent_bed_id,
      status: bed.status,
      price: bed.price
    }]);
  }
}
```

#### D. Add Permit Upload Button

Add a button in the header or profile section:

```tsx
<button
  onClick={() => setShowPermitUpload(true)}
  className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700"
>
  Upload Permits
</button>

{/* Permit Upload Modal */}
{showPermitUpload && (
  <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
    <div className="bg-white rounded-2xl max-w-2xl w-full p-6 shadow-2xl max-h-[90vh] overflow-y-auto">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-xl font-bold">Upload Permits</h3>
        <button onClick={() => setShowPermitUpload(false)}>✕</button>
      </div>
      <PermitUpload
        landlordId={landlordProfileId} // Get from landlord_profiles table
        onUploadComplete={() => {
          setShowPermitUpload(false);
          alert('Permits uploaded successfully!');
        }}
      />
    </div>
  </div>
)}
```

### 2. Admin Dashboard Enhancements

#### A. Enhanced Analytics

Add to AdminDashboard.tsx:

```tsx
interface EnhancedAdminStats extends AdminStats {
  totalLandlords: number;
  totalTenants: number;
  pendingPermitVerifications: number;
  totalRooms: number;
  totalBeds: number;
  occupiedBeds: number;
  availableBeds: number;
  landlordSales: {
    landlordId: string;
    landlordName: string;
    totalBookings: number;
    bookedRooms: number;
    bookedBedSpaces: number;
    totalRevenue: number;
  }[];
}

// Load enhanced stats
const loadEnhancedStats = async () => {
  // Landlord data
  const { count: landlordsCount } = await supabase
    .from('landlord_profiles')
    .select('*', { count: 'exact', head: true });

  // Tenant data
  const { count: tenantsCount } = await supabase
    .from('tenant_profiles')
    .select('*', { count: 'exact', head: true });

  // Permit verifications
  const { count: pendingPermits } = await supabase
    .from('landlord_permits')
    .select('*', { count: 'exact', head: true })
    .eq('verification_status', 'pending');

  // Rooms and beds
  const { data: roomsData } = await supabase.from('rooms').select('id');
  const { data: bedsData } = await supabase.from('beds').select('id, status');
  
  const totalRooms = roomsData?.length || 0;
  const totalBeds = bedsData?.length || 0;
  const occupiedBeds = bedsData?.filter(b => b.status === 'occupied').length || 0;
  const availableBeds = totalBeds - occupiedBeds;

  // Landlord sales report
  const { data: salesData } = await supabase
    .from('landlord_sales_report')
    .select('*');

  setStats({
    ...stats,
    totalLandlords: landlordsCount || 0,
    totalTenants: tenantsCount || 0,
    pendingPermitVerifications: pendingPermits || 0,
    totalRooms,
    totalBeds,
    occupiedBeds,
    availableBeds,
    landlordSales: salesData || []
  });
};
```

#### B. Report Generation Module

Create a new component `ReportGeneration.tsx`:

```tsx
import React, { useState } from 'react';
import * as XLSX from 'xlsx';
import supabase from '../lib/supabase';

interface ReportGenerationProps {
  onClose: () => void;
}

export default function ReportGeneration({ onClose }: ReportGenerationProps) {
  const [reportType, setReportType] = useState<'bookings' | 'landlords' | 'tenants' | 'revenue'>('bookings');
  const [selectedBoardingHouse, setSelectedBoardingHouse] = useState<string>('');
  const [dateRange, setDateRange] = useState({ start: '', end: '' });
  const [previewData, setPreviewData] = useState<any[]>([]);
  const [generating, setGenerating] = useState(false);

  const loadPreview = async () => {
    setGenerating(true);
    try {
      let query = supabase.from('bookings').select('*');
      
      if (selectedBoardingHouse) {
        query = query.eq('boarding_house_id', selectedBoardingHouse);
      }
      
      if (dateRange.start) {
        query = query.gte('created_at', dateRange.start);
      }
      
      if (dateRange.end) {
        query = query.lte('created_at', dateRange.end);
      }

      const { data, error } = await query;
      if (error) throw error;
      
      setPreviewData(data || []);
    } catch (err) {
      console.error('Failed to load preview:', err);
      alert('Failed to load preview data');
    } finally {
      setGenerating(false);
    }
  };

  const exportToExcel = () => {
    const ws = XLSX.utils.json_to_sheet(previewData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Report');
    XLSX.writeFile(wb, `report-${Date.now()}.xlsx`);
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-2xl max-w-4xl w-full p-6 shadow-2xl max-h-[90vh] overflow-y-auto">
        <h3 className="text-2xl font-bold mb-4">Generate Report</h3>
        
        {/* Filters */}
        <div className="space-y-4 mb-6">
          <div>
            <label className="block text-sm font-semibold mb-2">Report Type</label>
            <select
              value={reportType}
              onChange={(e) => setReportType(e.target.value as any)}
              className="w-full px-4 py-2 border rounded-lg"
            >
              <option value="bookings">Bookings</option>
              <option value="landlords">Landlords</option>
              <option value="tenants">Tenants</option>
              <option value="revenue">Revenue</option>
            </select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold mb-2">Start Date</label>
              <input
                type="date"
                value={dateRange.start}
                onChange={(e) => setDateRange({ ...dateRange, start: e.target.value })}
                className="w-full px-4 py-2 border rounded-lg"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold mb-2">End Date</label>
              <input
                type="date"
                value={dateRange.end}
                onChange={(e) => setDateRange({ ...dateRange, end: e.target.value })}
                className="w-full px-4 py-2 border rounded-lg"
              />
            </div>
          </div>

          <button
            onClick={loadPreview}
            disabled={generating}
            className="w-full bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700"
          >
            {generating ? 'Loading...' : 'Preview Data'}
          </button>
        </div>

        {/* Preview */}
        {previewData.length > 0 && (
          <div className="mb-6">
            <h4 className="font-semibold mb-2">Preview ({previewData.length} records)</h4>
            <div className="max-h-64 overflow-y-auto border rounded-lg">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 sticky top-0">
                  <tr>
                    {Object.keys(previewData[0]).map(key => (
                      <th key={key} className="px-4 py-2 text-left">{key}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {previewData.slice(0, 10).map((row, idx) => (
                    <tr key={idx} className="border-t">
                      {Object.values(row).map((val, i) => (
                        <td key={i} className="px-4 py-2">{String(val)}</td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-4">
          <button
            onClick={onClose}
            className="flex-1 bg-gray-100 text-gray-700 py-2 rounded-lg"
          >
            Cancel
          </button>
          <button
            onClick={exportToExcel}
            disabled={previewData.length === 0}
            className="flex-1 bg-green-600 text-white py-2 rounded-lg hover:bg-green-700 disabled:opacity-50"
          >
            Export to Excel
          </button>
        </div>
      </div>
    </div>
  );
}
```

## 📝 Next Steps

1. **Complete Property Form Integration**: Add the categorized image upload and room/bed management to the property creation form
2. **Add Permit Upload**: Integrate permit upload button in OwnerDashboard
3. **Enhance Admin Dashboard**: Add enhanced analytics and report generation module
4. **Test All Features**: Test landlord profile creation, property creation with rooms/beds, image categorization, permit upload, and report generation

## 🎯 Key Features Summary

✅ **Landlord Profile Creation** - Component created and integrated
⏳ **Room/Bed Management** - Component created, needs integration in property form
⏳ **Categorized Images** - Component created, needs integration in property form
⏳ **Permit Upload** - Component created, needs integration in OwnerDashboard
⏳ **Enhanced Admin Analytics** - Needs implementation in AdminDashboard
⏳ **Report Generation** - Component structure provided, needs integration





