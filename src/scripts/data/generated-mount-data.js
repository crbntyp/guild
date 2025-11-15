// Generated Mount Data Loader
// Loads mount data from the pre-generated JSON file

let mountsData = null;

/**
 * Load and cache the generated mount data
 */
async function loadMountData() {
  if (mountsData) {
    return mountsData;
  }

  try {
    const response = await fetch('data/mounts-generated.json');
    if (!response.ok) {
      throw new Error(`Failed to load mount data: ${response.status}`);
    }
    mountsData = await response.json();
    console.log(`✅ Loaded ${mountsData.totalMounts} mounts from generated data (v${mountsData.version})`);
    return mountsData;
  } catch (error) {
    console.error('Error loading generated mount data:', error);
    throw error;
  }
}

/**
 * Get mount data by ID
 * @param {number} mountId - The mount ID
 * @returns {Object|null} Mount data or null if not found
 */
export async function getMountData(mountId) {
  const data = await loadMountData();
  return data.mounts[mountId] || null;
}

/**
 * Get all mount data
 * @returns {Object} All mount data keyed by ID
 */
export async function getAllMountData() {
  const data = await loadMountData();
  return data.mounts;
}

/**
 * Get mount image URL
 * @param {string} imageUrl - The image URL from API
 * @returns {string} Image URL or placeholder
 */
export function getMountImageUrl(imageUrl) {
  if (!imageUrl) {
    return 'https://wow.zamimg.com/images/wow/icons/large/inv_misc_questionmark.jpg';
  }
  return imageUrl;
}

/**
 * Get generation metadata
 * @returns {Object} Metadata about the generated data
 */
export async function getMetadata() {
  const data = await loadMountData();
  return {
    generatedAt: data.generatedAt,
    version: data.version,
    totalMounts: data.totalMounts
  };
}

export default {
  getMountData,
  getAllMountData,
  getMountImageUrl,
  getMetadata
};
