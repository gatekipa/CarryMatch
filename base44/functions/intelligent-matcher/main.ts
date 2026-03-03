import { createClientFromRequest } from 'npm:@base44/sdk@0.8.4';

/**
 * AI-Enhanced Intelligent Matching Algorithm v2
 * Proactively finds and notifies users of highly relevant matches
 * NEW: Delivery ratings, preferred routes, availability, preferred travelers, delivery types
 * Considers: routes, airports, dates, preferences, languages, ratings, delivery history
 */

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    
    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { newItemType, newItemId } = await req.json();

    if (!newItemType || !newItemId) {
      return Response.json({ error: 'Missing required parameters' }, { status: 400 });
    }

    // Fetch the new item
    let newItem;
    if (newItemType === 'trip') {
      const trips = await base44.asServiceRole.entities.Trip.filter({ id: newItemId });
      newItem = trips[0];
    } else {
      const requests = await base44.asServiceRole.entities.ShipmentRequest.filter({ id: newItemId });
      newItem = requests[0];
    }

    if (!newItem) {
      return Response.json({ error: 'Item not found' }, { status: 404 });
    }

    // Get all users and their reviews for complete profile data
    const allUsers = await base44.asServiceRole.entities.User.list();
    const allReviews = await base44.asServiceRole.entities.Review.list();
    const creatorEmail = newItem.created_by || newItem.traveler_email || newItem.requester_email;
    const newItemCreator = allUsers.find(u => u.email === creatorEmail);

    // Get all active saved searches for the opposite type
    const searchType = newItemType === 'trip' ? 'request' : 'trip';
    const savedSearches = await base44.asServiceRole.entities.SavedSearch.filter({
      search_type: searchType,
      is_active: true,
      notify_on_match: true
    });

    const matches = [];
    const notificationsSent = [];

    // PASS 1: Match against SavedSearches (existing behavior)
    for (const search of savedSearches) {
      // Skip if it's the creator's own search
      const creatorEmail = newItem.created_by || newItem.traveler_email || newItem.requester_email;
      if (search.user_email === creatorEmail) continue;

      // Get the searcher's full profile for enhanced matching
      const searcherProfile = allUsers.find(u => u.email === search.user_email);
      if (!searcherProfile) continue;

      // Check preferred travelers filter
      if (newItemType === 'request' && newItem.preferred_traveler_emails?.length > 0) {
        // If this search is from a non-preferred traveler, skip (unless match score is exceptional)
        const isPreferredTraveler = newItem.preferred_traveler_emails.includes(search.user_email);
        if (!isPreferredTraveler) {
          // Continue to calculate score but with stricter threshold
        }
      }

      // Calculate comprehensive match score with AI-enhanced criteria
      const matchScore = await calculateEnhancedMatchScore(
        newItem, 
        search, 
        newItemType, 
        newItemCreator,
        searcherProfile,
        allReviews
      );

      // Apply preferred traveler bonus
      if (newItemType === 'request' && newItem.preferred_traveler_emails?.includes(search.user_email)) {
        matchScore.totalScore = Math.min(matchScore.totalScore + 10, 100);
        matchScore.breakdown.highlights.unshift('⭐ Preferred traveler');
      }

      // Only notify if match score is above threshold (70%)
      if (matchScore.totalScore >= 70) {
        matches.push({
          searchId: search.id,
          userEmail: search.user_email,
          score: matchScore.totalScore,
          breakdown: matchScore.breakdown
        });

        // Create rich notification with match reasoning
        const matchQualityEmoji = matchScore.totalScore >= 90 ? '🎯' :
                                  matchScore.totalScore >= 80 ? '⭐' : '✨';
        
        const notification = await base44.asServiceRole.entities.Notification.create({
          user_email: search.user_email,
          type: 'match_found',
          title: `${matchQualityEmoji} ${matchScore.breakdown.quality} Match Found!`,
          message: createMatchNotificationMessage(newItem, matchScore, newItemType, newItemCreator),
          link_url: `/${newItemType === 'trip' ? 'TripDetails' : 'RequestDetails'}?id=${newItemId}`,
          priority: matchScore.totalScore >= 85 ? 'high' : 'normal',
          related_id: newItemId,
          related_entity_type: newItemType
        });

        notificationsSent.push(notification);
      }
    }

    // PASS 2: Direct matching against active items of opposite type
    const directNotified = new Set(notificationsSent.map(n => n.user_email));
    
    if (newItemType === 'trip') {
      // New trip posted — find matching active shipment requests
      const activeRequests = await base44.asServiceRole.entities.ShipmentRequest.filter({ status: 'active' });
      for (const req of activeRequests.slice(0, 50)) {
        const reqOwner = req.created_by || req.requester_email;
        if (reqOwner === creatorEmail || directNotified.has(reqOwner)) continue;
        
        const routeMatch = (
          (newItem.from_city?.toLowerCase() === req.from_city?.toLowerCase() &&
           newItem.to_city?.toLowerCase() === req.to_city?.toLowerCase()) ||
          (newItem.from_iata && req.from_iata &&
           newItem.from_iata.toUpperCase() === req.from_iata.toUpperCase() &&
           newItem.to_iata?.toUpperCase() === req.to_iata?.toUpperCase())
        );
        if (!routeMatch) continue;
        if (req.estimated_weight_kg > (newItem.available_weight_kg || 0)) continue;
        
        // Timing check: does the trip depart in time for the request?
        if (req.needed_by_date && newItem.departure_date) {
          const needed = new Date(req.needed_by_date);
          const departs = new Date(newItem.departure_date);
          const daysLate = Math.round((departs - needed) / (1000 * 60 * 60 * 24));
          
          if (req.urgency === 'high' && daysLate > 0) continue;
          if (req.urgency === 'medium' && daysLate > 5) continue;
          if (!newItem.flexible_dates && daysLate > 10) continue;
        }
        
        await base44.asServiceRole.entities.Notification.create({
          user_email: reqOwner,
          type: 'match_found',
          title: '✨ New Carrier on Your Route!',
          message: `A traveler is heading ${newItem.from_city} → ${newItem.to_city} with ${newItem.available_weight_kg}kg available.`,
          link_url: `/TripDetails?id=${newItemId}`,
          priority: 'normal',
          related_id: newItemId,
          related_entity_type: 'trip'
        });
        directNotified.add(reqOwner);
        matches.push({ userEmail: reqOwner, score: 70, breakdown: { quality: 'Route Match' } });
      }
    } else {
      // New request posted — find matching active trips  
      const activeTrips = await base44.asServiceRole.entities.Trip.filter({ status: 'active' });
      for (const trip of activeTrips.slice(0, 50)) {
        const tripOwner = trip.created_by || trip.traveler_email;
        // Skip bus trips (have operator_id) and own trips
        if (trip.operator_id || tripOwner === creatorEmail || directNotified.has(tripOwner)) continue;
        
        const routeMatch = (
          (newItem.from_city?.toLowerCase() === trip.from_city?.toLowerCase() &&
           newItem.to_city?.toLowerCase() === trip.to_city?.toLowerCase()) ||
          (newItem.from_iata && trip.from_iata &&
           newItem.from_iata.toUpperCase() === trip.from_iata.toUpperCase() &&
           newItem.to_iata?.toUpperCase() === trip.to_iata?.toUpperCase())
        );
        if (!routeMatch) continue;
        if ((newItem.estimated_weight_kg || 0) > (trip.available_weight_kg || 0)) continue;

        // Timing check based on urgency
        if (newItem.needed_by_date && trip.departure_date) {
          const needed = new Date(newItem.needed_by_date);
          const departs = new Date(trip.departure_date);
          const daysLate = Math.round((departs - needed) / (1000 * 60 * 60 * 24));
          
          if (newItem.urgency === 'high' && daysLate > 0) continue; // Must depart on or before
          if (newItem.urgency === 'medium' && daysLate > 5) continue; // Within 5 days
          // urgency === 'low' or no urgency: match regardless (flexible timing)
          // Also honor trip's flexible_dates flag
          if (!trip.flexible_dates && daysLate > 10) continue;
        }

        await base44.asServiceRole.entities.Notification.create({
          user_email: tripOwner,
          type: 'match_found',
          title: '✨ Someone Needs a Carrier on Your Route!',
          message: `A sender needs to ship ${newItem.estimated_weight_kg}kg from ${newItem.from_city} → ${newItem.to_city}.`,
          link_url: `/RequestDetails?id=${newItemId}`,
          priority: 'normal',
          related_id: newItemId,
          related_entity_type: 'request'
        });
        directNotified.add(tripOwner);
        matches.push({ userEmail: tripOwner, score: 70, breakdown: { quality: 'Route Match' } });
      }
    }

    return Response.json({
      success: true,
      matchesFound: matches.length,
      notificationsSent: notificationsSent.length,
      topMatches: matches.slice(0, 5).map(m => ({
        score: m.score,
        quality: m.breakdown.quality
      }))
    });

  } catch (error) {
    console.error('Matching error:', error);
    return Response.json({ 
      error: error.message,
      stack: error.stack 
    }, { status: 500 });
  }
});

