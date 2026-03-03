import React, { useState } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  DollarSign,
  TrendingUp,
  CheckCircle,
  Clock,
  XCircle,
  Download,
  Search,
  Calendar,
  User,
  Plane,
  Package,
  AlertCircle
} from "lucide-react";
import { format } from "date-fns";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";

export default function TransactionOverview({ matches = [], users = [] }) {
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [paymentFilter, setPaymentFilter] = useState("all");

  // Calculate financial metrics
  const totalMatches = matches.length;
  const paidMatches = matches.filter(m => m.match_fee_paid);
  const unpaidMatches = matches.filter(m => !m.match_fee_paid && m.status !== 'cancelled');
  const totalRevenue = paidMatches.length * 5;
  const pendingRevenue = unpaidMatches.length * 5;
  const totalRefunds = matches.reduce((sum, m) => sum + (m.refund_amount || 0), 0);
  const totalPenalties = matches.reduce((sum, m) => sum + (m.penalty_amount || 0), 0);
  const netRevenue = totalRevenue - totalRefunds;

  // Filter matches
  const filteredMatches = matches.filter(match => {
    const statusMatch = statusFilter === "all" || match.status === statusFilter;
    const paymentMatch = paymentFilter === "all" || 
      (paymentFilter === "paid" && match.match_fee_paid) ||
      (paymentFilter === "unpaid" && !match.match_fee_paid);
    
    const searchMatch = !searchQuery ||
      match.traveler_email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      match.requester_email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      match.id?.toLowerCase().includes(searchQuery.toLowerCase());

    return statusMatch && paymentMatch && searchMatch;
  }).sort((a, b) => new Date(b.created_date) - new Date(a.created_date));

  const getUserName = (email) => {
    const user = users.find(u => u.email === email);
    return user?.full_name || email;
  };

  const exportTransactions = () => {
    const data = filteredMatches.map(m => ({
      ID: m.id,
      Traveler: m.traveler_email,
      Requester: m.requester_email,
      Status: m.status,
      "Match Fee": m.match_fee_paid ? "Paid" : "Unpaid",
      "Fee Amount": `$${m.platform_fee || 5}`,
      "Agreed Price": m.agreed_price ? `$${m.agreed_price}` : "N/A",
      "Refund": m.refund_amount ? `$${m.refund_amount}` : "$0",
      "Penalty": m.penalty_amount ? `$${m.penalty_amount}` : "$0",
      Created: format(new Date(m.created_date), "yyyy-MM-dd HH:mm")
    }));

    const headers = Object.keys(data[0] || {});
    const csv = [
      headers.join(","),
      ...data.map(row => headers.map(h => `"${row[h]}"`).join(","))
    ].join("\n");

    const blob = new Blob([csv], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `transactions_${format(new Date(), "yyyy-MM-dd")}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      {/* Financial Summary */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-5 gap-4">
        <Card className="p-6 bg-gradient-to-br from-green-500/10 to-emerald-500/10 border-green-500/30">
          <div className="flex items-center gap-2 mb-2">
            <DollarSign className="w-5 h-5 text-green-400" />
            <span className="text-sm text-gray-400">Total Revenue</span>
          </div>
          <div className="text-3xl font-bold text-white">${totalRevenue}</div>
          <div className="text-xs text-gray-400 mt-1">{paidMatches.length} paid matches</div>
        </Card>

        <Card className="p-6 bg-gradient-to-br from-yellow-500/10 to-orange-500/10 border-yellow-500/30">
          <div className="flex items-center gap-2 mb-2">
            <Clock className="w-5 h-5 text-yellow-400" />
            <span className="text-sm text-gray-400">Pending</span>
          </div>
          <div className="text-3xl font-bold text-white">${pendingRevenue}</div>
          <div className="text-xs text-gray-400 mt-1">{unpaidMatches.length} unpaid matches</div>
        </Card>

        <Card className="p-6 bg-gradient-to-br from-blue-500/10 to-indigo-500/10 border-blue-500/30">
          <div className="flex items-center gap-2 mb-2">
            <TrendingUp className="w-5 h-5 text-blue-400" />
            <span className="text-sm text-gray-400">Net Revenue</span>
          </div>
          <div className="text-3xl font-bold text-white">${netRevenue}</div>
          <div className="text-xs text-gray-400 mt-1">After refunds</div>
        </Card>

        <Card className="p-6 bg-gradient-to-br from-red-500/10 to-pink-500/10 border-red-500/30">
          <div className="flex items-center gap-2 mb-2">
            <XCircle className="w-5 h-5 text-red-400" />
            <span className="text-sm text-gray-400">Refunds</span>
          </div>
          <div className="text-3xl font-bold text-white">${totalRefunds}</div>
          <div className="text-xs text-gray-400 mt-1">Total refunded</div>
        </Card>

        <Card className="p-6 bg-gradient-to-br from-orange-500/10 to-red-500/10 border-orange-500/30">
          <div className="flex items-center gap-2 mb-2">
            <AlertCircle className="w-5 h-5 text-orange-400" />
            <span className="text-sm text-gray-400">Penalties</span>
          </div>
          <div className="text-3xl font-bold text-white">${totalPenalties}</div>
          <div className="text-xs text-gray-400 mt-1">Total penalties</div>
        </Card>
      </div>

      {/* Filters */}
      <Card className="p-6 bg-white/5 border-white/10">
        <div className="grid sm:grid-cols-4 gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <Input
              placeholder="Search by ID or email..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 bg-white/5 border-white/10 text-white placeholder:text-gray-500"
            />
          </div>

          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="bg-white/5 border-white/10 text-white">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="confirmed">Confirmed</SelectItem>
              <SelectItem value="in_transit">In Transit</SelectItem>
              <SelectItem value="delivered">Delivered</SelectItem>
              <SelectItem value="cancelled">Cancelled</SelectItem>
            </SelectContent>
          </Select>

          <Select value={paymentFilter} onValueChange={setPaymentFilter}>
            <SelectTrigger className="bg-white/5 border-white/10 text-white">
              <SelectValue placeholder="Payment" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Payments</SelectItem>
              <SelectItem value="paid">Paid</SelectItem>
              <SelectItem value="unpaid">Unpaid</SelectItem>
            </SelectContent>
          </Select>

          <Button
            onClick={exportTransactions}
            variant="outline"
            className="border-white/10 text-gray-300 hover:text-white"
          >
            <Download className="w-4 h-4 mr-2" />
            Export
          </Button>
        </div>
      </Card>

      {/* Transactions List */}
      <Card className="p-6 bg-white/5 border-white/10">
        <h3 className="text-xl font-semibold text-white mb-4">
          Transactions ({filteredMatches.length})
        </h3>

        {filteredMatches.length === 0 ? (
          <div className="text-center py-12">
            <DollarSign className="w-16 h-16 mx-auto mb-4 text-gray-500" />
            <p className="text-gray-400">No transactions found</p>
          </div>
        ) : (
          <div className="space-y-3">
            {filteredMatches.map((match, index) => (
              <motion.div
                key={match.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.02 }}
              >
                <Card className={`p-5 border transition-all hover:bg-white/5 ${
                  match.match_fee_paid
                    ? 'bg-green-500/5 border-green-500/20'
                    : 'bg-white/5 border-white/10'
                }`}>
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <div className="flex items-center gap-2 mb-2">
                        <span className="text-xs font-mono text-gray-500">#{match.id.slice(0, 8)}</span>
                        <Badge className={
                          match.status === 'delivered' ? 'bg-green-500/20 text-green-400' :
                          match.status === 'in_transit' ? 'bg-blue-500/20 text-blue-400' :
                          match.status === 'confirmed' ? 'bg-purple-500/20 text-purple-400' :
                          match.status === 'cancelled' ? 'bg-red-500/20 text-red-400' :
                          'bg-yellow-500/20 text-yellow-400'
                        }>
                          {match.status.replace('_', ' ')}
                        </Badge>
                        {match.match_fee_paid ? (
                          <Badge className="bg-green-500/20 text-green-400 border-green-500/30">
                            <CheckCircle className="w-3 h-3 mr-1" />
                            Paid
                          </Badge>
                        ) : (
                          <Badge className="bg-red-500/20 text-red-400 border-red-500/30">
                            <Clock className="w-3 h-3 mr-1" />
                            Unpaid
                          </Badge>
                        )}
                      </div>

                      <div className="grid sm:grid-cols-2 gap-4 mb-3">
                        <div className="flex items-center gap-2">
                          <Plane className="w-4 h-4 text-blue-400" />
                          <div>
                            <div className="text-xs text-gray-400">Traveler</div>
                            <Link
                              to={createPageUrl("UserProfile", `email=${match.traveler_email}`)}
                              className="text-sm text-white hover:text-blue-400"
                            >
                              {getUserName(match.traveler_email)}
                            </Link>
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          <Package className="w-4 h-4 text-purple-400" />
                          <div>
                            <div className="text-xs text-gray-400">Requester</div>
                            <Link
                              to={createPageUrl("UserProfile", `email=${match.requester_email}`)}
                              className="text-sm text-white hover:text-purple-400"
                            >
                              {getUserName(match.requester_email)}
                            </Link>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-4 text-xs text-gray-400">
                        <span className="flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          {format(new Date(match.created_date), "MMM d, yyyy")}
                        </span>
                        <span>Initiated by: {getUserName(match.initiated_by)}</span>
                      </div>
                    </div>

                    <div className="text-right">
                      <div className="text-sm text-gray-400 mb-1">Platform Fee</div>
                      <div className="text-2xl font-bold text-white">${match.platform_fee || 5}</div>
                      
                      {match.agreed_price && (
                        <div className="text-sm text-gray-400 mt-2">
                          Total: ${match.agreed_price}
                        </div>
                      )}

                      {match.refund_amount > 0 && (
                        <div className="text-sm text-red-400 mt-2">
                          Refunded: -${match.refund_amount}
                        </div>
                      )}

                      {match.penalty_amount > 0 && (
                        <div className="text-sm text-orange-400 mt-2">
                          Penalty: ${match.penalty_amount}
                        </div>
                      )}
                    </div>
                  </div>

                  {match.notes && (
                    <div className="mt-3 p-3 rounded-lg bg-white/5 border border-white/10">
                      <p className="text-xs text-gray-400">Notes: {match.notes}</p>
                    </div>
                  )}
                </Card>
              </motion.div>
            ))}
          </div>
        )}
      </Card>

      {/* Payment Status Breakdown */}
      <div className="grid sm:grid-cols-3 gap-4">
        <Card className="p-4 bg-white/5 border-white/10">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-gray-400">Paid Matches</span>
            <CheckCircle className="w-5 h-5 text-green-400" />
          </div>
          <div className="text-2xl font-bold text-white">{paidMatches.length}</div>
          <div className="text-xs text-gray-400">Revenue: ${totalRevenue}</div>
        </Card>

        <Card className="p-4 bg-white/5 border-white/10">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-gray-400">Unpaid Matches</span>
            <Clock className="w-5 h-5 text-yellow-400" />
          </div>
          <div className="text-2xl font-bold text-white">{unpaidMatches.length}</div>
          <div className="text-xs text-gray-400">Pending: ${pendingRevenue}</div>
        </Card>

        <Card className="p-4 bg-white/5 border-white/10">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-gray-400">Cancelled</span>
            <XCircle className="w-5 h-5 text-red-400" />
          </div>
          <div className="text-2xl font-bold text-white">
            {matches.filter(m => m.status === 'cancelled').length}
          </div>
          <div className="text-xs text-gray-400">No revenue</div>
        </Card>
      </div>
    </div>
  );
}