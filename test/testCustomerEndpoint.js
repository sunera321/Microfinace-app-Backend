/**
 * Test script to check customer creation endpoint with new fields
 */

const testCustomerCreation = async () => {
    const customerData = {
        firstName: "Test",
        lastName: "Customer",
        email: "testcustomer@gmail.com",
        phone: "0771234567",
        NIC_no: "199812345678",
        dateOfBirth: "1998-05-15",
        address: {
            street: "123 Test Street",
            city: "Colombo",
            province: "Western"
        },
        // New fields we want to test
        gender: "Male",
        maritalStatus: "Single",
        occupation: "Software Engineer",
        employer: "Tech Company",
        monthlyIncome: 75000,
        dependents: 2,
        centerId: "68b6e18dfe67de1cbff108dc", // Using existing center ID
        branchId: "68b6e18cfe67de1cbff108ca"  // Using existing branch ID
    };

    try {
        console.log('🧪 Testing customer creation endpoint...');
        console.log('📤 Sending data:', JSON.stringify(customerData, null, 2));

        const response = await fetch('http://localhost:5000/api/customers', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(customerData)
        });

        const result = await response.json();
        
        console.log('\n📥 Response status:', response.status);
        console.log('📥 Response data:', JSON.stringify(result, null, 2));

        if (response.ok) {
            console.log('\n✅ Customer created successfully!');
            
            // Check if new fields are present
            const hasNewFields = result.gender !== undefined && 
                                result.maritalStatus !== undefined && 
                                result.occupation !== undefined && 
                                result.employer !== undefined && 
                                result.monthlyIncome !== undefined && 
                                result.dependents !== undefined;
            
            if (hasNewFields) {
                console.log('✅ All new fields are present in response!');
                console.log(`   👫 Gender: ${result.gender}`);
                console.log(`   💍 Marital Status: ${result.maritalStatus}`);
                console.log(`   💼 Occupation: ${result.occupation}`);
                console.log(`   🏢 Employer: ${result.employer}`);
                console.log(`   💰 Monthly Income: ${result.monthlyIncome}`);
                console.log(`   👶 Dependents: ${result.dependents}`);
            } else {
                console.log('❌ Some new fields are missing from response!');
                console.log('🔍 Missing fields:');
                if (result.gender === undefined) console.log('   - gender');
                if (result.maritalStatus === undefined) console.log('   - maritalStatus');
                if (result.occupation === undefined) console.log('   - occupation');
                if (result.employer === undefined) console.log('   - employer');
                if (result.monthlyIncome === undefined) console.log('   - monthlyIncome');
                if (result.dependents === undefined) console.log('   - dependents');
            }
        } else {
            console.log('❌ Customer creation failed!');
            console.log('Error:', result.message || result.error || 'Unknown error');
        }

    } catch (error) {
        console.error('💥 Test failed:', error.message);
    }
};

// Run the test
testCustomerCreation();