/**
 * Create detailed match notification message
 */
function createMatchNotificationMessage(item, matchScore, itemType, creator) {
  const route = `${item.from_city} → ${item.to_city}`;
  const highlights = matchScore.breakdown.highlights.slice(0, 3).join(' • ');
  const userInfo = creator ? `${creator.is_verified ? '✓' : ''} ${creator.average_rating ? `${creator.average_rating.toFixed(1)}⭐` : ''}` : '';
  
  return `${matchScore.totalScore}% match: ${route}. ${highlights}${userInfo ? ` | ${userInfo}` : ''}`;
}

/**
 * Calculate comprehensive AI-enhanced match score v2
 */
async function calculateEnhancedMatchScore(newItem, search, newItemType, creator, searcher, allReviews) {
  const scores = {
    route: 0,           // 25 points (reduced)
    timing: 0,          // 15 points (reduced)
    capacity: 0,        // 12 points (reduced)
    userReliability: 0, // 12 points (reduced)
    pricing: 0,         // 8 points (reduced)
    preferences: 0,     // 8 points
    languages: 0,       // 5 points
    deliveryRating: 0,  // 10 points (NEW)
    routeExperience: 0, // 5 points (NEW)
    deliveryType: 0     // 5 points (NEW)
  };

  const highlights = [];
  let quality = 'Good';

  // 1. ROUTE MATCHING (30 points)
  const routeScore = calculateRouteScore(newItem, search);
  scores.route = routeScore.score;
  if (routeScore.exact) {
    highlights.push('Exact route');
    quality = 'Excellent';
  } else if (routeScore.nearby) {
    highlights.push('Nearby airports');
  }

  // 2. TIMING (20 points)
  const timingScore = calculateTimingScore(newItem, search, newItemType);
  scores.timing = timingScore.score;
  if (timingScore.perfect) {
    highlights.push('Perfect timing');
  }

  // 3. CAPACITY/WEIGHT (15 points)
  const capacityScore = calculateCapacityScore(newItem, search, newItemType);
  scores.capacity = capacityScore.score;
  if (capacityScore.ideal) {
    highlights.push('Ideal capacity');
  }

  // 4. USER RELIABILITY (15 points)
  const reliabilityScore = calculateReliabilityScore(creator);
  scores.userReliability = reliabilityScore.score;
  if (reliabilityScore.verified) {
    highlights.push('Verified user');
  }
  if (reliabilityScore.highRating) {
    highlights.push(`${creator.average_rating.toFixed(1)}⭐ rated`);
  }

  // 5. PRICING (10 points)
  const pricingScore = calculatePricingScore(newItem, search, newItemType);
  scores.pricing = pricingScore.score;
  if (pricingScore.withinBudget) {
    highlights.push('Within budget');
  }

  // 6. TRAVEL PREFERENCES COMPATIBILITY (10 points) - NEW
  const preferencesScore = calculatePreferencesMatch(creator, searcher);
  scores.preferences = preferencesScore.score;
  if (preferencesScore.hasMatches) {
    highlights.push(preferencesScore.highlight);
  }

  // 7. LANGUAGE COMPATIBILITY (5 points)
  const languagesScore = calculateLanguageMatch(creator, searcher);
  scores.languages = languagesScore.score;
  if (languagesScore.commonLanguage) {
    highlights.push(`Speaks ${languagesScore.commonLanguage}`);
  }

  // 8. DELIVERY RATING HISTORY (10 points) - NEW
  const deliveryRatingScore = calculateDeliveryRatingScore(creator, allReviews);
  scores.deliveryRating = deliveryRatingScore.score;
  if (deliveryRatingScore.excellent) {
    highlights.push(`${deliveryRatingScore.avgRating}⭐ delivery rating`);
  }

  // 9. ROUTE EXPERIENCE (5 points) - NEW
  const routeExpScore = calculateRouteExperienceScore(newItem, creator);
  scores.routeExperience = routeExpScore.score;
  if (routeExpScore.frequentRoute) {
    highlights.push('Frequent route');
  }

  // 10. DELIVERY TYPE COMPATIBILITY (5 points) - NEW
  const deliveryTypeScore = calculateDeliveryTypeMatch(newItem, search, newItemType);
  scores.deliveryType = deliveryTypeScore.score;
  if (deliveryTypeScore.perfectMatch) {
    highlights.push(deliveryTypeScore.matchType);
  }

  const totalScore = Math.round(
    scores.route + scores.timing + scores.capacity + 
    scores.userReliability + scores.pricing + scores.preferences + 
    scores.languages + scores.deliveryRating + scores.routeExperience + scores.deliveryType
  );

  // Determine quality based on total score
  if (totalScore >= 90) quality = 'Perfect';
  else if (totalScore >= 85) quality = 'Excellent';
  else if (totalScore >= 75) quality = 'Very Good';
  else if (totalScore >= 70) quality = 'Good';

  return {
    totalScore,
    breakdown: {
      quality,
      scores,
      highlights
    }
  };
}

