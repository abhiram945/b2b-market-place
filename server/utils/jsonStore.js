import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const configPath = path.join(__dirname, '../data/config.json');

export const getConfig = async () => {
  try {
    const data = await fs.readFile(configPath, 'utf8');
    return JSON.parse(data);
  } catch (error) {
    console.error('Error reading config:', error);
    return {
      brands: [],
      categories: [],
      locations: [],
      conditions: ["New", "Used", "Refurbished"],
      companyNames: [],
      maintenanceMode: false
    };
  }
};

export const updateConfig = async (newConfig) => {
  try {
    const currentConfig = await getConfig();
    const updatedConfig = { ...currentConfig, ...newConfig };
    await fs.writeFile(configPath, JSON.stringify(updatedConfig, null, 2));
    return updatedConfig;
  } catch (error) {
    console.error('Error updating config:', error);
    throw error;
  }
};

export const addToConfig = async (key, value) => {
  if (!value) return;
  try {
    const config = await getConfig();
    const normalizedValue = value.toLowerCase().trim();
    if (!config[key].map(v => v.toLowerCase()).includes(normalizedValue)) {
      config[key].push(value.trim());
      await updateConfig(config);
    }
  } catch (error) {
    console.error(`Error adding to config key ${key}:`, error);
  }
};
