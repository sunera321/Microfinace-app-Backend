# Product-Based Holiday System

## Overview
The holiday system has been enhanced to support product-specific holidays. This means that holidays can be set for specific loan products (weekly, monthly, daily) and will only affect interest calculations for loans of that product type.

## Key Features

### 1. Product-Specific Holidays
- Holidays are now linked to specific products (loan types)
- Different products can have different holidays
- Interest calculations skip holidays based on the loan's product type

### 2. Enhanced Data Model
The `Holiday` model now includes:
```javascript
{
  name: String,
  date: Date,
  description: String,
  centerId: ObjectId (ref: Center),
  branchId: ObjectId (ref: Branch),
  productId: ObjectId (ref: Product), // NEW FIELD
  createdBy: ObjectId (ref: User),
  isActive: Boolean,
  createdAt: Date,
  updatedAt: Date
}
```

### 3. API Endpoints

#### Holiday Management
- `POST /holidays` - Create holiday (requires productId)
- `GET /holidays` - Get all holidays (with optional productId filter)
- `GET /holidays/center/:centerId` - Get holidays by center (with optional productId filter)
- `GET /holidays/product/:productId` - Get holidays by product
- `GET /holidays/check/:centerId/:productId/:date` - Check if date is holiday for center and product

#### Interest Calculation
- `POST /interest/calculate` - Calculate interest for loan (automatically uses product-based holidays)
- `GET /interest/check-holiday/:centerId/:productId/:date` - Check holiday for interest calculation
- `GET /interest/holidays/:centerId/:productId` - Get holidays for interest calculation

## Usage Examples

### 1. Creating a Product-Specific Holiday
```javascript
// Create holiday for Weekly Loan product
const holidayData = {
  name: "Independence Day",
  date: "2024-02-04",
  description: "Sri Lanka Independence Day",
  centerId: "center123",
  branchId: "branch456",
  productId: "product789", // Weekly Loan product ID
  createdBy: "user123"
};

const response = await fetch('/holidays', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'user-id': 'user123'
  },
  body: JSON.stringify(holidayData)
});
```

### 2. Checking Holidays for Interest Calculation
```javascript
// Check if a date is a holiday for a specific center and product
const response = await fetch('/holidays/check/center123/product789/2024-02-04');
const result = await response.json();
// Returns: { isHoliday: true, holiday: {...} }
```

### 3. Interest Calculation with Product-Based Holidays
```javascript
// Calculate interest for a loan (automatically uses product-based holidays)
const calculationData = {
  loanId: "loan123",
  startDate: "2024-01-01",
  endDate: "2024-01-31"
};

const response = await fetch('/interest/calculate', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(calculationData)
});

const result = await response.json();
// Returns: {
//   loanId: "loan123",
//   startDate: "2024-01-01",
//   endDate: "2024-01-31",
//   totalDays: 31,
//   workingDays: 29,
//   holidayDays: 2,
//   outstandingAmount: 10000,
//   interestRate: 12,
//   interestAmount: 95.34,
//   productId: "product789",
//   centerId: "center123"
// }
```

## Frontend Integration

### 1. Holiday Screen Features
- **Product Selection**: Choose from available loan products
- **Center Selection**: Choose from available centers
- **Filtering**: Filter holidays by center and/or product
- **Add Holiday**: Create holidays for specific products
- **View Details**: See holiday details including product information

### 2. Sample Frontend Code
```javascript
// Load products for holiday creation
const loadProducts = async () => {
  try {
    const response = await fetch('/products');
    const products = await response.json();
    setProducts(products);
  } catch (error) {
    console.error('Error loading products:', error);
  }
};

// Create holiday with product
const createHoliday = async (holidayData) => {
  const response = await fetch('/holidays', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'user-id': currentUserId
    },
    body: JSON.stringify({
      ...holidayData,
      productId: selectedProductId
    })
  });
  return response.json();
};
```

## Business Logic

### 1. Interest Calculation Process
1. **Get Loan Details**: Fetch loan with center and product information
2. **Check Holidays**: For each day in the calculation period, check if it's a holiday for the loan's product type
3. **Skip Holiday Days**: Exclude holiday days from interest calculation
4. **Calculate Interest**: Apply interest only to working days

### 2. Holiday Validation
- Holidays are validated against center, product, and date
- Duplicate holidays for the same center, product, and date are prevented
- Only active holidays are considered in calculations

## Benefits

1. **Product-Specific Control**: Different loan products can have different holiday schedules
2. **Accurate Interest Calculation**: Interest is calculated only on working days for each product type
3. **Flexible Management**: Admins can set holidays per product, center, and date
4. **Scalable System**: Easy to add new products and manage their holidays

## Migration Notes

### For Existing Data
- Existing holidays without `productId` will need to be updated
- Consider creating a migration script to assign default products to existing holidays
- Test interest calculations with existing loans

### For New Implementation
- Ensure all new holidays include `productId`
- Update frontend to include product selection
- Test holiday creation and interest calculation flows 