/**
 * NEW: Calculate travel preferences compatibility
 */
function calculatePreferencesMatch(creator, searcher) {
  let score = 0;
  let hasMatches = false;
  let highlight = '';

  if (!creator || !searcher) return { score: 5, hasMatches, highlight }; // Default neutral

  const creatorPrefs = creator.travel_preferences || [];
  const searcherPrefs = searcher.travel_preferences || [];

  if (creatorPrefs.length === 0 || searcherPrefs.length === 0) {
    return { score: 5, hasMatches, highlight }; // Neutral if no preferences set
  }

  // Find matching preferences
  const matches = creatorPrefs.filter(pref => searcherPrefs.includes(pref));

  if (matches.length > 0) {
    hasMatches = true;
    
    // Award points based on number of matches
    if (matches.length >= 3) {
      score = 10;
      highlight = `${matches.length} shared preferences`;
    } else if (matches.length === 2) {
      score = 7;
      highlight = '2 shared preferences';
    } else {
      score = 5;
      highlight = 'Shared preference';
    }

    // Bonus for important compatibility matches
    const importantMatches = matches.filter(m => 
      m.includes('Flexible') || 
      m.includes('Budget') || 
      m.includes('Business') ||
      m.includes('Frequent')
    );

    if (importantMatches.length > 0) {
      score = Math.min(score + 2, 10);
    }
  } else {
    // Small penalty for conflicting preferences
    const conflicts = [
      ['Budget conscious', 'Premium service preferred'],
      ['Early morning traveler', 'Late night traveler'],
      ['Business traveler', 'Leisure traveler']
    ];

    let hasConflict = false;
    for (const [pref1, pref2] of conflicts) {
      if ((creatorPrefs.includes(pref1) && searcherPrefs.includes(pref2)) ||
          (creatorPrefs.includes(pref2) && searcherPrefs.includes(pref1))) {
        hasConflict = true;
        break;
      }
    }

    score = hasConflict ? 2 : 5; // Slight penalty for conflicts, neutral otherwise
  }

  return { score, hasMatches, highlight };
}

