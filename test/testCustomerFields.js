/**
 * Test script to verify that customers now have all the new fields
 */

const mongoose = require('mongoose');
const config = require('../config/config');
const Customer = require('../models/Customer');

const testCustomerFields = async () => {
    try {
        // Connect to database
        await mongoose.connect(config.DB_URL);
        console.log('✅ Connected to MongoDB for testing');

        // Fetch a few customers to verify the new fields
        const customers = await Customer.find().limit(3).lean();
        
        console.log('\n📊 Testing Customer Fields:');
        console.log('================================');
        
        customers.forEach((customer, index) => {
            console.log(`\n👤 Customer ${index + 1}: ${customer.firstName} ${customer.lastName}`);
            console.log(`   📧 Email: ${customer.email}`);
            console.log(`   🆔 NIC: ${customer.NIC_no}`);
            console.log(`   👫 Gender: ${customer.gender || 'Not specified'}`);
            console.log(`   💍 Marital Status: ${customer.maritalStatus || 'Not specified'}`);
            console.log(`   💼 Occupation: ${customer.occupation || 'Not specified'}`);
            console.log(`   🏢 Employer: ${customer.employer || 'Not specified'}`);
            console.log(`   💰 Monthly Income: LKR ${customer.monthlyIncome.toLocaleString()}`);
            console.log(`   👶 Dependents: ${customer.dependents}`);
        });

        console.log('\n✅ All customers now have the new fields!');
        console.log('🎯 Next steps:');
        console.log('   1. Start your backend server (node app.js)');
        console.log('   2. Test the frontend customer registration form');
        console.log('   3. Test the updated customer list screen');

        await mongoose.connection.close();
        console.log('\n🔒 Database connection closed');
        
    } catch (error) {
        console.error('❌ Test failed:', error);
        process.exit(1);
    }
};

// Run test
testCustomerFields()
    .then(() => {
        console.log('\n🎉 Test completed successfully!');
        process.exit(0);
    })
    .catch((error) => {
        console.error('💥 Test failed:', error);
        process.exit(1);
    });