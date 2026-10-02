import React from 'react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import L from 'leaflet';
import BloodGroupBadge from './BloodGroupBadge';
import { Building2, Droplet, User, MapPin } from 'lucide-react';

// Custom Marker DivIcons
const createCustomIcon = (color, text) => {
  return L.divIcon({
    className: 'custom-leaflet-marker',
    html: `
      <div style="
        background: ${color};
        width: 32px;
        height: 32px;
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        color: white;
        font-weight: bold;
        font-size: 11px;
        border: 2px solid white;
        box-shadow: 0 4px 10px rgba(0,0,0,0.5);
      ">
        ${text}
      </div>
    `,
    iconSize: [32, 32],
    iconAnchor: [16, 32],
    popupAnchor: [0, -32]
  });
};

const hospitalIcon = createCustomIcon('#0284c7', '🏥');
const bloodBankIcon = createCustomIcon('#06b6d4', '🩸');
const donorIcon = createCustomIcon('#10b981', '👤');

export default function LeafletMap({ 
  center = [28.6139, 77.2090], 
  zoom = 12, 
  hospitals = [], 
  bloodBanks = [], 
  donors = [],
  height = '400px'
}) {
  return (
    <div style={{ height }} className="w-full rounded-2xl overflow-hidden border border-slate-800 shadow-xl relative z-10">
      <MapContainer center={center} zoom={zoom} scrollWheelZoom={false}>
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        {/* Hospital Markers */}
        {hospitals.map((h, idx) => (
          <Marker 
            key={`hosp-${idx}`} 
            position={[h.lat || 28.6139 + (idx * 0.005), h.lng || 77.2090 + (idx * 0.005)]}
            icon={hospitalIcon}
          >
            <Popup>
              <div className="p-1 text-slate-100 min-w-[200px]">
                <div className="flex items-center gap-2 text-sky-400 font-bold text-sm mb-1">
                  <Building2 className="w-4 h-4" />
                  {h.hospitalName || h.name}
                </div>
                <p className="text-xs text-slate-300">{h.address || h.city}</p>
                <div className="mt-2 text-[11px] text-slate-400 border-t border-slate-800 pt-1">
                  Phone: {h.phone}
                </div>
              </div>
            </Popup>
          </Marker>
        ))}

        {/* Blood Bank Markers */}
        {bloodBanks.map((bb, idx) => (
          <Marker 
            key={`bb-${idx}`} 
            position={[bb.lat || 28.6280 - (idx * 0.004), bb.lng || 77.2189 + (idx * 0.004)]}
            icon={bloodBankIcon}
          >
            <Popup>
              <div className="p-1 text-slate-100 min-w-[200px]">
                <div className="flex items-center gap-2 text-cyan-400 font-bold text-sm mb-1">
                  <Droplet className="w-4 h-4" />
                  {bb.bloodBankName || bb.name}
                </div>
                <p className="text-xs text-slate-300">{bb.address || bb.city}</p>
                <div className="mt-2 text-[11px] text-slate-400 border-t border-slate-800 pt-1">
                  Authorized Contact: {bb.phone}
                </div>
              </div>
            </Popup>
          </Marker>
        ))}

        {/* Donor Markers */}
        {donors.map((d, idx) => (
          <Marker 
            key={`donor-${idx}`} 
            position={[d.lat || 28.6180 + (idx * 0.003), d.lng || 77.2120 - (idx * 0.003)]}
            icon={donorIcon}
          >
            <Popup>
              <div className="p-1 text-slate-100 min-w-[180px]">
                <div className="flex items-center justify-between mb-1">
                  <span className="font-bold text-xs text-emerald-400 flex items-center gap-1">
                    <User className="w-3.5 h-3.5" /> {d.name}
                  </span>
                  <BloodGroupBadge bloodGroup={d.bloodGroup} size="sm" />
                </div>
                <p className="text-[11px] text-slate-300 flex items-center gap-1 mt-1">
                  <MapPin className="w-3 h-3 text-slate-400" /> Approximate City: {d.city}
                </p>
                <span className="inline-block mt-1 text-[10px] bg-emerald-500/20 text-emerald-400 px-2 py-0.5 rounded font-medium">
                  {d.isAvailable ? 'Available Donor' : 'Unavailable'}
                </span>
              </div>
            </Popup>
          </Marker>
        ))}
      </MapContainer>
    </div>
  );
}
