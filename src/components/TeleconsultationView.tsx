'use client';

import React, { useState } from 'react';
import { Video, PhoneCall, Calendar, Clock, MapPin, User, CheckCircle2, Search, Filter, ShieldCheck, Sparkles } from 'lucide-react';

interface Doctor {
  id: string;
  name: string;
  specialty: string;
  hospital: string;
  distance: string;
  languages: string[];
  availability: string;
  rating: number;
  consultationType: 'Video & Audio' | 'Audio Only';
  image: string;
}

const DOCTORS: Doctor[] = [
  {
    id: 'DOC-101',
    name: 'Dr. Rajesh Sharma',
    specialty: 'PHC Medical Officer (General)',
    hospital: 'Rampur Sub-District Health Centre',
    distance: '3.5 km',
    languages: ['Hindi', 'English'],
    availability: 'Available Today (10:30 AM - 4:00 PM)',
    rating: 4.9,
    consultationType: 'Video & Audio',
    image: 'https://images.unsplash.com/photo-1622253692010-333f2da6031d?w=150&auto=format&fit=crop&q=80'
  },
  {
    id: 'DOC-102',
    name: 'Dr. Ananya Sen',
    specialty: 'Cardiologist',
    hospital: 'District Hospital & Medical College',
    distance: '14.2 km',
    languages: ['Bengali', 'Hindi', 'English'],
    availability: 'Available Today (02:00 PM - 6:00 PM)',
    rating: 4.8,
    consultationType: 'Video & Audio',
    image: 'https://images.unsplash.com/photo-1594824813566-88855ce7890b?w=150&auto=format&fit=crop&q=80'
  },
  {
    id: 'DOC-103',
    name: 'Dr. Vikram Rao',
    specialty: 'Endocrinologist (Diabetes Specialist)',
    hospital: 'Regional Telehealth Hub',
    distance: 'Remote Teleconsult',
    languages: ['Telugu', 'Hindi', 'English'],
    availability: 'Available Tomorrow (09:00 AM - 1:00 PM)',
    rating: 4.9,
    consultationType: 'Video & Audio',
    image: 'https://images.unsplash.com/photo-1537368910025-700350fe46c7?w=150&auto=format&fit=crop&q=80'
  },
  {
    id: 'DOC-104',
    name: 'Dr. Priya Sundaram',
    specialty: 'Community Health Specialist',
    hospital: 'Rampur Sector 4 Primary Health Post',
    distance: '1.2 km',
    languages: ['Tamil', 'Hindi', 'English'],
    availability: 'Available Today (11:00 AM - 5:00 PM)',
    rating: 4.7,
    consultationType: 'Audio Only',
    image: 'https://images.unsplash.com/photo-1559839734-2b71ea197ec2?w=150&auto=format&fit=crop&q=80'
  }
];