/**
 * NEW: Calculate language compatibility
 */
function calculateLanguageMatch(creator, searcher) {
  let score = 0;
  let commonLanguage = '';

  if (!creator || !searcher) return { score: 2, commonLanguage }; // Default minimal

  const creatorLangs = creator.languages_spoken || [];
  const searcherLangs = searcher.languages_spoken || [];

  if (creatorLangs.length === 0 || searcherLangs.length === 0) {
    return { score: 2, commonLanguage }; // Minimal score if languages not specified
  }

  // Find common languages
  const commonLanguages = creatorLangs.filter(lang => 
    searcherLangs.some(sLang => sLang.toLowerCase() === lang.toLowerCase())
  );

  if (commonLanguages.length > 0) {
    commonLanguage = commonLanguages[0]; // Use first common language
    
    // Award points based on number of common languages
    if (commonLanguages.length >= 3) {
      score = 5; // Maximum
    } else if (commonLanguages.length === 2) {
      score = 4;
    } else {
      score = 3;
    }

    // Bonus if English is a common language (lingua franca)
    if (commonLanguages.some(l => l.toLowerCase() === 'english')) {
      score = Math.min(score + 1, 5);
    }
  } else {
    score = 1; // Minimal score for no common language
  }

  return { score, commonLanguage };
}

