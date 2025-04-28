import { Wine, UserPreferences, WineRecommendation } from './types';

/**
 * Generates wine recommendations based on user preferences
 * @param wines List of available wines
 * @param preferences User food and price preferences
 * @returns Sorted list of wine recommendations with match scores
 */
export function getWineRecommendations(
  wines: Wine[],
  preferences: UserPreferences
): WineRecommendation[] {
  if (!wines || wines.length === 0) {
    return [];
  }

  // If no preferences set, just return wines sorted by score
  if (!preferences.pairingType && !preferences.maxPrice && !preferences.preferredStyle) {
    return wines.map(wine => ({
      wine,
      matchScore: wine.score || 85,
      reasons: ['Based on overall quality score']
    })).sort((a, b) => b.matchScore - a.matchScore);
  }

  // Process each wine to calculate match score
  const recommendations: WineRecommendation[] = wines.map(wine => {
    let matchScore = 70; // Base score
    const reasons: string[] = [];

    // Process price preferences
    if (preferences.maxPrice && wine.estimatedPrice) {
      const priceMatch = isPriceWithinRange(wine.estimatedPrice, preferences.maxPrice);
      if (priceMatch.isWithinRange) {
        matchScore += 10;
        reasons.push(`Price is within your budget (${wine.estimatedPrice})`);
      } else if (priceMatch.isClose) {
        matchScore += 5;
        reasons.push(`Price is slightly above your budget (${wine.estimatedPrice})`);
      } else {
        matchScore -= 20;
        reasons.push(`Price exceeds your budget (${wine.estimatedPrice})`);
      }
    }

    // Process food pairing preferences
    if (preferences.pairingType && wine.pairings && wine.pairings.length > 0) {
      const pairingMatch = matchesFoodPairing(wine.pairings, preferences.pairingType);
      if (pairingMatch.matches) {
        matchScore += 15;
        reasons.push(`Great match for ${preferences.pairingType} dishes`);
        if (pairingMatch.specificDish) {
          reasons.push(`Specifically pairs well with: ${pairingMatch.specificDish}`);
        }
      }
    }

    // Process wine style preferences (red, white, etc.)
    if (preferences.preferredStyle && wine.varietal) {
      const styleMatch = matchesWineStyle(wine, preferences.preferredStyle);
      if (styleMatch) {
        matchScore += 10;
        reasons.push(`Matches your preferred ${preferences.preferredStyle} wine style`);
      }
    }

    // Incorporate wine's quality score
    if (wine.score) {
      matchScore = Math.round((matchScore * 0.7) + (wine.score * 0.3));
      
      if (wine.score > 90) {
        reasons.push(`Highly rated wine (${wine.score} points)`);
      }
    }

    // Value ratio consideration
    if (wine.valueRatio && wine.valueRatio > 7) {
      matchScore += 5;
      reasons.push('Excellent value for the price');
    }

    // Ensure score stays within 0-100 range
    matchScore = Math.max(0, Math.min(100, matchScore));

    return {
      wine,
      matchScore,
      reasons
    };
  });

  // Sort by match score, highest first
  return recommendations.sort((a, b) => b.matchScore - a.matchScore);
}

/**
 * Extracts price value from a price range string and checks if it's within user's max budget
 */
function isPriceWithinRange(
  priceString: string, 
  maxPrice: number
): { isWithinRange: boolean; isClose: boolean } {
  // Extract the highest price from a range (e.g. "$15 - $25" → 25)
  const matches = priceString.match(/\$(\d+)/g);
  if (!matches || matches.length === 0) {
    return { isWithinRange: true, isClose: false }; // Can't determine, assume within budget
  }

  const prices = matches.map(m => parseInt(m.replace('$', ''), 10));
  const highestPrice = Math.max(...prices);
  
  return {
    isWithinRange: highestPrice <= maxPrice,
    isClose: highestPrice > maxPrice && highestPrice <= maxPrice * 1.25 // Within 25% of budget
  };
}

/**
 * Check if wine pairings match the user's food preference
 */
function matchesFoodPairing(
  pairings: string[], 
  foodType: string
): { matches: boolean; specificDish?: string } {
  const foodTerms: Record<string, string[]> = {
    'meat': ['beef', 'steak', 'lamb', 'pork', 'veal', 'meat', 'duck', 'chicken', 'turkey', 'venison', 'game', 'barbecue', 'bbq', 'grilled'],
    'fish': ['fish', 'seafood', 'salmon', 'tuna', 'shellfish', 'shrimp', 'prawn', 'lobster', 'crab', 'oyster', 'mussel', 'scallop', 'halibut', 'cod', 'sea bass'],
    'cheese': ['cheese', 'brie', 'camembert', 'cheddar', 'gouda', 'blue cheese', 'goat cheese', 'parmesan', 'manchego', 'gruyere'],
    'dessert': ['dessert', 'chocolate', 'cake', 'fruit tart', 'pastry', 'ice cream', 'sweet', 'candy'],
    'vegetarian': ['vegetable', 'vegetarian', 'salad', 'mushroom', 'eggplant', 'aubergine', 'broccoli', 'asparagus', 'tofu', 'lentil', 'bean', 'greens']
  };

  const terms = foodTerms[foodType] || [];
  let specificDish: string | undefined;

  // Check if any pairing contains terms related to the food type
  const matches = pairings.some(pairing => {
    const lowerPairing = pairing.toLowerCase();
    return terms.some(term => {
      if (lowerPairing.includes(term)) {
        specificDish = pairing;
        return true;
      }
      return false;
    });
  });

  return { matches, specificDish };
}

/**
 * Check if wine matches the preferred style (red, white, etc.)
 */
function matchesWineStyle(wine: Wine, style: string): boolean {
  // Check varietal, type, or description for style indicators
  const redGrapes = ['cabernet', 'merlot', 'syrah', 'shiraz', 'pinot noir', 'malbec', 'tempranillo', 'sangiovese', 'nebbiolo', 'grenache'];
  const whiteGrapes = ['chardonnay', 'sauvignon blanc', 'riesling', 'pinot grigio', 'pinot gris', 'gewurztraminer', 'viognier', 'semillon', 'chenin blanc', 'albariño'];
  const roseIndicators = ['rosé', 'rose wine', 'pink wine'];
  const sparklingIndicators = ['sparkling', 'champagne', 'prosecco', 'cava', 'spumante', 'bubbles'];

  const varietal = (wine.varietal || wine.grapeVariety || '').toLowerCase();
  const name = (wine.name || '').toLowerCase();
  const region = (wine.region || '').toLowerCase();
  
  switch (style) {
    case 'red':
      return redGrapes.some(grape => varietal.includes(grape)) || 
             (wine.type || '').toLowerCase().includes('red');
    case 'white':
      return whiteGrapes.some(grape => varietal.includes(grape)) || 
             (wine.type || '').toLowerCase().includes('white');
    case 'rose':
      return roseIndicators.some(indicator => 
        name.includes(indicator) || varietal.includes(indicator) || 
        (wine.type || '').toLowerCase().includes(indicator)
      );
    case 'sparkling':
      return sparklingIndicators.some(indicator => 
        name.includes(indicator) || varietal.includes(indicator) || 
        region.includes('champagne') ||
        (wine.type || '').toLowerCase().includes(indicator)
      );
    default:
      return false;
  }
}