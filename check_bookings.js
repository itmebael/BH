
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://jlahqyvpgdntlqfpxvoz.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImpsYWhxeXZwZ2RudGxxZnB4dm96Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTczMzY1MTAsImV4cCI6MjA3MjkxMjUxMH0.UrNCmuMXv9nPI8oXKD79aYzKI8VQnfWvprKIafk9hPg';

const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    persistSession: false
  }
});

async function checkRevenue() {
  console.log('Fetching approved bookings...');
  
  const { data: revenueData, error } = await supabase
    .from('bookings')
    .select('id, total_amount, property_id, boarding_house_id, room_id, bed_id')
    .eq('status', 'approved');

  if (error) {
    console.error('Error fetching bookings:', error);
    return;
  }

  console.log(`Found ${revenueData.length} approved bookings.`);

  // Fetch properties prices for fallback
  const propertyIds = revenueData.map(b => b.property_id || b.boarding_house_id).filter(Boolean);
  const roomIds = revenueData.map(b => b.room_id).filter(Boolean);
  const bedIds = revenueData.map(b => b.bed_id).filter(Boolean);

  let propertyPrices = {};
  let roomPrices = {};
  let bedPrices = {};

  if (propertyIds.length > 0) {
    const { data: prices } = await supabase
      .from('properties')
      .select('id, price')
      .in('id', propertyIds);
      
    (prices || []).forEach(p => {
      propertyPrices[p.id] = Number(p.price) || 0;
    });
  }

  if (roomIds.length > 0) {
    const { data: rPrices } = await supabase
      .from('rooms')
      .select('id, price_per_bed')
      .in('id', roomIds);
      
    (rPrices || []).forEach(r => {
      roomPrices[r.id] = Number(r.price_per_bed) || 0;
    });
  }

  if (bedIds.length > 0) {
    const { data: bPrices } = await supabase
      .from('beds')
      .select('id, price')
      .in('id', bedIds);
      
    (bPrices || []).forEach(b => {
      bedPrices[b.id] = Number(b.price) || 0;
    });
  }

  let calculatedRevenue = 0;

  console.log('\n--- Booking Details ---');
  revenueData.forEach(booking => {
    let amount = Number(booking.total_amount);
    let source = 'total_amount';

    if (!amount) {
      if (booking.bed_id && bedPrices[booking.bed_id]) {
        amount = bedPrices[booking.bed_id];
        source = 'bed_price';
      } else if (booking.room_id && roomPrices[booking.room_id]) {
        amount = roomPrices[booking.room_id];
        source = 'room_price';
      } else {
        const propId = booking.property_id || booking.boarding_house_id;
        if (propId && propertyPrices[propId]) {
          amount = propertyPrices[propId];
          source = 'property_price';
        } else {
            source = 'unknown (0)';
        }
      }
    }

    const finalAmount = Number.isFinite(amount) ? amount : 0;
    calculatedRevenue += finalAmount;
    
    console.log(`Booking ID: ${booking.id} | Amount: ₱${finalAmount} (Source: ${source})`);
  });

  console.log('\n--- Total Revenue ---');
  console.log(`₱${calculatedRevenue.toLocaleString()}`);
}

checkRevenue();
