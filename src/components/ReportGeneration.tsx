import React, { useState, useEffect } from 'react';
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
// @ts-ignore
import 'jspdf-autotable';
import supabase from '../lib/supabase';

// Extend jsPDF type to include autoTable
declare module 'jspdf' {
  interface jsPDF {
    autoTable(options: any): jsPDF;
  }
}

interface ReportGenerationProps {
  onClose: () => void;
}

// Helper functions
const formatValue = (value: any): string => {
  if (value === null || value === undefined) return 'N/A';
  if (typeof value === 'boolean') return value ? 'Yes' : 'No';
  if (typeof value === 'number') {
    // Check if it's a date timestamp (roughly > 2000-01-01)
    if (value > 946684800000) {
      return new Date(value).toLocaleDateString();
    }
    // Check if it's a price/amount
    if (value > 1000 && value % 1 !== 0) {
      return `₱${value.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    }
    return value.toLocaleString();
  }
  if (typeof value === 'string') {
    // Check if it's a date string
    if (value.match(/^\d{4}-\d{2}-\d{2}/)) {
      return new Date(value).toLocaleDateString();
    }
    return value;
  }
  if (typeof value === 'object') {
    // For nested objects, extract meaningful data
    if (value.title) return value.title;
    if (value.name) return value.name;
    if (value.email) return value.email;
    if (value.location) return value.location;
    if (value.room_number) return `Room ${value.room_number}`;
    if (value.bed_number) return `Bed ${value.bed_number}`;
    return JSON.stringify(value).substring(0, 40);
  }
  return String(value);
};

const getColumnPriority = (key: string): number => {
  const priorities: { [key: string]: number } = {
    // Bookings
    'id': 100, // Hide ID or put last
    'full_name': 1,
    'tenant_email': 2,
    'properties_title': 3,
    'properties_location': 4,
    'check_in_date': 5,
    'check_out_date': 6,
    'total_amount': 7,
    'status': 8,
    'created_at': 9,
    // Landlords
    'landlord_email': 2,
    'landlord_full_name': 3,
    'landlord_phone': 4,
    // Tenants
    'address': 5,
    'barangay': 6,
    'municipality_city': 7,
    'citizenship': 8,
    'gender': 9,
    'age': 10,
    'occupation_status': 11,
    // Revenue
    'owner_email': 4,
  };
  return priorities[key.toLowerCase()] || 100;
};

const flattenData = (data: any[]) => {
  return data.map(item => {
    const flat: any = {};
    Object.keys(item).forEach(key => {
      if (typeof item[key] === 'object' && item[key] !== null) {
        // Flatten nested objects with meaningful names
        Object.keys(item[key]).forEach(subKey => {
          const flatKey = `${key}_${subKey}`;
          flat[flatKey] = item[key][subKey];
        });
      } else {
        flat[key] = item[key];
      }
    });
    return flat;
  });
};

export default function ReportGeneration({ onClose }: ReportGenerationProps) {
  const [reportType, setReportType] = useState<'bookings' | 'landlords' | 'tenants' | 'revenue'>('bookings');
  const [selectedBoardingHouse, setSelectedBoardingHouse] = useState<string>('');
  const [dateRange, setDateRange] = useState({ start: '', end: '' });
  const [previewData, setPreviewData] = useState<any[]>([]);
  const [filteredPreviewData, setFilteredPreviewData] = useState<any[]>([]);
  const [generating, setGenerating] = useState(false);
  const [boardingHouses, setBoardingHouses] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<'date' | 'month' | 'year'>('date');
  const [selectedMonth, setSelectedMonth] = useState('');
  const [selectedYear, setSelectedYear] = useState('');

  useEffect(() => {
    // Load boarding houses for filter
    const loadBoardingHouses = async () => {
      const { data } = await supabase
        .from('boarding_houses')
        .select('id, name')
        .order('name');
      if (data) setBoardingHouses(data);
    };
    loadBoardingHouses();
  }, []);

  const loadPreview = async () => {
    setGenerating(true);
    try {
      let query: any;
      
      switch (reportType) {
        case 'bookings':
          query = supabase
            .from('bookings')
            .select(`
              *,
              properties(title, location),
              rooms(room_number, room_name),
              beds(bed_number, bed_type)
            `);
          break;
        case 'landlords':
          query = supabase
            .from('landlord_profiles')
            .select('*');
          break;
        case 'tenants':
          // Try multiple tenant table names
          query = supabase
            .from('bookings')
            .select(`
              full_name,
              tenant_email,
              address,
              barangay,
              municipality_city,
              citizenship,
              gender,
              age,
              occupation_status,
              status,
              total_amount,
              created_at
            `)
            .not('full_name', 'is', null);
          break;
        case 'revenue':
          query = supabase
            .from('bookings')
            .select(`
              *,
              properties(title, location, owner_email),
              landlord_profiles(full_name, email)
            `)
            .eq('status', 'approved');
          break;
        default:
          query = supabase.from('bookings').select('*');
      }
      
      if (selectedBoardingHouse && (reportType === 'bookings' || reportType === 'revenue')) {
        query = query.or(`property_id.eq.${selectedBoardingHouse},boarding_house_id.eq.${selectedBoardingHouse}`);
      }
      
      // Apply date filtering based on filter type
      if (filterType === 'date') {
        if (dateRange.start) {
          query = query.gte('created_at', dateRange.start + 'T00:00:00');
        }
        if (dateRange.end) {
          query = query.lte('created_at', dateRange.end + 'T23:59:59');
        }
      } else if (filterType === 'month' && selectedMonth) {
        const [year, month] = selectedMonth.split('-');
        const startDate = `${year}-${month}-01T00:00:00`;
        // Get last day of month
        const lastDay = new Date(parseInt(year), parseInt(month), 0).getDate();
        const endDate = `${year}-${month}-${lastDay}T23:59:59`;
        query = query.gte('created_at', startDate).lte('created_at', endDate);
      } else if (filterType === 'year' && selectedYear) {
        const startDate = `${selectedYear}-01-01T00:00:00`;
        const endDate = `${selectedYear}-12-31T23:59:59`;
        query = query.gte('created_at', startDate).lte('created_at', endDate);
      }

      const { data, error } = await query.order('created_at', { ascending: false });
      if (error) throw error;
      
      const fetchedData = data || [];
      const flattened = flattenData(fetchedData);
      setPreviewData(flattened);
      setFilteredPreviewData(flattened);
      
      if (fetchedData.length === 0) {
        alert('No records found for the selected filters.');
      }
    } catch (err: any) {
      console.error('Failed to load preview:', err);
      alert(`Failed to load preview data: ${err?.message || 'Unknown error'}`);
    } finally {
      setGenerating(false);
    }
  };

  // Filter preview data based on search query
  React.useEffect(() => {
    if (!searchQuery.trim()) {
      setFilteredPreviewData(previewData);
      return;
    }

    const query = searchQuery.toLowerCase();
    const filtered = previewData.filter(item => {
      // Search through all string values in the item
      return Object.values(item).some(value => {
        if (typeof value === 'string') {
          return value.toLowerCase().includes(query);
        }
        if (typeof value === 'number') {
          return value.toString().includes(query);
        }
        return false;
      });
    });
    setFilteredPreviewData(filtered);
  }, [searchQuery, previewData]);

  const exportToExcel = () => {
    const dataToExport = filteredPreviewData.length > 0 ? filteredPreviewData : previewData;
    
    if (dataToExport.length === 0) {
      alert('No data to export. Please preview data first.');
      return;
    }

    // Data is already flattened
    const ws = XLSX.utils.json_to_sheet(dataToExport);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Report');
    const filterInfo = selectedBoardingHouse || dateRange.start || dateRange.end ? '-filtered' : '';
    const fileName = `${reportType}-report${filterInfo}-${new Date().toISOString().split('T')[0]}.xlsx`;
    XLSX.writeFile(wb, fileName);
    alert(`Report exported successfully as ${fileName} (${dataToExport.length} records)`);
  };

  const exportToPDF = () => {
    const dataToExport = filteredPreviewData.length > 0 ? filteredPreviewData : previewData;
    
    if (dataToExport.length === 0) {
      alert('No data to export. Please preview data first.');
      return;
    }

    try {
      const doc = new jsPDF('landscape'); // Use landscape for better column space
      let startY = 20;

      // Add title
      doc.setFontSize(18);
      doc.setFont('helvetica', 'bold');
      doc.text('BoardingHub Report', 14, 15);
      
      // Add report type
      doc.setFontSize(12);
      doc.setFont('helvetica', 'normal');
      const reportTypeLabel = reportType === 'bookings' ? 'Bookings Report' :
                             reportType === 'landlords' ? 'Landlords Report' :
                             reportType === 'tenants' ? 'Tenants Report' :
                             reportType === 'revenue' ? 'Revenue Report' : 'Report';
      doc.text(reportTypeLabel, 14, 22);
      
      // Add filter information
      doc.setFontSize(9);
      let filterInfo = [];
      if (selectedBoardingHouse) {
        const boardingHouse = boardingHouses.find(bh => bh.id === selectedBoardingHouse);
        filterInfo.push(`Boarding House: ${boardingHouse?.name || selectedBoardingHouse}`);
      }
      if (filterType === 'date' && dateRange.start) {
        filterInfo.push(`Start Date: ${new Date(dateRange.start).toLocaleDateString()}`);
      }
      if (filterType === 'date' && dateRange.end) {
        filterInfo.push(`End Date: ${new Date(dateRange.end).toLocaleDateString()}`);
      }
      if (filterType === 'month' && selectedMonth) {
        const monthLabel = new Date(selectedMonth + '-01').toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
        filterInfo.push(`Month: ${monthLabel}`);
      }
      if (filterType === 'year' && selectedYear) {
        filterInfo.push(`Year: ${selectedYear}`);
      }
      
      if (filterInfo.length > 0) {
        filterInfo.forEach((info, index) => {
          doc.text(info, 14, 28 + (index * 4));
        });
        startY = 28 + (filterInfo.length * 4) + 6;
      } else {
        startY = 28;
      }

      // Add generation date
      doc.text(`Generated: ${new Date().toLocaleString()}`, 14, startY);
      startY += 8;

      // Get all keys and sort by priority
      const allKeys = new Set<string>();
      dataToExport.forEach(item => {
        Object.keys(item).forEach(key => allKeys.add(key));
      });

      const sortedKeys = Array.from(allKeys).sort((a, b) => {
        const priorityA = getColumnPriority(a);
        const priorityB = getColumnPriority(b);
        if (priorityA !== priorityB) return priorityA - priorityB;
        return a.localeCompare(b);
      });

      // Select top 8-10 most important columns
      const headers = sortedKeys.slice(0, 10);
      
      // Format headers for display
      const formatHeader = (header: string): string => {
        return header
          .replace(/_/g, ' ')
          .replace(/\b\w/g, l => l.toUpperCase())
          .replace('Properties ', '')
          .replace('Rooms ', '')
          .replace('Beds ', '');
      };

      const tableData = dataToExport.map(item => {
        return headers.map(header => {
          const value = item[header];
          const formatted = formatValue(value);
          // Limit cell content length
          return formatted.length > 40 ? formatted.substring(0, 37) + '...' : formatted;
        });
      });

      // Calculate column widths (distribute evenly with some flexibility)
      const pageWidth = doc.internal.pageSize.getWidth();
      const margin = 14;
      const availableWidth = pageWidth - (margin * 2);
      const baseWidth = availableWidth / headers.length;
      
      const columnStyles: any = {};
      headers.forEach((header, index) => {
        // Adjust width based on header length and content type
        let width = baseWidth;
        if (header.includes('email') || header.includes('address')) {
          width = baseWidth * 1.3;
        } else if (header.includes('name') || header.includes('title')) {
          width = baseWidth * 1.2;
        } else if (header.includes('date') || header.includes('amount')) {
          width = baseWidth * 0.9;
        } else if (header.includes('id') || header.includes('status')) {
          width = baseWidth * 0.7;
        }
        columnStyles[index] = { cellWidth: width };
      });

      // Add table
      (doc as any).autoTable({
        head: [[...headers.map(formatHeader)]],
        body: tableData,
        startY: startY,
        styles: { 
          fontSize: 8,
          cellPadding: 3,
          overflow: 'linebreak',
          cellWidth: 'wrap'
        },
        headStyles: { 
          fillColor: [66, 139, 202],
          textColor: [255, 255, 255],
          fontStyle: 'bold',
          fontSize: 9
        },
        alternateRowStyles: {
          fillColor: [245, 245, 245]
        },
        columnStyles: columnStyles,
        margin: { left: margin, right: margin },
        pageBreak: 'auto',
        rowPageBreak: 'avoid',
        showHead: 'everyPage'
      });

      // Add summary at the end
      const finalY = (doc as any).lastAutoTable.finalY + 10;
      doc.setFontSize(10);
      doc.setFont('helvetica', 'bold');
      doc.text(`Total Records: ${dataToExport.length}`, margin, finalY);

      // Save the PDF
      const filterInfoStr = selectedBoardingHouse || dateRange.start || dateRange.end || selectedMonth || selectedYear ? '-filtered' : '';
      const fileName = `${reportType}-report${filterInfoStr}-${new Date().toISOString().split('T')[0]}.pdf`;
      doc.save(fileName);
      
      alert(`PDF report exported successfully as ${fileName} (${dataToExport.length} records)`);
    } catch (error) {
      console.error('Failed to generate PDF:', error);
      alert(`Failed to generate PDF report: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  // Get sorted keys for preview table
  const getPreviewHeaders = () => {
    const data = filteredPreviewData.length > 0 ? filteredPreviewData : previewData;
    if (data.length === 0) return [];

    const allKeys = new Set<string>();
    data.forEach(item => {
      Object.keys(item).forEach(key => allKeys.add(key));
    });

    return Array.from(allKeys).sort((a, b) => {
      const priorityA = getColumnPriority(a);
      const priorityB = getColumnPriority(b);
      if (priorityA !== priorityB) return priorityA - priorityB;
      return a.localeCompare(b);
    }).slice(0, 10);
  };

  const previewHeaders = getPreviewHeaders();

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-2xl max-w-5xl w-full p-6 shadow-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-2xl font-bold text-gray-900">Generate Report</h3>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 text-2xl"
          >
            ×
          </button>
        </div>
        
        {/* Filters */}
        <div className="space-y-4 mb-6 p-4 bg-gray-50 rounded-xl">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Report Type</label>
            <select
              value={reportType}
              onChange={(e) => {
                setReportType(e.target.value as any);
                setPreviewData([]); // Clear preview when type changes
                setFilteredPreviewData([]);
              }}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="bookings">Bookings Report</option>
              <option value="landlords">Landlords Report</option>
              <option value="tenants">Tenants Report</option>
              <option value="revenue">Revenue Report</option>
            </select>
          </div>

          {reportType === 'bookings' || reportType === 'revenue' ? (
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Filter by Boarding House</label>
              <select
                value={selectedBoardingHouse}
                onChange={(e) => setSelectedBoardingHouse(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">All Boarding Houses</option>
                {boardingHouses.map(bh => (
                  <option key={bh.id} value={bh.id}>{bh.name}</option>
                ))}
              </select>
            </div>
          ) : null}

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Filter By</label>
            <select
              value={filterType}
              onChange={(e) => {
                setFilterType(e.target.value as 'date' | 'month' | 'year');
                setDateRange({ start: '', end: '' });
                setSelectedMonth('');
                setSelectedYear('');
              }}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 mb-4"
            >
              <option value="date">Date Range</option>
              <option value="month">Month</option>
              <option value="year">Year</option>
            </select>

            {filterType === 'date' && (
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Start Date</label>
                  <input
                    type="date"
                    value={dateRange.start}
                    onChange={(e) => setDateRange({ ...dateRange, start: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">End Date</label>
                  <input
                    type="date"
                    value={dateRange.end}
                    onChange={(e) => setDateRange({ ...dateRange, end: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
            )}

            {filterType === 'month' && (
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Select Month</label>
                <input
                  type="month"
                  value={selectedMonth}
                  onChange={(e) => setSelectedMonth(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            )}

            {filterType === 'year' && (
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Select Year</label>
                <select
                  value={selectedYear}
                  onChange={(e) => setSelectedYear(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Select Year</option>
                  {Array.from({ length: 10 }, (_, i) => {
                    const year = new Date().getFullYear() - i;
                    return <option key={year} value={year.toString()}>{year}</option>;
                  })}
                </select>
              </div>
            )}
          </div>

          <button
            onClick={loadPreview}
            disabled={generating}
            className="w-full bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700 transition-colors font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {generating ? 'Loading Preview...' : 'Preview Data'}
          </button>
        </div>

        {/* Search Bar - Only show when data is loaded */}
        {previewData.length > 0 && (
          <div className="mb-6 p-4 bg-gray-50 rounded-xl">
            <label className="block text-sm font-semibold text-gray-700 mb-2">Search Data</label>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by any field (name, email, property, etc.)..."
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            {searchQuery && (
              <div className="mt-2 text-sm text-gray-600">
                Showing {filteredPreviewData.length} of {previewData.length} records
              </div>
            )}
          </div>
        )}

        {/* Preview */}
        {(filteredPreviewData.length > 0 || previewData.length > 0) && (
          <div className="mb-6">
            <div className="flex justify-between items-center mb-3">
              <h4 className="font-semibold text-gray-900">
                Preview ({filteredPreviewData.length > 0 ? filteredPreviewData.length : previewData.length} record{(filteredPreviewData.length > 0 ? filteredPreviewData.length : previewData.length) !== 1 ? 's' : ''})
              </h4>
              <span className="text-sm text-gray-600">
                Showing first {Math.min(20, filteredPreviewData.length > 0 ? filteredPreviewData.length : previewData.length)} of {filteredPreviewData.length > 0 ? filteredPreviewData.length : previewData.length}
              </span>
            </div>
            <div className="max-h-96 overflow-y-auto border border-gray-200 rounded-lg">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 sticky top-0">
                  <tr>
                    {previewHeaders.map(key => (
                      <th key={key} className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase border-b">
                        {key.replace(/_/g, ' ').replace('properties', '').replace('landlord', '').trim()}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {(filteredPreviewData.length > 0 ? filteredPreviewData : previewData).slice(0, 20).map((row, idx) => (
                    <tr key={idx} className="border-b hover:bg-gray-50">
                      {previewHeaders.map((key, i) => (
                        <td key={i} className="px-4 py-2 text-gray-700">
                          {formatValue(row[key])}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-4 pt-4 border-t">
          <button
            onClick={onClose}
            className="flex-1 bg-gray-100 text-gray-700 py-3 rounded-lg hover:bg-gray-200 transition-colors font-semibold"
          >
            Close
          </button>
          <button
            onClick={exportToExcel}
            disabled={previewData.length === 0}
            className="flex-1 bg-gradient-to-r from-green-600 to-green-700 text-white py-3 rounded-lg hover:from-green-700 hover:to-green-800 transition-all font-semibold shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            Export to Excel
          </button>
          <button
            onClick={exportToPDF}
            disabled={previewData.length === 0}
            className="flex-1 bg-gradient-to-r from-red-600 to-red-700 text-white py-3 rounded-lg hover:from-red-700 hover:to-red-800 transition-all font-semibold shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
            </svg>
            Export to PDF
          </button>
        </div>
      </div>
    </div>
  );
}
