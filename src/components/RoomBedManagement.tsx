import React, { useState } from 'react';

interface Bed {
  id?: string;
  bed_number: string;
  bed_type: 'single' | 'double_deck_upper' | 'double_deck_lower';
  parent_bed_id?: string;
  status: 'available' | 'occupied' | 'maintenance';
  price?: number;
  deck_position?: 'upper' | 'lower';
}

interface Room {
  id?: string;
  room_number: string;
  room_name?: string;
  description?: string;
  max_beds: number;
  price_per_bed?: number;
  amenities: string[];
  beds: Bed[];
  bed_type?: 'single' | 'double_deck'; // Bed type for the room
}

interface RoomBedManagementProps {
  rooms: Room[];
  onChange: (rooms: Room[]) => void;
}

export default function RoomBedManagement({ rooms, onChange }: RoomBedManagementProps) {
  const [editingRoom, setEditingRoom] = useState<Room | null>(null);
  const [showRoomForm, setShowRoomForm] = useState(false);
  const [editingBed, setEditingBed] = useState<Bed | null>(null);

  const addRoom = () => {
    const newRoom: Room = {
      room_number: `Room ${rooms.length + 1}`,
      room_name: '',
      description: '',
      max_beds: 1,
      amenities: [],
      beds: [],
      bed_type: 'single' // Default to single beds
    };
    setEditingRoom(newRoom);
    setShowRoomForm(true);
  };

  const saveRoom = () => {
    if (!editingRoom) return;

    // If double deck is selected, automatically create upper and lower beds
    let roomToSave = { ...editingRoom };
    if (roomToSave.bed_type === 'double_deck' && roomToSave.max_beds > 0) {
      // Create beds: for each bed, create both upper and lower
      const newBeds: Bed[] = [];
      for (let i = 1; i <= roomToSave.max_beds; i++) {
        // Upper deck bed
        newBeds.push({
          bed_number: `Bed ${i} (Upper)`,
          bed_type: 'double_deck_upper',
          status: 'available',
          deck_position: 'upper'
        });
        // Lower deck bed
        newBeds.push({
          bed_number: `Bed ${i} (Lower)`,
          bed_type: 'double_deck_lower',
          status: 'available',
          deck_position: 'lower'
        });
      }
      roomToSave.beds = newBeds;
    } else if (roomToSave.bed_type === 'single' && roomToSave.max_beds > 0) {
      // Create single beds
      const newBeds: Bed[] = [];
      for (let i = 1; i <= roomToSave.max_beds; i++) {
        newBeds.push({
          bed_number: `Bed ${i}`,
          bed_type: 'single',
          status: 'available'
        });
      }
      roomToSave.beds = newBeds;
    }

    const updatedRooms = roomToSave.id
      ? rooms.map(r => r.id === roomToSave.id ? roomToSave : r)
      : [...rooms, { ...roomToSave, id: `temp-${Date.now()}` }];

    onChange(updatedRooms);
    setEditingRoom(null);
    setShowRoomForm(false);
  };

  const deleteRoom = (roomId: string | undefined) => {
    if (!roomId) return;
    onChange(rooms.filter(r => r.id !== roomId));
  };

  const addBed = (roomId: string | undefined) => {
    if (!roomId) return;
    const room = rooms.find(r => r.id === roomId);
    if (!room) return;

    const bedNumber = room.beds.length + 1;
    const newBed: Bed = {
      bed_number: `Bed ${bedNumber}`,
      bed_type: 'single',
      status: 'available'
    };
    
    const updatedRoom = { ...room, beds: [...room.beds, newBed] };
    const updatedRooms = rooms.map(r => r.id === roomId ? updatedRoom : r);
    onChange(updatedRooms);
  };

  const updateBed = (roomId: string | undefined, bedIndex: number, updates: Partial<Bed>) => {
    if (!roomId) return;
    const room = rooms.find(r => r.id === roomId);
    if (!room) return;

    const updatedBeds = room.beds.map((bed, idx) => 
      idx === bedIndex ? { ...bed, ...updates } : bed
    );

    // If changing to double-deck, create upper/lower pair
    if (updates.bed_type && updates.bed_type.startsWith('double_deck')) {
      const bed = room.beds[bedIndex];
      if (bed.bed_type === 'single') {
        const upperBed: Bed = {
          bed_number: `${bed.bed_number} (Upper)`,
          bed_type: 'double_deck_upper',
          status: 'available',
          parent_bed_id: bed.id
        };
        const lowerBed: Bed = {
          bed_number: `${bed.bed_number} (Lower)`,
          bed_type: 'double_deck_lower',
          status: 'available',
          parent_bed_id: bed.id
        };
        updatedBeds[bedIndex] = { ...bed, ...updates };
        updatedBeds.push(upperBed, lowerBed);
      }
    }

    const updatedRoom = { ...room, beds: updatedBeds };
    const updatedRooms = rooms.map(r => r.id === roomId ? updatedRoom : r);
    onChange(updatedRooms);
  };

  const deleteBed = (roomId: string | undefined, bedIndex: number) => {
    if (!roomId) return;
    const room = rooms.find(r => r.id === roomId);
    if (!room) return;

    const updatedBeds = room.beds.filter((_, idx) => idx !== bedIndex);
    const updatedRoom = { ...room, beds: updatedBeds };
    const updatedRooms = rooms.map(r => r.id === roomId ? updatedRoom : r);
    onChange(updatedRooms);
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h4 className="text-lg font-semibold text-gray-900">Rooms & Beds</h4>
        <button
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            console.log('Add Room button clicked');
            addRoom();
          }}
          type="button"
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors cursor-pointer z-10 relative"
        >
          + Add Room
        </button>
      </div>

      {/* Show new room form if adding a new room */}
      {showRoomForm && editingRoom && !editingRoom.id && (
        <div className="border border-gray-200 rounded-xl p-4 bg-blue-50">
          <div className="space-y-4">
            <h3 className="text-lg font-bold text-gray-900 mb-4">Add New Room</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Room Number</label>
                <input
                  type="text"
                  value={editingRoom.room_number}
                  onChange={(e) => setEditingRoom({ ...editingRoom, room_number: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-200 rounded-lg"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Room Name</label>
                <input
                  type="text"
                  value={editingRoom.room_name || ''}
                  onChange={(e) => setEditingRoom({ ...editingRoom, room_name: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-200 rounded-lg"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Max Beds</label>
                <input
                  type="number"
                  value={editingRoom.max_beds}
                  onChange={(e) => setEditingRoom({ ...editingRoom, max_beds: parseInt(e.target.value) || 1 })}
                  min="1"
                  className="w-full px-4 py-2 border border-gray-200 rounded-lg"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Bed Type</label>
                <select
                  value={editingRoom.bed_type || 'single'}
                  onChange={(e) => setEditingRoom({ ...editingRoom, bed_type: e.target.value as 'single' | 'double_deck' })}
                  className="w-full px-4 py-2 border border-gray-200 rounded-lg"
                >
                  <option value="single">Single Deck</option>
                  <option value="double_deck">Double Deck (Upper & Lower)</option>
                </select>
                {editingRoom.bed_type === 'double_deck' && (
                  <p className="mt-2 text-sm text-gray-600">
                    Note: Double deck beds will automatically create both upper and lower bed spaces. 
                    Total bed spaces: {editingRoom.max_beds * 2}
                  </p>
                )}
              </div>
              <div className="flex gap-4">
                <button
                  onClick={() => {
                    setShowRoomForm(false);
                    setEditingRoom(null);
                  }}
                  className="flex-1 bg-gray-100 text-gray-700 py-2 rounded-lg hover:bg-gray-200"
                >
                  Cancel
                </button>
                <button
                  onClick={saveRoom}
                  className="flex-1 bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700"
                >
                  Save
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {rooms.map((room) => (
        <div key={room.id} className="border border-gray-200 rounded-xl p-4">
          {showRoomForm && editingRoom && editingRoom.id === room.id ? (
            // Show edit form inline
            <div className="space-y-4">
              <h3 className="text-lg font-bold text-gray-900 mb-4">Edit Room</h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Room Number</label>
                  <input
                    type="text"
                    value={editingRoom.room_number}
                    onChange={(e) => setEditingRoom({ ...editingRoom, room_number: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-200 rounded-lg"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Room Name</label>
                  <input
                    type="text"
                    value={editingRoom.room_name || ''}
                    onChange={(e) => setEditingRoom({ ...editingRoom, room_name: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-200 rounded-lg"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Max Beds</label>
                  <input
                    type="number"
                    value={editingRoom.max_beds}
                    onChange={(e) => setEditingRoom({ ...editingRoom, max_beds: parseInt(e.target.value) || 1 })}
                    min="1"
                    className="w-full px-4 py-2 border border-gray-200 rounded-lg"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Bed Type</label>
                  <select
                    value={editingRoom.bed_type || 'single'}
                    onChange={(e) => setEditingRoom({ ...editingRoom, bed_type: e.target.value as 'single' | 'double_deck' })}
                    className="w-full px-4 py-2 border border-gray-200 rounded-lg"
                  >
                    <option value="single">Single Deck</option>
                    <option value="double_deck">Double Deck (Upper & Lower)</option>
                  </select>
                  {editingRoom.bed_type === 'double_deck' && (
                    <p className="mt-2 text-sm text-gray-600">
                      Note: Double deck beds will automatically create both upper and lower bed spaces. 
                      Total bed spaces: {editingRoom.max_beds * 2}
                    </p>
                  )}
                </div>
                <div className="flex gap-4">
                  <button
                    onClick={() => {
                      setShowRoomForm(false);
                      setEditingRoom(null);
                    }}
                    className="flex-1 bg-gray-100 text-gray-700 py-2 rounded-lg hover:bg-gray-200"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={saveRoom}
                    className="flex-1 bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700"
                  >
                    Save
                  </button>
                </div>
              </div>
            </div>
          ) : (
            // Show room info
            <>
              <div className="flex justify-between items-start mb-3">
                <div>
                  <h5 className="font-semibold text-gray-900">
                    {room.room_name || room.room_number}
                  </h5>
                  <p className="text-sm text-gray-600">
                    {room.max_beds} bed{room.max_beds !== 1 ? 's' : ''} max
                  </p>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => {
                      setEditingRoom(room);
                      setShowRoomForm(true);
                    }}
                    className="px-3 py-1 text-sm bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => deleteRoom(room.id)}
                    className="px-3 py-1 text-sm bg-red-100 text-red-700 rounded-lg hover:bg-red-200"
                  >
                    Delete
                  </button>
                </div>
              </div>
            </>
          )}

          <div className="space-y-2">
            {room.beds.map((bed, bedIndex) => (
              <div key={bedIndex} className="flex items-center gap-2 p-2 bg-gray-50 rounded-lg">
                <span className="flex-1 text-sm font-medium">{bed.bed_number}</span>
                <select
                  value={bed.bed_type}
                  onChange={(e) => updateBed(room.id, bedIndex, { bed_type: e.target.value as any })}
                  className="text-sm border border-gray-200 rounded px-2 py-1"
                >
                  <option value="single">Single</option>
                  <option value="double_deck_upper">Double-Deck (Upper)</option>
                  <option value="double_deck_lower">Double-Deck (Lower)</option>
                </select>
                <span className={`text-lg ${bed.status === 'available' ? 'text-green-600' : 'text-red-600'}`}>
                  {bed.status === 'available' ? '🟢' : '🔴'}
                </span>
                <button
                  onClick={() => deleteBed(room.id, bedIndex)}
                  className="text-red-600 hover:text-red-800"
                >
                  ×
                </button>
              </div>
            ))}
            <button
              onClick={() => addBed(room.id)}
              className="w-full px-3 py-2 text-sm bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200"
            >
              + Add Bed
            </button>
          </div>
        </div>
      ))}

    </div>
  );
}

