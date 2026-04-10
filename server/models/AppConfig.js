import mongoose from 'mongoose';

const appConfigSchema = new mongoose.Schema(
  {
    key: {
      type: String,
      required: true,
      unique: true,
      default: 'app',
    },
    brands: {
      type: [String],
      default: [],
    },
    categories: {
      type: [String],
      default: [],
    },
    locations: {
      type: [String],
      default: [],
    },
    conditions: {
      type: [String],
      default: ['new', 'used', 'refurbished'],
    },
    companyNames: {
      type: [String],
      default: [],
    },
    maintenanceMode: {
      type: Boolean,
      default: false,
    },
    banner: {
      type: String,
      default: '/uploads/banners/user-dashboard-banner.png',
    },
    heroHeading: {
      type: String,
      default: '',
    },
    heroSubheading: {
      type: String,
      default: '',
    },
  },
  {
    timestamps: true,
  }
);

const AppConfig = mongoose.model('AppConfig', appConfigSchema);

export default AppConfig;
