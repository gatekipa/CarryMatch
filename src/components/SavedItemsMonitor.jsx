
import { base44 } from "@/api/base44Client";
import { createPageUrl } from "@/utils";

// Monitor saved items and send notifications for matches and changes
export const checkSavedItemsForUpdates = async () => {
  try {
    // Get all saved items with notifications enabled
    const savedItems = await base44.entities.SavedItem.filter({
      notify_on_update: true
    });

    for (const savedItem of savedItems) {
      let currentItem;
      let hasChanges = false;
      let changeDescription = [];

      // Fetch the current state of the item
      if (savedItem.item_type === "trip") {
        const trips = await base44.entities.Trip.filter({ id: savedItem.item_id });
        currentItem = trips[0];
      } else {
        const requests = await base44.entities.ShipmentRequest.filter({ id: savedItem.item_id });
        currentItem = requests[0];
      }

      if (!currentItem) continue;

      // Check for price changes
      if (savedItem.last_price) {
        const currentPrice = savedItem.item_type === "trip" 
          ? currentItem.price_per_kg 
          : currentItem.offered_price;
        
        if (currentPrice !== savedItem.last_price) {
          hasChanges = true;
          const priceChange = currentPrice - savedItem.last_price;
          changeDescription.push(
            priceChange > 0 
              ? `Price increased by $${Math.abs(priceChange).toFixed(2)}` 
              : `Price decreased by $${Math.abs(priceChange).toFixed(2)}`
          );
          
          // Update the saved price
          await base44.entities.SavedItem.update(savedItem.id, {
            last_price: currentPrice
          });
        }
      }

      // Check for date changes
      if (savedItem.last_date) {
        const currentDate = savedItem.item_type === "trip"
          ? currentItem.departure_date
          : currentItem.needed_by_date;
        
        if (currentDate !== savedItem.last_date) {
          hasChanges = true;
          changeDescription.push("Date changed");
          
          // Update the saved date
          await base44.entities.SavedItem.update(savedItem.id, {
            last_date: currentDate
          });
        }
      }

      // Send notification if there are changes
      if (hasChanges) {
        const itemTitle = savedItem.item_type === "trip"
          ? `${currentItem.from_city} → ${currentItem.to_city}`
          : currentItem.item_description?.substring(0, 50);

        await base44.entities.Notification.create({
          user_email: savedItem.user_email,
          type: "system",
          title: `Saved ${savedItem.item_type} updated`,
          message: `${itemTitle}: ${changeDescription.join(", ")}`,
          link_url: createPageUrl(
            savedItem.item_type === "trip" ? "TripDetails" : "RequestDetails",
            `id=${savedItem.item_id}`
          ),
          priority: "normal",
          related_id: savedItem.item_id,
          related_entity_type: savedItem.item_type
        });
      }
    }
  } catch (error) {
    console.error("Error checking saved items:", error);
  }
};

// Enhanced check for new matches with fuzzy matching
export const checkForNewMatches = async (newItemType, newItemId) => {
  try {
    const searchType = newItemType === "trip" ? "request" : "trip";
    const savedSearches = await base44.entities.SavedItem.filter({
      item_type: searchType,
      notify_on_update: true
    });

    let newItem;
    if (newItemType === "trip") {
      const trips = await base44.entities.Trip.filter({ id: newItemId });
      newItem = trips[0];
    } else {
      const requests = await base44.entities.ShipmentRequest.filter({ id: newItemId });
      newItem = requests[0];
    }

    if (!newItem) return;

    for (const savedItem of savedSearches) {
      let savedItemData;
      if (searchType === "trip") {
        const trips = await base44.entities.Trip.filter({ id: savedItem.item_id });
        savedItemData = trips[0];
      } else {
        const requests = await base44.entities.ShipmentRequest.filter({ id: savedItem.item_id });
        savedItemData = requests[0];
      }

      if (!savedItemData) continue;

      // Enhanced fuzzy matching logic
      const exactRouteMatch = 
        newItem.from_city?.toLowerCase() === savedItemData.from_city?.toLowerCase() &&
        newItem.to_city?.toLowerCase() === savedItemData.to_city?.toLowerCase();

      const countryMatch = 
        newItem.from_country?.toLowerCase() === savedItemData.from_country?.toLowerCase() &&
        newItem.to_country?.toLowerCase() === savedItemData.to_country?.toLowerCase();

      // Fuzzy city matching (contains)
      const fuzzyCityMatch = 
        (newItem.from_city?.toLowerCase().includes(savedItemData.from_city?.toLowerCase()) ||
         savedItemData.from_city?.toLowerCase().includes(newItem.from_city?.toLowerCase())) &&
        (newItem.to_city?.toLowerCase().includes(savedItemData.to_city?.toLowerCase()) ||
         savedItemData.to_city?.toLowerCase().includes(newItem.to_city?.toLowerCase()));

      const routeMatch = exactRouteMatch || countryMatch || fuzzyCityMatch;

      if (routeMatch) {
        // Weight compatibility check
        let weightMatch = false;
        if (newItemType === "trip") {
          weightMatch = newItem.available_weight_kg >= savedItemData.estimated_weight_kg;
        } else {
          weightMatch = savedItemData.available_weight_kg >= newItem.estimated_weight_kg;
        }

        if (weightMatch) {
          const itemTitle = newItemType === "trip"
            ? `${newItem.from_city} → ${newItem.to_city}`
            : newItem.item_description?.substring(0, 50);

          const matchQuality = exactRouteMatch ? "Perfect" : countryMatch ? "Good" : "Potential";

          await base44.entities.Notification.create({
            user_email: savedItem.user_email,
            type: "match_found",
            title: `🎯 ${matchQuality} match for your saved item!`,
            message: `A new ${newItemType} matches your saved ${searchType}: ${itemTitle}`,
            link_url: createPageUrl(
              newItemType === "trip" ? "TripDetails" : "RequestDetails",
              `id=${newItemId}`
            ),
            priority: exactRouteMatch ? "high" : "normal",
            related_id: newItemId,
            related_entity_type: newItemType
          });
        }
      }
    }
  } catch (error) {
    console.error("Error checking for new matches:", error);
  }
};

export default {
  checkSavedItemsForUpdates,
  checkForNewMatches
};
