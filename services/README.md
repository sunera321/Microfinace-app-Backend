# Microfinance App Backend - Service Layer

## Overview
The service layer has been added to improve code organization, reusability, and maintainability. Services contain the business logic and interact with the database models, while controllers handle HTTP requests/responses.

## Service Layer Architecture

### Benefits of Service Layer:
1. **Separation of Concerns**: Business logic separated from HTTP handling
2. **Reusability**: Services can be used by multiple controllers or other services
3. **Testability**: Easier to unit test business logic
4. **Maintainability**: Changes to business logic only affect services
5. **Consistency**: Standardized error handling and validation

## Available Services

### 1. UserService (`services/userService.js`)
Handles user management and authentication:
- `createUserProfile(userData)` - Create user profile by admin
- `validateEmailForSignup(email)` - Validate email for signup
- `completeUserSignup(email, firebaseUid)` - Complete user signup
- `getAllUsers()` - Get all users
- `getUserById(userId)` - Get user by ID
- `updateUser(userId, updateData)` - Update user
- `deleteUser(userId)` - Delete user

### 2. CustomerService (`services/customerService.js`)
Manages customer operations:
- `createCustomer(customerData)` - Create new customer
- `getAllCustomers()` - Get all customers with populated data
- `getCustomerById(customerId)` - Get customer by ID
- `updateCustomer(customerId, updateData)` - Update customer
- `deleteCustomer(customerId)` - Delete customer
- `getCustomersByCenter(centerId)` - Get customers by center
- `searchCustomers(searchTerm)` - Search customers
- `getCustomerStatistics()` - Get customer statistics

### 3. LoanService (`services/loanService.js`)
Handles loan operations and calculations:
- `createLoan(loanData, files)` - Create new loan with documents
- `getAllLoans()` - Get all loans with populated data
- `getLoanById(loanId)` - Get loan by ID
- `updateLoan(loanId, updateData)` - Update loan
- `deleteLoan(loanId)` - Delete loan
- `getLoansByCustomer(customerId)` - Get customer loans
- `getActiveLoans()` - Get active loans
- `getOverdueLoans()` - Get overdue loans
- `calculateArrearsAmount(loan, product)` - Calculate arrears
- `updateAllLoanArrears()` - Update arrears for all loans
- `getLoanStatistics()` - Get loan statistics

### 4. ProductService (`services/productService.js`)
Manages loan products:
- `createProduct(productData)` - Create new product
- `getAllProducts(filters)` - Get all products with filters
- `getProductById(productId)` - Get product by ID
- `updateProduct(productId, updateData)` - Update product
- `deleteProduct(productId)` - Delete product
- `getProductsByType(type)` - Get products by type
- `calculateLoanDetails(productId, loanAmount)` - Calculate loan details
- `validateProductData(productData)` - Validate product data

### 5. BranchService (`services/branchService.js`)
Handles branch operations:
- `createBranch(branchData)` - Create new branch
- `getAllBranches(filters)` - Get all branches
- `getBranchById(branchId)` - Get branch by ID
- `updateBranch(branchId, updateData)` - Update branch
- `deleteBranch(branchId)` - Delete branch
- `getActiveBranches()` - Get active branches
- `getBranchStatistics()` - Get branch statistics
- `getBranchWithDetails(branchId)` - Get branch with related data

### 6. CenterService (`services/centerService.js`)
Manages center operations:
- `createCenter(centerData)` - Create new center
- `getAllCenters(filters)` - Get all centers
- `getCenterById(centerId)` - Get center by ID
- `updateCenter(centerId, updateData)` - Update center
- `deleteCenter(centerId)` - Delete center
- `getCentersByBranch(branchId)` - Get centers by branch
- `getCenterWithDetails(centerId)` - Get center with statistics
- `getCenterPerformance(centerId, dateRange)` - Get performance data

### 7. ReportsService (`services/reportsService.js`)
Generates various reports:
- `getOverviewReport()` - Get overview dashboard data
- `getLoanReport(filters)` - Get detailed loan report
- `getCollectionReport(filters)` - Get collection report
- `getPortfolioAnalysis()` - Get portfolio analysis
- `getAllReports(filters)` - Get all reports combined
- `getCustomerPerformanceReport(filters)` - Get customer performance
- `exportToCSV(reportType, data)` - Export reports to CSV

### 8. HolidayService (`services/holidayService.js`)
Manages holidays and business days:
- `createHoliday(holidayData)` - Create new holiday
- `getAllHolidays(filters)` - Get holidays with filters
- `getHolidaysByCenter(centerId)` - Get holidays by center
- `updateHoliday(holidayId, updateData)` - Update holiday
- `deleteHoliday(holidayId)` - Delete holiday (soft delete)
- `getHolidaysInRange(centerId, productId, startDate, endDate)` - Get holidays in range
- `countHolidaysInRange()` - Count holidays in date range
- `isHoliday(date, centerId, productId)` - Check if date is holiday
- `getBusinessDaysBetween()` - Calculate business days

### 9. InterestCalculationService (`services/interestCalculationService.js`)
Handles complex interest calculations (existing service):
- `calculateInterestWithHolidays()` - Calculate interest considering holidays
- Various interest calculation methods

## How to Use Services

### In Controllers:
```javascript
const { UserService } = require('../services');

exports.createUser = async (req, res) => {
    try {
        const user = await UserService.createUserProfile(req.body);
        res.status(201).json(user);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};
```

### Service-to-Service Communication:
```javascript
// In LoanService
const CustomerService = require('./customerService');

static async createLoan(loanData) {
    const customer = await CustomerService.getCustomerById(loanData.customerId);
    // Continue with loan creation...
}
```

## Error Handling Pattern
All services use consistent error handling:
- Throw descriptive error messages
- Controllers catch and handle HTTP responses
- Business validation in services
- Database validation in models

## Best Practices

1. **Keep Controllers Thin**: Controllers should only handle HTTP concerns
2. **Business Logic in Services**: All business rules go in services
3. **Service Independence**: Services shouldn't depend heavily on each other
4. **Error Propagation**: Let services throw errors, handle in controllers
5. **Transaction Support**: Use database transactions for multi-step operations

## Migration Guide

### Before (Controller with direct model access):
```javascript
exports.createCustomer = async (req, res) => {
    try {
        const customer = new Customer(req.body);
        const savedCustomer = await customer.save();
        res.status(201).json(savedCustomer);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};
```

### After (Controller using service):
```javascript
const { CustomerService } = require('../services');

exports.createCustomer = async (req, res) => {
    try {
        const customer = await CustomerService.createCustomer(req.body);
        res.status(201).json(customer);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};
```

## Testing Services
Services can be easily unit tested:
```javascript
const { UserService } = require('../services');

describe('UserService', () => {
    test('should create user profile', async () => {
        const userData = { name: 'Test', email: 'test@example.com' };
        const user = await UserService.createUserProfile(userData);
        expect(user.name).toBe('Test');
    });
});
```

## Next Steps
1. Update remaining controllers to use services
2. Add comprehensive error handling
3. Implement logging in services
4. Add unit tests for services
5. Consider adding caching layer
