/**
 * Check all customers to see which ones have the new fields
 */

const mongoose = require('mongoose');
const config = require('../config/config');
const Customer = require('../models/Customer');

const analyzeCustomers = async () => {
    try {
        await mongoose.connect(config.DB_URL);
        console.log('✅ Connected to MongoDB');

        const customers = await Customer.find().sort({ createdAt: -1 });
        
        console.log('\n📊 Customer Analysis:');
        console.log('====================');
        
        let withNewFields = 0;
        let withoutNewFields = 0;
        
        customers.forEach((customer, index) => {
            const hasNewFields = customer.gender !== undefined || 
                                customer.maritalStatus !== undefined || 
                                customer.occupation !== undefined || 
                                customer.employer !== undefined || 
                                customer.monthlyIncome !== undefined || 
                                customer.dependents !== undefined;
            
            const hasCompleteNewFields = customer.gender !== undefined && 
                                       customer.maritalStatus !== undefined && 
                                       customer.occupation !== undefined && 
                                       customer.employer !== undefined && 
                                       customer.monthlyIncome !== undefined && 
                                       customer.dependents !== undefined;
            
            if (hasCompleteNewFields) {
                withNewFields++;
                console.log(`\n✅ ${customer.firstName} ${customer.lastName} (${customer.createdAt.toISOString()})`);
                console.log(`   🎯 Has all new fields`);
                if (customer.occupation) console.log(`   💼 Occupation: ${customer.occupation}`);
                if (customer.employer) console.log(`   🏢 Employer: ${customer.employer}`);
                if (customer.monthlyIncome > 0) console.log(`   💰 Income: ${customer.monthlyIncome}`);
            } else {
                withoutNewFields++;
                console.log(`\n❌ ${customer.firstName} ${customer.lastName} (${customer.createdAt.toISOString()})`);
                console.log(`   📋 Missing or incomplete new fields`);
                if (!customer.gender) console.log(`   - Missing gender`);
                if (!customer.maritalStatus) console.log(`   - Missing maritalStatus`);
                if (!customer.occupation) console.log(`   - Missing occupation`);
                if (!customer.employer) console.log(`   - Missing employer`);
                if (customer.monthlyIncome === undefined) console.log(`   - Missing monthlyIncome`);
                if (customer.dependents === undefined) console.log(`   - Missing dependents`);
            }
        });
        
        console.log(`\n📈 Summary:`);
        console.log(`   ✅ Customers with complete new fields: ${withNewFields}`);
        console.log(`   ❌ Customers missing new fields: ${withoutNewFields}`);
        console.log(`   📊 Total customers: ${customers.length}`);

        await mongoose.connection.close();
        
    } catch (error) {
        console.error('❌ Analysis failed:', error);
        process.exit(1);
    }
};

analyzeCustomers()
    .then(() => {
        console.log('\n🎉 Analysis completed!');
        process.exit(0);
    })
    .catch((error) => {
        console.error('💥 Analysis failed:', error);
        process.exit(1);
    });