/**
 * Route compatibility scoring with nearby airports
 */
function calculateRouteScore(item, search) {
  let score = 0;
  let exact = false;
  let nearby = false;

  // Check IATA codes (exact match)
  if (item.from_iata && search.from_iata && item.to_iata && search.to_iata) {
    const fromMatch = item.from_iata.toUpperCase() === search.from_iata.toUpperCase();
    const toMatch = item.to_iata.toUpperCase() === search.to_iata.toUpperCase();
    
    if (fromMatch && toMatch) {
      score = 30;
      exact = true;
      return { score, exact, nearby };
    }
  }

  // Check city match
  if (item.from_city && search.from_city && item.to_city && search.to_city) {
    const fromMatch = item.from_city.toLowerCase() === search.from_city.toLowerCase();
    const toMatch = item.to_city.toLowerCase() === search.to_city.toLowerCase();
    
    if (fromMatch && toMatch) {
      score = 28;
      return { score, exact, nearby };
    }
  }

  // Check nearby cities (fuzzy match)
  const fromSimilar = checkCitySimilarity(item.from_city, search.from_city);
  const toSimilar = checkCitySimilarity(item.to_city, search.to_city);
  
  if (fromSimilar && toSimilar) {
    score = 22;
    nearby = true;
    return { score, exact, nearby };
  }

  // Country match
  if (item.from_country && search.from_country && item.to_country && search.to_country) {
    const fromMatch = item.from_country.toLowerCase() === search.from_country.toLowerCase();
    const toMatch = item.to_country.toLowerCase() === search.to_country.toLowerCase();
    
    if (fromMatch && toMatch) {
      score = 15;
      return { score, exact, nearby };
    }
  }

  return { score, exact, nearby };
}

/**
 * Check if cities are similar
 */
function checkCitySimilarity(city1, city2) {
  if (!city1 || !city2) return false;
  
  const c1 = city1.toLowerCase();
  const c2 = city2.toLowerCase();
  
  if (c1 === c2) return true;
  if (c1.includes(c2) || c2.includes(c1)) return true;
  
  const variations = {
    'new york': ['nyc', 'new york city', 'manhattan'],
    'los angeles': ['la', 'los angeles'],
    'san francisco': ['sf', 'san fran'],
    'washington': ['dc', 'washington dc'],
    'london': ['greater london'],
  };
  
  for (const [main, alts] of Object.entries(variations)) {
    if ((c1 === main || alts.includes(c1)) && (c2 === main || alts.includes(c2))) {
      return true;
    }
  }
  
  return false;
}

/**
 * Timing compatibility scoring
 */
