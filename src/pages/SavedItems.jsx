import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Bookmark, 
  Plane, 
  Package, 
  Trash2,
  ArrowRight,
  Calendar,
  DollarSign,
  Weight,
  StickyNote,
  AlertCircle
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { format } from "date-fns";
import { Textarea } from "@/components/ui/textarea";

export default function SavedItems() {
  const [user, setUser] = useState(null);
  const [editingNotes, setEditingNotes] = useState(null);
  const [notesText, setNotesText] = useState("");
  const queryClient = useQueryClient();

  useEffect(() => {
    base44.auth.me().then(setUser).catch(() => setUser(null));
  }, []);

  const { data: savedItems = [], isLoading } = useQuery({
    queryKey: ['saved-items', user?.email],
    queryFn: async () => {
      if (!user) return [];
      return await base44.entities.SavedItem.filter(
        { user_email: user.email },
        "-created_date"
      );
    },
    enabled: !!user
  });

  // Get actual trip/request data for each saved item
  const { data: enrichedItems = [] } = useQuery({
    queryKey: ['enriched-saved-items', savedItems.length],
    queryFn: async () => {
      const enriched = [];
      for (const saved of savedItems) {
        try {
          let actualItem;
          if (saved.item_type === "trip") {
            const trips = await base44.entities.Trip.filter({ id: saved.item_id });
            actualItem = trips[0];
          } else {
            const requests = await base44.entities.ShipmentRequest.filter({ id: saved.item_id });
            actualItem = requests[0];
          }
          
          if (actualItem) {
            // Check for changes
            const hasChanges = {
              priceChanged: saved.last_price && 
                ((saved.item_type === "trip" && actualItem.price_per_kg !== saved.last_price) ||
                 (saved.item_type === "request" && actualItem.offered_price !== saved.last_price)),
              dateChanged: saved.last_date && 
                ((saved.item_type === "trip" && actualItem.departure_date !== saved.last_date) ||
                 (saved.item_type === "request" && actualItem.needed_by_date !== saved.last_date))
            };
            
            enriched.push({
              ...saved,
              actualItem,
              hasChanges
            });
          }
        } catch (error) {
          console.error("Error fetching item:", error);
        }
      }
      return enriched;
    },
    enabled: savedItems.length > 0
  });

  const removeSavedItemMutation = useMutation({
    mutationFn: (itemId) => base44.entities.SavedItem.delete(itemId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['saved-items'] });
      queryClient.invalidateQueries({ queryKey: ['enriched-saved-items'] });
    }
  });

  const updateNotesMutation = useMutation({
    mutationFn: ({ itemId, notes }) => 
      base44.entities.SavedItem.update(itemId, { notes }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['saved-items'] });
      setEditingNotes(null);
      setNotesText("");
    }
  });

  const savedTrips = enrichedItems.filter(item => item.item_type === "trip");
  const savedRequests = enrichedItems.filter(item => item.item_type === "request");

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <Card className="p-12 bg-white/5 border-white/10 text-center backdrop-blur-sm">
          <Bookmark className="w-16 h-16 mx-auto mb-4 text-gray-500" />
          <h3 className="text-2xl font-bold text-white mb-2">Please sign in</h3>
          <p className="text-gray-400 mb-6">Sign in to view your saved items</p>
          <Button onClick={() => base44.auth.redirectToLogin()} className="bg-blue-500 hover:bg-blue-600">
            Sign In
          </Button>
        </Card>
      </div>
    );
  }

  const renderItem = (item) => {
    const isTrip = item.item_type === "trip";
    const data = item.actualItem;
    
    return (
      <Card key={item.id} className="p-6 bg-white/5 border-white/10 hover:bg-white/[0.08] transition-all">
        {/* Changes Alert */}
        {(item.hasChanges.priceChanged || item.hasChanges.dateChanged) && (
          <div className="mb-4 p-3 rounded-lg bg-yellow-500/10 border border-yellow-500/30">
            <div className="flex items-center gap-2 text-yellow-400 text-sm">
              <AlertCircle className="w-4 h-4" />
              <span className="font-medium">
                {item.hasChanges.priceChanged && "Price changed"}
                {item.hasChanges.priceChanged && item.hasChanges.dateChanged && " • "}
                {item.hasChanges.dateChanged && "Date changed"}
              </span>
            </div>
          </div>
        )}

        {/* Route */}
        <div className="flex items-center gap-3 mb-4">
          <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
            isTrip ? 'bg-gradient-to-br from-blue-500 to-blue-600' : 'bg-gradient-to-br from-purple-500 to-pink-600'
          }`}>
            {isTrip ? <Plane className="w-5 h-5 text-white" /> : <Package className="w-5 h-5 text-white" />}
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <span className="font-bold text-white">{data.from_city}</span>
              <ArrowRight className="w-4 h-4 text-gray-500" />
              <span className="font-bold text-white">{data.to_city}</span>
            </div>
            <div className="text-sm text-gray-400">
              {data.from_country} → {data.to_country}
            </div>
          </div>
          <Badge className={`${
            data.status === 'active' ? 'bg-green-500/20 text-green-400' : 'bg-gray-500/20 text-gray-400'
          }`}>
            {data.status}
          </Badge>
        </div>

        {/* Details */}
        <div className="grid sm:grid-cols-3 gap-3 mb-4">
          <div className="flex items-center gap-2 text-sm text-gray-300">
            <Calendar className="w-4 h-4 text-blue-400" />
            <span>
              {(isTrip ? data.departure_date : data.needed_by_date) 
                ? format(new Date(isTrip ? data.departure_date : data.needed_by_date), "MMM d, yyyy")
                : "No date"}
            </span>
          </div>
          <div className="flex items-center gap-2 text-sm text-gray-300">
            <Weight className="w-4 h-4 text-green-400" />
            <span>{isTrip ? data.available_weight_kg : data.estimated_weight_kg} kg</span>
          </div>
          <div className="flex items-center gap-2 text-sm text-gray-300">
            <DollarSign className="w-4 h-4 text-yellow-400" />
            <span className="font-semibold">
              ${isTrip ? `${data.price_per_kg}/kg` : data.offered_price}
            </span>
          </div>
        </div>

        {/* Notes */}
        {editingNotes === item.id ? (
          <div className="mb-4">
            <Textarea
              value={notesText}
              onChange={(e) => setNotesText(e.target.value)}
              placeholder="Add your notes..."
              className="bg-white/5 border-white/10 text-white placeholder:text-gray-500 mb-2"
              rows={3}
            />
            <div className="flex gap-2">
              <Button
                size="sm"
                onClick={() => updateNotesMutation.mutate({ itemId: item.id, notes: notesText })}
                className="bg-blue-500 hover:bg-blue-600"
              >
                Save Note
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => {
                  setEditingNotes(null);
                  setNotesText("");
                }}
                className="border-white/10 text-gray-300"
              >
                Cancel
              </Button>
            </div>
          </div>
        ) : item.notes ? (
          <div 
            className="mb-4 p-3 rounded-lg bg-white/5 cursor-pointer hover:bg-white/10 transition-colors"
            onClick={() => {
              setEditingNotes(item.id);
              setNotesText(item.notes);
            }}
          >
            <div className="flex items-center gap-2 text-xs text-gray-400 mb-1">
              <StickyNote className="w-3 h-3" />
              <span>Your notes (click to edit)</span>
            </div>
            <p className="text-sm text-gray-300">{item.notes}</p>
          </div>
        ) : (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              setEditingNotes(item.id);
              setNotesText("");
            }}
            className="mb-4 text-gray-400 hover:text-white"
          >
            <StickyNote className="w-4 h-4 mr-2" />
            Add notes
          </Button>
        )}

        {/* Actions */}
        <div className="flex gap-2">
          <Link 
            to={createPageUrl(isTrip ? "TripDetails" : "RequestDetails", `id=${data.id}`)}
            className="flex-1"
          >
            <Button className="w-full bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700">
              View Details
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </Link>
          <Button
            variant="outline"
            size="icon"
            onClick={() => removeSavedItemMutation.mutate(item.id)}
            className="border-white/10 text-gray-400 hover:text-red-400 hover:border-red-400"
          >
            <Trash2 className="w-4 h-4" />
          </Button>
        </div>
      </Card>
    );
  };

  return (
    <div className="min-h-screen py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          {/* Header */}
          <div className="text-center mb-12">
            <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <Bookmark className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-4xl font-bold text-white mb-4">Saved Items</h1>
            <p className="text-xl text-gray-400">
              Track trips and requests you're interested in
            </p>
          </div>

          {isLoading ? (
            <div className="grid sm:grid-cols-2 gap-6">
              {[...Array(4)].map((_, i) => (
                <Card key={i} className="p-6 bg-white/5 border-white/10 animate-pulse">
                  <div className="h-6 bg-white/10 rounded mb-3" />
                  <div className="h-4 bg-white/10 rounded" />
                </Card>
              ))}
            </div>
          ) : enrichedItems.length === 0 ? (
            <Card className="p-12 bg-white/5 border-white/10 text-center backdrop-blur-sm">
              <Bookmark className="w-16 h-16 mx-auto mb-4 text-gray-500" />
              <h3 className="text-2xl font-bold text-white mb-2">No saved items yet</h3>
              <p className="text-gray-400 mb-6">
                Start saving trips and requests you're interested in
              </p>
              <div className="flex gap-4 justify-center">
                <Link to={createPageUrl("BrowseTrips")}>
                  <Button className="bg-blue-500 hover:bg-blue-600">
                    <Plane className="w-4 h-4 mr-2" />
                    Browse Trips
                  </Button>
                </Link>
                <Link to={createPageUrl("BrowseRequests")}>
                  <Button variant="outline" className="border-white/10 text-gray-300 hover:text-white">
                    <Package className="w-4 h-4 mr-2" />
                    Browse Requests
                  </Button>
                </Link>
              </div>
            </Card>
          ) : (
            <Tabs defaultValue="all" className="w-full">
              <TabsList className="bg-white/5 border-white/10 mb-6">
                <TabsTrigger value="all">
                  All ({enrichedItems.length})
                </TabsTrigger>
                <TabsTrigger value="trips">
                  <Plane className="w-4 h-4 mr-2" />
                  Trips ({savedTrips.length})
                </TabsTrigger>
                <TabsTrigger value="requests">
                  <Package className="w-4 h-4 mr-2" />
                  Requests ({savedRequests.length})
                </TabsTrigger>
              </TabsList>

              <TabsContent value="all">
                <div className="grid sm:grid-cols-2 gap-6">
                  <AnimatePresence mode="popLayout">
                    {enrichedItems.map((item, index) => (
                      <motion.div
                        key={item.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.9 }}
                        transition={{ delay: index * 0.05 }}
                        layout
                      >
                        {renderItem(item)}
                      </motion.div>
                    ))}
                  </AnimatePresence>
                </div>
              </TabsContent>

              <TabsContent value="trips">
                <div className="grid sm:grid-cols-2 gap-6">
                  {savedTrips.map(renderItem)}
                </div>
              </TabsContent>

              <TabsContent value="requests">
                <div className="grid sm:grid-cols-2 gap-6">
                  {savedRequests.map(renderItem)}
                </div>
              </TabsContent>
            </Tabs>
          )}
        </motion.div>
      </div>
    </div>
  );
}