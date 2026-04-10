import AppConfig from '../models/AppConfig.js';

const defaultConfig = {
  brands: [],
  categories: [],
  locations: [],
  conditions: ['new', 'used', 'refurbished'],
  companyNames: [],
  maintenanceMode: false,
  banner: '/uploads/banners/user-dashboard-banner.png',
  heroHeading: '',
  heroSubheading: ''
};

let cachedConfig = null;
let cacheExpiresAt = 0;
let writeChain = Promise.resolve();

const cloneConfig = (config) => JSON.parse(JSON.stringify(config));
const primeCache = (config) => {
  cachedConfig = cloneConfig(config);
  cacheExpiresAt = Date.now() + 5000;
  return cloneConfig(cachedConfig);
};
const enqueueWrite = (writer) => {
  writeChain = writeChain.then(writer).catch((error) => {
    console.error('Error updating config:', error);
    throw error;
  });

  return writeChain;
};

const normalizeValue = (value) => typeof value === 'string' ? value.trim().toLowerCase() : value;
const configFields = ['brands', 'categories', 'locations', 'conditions', 'companyNames', 'maintenanceMode', 'banner', 'heroHeading', 'heroSubheading'];

const ensureConfigDocument = async () => {
  let configDoc = await AppConfig.findOne({ key: 'app' });

  if (!configDoc) {
    configDoc = await AppConfig.create({ ...defaultConfig, key: 'app' });
  }

  return configDoc;
};

export const getConfig = async () => {
  if (cachedConfig && cacheExpiresAt > Date.now()) {
    return cloneConfig(cachedConfig);
  }

  try {
    const configDoc = await ensureConfigDocument();
    return primeCache(configDoc.toObject());
  } catch (error) {
    console.error('Error reading config:', error);
    return primeCache(defaultConfig);
  }
};

export const updateConfig = async (newConfig) => {
  return enqueueWrite(async () => {
    const configDoc = await ensureConfigDocument();

    for (const field of configFields) {
      if (field in newConfig) {
        configDoc[field] = newConfig[field];
      }
    }

    await configDoc.save();
    return primeCache(configDoc.toObject());
  });
};

export const addToConfig = async (key, value) => {
  if (!value) return;
  return enqueueWrite(async () => {
    const configDoc = await ensureConfigDocument();
    const normalizedValue = normalizeValue(value);

    if (!Array.isArray(configDoc[key])) {
      configDoc[key] = [];
    }

    if (!configDoc[key].map(v => v.toLowerCase()).includes(normalizedValue)) {
      configDoc[key].push(normalizedValue);
      await configDoc.save();
    }

    return primeCache(configDoc.toObject());
  });
};
