/**
 * Simple test to create a customer directly using the Customer model
 * This will help us verify if the schema and database are working correctly
 */

const mongoose = require('mongoose');
const config = require('../config/config');
const Customer = require('../models/Customer');

const testDirectCustomerCreation = async () => {
    try {
        // Connect to database
        await mongoose.connect(config.DB_URL);
        console.log('✅ Connected to MongoDB for direct customer test');

        // Create test customer with all fields
        const testCustomer = new Customer({
            firstName: "Direct",
            lastName: "Test",
            email: "directtest@gmail.com",
            phone: "0771111111",
            NIC_no: "199999999999",
            dateOfBirth: new Date("1999-01-01"),
            address: {
                street: "Direct Test Street",
                city: "Test City",
                province: "Test Province"
            },
            gender: "Female",
            maritalStatus: "Married", 
            occupation: "Tester",
            employer: "Test Company",
            monthlyIncome: 50000,
            dependents: 1,
            centerId: "68b6e18dfe67de1cbff108dc", // Using existing center
            branchId: "68b6e18cfe67de1cbff108ca"  // Using existing branch
        });

        console.log('\n🧪 Creating customer directly with model...');
        const savedCustomer = await testCustomer.save();
        
        console.log('✅ Customer created successfully!');
        console.log('📋 Created customer data:');
        console.log(JSON.stringify(savedCustomer.toObject(), null, 2));

        // Verify by fetching the customer back
        const fetchedCustomer = await Customer.findById(savedCustomer._id);
        console.log('\n🔍 Verification - fetched customer:');
        console.log(`   👫 Gender: ${fetchedCustomer.gender}`);
        console.log(`   💍 Marital Status: ${fetchedCustomer.maritalStatus}`);
        console.log(`   💼 Occupation: ${fetchedCustomer.occupation}`);
        console.log(`   🏢 Employer: ${fetchedCustomer.employer}`);
        console.log(`   💰 Monthly Income: ${fetchedCustomer.monthlyIncome}`);
        console.log(`   👶 Dependents: ${fetchedCustomer.dependents}`);

        await mongoose.connection.close();
        console.log('\n🔒 Database connection closed');
        
    } catch (error) {
        console.error('❌ Direct test failed:', error);
        process.exit(1);
    }
};

// Run test
testDirectCustomerCreation()
    .then(() => {
        console.log('\n🎉 Direct customer creation test completed successfully!');
        process.exit(0);
    })
    .catch((error) => {
        console.error('💥 Test failed:', error);
        process.exit(1);
    });