export default function TeleconsultationView() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSpecialty, setSelectedSpecialty] = useState('ALL');
  const [bookingDoctor, setBookingDoctor] = useState<Doctor | null>(null);
  const [bookedSlot, setBookedSlot] = useState<string | null>(null);
  const [patientNameInput, setPatientNameInput] = useState('Sunita Devi');
  const [bookingSuccess, setBookingSuccess] = useState(false);

  const filteredDoctors = DOCTORS.filter((doc) => {
    const matchesSearch =
      doc.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      doc.specialty.toLowerCase().includes(searchQuery.toLowerCase()) ||
      doc.hospital.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesSpecialty =
      selectedSpecialty === 'ALL' ||
      (selectedSpecialty === 'PHC' && doc.specialty.includes('PHC')) ||
      (selectedSpecialty === 'CARDIO' && doc.specialty.includes('Cardio')) ||
      (selectedSpecialty === 'DIABETES' && doc.specialty.includes('Endo'));

    return matchesSearch && matchesSpecialty;
  });

  const handleConfirmBooking = (e: React.FormEvent) => {
    e.preventDefault();
    setBookingSuccess(true);
  };

  return (
    <div className="space-y-6">
      {/* HEADER BANNER */}
      <div className="bg-gradient-to-r from-stitch-indigo to-indigo-900 text-white rounded-2xl p-6 shadow-stitch">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <span className="px-3 py-1 bg-white/20 rounded-full text-xs font-bold uppercase tracking-wider text-stitch-gold-light">
              Rural Tele-Health Network
            </span>
            <h2 className="text-2xl font-black mt-2">Doctor Teleconsultation & Booking</h2>
            <p className="text-sm text-indigo-100 mt-1">
              Connect ASHA workers and high-risk rural patients directly with PHC Medical Officers and Specialists.
            </p>
          </div>
          <div className="flex items-center gap-2 bg-white/10 backdrop-blur-md px-4 py-2 rounded-xl text-xs font-bold border border-white/20">
            <ShieldCheck className="w-5 h-5 text-emerald-300" />
            <span>Encrypted Audio/Video Link</span>
          </div>
        </div>
      </div>

      {/* FILTER & SEARCH BAR */}
      <div className="bg-white p-4 rounded-2xl border border-stitch-border shadow-sm flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="relative w-full md:w-96">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3.5" />
          <input
            type="text"
            placeholder="Search by doctor name, hospital, or specialty..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-stitch-teal"
          />
        </div>

        <div className="flex items-center gap-2 w-full md:w-auto overflow-x-auto">
          <Filter className="w-4 h-4 text-stitch-indigo shrink-0" />
          {['ALL', 'PHC', 'CARDIO', 'DIABETES'].map((type) => (
            <button
              key={type}
              onClick={() => setSelectedSpecialty(type)}
              className={`px-3 py-1.5 rounded-lg text-xs font-extrabold uppercase transition-all shrink-0 ${
                selectedSpecialty === type
                  ? 'bg-stitch-teal text-white shadow-md'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              {type === 'ALL' ? 'All Doctors' : type === 'PHC' ? 'PHC Officers' : type === 'CARDIO' ? 'Cardiology' : 'Endocrinology'}
            </button>
          ))}
        </div>
      </div>

      {/* DOCTORS GRID */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {filteredDoctors.map((doc) => (
          <div key={doc.id} className="stitch-card p-5 flex flex-col justify-between space-y-4">
            <div className="flex items-start gap-4">
              <img
                src={doc.image}
                alt={doc.name}
                className="w-16 h-16 rounded-xl object-cover border-2 border-stitch-indigo/20 shadow-sm shrink-0"
              />
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="font-bold text-base text-stitch-indigo">{doc.name}</h3>
                  <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 text-[10px] font-black rounded-md">
                    ★ {doc.rating}
                  </span>
                </div>
                <p className="text-xs font-bold text-stitch-teal mt-0.5">{doc.specialty}</p>
                <p className="text-xs text-stitch-muted mt-1">{doc.hospital}</p>
                <div className="flex items-center gap-3 text-xs text-slate-600 mt-2">
                  <span className="flex items-center gap-1">
                    <MapPin className="w-3.5 h-3.5 text-rose-500" /> {doc.distance}
                  </span>
                  <span className="flex items-center gap-1 font-semibold text-slate-700">
                    🗣 {doc.languages.join(', ')}
                  </span>
                </div>
              </div>
            </div>

            <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 flex items-center justify-between">
              <div className="flex items-center gap-2 text-xs font-semibold text-slate-700">
                <Clock className="w-4 h-4 text-stitch-teal" />
                <span>{doc.availability}</span>
              </div>
              <span className="text-[11px] font-black px-2 py-0.5 bg-slate-200 rounded-md text-slate-800 uppercase">
                {doc.consultationType}
              </span>
            </div>

            <button
              onClick={() => {
                setBookingDoctor(doc);
                setBookedSlot('11:30 AM');
                setBookingSuccess(false);
              }}
              className="w-full stitch-btn-primary text-sm py-2.5 shadow-md"
            >
              <Video className="w-4 h-4" />
              <span>Schedule Teleconsultation</span>
            </button>
          </div>
        ))}
      </div>

      {/* BOOKING MODAL */}
      {bookingDoctor && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-stitch-border relative animate-scale-in">
            {bookingSuccess ? (
              <div className="text-center py-6 space-y-4">
                <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto shadow-lg">
                  <CheckCircle2 className="w-10 h-10" />
                </div>
                <h3 className="text-xl font-bold text-stitch-indigo">Appointment Confirmed!</h3>
                <p className="text-sm text-stitch-muted">
                  Teleconsultation scheduled for <span className="font-bold text-slate-900">{patientNameInput}</span> with <span className="font-bold text-stitch-teal">{bookingDoctor.name}</span>.
                </p>
                <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-left text-xs space-y-1">
                  <p><strong>Doctor:</strong> {bookingDoctor.name} ({bookingDoctor.specialty})</p>
                  <p><strong>Facility:</strong> {bookingDoctor.hospital}</p>
                  <p><strong>Time Slot:</strong> Today at {bookedSlot}</p>
                  <p><strong>Link:</strong> Encrypted Telehealth Portal Sent via SMS</p>
                </div>
                <button
                  onClick={() => {
                    setBookingDoctor(null);
                    setBookingSuccess(false);
                  }}
                  className="w-full stitch-btn-indigo text-sm py-2.5"
                >
                  Close Receipt
                </button>
              </div>
            ) : (
              <form onSubmit={handleConfirmBooking} className="space-y-4">
                <div className="border-b border-slate-100 pb-3">
                  <h3 className="text-lg font-bold text-stitch-indigo">Confirm Doctor Booking</h3>
                  <p className="text-xs text-stitch-muted">{bookingDoctor.name} • {bookingDoctor.specialty}</p>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Patient Name</label>
                  <input
                    type="text"
                    value={patientNameInput}
                    onChange={(e) => setPatientNameInput(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm font-semibold outline-none focus:ring-2 focus:ring-stitch-teal"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Select Consultation Slot</label>
                  <div className="grid grid-cols-3 gap-2">
                    {['10:30 AM', '11:30 AM', '02:30 PM', '04:00 PM'].map((slot) => (
                      <button
                        key={slot}
                        type="button"
                        onClick={() => setBookedSlot(slot)}
                        className={`py-2 text-xs font-extrabold rounded-lg border transition-all ${
                          bookedSlot === slot
                            ? 'bg-stitch-teal text-white border-stitch-teal'
                            : 'bg-slate-50 border-slate-200 text-slate-800 hover:bg-slate-100'
                        }`}
                      >
                        {slot}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="pt-2 flex items-center justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setBookingDoctor(null)}
                    className="px-4 py-2 border border-slate-300 rounded-xl text-xs font-bold text-slate-700 hover:bg-slate-100"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="stitch-btn-primary text-xs py-2 px-5"
                  >
                    Confirm Booking
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
