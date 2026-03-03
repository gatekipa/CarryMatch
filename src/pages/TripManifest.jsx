import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Printer, Download, FileText, Users, Settings } from "lucide-react";
import { format } from "date-fns";
import { toast } from "sonner";
import jsPDF from "jspdf";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

export default function TripManifest() {
  const urlParams = new URLSearchParams(window.location.search);
  const tripId = urlParams.get("id");
  const driverMode = urlParams.get("driver") === "true";
  
  const [user, setUser] = useState(null);
  const [manifestSettings, setManifestSettings] = useState({
    show_phone: true,
    show_id_number: false,
    show_ticket_code: true,
    show_signature: false,
    show_baggage: false
  });

  useEffect(() => {
    base44.auth.me().then(setUser).catch(() => setUser(null));
  }, []);

  const { data: trip } = useQuery({
    queryKey: ['manifest-trip', tripId],
    queryFn: async () => {
      const trips = await base44.entities.Trip.filter({ id: tripId });
      return trips[0];
    },
    enabled: !!tripId
  });

  const { data: operator } = useQuery({
    queryKey: ['manifest-operator', trip?.operator_id],
    queryFn: async () => {
      const ops = await base44.entities.BusOperator.filter({ id: trip.operator_id });
      const op = ops[0];
      
      // Load saved manifest settings
      if (op.manifest_template_settings_json) {
        setManifestSettings(op.manifest_template_settings_json);
      }
      
      return op;
    },
    enabled: !!trip
  });

  const { data: route } = useQuery({
    queryKey: ['manifest-route', trip?.route_id],
    queryFn: async () => {
      const routes = await base44.entities.BusRoute.filter({ id: trip.route_id });
      return routes[0];
    },
    enabled: !!trip
  });

  const { data: vehicle } = useQuery({
    queryKey: ['manifest-vehicle', trip?.vehicle_id],
    queryFn: async () => {
      const vehicles = await base44.entities.Vehicle.filter({ id: trip.vehicle_id });
      return vehicles[0];
    },
    enabled: !!trip
  });

  const { data: onlineOrders = [] } = useQuery({
    queryKey: ['manifest-online-orders', tripId],
    queryFn: () => base44.entities.Order.filter({
      trip_id: tripId,
      channel: "online",
      order_status: "paid"
    }),
    enabled: !!tripId
  });

  const { data: offlineSales = [] } = useQuery({
    queryKey: ['manifest-offline-sales', tripId],
    queryFn: () => base44.entities.OfflineSale.filter({ trip_id: tripId }),
    enabled: !!tripId
  });

  const { data: branches = [] } = useQuery({
    queryKey: ['manifest-branches', operator?.id],
    queryFn: () => base44.entities.OperatorBranch.filter({ operator_id: operator.id }),
    enabled: !!operator
  });

  const { data: allInventory = [] } = useQuery({
    queryKey: ['manifest-all-inventory', tripId],
    queryFn: () => base44.entities.TripSeatInventory.filter({ trip_id: tripId }),
    enabled: !!tripId
  });

  const { data: onlineSeats = [] } = useQuery({
    queryKey: ['manifest-online-seats', onlineOrders.map(o => o.id)],
    queryFn: async () => {
      if (!onlineOrders.length) return [];
      return await base44.entities.OrderSeat.filter({
        order_id: { $in: onlineOrders.map(o => o.id) },
        trip_id: tripId
      });
    },
    enabled: onlineOrders.length > 0
  });

  const { data: onlineTickets = [] } = useQuery({
    queryKey: ['manifest-online-tickets', onlineOrders.map(o => o.id)],
    queryFn: async () => {
      if (!onlineOrders.length) return [];
      return await base44.entities.Ticket.filter({
        order_id: { $in: onlineOrders.map(o => o.id) }
      });
    },
    enabled: onlineOrders.length > 0
  });

  const saveSettings = async () => {
    try {
      await base44.entities.BusOperator.update(operator.id, {
        manifest_template_settings_json: manifestSettings
      });
      toast.success("Manifest settings saved!");
    } catch (error) {
      toast.error("Failed to save settings");
    }
  };

  const buildPassengerList = () => {
    const passengers = [];

    // Add online passengers (match by trip_id + order_id)
    onlineOrders.forEach(order => {
      const seats = onlineSeats.filter(s => s.order_id === order.id && s.trip_id === tripId);
      if (seats.length === 0) {
        // Fallback: if no OrderSeat records, parse from seat_code on Ticket
        const ticket = onlineTickets.find(t => t.order_id === order.id);
        if (ticket && ticket.seat_code) {
          const seatCodes = ticket.seat_code.split(',');
          seatCodes.forEach(seatCode => {
            passengers.push({
              seat_code: seatCode.trim(),
              passenger_name: order.passenger_name,
              phone: order.passenger_phone,
              id_number: order.passenger_id_optional || "",
              ticket_code: ticket.ticket_code || "",
              channel: "Online",
              checkin_status: ticket.checkin_status || "not_checked_in"
            });
          });
        }
      } else {
        seats.forEach(seat => {
          const ticket = onlineTickets.find(t => t.order_id === order.id);
          passengers.push({
            seat_code: seat.seat_code,
            passenger_name: order.passenger_name,
            phone: order.passenger_phone,
            id_number: order.passenger_id_optional || "",
            ticket_code: ticket?.ticket_code || "",
            channel: "Online",
            checkin_status: ticket?.checkin_status || "not_checked_in"
          });
        });
      }
    });

    // Add offline passengers with branch info
    offlineSales.forEach(sale => {
      const seats = sale.seat_code.split(',');
      seats.forEach(seatCode => {
        const seatInv = allInventory.find(s => s.seat_code === seatCode.trim() && s.trip_id === tripId);
        const branchId = seatInv?.sold_by_branch_id;
        const branch = branchId ? branches.find(b => b.id === branchId) : null;
        
        passengers.push({
          seat_code: seatCode.trim(),
          passenger_name: sale.passenger_name,
          phone: sale.passenger_phone,
          id_number: "",
          ticket_code: sale.receipt_number_optional || sale.id.slice(0, 8),
          channel: branch ? `${branch.branch_name}` : "Counter",
          branch_id: branchId,
          checkin_status: "not_checked_in"
        });
      });
    });

    return passengers.sort((a, b) => a.seat_code.localeCompare(b.seat_code));
  };

  const printManifest = () => {
    window.print();
  };

  const downloadPDF = () => {
    const doc = new jsPDF();
    const passengers = buildPassengerList();

    // Header
    doc.setFontSize(18);
    doc.text(operator.name, 20, 20);
    doc.setFontSize(12);
    doc.text(`Passenger Manifest`, 20, 30);
    doc.setFontSize(10);
    doc.text(`${route.origin_city} → ${route.destination_city}`, 20, 38);
    doc.text(`${format(new Date(trip.departure_datetime), "EEEE, MMMM d, yyyy 'at' h:mm a")}`, 20, 44);
    if (vehicle) {
      doc.text(`Vehicle: ${vehicle.nickname}${vehicle.plate_number ? ' (' + vehicle.plate_number + ')' : ''}`, 20, 50);
    }

    // Table
    let y = 65;
    doc.setFontSize(9);
    doc.text('Seat', 20, y);
    doc.text('Passenger', 40, y);
    if (manifestSettings.show_phone) doc.text('Phone', 100, y);
    if (manifestSettings.show_ticket_code) doc.text('Ticket', 140, y);
    doc.text('Channel', 170, y);

    y += 8;
    passengers.forEach(p => {
      if (y > 280) {
        doc.addPage();
        y = 20;
      }
      doc.text(p.seat_code, 20, y);
      doc.text(p.passenger_name.substring(0, 25), 40, y);
      if (manifestSettings.show_phone) doc.text(p.phone, 100, y);
      if (manifestSettings.show_ticket_code) doc.text(p.ticket_code, 140, y);
      doc.text(p.channel, 170, y);
      y += 7;
    });

    doc.save(`manifest-${tripId}.pdf`);
  };

  const downloadCSV = () => {
    const passengers = buildPassengerList();
    
    let csv = "Seat,Passenger Name";
    if (manifestSettings.show_phone) csv += ",Phone";
    if (manifestSettings.show_id_number) csv += ",ID Number";
    if (manifestSettings.show_ticket_code) csv += ",Ticket Code";
    csv += ",Channel,Check-In Status";
    if (manifestSettings.show_signature) csv += ",Signature";
    if (manifestSettings.show_baggage) csv += ",Baggage Count";
    csv += "\n";

    passengers.forEach(p => {
      csv += `"${p.seat_code}","${p.passenger_name}"`;
      if (manifestSettings.show_phone) csv += `,"${p.phone}"`;
      if (manifestSettings.show_id_number) csv += `,"${p.id_number}"`;
      if (manifestSettings.show_ticket_code) csv += `,"${p.ticket_code}"`;
      csv += `,"${p.channel}","${p.checkin_status}"`;
      if (manifestSettings.show_signature) csv += `,"________________"`;
      if (manifestSettings.show_baggage) csv += `,"____"`;
      csv += "\n";
    });

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `manifest-${tripId}.csv`;
    a.click();
  };

  if (!trip || !operator || !route) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full" />
      </div>
    );
  }

  const passengers = buildPassengerList();

  return (
    <div className="min-h-screen p-4">
      <div className="max-w-6xl mx-auto">
        {/* Print Header - Only visible when printing */}
        <div className="print:block hidden mb-8">
          <div className="flex items-center justify-between mb-6">
            {operator.logo_url && (
              <img src={operator.logo_url} alt={operator.name} className="h-16" />
            )}
            <div className="text-right">
              <div className="text-2xl font-bold">{operator.name}</div>
              <div className="text-sm text-gray-600">{operator.phone}</div>
            </div>
          </div>
          <div className="border-b-2 border-gray-800 pb-4 mb-4">
            <h1 className="text-xl font-bold mb-2">
              {driverMode ? "DRIVER MANIFEST" : "PASSENGER MANIFEST"}
            </h1>
            <div className="grid grid-cols-2 gap-2 text-sm">
              <div><strong>Route:</strong> {route.origin_city} → {route.destination_city}</div>
              <div><strong>Date:</strong> {format(new Date(trip.departure_datetime), "MMM d, yyyy")}</div>
              <div><strong>Departure:</strong> {format(new Date(trip.departure_datetime), "h:mm a")}</div>
              <div><strong>Total Passengers:</strong> {passengers.length}</div>
              {vehicle && (
                <div><strong>Vehicle:</strong> {vehicle.nickname}</div>
              )}
            </div>
          </div>
        </div>

        {/* Screen Header - Hidden when printing */}
        <div className="print:hidden mb-6">
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-3xl font-bold text-white">
              {driverMode ? "Driver Manifest" : "Passenger Manifest"}
            </h1>
            
            <Dialog>
              <DialogTrigger asChild>
                <Button variant="outline" className="border-white/10">
                  <Settings className="w-4 h-4 mr-2" />
                  Settings
                </Button>
              </DialogTrigger>
              <DialogContent className="bg-[#0F1D35] border-white/10">
                <DialogHeader>
                  <DialogTitle className="text-white">Manifest Settings</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <div className="flex items-center gap-3">
                    <Checkbox
                      checked={manifestSettings.show_phone}
                      onCheckedChange={(checked) => setManifestSettings({...manifestSettings, show_phone: checked})}
                    />
                    <Label className="text-gray-300">Show Phone Numbers</Label>
                  </div>
                  <div className="flex items-center gap-3">
                    <Checkbox
                      checked={manifestSettings.show_id_number}
                      onCheckedChange={(checked) => setManifestSettings({...manifestSettings, show_id_number: checked})}
                    />
                    <Label className="text-gray-300">Show ID Numbers</Label>
                  </div>
                  <div className="flex items-center gap-3">
                    <Checkbox
                      checked={manifestSettings.show_ticket_code}
                      onCheckedChange={(checked) => setManifestSettings({...manifestSettings, show_ticket_code: checked})}
                    />
                    <Label className="text-gray-300">Show Ticket Codes</Label>
                  </div>
                  <div className="flex items-center gap-3">
                    <Checkbox
                      checked={manifestSettings.show_signature}
                      onCheckedChange={(checked) => setManifestSettings({...manifestSettings, show_signature: checked})}
                    />
                    <Label className="text-gray-300">Include Signature Column</Label>
                  </div>
                  <div className="flex items-center gap-3">
                    <Checkbox
                      checked={manifestSettings.show_baggage}
                      onCheckedChange={(checked) => setManifestSettings({...manifestSettings, show_baggage: checked})}
                    />
                    <Label className="text-gray-300">Include Baggage Count</Label>
                  </div>
                  <Button onClick={saveSettings} className="w-full bg-blue-500">
                    Save as Default
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>

          <div className="flex gap-3 mb-6">
            <Button onClick={printManifest} className="bg-blue-500">
              <Printer className="w-4 h-4 mr-2" />
              Print
            </Button>
            <Button onClick={downloadPDF} variant="outline" className="border-white/10">
              <Download className="w-4 h-4 mr-2" />
              Download PDF
            </Button>
            <Button onClick={downloadCSV} variant="outline" className="border-white/10">
              <FileText className="w-4 h-4 mr-2" />
              Export CSV
            </Button>
          </div>
        </div>

        {/* Manifest Table */}
        <Card className={`${driverMode ? 'p-4' : 'p-6'} bg-white/5 border-white/10 print:bg-white print:border-gray-300 print:shadow-none`}>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-white/10 print:border-gray-300">
                  <th className="text-left py-3 px-2 text-gray-300 print:text-gray-800 font-semibold">Seat</th>
                  <th className="text-left py-3 px-2 text-gray-300 print:text-gray-800 font-semibold">Passenger</th>
                  {manifestSettings.show_phone && (
                    <th className="text-left py-3 px-2 text-gray-300 print:text-gray-800 font-semibold">Phone</th>
                  )}
                  {manifestSettings.show_id_number && (
                    <th className="text-left py-3 px-2 text-gray-300 print:text-gray-800 font-semibold">ID</th>
                  )}
                  {manifestSettings.show_ticket_code && (
                    <th className="text-left py-3 px-2 text-gray-300 print:text-gray-800 font-semibold">Ticket</th>
                  )}
                  <th className="text-left py-3 px-2 text-gray-300 print:text-gray-800 font-semibold">Channel</th>
                  <th className="text-left py-3 px-2 text-gray-300 print:text-gray-800 font-semibold print:hidden">Status</th>
                  {manifestSettings.show_signature && (
                    <th className="text-left py-3 px-2 text-gray-300 print:text-gray-800 font-semibold hidden print:table-cell">Signature</th>
                  )}
                  {manifestSettings.show_baggage && (
                    <th className="text-left py-3 px-2 text-gray-300 print:text-gray-800 font-semibold hidden print:table-cell">Bags</th>
                  )}
                </tr>
              </thead>
              <tbody>
                {passengers.map((passenger, index) => (
                  <tr key={index} className="border-b border-white/10 print:border-gray-200">
                    <td className="py-3 px-2">
                      <span className="font-bold text-white print:text-gray-900">{passenger.seat_code}</span>
                    </td>
                    <td className="py-3 px-2 text-gray-300 print:text-gray-800">{passenger.passenger_name}</td>
                    {manifestSettings.show_phone && (
                      <td className="py-3 px-2 text-gray-300 print:text-gray-700">{passenger.phone}</td>
                    )}
                    {manifestSettings.show_id_number && (
                      <td className="py-3 px-2 text-gray-300 print:text-gray-700">{passenger.id_number || "-"}</td>
                    )}
                    {manifestSettings.show_ticket_code && (
                      <td className="py-3 px-2 text-gray-400 print:text-gray-600 font-mono text-xs">{passenger.ticket_code}</td>
                    )}
                    <td className="py-3 px-2">
                      <Badge className={
                        passenger.channel === "Online" 
                          ? "bg-blue-500/20 text-blue-400 print:bg-blue-100 print:text-blue-800" 
                          : "bg-green-500/20 text-green-400 print:bg-green-100 print:text-green-800"
                      }>
                        {passenger.channel}
                      </Badge>
                    </td>
                    <td className="py-3 px-2 print:hidden">
                      <Badge className={
                        passenger.checkin_status === "checked_in"
                          ? "bg-green-500/20 text-green-400"
                          : "bg-gray-500/20 text-gray-400"
                      }>
                        {passenger.checkin_status === "checked_in" ? "✓" : "—"}
                      </Badge>
                    </td>
                    {manifestSettings.show_signature && (
                      <td className="py-3 px-2 hidden print:table-cell print:text-gray-700">
                        _______________
                      </td>
                    )}
                    {manifestSettings.show_baggage && (
                      <td className="py-3 px-2 hidden print:table-cell print:text-gray-700">
                        ____
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Summary */}
          <div className="mt-6 pt-6 border-t border-white/10 print:border-gray-300">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm mb-6">
              <div>
                <div className="text-gray-400 print:text-gray-600">Total Passengers</div>
                <div className="text-2xl font-bold text-white print:text-gray-900">{passengers.length}</div>
              </div>
              <div>
                <div className="text-gray-400 print:text-gray-600">Online Bookings</div>
                <div className="text-2xl font-bold text-blue-400 print:text-blue-800">
                  {passengers.filter(p => p.channel === "Online").length}
                </div>
              </div>
              <div>
                <div className="text-gray-400 print:text-gray-600">Counter Sales</div>
                <div className="text-2xl font-bold text-green-400 print:text-green-800">
                  {passengers.filter(p => p.channel !== "Online").length}
                </div>
              </div>
              <div>
                <div className="text-gray-400 print:text-gray-600">Checked In</div>
                <div className="text-2xl font-bold text-purple-400 print:text-purple-800">
                  {passengers.filter(p => p.checkin_status === "checked_in").length}
                </div>
              </div>
            </div>

            {/* Sales by Branch Breakdown */}
            {branches.length > 0 && (
              <div className="border-t border-white/10 print:border-gray-300 pt-4">
                <h4 className="text-sm font-semibold text-gray-400 print:text-gray-700 mb-3">Seats Sold Per Branch:</h4>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  <div className="flex items-center justify-between px-3 py-2 bg-blue-500/10 print:bg-blue-50 rounded-lg">
                    <span className="text-sm text-gray-300 print:text-gray-700">Online:</span>
                    <span className="font-bold text-white print:text-gray-900">
                      {passengers.filter(p => p.channel === "Online").length}
                    </span>
                  </div>
                  {branches.map(branch => {
                    const branchSales = passengers.filter(p => p.branch_id === branch.id).length;
                    if (branchSales === 0) return null;
                    return (
                      <div key={branch.id} className="flex items-center justify-between px-3 py-2 bg-green-500/10 print:bg-green-50 rounded-lg">
                        <span className="text-sm text-gray-300 print:text-gray-700">{branch.branch_name}:</span>
                        <span className="font-bold text-white print:text-gray-900">{branchSales}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </Card>

        {/* Print Footer */}
        <div className="hidden print:block mt-8 text-sm text-gray-600">
          <div className="border-t border-gray-300 pt-4">
            <div className="flex justify-between">
              <div>Generated: {format(new Date(), "MMM d, yyyy 'at' h:mm a")}</div>
              <div>Trip ID: {tripId}</div>
            </div>
          </div>
        </div>
      </div>

      <style>{`
        @media print {
          body { 
            background: white !important;
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
          }
          .print\\:hidden { display: none !important; }
          .print\\:block { display: block !important; }
          .print\\:table-cell { display: table-cell !important; }
          @page { margin: 1cm; }
        }
      `}</style>
    </div>
  );
}