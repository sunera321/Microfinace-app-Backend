/**
 * Migration script to update existing customer documents with new schema fields
 * Run this script to add the new fields to existing customer records
 */

const mongoose = require('mongoose');
const config = require('../config/config');

// Connect to MongoDB
const connectDB = async () => {
    try {
        await mongoose.connect(config.DB_URL);
        console.log('✅ Connected to MongoDB for migration');
    } catch (error) {
        console.error('❌ MongoDB connection error:', error);
        process.exit(1);
    }
};

// Migration function
const migrateCustomerSchema = async () => {
    try {
        console.log('🔄 Starting customer schema migration...');
        
        const Customer = require('../models/Customer');
        
        // Update all existing customer documents to include new fields with default values
        const result = await Customer.updateMany(
            {
                // Find documents that don't have the new fields
                $or: [
                    { gender: { $exists: false } },
                    { maritalStatus: { $exists: false } },
                    { occupation: { $exists: false } },
                    { employer: { $exists: false } },
                    { monthlyIncome: { $exists: false } },
                    { dependents: { $exists: false } }
                ]
            },
            {
                $set: {
                    gender: null,
                    maritalStatus: null,
                    occupation: '',
                    employer: '',
                    monthlyIncome: 0,
                    dependents: 0,
                    updatedAt: new Date()
                }
            }
        );
        
        console.log(`✅ Migration completed successfully!`);
        console.log(`📊 Updated ${result.modifiedCount} customer documents`);
        
        // Verify the migration
        const sampleCustomer = await Customer.findOne().lean();
        console.log('📋 Sample customer after migration:');
        console.log(JSON.stringify(sampleCustomer, null, 2));
        
    } catch (error) {
        console.error('❌ Migration failed:', error);
        throw error;
    }
};

// Run migration
const runMigration = async () => {
    await connectDB();
    await migrateCustomerSchema();
    await mongoose.connection.close();
    console.log('🔒 Database connection closed');
    console.log('✨ Migration process completed!');
};

// Execute if run directly
if (require.main === module) {
    runMigration()
        .then(() => {
            console.log('🎉 All done! Your customer records now have the new fields.');
            process.exit(0);
        })
        .catch((error) => {
            console.error('💥 Migration failed:', error);
            process.exit(1);
        });
}

module.exports = { runMigration, migrateCustomerSchema };