function calculateTimingScore(item, search, itemType) {
  let score = 0;
  let perfect = false;

  // Get relevant dates
  const itemDate = item.departure_date ? new Date(item.departure_date) : null;
  const searchDate = search.needed_by_date || search.departure_date;
  const searchDateObj = searchDate ? new Date(searchDate) : null;

  if (!itemDate || !searchDateObj) {
    // No dates to compare — neutral score
    return { score: 8, perfect: false };
  }

  const diffDays = Math.abs(Math.round((itemDate - searchDateObj) / (1000 * 60 * 60 * 24)));

  if (itemType === 'trip') {
    // Trip departs, request needs by: trip should depart before needed_by
    const daysBeforeNeeded = Math.round((searchDateObj - itemDate) / (1000 * 60 * 60 * 24));
    if (daysBeforeNeeded >= 0 && daysBeforeNeeded <= 2) {
      score = 20;
      perfect = true;
    } else if (daysBeforeNeeded >= 0 && daysBeforeNeeded <= 5) {
      score = 15;
    } else if (daysBeforeNeeded >= 0 && daysBeforeNeeded <= 10) {
      score = 10;
    } else if (daysBeforeNeeded > 10) {
      score = 5;
    } else {
      // Trip departs after needed_by — poor timing
      score = Math.max(0, 10 - Math.abs(daysBeforeNeeded));
    }
  } else {
    // Request item — compare dates
    if (diffDays === 0) {
      score = 20;
      perfect = true;
    } else if (diffDays <= 3) {
      score = 15;
    } else if (diffDays <= 7) {
      score = 10;
    } else {
      score = Math.max(0, 8 - diffDays);
    }
  }

  // Flexible dates bonus
  if (item.date_flexible || item.flexible_dates) {
    score = Math.min(score + 3, 20);
  }
  if (search.date_flexibility_days > 0) {
    score = Math.min(score + 2, 20);
  }

  return { score, perfect };
}

/**
 * Capacity/weight compatibility scoring
 */
function calculateCapacityScore(item, search, itemType) {
  let score = 0;
  let ideal = false;

  if (itemType === 'trip') {
    const availableWeight = item.available_weight_kg || 0;
    const requiredWeight = search.min_weight_kg || 0;
    
    if (requiredWeight === 0) {
      score = 10;
    } else if (availableWeight >= requiredWeight) {
      const ratio = requiredWeight / availableWeight;
      if (ratio >= 0.7) {
        score = 15;
        ideal = true;
      } else if (ratio >= 0.4) {
        score = 12;
      } else {
        score = 8;
      }
    }
  } else {
    score = 12;
    ideal = true;
  }

  return { score, ideal };
}

/**
 * User reliability scoring
 */
function calculateReliabilityScore(creator) {
  let score = 0;
  let verified = false;
  let highRating = false;

  if (!creator) return { score: 5, verified, highRating };

  if (creator.is_verified) {
    score += 6;
    verified = true;
  }

  if (creator.average_rating) {
    if (creator.average_rating >= 4.5) {
      score += 5;
      highRating = true;
    } else if (creator.average_rating >= 4.0) {
      score += 4;
    } else if (creator.average_rating >= 3.5) {
      score += 3;
    }
  }

  if (creator.trust_score) {
    if (creator.trust_score >= 75) {
      score += 4;
    } else if (creator.trust_score >= 50) {
      score += 2;
    }
  }

  return { score: Math.min(score, 15), verified, highRating };
}

/**
 * Pricing compatibility scoring
 */
function calculatePricingScore(item, search, itemType) {
  let score = 0;
  let withinBudget = false;

  if (itemType === 'trip') {
    const pricePerKg = item.price_per_kg || 0;
    const maxPrice = search.max_price_per_kg || Infinity;
    
    if (pricePerKg <= maxPrice) {
      score = 10;
      withinBudget = true;
    } else if (pricePerKg <= maxPrice * 1.1) {
      score = 7;
    } else if (pricePerKg <= maxPrice * 1.25) {
      score = 4;
    }
  } else {
    score = 8;
    withinBudget = true;
  }

  return { score, withinBudget };
}

/**
 * NEW: Calculate delivery rating score based on past delivery reviews
 */
function calculateDeliveryRatingScore(creator, allReviews) {
  let score = 5; // Default neutral
  let excellent = false;
  let avgRating = 0;

  if (!creator || !allReviews) return { score, excellent, avgRating };

  // Get reviews where this user was reviewed as a traveler/carrier
  const deliveryReviews = allReviews.filter(r => 
    r.reviewee_email === creator.email && 
    r.review_type === 'traveler' &&
    r.is_verified
  );

  if (deliveryReviews.length === 0) {
    return { score, excellent, avgRating }; // Neutral for no reviews
  }

  // Calculate average delivery rating
  avgRating = deliveryReviews.reduce((sum, r) => sum + r.rating, 0) / deliveryReviews.length;

  // Award points based on delivery rating
  if (avgRating >= 4.8) {
    score = 10;
    excellent = true;
  } else if (avgRating >= 4.5) {
    score = 9;
    excellent = true;
  } else if (avgRating >= 4.0) {
    score = 7;
  } else if (avgRating >= 3.5) {
    score = 5;
  } else {
    score = 2; // Low rating penalty
  }

  // Bonus for volume of successful deliveries
  if (deliveryReviews.length >= 10) {
    score = Math.min(score + 2, 10);
  } else if (deliveryReviews.length >= 5) {
    score = Math.min(score + 1, 10);
  }

  return { score, excellent, avgRating: avgRating.toFixed(1) };
}

/**
 * NEW: Calculate route experience score
 */
function calculateRouteExperienceScore(item, creator) {
  let score = 2; // Default minimal
  let frequentRoute = false;

  if (!creator || !creator.preferred_routes) return { score, frequentRoute };

  const itemRoute = `${item.from_iata}-${item.to_iata}`;
  const reverseRoute = `${item.to_iata}-${item.from_iata}`;

  // Check if this route is in traveler's preferred routes
  const isPreferred = creator.preferred_routes.some(route => 
    route === itemRoute || route === reverseRoute
  );

  if (isPreferred) {
    score = 5;
    frequentRoute = true;
  } else {
    // Check city-level matches
    const itemCityRoute = `${item.from_city}-${item.to_city}`.toLowerCase();
    const hasRelatedRoute = creator.preferred_routes.some(route => 
      route.toLowerCase().includes(item.from_city?.toLowerCase()) || 
      route.toLowerCase().includes(item.to_city?.toLowerCase())
    );
    
    if (hasRelatedRoute) {
      score = 3;
    }
  }

  return { score, frequentRoute };
}

/**
 * NEW: Calculate delivery type compatibility
 */
function calculateDeliveryTypeMatch(item, search, itemType) {
  let score = 3; // Default neutral
  let perfectMatch = false;
  let matchType = '';

  // For trip items, check if delivery services match request needs
  if (itemType === 'trip') {
    const requestDeliveryType = search.delivery_type || 'airport-to-airport';
    const tripDeliveryServices = item.delivery_services || ['airport-to-airport'];

    if (tripDeliveryServices.includes(requestDeliveryType)) {
      score = 5;
      perfectMatch = true;
      
      if (requestDeliveryType === 'door-to-door') {
        matchType = 'Door-to-door available';
      } else if (requestDeliveryType !== 'airport-to-airport') {
        matchType = 'Flexible delivery';
      }
    } else if (requestDeliveryType === 'airport-to-airport') {
      // Airport-to-airport is always acceptable as fallback
      score = 4;
    } else {
      score = 2; // Delivery type mismatch
    }
  } else {
    // For request items
    const itemDeliveryType = item.delivery_type || 'airport-to-airport';
    
    if (itemDeliveryType === 'airport-to-airport') {
      score = 4; // Standard, most flexible
    } else if (itemDeliveryType === 'door-to-door') {
      score = 3; // More demanding, slight penalty
      matchType = 'Door-to-door needed';
    } else {
      score = 3; // Partial door service
    }
  }

  return { score, perfectMatch, matchType };
}